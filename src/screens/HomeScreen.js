import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function HomeScreen({
  profile,
  friends = [],
  onOpenLudoLobby,
  onOpenChessLobby,
  onStartLocalLudo,
  onStartBotLudo,
  onStartLocalChess,
  onStartBotChess,
  onQuickMatch,
  onOpenFriends,
  onChallengeFriend,
}) {
  const onlineFriends = friends.filter((f) => f.online);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Welcome Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroPre}>WELCOME BACK,</Text>
          <Text style={styles.heroTitle}>{profile?.username || 'CHAMPION'}</Text>
          <Text style={styles.heroSub}>
            Ready to challenge friends in real-time cross-platform battles?
          </Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeEmoji}>⚔️</Text>
        </View>
      </View>

      {/* Online Friends Quick Bar */}
      {onlineFriends.length > 0 && (
        <View style={styles.friendsBar}>
          <View style={styles.friendsBarHeader}>
            <Text style={styles.friendsBarTitle}>Friends Online Now ({onlineFriends.length})</Text>
            <TouchableOpacity onPress={onOpenFriends}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsScroll}>
            {onlineFriends.map((friend) => (
              <View key={friend.id} style={styles.friendPill}>
                <Text style={styles.friendPillAvatar}>{friend.avatar}</Text>
                <View>
                  <Text style={styles.friendPillName}>{friend.username}</Text>
                  <View style={styles.friendPillStatus}>
                    <View style={styles.pillGreenDot} />
                    <Text style={styles.pillStatusText}>Online</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.pillPlayBtn}
                  onPress={() => onChallengeFriend(friend.id, 'chess')}
                >
                  <Text style={styles.pillPlayText}>⚔️ Play</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Matchmaking Row */}
      <View style={styles.quickMatchSection}>
        <Text style={styles.sectionTitle}>⚡ INSTANT MATCHMAKING</Text>
        <View style={styles.quickMatchGrid}>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickLudo]}
            onPress={() => onQuickMatch('ludo')}
          >
            <Text style={styles.quickEmoji}>🎲</Text>
            <View>
              <Text style={styles.quickTitle}>Quick Ludo</Text>
              <Text style={styles.quickDesc}>Find player in seconds</Text>
            </View>
            <Ionicons name="flash" size={18} color="#EF4444" style={styles.quickIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, styles.quickChess]}
            onPress={() => onQuickMatch('chess')}
          >
            <Text style={styles.quickEmoji}>♟️</Text>
            <View>
              <Text style={styles.quickTitle}>Quick Chess</Text>
              <Text style={styles.quickDesc}>FIDE rules 10m Blitz</Text>
            </View>
            <Ionicons name="flash" size={18} color="#06B6D4" style={styles.quickIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Game Showcase */}
      <Text style={styles.sectionTitle}>🎮 SELECT GAME ARENA</Text>

      {/* GAME 1: LUDO ROYALE */}
      <View style={[styles.gameCard, styles.ludoCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.gameIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Text style={styles.gameIconEmoji}>🎲</Text>
            </View>
            <View>
              <Text style={styles.cardGameName}>LUDO ROYALE</Text>
              <Text style={styles.cardGameTag}>Multiplayer Board Game • 2-4 Players</Text>
            </View>
          </View>
          <View style={[styles.hotBadge, { backgroundColor: COLORS.ludoRed }]}>
            <Text style={styles.hotBadgeText}>POPULAR</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          Roll 6 to launch tokens, cut opponents back to yard, conquer safe stars, and
          race all 4 tokens into the center home!
        </Text>

        {/* Action Modes */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.modeButton, styles.modeOnlineLudo]}
            onPress={onOpenLudoLobby}
          >
            <Ionicons name="people" size={18} color="#FFF" />
            <Text style={styles.modeButtonText}>Play with Friends (Online)</Text>
          </TouchableOpacity>

          <View style={styles.subModesRow}>
            <TouchableOpacity style={styles.subModeBtn} onPress={onStartBotLudo}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.subModeText}>Vs AI Bot</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subModeBtn} onPress={onStartLocalLudo}>
              <Ionicons name="phone-portrait-outline" size={16} color={COLORS.accent} />
              <Text style={styles.subModeText}>Pass & Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* GAME 2: CHESS MASTERS */}
      <View style={[styles.gameCard, styles.chessCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.gameIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
              <Text style={styles.gameIconEmoji}>♟️</Text>
            </View>
            <View>
              <Text style={styles.cardGameName}>CHESS MASTERS</Text>
              <Text style={styles.cardGameTag}>Grandmaster FIDE Rules • 1v1 Ranked</Text>
            </View>
          </View>
          <View style={[styles.hotBadge, { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.hotBadgeText, { color: '#000' }]}>CLASSIC</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          Tactical warfare! En passant, castling, pawn promotions, and deep strategic checkmates.
          Complete with chess clock timers.
        </Text>

        {/* Action Modes */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.modeButton, styles.modeOnlineChess]}
            onPress={onOpenChessLobby}
          >
            <Ionicons name="people" size={18} color="#000" />
            <Text style={[styles.modeButtonText, { color: '#000' }]}>
              Play with Friends (Online)
            </Text>
          </TouchableOpacity>

          <View style={styles.subModesRow}>
            <TouchableOpacity style={styles.subModeBtn} onPress={onStartBotChess}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.subModeText}>Vs AI Bot</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subModeBtn} onPress={onStartLocalChess}>
              <Ionicons name="phone-portrait-outline" size={16} color={COLORS.accent} />
              <Text style={styles.subModeText}>Pass & Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Social / Add Friends Promo Card */}
      <TouchableOpacity style={styles.socialCard} onPress={onOpenFriends}>
        <View style={styles.socialLeft}>
          <View style={styles.socialIconBox}>
            <Ionicons name="person-add" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.socialTitle}>Add & Invite Friends</Text>
            <Text style={styles.socialSub}>
              Share your Friend ID: {profile?.username}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroPre: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeEmoji: {
    fontSize: 28,
  },
  friendsBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  friendsBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendsBarTitle: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  friendsScroll: {
    flexDirection: 'row',
  },
  friendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    gap: 8,
  },
  friendPillAvatar: {
    fontSize: 20,
  },
  friendPillName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  friendPillStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  pillStatusText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  pillPlayBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillPlayText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickMatchSection: {
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  quickMatchGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  quickLudo: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  quickChess: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  quickEmoji: {
    fontSize: 24,
  },
  quickTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  quickDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  quickIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  gameCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 12,
  },
  ludoCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  chessCard: {
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIconEmoji: {
    fontSize: 24,
  },
  cardGameName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardGameTag: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  hotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardDescription: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 18,
  },
  cardActions: {
    gap: 8,
    marginTop: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modeOnlineLudo: {
    backgroundColor: COLORS.ludoRed,
  },
  modeOnlineChess: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  subModesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subModeBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  subModeText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  socialCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  socialSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
