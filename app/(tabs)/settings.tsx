import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

type ProfilKartiProps = {
  etiket: string;
  deger: string;
  genis?: boolean;
  vurgulu?: boolean;
};

function ProfilKarti({ etiket, deger, genis, vurgulu }: ProfilKartiProps) {
  return (
    <View style={[stiller.profilKarti, genis ? stiller.profilKartiGenis : stiller.profilKartiYari]}>
      <Text style={stiller.profilKartiEtiket}>{etiket}</Text>
      <Text style={[stiller.profilKartiDeger, vurgulu ? stiller.profilKartiDegerVurgulu : null]}>
        {deger}
      </Text>
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
  const { kullanici } = useVeri();
  const [suHatirlaticisi, setSuHatirlaticisi] = useState(true);
  const [ogunHatirlaticisi, setOgunHatirlaticisi] = useState(true);

  const isim = kullanici.isim.trim().length > 0 ? kullanici.isim.trim() : '—';

  const iletisimeGec = () => {
    Alert.alert('Geliştirici Ekibi', 'Mesajın bize ulaştı sayılır, çok yakında buradayız!');
  };

  const premiumaGec = () => {
    Alert.alert('Çok Yakında', 'Premium deneyim kapıda, sabırsızlanıyoruz!');
  };

  const gecmiseGit = () => {
    router.push('/(tabs)/history');
  };

  return (
    <ScrollView style={stiller.container} contentContainerStyle={stiller.icerik}>
      <StatusBar style="light" />
      <View style={stiller.ustBaslikSatiri}>
        <MaterialCommunityIcons name="crown-outline" size={26} color={ALTIN} />
        <Text style={stiller.baslik}>VIP Profil</Text>
      </View>

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
      <View style={stiller.profilIzgarasi}>
        <ProfilKarti etiket="İsim" deger={isim} genis />
        <ProfilKarti etiket="Yaş" deger={`${kullanici.yas}`} />
        <ProfilKarti etiket="Boy" deger={`${kullanici.boy} cm`} />
        <ProfilKarti etiket="Kilo" deger={`${kullanici.kilo} kg`} />
        <ProfilKarti etiket="Hedef Kilo" deger={`${kullanici.hedefKilo} kg`} />
        <ProfilKarti
          etiket="Günlük Kalori İhtiyacı"
          deger={`${kullanici.gunlukHedefKalori} kcal`}
          genis
          vurgulu
        />
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
    </ScrollView>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  ustBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 30,
    letterSpacing: 1,
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
  profilIzgarasi: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  profilKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(10,11,16,0.6)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  profilKartiGenis: {
    width: '100%',
  },
  profilKartiYari: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  profilKartiEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  profilKartiDeger: {
    color: ALTIN,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  profilKartiDegerVurgulu: {
    fontSize: 26,
  },
  hatirlaticiKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(10,11,16,0.6)',
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
    backgroundColor: 'rgba(10,11,16,0.6)',
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
