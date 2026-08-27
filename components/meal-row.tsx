import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ALTIN, ALTIN_ORTA_SOLUK } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { Ogun } from '@/types';

export function MealRow({ id, isim, kalori, eklenmeSaati }: Ogun) {
  const { ogunSil } = useVeri();

  const silmeyiOnayla = () => {
    Alert.alert('Öğünü Sil', 'Bu öğünü silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => ogunSil(id) },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.satir, pressed && styles.satirBasili]}
      onPress={silmeyiOnayla}>
      <View>
        <Text style={styles.isim}>{isim}</Text>
        <Text style={styles.saat}>{eklenmeSaati}</Text>
      </View>
      <Text style={styles.kalori}>{kalori} kcal</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: ALTIN,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  satirBasili: {
    opacity: 0.5,
  },
  isim: {
    color: ALTIN,
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 1,
  },
  saat: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  kalori: {
    color: ALTIN,
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 1,
  },
});
