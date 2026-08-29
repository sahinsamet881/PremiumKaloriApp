export type MakroHedefleri = {
  protein: number;
  karbonhidrat: number;
  yag: number;
};

export type Cinsiyet = 'kadin' | 'erkek';

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
};

export type Makrolar = {
  protein: number;
  karbonhidrat: number;
  yag: number;
  porsiyon: string;
};

export type Ogun = {
  id: string;
  isim: string;
  kalori: number;
  eklenmeSaati: string;
  makrolar?: Makrolar;
};

export type GecmisKaydi = {
  id: string;
  isim: string;
  kalori: number;
  makrolar?: Makrolar;
  zaman: number;
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

export type YerelUrun = {
  barkod: string;
  isim: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
  porsiyon: string;
};
