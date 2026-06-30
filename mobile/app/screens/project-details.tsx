import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';

export default function ProjectDetailsScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <AppCard style={styles.card}>
        <View style={styles.iconBlock}>
          <Ionicons name="construct" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Project Details</Text>
        <Text style={styles.desc}>
          Detailed project information, progress reports, and beneficiary data are shown here.
        </Text>
      </AppCard>
      <AppButton title="Back to Updates" onPress={() => router.push('/screens/updates')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16, alignItems: 'center', paddingVertical: 32 },
  iconBlock: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});
