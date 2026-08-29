import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, SIYAH, SURFACE } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { Makrolar } from '@/types';

type IkonAdi = 'bolt.fill' | 'star.fill' | 'magnifyingglass' | 'barcode.viewfinder';

type LuksSecenekKartiProps = {
  ikon: IkonAdi;
  baslik: string;
  aciklama: string;
  onPress: () => void;
};

function LuksSecenekKarti({ ikon, baslik, aciklama, onPress }: LuksSecenekKartiProps) {
  const doluluk = useRef(new Animated.Value(0)).current;

  const basildi = () => {
    Animated.timing(doluluk, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };

  const birakildi = () => {
    Animated.timing(doluluk, { toValue: 0, duration: 320, useNativeDriver: false }).start();
  };

  const arkaPlanRengi = doluluk.interpolate({ inputRange: [0, 1], outputRange: [SIYAH, ALTIN] });
  const metinRengi = doluluk.interpolate({ inputRange: [0, 1], outputRange: [ALTIN, SIYAH] });
  const ikonSaydamlik = doluluk.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Pressable onPress={onPress} onPressIn={basildi} onPressOut={birakildi}>
      <Animated.View style={[stiller.kart, { backgroundColor: arkaPlanRengi }]}>
        <Animated.View style={{ opacity: ikonSaydamlik }}>
          <IconSymbol name={ikon} size={24} color={ALTIN} />
        </Animated.View>
        <View style={stiller.kartMetin}>
          <Animated.Text style={[stiller.kartBaslik, { color: metinRengi }]}>{baslik}</Animated.Text>
          <Animated.Text style={[stiller.kartAciklama, { color: metinRengi, opacity: 0.7 }]}>
            {aciklama}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

type HizliCipProps = {
  isim: string;
  kalori: number;
  onPress: () => void;
};

function HizliCip({ isim, kalori, onPress }: HizliCipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [stiller.cip, pressed ? stiller.cipBasili : null]}>
      <MaterialCommunityIcons name="plus" size={13} color={ALTIN} />
      <Text style={stiller.cipIsim} numberOfLines={1}>
        {isim}
      </Text>
      <Text style={stiller.cipKalori}>{kalori} kcal</Text>
    </Pressable>
  );
}

export default function ModalScreen() {
  const { sikKullanilanlar, favoriler, hizliKaloriEkle } = useVeri();

  const hizliEkle = (isim: string, kalori: number, makrolar?: Makrolar) => {
    hizliKaloriEkle(kalori, isim, makrolar);
    router.dismissAll();
  };

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <View style={stiller.tutamac} />
      <ScrollView
        contentContainerStyle={stiller.icerik}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={stiller.baslik}>Öğün Ekle</Text>

        <View style={stiller.liste}>
          <LuksSecenekKarti
            ikon="bolt.fill"
            baslik="Elle Ekle"
            aciklama="İsim, porsiyon ve kalori gir"
            onPress={() => router.push('/ogun-duzenle')}
          />
          <LuksSecenekKarti
            ikon="magnifyingglass"
            baslik="Yemek Ara"
            aciklama="Veritabanından seç, porsiyonu ayarla"
            onPress={() => router.push('/search')}
          />
          <LuksSecenekKarti
            ikon="barcode.viewfinder"
            baslik="Barkod Tara"
            aciklama="Ambalajlı ürünü kameradan oku"
            onPress={() => router.push('/barkod')}
          />
        </View>

        {sikKullanilanlar.length > 0 ? (
          <View style={stiller.bolum}>
            <Text style={stiller.bolumBasligi}>Son Eklenenler</Text>
            <View style={stiller.cipListesi}>
              {sikKullanilanlar.slice(0, 8).map((kayit) => (
                <HizliCip
                  key={kayit.id}
                  isim={kayit.isim}
                  kalori={kayit.kalori}
                  onPress={() => hizliEkle(kayit.isim, kayit.kalori, kayit.makrolar)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {favoriler.length > 0 ? (
          <View style={stiller.bolum}>
            <Text style={stiller.bolumBasligi}>Favoriler</Text>
            <View style={stiller.cipListesi}>
              {favoriler.map((favori) => (
                <HizliCip
                  key={favori.isim}
                  isim={favori.isim}
                  kalori={favori.kalori}
                  onPress={() => hizliEkle(favori.isim, favori.kalori, favori.makrolar)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  tutamac: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ALTIN_COK_SOLUK,
    marginTop: 10,
    marginBottom: 12,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 22,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 24,
    letterSpacing: 0.5,
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
    borderWidth: 1,
    borderColor: ALTIN,
  },
  kartMetin: {
    flex: 1,
  },
  kartBaslik: {
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 0.8,
  },
  kartAciklama: {
    fontSize: 13,
    fontWeight: '300',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  bolum: {
    gap: 12,
  },
  bolumBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cipListesi: {
    gap: 8,
  },
  cip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cipBasili: {
    opacity: 0.6,
  },
  cipIsim: {
    flex: 1,
    color: ALTIN,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  cipKalori: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '400',
  },
});
