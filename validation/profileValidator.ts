export type Cinsiyet = 'kadin' | 'erkek';

export type ValidationResult =
  | { tur: 'gecerli' }
  | { tur: 'uyari'; mesaj: string }
  | { tur: 'engel'; mesaj: string };

export type ProfilGirdisi = {
  yas: number;
  boy: number;
  kilo: number;
  hedefKilo: number;
  cinsiyet: Cinsiyet;
  hesaplananKalori: number;
};

export const YAS_ALT_SINIRI = 18;
export const BOY_ALT_SINIRI = 100;
export const BOY_UST_SINIRI = 250;
export const KILO_ALT_SINIRI = 30;
export const KILO_UST_SINIRI = 300;
export const SAGLIKLI_BMI_ALT_SINIRI = 18.5;
export const AGRESIF_HEDEF_ORANI = 0.2;
export const KALORI_TABANI_KADIN = 1200;
export const KALORI_TABANI_ERKEK = 1500;

export const YAS_ENGEL_MESAJI = 'Bu uygulama 18 yaş ve üzeri kullanıcılar içindir.';
export const BOY_ENGEL_MESAJI = `Boy ${BOY_ALT_SINIRI}-${BOY_UST_SINIRI} cm aralığında olmalıdır.`;
export const KILO_ENGEL_MESAJI = `Kilo ${KILO_ALT_SINIRI}-${KILO_UST_SINIRI} kg aralığında olmalıdır.`;
export const BMI_ENGEL_MESAJI =
  'Hedef kilon sağlıksız derecede düşük; vücut kitle indeksini 18.5 altına indiriyor. Lütfen daha güvenli bir hedef belirle.';
export const AGRESIF_HEDEF_UYARISI =
  'Hedefin oldukça iddialı görünüyor. Sağlıklı kilo verme hızı haftada 0.5 ile 1 kg arasındadır; bir diyetisyene danışmanı öneririz.';

export function kaloriTabani(cinsiyet: Cinsiyet): number {
  return cinsiyet === 'kadin' ? KALORI_TABANI_KADIN : KALORI_TABANI_ERKEK;
}

export function tabanlanmisKalori(
  kalori: number,
  cinsiyet: Cinsiyet
): { kalori: number; sabitlendi: boolean } {
  const taban = kaloriTabani(cinsiyet);
  if (kalori < taban) {
    return { kalori: taban, sabitlendi: true };
  }
  return { kalori, sabitlendi: false };
}

export function bmiHesapla(kilo: number, boyCm: number): number {
  const boyMetre = boyCm / 100;
  return kilo / (boyMetre * boyMetre);
}

export function profilDogrula(girdi: ProfilGirdisi): ValidationResult {
  const { yas, boy, kilo, hedefKilo, cinsiyet, hesaplananKalori } = girdi;

  if (yas < YAS_ALT_SINIRI) {
    return { tur: 'engel', mesaj: YAS_ENGEL_MESAJI };
  }

  if (boy < BOY_ALT_SINIRI || boy > BOY_UST_SINIRI) {
    return { tur: 'engel', mesaj: BOY_ENGEL_MESAJI };
  }

  if (kilo < KILO_ALT_SINIRI || kilo > KILO_UST_SINIRI) {
    return { tur: 'engel', mesaj: KILO_ENGEL_MESAJI };
  }

  if (bmiHesapla(hedefKilo, boy) < SAGLIKLI_BMI_ALT_SINIRI) {
    return { tur: 'engel', mesaj: BMI_ENGEL_MESAJI };
  }

  if (hedefKilo < kilo * (1 - AGRESIF_HEDEF_ORANI)) {
    return { tur: 'uyari', mesaj: AGRESIF_HEDEF_UYARISI };
  }

  const taban = kaloriTabani(cinsiyet);
  if (hesaplananKalori < taban) {
    return {
      tur: 'uyari',
      mesaj: `Hesaplanan günlük kalori güvenli alt sınırın altında kaldı; ${taban} kcal olarak sabitlendi.`,
    };
  }

  return { tur: 'gecerli' };
}
