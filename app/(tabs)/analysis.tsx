import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ScreenHeader, SCREEN_HEADER_ICERIK_YUKSEKLIGI } from '@/components/screen-header';
import {
  ALTIN,
  ALTIN_COK_SOLUK,
  ALTIN_ORTA_SOLUK,
  ALTIN_SOLUK,
  SIYAH,
  SURFACE,
} from '@/constants/luxTheme';
import { PREMIUM_AKTIF } from '@/constants/premium';
import { useVeri } from '@/context/DataContext';

type MakroSatiriProps = {
  etiket: string;
  yuzde: number;
};

function MakroSatiri({ etiket, yuzde }: MakroSatiriProps) {
  return (
    <View style={stiller.makroSatiri}>
      <View style={stiller.makroUstSatir}>
        <Text style={stiller.makroEtiket}>{etiket}</Text>
        <Text style={stiller.makroYuzde}>{`%${yuzde}`}</Text>
      </View>
      <View style={stiller.makroCubukArkaPlan}>
        <View style={[stiller.makroCubukDolu, { width: `${yuzde}%` }]} />
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const { kullanici, profilSifirla } = useVeri();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const profiliSifirlaSor = () => {
    Alert.alert(
      'Profili Güncelle',
      'Soru-cevap ekranına dönmek üzeresin. Mevcut profil bilgilerin sıfırlanacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam Et',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            profilSifirla();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const premiumaGec = () => {
    Alert.alert('Çok Yakında', 'Premium deneyim kapıda, sabırsızlanıyoruz!');
  };

  const proteinKalori = kullanici.makroHedefleri.protein * 4;
  const karbKalori = kullanici.makroHedefleri.karbonhidrat * 4;
  const yagKalori = kullanici.makroHedefleri.yag * 9;
  const toplamKalori = proteinKalori + karbKalori + yagKalori || 1;

  const proteinYuzde = Math.round((proteinKalori / toplamKalori) * 100);
  const karbYuzde = Math.round((karbKalori / toplamKalori) * 100);
  const yagYuzde = Math.max(0, 100 - proteinYuzde - karbYuzde);

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <ScreenHeader
        baslik="Analiz"
        scrollY={scrollY}
        sag={
          <Pressable
            onPress={profiliSifirlaSor}
            style={({ pressed }) => [
              stiller.profilButonu,
              pressed ? stiller.profilButonuBasili : null,
            ]}>
            <MaterialCommunityIcons name="account-cog-outline" size={16} color={ALTIN} />
            <Text style={stiller.profilButonuYazisi}>Profili Güncelle</Text>
          </Pressable>
        }
      />
      <Animated.ScrollView
        contentContainerStyle={[
          stiller.icerik,
          { paddingTop: insets.top + SCREEN_HEADER_ICERIK_YUKSEKLIGI + 12 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}>
        {PREMIUM_AKTIF ? (
          <>
            <View style={stiller.kart}>
              <Text style={stiller.kartBasligi}>Haftalık İlerleme</Text>
              <View style={stiller.grafikAlani}>
                <Svg width="100%" height="100%" viewBox="0 0 300 120">
                  <Path
                    d="M0,95 C35,30 65,110 100,65 C135,20 165,105 200,55 C230,15 265,80 300,45"
                    stroke={ALTIN}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <Text style={stiller.grafikNotu}>Veriler yeterince birikince burada canlanacak.</Text>
            </View>

            <View style={stiller.kart}>
              <Text style={stiller.kartBasligi}>Makro Dağılımı</Text>
              <MakroSatiri etiket="Protein" yuzde={proteinYuzde} />
              <MakroSatiri etiket="Karbonhidrat" yuzde={karbYuzde} />
              <MakroSatiri etiket="Yağ" yuzde={yagYuzde} />
            </View>
          </>
        ) : (
          <View style={stiller.kilitKarti}>
            <View style={stiller.kilitIkon}>
              <MaterialCommunityIcons name="crown" size={38} color={SIYAH} />
            </View>
            <Text style={stiller.kilitBaslik}>Detaylı Analiz{'\n'}Premium&apos;a Özel</Text>
            <Text style={stiller.kilitAciklama}>
              Haftalık ilerleme grafiğin, makro dağılımın ve kişisel trend yorumların Premium üyelere
              açık.
            </Text>
            <View style={stiller.kilitListe}>
              <View style={stiller.kilitSatiri}>
                <MaterialCommunityIcons name="chart-line" size={18} color={ALTIN} />
                <Text style={stiller.kilitSatiriYazisi}>Haftalık ilerleme grafiği</Text>
              </View>
              <View style={stiller.kilitSatiri}>
                <MaterialCommunityIcons name="chart-donut" size={18} color={ALTIN} />
                <Text style={stiller.kilitSatiriYazisi}>Detaylı makro dağılımı</Text>
              </View>
              <View style={stiller.kilitSatiri}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={ALTIN} />
                <Text style={stiller.kilitSatiriYazisi}>Kişisel trend yorumları</Text>
              </View>
            </View>
            <Pressable onPress={premiumaGec} style={stiller.premiumButonu}>
              <MaterialCommunityIcons name="star-four-points" size={18} color={SIYAH} />
              <Text style={stiller.premiumButonuYazisi}>Premium&apos;a Geç</Text>
            </Pressable>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  profilButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  profilButonuBasili: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  profilButonuYazisi: {
    color: ALTIN,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  kart: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  kartBasligi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  grafikAlani: {
    height: 120,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 14,
    overflow: 'hidden',
  },
  grafikNotu: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  makroSatiri: {
    marginBottom: 14,
  },
  makroUstSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  makroEtiket: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  makroYuzde: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
  },
  makroCubukArkaPlan: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ALTIN_COK_SOLUK,
    overflow: 'hidden',
  },
  makroCubukDolu: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ALTIN,
  },
  kilitKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  kilitIkon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  kilitBaslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 30,
    marginTop: 18,
  },
  kilitAciklama: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  kilitListe: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 22,
    marginBottom: 24,
  },
  kilitSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kilitSatiriYazisi: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  premiumButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 27,
    backgroundColor: ALTIN,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  premiumButonuYazisi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
