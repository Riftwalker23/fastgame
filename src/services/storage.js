// Storage service for saving user profile, stats, and settings
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: '@fastgame_user_profile',
  APP_SETTINGS: '@fastgame_settings',
  GAME_STATS: '@fastgame_stats',
  BEST_SCORES: '@fastgame_best_scores',
};

const DEFAULT_AVATARS = ['🦁', '🦊', '⚡', '🐉', '🎮', '👑', '🔥', '🚀', '🤖', '🎯', '🦅', '💎'];

function generateRandomName() {
  const adjectives = ['Neon', 'Cyber', 'Shadow', 'Apex', 'Hyper', 'Swift', 'Quantum', 'Vortex', 'Thunder'];
  const nouns = ['Knight', 'Rider', 'Titan', 'Ghost', 'Falcon', 'Striker', 'Blaze', 'Wolf', 'Spark'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}_${num}`;
}

function generateUserId() {
  return 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
}

export const StorageService = {
  async getProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }

    // Default new user profile
    const defaultProfile = {
      id: generateUserId(),
      username: generateRandomName(),
      avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
      createdAt: Date.now(),
      stats: {
        chessWins: 0,
        chessLosses: 0,
        ludoWins: 0,
        ludoGames: 0,
      },
    };

    await this.saveProfile(defaultProfile);
    return defaultProfile;
  },

  async saveProfile(profile) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return profile;
    } catch (e) {
      console.warn('Storage write error:', e);
      return profile;
    }
  },

  async updateStats(gameType, result) {
    try {
      const profile = await this.getProfile();
      if (!profile.stats) {
        profile.stats = { chessWins: 0, chessLosses: 0, ludoWins: 0, ludoGames: 0 };
      }

      if (gameType === 'chess') {
        if (result === 'win') profile.stats.chessWins += 1;
        if (result === 'loss') profile.stats.chessLosses += 1;
      } else if (gameType === 'ludo') {
        profile.stats.ludoGames += 1;
        if (result === 'win') profile.stats.ludoWins += 1;
      } else {
        const games = `${gameType}Games`;
        const wins = `${gameType}Wins`;
        profile.stats[games] = (profile.stats[games] || 0) + 1;
        if (result === 'win') profile.stats[wins] = (profile.stats[wins] || 0) + 1;
      }

      await this.saveProfile(profile);
      return profile;
    } catch (e) {
      console.warn('Error updating stats:', e);
    }
  },

  // High scores for solo games, keyed like 'snake' or 'reaction'.
  async getBestScores() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BEST_SCORES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  async getBestScore(key) {
    const all = await this.getBestScores();
    return all[key] ?? null;
  },

  // Saves `value` if it beats the stored best. Returns true when it's a new record.
  async submitScore(key, value, lowerIsBetter = false) {
    try {
      const all = await this.getBestScores();
      const prev = all[key];
      const better =
        prev === undefined || prev === null || (lowerIsBetter ? value < prev : value > prev);
      if (better) {
        all[key] = value;
        await AsyncStorage.setItem(STORAGE_KEYS.BEST_SCORES, JSON.stringify(all));
      }
      return better;
    } catch (e) {
      return false;
    }
  },

  DEFAULT_AVATARS,
};
