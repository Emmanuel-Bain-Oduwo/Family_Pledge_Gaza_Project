import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { Colors } from '../../constants/colors';
import { getNotifications } from '../../services/api';
import { UserNotification } from '../../types';

const TYPE_STYLE: Record<string, { icon: string; color: string }> = {
  emergency: { icon: 'alert-circle', color: Colors.emergency },
  friday_challenge: { icon: 'flash', color: Colors.gold },
  contribution_confirmed: { icon: 'checkmark-circle', color: Colors.success },
  reminder: { icon: 'moon', color: Colors.primaryDark },
  general: { icon: 'notifications', color: Colors.primary },
};

function relativeTime(value?: string) {
  if (!value) return 'Recently';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await getNotifications());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingState fullScreen message="Loading notifications..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const appearance = TYPE_STYLE[item.notification_type] || TYPE_STYLE.general;
          return (
            <AppCard style={styles.card} borderColor={appearance.color}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: appearance.color + '20' }]}>
                  <Ionicons name={appearance.icon as any} size={22} color={appearance.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.time}>{relativeTime(item.sent_at || item.created_at)}</Text>
                </View>
              </View>
            </AppCard>
          );
        }}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title={failed ? 'Unable to Load Notifications' : 'No Notifications'} description={failed ? 'Pull down to try again.' : 'Alerts and updates sent to you will appear here.'} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  list: { paddingVertical: 12, flexGrow: 1 },
  card: { marginHorizontal: 16, marginVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  body: { fontSize: 13, color: Colors.text.secondary, lineHeight: 19 },
  time: { fontSize: 11, color: Colors.text.muted, marginTop: 6 },
});
