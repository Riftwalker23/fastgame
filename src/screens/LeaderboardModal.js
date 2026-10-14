import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import socketService from '../services/socket';

export default function LeaderboardModal({ visible, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);

    fetch(`${socketService.serverUrl}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch((err) => {
        console.warn('Leaderboard fetch failed, using fallback:', err);
        // Fallback demo champions if server not yet populated
        setLeaderboard([
          {
            id: '1',
            username: 'Grandmaster_V',
            avatar: '👑',
            chessWins: 42,
            ludoWins: 18,
            score: 1110,
          },
          {
            id: '2',
            username: 'NeonDiceKing',
            avatar: '🎲',
            chessWins: 24,
            ludoWins: 35,
            score: 1005,
          },
          {
            id: '3',
            username: 'CyberStriker',
            avatar: '⚡',
            chessWins: 29,
            ludoWins: 20,
            score: 880,
          },
          {
            id: '4',
            username: 'ShadowRook',
            avatar: '♟️',
            chessWins: 22,
            ludoWins: 15,
            score: 665,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [visible]);

  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="trophy" size={24} color={COLORS.accent} />
              <Text style={styles.title}>Hall of Champions</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Top players ranked by Chess & Ludo victories
          </Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.rankItem,
                    index === 0 && styles.firstRank,
                    index === 1 && styles.secondRank,
                    index === 2 && styles.thirdRank,
                  ]}
                >
                  <View style={styles.rankLeft}>
                    <Text style={styles.rankBadge}>{getRankBadge(index)}</Text>
                    <Text style={styles.avatar}>{item.avatar}</Text>
                    <View>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.statsSub}>
                        ♟️ {item.chessWins} Chess W • 🎲 {item.ludoWins} Ludo W
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rankRight}>
                    <Text style={styles.points}>{item.score || 0}</Text>
                    <Text style={styles.pointsLabel}>PTS</Text>
                  </View>
                </View>
              )}
            />
          )}
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
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  closeBtn: {
    padding: 6,
  },
  loadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  list: {
    marginVertical: 4,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  firstRank: {
    borderColor: 'rgba(245, 158, 11, 0.6)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  secondRank: {
    borderColor: 'rgba(203, 213, 225, 0.5)',
  },
  thirdRank: {
    borderColor: 'rgba(205, 127, 50, 0.5)',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 28,
    textAlign: 'center',
  },
  avatar: {
    fontSize: 24,
  },
  username: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  rankRight: {
    alignItems: 'flex-end',
  },
  points: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  pointsLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
