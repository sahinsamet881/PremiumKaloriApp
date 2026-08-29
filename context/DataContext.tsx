import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';
import {
  Favori,
  GecmisKaydi,
  KullaniciVerisi,
  Makrolar,
  Ogun,
  ProfilBilgisi,
  SikKullanim,
} from '@/types';

const KULLANICI_ANAHTARI = '@minimalist_kalori/kullanici';

const GIRIS_ANAHTARI = 'isLoggedIn';

const GECMIS_ANAHTARI = '@minimalist_kalori/ogun_gecmisi';

const FAVORI_ANAHTARI = '@minimalist_kalori/favoriler';

const MS_CINSINDEN_GUN = 1000 * 60 * 60 * 24;

const GECMIS_SAKLAMA_GUN = 45;

const SIK_KULLANIM_PENCERE_GUN = 30;

function normalizeIsim(isim: string) {
  return isim.trim().toLocaleLowerCase('tr-TR');
}

function saatDamgasi() {
  const simdi = new Date();
  const saat = String(simdi.getHours()).padStart(2, '0');
  const dakika = String(simdi.getMinutes()).padStart(2, '0');
  return `${saat}:${dakika}`;
}

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
  girisYapildi: boolean | null;
  hizliKaloriEkle: (kalori: number, isim: string, makrolar?: Makrolar) => void;
  ogunGuncelle: (
    id: string,
    guncelleme: { isim: string; kalori: number; makrolar?: Makrolar }
  ) => void;
  ogunKopyala: (id: string) => void;
  ogunSil: (id: string) => void;
  sikKullanilanlar: SikKullanim[];
  favoriler: Favori[];
  favoriMi: (isim: string) => boolean;
  favoriToggle: (isim: string, kalori: number, makrolar?: Makrolar) => void;
  dunuKopyala: () => number;
  profilKaydet: (profil: ProfilBilgisi) => void;
  profilSifirla: () => void;
  girisYap: () => void;
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
  cinsiyet: 'kadin',
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
  const [girisYapildi, setGirisYapildi] = useState<boolean | null>(null);
  const [ogunGecmisi, setOgunGecmisi] = useState<GecmisKaydi[]>([]);
  const [favoriler, setFavoriler] = useState<Favori[]>([]);
  const { hatirlaticiKur } = useNotifications();

  useEffect(() => {
    const baslangicYukle = async () => {
      const kayitliJson = await AsyncStorage.getItem(KULLANICI_ANAHTARI);
      const girisDurumu = await AsyncStorage.getItem(GIRIS_ANAHTARI);
      setGirisYapildi(girisDurumu === 'true');

      const gecmisJson = await AsyncStorage.getItem(GECMIS_ANAHTARI);
      if (gecmisJson) {
        const esik = Date.now() - GECMIS_SAKLAMA_GUN * MS_CINSINDEN_GUN;
        const kayitlar: GecmisKaydi[] = JSON.parse(gecmisJson);
        setOgunGecmisi(kayitlar.filter((kayit) => kayit.zaman >= esik));
      }

      const favoriJson = await AsyncStorage.getItem(FAVORI_ANAHTARI);
      if (favoriJson) {
        setFavoriler(JSON.parse(favoriJson));
      }

      const bugun = bugununTarihiUret();

      if (!kayitliJson) {
        setKullanici((onceki) => ({ ...onceki, sonGirisTarihi: bugun }));
        setOnboardingTamamlandi(false);
        return;
      }

      const kayitliKullanici: KullaniciVerisi = { cinsiyet: 'kadin', ...JSON.parse(kayitliJson) };

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
    AsyncStorage.removeItem(GIRIS_ANAHTARI);
    AsyncStorage.removeItem(GECMIS_ANAHTARI);
    AsyncStorage.removeItem(FAVORI_ANAHTARI);
    setKullanici(BASLANGIC_KULLANICISI);
    setOgunler(BASLANGIC_OGUNLERI);
    setOgunGecmisi([]);
    setFavoriler([]);
    setOnboardingTamamlandi(false);
    setGirisYapildi(false);
  }, []);

  const gecmiseEkle = useCallback((kayitlar: GecmisKaydi[]) => {
    if (kayitlar.length === 0) {
      return;
    }
    setOgunGecmisi((onceki) => {
      const guncel = [...onceki, ...kayitlar];
      AsyncStorage.setItem(GECMIS_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
  }, []);

  const girisYap = useCallback(() => {
    AsyncStorage.setItem(GIRIS_ANAHTARI, 'true');
    setGirisYapildi(true);
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
      gecmiseEkle([
        { id: yeniOgun.id, isim: nihaiIsim, kalori, makrolar, zaman: simdi.getTime() },
      ]);
      hatirlaticiKur();
    },
    [hatirlaticiKur, gecmiseEkle]
  );

  const ogunGuncelle = useCallback(
    (id: string, guncelleme: { isim: string; kalori: number; makrolar?: Makrolar }) => {
      const eskiOgun = ogunler.find((ogun) => ogun.id === id);
      if (!eskiOgun) {
        return;
      }

      const nihaiIsim = guncelleme.isim.trim().length > 0 ? guncelleme.isim.trim() : VARSAYILAN_OGUN_ISMI;
      const fark = guncelleme.kalori - eskiOgun.kalori;

      setOgunler((oncekiler) =>
        oncekiler.map((ogun) =>
          ogun.id === id
            ? { ...ogun, isim: nihaiIsim, kalori: guncelleme.kalori, makrolar: guncelleme.makrolar }
            : ogun
        )
      );
      setKullanici((onceki) => ({
        ...onceki,
        bugunAlinanKalori: onceki.bugunAlinanKalori + fark,
      }));
    },
    [ogunler]
  );

  const ogunKopyala = useCallback(
    (id: string) => {
      const kaynak = ogunler.find((ogun) => ogun.id === id);
      if (!kaynak) {
        return;
      }

      const simdi = new Date();
      const saat = String(simdi.getHours()).padStart(2, '0');
      const dakika = String(simdi.getMinutes()).padStart(2, '0');
      const kopya: Ogun = {
        id: String(simdi.getTime()),
        isim: kaynak.isim,
        kalori: kaynak.kalori,
        eklenmeSaati: `${saat}:${dakika}`,
        makrolar: kaynak.makrolar,
      };

      setOgunler((oncekiler) => [...oncekiler, kopya]);
      setKullanici((onceki) => ({
        ...onceki,
        bugunAlinanKalori: onceki.bugunAlinanKalori + kopya.kalori,
      }));
      gecmiseEkle([
        { id: kopya.id, isim: kopya.isim, kalori: kopya.kalori, makrolar: kopya.makrolar, zaman: simdi.getTime() },
      ]);
    },
    [ogunler, gecmiseEkle]
  );

  const dunuKopyala = useCallback(() => {
    const simdi = new Date();
    const dunBaslangic = new Date(
      simdi.getFullYear(),
      simdi.getMonth(),
      simdi.getDate() - 1
    ).getTime();
    const bugunBaslangic = new Date(
      simdi.getFullYear(),
      simdi.getMonth(),
      simdi.getDate()
    ).getTime();

    const dunkuler = ogunGecmisi.filter(
      (kayit) => kayit.zaman >= dunBaslangic && kayit.zaman < bugunBaslangic
    );
    if (dunkuler.length === 0) {
      return 0;
    }

    const saat = saatDamgasi();
    const zaman = simdi.getTime();
    const yeniOgunler: Ogun[] = dunkuler.map((kayit, sira) => ({
      id: `${zaman + sira}`,
      isim: kayit.isim,
      kalori: kayit.kalori,
      eklenmeSaati: saat,
      makrolar: kayit.makrolar,
    }));
    const toplamKalori = dunkuler.reduce((toplam, kayit) => toplam + kayit.kalori, 0);

    setOgunler((oncekiler) => [...oncekiler, ...yeniOgunler]);
    setKullanici((onceki) => ({
      ...onceki,
      bugunAlinanKalori: onceki.bugunAlinanKalori + toplamKalori,
    }));
    gecmiseEkle(
      yeniOgunler.map((ogun) => ({
        id: ogun.id,
        isim: ogun.isim,
        kalori: ogun.kalori,
        makrolar: ogun.makrolar,
        zaman,
      }))
    );
    return dunkuler.length;
  }, [ogunGecmisi, gecmiseEkle]);

  const favoriMi = useCallback(
    (isim: string) => favoriler.some((favori) => normalizeIsim(favori.isim) === normalizeIsim(isim)),
    [favoriler]
  );

  const favoriToggle = useCallback((isim: string, kalori: number, makrolar?: Makrolar) => {
    const anahtar = normalizeIsim(isim);
    setFavoriler((onceki) => {
      const varMi = onceki.some((favori) => normalizeIsim(favori.isim) === anahtar);
      const guncel = varMi
        ? onceki.filter((favori) => normalizeIsim(favori.isim) !== anahtar)
        : [...onceki, { isim: isim.trim(), kalori, makrolar }];
      AsyncStorage.setItem(FAVORI_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
  }, []);

  const sikKullanilanlar = useMemo<SikKullanim[]>(() => {
    const esik = Date.now() - SIK_KULLANIM_PENCERE_GUN * MS_CINSINDEN_GUN;
    const harita = new Map<string, { kayit: GecmisKaydi; sayi: number }>();
    for (const kayit of ogunGecmisi) {
      if (kayit.zaman < esik) {
        continue;
      }
      const anahtar = normalizeIsim(kayit.isim);
      const mevcut = harita.get(anahtar);
      if (mevcut) {
        mevcut.sayi += 1;
        if (kayit.zaman > mevcut.kayit.zaman) {
          mevcut.kayit = kayit;
        }
      } else {
        harita.set(anahtar, { kayit, sayi: 1 });
      }
    }
    return [...harita.values()]
      .sort((a, b) => b.sayi - a.sayi || b.kayit.zaman - a.kayit.zaman)
      .map((deger) => ({ ...deger.kayit, sayi: deger.sayi }));
  }, [ogunGecmisi]);

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
      girisYapildi,
      hizliKaloriEkle,
      ogunGuncelle,
      ogunKopyala,
      ogunSil,
      sikKullanilanlar,
      favoriler,
      favoriMi,
      favoriToggle,
      dunuKopyala,
      profilKaydet,
      profilSifirla,
      girisYap,
    }),
    [
      kullanici,
      ogunler,
      onboardingTamamlandi,
      girisYapildi,
      hizliKaloriEkle,
      ogunGuncelle,
      ogunKopyala,
      ogunSil,
      sikKullanilanlar,
      favoriler,
      favoriMi,
      favoriToggle,
      dunuKopyala,
      profilKaydet,
      profilSifirla,
      girisYap,
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
