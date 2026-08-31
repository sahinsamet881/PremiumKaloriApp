import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  birimGram,
  PorsiyonBirimi,
  PorsiyonSecici,
  porsiyonAyikla,
  porsiyonEtiketi,
} from '@/components/porsiyon-secici';
import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH, SURFACE } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { YEREL_BESIN_VERITABANI } from '@/data/foodDatabase';
import {
  OGUN_TURLERI,
  ogunTuruGecerliMi,
  ogunTuruSaattenTuret,
  suAnkiOgunTuru,
} from '@/nutrition/ogun';
import { OgunTuru } from '@/types';

type Taban = { kalori: number; protein: number; karbonhidrat: number; yag: number; lif: number };

export default function OgunDuzenleScreen() {
  const { id, besinId, yemekId, barkod, ad, k100, p100, c100, f100, l100, grup } =
    useLocalSearchParams<{
      id?: string;
      besinId?: string;
      yemekId?: string;
      barkod?: string;
      ad?: string;
      k100?: string;
      p100?: string;
      c100?: string;
      f100?: string;
      l100?: string;
      grup?: string;
    }>();
  const { ogunler, hizliKaloriEkle, ogunGuncelle, urunBul, urunEkle, turkYemekBul } = useVeri();

  const mevcutOgun = id ? ogunler.find((ogun) => ogun.id === id) : undefined;
  const besin = besinId ? YEREL_BESIN_VERITABANI.find((b) => b.id === besinId) : undefined;
  const yemek = yemekId ? turkYemekBul(yemekId) : undefined;
  const yerelUrun = barkod ? urunBul(barkod) : undefined;
  const offKalori100 = k100 ? Number(k100) : 0;
  const duzenlemeMi = Boolean(mevcutOgun);

  const baslangic = useMemo(() => {
    if (mevcutOgun) {
      const { birim, miktar } = porsiyonAyikla(mevcutOgun.makrolar?.porsiyon ?? '1 Porsiyon');
      const gram = Math.max(1, miktar * birimGram(birim));
      const m = mevcutOgun.makrolar;
      const taban: Taban | null = m
        ? {
            kalori: mevcutOgun.kalori / gram,
            protein: m.protein / gram,
            karbonhidrat: m.karbonhidrat / gram,
            yag: m.yag / gram,
            lif: (m.lif ?? 0) / gram,
          }
        : null;
      return { taban, birim, miktar: String(miktar), isim: mevcutOgun.isim, kalori: String(mevcutOgun.kalori) };
    }
    if (besin) {
      const { birim, miktar } = porsiyonAyikla(besin.porsiyon);
      const gram = Math.max(1, miktar * birimGram(birim));
      const taban: Taban = {
        kalori: besin.kalori / gram,
        protein: besin.protein / gram,
        karbonhidrat: besin.karbonhidrat / gram,
        yag: besin.yag / gram,
        lif: (besin.lif ?? 0) / gram,
      };
      return { taban, birim, miktar: String(miktar), isim: besin.isim, kalori: '' };
    }
    if (yemek) {
      const taban: Taban = {
        kalori: yemek.kalori100 / 100,
        protein: yemek.protein100 / 100,
        karbonhidrat: yemek.karb100 / 100,
        yag: yemek.yag100 / 100,
        lif: (yemek.lif100 ?? 0) / 100,
      };
      return {
        taban,
        birim: 'gram' as PorsiyonBirimi,
        miktar: String(yemek.porsiyonGram),
        isim: yemek.isim,
        kalori: '',
      };
    }
    if (offKalori100 > 0) {
      const taban: Taban = {
        kalori: offKalori100 / 100,
        protein: (Number(p100) || 0) / 100,
        karbonhidrat: (Number(c100) || 0) / 100,
        yag: (Number(f100) || 0) / 100,
        lif: (Number(l100) || 0) / 100,
      };
      return {
        taban,
        birim: 'gram' as PorsiyonBirimi,
        miktar: '100',
        isim: ad ?? '',
        kalori: '',
      };
    }
    if (yerelUrun) {
      const { birim, miktar } = porsiyonAyikla(yerelUrun.porsiyon);
      const gram = Math.max(1, miktar * birimGram(birim));
      const taban: Taban = {
        kalori: yerelUrun.kalori / gram,
        protein: yerelUrun.protein / gram,
        karbonhidrat: yerelUrun.karbonhidrat / gram,
        yag: yerelUrun.yag / gram,
        lif: (yerelUrun.lif ?? 0) / gram,
      };
      return { taban, birim, miktar: String(miktar), isim: yerelUrun.isim, kalori: '' };
    }
    return { taban: null as Taban | null, birim: 'porsiyon' as PorsiyonBirimi, miktar: '1', isim: '', kalori: '' };
  }, [mevcutOgun, besin, yemek, offKalori100, p100, c100, f100, l100, ad, yerelUrun]);

  const [isim, setIsim] = useState(baslangic.isim);
  const [birim, setBirim] = useState<PorsiyonBirimi>(baslangic.birim);
  const [miktar, setMiktar] = useState(baslangic.miktar);
  const [kaloriMetni, setKaloriMetni] = useState(baslangic.kalori);
  const [proteinMetni, setProteinMetni] = useState(
    mevcutOgun?.makrolar ? String(mevcutOgun.makrolar.protein) : ''
  );
  const [karbMetni, setKarbMetni] = useState(
    mevcutOgun?.makrolar ? String(mevcutOgun.makrolar.karbonhidrat) : ''
  );
  const [yagMetni, setYagMetni] = useState(mevcutOgun?.makrolar ? String(mevcutOgun.makrolar.yag) : '');
  const [lifMetni, setLifMetni] = useState(
    mevcutOgun?.makrolar?.lif != null ? String(mevcutOgun.makrolar.lif) : ''
  );

  const baslangicOgunTuru: OgunTuru = mevcutOgun
    ? mevcutOgun.ogunTuru ?? ogunTuruSaattenTuret(mevcutOgun.eklenmeSaati)
    : ogunTuruGecerliMi(grup)
      ? grup
      : suAnkiOgunTuru();
  const [ogunTuru, setOgunTuru] = useState<OgunTuru>(baslangicOgunTuru);

  const olcekli = baslangic.taban;
  const gram = Math.max(0, (Number(miktar) || 0) * birimGram(birim));

  const hesaplanan = olcekli
    ? {
        kalori: Math.round(olcekli.kalori * gram),
        protein: Math.round(olcekli.protein * gram),
        karbonhidrat: Math.round(olcekli.karbonhidrat * gram),
        yag: Math.round(olcekli.yag * gram),
        lif: Math.round(olcekli.lif * gram),
      }
    : {
        kalori: Number(kaloriMetni) || 0,
        protein: Number(proteinMetni) || 0,
        karbonhidrat: Number(karbMetni) || 0,
        yag: Number(yagMetni) || 0,
        lif: Number(lifMetni) || 0,
      };

  const gecerli = hesaplanan.kalori > 0 && (Number(miktar) || 0) > 0;

  const kaydet = () => {
    if (!gecerli) {
      return;
    }

    const makrolar = {
      protein: hesaplanan.protein,
      karbonhidrat: hesaplanan.karbonhidrat,
      yag: hesaplanan.yag,
      lif: hesaplanan.lif,
      porsiyon: porsiyonEtiketi(birim, Number(miktar) || 0),
    };

    if (duzenlemeMi && mevcutOgun) {
      ogunGuncelle(mevcutOgun.id, { isim, kalori: hesaplanan.kalori, makrolar, ogunTuru });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }

    if (barkod) {
      urunEkle({
        barkod,
        isim: isim.trim() || 'Barkodlu Ürün',
        kalori: hesaplanan.kalori,
        protein: hesaplanan.protein,
        karbonhidrat: hesaplanan.karbonhidrat,
        yag: hesaplanan.yag,
        lif: hesaplanan.lif,
        porsiyon: makrolar.porsiyon,
      });
    }

    hizliKaloriEkle(hesaplanan.kalori, isim, makrolar, ogunTuru);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismissAll();
  };

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.kok} edges={['top', 'bottom']}>
        <View style={stiller.ustBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={stiller.geriYazisi}>‹ Geri</Text>
          </Pressable>
          <Text style={stiller.baslik}>{duzenlemeMi ? 'Öğünü Düzenle' : 'Öğün Ekle'}</Text>
          <View style={stiller.geriDenge} />
        </View>

        <KeyboardAvoidingView
          style={stiller.kok}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={stiller.icerik}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={stiller.alan}>
              <Text style={stiller.alanEtiketi}>Yemek Adı</Text>
              <TextInput
                value={isim}
                onChangeText={setIsim}
                placeholder="Örn: Yulaf Ezmesi"
                placeholderTextColor={ALTIN_SOLUK}
                selectionColor={ALTIN}
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                style={stiller.girisAlani}
              />
            </View>

            <View style={stiller.alan}>
              <Text style={stiller.alanEtiketi}>Öğün Türü</Text>
              <View style={stiller.turSatiri}>
                {OGUN_TURLERI.map(({ tur, etiket }) => {
                  const seciliMi = tur === ogunTuru;
                  return (
                    <Pressable
                      key={tur}
                      onPress={() => setOgunTuru(tur)}
                      style={[stiller.turCip, seciliMi ? stiller.turCipAktif : null]}>
                      <Text style={[stiller.turCipYazi, seciliMi ? stiller.turCipYaziAktif : null]}>
                        {etiket}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <PorsiyonSecici birim={birim} miktar={miktar} onBirim={setBirim} onMiktar={setMiktar} />

            {olcekli ? (
              <View style={stiller.ozetKarti}>
                <View style={stiller.ozetSatiri}>
                  <Text style={stiller.ozetEtiket}>Kalori</Text>
                  <Text style={stiller.ozetDeger}>{hesaplanan.kalori} kcal</Text>
                </View>
                <View style={stiller.rozetSatiri}>
                  <View style={stiller.rozet}>
                    <Text style={stiller.rozetDeger}>{hesaplanan.protein}g</Text>
                    <Text style={stiller.rozetEtiket}>Protein</Text>
                  </View>
                  <View style={stiller.rozet}>
                    <Text style={stiller.rozetDeger}>{hesaplanan.karbonhidrat}g</Text>
                    <Text style={stiller.rozetEtiket}>Karb</Text>
                  </View>
                  <View style={stiller.rozet}>
                    <Text style={stiller.rozetDeger}>{hesaplanan.yag}g</Text>
                    <Text style={stiller.rozetEtiket}>Yağ</Text>
                  </View>
                  <View style={stiller.rozet}>
                    <Text style={stiller.rozetDeger}>{hesaplanan.lif}g</Text>
                    <Text style={stiller.rozetEtiket}>Lif</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={stiller.manuelAlan}>
                <View style={stiller.alan}>
                  <Text style={stiller.alanEtiketi}>Kalori (kcal)</Text>
                  <TextInput
                    value={kaloriMetni}
                    onChangeText={(t) => setKaloriMetni(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={ALTIN_SOLUK}
                    selectionColor={ALTIN}
                    style={stiller.girisAlani}
                  />
                </View>
                <View style={stiller.manuelMakroSatiri}>
                  {[
                    { etiket: 'Protein', deger: proteinMetni, set: setProteinMetni },
                    { etiket: 'Karb', deger: karbMetni, set: setKarbMetni },
                    { etiket: 'Yağ', deger: yagMetni, set: setYagMetni },
                    { etiket: 'Lif', deger: lifMetni, set: setLifMetni },
                  ].map((m) => (
                    <View key={m.etiket} style={[stiller.alan, stiller.manuelMakroAlan]}>
                      <Text style={stiller.alanEtiketi}>{m.etiket} (g)</Text>
                      <TextInput
                        value={m.deger}
                        onChangeText={(t) => m.set(t.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={ALTIN_SOLUK}
                        selectionColor={ALTIN}
                        style={stiller.girisAlani}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={kaydet}
            style={[stiller.kaydetButonu, gecerli ? null : stiller.kaydetButonuPasif]}>
            <MaterialCommunityIcons name="check" size={18} color={SIYAH} />
            <Text style={stiller.kaydetButonuYazisi}>
              {duzenlemeMi ? 'Değişiklikleri Kaydet' : 'Öğünlerime Ekle'}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
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
  geriDenge: {
    width: 44,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 22,
  },
  alan: {
    gap: 8,
  },
  alanEtiketi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  girisAlani: {
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: ALTIN,
    fontSize: 16,
    fontWeight: '300',
    backgroundColor: SIYAH,
  },
  ozetKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  ozetSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ozetEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ozetDeger: {
    color: ALTIN,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  rozetSatiri: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rozet: {
    flexGrow: 1,
    flexBasis: '22%',
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(232, 195, 124, 0.06)',
  },
  rozetDeger: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '500',
  },
  rozetEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 3,
  },
  turSatiri: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  turCip: {
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: SIYAH,
  },
  turCipAktif: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232, 195, 124, 0.14)',
  },
  turCipYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  turCipYaziAktif: {
    color: ALTIN,
  },
  manuelAlan: {
    gap: 16,
  },
  manuelMakroSatiri: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  manuelMakroAlan: {
    flexGrow: 1,
    flexBasis: '47%',
  },
  kaydetButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 8,
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
