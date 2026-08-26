import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';
import { KullaniciVerisi, Ogun } from '@/types';

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
  hizliKaloriEkle: (kalori: number, isim: string) => void;
  ogunSil: (id: string) => void;
};

const VARSAYILAN_OGUN_ISMI = 'Hızlı Öğün';

const DataContext = createContext<VeriBaglami | null>(null);

const BASLANGIC_OGUNLERI: Ogun[] = [
  { id: '1', isim: 'Yulaf Ezmesi', kalori: 320, eklenmeSaati: '08:15' },
  { id: '2', isim: 'Tavuklu Salata', kalori: 480, eklenmeSaati: '13:00' },
  { id: '3', isim: '1 Fincan Kahve', kalori: 50, eklenmeSaati: '15:40' },
];

const BASLANGIC_KULLANICISI: KullaniciVerisi = {
  gunlukHedefKalori: 2500,
  bugunAlinanKalori: BASLANGIC_OGUNLERI.reduce((toplam, ogun) => toplam + ogun.kalori, 0),
  seriGunu: 0,
  sonGirisTarihi: '',
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<KullaniciVerisi>(BASLANGIC_KULLANICISI);
  const [ogunler, setOgunler] = useState<Ogun[]>(BASLANGIC_OGUNLERI);
  const { hatirlaticiKur } = useNotifications();

  useEffect(() => {
    const bugun = bugununTarihiUret();
    let ogunleriTemizle = false;

    setKullanici((onceki) => {
      if (!onceki.sonGirisTarihi) {
        return { ...onceki, sonGirisTarihi: bugun };
      }

      const fark = gunFarkiHesapla(onceki.sonGirisTarihi, bugun);

      if (fark <= 0) {
        return onceki;
      }

      ogunleriTemizle = true;

      return {
        ...onceki,
        bugunAlinanKalori: 0,
        seriGunu: fark === 1 ? onceki.seriGunu + 1 : 0,
        sonGirisTarihi: bugun,
      };
    });

    if (ogunleriTemizle) {
      setOgunler([]);
    }
  }, []);

  const hizliKaloriEkle = useCallback(
    (kalori: number, isim: string) => {
      const simdi = new Date();
      const saat = String(simdi.getHours()).padStart(2, '0');
      const dakika = String(simdi.getMinutes()).padStart(2, '0');
      const nihaiIsim = isim.trim().length > 0 ? isim.trim() : VARSAYILAN_OGUN_ISMI;

      const yeniOgun: Ogun = {
        id: String(simdi.getTime()),
        isim: nihaiIsim,
        kalori,
        eklenmeSaati: `${saat}:${dakika}`,
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
    () => ({ kullanici, ogunler, hizliKaloriEkle, ogunSil }),
    [kullanici, ogunler, hizliKaloriEkle, ogunSil]
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
