/**
 * BİLEŞİK YEMEKLER — malzeme kırılımından HESAPLANIR (uydurma değil).
 *
 * Yöntem
 *   1) TEMEL: her ham malzemenin 100 g başına besin değeri
 *      [kcal, protein_g, karb_g, yag_g, lif_g].
 *      Kaynak: USDA SR Legacy / Foundation tipik değerleri. 13B'deki
 *      scripts/fetch-usda.ts çıktısı geldiğinde bu tablo onunla
 *      birebir güncellenmeli (aynı besinler, aynı isimler).
 *   2) Her yemek için bir porsiyona giren ham malzeme + gram listesi.
 *   3) Porsiyon toplamı = Σ (gram / 100 × TEMEL[malzeme]).
 *   4) Seed şeması 100 g bazında tutulur:
 *        kalori100 = toplamKalori / porsiyonGram × 100   (diğer makrolar da aynı)
 *      Çorba/sulu yemeklerde porsiyonGram, eklenen suyu da içerdiği için
 *      ham malzeme toplamından büyüktür; kızartma/ızgarada nem kaybı
 *      nedeniyle küçüktür. porsiyonGram her kayıtta AÇIKÇA belirtilir.
 *
 * Çıktı: scripts/out/composite-foods.json  +  stdout'ta doğrulama tablosu.
 * Çalıştırma:  node scripts/build-composite-foods.ts   (ağ gerekmez)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type Makro = readonly [kcal: number, protein: number, karb: number, yag: number, lif: number];

// --- TEMEL: 100 g başına [kcal, protein, karb, yağ, lif] --------------
// (ham/kuru ağırlık; "kuru" eki olanlar pişmemiş tahıl/baklagil)

const TEMEL = {
  // tahıl & baklagil (kuru)
  mercimek_kuru: [352, 24.6, 63.4, 1.1, 10.7],
  pirinc_kuru: [365, 7.1, 80.0, 0.7, 1.3],
  bulgur_kuru: [342, 12.3, 75.9, 1.3, 18.3],
  bugday_kuru: [340, 13.7, 71.2, 2.5, 12.2],
  un: [364, 10.3, 76.3, 1.0, 2.7],
  irmik: [360, 12.7, 72.8, 1.1, 3.9],
  nisasta: [381, 0.1, 91.3, 0.1, 0.9],
  galeta_unu: [395, 13.4, 71.9, 5.3, 4.5],
  yufka: [274, 8.5, 54.0, 2.0, 2.3],
  kadayif_hamur: [356, 8.5, 74.0, 1.5, 2.5],
  nohut_kuru: [364, 19.3, 60.7, 6.0, 17.4],
  fasulye_kuru: [333, 23.4, 60.3, 0.8, 15.2],
  // sebze & yeşillik (çiğ)
  sogan: [40, 1.1, 9.3, 0.1, 1.7],
  yesil_sogan: [32, 1.8, 7.3, 0.2, 2.6],
  domates: [18, 0.9, 3.9, 0.2, 1.2],
  salca: [82, 4.3, 18.9, 0.5, 4.1],
  biber_yesil: [20, 0.9, 4.6, 0.2, 1.7],
  biber_kirmizi: [31, 1.0, 6.0, 0.3, 2.1],
  patlican: [25, 1.0, 5.9, 0.2, 3.0],
  kabak: [17, 1.2, 3.1, 0.3, 1.0],
  havuc: [41, 0.9, 9.6, 0.2, 2.8],
  patates: [77, 2.0, 17.5, 0.1, 2.2],
  ispanak: [23, 2.9, 3.6, 0.4, 2.2],
  maydanoz: [36, 3.0, 6.3, 0.8, 3.3],
  sarimsak: [149, 6.4, 33.1, 0.5, 2.1],
  taze_fasulye: [31, 1.8, 7.1, 0.2, 3.4],
  bezelye: [81, 5.4, 14.5, 0.4, 5.7],
  yaprak_salamura: [69, 4.4, 11.6, 1.4, 7.3], // salamura asma yaprağı
  limon_suyu: [22, 0.4, 6.9, 0.2, 0.3],
  // et & yumurta (çiğ)
  dana_kiyma: [254, 17.2, 0.0, 20.0, 0.0], // %85 yağsız
  kuzu_kiyma: [282, 16.6, 0.0, 23.4, 0.0],
  kuzu_kusbasi: [201, 20.3, 0.0, 12.7, 0.0],
  tavuk_gogsu: [120, 22.5, 0.0, 2.6, 0.0], // derisiz çiğ
  tavuk_but: [121, 19.7, 0.0, 4.1, 0.0], // derisiz çiğ
  sucuk: [460, 21.0, 2.0, 41.0, 0.0],
  yumurta: [143, 12.6, 0.7, 9.5, 0.0],
  // süt & yağ
  yogurt: [61, 3.5, 4.7, 3.3, 0.0], // tam yağlı
  sut: [61, 3.2, 4.8, 3.3, 0.0],
  beyaz_peynir: [264, 14.2, 4.1, 21.3, 0.0],
  kasar: [351, 25.6, 2.1, 26.6, 0.0],
  tereyagi: [717, 0.9, 0.1, 81.1, 0.0],
  zeytinyagi: [884, 0.0, 0.0, 100.0, 0.0],
  sivi_yag: [884, 0.0, 0.0, 100.0, 0.0], // ayçiçek
  kaymak: [340, 2.8, 2.8, 36.1, 0.0],
  // kuruyemiş & tatlı
  ceviz: [654, 15.2, 13.7, 65.2, 6.7],
  findik: [628, 15.0, 16.7, 60.8, 9.7],
  antep_fistigi: [560, 20.2, 27.2, 45.3, 10.6],
  tahin: [595, 17.0, 21.2, 53.8, 9.3],
  seker: [387, 0.0, 100.0, 0.0, 0.0],
  pekmez: [293, 0.0, 74.0, 0.0, 0.0],
  kus_uzumu: [283, 4.1, 74.1, 0.5, 6.8],
  kuru_kayisi: [241, 3.4, 62.6, 0.5, 7.3],
  kuru_incir: [249, 3.3, 63.9, 0.9, 9.8],
  nar_tane: [83, 1.7, 18.7, 1.2, 4.0],
} satisfies Record<string, Makro>;

type TemelAnahtar = keyof typeof TEMEL;
type Malzeme = readonly [TemelAnahtar, number]; // [anahtar, gram]

type Kategori = 'corba' | 'ana-yemek' | 'hamur-isi' | 'kahvaltilik' | 'tatli';

type BilesikGirdi = {
  isim: string;
  aramaAdlari: string[];
  kategori: Kategori;
  /** Bir porsiyonun servis ağırlığı (gram) — sulu yemekte su dahil. */
  porsiyonGram: number;
  porsiyonAdi: string;
  /** Bir porsiyona giren ham malzemeler. */
  malzemeler: Malzeme[];
};

// --- Yemekler --------------------------------------------------------
// Her satırdaki malzeme listesi = hesabın kendisi. porsiyonGram servis
// ağırlığıdır (çorbada eklenen su dahil, kızartmada nem kaybı düşülmüş).

const YEMEKLER: BilesikGirdi[] = [
  // ===== ÇORBALAR (1 kase = 300 g) =====
  {
    isim: 'Mercimek Çorbası',
    aramaAdlari: ['mercimek corbasi', 'kirmizi mercimek corbasi', 'lentil soup'],
    kategori: 'corba',
    porsiyonGram: 300,
    porsiyonAdi: '1 Kase (300 g)',
    // 45g mercimek + 20g soğan + 15g havuç + 15g patates + 8g un + 8g tereyağı + 4g salça + su
    malzemeler: [
      ['mercimek_kuru', 45],
      ['sogan', 20],
      ['havuc', 15],
      ['patates', 15],
      ['un', 8],
      ['tereyagi', 8],
      ['salca', 4],
    ],
  },
  {
    isim: 'Ezogelin Çorbası',
    aramaAdlari: ['ezogelin corbasi', 'ezo gelin'],
    kategori: 'corba',
    porsiyonGram: 300,
    porsiyonAdi: '1 Kase (300 g)',
    // 40g kırmızı mercimek + 10g pirinç + 8g bulgur + 8g salça + 15g soğan + 8g tereyağı + su
    malzemeler: [
      ['mercimek_kuru', 40],
      ['pirinc_kuru', 10],
      ['bulgur_kuru', 8],
      ['salca', 8],
      ['sogan', 15],
      ['tereyagi', 8],
    ],
  },
  {
    isim: 'Yayla Çorbası',
    aramaAdlari: ['yayla corbasi', 'yogurtlu corba'],
    kategori: 'corba',
    porsiyonGram: 300,
    porsiyonAdi: '1 Kase (300 g)',
    // 60g yoğurt + 12g pirinç + 6g un + 8g yumurta + 8g tereyağı + su + nane
    malzemeler: [
      ['yogurt', 60],
      ['pirinc_kuru', 12],
      ['un', 6],
      ['yumurta', 8],
      ['tereyagi', 8],
    ],
  },

  // ===== SEBZE / ZEYTİNYAĞLI ANA YEMEK =====
  {
    isim: 'Karnıyarık',
    aramaAdlari: ['karniyarik', 'kiymali patlican', 'stuffed eggplant'],
    kategori: 'ana-yemek',
    porsiyonGram: 250,
    porsiyonAdi: '1 Porsiyon (250 g)',
    // 160g patlıcan + 60g dana kıyma + 30g soğan + 40g domates + 15g biber + 8g salça + 20g sıvı yağ
    malzemeler: [
      ['patlican', 160],
      ['dana_kiyma', 60],
      ['sogan', 30],
      ['domates', 40],
      ['biber_yesil', 15],
      ['salca', 8],
      ['sivi_yag', 20],
    ],
  },
  {
    isim: 'İmambayıldı',
    aramaAdlari: ['imambayildi', 'zeytinyagli patlican'],
    kategori: 'ana-yemek',
    porsiyonGram: 220,
    porsiyonAdi: '1 Porsiyon (220 g)',
    // 150g patlıcan + 40g soğan + 40g domates + 5g sarımsak + 5g maydanoz + 25g zeytinyağı
    malzemeler: [
      ['patlican', 150],
      ['sogan', 40],
      ['domates', 40],
      ['sarimsak', 5],
      ['maydanoz', 5],
      ['zeytinyagi', 25],
    ],
  },
  {
    isim: 'Kuru Fasulye',
    aramaAdlari: ['kuru fasulye', 'fasulye yemegi', 'white bean stew'],
    kategori: 'ana-yemek',
    porsiyonGram: 250,
    porsiyonAdi: '1 Porsiyon (250 g)',
    // 60g kuru fasulye + 25g soğan + 12g salça + 12g sıvı yağ + su
    malzemeler: [
      ['fasulye_kuru', 60],
      ['sogan', 25],
      ['salca', 12],
      ['sivi_yag', 12],
    ],
  },
  {
    isim: 'Nohut Yemeği',
    aramaAdlari: ['nohut yemegi', 'etli nohut', 'chickpea stew'],
    kategori: 'ana-yemek',
    porsiyonGram: 250,
    porsiyonAdi: '1 Porsiyon (250 g)',
    // 55g kuru nohut + 25g kuzu kuşbaşı + 25g soğan + 12g salça + 10g sıvı yağ + su
    malzemeler: [
      ['nohut_kuru', 55],
      ['kuzu_kusbasi', 25],
      ['sogan', 25],
      ['salca', 12],
      ['sivi_yag', 10],
    ],
  },
  {
    isim: 'Etli Türlü',
    aramaAdlari: ['etli turlu', 'sebzeli et yemegi', 'meat vegetable stew'],
    kategori: 'ana-yemek',
    porsiyonGram: 300,
    porsiyonAdi: '1 Porsiyon (300 g)',
    // 50g kuzu kuşbaşı + 50g patlıcan + 40g kabak + 40g patates + 30g biber + 40g domates + 20g soğan + 8g salça + 15g zeytinyağı
    malzemeler: [
      ['kuzu_kusbasi', 50],
      ['patlican', 50],
      ['kabak', 40],
      ['patates', 40],
      ['biber_yesil', 30],
      ['domates', 40],
      ['sogan', 20],
      ['salca', 8],
      ['zeytinyagi', 15],
    ],
  },

  // ===== YUMURTA =====
  {
    isim: 'Menemen',
    aramaAdlari: ['menemen', 'yumurtali biberli'],
    kategori: 'kahvaltilik',
    porsiyonGram: 200,
    porsiyonAdi: '1 Porsiyon (200 g, ~2 yumurta)',
    // 100g yumurta (2 adet) + 70g domates + 30g yeşil biber + 15g soğan + 8g sıvı yağ; nem kaybı → 200g
    malzemeler: [
      ['yumurta', 100],
      ['domates', 70],
      ['biber_yesil', 30],
      ['sogan', 15],
      ['sivi_yag', 8],
    ],
  },
  {
    isim: 'Sucuklu Yumurta',
    aramaAdlari: ['sucuklu yumurta', 'sucuk yumurta'],
    kategori: 'kahvaltilik',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g, 2 yumurta + 40 g sucuk)',
    // 100g yumurta (2 adet) + 40g sucuk + 3g sıvı yağ; nem kaybı → 150g
    malzemeler: [
      ['yumurta', 100],
      ['sucuk', 40],
      ['sivi_yag', 3],
    ],
  },

  // ===== HAMUR İŞİ =====
  {
    isim: 'Mantı',
    aramaAdlari: ['manti', 'turkish dumplings', 'kayseri mantisi'],
    kategori: 'hamur-isi',
    porsiyonGram: 300,
    porsiyonAdi: '1 Porsiyon (300 g: hamur+kıyma ~185 g + 100 g yoğurt + sos)',
    // hamur 50g un + 8g yumurta; iç 25g dana kıyma + 10g soğan; üzeri 100g yoğurt + 12g tereyağı + 5g salça
    malzemeler: [
      ['un', 50],
      ['yumurta', 8],
      ['dana_kiyma', 25],
      ['sogan', 10],
      ['yogurt', 100],
      ['tereyagi', 12],
      ['salca', 5],
    ],
  },
  {
    isim: 'İçli Köfte',
    aramaAdlari: ['icli kofte', 'oruk', 'kibbeh'],
    kategori: 'hamur-isi',
    porsiyonGram: 110,
    porsiyonAdi: '1 Adet (110 g)',
    // dış 32g ince bulgur + 6g irmik + 4g un; iç 24g dana kıyma + 12g soğan + 6g ceviz; kızartma yağı 9g
    malzemeler: [
      ['bulgur_kuru', 32],
      ['irmik', 6],
      ['un', 4],
      ['dana_kiyma', 24],
      ['sogan', 12],
      ['ceviz', 6],
      ['sivi_yag', 9],
    ],
  },
  {
    isim: 'Lahmacun',
    aramaAdlari: ['lahmacun', 'turkish pizza', 'findik lahmacun'],
    kategori: 'hamur-isi',
    porsiyonGram: 130,
    porsiyonAdi: '1 Adet (130 g)',
    // 60g un (hamur) + 25g dana kıyma + 15g soğan + 15g domates + 10g biber + 5g maydanoz + 5g salça
    malzemeler: [
      ['un', 60],
      ['dana_kiyma', 25],
      ['sogan', 15],
      ['domates', 15],
      ['biber_yesil', 10],
      ['maydanoz', 5],
      ['salca', 5],
    ],
  },
  {
    isim: 'Kıymalı Pide',
    aramaAdlari: ['kiymali pide', 'etli pide'],
    kategori: 'hamur-isi',
    porsiyonGram: 300,
    porsiyonAdi: '1 Adet (300 g)',
    // 110g un + 45g dana kıyma + 20g soğan + 15g domates + 12g biber + 10g yumurta + 5g sıvı yağ
    malzemeler: [
      ['un', 110],
      ['dana_kiyma', 45],
      ['sogan', 20],
      ['domates', 15],
      ['biber_yesil', 12],
      ['yumurta', 10],
      ['sivi_yag', 5],
    ],
  },
  {
    isim: 'Kaşarlı Pide',
    aramaAdlari: ['kasarli pide', 'peynirli pide'],
    kategori: 'hamur-isi',
    porsiyonGram: 300,
    porsiyonAdi: '1 Adet (300 g)',
    // 110g un + 70g kaşar + 10g tereyağı + 15g yumurta
    malzemeler: [
      ['un', 110],
      ['kasar', 70],
      ['tereyagi', 10],
      ['yumurta', 15],
    ],
  },
  {
    isim: 'Su Böreği',
    aramaAdlari: ['su boregi', 'peynirli borek'],
    kategori: 'hamur-isi',
    porsiyonGram: 150,
    porsiyonAdi: '1 Dilim (150 g)',
    // 70g yufka + 30g beyaz peynir + 5g maydanoz + 15g yumurta + 20g süt + 12g tereyağı
    malzemeler: [
      ['yufka', 70],
      ['beyaz_peynir', 30],
      ['maydanoz', 5],
      ['yumurta', 15],
      ['sut', 20],
      ['tereyagi', 12],
    ],
  },
  {
    isim: 'Sigara Böreği',
    aramaAdlari: ['sigara boregi', 'peynirli sigara borek'],
    kategori: 'hamur-isi',
    porsiyonGram: 80,
    porsiyonAdi: '4 Adet (80 g)',
    // 45g yufka + 25g beyaz peynir + 3g maydanoz + 10g kızartma yağı
    malzemeler: [
      ['yufka', 45],
      ['beyaz_peynir', 25],
      ['maydanoz', 3],
      ['sivi_yag', 10],
    ],
  },
  {
    isim: 'Poğaça',
    aramaAdlari: ['pogaca', 'peynirli pogaca'],
    kategori: 'hamur-isi',
    porsiyonGram: 70,
    porsiyonAdi: '1 Adet (70 g)',
    // 42g un + 10g sıvı yağ + 8g yoğurt + 5g yumurta + 10g beyaz peynir (iç)
    malzemeler: [
      ['un', 42],
      ['sivi_yag', 10],
      ['yogurt', 8],
      ['yumurta', 5],
      ['beyaz_peynir', 10],
    ],
  },
  {
    isim: 'Açma',
    aramaAdlari: ['acma', 'yumusak acma'],
    kategori: 'hamur-isi',
    porsiyonGram: 80,
    porsiyonAdi: '1 Adet (80 g)',
    // 45g un + 12g sıvı yağ + 10g süt + 5g yumurta + 3g şeker
    malzemeler: [
      ['un', 45],
      ['sivi_yag', 12],
      ['sut', 10],
      ['yumurta', 5],
      ['seker', 3],
    ],
  },

  // ===== ET / KEBAP =====
  {
    isim: 'Et Döner',
    aramaAdlari: ['et doner', 'doner kebap', 'beef doner'],
    kategori: 'ana-yemek',
    porsiyonGram: 160,
    porsiyonAdi: '1 Porsiyon (160 g, yalnız et — ekmek/pilav hariç)',
    // 200g yağlı dana (çiğ) → pişince ~160g servis (yağ+su kaybı)
    malzemeler: [['dana_kiyma', 200]],
  },
  {
    isim: 'Tavuk Döner',
    aramaAdlari: ['tavuk doner', 'chicken doner'],
    kategori: 'ana-yemek',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g, yalnız et)',
    // 200g tavuk but (çiğ) + 8g sıvı yağ → pişince ~150g servis
    malzemeler: [
      ['tavuk_but', 200],
      ['sivi_yag', 8],
    ],
  },
  {
    isim: 'İskender',
    aramaAdlari: ['iskender', 'iskender kebap', 'yogurtlu doner'],
    kategori: 'ana-yemek',
    porsiyonGram: 400,
    porsiyonAdi: '1 Porsiyon (400 g: döner + pide + yoğurt + tereyağlı domates sos)',
    // 150g dana (çiğ) + 55g un (pide) + 90g yoğurt + 50g domates (sos) + 30g tereyağı
    malzemeler: [
      ['dana_kiyma', 150],
      ['un', 55],
      ['yogurt', 90],
      ['domates', 50],
      ['tereyagi', 30],
    ],
  },
  {
    isim: 'Adana Kebap',
    aramaAdlari: ['adana kebap', 'aci kebap', 'zirh kebap'],
    kategori: 'ana-yemek',
    porsiyonGram: 180,
    porsiyonAdi: '1 Şiş (180 g pişmiş)',
    // 120g dana kıyma + 80g kuzu kıyma + 10g biber + 3g sarımsak (çiğ 213g) → 180g pişmiş
    malzemeler: [
      ['dana_kiyma', 120],
      ['kuzu_kiyma', 80],
      ['biber_kirmizi', 10],
      ['sarimsak', 3],
    ],
  },
  {
    isim: 'Urfa Kebap',
    aramaAdlari: ['urfa kebap', 'acisiz kebap'],
    kategori: 'ana-yemek',
    porsiyonGram: 180,
    porsiyonAdi: '1 Şiş (180 g pişmiş)',
    // 120g dana kıyma + 80g kuzu kıyma + 10g soğan (Adana ile aynı, acısız)
    malzemeler: [
      ['dana_kiyma', 120],
      ['kuzu_kiyma', 80],
      ['sogan', 10],
    ],
  },
  {
    isim: 'Izgara Köfte',
    aramaAdlari: ['kofte', 'izgara kofte', 'ekmek arasi kofte'],
    kategori: 'ana-yemek',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g, ~5 adet)',
    // 150g dana kıyma + 15g galeta unu + 15g soğan + 8g yumurta + 3g maydanoz (çiğ 191g) → 150g pişmiş
    malzemeler: [
      ['dana_kiyma', 150],
      ['galeta_unu', 15],
      ['sogan', 15],
      ['yumurta', 8],
      ['maydanoz', 3],
    ],
  },
  {
    isim: 'Tavuk Şiş',
    aramaAdlari: ['tavuk sis', 'chicken shish', 'izgara tavuk sis'],
    kategori: 'ana-yemek',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g pişmiş)',
    // 170g tavuk göğsü + 15g yoğurt + 5g zeytinyağı + 10g biber (çiğ 200g) → 150g pişmiş
    malzemeler: [
      ['tavuk_gogsu', 170],
      ['yogurt', 15],
      ['zeytinyagi', 5],
      ['biber_yesil', 10],
    ],
  },

  // ===== SOĞUK / VEJETARYEN =====
  {
    isim: 'Kısır',
    aramaAdlari: ['kisir', 'bulgur salatasi', 'bulgur salad'],
    kategori: 'ana-yemek',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g)',
    // 55g ince bulgur + 12g salça + 15g domates + 10g yeşil soğan + 8g maydanoz + 8g zeytinyağı + 5g limon + 3g pekmez (nar ekşisi yerine)
    malzemeler: [
      ['bulgur_kuru', 55],
      ['salca', 12],
      ['domates', 15],
      ['yesil_sogan', 10],
      ['maydanoz', 8],
      ['zeytinyagi', 8],
      ['limon_suyu', 5],
      ['pekmez', 3],
    ],
  },
  {
    isim: 'Mercimek Köftesi',
    aramaAdlari: ['mercimek koftesi', 'etsiz kofte', 'lentil balls'],
    kategori: 'ana-yemek',
    porsiyonGram: 120,
    porsiyonAdi: '1 Porsiyon (120 g, ~5 adet)',
    // 35g kırmızı mercimek + 25g ince bulgur + 15g soğan + 8g salça + 6g zeytinyağı + 8g yeşil soğan + 4g maydanoz
    malzemeler: [
      ['mercimek_kuru', 35],
      ['bulgur_kuru', 25],
      ['sogan', 15],
      ['salca', 8],
      ['zeytinyagi', 6],
      ['yesil_sogan', 8],
      ['maydanoz', 4],
    ],
  },
  {
    isim: 'Çiğ Köfte (Etsiz)',
    aramaAdlari: ['cig kofte', 'etsiz cig kofte', 'raw meatless kofte'],
    kategori: 'ana-yemek',
    porsiyonGram: 140,
    porsiyonAdi: '1 Porsiyon (140 g, dürümsüz — bulgur suyla şişer)',
    // 60g ince bulgur + 15g salça + 15g soğan + 10g domates + 5g maydanoz + 5g zeytinyağı + 3g pekmez
    malzemeler: [
      ['bulgur_kuru', 60],
      ['salca', 15],
      ['sogan', 15],
      ['domates', 10],
      ['maydanoz', 5],
      ['zeytinyagi', 5],
      ['pekmez', 3],
    ],
  },
  {
    isim: 'Yaprak Sarma (Zeytinyağlı)',
    aramaAdlari: ['yaprak sarma', 'yaprak dolmasi', 'zeytinyagli yaprak', 'stuffed grape leaves'],
    kategori: 'ana-yemek',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g, ~6 adet)',
    // 40g salamura yaprak + 35g pirinç + 20g soğan + 18g zeytinyağı + 5g kuş üzümü + 4g çam fıstığı(antep) + 4g maydanoz + 5g limon
    malzemeler: [
      ['yaprak_salamura', 40],
      ['pirinc_kuru', 35],
      ['sogan', 20],
      ['zeytinyagi', 18],
      ['kus_uzumu', 5],
      ['antep_fistigi', 4],
      ['maydanoz', 4],
      ['limon_suyu', 5],
    ],
  },
  {
    isim: 'Biber Dolması (Etli)',
    aramaAdlari: ['biber dolmasi', 'etli biber dolma', 'stuffed peppers'],
    kategori: 'ana-yemek',
    porsiyonGram: 250,
    porsiyonAdi: '1 Porsiyon (250 g, 2 adet)',
    // 120g yeşil biber + 30g pirinç + 35g dana kıyma + 15g soğan + 6g salça + 10g sıvı yağ + 3g maydanoz
    malzemeler: [
      ['biber_yesil', 120],
      ['pirinc_kuru', 30],
      ['dana_kiyma', 35],
      ['sogan', 15],
      ['salca', 6],
      ['sivi_yag', 10],
      ['maydanoz', 3],
    ],
  },

  // ===== PİLAV (1 porsiyon pişmiş) =====
  {
    isim: 'Pirinç Pilavı (sade)',
    aramaAdlari: ['pirinc pilavi', 'sade pilav', 'tereyagli pilav'],
    kategori: 'ana-yemek',
    porsiyonGram: 180,
    porsiyonAdi: '1 Porsiyon (180 g pişmiş)',
    // 65g pirinç + 10g tereyağı + 5g un (şehriye yerine) + su → 180g pişmiş
    malzemeler: [
      ['pirinc_kuru', 65],
      ['tereyagi', 10],
      ['un', 5],
    ],
  },
  {
    isim: 'Bulgur Pilavı',
    aramaAdlari: ['bulgur pilavi', 'domatesli bulgur'],
    kategori: 'ana-yemek',
    porsiyonGram: 180,
    porsiyonAdi: '1 Porsiyon (180 g pişmiş)',
    // 60g bulgur + 6g salça + 10g soğan + 8g sıvı yağ + 10g biber + su → 180g pişmiş
    malzemeler: [
      ['bulgur_kuru', 60],
      ['salca', 6],
      ['sogan', 10],
      ['sivi_yag', 8],
      ['biber_yesil', 10],
    ],
  },

  // ===== TATLILAR =====
  {
    isim: 'Baklava',
    aramaAdlari: ['baklava', 'fistikli baklava', 'cevizli baklava'],
    kategori: 'tatli',
    porsiyonGram: 70,
    porsiyonAdi: '1 Dilim (70 g)',
    // 30g yufka + 12g ceviz + 12g tereyağı + 22g şeker (şerbet)
    malzemeler: [
      ['yufka', 30],
      ['ceviz', 12],
      ['tereyagi', 12],
      ['seker', 22],
    ],
  },
  {
    isim: 'Künefe',
    aramaAdlari: ['kunefe', 'peynirli kunefe'],
    kategori: 'tatli',
    porsiyonGram: 150,
    porsiyonAdi: '1 Porsiyon (150 g)',
    // 55g kadayıf + 35g peynir (kaşar ile modellendi) + 20g tereyağı + 40g şeker (şerbet)
    malzemeler: [
      ['kadayif_hamur', 55],
      ['kasar', 35],
      ['tereyagi', 20],
      ['seker', 40],
    ],
  },
  {
    isim: 'Sütlaç',
    aramaAdlari: ['sutlac', 'firin sutlac', 'rice pudding'],
    kategori: 'tatli',
    porsiyonGram: 150,
    porsiyonAdi: '1 Kase (150 g)',
    // 110g süt + 12g pirinç + 18g şeker + 4g nişasta
    malzemeler: [
      ['sut', 110],
      ['pirinc_kuru', 12],
      ['seker', 18],
      ['nisasta', 4],
    ],
  },
  {
    isim: 'Kazandibi',
    aramaAdlari: ['kazandibi', 'tavuk gogsu tatlisi olmayan'],
    kategori: 'tatli',
    porsiyonGram: 125,
    porsiyonAdi: '1 Dilim (125 g)',
    // 90g süt + 15g şeker + 8g nişasta + 5g un + 2g tereyağı
    malzemeler: [
      ['sut', 90],
      ['seker', 15],
      ['nisasta', 8],
      ['un', 5],
      ['tereyagi', 2],
    ],
  },
  {
    isim: 'Revani',
    aramaAdlari: ['revani', 'irmik tatlisi', 'semolina cake'],
    kategori: 'tatli',
    porsiyonGram: 100,
    porsiyonAdi: '1 Dilim (100 g)',
    // 30g irmik + 12g un + 15g yumurta + 35g şeker (kek+şerbet) + 10g yoğurt + 8g sıvı yağ
    malzemeler: [
      ['irmik', 30],
      ['un', 12],
      ['yumurta', 15],
      ['seker', 35],
      ['yogurt', 10],
      ['sivi_yag', 8],
    ],
  },
  {
    isim: 'Aşure',
    aramaAdlari: ['asure', 'noahs pudding'],
    kategori: 'tatli',
    porsiyonGram: 200,
    porsiyonAdi: '1 Kase (200 g)',
    // 25g buğday + 8g nohut + 8g kuru fasulye + 30g şeker + 10g kuru incir + 8g kuru kayısı + 8g kuş üzümü + 6g ceviz + 10g nar
    malzemeler: [
      ['bugday_kuru', 25],
      ['nohut_kuru', 8],
      ['fasulye_kuru', 8],
      ['seker', 30],
      ['kuru_incir', 10],
      ['kuru_kayisi', 8],
      ['kus_uzumu', 8],
      ['ceviz', 6],
      ['nar_tane', 10],
    ],
  },
  {
    isim: 'İrmik Helvası',
    aramaAdlari: ['helva', 'irmik helvasi', 'semolina halva'],
    kategori: 'tatli',
    porsiyonGram: 100,
    porsiyonAdi: '1 Porsiyon (100 g)',
    // 40g irmik + 25g tereyağı + 30g şeker + 20g süt + 5g fındık (çam fıstığı)
    malzemeler: [
      ['irmik', 40],
      ['tereyagi', 25],
      ['seker', 30],
      ['sut', 20],
      ['findik', 5],
    ],
  },
  {
    isim: 'Lokum',
    aramaAdlari: ['lokum', 'turkish delight', 'rahat lokum'],
    kategori: 'tatli',
    porsiyonGram: 40,
    porsiyonAdi: '3 Adet (40 g)',
    // 26g şeker + 9g nişasta + 3g fındık (pişince su tutar → 40 g)
    malzemeler: [
      ['seker', 26],
      ['nisasta', 9],
      ['findik', 3],
    ],
  },
];

// --- Hesap ---------------------------------------------------------

const SLUG_HARF: Record<string, string> = {
  ç: 'c', ş: 's', ğ: 'g', ı: 'i', ö: 'o', ü: 'u', â: 'a', î: 'i', û: 'u',
};

function slugId(isim: string): string {
  const govde = isim
    .toLocaleLowerCase('tr-TR')
    .replace(/[çşğıöüâîû]/g, (h) => SLUG_HARF[h] ?? h)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `tr-${govde}`;
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

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

const kayitlar: SeedKaydi[] = [];
const tabloSatirlari: { isim: string; porsiyonGram: number; porsiyonKcal: number }[] = [];

for (const y of YEMEKLER) {
  let hamGram = 0;
  const toplam = [0, 0, 0, 0, 0];
  for (const [anahtar, gram] of y.malzemeler) {
    const p100 = TEMEL[anahtar];
    hamGram += gram;
    for (let i = 0; i < 5; i += 1) {
      toplam[i] += (gram / 100) * p100[i];
    }
  }

  const olcek = 100 / y.porsiyonGram;
  const kayit: SeedKaydi = {
    id: slugId(y.isim),
    isim: y.isim,
    aramaAdlari: y.aramaAdlari,
    kategori: y.kategori,
    porsiyonAdi: y.porsiyonAdi,
    porsiyonGram: y.porsiyonGram,
    kalori100: Math.round(toplam[0] * olcek),
    protein100: r1(toplam[1] * olcek),
    karb100: r1(toplam[2] * olcek),
    yag100: r1(toplam[3] * olcek),
    lif100: r1(toplam[4] * olcek),
  };
  kayitlar.push(kayit);
  tabloSatirlari.push({
    isim: y.isim,
    porsiyonGram: y.porsiyonGram,
    porsiyonKcal: Math.round(toplam[0]),
  });

  const suNotu = y.porsiyonGram > hamGram ? ` (+${y.porsiyonGram - hamGram} g su/sıvı)` : y.porsiyonGram < hamGram ? ` (−${hamGram - y.porsiyonGram} g nem kaybı)` : '';
  console.log(
    `${y.isim}\n  ham ${hamGram} g → porsiyon ${y.porsiyonGram} g${suNotu}\n` +
      `  porsiyon: ${Math.round(toplam[0])} kcal | P ${r1(toplam[1])} | K ${r1(toplam[2])} | Y ${r1(toplam[3])} | Lif ${r1(toplam[4])}\n` +
      `  /100 g:   ${kayit.kalori100} kcal | P ${kayit.protein100} | K ${kayit.karb100} | Y ${kayit.yag100} | Lif ${kayit.lif100}\n`
  );
}

const cikisYolu = resolve(process.cwd(), 'scripts/out/composite-foods.json');
mkdirSync(dirname(cikisYolu), { recursive: true });
writeFileSync(cikisYolu, `${JSON.stringify(kayitlar, null, 2)}\n`, 'utf8');

// --- Doğrulama tablosu -------------------------------------------
console.log('='.repeat(60));
console.log('DOĞRULAMA TABLOSU'.padEnd(40) + 'porsiyon   kcal');
console.log('-'.repeat(60));
for (const s of tabloSatirlari) {
  console.log(`${s.isim.padEnd(34)} ${String(s.porsiyonGram).padStart(6)} g ${String(s.porsiyonKcal).padStart(6)}`);
}
console.log('-'.repeat(60));
console.log(`${kayitlar.length} bileşik yemek -> ${cikisYolu}`);
