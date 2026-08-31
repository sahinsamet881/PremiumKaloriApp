import { CSV_BASLIKLARI, verileriCsvUret } from './disaAktar';
import type { GecmisKaydi, KiloKaydi, SuKaydi } from '@/types';

const ogun: GecmisKaydi[] = [
  {
    id: '1',
    isim: 'Menemen',
    kalori: 250,
    makrolar: { protein: 13, karbonhidrat: 8, yag: 19, lif: 3, porsiyon: '1 Porsiyon' },
    zaman: new Date('2026-08-20T08:30:00Z').getTime(),
  },
  {
    id: '2',
    isim: 'Elle, "özel" not',
    kalori: 120,
    zaman: new Date('2026-08-20T13:00:00Z').getTime(),
  },
];
const su: SuKaydi[] = [{ tarih: '2026-08-20', mililitre: 1500 }];
const kilo: KiloKaydi[] = [{ id: 'k1', tarih: '2026-08-19', kilo: 78.4, not: 'sabah' }];

describe('verileriCsvUret', () => {
  const csv = verileriCsvUret({ ogunGecmisi: ogun, suKayitlari: su, kiloKayitlari: kilo });
  const satirlar = csv.split('\n');

  it('başlık satırı ile başlar', () => {
    expect(satirlar[0]).toBe(CSV_BASLIKLARI.join(','));
  });

  it('her kayıt tipi için satır üretir', () => {
    expect(csv).toContain('ogun,2026-08-20');
    expect(csv).toContain('su,2026-08-20,,,,,,,,1500');
    expect(csv).toContain('kilo,2026-08-19,,,,,,,,,78.4,sabah');
  });

  it('makrolu öğünün makroları dolu, makrosuzunki boş', () => {
    const menemenSatiri = satirlar.find((s) => s.startsWith('ogun') && s.includes('Menemen'));
    expect(menemenSatiri).toContain(',250,13,8,19,3,');
  });

  it('virgül ve tırnak içeren alanları CSV kurallarına göre kaçırır', () => {
    expect(csv).toContain('"Elle, ""özel"" not"');
  });

  it('toplam satır sayısı = başlık + kayıt sayısı', () => {
    expect(satirlar.length).toBe(1 + ogun.length + su.length + kilo.length);
  });

  it('boş veri için sadece başlık döner', () => {
    expect(verileriCsvUret({ ogunGecmisi: [], suKayitlari: [], kiloKayitlari: [] })).toBe(
      CSV_BASLIKLARI.join(',')
    );
  });
});
