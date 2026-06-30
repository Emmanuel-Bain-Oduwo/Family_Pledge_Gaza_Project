import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import AppButton from '../components/AppButton';
import { isAuthenticated } from '../services/auth';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const authed = await isAuthenticated();
      if (authed) {
        router.replace('/tabs/home');
      } else {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <View style={styles.logoCircle}>
          <Ionicons name="heart" size={48} color={Colors.white} />
        </View>
        <Text style={styles.splashTitle}>Family Pledge</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="heart" size={56} color={Colors.white} />
        </View>
        <Text style={styles.appName}>Family Pledge</Text>
        <Text style={styles.tagline}>Small Pledge, Big Impact</Text>
        <View style={styles.goldLine} />
        <Text style={styles.sub}>For Gaza — Powered by NAMLEF</Text>
      </View>

      {/* Cards */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.features}>
          <FeatureRow
            icon="cash-outline"
            title="USD 10 / Month"
            text="Join thousands pledging a small monthly amount that adds up to massive relief."
          />
          <FeatureRow
            icon="people-outline"
            title="200 Donors Target"
            text="Every Friday, we mobilise 200 donors for Gaza. Be part of the circle."
          />
          <FeatureRow
            icon="shield-checkmark-outline"
            title="Secure & Transparent"
            text="Track your pledge, submit proof, see real impact from the ground."
          />
          <FeatureRow
            icon="moon-outline"
            title="Daily Reminders"
            text="Quran, Hadith, Du'a and motivation to keep your heart connected."
          />
        </View>

        <View style={styles.namlefRow}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
          <Text style={styles.namlefText}>
            Initiative of <Text style={styles.namlefBold}>NAMLEF</Text> — National Muslim Leaders Forum
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Sign My Pledge"
            onPress={() => router.push('/auth/register')}
            variant="primary"
            icon={<Ionicons name="create-outline" size={18} color={Colors.white} />}
          />
          <AppButton
            title="I Already Have an Account"
            onPress={() => router.push('/auth/login')}
            variant="outline"
            style={{ marginTop: 12 }}
          />
          <AppButton
            title="Continue as Visitor"
            onPress={() => router.replace('/tabs/home')}
            variant="ghost"
            style={{ marginTop: 4 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 17,
    color: Colors.gold,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  goldLine: {
    width: 60,
    height: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    marginVertical: 12,
  },
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  features: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  namlefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 24,
  },
  namlefText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  namlefBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  actions: {
    gap: 0,
  },
});
