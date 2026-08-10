import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { Colors } from '../constants/colors';

export default function ErrorState({
  title = 'Could not load Family Pledge',
  message = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="cloud-offline-outline" size={32} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <AppButton title="Try Again" onPress={onRetry} style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: Colors.cream },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text.primary, textAlign: 'center' },
  message: { marginTop: 7, fontSize: 13, lineHeight: 19, color: Colors.text.secondary, textAlign: 'center' },
  button: { marginTop: 18, minWidth: 150 },
});
