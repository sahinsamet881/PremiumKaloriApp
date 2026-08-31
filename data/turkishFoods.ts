import hamVeri from './turkish-foods.json';

export type TurkYemekKategorisi =
  | 'corba'
  | 'ana-yemek'
  | 'hamur-isi'
  | 'kahvaltilik'
  | 'tatli'
  | 'icecek';

export type TurkYemek = {
  id: string;
  isim: string;
  aramaAdlari: string[];
  kategori: TurkYemekKategorisi;
  porsiyonAdi: string;
  porsiyonGram: number;
  kalori100: number;
  protein100: number;
  karb100: number;
  yag100: number;
  /**
   * Lif (100 g başına, gram). Şema alanı; mevcut seed kayıtlarında henüz
   * doldurulmadığı için opsiyonel. Okurken `?? 0` ile ele al. Tam veri
   * geldiğinde zorunluya çevir ve TURK_YEMEK_VERI_VERSIYONU'nu artır.
   */
  lif100?: number;
};

export const TURK_YEMEK_VERI_VERSIYONU = 1;

export const TURK_YEMEKLERI_SEED: TurkYemek[] = hamVeri as TurkYemek[];

const HARF_ESLEME: Record<string, string> = {
  ç: 'c',
  ş: 's',
  ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

export function turkceNormalize(metin: string): string {
  return (metin ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çşğıİöüâîû]/g, (harf) => HARF_ESLEME[harf] ?? harf)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function yemekAra(sorgu: string, kaynak: TurkYemek[] = TURK_YEMEKLERI_SEED): TurkYemek[] {
  const aranan = turkceNormalize(sorgu);
  if (aranan.length === 0) {
    return [];
  }
  return kaynak.filter((yemek) => {
    if (turkceNormalize(yemek.isim).includes(aranan)) {
      return true;
    }
    return yemek.aramaAdlari.some((ad) => turkceNormalize(ad).includes(aranan));
  });
}
