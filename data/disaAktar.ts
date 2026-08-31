import { GecmisKaydi, KiloKaydi, SuKaydi } from '@/types';

export type DisaAktarilacakVeri = {
  ogunGecmisi: GecmisKaydi[];
  suKayitlari: SuKaydi[];
  kiloKayitlari: KiloKaydi[];
};

function csvHucre(deger: string | number | undefined | null): string {
  const metin = String(deger ?? '');
  return /[",\n;]/.test(metin) ? `"${metin.replace(/"/g, '""')}"` : metin;
}

export const CSV_BASLIKLARI = [
  'tip',
  'tarih',
  'saat',
  'isim',
  'kalori',
  'protein_g',
  'karb_g',
  'yag_g',
  'lif_g',
  'mililitre',
  'kilo_kg',
  'not',
];

export function verileriCsvUret(veri: DisaAktarilacakVeri): string {
  const satirlar: (string | number)[][] = [CSV_BASLIKLARI];

  for (const kayit of [...veri.ogunGecmisi].sort((a, b) => a.zaman - b.zaman)) {
    const zaman = new Date(kayit.zaman);
    satirlar.push([
      'ogun',
      zaman.toISOString().slice(0, 10),
      zaman.toTimeString().slice(0, 5),
      kayit.isim,
      Math.round(kayit.kalori),
      kayit.makrolar ? Math.round(kayit.makrolar.protein) : '',
      kayit.makrolar ? Math.round(kayit.makrolar.karbonhidrat) : '',
      kayit.makrolar ? Math.round(kayit.makrolar.yag) : '',
      kayit.makrolar?.lif != null ? Math.round(kayit.makrolar.lif) : '',
      '',
      '',
      '',
    ]);
  }

  for (const kayit of [...veri.suKayitlari].sort((a, b) => a.tarih.localeCompare(b.tarih))) {
    satirlar.push(['su', kayit.tarih, '', '', '', '', '', '', '', kayit.mililitre, '', '']);
  }

  for (const kayit of [...veri.kiloKayitlari].sort((a, b) => a.tarih.localeCompare(b.tarih))) {
    satirlar.push([
      'kilo',
      kayit.tarih,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      kayit.kilo,
      kayit.not ?? '',
    ]);
  }

  return satirlar.map((satir) => satir.map(csvHucre).join(',')).join('\n');
}
