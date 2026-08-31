import AsyncStorage from '@react-native-async-storage/async-storage';

export type SatinAlmaSonucu = 'basarili' | 'iptal' | 'beklemede' | 'hata';

export type AbonelikDurumu = {
  aktif: boolean;
  denemede: boolean;
  denemeBitisMs: number | null;
};

export type PlanKimligi = 'aylik' | 'alti_aylik' | 'yillik';

export type AbonelikPlani = {
  kimlik: string;
  plan: PlanKimligi;
  baslik: string;
  donem: string;
  yenilemeAraligi: string;
  aySayisi: number;
  fiyat: number;
  fiyatMetni: string;
  rozet?: string;
};

export const DENEME_GUNU = 7;

function tlBicimle(deger: number): string {
  const yuvarli = Math.round(deger * 100) / 100;
  const tam = Math.floor(yuvarli);
  const kurus = Math.round((yuvarli - tam) * 100);
  const tamMetin = String(tam).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${tamMetin},${String(kurus).padStart(2, '0')} TL`;
}

type HamPlan = Omit<AbonelikPlani, 'fiyatMetni'>;

const HAM_PLANLAR: HamPlan[] = [
  {
    kimlik: 'com.minimalistkalori.premium.monthly',
    plan: 'aylik',
    baslik: 'Aylık',
    donem: '1 ay',
    yenilemeAraligi: 'her ay',
    aySayisi: 1,
    fiyat: 109.99,
  },
  {
    kimlik: 'com.minimalistkalori.premium.sixmonth',
    plan: 'alti_aylik',
    baslik: '6 Aylık',
    donem: '6 ay',
    yenilemeAraligi: 'her 6 ayda bir',
    aySayisi: 6,
    fiyat: 539.99,
  },
  {
    kimlik: 'com.minimalistkalori.premium.yearly',
    plan: 'yillik',
    baslik: 'Yıllık',
    donem: '12 ay',
    yenilemeAraligi: 'her yıl',
    aySayisi: 12,
    fiyat: 959.99,
    rozet: 'EN AVANTAJLI',
  },
];

export const PLANLAR: AbonelikPlani[] = HAM_PLANLAR.map((plan) => ({
  ...plan,
  fiyatMetni: tlBicimle(plan.fiyat),
}));

export const VARSAYILAN_PLAN: PlanKimligi = 'yillik';

export function planBul(kimlik: string): AbonelikPlani {
  return PLANLAR.find((plan) => plan.kimlik === kimlik) ?? PLANLAR[0];
}

export function aylikEsdeger(plan: AbonelikPlani): number {
  return plan.fiyat / plan.aySayisi;
}

export function aylikEsdegerMetni(plan: AbonelikPlani): string {
  const onEk = plan.aySayisi === 1 ? '' : '≈ ';
  return `${onEk}${tlBicimle(aylikEsdeger(plan))} / ay`;
}

export function tasarrufYuzdesi(plan: AbonelikPlani): number {
  const taban = aylikEsdeger(PLANLAR[0]);
  if (plan.aySayisi === 1 || taban <= 0) {
    return 0;
  }
  return Math.round((1 - aylikEsdeger(plan) / taban) * 100);
}

export function otomatikYenilemeMetni(plan: AbonelikPlani): string {
  return (
    `${DENEME_GUNU} günlük ücretsiz denemenin ardından ${plan.baslik} plan için ${plan.fiyatMetni} ` +
    `Apple Kimliğine tahsil edilir ve abonelik ${plan.yenilemeAraligi} ${plan.fiyatMetni} olarak otomatik yenilenir. ` +
    'Mevcut dönem bitmeden en az 24 saat önce iptal edilmezse yenileme gerçekleşir ve ücret dönem bitiminden önceki 24 saat içinde alınır. ' +
    'Aboneliğini App Store hesap ayarlarından yönetebilir veya iptal edebilirsin. ' +
    'Ücretsiz denemenin kullanılmayan kısmı, ücretli aboneliğe geçildiğinde geçersiz olur.'
  );
}

export const KULLANIM_SARTLARI_URL = 'https://minimalistkalori.app/kullanim-sartlari';

export const GIZLILIK_URL = 'https://minimalistkalori.app/gizlilik';

export type MagazaSaglayici = {
  hazir: boolean;
  demo: boolean;
  planlariGetir: () => Promise<AbonelikPlani[]>;
  satinAl: (urunKimligi: string) => Promise<SatinAlmaSonucu>;
  geriYukle: () => Promise<boolean>;
  haklariKontrolEt: () => Promise<boolean>;
  abonelikDurumu: () => Promise<AbonelikDurumu>;
};

const DEMO_ABONELIK_ANAHTARI = '@minimalist_kalori/demo_abonelik';
const DEMO_DENEME_ANAHTARI = '@minimalist_kalori/demo_deneme_bitis';

async function demoDurum(): Promise<AbonelikDurumu> {
  const [aktifStr, bitisStr] = await Promise.all([
    AsyncStorage.getItem(DEMO_ABONELIK_ANAHTARI),
    AsyncStorage.getItem(DEMO_DENEME_ANAHTARI),
  ]);
  const denemeBitisMs = bitisStr ? Number(bitisStr) : null;
  return {
    aktif: aktifStr === 'true',
    denemede: denemeBitisMs != null && denemeBitisMs > Date.now(),
    denemeBitisMs,
  };
}

const demoMagaza: MagazaSaglayici = {
  hazir: true,
  demo: true,
  async planlariGetir() {
    return PLANLAR;
  },
  async satinAl() {
    const bitis = Date.now() + DENEME_GUNU * 24 * 60 * 60 * 1000;
    await AsyncStorage.multiSet([
      [DEMO_ABONELIK_ANAHTARI, 'true'],
      [DEMO_DENEME_ANAHTARI, String(bitis)],
    ]);
    return 'basarili';
  },
  async geriYukle() {
    return (await demoDurum()).aktif;
  },
  async haklariKontrolEt() {
    return (await demoDurum()).aktif;
  },
  abonelikDurumu: demoDurum,
};

export const kullanilamazMagaza: MagazaSaglayici = {
  hazir: false,
  demo: false,
  async planlariGetir() {
    return PLANLAR;
  },
  async satinAl() {
    return 'hata';
  },
  async geriYukle() {
    return false;
  },
  async haklariKontrolEt() {
    return false;
  },
  async abonelikDurumu() {
    return { aktif: false, denemede: false, denemeBitisMs: null };
  },
};

export const magaza: MagazaSaglayici = demoMagaza;
