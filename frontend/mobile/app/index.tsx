import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
        <View style={styles.logoMark}>
          <Ionicons name="heart" size={44} color={Colors.primary} />
        </View>
        <Text style={styles.splashTitle}>Family Pledge</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      <View style={styles.badgeRail}>
        <TrustBadge icon="heart" title="Free to Join" text="$10 / month" />
        <TrustBadge icon="shield-checkmark" title="100% Impact" text="For Gaza Relief" />
      </View>

      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Ionicons name="home" size={34} color={Colors.primary} />
          <Ionicons name="leaf" size={18} color={Colors.gold} style={styles.logoLeaf} />
        </View>
        <View>
          <Text style={styles.brandFamily}>FAMILY</Text>
          <Text style={styles.brandPledge}>PLEDGE</Text>
        </View>
      </View>

      <Text style={styles.initiative}>A initiative under</Text>
      <Text style={styles.namlef}>NAMLEF</Text>

      <View style={styles.heroCopy}>
        <Text style={styles.title}>Small Pledge,{`\n`}Big Impact</Text>
        <Text style={styles.description}>
          Your monthly $10 pledge helps provide food, water, clothing,
          emergency cash assistance and hope to families in Gaza.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Sign Your Pledge"
          onPress={() => router.push('/auth/register')}
          variant="primary"
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
        />
        <AppButton
          title="I Already Have an Account"
          onPress={() => router.push('/auth/login')}
          variant="outline"
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
        />
      </View>

      <View style={styles.secondaryRail}>
        <TrustBadge icon="lock-closed" title="Secure & Private" text="Your data is safe" compact />
        <TrustBadge icon="globe" title="Global Community" text="Be part of change" compact />
      </View>

      <View style={styles.skylineCard}>
        <View style={styles.sun} />
        <View style={styles.dome} />
        <View style={styles.domeBase} />
        <View style={styles.tower} />
        <View style={styles.towerTop} />
        <View style={styles.cityLine} />
        <Text style={styles.skylineText}>Gaza Relief • Transparent Impact • Daily Reminders</Text>
      </View>
    </ScrollView>
  );
}

function TrustBadge({
  icon,
  title,
  text,
  compact = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.trustBadge, compact && styles.trustBadgeCompact]}>
      <View style={styles.trustIcon}>
        <Ionicons name={icon} size={compact ? 17 : 19} color={Colors.primaryDark} />
      </View>
      <View style={styles.trustCopy}>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text style={styles.trustText}>{text}</Text>
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
    backgroundColor: '#F4F8F6',
  },
  content: {
    minHeight: '100%',
    paddingTop: 54,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  badgeRail: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  secondaryRail: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  trustBadge: {
    flex: 1,
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  trustBadgeCompact: {
    minHeight: 54,
    borderRadius: 18,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  trustCopy: {
    flex: 1,
  },
  trustTitle: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '800',
  },
  trustText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  logoMark: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#EEF7EF',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoLeaf: {
    position: 'absolute',
    right: 10,
    bottom: 8,
  },
  brandFamily: {
    color: Colors.primary,
    fontSize: 30,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandPledge: {
    color: Colors.black,
    fontSize: 30,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: 1,
  },
  initiative: {
    color: Colors.black,
    fontSize: 14,
    marginTop: 2,
    marginLeft: 82,
    fontWeight: '600',
  },
  namlef: {
    color: Colors.primary,
    fontSize: 22,
    marginLeft: 82,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroCopy: {
    marginTop: 32,
  },
  title: {
    color: Colors.primary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  description: {
    marginTop: 22,
    color: Colors.black,
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '500',
    maxWidth: width - 62,
  },
  actions: {
    marginTop: 30,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 10,
    minHeight: 54,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    borderRadius: 10,
    minHeight: 54,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 8,
  },
  skylineCard: {
    height: 190,
    marginTop: 28,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E8EFEA',
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  sun: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.gold,
    left: 132,
    top: 38,
  },
  dome: {
    position: 'absolute',
    width: 150,
    height: 75,
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    backgroundColor: '#D6A437',
    left: 100,
    bottom: 38,
  },
  domeBase: {
    position: 'absolute',
    width: 178,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F6E7B2',
    left: 86,
    bottom: 20,
  },
  tower: {
    position: 'absolute',
    width: 26,
    height: 118,
    borderRadius: 13,
    backgroundColor: '#F4F1E4',
    left: 36,
    bottom: 18,
  },
  towerTop: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#D6A437',
    left: 27,
    bottom: 124,
  },
  cityLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    backgroundColor: 'rgba(11,107,58,0.18)',
  },
  skylineText: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 10,
    textAlign: 'center',
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
});
