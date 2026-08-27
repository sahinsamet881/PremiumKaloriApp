import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { MakroHedefleri } from '@/types';

type TemelHedef = 'ver' | 'al' | 'koru';
type Cinsiyet = 'kadin' | 'erkek';
type AktiviteDuzeyi = 'sedanter' | 'azAktif' | 'orta' | 'aktif' | 'cokAktif';
type BeslenmeTercihi = 'dengeli' | 'keto' | 'yuksekProtein' | 'dusukKarbonhidrat' | 'vejetaryen';
type UykuDuzeni = 'yetersiz' | 'orta' | 'iyi' | 'uzun';
type AnimasyonTipi = 'sagdan' | 'buyuyerek' | 'belirme';

type OnboardingCevaplari = {
  isim: string;
  temelHedef: TemelHedef | null;
  cinsiyet: Cinsiyet | null;
  yas: string;
  boy: string;
  kilo: string;
  hedefKilo: string;
  aktiviteDuzeyi: AktiviteDuzeyi | null;
  beslenmeTercihi: BeslenmeTercihi | null;
  suTuketimi: string | null;
  uykuDuzeni: UykuDuzeni | null;
  motivasyon: string | null;
};

const BOS_CEVAPLAR: OnboardingCevaplari = {
  isim: '',
  temelHedef: null,
  cinsiyet: null,
  yas: '',
  boy: '',
  kilo: '',
  hedefKilo: '',
  aktiviteDuzeyi: null,
  beslenmeTercihi: null,
  suTuketimi: null,
  uykuDuzeni: null,
  motivasyon: null,
};

const TOPLAM_ADIM = 10;

const ANIMASYON_TIPLERI: AnimasyonTipi[] = [
  'sagdan',
  'buyuyerek',
  'belirme',
  'sagdan',
  'belirme',
  'buyuyerek',
  'sagdan',
  'buyuyerek',
  'belirme',
  'sagdan',
];

const ADIM_BASLIKLARI = [
  'Sana nasıl hitap edelim?',
  'Temel hedefin ne?',
  'Cinsiyet ve yaşını öğrenelim',
  'Boyun ve kilon nedir?',
  'Hedef kilon ne olsun?',
  'Aktivite düzeyin nasıl?',
  'Beslenme tercihin ne?',
  'Günlük su tüketimin?',
  'Uyku düzenin nasıl?',
  'Seni motive eden ne?',
];

const TEMEL_HEDEF_SECENEKLERI: { id: TemelHedef; etiket: string }[] = [
  { id: 'ver', etiket: 'Kilo Vermek' },
  { id: 'al', etiket: 'Kilo Almak' },
  { id: 'koru', etiket: 'Kilomu Korumak' },
];

const CINSIYET_SECENEKLERI: { id: Cinsiyet; etiket: string }[] = [
  { id: 'kadin', etiket: 'Kadın' },
  { id: 'erkek', etiket: 'Erkek' },
];

const AKTIVITE_SECENEKLERI: { id: AktiviteDuzeyi; etiket: string; aciklama: string }[] = [
  { id: 'sedanter', etiket: 'Hareketsiz', aciklama: 'Masa başı iş, egzersiz yok' },
  { id: 'azAktif', etiket: 'Az Aktif', aciklama: 'Haftada 1-3 gün hafif egzersiz' },
  { id: 'orta', etiket: 'Orta Aktif', aciklama: 'Haftada 3-5 gün egzersiz' },
  { id: 'aktif', etiket: 'Aktif', aciklama: 'Haftada 6-7 gün egzersiz' },
  { id: 'cokAktif', etiket: 'Çok Aktif', aciklama: 'Günde 2 kez veya ağır iş' },
];

const BESLENME_SECENEKLERI: { id: BeslenmeTercihi; etiket: string }[] = [
  { id: 'dengeli', etiket: 'Dengeli' },
  { id: 'keto', etiket: 'Keto' },
  { id: 'yuksekProtein', etiket: 'Yüksek Protein' },
  { id: 'dusukKarbonhidrat', etiket: 'Düşük Karbonhidrat' },
  { id: 'vejetaryen', etiket: 'Vejetaryen' },
];

const SU_SECENEKLERI = [
  { id: 'az', etiket: 'Az', aciklama: 'Günde 1 litreden az' },
  { id: 'orta', etiket: 'Orta', aciklama: 'Günde 1-2 litre' },
  { id: 'cok', etiket: 'Çok', aciklama: 'Günde 2 litreden fazla' },
];

const UYKU_SECENEKLERI: { id: UykuDuzeni; etiket: string; aciklama: string }[] = [
  { id: 'yetersiz', etiket: '5 Saatin Altı', aciklama: 'Düzensiz ve yetersiz' },
  { id: 'orta', etiket: '5-7 Saat', aciklama: 'Kısmen dengeli' },
  { id: 'iyi', etiket: '7-8 Saat', aciklama: 'İdeal aralık' },
  { id: 'uzun', etiket: '8 Saat Üzeri', aciklama: 'Uzun ve dinlendirici' },
];

const MOTIVASYON_SECENEKLERI = [
  { id: 'saglik', etiket: 'Sağlıklı Yaşam' },
  { id: 'gorunum', etiket: 'Daha İyi Görünmek' },
  { id: 'enerji', etiket: 'Enerjik Hissetmek' },
  { id: 'ozguven', etiket: 'Özgüven Kazanmak' },
  { id: 'performans', etiket: 'Spor Performansı' },
];

const AKTIVITE_CARPANLARI: Record<AktiviteDuzeyi, number> = {
  sedanter: 1.2,
  azAktif: 1.375,
  orta: 1.55,
  aktif: 1.725,
  cokAktif: 1.9,
};

const UYKU_CARPANLARI: Record<UykuDuzeni, number> = {
  yetersiz: 0.97,
  orta: 0.99,
  iyi: 1,
  uzun: 1,
};

const HEDEF_KALORI_AYARI: Record<TemelHedef, number> = {
  ver: -500,
  al: 500,
  koru: 0,
};

const MAKRO_YUZDELERI: Record<BeslenmeTercihi, MakroHedefleri> = {
  dengeli: { protein: 0.3, karbonhidrat: 0.4, yag: 0.3 },
  keto: { protein: 0.25, karbonhidrat: 0.05, yag: 0.7 },
  yuksekProtein: { protein: 0.4, karbonhidrat: 0.3, yag: 0.3 },
  dusukKarbonhidrat: { protein: 0.35, karbonhidrat: 0.2, yag: 0.45 },
  vejetaryen: { protein: 0.25, karbonhidrat: 0.5, yag: 0.25 },
};

const TEMEL_HEDEF_GERI_BILDIRIM: Record<TemelHedef, string> = {
  ver: 'Hafifleme yolculuğuna başlıyoruz!',
  al: 'Büyümeye ve güçlenmeye hazır ol!',
  koru: 'Dengeni buldun, şimdi onu koruma vakti!',
};

const CINSIYET_GERI_BILDIRIM: Record<Cinsiyet, string> = {
  kadin: 'Güçlü ve zarif bir yolculuk seni bekliyor.',
  erkek: 'Kararlılığın seni hedefine taşıyacak.',
};

const AKTIVITE_GERI_BILDIRIM: Record<AktiviteDuzeyi, string> = {
  sedanter: 'Küçük adımlar büyük değişimlere kapı açar.',
  azAktif: 'Tempoyu birlikte artıracağız.',
  orta: 'Dengeli bir ritim yakaladın.',
  aktif: 'Enerjin gerçekten ilham verici.',
  cokAktif: 'Bu adanmışlıkla sınır tanımayacaksın.',
};

const BESLENME_GERI_BILDIRIM: Record<BeslenmeTercihi, string> = {
  dengeli: 'Dengeli seçim, sürdürülebilir başarı demek.',
  keto: 'Keto yolculuğun cesur ve kararlı.',
  yuksekProtein: 'Güç senden yana olacak.',
  dusukKarbonhidrat: 'Zihin açıklığın artacak.',
  vejetaryen: 'Bu bilinçli seçim seni güçlendirecek.',
};

const SU_GERI_BILDIRIM: Record<string, string> = {
  az: 'Birlikte bu alışkanlığı güzelleştireceğiz.',
  orta: 'İyi bir denge tutturmuşsun.',
  cok: 'Vücudun sana teşekkür ediyor.',
};

const UYKU_GERI_BILDIRIM: Record<UykuDuzeni, string> = {
  yetersiz: 'Dinlenmeyi de plana dahil edeceğiz.',
  orta: 'Küçük iyileştirmeler büyük fark yaratır.',
  iyi: 'Mükemmel bir dinlenme düzeni.',
  uzun: 'Bedenin kendini fazlasıyla yeniliyor.',
};

const MOTIVASYON_GERI_BILDIRIM: Record<string, string> = {
  saglik: 'Sağlığın, sahip olduğun en değerli hazine.',
  gorunum: 'Aynadaki yansımanı sevmeye hazır ol.',
  enerji: 'Her gün daha canlı hissedeceksin.',
  ozguven: 'Özgüvenin yeni bir seviyeye çıkacak.',
  performans: 'Sınırlarını zorlamaya hazır ol.',
};

function bmrHesapla(cinsiyet: Cinsiyet, kiloKg: number, boyCm: number, yas: number) {
  if (cinsiyet === 'erkek') {
    return 88.362 + 13.397 * kiloKg + 4.799 * boyCm - 5.677 * yas;
  }
  return 447.593 + 9.247 * kiloKg + 3.098 * boyCm - 4.33 * yas;
}

function hedefleriHesapla(cevaplar: OnboardingCevaplari) {
  const yas = Number(cevaplar.yas) || 30;
  const boy = Number(cevaplar.boy) || 170;
  const kilo = Number(cevaplar.kilo) || 70;
  const cinsiyet = cevaplar.cinsiyet ?? 'kadin';
  const aktivite = cevaplar.aktiviteDuzeyi ?? 'orta';
  const uyku = cevaplar.uykuDuzeni ?? 'iyi';
  const hedef = cevaplar.temelHedef ?? 'koru';
  const beslenme = cevaplar.beslenmeTercihi ?? 'dengeli';

  const bazalMetabolizma = bmrHesapla(cinsiyet, kilo, boy, yas);
  const gunlukHarcama = bazalMetabolizma * AKTIVITE_CARPANLARI[aktivite] * UYKU_CARPANLARI[uyku];
  const hedefKaloriHam = gunlukHarcama + HEDEF_KALORI_AYARI[hedef];
  const gunlukHedefKalori = Math.max(1200, Math.round(hedefKaloriHam));

  const yuzdeler = MAKRO_YUZDELERI[beslenme];
  const makroHedefleri: MakroHedefleri = {
    protein: Math.round((gunlukHedefKalori * yuzdeler.protein) / 4),
    karbonhidrat: Math.round((gunlukHedefKalori * yuzdeler.karbonhidrat) / 4),
    yag: Math.round((gunlukHedefKalori * yuzdeler.yag) / 9),
  };

  return { gunlukHedefKalori, makroHedefleri };
}

function geriBildirimUret(adim: number, cevaplar: OnboardingCevaplari) {
  const isim = cevaplar.isim.trim();

  switch (adim) {
    case 0:
      return isim.length > 0 ? `Merhaba ${isim}, bu zarif yolculuğa hoş geldin.` : '';
    case 1:
      return cevaplar.temelHedef ? TEMEL_HEDEF_GERI_BILDIRIM[cevaplar.temelHedef] : '';
    case 2:
      return cevaplar.cinsiyet && cevaplar.yas ? CINSIYET_GERI_BILDIRIM[cevaplar.cinsiyet] : '';
    case 3:
      return cevaplar.boy && cevaplar.kilo
        ? 'Bu bilgiler, seni en iyi şekilde tanımamızı sağlıyor.'
        : '';
    case 4:
      return cevaplar.hedefKilo ? 'Bu hedefe zarafetle ulaşacağız.' : '';
    case 5:
      return cevaplar.aktiviteDuzeyi ? AKTIVITE_GERI_BILDIRIM[cevaplar.aktiviteDuzeyi] : '';
    case 6:
      return cevaplar.beslenmeTercihi ? BESLENME_GERI_BILDIRIM[cevaplar.beslenmeTercihi] : '';
    case 7:
      return cevaplar.suTuketimi ? (SU_GERI_BILDIRIM[cevaplar.suTuketimi] ?? '') : '';
    case 8:
      return cevaplar.uykuDuzeni ? UYKU_GERI_BILDIRIM[cevaplar.uykuDuzeni] : '';
    case 9:
      return cevaplar.motivasyon ? (MOTIVASYON_GERI_BILDIRIM[cevaplar.motivasyon] ?? '') : '';
    default:
      return '';
  }
}

type SecimKartiProps = {
  etiket: string;
  aciklama?: string;
  secili: boolean;
  onPress: () => void;
};

function SecimKarti({ etiket, aciklama, secili, onPress }: SecimKartiProps) {
  const doluluk = useRef(new Animated.Value(secili ? 1 : 0)).current;
  const basiliOlcek = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(doluluk, {
      toValue: secili ? 1 : 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [secili, doluluk]);

  const arkaPlanRengi = doluluk.interpolate({ inputRange: [0, 1], outputRange: [SIYAH, ALTIN] });
  const metinRengi = doluluk.interpolate({ inputRange: [0, 1], outputRange: [ALTIN, SIYAH] });

  const basildi = () => {
    Animated.spring(basiliOlcek, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  };

  const birakildi = () => {
    Animated.spring(basiliOlcek, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={basildi} onPressOut={birakildi}>
      <Animated.View style={{ transform: [{ scale: basiliOlcek }] }}>
        <Animated.View style={[stiller.secimKarti, { backgroundColor: arkaPlanRengi }]}>
          <Animated.Text style={[stiller.secimEtiketi, { color: metinRengi }]}>
            {etiket}
          </Animated.Text>
          {aciklama ? (
            <Animated.Text style={[stiller.secimAciklamasi, { color: metinRengi, opacity: 0.7 }]}>
              {aciklama}
            </Animated.Text>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { profilKaydet } = useVeri();

  const [adim, setAdim] = useState(0);
  const [cevaplar, setCevaplar] = useState<OnboardingCevaplari>(BOS_CEVAPLAR);
  const [hesaplaniyor, setHesaplaniyor] = useState(false);

  const cevirX = useRef(new Animated.Value(0)).current;
  const cevirY = useRef(new Animated.Value(0)).current;
  const olcek = useRef(new Animated.Value(1)).current;
  const saydamlik = useRef(new Animated.Value(0)).current;

  const butonDoluluk = useRef(new Animated.Value(0)).current;
  const logoSaydamlik = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoSaydamlik, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [logoSaydamlik]);

  useEffect(() => {
    const tip = ANIMASYON_TIPLERI[adim] ?? 'belirme';

    saydamlik.setValue(0);
    cevirX.setValue(tip === 'sagdan' ? 90 : 0);
    cevirY.setValue(tip === 'buyuyerek' ? 70 : 0);
    olcek.setValue(tip === 'buyuyerek' ? 0.8 : 1);

    const sure = tip === 'belirme' ? 950 : 650;
    const donusumEasing = tip === 'buyuyerek' ? Easing.out(Easing.back(1.4)) : Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(saydamlik, {
        toValue: 1,
        duration: sure,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cevirX, {
        toValue: 0,
        duration: sure,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cevirY, {
        toValue: 0,
        duration: sure,
        easing: donusumEasing,
        useNativeDriver: true,
      }),
      Animated.timing(olcek, {
        toValue: 1,
        duration: sure,
        easing: donusumEasing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [adim, cevirX, cevirY, olcek, saydamlik]);

  const cevapGuncelle = <K extends keyof OnboardingCevaplari>(
    alan: K,
    deger: OnboardingCevaplari[K]
  ) => {
    setCevaplar((onceki) => ({ ...onceki, [alan]: deger }));
  };

  const adimGecerliMi = useMemo(() => {
    switch (adim) {
      case 0:
        return cevaplar.isim.trim().length > 0;
      case 1:
        return cevaplar.temelHedef !== null;
      case 2:
        return cevaplar.cinsiyet !== null && cevaplar.yas.trim().length > 0;
      case 3:
        return cevaplar.boy.trim().length > 0 && cevaplar.kilo.trim().length > 0;
      case 4:
        return cevaplar.hedefKilo.trim().length > 0;
      case 5:
        return cevaplar.aktiviteDuzeyi !== null;
      case 6:
        return cevaplar.beslenmeTercihi !== null;
      case 7:
        return cevaplar.suTuketimi !== null;
      case 8:
        return cevaplar.uykuDuzeni !== null;
      case 9:
        return cevaplar.motivasyon !== null;
      default:
        return false;
    }
  }, [adim, cevaplar]);

  const analiziBaslat = () => {
    setHesaplaniyor(true);
    setTimeout(() => {
      const { gunlukHedefKalori, makroHedefleri } = hedefleriHesapla(cevaplar);
      profilKaydet({
        isim: cevaplar.isim.trim(),
        yas: Number(cevaplar.yas) || 0,
        boy: Number(cevaplar.boy) || 0,
        kilo: Number(cevaplar.kilo) || 0,
        hedefKilo: Number(cevaplar.hedefKilo) || 0,
        gunlukHedefKalori,
        makroHedefleri,
      });
      router.replace('/(tabs)');
    }, 1800);
  };

  const ileriGit = () => {
    if (!adimGecerliMi) {
      return;
    }
    if (adim === TOPLAM_ADIM - 1) {
      analiziBaslat();
      return;
    }
    setAdim((onceki) => onceki + 1);
  };

  const geriGit = () => {
    if (adim === 0) {
      return;
    }
    setAdim((onceki) => onceki - 1);
  };

  const butonBasildi = () => {
    if (!adimGecerliMi) {
      return;
    }
    Animated.timing(butonDoluluk, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };

  const butonBirakildi = () => {
    Animated.timing(butonDoluluk, { toValue: 0, duration: 280, useNativeDriver: false }).start();
  };

  const butonArkaPlani = butonDoluluk.interpolate({ inputRange: [0, 1], outputRange: [SIYAH, ALTIN] });
  const butonMetinRengi = butonDoluluk.interpolate({ inputRange: [0, 1], outputRange: [ALTIN, SIYAH] });

  if (hesaplaniyor) {
    return (
      <View style={[stiller.kok, stiller.yuklemeKok]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={ALTIN} />
        <Animated.Text style={stiller.yuklemeBasligi}>
          Hedeflerin Analiz Ediliyor...
        </Animated.Text>
        <Animated.Text style={stiller.yuklemeAltYazi}>
          Harris-Benedict formülüyle sana özel hesaplanıyor
        </Animated.Text>
      </View>
    );
  }

  const geriBildirim = geriBildirimUret(adim, cevaplar);

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.kok}>
        <View style={stiller.ustBar}>
          <Pressable onPress={geriGit} hitSlop={12} style={stiller.geriAlani}>
            {adim > 0 ? <Animated.Text style={stiller.geriYazisi}>‹ Geri</Animated.Text> : null}
          </Pressable>
          <View style={stiller.ilerlemeArkaPlani}>
            <View
              style={[
                stiller.ilerlemeCubugu,
                { width: `${((adim + 1) / TOPLAM_ADIM) * 100}%` },
              ]}
            />
          </View>
          <Animated.Text style={stiller.adimSayaci}>
            {adim + 1}/{TOPLAM_ADIM}
          </Animated.Text>
        </View>

        <Animated.View style={[stiller.logoAlani, { opacity: logoSaydamlik }]}>
          <MaterialCommunityIcons name="crown-outline" size={32} color={ALTIN} />
        </Animated.View>

        <KeyboardAvoidingView
          style={stiller.icerikSarici}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={stiller.kaydirmaIcerigi}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Animated.View
                style={{
                  opacity: saydamlik,
                  transform: [{ translateX: cevirX }, { translateY: cevirY }, { scale: olcek }],
                }}>
                <Animated.Text style={stiller.baslik}>{ADIM_BASLIKLARI[adim]}</Animated.Text>

                <View style={stiller.icerikAlani}>
                  {adim === 0 ? (
                    <TextInput
                      autoFocus
                      value={cevaplar.isim}
                      onChangeText={(metin) => cevapGuncelle('isim', metin)}
                      placeholder="Adın"
                      placeholderTextColor={ALTIN_SOLUK}
                      selectionColor={ALTIN}
                      style={stiller.metinGirisi}
                      returnKeyType="done"
                    />
                  ) : null}

                  {adim === 1 ? (
                    <View style={stiller.secimListesi}>
                      {TEMEL_HEDEF_SECENEKLERI.map((secenek) => (
                        <SecimKarti
                          key={secenek.id}
                          etiket={secenek.etiket}
                          secili={cevaplar.temelHedef === secenek.id}
                          onPress={() => cevapGuncelle('temelHedef', secenek.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  {adim === 2 ? (
                    <View>
                      <View style={stiller.secimListesiYatay}>
                        {CINSIYET_SECENEKLERI.map((secenek) => (
                          <View key={secenek.id} style={stiller.yatayKartAlani}>
                            <SecimKarti
                              etiket={secenek.etiket}
                              secili={cevaplar.cinsiyet === secenek.id}
                              onPress={() => cevapGuncelle('cinsiyet', secenek.id)}
                            />
                          </View>
                        ))}
                      </View>
                      <TextInput
                        value={cevaplar.yas}
                        onChangeText={(metin) => cevapGuncelle('yas', metin.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="Yaşın"
                        placeholderTextColor={ALTIN_SOLUK}
                        selectionColor={ALTIN}
                        style={[stiller.metinGirisi, stiller.ikinciGiris]}
                      />
                    </View>
                  ) : null}

                  {adim === 3 ? (
                    <View style={stiller.ikiliGirisSatiri}>
                      <View style={stiller.ikiliGirisAlani}>
                        <Animated.Text style={stiller.girisEtiketi}>Boy (cm)</Animated.Text>
                        <TextInput
                          value={cevaplar.boy}
                          onChangeText={(metin) =>
                            cevapGuncelle('boy', metin.replace(/[^0-9]/g, ''))
                          }
                          keyboardType="number-pad"
                          placeholder="170"
                          placeholderTextColor={ALTIN_SOLUK}
                          selectionColor={ALTIN}
                          style={stiller.metinGirisi}
                        />
                      </View>
                      <View style={stiller.ikiliGirisAlani}>
                        <Animated.Text style={stiller.girisEtiketi}>Kilo (kg)</Animated.Text>
                        <TextInput
                          value={cevaplar.kilo}
                          onChangeText={(metin) =>
                            cevapGuncelle('kilo', metin.replace(/[^0-9.]/g, ''))
                          }
                          keyboardType="decimal-pad"
                          placeholder="70"
                          placeholderTextColor={ALTIN_SOLUK}
                          selectionColor={ALTIN}
                          style={stiller.metinGirisi}
                        />
                      </View>
                    </View>
                  ) : null}

                  {adim === 4 ? (
                    <TextInput
                      autoFocus
                      value={cevaplar.hedefKilo}
                      onChangeText={(metin) =>
                        cevapGuncelle('hedefKilo', metin.replace(/[^0-9.]/g, ''))
                      }
                      keyboardType="decimal-pad"
                      placeholder="Hedef kilon (kg)"
                      placeholderTextColor={ALTIN_SOLUK}
                      selectionColor={ALTIN}
                      style={stiller.metinGirisi}
                    />
                  ) : null}

                  {adim === 5 ? (
                    <View style={stiller.secimListesi}>
                      {AKTIVITE_SECENEKLERI.map((secenek) => (
                        <SecimKarti
                          key={secenek.id}
                          etiket={secenek.etiket}
                          aciklama={secenek.aciklama}
                          secili={cevaplar.aktiviteDuzeyi === secenek.id}
                          onPress={() => cevapGuncelle('aktiviteDuzeyi', secenek.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  {adim === 6 ? (
                    <View style={stiller.secimListesi}>
                      {BESLENME_SECENEKLERI.map((secenek) => (
                        <SecimKarti
                          key={secenek.id}
                          etiket={secenek.etiket}
                          secili={cevaplar.beslenmeTercihi === secenek.id}
                          onPress={() => cevapGuncelle('beslenmeTercihi', secenek.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  {adim === 7 ? (
                    <View style={stiller.secimListesi}>
                      {SU_SECENEKLERI.map((secenek) => (
                        <SecimKarti
                          key={secenek.id}
                          etiket={secenek.etiket}
                          aciklama={secenek.aciklama}
                          secili={cevaplar.suTuketimi === secenek.id}
                          onPress={() => cevapGuncelle('suTuketimi', secenek.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  {adim === 8 ? (
                    <View style={stiller.secimListesi}>
                      {UYKU_SECENEKLERI.map((secenek) => (
                        <SecimKarti
                          key={secenek.id}
                          etiket={secenek.etiket}
                          aciklama={secenek.aciklama}
                          secili={cevaplar.uykuDuzeni === secenek.id}
                          onPress={() => cevapGuncelle('uykuDuzeni', secenek.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  {adim === 9 ? (
                    <View style={stiller.secimListesi}>
                      {MOTIVASYON_SECENEKLERI.map((secenek) => (
                        <SecimKarti
                          key={secenek.id}
                          etiket={secenek.etiket}
                          secili={cevaplar.motivasyon === secenek.id}
                          onPress={() => cevapGuncelle('motivasyon', secenek.id)}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>

                {geriBildirim ? (
                  <Animated.Text style={stiller.geriBildirim}>{geriBildirim}</Animated.Text>
                ) : null}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        <View style={stiller.altBar}>
          <Pressable onPress={ileriGit} onPressIn={butonBasildi} onPressOut={butonBirakildi}>
            <Animated.View
              style={[
                stiller.ileriButonu,
                { backgroundColor: butonArkaPlani, opacity: adimGecerliMi ? 1 : 0.35 },
              ]}>
              <Animated.Text style={[stiller.ileriButonuYazisi, { color: butonMetinRengi }]}>
                {adim === TOPLAM_ADIM - 1 ? 'Analizi Başlat' : 'İleri'}
              </Animated.Text>
            </Animated.View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const stiller = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  logoAlani: {
    alignItems: 'center',
    marginTop: 20,
  },
  geriAlani: {
    minWidth: 56,
  },
  geriYazisi: {
    color: 'rgba(232,195,124,0.7)',
    fontSize: 15,
    fontWeight: '300',
  },
  ilerlemeArkaPlani: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: ALTIN_COK_SOLUK,
    overflow: 'hidden',
  },
  ilerlemeCubugu: {
    height: '100%',
    borderRadius: 1,
    backgroundColor: ALTIN,
  },
  adimSayaci: {
    color: 'rgba(232,195,124,0.55)',
    fontSize: 13,
    fontWeight: '300',
    minWidth: 36,
    textAlign: 'right',
  },
  icerikSarici: {
    flex: 1,
  },
  kaydirmaIcerigi: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  baslik: {
    color: ALTIN,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: 1.5,
    marginBottom: 36,
  },
  icerikAlani: {
    gap: 12,
  },
  secimListesi: {
    gap: 12,
  },
  secimListesiYatay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  yatayKartAlani: {
    flex: 1,
  },
  secimKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  secimEtiketi: {
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 0.8,
  },
  secimAciklamasi: {
    fontSize: 13,
    fontWeight: '300',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  metinGirisi: {
    color: ALTIN,
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,195,124,0.4)',
    paddingVertical: 12,
  },
  ikinciGiris: {
    marginTop: 4,
  },
  girisEtiketi: {
    color: 'rgba(232,195,124,0.55)',
    fontSize: 13,
    fontWeight: '300',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  ikiliGirisSatiri: {
    flexDirection: 'row',
    gap: 20,
  },
  ikiliGirisAlani: {
    flex: 1,
  },
  geriBildirim: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '300',
    marginTop: 30,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  altBar: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    paddingTop: 8,
  },
  ileriButonu: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ileriButonuYazisi: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 1,
  },
  yuklemeKok: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  yuklemeBasligi: {
    color: ALTIN,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  yuklemeAltYazi: {
    color: 'rgba(232,195,124,0.55)',
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
