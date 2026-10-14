// Socket.IO Client Service for FastGame Multiplayer
import { io } from 'socket.io-client';
import { Platform } from 'react-native';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = this.getDefaultServerUrl();
    this.isConnected = false;
    this.currentUser = null;
    this.listeners = new Map();
  }

  getDefaultServerUrl() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hostname = window.location.hostname || 'localhost';
      return `http://${hostname}:4000`;
    }
    // Android Emulator default is 10.0.2.2, iOS simulator is localhost
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }

  setServerUrl(url) {
    this.serverUrl = url;
    if (this.socket) {
      this.disconnect();
      this.connect(this.currentUser);
    }
  }

  connect(userProfile) {
    if (this.socket && this.socket.connected) {
      if (userProfile) {
        this.currentUser = userProfile;
        this.socket.emit('user:login', {
          userId: userProfile.id,
          username: userProfile.username,
          avatar: userProfile.avatar,
        });
      }
      return this.socket;
    }

    this.currentUser = userProfile;

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket Connected] ID:', this.socket.id);
      this.isConnected = true;
      this.emitLocal('connection_status', { connected: true, id: this.socket.id });

      if (this.currentUser) {
        this.socket.emit('user:login', {
          userId: this.currentUser.id,
          username: this.currentUser.username,
          avatar: this.currentUser.avatar,
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket Disconnected]', reason);
      this.isConnected = false;
      this.emitLocal('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[Socket Connect Error]', error.message);
      this.isConnected = false;
      this.emitLocal('connection_status', { connected: false, error: error.message });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Socket communication helpers
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[Socket Emit Failed] Socket not connected for event "${event}"`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Local event emitter for UI state across tabs/components
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emitLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in local listener for ${event}:`, e);
        }
      });
    }
  }
}

export default new SocketService();
