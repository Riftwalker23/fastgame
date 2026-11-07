// Neon Snake: solo high-score run, or a duel against an AI snake ('bot' mode).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import GameTopBar, { DPad } from '../components/GameTopBar';
import { useKeyDirections, useSwipe } from '../hooks/useControls';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const GRID = 18;
const WIN_SCORE = 15;
const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const PLAYER_COLOR = '#6BA35A';
const AI_COLOR = '#B8637F';

const key = (x, y) => `${x},${y}`;
const inBounds = (x, y) => x >= 0 && y >= 0 && x < GRID && y < GRID;

function occupiedSet(snakes) {
  const set = new Set();
  snakes.forEach((s) => {
    if (!s.alive) return;
    // Tail moves away next tick, so it's not an obstacle.
    s.body.slice(0, -1).forEach((p) => set.add(key(p.x, p.y)));
  });
  return set;
}

function randomFood(snakes) {
  const occ = new Set();
  snakes.forEach((s) => s.body.forEach((p) => occ.add(key(p.x, p.y))));
  const free = [];
  for (let x = 0; x < GRID; x++) for (let y = 0; y < GRID; y++) if (!occ.has(key(x, y))) free.push({ x, y });
  return free[Math.floor(Math.random() * free.length)] || { x: 0, y: 0 };
}

function floodSize(start, blocked) {
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length && seen.size < 120) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of Object.values(VEC)) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (inBounds(nx, ny) && !blocked.has(k) && !seen.has(k)) {
        seen.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return seen.size;
}

function aiDirection(snake, snakes, food) {
  const blocked = occupiedSet(snakes);
  const head = snake.body[0];
  const safe = Object.keys(VEC).filter((d) => {
    if (d === OPPOSITE[snake.dir]) return false;
    const nx = head.x + VEC[d][0];
    const ny = head.y + VEC[d][1];
    return inBounds(nx, ny) && !blocked.has(key(nx, ny));
  });
  if (safe.length === 0) return snake.dir;

  // Occasional mistake so the AI is beatable.
  if (Math.random() < 0.06) return safe[Math.floor(Math.random() * safe.length)];

  // BFS to food.
  const start = key(head.x, head.y);
  const prev = new Map([[start, null]]);
  const queue = [head];
  let found = false;
  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === food.x && cur.y === food.y) {
      found = true;
      break;
    }
    for (const [d, [dx, dy]] of Object.entries(VEC)) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const k = key(nx, ny);
      if (!inBounds(nx, ny) || blocked.has(k) || prev.has(k)) continue;
      prev.set(k, { from: key(cur.x, cur.y), dir: d });
      queue.push({ x: nx, y: ny });
    }
  }

  if (found) {
    let k = key(food.x, food.y);
    let step = prev.get(k);
    while (step && step.from !== start) {
      k = step.from;
      step = prev.get(k);
    }
    if (step && safe.includes(step.dir)) {
      const nx = head.x + VEC[step.dir][0];
      const ny = head.y + VEC[step.dir][1];
      // Don't take the path if it leads into a tiny pocket.
      if (floodSize({ x: nx, y: ny }, blocked) > snake.body.length) return step.dir;
    }
  }

  // No good path: go where there's the most room.
  return safe
    .map((d) => ({ d, room: floodSize({ x: head.x + VEC[d][0], y: head.y + VEC[d][1] }, blocked) }))
    .sort((a, b) => b.room - a.room)[0].d;
}

function makeSnakes(duel) {
  const mid = Math.floor(GRID / 2);
  const player = {
    body: [
      { x: 4, y: mid },
      { x: 3, y: mid },
      { x: 2, y: mid },
    ],
    dir: 'right',
    queue: [],
    alive: true,
    score: 0,
    isAI: false,
  };
  if (!duel) return [player];
  const ai = {
    body: [
      { x: GRID - 5, y: mid - 3 },
      { x: GRID - 4, y: mid - 3 },
      { x: GRID - 3, y: mid - 3 },
    ],
    dir: 'left',
    queue: [],
    alive: true,
    score: 0,
    isAI: true,
  };
  return [player, ai];
}

export default function SnakeGameScreen({ mode = 'solo', onExit }) {
  const duel = mode === 'bot';
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 32, 420);
  const cell = boardSize / GRID;

  const game = useRef(null);
  const [, setFrame] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | playing | over
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(null);
  const [newRecord, setNewRecord] = useState(false);

  useEffect(() => {
    StorageService.getBestScore(duel ? 'snakeDuelWins' : 'snake').then(setBest);
  }, [duel]);

  const reset = useCallback(() => {
    const snakes = makeSnakes(duel);
    game.current = { snakes, food: randomFood(snakes) };
    setResult(null);
    setNewRecord(false);
    setFrame((f) => f + 1);
  }, [duel]);

  if (!game.current) {
    const snakes = makeSnakes(duel);
    game.current = { snakes, food: randomFood(snakes) };
  }

  const finish = useCallback(
    async (res) => {
      game.current.over = true;
      setPhase('over');
      setResult(res);
      const g = game.current;
      if (duel) {
        if (res.outcome === 'win') {
          soundService.playVictory();
          const wins = (best || 0) + 1;
          await StorageService.submitScore('snakeDuelWins', wins);
          setBest(wins);
        } else {
          soundService.playCapture();
        }
        StorageService.updateStats('snake', res.outcome);
      } else {
        soundService.playCapture();
        const score = g.snakes[0].score;
        const rec = await StorageService.submitScore('snake', score);
        if (rec && score > 0) {
          setNewRecord(true);
          setBest(score);
        }
      }
    },
    [duel, best]
  );

  const step = useCallback(() => {
    const g = game.current;
    if (g.over) return;
    const { snakes } = g;

    // 1. Pick directions.
    snakes.forEach((s) => {
      if (!s.alive) return;
      if (s.isAI) {
        s.dir = aiDirection(s, snakes, g.food);
      } else {
        while (s.queue.length) {
          const d = s.queue.shift();
          if (d !== OPPOSITE[s.dir] && d !== s.dir) {
            s.dir = d;
            break;
          }
        }
      }
    });

    // 2. Compute new heads and collisions.
    const blocked = occupiedSet(snakes);
    const heads = snakes.map((s) => {
      const h = s.body[0];
      return { x: h.x + VEC[s.dir][0], y: h.y + VEC[s.dir][1] };
    });
    snakes.forEach((s, i) => {
      if (!s.alive) return;
      const h = heads[i];
      if (!inBounds(h.x, h.y) || blocked.has(key(h.x, h.y))) s.alive = false;
    });
    if (snakes.length === 2 && snakes[0].alive && snakes[1].alive) {
      if (heads[0].x === heads[1].x && heads[0].y === heads[1].y) {
        snakes[0].alive = false;
        snakes[1].alive = false;
      }
    }

    // 3. Move & eat.
    let ate = false;
    snakes.forEach((s, i) => {
      if (!s.alive) return;
      s.body.unshift(heads[i]);
      if (heads[i].x === g.food.x && heads[i].y === g.food.y) {
        s.score += 1;
        ate = true;
      } else {
        s.body.pop();
      }
    });
    if (ate) {
      g.food = randomFood(snakes);
      soundService.playMove();
    }

    setFrame((f) => f + 1);

    // 4. End conditions.
    const [p, ai] = snakes;
    if (!duel) {
      if (!p.alive) finish({ outcome: 'loss', text: `You scored ${p.score}` });
      return;
    }
    if (!p.alive && !ai.alive) finish({ outcome: 'draw', text: 'Both snakes crashed!' });
    else if (!p.alive) finish({ outcome: 'loss', text: 'You crashed — the AI wins.' });
    else if (!ai.alive) finish({ outcome: 'win', text: 'The AI crashed — you win!' });
    else if (p.score >= WIN_SCORE) finish({ outcome: 'win', text: `First to ${WIN_SCORE}! You win!` });
    else if (ai.score >= WIN_SCORE) finish({ outcome: 'loss', text: `AI reached ${WIN_SCORE} first.` });
  }, [duel, finish]);

  // Game loop — speeds up as the player scores.
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    let timer;
    const loop = () => {
      step();
      const score = game.current.snakes[0].score;
      const delay = Math.max(65, 150 - score * 4);
      timer = setTimeout(loop, delay);
    };
    timer = setTimeout(loop, 150);
    return () => clearTimeout(timer);
  }, [phase, step]);

  const onDirection = useCallback(
    (dir) => {
      if (phase === 'ready') setPhase('playing');
      const p = game.current.snakes[0];
      if (p.queue.length < 3) p.queue.push(dir);
    },
    [phase]
  );

  useKeyDirections(onDirection, phase !== 'over');
  const swipe = useSwipe(onDirection);

  const start = () => {
    reset();
    setPhase('playing');
  };

  const { snakes, food } = game.current;
  const [player, ai] = snakes;

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar title={duel ? '🐍 SNAKE DUEL' : '🐍 NEON SNAKE'} color={PLAYER_COLOR} onBack={onExit} />

      <View style={styles.content}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreVal, { color: PLAYER_COLOR }]}>{player.score}</Text>
            <Text style={styles.scoreLabel}>{duel ? 'YOU' : 'SCORE'}</Text>
          </View>
          {duel ? (
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreVal, { color: AI_COLOR }]}>{ai.score}</Text>
              <Text style={styles.scoreLabel}>AI 🤖</Text>
            </View>
          ) : null}
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreVal, { color: COLORS.accent }]}>{best ?? 0}</Text>
            <Text style={styles.scoreLabel}>{duel ? 'DUEL WINS' : 'BEST'}</Text>
          </View>
        </View>

        <View
          {...swipe}
          style={[styles.board, { width: boardSize, height: boardSize }]}
        >
          <View
            style={[
              styles.food,
              { left: food.x * cell, top: food.y * cell, width: cell, height: cell, borderRadius: cell / 2 },
            ]}
          />
          {snakes.map((s, si) =>
            s.body.map((p, i) => (
              <View
                key={`${si}-${i}`}
                style={{
                  position: 'absolute',
                  left: p.x * cell + 1,
                  top: p.y * cell + 1,
                  width: cell - 2,
                  height: cell - 2,
                  borderRadius: i === 0 ? cell / 2.5 : cell / 4,
                  backgroundColor: s.isAI ? AI_COLOR : PLAYER_COLOR,
                  opacity: s.alive ? (i === 0 ? 1 : 0.85 - Math.min(i, 20) * 0.02) : 0.3,
                }}
              />
            ))
          )}

          {phase !== 'playing' && (
            <View style={styles.overlay}>
              {phase === 'ready' ? (
                <>
                  <Text style={styles.overlayTitle}>{duel ? 'Snake Duel' : 'Neon Snake'}</Text>
                  <Text style={styles.overlaySub}>
                    {duel
                      ? `You're green. First to ${WIN_SCORE} or last alive wins.`
                      : 'Swipe or use arrows to steer.'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.overlayTitle}>
                    {result?.outcome === 'win' ? '🏆 You Win!' : result?.outcome === 'draw' ? '🤝 Draw' : 'Game Over'}
                  </Text>
                  <Text style={styles.overlaySub}>{result?.text}</Text>
                  {newRecord && <Text style={styles.record}>⭐ New high score!</Text>}
                </>
              )}
              <TouchableOpacity style={styles.startBtn} onPress={start}>
                <Ionicons name="play" size={18} color="#000" />
                <Text style={styles.startText}>{phase === 'ready' ? 'Start' : 'Play Again'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <DPad onDirection={onDirection} color={PLAYER_COLOR} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', padding: 16, gap: 14 },
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreBox: {
    minWidth: 84,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scoreVal: { fontSize: 20, fontWeight: '900' },
  scoreLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  board: {
    position: 'relative',
    backgroundColor: '#171A16',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B3B3B',
    overflow: 'hidden',
  },
  food: { position: 'absolute', backgroundColor: '#D9B54A' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  overlayTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900' },
  overlaySub: { color: COLORS.textLight, fontSize: 13, textAlign: 'center' },
  record: { color: COLORS.accent, fontWeight: '900' },
  startBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PLAYER_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startText: { color: '#000', fontWeight: '900', fontSize: 15 },
});
