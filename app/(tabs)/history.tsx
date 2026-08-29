import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader, SCREEN_HEADER_ICERIK_YUKSEKLIGI } from '@/components/screen-header';
import {
  ALTIN,
  ALTIN_COK_SOLUK,
  ALTIN_ORTA_SOLUK,
  ALTIN_SOLUK,
  SIYAH,
  SURFACE,
} from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

const GUN_KISA_ADLARI = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function haftaninGunleriniUret() {
  const bugun = new Date();
  const liste: { etiket: string; gunOnce: number }[] = [];
  for (let gunOnce = 6; gunOnce >= 0; gunOnce--) {
    const tarih = new Date(bugun);
    tarih.setDate(bugun.getDate() - gunOnce);
    const jsGunIndex = tarih.getDay();
    const turkceIndex = jsGunIndex === 0 ? 6 : jsGunIndex - 1;
    liste.push({ etiket: GUN_KISA_ADLARI[turkceIndex], gunOnce });
  }
  return liste;
}

function ayGunleriniUret() {
  const bugun = new Date();
  const ayinGunSayisi = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).getDate();
  const liste: number[] = [];
  for (let gun = 1; gun <= ayinGunSayisi; gun++) {
    liste.push(gun);
  }
  return { liste, bugununGunu: bugun.getDate() };
}

export default function HistoryScreen() {
  const { kullanici } = useVeri();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const haftaninGunleri = haftaninGunleriniUret();
  const aktifGunSayisi = Math.min(Math.max(kullanici.seriGunu, 0), 7);
  const { liste: ayGunleri, bugununGunu } = ayGunleriniUret();

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <ScreenHeader baslik="Geçmiş" scrollY={scrollY} />
      <Animated.ScrollView
        contentContainerStyle={[
          stiller.icerik,
          { paddingTop: insets.top + SCREEN_HEADER_ICERIK_YUKSEKLIGI + 12 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}>
        <View style={stiller.serisKarti}>
          <View style={stiller.gunSirasi}>
            {haftaninGunleri.map((gun) => {
              const aktif = gun.gunOnce < aktifGunSayisi;
              return (
                <View key={gun.gunOnce} style={stiller.gunKolonu}>
                  <View style={[stiller.gunDairesi, aktif ? stiller.gunDairesiAktif : null]}>
                    <Text style={stiller.gunEmoji}>{aktif ? '🔥' : ''}</Text>
                  </View>
                  <Text style={stiller.gunEtiketi}>{gun.etiket}</Text>
                </View>
              );
            })}
          </View>
          <Text style={stiller.serisMotivasyonu}>
            {kullanici.seriGunu > 0
              ? `${kullanici.seriGunu} Gündür Hedefindesin!`
              : 'Serini bugün başlat!'}
          </Text>
        </View>

        <Text style={stiller.bolumBasligi}>Bu Ay</Text>
        <View style={stiller.takvimKarti}>
          <View style={stiller.takvimIzgarasi}>
            {ayGunleri.map((gun) => {
              const bugunMu = gun === bugununGunu;
              return (
                <View
                  key={gun}
                  style={[stiller.takvimKutusu, bugunMu ? stiller.takvimKutusuBugun : null]}>
                  <Text
                    style={[
                      stiller.takvimKutusuYazisi,
                      bugunMu ? stiller.takvimKutusuYazisiBugun : null,
                    ]}>
                    {gun}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  serisKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  gunSirasi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gunKolonu: {
    alignItems: 'center',
    gap: 8,
  },
  gunDairesi: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gunDairesiAktif: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.18)',
  },
  gunEmoji: {
    fontSize: 14,
  },
  gunEtiketi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
  },
  serisMotivasyonu: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 18,
    letterSpacing: 0.3,
  },
  bolumBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  takvimKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 16,
  },
  takvimIzgarasi: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  takvimKutusu: {
    width: '11%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takvimKutusuBugun: {
    backgroundColor: ALTIN,
    borderColor: ALTIN,
  },
  takvimKutusuYazisi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
  },
  takvimKutusuYazisiBugun: {
    color: SIYAH,
    fontWeight: '600',
  },
});
