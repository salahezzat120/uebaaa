import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Polygon,
  Text as SvgText,
  Line,
  G,
} from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { GlassCard } from './GlassCard';

const AXES = ['Anomaly', 'Behavior', 'Temporal', 'Historical', 'Contextual'];
const N = AXES.length;
const R = 70;
const CX = 90;
const CY = 90;
const CONTAINER_SIZE = 180;

function getPoints(values: number[], r: number, cx: number, cy: number): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
      const dist = (v / 100) * r;
      return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
    })
    .join(' ');
}

function getAxisEndpoint(i: number) {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  return {
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle),
    labelX: CX + (R + 16) * Math.cos(angle),
    labelY: CY + (R + 16) * Math.sin(angle),
  };
}

type RadarChartProps = {
  values: number[];
  color: string;
  label: string;
};

function RadarChart({ values, color, label }: RadarChartProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const points = getPoints(values, R, CX, CY);
  const bgPoints60 = getPoints(values.map(() => 60), R, CX, CY);
  const rings = [20, 40, 60, 80, 100];

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.chartLabel, { color }]}>{label}</Text>
      <Animated.View style={style}>
        <Svg width={CONTAINER_SIZE} height={CONTAINER_SIZE} viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}>
          {/* Ring gridlines */}
          {rings.map((ring) => (
            <Polygon
              key={ring}
              points={getPoints(Array(N).fill(ring), R, CX, CY)}
              fill="none"
              stroke={COLORS.border}
              strokeWidth={0.8}
            />
          ))}
          {/* Axes */}
          {AXES.map((_, i) => {
            const { x, y } = getAxisEndpoint(i);
            return (
              <Line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke={COLORS.border}
                strokeWidth={0.8}
              />
            );
          })}
          {/* Filled area */}
          <Polygon
            points={points}
            fill={color + '25'}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Axis labels */}
          {AXES.map((axis, i) => {
            const { labelX, labelY } = getAxisEndpoint(i);
            const anchor = labelX < CX - 5 ? 'end' : labelX > CX + 5 ? 'start' : 'middle';
            return (
              <G key={axis}>
                <SvgText
                  x={labelX}
                  y={labelY + 4}
                  fontSize="7"
                  fill={COLORS.textMuted}
                  textAnchor={anchor}
                  fontFamily="Inter_500Medium"
                >
                  {axis}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

type Props = {
  baselineValues: { anomaly: number; behavior: number; temporal: number; historical: number; contextual: number };
  currentValues: { anomaly: number; behavior: number; temporal: number; historical: number; contextual: number };
  userName: string;
};

export function BaselineComparison({ baselineValues, currentValues, userName }: Props) {
  const baselineArr = [
    baselineValues.anomaly,
    baselineValues.behavior,
    baselineValues.temporal,
    baselineValues.historical,
    baselineValues.contextual,
  ];
  const currentArr = [
    currentValues.anomaly,
    currentValues.behavior,
    currentValues.temporal,
    currentValues.historical,
    currentValues.contextual,
  ];

  const deviationPct = Math.round(
    (currentArr.reduce((a, b) => a + b, 0) / baselineArr.reduce((a, b) => a + b, 0) - 1) * 100
  );

  return (
    <GlassCard glowColor={COLORS.critical} style={styles.card}>
      <Text style={styles.title}>BEHAVIORAL DRILL-DOWN</Text>
      <View style={styles.userRow}>
        <View style={styles.userDot} />
        <Text style={styles.userName}>{userName}</Text>
        <View style={[styles.deviationBadge, { backgroundColor: COLORS.criticalDim, borderColor: COLORS.critical + '40' }]}>
          <Text style={[styles.deviationText, { color: COLORS.critical }]}>+{deviationPct}% deviation</Text>
        </View>
      </View>

      <View style={styles.chartsRow}>
        <RadarChart
          values={baselineArr}
          color={COLORS.safe}
          label="30-Day Baseline"
        />
        <View style={styles.divider} />
        <RadarChart
          values={currentArr}
          color={COLORS.critical}
          label="Current Incident"
        />
      </View>

      {/* Dimension bars */}
      {AXES.map((axis, i) => {
        const base = baselineArr[i];
        const curr = currentArr[i];
        const ratio = curr / 100;
        return (
          <View key={axis} style={styles.barRow}>
            <Text style={styles.barLabel}>{axis}</Text>
            <View style={styles.barTrack}>
              {/* Baseline indicator */}
              <View style={[styles.baselineMarker, { left: `${base}%` as any }]} />
              {/* Current fill */}
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width: `${curr}%`,
                    backgroundColor: curr > base * 1.2 ? COLORS.critical : curr > base ? COLORS.high : COLORS.safe,
                  },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{curr}</Text>
          </View>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  title: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.critical,
  },
  userName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
  },
  deviationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  deviationText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  chartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  divider: {
    width: 1,
    height: 120,
    backgroundColor: COLORS.border,
  },
  chartLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 70,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  baselineMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: COLORS.safe,
    borderRadius: 1,
    zIndex: 2,
  },
  barValue: {
    width: 24,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});
