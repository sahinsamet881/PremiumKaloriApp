export type MakroHedefleri = {
  protein: number;
  karbonhidrat: number;
  yag: number;
};

export type KullaniciVerisi = {
  isim: string;
  yas: number;
  boy: number;
  kilo: number;
  hedefKilo: number;
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
