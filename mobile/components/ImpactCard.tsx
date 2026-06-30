import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';
import { ImpactCard as ImpactCardType } from '../types';

interface ImpactCardProps {
  impact: ImpactCardType;
  onPress?: () => void;
}

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  food: { icon: 'restaurant', color: '#F59E0B' },
  medical: { icon: 'medical', color: '#EF4444' },
  shelter: { icon: 'home', color: '#8B5CF6' },
  education: { icon: 'book', color: '#3B82F6' },
  water: { icon: 'water', color: '#06B6D4' },
  general: { icon: 'heart', color: Colors.primary },
};

export default function ImpactCard({ impact, onPress }: ImpactCardProps) {
  const cat = CATEGORY_ICONS[impact.category] || CATEGORY_ICONS.general;

  return (
    <AppCard onPress={onPress} style={styles.card}>
      {impact.image_url ? (
        <Image source={{ uri: impact.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: cat.color + '20' }]}>
          <Ionicons name={cat.icon as any} size={40} color={cat.color} />
        </View>
      )}
      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: cat.color + '15' }]}>
          <Ionicons name={cat.icon as any} size={12} color={cat.color} />
          <Text style={[styles.category, { color: cat.color }]}>
            {impact.category.charAt(0).toUpperCase() + impact.category.slice(1)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{impact.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{impact.description}</Text>
        {impact.beneficiaries && (
          <View style={styles.stat}>
            <Ionicons name="people" size={14} color={Colors.primary} />
            <Text style={styles.statText}>{impact.beneficiaries.toLocaleString()} beneficiaries</Text>
          </View>
        )}
        {impact.location && (
          <View style={styles.stat}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.statText}>{impact.location}</Text>
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
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
