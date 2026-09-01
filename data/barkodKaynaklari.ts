/**
 * Barkod → besin değeri çözümü.
 *
 * Sıra:
 *   1. Open Food Facts (topluluk ürün veritabanı, GTIN/EAN ile)
 *   2. USDA FoodData Central — Branded dataType, GTIN/UPC ile
 *   3. Hiçbiri bulamazsa `bulunamadi` → çağıran ekran manuel girişe düşer
 *
 * Ağ katmanı (fetch) ile ayrıştırma (offAyristir / usdaAyristir) bilerek
 * ayrıldı; ayrıştırıcılar saf fonksiyon olduğu için test edilebilir.
 */

export type BarkodBesin = {
  ad: string;
  /** 100 g başına değerler */
  kalori100: number;
  protein100: number;
  karb100: number;
  yag100: number;
  lif100: number;
  kaynak: 'off' | 'usda';
};

export type BarkodAramaSonucu =
  | { durum: 'bulundu'; besin: BarkodBesin }
  | { durum: 'bulunamadi' }
  | { durum: 'ag_hatasi' };

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';
const USDA_ARAMA_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
// EXPO_PUBLIC_ önekli değişkenler istemci paketine gömülür. Anahtar yoksa
// DEMO_KEY kullanılır (saatte ~30 istek sınırlı — sadece yedek amaçlı).
const USDA_ANAHTARI = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';

const ISTEK_BASLIKLARI = { 'User-Agent': 'MinimalistKalori/1.0 (rn)' };

type KaynakCevabi = BarkodBesin | null | 'ag_hatasi';

function pozitifSayi(...adaylar: unknown[]): number {
  for (const aday of adaylar) {
    const n = Number(aday);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 0;
}

function negatifOlmayanSayi(...adaylar: unknown[]): number {
  for (const aday of adaylar) {
    const n = Number(aday);
    if (Number.isFinite(n) && n >= 0) {
      return n;
    }
  }
  return 0;
}

/** Barodları karşılaştırırken baştaki sıfırları ve boşlukları yok say. */
function barkodEsit(a: string, b: string): boolean {
  const sadelestir = (k: string) => k.replace(/\D/g, '').replace(/^0+/, '');
  return sadelestir(a) === sadelestir(b) && sadelestir(a).length > 0;
}

/** Open Food Facts ürün yanıtından besin çıkarımı. */
export function offAyristir(veri: unknown): BarkodBesin | null {
  const kok = (veri ?? {}) as { status?: number; product?: Record<string, unknown> };
  const urun = kok.product;
  if (kok.status === 0 || !urun) {
    return null;
  }

  const besin = (urun.nutriments ?? {}) as Record<string, unknown>;
  const kalori100 = pozitifSayi(besin['energy-kcal_100g'], besin['energy-kcal']);
  if (kalori100 <= 0) {
    return null;
  }

  const ad =
    (
      String(urun.product_name_tr || urun.product_name || urun.generic_name || '').trim()
    ) || 'İsimsiz Ürün';

  return {
    ad,
    kalori100,
    protein100: negatifOlmayanSayi(besin.proteins_100g),
    karb100: negatifOlmayanSayi(besin.carbohydrates_100g),
    yag100: negatifOlmayanSayi(besin.fat_100g),
    lif100: negatifOlmayanSayi(besin.fiber_100g),
    kaynak: 'off',
  };
}

const USDA_BESIN_ID = { kalori: 1008, protein: 1003, karb: 1005, yag: 1004, lif: 1079 } as const;
const USDA_ENERJI_YEDEK_ID = [2047, 2048];

function usdaBesinDegeri(gida: Record<string, unknown>, id: number): number {
  const liste = (gida.foodNutrients ?? []) as Record<string, unknown>[];
  const kayit = liste.find(
    (fn) => fn.nutrientId === id || String(fn.nutrientNumber ?? '') === String(id)
  );
  return negatifOlmayanSayi(kayit?.value, kayit?.amount);
}

/**
 * USDA "Branded" arama yanıtından, barkodu birebir eşleşen ilk ürünü seç.
 * USDA açıklamaları tümüyle BÜYÜK harf gelir; ilk harf dışı küçültülür.
 */
export function usdaAyristir(veri: unknown, barkod: string): BarkodBesin | null {
  const gidalar = ((veri as { foods?: Record<string, unknown>[] })?.foods ?? []) as Record<
    string,
    unknown
  >[];
  const gida = gidalar.find((g) => barkodEsit(String(g.gtinUpc ?? ''), barkod));
  if (!gida) {
    return null;
  }

  let kalori100 = usdaBesinDegeri(gida, USDA_BESIN_ID.kalori);
  for (const yedek of USDA_ENERJI_YEDEK_ID) {
    if (kalori100 > 0) {
      break;
    }
    kalori100 = usdaBesinDegeri(gida, yedek);
  }
  if (kalori100 <= 0) {
    return null;
  }

  const hamAd = String(gida.description || gida.brandName || '').trim();
  const ad = hamAd ? hamAd.charAt(0) + hamAd.slice(1).toLowerCase() : 'İsimsiz Ürün';

  return {
    ad,
    kalori100,
    protein100: usdaBesinDegeri(gida, USDA_BESIN_ID.protein),
    karb100: usdaBesinDegeri(gida, USDA_BESIN_ID.karb),
    yag100: usdaBesinDegeri(gida, USDA_BESIN_ID.yag),
    lif100: usdaBesinDegeri(gida, USDA_BESIN_ID.lif),
    kaynak: 'usda',
  };
}

async function offAra(barkod: string): Promise<KaynakCevabi> {
  try {
    const yanit = await fetch(`${OFF_URL}/${barkod}.json`, { headers: ISTEK_BASLIKLARI });
    if (yanit.status === 404) {
      return null;
    }
    if (!yanit.ok) {
      return 'ag_hatasi';
    }
    return offAyristir(await yanit.json());
  } catch {
    return 'ag_hatasi';
  }
}

async function usdaAra(barkod: string): Promise<KaynakCevabi> {
  try {
    const url =
      `${USDA_ARAMA_URL}?api_key=${encodeURIComponent(USDA_ANAHTARI)}` +
      `&query=${encodeURIComponent(barkod)}&dataType=Branded&pageSize=10`;
    const yanit = await fetch(url, { headers: ISTEK_BASLIKLARI });
    if (yanit.status === 404) {
      return null;
    }
    if (!yanit.ok) {
      return 'ag_hatasi';
    }
    return usdaAyristir(await yanit.json(), barkod);
  } catch {
    return 'ag_hatasi';
  }
}

/**
 * Barkodu sırayla iki kaynakta ara. İlk kaynak sonuç verirse ikinciye gidilmez.
 * `ag_hatasi` yalnızca bir kaynak ağ hatası verdi VE diğeri de sonuç bulamadıysa
 * döner — böylece "internet yok" ile "ürün kayıtlı değil" karışmaz.
 */
export async function barkodBesinAra(barkod: string): Promise<BarkodAramaSonucu> {
  const off = await offAra(barkod);
  if (off && off !== 'ag_hatasi') {
    return { durum: 'bulundu', besin: off };
  }

  const usda = await usdaAra(barkod);
  if (usda && usda !== 'ag_hatasi') {
    return { durum: 'bulundu', besin: usda };
  }

  if (off === 'ag_hatasi' || usda === 'ag_hatasi') {
    return { durum: 'ag_hatasi' };
  }
  return { durum: 'bulunamadi' };
}
