import AsyncStorage from '@react-native-async-storage/async-storage';

export type SaglikIzinDurumu = 'bilinmiyor' | 'verildi' | 'reddedildi' | 'kullanilamaz';

export type SaglikGunlukVeri = {
  adim: number;
  aktifKalori: number;
  kilo: number | null;
};

export type BeslenmeYazimi = {
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
  lif: number;
};

export type SaglikSaglayici = {
  platformDestekli: boolean;
  demo: boolean;
  izinIste: () => Promise<SaglikIzinDurumu>;
  izinDurumu: () => Promise<SaglikIzinDurumu>;
  gunlukVeriGetir: () => Promise<SaglikGunlukVeri>;
  beslenmeYaz: (veri: BeslenmeYazimi) => Promise<void>;
  suYaz: (mililitre: number) => Promise<void>;
};

const DEMO_IZIN_ANAHTARI = '@minimalist_kalori/saglik_demo_izin';

const demoSaglik: SaglikSaglayici = {
  platformDestekli: true,
  demo: true,
  async izinIste() {
    await AsyncStorage.setItem(DEMO_IZIN_ANAHTARI, 'verildi');
    return 'verildi';
  },
  async izinDurumu() {
    const deger = await AsyncStorage.getItem(DEMO_IZIN_ANAHTARI);
    return deger === 'verildi' ? 'verildi' : 'bilinmiyor';
  },
  async gunlukVeriGetir() {
    const saat = new Date().getHours();
    const aktifKalori = Math.min(650, Math.max(0, Math.round((saat - 6) * 42)));
    return { adim: aktifKalori * 20, aktifKalori, kilo: null };
  },
  async beslenmeYaz() {},
  async suYaz() {},
};

export const kullanilamazSaglik: SaglikSaglayici = {
  platformDestekli: false,
  demo: false,
  async izinIste() {
    return 'kullanilamaz';
  },
  async izinDurumu() {
    return 'kullanilamaz';
  },
  async gunlukVeriGetir() {
    return { adim: 0, aktifKalori: 0, kilo: null };
  },
  async beslenmeYaz() {},
  async suYaz() {},
};

export const saglik: SaglikSaglayici = demoSaglik;
