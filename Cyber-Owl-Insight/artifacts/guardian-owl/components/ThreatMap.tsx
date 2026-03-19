import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { GlassCard } from './GlassCard';

const { width } = Dimensions.get('window');
const MAP_W = width - 64;
const MAP_H = MAP_W * 0.55;

// Hotspots: [cx%, cy%, severity, label]
const HOTSPOTS: [number, number, string, string][] = [
  [0.22, 0.38, COLORS.critical, 'New York'],
  [0.47, 0.45, COLORS.high, 'London'],
  [0.78, 0.42, COLORS.critical, 'Tokyo'],
  [0.35, 0.65, COLORS.medium, 'São Paulo'],
  [0.62, 0.3, COLORS.high, 'Moscow'],
];

// Location-hop arcs: [from index, to index]
const HOPS: [number, number][] = [[1, 2], [0, 4]];

function PulsingHotspot({
  cx,
  cy,
  color,
  label,
  delay,
}: {
  cx: number;
  cy: number;
  color: string;
  label: string;
  delay: number;
}) {
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    ring1.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false)
    );
    ring2.value = withDelay(
      delay + 600,
      withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 0.5, 1], [0.7, 0.3, 0]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [1, 3]) }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring2.value, [0, 0.5, 1], [0.5, 0.2, 0]),
    transform: [{ scale: interpolate(ring2.value, [0, 1], [1, 5]) }],
  }));

  const DOT = 8;

  return (
    <View style={{ position: 'absolute', left: cx - DOT / 2, top: cy - DOT / 2, width: DOT, height: DOT }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: 999, backgroundColor: color, borderWidth: 1, borderColor: color + '88' },
          ring2Style,
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: 999, backgroundColor: color },
          ring1Style,
        ]}
      />
      <View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color }} />
    </View>
  );
}

function ArcLine({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  // Build SVG arc path
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - 40;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;

  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0, width: MAP_W, height: MAP_H }}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
    >
      <Defs>
        <RadialGradient id={`grad${x1}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6,4"
        opacity={0.7}
      />
      <Circle cx={x2} cy={y2} r={4} fill={color} opacity={0.5} />
    </Svg>
  );
}

export function ThreatMap() {
  const headerGlow = useSharedValue(0.5);

  useEffect(() => {
    headerGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0.3, { duration: 1800 })),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: headerGlow.value }));

  // World map simplified SVG path (very simplified continents for stylized look)
  const continentPaths = [
    // North America
    'M 40 80 L 80 60 L 120 65 L 130 90 L 110 120 L 70 125 L 40 105 Z',
    // South America
    'M 85 135 L 105 130 L 120 155 L 115 185 L 95 190 L 78 175 L 75 150 Z',
    // Europe
    'M 200 60 L 230 55 L 245 70 L 240 85 L 215 90 L 200 80 Z',
    // Africa
    'M 200 100 L 225 95 L 240 115 L 235 155 L 215 165 L 195 155 L 190 130 L 195 110 Z',
    // Asia
    'M 245 55 L 320 50 L 350 60 L 360 85 L 340 100 L 300 105 L 260 95 L 240 80 L 245 55 Z',
    // Australia
    'M 310 140 L 345 135 L 360 150 L 355 170 L 330 175 L 310 165 Z',
  ];

  return (
    <GlassCard glowColor={COLORS.critical} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>LIVE THREAT MAP</Text>
        <Animated.View style={[styles.liveBadge, glowStyle]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </Animated.View>
      </View>

      <View style={[styles.mapContainer, { width: MAP_W, height: MAP_H }]}>
        {/* Grid lines */}
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        >
          {/* Latitude lines */}
          {[0.2, 0.4, 0.6, 0.8].map((y) => (
            <Line
              key={`lat${y}`}
              x1={0}
              y1={MAP_H * y}
              x2={MAP_W}
              y2={MAP_H * y}
              stroke={COLORS.border}
              strokeWidth={0.5}
            />
          ))}
          {/* Longitude lines */}
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((x) => (
            <Line
              key={`lon${x}`}
              x1={MAP_W * x}
              y1={0}
              x2={MAP_W * x}
              y2={MAP_H}
              stroke={COLORS.border}
              strokeWidth={0.5}
            />
          ))}
          {/* Simplified continent blobs */}
          <G opacity={0.25}>
            {continentPaths.map((d, i) => (
              <Path key={i} d={d} fill={COLORS.textMuted} />
            ))}
          </G>
        </Svg>

        {/* Location-hop arcs */}
        {HOPS.map(([fromIdx, toIdx], i) => {
          const from = HOTSPOTS[fromIdx];
          const to = HOTSPOTS[toIdx];
          return (
            <ArcLine
              key={i}
              x1={from[0] * MAP_W}
              y1={from[1] * MAP_H}
              x2={to[0] * MAP_W}
              y2={to[1] * MAP_H}
              color={COLORS.critical}
            />
          );
        })}

        {/* Hotspots */}
        {HOTSPOTS.map(([cx, cy, color, label], i) => (
          <PulsingHotspot
            key={i}
            cx={cx * MAP_W}
            cy={cy * MAP_H}
            color={color}
            label={label}
            delay={i * 400}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.critical }]} />
          <Text style={styles.legendText}>Critical Anomaly</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.high }]} />
          <Text style={styles.legendText}>High Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.medium }]} />
          <Text style={styles.legendText}>Medium Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={{ width: 16, height: 1.5, backgroundColor: COLORS.critical, marginRight: 4, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.critical }} />
          <Text style={styles.legendText}>Location Hop</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.criticalDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.critical + '40',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.critical,
  },
  liveText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.critical,
    letterSpacing: 1,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,212,255,0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
});
