import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function ChallengeModal({ challenge, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(25);

  useEffect(() => {
    if (!challenge) return;
    setTimeLeft(25);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline(challenge.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  if (!challenge) return null;

  const isLudo = challenge.gameType === 'ludo';

  return (
    <Modal visible={!!challenge} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Game Type Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isLudo ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)' },
            ]}
          >
            <Text style={styles.gameIcon}>{isLudo ? '🎲' : '♟️'}</Text>
          </View>

          <Text style={styles.title}>Match Challenge!</Text>

          <View style={styles.userBox}>
            <Text style={styles.userAvatar}>{challenge.fromUser?.avatar || '🎮'}</Text>
            <Text style={styles.username}>{challenge.fromUser?.username}</Text>
            <Text style={styles.subtext}>
              has challenged you to a live {isLudo ? 'Ludo' : 'Chess'} match!
            </Text>
          </View>

          {/* Countdown timer */}
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.accent} />
            <Text style={styles.timerText}>Auto-declining in {timeLeft}s</Text>
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => onDecline(challenge.id)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptBtn,
                { backgroundColor: isLudo ? COLORS.ludoRed : COLORS.primary },
              ]}
              onPress={() => onAccept(challenge.id)}
            >
              <Text style={styles.acceptText}>Accept & Play</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    fontSize: 36,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  userAvatar: {
    fontSize: 40,
    marginBottom: 6,
  },
  username: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timerText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  declineText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  acceptText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
});
