import { KiloKaydi } from '@/types';

export function siraliKayitlar(kayitlar: KiloKaydi[]): KiloKaydi[] {
  return [...kayitlar].sort((a, b) => a.tarih.localeCompare(b.tarih));
}

function gunFarki(tarih1: string, tarih2: string): number {
  const bir = new Date(`${tarih1}T00:00:00`).getTime();
  const iki = new Date(`${tarih2}T00:00:00`).getTime();
  return (iki - bir) / (1000 * 60 * 60 * 24);
}

export function gunlukHiz(kayitlar: KiloKaydi[]): number {
  const sirali = siraliKayitlar(kayitlar);
  if (sirali.length < 2) {
    return 0;
  }
  const ilk = sirali[0].tarih;
  const xs = sirali.map((kayit) => gunFarki(ilk, kayit.tarih));
  const ys = sirali.map((kayit) => kayit.kilo);
  const n = xs.length;
  const toplamX = xs.reduce((a, b) => a + b, 0);
  const toplamY = ys.reduce((a, b) => a + b, 0);
  const toplamXX = xs.reduce((a, b) => a + b * b, 0);
  const toplamXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const payda = n * toplamXX - toplamX * toplamX;
  if (payda === 0) {
    return 0;
  }
  return (n * toplamXY - toplamX * toplamY) / payda;
}

export function haftalikHiz(kayitlar: KiloKaydi[]): number {
  return gunlukHiz(kayitlar) * 7;
}

export function sonKayitlar(kayitlar: KiloKaydi[], gun: number): KiloKaydi[] {
  const sirali = siraliKayitlar(kayitlar);
  if (sirali.length === 0) {
    return [];
  }
  const sonTarih = sirali[sirali.length - 1].tarih;
  return sirali.filter((kayit) => gunFarki(kayit.tarih, sonTarih) <= gun);
}

export type HedefTahmini = {
  guncelKilo: number;
  kalanKg: number;
  dogruYonde: boolean;
  tahminiHafta: number | null;
};

export function hedefTahmini(kayitlar: KiloKaydi[], hedefKilo: number): HedefTahmini | null {
  const sirali = siraliKayitlar(kayitlar);
  if (sirali.length === 0) {
    return null;
  }
  const guncelKilo = sirali[sirali.length - 1].kilo;
  const kalanKg = Math.abs(guncelKilo - hedefKilo);
  const gerekliYon = hedefKilo < guncelKilo ? -1 : hedefKilo > guncelKilo ? 1 : 0;

  if (gerekliYon === 0 || kalanKg < 0.05) {
    return { guncelKilo, kalanKg: 0, dogruYonde: true, tahminiHafta: 0 };
  }

  const hiz = gunlukHiz(kayitlar);
  const dogruYonde = Math.sign(hiz) === gerekliYon && Math.abs(hiz) > 0.0015;
  if (!dogruYonde) {
    return { guncelKilo, kalanKg, dogruYonde: false, tahminiHafta: null };
  }

  return { guncelKilo, kalanKg, dogruYonde: true, tahminiHafta: kalanKg / Math.abs(hiz) / 7 };
}
