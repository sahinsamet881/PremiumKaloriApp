import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GunlukKalori, KaloriTrend } from '@/components/kalori-trend';
import { KiloGrafik } from '@/components/kilo-grafik';
import { ScreenHeader, SCREEN_HEADER_ICERIK_YUKSEKLIGI } from '@/components/screen-header';
import {
  ALTIN,
  ALTIN_COK_SOLUK,
  ALTIN_ORTA_SOLUK,
  ALTIN_SOLUK,
  DANGER,
  SIYAH,
  SURFACE,
} from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { haftalikHiz, hedefTahmini, siraliKayitlar, sonKayitlar } from '@/nutrition/kilo';

const KALORI_ARALIKLARI: { gun: number; etiket: string; ucretsiz?: boolean }[] = [
  { gun: 4, etiket: '4 Gün', ucretsiz: true },
  { gun: 30, etiket: '30 Gün' },
  { gun: 90, etiket: '90 Gün' },
  { gun: 0, etiket: 'Tümü' },
];

type MakroSatiriProps = {
  etiket: string;
  yuzde: number;
};

function MakroSatiri({ etiket, yuzde }: MakroSatiriProps) {
  return (
    <View style={stiller.makroSatiri}>
      <View style={stiller.makroUstSatir}>
        <Text style={stiller.makroEtiket}>{etiket}</Text>
        <Text style={stiller.makroYuzde}>{`%${yuzde}`}</Text>
      </View>
      <View style={stiller.makroCubukArkaPlan}>
        <View style={[stiller.makroCubukDolu, { width: `${yuzde}%` }]} />
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const { kullanici, kiloKayitlari, ogunGecmisi, premiumAktif, profilSifirla } = useVeri();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [aralik, setAralik] = useState(4);

  const gunlukKaloriTum = useMemo<GunlukKalori[]>(() => {
    const gunler = new Map<string, number>();
    for (const kayit of ogunGecmisi) {
      const gun = new Date(kayit.zaman).toISOString().slice(0, 10);
      gunler.set(gun, (gunler.get(gun) ?? 0) + kayit.kalori);
    }
    return [...gunler.entries()]
      .map(([tarih, kalori]) => ({ tarih, kalori: Math.round(kalori) }))
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [ogunGecmisi]);

  const secilenVeri = useMemo(
    () => (aralik === 0 ? gunlukKaloriTum.slice(-90) : gunlukKaloriTum.slice(-aralik)),
    [gunlukKaloriTum, aralik]
  );

  const dortGunOzeti = useMemo(() => {
    const esik = Date.now() - 4 * 24 * 60 * 60 * 1000;
    const gunler = new Map<string, number>();
    for (const kayit of ogunGecmisi) {
      if (kayit.zaman < esik) {
        continue;
      }
      const gun = new Date(kayit.zaman).toISOString().slice(0, 10);
      gunler.set(gun, (gunler.get(gun) ?? 0) + kayit.kalori);
    }
    const degerler = [...gunler.values()];
    const gunSayisi = degerler.length;
    const ortalama = gunSayisi
      ? Math.round(degerler.reduce((a, b) => a + b, 0) / gunSayisi)
      : 0;
    return { gunSayisi, ortalama, fark: gunSayisi ? ortalama - kullanici.gunlukHedefKalori : 0 };
  }, [ogunGecmisi, kullanici.gunlukHedefKalori]);

  const kilitli = !premiumAktif && aralik !== 4;

  const profiliSifirlaSor = () => {
    Alert.alert(
      'Profili Güncelle',
      'Soru-cevap ekranına dönmek üzeresin. Mevcut profil bilgilerin sıfırlanacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam Et',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            profilSifirla();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const proteinKalori = kullanici.makroHedefleri.protein * 4;
  const karbKalori = kullanici.makroHedefleri.karbonhidrat * 4;
  const yagKalori = kullanici.makroHedefleri.yag * 9;
  const toplamKalori = proteinKalori + karbKalori + yagKalori || 1;

  const proteinYuzde = Math.round((proteinKalori / toplamKalori) * 100);
  const karbYuzde = Math.round((karbKalori / toplamKalori) * 100);
  const yagYuzde = Math.max(0, 100 - proteinYuzde - karbYuzde);

  const sirali = siraliKayitlar(kiloKayitlari);
  const guncelKilo = sirali.length > 0 ? sirali[sirali.length - 1].kilo : kullanici.kilo;
  const haftalik = haftalikHiz(kiloKayitlari);
  const tahmin = hedefTahmini(kiloKayitlari, kullanici.hedefKilo);
  const sonHiz = haftalikHiz(sonKayitlar(kiloKayitlari, 21));
  const hizliKayip = sonHiz < -1;

  const sureMetni =
    !tahmin || tahmin.tahminiHafta === null
      ? 'Mevcut hızla tahmin edilemiyor'
      : tahmin.tahminiHafta === 0
        ? 'Hedefine ulaştın'
        : tahmin.tahminiHafta < 8
          ? `~${Math.round(tahmin.tahminiHafta)} hafta`
          : `~${Math.round(tahmin.tahminiHafta / 4.345)} ay`;

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <ScreenHeader
        baslik="Analiz"
        scrollY={scrollY}
        sag={
          <Pressable
            onPress={profiliSifirlaSor}
            style={({ pressed }) => [
              stiller.profilButonu,
              pressed ? stiller.profilButonuBasili : null,
            ]}>
            <MaterialCommunityIcons name="account-cog-outline" size={16} color={ALTIN} />
            <Text style={stiller.profilButonuYazisi}>Profili Güncelle</Text>
          </Pressable>
        }
      />
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
        {hizliKayip ? (
          <View style={stiller.uyariKarti}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={DANGER} />
            <Text style={stiller.uyariYazisi}>
              Son haftalarda haftada ~{Math.abs(sonHiz).toFixed(1)} kg veriyorsun. Sağlıklı hız
              haftada 0.5–1 kg; bu tempoyu bir diyetisyene danışarak sürdürmeni öneririz.
            </Text>
          </View>
        ) : null}

        <View style={stiller.kart}>
          <View style={stiller.kartUst}>
            <Text style={stiller.kartBasligi}>Kilo Takibi</Text>
            <Pressable onPress={() => router.push('/kilo-ekle')} style={stiller.kiloEkleButonu}>
              <MaterialCommunityIcons name="plus" size={14} color={ALTIN} />
              <Text style={stiller.kiloEkleYazisi}>Kilo Ekle</Text>
            </Pressable>
          </View>

          <KiloGrafik kayitlar={kiloKayitlari} hedefKilo={kullanici.hedefKilo} />

          <View style={stiller.istatistikSatiri}>
            <View style={stiller.istatistik}>
              <Text style={stiller.istatistikDeger}>{guncelKilo > 0 ? guncelKilo : '—'}</Text>
              <Text style={stiller.istatistikEtiket}>Güncel kg</Text>
            </View>
            <View style={stiller.istatistik}>
              <Text style={stiller.istatistikDeger}>{kullanici.hedefKilo || '—'}</Text>
              <Text style={stiller.istatistikEtiket}>Hedef kg</Text>
            </View>
            <View style={stiller.istatistik}>
              <Text style={stiller.istatistikDeger}>
                {haftalik === 0 ? '—' : `${haftalik > 0 ? '+' : ''}${haftalik.toFixed(2)}`}
              </Text>
              <Text style={stiller.istatistikEtiket}>Haftalık kg</Text>
            </View>
          </View>

          <View style={stiller.tahminSatiri}>
            <Text style={stiller.tahminEtiket}>Hedefe kalan</Text>
            <Text style={stiller.tahminDeger}>
              {tahmin ? `${tahmin.kalanKg.toFixed(1)} kg` : '—'}
            </Text>
          </View>
          <View style={stiller.tahminSatiri}>
            <Text style={stiller.tahminEtiket}>Tahmini süre</Text>
            <Text style={stiller.tahminDeger}>{sureMetni}</Text>
          </View>
        </View>

        <View style={stiller.kart}>
          <Text style={stiller.kartBasligi}>Kalori Trendi</Text>

          <View style={stiller.sekmeSatiri}>
            {KALORI_ARALIKLARI.map((aralikSecenegi) => {
              const seciliMi = aralik === aralikSecenegi.gun;
              const sekmeKilitli = !premiumAktif && !aralikSecenegi.ucretsiz;
              return (
                <Pressable
                  key={aralikSecenegi.gun}
                  onPress={() => setAralik(aralikSecenegi.gun)}
                  style={[stiller.sekme, seciliMi ? stiller.sekmeAktif : null]}>
                  <Text style={[stiller.sekmeYazi, seciliMi ? stiller.sekmeYaziAktif : null]}>
                    {aralikSecenegi.etiket}
                  </Text>
                  {sekmeKilitli ? (
                    <MaterialCommunityIcons name="lock" size={10} color={ALTIN_ORTA_SOLUK} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={stiller.grafikSarici}>
            <KaloriTrend veri={secilenVeri} hedef={kullanici.gunlukHedefKalori} />
            {kilitli ? (
              <>
                <BlurView
                  intensity={24}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Pressable onPress={() => router.push('/paywall')} style={stiller.kilitKapak}>
                  <View style={stiller.kilitRozet}>
                    <MaterialCommunityIcons name="lock" size={18} color={SIYAH} />
                  </View>
                  <Text style={stiller.kilitYazi}>Premium ile Aç</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {aralik === 4 ? (
            <View style={stiller.ozetSatiri}>
              <View style={stiller.ozet}>
                <Text style={stiller.ozetDeger}>
                  {dortGunOzeti.gunSayisi ? dortGunOzeti.ortalama : '—'}
                </Text>
                <Text style={stiller.ozetEtiket}>Ort. kcal</Text>
              </View>
              <View style={stiller.ozet}>
                <Text style={stiller.ozetDeger}>{dortGunOzeti.gunSayisi}/4</Text>
                <Text style={stiller.ozetEtiket}>Kayıtlı gün</Text>
              </View>
              <View style={stiller.ozet}>
                <Text style={stiller.ozetDeger}>
                  {dortGunOzeti.gunSayisi
                    ? `${dortGunOzeti.fark > 0 ? '+' : ''}${dortGunOzeti.fark}`
                    : '—'}
                </Text>
                <Text style={stiller.ozetEtiket}>Hedef farkı</Text>
              </View>
            </View>
          ) : (
            <Text style={stiller.grafikNotu}>
              {premiumAktif
                ? 'Uzun dönem kalori trendin.'
                : `${KALORI_ARALIKLARI.find((a) => a.gun === aralik)?.etiket} görünümü Premium ile açılır.`}
            </Text>
          )}
        </View>

        <View style={stiller.kart}>
          <Text style={stiller.kartBasligi}>Makro Dağılımı</Text>
          <MakroSatiri etiket="Protein" yuzde={proteinYuzde} />
          <MakroSatiri etiket="Karbonhidrat" yuzde={karbYuzde} />
          <MakroSatiri etiket="Yağ" yuzde={yagYuzde} />
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
  profilButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  profilButonuBasili: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  profilButonuYazisi: {
    color: ALTIN,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  uyariKarti: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  uyariYazisi: {
    flex: 1,
    color: ALTIN,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19,
  },
  kart: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kartBasligi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  kiloEkleButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kiloEkleYazisi: {
    color: ALTIN,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  istatistikSatiri: {
    flexDirection: 'row',
    marginTop: 16,
  },
  istatistik: {
    flex: 1,
    alignItems: 'center',
  },
  istatistikDeger: {
    color: ALTIN,
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  istatistikEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 10,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  tahminSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ALTIN_COK_SOLUK,
  },
  tahminEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  tahminDeger: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  sekmeSatiri: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  sekme: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingVertical: 7,
  },
  sekmeAktif: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232, 195, 124, 0.14)',
  },
  sekmeYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.2,
  },
  sekmeYaziAktif: {
    color: ALTIN,
  },
  grafikSarici: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  kilitKapak: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  kilitRozet: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  kilitYazi: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  ozetSatiri: {
    flexDirection: 'row',
    marginTop: 14,
  },
  ozet: {
    flex: 1,
    alignItems: 'center',
  },
  ozetDeger: {
    color: ALTIN,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  ozetEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 10,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  grafikNotu: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  makroSatiri: {
    marginBottom: 14,
  },
  makroUstSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  makroEtiket: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  makroYuzde: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
  },
  makroCubukArkaPlan: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ALTIN_COK_SOLUK,
    overflow: 'hidden',
  },
  makroCubukDolu: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ALTIN,
  },
});
