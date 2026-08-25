import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { AKSAN_PALETLERI, AksanRengiAdi, VARSAYILAN_AKSAN_RENGI } from '@/constants/theme';

type AksanBaglami = {
  aksanAdi: AksanRengiAdi;
  aksanTonlari: (typeof AKSAN_PALETLERI)[AksanRengiAdi];
  aksanRengi: string;
  aksanSec: (yeniAksan: AksanRengiAdi) => void;
};

const ThemeContext = createContext<AksanBaglami | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [aksanAdi, setAksanAdi] = useState<AksanRengiAdi>(VARSAYILAN_AKSAN_RENGI);

  const value = useMemo<AksanBaglami>(() => {
    const aksanTonlari = AKSAN_PALETLERI[aksanAdi];
    return {
      aksanAdi,
      aksanTonlari,
      aksanRengi: aksanTonlari.orta,
      aksanSec: setAksanAdi,
    };
  }, [aksanAdi]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAksanRenk() {
  const baglam = useContext(ThemeContext);
  if (!baglam) {
    throw new Error('useAksanRenk, ThemeProvider içinde kullanılmalı');
  }
  return baglam;
}
