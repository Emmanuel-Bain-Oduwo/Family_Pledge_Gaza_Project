import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Badge } from '../types';

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  bronze: Colors.badge.bronze,
  silver: Colors.badge.silver,
  gold: Colors.badge.gold,
  platinum: Colors.badge.platinum,
};

export default function BadgeCard({ badge, earned = !!badge.earned_at }: BadgeCardProps) {
  const tierColor = TIER_COLORS[badge.tier] || Colors.gold;

  return (
    <View style={[styles.card, !earned && styles.locked]}>
      <View style={[styles.iconCircle, { backgroundColor: tierColor + '25', borderColor: tierColor }]}>
        <Ionicons name={badge.icon as any} size={28} color={earned ? tierColor : Colors.gray[400]} />
      </View>
      <Text style={[styles.name, !earned && styles.lockedText]} numberOfLines={2}>
        {badge.name}
      </Text>
      <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
        <Text style={styles.tierText}>{badge.tier.toUpperCase()}</Text>
      </View>
      {!earned && <Text style={styles.lockIcon}>🔒</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  locked: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 6,
  },
  lockedText: {
    color: Colors.gray[400],
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 12,
  },
});
