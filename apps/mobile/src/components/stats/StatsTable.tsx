import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PlayerStatsAggregate } from '@fieldhouse/types';
import { STAT_LABELS } from '@fieldhouse/stats-engine';

interface StatsTableProps {
  aggregate: PlayerStatsAggregate;
}

const COLORS = {
  primary: '#1E3A5F',
  accent: '#2E75B6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#888888',
} as const;

const ERA_LIKE_KEYS = new Set(['era', 'whip', 'ypc']);

const formatDerived = (key: string, value: number | null): string => {
  if (value === null) return '--';
  if (ERA_LIKE_KEYS.has(key)) return value.toFixed(2);
  return value.toFixed(3);
};

const StatsTable: React.FC<StatsTableProps> = ({ aggregate }) => {
  const rawEntries = Object.entries(aggregate.raw);
  const derivedEntries = Object.entries(aggregate.derived);
  const isEmpty = rawEntries.length === 0 && derivedEntries.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No stats recorded yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {rawEntries.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>
            Raw Stats - {aggregate.sport}
          </Text>
          {rawEntries.map(([key, value], index) => (
            <View
              key={key}
              style={[
                styles.row,
                index % 2 === 1 && styles.rowAlt,
              ]}
            >
              <Text style={styles.rowLabel}>
                {STAT_LABELS[key] ?? key}
              </Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </>
      )}

      {derivedEntries.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Derived Stats</Text>
          {derivedEntries.map(([key, value], index) => (
            <View
              key={key}
              style={[
                styles.row,
                index % 2 === 1 && styles.rowAlt,
              ]}
            >
              <Text style={styles.rowLabel}>
                {STAT_LABELS[key] ?? key}
              </Text>
              <Text style={styles.rowValue}>
                {formatDerived(key, value)}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
  },
  rowAlt: {
    backgroundColor: COLORS.background,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    minWidth: 60,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },
});

export default StatsTable;
