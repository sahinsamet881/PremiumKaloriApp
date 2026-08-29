import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

export default function KiloEkleScreen() {
  const { kullanici, kiloKayitlari, kiloEkle } = useVeri();

  const sonKilo = kiloKayitlari.length > 0 ? kiloKayitlari[kiloKayitlari.length - 1].kilo : kullanici.kilo;
  const [kiloMetni, setKiloMetni] = useState(sonKilo > 0 ? String(sonKilo) : '');
  const [notMetni, setNotMetni] = useState('');

  const kilo = Number(kiloMetni.replace(',', '.'));
  const gecerli = Number.isFinite(kilo) && kilo >= 25 && kilo <= 400;

  const kaydet = () => {
    if (!gecerli) {
      return;
    }
    kiloEkle(kilo, notMetni);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.kok} edges={['top', 'bottom']}>
        <View style={stiller.ustBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={stiller.geriYazisi}>‹ Geri</Text>
          </Pressable>
          <Text style={stiller.baslik}>Kilo Kaydı</Text>
          <View style={stiller.denge} />
        </View>

        <KeyboardAvoidingView
          style={stiller.icerik}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={stiller.girisAlani}>
            <TextInput
              autoFocus
              value={kiloMetni}
              onChangeText={(t) => setKiloMetni(t.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={ALTIN_SOLUK}
              selectionColor={ALTIN}
              style={stiller.kiloGirisi}
            />
            <Text style={stiller.birim}>kg</Text>
          </View>

          <TextInput
            value={notMetni}
            onChangeText={setNotMetni}
            placeholder="Not (opsiyonel)"
            placeholderTextColor={ALTIN_SOLUK}
            selectionColor={ALTIN}
            style={stiller.notGirisi}
          />

          <Text style={stiller.ipucu}>
            Bugün için tek kayıt tutulur; tekrar girersen günün değeri güncellenir.
          </Text>
        </KeyboardAvoidingView>

        <Pressable
          onPress={kaydet}
          style={[stiller.kaydetButonu, gecerli ? null : stiller.kaydetButonuPasif]}>
          <MaterialCommunityIcons name="check" size={18} color={SIYAH} />
          <Text style={stiller.kaydetButonuYazisi}>Kaydet</Text>
        </Pressable>
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
  geriYazisi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '300',
  },
  denge: {
    width: 44,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  icerik: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 20,
  },
  girisAlani: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  kiloGirisi: {
    color: ALTIN,
    fontSize: 72,
    fontWeight: '300',
    letterSpacing: -1,
    textAlign: 'center',
    minWidth: 140,
  },
  birim: {
    color: ALTIN_SOLUK,
    fontSize: 18,
    fontWeight: '300',
    marginBottom: 14,
    letterSpacing: 1,
  },
  notGirisi: {
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: ALTIN,
    fontSize: 15,
    fontWeight: '300',
  },
  ipucu: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 17,
    textAlign: 'center',
  },
  kaydetButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    height: 56,
    borderRadius: 28,
    backgroundColor: ALTIN,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  kaydetButonuPasif: {
    opacity: 0.35,
  },
  kaydetButonuYazisi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
