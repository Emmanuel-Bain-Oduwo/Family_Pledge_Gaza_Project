import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { Colors } from '../constants/colors';
import { NamlefContent } from '../types';
import { openExternalUrl } from '../services/webCompat';

interface NamlefContentCardProps {
  content: NamlefContent;
  onPress?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  about: { label: 'About NAMLEF', icon: 'information-circle', color: Colors.primary },
  sheikh_message: { label: 'Message from Sheikh', icon: 'chatbubble-ellipses', color: Colors.gold },
  introduction: { label: 'Introduction', icon: 'document-text', color: Colors.primaryLight },
  voice_of_support: { label: 'Voice of Support', icon: 'megaphone', color: '#7C3AED' },
};

export default function NamlefContentCard({ content, onPress }: NamlefContentCardProps) {
  const cfg = TYPE_CONFIG[content.type] || TYPE_CONFIG.about;

  return (
    <AppCard onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: cfg.color + '15' }]}>
          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
          <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={styles.title}>{content.title}</Text>

      {content.author && (
        <View style={styles.authorRow}>
          <View style={[styles.authorAvatar, { backgroundColor: cfg.color + '20' }]}>
            <Ionicons name="person" size={16} color={cfg.color} />
          </View>
          <View>
            <Text style={styles.authorName}>{content.author}</Text>
            {content.author_title && (
              <Text style={styles.authorTitle}>{content.author_title}</Text>
            )}
          </View>
        </View>
      )}

      <Text style={styles.contentText} numberOfLines={4}>{content.content}</Text>

      <View style={styles.footer}>
        {content.video_url && (
          <TouchableOpacity
            onPress={() => openExternalUrl(content.video_url!)}
            style={[styles.mediaBtn, { backgroundColor: '#EF4444' }]}
          >
            <Ionicons name="play-circle" size={16} color={Colors.white} />
            <Text style={styles.mediaBtnText}>Watch</Text>
          </TouchableOpacity>
        )}
        {content.audio_url && (
          <TouchableOpacity
            onPress={() => openExternalUrl(content.audio_url!)}
            style={[styles.mediaBtn, { backgroundColor: Colors.primary }]}
          >
            <Ionicons name="musical-notes" size={16} color={Colors.white} />
            <Text style={styles.mediaBtnText}>Listen</Text>
          </TouchableOpacity>
        )}
        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.readMore}>
            <Text style={[styles.readMoreText, { color: cfg.color }]}>Read more →</Text>
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
  },
  header: {
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 10,
    lineHeight: 24,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  authorTitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  contentText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  mediaBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  readMore: {
    marginLeft: 'auto',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
