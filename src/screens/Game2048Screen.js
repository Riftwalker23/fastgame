// 2048 — slide & merge tiles. Solo with best-score tracking.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import GameTopBar, { DPad } from '../components/GameTopBar';
import { useKeyDirections, useSwipe } from '../hooks/useControls';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const SIZE = 4;
const TILE_COLORS = {
  2: ['#3A3631', '#EDEDED'],
  4: ['#9A8166', '#EDEDED'],
  8: ['#D9822B', '#FFF'],
  16: ['#C26A28', '#FFF'],
  32: ['#C8553D', '#FFF'],
  64: ['#B2462F', '#FFF'],
  128: ['#C9A23A', '#000'],
  256: ['#D9B54A', '#000'],
  512: ['#8FA84A', '#000'],
  1024: ['#6BA35A', '#000'],
  2048: ['#E0A240', '#000'],
};

function addRandom(board) {
  const empty = board.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (!empty.length) return board;
  const next = [...board];
  next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function newBoard() {
  return addRandom(addRandom(Array(SIZE * SIZE).fill(0)));
}

// Indices of line i, ordered in the direction tiles slide towards.
function lineIndices(dir, i) {
  const out = [];
  for (let k = 0; k < SIZE; k++) {
    if (dir === 'left') out.push(i * SIZE + k);
    if (dir === 'right') out.push(i * SIZE + (SIZE - 1 - k));
    if (dir === 'up') out.push(k * SIZE + i);
    if (dir === 'down') out.push((SIZE - 1 - k) * SIZE + i);
  }
  return out;
}

function slide(board, dir) {
  const next = [...board];
  let gained = 0;
  let moved = false;
  for (let i = 0; i < SIZE; i++) {
    const idx = lineIndices(dir, i);
    const vals = idx.map((j) => board[j]).filter((v) => v !== 0);
    const merged = [];
    for (let k = 0; k < vals.length; k++) {
      if (vals[k] === vals[k + 1]) {
        merged.push(vals[k] * 2);
        gained += vals[k] * 2;
        k++;
      } else {
        merged.push(vals[k]);
      }
    }
    while (merged.length < SIZE) merged.push(0);
    idx.forEach((j, k) => {
      if (next[j] !== merged[k]) moved = true;
      next[j] = merged[k];
    });
  }
  return { board: next, gained, moved };
}

function canMove(board) {
  return ['left', 'right', 'up', 'down'].some((d) => slide(board, d).moved);
}

export default function Game2048Screen({ onExit }) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 32, 400);
  const tile = (boardSize - 10 * (SIZE + 1)) / SIZE;

  const [board, setBoard] = useState(newBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);

  useEffect(() => {
    StorageService.getBestScore('game2048').then((b) => setBest(b || 0));
  }, []);

  const onDirection = useCallback(
    (dir) => {
      if (over || (won && !keepGoing)) return;
      const res = slide(board, dir);
      if (!res.moved) return;
      const next = addRandom(res.board);
      const newScore = score + res.gained;
      setBoard(next);
      setScore(newScore);
      if (res.gained) soundService.playMove();
      if (newScore > best) {
        setBest(newScore);
        StorageService.submitScore('game2048', newScore);
      }
      if (!won && next.includes(2048)) {
        setWon(true);
        soundService.playVictory();
      }
      if (!canMove(next)) {
        setOver(true);
        soundService.playCapture();
      }
    },
    [board, score, best, over, won, keepGoing]
  );

  useKeyDirections(onDirection);
  const swipe = useSwipe(onDirection);

  const restart = () => {
    setBoard(newBoard());
    setScore(0);
    setOver(false);
    setWon(false);
    setKeepGoing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar
        title="🔢 2048"
        color="#C9A23A"
        onBack={onExit}
        right={
          <TouchableOpacity onPress={restart}>
            <Ionicons name="refresh" size={22} color={COLORS.text} />
          </TouchableOpacity>
        }
      />
      <View style={styles.content}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{score}</Text>
            <Text style={styles.scoreLabel}>SCORE</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreVal, { color: COLORS.accent }]}>{best}</Text>
            <Text style={styles.scoreLabel}>BEST</Text>
          </View>
        </View>

        <View {...swipe} style={[styles.board, { width: boardSize, height: boardSize }]}>
          {board.map((v, i) => {
            const [bg, fg] = TILE_COLORS[v] || ['#5B8BA8', '#000'];
            return (
              <View
                key={i}
                style={[
                  styles.tile,
                  { width: tile, height: tile, backgroundColor: v ? bg : '#262626' },
                ]}
              >
                {v ? (
                  <Text style={[styles.tileText, { color: fg, fontSize: v >= 1024 ? tile * 0.28 : tile * 0.36 }]}>
                    {v}
                  </Text>
                ) : null}
              </View>
            );
          })}

          {(over || (won && !keepGoing)) && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>{over ? 'No more moves!' : '🎉 2048!'}</Text>
              <Text style={styles.overlaySub}>Score: {score}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {!over && (
                  <TouchableOpacity style={styles.ghostBtn} onPress={() => setKeepGoing(true)}>
                    <Text style={styles.ghostText}>Keep going</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.btn} onPress={restart}>
                  <Text style={styles.btnText}>New Game</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.hint}>Swipe the board, use the arrows or your keyboard.</Text>
        <DPad onDirection={onDirection} color="#C9A23A" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', padding: 16, gap: 14 },
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreBox: {
    minWidth: 96,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
  },
  scoreVal: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  scoreLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  tile: { margin: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontWeight: '900' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  overlayTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900' },
  overlaySub: { color: COLORS.textLight, fontSize: 14 },
  btn: { backgroundColor: '#C9A23A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: '900' },
  ghostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ghostText: { color: COLORS.text, fontWeight: '800' },
  hint: { color: COLORS.textMuted, fontSize: 12 },
});
