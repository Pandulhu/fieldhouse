import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Sport } from '@fieldhouse/types';
import { STAT_SCHEMAS, STAT_LABELS } from '@fieldhouse/stats-engine';

interface StatEntryFormProps {
  sport: Sport;
  playerId: string;
  gameId: string;
  teamId: string;
  season: string;
  onSubmit: (stats: Record<string, number>) => void;
  loading: boolean;
}

const COLORS = {
  primary: '#1E3A5F',
  accent: '#2E75B6',
  light: '#D6E4F0',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#888888',
} as const;

const StatEntryForm: React.FC<StatEntryFormProps> = ({
  sport,
  onSubmit,
  loading,
}) => {
  const statKeys = STAT_SCHEMAS[sport];
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = useCallback((key: string, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
  }, []);

  const handleSubmit = useCallback(() => {
    const parsed: Record<string, number> = {};

    for (const key of statKeys) {
      const raw = values[key]?.trim() ?? '';
      if (raw === '') {
        parsed[key] = 0;
        continue;
      }

      const num = Number(raw);
      if (Number.isNaN(num) || num < 0) {
        Alert.alert(
          'Invalid Value',
          `"${STAT_LABELS[key] ?? key}" must be a non-negative number.`,
        );
        return;
      }
      parsed[key] = num;
    }

    onSubmit(parsed);
  }, [values, statKeys, onSubmit]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.header}>Enter Stats - {sport}</Text>

      {statKeys.map((key) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{STAT_LABELS[key] ?? key}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.muted}
            value={values[key] ?? ''}
            onChangeText={(text) => handleChange(key, text)}
            editable={!loading}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.surface} />
        ) : (
          <Text style={styles.buttonText}>Save Stats</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  input: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatEntryForm;
