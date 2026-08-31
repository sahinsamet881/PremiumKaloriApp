/**
 * USDA FoodData Central'dan jenerik (analiz edilmiş) gıdaların besin
 * değerlerini çeker ve Türk yemekleri seed şemasına uygun bir JSON üretir.
 *
 * Kullanım:
 *   1) .env dosyasına USDA_API_KEY=... yaz (yoksa DEMO_KEY kullanılır, sınırlı).
 *   2) Çalıştır:
 *        npx tsx scripts/fetch-usda.ts
 *      veya (Node 22.18+ tür ayıklama ile):
 *        node scripts/fetch-usda.ts
 *
 * Seçenekler (argüman ya da ortam değişkeni):
 *   --out <yol>        Çıktı dosyası (öntanımlı: scripts/out/usda-foods.json)
 *   --delay <ms>       İstekler arası bekleme (öntanımlı: USDA_FETCH_DELAY_MS ya da 3600)
 *   --limit <n>        İşlenecek (kalan) girdi sayısını n ile sınırla — test/parti için
 *   --resume           Çıktı dosyasında zaten çözülmüş id'leri atla (partiler halinde
 *                      çekim için; DEMO_KEY saatlik sınıra takılınca işe yarar)
 *
 * GIRDILER listesi 8 kategoride ~100 temel besin içerir. DEMO_KEY saatte ~30
 * istekle sınırlıdır; tam liste için .env'e kendi USDA_API_KEY'ini koyup
 *   npm run fetch-usda -- --resume
 * komutunu (gerekirse birkaç kez) çalıştır.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// --- Seed şeması ------------------------------------------------------------

type Kategori =
  | 'sebze'
  | 'meyve'
  | 'tahil'
  | 'protein'
  | 'sut-urunu'
  | 'yag-kuruyemis'
  | 'atistirmalik'
  | 'icecek'
  | 'dunya';

/** Script girdisi: İngilizce arama terimi + Türkçe görünen ad eşleştirmesi. */
type Girdi = {
  /** USDA'da aranacak İngilizce terim. */
  ara: string;
  /** Uygulamada görünecek Türkçe ad. */
  isim: string;
  /** Aramada eşleşmesi istenen ek adlar (Türkçe/İngilizce). */
  aramaAdlari?: string[];
  kategori: Kategori;
  /** Varsayılan porsiyon adı, ör. "1 Kase". */
  porsiyonAdi: string;
  /** Varsayılan porsiyon gramajı. */
  porsiyonGram: number;
  /**
   * Bileşik/hazır yemekler analiz edilmiş DB'lerde bulunmaz; bunlar için
   * Survey (FNDDS) sonuçlarına da izin ver. Öntanımlı: yalnızca
   * Foundation + SR Legacy.
   */
  fnddsIzinli?: boolean;
};

/** Çıktı kaydı — data/turkish-foods.json ile birebir aynı şema. */
type SeedKaydi = {
  id: string;
  isim: string;
  aramaAdlari: string[];
  kategori: Kategori;
  porsiyonAdi: string;
  porsiyonGram: number;
  kalori100: number;
  protein100: number;
  karb100: number;
  yag100: number;
  lif100: number;
};

// --- USDA sabitleri -------------------------------------------------------

const ARAMA_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/** Branded değil: analiz edilmiş jenerik gıdalar. Sıra = tercih önceliği. */
const VERI_TIPLERI = ['Foundation', 'SR Legacy'] as const;

/** fnddsIzinli girdilerde ek olarak kabul edilen (en düşük öncelikli) tip. */
const FNDDS_TIPI = 'Survey (FNDDS)';

/** Besin öğesi ID eşlemesi (FDC nutrient id -> seed alanı). */
const BESIN_ID = {
  kalori: 1008, // Energy (kcal)
  protein: 1003, // Protein
  karbonhidrat: 1005, // Carbohydrate, by difference
  yag: 1004, // Total lipid (fat)
  lif: 1079, // Fiber, total dietary
} as const;

/** 1008 yoksa enerji için sırayla denenecek yedek ID'ler (Atwater faktörleri). */
const ENERJI_YEDEK_ID = [2047, 2048];

// --- Girdiler: 8 kategoride ~100 temel besin --------------------------
//
// Porsiyon gramajları uygulamadaki varsayılan porsiyon içindir; USDA
// değerleri 100 g bazında alınır, gramaj yalnızca gösterim/ölçek metası.

const GIRDILER: Girdi[] = [
  // === Sebzeler ===
  { ara: 'tomatoes, red, ripe, raw, year round average', isim: 'Domates', aramaAdlari: ['domates', 'tomato'], kategori: 'sebze', porsiyonAdi: '1 orta boy', porsiyonGram: 120 },
  { ara: 'cucumber, with peel, raw', isim: 'Salatalık', aramaAdlari: ['salatalik', 'hiyar', 'cucumber'], kategori: 'sebze', porsiyonAdi: '1 orta boy', porsiyonGram: 150 },
  { ara: 'peppers, sweet, green, raw', isim: 'Yeşil Biber', aramaAdlari: ['yesil biber', 'sivri biber', 'green pepper'], kategori: 'sebze', porsiyonAdi: '1 adet', porsiyonGram: 75 },
  { ara: 'peppers, sweet, red, raw', isim: 'Kırmızı Biber', aramaAdlari: ['kirmizi biber', 'kapya biber', 'red pepper'], kategori: 'sebze', porsiyonAdi: '1 adet', porsiyonGram: 75 },
  { ara: 'eggplant, cooked, boiled, drained, without salt', isim: 'Patlıcan (haşlanmış)', aramaAdlari: ['patlican', 'eggplant', 'aubergine'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 100 },
  { ara: 'squash, summer, zucchini, includes skin, cooked, boiled, drained, without salt', isim: 'Kabak (haşlanmış)', aramaAdlari: ['kabak', 'sakiz kabagi', 'zucchini'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 120 },
  { ara: 'carrots, raw', isim: 'Havuç', aramaAdlari: ['havuc', 'carrot'], kategori: 'sebze', porsiyonAdi: '1 orta boy', porsiyonGram: 60 },
  { ara: 'onions, raw', isim: 'Soğan', aramaAdlari: ['sogan', 'kuru sogan', 'onion'], kategori: 'sebze', porsiyonAdi: '1 orta boy', porsiyonGram: 110 },
  { ara: 'potatoes, boiled, cooked without skin, flesh, without salt', isim: 'Patates (haşlanmış)', aramaAdlari: ['patates', 'haslanmis patates', 'potato'], kategori: 'sebze', porsiyonAdi: '1 orta boy', porsiyonGram: 150 },
  { ara: 'spinach, cooked, boiled, drained, without salt', isim: 'Ispanak (haşlanmış)', aramaAdlari: ['ispanak', 'spinach'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 100 },
  { ara: 'lettuce, cos or romaine, raw', isim: 'Marul', aramaAdlari: ['marul', 'kivircik', 'lettuce', 'romaine'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 80 },
  { ara: 'broccoli, cooked, boiled, drained, without salt', isim: 'Brokoli (haşlanmış)', aramaAdlari: ['brokoli', 'broccoli'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'cauliflower, cooked, boiled, drained, without salt', isim: 'Karnabahar (haşlanmış)', aramaAdlari: ['karnabahar', 'cauliflower'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'beans, snap, green, cooked, boiled, drained, without salt', isim: 'Taze Fasulye (haşlanmış)', aramaAdlari: ['taze fasulye', 'ayse kadin fasulye', 'green beans'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 125 },
  { ara: 'peas, green, cooked, boiled, drained, without salt', isim: 'Bezelye (haşlanmış)', aramaAdlari: ['bezelye', 'green peas'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 100 },
  { ara: 'corn, sweet, yellow, cooked, boiled, drained, without salt', isim: 'Mısır (haşlanmış)', aramaAdlari: ['misir', 'haslanmis misir', 'sweet corn'], kategori: 'sebze', porsiyonAdi: '1 orta boy koçan', porsiyonGram: 100 },
  { ara: 'radishes, raw', isim: 'Turp', aramaAdlari: ['turp', 'kirmizi turp', 'radish'], kategori: 'sebze', porsiyonAdi: '5 adet', porsiyonGram: 50 },
  { ara: 'beets, cooked, boiled, drained', isim: 'Pancar (haşlanmış)', aramaAdlari: ['pancar', 'kirmizi pancar', 'beetroot', 'beets'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 85 },
  { ara: 'celeriac, cooked, boiled, drained, without salt', isim: 'Kereviz (haşlanmış)', aramaAdlari: ['kereviz', 'kok kereviz', 'celeriac', 'celery root'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 100 },
  { ara: 'leeks, (bulb and lower leaf-portion), cooked, boiled, drained, without salt', isim: 'Pırasa (haşlanmış)', aramaAdlari: ['pirasa', 'leek'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 125 },
  { ara: 'cabbage, cooked, boiled, drained, without salt', isim: 'Lahana (haşlanmış)', aramaAdlari: ['lahana', 'beyaz lahana', 'cabbage'], kategori: 'sebze', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },

  // === Meyveler ===
  { ara: 'apples, raw, with skin', isim: 'Elma', aramaAdlari: ['elma', 'apple'], kategori: 'meyve', porsiyonAdi: '1 orta boy', porsiyonGram: 150 },
  { ara: 'bananas, raw', isim: 'Muz', aramaAdlari: ['muz', 'banana'], kategori: 'meyve', porsiyonAdi: '1 orta boy', porsiyonGram: 120 },
  { ara: 'oranges, raw, all commercial varieties', isim: 'Portakal', aramaAdlari: ['portakal', 'orange'], kategori: 'meyve', porsiyonAdi: '1 orta boy', porsiyonGram: 140 },
  { ara: 'tangerines, (mandarin oranges), raw', isim: 'Mandalina', aramaAdlari: ['mandalina', 'mandarin', 'tangerine'], kategori: 'meyve', porsiyonAdi: '1 orta boy', porsiyonGram: 90 },
  { ara: 'grapes, red or green (european type, such as thompson seedless), raw', isim: 'Üzüm', aramaAdlari: ['uzum', 'grapes'], kategori: 'meyve', porsiyonAdi: '1 küçük salkım', porsiyonGram: 100 },
  { ara: 'watermelon, raw', isim: 'Karpuz', aramaAdlari: ['karpuz', 'watermelon'], kategori: 'meyve', porsiyonAdi: '1 dilim', porsiyonGram: 200 },
  { ara: 'melons, cantaloupe, raw', isim: 'Kavun', aramaAdlari: ['kavun', 'melon', 'cantaloupe'], kategori: 'meyve', porsiyonAdi: '1 dilim', porsiyonGram: 160 },
  { ara: 'peaches, raw', isim: 'Şeftali', aramaAdlari: ['seftali', 'peach'], kategori: 'meyve', porsiyonAdi: '1 orta boy', porsiyonGram: 150 },
  { ara: 'apricots, raw', isim: 'Kayısı', aramaAdlari: ['kayisi', 'apricot'], kategori: 'meyve', porsiyonAdi: '3 adet', porsiyonGram: 105 },
  { ara: 'plums, raw', isim: 'Erik', aramaAdlari: ['erik', 'plum'], kategori: 'meyve', porsiyonAdi: '2 adet', porsiyonGram: 130 },
  { ara: 'pears, raw', isim: 'Armut', aramaAdlari: ['armut', 'pear'], kategori: 'meyve', porsiyonAdi: '1 orta boy', porsiyonGram: 175 },
  { ara: 'strawberries, raw', isim: 'Çilek', aramaAdlari: ['cilek', 'strawberry'], kategori: 'meyve', porsiyonAdi: '1 kase', porsiyonGram: 150 },
  { ara: 'cherries, sweet, raw', isim: 'Kiraz', aramaAdlari: ['kiraz', 'sweet cherry'], kategori: 'meyve', porsiyonAdi: '1 kase', porsiyonGram: 140 },
  { ara: 'cherries, sour, red, raw', isim: 'Vişne', aramaAdlari: ['visne', 'sour cherry'], kategori: 'meyve', porsiyonAdi: '1 kase', porsiyonGram: 130 },
  { ara: 'figs, raw', isim: 'İncir', aramaAdlari: ['incir', 'taze incir', 'fig'], kategori: 'meyve', porsiyonAdi: '2 adet', porsiyonGram: 100 },
  { ara: 'pomegranates, raw', isim: 'Nar', aramaAdlari: ['nar', 'pomegranate'], kategori: 'meyve', porsiyonAdi: '1/2 adet', porsiyonGram: 140 },
  { ara: 'pineapple, raw, all varieties', isim: 'Ananas', aramaAdlari: ['ananas', 'pineapple'], kategori: 'meyve', porsiyonAdi: '1 dilim', porsiyonGram: 80 },
  { ara: 'kiwifruit, green, raw', isim: 'Kivi', aramaAdlari: ['kivi', 'kiwi'], kategori: 'meyve', porsiyonAdi: '1 adet', porsiyonGram: 75 },
  { ara: 'avocados, raw, all commercial varieties', isim: 'Avokado', aramaAdlari: ['avokado', 'avocado'], kategori: 'meyve', porsiyonAdi: '1/2 adet', porsiyonGram: 100 },
  { ara: 'dates, medjool', isim: 'Hurma', aramaAdlari: ['hurma', 'date', 'medjool'], kategori: 'meyve', porsiyonAdi: '2 adet', porsiyonGram: 48 },

  // === Tahıl ve ekmek ===
  { ara: 'bread, white, commercially prepared', isim: 'Beyaz Ekmek', aramaAdlari: ['beyaz ekmek', 'white bread'], kategori: 'tahil', porsiyonAdi: '1 dilim', porsiyonGram: 30 },
  { ara: 'bread, whole-wheat, commercially prepared', isim: 'Tam Buğday Ekmeği', aramaAdlari: ['tam bugday ekmegi', 'kepekli ekmek', 'whole wheat bread'], kategori: 'tahil', porsiyonAdi: '1 dilim', porsiyonGram: 32 },
  { ara: 'bagels, plain, enriched, with calcium propionate (includes onion, poppy, sesame)', isim: 'Simit', aramaAdlari: ['simit', 'gevrek', 'bagel'], kategori: 'tahil', porsiyonAdi: '1 adet', porsiyonGram: 100 },
  { ara: 'tortillas, ready-to-bake or -fry, flour, refrigerated', isim: 'Lavaş', aramaAdlari: ['lavas', 'durum ekmegi', 'flatbread', 'tortilla'], kategori: 'tahil', porsiyonAdi: '1 adet', porsiyonGram: 50 },
  { ara: 'bread, pita, white, enriched', isim: 'Pide', aramaAdlari: ['pide', 'ramazan pidesi', 'pita bread'], kategori: 'tahil', porsiyonAdi: '1/4 adet', porsiyonGram: 75 },
  { ara: 'bulgur, cooked', isim: 'Bulgur Pilavı', aramaAdlari: ['bulgur', 'bulgur pilavi'], kategori: 'tahil', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'rice, white, long-grain, regular, enriched, cooked', isim: 'Pirinç Pilavı', aramaAdlari: ['pirinc', 'pilav', 'pilavlik pirinc', 'white rice'], kategori: 'tahil', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'pasta, cooked, enriched, without added salt', isim: 'Makarna (haşlanmış)', aramaAdlari: ['makarna', 'spagetti', 'pasta'], kategori: 'tahil', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'oats, regular and quick, not fortified, dry', isim: 'Yulaf Ezmesi (kuru)', aramaAdlari: ['yulaf', 'yulaf ezmesi', 'oats', 'oatmeal'], kategori: 'tahil', porsiyonAdi: '1 kase (kuru)', porsiyonGram: 40 },
  { ara: 'couscous, cooked', isim: 'Kuskus (haşlanmış)', aramaAdlari: ['kuskus', 'couscous'], kategori: 'tahil', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'cereals ready-to-eat, corn flakes, plain', isim: 'Mısır Gevreği', aramaAdlari: ['misir gevregi', 'corn flakes', 'cornflakes'], kategori: 'tahil', porsiyonAdi: '1 kase', porsiyonGram: 30 },

  // === Protein ===
  { ara: 'chicken, broilers or fryers, breast, meat only, cooked, roasted', isim: 'Tavuk Göğsü (ızgara)', aramaAdlari: ['tavuk gogsu', 'izgara tavuk', 'chicken breast'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 120 },
  { ara: 'chicken, broilers or fryers, thigh, meat only, cooked, roasted', isim: 'Tavuk But', aramaAdlari: ['tavuk but', 'tavuk bacak', 'chicken thigh'], kategori: 'protein', porsiyonAdi: '1 adet', porsiyonGram: 100 },
  { ara: 'beef, ground, 85% lean meat / 15% fat, patty, cooked, pan-broiled', isim: 'Dana Kıyma', aramaAdlari: ['dana kiyma', 'kiyma', 'ground beef'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 100 },
  { ara: 'beef, loin, top sirloin steak, boneless, separable lean only, trimmed to 1/8 inch fat, all grades, cooked, grilled', isim: 'Dana Biftek', aramaAdlari: ['dana biftek', 'bonfile', 'beef steak', 'sirloin'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'lamb, domestic, leg, whole (shank and sirloin), separable lean only, trimmed to 1/4 inch fat, choice, cooked, roasted', isim: 'Kuzu Eti', aramaAdlari: ['kuzu', 'kuzu eti', 'lamb'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 120 },
  { ara: 'turkey, whole, breast, meat only, roasted', isim: 'Hindi Göğsü', aramaAdlari: ['hindi', 'hindi gogsu', 'turkey breast'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 120 },
  { ara: 'fish, salmon, atlantic, farmed, cooked, dry heat', isim: 'Somon', aramaAdlari: ['somon', 'salmon'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'fish, sea bass, mixed species, cooked, dry heat', isim: 'Levrek', aramaAdlari: ['levrek', 'sea bass'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 150 },
  { ara: 'fish, tuna, light, canned in water, drained solids', isim: 'Ton Balığı (konserve)', aramaAdlari: ['ton baligi', 'tuna', 'konserve balik'], kategori: 'protein', porsiyonAdi: '1 kutu', porsiyonGram: 80 },
  { ara: 'fish, anchovy, european, raw', isim: 'Hamsi', aramaAdlari: ['hamsi', 'anchovy'], kategori: 'protein', porsiyonAdi: '1 porsiyon', porsiyonGram: 100 },
  { ara: 'egg, whole, cooked, hard-boiled', isim: 'Yumurta (haşlanmış)', aramaAdlari: ['yumurta', 'haslanmis yumurta', 'boiled egg'], kategori: 'protein', porsiyonAdi: '1 adet', porsiyonGram: 50 },
  { ara: 'lentils, mature seeds, cooked, boiled, without salt', isim: 'Mercimek (haşlanmış)', aramaAdlari: ['mercimek', 'yesil mercimek', 'kirmizi mercimek', 'lentils'], kategori: 'protein', porsiyonAdi: '1 kase', porsiyonGram: 180 },
  { ara: 'chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt', isim: 'Nohut (haşlanmış)', aramaAdlari: ['nohut', 'garbanzo', 'chickpea'], kategori: 'protein', porsiyonAdi: '1 kase', porsiyonGram: 160 },
  { ara: 'beans, white, mature seeds, cooked, boiled, without salt', isim: 'Kuru Fasulye (haşlanmış)', aramaAdlari: ['kuru fasulye', 'white beans', 'navy beans'], kategori: 'protein', porsiyonAdi: '1 kase', porsiyonGram: 180 },
  { ara: 'beans, cranberry (roman), mature seeds, cooked, boiled, without salt', isim: 'Barbunya (haşlanmış)', aramaAdlari: ['barbunya', 'cranberry beans', 'roman beans'], kategori: 'protein', porsiyonAdi: '1 kase', porsiyonGram: 175 },

  // === Süt ürünleri ===
  { ara: 'milk, whole, 3.25% milkfat, with added vitamin d', isim: 'Süt (tam yağlı)', aramaAdlari: ['sut', 'tam yagli sut', 'whole milk'], kategori: 'sut-urunu', porsiyonAdi: '1 bardak', porsiyonGram: 200 },
  { ara: 'milk, reduced fat, fluid, 2% milkfat, with added vitamin a and vitamin d', isim: 'Süt (yarım yağlı)', aramaAdlari: ['yarim yagli sut', 'light sut', 'reduced fat milk'], kategori: 'sut-urunu', porsiyonAdi: '1 bardak', porsiyonGram: 200 },
  { ara: 'yogurt, plain, whole milk', isim: 'Yoğurt (tam yağlı)', aramaAdlari: ['yogurt', 'tam yagli yogurt', 'plain yogurt'], kategori: 'sut-urunu', porsiyonAdi: '1 kase', porsiyonGram: 200 },
  { ara: 'milk, buttermilk, fluid, cultured, lowfat', isim: 'Ayran', aramaAdlari: ['ayran', 'buttermilk'], kategori: 'sut-urunu', porsiyonAdi: '1 bardak', porsiyonGram: 200 },
  { ara: 'cheese, feta', isim: 'Beyaz Peynir', aramaAdlari: ['beyaz peynir', 'feta', 'feta cheese'], kategori: 'sut-urunu', porsiyonAdi: '1 dilim', porsiyonGram: 30 },
  { ara: 'cheese, provolone', isim: 'Kaşar Peyniri', aramaAdlari: ['kasar', 'kasar peyniri', 'provolone', 'kashkaval'], kategori: 'sut-urunu', porsiyonAdi: '1 dilim', porsiyonGram: 30 },
  { ara: 'cheese, ricotta, whole milk', isim: 'Lor Peyniri', aramaAdlari: ['lor', 'lor peyniri', 'ricotta', 'cottage cheese'], kategori: 'sut-urunu', porsiyonAdi: '1 porsiyon', porsiyonGram: 50 },
  { ara: 'cheese, cream', isim: 'Labne', aramaAdlari: ['labne', 'krem peynir', 'cream cheese'], kategori: 'sut-urunu', porsiyonAdi: '1 yemek kaşığı', porsiyonGram: 20 },
  { ara: 'butter, salted', isim: 'Tereyağı', aramaAdlari: ['tereyagi', 'butter'], kategori: 'sut-urunu', porsiyonAdi: '1 tatlı kaşığı', porsiyonGram: 10 },
  { ara: 'cream, fluid, heavy whipping', isim: 'Kaymak', aramaAdlari: ['kaymak', 'heavy cream', 'clotted cream'], kategori: 'sut-urunu', porsiyonAdi: '1 yemek kaşığı', porsiyonGram: 15 },

  // === Kuruyemiş ve yağ ===
  { ara: 'nuts, walnuts, english', isim: 'Ceviz', aramaAdlari: ['ceviz', 'walnut'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 avuç', porsiyonGram: 30 },
  { ara: 'nuts, hazelnuts or filberts', isim: 'Fındık', aramaAdlari: ['findik', 'hazelnut'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 avuç', porsiyonGram: 30 },
  { ara: 'nuts, almonds', isim: 'Badem', aramaAdlari: ['badem', 'almond'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 avuç', porsiyonGram: 30 },
  { ara: 'nuts, pistachio nuts, raw', isim: 'Antep Fıstığı', aramaAdlari: ['fistik', 'antep fistigi', 'pistachio'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 avuç', porsiyonGram: 30 },
  { ara: 'seeds, sunflower seed kernels, dried', isim: 'Ay Çekirdeği', aramaAdlari: ['ay cekirdegi', 'sunflower seeds', 'cekirdek'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 avuç', porsiyonGram: 30 },
  { ara: 'olives, ripe, canned (small-extra large)', isim: 'Siyah Zeytin', aramaAdlari: ['siyah zeytin', 'zeytin', 'black olives'], kategori: 'yag-kuruyemis', porsiyonAdi: '5 adet', porsiyonGram: 20 },
  { ara: 'olives, pickled, canned or bottled, green', isim: 'Yeşil Zeytin', aramaAdlari: ['yesil zeytin', 'zeytin', 'green olives'], kategori: 'yag-kuruyemis', porsiyonAdi: '5 adet', porsiyonGram: 20 },
  { ara: 'oil, olive, salad or cooking', isim: 'Zeytinyağı', aramaAdlari: ['zeytinyagi', 'olive oil'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 yemek kaşığı', porsiyonGram: 14 },
  { ara: 'oil, sunflower, linoleic (approx. 65%)', isim: 'Ayçiçek Yağı', aramaAdlari: ['aycicek yagi', 'sivi yag', 'sunflower oil'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 yemek kaşığı', porsiyonGram: 14 },
  { ara: 'seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)', isim: 'Tahin', aramaAdlari: ['tahin', 'susam ezmesi', 'tahini'], kategori: 'yag-kuruyemis', porsiyonAdi: '1 yemek kaşığı', porsiyonGram: 15 },

  // === Kızartma ve atıştırmalık ===
  { ara: 'potatoes, french fried, all types, salt added in processing, frozen, oven-heated', isim: 'Patates Kızartması', aramaAdlari: ['patates kizartmasi', 'french fries', 'parmak patates'], kategori: 'atistirmalik', porsiyonAdi: '1 porsiyon', porsiyonGram: 120 },
  { ara: 'snacks, potato chips, plain, salted', isim: 'Patates Cipsi', aramaAdlari: ['cips', 'patates cipsi', 'potato chips'], kategori: 'atistirmalik', porsiyonAdi: '1 küçük paket', porsiyonGram: 30 },
  { ara: 'crackers, saltines (includes oyster, soda, soup)', isim: 'Kraker', aramaAdlari: ['kraker', 'tuzlu kraker', 'crackers'], kategori: 'atistirmalik', porsiyonAdi: '5 adet', porsiyonGram: 15 },
  { ara: 'cookies, vanilla wafers, lower fat', isim: 'Bisküvi', aramaAdlari: ['biskuvi', 'petibor', 'biscuit', 'cookies'], kategori: 'atistirmalik', porsiyonAdi: '4 adet', porsiyonGram: 30 },
  { ara: 'candies, milk chocolate', isim: 'Sütlü Çikolata', aramaAdlari: ['cikolata', 'sutlu cikolata', 'milk chocolate'], kategori: 'atistirmalik', porsiyonAdi: '1 küçük kalıp', porsiyonGram: 30 },

  // === İçecek ===
  { ara: 'beverages, tea, black, brewed, prepared with tap water', isim: 'Çay (demli)', aramaAdlari: ['cay', 'siyah cay', 'demli cay', 'black tea'], kategori: 'icecek', porsiyonAdi: '1 bardak', porsiyonGram: 200 },
  { ara: 'beverages, coffee, brewed, prepared with tap water', isim: 'Filtre Kahve', aramaAdlari: ['kahve', 'filtre kahve', 'coffee'], kategori: 'icecek', porsiyonAdi: '1 fincan', porsiyonGram: 200 },
  { ara: 'beverages, coffee, brewed, espresso, restaurant-prepared', isim: 'Türk Kahvesi', aramaAdlari: ['turk kahvesi', 'turkish coffee', 'espresso'], kategori: 'icecek', porsiyonAdi: '1 fincan', porsiyonGram: 70 },
  { ara: 'beverages, carbonated, cola, contains caffeine', isim: 'Kola', aramaAdlari: ['kola', 'cola', 'gazoz'], kategori: 'icecek', porsiyonAdi: '1 kutu', porsiyonGram: 330 },
  { ara: 'orange juice, chilled, includes from concentrate', isim: 'Meyve Suyu (portakal)', aramaAdlari: ['meyve suyu', 'portakal suyu', 'orange juice'], kategori: 'icecek', porsiyonAdi: '1 bardak', porsiyonGram: 200 },
  { ara: 'vegetable juice cocktail, canned', isim: 'Şalgam Suyu', aramaAdlari: ['salgam', 'salgam suyu', 'fermented turnip juice'], kategori: 'icecek', porsiyonAdi: '1 bardak', porsiyonGram: 200 },

  // === Dünya mutfağı (bileşik — çoğu FNDDS'te; fnddsIzinli: true) =====
  // porsiyonGram = bir servisin gramajı (bileşik yemekte kritik).
  { ara: 'hamburger, single patty, plain, on bun', isim: 'Hamburger', aramaAdlari: ['hamburger', 'kofte burger'], kategori: 'dunya', porsiyonAdi: '1 adet (110 g)', porsiyonGram: 110, fnddsIzinli: true },
  { ara: 'cheeseburger, single patty, plain, on bun', isim: 'Cheeseburger', aramaAdlari: ['cheeseburger', 'kasarli burger'], kategori: 'dunya', porsiyonAdi: '1 adet (120 g)', porsiyonGram: 120, fnddsIzinli: true },
  { ara: 'pizza, cheese, regular crust', isim: 'Pizza (Margherita)', aramaAdlari: ['pizza', 'margarita pizza', 'peynirli pizza'], kategori: 'dunya', porsiyonAdi: '1 dilim (110 g)', porsiyonGram: 110, fnddsIzinli: true },
  { ara: 'pizza, pepperoni, regular crust', isim: 'Pizza (Pepperoni)', aramaAdlari: ['pepperoni pizza', 'sucuklu pizza'], kategori: 'dunya', porsiyonAdi: '1 dilim (110 g)', porsiyonGram: 110, fnddsIzinli: true },
  { ara: 'sushi roll, california roll', isim: 'Sushi (California Roll)', aramaAdlari: ['sushi', 'maki', 'california roll'], kategori: 'dunya', porsiyonAdi: '6 parça (180 g)', porsiyonGram: 180, fnddsIzinli: true },
  { ara: 'spaghetti with meat sauce', isim: 'Makarna (Bolonez)', aramaAdlari: ['bolonez', 'kiymali makarna', 'spaghetti bolognese'], kategori: 'dunya', porsiyonAdi: '1 porsiyon (250 g)', porsiyonGram: 250, fnddsIzinli: true },
  { ara: 'pasta with white sauce', isim: 'Makarna (Alfredo)', aramaAdlari: ['alfredo', 'kremali makarna', 'fettuccine alfredo'], kategori: 'dunya', porsiyonAdi: '1 porsiyon (240 g)', porsiyonGram: 240, fnddsIzinli: true },
  { ara: 'lasagna with meat', isim: 'Lazanya', aramaAdlari: ['lazanya', 'lasagna'], kategori: 'dunya', porsiyonAdi: '1 porsiyon (250 g)', porsiyonGram: 250, fnddsIzinli: true },
  { ara: 'taco with beef, cheese and lettuce', isim: 'Taco (Etli)', aramaAdlari: ['taco', 'meksika taco'], kategori: 'dunya', porsiyonAdi: '1 adet (100 g)', porsiyonGram: 100, fnddsIzinli: true },
  { ara: 'burrito with beef and beans', isim: 'Burrito', aramaAdlari: ['burrito', 'durum burrito'], kategori: 'dunya', porsiyonAdi: '1 adet (220 g)', porsiyonGram: 220, fnddsIzinli: true },
  { ara: 'pad thai', isim: 'Pad Thai', aramaAdlari: ['pad thai', 'tayland noodle'], kategori: 'dunya', porsiyonAdi: '1 porsiyon (300 g)', porsiyonGram: 300, fnddsIzinli: true },
  { ara: 'ramen noodle soup', isim: 'Ramen', aramaAdlari: ['ramen', 'japon eristesi corbasi'], kategori: 'dunya', porsiyonAdi: '1 kase (400 g)', porsiyonGram: 400, fnddsIzinli: true },
  { ara: 'chow mein noodles with vegetables', isim: 'Noodle (Sebzeli)', aramaAdlari: ['noodle', 'eriste', 'chow mein'], kategori: 'dunya', porsiyonAdi: '1 porsiyon (200 g)', porsiyonGram: 200, fnddsIzinli: true },
  { ara: 'chicken fajita', isim: 'Fajita (Tavuk)', aramaAdlari: ['fajita', 'tavuk fajita'], kategori: 'dunya', porsiyonAdi: '1 adet (180 g)', porsiyonGram: 180, fnddsIzinli: true },
  { ara: 'club sandwich with bacon', isim: 'Club Sandviç', aramaAdlari: ['club sandwich', 'kulüp sandvic'], kategori: 'dunya', porsiyonAdi: '1 adet (230 g)', porsiyonGram: 230, fnddsIzinli: true },
  { ara: 'grilled cheese sandwich', isim: 'Tost (Kaşarlı)', aramaAdlari: ['tost', 'kasarli tost', 'grilled cheese'], kategori: 'dunya', porsiyonAdi: '1 adet (120 g)', porsiyonGram: 120, fnddsIzinli: true },
  { ara: 'fried chicken, breast, meat and skin', isim: 'Kızarmış Tavuk', aramaAdlari: ['kizarmis tavuk', 'fried chicken', 'kfc tavuk'], kategori: 'dunya', porsiyonAdi: '1 parça (140 g)', porsiyonGram: 140, fnddsIzinli: true },
  { ara: 'chicken nuggets', isim: 'Tavuk Nugget', aramaAdlari: ['nugget', 'tavuk nugget'], kategori: 'dunya', porsiyonAdi: '6 adet (96 g)', porsiyonGram: 96, fnddsIzinli: true },
  { ara: 'frankfurter or hot dog sandwich, plain, on bun', isim: 'Hot Dog', aramaAdlari: ['hot dog', 'sosisli sandvic'], kategori: 'dunya', porsiyonAdi: '1 adet (100 g)', porsiyonGram: 100, fnddsIzinli: true },
  { ara: 'waffle, plain', isim: 'Waffle', aramaAdlari: ['waffle', 'gofret'], kategori: 'dunya', porsiyonAdi: '1 adet (75 g)', porsiyonGram: 75, fnddsIzinli: true },
  { ara: 'pancakes, plain', isim: 'Pancake', aramaAdlari: ['pancake', 'krep', 'akitma'], kategori: 'dunya', porsiyonAdi: '2 adet (80 g)', porsiyonGram: 80, fnddsIzinli: true },
  { ara: 'doughnut, yeast, glazed', isim: 'Donut', aramaAdlari: ['donut', 'halkali tatli'], kategori: 'dunya', porsiyonAdi: '1 adet (60 g)', porsiyonGram: 60, fnddsIzinli: true },
  { ara: 'cheesecake, plain', isim: 'Cheesecake', aramaAdlari: ['cheesecake', 'peynirli pasta'], kategori: 'dunya', porsiyonAdi: '1 dilim (110 g)', porsiyonGram: 110, fnddsIzinli: true },
  { ara: 'tiramisu', isim: 'Tiramisu', aramaAdlari: ['tiramisu'], kategori: 'dunya', porsiyonAdi: '1 dilim (100 g)', porsiyonGram: 100, fnddsIzinli: true },
  { ara: 'fruit smoothie', isim: 'Smoothie', aramaAdlari: ['smoothie', 'meyve smoothie'], kategori: 'dunya', porsiyonAdi: '1 bardak (250 g)', porsiyonGram: 250, fnddsIzinli: true },
  { ara: 'milkshake, vanilla', isim: 'Milkshake', aramaAdlari: ['milkshake', 'vanilyali milkshake'], kategori: 'dunya', porsiyonAdi: '1 bardak (300 g)', porsiyonGram: 300, fnddsIzinli: true },
];

// --- Yardımcılar ---------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** .env dosyasını (varsa) basitçe ayrıştırıp process.env'e ekler. */
function envYukle(): void {
  const yol = resolve(process.cwd(), '.env');
  let icerik: string;
  try {
    icerik = readFileSync(yol, 'utf8');
  } catch {
    return; // .env yoksa sorun değil
  }
  for (const satir of icerik.split('\n')) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith('#')) {
      continue;
    }
    const esitlik = temiz.indexOf('=');
    if (esitlik === -1) {
      continue;
    }
    const anahtar = temiz.slice(0, esitlik).trim();
    let deger = temiz.slice(esitlik + 1).trim();
    if (
      (deger.startsWith('"') && deger.endsWith('"')) ||
      (deger.startsWith("'") && deger.endsWith("'"))
    ) {
      deger = deger.slice(1, -1);
    }
    if (!(anahtar in process.env)) {
      process.env[anahtar] = deger;
    }
  }
}

function argDeger(ad: string): string | undefined {
  const i = process.argv.indexOf(`--${ad}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

type FdcBesinOgesi = {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
  amount?: number;
};

type FdcGida = {
  fdcId: number;
  description: string;
  dataType: string;
  score?: number;
  foodNutrients?: FdcBesinOgesi[];
};

function besinDegeri(gida: FdcGida, id: number): number | null {
  const ogeler = gida.foodNutrients ?? [];
  const oge = ogeler.find(
    (n) => n.nutrientId === id || n.nutrientNumber === String(id)
  );
  if (!oge) {
    return null;
  }
  const ham = oge.value ?? oge.amount;
  return typeof ham === 'number' && Number.isFinite(ham) ? ham : null;
}

function enerjiDegeri(gida: FdcGida): number | null {
  const birincil = besinDegeri(gida, BESIN_ID.kalori);
  if (birincil != null) {
    return birincil;
  }
  for (const yedek of ENERJI_YEDEK_ID) {
    const deger = besinDegeri(gida, yedek);
    if (deger != null) {
      return deger;
    }
  }
  return null;
}

/** Bir gıdada kaç temel besin öğesinin (kalori+P+K+Y+lif) dolu olduğunu sayar. */
function besinTamlik(gida: FdcGida): number {
  let sayi = 0;
  if (enerjiDegeri(gida) != null) sayi += 1;
  if (besinDegeri(gida, BESIN_ID.protein) != null) sayi += 1;
  if (besinDegeri(gida, BESIN_ID.karbonhidrat) != null) sayi += 1;
  if (besinDegeri(gida, BESIN_ID.yag) != null) sayi += 1;
  if (besinDegeri(gida, BESIN_ID.lif) != null) sayi += 1;
  return sayi;
}

/** Alaka dışı kalan, ölçüt olarak sayılmayacak kelimeler. */
const STOPKELIME = new Set([
  'with', 'and', 'the', 'for', 'all', 'includes', 'commercial', 'varieties', 'year',
  'round', 'average', 'most', 'common', 'type', 'without', 'added', 'salt', 'drained',
  'regular', 'light', 'plain', 'fluid', 'prepared', 'tap', 'water', 'commercially',
  'made', 'style', 'mixed', 'species', 'raw', 'cooked', 'boiled', 'roasted', 'baked',
  'fried', 'beverages', 'beverage', 'snacks', 'snack', 'candies', 'candy', 'ready',
  'eat', 'from', 'includes', 'approx',
]);

/** Basit çoğul/tekil sadeleştirme: "peppers" ~ "pepper", "berries" ~ "berry". */
function koklar(k: string): string[] {
  const set = new Set([k]);
  if (k.endsWith('ies')) set.add(`${k.slice(0, -3)}y`);
  if (k.endsWith('es')) set.add(k.slice(0, -2));
  if (k.endsWith('s')) set.add(k.slice(0, -1));
  set.add(`${k}s`);
  return [...set];
}

function anlamliKelimeler(metin: string): string[] {
  return metin
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((k) => k.length >= 3 && !STOPKELIME.has(k));
}

/** Sorgu ile açıklama arasındaki (kök bazlı) ortak anlamlı kelime sayısı. */
function ortakKelime(sorgu: string, aciklama: string): number {
  const acikSet = new Set(anlamliKelimeler(aciklama));
  let n = 0;
  for (const k of anlamliKelimeler(sorgu)) {
    if (koklar(k).some((v) => acikSet.has(v))) {
      n += 1;
    }
  }
  return n;
}

/**
 * En uygun gıdayı seçer. Sıralama önceliği:
 *   (1) sorguyla ORTAK KELİME sayısı (alaka) — en az 1 şart,
 *   (2) besin öğesi tamlığı (kalori+P+K+Y+lif; lifi olanı yeğle),
 *   (3) dataType tercihi (Foundation > SR Legacy > FNDDS),
 *   (4) API'nin kendi alaka sırası.
 * Hiçbir sonuç sorguyla kelime paylaşmıyorsa eşleşme yok sayılır.
 */
function enIyiEslesme(
  sonuclar: FdcGida[],
  sorgu: string,
  fnddsIzinli: boolean
): FdcGida | null {
  const tipSirasi = fnddsIzinli ? [...VERI_TIPLERI, FNDDS_TIPI] : [...VERI_TIPLERI];
  const adaylar = sonuclar
    .map((g, i) => ({ g, i, ort: ortakKelime(sorgu, g.description) }))
    .filter((x) => tipSirasi.includes(x.g.dataType) && x.ort >= 1);
  if (adaylar.length === 0) {
    return null;
  }
  adaylar.sort((a, b) => {
    if (a.ort !== b.ort) {
      return b.ort - a.ort;
    }
    const tamFark = besinTamlik(b.g) - besinTamlik(a.g);
    if (tamFark !== 0) {
      return tamFark;
    }
    const tipFark = tipSirasi.indexOf(a.g.dataType) - tipSirasi.indexOf(b.g.dataType);
    if (tipFark !== 0) {
      return tipFark;
    }
    return a.i - b.i;
  });
  return adaylar[0].g;
}

function yuvarla(deger: number, basamak = 1): number {
  const kat = 10 ** basamak;
  return Math.round(deger * kat) / kat;
}

const SLUG_HARF: Record<string, string> = {
  ç: 'c', ş: 's', ğ: 'g', ı: 'i', ö: 'o', ü: 'u', â: 'a', î: 'i', û: 'u',
};

/** Türkçe ismi kararlı, düzen-bağımsız bir id'ye çevirir: "Antep Fıstığı" -> "usda-antep-fistigi". */
function slugId(isim: string): string {
  const govde = isim
    .toLocaleLowerCase('tr-TR')
    .replace(/[çşğıöüâîû]/g, (h) => SLUG_HARF[h] ?? h)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `usda-${govde}`;
}

// --- Ana akış -----------------------------------------------------------

async function ara(sorgu: string, apiKey: string, fnddsIzinli: boolean): Promise<FdcGida[]> {
  // FDC arama API'si sorgu içindeki "/" karakterinde HTTP 400 veriyor (ör.
  // "85% lean meat / 15% fat", "trimmed to 1/8 inch fat"). Boşluğa çevir.
  const temizSorgu = sorgu.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  const govde = {
    query: temizSorgu,
    dataType: fnddsIzinli ? [...VERI_TIPLERI, FNDDS_TIPI] : [...VERI_TIPLERI],
    pageSize: 25,
    requireAllWords: false,
  };

  for (let deneme = 1; deneme <= 4; deneme += 1) {
    const yanit = await fetch(`${ARAMA_URL}?api_key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(govde),
    });

    if (yanit.status === 429) {
      const retryAfter = Number(yanit.headers.get('retry-after'));
      const bekle = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** deneme * 5000;
      console.warn(`  ! 429 (rate limit). ${Math.round(bekle / 1000)} sn bekleniyor...`);
      await sleep(bekle);
      continue;
    }

    if (!yanit.ok) {
      const metin = await yanit.text().catch(() => '');
      throw new Error(`HTTP ${yanit.status} — ${metin.slice(0, 200)}`);
    }

    const veri = (await yanit.json()) as { foods?: FdcGida[] };
    return veri.foods ?? [];
  }

  throw new Error('Rate limit sonrası 4 denemede de başarısız.');
}

async function main(): Promise<void> {
  envYukle();

  const apiKey = process.env.USDA_API_KEY?.trim() || 'DEMO_KEY';
  if (apiKey === 'DEMO_KEY') {
    console.warn(
      'UYARI: USDA_API_KEY bulunamadı, DEMO_KEY kullanılıyor (saatte ~30 istek sınırı).\n'
    );
  }

  const gecikme = Number(argDeger('delay') ?? process.env.USDA_FETCH_DELAY_MS ?? 3600);
  const limitArg = Number(argDeger('limit') ?? NaN);
  const resume = process.argv.includes('--resume');
  const cikisYolu = resolve(
    process.cwd(),
    argDeger('out') ?? 'scripts/out/usda-foods.json'
  );

  const tumGirdiler = GIRDILER.map((g) => ({ ...g, id: slugId(g.isim) }));

  // --resume: çıktı dosyasında zaten çözülmüş id'leri koru ve o girdileri atla.
  const oncekiler: SeedKaydi[] = [];
  if (resume) {
    try {
      const ham = JSON.parse(readFileSync(cikisYolu, 'utf8')) as SeedKaydi[];
      const gecerliIdler = new Set(tumGirdiler.map((g) => g.id));
      oncekiler.push(...ham.filter((k) => gecerliIdler.has(k.id)));
      console.log(`--resume: ${oncekiler.length} kayıt çıktı dosyasından korunuyor.`);
    } catch {
      console.log('--resume: mevcut çıktı dosyası yok, baştan başlanıyor.');
    }
  }

  const cozulmusIdler = new Set(oncekiler.map((k) => k.id));
  let girdiler = tumGirdiler.filter((g) => !cozulmusIdler.has(g.id));
  if (Number.isFinite(limitArg)) {
    girdiler = girdiler.slice(0, limitArg);
  }

  console.log(`${girdiler.length} besin işlenecek — istek arası ${gecikme} ms bekleme.\n`);

  const kayitlar: SeedKaydi[] = [...oncekiler];
  const eksikler: { isim: string; sebep: string }[] = [];

  for (let i = 0; i < girdiler.length; i += 1) {
    const girdi = girdiler[i];
    const sira = String(i + 1).padStart(2, '0');
    console.log(`[${sira}/${girdiler.length}] "${girdi.ara}" -> ${girdi.isim}`);

    try {
      const fndds = girdi.fnddsIzinli ?? false;
      const sonuclar = await ara(girdi.ara, apiKey, fndds);
      const gida = enIyiEslesme(sonuclar, girdi.ara, fndds);

      if (!gida) {
        eksikler.push({
          isim: girdi.isim,
          sebep: fndds ? 'Foundation/SR Legacy/FNDDS sonucu yok' : 'Foundation/SR Legacy sonucu yok',
        });
        console.warn('  ! eşleşme yok\n');
      } else {
        const kalori = enerjiDegeri(gida);
        const protein = besinDegeri(gida, BESIN_ID.protein);
        const karb = besinDegeri(gida, BESIN_ID.karbonhidrat);
        const yag = besinDegeri(gida, BESIN_ID.yag);
        const lif = besinDegeri(gida, BESIN_ID.lif);

        if (kalori == null || protein == null || karb == null || yag == null) {
          eksikler.push({ isim: girdi.isim, sebep: `Eksik besin öğesi (fdcId ${gida.fdcId})` });
          console.warn(`  ! temel makro eksik (fdcId ${gida.fdcId})\n`);
        } else {
          const kayit: SeedKaydi = {
            id: girdi.id,
            isim: girdi.isim,
            aramaAdlari: [
              ...new Set(
                [girdi.ara, ...(girdi.aramaAdlari ?? [])].map((s) => s.toLowerCase().trim())
              ),
            ],
            kategori: girdi.kategori,
            porsiyonAdi: girdi.porsiyonAdi,
            porsiyonGram: girdi.porsiyonGram,
            kalori100: Math.round(kalori),
            protein100: yuvarla(protein),
            karb100: yuvarla(karb),
            yag100: yuvarla(yag),
            lif100: yuvarla(lif ?? 0),
          };
          kayitlar.push(kayit);
          console.log(
            `  ✓ ${gida.dataType} #${gida.fdcId} — ${kayit.kalori100} kcal / P${kayit.protein100} K${kayit.karb100} Y${kayit.yag100} Lif${kayit.lif100}${
              lif == null ? ' (lif verisi yok, 0 yazıldı)' : ''
            }\n`
          );
        }
      }
    } catch (hata) {
      eksikler.push({ isim: girdi.isim, sebep: String((hata as Error).message ?? hata) });
      console.error(`  ! hata: ${(hata as Error).message ?? hata}\n`);
    }

    if (i < girdiler.length - 1) {
      await sleep(gecikme);
    }
  }

  // Çıktıyı her zaman kanonik GIRDILER sırasına göre yaz (resume ile karışmasın).
  const siraIndeksi = new Map(tumGirdiler.map((g, idx) => [g.id, idx]));
  kayitlar.sort((a, b) => (siraIndeksi.get(a.id) ?? 0) - (siraIndeksi.get(b.id) ?? 0));

  mkdirSync(dirname(cikisYolu), { recursive: true });
  writeFileSync(cikisYolu, `${JSON.stringify(kayitlar, null, 2)}\n`, 'utf8');

  console.log('—'.repeat(48));
  console.log(
    `${kayitlar.length}/${tumGirdiler.length} kayıt yazıldı -> ${cikisYolu}` +
      (resume ? ` (bu turda ${girdiler.length} işlendi)` : '')
  );
  if (eksikler.length > 0) {
    console.log(`\nÇözülemeyen ${eksikler.length} besin:`);
    for (const e of eksikler) {
      console.log(`  - ${e.isim}: ${e.sebep}`);
    }
    console.log('\nİpucu: kendi USDA_API_KEY ile "npm run fetch-usda -- --resume" ile tamamla.');
    process.exitCode = 1;
  }
}

main().catch((hata) => {
  console.error(hata);
  process.exit(1);
});
