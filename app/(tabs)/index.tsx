import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/calorie-ring';
import { MealRow } from '@/components/meal-row';
import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

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

  const suYuzdesi = Math.min((suMiktari / SU_HEDEFI_ML) * 100, 100);
  const makroOzeti = `P: ${kullanici.makroHedefleri.protein}g  •  K: ${kullanici.makroHedefleri.karbonhidrat}g  •  Y: ${kullanici.makroHedefleri.yag}g`;

  const suEkle = () => {
    setSuMiktari((onceki) => Math.min(onceki + SU_ARTIS_ML, SU_HEDEFI_ML));
  };

  if (!onboardingTamamlandi) {
    return <View style={styles.kok} />;
  }

  return (
    <View style={styles.kok}>
      <SafeAreaView style={styles.kok}>
        <View style={styles.panel}>
          <View style={[styles.kutu, styles.ogunlerKutusu]}>
            <View style={styles.ogunlerBaslikSatiri}>
              <Text style={styles.kutuBasligi}>Bugünün Öğünleri</Text>
              <Pressable onPress={() => router.push('/modal')} style={styles.ogunEkleButonu}>
                <MaterialCommunityIcons name="plus" size={14} color={ALTIN} />
                <Text style={styles.ogunEkleButonuYazisi}>Öğün Ekle</Text>
              </Pressable>
            </View>

            <View style={styles.ogunlerIcerik}>
              <View style={styles.cemberAlani}>
                <CalorieRing size={128} strokeWidth={11} />
                <Text style={styles.makroOzeti}>{makroOzeti}</Text>
              </View>

              <ScrollView
                style={styles.ogunListesi}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.ogunListesiIcerik}>
                {ogunler.length === 0 ? (
                  <Text style={styles.bosDurum}>Henüz bir şey eklenmedi</Text>
                ) : (
                  ogunler.map((ogun) => <MealRow key={ogun.id} {...ogun} />)
                )}
              </ScrollView>
            </View>
          </View>

          <View style={[styles.kutu, styles.suKutusu]}>
            <View style={[styles.suDolumKatmani, { width: `${suYuzdesi}%` }]} />
            <View style={styles.suSolAlan}>
              <View style={styles.suIkonAlani}>
                <MaterialCommunityIcons name="water" size={20} color={ALTIN} />
              </View>
              <Text style={styles.suMiktariYazisi}>
                {suMiktari} / {SU_HEDEFI_ML} ml
              </Text>
            </View>
            <Pressable onPress={suEkle} style={styles.suEkleButonu}>
              <Text style={styles.suEkleButonuYazisi}>+ {SU_ARTIS_ML}ml</Text>
            </Pressable>
          </View>

          <View style={[styles.kutu, styles.sozKutusu]}>
            <Text style={styles.sozMetni}>{gununIpucu}</Text>
          </View>
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
    paddingBottom: 16,
    gap: 15,
  },
  kutu: {
    backgroundColor: SIYAH,
    borderWidth: 1,
    borderColor: ALTIN,
    borderRadius: 20,
    padding: 18,
  },
  ogunlerKutusu: {
    flex: 0.65,
  },
  ogunlerBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kutuBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
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
  },
  ogunEkleButonuYazisi: {
    color: ALTIN,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  ogunlerIcerik: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  cemberAlani: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  makroOzeti: {
    color: ALTIN,
    fontSize: 12,
    opacity: 0.7,
    letterSpacing: 0.3,
    marginTop: 10,
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
  suKutusu: {
    flex: 0.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  suDolumKatmani: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(232, 195, 124, 0.2)',
  },
  suSolAlan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
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
    shadowColor: ALTIN,
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
  sozKutusu: {
    flex: 0.15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,195,124,0.06)',
  },
  sozMetni: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
