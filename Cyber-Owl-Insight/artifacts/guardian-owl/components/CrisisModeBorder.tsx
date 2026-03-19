import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

function BorderEdge({
  side,
  pulse,
}: {
  side: 'top' | 'bottom' | 'left' | 'right';
  pulse: Animated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 0.9]),
    shadowOpacity: interpolate(pulse.value, [0, 1], [0, 1]),
  }));

  const isHorizontal = side === 'top' || side === 'bottom';

  const posStyle = {
    top: side === 'top' ? 0 : undefined,
    bottom: side === 'bottom' ? 0 : undefined,
    left: side === 'left' ? 0 : undefined,
    right: side === 'right' ? 0 : undefined,
  };

  return (
    <Animated.View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        posStyle,
        {
          backgroundColor: COLORS.critical,
          shadowColor: COLORS.critical,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 20,
        },
        style,
      ]}
    />
  );
}

type Props = {
  active: boolean;
  children: React.ReactNode;
};

export function CrisisModeBorder({ active, children }: Props) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(0, { duration: 600 });
    }
  }, [active]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {active && (
        <>
          <BorderEdge side="top" pulse={pulse} />
          <BorderEdge side="bottom" pulse={pulse} />
          <BorderEdge side="left" pulse={pulse} />
          <BorderEdge side="right" pulse={pulse} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
  },
});
