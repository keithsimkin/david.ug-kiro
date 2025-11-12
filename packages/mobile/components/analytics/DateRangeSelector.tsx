import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  options?: { label: string; value: number }[];
}

const defaultOptions = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export function DateRangeSelector({ value, onChange, options = defaultOptions }: DateRangeSelectorProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Button
          key={option.value}
          mode={value === option.value ? 'contained' : 'outlined'}
          onPress={() => onChange(option.value)}
          style={styles.button}
          compact
        >
          {option.label}
        </Button>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
});
