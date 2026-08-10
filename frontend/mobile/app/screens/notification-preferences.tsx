import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notificationPreferences';
import {
  applyLocalReminderPreferences,
  registerForPushNotifications,
} from '../../services/notifications';
import { saveUser } from '../../services/auth';
import { NotificationPreferences } from '../../types';

const DEFAULTS: NotificationPreferences = {
  daily: false,
  friday: false,
  campaigns: false,
  emergency: false,
  onboarding_seen: true,
};

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((data) => setPreferences({ ...data, onboarding_seen: true }))
      .catch(() => Alert.alert('Could not load settings', 'Please try again when you are online.'))
      .finally(() => setLoading(false));
  }, []);

  const setValue = (key: keyof Omit<NotificationPreferences, 'onboarding_seen'>, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value, onboarding_seen: true }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const wantsAny = preferences.daily || preferences.friday || preferences.campaigns || preferences.emergency;
      if (Platform.OS !== 'web' && wantsAny) {
        const token = await registerForPushNotifications(true);
        if (!token) {
          Alert.alert(
            'Notifications are disabled',
            'Family Pledge cannot enable these settings until notification permission is allowed in your device settings.',
          );
          return;
        }
      }

      await applyLocalReminderPreferences(preferences);
      const updated = await updateNotificationPreferences({ ...preferences, onboarding_seen: true });
      await saveUser(updated);
      Alert.alert('Saved', Platform.OS === 'web'
        ? 'Your preferences are saved and will apply when you use the same account on Android or iOS.'
        : 'Your notification preferences have been updated.');
    } catch (error: any) {
      Alert.alert('Could not save', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState fullScreen message="Loading notification settings..." />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="notifications-outline" size={32} color={Colors.white} />
        <Text style={styles.title}>Choose what you receive</Text>
        <Text style={styles.subtitle}>
          Family Pledge asks only after you choose what is useful. You can change these settings at any time.
        </Text>
      </View>

      <AppCard style={styles.card}>
        <PreferenceRow
          icon="sunny-outline"
          title="Daily Pledge Reminder"
          description="A daily reminder to remember Gaza in prayer, pledge and action."
          value={preferences.daily}
          onChange={(value) => setValue('daily', value)}
        />
        <PreferenceRow
          icon="calendar-outline"
          title="Friday / Jumu’ah Reminder"
          description="A weekly Friday reminder for the Family Pledge challenge."
          value={preferences.friday}
          onChange={(value) => setValue('friday', value)}
        />
        <PreferenceRow
          icon="megaphone-outline"
          title="Campaign Updates"
          description="Important campaign and impact updates from Family Pledge."
          value={preferences.campaigns}
          onChange={(value) => setValue('campaigns', value)}
        />
        <PreferenceRow
          icon="alert-circle-outline"
          title="Emergency Appeals"
          description="Urgent humanitarian appeals sent through the emergency channel."
          value={preferences.emergency}
          onChange={(value) => setValue('emergency', value)}
          last
        />
      </AppCard>

      <Text style={styles.note}>
        Android remote notifications use Expo Push Service with Firebase Cloud Messaging underneath. iOS delivery uses Apple Push Notification service. Local Daily/Friday reminders are scheduled on your device.
      </Text>

      <AppButton
        title="Save Notification Preferences"
        onPress={save}
        loading={saving}
        icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />}
      />
    </ScrollView>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onChange,
  last = false,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.gray[300], true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 16, paddingBottom: 36 },
  hero: { backgroundColor: Colors.primaryDark, borderRadius: 24, padding: 22, alignItems: 'center', marginBottom: 16 },
  title: { marginTop: 9, fontSize: 22, fontWeight: '900', color: Colors.white },
  subtitle: { marginTop: 7, fontSize: 13, lineHeight: 19, textAlign: 'center', color: 'rgba(255,255,255,0.82)' },
  card: { paddingVertical: 4, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.gray[50], alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: Colors.text.primary },
  rowDescription: { marginTop: 2, fontSize: 11, lineHeight: 16, color: Colors.text.secondary },
  note: { marginHorizontal: 4, marginBottom: 16, fontSize: 11, lineHeight: 17, color: Colors.text.muted },
});
