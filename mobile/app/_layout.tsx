import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Sign In', headerBackTitle: 'Back' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Create Account', headerBackTitle: 'Back' }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="screens/contribute" options={{ title: 'Contribute' }} />
        <Stack.Screen name="screens/campaign-details" options={{ title: 'Campaign' }} />
        <Stack.Screen name="screens/project-details" options={{ title: 'Project Details' }} />
        <Stack.Screen name="screens/emergency-appeal" options={{ title: 'Emergency Appeal', headerStyle: { backgroundColor: Colors.emergency } }} />
        <Stack.Screen name="screens/friday-challenge" options={{ title: 'Friday Challenge', headerStyle: { backgroundColor: Colors.gold }, headerTintColor: Colors.primaryDark }} />
        <Stack.Screen name="screens/updates" options={{ title: 'Impact & Updates' }} />
        <Stack.Screen name="screens/namlef" options={{ title: 'NAMLEF & Messages' }} />
        <Stack.Screen name="screens/collector-dashboard" options={{ title: 'Collector Dashboard' }} />
        <Stack.Screen name="screens/badges" options={{ title: 'My Badges' }} />
        <Stack.Screen name="screens/notifications" options={{ title: 'Notifications' }} />
      </Stack>
    </>
  );
}
