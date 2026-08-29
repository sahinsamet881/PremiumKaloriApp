import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK } from '@/constants/luxTheme';

export const SCREEN_HEADER_ICERIK_YUKSEKLIGI = 52;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type ScreenHeaderProps = {
  baslik: string;
  altBaslik?: string;
  sag?: ReactNode;
  scrollY?: Animated.Value;
};

export function ScreenHeader({ baslik, altBaslik, sag, scrollY }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const blurYogunlugu = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 44], extrapolate: 'clamp' })
    : 40;
  const cizgiOpaklik = scrollY
    ? scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' })
    : 1;

  return (
    <View style={[styles.kapsayici, { paddingTop: insets.top }]} pointerEvents="box-none">
      <AnimatedBlurView
        tint="dark"
        intensity={blurYogunlugu}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Animated.View style={[styles.altCizgi, { opacity: cizgiOpaklik }]} pointerEvents="none" />
      <View style={styles.satir} pointerEvents="box-none">
        <View style={styles.metinAlani} pointerEvents="none">
          <Text style={styles.baslik} numberOfLines={1}>
            {baslik}
          </Text>
          {altBaslik ? (
            <Text style={styles.altBaslik} numberOfLines={1}>
              {altBaslik}
            </Text>
          ) : null}
        </View>
        {sag ? <View style={styles.sagAlan}>{sag}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  altCizgi: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ALTIN_COK_SOLUK,
  },
  satir: {
    height: SCREEN_HEADER_ICERIK_YUKSEKLIGI,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    gap: 12,
  },
  metinAlani: {
    flex: 1,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  altBaslik: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  sagAlan: {
    flexShrink: 0,
  },
});
