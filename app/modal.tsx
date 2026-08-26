import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useVeri } from '@/context/DataContext';
import { useAksanRenk } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

type HizliEkleSecenegi = {
  id: 'hizliKalori' | 'hazirButonlar' | 'yemekAra';
  baslik: string;
  aciklama: string;
  ikon: 'bolt.fill' | 'star.fill' | 'magnifyingglass';
  onSec: () => void;
};

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { aksanRengi } = useAksanRenk();
  const { hizliKaloriEkle } = useVeri();
  const [gorunum, setGorunum] = useState<'liste' | 'hizliKalori'>('liste');
  const [isimMetni, setIsimMetni] = useState('');
  const [kaloriMetni, setKaloriMetni] = useState('');
  const kaloriGirisiRef = useRef<TextInput>(null);

  const kaloriSayisi = Number(kaloriMetni);
  const gecerliMi = kaloriMetni.length > 0 && kaloriSayisi > 0;

  const SECENEKLER: HizliEkleSecenegi[] = [
    {
      id: 'hizliKalori',
      baslik: 'Hızlı Kalori',
      aciklama: 'Sadece bir sayı gir, geç',
      ikon: 'bolt.fill',
      onSec: () => setGorunum('hizliKalori'),
    },
    {
      id: 'hazirButonlar',
      baslik: 'Hazır Butonlar',
      aciklama: 'Sık kullandığın besinlerden seç',
      ikon: 'star.fill',
      onSec: () => router.back(),
    },
    {
      id: 'yemekAra',
      baslik: 'Yemek Ara',
      aciklama: 'İsimle ara ve ekle',
      ikon: 'magnifyingglass',
      onSec: () => router.push('/search'),
    },
  ];

  const kaloriEkle = () => {
    if (!gecerliMi) {
      return;
    }
    hizliKaloriEkle(kaloriSayisi, isimMetni);
    router.back();
  };

  if (gorunum === 'hizliKalori') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ThemedView style={styles.container}>
            <Pressable onPress={() => setGorunum('liste')} style={styles.geriButonu}>
              <IconSymbol name="chevron.left" size={16} color={palette.icon} />
              <ThemedText style={[styles.geriMetni, { color: palette.icon }]}>Geri</ThemedText>
            </Pressable>

            <View style={styles.girisAlani}>
              <TextInput
                autoFocus
                value={isimMetni}
                onChangeText={setIsimMetni}
                keyboardType="default"
                returnKeyType="next"
                onSubmitEditing={() => kaloriGirisiRef.current?.focus()}
                blurOnSubmit={false}
                placeholder="Örn: Yulaf Ezmesi"
                placeholderTextColor={palette.icon}
                style={[styles.isimGirisi, { color: palette.text }]}
              />
              <TextInput
                ref={kaloriGirisiRef}
                value={kaloriMetni}
                onChangeText={(metin) => setKaloriMetni(metin.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={kaloriEkle}
                placeholder="0"
                placeholderTextColor={palette.icon}
                style={[styles.kaloriGirisi, { color: palette.text }]}
              />
              <ThemedText style={[styles.kaloriEtiketi, { color: palette.icon }]}>kcal</ThemedText>
            </View>

            <Pressable
              onPress={kaloriEkle}
              disabled={!gecerliMi}
              style={({ pressed }) => [
                styles.ekleButonu,
                { backgroundColor: aksanRengi, opacity: !gecerliMi ? 0.4 : pressed ? 0.85 : 1 },
              ]}>
              <ThemedText style={styles.ekleButonuMetni}>Ekle</ThemedText>
            </Pressable>
          </ThemedView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.baslik}>
        Ekle
      </ThemedText>
      <View style={styles.liste}>
        {SECENEKLER.map((secenek) => (
          <Pressable
            key={secenek.id}
            onPress={secenek.onSec}
            style={({ pressed }) => [
              styles.kart,
              { borderColor: palette.icon },
              pressed && styles.kartBasili,
            ]}>
            <IconSymbol name={secenek.ikon} size={26} color={aksanRengi} />
            <View style={styles.kartMetin}>
              <ThemedText style={styles.kartBaslik}>{secenek.baslik}</ThemedText>
              <ThemedText style={[styles.kartAciklama, { color: palette.icon }]}>
                {secenek.aciklama}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  baslik: {
    marginTop: 12,
    marginBottom: 24,
  },
  liste: {
    gap: 12,
  },
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kartBasili: {
    opacity: 0.5,
  },
  kartMetin: {
    flex: 1,
  },
  kartBaslik: {
    fontSize: 17,
    fontWeight: '600',
  },
  kartAciklama: {
    fontSize: 13,
    marginTop: 2,
  },
  geriButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  geriMetni: {
    fontSize: 17,
  },
  girisAlani: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isimGirisi: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  kaloriGirisi: {
    fontSize: 96,
    fontWeight: '700',
    letterSpacing: -2,
    textAlign: 'center',
    minWidth: 160,
  },
  kaloriEtiketi: {
    fontSize: 17,
    marginTop: 4,
  },
  ekleButonu: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ekleButonuMetni: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
