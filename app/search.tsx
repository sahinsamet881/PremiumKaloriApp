import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useVeri } from '@/context/DataContext';
import { useAksanRenk } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const EDAMAM_APP_ID = '62ec739e';
const EDAMAM_APP_KEY = '96cdf0a39f1e00f89c74e2f2fa90a0f1';

type EdamamBesin = {
  foodId: string;
  label: string;
  nutrients: {
    ENERC_KCAL?: number;
  };
};

type EdamamYaniti = {
  hints?: { food: EdamamBesin }[];
};

type MyMemoryYaniti = {
  responseData?: {
    translatedText?: string;
  };
};

const MAKSIMUM_SONUC_SAYISI = 10;

function besinleriTemizle(hints: { food: EdamamBesin }[]) {
  const gorulenIsimler = new Set<string>();
  const temizler: EdamamBesin[] = [];

  for (const ipucu of hints) {
    const besin = ipucu.food;
    const kalori = besin.nutrients.ENERC_KCAL ?? 0;
    const isimAnahtari = besin.label.trim().toLowerCase();

    if (kalori <= 0 || gorulenIsimler.has(isimAnahtari)) {
      continue;
    }

    gorulenIsimler.add(isimAnahtari);
    temizler.push(besin);

    if (temizler.length === MAKSIMUM_SONUC_SAYISI) {
      break;
    }
  }

  return temizler;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { aksanRengi } = useAksanRenk();
  const { hizliKaloriEkle } = useVeri();

  const [sorgu, setSorgu] = useState('');
  const [sonuclar, setSonuclar] = useState<EdamamBesin[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aramaYapildi, setAramaYapildi] = useState(false);
  const [hataOldu, setHataOldu] = useState(false);

  useEffect(() => {
    const sorguTemiz = sorgu.trim();

    if (sorguTemiz.length < 2) {
      setSonuclar([]);
      setAramaYapildi(false);
      setYukleniyor(false);
      setHataOldu(false);
      return;
    }

    setYukleniyor(true);

    const zamanlayici = setTimeout(async () => {
      try {
        const ceviriYaniti = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sorguTemiz)}&langpair=tr|en`
        );
        const ceviriVeri: MyMemoryYaniti = await ceviriYaniti.json();
        const ingilizceSorgu = ceviriVeri.responseData?.translatedText?.trim() || sorguTemiz;

        const yanit = await fetch(
          `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(ingilizceSorgu)}`
        );
        const veri: EdamamYaniti = await yanit.json();
        setSonuclar(besinleriTemizle(veri.hints ?? []));
        setHataOldu(false);
      } catch {
        setSonuclar([]);
        setHataOldu(true);
      } finally {
        setYukleniyor(false);
        setAramaYapildi(true);
      }
    }, 500);

    return () => clearTimeout(zamanlayici);
  }, [sorgu]);

  const besinSecildi = (besin: EdamamBesin) => {
    const kalori = Math.round(besin.nutrients.ENERC_KCAL ?? 0);
    hizliKaloriEkle(kalori, besin.label);
    router.push('/');
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.geriButonu}>
        <IconSymbol name="chevron.left" size={16} color={palette.icon} />
        <ThemedText style={[styles.geriMetni, { color: palette.icon }]}>Geri</ThemedText>
      </Pressable>

      <View style={[styles.aramaCubugu, { backgroundColor: palette.icon + '1a' }]}>
        <IconSymbol name="magnifyingglass" size={18} color={palette.icon} />
        <TextInput
          autoFocus
          value={sorgu}
          onChangeText={setSorgu}
          keyboardType="default"
          returnKeyType="search"
          placeholder="Ne yedin?"
          placeholderTextColor={palette.icon}
          style={[styles.aramaGirisi, { color: palette.text }]}
        />
      </View>

      {yukleniyor ? (
        <View style={styles.durumGostergesi}>
          <ActivityIndicator color={aksanRengi} />
          <ThemedText style={[styles.durumMetni, { color: palette.icon }]}>
            Çevriliyor ve aranıyor...
          </ThemedText>
        </View>
      ) : hataOldu ? (
        <ThemedText style={[styles.durumMetni, styles.bagimsizDurumMetni, { color: palette.icon }]}>
          Arama sırasında bir sorun oluştu, tekrar dene.
        </ThemedText>
      ) : aramaYapildi && sonuclar.length === 0 ? (
        <ThemedText style={[styles.durumMetni, styles.bagimsizDurumMetni, { color: palette.icon }]}>
          {`"${sorgu}" için sonuç bulunamadı`}
        </ThemedText>
      ) : !aramaYapildi ? (
        <ThemedText style={[styles.durumMetni, styles.bagimsizDurumMetni, { color: palette.icon }]}>
          Aramaya başlamak için yaz
        </ThemedText>
      ) : (
        <FlatList
          data={sonuclar}
          keyExtractor={(besin, index) => `${besin.foodId}-${index}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sonucListesi}
          ItemSeparatorComponent={() => (
            <View style={[styles.ayirac, { backgroundColor: palette.icon }]} />
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => besinSecildi(item)}
              style={({ pressed }) => [styles.sonucSatiri, pressed && styles.sonucSatiriBasili]}>
              <ThemedText style={styles.sonucIsmi}>{item.label}</ThemedText>
              <ThemedText style={[styles.sonucKalorisi, { color: palette.icon }]}>
                {Math.round(item.nutrients.ENERC_KCAL ?? 0)} kcal
              </ThemedText>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  geriButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  geriMetni: {
    fontSize: 17,
  },
  aramaCubugu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  aramaGirisi: {
    flex: 1,
    fontSize: 17,
  },
  durumGostergesi: {
    alignItems: 'center',
    marginTop: 48,
  },
  durumMetni: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  bagimsizDurumMetni: {
    marginTop: 48,
  },
  sonucListesi: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  ayirac: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.3,
  },
  sonucSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  sonucSatiriBasili: {
    opacity: 0.5,
  },
  sonucIsmi: {
    fontSize: 17,
    fontWeight: '500',
    flexShrink: 1,
    paddingRight: 12,
    textTransform: 'capitalize',
  },
  sonucKalorisi: {
    fontSize: 15,
    fontWeight: '600',
  },
});
