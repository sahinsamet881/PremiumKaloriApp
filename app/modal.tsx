import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type HizliEkleSecenegi = {
  baslik: string;
  aciklama: string;
  ikon: 'bolt.fill' | 'star.fill' | 'magnifyingglass';
};

const SECENEKLER: HizliEkleSecenegi[] = [
  { baslik: 'Hızlı Kalori', aciklama: 'Sadece bir sayı gir, geç', ikon: 'bolt.fill' },
  { baslik: 'Hazır Butonlar', aciklama: 'Sık kullandığın besinlerden seç', ikon: 'star.fill' },
  { baslik: 'Yemek Ara', aciklama: 'İsimle ara ve ekle', ikon: 'magnifyingglass' },
];

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.baslik}>
        Ekle
      </ThemedText>
      <View style={styles.liste}>
        {SECENEKLER.map((secenek) => (
          <Pressable
            key={secenek.baslik}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.kart,
              { borderColor: palette.icon },
              pressed && styles.kartBasili,
            ]}>
            <IconSymbol name={secenek.ikon} size={26} color={palette.tint} />
            <View style={styles.kartMetin}>
              <ThemedText style={styles.kartBaslik}>{secenek.baslik}</ThemedText>
              <ThemedText style={[styles.kartAciklama, { color: palette.icon }]}>
                {secenek.aciklama}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  baslik: {
    marginTop: 12,
    marginBottom: 24,
  },
  liste: {
    gap: 12,
  },
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kartBasili: {
    opacity: 0.5,
  },
  kartMetin: {
    flex: 1,
  },
  kartBaslik: {
    fontSize: 17,
    fontWeight: '600',
  },
  kartAciklama: {
    fontSize: 13,
    marginTop: 2,
  },
});
