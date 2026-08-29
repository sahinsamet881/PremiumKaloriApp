import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_SOLUK } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

const KOZMIK_SIYAH = '#0A0A0A';

export default function AuthScreen() {
  const { girisYap } = useVeri();

  const devamEt = () => {
    girisYap();
    router.replace('/(tabs)');
  };

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.guvenliAlan}>
        <View style={stiller.ustAlan}>
          <View style={stiller.rozet}>
            <MaterialCommunityIcons name="crown-outline" size={30} color={ALTIN} />
          </View>
          <Text style={stiller.baslik}>Vücudunu{'\n'}Şekillendirmeye Başla</Text>
          <Text style={stiller.aciklama}>
            Verilerini bulutta güvenle saklamak ve AI Koç ile sınırları aşmak için hesap oluştur.
          </Text>
        </View>

        <View style={stiller.altAlan}>
          <Pressable
            onPress={devamEt}
            style={({ pressed }) => [
              stiller.buton,
              stiller.appleButonu,
              pressed ? stiller.butonBasili : null,
            ]}>
            <MaterialCommunityIcons name="apple" size={22} color={KOZMIK_SIYAH} />
            <Text style={stiller.appleButonuYazisi}>Apple ile Devam Et</Text>
          </Pressable>

          <Pressable
            onPress={devamEt}
            style={({ pressed }) => [
              stiller.buton,
              stiller.epostaButonu,
              pressed ? stiller.butonBasili : null,
            ]}>
            <MaterialCommunityIcons name="email-outline" size={22} color={ALTIN} />
            <Text style={stiller.epostaButonuYazisi}>E-posta ile Devam Et</Text>
          </Pressable>

          <Text style={stiller.kucukNot}>
            Devam ederek Kullanım Koşulları ve Gizlilik Politikası&apos;nı kabul etmiş olursun.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const stiller = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: KOZMIK_SIYAH,
  },
  guvenliAlan: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  ustAlan: {
    marginTop: 48,
    gap: 20,
  },
  rozet: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,195,124,0.06)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 0.5,
  },
  aciklama: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  altAlan: {
    gap: 14,
  },
  buton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 28,
  },
  butonBasili: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  appleButonu: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  appleButonuYazisi: {
    color: KOZMIK_SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  epostaButonu: {
    backgroundColor: KOZMIK_SIYAH,
    borderWidth: 1,
    borderColor: ALTIN,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  epostaButonuYazisi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  kucukNot: {
    color: ALTIN_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
});
