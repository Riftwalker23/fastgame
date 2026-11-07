// Per-game landing page: description, how to play, and the available play modes.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { MODE_INFO } from '../games/catalog';
import { StorageService } from '../services/storage';
import DemoModal from '../components/DemoModal';

const BEST_LABELS = {
  hangmanStreak: (v) => `Best streak: ${v}`,
  minesweeperEasy: (v) => `Easy best: ${v}s`,
  minesweeperHard: (v) => `Hard best: ${v}s`,
  snake: (v) => `Best score: ${v}`,
  snakeDuelWins: (v) => `Duel wins vs AI: ${v}`,
  game2048: (v) => `Best score: ${v}`,
  memory: (v) => `Fewest moves: ${v}`,
  reaction: (v) => `Best average: ${v} ms`,
};

export default function GameDetailScreen({
  game,
  profile,
  isConnected,
  onBack,
  onPlay, // (mode) => void for bot / local / solo
  onOpenLobby,
  onQuickMatch,
  onOpenFriends,
}) {
  const [records, setRecords] = useState([]);
  const [demoVisible, setDemoVisible] = useState(false);

  useEffect(() => {
    StorageService.getBestScores().then((all) => {
      const list = Object.entries(BEST_LABELS)
        .filter(([k]) => k === game.id || k.startsWith(game.id))
        .filter(([k]) => all[k] !== undefined && all[k] !== null)
        .map(([k, fmt]) => fmt(all[k]));
      setRecords(list);
    });
  }, [game.id]);

  const stats = profile?.stats || {};
  const wins = stats[`${game.id}Wins`] || 0;
  const played = stats[`${game.id}Games`];

  const offlineModes = game.modes.filter((m) => m !== 'online');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={onBack} hitSlop={10}>
        <Ionicons name="arrow-back" size={18} color={COLORS.textLight} />
        <Text style={styles.backText}>All games</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={[styles.hero, { borderTopColor: game.color }]}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>{game.emoji}</Text>
        </View>
        <Text style={styles.heroTitle}>{game.name}</Text>
        <Text style={[styles.heroTag, { color: game.color }]}>
          {game.tagline} • {game.players}
        </Text>
        <Text style={styles.heroDesc}>{game.description}</Text>

        {(records.length > 0 || wins > 0 || played) && (
          <View style={styles.recordRow}>
            {wins > 0 || played ? (
              <View style={styles.recordPill}>
                <Ionicons name="trophy" size={12} color={COLORS.accent} />
                <Text style={styles.recordText}>
                  {wins} wins{played ? ` / ${played} played` : ''}
                </Text>
              </View>
            ) : null}
            {records.map((r) => (
              <View key={r} style={styles.recordPill}>
                <Ionicons name="star" size={12} color={COLORS.accent} />
                <Text style={styles.recordText}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Demo */}
      <TouchableOpacity style={styles.demoBtn} onPress={() => setDemoVisible(true)} activeOpacity={0.8}>
        <Ionicons name="play-circle-outline" size={22} color={COLORS.text} />
        <View style={{ flex: 1 }}>
          <Text style={styles.demoTitle}>New to {game.name}? Watch the demo</Text>
          <Text style={styles.demoSub}>A quick step-by-step walkthrough of the rules</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Modes */}
      <Text style={styles.sectionTitle}>CHOOSE HOW TO PLAY</Text>

      {game.modes.includes('online') && (
        <View style={[styles.onlineCard, { borderColor: game.color }]}>
          <View style={styles.onlineHeader}>
            <View style={[styles.modeIcon, { backgroundColor: game.color }]}>
              <Ionicons name={MODE_INFO.online.icon} size={20} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>{MODE_INFO.online.label}</Text>
              <Text style={styles.modeSub}>
                {isConnected ? MODE_INFO.online.sub : 'Server offline — online play unavailable right now'}
              </Text>
            </View>
          </View>
          <View style={styles.onlineBtns}>
            <TouchableOpacity
              style={[styles.onlineBtn, { backgroundColor: game.color }]}
              onPress={onOpenLobby}
            >
              <Ionicons name="key-outline" size={16} color="#000" />
              <Text style={styles.onlineBtnTextDark}>Room Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.onlineBtnGhost} onPress={onOpenFriends}>
              <Ionicons name="person-add-outline" size={16} color={COLORS.text} />
              <Text style={styles.onlineBtnText}>Invite Friend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.onlineBtnGhost} onPress={onQuickMatch}>
              <Ionicons name="flash" size={16} color={COLORS.accent} />
              <Text style={styles.onlineBtnText}>Quick Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {offlineModes.map((m) => (
        <TouchableOpacity key={m} style={styles.modeCard} onPress={() => onPlay(m)} activeOpacity={0.8}>
          <View style={[styles.modeIcon, { backgroundColor: COLORS.surfaceLight }]}>
            <Ionicons name={MODE_INFO[m].icon} size={20} color={game.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeTitle}>
              {game.id === 'snake' && m === 'bot' ? 'Duel vs AI Snake' : MODE_INFO[m].label}
            </Text>
            <Text style={styles.modeSub}>{MODE_INFO[m].sub}</Text>
          </View>
          <Ionicons name="play-circle" size={30} color={game.color} />
        </TouchableOpacity>
      ))}

      {/* How to play */}
      <Text style={styles.sectionTitle}>HOW TO PLAY</Text>
      <View style={styles.howCard}>
        {game.howTo.map((line, i) => (
          <View key={i} style={styles.howRow}>
            <View style={styles.howNum}>
              <Text style={[styles.howNumText, { color: game.color }]}>{i + 1}</Text>
            </View>
            <Text style={styles.howText}>{line}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={() => setDemoVisible(true)}>
          <Text style={styles.demoLink}>Watch the full demo →</Text>
        </TouchableOpacity>
      </View>

      <DemoModal visible={demoVisible} game={game} onClose={() => setDemoVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: 16,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 48,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: COLORS.textLight, fontWeight: '700' },
  hero: {
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroEmoji: { fontSize: 46 },
  heroTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  heroTag: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  heroDesc: { color: COLORS.textLight, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  recordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  recordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
  },
  demoTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  demoSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  demoLink: { color: COLORS.primary, fontWeight: '700', fontSize: 13, marginTop: 4 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  onlineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  onlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onlineBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  onlineBtn: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  onlineBtnGhost: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  onlineBtnTextDark: { color: '#000', fontWeight: '900', fontSize: 13 },
  onlineBtnText: { color: COLORS.text, fontWeight: '800', fontSize: 13 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  modeIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  modeSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  howCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  howRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  howNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  howNumText: { fontWeight: '900', fontSize: 12 },
  howText: { color: COLORS.textLight, fontSize: 13, lineHeight: 19, flex: 1 },
});
