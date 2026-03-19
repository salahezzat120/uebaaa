import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, getSeverityColor, type SeverityLevel } from '@/constants/colors';
import { useSecurityContext } from '@/context/SecurityContext';
import { AlertCard } from '@/components/AlertCard';
import type { Alert } from '@/context/SecurityContext';

type FilterType = 'all' | 'active' | 'critical' | 'resolved';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'critical', label: 'Critical' },
  { key: 'resolved', label: 'Resolved' },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, criticalCount, activeCount, addNewAlert } = useSecurityContext();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.status === 'active';
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      addNewAlert();
      setRefreshing(false);
    }, 1500);
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F1828', COLORS.bg]}
        style={[styles.headerBg, { height: topPad + 120 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>REAL-TIME FEED</Text>
            <Text style={styles.headerTitle}>Alert Console</Text>
          </View>
          <View style={styles.headerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryPill label="Critical" count={criticalCount} color={COLORS.critical} />
          <SummaryPill label="Active" count={activeCount} color={COLORS.high} />
          <SummaryPill label="Total" count={alerts.length} color={COLORS.accent} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.key);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  filter === f.key && styles.filterChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {filter === f.key && (
                  <LinearGradient
                    colors={[COLORS.accentDim, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{filtered.length} alerts</Text>
          <View style={styles.sortRow}>
            <Ionicons name="funnel-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.sortText}>Most Recent</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.safe} />
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptyText}>No alerts match the current filter</Text>
          </View>
        ) : (
          filtered.map((alert, i) => (
            <AlertCard key={alert.id} alert={alert} isNew={i === 0 && alert.time === 'Just now'} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SummaryPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.summaryPill, { borderColor: color + '30', backgroundColor: color + '0D' }]}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.criticalDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.critical + '40',
    marginTop: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.critical,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.critical,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  summaryCount: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterScroll: {
    marginHorizontal: -16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSurface,
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: COLORS.borderAccent,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
