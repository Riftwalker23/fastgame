import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function GameTopBar({ title, color = COLORS.primary, onBack, right }) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={10}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.badgeText, { color }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function DPad({ onDirection, color = COLORS.primary }) {
  const Btn = ({ dir, icon }) => (
    <TouchableOpacity
      style={[styles.padBtn, { borderColor: color }]}
      onPress={() => onDirection(dir)}
      activeOpacity={0.6}
    >
      <Ionicons name={icon} size={26} color={color} />
    </TouchableOpacity>
  );
  return (
    <View style={styles.pad}>
      <Btn dir="up" icon="chevron-up" />
      <View style={styles.padRow}>
        <Btn dir="left" icon="chevron-back" />
        <View style={styles.padGap} />
        <Btn dir="right" icon="chevron-forward" />
      </View>
      <Btn dir="down" icon="chevron-down" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 64 },
  backText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  badge: {
    flexShrink: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.card,
  },
  badgeText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  right: { minWidth: 64, alignItems: 'flex-end' },
  pad: { alignItems: 'center', gap: 6 },
  padRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  padGap: { width: 56, height: 56 },
  padBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
