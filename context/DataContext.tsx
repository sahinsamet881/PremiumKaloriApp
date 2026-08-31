import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  TurkYemek,
  TURK_YEMEK_VERI_VERSIYONU,
  TURK_YEMEKLERI_SEED,
} from '@/data/turkishFoods';
import { saglik, SaglikGunlukVeri, SaglikIzinDurumu } from '@/health/saglik';
import { useNotifications } from '@/hooks/useNotifications';
import { ogunTuruSaattenTuret } from '@/nutrition/ogun';
import { SU_BARDAK_VARSAYILAN, SU_HEDEFI_VARSAYILAN, suHedefiOner } from '@/nutrition/su';
import { magaza, SatinAlmaSonucu } from '@/store/magaza';
import {
  Favori,
  GecmisKaydi,
  KiloKaydi,
  KullaniciVerisi,
  Makrolar,
  Ogun,
  OgunTuru,
  ProfilBilgisi,
  SikKullanim,
  SuKaydi,
  YerelUrun,
} from '@/types';

const KULLANICI_ANAHTARI = '@minimalist_kalori/kullanici';

const GIRIS_ANAHTARI = 'isLoggedIn';

const GECMIS_ANAHTARI = '@minimalist_kalori/ogun_gecmisi';

const FAVORI_ANAHTARI = '@minimalist_kalori/favoriler';

const KILO_ANAHTARI = '@minimalist_kalori/kilo_kayitlari';

const YEREL_URUN_ANAHTARI = '@minimalist_kalori/yerel_urunler';

const YEMEK_DB_ANAHTARI = '@minimalist_kalori/turk_yemekleri';

const YEMEK_DB_VER_ANAHTARI = '@minimalist_kalori/turk_yemekleri_versiyon';

const SAGLIK_AKTIF_ANAHTARI = '@minimalist_kalori/saglik_aktif';

const SU_ANAHTARI = '@minimalist_kalori/su_kayitlari';

const KVKK_ANAHTARI = '@minimalist_kalori/kvkk_onay';

const MS_CINSINDEN_GUN = 1000 * 60 * 60 * 24;

const GECMIS_SAKLAMA_GUN = 45;

const SIK_KULLANIM_PENCERE_GUN = 30;

function normalizeIsim(isim: string) {
  return isim.trim().toLocaleLowerCase('tr-TR');
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
  hizliKaloriEkle: (
    kalori: number,
    isim: string,
    makrolar?: Makrolar,
    ogunTuru?: OgunTuru
  ) => void;
  ogunGuncelle: (
    id: string,
    guncelleme: { isim: string; kalori: number; makrolar?: Makrolar; ogunTuru?: OgunTuru }
  ) => void;
  ogunKopyala: (id: string) => void;
  ogunSil: (id: string) => void;
  ogunGecmisi: GecmisKaydi[];
  sikKullanilanlar: SikKullanim[];
  favoriler: Favori[];
  favoriMi: (isim: string) => boolean;
  favoriToggle: (isim: string, kalori: number, makrolar?: Makrolar) => void;
  kiloKayitlari: KiloKaydi[];
  kiloEkle: (kilo: number, not?: string) => void;
  urunBul: (barkod: string) => YerelUrun | undefined;
  urunEkle: (urun: YerelUrun) => void;
  turkYemekleri: TurkYemek[];
  turkYemekBul: (id: string) => TurkYemek | undefined;
  saglikAktif: boolean;
  saglikIzni: SaglikIzinDurumu;
  saglikPlatformDestekli: boolean;
  saglikDemo: boolean;
  saglikAktifKalori: number;
  saglikBaslat: () => Promise<void>;
  saglikDurdur: () => void;
  saglikSuKaydet: (mililitre: number) => void;
  suKayitlari: SuKaydi[];
  kvkkOnaylandi: boolean | null;
  kvkkOnayla: () => void;
  hesabiSil: () => Promise<void>;
  premiumAktif: boolean;
  premiumMagazaHazir: boolean;
  premiumDenemeBitis: number | null;
  premiumSatinAl: (planKimligi: string) => Promise<SatinAlmaSonucu>;
  premiumGeriYukle: () => Promise<boolean>;
  profilKaydet: (profil: ProfilBilgisi) => void;
  profilSifirla: () => void;
  girisYap: () => void;
};

const VARSAYILAN_OGUN_ISMI = 'Hızlı Öğün';

const DataContext = createContext<VeriBaglami | null>(null);

const BASLANGIC_OGUNLERI: Ogun[] = [
  { id: '1', isim: 'Yulaf Ezmesi', kalori: 320, eklenmeSaati: '08:15', ogunTuru: 'kahvalti' },
  { id: '2', isim: 'Tavuklu Salata', kalori: 480, eklenmeSaati: '13:00', ogunTuru: 'ogle' },
  { id: '3', isim: '1 Fincan Kahve', kalori: 50, eklenmeSaati: '15:40', ogunTuru: 'ara' },
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
  suHedefiMl: SU_HEDEFI_VARSAYILAN,
  suBardakMl: SU_BARDAK_VARSAYILAN,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<KullaniciVerisi>(BASLANGIC_KULLANICISI);
  const [ogunler, setOgunler] = useState<Ogun[]>(BASLANGIC_OGUNLERI);
  const [onboardingTamamlandi, setOnboardingTamamlandi] = useState<boolean | null>(null);
  const [girisYapildi, setGirisYapildi] = useState<boolean | null>(null);
  const [ogunGecmisi, setOgunGecmisi] = useState<GecmisKaydi[]>([]);
  const [favoriler, setFavoriler] = useState<Favori[]>([]);
  const [kiloKayitlari, setKiloKayitlari] = useState<KiloKaydi[]>([]);
  const [yerelUrunler, setYerelUrunler] = useState<Record<string, YerelUrun>>({});
  const [turkYemekleri, setTurkYemekleri] = useState<TurkYemek[]>(TURK_YEMEKLERI_SEED);
  const [saglikAktif, setSaglikAktif] = useState(false);
  const [saglikIzni, setSaglikIzni] = useState<SaglikIzinDurumu>('bilinmiyor');
  const [saglikGunluk, setSaglikGunluk] = useState<SaglikGunlukVeri>({
    adim: 0,
    aktifKalori: 0,
    kilo: null,
  });
  const saglikAktifRef = useRef(false);
  const [suKayitlari, setSuKayitlari] = useState<SuKaydi[]>([]);
  const [kvkkOnaylandi, setKvkkOnaylandi] = useState<boolean | null>(null);
  const [premiumAktif, setPremiumAktif] = useState(false);
  const [premiumDenemeBitis, setPremiumDenemeBitis] = useState<number | null>(null);
  const { hatirlaticiKur, denemeHatirlaticisiKur } = useNotifications();

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

      const kiloJson = await AsyncStorage.getItem(KILO_ANAHTARI);
      if (kiloJson) {
        setKiloKayitlari(JSON.parse(kiloJson));
      }

      const urunJson = await AsyncStorage.getItem(YEREL_URUN_ANAHTARI);
      if (urunJson) {
        setYerelUrunler(JSON.parse(urunJson));
      }

      const suJson = await AsyncStorage.getItem(SU_ANAHTARI);
      if (suJson) {
        setSuKayitlari(JSON.parse(suJson));
      }

      const kvkkDegeri = await AsyncStorage.getItem(KVKK_ANAHTARI);
      setKvkkOnaylandi(kvkkDegeri === 'true');

      magaza
        .abonelikDurumu()
        .then((durum) => {
          setPremiumAktif(durum.aktif);
          setPremiumDenemeBitis(durum.denemeBitisMs);
          if (durum.denemede) {
            denemeHatirlaticisiKur(durum.denemeBitisMs);
          }
        })
        .catch(() => {});

      const saglikTercihi = await AsyncStorage.getItem(SAGLIK_AKTIF_ANAHTARI);
      if (saglikTercihi === 'true') {
        const durum = await saglik.izinDurumu();
        setSaglikIzni(durum);
        if (durum === 'verildi') {
          saglikAktifRef.current = true;
          setSaglikAktif(true);
          setSaglikGunluk(await saglik.gunlukVeriGetir());
        }
      }

      const yemekVer = await AsyncStorage.getItem(YEMEK_DB_VER_ANAHTARI);
      if (Number(yemekVer) === TURK_YEMEK_VERI_VERSIYONU) {
        const yemekJson = await AsyncStorage.getItem(YEMEK_DB_ANAHTARI);
        if (yemekJson) {
          setTurkYemekleri(JSON.parse(yemekJson));
        }
      } else {
        setTurkYemekleri(TURK_YEMEKLERI_SEED);
        AsyncStorage.setItem(YEMEK_DB_ANAHTARI, JSON.stringify(TURK_YEMEKLERI_SEED));
        AsyncStorage.setItem(YEMEK_DB_VER_ANAHTARI, String(TURK_YEMEK_VERI_VERSIYONU));
      }

      const bugun = bugununTarihiUret();

      if (!kayitliJson) {
        setKullanici((onceki) => ({ ...onceki, sonGirisTarihi: bugun }));
        setOnboardingTamamlandi(false);
        return;
      }

      const cozulmusKullanici = JSON.parse(kayitliJson);
      const kayitliKullanici: KullaniciVerisi = {
        cinsiyet: 'kadin',
        ...cozulmusKullanici,
        suHedefiMl: cozulmusKullanici.suHedefiMl ?? suHedefiOner(cozulmusKullanici.kilo ?? 0),
        suBardakMl: cozulmusKullanici.suBardakMl ?? SU_BARDAK_VARSAYILAN,
      };

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
  }, [denemeHatirlaticisiKur]);

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
    AsyncStorage.removeItem(KILO_ANAHTARI);
    AsyncStorage.removeItem(YEREL_URUN_ANAHTARI);
    AsyncStorage.removeItem(SAGLIK_AKTIF_ANAHTARI);
    saglikAktifRef.current = false;
    setSaglikAktif(false);
    setSaglikIzni('bilinmiyor');
    setKullanici(BASLANGIC_KULLANICISI);
    setOgunler(BASLANGIC_OGUNLERI);
    setOgunGecmisi([]);
    setFavoriler([]);
    setKiloKayitlari([]);
    setYerelUrunler({});
    setOnboardingTamamlandi(false);
    setGirisYapildi(false);
  }, []);

  const urunBul = useCallback(
    (barkod: string) => yerelUrunler[barkod],
    [yerelUrunler]
  );

  const urunEkle = useCallback((urun: YerelUrun) => {
    setYerelUrunler((onceki) => {
      const guncel = { ...onceki, [urun.barkod]: urun };
      AsyncStorage.setItem(YEREL_URUN_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
  }, []);

  const turkYemekBul = useCallback(
    (id: string) => turkYemekleri.find((yemek) => yemek.id === id),
    [turkYemekleri]
  );

  const saglikBaslat = useCallback(async () => {
    const durum = await saglik.izinIste();
    setSaglikIzni(durum);
    if (durum === 'verildi') {
      saglikAktifRef.current = true;
      setSaglikAktif(true);
      AsyncStorage.setItem(SAGLIK_AKTIF_ANAHTARI, 'true');
      setSaglikGunluk(await saglik.gunlukVeriGetir());
    } else {
      saglikAktifRef.current = false;
      setSaglikAktif(false);
      AsyncStorage.setItem(SAGLIK_AKTIF_ANAHTARI, 'false');
    }
  }, []);

  const saglikDurdur = useCallback(() => {
    saglikAktifRef.current = false;
    setSaglikAktif(false);
    AsyncStorage.setItem(SAGLIK_AKTIF_ANAHTARI, 'false');
  }, []);

  const saglikSuKaydet = useCallback((mililitre: number) => {
    const bugun = bugununTarihiUret();
    setSuKayitlari((onceki) => {
      const digerleri = onceki.filter((kayit) => kayit.tarih !== bugun);
      const bugunMevcut = onceki.find((kayit) => kayit.tarih === bugun);
      const guncel = [
        ...digerleri,
        { tarih: bugun, mililitre: (bugunMevcut?.mililitre ?? 0) + mililitre },
      ].sort((a, b) => a.tarih.localeCompare(b.tarih));
      AsyncStorage.setItem(SU_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
    if (saglikAktifRef.current) {
      saglik.suYaz(mililitre);
    }
  }, []);

  const kvkkOnayla = useCallback(() => {
    AsyncStorage.setItem(KVKK_ANAHTARI, 'true');
    setKvkkOnaylandi(true);
  }, []);

  const hesabiSil = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    await AsyncStorage.clear().catch(() => {});
    saglikAktifRef.current = false;
    setKullanici(BASLANGIC_KULLANICISI);
    setOgunler([]);
    setOgunGecmisi([]);
    setFavoriler([]);
    setKiloKayitlari([]);
    setYerelUrunler({});
    setSuKayitlari([]);
    setSaglikAktif(false);
    setSaglikIzni('bilinmiyor');
    setPremiumAktif(false);
    setPremiumDenemeBitis(null);
    setGirisYapildi(false);
    setKvkkOnaylandi(false);
    setOnboardingTamamlandi(false);
  }, []);

  const premiumSatinAl = useCallback(async (planKimligi: string) => {
    const sonuc = await magaza.satinAl(planKimligi);
    if (sonuc === 'basarili') {
      const durum = await magaza.abonelikDurumu();
      setPremiumAktif(durum.aktif);
      setPremiumDenemeBitis(durum.denemeBitisMs);
      denemeHatirlaticisiKur(durum.denemeBitisMs);
    }
    return sonuc;
  }, [denemeHatirlaticisiKur]);

  const premiumGeriYukle = useCallback(async () => {
    const durum = await magaza.abonelikDurumu();
    setPremiumAktif(durum.aktif);
    setPremiumDenemeBitis(durum.denemeBitisMs);
    return durum.aktif;
  }, []);

  const kiloEkle = useCallback((kilo: number, not?: string) => {
    if (!Number.isFinite(kilo) || kilo <= 0) {
      return;
    }
    const bugun = bugununTarihiUret();
    setKiloKayitlari((onceki) => {
      const digerleri = onceki.filter((kayit) => kayit.tarih !== bugun);
      const guncel = [
        ...digerleri,
        { id: String(Date.now()), tarih: bugun, kilo, not: not?.trim() || undefined },
      ].sort((a, b) => a.tarih.localeCompare(b.tarih));
      AsyncStorage.setItem(KILO_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
    setKullanici((onceki) => {
      const guncel = { ...onceki, kilo };
      AsyncStorage.setItem(KULLANICI_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
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
    (kalori: number, isim: string, makrolar?: Makrolar, ogunTuru?: OgunTuru) => {
      const simdi = new Date();
      const saat = String(simdi.getHours()).padStart(2, '0');
      const dakika = String(simdi.getMinutes()).padStart(2, '0');
      const nihaiIsim = isim.trim().length > 0 ? isim.trim() : VARSAYILAN_OGUN_ISMI;
      const nihaiTur = ogunTuru ?? ogunTuruSaattenTuret(`${saat}:${dakika}`);

      const yeniOgun: Ogun = {
        id: String(simdi.getTime()),
        isim: nihaiIsim,
        kalori,
        eklenmeSaati: `${saat}:${dakika}`,
        makrolar,
        ogunTuru: nihaiTur,
      };

      setOgunler((oncekiler) => [...oncekiler, yeniOgun]);
      setKullanici((onceki) => ({
        ...onceki,
        bugunAlinanKalori: onceki.bugunAlinanKalori + kalori,
      }));
      gecmiseEkle([
        { id: yeniOgun.id, isim: nihaiIsim, kalori, makrolar, zaman: simdi.getTime(), ogunTuru: nihaiTur },
      ]);
      if (saglikAktifRef.current) {
        saglik.beslenmeYaz({
          kalori,
          protein: makrolar?.protein ?? 0,
          karbonhidrat: makrolar?.karbonhidrat ?? 0,
          yag: makrolar?.yag ?? 0,
        });
      }
      hatirlaticiKur();
    },
    [hatirlaticiKur, gecmiseEkle]
  );

  const ogunGuncelle = useCallback(
    (
      id: string,
      guncelleme: { isim: string; kalori: number; makrolar?: Makrolar; ogunTuru?: OgunTuru }
    ) => {
      const eskiOgun = ogunler.find((ogun) => ogun.id === id);
      if (!eskiOgun) {
        return;
      }

      const nihaiIsim = guncelleme.isim.trim().length > 0 ? guncelleme.isim.trim() : VARSAYILAN_OGUN_ISMI;
      const fark = guncelleme.kalori - eskiOgun.kalori;

      setOgunler((oncekiler) =>
        oncekiler.map((ogun) =>
          ogun.id === id
            ? {
                ...ogun,
                isim: nihaiIsim,
                kalori: guncelleme.kalori,
                makrolar: guncelleme.makrolar,
                ogunTuru: guncelleme.ogunTuru ?? ogun.ogunTuru,
              }
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
        ogunTuru: kaynak.ogunTuru ?? ogunTuruSaattenTuret(`${saat}:${dakika}`),
      };

      setOgunler((oncekiler) => [...oncekiler, kopya]);
      setKullanici((onceki) => ({
        ...onceki,
        bugunAlinanKalori: onceki.bugunAlinanKalori + kopya.kalori,
      }));
      gecmiseEkle([
        {
          id: kopya.id,
          isim: kopya.isim,
          kalori: kopya.kalori,
          makrolar: kopya.makrolar,
          zaman: simdi.getTime(),
          ogunTuru: kopya.ogunTuru,
        },
      ]);
    },
    [ogunler, gecmiseEkle]
  );

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
      ogunGecmisi,
      sikKullanilanlar,
      favoriler,
      favoriMi,
      favoriToggle,
      kiloKayitlari,
      kiloEkle,
      urunBul,
      urunEkle,
      turkYemekleri,
      turkYemekBul,
      saglikAktif,
      saglikIzni,
      saglikPlatformDestekli: saglik.platformDestekli,
      saglikDemo: saglik.demo,
      saglikAktifKalori: saglikAktif ? saglikGunluk.aktifKalori : 0,
      saglikBaslat,
      saglikDurdur,
      saglikSuKaydet,
      suKayitlari,
      kvkkOnaylandi,
      kvkkOnayla,
      hesabiSil,
      premiumAktif,
      premiumMagazaHazir: magaza.hazir,
      premiumDenemeBitis,
      premiumSatinAl,
      premiumGeriYukle,
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
      ogunGecmisi,
      sikKullanilanlar,
      favoriler,
      favoriMi,
      favoriToggle,
      kiloKayitlari,
      kiloEkle,
      urunBul,
      urunEkle,
      turkYemekleri,
      turkYemekBul,
      saglikAktif,
      saglikIzni,
      saglikGunluk,
      saglikBaslat,
      saglikDurdur,
      saglikSuKaydet,
      suKayitlari,
      kvkkOnaylandi,
      kvkkOnayla,
      hesabiSil,
      premiumAktif,
      premiumDenemeBitis,
      premiumSatinAl,
      premiumGeriYukle,
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
