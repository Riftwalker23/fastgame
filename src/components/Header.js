import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function Header({
  profile,
  isConnected,
  pendingRequestsCount = 0,
  onOpenFriends,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenDownload,
  isMuted,
  onToggleMute,
}) {
  return (
    <View style={styles.header}>
      {/* Brand */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="game-controller" size={20} color="#06B6D4" />
        </View>
        <View>
          <Text style={styles.brandTitle}>
            FAST<Text style={styles.brandAccent}>GAME</Text>
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? COLORS.success : COLORS.danger },
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? 'Server Online' : 'Connecting...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {/* Download on Mobile Button */}
        <TouchableOpacity style={styles.downloadHeaderBtn} onPress={onOpenDownload}>
          <Ionicons name="phone-portrait" size={15} color="#000" />
          <Text style={styles.downloadHeaderText}>Mobile</Text>
        </TouchableOpacity>

        {/* Mute Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onToggleMute}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {/* Leaderboard Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenLeaderboard}>
          <Ionicons name="trophy" size={20} color={COLORS.accent} />
        </TouchableOpacity>

        {/* Friends Button with Badge */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenFriends}>
          <Ionicons name="people" size={20} color={COLORS.primary} />
          {pendingRequestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity style={styles.profileBtn} onPress={onOpenProfile}>
          <Text style={styles.avatarText}>{profile?.avatar || '🎮'}</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.usernameText} numberOfLines={1}>
              {profile?.username || 'Player'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...(Platform.OS === 'web' ? { zIndex: 100 } : {}),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  downloadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  downloadHeaderText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 8,
    maxWidth: 140,
  },
  avatarText: {
    fontSize: 18,
  },
  profileInfo: {
    flexShrink: 1,
  },
  usernameText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
