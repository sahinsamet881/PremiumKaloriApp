import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, DANGER, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

type Durum = 'tara' | 'ara' | 'bulunamadi' | 'ag_hatasi';

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';

export default function BarkodScreen() {
  const [izin, izinIste] = useCameraPermissions();
  const { urunBul } = useVeri();
  const { grup } = useLocalSearchParams<{ grup?: string }>();
  const [durum, setDurum] = useState<Durum>('tara');
  const [barkod, setBarkod] = useState('');
  const isliyorRef = useRef(false);

  const turParam = grup ? { grup } : {};

  const elleGir = (kod: string) => {
    router.replace({ pathname: '/ogun-duzenle', params: { barkod: kod, ...turParam } });
  };

  const tekrarTara = () => {
    isliyorRef.current = false;
    setBarkod('');
    setDurum('tara');
  };

  const barkodOkundu = async (kod: string, tekrar = false) => {
    if (isliyorRef.current && !tekrar) {
      return;
    }
    isliyorRef.current = true;
    setBarkod(kod);

    const yerel = urunBul(kod);
    if (yerel) {
      router.replace({ pathname: '/ogun-duzenle', params: { barkod: kod, ...turParam } });
      return;
    }

    setDurum('ara');

    try {
      const yanit = await fetch(`${OFF_URL}/${kod}.json`, {
        headers: { 'User-Agent': 'MinimalistKalori/1.0 (rn)' },
      });

      if (yanit.status === 404) {
        setDurum('bulunamadi');
        return;
      }
      if (!yanit.ok) {
        throw new Error(`HTTP ${yanit.status}`);
      }

      const veri = await yanit.json();
      const urun = veri?.product;
      if (veri?.status === 0 || !urun) {
        setDurum('bulunamadi');
        return;
      }

      const besin = urun.nutriments ?? {};
      const kalori100 = Number(besin['energy-kcal_100g'] ?? besin['energy-kcal'] ?? 0);
      if (!Number.isFinite(kalori100) || kalori100 <= 0) {
        setDurum('bulunamadi');
        return;
      }

      const ad =
        (urun.product_name_tr || urun.product_name || urun.generic_name || '').trim() ||
        'İsimsiz Ürün';

      router.replace({
        pathname: '/ogun-duzenle',
        params: {
          barkod: kod,
          ad,
          k100: String(Math.round(kalori100)),
          p100: String(Math.round(Number(besin.proteins_100g) || 0)),
          c100: String(Math.round(Number(besin.carbohydrates_100g) || 0)),
          f100: String(Math.round(Number(besin.fat_100g) || 0)),
          l100: String(Math.round(Number(besin.fiber_100g) || 0)),
          ...turParam,
        },
      });
    } catch {
      setDurum('ag_hatasi');
    }
  };

  if (!izin) {
    return <View style={stiller.kok} />;
  }

  if (!izin.granted) {
    return (
      <View style={[stiller.kok, stiller.merkez]}>
        <StatusBar style="light" />
        <MaterialCommunityIcons name="barcode-scan" size={60} color={ALTIN} />
        <Text style={stiller.baslik}>Barkod Taramak İçin{'\n'}Kamera İzni Gerekli</Text>
        <Text style={stiller.aciklama}>
          Ambalajlı ürünlerin barkodunu okuyup besin değerlerini otomatik getirebilmemiz için kamera
          erişimine izin ver.
        </Text>
        {izin.canAskAgain ? (
          <Pressable onPress={izinIste} style={stiller.anaButon}>
            <Text style={stiller.anaButonYazisi}>Kamera İzni Ver</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => Linking.openSettings()} style={stiller.anaButon}>
            <Text style={stiller.anaButonYazisi}>Ayarları Aç</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={stiller.ikincilYazi}>Vazgeç</Text>
        </Pressable>
      </View>
    );
  }

  if (durum === 'ara') {
    return (
      <View style={[stiller.kok, stiller.merkez]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={ALTIN} />
        <Text style={stiller.durumBasligi}>Ürün aranıyor...</Text>
        <Text style={stiller.durumMetni}>{barkod}</Text>
      </View>
    );
  }

  if (durum === 'bulunamadi') {
    return (
      <View style={[stiller.kok, stiller.merkez]}>
        <StatusBar style="light" />
        <MaterialCommunityIcons name="help-circle-outline" size={60} color={ALTIN} />
        <Text style={stiller.durumBasligi}>Ürün Bulunamadı</Text>
        <Text style={stiller.aciklama}>
          {barkod} numaralı barkod Open Food Facts&apos;ta kayıtlı değil. Bilgileri elle girebilirsin;
          girdiğin ürün cihazına kaydedilir ve bir dahaki taramada hazır olur.
        </Text>
        <Pressable onPress={() => elleGir(barkod)} style={stiller.anaButon}>
          <Text style={stiller.anaButonYazisi}>Elle Gir</Text>
        </Pressable>
        <Pressable onPress={tekrarTara} hitSlop={10}>
          <Text style={stiller.ikincilYazi}>Tekrar Tara</Text>
        </Pressable>
      </View>
    );
  }

  if (durum === 'ag_hatasi') {
    return (
      <View style={[stiller.kok, stiller.merkez]}>
        <StatusBar style="light" />
        <MaterialCommunityIcons name="wifi-off" size={60} color={DANGER} />
        <Text style={stiller.durumBasligi}>Bağlantı Kurulamadı</Text>
        <Text style={stiller.aciklama}>
          Ürün veritabanına ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene ya da bilgileri
          elle gir.
        </Text>
        <Pressable onPress={() => barkodOkundu(barkod, true)} style={stiller.anaButon}>
          <Text style={stiller.anaButonYazisi}>Tekrar Dene</Text>
        </Pressable>
        <Pressable onPress={() => elleGir(barkod)} hitSlop={10}>
          <Text style={stiller.ikincilYazi}>Elle Gir</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
        onBarcodeScanned={({ data }) => barkodOkundu(data)}
      />
      <View style={stiller.katman} pointerEvents="box-none">
        <Text style={stiller.tarayiciYazi}>Barkodu çerçeveye hizala</Text>
        <View style={stiller.cerceve} pointerEvents="none">
          <View style={[stiller.kose, stiller.koseSolUst]} />
          <View style={[stiller.kose, stiller.koseSagUst]} />
          <View style={[stiller.kose, stiller.koseSolAlt]} />
          <View style={[stiller.kose, stiller.koseSagAlt]} />
        </View>
        <Pressable onPress={() => router.back()} style={stiller.kapatButonu} hitSlop={10}>
          <Text style={stiller.ikincilYazi}>Kapat</Text>
        </Pressable>
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  merkez: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 24,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 32,
  },
  durumBasligi: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  durumMetni: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 1,
  },
  aciklama: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 21,
    textAlign: 'center',
  },
  anaButon: {
    marginTop: 6,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 26,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  anaButonYazisi: {
    color: SIYAH,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  ikincilYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  katman: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  tarayiciYazi: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cerceve: {
    width: '78%',
    height: 150,
    position: 'relative',
  },
  kose: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: ALTIN,
  },
  koseSolUst: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  koseSagUst: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  koseSolAlt: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  koseSagAlt: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  kapatButonu: {
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
});
