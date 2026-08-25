import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CalorieRingProps = {
  gunlukHedefKalori: number;
  bugunAlinanKalori: number;
  size?: number;
  strokeWidth?: number;
};

export function CalorieRing({
  gunlukHedefKalori,
  bugunAlinanKalori,
  size = 280,
  strokeWidth = 20,
}: CalorieRingProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const kalanKalori = gunlukHedefKalori - bugunAlinanKalori;
  const oran = gunlukHedefKalori > 0 ? bugunAlinanKalori / gunlukHedefKalori : 0;
  const sinirliOran = Math.min(Math.max(oran, 0), 1);

  const radius = (size - strokeWidth) / 2;
  const cevre = 2 * Math.PI * radius;

  const ilerleme = useSharedValue(0);

  useEffect(() => {
    ilerleme.value = withTiming(sinirliOran, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [sinirliOran, ilerleme]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: cevre * (1 - ilerleme.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.icon}
          strokeWidth={strokeWidth}
          strokeOpacity={0.15}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.tint}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={cevre}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.merkez}>
        <ThemedText style={styles.kalanSayi}>{Math.round(kalanKalori)}</ThemedText>
        <ThemedText style={[styles.etiket, { color: palette.icon }]}>kalori kaldı</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  merkez: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  kalanSayi: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -1,
  },
  etiket: {
    fontSize: 15,
    marginTop: 4,
  },
});
