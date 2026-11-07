// Board renderers for the generic turn-based games.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../theme/colors';
import { ROWS, COLS } from '../games/logic/connect4';
import { N } from '../games/logic/dotsboxes';

export const SEAT_COLORS = {
  tictactoe: ['#8C7AB8', '#D9A93A'],
  connect4: ['#C8553D', '#D9B54A'],
  dotsboxes: ['#E0A240', '#B8637F'],
};

export const SEAT_MARKS = {
  tictactoe: ['X', 'O'],
  connect4: ['●', '●'],
  dotsboxes: ['■', '■'],
};

function useBoardSize(max) {
  const { width } = useWindowDimensions();
  return Math.min(width - 40, max);
}

export function TicTacToeBoard({ state, onMove, disabled }) {
  const size = useBoardSize(360);
  const cell = size / 3;
  const [c0, c1] = SEAT_COLORS.tictactoe;
  return (
    <View style={[styles.tttBoard, { width: size, height: size }]}>
      {state.board.map((v, i) => {
        const win = state.winLine?.includes(i);
        return (
          <TouchableOpacity
            key={i}
            disabled={disabled || v !== null}
            onPress={() => onMove({ cell: i })}
            style={[
              styles.tttCell,
              {
                width: cell - 8,
                height: cell - 8,
                borderColor: win ? (v === 0 ? c0 : c1) : COLORS.border,
                backgroundColor: win ? 'rgba(255,255,255,0.08)' : COLORS.card,
              },
            ]}
          >
            {v !== null && (
              <Text style={[styles.tttMark, { fontSize: cell * 0.5, color: v === 0 ? c0 : c1 }]}>
                {SEAT_MARKS.tictactoe[v]}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Connect4Board({ state, onMove, disabled }) {
  const size = useBoardSize(420);
  const cell = size / COLS;
  const colors = SEAT_COLORS.connect4;
  return (
    <View style={[styles.c4Board, { width: size + 12 }]}>
      {Array.from({ length: COLS }).map((_, c) => (
        <TouchableOpacity
          key={c}
          disabled={disabled || state.board[c] !== null}
          onPress={() => onMove({ col: c })}
          activeOpacity={0.7}
        >
          {Array.from({ length: ROWS }).map((__, r) => {
            const idx = r * COLS + c;
            const v = state.board[idx];
            const win = state.winLine?.includes(idx);
            return (
              <View key={r} style={{ width: cell, height: cell, padding: 4 }}>
                <View
                  style={[
                    styles.c4Hole,
                    v !== null && { backgroundColor: colors[v] },
                    win && styles.c4Win,
                    state.lastMove === idx && !win && styles.c4Last,
                  ]}
                />
              </View>
            );
          })}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function DotsBoxesBoard({ state, onMove, disabled }) {
  const size = useBoardSize(340);
  const pad = 14;
  const gap = size / N;
  const dot = 12;
  const touch = 26;
  const colors = SEAT_COLORS.dotsboxes;
  const total = size + pad * 2;

  const lines = [];
  for (let r = 0; r <= N; r++) {
    for (let c = 0; c < N; c++) {
      const owner = state.h[r * N + c];
      lines.push(
        <TouchableOpacity
          key={`h${r}-${c}`}
          disabled={disabled || owner !== null}
          onPress={() => onMove({ type: 'h', r, c })}
          style={{
            position: 'absolute',
            left: pad + c * gap + dot / 2,
            top: pad + r * gap - touch / 2,
            width: gap - dot,
            height: touch,
            justifyContent: 'center',
          }}
        >
          <View
            style={[
              styles.dbLine,
              { height: 6 },
              owner !== null ? { backgroundColor: colors[owner] } : styles.dbLineEmpty,
            ]}
          />
        </TouchableOpacity>
      );
    }
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c <= N; c++) {
      const owner = state.v[r * (N + 1) + c];
      lines.push(
        <TouchableOpacity
          key={`v${r}-${c}`}
          disabled={disabled || owner !== null}
          onPress={() => onMove({ type: 'v', r, c })}
          style={{
            position: 'absolute',
            left: pad + c * gap - touch / 2,
            top: pad + r * gap + dot / 2,
            width: touch,
            height: gap - dot,
            alignItems: 'center',
          }}
        >
          <View
            style={[
              styles.dbLine,
              { width: 6, height: '100%' },
              owner !== null ? { backgroundColor: colors[owner] } : styles.dbLineEmpty,
            ]}
          />
        </TouchableOpacity>
      );
    }
  }

  return (
    <View style={[styles.dbBoard, { width: total, height: total }]}>
      {state.boxes.map((owner, i) => {
        if (owner === null) return null;
        const r = Math.floor(i / N);
        const c = i % N;
        return (
          <View
            key={`b${i}`}
            style={[
              styles.dbBox,
              {
                left: pad + c * gap + 6,
                top: pad + r * gap + 6,
                width: gap - 12,
                height: gap - 12,
                backgroundColor: COLORS.surfaceLight,
                borderColor: colors[owner],
              },
            ]}
          >
            <Text style={[styles.dbBoxText, { color: colors[owner] }]}>{owner === 0 ? 'P1' : 'P2'}</Text>
          </View>
        );
      })}
      {lines}
      {Array.from({ length: (N + 1) * (N + 1) }).map((_, i) => {
        const r = Math.floor(i / (N + 1));
        const c = i % (N + 1);
        return (
          <View
            key={`d${i}`}
            pointerEvents="none"
            style={[
              styles.dbDot,
              {
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                left: pad + c * gap - dot / 2,
                top: pad + r * gap - dot / 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tttBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
  tttCell: {
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tttMark: { fontWeight: '900' },
  c4Board: {
    flexDirection: 'row',
    backgroundColor: '#2E4560',
    borderRadius: 18,
    padding: 6,
    borderWidth: 2,
    borderColor: '#4F6F8F',
  },
  c4Hole: { flex: 1, borderRadius: 999, backgroundColor: COLORS.background },
  c4Win: { borderWidth: 3, borderColor: '#FFFFFF' },
  c4Last: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  dbBoard: {
    position: 'relative',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dbDot: { position: 'absolute', backgroundColor: COLORS.text },
  dbLine: { borderRadius: 3 },
  dbLineEmpty: { backgroundColor: '#262626' },
  dbBox: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbBoxText: { fontWeight: '900', fontSize: 12 },
});
