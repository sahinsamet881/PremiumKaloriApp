import { OgunTuru } from '@/types';

export const OGUN_TURLERI: { tur: OgunTuru; etiket: string }[] = [
  { tur: 'kahvalti', etiket: 'Kahvaltı' },
  { tur: 'ogle', etiket: 'Öğle' },
  { tur: 'aksam', etiket: 'Akşam' },
  { tur: 'ara', etiket: 'Ara Öğün' },
];

export function ogunTuruEtiketi(tur: OgunTuru): string {
  return OGUN_TURLERI.find((secenek) => secenek.tur === tur)?.etiket ?? 'Öğün';
}

export function ogunTuruGecerliMi(deger: string | undefined): deger is OgunTuru {
  return OGUN_TURLERI.some((secenek) => secenek.tur === deger);
}

export function ogunTuruSaattenTuret(eklenmeSaati: string): OgunTuru {
  const dilim = parseInt(eklenmeSaati.split(':')[0], 10);
  if (Number.isNaN(dilim)) {
    return 'ara';
  }
  if (dilim >= 5 && dilim < 11) {
    return 'kahvalti';
  }
  if (dilim >= 11 && dilim < 15) {
    return 'ogle';
  }
  if (dilim >= 15 && dilim < 18) {
    return 'ara';
  }
  return 'aksam';
}

export function ogunTuruCoz(ogun: { ogunTuru?: OgunTuru; eklenmeSaati: string }): OgunTuru {
  return ogun.ogunTuru ?? ogunTuruSaattenTuret(ogun.eklenmeSaati);
}

export function suAnkiOgunTuru(): OgunTuru {
  const simdi = new Date();
  return ogunTuruSaattenTuret(`${String(simdi.getHours()).padStart(2, '0')}:00`);
}
