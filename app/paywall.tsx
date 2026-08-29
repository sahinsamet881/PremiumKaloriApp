import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import {
  GIZLILIK_URL,
  KULLANIM_SARTLARI_URL,
  OTOMATIK_YENILEME_METNI,
  PREMIUM_URUN,
} from '@/store/magaza';

const AVANTAJLAR: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  aciklama: string;
}[] = [
  {
    ikon: 'camera-iris',
    baslik: 'Fotoğrafla yemek tanıma',
    aciklama: 'Tabağının fotoğrafını çek, kalori ve makroları anında gelsin.',
  },
  {
    ikon: 'robot-happy-outline',
    baslik: 'Verilerini gören kişisel AI koç',
    aciklama: 'Yaşını, hedefini ve günün öğünlerini bilen, sana özel öneriler veren koç.',
  },
  {
    ikon: 'infinity',
    baslik: 'Sınırsız geçmiş ve dışa aktarma',
    aciklama: 'Tüm kayıtların sınırsız saklanır; istediğinde dışa aktar.',
  },
];

export default function PaywallScreen() {
  const { akis } = useLocalSearchParams<{ akis?: string }>();
  const { premiumAktif, premiumMagazaHazir, premiumSatinAl, premiumGeriYukle } = useVeri();
  const [islemde, setIslemde] = useState(false);

  const onboardingAkisi = akis === 'onboarding';

  const kapat = () => {
    if (onboardingAkisi) {
      router.replace('/auth');
    } else {
      router.back();
    }
  };

  const satinAl = async () => {
    if (islemde) {
      return;
    }
    setIslemde(true);
    try {
      const sonuc = await premiumSatinAl();
      if (sonuc === 'basarili') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Deneme Başladı',
          `${PREMIUM_URUN.denemeGunu} günlük ücretsiz deneme aktif. Bitiminden bir gün önce sana hatırlatacağız; iptal etmezsen ${PREMIUM_URUN.fiyatMetni} tahsil edilir.`,
          [{ text: 'Anladım', onPress: kapat }]
        );
      } else if (sonuc === 'iptal') {
        // kullanıcı vazgeçti, sessiz geç
      } else if (sonuc === 'beklemede') {
        Alert.alert('Onay Bekleniyor', 'Satın alman onay bekliyor. Onaylanınca premium açılacak.');
      } else {
        Alert.alert('Satın Alma Başarısız', 'İşlem tamamlanamadı. Lütfen tekrar dene.');
      }
    } finally {
      setIslemde(false);
    }
  };

  const geriYukle = async () => {
    if (islemde) {
      return;
    }
    setIslemde(true);
    try {
      const bulundu = await premiumGeriYukle();
      if (bulundu) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Geri Yüklendi', 'Aktif aboneliğin bulundu ve premium açıldı.', [
          { text: 'Tamam', onPress: kapat },
        ]);
      } else {
        Alert.alert('Abonelik Bulunamadı', 'Bu Apple Kimliğinde aktif bir abonelik bulunamadı.');
      }
    } finally {
      setIslemde(false);
    }
  };

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.kok} edges={['top', 'bottom']}>
        <View style={stiller.ustBar}>
          <View style={stiller.denge} />
          <Text style={stiller.baslik}>Premium</Text>
          <Pressable onPress={kapat} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={22} color={ALTIN_ORTA_SOLUK} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={stiller.icerik}
          showsVerticalScrollIndicator={false}>
          <View style={stiller.rozet}>
            <MaterialCommunityIcons name="crown" size={34} color={SIYAH} />
          </View>
          <Text style={stiller.slogan}>MinimalistKalori&apos;nin{'\n'}tam gücünü aç</Text>

          <View style={stiller.avantajListesi}>
            {AVANTAJLAR.map((avantaj, sira) => (
              <View key={avantaj.baslik} style={stiller.avantajSatiri}>
                <View style={stiller.avantajNumara}>
                  <Text style={stiller.avantajNumaraYazi}>{sira + 1}</Text>
                </View>
                <View style={stiller.avantajMetin}>
                  <View style={stiller.avantajBaslikSatiri}>
                    <MaterialCommunityIcons name={avantaj.ikon} size={16} color={ALTIN} />
                    <Text style={stiller.avantajBaslik}>{avantaj.baslik}</Text>
                  </View>
                  <Text style={stiller.avantajAciklama}>{avantaj.aciklama}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={stiller.fiyatKarti}>
            <View style={stiller.fiyatUst}>
              <Text style={stiller.fiyatDonem}>{PREMIUM_URUN.donem}</Text>
              <Text style={stiller.fiyatDeger}>{PREMIUM_URUN.fiyatMetni}</Text>
            </View>
            <Text style={stiller.fiyatAlt}>
              {PREMIUM_URUN.aylikYaklasik} · İlk {PREMIUM_URUN.denemeGunu} gün ücretsiz
            </Text>
            <Text style={stiller.fiyatUyari}>
              {PREMIUM_URUN.denemeGunu} günlük deneme sonunda iptal etmezsen {PREMIUM_URUN.fiyatMetni}{' '}
              otomatik tahsil edilir. Deneme bitmeden bir gün önce hatırlatırız.
            </Text>
          </View>

          {premiumAktif ? (
            <View style={stiller.aktifKutu}>
              <MaterialCommunityIcons name="check-decagram" size={18} color={ALTIN} />
              <Text style={stiller.aktifYazi}>Premium şu an aktif.</Text>
            </View>
          ) : (
            <Pressable
              onPress={satinAl}
              disabled={islemde || !premiumMagazaHazir}
              style={[
                stiller.anaButon,
                islemde || !premiumMagazaHazir ? stiller.anaButonPasif : null,
              ]}>
              <Text style={stiller.anaButonYazisi}>
                {islemde ? 'İşleniyor...' : `${PREMIUM_URUN.denemeGunu} Gün Ücretsiz Dene`}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={geriYukle} disabled={islemde} style={stiller.geriYukleButonu}>
            <Text style={stiller.geriYukleYazisi}>Satın Alımları Geri Yükle</Text>
          </Pressable>

          {!premiumAktif ? (
            <Pressable onPress={kapat} hitSlop={8} style={stiller.simdiDegilButonu}>
              <Text style={stiller.simdiDegilYazisi}>
                {onboardingAkisi ? 'Şimdi değil, ücretsiz devam et' : 'Şimdi değil'}
              </Text>
            </Pressable>
          ) : null}

          {!premiumMagazaHazir ? (
            <Text style={stiller.uyariMetni}>
              Satın alma bu derlemede kullanılamıyor. Mağaza bağlantısı için yayın derlemesi gerekir.
            </Text>
          ) : null}

          <Text style={stiller.yenilemeMetni}>{OTOMATIK_YENILEME_METNI}</Text>

          <View style={stiller.linkSatiri}>
            <Pressable onPress={() => Linking.openURL(KULLANIM_SARTLARI_URL)}>
              <Text style={stiller.linkYazi}>Kullanım Şartları</Text>
            </Pressable>
            <Text style={stiller.linkAyrac}>·</Text>
            <Pressable onPress={() => Linking.openURL(GIZLILIK_URL)}>
              <Text style={stiller.linkYazi}>Gizlilik Politikası</Text>
            </Pressable>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  denge: {
    width: 22,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 20,
  },
  rozet: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  slogan: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 26,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 34,
  },
  avantajListesi: {
    alignSelf: 'stretch',
    gap: 16,
    marginTop: 4,
  },
  avantajSatiri: {
    flexDirection: 'row',
    gap: 14,
  },
  avantajNumara: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avantajNumaraYazi: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '500',
  },
  avantajMetin: {
    flex: 1,
    gap: 4,
  },
  avantajBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avantajBaslik: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  avantajAciklama: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 18,
  },
  fiyatKarti: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  fiyatUst: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  fiyatDonem: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fiyatDeger: {
    color: ALTIN,
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  fiyatAlt: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  fiyatUyari: {
    color: ALTIN_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 16,
    marginTop: 6,
  },
  anaButon: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 28,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  anaButonPasif: {
    opacity: 0.4,
  },
  anaButonYazisi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  aktifKutu: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ALTIN,
  },
  aktifYazi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
  },
  geriYukleButonu: {
    paddingVertical: 4,
  },
  geriYukleYazisi: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  simdiDegilButonu: {
    paddingVertical: 2,
  },
  simdiDegilYazisi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  uyariMetni: {
    color: ALTIN_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 17,
  },
  yenilemeMetni: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 16,
    textAlign: 'center',
  },
  linkSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textDecorationLine: 'underline',
  },
  linkAyrac: {
    color: ALTIN_COK_SOLUK,
    fontSize: 12,
  },
});
