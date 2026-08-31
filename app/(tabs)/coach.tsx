import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { fetch as akanFetch } from 'expo/fetch';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { ScreenHeader, SCREEN_HEADER_ICERIK_YUKSEKLIGI } from '@/components/screen-header';
import {
  GEMINI_API_KEY,
  KOC_GUVENLIK_KURALLARI,
  KOC_KISILIK,
  KOC_MODELI,
} from '@/constants/ai';
import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, DANGER, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

type Mesaj = {
  id: string;
  rol: 'kullanici' | 'koc';
  metin: string;
};

type KocHatasi = 'ag' | 'sunucu' | 'rate_limit' | 'zaman_asimi';

const SOHBET_ANAHTARI = '@minimalist_kalori/koc_sohbeti';
const ISTEK_ZAMAN_ASIMI = 30000;

const KARSILAMA_MESAJI: Mesaj = {
  id: 'karsilama',
  rol: 'koc',
  metin:
    'Merhaba! Ben senin yapay zeka diyet koçunum. Bugün ne yediğini, hedeflerini veya aklına takılan her şeyi bana sorabilirsin.',
};

const HATA_BILGI: Record<
  KocHatasi,
  { ikon: keyof typeof MaterialCommunityIcons.glyphMap; baslik: string; mesaj: string }
> = {
  ag: {
    ikon: 'wifi-off',
    baslik: 'İnternet Yok',
    mesaj: 'Bağlantını kontrol edip tekrar dene.',
  },
  sunucu: {
    ikon: 'server-network-off',
    baslik: 'Sunucu Hatası',
    mesaj: 'AI servisinde geçici bir sorun var. Birazdan tekrar dene.',
  },
  rate_limit: {
    ikon: 'timer-sand',
    baslik: 'Çok Fazla İstek',
    mesaj: 'Kısa sürede çok soru soruldu. Bir dakika bekleyip tekrar dene.',
  },
  zaman_asimi: {
    ikon: 'clock-alert-outline',
    baslik: 'Zaman Aşımı',
    mesaj: 'Yanıt çok uzun sürdü. Tekrar dener misin?',
  },
};

function hataSinifla(hata: unknown, statusKodu?: number): KocHatasi {
  if (statusKodu === 429) {
    return 'rate_limit';
  }
  if (typeof statusKodu === 'number' && statusKodu >= 400) {
    return 'sunucu';
  }
  const metin = String((hata as { message?: string })?.message ?? hata).toLowerCase();
  if ((hata as { name?: string })?.name === 'AbortError' || metin.includes('abort')) {
    return 'zaman_asimi';
  }
  if (
    metin.includes('network') ||
    metin.includes('fetch') ||
    metin.includes('unreachable') ||
    metin.includes('connection') ||
    metin.includes('econn') ||
    metin.includes('timed out')
  ) {
    return 'ag';
  }
  return 'sunucu';
}

export default function CoachScreen() {
  const { kullanici, ogunler, ogunGecmisi } = useVeri();
  const tabBarYuksekligi = useBottomTabBarHeight();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([KARSILAMA_MESAJI]);
  const [girdi, setGirdi] = useState('');
  const [yaziliyor, setYaziliyor] = useState(false);
  const [sonHata, setSonHata] = useState<KocHatasi | null>(null);
  const [sonSoru, setSonSoru] = useState('');
  const [cevrimici, setCevrimici] = useState(true);
  const kaydiriciRef = useRef<ScrollView>(null);
  const yuklendiRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const kayit = await AsyncStorage.getItem(SOHBET_ANAHTARI);
        if (kayit) {
          const cozulen: Mesaj[] = JSON.parse(kayit);
          if (Array.isArray(cozulen) && cozulen.length > 0) {
            setMesajlar(cozulen);
          }
        }
      } catch {
        // sohbet yüklenemedi, karşılama ile devam
      }
      yuklendiRef.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!yuklendiRef.current) {
      return;
    }
    AsyncStorage.setItem(SOHBET_ANAHTARI, JSON.stringify(mesajlar.slice(-60))).catch(() => {});
  }, [mesajlar]);

  useEffect(() => {
    Network.getNetworkStateAsync()
      .then((durum) => setCevrimici(durum.isInternetReachable ?? durum.isConnected ?? true))
      .catch(() => {});
    const abone = Network.addNetworkStateListener((durum) => {
      setCevrimici(durum.isInternetReachable ?? durum.isConnected ?? true);
    });
    return () => abone.remove();
  }, []);

  const yediGunKaloriOrt = useMemo(() => {
    const esik = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const gunToplam = new Map<string, number>();
    for (const kayit of ogunGecmisi) {
      if (kayit.zaman < esik) {
        continue;
      }
      const gun = new Date(kayit.zaman).toISOString().slice(0, 10);
      gunToplam.set(gun, (gunToplam.get(gun) ?? 0) + kayit.kalori);
    }
    const degerler = [...gunToplam.values()];
    if (degerler.length === 0) {
      return 0;
    }
    return Math.round(degerler.reduce((a, b) => a + b, 0) / degerler.length);
  }, [ogunGecmisi]);

  const sistemTalimati = useMemo(() => {
    const alinanKalori = ogunler.reduce((toplam, ogun) => toplam + ogun.kalori, 0);
    const makro = ogunler.reduce(
      (toplam, ogun) =>
        ogun.makrolar
          ? {
              p: toplam.p + ogun.makrolar.protein,
              k: toplam.k + ogun.makrolar.karbonhidrat,
              y: toplam.y + ogun.makrolar.yag,
              l: toplam.l + (ogun.makrolar.lif ?? 0),
            }
          : toplam,
      { p: 0, k: 0, y: 0, l: 0 }
    );
    const ogunListesi =
      ogunler.length > 0
        ? ogunler.map((ogun) => `- ${ogun.isim}: ${ogun.kalori} kcal`).join('\n')
        : '- (bugün henüz öğün eklenmedi)';

    return [
      KOC_KISILIK,
      KOC_GUVENLIK_KURALLARI,
      '--- KULLANICI ÖZETİ ---',
      `Yaş ${kullanici.yas}, boy ${kullanici.boy} cm, kilo ${kullanici.kilo} kg, hedef kilo ${kullanici.hedefKilo} kg.`,
      `Günlük kalori hedefi: ${kullanici.gunlukHedefKalori} kcal (Protein ${kullanici.makroHedefleri.protein}g / Karbonhidrat ${kullanici.makroHedefleri.karbonhidrat}g / Yağ ${kullanici.makroHedefleri.yag}g).`,
      `Bugün toplam: ${alinanKalori} kcal — Protein ${Math.round(makro.p)}g, Karbonhidrat ${Math.round(makro.k)}g, Yağ ${Math.round(makro.y)}g, Lif ${Math.round(makro.l)}g (günlük lif hedefi 25–30 g).`,
      `Bugünün öğünleri:\n${ogunListesi}`,
      `Son 7 günün günlük kalori ortalaması: ${
        yediGunKaloriOrt > 0 ? `${yediGunKaloriOrt} kcal` : 'yeterli veri yok'
      }.`,
    ].join('\n\n');
  }, [kullanici, ogunler, yediGunKaloriOrt]);

  const gonder = async (yeniden = false) => {
    if (yaziliyor || !cevrimici) {
      return;
    }
    const metin = (yeniden ? sonSoru : girdi).trim();
    if (metin.length === 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSonHata(null);

    let calismaGecmisi = mesajlar;
    if (!yeniden) {
      const kullaniciMesaji: Mesaj = { id: `${Date.now()}-k`, rol: 'kullanici', metin };
      calismaGecmisi = [...mesajlar, kullaniciMesaji];
      setMesajlar(calismaGecmisi);
      setGirdi('');
      setSonSoru(metin);
    }
    setYaziliyor(true);

    const kocId = `${Date.now()}-c`;
    let biriken = '';
    let placeholderVar = false;
    const kontrolcu = new AbortController();
    const zamanlayici = setTimeout(() => kontrolcu.abort(), ISTEK_ZAMAN_ASIMI);

    const isleParca = (json: string) => {
      if (!json || json === '[DONE]') {
        return;
      }
      try {
        const parca = JSON.parse(json);
        const ek: string = parca?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!ek) {
          return;
        }
        biriken += ek;
        if (!placeholderVar) {
          placeholderVar = true;
          setMesajlar((onceki) => [...onceki, { id: kocId, rol: 'koc', metin: biriken }]);
        } else {
          setMesajlar((onceki) =>
            onceki.map((mesaj) => (mesaj.id === kocId ? { ...mesaj, metin: biriken } : mesaj))
          );
        }
      } catch {
        // eksik/parçalı json satırı, sıradaki chunk'ta tamamlanır
      }
    };

    try {
      let kesit = calismaGecmisi
        .filter((mesaj) => mesaj.id !== KARSILAMA_MESAJI.id && mesaj.metin.trim().length > 0)
        .slice(-12);
      while (kesit.length > 0 && kesit[0].rol === 'koc') {
        kesit = kesit.slice(1);
      }

      const yanit = await akanFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${KOC_MODELI}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: kontrolcu.signal,
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
      clearTimeout(zamanlayici);

      if (!yanit.ok) {
        const govde = await yanit.text().catch(() => '');
        const hata = new Error(govde || `HTTP ${yanit.status}`) as Error & { status: number };
        hata.status = yanit.status;
        throw hata;
      }

      if (yanit.body) {
        const okuyucu = yanit.body.getReader();
        const cozucu = new TextDecoder();
        let tampon = '';
        for (;;) {
          const { done, value } = await okuyucu.read();
          if (done) {
            break;
          }
          tampon += cozucu.decode(value, { stream: true });
          const satirlar = tampon.split('\n');
          tampon = satirlar.pop() ?? '';
          for (const satir of satirlar) {
            const s = satir.trim();
            if (s.startsWith('data:')) {
              isleParca(s.slice(5).trim());
            }
          }
        }
        const kalan = tampon.trim();
        if (kalan.startsWith('data:')) {
          isleParca(kalan.slice(5).trim());
        }
      } else {
        const tumMetin = await yanit.text();
        for (const satir of tumMetin.split('\n')) {
          const s = satir.trim();
          if (s.startsWith('data:')) {
            isleParca(s.slice(5).trim());
          }
        }
      }

      if (biriken.trim().length === 0) {
        const yedek = 'Şu an bir yanıt oluşturamadım, sorunu biraz farklı sorar mısın?';
        setMesajlar((onceki) => {
          if (onceki.some((mesaj) => mesaj.id === kocId)) {
            return onceki.map((mesaj) => (mesaj.id === kocId ? { ...mesaj, metin: yedek } : mesaj));
          }
          return [...onceki, { id: kocId, rol: 'koc', metin: yedek }];
        });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (hata) {
      clearTimeout(zamanlayici);
      console.error('AI Koç Hatası:', hata);
      setMesajlar((onceki) => onceki.filter((mesaj) => mesaj.id !== kocId));
      setSonHata(hataSinifla(hata, (hata as { status?: number })?.status));
    } finally {
      setYaziliyor(false);
    }
  };

  const gonderilemez = !cevrimici || yaziliyor || girdi.trim().length === 0;
  const altBaslik = !cevrimici ? 'çevrimdışı' : yaziliyor ? 'yazıyor...' : 'çevrimiçi';

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <ScreenHeader
        baslik="AI Koç"
        altBaslik={altBaslik}
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

            {yaziliyor && !mesajlar.some((m) => m.id.endsWith('-c') && m.metin.length > 0) ? (
              <View style={[stiller.balonSatiri, stiller.balonSatiriSol]}>
                <View style={[stiller.balon, stiller.balonKoc, stiller.yaziyorBalonu]}>
                  <Text style={stiller.yaziyorYazi}>Koç düşünüyor...</Text>
                </View>
              </View>
            ) : null}

            {sonHata ? (
              <View style={[stiller.balonSatiri, stiller.balonSatiriSol]}>
                <View style={stiller.hataKarti}>
                  <MaterialCommunityIcons
                    name={HATA_BILGI[sonHata].ikon}
                    size={22}
                    color={DANGER}
                  />
                  <Text style={stiller.hataBaslik}>{HATA_BILGI[sonHata].baslik}</Text>
                  <Text style={stiller.hataMetin}>{HATA_BILGI[sonHata].mesaj}</Text>
                  <Pressable onPress={() => gonder(true)} style={stiller.tekrarButonu}>
                    <MaterialCommunityIcons name="refresh" size={14} color={SIYAH} />
                    <Text style={stiller.tekrarYazisi}>Tekrar Dene</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={stiller.girdiAlani}>
            {!cevrimici ? (
              <View style={stiller.cevrimdisiSerit}>
                <MaterialCommunityIcons name="wifi-off" size={13} color={ALTIN_ORTA_SOLUK} />
                <Text style={stiller.cevrimdisiYazi}>
                  Çevrimdışısın — AI Koç internet gerektirir. Öğün ve su kaydı çalışmaya devam eder.
                </Text>
              </View>
            ) : null}
            <View style={stiller.girdiSatiri}>
              <TextInput
                style={[stiller.girdi, !cevrimici ? stiller.girdiPasif : null]}
                value={girdi}
                onChangeText={setGirdi}
                editable={cevrimici && !yaziliyor}
                placeholder={cevrimici ? 'Koçuna bir şey sor...' : 'Bağlantı bekleniyor...'}
                placeholderTextColor={ALTIN_SOLUK}
                selectionColor={ALTIN}
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                multiline
                maxLength={500}
                textAlignVertical="center"
              />
              <Pressable
                onPress={() => gonder(false)}
                disabled={gonderilemez}
                style={[stiller.gonderButonu, gonderilemez ? stiller.gonderButonuPasif : null]}>
                <MaterialCommunityIcons name="arrow-up" size={22} color={SIYAH} />
              </Pressable>
            </View>
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
  hataKarti: {
    maxWidth: '86%',
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  hataBaslik: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  hataMetin: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 18,
  },
  tekrarButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 6,
    backgroundColor: ALTIN,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tekrarYazisi: {
    color: SIYAH,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  girdiAlani: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,215,0,0.18)',
    backgroundColor: SIYAH,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  cevrimdisiSerit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  cevrimdisiYazi: {
    flex: 1,
    color: ALTIN_ORTA_SOLUK,
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 15,
  },
  girdiSatiri: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
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
  girdiPasif: {
    opacity: 0.5,
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
