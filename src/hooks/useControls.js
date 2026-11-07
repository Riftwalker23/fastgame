// Shared input helpers for arcade games: swipe gestures + web keyboard arrows/WASD.
import { useEffect, useRef } from 'react';
import { PanResponder, Platform } from 'react-native';

const KEY_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

export function useKeyDirections(onDirection, enabled = true) {
  const cb = useRef(onDirection);
  cb.current = onDirection;

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const handler = (e) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        cb.current(dir);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}

export function useSwipe(onDirection, minDistance = 20) {
  const cb = useRef(onDirection);
  cb.current = onDirection;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > minDistance || Math.abs(g.dy) > minDistance,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => {
        const { dx, dy } = g;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return;
        if (Math.abs(dx) > Math.abs(dy)) cb.current(dx > 0 ? 'right' : 'left');
        else cb.current(dy > 0 ? 'down' : 'up');
      },
    })
  ).current;

  return responder.panHandlers;
}
