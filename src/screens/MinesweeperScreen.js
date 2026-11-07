// Minesweeper — solo, two difficulty levels, best time per level. First tap is always safe.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import GameTopBar from '../components/GameTopBar';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const COLOR = '#8E8A80';
const LEVELS = {
  Easy: { rows: 9, cols: 9, mines: 10 },
  Hard: { rows: 12, cols: 10, mines: 22 },
};
const NUM_COLORS = ['', '#7FA6C9', '#7DB07F', '#D0735F', '#9C88C6', '#C9925A', '#6FB3B0', '#CFCFCF', '#A6A6A6'];

function emptyBoard({ rows, cols }) {
  return Array.from({ length: rows * cols }, () => ({ mine: false, open: false, flag: false, n: 0 }));
}

function neighbours(i, rows, cols) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
    }
  return out;
}

function placeMines(board, level, safeIdx) {
  const { rows, cols, mines } = level;
  const banned = new Set([safeIdx, ...neighbours(safeIdx, rows, cols)]);
  const cells = board.map((c) => ({ ...c }));
  let placed = 0;
  while (placed < mines) {
    const i = Math.floor(Math.random() * cells.length);
    if (cells[i].mine || banned.has(i)) continue;
    cells[i].mine = true;
    placed++;
  }
  cells.forEach((cell, i) => {
    cell.n = neighbours(i, rows, cols).filter((j) => cells[j].mine).length;
  });
  return cells;
}

function flood(cells, start, rows, cols) {
  const stack = [start];
  while (stack.length) {
    const i = stack.pop();
    const cell = cells[i];
    if (cell.open || cell.flag) continue;
    cell.open = true;
    if (cell.n === 0 && !cell.mine) neighbours(i, rows, cols).forEach((j) => !cells[j].open && stack.push(j));
  }
}

export default function MinesweeperScreen({ onExit }) {
  const { width } = useWindowDimensions();
  const [levelName, setLevelName] = useState('Easy');
  const level = LEVELS[levelName];
  const [board, setBoard] = useState(() => emptyBoard(level));
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('playing'); // playing | won | lost
  const [flagMode, setFlagMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(null);
  const [newRecord, setNewRecord] = useState(false);
  const timer = useRef(null);

  const cell = Math.floor(Math.min(width - 40, 440) / level.cols);
  const flags = board.filter((c) => c.flag).length;

  useEffect(() => {
    StorageService.getBestScore(`minesweeper${levelName}`).then(setBest);
  }, [levelName]);

  useEffect(() => {
    if (started && status === 'playing') {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer.current);
  }, [started, status]);

  const reset = (name = levelName) => {
    setLevelName(name);
    setBoard(emptyBoard(LEVELS[name]));
    setStarted(false);
    setStatus('playing');
    setSeconds(0);
    setNewRecord(false);
  };

  const toggleFlag = (i) => {
    if (status !== 'playing' || board[i].open) return;
    const next = board.map((c) => ({ ...c }));
    next[i].flag = !next[i].flag;
    setBoard(next);
  };

  const reveal = (i) => {
    if (status !== 'playing') return;
    if (flagMode) return toggleFlag(i);
    if (board[i].flag || board[i].open) return undefined;

    let cells = board;
    if (!started) {
      cells = placeMines(board, level, i);
      setStarted(true);
    } else {
      cells = board.map((c) => ({ ...c }));
    }

    if (cells[i].mine) {
      cells.forEach((c) => {
        if (c.mine) c.open = true;
      });
      cells[i].boom = true;
      setBoard(cells);
      setStatus('lost');
      soundService.playCapture();
      StorageService.updateStats('minesweeper', 'loss');
      return undefined;
    }

    flood(cells, i, level.rows, level.cols);
    setBoard(cells);
    soundService.playMove();

    const safeLeft = cells.filter((c) => !c.mine && !c.open).length;
    if (safeLeft === 0) {
      setStatus('won');
      soundService.playVictory();
      StorageService.updateStats('minesweeper', 'win');
      StorageService.submitScore(`minesweeper${levelName}`, seconds, true).then((rec) => {
        if (rec) {
          setNewRecord(true);
          setBest(seconds);
        }
      });
    }
    return undefined;
  };

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar
        title="💣 MINESWEEPER"
        color={COLOR}
        onBack={onExit}
        right={
          <TouchableOpacity onPress={() => reset()}>
            <Ionicons name="refresh" size={22} color={COLORS.text} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.levelRow}>
          {Object.keys(LEVELS).map((name) => (
            <TouchableOpacity
              key={name}
              onPress={() => reset(name)}
              style={[styles.levelBtn, levelName === name && styles.levelActive]}
            >
              <Text style={[styles.levelText, levelName === name && { color: '#111' }]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statRow}>
          <Text style={styles.stat}>💣 {level.mines - flags}</Text>
          <Text style={styles.stat}>⏱ {seconds}s</Text>
          <Text style={styles.stat}>🏆 {best != null ? `${best}s` : '—'}</Text>
        </View>

        <View style={[styles.board, { width: cell * level.cols + 4 }]}>
          {board.map((c, i) => {
            let content = null;
            if (c.open && c.mine) content = <Text style={{ fontSize: cell * 0.5 }}>💣</Text>;
            else if (c.open && c.n > 0)
              content = (
                <Text style={[styles.num, { color: NUM_COLORS[c.n], fontSize: cell * 0.5 }]}>{c.n}</Text>
              );
            else if (c.flag) content = <Text style={{ fontSize: cell * 0.45 }}>🚩</Text>;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => reveal(i)}
                onLongPress={() => toggleFlag(i)}
                delayLongPress={300}
                style={[
                  styles.cell,
                  { width: cell, height: cell },
                  c.open ? styles.cellOpen : styles.cellClosed,
                  c.boom && { backgroundColor: COLORS.danger },
                ]}
              >
                {content}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.flagBtn, flagMode && styles.flagBtnOn]}
          onPress={() => setFlagMode(!flagMode)}
        >
          <Text style={[styles.flagText, flagMode && { color: '#111' }]}>
            🚩 Flag mode: {flagMode ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Tip: long-press a square to flag it.</Text>

        {status !== 'playing' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>
              {status === 'won' ? `Cleared in ${seconds}s! 🎉` : 'Boom! 💥 You hit a mine.'}
            </Text>
            {newRecord && <Text style={styles.record}>New best time for {levelName}!</Text>}
            <TouchableOpacity style={styles.btn} onPress={() => reset()}>
              <Text style={styles.btnText}>Play again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12, alignItems: 'center', paddingBottom: 40 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  levelActive: { backgroundColor: COLOR, borderColor: COLOR },
  levelText: { color: COLORS.text, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 18 },
  stat: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: COLORS.background },
  cellClosed: { backgroundColor: '#4A4740' },
  cellOpen: { backgroundColor: COLORS.card },
  num: { fontWeight: '800' },
  flagBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  flagBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  flagText: { color: COLORS.text, fontWeight: '700' },
  hint: { color: COLORS.textMuted, fontSize: 12 },
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  panelTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  record: { color: COLORS.accent, fontWeight: '700' },
  btn: { backgroundColor: COLOR, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#111', fontWeight: '800' },
});
