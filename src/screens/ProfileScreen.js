import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { StorageService } from '../services/storage';

export default function ProfileScreen({ visible, onClose, profile, onSaveProfile }) {
  const [username, setUsername] = useState(profile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar || '🎮');
  const [isSaved, setIsSaved] = useState(false);

  const stats = profile?.stats || {
    chessWins: 0,
    chessLosses: 0,
    ludoWins: 0,
    ludoGames: 0,
  };

  const handleSave = () => {
    if (!username.trim()) return;
    const updated = {
      ...profile,
      username: username.trim(),
      avatar: selectedAvatar,
    };
    onSaveProfile(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="person-circle" size={24} color={COLORS.primary} />
              <Text style={styles.title}>Player Profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {/* Avatar Preview */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarLarge}>{selectedAvatar}</Text>
              </View>
              <Text style={styles.avatarHint}>Choose your Gamer Avatar:</Text>

              {/* Avatar Selector Grid */}
              <View style={styles.avatarGrid}>
                {StorageService.DEFAULT_AVATARS.map((av, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === av && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setSelectedAvatar(av)}
                  >
                    <Text style={styles.avItem}>{av}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Gamer Tag / Username:</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={COLORS.textMuted}
                maxLength={18}
              />
              <Text style={styles.idSub}>Account ID: {profile?.id}</Text>
            </View>

            {/* Stats Dashboard */}
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>Battle Records & Stats:</Text>
              <View style={styles.statsGrid}>
                {/* Chess Stats */}
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>♟️</Text>
                  <Text style={styles.statVal}>{stats.chessWins} Wins</Text>
                  <Text style={styles.statSub}>{stats.chessLosses} Losses</Text>
                  <Text style={styles.statGame}>Chess</Text>
                </View>

                {/* Ludo Stats */}
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>🎲</Text>
                  <Text style={styles.statVal}>{stats.ludoWins} Wins</Text>
                  <Text style={styles.statSub}>{stats.ludoGames} Matches</Text>
                  <Text style={styles.statGame}>Ludo</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name={isSaved ? 'checkmark-circle' : 'save'} size={20} color="#000" />
            <Text style={styles.saveBtnText}>
              {isSaved ? 'Profile Saved!' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
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
    maxWidth: 440,
    maxHeight: '90%',
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
    marginBottom: 16,
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
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flexShrink: 1,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLarge: {
    fontSize: 42,
  },
  avatarHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  avatarOption: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  avItem: {
    fontSize: 20,
  },
  inputWrap: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  idSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  statsSection: {
    marginBottom: 16,
  },
  statsTitle: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statVal: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  statSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statGame: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
  },
});
