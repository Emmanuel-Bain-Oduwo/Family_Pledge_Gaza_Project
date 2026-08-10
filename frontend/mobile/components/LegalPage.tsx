import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export default function LegalPage({ title, subtitle, sections }: { title: string; subtitle?: string; sections: LegalSection[] }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.updated}>Last updated: 10 August 2026</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.heading}>{section.title}</Text>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-${index}`} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.contact} onPress={() => Linking.openURL('mailto:admin@familypledgekenya.org')}>
        <Ionicons name="mail-outline" size={18} color={Colors.primary} />
        <Text style={styles.contactText}>admin@familypledgekenya.org</Text>
      </TouchableOpacity>
      <Text style={styles.address}>Family Pledge · Nairobi, Kenya, 00100</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: Colors.primaryDark, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 26 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.white },
  subtitle: { marginTop: 7, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)' },
  updated: { marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  section: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: Colors.white },
  heading: { fontSize: 16, fontWeight: '800', color: Colors.text.primary, marginBottom: 8 },
  paragraph: { fontSize: 13, lineHeight: 20, color: Colors.text.secondary, marginBottom: 8 },
  contact: { marginHorizontal: 16, marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: Colors.white },
  contactText: { color: Colors.primary, fontWeight: '700' },
  address: { marginTop: 12, textAlign: 'center', fontSize: 12, color: Colors.text.muted },
});
