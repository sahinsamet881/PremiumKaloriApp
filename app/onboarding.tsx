import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ALTIN,
  ALTIN_COK_SOLUK,
  ALTIN_ORTA_SOLUK,
  ALTIN_SOLUK,
  SIYAH,
  SURFACE,
} from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { BMR_FORMUL_ADI, bmrHesapla } from '@/nutrition/kalori';
import { MakroHedefleri } from '@/types';

type TemelHedef = 'ver' | 'al' | 'koru';
type Cinsiyet = 'kadin' | 'erkek';
type AktiviteDuzeyi = 'sedanter' | 'azAktif' | 'orta' | 'aktif' | 'cokAktif';
type BeslenmeTercihi = 'dengeli' | 'keto' | 'yuksekProtein' | 'dusukKarbonhidrat' | 'vejetaryen';
type UykuDuzeni = 'yetersiz' | 'orta' | 'iyi' | 'uzun';
type AnimasyonTipi = 'sagdan' | 'buyuyerek' | 'belirme';
type IkonAdi = ComponentProps<typeof MaterialCommunityIcons>['name'];

type OnboardingCevaplari = {
  isim: string;
  temelHedef: TemelHedef | null;
  cinsiyet: Cinsiyet | null;
  dogumYili: string;
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
  dogumYili: '',
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
  'Sana ne diyelim?',
  'Bugünkü hedefin ne?',
  'Doğum yılını ve cinsiyetini öğrenelim',
  'Mezura ve tartı zamanı!',
  'Nereye varmak istiyorsun?',
  'Günün ne kadar hareketli?',
  'Tabağında neler dönüyor?',
  'Su içme alışkanlığın nasıl?',
  'Kaç saat kestiriyorsun?',
  'Seni ayağa kaldıran ne?',
];

const ADIM_IKONLARI: IkonAdi[] = [
  'crown',
  'bullseye-arrow',
  'human',
  'scale-bathroom',
  'weight',
  'run',
  'food-steak',
  'water-outline',
  'sleep',
  'fire',
];

const TEMEL_HEDEF_SECENEKLERI: { id: TemelHedef; etiket: string }[] = [
  { id: 'ver', etiket: 'Kilo Vermek' },
  { id: 'al', etiket: 'Kilo Almak' },
  { id: 'koru', etiket: 'Kilomu Korumak' },
];

const GECIS_ICERIGI: Record<TemelHedef, { ikon: IkonAdi; mesaj: string }> = {
  ver: { ikon: 'run-fast', mesaj: 'Koşu bandının fişini takıyoruz...' },
  al: { ikon: 'dumbbell', mesaj: 'Ağırlıklar ısınıyor, porsiyonlar büyüyor...' },
  koru: { ikon: 'yin-yang', mesaj: 'Mükemmel dengeyi kilitliyoruz...' },
};

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

const GUNCEL_YIL = new Date().getFullYear();
const MIN_DOGUM_YILI = 1900;
const YAS_ALT_SINIRI = 18;

function yasHesapla(dogumYili: string): number {
  const yil = Number(dogumYili);
  if (!yil || yil < MIN_DOGUM_YILI || yil > GUNCEL_YIL) {
    return 0;
  }
  return GUNCEL_YIL - yil;
}

function hedefleriHesapla(cevaplar: OnboardingCevaplari) {
  const yas = yasHesapla(cevaplar.dogumYili) || 30;
  const boy = Number(cevaplar.boy) || 170;
  const kilo = Number(cevaplar.kilo) || 70;
  const cinsiyet = cevaplar.cinsiyet ?? 'kadin';
  const aktivite = cevaplar.aktiviteDuzeyi ?? 'orta';
  const uyku = cevaplar.uykuDuzeni ?? 'iyi';
  const hedef = cevaplar.temelHedef ?? 'koru';
  const beslenme = cevaplar.beslenmeTercihi ?? 'dengeli';

  const bazalMetabolizma = bmrHesapla(cinsiyet, kilo, boy, yas);
  const aktiviteCarpani = AKTIVITE_CARPANLARI[aktivite];
  const uykuCarpani = UYKU_CARPANLARI[uyku];
  const gunlukHarcama = bazalMetabolizma * aktiviteCarpani * uykuCarpani;
  const hedefAyari = HEDEF_KALORI_AYARI[hedef];
  const hedefKaloriHam = gunlukHarcama + hedefAyari;
  const gunlukHedefKalori = Math.max(1200, Math.round(hedefKaloriHam));

  const yuzdeler = MAKRO_YUZDELERI[beslenme];
  const makroHedefleri: MakroHedefleri = {
    protein: Math.round((gunlukHedefKalori * yuzdeler.protein) / 4),
    karbonhidrat: Math.round((gunlukHedefKalori * yuzdeler.karbonhidrat) / 4),
    yag: Math.round((gunlukHedefKalori * yuzdeler.yag) / 9),
  };

  return {
    gunlukHedefKalori,
    makroHedefleri,
    detay: {
      yas,
      boy,
      kilo,
      cinsiyet,
      bmr: Math.round(bazalMetabolizma),
      aktiviteCarpani,
      uykuCarpani,
      tdee: Math.round(gunlukHarcama),
      hedefAyari,
    },
  };
}

function geriBildirimUret(adim: number, cevaplar: OnboardingCevaplari) {
  const isim = cevaplar.isim.trim();

  switch (adim) {
    case 0:
      return isim.length > 0 ? `Merhaba ${isim}, ekibe hoş geldin! Kaloriler titriyor.` : '';
    case 1:
      return cevaplar.temelHedef ? TEMEL_HEDEF_GERI_BILDIRIM[cevaplar.temelHedef] : '';
    case 2:
      return cevaplar.cinsiyet && cevaplar.dogumYili
        ? CINSIYET_GERI_BILDIRIM[cevaplar.cinsiyet]
        : '';
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
    Animated.spring(basiliOlcek, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
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

const SATIR_YUKSEKLIGI = 44;
const GORUNUR_ALAN = SATIR_YUKSEKLIGI * 5;

type DikeySeciciProps = {
  etiket: string;
  deger: string;
  onDegisti: (deger: string) => void;
  minDeger: number;
  maxDeger: number;
  adimBuyuklugu?: number;
  birim: string;
  zekiMetin: string;
  varyant: 'mezura' | 'tarti';
};

function DikeySecici({
  etiket,
  deger,
  onDegisti,
  minDeger,
  maxDeger,
  adimBuyuklugu = 1,
  birim,
  zekiMetin,
  varyant,
}: DikeySeciciProps) {
  const kaydirmaRef = useRef<ScrollView>(null);
  const okumaOlcegi = useRef(new Animated.Value(1)).current;
  const ilkYerlesimYapildi = useRef(false);

  const degerler = useMemo(() => {
    const liste: number[] = [];
    for (let v = minDeger; v <= maxDeger; v += adimBuyuklugu) {
      liste.push(Math.round(v * 10) / 10);
    }
    return liste;
  }, [minDeger, maxDeger, adimBuyuklugu]);

  useEffect(() => {
    okumaOlcegi.setValue(0.85);
    Animated.spring(okumaOlcegi, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }, [deger, okumaOlcegi]);

  useEffect(() => {
    if (ilkYerlesimYapildi.current) {
      return;
    }
    ilkYerlesimYapildi.current = true;
    const mevcutDeger = Number(deger) || minDeger;
    const index = Math.round((mevcutDeger - minDeger) / adimBuyuklugu);
    requestAnimationFrame(() => {
      kaydirmaRef.current?.scrollTo({ y: index * SATIR_YUKSEKLIGI, animated: false });
    });
  }, [deger, minDeger, adimBuyuklugu]);

  const kaydirmaBitti = (olay: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = olay.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(degerler.length - 1, Math.round(y / SATIR_YUKSEKLIGI)));
    const yeniDeger = degerler[index];
    onDegisti(String(yeniDeger));
    kaydirmaRef.current?.scrollTo({ y: index * SATIR_YUKSEKLIGI, animated: true });
  };

  return (
    <View style={stiller.dikeySeciciKok}>
      <Text style={stiller.dikeySeciciEtiket}>{etiket}</Text>
      <Animated.Text
        style={[stiller.dikeySeciciBuyukSayi, { transform: [{ scale: okumaOlcegi }] }]}>
        {`${deger || minDeger}${birim}`}
      </Animated.Text>
      <View
        style={[
          stiller.dikeySeciciCubukAlani,
          varyant === 'tarti' ? stiller.dikeySeciciTartiPaneli : stiller.dikeySeciciMezuraPaneli,
        ]}>
        <View style={stiller.dikeySeciciVurguCubugu} pointerEvents="none" />
        <ScrollView
          ref={kaydirmaRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={SATIR_YUKSEKLIGI}
          decelerationRate="fast"
          onMomentumScrollEnd={kaydirmaBitti}
          contentContainerStyle={{ paddingVertical: SATIR_YUKSEKLIGI * 2 }}>
          {degerler.map((v) => (
            <View key={v} style={stiller.dikeySeciciSatir}>
              <Text
                style={[
                  stiller.dikeySeciciSatirYazisi,
                  Number(deger) === v ? stiller.dikeySeciciSatirYazisiAktif : null,
                ]}>
                {v}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <Text style={stiller.zekiMetin}>{zekiMetin}</Text>
    </View>
  );
}

function SeffaflikSatiri({
  etiket,
  deger,
  vurgu,
}: {
  etiket: string;
  deger: string;
  vurgu?: boolean;
}) {
  return (
    <View style={stiller.seffaflikSatiri}>
      <Text style={[stiller.seffaflikEtiket, vurgu ? stiller.seffaflikVurguYazi : null]}>
        {etiket}
      </Text>
      <Text style={[stiller.seffaflikDeger, vurgu ? stiller.seffaflikVurguYazi : null]}>{deger}</Text>
    </View>
  );
}

type SeffaflikEkraniProps = {
  cevaplar: OnboardingCevaplari;
  onGeri: () => void;
  onOnayla: () => void;
};

function SeffaflikEkrani({ cevaplar, onGeri, onOnayla }: SeffaflikEkraniProps) {
  const { gunlukHedefKalori, detay } = hedefleriHesapla(cevaplar);
  const aktiviteEtiket =
    AKTIVITE_SECENEKLERI.find((secenek) => secenek.id === cevaplar.aktiviteDuzeyi)?.etiket ?? '—';
  const hedefEtiket =
    TEMEL_HEDEF_SECENEKLERI.find((secenek) => secenek.id === cevaplar.temelHedef)?.etiket ?? '—';
  const cinsiyetEtiket = cevaplar.cinsiyet === 'erkek' ? 'Erkek' : 'Kadın';
  const ayarMetni = `${detay.hedefAyari >= 0 ? '+' : ''}${detay.hedefAyari} kcal`;

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.kok}>
        <ScrollView
          contentContainerStyle={stiller.seffaflikIcerik}
          showsVerticalScrollIndicator={false}>
          <MaterialCommunityIcons name="calculator-variant-outline" size={46} color={ALTIN} />
          <Text style={stiller.seffaflikBaslik}>Hesabın Nasıl Çıktı?</Text>
          <Text style={stiller.seffaflikAltBaslik}>
            Günlük kalori hedefin {BMR_FORMUL_ADI} formülüyle, girdiğin değerler üzerinden hesaplandı.
          </Text>

          <View style={stiller.seffaflikKarti}>
            <Text style={stiller.seffaflikKartBaslik}>Girdiğin Değerler</Text>
            <SeffaflikSatiri etiket="Cinsiyet" deger={cinsiyetEtiket} />
            <SeffaflikSatiri etiket="Yaş" deger={`${detay.yas} (${cevaplar.dogumYili} doğumlu)`} />
            <SeffaflikSatiri etiket="Boy" deger={`${detay.boy} cm`} />
            <SeffaflikSatiri etiket="Kilo" deger={`${detay.kilo} kg`} />
            <SeffaflikSatiri etiket="Aktivite" deger={aktiviteEtiket} />
            <SeffaflikSatiri etiket="Hedef" deger={hedefEtiket} />
          </View>

          <View style={stiller.seffaflikKarti}>
            <Text style={stiller.seffaflikKartBaslik}>Adım Adım Hesap</Text>
            <SeffaflikSatiri
              etiket={`Bazal metabolizma (${BMR_FORMUL_ADI})`}
              deger={`${detay.bmr} kcal`}
            />
            <SeffaflikSatiri
              etiket="Aktivite × uyku çarpanı"
              deger={`${detay.aktiviteCarpani} × ${detay.uykuCarpani}`}
            />
            <SeffaflikSatiri etiket="Günlük harcama (TDEE)" deger={`${detay.tdee} kcal`} />
            <SeffaflikSatiri etiket="Hedef ayarı" deger={ayarMetni} />
            <View style={stiller.seffaflikAyrac} />
            <SeffaflikSatiri
              etiket="Günlük hedef kalori"
              deger={`${gunlukHedefKalori} kcal`}
              vurgu
            />
          </View>

          <Pressable onPress={onOnayla} style={stiller.onaylaButonu}>
            <Text style={stiller.onaylaButonuYazisi}>Onaylıyorum, Başlayalım</Text>
          </Pressable>
          <Pressable onPress={onGeri} hitSlop={10} style={stiller.duzenleButonu}>
            <Text style={stiller.duzenleButonuYazisi}>Değerleri düzenle</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function YasEngeliEkrani({ onDuzelt }: { onDuzelt: () => void }) {
  return (
    <View style={[stiller.kok, stiller.engelKok]}>
      <StatusBar style="light" />
      <MaterialCommunityIcons name="shield-alert-outline" size={62} color={ALTIN} />
      <Text style={stiller.engelBaslik}>Bu Uygulama 18 Yaş ve{'\n'}Üzeri İçindir</Text>
      <Text style={stiller.engelMetin}>
        Kalori takibi ve diyet içerikleri yetişkinlere yöneliktir. Gelişim çağında kısıtlayıcı
        beslenme sağlığa zarar verebileceğinden girişine şu an izin veremiyoruz.
      </Text>

      <View style={stiller.destekKarti}>
        <Text style={stiller.destekBaslik}>Yalnız değilsin</Text>
        <Text style={stiller.destekMetin}>
          Beslenme, kilo veya vücut algınla ilgili zorlanıyorsan bir doktora, diyetisyene ya da okul
          rehberlik servisine danışabilirsin.
        </Text>
        <Pressable onPress={() => Linking.openURL('tel:182')} style={stiller.destekHat}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={ALTIN} />
          <Text style={stiller.destekHatYazisi}>Sağlık Bakanlığı Danışma Hattı: 182</Text>
        </Pressable>
      </View>

      <Pressable onPress={onDuzelt} hitSlop={10}>
        <Text style={stiller.duzeltYazisi}>Doğum yılını yanlış mı girdim? Geri dön</Text>
      </Pressable>
    </View>
  );
}

export default function OnboardingScreen() {
  const { profilKaydet } = useVeri();

  const [adim, setAdim] = useState(0);
  const [cevaplar, setCevaplar] = useState<OnboardingCevaplari>(BOS_CEVAPLAR);
  const [hesaplaniyor, setHesaplaniyor] = useState(false);
  const [geciyor, setGeciyor] = useState<TemelHedef | null>(null);
  const [yasEngeli, setYasEngeli] = useState(false);
  const [sonuclariGoster, setSonuclariGoster] = useState(false);

  const cevirX = useRef(new Animated.Value(0)).current;
  const cevirY = useRef(new Animated.Value(0)).current;
  const olcek = useRef(new Animated.Value(1)).current;
  const saydamlik = useRef(new Animated.Value(0)).current;

  const butonOlcek = useRef(new Animated.Value(1)).current;
  const logoSaydamlik = useRef(new Animated.Value(0)).current;
  const nabizOlcegi = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    logoSaydamlik.setValue(0);
    Animated.timing(logoSaydamlik, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [adim, logoSaydamlik]);

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

  useEffect(() => {
    if (!geciyor) {
      return;
    }
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(nabizOlcegi, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(nabizOlcegi, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    dongu.start();
    return () => dongu.stop();
  }, [geciyor, nabizOlcegi]);

  const cevapGuncelle = <K extends keyof OnboardingCevaplari>(
    alan: K,
    deger: OnboardingCevaplari[K]
  ) => {
    setCevaplar((onceki) => ({ ...onceki, [alan]: deger }));
  };

  const hedefSecildiVeGec = (id: TemelHedef) => {
    cevapGuncelle('temelHedef', id);
    setGeciyor(id);
    setTimeout(() => {
      setGeciyor(null);
      setAdim((onceki) => onceki + 1);
    }, 2500);
  };

  const adimGecerliMi = useMemo(() => {
    switch (adim) {
      case 0:
        return cevaplar.isim.trim().length > 0;
      case 1:
        return cevaplar.temelHedef !== null;
      case 2:
        return (
          cevaplar.cinsiyet !== null &&
          cevaplar.dogumYili.trim().length === 4 &&
          yasHesapla(cevaplar.dogumYili) > 0
        );
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
        yas: yasHesapla(cevaplar.dogumYili),
        boy: Number(cevaplar.boy) || 0,
        kilo: Number(cevaplar.kilo) || 0,
        hedefKilo: Number(cevaplar.hedefKilo) || 0,
        cinsiyet: cevaplar.cinsiyet ?? 'kadin',
        gunlukHedefKalori,
        makroHedefleri,
      });
      router.replace('/paywall?akis=onboarding');
    }, 1800);
  };

  const ileriGit = () => {
    if (!adimGecerliMi) {
      return;
    }
    if (adim === 2 && yasHesapla(cevaplar.dogumYili) < YAS_ALT_SINIRI) {
      setYasEngeli(true);
      return;
    }
    if (adim === TOPLAM_ADIM - 1) {
      setSonuclariGoster(true);
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
    Animated.spring(butonOlcek, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  };

  const butonBirakildi = () => {
    Animated.spring(butonOlcek, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  if (hesaplaniyor) {
    return (
      <View style={[stiller.kok, stiller.yuklemeKok]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={ALTIN} />
        <Text style={stiller.yuklemeBasligi}>Hedeflerin Analiz Ediliyor...</Text>
        <Text style={stiller.yuklemeAltYazi}>
          {BMR_FORMUL_ADI} formülüyle sana özel hesaplanıyor
        </Text>
      </View>
    );
  }

  if (yasEngeli) {
    return (
      <YasEngeliEkrani
        onDuzelt={() => {
          setYasEngeli(false);
          setAdim(2);
        }}
      />
    );
  }

  if (sonuclariGoster) {
    return (
      <SeffaflikEkrani
        cevaplar={cevaplar}
        onGeri={() => setSonuclariGoster(false)}
        onOnayla={analiziBaslat}
      />
    );
  }

  if (geciyor) {
    const icerik = GECIS_ICERIGI[geciyor];
    return (
      <View style={[stiller.kok, stiller.gecisKok]}>
        <StatusBar style="light" />
        <Animated.View style={{ transform: [{ scale: nabizOlcegi }] }}>
          <MaterialCommunityIcons name={icerik.ikon} size={90} color={ALTIN} />
        </Animated.View>
        <Text style={stiller.gecisMesaji}>{icerik.mesaj}</Text>
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
            {adim > 0 ? <Text style={stiller.geriYazisi}>‹ Geri</Text> : null}
          </Pressable>
          <View style={stiller.ilerlemeArkaPlani}>
            <View
              style={[
                stiller.ilerlemeCubugu,
                { width: `${((adim + 1) / TOPLAM_ADIM) * 100}%` },
              ]}
            />
          </View>
          <Text style={stiller.adimSayaci}>
            {adim + 1}/{TOPLAM_ADIM}
          </Text>
        </View>

        <Animated.View style={[stiller.logoAlani, { opacity: logoSaydamlik }]}>
          <MaterialCommunityIcons name={ADIM_IKONLARI[adim]} size={70} color={ALTIN} />
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
                <Text style={stiller.baslik}>{ADIM_BASLIKLARI[adim]}</Text>

                <View style={stiller.icerikAlani}>
                  {adim === 0 ? (
                    <TextInput
                      autoFocus
                      value={cevaplar.isim}
                      onChangeText={(metin) => cevapGuncelle('isim', metin)}
                      placeholder="İsmin ne?"
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
                          onPress={() => hedefSecildiVeGec(secenek.id)}
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
                        value={cevaplar.dogumYili}
                        onChangeText={(metin) =>
                          cevapGuncelle('dogumYili', metin.replace(/[^0-9]/g, '').slice(0, 4))
                        }
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="Doğum yılın (örn. 2000)"
                        placeholderTextColor={ALTIN_SOLUK}
                        selectionColor={ALTIN}
                        style={[stiller.metinGirisi, stiller.ikinciGiris]}
                      />
                    </View>
                  ) : null}

                  {adim === 3 ? (
                    <View style={stiller.dikeySeciciSatiriDikey}>
                      <DikeySecici
                        etiket="Boy (cm)"
                        deger={cevaplar.boy}
                        onDegisti={(deger) => cevapGuncelle('boy', deger)}
                        minDeger={140}
                        maxDeger={220}
                        birim=" cm"
                        zekiMetin="Boyun kilona, kilon bize emanet."
                        varyant="mezura"
                      />
                      <DikeySecici
                        etiket="Kilo (kg)"
                        deger={cevaplar.kilo}
                        onDegisti={(deger) => cevapGuncelle('kilo', deger)}
                        minDeger={35}
                        maxDeger={180}
                        adimBuyuklugu={0.5}
                        birim=" kg"
                        zekiMetin="Tartılar yalan söyleyebilir ama biz asla."
                        varyant="tarti"
                      />
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

                {geriBildirim ? <Text style={stiller.geriBildirim}>{geriBildirim}</Text> : null}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        <View style={stiller.altBar}>
          <Pressable onPress={ileriGit} onPressIn={butonBasildi} onPressOut={butonBirakildi}>
            <Animated.View
              style={[
                stiller.ileriButonu,
                { opacity: adimGecerliMi ? 1 : 0.35, transform: [{ scale: butonOlcek }] },
              ]}>
              <Text style={stiller.ileriButonuYazisi}>
                {adim === TOPLAM_ADIM - 1 ? 'Hadi Hesaplayalım!' : 'Sıradaki'}
              </Text>
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
    color: ALTIN_ORTA_SOLUK,
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
    color: ALTIN_ORTA_SOLUK,
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
    fontFamily: 'StoriesGrand',
    fontSize: 34,
    letterSpacing: 1,
    marginBottom: 36,
    textAlign: 'center',
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
    borderTopLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  dikeySeciciSatiriDikey: {
    gap: 28,
  },
  dikeySeciciKok: {
    alignItems: 'center',
  },
  dikeySeciciEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  dikeySeciciBuyukSayi: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 34,
    marginBottom: 10,
  },
  dikeySeciciCubukAlani: {
    height: GORUNUR_ALAN,
    width: 160,
    borderRadius: 18,
    overflow: 'hidden',
  },
  dikeySeciciMezuraPaneli: {
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    backgroundColor: 'transparent',
  },
  dikeySeciciTartiPaneli: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(10,11,16,0.85)',
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  dikeySeciciVurguCubugu: {
    position: 'absolute',
    top: SATIR_YUKSEKLIGI * 2,
    left: 0,
    right: 0,
    height: SATIR_YUKSEKLIGI,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: ALTIN,
  },
  dikeySeciciSatir: {
    height: SATIR_YUKSEKLIGI,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dikeySeciciSatirYazisi: {
    color: 'rgba(232,195,124,0.35)',
    fontSize: 18,
    fontWeight: '300',
  },
  dikeySeciciSatirYazisiAktif: {
    color: ALTIN,
    fontSize: 22,
    fontWeight: '400',
  },
  zekiMetin: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 200,
  },
  geriBildirim: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '300',
    marginTop: 30,
    letterSpacing: 0.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  altBar: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    paddingTop: 8,
  },
  ileriButonu: {
    height: 56,
    backgroundColor: SIYAH,
    borderWidth: 1,
    borderColor: ALTIN,
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  ileriButonuYazisi: {
    color: ALTIN,
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
    fontFamily: 'StoriesGrand',
    fontSize: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  yuklemeAltYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  gecisKok: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  gecisMesaji: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  engelKok: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 18,
  },
  engelBaslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 26,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 34,
  },
  engelMetin: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 21,
    textAlign: 'center',
  },
  destekKarti: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    backgroundColor: 'rgba(232,195,124,0.05)',
    borderRadius: 18,
    padding: 18,
    marginTop: 6,
    gap: 10,
  },
  destekBaslik: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  destekMetin: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19,
  },
  destekHat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  destekHatYazisi: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  duzeltYazisi: {
    color: ALTIN_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  seffaflikIcerik: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 14,
  },
  seffaflikBaslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 28,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  seffaflikAltBaslik: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 6,
  },
  seffaflikKarti: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 18,
  },
  seffaflikKartBaslik: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  seffaflikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  seffaflikEtiket: {
    flex: 1,
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.2,
  },
  seffaflikDeger: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'right',
  },
  seffaflikVurguYazi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '600',
  },
  seffaflikAyrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ALTIN_COK_SOLUK,
    marginVertical: 8,
  },
  onaylaButonu: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 28,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  onaylaButonuYazisi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  duzenleButonu: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  duzenleButonuYazisi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
});
