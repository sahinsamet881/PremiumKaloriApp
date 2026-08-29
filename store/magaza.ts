import AsyncStorage from '@react-native-async-storage/async-storage';

export type AbonelikUrunu = {
  kimlik: string;
  baslik: string;
  fiyatMetni: string;
  donem: string;
  denemeGunu: number;
  aylikYaklasik: string;
};

export type SatinAlmaSonucu = 'basarili' | 'iptal' | 'beklemede' | 'hata';

export type AbonelikDurumu = {
  aktif: boolean;
  denemede: boolean;
  denemeBitisMs: number | null;
};

export type MagazaSaglayici = {
  hazir: boolean;
  demo: boolean;
  urunGetir: () => Promise<AbonelikUrunu>;
  satinAl: (urunKimligi: string) => Promise<SatinAlmaSonucu>;
  geriYukle: () => Promise<boolean>;
  haklariKontrolEt: () => Promise<boolean>;
  abonelikDurumu: () => Promise<AbonelikDurumu>;
};

export const PREMIUM_URUN: AbonelikUrunu = {
  kimlik: 'com.minimalistkalori.premium.3ay',
  baslik: 'Premium — 3 Aylık',
  fiyatMetni: '359,99 TL',
  donem: '3 ay',
  denemeGunu: 4,
  aylikYaklasik: '≈ 120 TL / ay',
};

export const OTOMATIK_YENILEME_METNI =
  'Ödemesi onaylandığında abonelik Apple Kimliğine tanımlanır. Mevcut dönem bitmeden en az 24 saat önce kapatılmazsa otomatik olarak yenilenir ve dönem bitiminden önceki 24 saat içinde ücretlendirilir. Aboneliğini satın aldıktan sonra App Store hesap ayarlarından yönetebilir veya iptal edebilirsin. Ücretsiz deneme süresinin kullanılmayan kısmı, abonelik satın alındığında geçersiz olur.';

export const KULLANIM_SARTLARI_URL = 'https://minimalistkalori.app/kullanim-sartlari';

export const GIZLILIK_URL = 'https://minimalistkalori.app/gizlilik';

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
  async urunGetir() {
    return PREMIUM_URUN;
  },
  async satinAl() {
    const bitis = Date.now() + PREMIUM_URUN.denemeGunu * 24 * 60 * 60 * 1000;
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
  async urunGetir() {
    return PREMIUM_URUN;
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
