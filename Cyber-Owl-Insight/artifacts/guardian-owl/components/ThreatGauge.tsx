import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  value: number;
};

function getThreatLabel(v: number) {
  if (v >= 80) return 'CRITICAL';
  if (v >= 60) return 'HIGH';
  if (v >= 40) return 'ELEVATED';
  return 'LOW';
}

function getThreatColor(v: number) {
  if (v >= 80) return COLORS.critical;
  if (v >= 60) return COLORS.high;
  if (v >= 40) return COLORS.medium;
  return COLORS.safe;
}

export function ThreatGauge({ value }: Props) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCirc = circumference * 0.75;

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const color = getThreatColor(value);

  useEffect(() => {
    progress.value = withTiming((value / 100) * halfCirc, {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: halfCirc - progress.value,
  }));

  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={COLORS.safe} />
            <Stop offset="50%" stopColor={COLORS.high} />
            <Stop offset="100%" stopColor={COLORS.critical} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${halfCirc} ${circumference}`}
          strokeDashoffset={-circumference * 0.125}
          strokeLinecap="round"
          rotation="-225"
          origin={`${size / 2},${size / 2}`}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${halfCirc} ${circumference}`}
          strokeLinecap="round"
          rotation="-225"
          origin={`${size / 2},${size / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.unit}>/ 100</Text>
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
          <Text style={[styles.badgeText, { color }]}>{getThreatLabel(value)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    overflow: 'visible',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    top: 36,
  },
  value: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -2,
  },
  unit: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    marginTop: -4,
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
});
