// Rock Paper Scissors — best of five vs an AI that learns your habits ('bot'),
// or pass & play with hidden picks ('local').
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/colors';
import GameTopBar from '../components/GameTopBar';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const COLOR = '#7C93B5';
const TARGET = 3;
const MOVES = [
  { id: 'rock', emoji: '✊', label: 'Rock' },
  { id: 'paper', emoji: '✋', label: 'Paper' },
  { id: 'scissors', emoji: '✌️', label: 'Scissors' },
];
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const COUNTER = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
const byId = (id) => MOVES.find((m) => m.id === id);

// AI: usually counters the player's most common recent move, sometimes random.
function aiPick(history) {
  if (history.length < 2 || Math.random() < 0.35) {
    return MOVES[Math.floor(Math.random() * 3)].id;
  }
  const counts = { rock: 0, paper: 0, scissors: 0 };
  history.slice(-8).forEach((m) => counts[m]++);
  const fav = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return COUNTER[fav];
}

function outcome(a, b) {
  if (a === b) return -1; // tie
  return BEATS[a] === b ? 0 : 1; // index of the winner
}

export default function RockPaperScissorsScreen({ mode = 'bot', onExit }) {
  const vsBot = mode !== 'local';
  const names = vsBot ? ['You', 'AI 🤖'] : ['Player 1', 'Player 2'];

  const [scores, setScores] = useState([0, 0]);
  const [phase, setPhase] = useState('pick0'); // pick0 | handoff | pick1 | reveal | match
  const [picks, setPicks] = useState([null, null]);
  const [result, setResult] = useState('');
  const history = useRef([]);

  const resolve = (p0, p1) => {
    const w = outcome(p0, p1);
    const next = [...scores];
    if (w >= 0) next[w] += 1;
    setScores(next);
    setPicks([p0, p1]);
    setResult(w < 0 ? "It's a tie!" : `${names[w]} ${vsBot && w === 0 ? 'win' : 'wins'} the round`);
    if (next[0] >= TARGET || next[1] >= TARGET) {
      setPhase('match');
      const iWon = next[0] >= TARGET;
      if (vsBot) {
        StorageService.updateStats('rps', iWon ? 'win' : 'loss');
        if (iWon) soundService.playVictory();
        else soundService.playCapture();
      } else {
        soundService.playVictory();
      }
    } else {
      setPhase('reveal');
      soundService.playMove();
    }
  };

  const pick = (id) => {
    if (phase === 'pick0') {
      if (vsBot) {
        const ai = aiPick(history.current);
        history.current.push(id);
        resolve(id, ai);
      } else {
        setPicks([id, null]);
        setPhase('handoff');
      }
    } else if (phase === 'pick1') {
      resolve(picks[0], id);
    }
  };

  const nextRound = () => {
    setPicks([null, null]);
    setResult('');
    setPhase('pick0');
  };

  const restart = () => {
    setScores([0, 0]);
    history.current = [];
    nextRound();
  };

  const picker = phase === 'pick1' ? 1 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar title="✊ ROCK PAPER SCISSORS" color={COLOR} onBack={onExit} />
      <View style={styles.content}>
        <View style={styles.scoreRow}>
          {[0, 1].map((p) => (
            <View key={p} style={styles.scoreBox}>
              <Text style={styles.scoreVal}>{scores[p]}</Text>
              <Text style={styles.scoreLabel}>{names[p].toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.target}>First to {TARGET} wins</Text>

        {(phase === 'pick0' || phase === 'pick1') && (
          <View style={styles.panel}>
            <Text style={styles.title}>
              {vsBot ? 'Make your pick' : `${names[picker]}, make your pick`}
            </Text>
            {!vsBot && <Text style={styles.sub}>{names[1 - picker]}, no peeking 🙈</Text>}
            <View style={styles.pickRow}>
              {MOVES.map((m) => (
                <TouchableOpacity key={m.id} style={styles.pickBtn} onPress={() => pick(m.id)}>
                  <Text style={styles.pickEmoji}>{m.emoji}</Text>
                  <Text style={styles.pickLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {phase === 'handoff' && (
          <View style={styles.panel}>
            <Text style={styles.title}>Pick locked in 🔒</Text>
            <Text style={styles.sub}>Pass the phone to {names[1]}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => setPhase('pick1')}>
              <Text style={styles.btnText}>I'm {names[1]} — ready</Text>
            </TouchableOpacity>
          </View>
        )}

        {(phase === 'reveal' || phase === 'match') && (
          <View style={styles.panel}>
            <View style={styles.revealRow}>
              {[0, 1].map((p) => (
                <View key={p} style={styles.revealCol}>
                  <Text style={styles.revealEmoji}>{byId(picks[p]).emoji}</Text>
                  <Text style={styles.sub}>{names[p]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.title}>{result}</Text>
            {phase === 'match' ? (
              <>
                <Text style={styles.matchText}>
                  🏆 {names[scores[0] >= TARGET ? 0 : 1]} {vsBot && scores[0] >= TARGET ? 'win' : 'wins'} the match{' '}
                  {Math.max(...scores)}–{Math.min(...scores)}
                </Text>
                <TouchableOpacity style={styles.btn} onPress={restart}>
                  <Text style={styles.btnText}>New match</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.btn} onPress={nextRound}>
                <Text style={styles.btnText}>Next round</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 16, gap: 14, alignItems: 'center' },
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreBox: {
    minWidth: 110,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
  },
  scoreVal: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  scoreLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  target: { color: COLORS.textSecondary, fontSize: 12 },
  panel: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 12,
    alignItems: 'center',
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  sub: { color: COLORS.textSecondary, fontSize: 13 },
  pickRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  pickBtn: {
    width: 96,
    height: 110,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pickEmoji: { fontSize: 44 },
  pickLabel: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  revealRow: { flexDirection: 'row', gap: 40 },
  revealCol: { alignItems: 'center', gap: 4 },
  revealEmoji: { fontSize: 64 },
  matchText: { color: COLORS.accent, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  btn: { backgroundColor: COLOR, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#111', fontWeight: '800' },
});
