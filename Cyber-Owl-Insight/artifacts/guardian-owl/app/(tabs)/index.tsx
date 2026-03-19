import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';
import { useSecurityContext } from '@/context/SecurityContext';
import { ThreatGauge } from '@/components/ThreatGauge';
import { ModelStatusBar } from '@/components/ModelStatusBar';
import { GlassCard } from '@/components/GlassCard';
import { AlertCard } from '@/components/AlertCard';
import { AIAssistant, AIAssistantButton } from '@/components/AIAssistant';
import { ThreatMap } from '@/components/ThreatMap';
import { CrisisModeBorder } from '@/components/CrisisModeBorder';

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  tiltX = 0,
  tiltY = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  tiltX?: number;
  tiltY?: number;
}) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateX: `${tiltX}deg` },
      { rotateY: `${tiltY}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.statCardWrapper, style]}>
      <GlassCard glowColor={color} style={styles.statCard}>
        <View style={[styles.statIconBg, { backgroundColor: color + '15', borderColor: color + '30' }]}>
          {icon}
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </GlassCard>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, threatLevel, criticalCount, activeCount, modelPerformance, addNewAlert, lockApp } =
    useSecurityContext();
  const [refreshing, setRefreshing] = React.useState(false);
  const [aiVisible, setAiVisible] = useState(false);

  const pulseAnim = useSharedValue(1);
  const headerOpacity = useSharedValue(0);

  // Parallax tilt values (would normally come from DeviceMotion)
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  // Start a subtle auto-parallax shimmer for web
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      false
    );

    // Simulate gentle parallax on web with a sine wave
    if (Platform.OS === 'web') {
      let t = 0;
      const id = setInterval(() => {
        t += 0.02;
        tiltX.value = withTiming(Math.sin(t) * 3, { duration: 100 });
        tiltY.value = withTiming(Math.cos(t * 0.7) * 3, { duration: 100 });
      }, 100);
      return () => clearInterval(id);
    }
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const handleRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      addNewAlert();
      setRefreshing(false);
    }, 1500);
  };

  const handleLock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    lockApp();
    router.replace('/');
  };

  const recentAlerts = alerts.slice(0, 3);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const isCrisis = criticalCount > 0;

  // Read tilt as number for prop
  const tiltXNum = tiltX as unknown as number;
  const tiltYNum = tiltY as unknown as number;

  return (
    <CrisisModeBorder active={isCrisis}>
      <View style={styles.container}>
        <LinearGradient
          colors={isCrisis ? ['rgba(255,59,48,0.08)', COLORS.bg] : ['#0F1828', COLORS.bg]}
          style={[styles.headerBg, { height: topPad + 60 }]}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
        >
          <Animated.View style={[styles.header, headerStyle]}>
            <View>
              <Text style={styles.headerSub}>SECURITY OPERATIONS CENTER</Text>
              <Text style={styles.headerTitle}>Guardian Owl</Text>
            </View>
            <View style={styles.headerActions}>
              {isCrisis && (
                <View style={styles.crisisAlert}>
                  <View style={styles.crisisDot} />
                  <Text style={styles.crisisText}>CRISIS</Text>
                </View>
              )}
              <Pressable onPress={handleLock} style={styles.lockBtn}>
                <Ionicons name="lock-closed" size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>
          </Animated.View>

          <GlassCard glowColor={threatLevel >= 80 ? COLORS.critical : COLORS.accent} style={styles.gaugeCard}>
            <Text style={styles.sectionLabel}>THREAT INTENSITY</Text>
            <View style={styles.gaugeContainer}>
              <ThreatGauge value={threatLevel} />
            </View>
            <View style={styles.gaugeFooter}>
              <View style={styles.gaugeFooterItem}>
                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.gaugeFooterText}>Updated 30s ago</Text>
              </View>
              <View style={styles.gaugeFooterItem}>
                <Ionicons name="globe-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.gaugeFooterText}>Global Scope</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.statsRow}>
            <StatCard
              label="Critical"
              value={criticalCount}
              color={COLORS.critical}
              sub="Alerts"
              icon={<Ionicons name="warning" size={20} color={COLORS.critical} />}
            />
            <StatCard
              label="Active"
              value={activeCount}
              color={COLORS.high}
              sub="Threats"
              icon={<Ionicons name="pulse" size={20} color={COLORS.high} />}
            />
            <StatCard
              label="Resolved"
              value={alerts.filter((a) => a.status === 'resolved').length}
              color={COLORS.safe}
              sub="Today"
              icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.safe} />}
            />
          </View>

          <GlassCard style={styles.modelCard}>
            <ModelStatusBar performance={modelPerformance} />
          </GlassCard>

          {/* Live Threat Map */}
          <ThreatMap />

          <View style={styles.alertsHeader}>
            <Text style={styles.sectionLabel}>RECENT ALERTS</Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/(tabs)/alerts');
              }}
            >
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          {recentAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addNewAlert();
            }}
            style={({ pressed }) => [styles.simulateBtn, pressed && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={[COLORS.accentDim, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.simulateBtnInner}
            >
              <MaterialCommunityIcons name="robot-outline" size={16} color={COLORS.accent} />
              <Text style={styles.simulateBtnText}>Simulate New Alert</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>

        {/* AI Assistant FAB */}
        <AIAssistantButton
          onPress={() => setAiVisible(true)}
          criticalCount={criticalCount}
        />

        {/* AI Assistant Panel */}
        <AIAssistant visible={aiVisible} onClose={() => setAiVisible(false)} />
      </View>
    </CrisisModeBorder>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: COLORS.text,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  crisisAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.criticalDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.critical + '50',
  },
  crisisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.critical,
  },
  crisisText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: COLORS.critical,
    letterSpacing: 1,
  },
  lockBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  gaugeCard: {
    alignItems: 'center',
  },
  gaugeContainer: {
    marginVertical: 4,
  },
  gaugeFooter: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  gaugeFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gaugeFooterText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    marginTop: -2,
  },
  modelCard: {},
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.accent,
  },
  simulateBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  simulateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  simulateBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.accent,
  },
});
