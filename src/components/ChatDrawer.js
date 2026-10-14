import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const QUICK_EMOTES = [
  { text: 'Good luck! 🍀', icon: '🍀' },
  { text: 'Well played! 👏', icon: '👏' },
  { text: 'Oops! 😅', icon: '😅' },
  { text: 'GG! 🔥', icon: '🔥' },
  { text: 'Hurry up! ⏳', icon: '⏳' },
  { text: 'Nice move! 🎯', icon: '🎯' },
  { text: 'Thinking... 🧠', icon: '🧠' },
];

export default function ChatDrawer({ visible, onClose, messages = [], onSendMessage, currentUserId }) {
  const [inputText, setInputText] = useState('');

  const handleSend = (text) => {
    const toSend = text || inputText;
    if (!toSend.trim()) return;
    onSendMessage(toSend.trim());
    setInputText('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
              <Text style={styles.title}>Match Chat & Emotes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Emotes Bar */}
          <View style={styles.emotesWrap}>
            <Text style={styles.emotesLabel}>Quick Emotes:</Text>
            <View style={styles.emotesRow}>
              {QUICK_EMOTES.map((em, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.emotePill}
                  onPress={() => handleSend(em.text)}
                >
                  <Text style={styles.emoteText}>{em.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message List */}
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.msgList}
            contentContainerStyle={styles.msgListContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No messages yet. Send a quick emote or chat!</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.user.id === currentUserId;
              return (
                <View
                  style={[
                    styles.msgBubbleWrap,
                    isMe ? styles.msgBubbleRight : styles.msgBubbleLeft,
                  ]}
                >
                  <View style={styles.senderHeader}>
                    <Text style={styles.senderAvatar}>{item.user.avatar}</Text>
                    <Text style={styles.senderName}>{isMe ? 'You' : item.user.username}</Text>
                  </View>
                  <View
                    style={[
                      styles.msgBubble,
                      isMe ? styles.msgBubbleMe : styles.msgBubbleOther,
                    ]}
                  >
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Input Bar */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type message..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
              <Ionicons name="send" size={18} color="#000" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '75%',
    minHeight: '50%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 6,
  },
  emotesWrap: {
    marginBottom: 10,
  },
  emotesLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emotesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotePill: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  emoteText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  msgList: {
    flex: 1,
    marginVertical: 8,
  },
  msgListContent: {
    gap: 10,
  },
  emptyWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  msgBubbleWrap: {
    maxWidth: '80%',
  },
  msgBubbleLeft: {
    alignSelf: 'flex-start',
  },
  msgBubbleRight: {
    alignSelf: 'flex-end',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  senderAvatar: {
    fontSize: 12,
  },
  senderName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  msgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  msgBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleOther: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    color: COLORS.text,
    fontSize: 14,
  },
  msgTextMe: {
    color: '#000',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
