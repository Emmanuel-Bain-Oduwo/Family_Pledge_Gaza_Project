import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Campaign } from '../types';

interface EmergencyBannerProps {
  campaign: Campaign;
  onPress?: () => void;
}

export default function EmergencyBanner({ campaign, onPress }: EmergencyBannerProps) {
  const progress = Math.min(campaign.current_donors / campaign.target_donors, 1);
  const pct = Math.round(progress * 100);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="alert-circle" size={20} color={Colors.white} />
        <Text style={styles.urgentTag}>EMERGENCY APPEAL</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{campaign.title}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.donorCount}>
          {campaign.current_donors.toLocaleString()} / {campaign.target_donors.toLocaleString()} donors
        </Text>
        <Text style={styles.action}>Respond Now →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.emergency,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  urgentTag: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  title: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  pct: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donorCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  action: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
