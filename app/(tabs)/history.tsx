import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const { kullanici, ogunGecmisi } = useVeri();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const haftaninGunleri = haftaninGunleriniUret();
  const aktifGunSayisi = Math.min(Math.max(kullanici.seriGunu, 0), 7);
  const { liste: ayGunleri, bugununGunu } = ayGunleriniUret();

  const kayitliGunler = useMemo(() => {
    const bugun = new Date();
    const kume = new Set<number>();
    for (const kayit of ogunGecmisi) {
      const tarih = new Date(kayit.zaman);
      if (
        tarih.getFullYear() === bugun.getFullYear() &&
        tarih.getMonth() === bugun.getMonth()
      ) {
        kume.add(tarih.getDate());
      }
    }
    return kume;
  }, [ogunGecmisi]);

  if (ogunGecmisi.length === 0) {
    return (
      <View style={stiller.container}>
        <StatusBar style="light" />
        <ScreenHeader baslik="Geçmiş" />
        <View
          style={[
            stiller.bosDurum,
            { paddingTop: insets.top + SCREEN_HEADER_ICERIK_YUKSEKLIGI },
          ]}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={ALTIN_SOLUK} />
          <Text style={stiller.bosBaslik}>Henüz kayıt yok — ilk öğününü ekleyerek başla</Text>
          <Pressable onPress={() => router.replace('/(tabs)')} style={stiller.bosButon}>
            <Text style={stiller.bosButonYazi}>Bugün&apos;e Git</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
              const kayitVar = kayitliGunler.has(gun);
              return (
                <View
                  key={gun}
                  style={[
                    stiller.takvimKutusu,
                    kayitVar ? stiller.takvimKutusuKayitli : null,
                    bugunMu ? stiller.takvimKutusuBugun : null,
                  ]}>
                  <Text
                    style={[
                      stiller.takvimKutusuYazisi,
                      kayitVar ? stiller.takvimKutusuYazisiKayitli : null,
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
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takvimKutusuKayitli: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.18)',
  },
  takvimKutusuBugun: {
    backgroundColor: ALTIN,
    borderColor: ALTIN,
  },
  takvimKutusuYazisi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    opacity: 0.5,
  },
  takvimKutusuYazisiKayitli: {
    color: ALTIN,
    fontWeight: '400',
    opacity: 1,
  },
  takvimKutusuYazisiBugun: {
    color: SIYAH,
    fontWeight: '600',
    opacity: 1,
  },
  bosDurum: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 18,
  },
  bosBaslik: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 15,
    fontWeight: '300',
    lineHeight: 22,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  bosButon: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: ALTIN,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  bosButonYazi: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
});
