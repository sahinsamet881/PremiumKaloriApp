import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';
import { KullaniciVerisi, Makrolar, Ogun, ProfilBilgisi } from '@/types';

const KULLANICI_ANAHTARI = '@minimalist_kalori/kullanici';

const MS_CINSINDEN_GUN = 1000 * 60 * 60 * 24;

function bugununTarihiUret() {
  const simdi = new Date();
  const yil = simdi.getFullYear();
  const ay = String(simdi.getMonth() + 1).padStart(2, '0');
  const gun = String(simdi.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

function tarihiGuneCevir(tarih: string) {
  const [yil, ay, gun] = tarih.split('-').map(Number);
  return new Date(yil, ay - 1, gun);
}

function gunFarkiHesapla(eskiTarih: string, yeniTarih: string) {
  const fark = tarihiGuneCevir(yeniTarih).getTime() - tarihiGuneCevir(eskiTarih).getTime();
  return Math.round(fark / MS_CINSINDEN_GUN);
}

type VeriBaglami = {
  kullanici: KullaniciVerisi;
  ogunler: Ogun[];
  onboardingTamamlandi: boolean | null;
  hizliKaloriEkle: (kalori: number, isim: string, makrolar?: Makrolar) => void;
  ogunSil: (id: string) => void;
  profilKaydet: (profil: ProfilBilgisi) => void;
  profilSifirla: () => void;
};

const VARSAYILAN_OGUN_ISMI = 'Hızlı Öğün';

const DataContext = createContext<VeriBaglami | null>(null);

const BASLANGIC_OGUNLERI: Ogun[] = [
  { id: '1', isim: 'Yulaf Ezmesi', kalori: 320, eklenmeSaati: '08:15' },
  { id: '2', isim: 'Tavuklu Salata', kalori: 480, eklenmeSaati: '13:00' },
  { id: '3', isim: '1 Fincan Kahve', kalori: 50, eklenmeSaati: '15:40' },
];

const BASLANGIC_KULLANICISI: KullaniciVerisi = {
  isim: '',
  yas: 0,
  boy: 0,
  kilo: 0,
  hedefKilo: 0,
  gunlukHedefKalori: 2500,
  bugunAlinanKalori: BASLANGIC_OGUNLERI.reduce((toplam, ogun) => toplam + ogun.kalori, 0),
  seriGunu: 0,
  sonGirisTarihi: '',
  makroHedefleri: { protein: 150, karbonhidrat: 275, yag: 80 },
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<KullaniciVerisi>(BASLANGIC_KULLANICISI);
  const [ogunler, setOgunler] = useState<Ogun[]>(BASLANGIC_OGUNLERI);
  const [onboardingTamamlandi, setOnboardingTamamlandi] = useState<boolean | null>(null);
  const { hatirlaticiKur } = useNotifications();

  useEffect(() => {
    const baslangicYukle = async () => {
      const kayitliJson = await AsyncStorage.getItem(KULLANICI_ANAHTARI);
      const bugun = bugununTarihiUret();

      if (!kayitliJson) {
        setKullanici((onceki) => ({ ...onceki, sonGirisTarihi: bugun }));
        setOnboardingTamamlandi(false);
        return;
      }

      const kayitliKullanici: KullaniciVerisi = JSON.parse(kayitliJson);

      if (!kayitliKullanici.sonGirisTarihi) {
        setKullanici({ ...kayitliKullanici, sonGirisTarihi: bugun });
        setOnboardingTamamlandi(true);
        return;
      }

      const fark = gunFarkiHesapla(kayitliKullanici.sonGirisTarihi, bugun);

      if (fark <= 0) {
        setKullanici(kayitliKullanici);
        setOnboardingTamamlandi(true);
        return;
      }

      setKullanici({
        ...kayitliKullanici,
        bugunAlinanKalori: 0,
        seriGunu: fark === 1 ? kayitliKullanici.seriGunu + 1 : 0,
        sonGirisTarihi: bugun,
      });
      setOgunler([]);
      setOnboardingTamamlandi(true);
    };

    baslangicYukle();
  }, []);

  const profilKaydet = useCallback((profil: ProfilBilgisi) => {
    setKullanici((onceki) => {
      const guncellenmis: KullaniciVerisi = { ...onceki, ...profil };
      AsyncStorage.setItem(KULLANICI_ANAHTARI, JSON.stringify(guncellenmis));
      return guncellenmis;
    });
    setOnboardingTamamlandi(true);
  }, []);

  const profilSifirla = useCallback(() => {
    AsyncStorage.removeItem(KULLANICI_ANAHTARI);
    setKullanici(BASLANGIC_KULLANICISI);
    setOgunler(BASLANGIC_OGUNLERI);
    setOnboardingTamamlandi(false);
  }, []);

  const hizliKaloriEkle = useCallback(
    (kalori: number, isim: string, makrolar?: Makrolar) => {
      const simdi = new Date();
      const saat = String(simdi.getHours()).padStart(2, '0');
      const dakika = String(simdi.getMinutes()).padStart(2, '0');
      const nihaiIsim = isim.trim().length > 0 ? isim.trim() : VARSAYILAN_OGUN_ISMI;

      const yeniOgun: Ogun = {
        id: String(simdi.getTime()),
        isim: nihaiIsim,
        kalori,
        eklenmeSaati: `${saat}:${dakika}`,
        makrolar,
      };

      setOgunler((oncekiler) => [...oncekiler, yeniOgun]);
      setKullanici((onceki) => ({
        ...onceki,
        bugunAlinanKalori: onceki.bugunAlinanKalori + kalori,
      }));
      hatirlaticiKur();
    },
    [hatirlaticiKur]
  );

  const ogunSil = useCallback(
    (id: string) => {
      const silinecekOgun = ogunler.find((ogun) => ogun.id === id);
      if (!silinecekOgun) {
        return;
      }

      setOgunler((oncekiler) => oncekiler.filter((ogun) => ogun.id !== id));
      setKullanici((onceki) => ({
        ...onceki,
        bugunAlinanKalori: onceki.bugunAlinanKalori - silinecekOgun.kalori,
      }));
    },
    [ogunler]
  );

  const value = useMemo<VeriBaglami>(
    () => ({
      kullanici,
      ogunler,
      onboardingTamamlandi,
      hizliKaloriEkle,
      ogunSil,
      profilKaydet,
      profilSifirla,
    }),
    [
      kullanici,
      ogunler,
      onboardingTamamlandi,
      hizliKaloriEkle,
      ogunSil,
      profilKaydet,
      profilSifirla,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useVeri() {
  const baglam = useContext(DataContext);
  if (!baglam) {
    throw new Error('useVeri, DataProvider içinde kullanılmalı');
  }
  return baglam;
}
