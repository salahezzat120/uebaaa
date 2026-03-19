import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  glowColor?: string;
  noPadding?: boolean;
};

export function GlassCard({ children, style, glowColor, noPadding }: Props) {
  return (
    <View
      style={[
        styles.card,
        noPadding && styles.noPadding,
        glowColor && {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});
