export type MakroHedefleri = {
  protein: number;
  karbonhidrat: number;
  yag: number;
};

export type Cinsiyet = 'kadin' | 'erkek';

export type OgunTuru = 'kahvalti' | 'ogle' | 'aksam' | 'ara';

export type KullaniciVerisi = {
  isim: string;
  yas: number;
  boy: number;
  kilo: number;
  hedefKilo: number;
  cinsiyet: Cinsiyet;
  gunlukHedefKalori: number;
  bugunAlinanKalori: number;
  seriGunu: number;
  sonGirisTarihi: string;
  makroHedefleri: MakroHedefleri;
  suHedefiMl: number;
  suBardakMl: number;
};

export type ProfilBilgisi = {
  isim: string;
  yas: number;
  boy: number;
  kilo: number;
  hedefKilo: number;
  cinsiyet: Cinsiyet;
  gunlukHedefKalori: number;
  makroHedefleri: MakroHedefleri;
  suHedefiMl?: number;
  suBardakMl?: number;
};

export type Makrolar = {
  protein: number;
  karbonhidrat: number;
  yag: number;
  /** Lif (gram). Eski kayıtlarda bulunmayabilir; okurken `?? 0` ile ele al. */
  lif?: number;
  porsiyon: string;
};

export type Ogun = {
  id: string;
  isim: string;
  kalori: number;
  eklenmeSaati: string;
  makrolar?: Makrolar;
  ogunTuru?: OgunTuru;
};

export type GecmisKaydi = {
  id: string;
  isim: string;
  kalori: number;
  makrolar?: Makrolar;
  zaman: number;
  ogunTuru?: OgunTuru;
};

export type Favori = {
  isim: string;
  kalori: number;
  makrolar?: Makrolar;
};

export type SikKullanim = GecmisKaydi & { sayi: number };

export type KiloKaydi = {
  id: string;
  tarih: string;
  kilo: number;
  not?: string;
};

export type SuKaydi = {
  tarih: string;
  mililitre: number;
};

export type YerelUrun = {
  barkod: string;
  isim: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
  /** Lif (gram). Eski kayıtlarda bulunmayabilir. */
  lif?: number;
  porsiyon: string;
};
