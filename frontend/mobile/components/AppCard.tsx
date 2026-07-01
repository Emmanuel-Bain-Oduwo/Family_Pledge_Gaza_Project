import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  shadow?: boolean;
  borderColor?: string;
}

export default function AppCard({
  children,
  style,
  onPress,
  padding = 16,
  shadow = true,
  borderColor,
}: AppCardProps) {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    shadow ? styles.shadow : null,
    borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : null,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
