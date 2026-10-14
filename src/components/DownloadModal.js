import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function DownloadModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('pwa'); // 'pwa', 'expogo', 'apk'
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== 'undefined' && window.location ? window.location.href : 'https://fastgame.vercel.app';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.phoneBadge}>
                <Ionicons name="phone-portrait" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.title}>Play on Mobile</Text>
                <Text style={styles.subTitle}>FastGame is cross-platform for Android & iOS</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'pwa' && styles.tabItemActive]}
              onPress={() => setActiveTab('pwa')}
            >
              <Text style={[styles.tabText, activeTab === 'pwa' && styles.tabTextActive]}>
                ⚡ Instant App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'expogo' && styles.tabItemActive]}
              onPress={() => setActiveTab('expogo')}
            >
              <Text style={[styles.tabText, activeTab === 'expogo' && styles.tabTextActive]}>
                🚀 Expo Go
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'apk' && styles.tabItemActive]}
              onPress={() => setActiveTab('apk')}
            >
              <Text style={[styles.tabText, activeTab === 'apk' && styles.tabTextActive]}>
                📦 Android APK
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* TAB 1: PWA (ADD TO HOME SCREEN) */}
            {activeTab === 'pwa' && (
              <View style={styles.section}>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightBadge}>RECOMMENDED • 0s INSTALL</Text>
                  <Text style={styles.highlightTitle}>Install Directly to Home Screen</Text>
                  <Text style={styles.highlightDesc}>
                    FastGame works in full-screen on your phone like a native app without going
                    through app stores.
                  </Text>
                </View>

                {/* Instructions per OS */}
                <View style={styles.guideBlock}>
                  <View style={styles.osHeader}>
                    <Ionicons name="logo-apple" size={18} color="#FFF" />
                    <Text style={styles.osTitle}>For iPhone & iPad (Safari):</Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>1</Text>
                    <Text style={styles.stepText}>Open this site in Safari on your iPhone</Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>2</Text>
                    <Text style={styles.stepText}>
                      Tap the <Text style={styles.boldText}>Share button</Text> (square with arrow up ⎋)
                    </Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>3</Text>
                    <Text style={styles.stepText}>
                      Scroll down and tap <Text style={styles.boldText}>"Add to Home Screen"</Text> ⊞
                    </Text>
                  </View>
                </View>

                <View style={styles.guideBlock}>
                  <View style={styles.osHeader}>
                    <Ionicons name="logo-android" size={18} color="#10B981" />
                    <Text style={styles.osTitle}>For Android (Chrome):</Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>1</Text>
                    <Text style={styles.stepText}>Open this site in Google Chrome</Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>2</Text>
                    <Text style={styles.stepText}>
                      Tap the <Text style={styles.boldText}>Menu button</Text> (3 dots ⋮ top right)
                    </Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>3</Text>
                    <Text style={styles.stepText}>
                      Tap <Text style={styles.boldText}>"Install App"</Text> or <Text style={styles.boldText}>"Add to Home screen"</Text>
                    </Text>
                  </View>
                </View>

                {/* Copy Link to phone */}
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={18}
                    color="#000"
                  />
                  <Text style={styles.copyBtnText}>
                    {copied ? 'Link Copied to Clipboard!' : 'Copy Link to Open on Mobile'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 2: EXPO GO */}
            {activeTab === 'expogo' && (
              <View style={styles.section}>
                <View style={styles.guideBlock}>
                  <Text style={styles.blockTitle}>Run with Expo Go (Official Tool)</Text>
                  <Text style={styles.blockDesc}>
                    Expo Go lets you run the React Native native code instantly on physical iOS or
                    Android devices.
                  </Text>

                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>1</Text>
                    <Text style={styles.stepText}>
                      Install <Text style={styles.boldText}>Expo Go</Text> from Google Play or Apple App Store.
                    </Text>
                  </View>

                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>2</Text>
                    <Text style={styles.stepText}>
                      Clone the repo and run <Text style={styles.codeText}>npm start</Text> in your terminal.
                    </Text>
                  </View>

                  <View style={styles.stepRow}>
                    <Text style={styles.stepNum}>3</Text>
                    <Text style={styles.stepText}>
                      Scan the QR code displayed in the terminal with the Expo Go camera!
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: STANDALONE APK */}
            {activeTab === 'apk' && (
              <View style={styles.section}>
                <View style={styles.guideBlock}>
                  <Text style={styles.blockTitle}>Build Android APK (.apk file)</Text>
                  <Text style={styles.blockDesc}>
                    You can generate a standalone Android APK that installs directly on any Android phone without app stores.
                  </Text>

                  <View style={styles.codeBox}>
                    <Text style={styles.codeLine}># 1. Install EAS CLI</Text>
                    <Text style={styles.codeLine}>npm install -g eas-cli</Text>
                    <Text style={styles.codeLine}># 2. Build standalone APK</Text>
                    <Text style={styles.codeLine}>eas build -p android --profile preview</Text>
                  </View>

                  <Text style={styles.noteText}>
                    EAS compiles the APK in the cloud and provides a direct download link for your phone!
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
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
    maxWidth: 520,
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
    gap: 12,
  },
  phoneBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
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
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    gap: 12,
    paddingBottom: 10,
  },
  section: {
    gap: 12,
  },
  highlightCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    padding: 16,
  },
  highlightBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  highlightTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  highlightDesc: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 18,
  },
  guideBlock: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8,
  },
  osHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  osTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepText: {
    color: COLORS.textLight,
    fontSize: 13,
    flex: 1,
  },
  boldText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  blockTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  blockDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  codeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 6,
  },
  codeLine: {
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginVertical: 2,
  },
  codeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  noteText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  copyBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});
