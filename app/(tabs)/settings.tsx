import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { bmrHesapla } from '@/nutrition/kalori';
import { Cinsiyet } from '@/types';
import {
  AGRESIF_HEDEF_UYARISI,
  kaloriTabani,
  profilDogrula,
  tabanlanmisKalori,
} from '@/validation/profileValidator';

type AlanGirisiProps = {
  etiket: string;
  deger: string;
  onDegisti: (metin: string) => void;
  sayisal?: boolean;
  ondalik?: boolean;
  yari?: boolean;
};

function AlanGirisi({ etiket, deger, onDegisti, sayisal, ondalik, yari }: AlanGirisiProps) {
  const yaz = (metin: string) => {
    if (ondalik) {
      onDegisti(metin.replace(/[^0-9.]/g, ''));
      return;
    }
    if (sayisal) {
      onDegisti(metin.replace(/[^0-9]/g, ''));
      return;
    }
    onDegisti(metin);
  };

  return (
    <View style={[stiller.alan, yari ? stiller.alanYari : null]}>
      <Text style={stiller.alanEtiketi}>{etiket}</Text>
      <TextInput
        style={stiller.alanGirisi}
        value={deger}
        onChangeText={yaz}
        keyboardType={ondalik ? 'decimal-pad' : sayisal ? 'number-pad' : 'default'}
        placeholderTextColor={ALTIN_SOLUK}
        selectionColor={ALTIN}
      />
    </View>
  );
}

type LuksToggleProps = {
  etiket: string;
  aciklama: string;
  deger: boolean;
  onDegisti: (deger: boolean) => void;
};

function LuksToggle({ etiket, aciklama, deger, onDegisti }: LuksToggleProps) {
  const konum = useRef(new Animated.Value(deger ? 1 : 0)).current;

  const degistir = () => {
    const yeniDeger = !deger;
    Animated.spring(konum, { toValue: yeniDeger ? 1 : 0, useNativeDriver: true, friction: 6 }).start();
    onDegisti(yeniDeger);
  };

  const cevirX = konum.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <Pressable onPress={degistir} style={stiller.toggleSatiri}>
      <View style={stiller.toggleMetinAlani}>
        <Text style={stiller.toggleEtiket}>{etiket}</Text>
        <Text style={stiller.toggleAciklama}>{aciklama}</Text>
      </View>
      <View style={[stiller.togglePist, deger ? stiller.togglePistAktif : null]}>
        <Animated.View style={[stiller.toggleTopu, { transform: [{ translateX: cevirX }] }]} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const {
    kullanici,
    profilKaydet,
    saglikAktif,
    saglikIzni,
    saglikPlatformDestekli,
    saglikDemo,
    saglikBaslat,
    saglikDurdur,
  } = useVeri();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [suHatirlaticisi, setSuHatirlaticisi] = useState(true);
  const [ogunHatirlaticisi, setOgunHatirlaticisi] = useState(true);

  const [isimMetni, setIsimMetni] = useState(kullanici.isim);
  const [yasMetni, setYasMetni] = useState(kullanici.yas > 0 ? String(kullanici.yas) : '');
  const [boyMetni, setBoyMetni] = useState(kullanici.boy > 0 ? String(kullanici.boy) : '');
  const [kiloMetni, setKiloMetni] = useState(kullanici.kilo > 0 ? String(kullanici.kilo) : '');
  const [hedefKiloMetni, setHedefKiloMetni] = useState(
    kullanici.hedefKilo > 0 ? String(kullanici.hedefKilo) : ''
  );
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>(kullanici.cinsiyet ?? 'kadin');
  const [hataMesaji, setHataMesaji] = useState('');

  const yasamCarpani = useMemo(() => {
    const mevcutBmr = bmrHesapla(
      kullanici.cinsiyet ?? 'kadin',
      kullanici.kilo,
      kullanici.boy,
      kullanici.yas
    );
    if (mevcutBmr < 100 || kullanici.gunlukHedefKalori <= 0) {
      return 1.4;
    }
    return Math.min(2.2, Math.max(1.1, kullanici.gunlukHedefKalori / mevcutBmr));
  }, [kullanici]);

  const yas = Number(yasMetni) || 0;
  const boy = Number(boyMetni) || 0;
  const kilo = Number(kiloMetni) || 0;
  const hedefKilo = Number(hedefKiloMetni) || 0;

  const hamKalori = Math.max(0, Math.round(bmrHesapla(cinsiyet, kilo, boy, yas) * yasamCarpani));
  const { kalori: nihaiKalori, sabitlendi } = tabanlanmisKalori(hamKalori, cinsiyet);

  const iletisimeGec = () => {
    Alert.alert('Geliştirici Ekibi', 'Mesajın bize ulaştı sayılır, çok yakında buradayız!');
  };

  const premiumaGec = () => {
    router.push('/paywall');
  };

  const gecmiseGit = () => {
    router.push('/(tabs)/history');
  };

  const saglikDurumMetni =
    saglikIzni === 'verildi'
      ? saglikDemo
        ? 'Bağlı (demo verisi). Adım, aktif enerji ve kilo okunuyor; öğün ve su yazılıyor.'
        : 'Bağlı. Adım, aktif enerji ve kilo okunuyor; öğün ve su yazılıyor.'
      : saglikIzni === 'reddedildi'
        ? 'İzin reddedildi. Uygulama Apple Health olmadan da sorunsuz çalışır.'
        : 'Bağlantı kapalı. Açtığında izin isteyeceğiz.';

  const profiliKaydet = () => {
    const sonuc = profilDogrula({
      yas,
      boy,
      kilo,
      hedefKilo,
      cinsiyet,
      hesaplananKalori: hamKalori,
    });

    if (sonuc.tur === 'engel') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setHataMesaji(sonuc.mesaj);
      return;
    }

    setHataMesaji('');

    const kaydet = () => {
      profilKaydet({
        isim: isimMetni.trim(),
        yas,
        boy,
        kilo,
        hedefKilo,
        cinsiyet,
        gunlukHedefKalori: nihaiKalori,
        makroHedefleri: kullanici.makroHedefleri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Kaydedildi', 'Profil bilgilerin güncellendi.');
    };

    if (sonuc.tur === 'uyari' && sonuc.mesaj === AGRESIF_HEDEF_UYARISI) {
      Alert.alert('Hedefin İddialı Görünüyor', AGRESIF_HEDEF_UYARISI, [
        { text: 'Hedefimi düzenle', style: 'cancel' },
        { text: 'Devam et', onPress: kaydet },
      ]);
      return;
    }

    kaydet();
  };

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <ScreenHeader baslik="Ayarlar" scrollY={scrollY} />
      <Animated.ScrollView
        style={stiller.container}
        contentContainerStyle={[
          stiller.icerik,
          { paddingTop: insets.top + SCREEN_HEADER_ICERIK_YUKSEKLIGI + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}>
      <Pressable onPress={gecmiseGit} style={stiller.gecmisButonu}>
        <View style={stiller.gecmisIkonKutusu}>
          <MaterialCommunityIcons name="history" size={20} color={ALTIN} />
        </View>
        <View style={stiller.gecmisMetinAlani}>
          <Text style={stiller.gecmisBasligi}>Geçmişi Görüntüle</Text>
          <Text style={stiller.gecmisAciklamasi}>Seri takvimin ve geçmiş günlerin</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={ALTIN_ORTA_SOLUK} />
      </Pressable>

      <Pressable onPress={premiumaGec} style={stiller.vipLoungeKarti}>
        <MaterialCommunityIcons name="crown" size={40} color={SIYAH} />
        <Text style={stiller.vipLoungeBasligi}>VIP Lounge</Text>
        <Text style={stiller.vipLoungeAciklamasi}>
          Sınırsız AI Lens ve Gelişmiş Analizler için Premium&apos;a Geç
        </Text>
      </Pressable>

      <Text style={stiller.bolumBasligi}>Kişisel Verilerim</Text>
      <View style={stiller.formKarti}>
        <AlanGirisi etiket="İsim" deger={isimMetni} onDegisti={setIsimMetni} />

        <View style={stiller.formSatiri}>
          <AlanGirisi etiket="Yaş" deger={yasMetni} onDegisti={setYasMetni} sayisal yari />
          <View style={[stiller.alan, stiller.alanYari]}>
            <Text style={stiller.alanEtiketi}>Cinsiyet</Text>
            <View style={stiller.cinsiyetSatiri}>
              <Pressable
                onPress={() => setCinsiyet('kadin')}
                style={[
                  stiller.cinsiyetSecenek,
                  cinsiyet === 'kadin' ? stiller.cinsiyetSecenekAktif : null,
                ]}>
                <Text
                  style={[
                    stiller.cinsiyetYazi,
                    cinsiyet === 'kadin' ? stiller.cinsiyetYaziAktif : null,
                  ]}>
                  Kadın
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCinsiyet('erkek')}
                style={[
                  stiller.cinsiyetSecenek,
                  cinsiyet === 'erkek' ? stiller.cinsiyetSecenekAktif : null,
                ]}>
                <Text
                  style={[
                    stiller.cinsiyetYazi,
                    cinsiyet === 'erkek' ? stiller.cinsiyetYaziAktif : null,
                  ]}>
                  Erkek
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={stiller.formSatiri}>
          <AlanGirisi etiket="Boy (cm)" deger={boyMetni} onDegisti={setBoyMetni} sayisal yari />
          <AlanGirisi etiket="Kilo (kg)" deger={kiloMetni} onDegisti={setKiloMetni} ondalik yari />
        </View>

        <AlanGirisi
          etiket="Hedef Kilo (kg)"
          deger={hedefKiloMetni}
          onDegisti={setHedefKiloMetni}
          ondalik
        />

        {hataMesaji.length > 0 ? <Text style={stiller.hataMetni}>{hataMesaji}</Text> : null}
      </View>

      <View style={stiller.kaloriKarti}>
        <Text style={stiller.kaloriEtiketi}>Hesaplanan Günlük Kalori</Text>
        <Text style={stiller.kaloriDegeri}>{nihaiKalori} kcal</Text>
        {sabitlendi ? (
          <Text style={stiller.kaloriNotu}>
            Bu değerlerle hesaplanan kalori güvenli alt sınırın altına iniyordu;{' '}
            {kaloriTabani(cinsiyet)} kcal olarak sabitlendi.
          </Text>
        ) : null}
      </View>

      <Pressable onPress={profiliKaydet} style={stiller.kaydetButonu}>
        <MaterialCommunityIcons name="content-save-outline" size={18} color={SIYAH} />
        <Text style={stiller.kaydetButonuYazisi}>Profili Kaydet</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/kilo-ekle')} style={stiller.kiloButonu}>
        <View style={stiller.gecmisIkonKutusu}>
          <MaterialCommunityIcons name="scale-bathroom" size={20} color={ALTIN} />
        </View>
        <View style={stiller.gecmisMetinAlani}>
          <Text style={stiller.gecmisBasligi}>Kilo Kaydı Ekle</Text>
          <Text style={stiller.gecmisAciklamasi}>Bugünkü kilonu gir, trendi Analiz&apos;de gör</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={ALTIN_ORTA_SOLUK} />
      </Pressable>

      <Text style={stiller.bolumBasligi}>Apple Health</Text>
      <View style={stiller.hatirlaticiKarti}>
        {saglikPlatformDestekli ? (
          <LuksToggle
            key={saglikAktif ? 'saglik-acik' : 'saglik-kapali'}
            etiket="Apple Health Bağlantısı"
            aciklama="Adım ve aktif enerjiyi oku, öğün ve suyu yaz"
            deger={saglikAktif}
            onDegisti={(acik) => {
              if (acik) {
                saglikBaslat();
              } else {
                saglikDurdur();
              }
            }}
          />
        ) : (
          <View style={stiller.saglikPasifSatiri}>
            <View style={stiller.iletisimMetinAlani}>
              <Text style={stiller.toggleEtiket}>Apple Health Bağlantısı</Text>
              <Text style={stiller.toggleAciklama}>Bu cihazda / bu derlemede kullanılamıyor</Text>
            </View>
            <MaterialCommunityIcons name="heart-off-outline" size={20} color={ALTIN_ORTA_SOLUK} />
          </View>
        )}

        {saglikPlatformDestekli ? (
          <>
            <View style={stiller.toggleAyraci} />
            <Text style={stiller.saglikDurum}>{saglikDurumMetni}</Text>
            {saglikIzni === 'reddedildi' ? (
              <Pressable
                onPress={() => Linking.openURL('x-apple-health://')}
                style={stiller.saglikLink}>
                <Text style={stiller.saglikLinkYazisi}>Sağlık uygulamasında izin ver</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>

      <Text style={stiller.bolumBasligi}>Hatırlatıcılar</Text>
      <View style={stiller.hatirlaticiKarti}>
        <LuksToggle
          etiket="Su İçme Hatırlatıcısı"
          aciklama="Günün boyunca nazikçe dürtelim"
          deger={suHatirlaticisi}
          onDegisti={setSuHatirlaticisi}
        />
        <View style={stiller.toggleAyraci} />
        <LuksToggle
          etiket="Öğün Hatırlatıcısı"
          aciklama="Bir öğün unutulmasın diye"
          deger={ogunHatirlaticisi}
          onDegisti={setOgunHatirlaticisi}
        />
      </View>

      <Text style={stiller.bolumBasligi}>Destek</Text>
      <Pressable onPress={iletisimeGec} style={stiller.iletisimSatiri}>
        <MaterialCommunityIcons name="headset" size={22} color={ALTIN} />
        <View style={stiller.iletisimMetinAlani}>
          <Text style={stiller.iletisimBasligi}>Geliştirici Ekibiyle İletişim</Text>
          <Text style={stiller.iletisimAciklamasi}>Bir fikrin veya sorunun mu var?</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={ALTIN_ORTA_SOLUK} />
      </Pressable>

      <Pressable onPress={premiumaGec} style={stiller.premiumButonu}>
        <MaterialCommunityIcons name="star-four-points" size={20} color={SIYAH} />
        <Text style={stiller.premiumButonuYazisi}>Premium&apos;a Geç</Text>
      </Pressable>
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
  bolumBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 8,
  },
  gecmisButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 28,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  kiloButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    backgroundColor: 'rgba(232,195,124,0.04)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  gecmisIkonKutusu: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: ALTIN_ORTA_SOLUK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gecmisMetinAlani: {
    flex: 1,
  },
  gecmisBasligi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  gecmisAciklamasi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    marginTop: 3,
  },
  vipLoungeKarti: {
    alignItems: 'center',
    backgroundColor: ALTIN,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 36,
    gap: 8,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  vipLoungeBasligi: {
    color: SIYAH,
    fontFamily: 'StoriesGrand',
    fontSize: 28,
    letterSpacing: 1,
    marginTop: 4,
  },
  vipLoungeAciklamasi: {
    color: SIYAH,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  formKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  alan: {
    marginBottom: 14,
  },
  alanYari: {
    flex: 1,
    marginBottom: 0,
  },
  formSatiri: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  alanEtiketi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  alanGirisi: {
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: ALTIN,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.3,
    backgroundColor: SIYAH,
  },
  cinsiyetSatiri: {
    flexDirection: 'row',
    gap: 8,
  },
  cinsiyetSecenek: {
    flex: 1,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: SIYAH,
  },
  cinsiyetSecenekAktif: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.14)',
  },
  cinsiyetYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  cinsiyetYaziAktif: {
    color: ALTIN,
  },
  hataMetni: {
    color: DANGER,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  kaloriKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    alignItems: 'center',
  },
  kaloriEtiketi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  kaloriDegeri: {
    color: ALTIN,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  kaloriNotu: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 10,
  },
  kaydetButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
    backgroundColor: ALTIN,
    marginBottom: 36,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  kaydetButonuYazisi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  hatirlaticiKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 32,
  },
  toggleSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  toggleAyraci: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ALTIN_COK_SOLUK,
  },
  saglikPasifSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  saglikDurum: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 17,
    paddingVertical: 12,
  },
  saglikLink: {
    paddingBottom: 12,
  },
  saglikLinkYazisi: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  toggleMetinAlani: {
    flex: 1,
    paddingRight: 12,
  },
  toggleEtiket: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  toggleAciklama: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    marginTop: 3,
  },
  togglePist: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    backgroundColor: SIYAH,
    justifyContent: 'center',
  },
  togglePistAktif: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.25)',
  },
  toggleTopu: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ALTIN,
  },
  iletisimSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 40,
  },
  iletisimMetinAlani: {
    flex: 1,
  },
  iletisimBasligi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  iletisimAciklamasi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    marginTop: 3,
  },
  premiumButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 29,
    backgroundColor: ALTIN,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  premiumButonuYazisi: {
    color: SIYAH,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
