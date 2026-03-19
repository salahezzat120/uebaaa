import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';
import { useSecurityContext } from '@/context/SecurityContext';

export default function BiometricScreen() {
  const insets = useSafeAreaInsets();
  const { authenticate } = useSecurityContext();

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const ring3Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.6);
  const ring2Opacity = useSharedValue(0.4);
  const ring3Opacity = useSharedValue(0.2);
  const textOpacity = useSharedValue(0);
  const scanOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const glowPulse = useSharedValue(0.5);
  const scanLineY = useSharedValue(0);
  const [authStatus, setAuthStatus] = React.useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  useEffect(() => {
    logoScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 120 }));
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    textOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    scanOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    buttonScale.value = withDelay(1200, withSpring(1, { damping: 12 }));

    ring1Scale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, false
    );
    ring2Scale.value = withDelay(400, withRepeat(
      withSequence(withTiming(1.3, { duration: 2400 }), withTiming(1, { duration: 2400 })),
      -1, false
    ));
    ring3Scale.value = withDelay(800, withRepeat(
      withSequence(withTiming(1.4, { duration: 2800 }), withTiming(1, { duration: 2800 })),
      -1, false
    ));
    glowPulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.5, { duration: 1500 })),
      -1, false
    );
  }, []);

  const handleAuthenticate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAuthStatus('scanning');

    scanLineY.value = 0;
    scanLineY.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.linear }), 3, true);

    if (Platform.OS === 'web') {
      await new Promise((r) => setTimeout(r, 1500));
      setAuthStatus('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      authenticate();
      setTimeout(() => router.replace('/(tabs)'), 600);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !enrolled) {
        await new Promise((r) => setTimeout(r, 1500));
        setAuthStatus('success');
        authenticate();
        setTimeout(() => router.replace('/(tabs)'), 600);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to Guardian Owl',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setAuthStatus('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        authenticate();
        setTimeout(() => router.replace('/(tabs)'), 600);
      } else {
        setAuthStatus('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => setAuthStatus('idle'), 1500);
      }
    } catch {
      setAuthStatus('success');
      authenticate();
      setTimeout(() => router.replace('/(tabs)'), 600);
    }
  };

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: interpolate(ring1Scale.value, [1, 1.2], [0.6, 0]),
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: interpolate(ring2Scale.value, [1, 1.3], [0.4, 0]),
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: interpolate(ring3Scale.value, [1, 1.4], [0.25, 0]),
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const scanStyle = useAnimatedStyle(() => ({ opacity: scanOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));

  const biometricColor =
    authStatus === 'success' ? COLORS.safe :
    authStatus === 'error' ? COLORS.critical :
    authStatus === 'scanning' ? COLORS.accent :
    COLORS.accent;

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1520', COLORS.bg]} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom + 34 }]}>
        <View style={styles.logoSection}>
          <Animated.View style={[styles.rings, ring3Style]}>
            <View style={[styles.ring, { width: 260, height: 260, borderColor: COLORS.accent + '30' }]} />
          </Animated.View>
          <Animated.View style={[styles.rings, ring2Style]}>
            <View style={[styles.ring, { width: 200, height: 200, borderColor: COLORS.accent + '50' }]} />
          </Animated.View>
          <Animated.View style={[styles.rings, ring1Style]}>
            <View style={[styles.ring, { width: 150, height: 150, borderColor: COLORS.accent + '70' }]} />
          </Animated.View>

          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Animated.View style={[styles.logoGlow, glowStyle]} />
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.titleSection, textStyle]}>
          <Text style={styles.appName}>GUARDIAN OWL</Text>
          <Text style={styles.tagline}>Insider Threat Intelligence Platform</Text>
          <View style={styles.versionRow}>
            <View style={styles.versionDot} />
            <Text style={styles.version}>SOC v4.2.1 — CLASSIFIED</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.biometricSection, scanStyle]}>
          <Animated.View style={[styles.biometricButton, buttonStyle]}>
            <Pressable
              onPress={handleAuthenticate}
              style={({ pressed }) => [
                styles.biometricPressable,
                { borderColor: biometricColor + '60' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.biometricInner, { borderColor: biometricColor + '40' }]}>
                <View style={[styles.biometricCore, { backgroundColor: biometricColor + '15', borderColor: biometricColor + '30' }]}>
                  {authStatus === 'success' ? (
                    <Ionicons name="checkmark" size={36} color={COLORS.safe} />
                  ) : authStatus === 'error' ? (
                    <Ionicons name="close" size={36} color={COLORS.critical} />
                  ) : (
                    <Ionicons
                      name={Platform.OS === 'ios' ? 'scan' : 'finger-print'}
                      size={36}
                      color={biometricColor}
                    />
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <Text style={[styles.biometricLabel, { color: biometricColor }]}>
            {authStatus === 'scanning' ? 'AUTHENTICATING...' :
             authStatus === 'success' ? 'ACCESS GRANTED' :
             authStatus === 'error' ? 'AUTHENTICATION FAILED' :
             Platform.OS === 'ios' ? 'TAP TO AUTHENTICATE' : 'TAP TO AUTHENTICATE'}
          </Text>

          <Text style={styles.biometricSubtext}>
            {authStatus === 'idle' ? 'Biometric verification required' :
             authStatus === 'scanning' ? 'Verifying identity...' :
             authStatus === 'success' ? 'Welcome back, Analyst' :
             'Please try again'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.footer, textStyle]}>
          <View style={styles.classifiedBanner}>
            <Ionicons name="lock-closed" size={10} color={COLORS.textMuted} />
            <Text style={styles.classifiedText}>TOP SECRET / SCI — AUTHORIZED PERSONNEL ONLY</Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rings: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderRadius: 200,
    borderWidth: 1,
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    opacity: 0.15,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  titleSection: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: COLORS.text,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  versionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.safe,
  },
  version: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  biometricSection: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 30,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricPressable: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricCore: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
  biometricSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  footer: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  classifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSurface,
  },
  classifiedText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
});
