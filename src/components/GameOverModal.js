import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function GameOverModal({
  visible,
  winner,
  reason,
  gameType,
  currentUserId,
  onPlayAgain,
  onExit,
}) {
  if (!visible) return null;

  const isLudo = gameType === 'ludo';
  const isWinner = winner && winner.id === currentUserId;
  const isDraw = !winner;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Trophy Header */}
          <View
            style={[
              styles.trophyWrap,
              { backgroundColor: isWinner ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 182, 212, 0.2)' },
            ]}
          >
            <Text style={styles.trophyEmoji}>
              {isDraw ? '🤝' : isWinner ? '🏆' : '🎖️'}
            </Text>
          </View>

          <Text style={styles.title}>
            {isDraw ? 'Game Drawn!' : isWinner ? 'Victory!' : 'Game Over'}
          </Text>

          <Text style={styles.subtitle}>
            {reason ||
              (isWinner
                ? 'Congratulations! You won the match!'
                : `${winner?.username || 'Opponent'} won the match.`)}
          </Text>

          {/* Winner profile */}
          {winner && (
            <View style={styles.winnerCard}>
              <Text style={styles.winnerAvatar}>{winner.avatar || '🎮'}</Text>
              <View>
                <Text style={styles.winnerLabel}>Champion</Text>
                <Text style={styles.winnerName}>{winner.username}</Text>
              </View>
            </View>
          )}

          {/* XP & Stats */}
          <View style={styles.rewardRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardVal}>{isWinner ? '+25' : isDraw ? '+10' : '+5'}</Text>
              <Text style={styles.rewardLabel}>Rating XP</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardVal}>{isWinner ? '1 Win' : '0'}</Text>
              <Text style={styles.rewardLabel}>Recorded</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
              <Text style={styles.exitText}>Exit to Lobby</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.againBtn} onPress={onPlayAgain}>
              <Ionicons name="refresh" size={18} color="#000" />
              <Text style={styles.againText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  trophyWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trophyEmoji: {
    fontSize: 42,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  winnerAvatar: {
    fontSize: 28,
  },
  winnerLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  winnerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardVal: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  rewardLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rewardDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  exitBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  exitText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  againBtn: {
    flex: 1.4,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  againText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
});
