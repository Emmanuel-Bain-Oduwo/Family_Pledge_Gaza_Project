import React, { useState } from 'react';
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
  dhikr: { label: 'Dhikr', color: '#0F766E', bg: '#F0FDFA' },
  shirk: { label: 'Shirk Awareness', color: '#9A3412', bg: '#FFF7ED' },
  motivation: { label: 'Motivation', color: Colors.gold, bg: '#FFFBEB' },
  friday: { label: 'Jumu\'ah', color: Colors.goldLight, bg: '#FFFDF0' },
  sadaqah: { label: 'Sadaqah', color: '#047857', bg: '#ECFDF5' },
};

export default function ReminderCard({ reminder, onPress }: ReminderCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const type = reminder.reminder_type || reminder.type;
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.motivation;
  const text = reminder.text || reminder.title || '';
  const long = `${text}${reminder.translation || ''}${reminder.explanation || ''}`.length > 260;

  const handleShare = async () => {
    await shareText(`${reminder.arabic_text ? reminder.arabic_text + '\n\n' : ''}${text}${reminder.source_reference ? '\n\n— ' + reminder.source_reference : ''}\n\nFamily Pledge for Gaza 🌙`, 'Reminder');
  };

  return (
    <AppCard onPress={onPress} style={[styles.card, { backgroundColor: cfg.bg }]} borderColor={cfg.color}>
      {reminder.image_url && failedImage !== reminder.image_url && (
        <Image source={{ uri: reminder.image_url }} style={styles.image} resizeMode="cover" onError={() => setFailedImage(reminder.image_url!)} accessibilityLabel="Reminder image" />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.color }]}><Text style={styles.typeLabel}>{cfg.label}</Text></View>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="share-outline" size={20} color={cfg.color} /></TouchableOpacity>
        </View>

        {reminder.title && reminder.title !== text && <Text style={styles.title}>{reminder.title}</Text>}
        {reminder.arabic_text && <Text style={[styles.arabic, { color: cfg.color }]} numberOfLines={expanded ? undefined : 4}>{reminder.arabic_text}</Text>}
        <Text style={styles.text} numberOfLines={expanded ? undefined : 5}>{text}</Text>
        {reminder.translation && <Text style={styles.translation} numberOfLines={expanded ? undefined : 4}>“{reminder.translation}”</Text>}
        {reminder.explanation && <Text style={styles.explanation} numberOfLines={expanded ? undefined : 4}>{reminder.explanation}</Text>}
        {long && <TouchableOpacity onPress={() => setExpanded(value=>!value)} accessibilityRole="button"><Text style={[styles.readMore,{color:cfg.color}]}>{expanded?'Show less':'Read more'}</Text></TouchableOpacity>}
        {reminder.source_reference && <Text style={[styles.source, { color: cfg.color }]}>— {reminder.source_reference}</Text>}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, padding: 0, overflow: 'hidden' },
  image: { width: '100%', height: 160 },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  typeLabel: { color: Colors.white, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  title:{fontSize:16,fontWeight:'900',color:Colors.text.primary,marginBottom:8},
  arabic: { fontSize: 22, textAlign: 'right', lineHeight: 40, fontWeight: '600', marginBottom: 10 },
  text: { fontSize: 15, color: Colors.text.primary, lineHeight: 24, fontWeight: '500', marginBottom: 8 },
  translation: { fontSize: 14, color: Colors.text.secondary, fontStyle: 'italic', lineHeight: 22, marginBottom: 8 },
  explanation: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20, marginBottom: 8 },
  readMore:{fontSize:12.5,fontWeight:'900',marginTop:1,marginBottom:7},
  source: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
