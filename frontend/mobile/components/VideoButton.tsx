import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoButtonProps {
  url: string;
  label?: string;
}

const YOUTUBE_RE = /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i;

export default function VideoButton({ url, label }: VideoButtonProps) {
  const isYouTube = YOUTUBE_RE.test(url);
  const bgColor = isYouTube ? '#FF0000' : '#1C1C2E';

  const handlePress = async () => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open link', 'No app found to open this video.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: bgColor }]}
    >
      <Ionicons
        name={isYouTube ? 'logo-youtube' : 'play-circle'}
        size={16}
        color="#fff"
      />
      <Text style={styles.label}>
        {label || (isYouTube ? 'Watch on YouTube' : 'Watch Video')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
