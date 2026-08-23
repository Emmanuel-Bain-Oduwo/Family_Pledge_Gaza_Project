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
  submitted: { label: 'Processing', color: Colors.primary, bg: '#EFF6FF', icon: 'time' },
  needs_follow_up: { label: 'Needs Attention', color: Colors.warning, bg: '#FFFBEB', icon: 'alert-circle' },
  rejected: { label: 'Not Paid', color: Colors.emergency, bg: '#FEF2F2', icon: 'close-circle' },
  pending: { label: 'Pledge Active', color: Colors.warning, bg: '#FFFBEB', icon: 'heart-circle' },
  missed: { label: 'Not Paid', color: Colors.emergency, bg: '#FEF2F2', icon: 'alert-circle' },
  free_participant: { label: 'Pledge Active', color: Colors.primary, bg: '#F0FDF4', icon: 'person' },
  none: { label: 'Start Pledge', color: Colors.primaryDark, bg: '#F0FDF4', icon: 'play-circle' },
};

const STATUS_MESSAGE: Partial<Record<PledgeStatus, string>> = {
  paid: 'This month’s contribution has been received. May Allah SWT bless you more and grant you Jannatul Firdaus.',
  submitted: 'A payment is still being processed. Open My Pledge for the latest status and do not start another payment yet.',
  needs_follow_up: 'This month’s contribution has not been confirmed. Open My Pledge for the latest payment status.',
  rejected: 'No successful payment was confirmed. You can try again from My Pledge.',
  pending: 'Your voluntary Family Pledge is signed and active. You can complete this month’s payment when ready.',
  missed: 'Your pledge remains here for you. Open My Pledge when you are ready to continue.',
  free_participant: 'Your voluntary Family Pledge is signed and active. May Allah SWT accept your du’a and support for Gaza.',
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
        {status === 'none' ? (
          <Text style={styles.statusMessage}>Tap Start Pledge to review the voluntary pledge for helping our brothers and sisters in Gaza.</Text>
        ) : (
          <Text style={styles.statusMessage}>{STATUS_MESSAGE[status]}</Text>
        )}
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
  statusMessage: { fontSize: 12, lineHeight: 18, color: Colors.text.secondary, fontWeight: '700' },
  donorBlock: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEF2EF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  donorMuted: { fontSize: 13, color: Colors.text.secondary, fontWeight: '700' },
  donorStrong: { marginTop: 3, fontSize: 18, color: Colors.black, fontWeight: '900' },
  ring: { width: 58, height: 58, borderRadius: 29, borderWidth: 7, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FBF8' },
  ringText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '900' },
});
