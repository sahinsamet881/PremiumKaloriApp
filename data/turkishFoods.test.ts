import {
  TURK_YEMEKLERI_SEED,
  turkceNormalize,
  yemekAra,
  type TurkYemek,
} from './turkishFoods';

describe('turkceNormalize', () => {
  it('büyük/küçük harfi eşitler', () => {
    expect(turkceNormalize('MERCIMEK')).toBe(turkceNormalize('mercimek'));
  });

  it('Türkçe aksanlı harfleri sadeleştirir (ç/ş/ğ/ı/ö/ü)', () => {
    expect(turkceNormalize('Çorba')).toBe('corba');
    expect(turkceNormalize('Şiş')).toBe('sis');
    expect(turkceNormalize('Ağır')).toBe('agir');
    expect(turkceNormalize('Iğdır')).toBe('igdir');
    expect(turkceNormalize('Gözleme')).toBe('gozleme');
    expect(turkceNormalize('Üzüm')).toBe('uzum');
  });

  it('İ ve ı harflerini i ile eşitler', () => {
    expect(turkceNormalize('İzmir')).toBe('izmir');
    expect(turkceNormalize('KIYMA')).toBe(turkceNormalize('kıyma'));
  });

  it('fazla boşlukları temizler', () => {
    expect(turkceNormalize('  kuru   fasulye ')).toBe('kuru fasulye');
  });
});

describe('yemekAra', () => {
  it('aksansız yazılan sorgu aksanlı ismi bulur', () => {
    const sonuc = yemekAra('mercimek corbasi');
    expect(sonuc.map((y) => y.isim)).toContain('Mercimek Çorbası');
  });

  it('büyük harfli ve aksanlı sorgu da çalışır', () => {
    const sonuc = yemekAra('KÜNEFE');
    expect(sonuc.map((y) => y.isim)).toContain('Künefe');
  });

  it('kısmi eşleşme yapar', () => {
    const sonuc = yemekAra('pilav');
    expect(sonuc.length).toBeGreaterThanOrEqual(2);
  });

  it('alternatif isimlerden (aramaAdlari) bulur', () => {
    const sonuc = yemekAra('turkish coffee');
    expect(sonuc.map((y) => y.isim)).toContain('Türk Kahvesi');
  });

  it('ı/i eşleşmesi: "manti" -> "Mantı"', () => {
    expect(yemekAra('manti').map((y) => y.isim)).toContain('Mantı');
  });

  it('boş sorguda boş dizi döner', () => {
    expect(yemekAra('   ')).toEqual([]);
  });

  it('eşleşme yoksa boş dizi döner', () => {
    expect(yemekAra('xyzq-bulunmaz')).toEqual([]);
  });
});

describe('TURK_YEMEKLERI_SEED şeması', () => {
  it('örnek 20 kayıt içerir', () => {
    expect(TURK_YEMEKLERI_SEED.length).toBe(20);
  });

  it('her kayıt zorunlu alanlara ve geçerli değerlere sahiptir', () => {
    for (const yemek of TURK_YEMEKLERI_SEED as TurkYemek[]) {
      expect(typeof yemek.id).toBe('string');
      expect(yemek.isim.length).toBeGreaterThan(0);
      expect(Array.isArray(yemek.aramaAdlari)).toBe(true);
      expect(yemek.porsiyonAdi.length).toBeGreaterThan(0);
      expect(yemek.porsiyonGram).toBeGreaterThan(0);
      expect(yemek.kalori100).toBeGreaterThanOrEqual(0);
      expect(yemek.protein100).toBeGreaterThanOrEqual(0);
      expect(yemek.karb100).toBeGreaterThanOrEqual(0);
      expect(yemek.yag100).toBeGreaterThanOrEqual(0);
    }
  });

  it('tüm idler benzersizdir', () => {
    const idler = TURK_YEMEKLERI_SEED.map((y) => y.id);
    expect(new Set(idler).size).toBe(idler.length);
  });

  it('altı kategori de temsil edilir', () => {
    const kategoriler = new Set(TURK_YEMEKLERI_SEED.map((y) => y.kategori));
    expect(kategoriler).toEqual(
      new Set(['corba', 'ana-yemek', 'hamur-isi', 'kahvaltilik', 'tatli', 'icecek'])
    );
  });
});
