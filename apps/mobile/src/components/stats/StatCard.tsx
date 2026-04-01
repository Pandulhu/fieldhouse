import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

const COLORS = {
  accent: '#2E75B6',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#888888',
} as const;

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  highlight = false,
}) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight && styles.valueHighlight]}>
      {value}
    </Text>
    {subtitle !== undefined && (
      <Text style={styles.subtitle}>{subtitle}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  valueHighlight: {
    color: COLORS.accent,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
});

export default StatCard;
