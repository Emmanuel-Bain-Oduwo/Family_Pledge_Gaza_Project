import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: '#E5ECE7',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        headerStyle: { backgroundColor: '#F5F8F6' },
        headerTintColor: Colors.black,
        headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'Family Pledge',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pledge"
        options={{
          title: 'Pledge',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'moon' : 'moon-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
