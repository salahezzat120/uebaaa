import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  size: number;
  color: string;
  opacity?: number;
  borderWidth?: number;
};

export function GlowRing({ size, color, opacity = 0.3, borderWidth = 1 }: Props) {
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth,
          opacity,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
});
