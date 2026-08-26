import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';
import { KullaniciVerisi, Ogun } from '@/types';

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
