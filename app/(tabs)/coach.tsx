import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { ScreenHeader, SCREEN_HEADER_ICERIK_YUKSEKLIGI } from '@/components/screen-header';
import { GEMINI_API_KEY, KOC_MODELI } from '@/constants/ai';
import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

type Mesaj = {
  id: string;
  rol: 'kullanici' | 'koc';
  metin: string;
};

const KARSILAMA_MESAJI: Mesaj = {
  id: 'karsilama',
  rol: 'koc',
  metin:
    'Merhaba! Ben senin yapay zeka diyet koçunum. Bugün ne yediğini, hedeflerini veya aklına takılan her şeyi bana sorabilirsin.',
};

export default function CoachScreen() {
  const { kullanici, ogunler } = useVeri();
  const tabBarYuksekligi = useBottomTabBarHeight();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([KARSILAMA_MESAJI]);
  const [girdi, setGirdi] = useState('');
  const [yaziliyor, setYaziliyor] = useState(false);
  const kaydiriciRef = useRef<ScrollView>(null);

  const sistemTalimati = useMemo(() => {
    const alinanKalori = ogunler.reduce((toplam, ogun) => toplam + ogun.kalori, 0);
    const ogunOzeti =
      ogunler.length > 0
        ? ogunler.map((ogun) => `${ogun.isim} (${ogun.kalori} kcal)`).join(', ')
        : 'henüz bir şey eklenmedi';

    return [
      'Sen "AI Koç" adında, sıcak ama net konuşan bir yapay zeka diyet koçusun.',
      'Kısa, uygulanabilir ve motive edici yanıtlar ver; gerektiğinde madde işareti kullan.',
      'Tıbbi teşhis koyma; ciddi durumlarda bir uzmana danışmayı öner.',
      `Kullanıcı: ${kullanici.isim || 'isimsiz'}, ${kullanici.yas} yaş, ${kullanici.boy} cm, ${kullanici.kilo} kg, hedef ${kullanici.hedefKilo} kg.`,
      `Günlük kalori hedefi ${kullanici.gunlukHedefKalori} kcal. Makro hedefleri: Protein ${kullanici.makroHedefleri.protein}g, Karbonhidrat ${kullanici.makroHedefleri.karbonhidrat}g, Yağ ${kullanici.makroHedefleri.yag}g.`,
      `Bugün alınan toplam ${alinanKalori} kcal. Bugünün öğünleri: ${ogunOzeti}.`,
    ].join('\n');
  }, [kullanici, ogunler]);

  const gonder = async () => {
    const metin = girdi.trim();
    if (metin.length === 0 || yaziliyor) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const kullaniciMesaji: Mesaj = { id: String(Date.now()), rol: 'kullanici', metin };
    const guncelGecmis = [...mesajlar, kullaniciMesaji];
    setMesajlar(guncelGecmis);
    setGirdi('');
    setYaziliyor(true);

    try {
      let kesit = guncelGecmis.filter((mesaj) => mesaj.id !== KARSILAMA_MESAJI.id).slice(-12);
      while (kesit.length > 0 && kesit[0].rol === 'koc') {
        kesit = kesit.slice(1);
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${KOC_MODELI}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sistemTalimati }] },
            contents: kesit.map((mesaj) => ({
              role: mesaj.rol === 'kullanici' ? 'user' : 'model',
              parts: [{ text: mesaj.metin }],
            })),
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
          }),
        }
      );

      if (!response.ok) {
        const hataGovdesi = await response.text();
        throw new Error(hataGovdesi);
      }

      const data = await response.json();
      const cevap = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      setMesajlar((onceki) => [
        ...onceki,
        {
          id: `${Date.now()}-koc`,
          rol: 'koc',
          metin:
            cevap && cevap.length > 0
              ? cevap
              : 'Şu an bir yanıt oluşturamadım, sorunu biraz farklı sorar mısın?',
        },
      ]);
    } catch (error: any) {
      console.error('AI Koç Hatası:', error);
      setMesajlar((onceki) => [
        ...onceki,
        {
          id: `${Date.now()}-hata`,
          rol: 'koc',
          metin: 'Bağlantı kurulamadı. Birazdan tekrar dener misin?',
        },
      ]);
    } finally {
      setYaziliyor(false);
    }
  };

  const gonderilemez = girdi.trim().length === 0 || yaziliyor;

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <ScreenHeader
        baslik="AI Koç"
        altBaslik={yaziliyor ? 'yazıyor...' : 'çevrimiçi'}
        sag={
          <View style={stiller.betaRozeti}>
            <Text style={stiller.betaYazisi}>BETA</Text>
          </View>
        }
      />
      <SafeAreaView style={stiller.kok} edges={['top']}>
        <KeyboardAvoidingView
          style={stiller.kok}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={tabBarYuksekligi}>
          <ScrollView
            ref={kaydiriciRef}
            style={stiller.sohbet}
            contentContainerStyle={[
              stiller.sohbetIcerik,
              { paddingTop: SCREEN_HEADER_ICERIK_YUKSEKLIGI + 12 },
            ]}
            onContentSizeChange={() => kaydiriciRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {mesajlar.map((mesaj) => (
              <View
                key={mesaj.id}
                style={[
                  stiller.balonSatiri,
                  mesaj.rol === 'kullanici' ? stiller.balonSatiriSag : stiller.balonSatiriSol,
                ]}>
                <View
                  style={[
                    stiller.balon,
                    mesaj.rol === 'kullanici' ? stiller.balonKullanici : stiller.balonKoc,
                  ]}>
                  <Text
                    style={[
                      stiller.balonYazi,
                      mesaj.rol === 'kullanici' ? stiller.balonYaziKullanici : stiller.balonYaziKoc,
                    ]}>
                    {mesaj.metin}
                  </Text>
                </View>
              </View>
            ))}

            {yaziliyor ? (
              <View style={[stiller.balonSatiri, stiller.balonSatiriSol]}>
                <View style={[stiller.balon, stiller.balonKoc, stiller.yaziyorBalonu]}>
                  <ActivityIndicator size="small" color={ALTIN} />
                  <Text style={stiller.yaziyorYazi}>Koç düşünüyor...</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={stiller.girdiAlani}>
            <TextInput
              style={stiller.girdi}
              value={girdi}
              onChangeText={setGirdi}
              placeholder="Koçuna bir şey sor..."
              placeholderTextColor={ALTIN_SOLUK}
              selectionColor={ALTIN}
              multiline
              maxLength={500}
              textAlignVertical="center"
            />
            <Pressable
              onPress={gonder}
              disabled={gonderilemez}
              style={[stiller.gonderButonu, gonderilemez ? stiller.gonderButonuPasif : null]}>
              <MaterialCommunityIcons name="arrow-up" size={22} color={SIYAH} />
            </Pressable>
          </View>
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
  betaRozeti: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(232,195,124,0.12)',
  },
  betaYazisi: {
    color: ALTIN,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  sohbet: {
    flex: 1,
  },
  sohbetIcerik: {
    padding: 16,
    gap: 10,
    paddingBottom: 8,
  },
  balonSatiri: {
    width: '100%',
    flexDirection: 'row',
  },
  balonSatiriSol: {
    justifyContent: 'flex-start',
  },
  balonSatiriSag: {
    justifyContent: 'flex-end',
  },
  balon: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balonKoc: {
    backgroundColor: 'rgba(232,195,124,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    borderTopLeftRadius: 4,
  },
  balonKullanici: {
    backgroundColor: ALTIN,
    borderTopRightRadius: 4,
  },
  balonYazi: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  balonYaziKoc: {
    color: ALTIN,
  },
  balonYaziKullanici: {
    color: SIYAH,
  },
  yaziyorBalonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yaziyorYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
  },
  girdiAlani: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,215,0,0.18)',
    backgroundColor: SIYAH,
  },
  girdi: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: 'rgba(232,195,124,0.04)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: ALTIN,
    fontSize: 14,
  },
  gonderButonu: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  gonderButonuPasif: {
    opacity: 0.35,
  },
});
