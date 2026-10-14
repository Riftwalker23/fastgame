import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function RoomLobbyModal({
  visible,
  onClose,
  gameType, // 'ludo' | 'chess'
  room,
  currentUserId,
  onCreateRoom,
  onJoinRoom,
  onAddBot,
  onStartGame,
  onLeaveRoom,
}) {
  const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join', 'lobby'
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');

  const isLudo = gameType === 'ludo';
  const isHost = room?.hostId === currentUserId;
  const canStart = room && room.players.length >= 2;

  const handleJoin = () => {
    if (!roomCodeInput.trim()) {
      setErrorMsg('Please enter a room code');
      return;
    }
    setErrorMsg('');
    onJoinRoom(roomCodeInput.trim());
  };

  const handleCreate = () => {
    onCreateRoom({
      gameType,
      maxPlayers: isLudo ? maxPlayers : 2,
      isPrivate: true,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.gameBadge}>{isLudo ? '🎲' : '♟️'}</Text>
              <Text style={styles.title}>
                {room ? `Room: ${room.id}` : `${isLudo ? 'Ludo' : 'Chess'} Lobby`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (room) onLeaveRoom();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* If NOT inside a room yet */}
          {!room && (
            <View style={styles.body}>
              <Text style={styles.subtitle}>
                Play online with friends or players around the world
              </Text>

              {/* Ludo Player count selector */}
              {isLudo && (
                <View style={styles.selectorWrap}>
                  <Text style={styles.selectorLabel}>Select Players:</Text>
                  <View style={styles.selectorRow}>
                    <TouchableOpacity
                      style={[styles.selOption, maxPlayers === 2 && styles.selOptionActive]}
                      onPress={() => setMaxPlayers(2)}
                    >
                      <Text
                        style={[
                          styles.selOptionText,
                          maxPlayers === 2 && styles.selOptionTextActive,
                        ]}
                      >
                        2 Players (1v1)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.selOption, maxPlayers === 4 && styles.selOptionActive]}
                      onPress={() => setMaxPlayers(4)}
                    >
                      <Text
                        style={[
                          styles.selOptionText,
                          maxPlayers === 4 && styles.selOptionTextActive,
                        ]}
                      >
                        4 Players (Classic)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Create Room Button */}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
                <Ionicons name="add-circle" size={22} color="#000" />
                <Text style={styles.primaryBtnText}>Create Private Room</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR JOIN BY CODE</Text>
                <View style={styles.divider} />
              </View>

              {/* Join By Code */}
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Code (e.g. LUDO-9A2B)"
                  placeholderTextColor={COLORS.textMuted}
                  value={roomCodeInput}
                  onChangeText={(val) => setRoomCodeInput(val.toUpperCase())}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              </View>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            </View>
          )}

          {/* If INSIDE a room (Waiting Lobby) */}
          {room && (
            <View style={styles.body}>
              {/* Room Code Banner */}
              <View style={styles.codeBanner}>
                <Text style={styles.codeBannerLabel}>ROOM CODE (SHARE WITH FRIEND):</Text>
                <Text style={styles.codeBannerText} selectTextOnFocus>
                  {room.id}
                </Text>
                <Text style={styles.codeBannerHint}>
                  {room.players.length}/{room.maxPlayers} Players Joined
                </Text>
              </View>

              {/* Players List */}
              <Text style={styles.playersTitle}>Lobby Members:</Text>
              <View style={styles.playersList}>
                {room.players.map((p, idx) => (
                  <View key={p.id} style={styles.playerItem}>
                    <View style={styles.playerLeft}>
                      <Text style={styles.playerAvatar}>{p.avatar}</Text>
                      <View>
                        <Text style={styles.playerName}>
                          {p.username} {p.id === currentUserId ? '(You)' : ''}
                        </Text>
                        <Text style={styles.playerRole}>
                          {p.id === room.hostId ? '👑 Room Host' : p.isBot ? '🤖 AI Bot' : 'Player'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyText}>Ready</Text>
                    </View>
                  </View>
                ))}

                {/* Empty slots */}
                {Array.from({ length: room.maxPlayers - room.players.length }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>Slot open for opponent...</Text>
                  </View>
                ))}
              </View>

              {/* Bot Option & Start Button for Host */}
              <View style={styles.lobbyActions}>
                {isHost && room.players.length < room.maxPlayers && (
                  <TouchableOpacity style={styles.addBotBtn} onPress={onAddBot}>
                    <Ionicons name="hardware-chip-outline" size={18} color={COLORS.secondary} />
                    <Text style={styles.addBotText}>+ Add AI Bot to Play Now</Text>
                  </TouchableOpacity>
                )}

                {isHost ? (
                  <TouchableOpacity
                    style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                    disabled={!canStart}
                    onPress={() => onStartGame(room.id)}
                  >
                    <Ionicons name="play" size={20} color={canStart ? '#000' : COLORS.textMuted} />
                    <Text
                      style={[
                        styles.startBtnText,
                        !canStart && styles.startBtnTextDisabled,
                      ]}
                    >
                      {canStart ? 'Start Match Now' : 'Waiting for Players...'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.guestWaiting}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.guestWaitingText}>
                      Waiting for host to start the game...
                    </Text>
                  </View>
                )}
              </View>
            </View>
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
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gameBadge: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 16,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  selectorWrap: {
    gap: 8,
  },
  selectorLabel: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selOption: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  selOptionActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: COLORS.primary,
  },
  selOptionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  selOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  codeBanner: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  codeBannerLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  codeBannerText: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  codeBannerHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  playersTitle: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: 'bold',
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerAvatar: {
    fontSize: 22,
  },
  playerName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  playerRole: {
    color: COLORS.accent,
    fontSize: 11,
  },
  readyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readyText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptySlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  emptySlotText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  lobbyActions: {
    marginTop: 8,
    gap: 10,
  },
  addBotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBotText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startBtnDisabled: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  startBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
  },
  startBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  guestWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  guestWaitingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
