import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';
import { PledgeStatus } from '../types';

interface PledgeStatusCardProps {
  status: PledgeStatus;
  donorNumber?: number;
  totalDonors?: number;
  onContribute?: () => void;
}

const STATUS_CONFIG: Record<PledgeStatus, { label: string; color: string; bg: string; icon: string }> = {
  paid: { label: 'Pledge Fulfilled ✓', color: Colors.success, bg: '#ECFDF5', icon: 'checkmark-circle' },
  pending: { label: 'Contribution Pending', color: Colors.warning, bg: '#FFFBEB', icon: 'time' },
  missed: { label: 'Missed This Month', color: Colors.emergency, bg: '#FEF2F2', icon: 'alert-circle' },
  free_participant: { label: 'Free Participant', color: Colors.primary, bg: '#F0FDF4', icon: 'person' },
  none: { label: 'No Active Pledge', color: Colors.gray[500], bg: Colors.gray[100], icon: 'ellipse-outline' },
};

export default function PledgeStatusCard({ status, donorNumber, totalDonors }: PledgeStatusCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <AppCard style={[styles.card, { backgroundColor: cfg.bg }]} borderColor={cfg.color}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: cfg.color + '22' }]}>
          <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Monthly Pledge — USD 10</Text>
          <Text style={[styles.status, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      {donorNumber && totalDonors && (
        <View style={styles.donorRow}>
          <Ionicons name="people" size={14} color={Colors.text.secondary} />
          <Text style={styles.donorText}>
            You are donor <Text style={styles.donorNum}>#{donorNumber}</Text> of{' '}
            <Text style={styles.donorNum}>{totalDonors}</Text> today
          </Text>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  status: {
    fontSize: 16,
    fontWeight: '700',
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: 6,
  },
  donorText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  donorNum: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
