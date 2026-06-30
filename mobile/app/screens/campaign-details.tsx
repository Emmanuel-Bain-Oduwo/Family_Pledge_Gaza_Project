import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';

export default function CampaignDetailsScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppCard style={styles.card}>
        <View style={styles.iconBlock}>
          <Ionicons name="megaphone" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Campaign Details</Text>
        <Text style={styles.desc}>
          Full campaign details, progress, and contribution options are available here. Select a specific campaign from the Campaigns tab to view its details.
        </Text>
      </AppCard>
      <AppButton
        title="View All Campaigns"
        onPress={() => router.push('/tabs/campaigns')}
        style={styles.btn}
      />
      <AppButton
        title="Contribute Now"
        onPress={() => router.push('/screens/contribute')}
        variant="outline"
        style={styles.btn}
      />
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
  btn: { marginBottom: 12 },
});
