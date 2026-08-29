import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK } from '@/constants/luxTheme';
import { KiloKaydi } from '@/types';
import { siraliKayitlar } from '@/nutrition/kilo';

const GENISLIK = 300;
const YUKSEKLIK = 150;
const PAD_SOL = 34;
const PAD_SAG = 12;
const PAD_UST = 14;
const PAD_ALT = 22;

type KiloGrafikProps = {
  kayitlar: KiloKaydi[];
  hedefKilo: number;
};

export function KiloGrafik({ kayitlar, hedefKilo }: KiloGrafikProps) {
  const sirali = siraliKayitlar(kayitlar);

  if (sirali.length < 2) {
    return (
      <View style={stiller.bosAlan}>
        <Text style={stiller.bosMetin}>
          Trend grafiği için en az iki kilo kaydı gir.
        </Text>
      </View>
    );
  }

  const kilolar = sirali.map((k) => k.kilo);
  const hedefDahil = hedefKilo > 0 ? [...kilolar, hedefKilo] : kilolar;
  let altSinir = Math.min(...hedefDahil);
  let ustSinir = Math.max(...hedefDahil);
  if (ustSinir - altSinir < 2) {
    altSinir -= 1;
    ustSinir += 1;
  }
  const tampon = (ustSinir - altSinir) * 0.12;
  altSinir -= tampon;
  ustSinir += tampon;

  const cizimGenislik = GENISLIK - PAD_SOL - PAD_SAG;
  const cizimYukseklik = YUKSEKLIK - PAD_UST - PAD_ALT;

  const x = (i: number) => PAD_SOL + (sirali.length === 1 ? 0 : (i / (sirali.length - 1)) * cizimGenislik);
  const y = (deger: number) =>
    PAD_UST + cizimYukseklik - ((deger - altSinir) / (ustSinir - altSinir)) * cizimYukseklik;

  const noktalar = sirali.map((k, i) => `${x(i)},${y(k.kilo)}`).join(' ');
  const hedefY = hedefKilo > 0 ? y(hedefKilo) : null;

  return (
    <View>
      <Svg width="100%" height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
        <Line
          x1={PAD_SOL}
          y1={PAD_UST}
          x2={PAD_SOL}
          y2={PAD_UST + cizimYukseklik}
          stroke={ALTIN_COK_SOLUK}
          strokeWidth={1}
        />
        <Line
          x1={PAD_SOL}
          y1={PAD_UST + cizimYukseklik}
          x2={GENISLIK - PAD_SAG}
          y2={PAD_UST + cizimYukseklik}
          stroke={ALTIN_COK_SOLUK}
          strokeWidth={1}
        />

        {hedefY !== null ? (
          <>
            <Line
              x1={PAD_SOL}
              y1={hedefY}
              x2={GENISLIK - PAD_SAG}
              y2={hedefY}
              stroke={ALTIN_ORTA_SOLUK}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText x={GENISLIK - PAD_SAG} y={hedefY - 4} fill={ALTIN_ORTA_SOLUK} fontSize={9} textAnchor="end">
              Hedef {hedefKilo}
            </SvgText>
          </>
        ) : null}

        <Polyline points={noktalar} fill="none" stroke={ALTIN} strokeWidth={2} strokeLinejoin="round" />

        {sirali.map((k, i) => (
          <Circle key={k.id} cx={x(i)} cy={y(k.kilo)} r={2.6} fill={ALTIN} />
        ))}

        <SvgText x={PAD_SOL - 6} y={PAD_UST + 4} fill={ALTIN_ORTA_SOLUK} fontSize={9} textAnchor="end">
          {ustSinir.toFixed(1)}
        </SvgText>
        <SvgText
          x={PAD_SOL - 6}
          y={PAD_UST + cizimYukseklik}
          fill={ALTIN_ORTA_SOLUK}
          fontSize={9}
          textAnchor="end">
          {altSinir.toFixed(1)}
        </SvgText>
        <SvgText x={PAD_SOL} y={YUKSEKLIK - 6} fill={ALTIN_ORTA_SOLUK} fontSize={9}>
          {sirali[0].tarih.slice(5)}
        </SvgText>
        <SvgText x={GENISLIK - PAD_SAG} y={YUKSEKLIK - 6} fill={ALTIN_ORTA_SOLUK} fontSize={9} textAnchor="end">
          {sirali[sirali.length - 1].tarih.slice(5)}
        </SvgText>
      </Svg>
    </View>
  );
}

const stiller = StyleSheet.create({
  bosAlan: {
    height: YUKSEKLIK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    borderRadius: 14,
    paddingHorizontal: 24,
  },
  bosMetin: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 19,
  },
});
