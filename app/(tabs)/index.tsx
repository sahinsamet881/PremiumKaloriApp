import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/calorie-ring';
import { MealRow } from '@/components/meal-row';
import { QuickAddButton } from '@/components/quick-add-button';
import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

export default function TodayScreen() {
  const { kullanici, ogunler, onboardingTamamlandi, profilSifirla } = useVeri();

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

  const sifirlaVeTestEt = () => {
    profilSifirla();
    router.replace('/onboarding');
  };

  if (!onboardingTamamlandi) {
    return <View style={styles.kok} />;
  }

  return (
    <View style={styles.kok}>
      <SafeAreaView style={styles.kok}>
        <View style={styles.ustSatir}>
          <Pressable onPress={sifirlaVeTestEt} style={styles.testButonu}>
            <Text style={styles.testButonuYazisi}>Sıfırla ve Onboarding Test</Text>
          </Pressable>
          <View style={styles.seriRozeti}>
            <Text style={styles.seriEmoji}>🔥</Text>
            <Text style={styles.seriSayisi}>{kullanici.seriGunu}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
          <View style={styles.cemberAlani}>
            <CalorieRing />
            <Text style={styles.altBilgi}>
              {kullanici.bugunAlinanKalori} / {kullanici.gunlukHedefKalori} kcal
            </Text>
          </View>

          <View style={styles.liste}>
            <Text style={styles.listeBasligi}>Bugünün Öğünleri</Text>
            {ogunler.length === 0 ? (
              <Text style={styles.bosDurum}>Henüz bir şey eklenmedi</Text>
            ) : (
              ogunler.map((ogun) => <MealRow key={ogun.id} {...ogun} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <QuickAddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
  testButonu: {
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  testButonuYazisi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  seriRozeti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: ALTIN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seriEmoji: {
    fontSize: 14,
  },
  seriSayisi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  icerik: {
    paddingBottom: 140,
  },
  cemberAlani: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  altBilgi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 16,
  },
  liste: {
    paddingHorizontal: 24,
  },
  listeBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  bosDurum: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 15,
    fontWeight: '300',
    paddingVertical: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
