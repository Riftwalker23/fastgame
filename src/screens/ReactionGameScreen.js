// Reflex Duel — solo reaction-time test, or split-screen 2-player duel on one device ('local').
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/colors';
import GameTopBar from '../components/GameTopBar';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

const ROUNDS = 5;
const WIN_POINTS = 5;
const ACCENT = '#D9822B';
const P_COLORS = ['#E0A240', '#B8637F'];

const randomDelay = () => 1500 + Math.random() * 3000;

function useTimer() {
  const ref = useRef(null);
  useEffect(() => () => clearTimeout(ref.current), []);
  return {
    set: (fn, ms) => {
      clearTimeout(ref.current);
      ref.current = setTimeout(fn, ms);
    },
    clear: () => clearTimeout(ref.current),
  };
}

function SoloReaction() {
  const timer = useTimer();
  const [phase, setPhase] = useState('idle'); // idle | waiting | go | result | early | done
  const [times, setTimes] = useState([]);
  const [last, setLast] = useState(null);
  const [best, setBest] = useState(null);
  const [newRecord, setNewRecord] = useState(false);
  const goAt = useRef(0);

  useEffect(() => {
    StorageService.getBestScore('reaction').then(setBest);
  }, []);

  const arm = () => {
    setPhase('waiting');
    timer.set(() => {
      goAt.current = Date.now();
      setPhase('go');
      soundService.playNotification();
    }, randomDelay());
  };

  const onTap = () => {
    if (phase === 'idle' || phase === 'result' || phase === 'early') {
      arm();
    } else if (phase === 'waiting') {
      timer.clear();
      setPhase('early');
      soundService.playCapture();
    } else if (phase === 'go') {
      const ms = Date.now() - goAt.current;
      const nextTimes = [...times, ms];
      setLast(ms);
      setTimes(nextTimes);
      if (nextTimes.length >= ROUNDS) {
        const avg = Math.round(nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length);
        setPhase('done');
        soundService.playVictory();
        StorageService.submitScore('reaction', avg, true).then((rec) => {
          if (rec) {
            setNewRecord(true);
            setBest(avg);
          }
        });
      } else {
        setPhase('result');
      }
    } else if (phase === 'done') {
      setTimes([]);
      setLast(null);
      setNewRecord(false);
      arm();
    }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const bg =
    phase === 'go' ? '#4F8A55' : phase === 'waiting' ? '#A2402F' : phase === 'early' ? '#6B3A22' : COLORS.card;

  let title = 'Tap to start';
  let sub = `${ROUNDS} rounds. Tap as soon as the screen turns green.`;
  if (phase === 'waiting') {
    title = 'Wait for green…';
    sub = '';
  } else if (phase === 'go') {
    title = 'TAP!';
    sub = '';
  } else if (phase === 'early') {
    title = 'Too soon! 😅';
    sub = 'Tap to retry this round.';
  } else if (phase === 'result') {
    title = `${last} ms`;
    sub = `Round ${times.length}/${ROUNDS} — tap for the next one`;
  } else if (phase === 'done') {
    title = `${avg} ms average`;
    sub = `${newRecord ? '⭐ New personal best! ' : ''}Tap to play again`;
  }

  return (
    <View style={styles.soloWrap}>
      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{avg ?? '—'}</Text>
          <Text style={styles.statLabel}>AVG MS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: COLORS.accent }]}>{best ?? '—'}</Text>
          <Text style={styles.statLabel}>BEST AVG</Text>
        </View>
      </View>
      <Pressable
        onPressIn={onTap}
        delayPressIn={0}
        style={[styles.soloPad, { backgroundColor: bg }]}
      >
        <Text style={styles.bigText}>{title}</Text>
        {sub ? <Text style={styles.subText}>{sub}</Text> : null}
        {times.length > 0 && (
          <Text style={styles.timesText}>{times.map((t) => `${t}ms`).join('  •  ')}</Text>
        )}
      </Pressable>
    </View>
  );
}

function DuelReaction() {
  const timer = useTimer();
  const [phase, setPhase] = useState('idle'); // idle | waiting | go | round | match
  const [scores, setScores] = useState([0, 0]);
  const [message, setMessage] = useState('Both players: tap your side to start');
  const [roundWinner, setRoundWinner] = useState(null);
  const goAt = useRef(0);

  const arm = () => {
    setRoundWinner(null);
    setPhase('waiting');
    setMessage('Wait for it…');
    timer.set(() => {
      goAt.current = Date.now();
      setPhase('go');
      setMessage('TAP!');
      soundService.playNotification();
    }, randomDelay());
  };

  const award = (seat, msg) => {
    const next = [...scores];
    next[seat] += 1;
    setScores(next);
    setRoundWinner(seat);
    setMessage(msg);
    if (next[seat] >= WIN_POINTS) {
      setPhase('match');
      soundService.playVictory();
    } else {
      setPhase('round');
      soundService.playMove();
    }
  };

  const onTap = (seat) => {
    if (phase === 'idle' || phase === 'round') return arm();
    if (phase === 'match') {
      setScores([0, 0]);
      return arm();
    }
    if (phase === 'waiting') {
      timer.clear();
      soundService.playCapture();
      return award(1 - seat, `Player ${seat + 1} tapped too early! Point to Player ${2 - seat}.`);
    }
    if (phase === 'go') {
      const ms = Date.now() - goAt.current;
      return award(seat, `Player ${seat + 1} wins the round — ${ms} ms`);
    }
    return undefined;
  };

  const halfBg = (seat) => {
    if (phase === 'go') return '#4F8A55';
    if (phase === 'waiting') return '#A2402F';
    if ((phase === 'round' || phase === 'match') && roundWinner === seat) return COLORS.surfaceLight;
    return COLORS.card;
  };

  const halfText = (seat) => {
    if (phase === 'match') return scores[seat] >= WIN_POINTS ? '🏆 YOU WIN!' : 'Good game!';
    if (phase === 'go') return 'TAP!';
    if (phase === 'waiting') return 'Wait…';
    if (phase === 'round') return roundWinner === seat ? '+1 point!' : 'Tap to continue';
    return 'Tap to start';
  };

  const Half = ({ seat }) => (
    <Pressable
      onPressIn={() => onTap(seat)}
      delayPressIn={0} // web defaults to a 50ms delay, which swallows quick taps
      style={[
        styles.half,
        { backgroundColor: halfBg(seat), borderColor: P_COLORS[seat] },
        seat === 0 && { transform: [{ rotate: '180deg' }] },
      ]}
    >
      <Text style={[styles.halfLabel, { color: P_COLORS[seat] }]}>PLAYER {seat + 1}</Text>
      <Text style={styles.halfScore}>{scores[seat]}</Text>
      <Text style={styles.bigText}>{halfText(seat)}</Text>
    </Pressable>
  );

  return (
    <View style={styles.duelWrap}>
      {Half({ seat: 0 })}
      <View style={styles.midBar}>
        <Text style={styles.midText} numberOfLines={2}>
          {message} • First to {WIN_POINTS}
        </Text>
      </View>
      {Half({ seat: 1 })}
    </View>
  );
}

export default function ReactionGameScreen({ mode = 'solo', onExit }) {
  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar title="⚡ REFLEX DUEL" color={ACCENT} onBack={onExit} />
      {mode === 'local' ? <DuelReaction /> : <SoloReaction />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  soloWrap: { flex: 1, padding: 16, gap: 14 },
  statRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  statBox: {
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
  },
  statVal: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  soloPad: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bigText: { color: COLORS.text, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  subText: { color: COLORS.textLight, fontSize: 14, textAlign: 'center' },
  timesText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' },
  duelWrap: { flex: 1, padding: 10, gap: 8 },
  half: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  halfLabel: { fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  halfScore: { color: COLORS.text, fontSize: 44, fontWeight: '900' },
  midBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  midText: { color: COLORS.textLight, textAlign: 'center', fontWeight: '700', fontSize: 12 },
});
