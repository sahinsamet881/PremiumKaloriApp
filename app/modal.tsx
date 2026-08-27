import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ALTIN, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

type IkonAdi = 'bolt.fill' | 'star.fill' | 'magnifyingglass';

type LuksSecenekKartiProps = {
  ikon: IkonAdi;
  baslik: string;
  aciklama: string;
  onPress: () => void;
};

function LuksSecenekKarti({ ikon, baslik, aciklama, onPress }: LuksSecenekKartiProps) {
  const doluluk = useRef(new Animated.Value(0)).current;

  const basildi = () => {
    Animated.timing(doluluk, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };

  const birakildi = () => {
    Animated.timing(doluluk, { toValue: 0, duration: 320, useNativeDriver: false }).start();
  };

  const arkaPlanRengi = doluluk.interpolate({ inputRange: [0, 1], outputRange: [SIYAH, ALTIN] });
  const metinRengi = doluluk.interpolate({ inputRange: [0, 1], outputRange: [ALTIN, SIYAH] });
  const ikonSaydamlik = doluluk.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Pressable onPress={onPress} onPressIn={basildi} onPressOut={birakildi}>
      <Animated.View style={[stiller.kart, { backgroundColor: arkaPlanRengi }]}>
        <Animated.View style={{ opacity: ikonSaydamlik }}>
          <IconSymbol name={ikon} size={26} color={ALTIN} />
        </Animated.View>
        <View style={stiller.kartMetin}>
          <Animated.Text style={[stiller.kartBaslik, { color: metinRengi }]}>
            {baslik}
          </Animated.Text>
          <Animated.Text style={[stiller.kartAciklama, { color: metinRengi, opacity: 0.7 }]}>
            {aciklama}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function ModalScreen() {
  const { hizliKaloriEkle } = useVeri();
  const [gorunum, setGorunum] = useState<'liste' | 'hizliKalori'>('liste');
  const [isimMetni, setIsimMetni] = useState('');
  const [kaloriMetni, setKaloriMetni] = useState('');
  const kaloriGirisiRef = useRef<TextInput>(null);
  const ekleDoluluk = useRef(new Animated.Value(0)).current;

  const kaloriSayisi = Number(kaloriMetni);
  const gecerliMi = kaloriMetni.length > 0 && kaloriSayisi > 0;

  const kaloriEkle = () => {
    if (!gecerliMi) {
      return;
    }
    hizliKaloriEkle(kaloriSayisi, isimMetni);
    router.back();
  };

  const ekleBasildi = () => {
    if (!gecerliMi) {
      return;
    }
    Animated.timing(ekleDoluluk, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const ekleBirakildi = () => {
    Animated.timing(ekleDoluluk, { toValue: 0, duration: 280, useNativeDriver: false }).start();
  };

  const ekleArkaPlani = ekleDoluluk.interpolate({ inputRange: [0, 1], outputRange: [SIYAH, ALTIN] });
  const ekleMetinRengi = ekleDoluluk.interpolate({ inputRange: [0, 1], outputRange: [ALTIN, SIYAH] });

  if (gorunum === 'hizliKalori') {
    return (
      <KeyboardAvoidingView
        style={stiller.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={stiller.container}>
            <StatusBar style="light" />
            <Pressable onPress={() => setGorunum('liste')} style={stiller.geriButonu}>
              <IconSymbol name="chevron.left" size={16} color={ALTIN} />
              <Text style={stiller.geriMetni}>Geri</Text>
            </Pressable>

            <View style={stiller.girisAlani}>
              <TextInput
                autoFocus
                value={isimMetni}
                onChangeText={setIsimMetni}
                keyboardType="default"
                returnKeyType="next"
                onSubmitEditing={() => kaloriGirisiRef.current?.focus()}
                blurOnSubmit={false}
                placeholder="Örn: Yulaf Ezmesi"
                placeholderTextColor={ALTIN_SOLUK}
                selectionColor={ALTIN}
                style={stiller.isimGirisi}
              />
              <TextInput
                ref={kaloriGirisiRef}
                value={kaloriMetni}
                onChangeText={(metin) => setKaloriMetni(metin.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={kaloriEkle}
                placeholder="0"
                placeholderTextColor={ALTIN_SOLUK}
                selectionColor={ALTIN}
                style={stiller.kaloriGirisi}
              />
              <Text style={stiller.kaloriEtiketi}>kcal</Text>
            </View>

            <Pressable onPress={kaloriEkle} onPressIn={ekleBasildi} onPressOut={ekleBirakildi}>
              <Animated.View
                style={[
                  stiller.ekleButonu,
                  { backgroundColor: ekleArkaPlani, opacity: gecerliMi ? 1 : 0.35 },
                ]}>
                <Animated.Text style={[stiller.ekleButonuMetni, { color: ekleMetinRengi }]}>
                  Ekle
                </Animated.Text>
              </Animated.View>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <Text style={stiller.baslik}>Ekle</Text>
      <View style={stiller.liste}>
        <LuksSecenekKarti
          ikon="bolt.fill"
          baslik="Hızlı Kalori"
          aciklama="Sadece bir sayı gir, geç"
          onPress={() => setGorunum('hizliKalori')}
        />
        <LuksSecenekKarti
          ikon="star.fill"
          baslik="Hazır Butonlar"
          aciklama="Sık kullandığın besinlerden seç"
          onPress={() => router.back()}
        />
        <LuksSecenekKarti
          ikon="magnifyingglass"
          baslik="Yemek Ara"
          aciklama="İsimle ara ve ekle"
          onPress={() => router.push('/search')}
        />
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
    padding: 24,
  },
  baslik: {
    color: ALTIN,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 28,
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
    borderWidth: 1,
    borderColor: ALTIN,
  },
  kartMetin: {
    flex: 1,
  },
  kartBaslik: {
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 0.8,
  },
  kartAciklama: {
    fontSize: 13,
    fontWeight: '300',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  geriButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  geriMetni: {
    color: ALTIN,
    fontSize: 17,
    fontWeight: '300',
  },
  girisAlani: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isimGirisi: {
    color: ALTIN,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  kaloriGirisi: {
    color: ALTIN,
    fontSize: 96,
    fontWeight: '300',
    letterSpacing: -1,
    textAlign: 'center',
    minWidth: 160,
  },
  kaloriEtiketi: {
    color: ALTIN_SOLUK,
    fontSize: 17,
    fontWeight: '300',
    marginTop: 4,
    letterSpacing: 1,
  },
  ekleButonu: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ekleButonuMetni: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 1,
  },
});
