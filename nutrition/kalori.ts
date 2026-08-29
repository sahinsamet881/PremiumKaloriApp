import { Cinsiyet } from '@/types';

export const BMR_FORMUL_ADI = 'Mifflin-St Jeor';

export function bmrHesapla(cinsiyet: Cinsiyet, kiloKg: number, boyCm: number, yas: number): number {
  const taban = 10 * kiloKg + 6.25 * boyCm - 5 * yas;
  return cinsiyet === 'erkek' ? taban + 5 : taban - 161;
}
