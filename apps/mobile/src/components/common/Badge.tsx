import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color = '#2E75B6',
  textColor = '#FFFFFF',
}) => {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Badge;
