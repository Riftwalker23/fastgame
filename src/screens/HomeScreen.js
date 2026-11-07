// Home: game catalog grid with category filters. Tapping a game opens its detail page.
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { GAMES, CATEGORIES, MODE_INFO } from '../games/catalog';

const MAX_WIDTH = 720;
const PAD = 16;
const GAP = 12;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export default function HomeScreen({ profile, friends = [], onSelectGame, onOpenFriends, onOpenDownload }) {
  const [category, setCategory] = useState('all');
  const { width } = useWindowDimensions();
  // Measure the real grid width (window width can include scrollbars on web).
  const [gridWidth, setGridWidth] = useState(Math.min(width, MAX_WIDTH) - PAD * 2 - 20);
  const cols = gridWidth >= 540 ? 3 : 2;
  const tileWidth = Math.floor((gridWidth - GAP * (cols - 1)) / cols) - 1;

  const onlineFriends = friends.filter((f) => f.online);
  const games = category === 'all' ? GAMES : GAMES.filter((g) => g.category === category);
  const featured = GAMES.find((g) => g.id === 'reaction');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroPre}>{greeting()},</Text>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {profile?.username || 'Player'}
          </Text>
          <Text style={styles.heroSub}>
            {GAMES.length} games • {onlineFriends.length} friend{onlineFriends.length === 1 ? '' : 's'} online
          </Text>
        </View>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{profile?.avatar || '🎮'}</Text>
        </View>
      </View>

      {/* Featured party game */}
      {featured && (
        <TouchableOpacity
          style={styles.featured}
          activeOpacity={0.85}
          onPress={() => onSelectGame(featured.id)}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.featuredPre, { color: featured.color }]}>⭐ FEATURED • PARTY PICK</Text>
            <Text style={styles.featuredTitle}>
              {featured.emoji} {featured.name}
            </Text>
            <Text style={styles.featuredSub}>
              Put one phone on the table and find out who has the fastest reflexes in the room.
            </Text>
          </View>
          <View style={[styles.featuredPlay, { backgroundColor: featured.color }]}>
            <Ionicons name="play" size={22} color="#000" />
          </View>
        </TouchableOpacity>
      )}

      {/* Online friends */}
      {onlineFriends.length > 0 && (
        <View style={styles.friendsBar}>
          <View style={styles.rowBetween}>
            <Text style={styles.friendsBarTitle}>🟢 Friends online ({onlineFriends.length})</Text>
            <TouchableOpacity onPress={onOpenFriends}>
              <Text style={styles.link}>Challenge →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {onlineFriends.map((f) => (
              <TouchableOpacity key={f.id} style={styles.friendPill} onPress={onOpenFriends}>
                <Text style={{ fontSize: 18 }}>{f.avatar}</Text>
                <Text style={styles.friendName}>{f.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Game grid */}
      <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        {games.map((g) => (
          <TouchableOpacity
            key={g.id}
            activeOpacity={0.85}
            onPress={() => onSelectGame(g.id)}
            style={[styles.tile, { width: tileWidth }]}
          >
            <View style={[styles.tileArt, { borderBottomColor: g.color }]}>
              <Text style={styles.tileEmoji}>{g.emoji}</Text>
              {g.badge ? (
                <View style={[styles.badge, { backgroundColor: g.color }]}>
                  <Text style={styles.badgeText}>{g.badge}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.tileBody}>
              <Text style={styles.tileName} numberOfLines={1}>
                {g.name}
              </Text>
              <Text style={styles.tileTag} numberOfLines={2}>
                {g.tagline}
              </Text>
              <View style={styles.modeIcons}>
                {g.modes.map((m) => (
                  <Ionicons key={m} name={MODE_INFO[m].icon} size={13} color={COLORS.textSecondary} />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(MODE_INFO).map(([k, m]) => (
          <View key={k} style={styles.legendItem}>
            <Ionicons name={m.icon} size={12} color={COLORS.textMuted} />
            <Text style={styles.legendText}>{k === 'online' ? 'Online' : k === 'bot' ? 'Vs AI' : k === 'local' ? 'Same device' : 'Solo'}</Text>
          </View>
        ))}
      </View>

      {/* Invite + Download */}
      <TouchableOpacity style={styles.rowCard} onPress={onOpenFriends}>
        <View style={[styles.rowIcon, { backgroundColor: '#262626' }]}>
          <Ionicons name="person-add" size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Add & invite friends</Text>
          <Text style={styles.rowSub}>Your ID: {profile?.username}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.rowCard} onPress={onOpenDownload}>
        <View style={[styles.rowIcon, { backgroundColor: '#262626' }]}>
          <Ionicons name="phone-portrait" size={20} color={COLORS.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Get the mobile app</Text>
          <Text style={styles.rowSub}>Android & iOS — install in seconds</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: PAD,
    gap: 16,
    maxWidth: MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 48,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroPre: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  heroTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginVertical: 2 },
  heroSub: { color: COLORS.textSecondary, fontSize: 12 },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3B3B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: { fontSize: 28 },
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  featuredPre: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  featuredTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  featuredSub: { color: COLORS.textLight, fontSize: 12, lineHeight: 17 },
  featuredPlay: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  friendsBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  friendsBarTitle: { color: COLORS.textLight, fontSize: 12, fontWeight: '700' },
  link: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  friendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  friendName: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textLight, fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tileArt: {
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderBottomWidth: 3,
  },
  tileEmoji: { fontSize: 46 },
  badge: { position: 'absolute', top: 8, right: 8, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  tileBody: { padding: 12, gap: 3 },
  tileName: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  tileTag: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 15, minHeight: 30 },
  modeIcons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 11 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  rowSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
