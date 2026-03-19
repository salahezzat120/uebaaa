import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, getSeverityColor } from '@/constants/colors';
import { useSecurityContext } from '@/context/SecurityContext';
import { RiskRadar } from '@/components/RiskRadar';
import { GlassCard } from '@/components/GlassCard';
import { BiometricConfirm } from '@/components/BiometricConfirm';
import { BaselineComparison } from '@/components/BaselineComparison';

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  highImpact?: boolean;
};

function ActionButton({ icon, label, sublabel, color, onPress, disabled, highImpact }: ActionButtonProps) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  return (
    <Animated.View style={[style, { flex: 1 }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          actionStyles.btn,
          { borderColor: disabled ? COLORS.border : color + '40', opacity: disabled ? 0.5 : 1 },
        ]}
      >
        <LinearGradient
          colors={disabled ? [COLORS.bgSurface, COLORS.bgSurface] : [color + '20', color + '08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={actionStyles.gradient}
        >
          <View style={[actionStyles.iconBg, { backgroundColor: color + '20', borderColor: color + '30' }]}>
            {icon}
          </View>
          <Text style={[actionStyles.label, { color: disabled ? COLORS.textMuted : color }]}>{label}</Text>
          <Text style={actionStyles.sublabel}>{sublabel}</Text>
          {highImpact && !disabled && (
            <View style={[actionStyles.bioBadge, { borderColor: color + '30' }]}>
              <Ionicons name="finger-print" size={9} color={color} />
              <Text style={[actionStyles.bioText, { color }]}>Biometric</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradient: {
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  bioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bioText: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
});

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={metaStyles.item}>
      <View style={metaStyles.iconWrap}>{icon}</View>
      <View style={metaStyles.text}>
        <Text style={metaStyles.label}>{label}</Text>
        <Text style={metaStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.text,
    marginTop: 1,
  },
});

// Baseline values (30-day average, slightly scaled down from current)
function getBaseline(alert: { anomaly: number; behavior: number; temporal: number; historical: number; contextual: number }) {
  return {
    anomaly: Math.max(10, Math.round(alert.anomaly * 0.35)),
    behavior: Math.max(10, Math.round(alert.behavior * 0.40)),
    temporal: Math.max(10, Math.round(alert.temporal * 0.30)),
    historical: Math.max(10, Math.round(alert.historical * 0.45)),
    contextual: Math.max(10, Math.round(alert.contextual * 0.38)),
  };
}

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { alerts, blockUser } = useSecurityContext();
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  // Biometric state
  const [bioVisible, setBioVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle" size={48} color={COLORS.textMuted} />
        <Text style={styles.notFoundText}>Alert not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: COLORS.accent, fontFamily: 'Inter_500Medium', marginTop: 12 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const color = getSeverityColor(alert.severity);
  const isResolved = alert.status === 'resolved' || actionTaken !== null;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const baseline = getBaseline(alert);
  const currentVals = {
    anomaly: alert.anomaly,
    behavior: alert.behavior,
    temporal: alert.temporal,
    historical: alert.historical,
    contextual: alert.contextual,
  };

  const triggerBiometric = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPendingAction(action);
    setBioVisible(true);
  };

  const handleBiometricGranted = () => {
    setBioVisible(false);
    if (pendingAction === 'block') {
      blockUser(alert.id);
      setActionTaken('block');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (pendingAction === 'password') {
      setActionTaken('password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (pendingAction === 'quarantine') {
      setActionTaken('quarantine');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleBlockUser = () => {
    triggerBiometric('block');
  };

  const handlePasswordReset = () => {
    Alert.alert(
      'Force Password Reset',
      `A password reset link will be sent to ${alert.user}. Their current session will be terminated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm with Biometric',
          onPress: () => triggerBiometric('password'),
        },
      ]
    );
  };

  const handleQuarantine = () => {
    Alert.alert(
      'Quarantine Endpoint',
      `${alert.endpoint} will be isolated from the network. The user will lose all network access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm with Biometric',
          style: 'destructive',
          onPress: () => triggerBiometric('quarantine'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[color + '15', COLORS.bg]}
        style={[styles.headerGlow, { height: topPad + 140 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navBar}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={[styles.statusBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: isResolved ? COLORS.safe : color }]} />
            <Text style={[styles.statusText, { color: isResolved ? COLORS.safe : color }]}>
              {isResolved ? 'RESOLVED' : alert.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <View style={[styles.severityBadge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Text style={[styles.severityText, { color }]}>{alert.severity.toUpperCase()} SEVERITY</Text>
          </View>
          <Text style={styles.alertTitle}>{alert.type}</Text>
          <Text style={styles.alertDesc}>{alert.description}</Text>
        </View>

        <GlassCard glowColor={color} style={styles.riskScoreCard}>
          <View style={styles.riskScoreRow}>
            <View>
              <Text style={styles.riskScoreLabel}>COMPOSITE RISK SCORE</Text>
              <Text style={[styles.riskScoreValue, { color }]}>{alert.riskScore}</Text>
              <Text style={styles.riskScoreSub}>Out of 100</Text>
            </View>
            <View style={styles.riskMeter}>
              {Array.from({ length: 10 }).map((_, i) => {
                const segmentValue = (i + 1) * 10;
                const filled = segmentValue <= alert.riskScore;
                const segColor = segmentValue > 80 ? COLORS.critical : segmentValue > 60 ? COLORS.high : segmentValue > 40 ? COLORS.medium : COLORS.safe;
                return (
                  <View
                    key={i}
                    style={[
                      styles.riskSegment,
                      {
                        backgroundColor: filled ? segColor : COLORS.bgSurface,
                        shadowColor: filled ? segColor : 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: filled ? 0.8 : 0,
                        shadowRadius: 4,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.metaCard}>
          <Text style={styles.sectionLabel}>INCIDENT DETAILS</Text>
          <View style={styles.divider} />
          <MetaItem
            icon={<Ionicons name="person" size={14} color={COLORS.accent} />}
            label="User"
            value={alert.user}
          />
          <View style={styles.divider} />
          <MetaItem
            icon={<Ionicons name="business" size={14} color={COLORS.textSecondary} />}
            label="Department"
            value={alert.department}
          />
          <View style={styles.divider} />
          <MetaItem
            icon={<Ionicons name="desktop" size={14} color={COLORS.textSecondary} />}
            label="Endpoint"
            value={alert.endpoint}
          />
          <View style={styles.divider} />
          <MetaItem
            icon={<Ionicons name="time" size={14} color={COLORS.textSecondary} />}
            label="Detected"
            value={alert.time}
          />
        </GlassCard>

        <GlassCard glowColor={COLORS.accent} style={styles.radarCard}>
          <RiskRadar
            anomaly={alert.anomaly}
            behavior={alert.behavior}
            temporal={alert.temporal}
            historical={alert.historical}
            contextual={alert.contextual}
            color={color}
          />
        </GlassCard>

        {/* Behavioral Drill-Down Comparison */}
        <BaselineComparison
          userName={alert.user}
          baselineValues={baseline}
          currentValues={currentVals}
        />

        {isResolved && actionTaken ? (
          <GlassCard glowColor={COLORS.safe} style={styles.actionConfirm}>
            <View style={styles.actionConfirmRow}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.safe} />
              <View style={styles.actionConfirmText}>
                <Text style={styles.actionConfirmTitle}>Action Executed</Text>
                <Text style={styles.actionConfirmSub}>
                  {actionTaken === 'block' && `${alert.user} has been blocked.`}
                  {actionTaken === 'password' && `Password reset sent to ${alert.user}.`}
                  {actionTaken === 'quarantine' && `${alert.endpoint} has been quarantined.`}
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <View>
            <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>TAKE ACTION</Text>
            <View style={styles.actionsRow}>
              <ActionButton
                icon={<Ionicons name="ban" size={20} color={COLORS.critical} />}
                label="Block User"
                sublabel="Disable account access"
                color={COLORS.critical}
                onPress={handleBlockUser}
                disabled={isResolved}
                highImpact
              />
              <ActionButton
                icon={<Ionicons name="key" size={20} color={COLORS.medium} />}
                label="Reset Password"
                sublabel="Force credential rotation"
                color={COLORS.medium}
                onPress={handlePasswordReset}
                disabled={isResolved}
                highImpact
              />
              <ActionButton
                icon={<Ionicons name="shield" size={20} color={COLORS.high} />}
                label="Quarantine"
                sublabel="Isolate from network"
                color={COLORS.high}
                onPress={handleQuarantine}
                disabled={isResolved}
                highImpact
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Biometric confirmation modal */}
      <BiometricConfirm
        visible={bioVisible}
        actionLabel={
          pendingAction === 'block'
            ? `Block ${alert.user}`
            : pendingAction === 'password'
            ? `Reset Password for ${alert.user}`
            : `Quarantine ${alert.endpoint}`
        }
        onGranted={handleBiometricGranted}
        onDenied={() => setBioVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  notFound: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: COLORS.textMuted,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    marginTop: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: COLORS.accent,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  titleSection: {
    gap: 8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  alertTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: COLORS.text,
    lineHeight: 30,
  },
  alertDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  riskScoreCard: {},
  riskScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskScoreLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  riskScoreValue: {
    fontSize: 52,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -3,
    marginTop: 4,
  },
  riskScoreSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  riskMeter: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-end',
  },
  riskSegment: {
    width: 8,
    borderRadius: 2,
    height: 32,
  },
  metaCard: {
    gap: 0,
  },
  radarCard: {},
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionConfirm: {
    borderColor: COLORS.safe + '30',
  },
  actionConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionConfirmText: {
    flex: 1,
  },
  actionConfirmTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.safe,
  },
  actionConfirmSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
