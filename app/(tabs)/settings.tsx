import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AKSAN_PALETLERI, AksanRengiAdi, Colors } from '@/constants/theme';
import { useAksanRenk } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AKSAN_SIRASI: AksanRengiAdi[] = ['mavi', 'kirmizi', 'turuncu', 'yesil'];

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { aksanAdi, aksanSec } = useAksanRenk();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.baslik}>
        Ayarlar
      </ThemedText>

      <ThemedText style={[styles.bolumBasligi, { color: palette.icon }]}>Vurgu Rengi</ThemedText>

      <View style={styles.renkSirasi}>
        {AKSAN_SIRASI.map((secenek) => {
          const secili = secenek === aksanAdi;
          return (
            <Pressable
              key={secenek}
              onPress={() => aksanSec(secenek)}
              accessibilityRole="button"
              accessibilityLabel={secenek}
              accessibilityState={{ selected: secili }}
              style={({ pressed }) => [
                styles.renkDugmesi,
                { backgroundColor: AKSAN_PALETLERI[secenek].orta },
                pressed && styles.renkDugmesiBasili,
              ]}>
              {secili ? <IconSymbol name="checkmark" size={20} color="#fff" /> : null}
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  baslik: {
    marginBottom: 32,
  },
  bolumBasligi: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  renkSirasi: {
    flexDirection: 'row',
    gap: 20,
  },
  renkDugmesi: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renkDugmesiBasili: {
    opacity: 0.7,
  },
});
