import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ALTIN, ALTIN_ORTA_SOLUK } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CalorieRingProps = {
  size?: number;
  strokeWidth?: number;
};

export function CalorieRing({ size = 280, strokeWidth = 20 }: CalorieRingProps) {
  const { kullanici } = useVeri();
  const { gunlukHedefKalori, bugunAlinanKalori } = kullanici;

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
          stroke={ALTIN}
          strokeWidth={strokeWidth}
          strokeOpacity={0.18}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ALTIN}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={cevre}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.merkez}>
        <Text style={[styles.kalanSayi, { fontSize: size * 0.229, lineHeight: size * 0.279 }]}>
          {Math.round(kalanKalori)}
        </Text>
        <Text style={[styles.etiket, { fontSize: size * 0.054 }]}>kalori kaldı</Text>
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
    color: ALTIN,
    fontWeight: '600',
    letterSpacing: -1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  etiket: {
    color: ALTIN_ORTA_SOLUK,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 4,
  },
});
