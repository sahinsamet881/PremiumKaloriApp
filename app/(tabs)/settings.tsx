import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { AKSAN_PALETLERI, AksanRengiAdi } from '@/constants/theme';
import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { useAksanRenk } from '@/context/ThemeContext';

const AKSAN_SIRASI: AksanRengiAdi[] = ['mavi', 'kirmizi', 'turuncu', 'yesil'];

type ProfilKartiProps = {
  etiket: string;
  deger: string;
  genis?: boolean;
  vurgulu?: boolean;
};

function ProfilKarti({ etiket, deger, genis, vurgulu }: ProfilKartiProps) {
  return (
    <View style={[stiller.profilKarti, genis ? stiller.profilKartiGenis : stiller.profilKartiYari]}>
      <Text style={stiller.profilKartiEtiket}>{etiket}</Text>
      <Text style={[stiller.profilKartiDeger, vurgulu ? stiller.profilKartiDegerVurgulu : null]}>
        {deger}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { aksanAdi, aksanSec } = useAksanRenk();
  const { kullanici } = useVeri();

  const isim = kullanici.isim.trim().length > 0 ? kullanici.isim.trim() : '—';

  return (
    <ScrollView style={stiller.container} contentContainerStyle={stiller.icerik}>
      <StatusBar style="light" />
      <Text style={stiller.baslik}>Ayarlar</Text>

      <Text style={stiller.bolumBasligi}>Profilim</Text>
      <View style={stiller.profilIzgarasi}>
        <ProfilKarti etiket="İsim" deger={isim} genis />
        <ProfilKarti etiket="Yaş" deger={`${kullanici.yas}`} />
        <ProfilKarti etiket="Boy" deger={`${kullanici.boy} cm`} />
        <ProfilKarti etiket="Kilo" deger={`${kullanici.kilo} kg`} />
        <ProfilKarti etiket="Hedef Kilo" deger={`${kullanici.hedefKilo} kg`} />
        <ProfilKarti
          etiket="Günlük Kalori İhtiyacı"
          deger={`${kullanici.gunlukHedefKalori} kcal`}
          genis
          vurgulu
        />
      </View>

      <Text style={stiller.bolumBasligi}>Vurgu Rengi</Text>
      <View style={stiller.renkSirasi}>
        {AKSAN_SIRASI.map((secenek) => {
          const secili = secenek === aksanAdi;
          return (
            <Pressable
              key={secenek}
              onPress={() => aksanSec(secenek)}
              accessibilityRole="button"
              accessibilityLabel={secenek}
              accessibilityState={{ selected: secili }}
              style={({ pressed }) => [
                stiller.renkDugmesi,
                { backgroundColor: AKSAN_PALETLERI[secenek].orta },
                secili ? stiller.renkDugmesiSecili : null,
                pressed ? stiller.renkDugmesiBasili : null,
              ]}>
              {secili ? <IconSymbol name="checkmark" size={20} color={SIYAH} /> : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const stiller = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  icerik: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  baslik: {
    color: ALTIN,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1.5,
    marginBottom: 32,
  },
  bolumBasligi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  profilIzgarasi: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  profilKarti: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(10,11,16,0.6)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  profilKartiGenis: {
    width: '100%',
  },
  profilKartiYari: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  profilKartiEtiket: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  profilKartiDeger: {
    color: ALTIN,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  profilKartiDegerVurgulu: {
    fontSize: 26,
  },
  renkSirasi: {
    flexDirection: 'row',
    gap: 20,
  },
  renkDugmesi: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
  },
  renkDugmesiSecili: {
    borderColor: ALTIN,
    borderWidth: 2,
  },
  renkDugmesiBasili: {
    opacity: 0.7,
  },
});
