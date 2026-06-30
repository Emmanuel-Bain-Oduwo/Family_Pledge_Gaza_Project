import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';

interface NotifItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotifItem[] = [
  {
    id: '1',
    icon: 'alert-circle',
    iconColor: Colors.emergency,
    title: 'Emergency Appeal',
    body: 'Urgent support needed. 150 families displaced today.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    icon: 'flash',
    iconColor: Colors.gold,
    title: 'Friday Challenge is Live!',
    body: "It's Jumu'ah! Help us reach 200 donors today.",
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    icon: 'checkmark-circle',
    iconColor: Colors.success,
    title: 'Contribution Verified',
    body: 'Your October pledge has been verified. Jazakallahu Khayran!',
    time: '2 days ago',
    read: true,
  },
  {
    id: '4',
    icon: 'moon',
    iconColor: Colors.primaryDark,
    title: "Today's Reminder",
    body: '"And whoever saves one — it is as if he had saved all mankind." (Quran 5:32)',
    time: '3 days ago',
    read: true,
  },
  {
    id: '5',
    icon: 'people',
    iconColor: Colors.primary,
    title: 'New Circle Member',
    body: 'Ibrahim joined your collector circle!',
    time: '1 week ago',
    read: true,
  },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppCard
            style={[styles.card, !item.read && styles.unread]}
            borderColor={!item.read ? item.iconColor : undefined}
          >
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '20' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
              </View>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No Notifications"
            description="Your alerts and updates will appear here."
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  list: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 10 },
  unread: { backgroundColor: Colors.white },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  body: { fontSize: 13, color: Colors.text.secondary, lineHeight: 19, marginBottom: 5 },
  time: { fontSize: 11, color: Colors.text.muted, fontWeight: '500' },
});
