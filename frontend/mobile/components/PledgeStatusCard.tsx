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
  paid: { label: 'Paid', color: Colors.success, bg: '#ECFDF5', icon: 'checkmark-circle' },
  pending: { label: 'Pending', color: Colors.warning, bg: '#FFFBEB', icon: 'time' },
  missed: { label: 'Missed', color: Colors.emergency, bg: '#FEF2F2', icon: 'alert-circle' },
  free_participant: { label: 'Active', color: Colors.primary, bg: '#F0FDF4', icon: 'person' },
  none: { label: 'Start', color: Colors.gray[500], bg: Colors.gray[100], icon: 'ellipse-outline' },
};

export default function PledgeStatusCard({ status, donorNumber, totalDonors }: PledgeStatusCardProps) {
  const cfg = STATUS_CONFIG[status];
  const progress = donorNumber && totalDonors ? Math.min(donorNumber / totalDonors, 1) : 0;
  const pct = Math.round(progress * 100);

  return (
    <AppCard style={styles.card} padding={0}>
      <View style={styles.pledgeHeader}>
        <View>
          <Text style={styles.kicker}>Your Monthly Pledge</Text>
          <Text style={styles.amount}>$10 <Text style={styles.period}>/ month</Text></Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.thanks}>Thank you for your support!</Text>
        {donorNumber && totalDonors && (
          <View style={styles.donorBlock}>
            <View>
              <Text style={styles.donorMuted}>You are donor</Text>
              <Text style={styles.donorStrong}>#{donorNumber} of {totalDonors} today</Text>
            </View>
            <View style={styles.ring}>
              <Text style={styles.ringText}>{pct}%</Text>
            </View>
          </View>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  pledgeHeader: {
    backgroundColor: Colors.primary,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  kicker: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  amount: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: '900',
  },
  period: {
    fontSize: 17,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  body: {
    padding: 16,
    backgroundColor: Colors.white,
  },
  thanks: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '700',
  },
  donorBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donorMuted: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '700',
  },
  donorStrong: {
    marginTop: 3,
    fontSize: 18,
    color: Colors.black,
    fontWeight: '900',
  },
  ring: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 7,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBF8',
  },
  ringText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
  },
});
