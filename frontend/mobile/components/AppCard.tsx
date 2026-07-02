import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { ReferenceTheme } from '../constants/referenceTheme';

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
    borderColor ? { borderWidth: 1, borderColor } : null,
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
    borderRadius: ReferenceTheme.radius.card,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: ReferenceTheme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
});
