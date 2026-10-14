// FastGame Multiplayer Backend Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const friendManager = require('./friendManager');
const RoomManager = require('./roomManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);

// REST Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    onlineUsers: friendManager.users.size,
    activeRooms: roomManager.rooms.size,
    uptime: process.uptime(),
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json({
    leaderboard: friendManager.getLeaderboard(),
  });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(roomManager.rooms.values())
    .filter((r) => !r.isPrivate && r.status === 'waiting')
    .map((r) => ({
      id: r.id,
      gameType: r.gameType,
      playersCount: r.players.length,
      maxPlayers: r.maxPlayers,
      hostName: r.players[0]?.username,
    }));
  res.json({ rooms: publicRooms });
});

// Helper to trigger bot actions
function handleBotTurnsIfNeeded(room) {
  if (!room || !room.game || room.status !== 'playing') return;

  if (room.gameType === 'ludo') {
    const ludo = room.game;
    const currentPlayer = ludo.getCurrentPlayer();
    if (currentPlayer && currentPlayer.isBot && ludo.gameStatus === 'in_progress') {
      setTimeout(() => {
        if (room.status !== 'playing') return;

        // Step 1: Bot rolls dice
        if (!ludo.diceRolled) {
          const rollRes = ludo.rollDice(currentPlayer.id);
          io.to(room.id).emit('ludo:update', rollRes.state);

          if (rollRes.turnPassed) {
            handleBotTurnsIfNeeded(room);
            return;
          }

          // Step 2: Bot picks best move after a brief thinking pause
          setTimeout(() => {
            if (room.status !== 'playing') return;
            const botMove = ludo.getBotMove();
            if (botMove) {
              const moveRes = ludo.moveToken(currentPlayer.id, botMove.tokenIndex);
              io.to(room.id).emit('ludo:update', moveRes.state);

              if (moveRes.finished) {
                room.status = 'finished';
                friendManager.recordMatchResult('ludo', ludo.winner?.id, null);
                io.to(room.id).emit('room:finished', { winner: ludo.winner, gameType: 'ludo' });
              } else {
                handleBotTurnsIfNeeded(room);
              }
            }
          }, 800);
        }
      }, 700);
    }
  } else if (room.gameType === 'chess') {
    const chess = room.game;
    const currentPlayer = chess.getCurrentPlayer();
    if (currentPlayer && currentPlayer.isBot && chess.gameStatus === 'in_progress') {
      setTimeout(() => {
        if (room.status !== 'playing') return;
        const botMove = chess.getBotMove('medium');
        if (botMove) {
          const moveRes = chess.makeMove(currentPlayer.id, {
            from: botMove.from,
            to: botMove.to,
            promotion: botMove.promotion || 'q',
          });
          if (moveRes.success) {
            io.to(room.id).emit('chess:update', moveRes.state);
            if (moveRes.isGameOver) {
              room.status = 'finished';
              friendManager.recordMatchResult(
                'chess',
                chess.winner?.id,
                chess.winner?.id === chess.whitePlayer.id ? chess.blackPlayer.id : chess.whitePlayer.id,
                chess.gameStatus === 'draw' || chess.gameStatus === 'stalemate'
              );
              io.to(room.id).emit('room:finished', {
                winner: chess.winner,
                reason: chess.winReason,
                gameType: 'chess',
              });
            }
          }
        }
      }, 900);
    }
  }
}

// Socket.IO Handlers
io.on('connection', (socket) => {
  console.log(`[Socket Connected] id=${socket.id}`);

  // User registration / login
  socket.on('user:login', ({ userId, username, avatar }) => {
    const user = friendManager.registerUser(socket.id, { userId, username, avatar });
    console.log(`[User Login] username=${user.username} userId=${user.id}`);
    socket.emit('user:logged_in', user);

    // Notify friends that user is online
    const { friends } = friendManager.getFriendsList(user.id);
    friends.forEach((f) => {
      const friendObj = friendManager.getUser(f.id);
      if (friendObj && friendObj.socketId) {
        io.to(friendObj.socketId).emit('friend:status_changed', {
          userId: user.id,
          online: true,
        });
      }
    });

    // Send initial friends list
    socket.emit('friend:list_update', friendManager.getFriendsList(user.id));
  });

  // Search users to add
  socket.on('friend:search', ({ query, userId }) => {
    const results = friendManager.searchUsers(query, userId);
    socket.emit('friend:search_results', results);
  });

  // Send friend request
  socket.on('friend:request', ({ fromUserId, targetQuery }) => {
    const result = friendManager.sendFriendRequest(fromUserId, targetQuery);
    if (!result.success) {
      socket.emit('friend:error', { message: result.message });
      return;
    }

    if (result.accepted) {
      // Direct accept because both requested
      socket.emit('friend:request_accepted', { friend: result.friend });
      if (result.friend.socketId) {
        io.to(result.friend.socketId).emit('friend:request_accepted', { friend: result.user });
      }
    } else {
      socket.emit('friend:request_sent', { message: `Request sent to ${result.targetUser.username}!` });
      if (result.targetUser.socketId) {
        io.to(result.targetUser.socketId).emit('friend:incoming_request', {
          fromUser: result.fromUser,
        });
      }
    }
  });

  // Respond to friend request (accept / decline)
  socket.on('friend:respond', ({ userId, fromUserId, accept }) => {
    const result = friendManager.respondFriendRequest(userId, fromUserId, accept);
    if (result.success) {
      socket.emit('friend:list_update', friendManager.getFriendsList(userId));
      if (result.accepted && result.friend && result.friend.socketId) {
        io.to(result.friend.socketId).emit('friend:list_update', friendManager.getFriendsList(result.friend.id));
        io.to(result.friend.socketId).emit('friend:request_accepted', { friend: result.user });
      }
    }
  });

  // Remove friend
  socket.on('friend:remove', ({ userId, friendId }) => {
    const result = friendManager.removeFriend(userId, friendId);
    socket.emit('friend:list_update', friendManager.getFriendsList(userId));
    if (result.friendSocketId) {
      io.to(result.friendSocketId).emit('friend:list_update', friendManager.getFriendsList(friendId));
    }
  });

  // Get friends list
  socket.on('friend:get_list', ({ userId }) => {
    socket.emit('friend:list_update', friendManager.getFriendsList(userId));
  });

  // Direct Challenge to Friend
  socket.on('challenge:send', ({ fromUser, toUserId, gameType }) => {
    const targetUser = friendManager.getUser(toUserId);
    if (!targetUser || !targetUser.online || !targetUser.socketId) {
      socket.emit('challenge:error', { message: 'Friend is currently offline or unavailable.' });
      return;
    }

    const challenge = roomManager.createChallenge(fromUser, toUserId, gameType);
    io.to(targetUser.socketId).emit('challenge:received', challenge);
    socket.emit('challenge:sent', { message: `Challenge sent to ${targetUser.username}!` });
  });

  socket.on('challenge:respond', ({ challengeId, accept }) => {
    const result = roomManager.respondChallenge(challengeId, accept);
    if (!result.success) {
      socket.emit('challenge:error', { message: result.message });
      return;
    }

    if (result.accepted) {
      // Connect both sockets to room
      const { room, gameState, fromUser, toUser } = result;
      const fromObj = friendManager.getUser(fromUser.id);
      const toObj = friendManager.getUser(toUser.id);

      if (fromObj && fromObj.socketId) {
        io.sockets.sockets.get(fromObj.socketId)?.join(room.id);
        io.to(fromObj.socketId).emit('challenge:matched', { room, gameState });
      }
      if (toObj && toObj.socketId) {
        io.sockets.sockets.get(toObj.socketId)?.join(room.id);
        io.to(toObj.socketId).emit('challenge:matched', { room, gameState });
      }
    } else {
      const fromObj = friendManager.getUser(result.challenge.fromUser.id);
      if (fromObj && fromObj.socketId) {
        io.to(fromObj.socketId).emit('challenge:declined', {
          message: 'Friend declined the challenge.',
        });
      }
    }
  });

  // Room Management
  socket.on('room:create', ({ hostUser, gameType, maxPlayers, isPrivate }) => {
    const room = roomManager.createRoom({ hostUser, gameType, maxPlayers, isPrivate });
    socket.join(room.id);
    socket.emit('room:created', { room });
  });

  socket.on('room:join', ({ roomId, user }) => {
    const result = roomManager.joinRoom(roomId, user);
    if (!result.success) {
      socket.emit('room:error', { message: result.message });
      return;
    }

    socket.join(result.room.id);
    io.to(result.room.id).emit('room:updated', { room: result.room });
    socket.emit('room:joined', { room: result.room });

    if (result.isReconnect && result.room.game) {
      const eventName = result.room.gameType === 'chess' ? 'chess:update' : 'ludo:update';
      socket.emit(eventName, result.room.game.getState());
    }
  });

  socket.on('room:add_bot', ({ roomId }) => {
    const result = roomManager.addBot(roomId);
    if (result.success) {
      io.to(roomId).emit('room:updated', { room: result.room });
    } else {
      socket.emit('room:error', { message: result.message });
    }
  });

  socket.on('room:start', ({ roomId }) => {
    const result = roomManager.startGame(roomId);
    if (!result.success) {
      socket.emit('room:error', { message: result.message });
      return;
    }

    const eventName = result.room.gameType === 'chess' ? 'chess:start' : 'ludo:start';
    io.to(roomId).emit(eventName, result.gameState);
    io.to(roomId).emit('room:updated', { room: result.room });

    handleBotTurnsIfNeeded(result.room);
  });

  socket.on('room:leave', ({ userId }) => {
    const res = roomManager.leaveRoom(userId);
    if (res && !res.closed) {
      socket.leave(res.roomId);
      io.to(res.roomId).emit('room:updated', { room: res.room });
    }
  });

  // Quick Matchmaking
  socket.on('matchmaking:queue', ({ player, gameType, maxPlayers }) => {
    const result = roomManager.queueMatchmaking(player, gameType, maxPlayers);
    if (result.status === 'matched') {
      result.matchedPlayers.forEach((p) => {
        const u = friendManager.getUser(p.id);
        if (u && u.socketId) {
          io.sockets.sockets.get(u.socketId)?.join(result.roomId);
          io.to(u.socketId).emit('matchmaking:found', {
            room: result.room,
            gameState: result.gameState,
          });
        }
      });
      handleBotTurnsIfNeeded(result.room);
    } else {
      socket.emit('matchmaking:waiting', { queueSize: result.queueSize });
    }
  });

  socket.on('matchmaking:leave', ({ userId }) => {
    roomManager.leaveQueue(userId);
    socket.emit('matchmaking:cancelled');
  });

  // In-game Chat & Emotes
  socket.on('room:chat', ({ roomId, user, text }) => {
    const message = roomManager.addMessage(roomId, user, text);
    if (message) {
      io.to(roomId).emit('room:new_message', message);
    }
  });

  // LUDO Gameplay Events
  socket.on('ludo:roll_dice', ({ roomId, playerId }) => {
    const room = roomManager.rooms.get(roomId);
    if (!room || !room.game || room.gameType !== 'ludo') return;

    const res = room.game.rollDice(playerId);
    if (!res.success) {
      socket.emit('game:error', { message: res.message });
      return;
    }

    io.to(roomId).emit('ludo:update', res.state);
    handleBotTurnsIfNeeded(room);
  });

  socket.on('ludo:move_token', ({ roomId, playerId, tokenIndex }) => {
    const room = roomManager.rooms.get(roomId);
    if (!room || !room.game || room.gameType !== 'ludo') return;

    const res = room.game.moveToken(playerId, tokenIndex);
    if (!res.success) {
      socket.emit('game:error', { message: res.message });
      return;
    }

    io.to(roomId).emit('ludo:update', res.state);

    if (res.finished) {
      room.status = 'finished';
      friendManager.recordMatchResult('ludo', room.game.winner?.id, null);
      io.to(roomId).emit('room:finished', { winner: room.game.winner, gameType: 'ludo' });
    } else {
      handleBotTurnsIfNeeded(room);
    }
  });

  // CHESS Gameplay Events
  socket.on('chess:move', ({ roomId, playerId, move }) => {
    const room = roomManager.rooms.get(roomId);
    if (!room || !room.game || room.gameType !== 'chess') return;

    const res = room.game.makeMove(playerId, move);
    if (!res.success) {
      socket.emit('game:error', { message: res.message });
      return;
    }

    io.to(roomId).emit('chess:update', res.state);

    if (res.isGameOver) {
      room.status = 'finished';
      friendManager.recordMatchResult(
        'chess',
        room.game.winner?.id,
        room.game.winner?.id === room.game.whitePlayer.id
          ? room.game.blackPlayer.id
          : room.game.whitePlayer.id,
        room.game.gameStatus === 'draw' || room.game.gameStatus === 'stalemate'
      );
      io.to(roomId).emit('room:finished', {
        winner: room.game.winner,
        reason: room.game.winReason,
        gameType: 'chess',
      });
    } else {
      handleBotTurnsIfNeeded(room);
    }
  });

  socket.on('chess:resign', ({ roomId, playerId }) => {
    const room = roomManager.rooms.get(roomId);
    if (!room || !room.game || room.gameType !== 'chess') return;

    const res = room.game.resign(playerId);
    if (res.success) {
      room.status = 'finished';
      friendManager.recordMatchResult('chess', room.game.winner?.id, playerId);
      io.to(roomId).emit('chess:update', res.state);
      io.to(roomId).emit('room:finished', {
        winner: room.game.winner,
        reason: room.game.winReason,
        gameType: 'chess',
      });
    }
  });

  socket.on('chess:draw_offer', ({ roomId, playerId }) => {
    const room = roomManager.rooms.get(roomId);
    if (!room || !room.game || room.gameType !== 'chess') return;
    const res = room.game.offerDraw(playerId);
    if (res.success) {
      socket.to(roomId).emit('chess:draw_offered', { offeredBy: playerId });
    }
  });

  socket.on('chess:draw_respond', ({ roomId, playerId, accept }) => {
    const room = roomManager.rooms.get(roomId);
    if (!room || !room.game || room.gameType !== 'chess') return;
    const res = room.game.respondDraw(playerId, accept);
    if (res.success) {
      io.to(roomId).emit('chess:update', res.state);
      if (accept) {
        room.status = 'finished';
        friendManager.recordMatchResult('chess', null, null, true);
        io.to(roomId).emit('room:finished', {
          winner: null,
          reason: 'Draw agreed by both players!',
          gameType: 'chess',
        });
      }
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] id=${socket.id}`);
    const user = friendManager.handleDisconnect(socket.id);
    if (user) {
      const { friends } = friendManager.getFriendsList(user.id);
      friends.forEach((f) => {
        const friendObj = friendManager.getUser(f.id);
        if (friendObj && friendObj.socketId) {
          io.to(friendObj.socketId).emit('friend:status_changed', {
            userId: user.id,
            online: false,
          });
        }
      });
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎮 FastGame Multiplayer Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
