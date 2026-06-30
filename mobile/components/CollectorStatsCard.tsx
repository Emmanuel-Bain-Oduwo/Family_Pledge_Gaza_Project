import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';

interface CollectorStatsCardProps {
  totalRegistered: number;
  contributedThisMonth: number;
  pending: number;
}

export default function CollectorStatsCard({
  totalRegistered,
  contributedThisMonth,
  pending,
}: CollectorStatsCardProps) {
  const progress = totalRegistered > 0 ? contributedThisMonth / totalRegistered : 0;
  const pct = Math.round(progress * 100);

  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>Your Circle</Text>
      <View style={styles.statsRow}>
        <StatChip icon="people" label="Total" value={totalRegistered} color={Colors.primary} />
        <StatChip icon="checkmark-circle" label="Paid" value={contributedThisMonth} color={Colors.success} />
        <StatChip icon="time" label="Pending" value={pending} color={Colors.warning} />
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Circle Progress</Text>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${pct}%` as any }]} />
        </View>
      </View>
    </AppCard>
  );
}

function StatChip({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '12' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  chipValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  chipLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  progressSection: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  pct: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  bar: {
    height: 10,
    backgroundColor: Colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
});
