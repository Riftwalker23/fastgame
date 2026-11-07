// "How to play" demo: a short step-by-step walkthrough, plus a live AI-vs-AI
// sample game for the turn-based board games.
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { DEMOS, TURN_GAMES } from '../games/catalog';
import { TicTacToeBoard, Connect4Board, DotsBoxesBoard } from './TurnBoards';
import tictactoe from '../games/logic/tictactoe';
import connect4 from '../games/logic/connect4';
import dotsboxes from '../games/logic/dotsboxes';

const LOGIC = { tictactoe, connect4, dotsboxes };
const BOARDS = { tictactoe: TicTacToeBoard, connect4: Connect4Board, dotsboxes: DotsBoxesBoard };

function AutoPlay({ gameId }) {
  const logic = LOGIC[gameId];
  const Board = BOARDS[gameId];
  const [state, setState] = useState(logic.createState);

  useEffect(() => {
    const over = state.winner !== null || state.draw;
    const t = setTimeout(
      () => {
        if (over) {
          setState(logic.createState());
          return;
        }
        const move = logic.getBotMove(state);
        const next = move && logic.applyMove(state, move, state.turn);
        if (next) setState(next);
      },
      over ? 2200 : 650
    );
    return () => clearTimeout(t);
  }, [state, logic]);

  let caption = `Player ${state.turn + 1} is thinking…`;
  if (state.winner !== null) caption = `Player ${state.winner + 1} wins! Starting again…`;
  else if (state.draw) caption = "It's a draw! Starting again…";

  return (
    <View style={styles.autoWrap}>
      <View style={styles.autoBoard} pointerEvents="none">
        <Board state={state} onMove={() => {}} disabled />
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

export default function DemoModal({ visible, game, onClose, onPlay }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (visible) setStep(0);
  }, [visible, game?.id]);

  if (!visible || !game) return null;

  const steps = [...(DEMOS[game.id] || game.howTo.map((t, i) => ({ title: `Step ${i + 1}`, text: t })))];
  if (TURN_GAMES.includes(game.id)) {
    steps.push({
      live: true,
      title: 'Watch a sample game',
      text: 'Two computer players are playing a real game here so you can see how it goes.',
    });
  }
  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {game.emoji} How to play {game.name}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {current.live ? (
              <AutoPlay gameId={game.id} />
            ) : current.art ? (
              <View style={styles.artBox}>
                <Text style={styles.art}>{current.art}</Text>
              </View>
            ) : null}
            <Text style={styles.stepTitle}>{current.title}</Text>
            <Text style={styles.stepText}>{current.text}</Text>
          </ScrollView>

          <View style={styles.dots}>
            {steps.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setStep(i)} hitSlop={6}>
                <View style={[styles.dot, i === step && { backgroundColor: COLORS.text, width: 18 }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.navBtn, step === 0 && { opacity: 0.4 }]}
              disabled={step === 0}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.navText}>Back</Text>
            </TouchableOpacity>
            {last ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: game.color }]}
                onPress={onPlay || onClose}
              >
                <Text style={styles.primaryText}>{onPlay ? "Got it — let's play" : 'Got it'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: game.color }]}
                onPress={() => setStep(step + 1)}
              >
                <Text style={styles.primaryText}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', flex: 1 },
  body: { padding: 18, alignItems: 'center', gap: 10 },
  artBox: {
    width: '100%',
    minHeight: 120,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  art: { color: COLORS.text, fontSize: 24, lineHeight: 34, textAlign: 'center' },
  stepTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  stepText: { color: COLORS.textLight, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  autoWrap: { alignItems: 'center', gap: 8 },
  autoBoard: { transform: [{ scale: 0.8 }], marginVertical: -30 },
  caption: { color: COLORS.textSecondary, fontSize: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.borderLight },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  navText: { color: COLORS.text, fontWeight: '700' },
  primaryBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#111', fontWeight: '800' },
});
