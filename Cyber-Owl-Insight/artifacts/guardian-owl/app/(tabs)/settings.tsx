import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';
import { useSecurityContext } from '@/context/SecurityContext';
import { GlassCard } from '@/components/GlassCard';
import type { SecuritySettings } from '@/context/SecurityContext';

type SliderProps = {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  color?: string;
  format?: 'percent' | 'score';
};

function CyberSlider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 1,
  color = COLORS.accent,
  format = 'percent',
}: SliderProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const trackRef = React.useRef<View>(null);

  const displayValue = format === 'percent'
    ? `${Math.round(value * 100)}%`
    : Math.round(value).toString();

  const fillRatio = (value - min) / (max - min);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Haptics.selectionAsync();
    },
    onPanResponderMove: (_, gestureState) => {
      if (containerWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, gestureState.moveX / containerWidth));
      const newValue = min + ratio * (max - min);
      onValueChange(newValue);
      Haptics.selectionAsync();
    },
  });

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.value, { color }]}>{displayValue}</Text>
      </View>
      <View
        style={sliderStyles.track}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={sliderStyles.trackBg} />
        <View style={[sliderStyles.trackFill, { width: `${fillRatio * 100}%`, backgroundColor: color }]} />
        <View
          style={[
            sliderStyles.thumb,
            {
              left: `${fillRatio * 100}%`,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  track: {
    height: 36,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  color?: string;
  warning?: boolean;
};

function ToggleRow({ icon, label, subtitle, value, onToggle, color = COLORS.accent, warning }: ToggleRowProps) {
  const handleToggle = (newValue: boolean) => {
    if (warning && newValue) {
      Alert.alert(
        'Enable Autonomous Response',
        'This will allow the system to automatically take action on flagged users without manual review. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onToggle(newValue);
            },
          },
        ]
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(newValue);
    }
  };

  return (
    <View style={toggleStyles.row}>
      <View style={[toggleStyles.iconBg, { backgroundColor: color + '15', borderColor: color + '30' }]}>
        {icon}
      </View>
      <View style={toggleStyles.text}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Text style={toggleStyles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={handleToggle}
        trackColor={{ false: COLORS.bgSurface, true: color + '50' }}
        thumbColor={value ? color : COLORS.textMuted}
        ios_backgroundColor={COLORS.bgSurface}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSecurityContext();
  const [localSettings, setLocalSettings] = useState<SecuritySettings>(settings);
  const [saved, setSaved] = useState(false);

  const updateLocal = (patch: Partial<SecuritySettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F1828', COLORS.bg]}
        style={[styles.headerBg, { height: topPad + 80 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>CONFIGURATION</Text>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <LinearGradient
              colors={saved ? [COLORS.safe, COLORS.safe + 'CC'] : [COLORS.accent, '#0099BB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGrad}
            >
              <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={14} color="#000" />
              <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save'}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <GlassCard glowColor={COLORS.accent} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={16} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>RISK SCORING WEIGHTS</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Adjust the relative importance of each scoring factor in the threat model.
          </Text>
          <View style={styles.sliders}>
            <CyberSlider
              label="Anomaly Detection"
              value={localSettings.anomalyWeight}
              onValueChange={(v) => updateLocal({ anomalyWeight: v })}
              color={COLORS.critical}
            />
            <View style={styles.divider} />
            <CyberSlider
              label="Behavioral Analysis"
              value={localSettings.behaviorWeight}
              onValueChange={(v) => updateLocal({ behaviorWeight: v })}
              color={COLORS.high}
            />
            <View style={styles.divider} />
            <CyberSlider
              label="Temporal Patterns"
              value={localSettings.temporalWeight}
              onValueChange={(v) => updateLocal({ temporalWeight: v })}
              color={COLORS.medium}
            />
            <View style={styles.divider} />
            <CyberSlider
              label="Historical Baseline"
              value={localSettings.historicalWeight}
              onValueChange={(v) => updateLocal({ historicalWeight: v })}
              color={COLORS.accent}
            />
            <View style={styles.divider} />
            <CyberSlider
              label="Contextual Factors"
              value={localSettings.contextualWeight}
              onValueChange={(v) => updateLocal({ contextualWeight: v })}
              color={COLORS.safe}
            />
          </View>
        </GlassCard>

        <GlassCard glowColor={COLORS.high} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={16} color={COLORS.high} />
            <Text style={styles.sectionTitle}>SEVERITY THRESHOLDS</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Define the minimum risk score required to trigger each severity level.
          </Text>
          <View style={styles.sliders}>
            <CyberSlider
              label="Critical Threshold"
              value={localSettings.criticalThreshold}
              onValueChange={(v) => updateLocal({ criticalThreshold: v })}
              min={0}
              max={100}
              color={COLORS.critical}
              format="score"
            />
            <View style={styles.divider} />
            <CyberSlider
              label="High Threshold"
              value={localSettings.highThreshold}
              onValueChange={(v) => updateLocal({ highThreshold: v })}
              min={0}
              max={100}
              color={COLORS.high}
              format="score"
            />
            <View style={styles.divider} />
            <CyberSlider
              label="Medium Threshold"
              value={localSettings.mediumThreshold}
              onValueChange={(v) => updateLocal({ mediumThreshold: v })}
              min={0}
              max={100}
              color={COLORS.medium}
              format="score"
            />
          </View>
        </GlassCard>

        <GlassCard glowColor={COLORS.critical} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="robot" size={16} color={COLORS.critical} />
            <Text style={styles.sectionTitle}>AUTONOMOUS SOAR RESPONSES</Text>
          </View>
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={12} color={COLORS.high} />
            <Text style={styles.warningText}>
              Automated responses will execute without manual confirmation.
            </Text>
          </View>
          <View style={styles.toggles}>
            <ToggleRow
              icon={<Ionicons name="ban" size={16} color={COLORS.critical} />}
              label="Auto-Block User"
              subtitle="Immediately disable compromised accounts"
              value={localSettings.autonomousBlock}
              onToggle={(v) => updateLocal({ autonomousBlock: v })}
              color={COLORS.critical}
              warning
            />
            <View style={styles.divider} />
            <ToggleRow
              icon={<Ionicons name="key" size={16} color={COLORS.medium} />}
              label="Auto Password Reset"
              subtitle="Force credential rotation on suspicious logins"
              value={localSettings.autonomousPasswordReset}
              onToggle={(v) => updateLocal({ autonomousPasswordReset: v })}
              color={COLORS.medium}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon={<Ionicons name="shield" size={16} color={COLORS.high} />}
              label="Auto Quarantine Endpoint"
              subtitle="Isolate devices from network access"
              value={localSettings.autonomousQuarantine}
              onToggle={(v) => updateLocal({ autonomousQuarantine: v })}
              color={COLORS.high}
              warning
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
            <Text style={styles.sectionTitle}>SYSTEM INFORMATION</Text>
          </View>
          <View style={styles.infoRows}>
            <InfoRow label="Platform Version" value="SOC v4.2.1" />
            <InfoRow label="ML Model" value="GuardianNet v7.3" />
            <InfoRow label="Last Updated" value="Mar 19, 2026" />
            <InfoRow label="License" value="Enterprise — Active" valueColor={COLORS.safe} />
            <InfoRow label="Data Retention" value="90 Days" />
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
  },
});

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
  saveBtn: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  sliders: {
    gap: 0,
  },
  toggles: {
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.highDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.high + '30',
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.high,
    lineHeight: 16,
  },
  infoRows: {
    gap: 2,
  },
});
