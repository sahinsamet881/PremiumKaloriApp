import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  ALTIN,
  ALTIN_COK_SOLUK,
  ALTIN_ORTA_SOLUK,
  ALTIN_SOLUK,
  SIYAH,
  SURFACE,
} from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { YEREL_BESIN_VERITABANI } from '@/data/foodDatabase';
import { turkceNormalize, yemekAra } from '@/data/turkishFoods';

type AramaSatiri = {
  anahtar: string;
  isim: string;
  altBilgi: string;
  kalori: number;
  git: () => void;
};

function porsiyonKalori(kalori100: number, porsiyonGram: number): number {
  return Math.round((kalori100 * porsiyonGram) / 100);
}

export default function SearchScreen() {
  const { turkYemekleri } = useVeri();
  const [sorgu, setSorgu] = useState('');

  const sonuclar = useMemo<AramaSatiri[]>(() => {
    const aranan = turkceNormalize(sorgu);
    if (aranan.length === 0) {
      return [];
    }

    const yemekler: AramaSatiri[] = yemekAra(sorgu, turkYemekleri).map((yemek) => {
      const kalori = porsiyonKalori(yemek.kalori100, yemek.porsiyonGram);
      return {
        anahtar: `yemek-${yemek.id}`,
        isim: yemek.isim,
        altBilgi: `${yemek.porsiyonAdi} (${yemek.porsiyonGram} g)`,
        kalori,
        git: () => router.push({ pathname: '/ogun-duzenle', params: { yemekId: yemek.id } }),
      };
    });

    const besinler: AramaSatiri[] = YEREL_BESIN_VERITABANI.filter((besin) =>
      turkceNormalize(besin.isim).includes(aranan)
    ).map((besin) => ({
      anahtar: `besin-${besin.id}`,
      isim: besin.isim,
      altBilgi: besin.porsiyon,
      kalori: besin.kalori,
      git: () => router.push({ pathname: '/ogun-duzenle', params: { besinId: besin.id } }),
    }));

    return [...yemekler, ...besinler];
  }, [sorgu, turkYemekleri]);

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
          placeholder="Ne yedin? (ör. mercimek corbasi)"
          placeholderTextColor={ALTIN_SOLUK}
          selectionColor={ALTIN}
          style={styles.aramaGirisi}
        />
      </View>

      {sorgu.trim().length === 0 ? (
        <Text style={styles.durumMetni}>Türk yemekleri veritabanında ara</Text>
      ) : sonuclar.length === 0 ? (
        <Text style={styles.durumMetni}>{`"${sorgu}" için sonuç bulunamadı`}</Text>
      ) : (
        <FlatList
          data={sonuclar}
          keyExtractor={(satir) => satir.anahtar}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sonucListesi}
          ItemSeparatorComponent={() => <View style={styles.ayirac} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={item.git}
              style={({ pressed }) => [styles.sonucSatiri, pressed && styles.sonucSatiriBasili]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarYazi}>{item.isim.charAt(0).toLocaleUpperCase('tr-TR')}</Text>
              </View>
              <View style={styles.sonucBilgisi}>
                <Text style={styles.sonucIsmi} numberOfLines={1}>
                  {item.isim}
                </Text>
                <Text style={styles.sonucAlt}>{item.altBilgi}</Text>
              </View>
              <Text style={styles.sonucKalorisi}>{item.kalori} kcal</Text>
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
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.4,
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
    paddingTop: 18,
    paddingBottom: 40,
  },
  ayirac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ALTIN_COK_SOLUK,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarYazi: {
    color: ALTIN,
    fontSize: 17,
    fontWeight: '400',
  },
  sonucBilgisi: {
    flex: 1,
    gap: 3,
  },
  sonucIsmi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  sonucAlt: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  sonucKalorisi: {
    color: ALTIN,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});
