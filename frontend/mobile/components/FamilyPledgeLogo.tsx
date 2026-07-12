import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FAMILY_PLEDGE_LOGO_DATA_URI } from '../constants/logo';

export default function FamilyPledgeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      <Image
        source={{ uri: FAMILY_PLEDGE_LOGO_DATA_URI }}
        style={[styles.logo, compact && styles.compactLogo]}
        resizeMode="contain"
        accessibilityLabel="Family Pledge logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  compactWrap: { alignItems: 'flex-start' },
  logo: { width: 230, height: 230 },
  compactLogo: { width: 88, height: 88 },
});
