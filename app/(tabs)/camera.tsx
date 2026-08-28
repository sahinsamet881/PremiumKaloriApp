import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ANALIZ_YAYI = { damping: 15, stiffness: 220, mass: 0.6 };

const GEMINI_API_KEY = 'AIzaSyBktaJESDFNwiuVPF78jn1r5rjYtH26-mY';

type AnalizSonucu = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
};

type MakroRozetiProps = {
  etiket: string;
  deger: number;
};

function MakroRozeti({ etiket, deger }: MakroRozetiProps) {
  return (
    <View style={stiller.rozet}>
      <Text style={stiller.rozetDeger}>{`${deger}g`}</Text>
      <Text style={stiller.rozetEtiket}>{etiket}</Text>
    </View>
  );
}

export default function CameraScreen() {
  const { hizliKaloriEkle } = useVeri();
  const [izin, izinIste] = useCameraPermissions();
  const kameraRef = useRef<CameraView>(null);
  const [cekilenFoto, setCekilenFoto] = useState<CameraCapturedPicture | null>(null);
  const [analizEdiliyor, setAnalizEdiliyor] = useState(false);
  const [sonuc, setSonuc] = useState<AnalizSonucu | null>(null);
  const analizBasim = useSharedValue(0);

  const analizButonStili = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - analizBasim.value * 0.05 }],
    shadowOpacity: 0.4 + analizBasim.value * 0.5,
    shadowRadius: 12 + analizBasim.value * 16,
  }));

  const fotografCek = async () => {
    const foto = await kameraRef.current?.takePictureAsync({ quality: 0.2, base64: true });
    if (foto) {
      setCekilenFoto(foto);
    }
  };

  const yenidenCek = () => {
    setCekilenFoto(null);
    setSonuc(null);
  };

  const yapayZekaIleAnalizEt = async () => {
    if (!cekilenFoto?.base64 || analizEdiliyor) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalizEdiliyor(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Fotoğraftaki yemeği tespit et ve YALNIZCA şu JSON formatında yanıt ver (başka hiçbir yazı yazma): {"name": "Yemek Adı", "calories": 450, "protein": 30, "carbs": 45, "fat": 15, "portion": "1 Porsiyon"}',
                  },
                  { inlineData: { mimeType: 'image/jpeg', data: cekilenFoto.base64 } },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error('API Hatası: ' + errorBody);
      }

      const data = await response.json();
      let aiMetni = data.candidates[0].content.parts[0].text;
      aiMetni = aiMetni.replace(/```json/g, '').replace(/```/g, '').trim();
      const analizSonucu = JSON.parse(aiMetni);

      setSonuc({
        name: String(analizSonucu.name ?? '').trim() || 'Bilinmeyen Yemek',
        calories: Math.max(0, Math.round(Number(analizSonucu.calories) || 0)),
        protein: Math.max(0, Math.round(Number(analizSonucu.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(analizSonucu.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(analizSonucu.fat) || 0)),
        portion: String(analizSonucu.portion ?? '').trim() || '1 Porsiyon',
      });
    } catch (error: any) {
      console.error('Gemini Hatası:', error);
      Alert.alert('Sistem Hatası', error?.message || 'Bilinmeyen bir hata oluştu');
    } finally {
      setAnalizEdiliyor(false);
    }
  };

  const ogunlerimeEkle = () => {
    if (!sonuc) {
      return;
    }

    hizliKaloriEkle(sonuc.calories, sonuc.name, {
      protein: sonuc.protein,
      karbonhidrat: sonuc.carbs,
      yag: sonuc.fat,
      porsiyon: sonuc.portion,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSonuc(null);
    setCekilenFoto(null);
    router.replace('/');
  };

  if (!izin) {
    return <View style={stiller.container} />;
  }

  if (!izin.granted) {
    return (
      <View style={[stiller.container, stiller.izinKok]}>
        <StatusBar style="light" />
        <MaterialCommunityIcons name="camera-iris" size={64} color={ALTIN} />
        <Text style={stiller.izinBasligi}>Tabağını Yapay Zekaya{'\n'}Göstermeye Hazır mısın?</Text>
        <Text style={stiller.izinAciklamasi}>
          Bunun için kameranı kullanmamıza izin vermen yeterli. Söz, sadece tabağına bakacağız.
        </Text>
        <Pressable onPress={izinIste} style={stiller.izinButonu}>
          <Text style={stiller.izinButonuYazisi}>Kamera İzni Ver</Text>
        </Pressable>
      </View>
    );
  }

  if (cekilenFoto) {
    return (
      <View style={stiller.container}>
        <StatusBar style="light" />
        <Image source={{ uri: cekilenFoto.uri }} style={stiller.onizlemeGorseli} />

        <SafeAreaView style={stiller.onizlemeButonAlani} edges={['bottom']}>
          <Pressable
            onPress={yenidenCek}
            disabled={analizEdiliyor}
            style={({ pressed }) => [
              stiller.onizlemeButonu,
              stiller.yenidenCekButonu,
              pressed ? stiller.onizlemeButonuBasili : null,
              analizEdiliyor ? stiller.onizlemeButonuPasif : null,
            ]}>
            <Text style={stiller.yenidenCekYazisi}>Yeniden Çek</Text>
          </Pressable>
          <AnimatedPressable
            onPress={yapayZekaIleAnalizEt}
            disabled={analizEdiliyor}
            onPressIn={() => {
              analizBasim.value = withSpring(1, ANALIZ_YAYI);
            }}
            onPressOut={() => {
              analizBasim.value = withSpring(0, ANALIZ_YAYI);
            }}
            style={[stiller.onizlemeButonu, stiller.analizButonu, analizButonStili]}>
            <Text style={stiller.analizYazisi}>Yapay Zeka ile Analiz Et</Text>
          </AnimatedPressable>
        </SafeAreaView>

        {analizEdiliyor ? (
          <View style={stiller.analizKatmani}>
            <ActivityIndicator size="large" color={ALTIN} />
            <Text style={stiller.analizKatmaniYazisi}>Şef analiz ediyor...</Text>
          </View>
        ) : null}

        <Modal
          visible={sonuc !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSonuc(null)}>
          <View style={stiller.modalArkaPlan}>
            <View style={stiller.sonucKarti}>
              <Text style={stiller.sonucEtiketi}>YAPAY ZEKA ANALİZİ</Text>
              <Text style={stiller.sonucIsim}>{sonuc?.name}</Text>
              <Text style={stiller.sonucPorsiyon}>{sonuc?.portion}</Text>

              <View style={stiller.kaloriAlani}>
                <Text style={stiller.kaloriDeger}>{sonuc?.calories}</Text>
                <Text style={stiller.kaloriBirim}>kcal</Text>
              </View>

              <View style={stiller.rozetSatiri}>
                <MakroRozeti etiket="Protein" deger={sonuc?.protein ?? 0} />
                <MakroRozeti etiket="Karb" deger={sonuc?.carbs ?? 0} />
                <MakroRozeti etiket="Yağ" deger={sonuc?.fat ?? 0} />
              </View>

              <View style={stiller.modalButonSatiri}>
                <Pressable
                  onPress={() => setSonuc(null)}
                  style={({ pressed }) => [
                    stiller.modalButon,
                    stiller.vazgecButonu,
                    pressed ? stiller.onizlemeButonuBasili : null,
                  ]}>
                  <Text style={stiller.vazgecYazisi}>Vazgeç</Text>
                </Pressable>
                <Pressable
                  onPress={ogunlerimeEkle}
                  style={({ pressed }) => [
                    stiller.modalButon,
                    stiller.ekleButonu,
                    pressed ? stiller.onizlemeButonuBasili : null,
                  ]}>
                  <Text style={stiller.ekleYazisi}>Öğünlerime Ekle</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <CameraView ref={kameraRef} style={StyleSheet.absoluteFillObject} facing="back" />

      <SafeAreaView style={stiller.ustKatman} pointerEvents="box-none">
        <Text style={stiller.ustYazi}>Tabağının fotoğrafını çek</Text>

        <View style={stiller.aiHakkiRozeti} pointerEvents="none">
          <Text style={stiller.aiHakkiRozetiYazisi}>✨ Günlük AI Hakkı: 3/3</Text>
        </View>

        <View style={stiller.vizorAlani} pointerEvents="none">
          <View style={[stiller.kose, stiller.koseSolUst]} />
          <View style={[stiller.kose, stiller.koseSagUst]} />
          <View style={[stiller.kose, stiller.koseSolAlt]} />
          <View style={[stiller.kose, stiller.koseSagAlt]} />
        </View>

        <View style={stiller.altAlan}>
          <Pressable
            onPress={fotografCek}
            style={({ pressed }) => [
              stiller.cekimButonu,
              pressed ? stiller.cekimButonuBasili : null,
            ]}>
            <MaterialCommunityIcons name="camera-iris" size={36} color={SIYAH} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  izinKok: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 18,
  },
  izinBasligi: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 26,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  izinAciklamasi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 20,
  },
  izinButonu: {
    marginTop: 10,
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  izinButonuYazisi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ustKatman: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  ustYazi: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 24,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  aiHakkiRozeti: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.16)',
  },
  aiHakkiRozetiYazisi: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  vizorAlani: {
    width: '78%',
    aspectRatio: 1,
    alignSelf: 'center',
    marginTop: 28,
    position: 'relative',
  },
  kose: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: ALTIN,
  },
  koseSolUst: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 14,
  },
  koseSagUst: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 14,
  },
  koseSolAlt: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 14,
  },
  koseSagAlt: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 14,
  },
  altAlan: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cekimButonu: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: SIYAH,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  cekimButonuBasili: {
    opacity: 0.85,
  },
  onizlemeGorseli: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  onizlemeButonAlani: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  onizlemeButonu: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onizlemeButonuBasili: {
    opacity: 0.85,
  },
  onizlemeButonuPasif: {
    opacity: 0.4,
  },
  yenidenCekButonu: {
    backgroundColor: SIYAH,
    borderWidth: 1,
    borderColor: ALTIN,
  },
  yenidenCekYazisi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  analizButonu: {
    backgroundColor: ALTIN,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  analizYazisi: {
    color: SIYAH,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  analizKatmani: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: 'rgba(10,11,16,0.82)',
  },
  analizKatmaniYazisi: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  modalArkaPlan: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  sonucKarti: {
    width: '100%',
    backgroundColor: SIYAH,
    borderWidth: 1,
    borderColor: ALTIN,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  sonucEtiketi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
  },
  sonucIsim: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 28,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 12,
  },
  sonucPorsiyon: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
    marginTop: 6,
  },
  kaloriAlani: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 18,
  },
  kaloriDeger: {
    color: ALTIN,
    fontSize: 46,
    fontWeight: '300',
    letterSpacing: -1,
  },
  kaloriBirim: {
    color: ALTIN_SOLUK,
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 10,
  },
  rozetSatiri: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  rozet: {
    flex: 1,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(232,195,124,0.06)',
  },
  rozetDeger: {
    color: ALTIN,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  rozetEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  modalButonSatiri: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignSelf: 'stretch',
  },
  modalButon: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazgecButonu: {
    backgroundColor: SIYAH,
    borderWidth: 1,
    borderColor: ALTIN,
  },
  vazgecYazisi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  ekleButonu: {
    backgroundColor: ALTIN,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  ekleYazisi: {
    color: SIYAH,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
