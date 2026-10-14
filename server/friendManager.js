// Friend & User Presence Manager for FastGame

class FriendManager {
  constructor() {
    // userId -> User Object
    this.users = new Map();
    // socketId -> userId
    this.socketToUser = new Map();
  }

  registerUser(socketId, { userId, username, avatar }) {
    if (!userId) return null;

    let user = this.users.get(userId);
    if (!user) {
      user = {
        id: userId,
        username: username || `Player_${userId.slice(-4)}`,
        avatar: avatar || '🎮',
        socketId: socketId,
        online: true,
        friends: new Set(),
        incomingRequests: new Set(),
        outgoingRequests: new Set(),
        stats: {
          chessWins: 0,
          chessLosses: 0,
          chessDraws: 0,
          ludoWins: 0,
          ludoGames: 0,
        },
      };
      this.users.set(userId, user);
    } else {
      user.socketId = socketId;
      user.online = true;
      if (username) user.username = username;
      if (avatar) user.avatar = avatar;
    }

    this.socketToUser.set(socketId, userId);
    return user;
  }

  handleDisconnect(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (userId) {
      const user = this.users.get(userId);
      if (user && user.socketId === socketId) {
        user.online = false;
        user.socketId = null;
      }
      this.socketToUser.delete(socketId);
      return user;
    }
    return null;
  }

  getUser(userId) {
    return this.users.get(userId) || null;
  }

  getUserBySocket(socketId) {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.users.get(userId) : null;
  }

  searchUsers(query, excludeUserId) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];
    const results = [];
    for (const [id, user] of this.users.entries()) {
      if (id === excludeUserId) continue;
      if (user.username.toLowerCase().includes(q) || id.toLowerCase().includes(q)) {
        results.push({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          online: user.online,
          stats: user.stats,
        });
      }
      if (results.length >= 10) break;
    }
    return results;
  }

  sendFriendRequest(fromUserId, targetQuery) {
    const fromUser = this.users.get(fromUserId);
    if (!fromUser) return { success: false, message: 'User not found' };

    // Search target by ID or exact username
    let target = this.users.get(targetQuery);
    if (!target) {
      for (const u of this.users.values()) {
        if (u.username.toLowerCase() === targetQuery.toLowerCase()) {
          target = u;
          break;
        }
      }
    }

    if (!target) {
      return { success: false, message: 'Player not found with that username or ID' };
    }

    if (target.id === fromUserId) {
      return { success: false, message: 'You cannot add yourself as a friend' };
    }

    if (fromUser.friends.has(target.id)) {
      return { success: false, message: 'Already friends' };
    }

    if (fromUser.outgoingRequests.has(target.id)) {
      return { success: false, message: 'Friend request already sent' };
    }

    // If target already sent a request to fromUser, automatically accept!
    if (fromUser.incomingRequests.has(target.id)) {
      return this.respondFriendRequest(fromUserId, target.id, true);
    }

    fromUser.outgoingRequests.add(target.id);
    target.incomingRequests.add(fromUserId);

    return {
      success: true,
      targetUser: {
        id: target.id,
        username: target.username,
        avatar: target.avatar,
        online: target.online,
        socketId: target.socketId,
      },
      fromUser: {
        id: fromUser.id,
        username: fromUser.username,
        avatar: fromUser.avatar,
      },
    };
  }

  respondFriendRequest(userId, fromUserId, accept) {
    const user = this.users.get(userId);
    const fromUser = this.users.get(fromUserId);

    if (!user || !fromUser) {
      return { success: false, message: 'User not found' };
    }

    user.incomingRequests.delete(fromUserId);
    fromUser.outgoingRequests.delete(userId);

    if (accept) {
      user.friends.add(fromUserId);
      fromUser.friends.add(userId);
      return {
        success: true,
        accepted: true,
        friend: {
          id: fromUser.id,
          username: fromUser.username,
          avatar: fromUser.avatar,
          online: fromUser.online,
          socketId: fromUser.socketId,
        },
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          online: user.online,
          socketId: user.socketId,
        },
      };
    }

    return { success: true, accepted: false, targetSocketId: fromUser.socketId };
  }

  removeFriend(userId, friendId) {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    if (user) user.friends.delete(friendId);
    if (friend) friend.friends.delete(userId);
    return { success: true, friendSocketId: friend ? friend.socketId : null };
  }

  getFriendsList(userId) {
    const user = this.users.get(userId);
    if (!user) return { friends: [], incomingRequests: [] };

    const friends = [];
    for (const friendId of user.friends) {
      const f = this.users.get(friendId);
      if (f) {
        friends.push({
          id: f.id,
          username: f.username,
          avatar: f.avatar,
          online: f.online,
          stats: f.stats,
        });
      }
    }

    const incomingRequests = [];
    for (const reqId of user.incomingRequests) {
      const sender = this.users.get(reqId);
      if (sender) {
        incomingRequests.push({
          id: sender.id,
          username: sender.username,
          avatar: sender.avatar,
        });
      }
    }

    return { friends, incomingRequests };
  }

  recordMatchResult(gameType, winnerId, loserId, isDraw = false) {
    if (winnerId) {
      const winner = this.users.get(winnerId);
      if (winner) {
        if (gameType === 'chess') {
          if (isDraw) winner.stats.chessDraws += 1;
          else winner.stats.chessWins += 1;
        } else if (gameType === 'ludo') {
          winner.stats.ludoWins += 1;
          winner.stats.ludoGames += 1;
        }
      }
    }

    if (loserId) {
      const loser = this.users.get(loserId);
      if (loser) {
        if (gameType === 'chess') {
          if (isDraw) loser.stats.chessDraws += 1;
          else loser.stats.chessLosses += 1;
        } else if (gameType === 'ludo') {
          loser.stats.ludoGames += 1;
        }
      }
    }
  }

  getLeaderboard() {
    const all = Array.from(this.users.values()).map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      online: u.online,
      chessWins: u.stats.chessWins,
      chessLosses: u.stats.chessLosses,
      ludoWins: u.stats.ludoWins,
      ludoGames: u.stats.ludoGames,
      score: u.stats.chessWins * 20 + u.stats.ludoWins * 15,
    }));

    all.sort((a, b) => b.score - a.score);
    return all.slice(0, 20);
  }
}

module.exports = new FriendManager();
