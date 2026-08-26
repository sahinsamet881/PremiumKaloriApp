import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/calorie-ring';
import { MealRow } from '@/components/meal-row';
import { QuickAddButton } from '@/components/quick-add-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useVeri } from '@/context/DataContext';
import { useAksanRenk } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TodayScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { kullanici, ogunler } = useVeri();
  const { aksanTonlari } = useAksanRenk();

  return (
    <ThemedView style={styles.kok}>
      <SafeAreaView style={styles.kok}>
        <View style={styles.ustSatir}>
          <View style={[styles.seriRozeti, { backgroundColor: aksanTonlari.acik }]}>
            <ThemedText style={styles.seriEmoji}>🔥</ThemedText>
            <ThemedText style={[styles.seriSayisi, { color: aksanTonlari.koyu }]}>
              {kullanici.seriGunu}
            </ThemedText>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}>
          <View style={styles.cemberAlani}>
            <CalorieRing />
            <ThemedText style={[styles.altBilgi, { color: palette.icon }]}>
              {kullanici.bugunAlinanKalori} / {kullanici.gunlukHedefKalori} kcal
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
  ustSatir: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  seriRozeti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seriEmoji: {
    fontSize: 14,
  },
  seriSayisi: {
    fontSize: 15,
    fontWeight: '700',
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
