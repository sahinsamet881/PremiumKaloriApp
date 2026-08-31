import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK } from '@/constants/luxTheme';

const GENISLIK = 300;
const YUKSEKLIK = 150;
const PAD_SOL = 34;
const PAD_SAG = 10;
const PAD_UST = 14;
const PAD_ALT = 24;

export type GunlukKalori = { tarih: string; kalori: number };

type KaloriTrendProps = {
  veri: GunlukKalori[];
  hedef: number;
  baslangic?: string;
  bitis?: string;
};

export function KaloriTrend({ veri, hedef, baslangic, bitis }: KaloriTrendProps) {
  if (veri.length === 0) {
    return (
      <View style={stiller.bosAlan}>
        <Text style={stiller.bosMetin}>Bu aralıkta henüz kayıt yok.</Text>
      </View>
    );
  }

  const enYuksek = Math.max(hedef, ...veri.map((g) => g.kalori)) * 1.1 || 1;
  const cizimGenislik = GENISLIK - PAD_SOL - PAD_SAG;
  const cizimYukseklik = YUKSEKLIK - PAD_UST - PAD_ALT;
  const adim = cizimGenislik / veri.length;
  const cubukGenislik = Math.max(2, Math.min(18, adim * 0.6));

  const y = (deger: number) => PAD_UST + cizimYukseklik - (deger / enYuksek) * cizimYukseklik;
  const hedefY = hedef > 0 ? y(hedef) : null;

  return (
    <Svg width="100%" height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
      <Line
        x1={PAD_SOL}
        y1={PAD_UST + cizimYukseklik}
        x2={GENISLIK - PAD_SAG}
        y2={PAD_UST + cizimYukseklik}
        stroke={ALTIN_COK_SOLUK}
        strokeWidth={1}
      />

      {veri.map((gun, i) => {
        const yukseklik = Math.max(1, PAD_UST + cizimYukseklik - y(gun.kalori));
        return (
          <Rect
            key={gun.tarih}
            x={PAD_SOL + i * adim + (adim - cubukGenislik) / 2}
            y={y(gun.kalori)}
            width={cubukGenislik}
            height={yukseklik}
            rx={2}
            fill={ALTIN}
            opacity={0.85}
          />
        );
      })}

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
            Hedef {hedef}
          </SvgText>
        </>
      ) : null}

      <SvgText x={PAD_SOL - 6} y={PAD_UST + 4} fill={ALTIN_ORTA_SOLUK} fontSize={9} textAnchor="end">
        {Math.round(enYuksek)}
      </SvgText>
      <SvgText x={PAD_SOL} y={YUKSEKLIK - 7} fill={ALTIN_ORTA_SOLUK} fontSize={9}>
        {(baslangic ?? veri[0].tarih).slice(5)}
      </SvgText>
      <SvgText
        x={GENISLIK - PAD_SAG}
        y={YUKSEKLIK - 7}
        fill={ALTIN_ORTA_SOLUK}
        fontSize={9}
        textAnchor="end">
        {(bitis ?? veri[veri.length - 1].tarih).slice(5)}
      </SvgText>
    </Svg>
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
  },
  bosMetin: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
  },
});
