import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';

export type PorsiyonBirimi = 'gram' | 'adet' | 'porsiyon' | 'dilim' | 'kasik' | 'bardak';

export const PORSIYON_BIRIMLERI: { id: PorsiyonBirimi; etiket: string; gram: number }[] = [
  { id: 'gram', etiket: 'Gram', gram: 1 },
  { id: 'adet', etiket: 'Adet', gram: 100 },
  { id: 'porsiyon', etiket: 'Porsiyon', gram: 250 },
  { id: 'dilim', etiket: 'Dilim', gram: 30 },
  { id: 'kasik', etiket: 'Kaşık', gram: 15 },
  { id: 'bardak', etiket: 'Bardak', gram: 200 },
];

export function birimGram(id: PorsiyonBirimi): number {
  return PORSIYON_BIRIMLERI.find((b) => b.id === id)?.gram ?? 1;
}

export function porsiyonEtiketi(birim: PorsiyonBirimi, miktar: number): string {
  const etiket = PORSIYON_BIRIMLERI.find((b) => b.id === birim)?.etiket ?? 'Porsiyon';
  const sayi = Number.isInteger(miktar) ? String(miktar) : String(Math.round(miktar * 10) / 10);
  return `${sayi} ${etiket}`;
}

export function porsiyonAyikla(metin: string): { birim: PorsiyonBirimi; miktar: number } {
  const kucuk = (metin ?? '').toLocaleLowerCase('tr-TR');
  const sayiEsl = kucuk.match(/[\d.,]+/);
  const miktar = sayiEsl ? Number(sayiEsl[0].replace(',', '.')) || 1 : 1;
  const bulunan = PORSIYON_BIRIMLERI.find((b) =>
    kucuk.includes(b.etiket.toLocaleLowerCase('tr-TR'))
  );
  return { birim: bulunan?.id ?? 'porsiyon', miktar };
}

type PorsiyonSeciciProps = {
  birim: PorsiyonBirimi;
  miktar: string;
  onBirim: (birim: PorsiyonBirimi) => void;
  onMiktar: (miktar: string) => void;
};

export function PorsiyonSecici({ birim, miktar, onBirim, onMiktar }: PorsiyonSeciciProps) {
  const adim = birim === 'gram' ? 10 : 1;

  const azalt = () => onMiktar(String(Math.max(0, (Number(miktar) || 0) - adim)));
  const artir = () => onMiktar(String((Number(miktar) || 0) + adim));

  return (
    <View style={stiller.kok}>
      <Text style={stiller.baslik}>Porsiyon</Text>
      <View style={stiller.cipSatiri}>
        {PORSIYON_BIRIMLERI.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => onBirim(b.id)}
            style={[stiller.cip, birim === b.id ? stiller.cipAktif : null]}>
            <Text style={[stiller.cipYazi, birim === b.id ? stiller.cipYaziAktif : null]}>
              {b.etiket}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={stiller.miktarSatiri}>
        <Pressable onPress={azalt} style={stiller.adimButonu}>
          <Text style={stiller.adimYazi}>−</Text>
        </Pressable>
        <TextInput
          value={miktar}
          onChangeText={(t) => onMiktar(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          style={stiller.miktarGiris}
          selectionColor={ALTIN}
        />
        <Pressable onPress={artir} style={stiller.adimButonu}>
          <Text style={stiller.adimYazi}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kok: {
    gap: 12,
  },
  baslik: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cipSatiri: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cip: {
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: SIYAH,
  },
  cipAktif: {
    borderColor: ALTIN,
    backgroundColor: 'rgba(232, 195, 124, 0.14)',
  },
  cipYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  cipYaziAktif: {
    color: ALTIN,
  },
  miktarSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adimButonu: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ALTIN_SOLUK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adimYazi: {
    color: ALTIN,
    fontSize: 22,
    fontWeight: '300',
    marginTop: -2,
  },
  miktarGiris: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    backgroundColor: SIYAH,
    color: ALTIN,
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
  },
});
