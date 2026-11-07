// Hangman — solo (built-in word list, streak tracking) or 2 players on one phone ('local'),
// where one player secretly types the word and the other guesses, then they swap.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';
import GameTopBar from '../components/GameTopBar';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const COLOR = '#A88B6A';
const MAX_WRONG = 6;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const WORDS = {
  Campus: ['LIBRARY', 'CANTEEN', 'HOSTEL', 'LECTURE', 'PROFESSOR', 'SEMESTER', 'ASSIGNMENT', 'DEADLINE', 'GRADUATION', 'LABORATORY', 'CAFETERIA', 'SCHOLARSHIP', 'ATTENDANCE', 'NOTEBOOK', 'TIMETABLE'],
  Tech: ['KEYBOARD', 'COMPILER', 'DATABASE', 'ALGORITHM', 'NETWORK', 'BROWSER', 'SOFTWARE', 'PROCESSOR', 'JAVASCRIPT', 'PASSWORD', 'WIRELESS', 'DOWNLOAD'],
  Food: ['SAMOSA', 'BIRYANI', 'PANCAKE', 'NOODLES', 'SANDWICH', 'CHOCOLATE', 'POPCORN', 'BURGER', 'MANGO', 'OMELETTE'],
  Sports: ['CRICKET', 'FOOTBALL', 'BADMINTON', 'BASKETBALL', 'MARATHON', 'TENNIS', 'VOLLEYBALL', 'HOCKEY', 'SWIMMING'],
  Animals: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'KANGAROO', 'CHEETAH', 'OCTOPUS', 'PEACOCK', 'BUTTERFLY'],
};

const STAGES = [
  ' +---+\n |   |\n     |\n     |\n     |\n=====',
  ' +---+\n |   |\n O   |\n     |\n     |\n=====',
  ' +---+\n |   |\n O   |\n |   |\n     |\n=====',
  ' +---+\n |   |\n O   |\n/|   |\n     |\n=====',
  ' +---+\n |   |\n O   |\n/|\\  |\n     |\n=====',
  ' +---+\n |   |\n O   |\n/|\\  |\n/    |\n=====',
  ' +---+\n |   |\n O   |\n/|\\  |\n/ \\  |\n=====',
];

function randomWord() {
  const cats = Object.keys(WORDS);
  const category = cats[Math.floor(Math.random() * cats.length)];
  const list = WORDS[category];
  return { word: list[Math.floor(Math.random() * list.length)], hint: category };
}

export default function HangmanScreen({ mode = 'solo', onExit }) {
  const twoPlayer = mode === 'local';
  const [round, setRound] = useState(() => (twoPlayer ? null : randomWord()));
  const [guessed, setGuessed] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  // Two-player state
  const [setter, setSetter] = useState(0); // who types the word this round
  const [scores, setScores] = useState([0, 0]);
  const [draftWord, setDraftWord] = useState('');
  const [draftHint, setDraftHint] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!twoPlayer) StorageService.getBestScore('hangmanStreak').then((b) => setBestStreak(b || 0));
  }, [twoPlayer]);

  const word = round?.word || '';
  const wrong = guessed.filter((l) => !word.includes(l)).length;
  const won = !!word && word.split('').every((l) => l === ' ' || guessed.includes(l));
  const lost = wrong >= MAX_WRONG;
  const over = won || lost;
  const guesser = 1 - setter;

  const guess = useCallback(
    (letter) => {
      if (!round || over || guessed.includes(letter)) return;
      const next = [...guessed, letter];
      setGuessed(next);
      const hit = word.includes(letter);
      if (hit) soundService.playMove();
      else soundService.playCapture();

      const nowWon = word.split('').every((l) => l === ' ' || next.includes(l));
      const nowLost = next.filter((l) => !word.includes(l)).length >= MAX_WRONG;
      if (nowWon || nowLost) {
        if (nowWon) soundService.playVictory();
        if (twoPlayer) {
          // Guesser scores on a win, setter scores if the word wasn't guessed.
          const winner = nowWon ? guesser : setter;
          setScores((s) => {
            const n = [...s];
            n[winner] += 1;
            return n;
          });
        } else if (nowWon) {
          const s = streak + 1;
          setStreak(s);
          if (s > bestStreak) {
            setBestStreak(s);
            StorageService.submitScore('hangmanStreak', s);
          }
          StorageService.updateStats('hangman', 'win');
        } else {
          setStreak(0);
          StorageService.updateStats('hangman', 'loss');
        }
      }
    },
    [round, over, guessed, word, twoPlayer, guesser, setter, streak, bestStreak]
  );

  // Physical keyboard support on web.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const handler = (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      const k = (e.key || '').toUpperCase();
      if (k.length === 1 && k >= 'A' && k <= 'Z') guess(k);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [guess]);

  const nextRound = () => {
    setGuessed([]);
    if (twoPlayer) {
      setSetter(1 - setter);
      setRound(null);
      setDraftWord('');
      setDraftHint('');
    } else {
      setRound(randomWord());
    }
  };

  const submitWord = () => {
    const w = draftWord.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!/^[A-Z ]{3,20}$/.test(w) || !w.replace(/ /g, '').length) {
      setError('Use 3–20 letters (A–Z only).');
      return;
    }
    setError('');
    setRound({ word: w, hint: draftHint.trim() || null });
    setGuessed([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar title="🔤 HANGMAN" color={COLOR} onBack={onExit} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Score row */}
        {twoPlayer ? (
          <View style={styles.row}>
            {[0, 1].map((p) => (
              <View key={p} style={[styles.statBox, round && p === guesser && !over && styles.statActive]}>
                <Text style={styles.statVal}>{scores[p]}</Text>
                <Text style={styles.statLabel}>PLAYER {p + 1}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{streak}</Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.accent }]}>{bestStreak}</Text>
              <Text style={styles.statLabel}>BEST</Text>
            </View>
          </View>
        )}

        {twoPlayer && !round ? (
          // Secret word entry
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Player {setter + 1}: type a secret word</Text>
            <Text style={styles.panelSub}>Player {guesser + 1}, look away! 🙈</Text>
            <TextInput
              style={styles.input}
              value={draftWord}
              onChangeText={(t) => setDraftWord(t.replace(/[^a-zA-Z ]/g, ''))}
              placeholder="Secret word"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
            />
            <TextInput
              style={styles.input}
              value={draftHint}
              onChangeText={setDraftHint}
              placeholder="Hint (optional), e.g. a movie"
              placeholderTextColor={COLORS.textMuted}
              maxLength={30}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.btn} onPress={submitWord}>
              <Text style={styles.btnText}>Lock it in & pass the phone</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.gallowsRow}>
              <Text style={styles.gallows}>{STAGES[Math.min(wrong, MAX_WRONG)]}</Text>
              <View style={{ gap: 6, flex: 1 }}>
                <Text style={styles.lives}>
                  {'❤️'.repeat(MAX_WRONG - wrong)}
                  {'🖤'.repeat(wrong)}
                </Text>
                {round?.hint ? <Text style={styles.hint}>Hint: {round.hint}</Text> : null}
                {twoPlayer && !over ? (
                  <Text style={styles.hint}>Player {guesser + 1} is guessing</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.wordRow}>
              {word.split('').map((l, i) =>
                l === ' ' ? (
                  <View key={i} style={{ width: 14 }} />
                ) : (
                  <View key={i} style={styles.slot}>
                    <Text
                      style={[
                        styles.slotText,
                        lost && !guessed.includes(l) && { color: COLORS.danger },
                      ]}
                    >
                      {guessed.includes(l) || over ? l : ''}
                    </Text>
                  </View>
                )
              )}
            </View>

            {over ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>
                  {won
                    ? twoPlayer
                      ? `Player ${guesser + 1} got it! 🎉`
                      : 'You got it! 🎉'
                    : twoPlayer
                    ? `Player ${setter + 1} stumped them!`
                    : `Out of lives — it was ${word}`}
                </Text>
                <TouchableOpacity style={styles.btn} onPress={nextRound}>
                  <Text style={styles.btnText}>{twoPlayer ? 'Next round (swap roles)' : 'Next word'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.keyboard}>
                {LETTERS.map((l) => {
                  const used = guessed.includes(l);
                  const hit = used && word.includes(l);
                  return (
                    <TouchableOpacity
                      key={l}
                      disabled={used}
                      onPress={() => guess(l)}
                      style={[
                        styles.key,
                        used && (hit ? styles.keyHit : styles.keyMiss),
                      ]}
                    >
                      <Text style={[styles.keyText, used && !hit && { color: COLORS.textMuted }]}>{l}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16, alignItems: 'center', paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 10 },
  statBox: {
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
  },
  statActive: { borderColor: COLOR },
  statVal: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  gallowsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', maxWidth: 420 },
  gallows: {
    color: COLORS.text,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 18,
    lineHeight: 22,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  lives: { fontSize: 16 },
  hint: { color: COLORS.textSecondary, fontSize: 13 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, maxWidth: 440 },
  slot: {
    width: 28,
    height: 38,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  slotText: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    maxWidth: 420,
  },
  key: {
    width: 40,
    height: 46,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyHit: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  keyMiss: { backgroundColor: COLORS.card, borderColor: COLORS.card },
  keyText: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
    alignItems: 'center',
  },
  panelTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  panelSub: { color: COLORS.textSecondary, fontSize: 13 },
  input: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { color: COLORS.danger, fontSize: 12 },
  btn: { backgroundColor: COLOR, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#111', fontWeight: '800' },
});
