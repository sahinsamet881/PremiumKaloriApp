import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ALTIN, ALTIN_ORTA_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { Ogun } from '@/types';

export function MealRow({ id, isim, kalori, eklenmeSaati, makrolar }: Ogun) {
  const { ogunSil, ogunKopyala, favoriMi, favoriToggle } = useVeri();
  const swipeRef = useRef<SwipeableMethods>(null);
  const favori = favoriMi(isim);

  const favoriDegistir = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    favoriToggle(isim, kalori, makrolar);
  };

  const kapat = () => swipeRef.current?.close();

  const silmeyiOnayla = () => {
    kapat();
    Alert.alert('Öğünü Sil', `"${isim}" öğününü silmek istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          ogunSil(id);
        },
      },
    ]);
  };

  const duzenle = () => {
    kapat();
    router.push({ pathname: '/ogun-duzenle', params: { id } });
  };

  const kopyala = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ogunKopyala(id);
  };

  const sagAksiyon = () => (
    <RectButton style={[styles.aksiyon, styles.silAksiyon]} onPress={silmeyiOnayla}>
      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
      <Text style={styles.aksiyonYazi}>Sil</Text>
    </RectButton>
  );

  const solAksiyon = () => (
    <RectButton style={[styles.aksiyon, styles.duzenleAksiyon]} onPress={duzenle}>
      <MaterialCommunityIcons name="pencil-outline" size={20} color={SIYAH} />
      <Text style={[styles.aksiyonYazi, styles.duzenleYazi]}>Düzenle</Text>
    </RectButton>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={44}
      rightThreshold={44}
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={sagAksiyon}
      renderLeftActions={solAksiyon}
      containerStyle={styles.swipeKapsayici}>
      <Pressable
        style={({ pressed }) => [styles.satir, pressed && styles.satirBasili]}
        onPress={duzenle}
        onLongPress={kopyala}
        delayLongPress={350}>
        <View style={styles.solAlan}>
          <Text style={styles.isim} numberOfLines={1} ellipsizeMode="tail">
            {isim}
          </Text>
          <Text style={styles.saat}>{eklenmeSaati}</Text>
        </View>
        <Pressable
          onPress={favoriDegistir}
          hitSlop={10}
          style={styles.yildizButonu}
          accessibilityRole="button"
          accessibilityLabel={favori ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
          <MaterialCommunityIcons
            name={favori ? 'star' : 'star-outline'}
            size={18}
            color={favori ? ALTIN : ALTIN_ORTA_SOLUK}
          />
        </Pressable>
        <Text style={styles.kalori}>{kalori} kcal</Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  swipeKapsayici: {
    marginBottom: 12,
    borderRadius: 14,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: SIYAH,
  },
  satirBasili: {
    opacity: 0.5,
  },
  solAlan: {
    flex: 1,
    paddingRight: 10,
  },
  yildizButonu: {
    paddingHorizontal: 8,
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
    flexShrink: 0,
    textAlign: 'right',
  },
  aksiyon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 96,
    marginBottom: 12,
    borderRadius: 14,
  },
  silAksiyon: {
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  duzenleAksiyon: {
    backgroundColor: ALTIN,
    marginRight: 8,
  },
  aksiyonYazi: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  duzenleYazi: {
    color: SIYAH,
  },
});
