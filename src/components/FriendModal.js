import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function FriendModal({
  visible,
  onClose,
  friends = [],
  incomingRequests = [],
  searchResults = [],
  onSearch,
  onSendRequest,
  onRespondRequest,
  onRemoveFriend,
  onChallengeFriend,
  userProfile,
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSend = () => {
    if (!searchQuery.trim()) return;
    onSendRequest(searchQuery.trim());
    setFeedbackMsg(`Friend request sent for "${searchQuery}"`);
    setTimeout(() => setFeedbackMsg(''), 3000);
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.title}>Friends & Social</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Player Friend Code / Share info */}
          <View style={styles.myCodeCard}>
            <Text style={styles.myCodeLabel}>Your Friend ID (Share with friends):</Text>
            <View style={styles.myCodeRow}>
              <Text style={styles.myCodeText} selectTextOnFocus>
                {userProfile?.username}
              </Text>
              <Text style={styles.myCodeSub}>ID: {userProfile?.id?.slice(-8)}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
              onPress={() => setActiveTab('list')}
            >
              <Text
                style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}
              >
                Friends ({friends.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'add' && styles.tabItemActive]}
              onPress={() => setActiveTab('add')}
            >
              <Text
                style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}
              >
                Add Friend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Text
                style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}
              >
                Requests {incomingRequests.length > 0 ? `(${incomingRequests.length})` : ''}
              </Text>
              {incomingRequests.length > 0 && <View style={styles.tabBadge} />}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* TAB 1: FRIENDS LIST */}
            {activeTab === 'list' && (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="person-add-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No friends added yet!</Text>
                    <Text style={styles.emptySubText}>
                      Share your username or add friends to play Ludo & Chess together.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyBtn}
                      onPress={() => setActiveTab('add')}
                    >
                      <Text style={styles.emptyBtnText}>Add a Friend</Text>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.friendCard}>
                    <View style={styles.friendLeft}>
                      <View style={styles.avatarWrap}>
                        <Text style={styles.friendAvatar}>{item.avatar || '🎮'}</Text>
                        <View
                          style={[
                            styles.onlineDot,
                            { backgroundColor: item.online ? COLORS.success : COLORS.textMuted },
                          ]}
                        />
                      </View>
                      <View>
                        <Text style={styles.friendName}>{item.username}</Text>
                        <Text style={styles.friendStatus}>
                          {item.online ? 'Online now' : 'Offline'}
                          {item.stats
                            ? ` • ♟️ ${item.stats.chessWins}W | 🎲 ${item.stats.ludoWins}W`
                            : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Challenge Buttons */}
                    <View style={styles.friendActions}>
                      <TouchableOpacity
                        style={[styles.challengeBtn, styles.ludoBtn]}
                        onPress={() => onChallengeFriend(item.id, 'ludo')}
                      >
                        <Text style={styles.challengeBtnText}>🎲 Ludo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.challengeBtn, styles.chessBtn]}
                        onPress={() => onChallengeFriend(item.id, 'chess')}
                      >
                        <Text style={styles.challengeBtnText}>♟️ Chess</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => onRemoveFriend(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            {/* TAB 2: ADD FRIEND */}
            {activeTab === 'add' && (
              <View style={styles.addSection}>
                <Text style={styles.sectionLabel}>Search by Username or Player ID:</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter friend's username..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={(val) => {
                      setSearchQuery(val);
                      onSearch(val);
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.searchSendBtn} onPress={handleSend}>
                    <Ionicons name="paper-plane" size={18} color="#FFF" />
                    <Text style={styles.sendBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {feedbackMsg ? (
                  <Text style={styles.feedbackText}>{feedbackMsg}</Text>
                ) : null}

                {/* Instant Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.resultsWrap}>
                    <Text style={styles.resultsTitle}>Matching Players:</Text>
                    {searchResults.map((usr) => (
                      <View key={usr.id} style={styles.searchResultItem}>
                        <View style={styles.resultUserRow}>
                          <Text style={styles.resAvatar}>{usr.avatar}</Text>
                          <View>
                            <Text style={styles.resName}>{usr.username}</Text>
                            <Text style={styles.resSub}>
                              {usr.online ? '🟢 Online' : '⚪ Offline'}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.addResultBtn}
                          onPress={() => {
                            onSendRequest(usr.username);
                            setFeedbackMsg(`Friend request sent to ${usr.username}!`);
                            setTimeout(() => setFeedbackMsg(''), 3000);
                          }}
                        >
                          <Ionicons name="person-add" size={14} color="#FFF" />
                          <Text style={styles.addResultBtnText}>Invite</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: INCOMING REQUESTS */}
            {activeTab === 'requests' && (
              <FlatList
                data={incomingRequests}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="mail-open-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No pending requests</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.requestCard}>
                    <View style={styles.requestLeft}>
                      <Text style={styles.reqAvatar}>{item.avatar || '🎮'}</Text>
                      <View>
                        <Text style={styles.reqName}>{item.username}</Text>
                        <Text style={styles.reqSub}>wants to be your friend!</Text>
                      </View>
                    </View>
                    <View style={styles.reqActions}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => onRespondRequest(item.id, true)}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.reqBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => onRespondRequest(item.id, false)}
                      >
                        <Ionicons name="close" size={16} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    overflow: 'hidden',
  },
  modalHeader: {
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
  myCodeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  myCodeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  myCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myCodeText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  myCodeSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  content: {
    flex: 1,
    minHeight: 280,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  emptyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  friendCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  friendAvatar: {
    fontSize: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  friendName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  friendStatus: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  ludoBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  chessBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  challengeBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  removeBtn: {
    padding: 6,
  },
  addSection: {
    paddingTop: 8,
  },
  sectionLabel: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchRow: {
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
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  searchSendBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sendBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  feedbackText: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  resultsWrap: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultsTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resAvatar: {
    fontSize: 22,
  },
  resName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  resSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  addResultBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addResultBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reqAvatar: {
    fontSize: 26,
  },
  reqName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reqSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  reqActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  declineBtn: {
    backgroundColor: COLORS.surfaceLight,
    padding: 8,
    borderRadius: 8,
  },
  reqBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
