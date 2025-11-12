import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { DailyMetric } from '@shared/types/analytics';

interface SimpleLineChartProps {
  data: DailyMetric[];
  color?: string;
  height?: number;
}

export function SimpleLineChart({ data, color = '#3b82f6', height = 200 }: SimpleLineChartProps) {
  const width = Dimensions.get('window').width - 64; // Account for padding

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const padding = 20;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - (d.count / maxValue) * (height - padding * 2) - padding;
    return { x, y, count: d.count, date: d.date };
  });

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;

  // Create area path
  const areaD = `M ${padding},${height - padding} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${width - padding},${height - padding} Z`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - ratio * (height - padding * 2) - padding;
          return (
            <Line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill={color} fillOpacity="0.1" />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((point, i) => (
          <Circle key={i} cx={point.x} cy={point.y} r="4" fill={color} />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.labels}>
        <Text style={styles.labelText}>
          {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {data.length > 2 && (
          <Text style={styles.labelText}>
            {new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
        <Text style={styles.labelText}>
          {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 80,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  labelText: {
    fontSize: 10,
    color: '#999',
  },
});
