import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, SIYAH } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';

type MakroSatiriProps = {
  etiket: string;
  yuzde: number;
};

function MakroSatiri({ etiket, yuzde }: MakroSatiriProps) {
  return (
    <View style={stiller.makroSatiri}>
      <View style={stiller.makroUstSatir}>
        <Text style={stiller.makroEtiket}>{etiket}</Text>
        <Text style={stiller.makroYuzde}>{`%${yuzde}`}</Text>
      </View>
      <View style={stiller.makroCubukArkaPlan}>
        <View style={[stiller.makroCubukDolu, { width: `${yuzde}%` }]} />
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const { kullanici } = useVeri();

  const proteinKalori = kullanici.makroHedefleri.protein * 4;
  const karbKalori = kullanici.makroHedefleri.karbonhidrat * 4;
  const yagKalori = kullanici.makroHedefleri.yag * 9;
  const toplamKalori = proteinKalori + karbKalori + yagKalori || 1;

  const proteinYuzde = Math.round((proteinKalori / toplamKalori) * 100);
  const karbYuzde = Math.round((karbKalori / toplamKalori) * 100);
  const yagYuzde = Math.max(0, 100 - proteinYuzde - karbYuzde);

  return (
    <View style={stiller.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        <Text style={stiller.baslik}>Analiz</Text>

        <View style={stiller.kart}>
          <Text style={stiller.kartBasligi}>Haftalık İlerleme</Text>
          <View style={stiller.grafikAlani}>
            <Svg width="100%" height="100%" viewBox="0 0 300 120">
              <Path
                d="M0,95 C35,30 65,110 100,65 C135,20 165,105 200,55 C230,15 265,80 300,45"
                stroke={ALTIN}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={stiller.grafikNotu}>Veriler yeterince birikince burada canlanacak.</Text>
        </View>

        <View style={stiller.kart}>
          <Text style={stiller.kartBasligi}>Makro Dağılımı</Text>
          <MakroSatiri etiket="Protein" yuzde={proteinYuzde} />
          <MakroSatiri etiket="Karbonhidrat" yuzde={karbYuzde} />
          <MakroSatiri etiket="Yağ" yuzde={yagYuzde} />
        </View>
      </ScrollView>
    </View>
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
    fontFamily: 'StoriesGrand',
    fontSize: 34,
    letterSpacing: 1,
    marginBottom: 28,
  },
  kart: {
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: 'rgba(10,11,16,0.6)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  kartBasligi: {
    color: ALTIN,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  grafikAlani: {
    height: 120,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 14,
    overflow: 'hidden',
  },
  grafikNotu: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  makroSatiri: {
    marginBottom: 14,
  },
  makroUstSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  makroEtiket: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  makroYuzde: {
    color: ALTIN,
    fontSize: 14,
    fontWeight: '400',
  },
  makroCubukArkaPlan: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ALTIN_COK_SOLUK,
    overflow: 'hidden',
  },
  makroCubukDolu: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ALTIN,
  },
});
