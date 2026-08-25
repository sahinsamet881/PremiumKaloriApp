import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ogun } from '@/types';

export function MealRow({ isim, kalori, eklenmeSaati }: Ogun) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Pressable
      style={({ pressed }) => [styles.satir, pressed && styles.satirBasili]}
      onPress={() => console.log('Öğüne tıklandı')}>
      <View>
        <ThemedText style={styles.isim}>{isim}</ThemedText>
        <ThemedText style={[styles.saat, { color: palette.icon }]}>{eklenmeSaati}</ThemedText>
      </View>
      <ThemedText style={styles.kalori}>{kalori} kcal</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  satirBasili: {
    opacity: 0.5,
  },
  isim: {
    fontSize: 17,
    fontWeight: '600',
  },
  saat: {
    fontSize: 13,
    marginTop: 2,
  },
  kalori: {
    fontSize: 17,
    fontWeight: '600',
  },
});
