import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getSeverityColor, type SeverityLevel } from '@/constants/colors';
import { useSecurityContext } from '@/context/SecurityContext';
import type { Alert } from '@/context/SecurityContext';

type Props = {
  alert: Alert;
  isNew?: boolean;
};

function SeverityStripe({ severity }: { severity: SeverityLevel }) {
  const color = getSeverityColor(severity);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    if (severity === 'critical') {
      glow.value = withRepeat(
        withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
        -1,
        false
      );
    }
  }, [severity]);

  const stripeStyle = useAnimatedStyle(() => ({
    shadowOpacity: severity === 'critical' ? glow.value : 0.8,
  }));

  return (
    <Animated.View
      style={[
        styles.stripe,
        {
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
        },
        stripeStyle,
      ]}
    />
  );
}

// Quick action popup on long press
function QuickActionMenu({
  visible,
  onResolve,
  onDismiss,
}: {
  visible: boolean;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 180 });
      scale.value = withSpring(1, { damping: 16, stiffness: 280 });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      scale.value = withTiming(0.8, { duration: 120 });
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.quickMenu, style]}>
      <Pressable
        onPress={onResolve}
        style={({ pressed }) => [styles.quickAction, { borderColor: COLORS.safe + '40' }, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="checkmark-circle" size={16} color={COLORS.safe} />
        <Text style={[styles.quickActionText, { color: COLORS.safe }]}>Quick Resolve</Text>
      </Pressable>
      <View style={styles.quickDivider} />
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.quickActionText}>Dismiss</Text>
      </Pressable>
    </Animated.View>
  );
}

export function AlertCard({ alert, isNew }: Props) {
  const color = getSeverityColor(alert.severity);
  const { blockUser, dismissAlert } = useSecurityContext();
  const [showMenu, setShowMenu] = useState(false);

  const translateY = useSharedValue(isNew ? -60 : 0);
  const opacity = useSharedValue(isNew ? 0 : 1);
  const scale = useSharedValue(isNew ? 0.95 : 1);
  const pressScale = useSharedValue(1);
  const longPressScale = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    if (isNew && !mounted.current) {
      mounted.current = true;
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 180 });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value * pressScale.value * longPressScale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (showMenu) { setShowMenu(false); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/alert/[id]', params: { id: alert.id } });
  };

  const handlePressIn = () => {
    pressScale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    longPressScale.value = withSequence(
      withTiming(0.94, { duration: 100 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    setShowMenu(true);
  };

  const handleResolve = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMenu(false);
    blockUser(alert.id);
  };

  const handleDismiss = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowMenu(false);
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.9, { duration: 300 });
    setTimeout(() => dismissAlert(alert.id), 320);
  };

  const statusIcon =
    alert.status === 'resolved'
      ? 'checkmark-circle'
      : alert.status === 'investigating'
      ? 'search'
      : 'alert-circle';
  const statusColor =
    alert.status === 'resolved'
      ? COLORS.safe
      : alert.status === 'investigating'
      ? COLORS.medium
      : color;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={600}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: color + '22',
              shadowColor: color,
              shadowOpacity: isNew ? 0.25 : 0.1,
            },
          ]}
        >
          <SeverityStripe severity={alert.severity} />
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.typeRow}>
                <Text style={styles.type} numberOfLines={1}>{alert.type}</Text>
                {isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newText}>NEW</Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                <Ionicons name={statusIcon} size={12} color={statusColor} />
                <Text style={[styles.status, { color: statusColor }]}>
                  {alert.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.user} numberOfLines={1}>{alert.user}</Text>
            <View style={styles.footer}>
              <View style={styles.riskContainer}>
                <Text style={styles.riskLabel}>RISK</Text>
                <Text style={[styles.riskScore, { color }]}>{alert.riskScore}</Text>
              </View>
              <View style={styles.deptContainer}>
                <Ionicons name="business-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.dept}>{alert.department}</Text>
              </View>
              <Text style={styles.time}>{alert.time}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.chevron} />
        </View>
      </Pressable>

      {/* Long-press quick menu */}
      <QuickActionMenu
        visible={showMenu}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  stripe: {
    width: 4,
    borderRadius: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  type: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.text,
    flex: 1,
  },
  newBadge: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  newText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  status: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  user: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  riskLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  riskScore: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  deptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dept: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    marginLeft: 'auto',
  },
  chevron: {
    alignSelf: 'center',
    marginRight: 10,
  },
  quickMenu: {
    backgroundColor: '#0D1520',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: -6,
    marginBottom: 6,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
  },
  quickDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
