import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/calorie-ring';
import { MealRow } from '@/components/meal-row';
import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUTON_YAYI = { damping: 15, stiffness: 220, mass: 0.6 };

const SU_YAYI = { damping: 14, stiffness: 90, mass: 0.9 };

function ParlakButon({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const basim = useSharedValue(0);

  const parlaklikStili = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - basim.value * 0.05 }],
    shadowOpacity: 0.3 + basim.value * 0.6,
    shadowRadius: 10 + basim.value * 16,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        basim.value = withSpring(1, BUTON_YAYI);
      }}
      onPressOut={() => {
        basim.value = withSpring(0, BUTON_YAYI);
      }}
      style={[style, parlaklikStili]}>
      {children}
    </AnimatedPressable>
  );
}

function MakroKutu({
  etiket,
  alinan,
  hedef,
}: {
  etiket: string;
  alinan: number;
  hedef: number;
}) {
  const oran = hedef > 0 ? Math.min(100, (alinan / hedef) * 100) : 0;

  return (
    <View style={styles.makroKutu}>
      <Text style={styles.makroKutuDeger} adjustsFontSizeToFit numberOfLines={1}>
        {Math.round(alinan)} / {hedef}g
      </Text>
      <Text style={styles.makroKutuEtiket} adjustsFontSizeToFit numberOfLines={1}>
        {etiket}
      </Text>
      <View style={styles.makroBarArka}>
        <View style={[styles.makroBarDolu, { width: `${oran}%` }]} />
      </View>
    </View>
  );
}

const OGUN_GRUPLARI = ['Kahvaltı', 'Öğle', 'Akşam'];

function ogunGrubunuBul(saat: string) {
  const dilim = parseInt(saat.split(':')[0], 10);
  if (dilim >= 6 && dilim < 11) {
    return 'Kahvaltı';
  }
  if (dilim >= 11 && dilim < 16) {
    return 'Öğle';
  }
  return 'Akşam';
}

const GUNUN_IPUCLARI = [
  'Su içmek metabolizmanı hızlandırır. Asalet disiplinde gizlidir.',
  'Yavaş yemek, mükemmelliğin ilk kuralıdır.',
  'Protein ağırlıklı bir kahvaltı, gün boyu isteklerini dizginler.',
  'Uyku, en az beslenme kadar sana değer katar.',
  'Küçük adımlar, kalıcı zaferlerin temelidir.',
];

const SU_HEDEFI_ML = 2500;
const SU_ARTIS_ML = 250;

export default function TodayScreen() {
  const { kullanici, ogunler, onboardingTamamlandi } = useVeri();
  const [gununIpucu] = useState(
    () => GUNUN_IPUCLARI[Math.floor(Math.random() * GUNUN_IPUCLARI.length)]
  );
  const [suMiktari, setSuMiktari] = useState(0);
  const suAnimasyonu = useSharedValue(0);

  useEffect(() => {
    if (onboardingTamamlandi === false) {
      router.replace('/onboarding');
    }
  }, [onboardingTamamlandi]);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, [])
  );

  const suYuzdesi = Math.min(100, (suMiktari / SU_HEDEFI_ML) * 100);

  useEffect(() => {
    suAnimasyonu.value = withSpring(suYuzdesi, SU_YAYI);
  }, [suYuzdesi, suAnimasyonu]);

  const suDolumStili = useAnimatedStyle(() => ({
    width: `${suAnimasyonu.value}%`,
  }));

  const suEkle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSuMiktari((onceki) => onceki + SU_ARTIS_ML);
  };

  const tarihKaydir = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const alinanMakrolar = ogunler.reduce(
    (toplam, ogun) =>
      ogun.makrolar
        ? {
            protein: toplam.protein + ogun.makrolar.protein,
            karbonhidrat: toplam.karbonhidrat + ogun.makrolar.karbonhidrat,
            yag: toplam.yag + ogun.makrolar.yag,
          }
        : toplam,
    { protein: 0, karbonhidrat: 0, yag: 0 }
  );

  const gruplanmisOgunler = OGUN_GRUPLARI.map((grup) => ({
    grup,
    liste: ogunler.filter((ogun) => ogunGrubunuBul(ogun.eklenmeSaati) === grup),
  })).filter((bolum) => bolum.liste.length > 0);

  if (!onboardingTamamlandi) {
    return <View style={styles.kok} />;
  }

  return (
    <View style={styles.kok}>
      <SafeAreaView style={styles.kok}>
        <View style={styles.panel}>
          <View style={[styles.kutu, styles.ogunlerKutusu]}>
            <View style={styles.ogunlerBaslikSatiri}>
              <View style={styles.tarihNavigator}>
                <Pressable onPress={tarihKaydir} hitSlop={8} style={styles.tarihOk}>
                  <MaterialCommunityIcons name="chevron-left" size={20} color={ALTIN} />
                </Pressable>
                <Text style={styles.tarihMetni}>Bugün</Text>
                <Pressable onPress={tarihKaydir} hitSlop={8} style={styles.tarihOk}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={ALTIN} />
                </Pressable>
              </View>
              <ParlakButon onPress={() => router.push('/modal')} style={styles.ogunEkleButonu}>
                <MaterialCommunityIcons name="plus" size={14} color={ALTIN} />
                <Text style={styles.ogunEkleButonuYazisi}>Öğün Ekle</Text>
              </ParlakButon>
            </View>

            <View style={styles.ozetAlani}>
              <CalorieRing size={144} strokeWidth={12} />
              <View style={styles.makroSatiri}>
                <MakroKutu
                  etiket="Protein"
                  alinan={alinanMakrolar.protein}
                  hedef={kullanici.makroHedefleri.protein}
                />
                <MakroKutu
                  etiket="Karb"
                  alinan={alinanMakrolar.karbonhidrat}
                  hedef={kullanici.makroHedefleri.karbonhidrat}
                />
                <MakroKutu
                  etiket="Yağ"
                  alinan={alinanMakrolar.yag}
                  hedef={kullanici.makroHedefleri.yag}
                />
              </View>
            </View>

            <ScrollView
              style={styles.ogunListesi}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.ogunListesiIcerik}>
              {ogunler.length === 0 ? (
                <Text style={styles.bosDurum}>Henüz bir şey eklenmedi</Text>
              ) : (
                gruplanmisOgunler.map((bolum) => (
                  <View key={bolum.grup} style={styles.grupBolumu}>
                    <Text style={styles.grupBasligi}>{bolum.grup}</Text>
                    {bolum.liste.map((ogun) => (
                      <MealRow key={ogun.id} {...ogun} />
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          <View style={[styles.kutu, styles.suKutusu]}>
            <Animated.View style={[styles.suDolumKatmani, suDolumStili]} />
            <View style={styles.suIcerik}>
              <View style={styles.suSolAlan}>
                <View style={styles.suIkonAlani}>
                  <MaterialCommunityIcons name="water" size={20} color={ALTIN} />
                </View>
                <Text style={styles.suMiktariYazisi} numberOfLines={1} adjustsFontSizeToFit>
                  {suMiktari} / {SU_HEDEFI_ML} ml
                </Text>
              </View>
              <ParlakButon onPress={suEkle} style={styles.suEkleButonu}>
                <Text style={styles.suEkleButonuYazisi}>+ {SU_ARTIS_ML}ml</Text>
              </ParlakButon>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.sozMetni}>{gununIpucu}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
    gap: 14,
  },
  kutu: {
    backgroundColor: SIYAH,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 20,
    padding: 18,
  },
  ogunlerKutusu: {
    flex: 1,
  },
  ogunlerBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tarihNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tarihOk: {
    padding: 2,
  },
  tarihMetni: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  ogunEkleButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ogunEkleButonuYazisi: {
    color: ALTIN,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  ozetAlani: {
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    marginBottom: 6,
  },
  makroSatiri: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
  },
  makroKutu: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(232,195,124,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(232,195,124,0.06)',
  },
  makroKutuDeger: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  makroKutuEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  makroBarArka: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(232,195,124,0.15)',
    marginTop: 7,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  makroBarDolu: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: ALTIN,
  },
  ogunListesi: {
    flex: 1,
  },
  ogunListesiIcerik: {
    paddingVertical: 4,
  },
  bosDurum: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingVertical: 12,
  },
  grupBolumu: {
    marginBottom: 4,
  },
  grupBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
    marginBottom: 8,
  },
  suKutusu: {
    flex: 0.15,
    padding: 0,
    overflow: 'hidden',
  },
  suIcerik: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 1,
  },
  suDolumKatmani: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(64, 164, 255, 0.18)',
  },
  suSolAlan: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suIkonAlani: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suMiktariYazisi: {
    flexShrink: 1,
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  suEkleButonu: {
    borderRadius: 16,
    backgroundColor: ALTIN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  suEkleButonuYazisi: {
    color: SIYAH,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
  },
  sozMetni: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 17,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
