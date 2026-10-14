// Room & Matchmaking Manager for FastGame

const { LudoGame } = require('./ludoServerLogic');
const { ChessGame } = require('./chessServerLogic');
const friendManager = require('./friendManager');

function generateRoomCode(prefix = 'GAME') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
    this.userToRoom = new Map(); // userId -> roomId

    // Matchmaking queues: array of { player, socketId }
    this.matchQueues = {
      ludo2: [],
      ludo4: [],
      chess: [],
    };

    // Pending friend challenges: challengeId -> Challenge Object
    this.challenges = new Map();
  }

  createRoom({ hostUser, gameType, maxPlayers = 2, timeControlMinutes = 10, isPrivate = true }) {
    const prefix = gameType === 'chess' ? 'CHESS' : 'LUDO';
    const roomId = generateRoomCode(prefix);

    const room = {
      id: roomId,
      hostId: hostUser.id,
      gameType, // 'ludo' or 'chess'
      maxPlayers: gameType === 'chess' ? 2 : maxPlayers,
      timeControlMinutes,
      isPrivate,
      players: [hostUser],
      spectators: [],
      game: null,
      status: 'waiting', // 'waiting', 'playing', 'finished'
      createdAt: Date.now(),
      messages: [],
    };

    this.rooms.set(roomId, room);
    this.userToRoom.set(hostUser.id, roomId);

    return room;
  }

  joinRoom(roomId, user) {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) {
      return { success: false, message: 'Room not found. Check the code.' };
    }

    if (room.status === 'playing') {
      // Reconnection or spectator
      const existingPlayer = room.players.find((p) => p.id === user.id);
      if (existingPlayer) {
        this.userToRoom.set(user.id, room.id);
        return { success: true, room, isReconnect: true };
      }
      return { success: false, message: 'Game already in progress in this room.' };
    }

    const alreadyIn = room.players.some((p) => p.id === user.id);
    if (!alreadyIn) {
      if (room.players.length >= room.maxPlayers) {
        return { success: false, message: 'Room is already full.' };
      }
      room.players.push(user);
    }

    this.userToRoom.set(user.id, room.id);
    return { success: true, room };
  }

  leaveRoom(userId) {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) {
      this.userToRoom.delete(userId);
      return null;
    }

    room.players = room.players.filter((p) => p.id !== userId);
    this.userToRoom.delete(userId);

    // If host left and there are other players, reassign host
    if (room.hostId === userId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { roomId, closed: true };
    }

    return { roomId, room, closed: false };
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, message: 'Room not found' };

    if (room.players.length < 2) {
      return { success: false, message: 'Need at least 2 players to start' };
    }

    if (room.gameType === 'chess') {
      const whitePlayer = room.players[0];
      const blackPlayer = room.players[1];
      room.game = new ChessGame(roomId, whitePlayer, blackPlayer, {
        timeControlMinutes: room.timeControlMinutes,
      });
    } else if (room.gameType === 'ludo') {
      room.game = new LudoGame(roomId, room.players, {});
    }

    room.status = 'playing';
    return { success: true, room, gameState: room.game.getState() };
  }

  // Add AI Bot to room (for quick solo/practice or filling slot)
  addBot(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, message: 'Room not found' };

    if (room.players.length >= room.maxPlayers) {
      return { success: false, message: 'Room is full' };
    }

    const botIndex = room.players.length;
    const botNames = ['CyberBot', 'AlphaMind', 'NeonStrike', 'PixelGrandmaster'];
    const botAvatars = ['🤖', '👾', '🚀', '🧠'];

    const bot = {
      id: `bot_${Date.now()}_${botIndex}`,
      username: botNames[botIndex % botNames.length],
      avatar: botAvatars[botIndex % botAvatars.length],
      isBot: true,
      stats: { chessWins: 10, ludoWins: 10 },
    };

    room.players.push(bot);
    return { success: true, room, bot };
  }

  // Quick Matchmaking
  queueMatchmaking(player, gameType, maxPlayers = 2) {
    const queueKey = gameType === 'chess' ? 'chess' : maxPlayers === 4 ? 'ludo4' : 'ludo2';
    const queue = this.matchQueues[queueKey];

    // Check if player already in queue
    if (queue.some((p) => p.player.id === player.id)) {
      return { status: 'waiting' };
    }

    queue.push(player);

    const needed = gameType === 'chess' ? 2 : maxPlayers;
    if (queue.length >= needed) {
      // Create matched room!
      const matchedPlayers = queue.splice(0, needed);
      const room = this.createRoom({
        hostUser: matchedPlayers[0],
        gameType,
        maxPlayers: needed,
        isPrivate: false,
      });

      for (let i = 1; i < matchedPlayers.length; i++) {
        this.joinRoom(room.id, matchedPlayers[i]);
      }

      const startResult = this.startGame(room.id);
      return {
        status: 'matched',
        roomId: room.id,
        room,
        gameState: startResult.gameState,
        matchedPlayers,
      };
    }

    return { status: 'waiting', queueSize: queue.length };
  }

  leaveQueue(userId) {
    for (const key of Object.keys(this.matchQueues)) {
      this.matchQueues[key] = this.matchQueues[key].filter((p) => p.id !== userId);
    }
  }

  // Friend Challenge / Invite
  createChallenge(fromUser, toUserId, gameType) {
    const challengeId = `chal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const challenge = {
      id: challengeId,
      fromUser,
      toUserId,
      gameType,
      createdAt: Date.now(),
      status: 'pending', // 'pending', 'accepted', 'declined'
    };

    this.challenges.set(challengeId, challenge);
    return challenge;
  }

  respondChallenge(challengeId, accept) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return { success: false, message: 'Challenge expired or not found' };

    challenge.status = accept ? 'accepted' : 'declined';
    this.challenges.delete(challengeId);

    if (accept) {
      const toUser = friendManager.getUser(challenge.toUserId);
      const fromUser = challenge.fromUser;

      // Create a private room for both players
      const room = this.createRoom({
        hostUser: fromUser,
        gameType: challenge.gameType,
        maxPlayers: 2,
        isPrivate: true,
      });

      if (toUser) {
        this.joinRoom(room.id, toUser);
      }

      const startResult = this.startGame(room.id);
      return {
        success: true,
        accepted: true,
        room,
        gameState: startResult.gameState,
        fromUser,
        toUser,
      };
    }

    return { success: true, accepted: false, challenge };
  }

  addMessage(roomId, user, text) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      text: text.slice(0, 150),
      timestamp: Date.now(),
    };

    room.messages.push(message);
    if (room.messages.length > 50) {
      room.messages.shift();
    }

    return message;
  }
}

module.exports = RoomManager;
