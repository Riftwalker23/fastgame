// Cross-platform Sound FX using Web Audio API (silent fallback on native if AudioContext unavailable)
import { Platform } from 'react-native';

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.initContext();
  }

  initContext() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
  }

  resumeIfNeeded() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, type, duration, gainStart = 0.15, gainEnd = 0.001) {
    if (this.muted || !this.audioCtx) return;
    try {
      this.resumeIfNeeded();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainStart, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainEnd, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not permitted yet or unsupported
    }
  }

  playDiceRoll() {
    if (this.muted || !this.audioCtx) return;
    // Series of quick clicks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(300 + Math.random() * 400, 'square', 0.05, 0.08);
      }, i * 60);
    }
    setTimeout(() => {
      this.playTone(880, 'sine', 0.18, 0.12);
    }, 320);
  }

  playMove() {
    this.playTone(440, 'triangle', 0.09, 0.12);
  }

  playCapture() {
    if (this.muted || !this.audioCtx) return;
    this.playTone(250, 'sawtooth', 0.15, 0.2);
    setTimeout(() => {
      this.playTone(550, 'sine', 0.25, 0.18);
    }, 100);
  }

  playCheck() {
    if (this.muted || !this.audioCtx) return;
    this.playTone(320, 'sawtooth', 0.2, 0.15);
    setTimeout(() => {
      this.playTone(310, 'sawtooth', 0.25, 0.18);
    }, 120);
  }

  playVictory() {
    if (this.muted || !this.audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.35, 0.2);
      }, idx * 120);
    });
  }

  playNotification() {
    if (this.muted || !this.audioCtx) return;
    this.playTone(600, 'sine', 0.12, 0.1);
    setTimeout(() => {
      this.playTone(900, 'sine', 0.2, 0.12);
    }, 100);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export default new SoundService();
