import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';
import { Campaign } from '../types';

interface CampaignProgressCardProps {
  campaign: Campaign;
  onPress?: () => void;
  onContribute?: () => void;
  compact?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  friday_challenge: Colors.gold,
  emergency: Colors.emergency,
  monthly: Colors.primary,
  general: Colors.primaryLight,
};

const TYPE_LABELS: Record<string, string> = {
  friday_challenge: 'Friday Challenge',
  emergency: '🚨 Emergency',
  monthly: 'Monthly',
  general: 'General',
};

export default function CampaignProgressCard({
  campaign,
  onPress,
  onContribute,
  compact = false,
}: CampaignProgressCardProps) {
  const accentColor = TYPE_COLORS[campaign.type] || Colors.primary;
  const progress = Math.min(campaign.current_donors / campaign.target_donors, 1);
  const pct = Math.round(progress * 100);

  return (
    <AppCard onPress={onPress} borderColor={accentColor} style={styles.card}>
      {campaign.image_url && (
        <Image
          source={{ uri: campaign.image_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.typeLabel, { color: accentColor }]}>
              {TYPE_LABELS[campaign.type]}
            </Text>
          </View>
          {campaign.is_urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>{campaign.title}</Text>

        {!compact && (
          <Text style={styles.description} numberOfLines={2}>{campaign.description}</Text>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              <Text style={[styles.progressCount, { color: accentColor }]}>{campaign.current_donors}</Text>
              {' '}/ {campaign.target_donors} donors
            </Text>
            <Text style={[styles.pct, { color: accentColor }]}>{pct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: accentColor }]}
            />
          </View>
        </View>

        {onContribute && (
          <TouchableOpacity
            onPress={onContribute}
            activeOpacity={0.8}
            style={[styles.contributeBtn, { backgroundColor: accentColor }]}
          >
            <Ionicons name="heart" size={14} color={Colors.white} />
            <Text style={styles.contributeBtnText}>Contribute</Text>
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 0,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 140,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    backgroundColor: Colors.emergency,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgentText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  progressSection: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  progressCount: {
    fontWeight: '700',
  },
  pct: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  contributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contributeBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
