import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  message: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
