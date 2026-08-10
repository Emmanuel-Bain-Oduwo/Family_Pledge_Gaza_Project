import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';
import { PledgeStatus } from '../types';

interface PledgeStatusCardProps {
  status: PledgeStatus;
  donorNumber?: number;
  totalDonors?: number;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<PledgeStatus, { label: string; color: string; bg: string; icon: string }> = {
  paid: { label: 'Paid', color: Colors.success, bg: '#ECFDF5', icon: 'checkmark-circle' },
  pending: { label: 'Pending', color: Colors.warning, bg: '#FFFBEB', icon: 'time' },
  missed: { label: 'Missed', color: Colors.emergency, bg: '#FEF2F2', icon: 'alert-circle' },
  free_participant: { label: 'Active', color: Colors.primary, bg: '#F0FDF4', icon: 'person' },
  none: { label: 'Start Pledge', color: Colors.primaryDark, bg: '#F0FDF4', icon: 'play-circle' },
};

export default function PledgeStatusCard({ status, donorNumber, totalDonors, onPress }: PledgeStatusCardProps) {
  const cfg = STATUS_CONFIG[status];
  const progress = donorNumber && totalDonors ? Math.min(donorNumber / totalDonors, 1) : 0;
  const pct = Math.round(progress * 100);

  return (
    <AppCard style={styles.card} padding={0}>
      <View style={styles.pledgeHeader}>
        <View>
          <Text style={styles.kicker}>Your Monthly Pledge</Text>
          <Text style={styles.amount}>Monthly <Text style={styles.period}>pledge</Text></Text>
        </View>
        <TouchableOpacity
          disabled={!onPress}
          onPress={onPress}
          activeOpacity={0.78}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={status === 'none' ? 'Start Family Pledge' : 'Open My Pledge'}
          style={[styles.statusPill, { backgroundColor: cfg.bg }, onPress && styles.statusPillClickable]}
        >
          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          {onPress && <Ionicons name="chevron-forward" size={13} color={cfg.color} />}
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.thanks}>Your contribution progress is shown as a percentage; admins verify the monthly amount securely.</Text>
        {status === 'none' && <Text style={styles.startHint}>Tap Start Pledge to review the voluntary pledge agreement and choose how you want to participate.</Text>}
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
  card: { marginHorizontal: 16, marginVertical: 8, overflow: 'hidden' },
  pledgeHeader: { backgroundColor: Colors.primary, padding: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  kicker: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  amount: { color: Colors.white, fontSize: 25, fontWeight: '900' },
  period: { fontSize: 17, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10 },
  statusPillClickable: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  statusText: { fontSize: 12, fontWeight: '900' },
  body: { padding: 16, backgroundColor: Colors.white },
  thanks: { fontSize: 12, color: Colors.text.secondary, fontWeight: '700' },
  startHint: { marginTop: 9, fontSize: 12, lineHeight: 18, color: Colors.primaryDark, fontWeight: '700' },
  donorBlock: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEF2EF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  donorMuted: { fontSize: 13, color: Colors.text.secondary, fontWeight: '700' },
  donorStrong: { marginTop: 3, fontSize: 18, color: Colors.black, fontWeight: '900' },
  ring: { width: 58, height: 58, borderRadius: 29, borderWidth: 7, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FBF8' },
  ringText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '900' },
});
