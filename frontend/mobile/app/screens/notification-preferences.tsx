import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getNotificationPreferences, updateNotificationPreferences } from '../../services/notificationPreferences';
import { applyLocalReminderPreferences, registerForPushNotifications } from '../../services/notifications';
import { saveUser } from '../../services/auth';
import { NotificationPreferences } from '../../types';

const DEFAULTS: NotificationPreferences = {
  daily: false,
  friday: false,
  campaigns: false,
  emergency: false,
  quran: false,
  hadith: false,
  dua: false,
  motivation: false,
  impact: false,
  humanitarian: false,
  onboarding_seen: true,
};

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((data) => setPreferences({ ...DEFAULTS, ...data, onboarding_seen: true }))
      .catch(() => Alert.alert('Could not load settings', 'Please try again when you are online.'))
      .finally(() => setLoading(false));
  }, []);

  const setValue = (key: keyof Omit<NotificationPreferences, 'onboarding_seen'>, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value, onboarding_seen: true }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const wantsAny = Object.entries(preferences).some(([key, value]) => key !== 'onboarding_seen' && value === true);
      if (wantsAny) {
        const token = await registerForPushNotifications(true);
        if (!token) {
          Alert.alert(
            'Notifications are disabled',
            Platform.OS === 'web'
              ? 'Allow notifications for this website to receive Family Pledge reminders and updates.'
              : 'Allow notifications in your device settings to receive the categories you selected.',
          );
          return;
        }
      }
      await applyLocalReminderPreferences(preferences);
      const updated = await updateNotificationPreferences({ ...preferences, onboarding_seen: true });
      await saveUser(updated);
      Alert.alert('Saved', 'Your Family Pledge notification preferences have been updated.');
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
        <Text style={styles.subtitle}>Turn on only the reminders and Family Pledge updates you want.</Text>
      </View>

      <PreferenceSection title="Faith & reminders">
        <PreferenceRow icon="book-outline" title="Quran Reminders" description="Approved Quran reminder content from Family Pledge." value={Boolean(preferences.quran)} onChange={(v) => setValue('quran', v)} />
        <PreferenceRow icon="library-outline" title="Hadith Reminders" description="Approved hadith reminders and source-referenced messages." value={Boolean(preferences.hadith)} onChange={(v) => setValue('hadith', v)} />
        <PreferenceRow icon="heart-outline" title="Dua Reminders" description="Duas and prayer reminders shared through Family Pledge." value={Boolean(preferences.dua)} onChange={(v) => setValue('dua', v)} />
        <PreferenceRow icon="sparkles-outline" title="Motivation" description="Short motivation around consistency, compassion and humanitarian action." value={Boolean(preferences.motivation)} onChange={(v) => setValue('motivation', v)} last />
      </PreferenceSection>

      <PreferenceSection title="Pledge & humanitarian updates">
        <PreferenceRow icon="sunny-outline" title="Daily Pledge Reminder" description="Daily reminder for your pledge and humanitarian action." value={preferences.daily} onChange={(v) => setValue('daily', v)} />
        <PreferenceRow icon="calendar-outline" title="Friday / Jumu’ah Reminder" description="Weekly Friday Family Pledge reminder." value={preferences.friday} onChange={(v) => setValue('friday', v)} />
        <PreferenceRow icon="megaphone-outline" title="Campaign Updates" description="Verified campaign news and actions from Family Pledge." value={preferences.campaigns} onChange={(v) => setValue('campaigns', v)} />
        <PreferenceRow icon="images-outline" title="Impact Updates" description="New verified impact stories and delivery updates." value={Boolean(preferences.impact)} onChange={(v) => setValue('impact', v)} />
        <PreferenceRow icon="earth-outline" title="Humanitarian Assistance" description="Humanitarian assistance and relief updates pushed by admins." value={Boolean(preferences.humanitarian)} onChange={(v) => setValue('humanitarian', v)} />
        <PreferenceRow icon="alert-circle-outline" title="Emergency Appeals" description="Urgent humanitarian appeals from Family Pledge." value={preferences.emergency} onChange={(v) => setValue('emergency', v)} last />
      </PreferenceSection>

      <AppButton title="Save Notification Preferences" onPress={save} loading={saving} icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />} />
    </ScrollView>
  );
}

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <AppCard style={styles.card}><Text style={styles.sectionTitle}>{title}</Text>{children}</AppCard>;
}

function PreferenceRow({ icon, title, description, value, onChange, last = false }: { icon: string; title: string; description: string; value: boolean; onChange: (value: boolean) => void; last?: boolean; }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}><Ionicons name={icon as any} size={20} color={Colors.primary} /></View>
      <View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.gray[300], true: Colors.primary }} thumbColor={Colors.white} />
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.gray[50], alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: Colors.text.primary },
  rowDescription: { marginTop: 2, fontSize: 11, lineHeight: 16, color: Colors.text.secondary },
});
