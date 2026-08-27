import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ALTIN, ALTIN_ORTA_SOLUK, ALTIN_PLACEHOLDER, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { YerelBesin, YEREL_BESIN_VERITABANI } from '@/data/foodDatabase';

export default function SearchScreen() {
  const { hizliKaloriEkle } = useVeri();

  const [sorgu, setSorgu] = useState('');

  const sonuclar = useMemo(() => {
    const sorguTemiz = sorgu.trim().toLocaleLowerCase('tr-TR');

    if (sorguTemiz.length === 0) {
      return [];
    }

    return YEREL_BESIN_VERITABANI.filter((besin) =>
      besin.isim.toLocaleLowerCase('tr-TR').includes(sorguTemiz)
    );
  }, [sorgu]);

  const besinSecildi = (besin: YerelBesin) => {
    hizliKaloriEkle(besin.kalori, besin.isim, {
      protein: besin.protein,
      karbonhidrat: besin.karbonhidrat,
      yag: besin.yag,
      porsiyon: besin.porsiyon,
    });
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Pressable onPress={() => router.back()} style={styles.geriButonu}>
        <IconSymbol name="chevron.left" size={16} color={ALTIN} />
        <Text style={styles.geriMetni}>Geri</Text>
      </Pressable>

      <View style={styles.aramaCubugu}>
        <IconSymbol name="magnifyingglass" size={18} color={ALTIN} />
        <TextInput
          autoFocus
          value={sorgu}
          onChangeText={setSorgu}
          keyboardType="default"
          returnKeyType="search"
          placeholder="Ne yedin?"
          placeholderTextColor={ALTIN_SOLUK}
          selectionColor={ALTIN}
          style={styles.aramaGirisi}
        />
      </View>

      {sorgu.trim().length === 0 ? (
        <Text style={styles.durumMetni}>Aramaya başlamak için yaz</Text>
      ) : sonuclar.length === 0 ? (
        <Text style={styles.durumMetni}>{`"${sorgu}" için sonuç bulunamadı`}</Text>
      ) : (
        <FlatList
          data={sonuclar}
          keyExtractor={(besin) => besin.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sonucListesi}
          ItemSeparatorComponent={() => <View style={styles.ayirac} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => besinSecildi(item)}
              style={({ pressed }) => [styles.sonucSatiri, pressed && styles.sonucSatiriBasili]}>
              <View style={styles.gorselGolgesi}>
                <View style={styles.gorselKapsayici}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.gorsel}
                      contentFit="cover"
                      transition={200}
                      onError={(hata) =>
                        console.log(`Görsel yüklenemedi: ${item.isim}`, hata.error)
                      }
                    />
                  ) : null}
                </View>
              </View>
              <View style={styles.sonucBilgisi}>
                <Text style={styles.sonucIsmi}>{item.isim}</Text>
                <View style={styles.sonucAltSatir}>
                  <Text style={styles.sonucPorsiyonu}>{item.porsiyon}</Text>
                  <Text style={styles.sonucKalorisi}>{item.kalori} kcal</Text>
                </View>
                <Text style={styles.sonucMakrolari}>
                  {`P: ${item.protein}g   K: ${item.karbonhidrat}g   Y: ${item.yag}g`}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
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
    color: ALTIN,
    fontSize: 17,
    fontWeight: '300',
  },
  aramaCubugu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTIN,
    paddingHorizontal: 14,
  },
  aramaGirisi: {
    flex: 1,
    color: ALTIN,
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  durumMetni: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 48,
    letterSpacing: 0.5,
  },
  sonucListesi: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  ayirac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ALTIN_SOLUK,
  },
  sonucSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  sonucSatiriBasili: {
    opacity: 0.5,
  },
  gorselGolgesi: {
    width: 60,
    height: 60,
    borderRadius: 12,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  gorselKapsayici: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTIN,
    overflow: 'hidden',
    backgroundColor: ALTIN_PLACEHOLDER,
  },
  gorsel: {
    width: 60,
    height: 60,
  },
  sonucBilgisi: {
    flex: 1,
    gap: 4,
  },
  sonucIsmi: {
    color: ALTIN,
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1,
  },
  sonucAltSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sonucPorsiyonu: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  sonucMakrolari: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  sonucKalorisi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});
