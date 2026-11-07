// Memory Match — solo (fewest moves) or two players alternating on one device ('local').
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import GameTopBar from '../components/GameTopBar';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const EMOJIS = ['🍕', '🎧', '📚', '☕', '🏀', '🎸', '🚲', '🌮', '🎮', '🧪'];
const PAIRS = 8;
const COLS = 4;
const PLAYER_COLORS = ['#E0A240', '#B8637F'];
const ACCENT = '#B8637F';

function shuffledDeck() {
  const picks = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, PAIRS);
  const deck = [...picks, ...picks].map((emoji, i) => ({ id: i, emoji }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryGameScreen({ mode = 'solo', onExit }) {
  const twoPlayer = mode === 'local';
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 32, 400);
  const card = (boardSize - 8 * (COLS + 1)) / COLS;

  const [deck, setDeck] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState([]); // indices currently face-up (max 2)
  const [matched, setMatched] = useState({}); // index -> player seat (0/1)
  const [moves, setMoves] = useState(0);
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [best, setBest] = useState(null);
  const [newRecord, setNewRecord] = useState(false);
  const lock = useRef(false);

  const done = Object.keys(matched).length === PAIRS * 2;

  useEffect(() => {
    if (!twoPlayer) StorageService.getBestScore('memory').then(setBest);
  }, [twoPlayer]);

  useEffect(() => {
    if (!done) return;
    soundService.playVictory();
    if (!twoPlayer) {
      StorageService.submitScore('memory', moves, true).then((rec) => {
        if (rec) {
          setNewRecord(true);
          setBest(moves);
        }
      });
    }
  }, [done]);

  const flip = (i) => {
    if (lock.current || flipped.includes(i) || matched[i] !== undefined) return;
    soundService.playMove();
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next;
    if (deck[a].emoji === deck[b].emoji) {
      setMatched((m) => ({ ...m, [a]: turn, [b]: turn }));
      setScores((s) => {
        const n = [...s];
        n[turn] += 1;
        return n;
      });
      setFlipped([]);
      soundService.playCapture();
    } else {
      lock.current = true;
      setTimeout(() => {
        setFlipped([]);
        if (twoPlayer) setTurn((t) => 1 - t);
        lock.current = false;
      }, 850);
    }
  };

  const restart = () => {
    setDeck(shuffledDeck());
    setFlipped([]);
    setMatched({});
    setMoves(0);
    setTurn(0);
    setScores([0, 0]);
    setNewRecord(false);
  };

  let resultText = '';
  if (done) {
    if (!twoPlayer) resultText = `Cleared in ${moves} moves${newRecord ? ' — new best! ⭐' : ''}`;
    else if (scores[0] === scores[1]) resultText = `It's a tie, ${scores[0]} – ${scores[1]}!`;
    else resultText = `Player ${scores[0] > scores[1] ? 1 : 2} wins ${Math.max(...scores)} – ${Math.min(...scores)}!`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar
        title="🧠 MEMORY MATCH"
        color={ACCENT}
        onBack={onExit}
        right={
          <TouchableOpacity onPress={restart}>
            <Ionicons name="refresh" size={22} color={COLORS.text} />
          </TouchableOpacity>
        }
      />
      <View style={styles.content}>
        {twoPlayer ? (
          <View style={styles.row}>
            {[0, 1].map((p) => (
              <View
                key={p}
                style={[
                  styles.statBox,
                  !done && turn === p && { borderColor: PLAYER_COLORS[p] },
                ]}
              >
                <Text style={[styles.statVal, { color: PLAYER_COLORS[p] }]}>{scores[p]}</Text>
                <Text style={styles.statLabel}>PLAYER {p + 1}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{moves}</Text>
              <Text style={styles.statLabel}>MOVES</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.accent }]}>{best ?? '—'}</Text>
              <Text style={styles.statLabel}>BEST</Text>
            </View>
          </View>
        )}

        {twoPlayer && !done && (
          <Text style={[styles.turnText, { color: PLAYER_COLORS[turn] }]}>Player {turn + 1}'s turn</Text>
        )}

        <View style={[styles.grid, { width: boardSize }]}>
          {deck.map((c, i) => {
            const up = flipped.includes(i) || matched[i] !== undefined;
            const owner = matched[i];
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                onPress={() => flip(i)}
                style={[
                  styles.card,
                  { width: card, height: card * 1.15 },
                  up ? styles.cardUp : styles.cardDown,
                  owner !== undefined && {
                    borderColor: twoPlayer ? PLAYER_COLORS[owner] : COLORS.success,
                  },
                ]}
              >
                <Text style={{ fontSize: card * 0.45 }}>{up ? c.emoji : '❔'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {done && (
          <View style={styles.doneBox}>
            <Text style={styles.doneTitle}>🎉 All pairs found!</Text>
            <Text style={styles.doneSub}>{resultText}</Text>
            <TouchableOpacity style={styles.btn} onPress={restart}>
              <Text style={styles.btnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  statBox: {
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 6,
  },
  statVal: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  turnText: { fontWeight: '900', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  card: {
    margin: 4,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDown: { backgroundColor: '#2E2629', borderColor: '#3B3B3B' },
  cardUp: { backgroundColor: COLORS.card, borderColor: COLORS.borderLight },
  doneBox: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doneTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  doneSub: { color: COLORS.textLight, fontSize: 13 },
  btn: { marginTop: 4, backgroundColor: ACCENT, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: '900' },
});
