import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_ORTA_SOLUK, SIYAH } from '@/constants/luxTheme';

export default function CameraScreen() {
  const [izin, izinIste] = useCameraPermissions();
  const kameraRef = useRef<CameraView>(null);
  const [cekilenFoto, setCekilenFoto] = useState<CameraCapturedPicture | null>(null);

  const fotografCek = async () => {
    const foto = await kameraRef.current?.takePictureAsync();
    if (foto) {
      setCekilenFoto(foto);
    }
  };

  const yenidenCek = () => {
    setCekilenFoto(null);
  };

  const yapayZekaIleAnalizEt = () => {
    Alert.alert('Yapay Zeka Motoru Isınıyor...', 'Tabağını analiz etmeyi çok istiyor, az kaldı!');
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
            style={({ pressed }) => [
              stiller.onizlemeButonu,
              stiller.yenidenCekButonu,
              pressed ? stiller.onizlemeButonuBasili : null,
            ]}>
            <Text style={stiller.yenidenCekYazisi}>Yeniden Çek</Text>
          </Pressable>
          <Pressable
            onPress={yapayZekaIleAnalizEt}
            style={({ pressed }) => [
              stiller.onizlemeButonu,
              stiller.analizButonu,
              pressed ? stiller.onizlemeButonuBasili : null,
            ]}>
            <Text style={stiller.analizYazisi}>Yapay Zeka ile Analiz Et</Text>
          </Pressable>
        </SafeAreaView>
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
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  analizYazisi: {
    color: SIYAH,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
