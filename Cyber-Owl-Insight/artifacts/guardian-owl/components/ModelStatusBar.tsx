import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import type { ModelPerformance } from '@/context/SecurityContext';

type MetricProps = {
  label: string;
  value: number;
  color: string;
  delay: number;
};

function MetricChip({ label, value, color, delay }: MetricProps) {
  const width = useSharedValue(0);
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    setTimeout(() => {
      width.value = withTiming(value / 100, { duration: 1000, easing: Easing.out(Easing.cubic) });
    }, delay);
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.6, { duration: 1500 })),
      -1,
      false
    );
  }, [value]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const barStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View style={styles.chip}>
      <View style={styles.chipHeader}>
        <Animated.View style={[styles.dot, { backgroundColor: color }, dotStyle]} />
        <Text style={styles.chipLabel}>{label}</Text>
      </View>
      <Text style={[styles.chipValue, { color }]}>{value.toFixed(1)}%</Text>
      <View style={styles.miniTrack}>
        <Animated.View style={[styles.miniFill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

type Props = {
  performance: ModelPerformance;
};

export function ModelStatusBar({ performance }: Props) {
  return (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>MODEL PERFORMANCE</Text>
        <View style={styles.activeBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.activeText}>LIVE</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.chips}>
          <MetricChip label="Precision" value={performance.precision} color={COLORS.safe} delay={0} />
          <MetricChip label="Recall" value={performance.recall} color={COLORS.accent} delay={150} />
          <MetricChip label="F1 Score" value={performance.f1} color={COLORS.medium} delay={300} />
          <MetricChip label="Accuracy" value={performance.accuracy} color={COLORS.high} delay={450} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.safeDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.safeGlow,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.safe,
  },
  activeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.safe,
    letterSpacing: 1,
  },
  scroll: {
    marginHorizontal: -4,
  },
  chips: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  chip: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    width: 100,
    gap: 6,
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
  },
  chipValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  miniTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
});
