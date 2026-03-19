import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

type Props = {
  anomaly: number;
  behavior: number;
  temporal: number;
  historical: number;
  contextual: number;
  color: string;
};

type BarProps = {
  label: string;
  value: number;
  color: string;
};

function AnimatedBar({ label, value, color }: BarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(value, {
      duration: 900 + Math.random() * 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const getBarColor = (v: number) => {
    if (v >= 80) return COLORS.critical;
    if (v >= 60) return COLORS.high;
    if (v >= 40) return COLORS.medium;
    return COLORS.safe;
  };

  const barColor = getBarColor(value);

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            barStyle,
            {
              backgroundColor: barColor,
              shadowColor: barColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 4,
            },
          ]}
        />
      </View>
      <Text style={[styles.barValue, { color: barColor }]}>{value}</Text>
    </View>
  );
}

export function RiskRadar({ anomaly, behavior, temporal, historical, contextual }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RISK BREAKDOWN</Text>
      <View style={styles.bars}>
        <AnimatedBar label="Anomaly Score" value={anomaly} color={COLORS.critical} />
        <AnimatedBar label="Behavioral" value={behavior} color={COLORS.high} />
        <AnimatedBar label="Temporal" value={temporal} color={COLORS.medium} />
        <AnimatedBar label="Historical" value={historical} color={COLORS.accent} />
        <AnimatedBar label="Contextual" value={contextual} color={COLORS.safe} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  bars: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    width: 90,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barValue: {
    width: 30,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
  },
});
