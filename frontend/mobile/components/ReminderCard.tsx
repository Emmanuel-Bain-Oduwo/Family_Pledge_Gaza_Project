import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';
import { Reminder } from '../types';
import { shareText } from '../services/webCompat';

interface ReminderCardProps {
  reminder: Reminder;
  onPress?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  quran: { label: 'Quran', color: Colors.primaryDark, bg: '#EDF7F0' },
  hadith: { label: 'Hadith', color: '#7C3AED', bg: '#F5F3FF' },
  dua: { label: 'Du\'a', color: Colors.primary, bg: '#F0FDF4' },
  motivation: { label: 'Motivation', color: Colors.gold, bg: '#FFFBEB' },
  friday: { label: 'Jumu\'ah', color: Colors.goldLight, bg: '#FFFDF0' },
};

export default function ReminderCard({ reminder, onPress }: ReminderCardProps) {
  const cfg = TYPE_CONFIG[reminder.type] || TYPE_CONFIG.motivation;

  const handleShare = async () => {
    await shareText(`${reminder.arabic_text ? reminder.arabic_text + '\n\n' : ''}${reminder.text}${reminder.source_reference ? '\n\n— ' + reminder.source_reference : ''}\n\nFamily Pledge for Gaza 🌙`, 'Reminder');
  };

  return (
    <AppCard onPress={onPress} style={[styles.card, { backgroundColor: cfg.bg }]} borderColor={cfg.color}>
      {reminder.image_url && (
        <Image
          source={{ uri: reminder.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.color }]}>
            <Text style={styles.typeLabel}>{cfg.label}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={20} color={cfg.color} />
          </TouchableOpacity>
        </View>

        {reminder.arabic_text && (
          <Text style={[styles.arabic, { color: cfg.color }]}>{reminder.arabic_text}</Text>
        )}

        <Text style={styles.text}>{reminder.text}</Text>

        {reminder.translation && (
          <Text style={styles.translation}>"{reminder.translation}"</Text>
        )}

        {reminder.explanation && (
          <Text style={styles.explanation}>{reminder.explanation}</Text>
        )}

        {reminder.source_reference && (
          <Text style={[styles.source, { color: cfg.color }]}>— {reminder.source_reference}</Text>
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
    height: 160,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeLabel: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  arabic: {
    fontSize: 22,
    textAlign: 'right',
    lineHeight: 40,
    fontWeight: '600',
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  translation: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  explanation: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
