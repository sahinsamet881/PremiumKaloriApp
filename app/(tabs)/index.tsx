import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/calorie-ring';
import { MealRow } from '@/components/meal-row';
import { QuickAddButton } from '@/components/quick-add-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ogun } from '@/types';

const OGUNLER: Ogun[] = [
  { id: '1', isim: 'Yulaf Ezmesi', kalori: 320, eklenmeSaati: '08:15' },
  { id: '2', isim: 'Tavuklu Salata', kalori: 480, eklenmeSaati: '13:00' },
  { id: '3', isim: '1 Fincan Kahve', kalori: 50, eklenmeSaati: '15:40' },
];

const GUNLUK_HEDEF_KALORI = 2500;

export default function TodayScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [ogunler] = useState(OGUNLER);

  const bugunAlinanKalori = ogunler.reduce((toplam, ogun) => toplam + ogun.kalori, 0);

  return (
    <ThemedView style={styles.kok}>
      <SafeAreaView style={styles.kok}>
        <ScrollView
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}>
          <View style={styles.cemberAlani}>
            <CalorieRing
              gunlukHedefKalori={GUNLUK_HEDEF_KALORI}
              bugunAlinanKalori={bugunAlinanKalori}
            />
            <ThemedText style={[styles.altBilgi, { color: palette.icon }]}>
              {bugunAlinanKalori} / {GUNLUK_HEDEF_KALORI} kcal
            </ThemedText>
          </View>

          <View style={styles.liste}>
            <ThemedText style={styles.listeBasligi}>Bugünün Öğünleri</ThemedText>
            {ogunler.length === 0 ? (
              <ThemedText style={[styles.bosDurum, { color: palette.icon }]}>
                Henüz bir şey eklenmedi
              </ThemedText>
            ) : (
              ogunler.map((ogun, index) => (
                <View
                  key={ogun.id}
                  style={
                    index !== ogunler.length - 1
                      ? { borderBottomColor: palette.icon, borderBottomWidth: StyleSheet.hairlineWidth }
                      : undefined
                  }>
                  <MealRow {...ogun} />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <QuickAddButton />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  kok: {
    flex: 1,
  },
  icerik: {
    paddingBottom: 140,
  },
  cemberAlani: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  altBilgi: {
    fontSize: 14,
    marginTop: 16,
  },
  liste: {
    paddingHorizontal: 24,
  },
  listeBasligi: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: 0.5,
  },
  bosDurum: {
    fontSize: 15,
    paddingVertical: 24,
    textAlign: 'center',
  },
});
