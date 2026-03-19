import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';

type Phase = 'scanning' | 'granted' | 'denied';

type Props = {
  visible: boolean;
  actionLabel: string;
  onGranted: () => void;
  onDenied: () => void;
};

function ScanLines() {
  const scanY = useSharedValue(-80);
  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(80, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style, { overflow: 'hidden', pointerEvents: 'none' }]}
    >
      <View
        style={{
          height: 2,
          backgroundColor: 'rgba(0,212,255,0.5)',
          shadowColor: COLORS.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
        }}
      />
    </Animated.View>
  );
}

function FaceIDGrid() {
  const dots = Array.from({ length: 25 });
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 120, gap: 8 }}>
      {dots.map((_, i) => {
        const lit = Math.random() > 0.4;
        return (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: lit ? COLORS.accent : COLORS.bgSurface,
              opacity: lit ? 0.5 + Math.random() * 0.5 : 0.2,
            }}
          />
        );
      })}
    </View>
  );
}

export function BiometricConfirm({ visible, actionLabel, onGranted, onDenied }: Props) {
  const [phase, setPhase] = useState<Phase>('scanning');

  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);
  const greenFlash = useSharedValue(0);
  const statusOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setPhase('scanning');
      overlayOpacity.value = withTiming(1, { duration: 250 });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 200 });
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 900 }), withTiming(0.4, { duration: 900 })),
        -1,
        false
      );

      // Auto-grant after 2.5s simulation
      const t = setTimeout(() => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('granted');
        greenFlash.value = withTiming(1, { duration: 400 });
        statusOpacity.value = withTiming(1, { duration: 300 });
        setTimeout(() => {
          overlayOpacity.value = withTiming(0, { duration: 400 });
          cardScale.value = withTiming(1.05, { duration: 200 });
          setTimeout(onGranted, 600);
        }, 1400);
      }, 2600);

      return () => clearTimeout(t);
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.85, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
      greenFlash.value = withTiming(0, { duration: 100 });
      statusOpacity.value = withTiming(0);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const greenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(greenFlash.value, [0, 1], [0, 0.85]),
  }));
  const statusStyle = useAnimatedStyle(() => ({ opacity: statusOpacity.value }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
        {/* Green GRANTED flash */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.safe }, greenStyle]}
          pointerEvents="none"
        />

        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={['rgba(0,212,255,0.1)', 'rgba(0,212,255,0.02)', 'transparent']}
            style={styles.cardGradient}
          >
            {/* Scan rings */}
            <View style={styles.scanContainer}>
              <Animated.View style={[styles.outerRing, ringStyle]} />
              <View style={styles.innerRing}>
                <ScanLines />
                <FaceIDGrid />
              </View>
            </View>

            {phase === 'scanning' && (
              <View style={styles.textSection}>
                <Text style={styles.title}>BIOMETRIC VERIFICATION</Text>
                <Text style={styles.subtitle}>{actionLabel}</Text>
                <Text style={styles.hint}>Scanning identity matrix...</Text>
              </View>
            )}

            {phase === 'granted' && (
              <Animated.View style={[styles.textSection, statusStyle]}>
                <Ionicons name="checkmark-circle" size={40} color={COLORS.safe} />
                <Text style={[styles.title, { color: COLORS.safe }]}>ACCESS GRANTED</Text>
                <Text style={styles.hint}>Executing SOAR action...</Text>
              </Animated.View>
            )}

            {phase === 'denied' && (
              <Animated.View style={[styles.textSection, statusStyle]}>
                <Ionicons name="close-circle" size={40} color={COLORS.critical} />
                <Text style={[styles.title, { color: COLORS.critical }]}>ACCESS DENIED</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 280,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    backgroundColor: '#0D1520',
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 28,
  },
  scanContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  innerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,212,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: COLORS.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
