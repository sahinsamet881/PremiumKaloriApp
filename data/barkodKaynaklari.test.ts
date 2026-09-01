import { offAyristir, usdaAyristir } from './barkodKaynaklari';

describe('offAyristir', () => {
  it('OFF ürün yanıtından 100g besin değerlerini çıkarır', () => {
    const veri = {
      status: 1,
      product: {
        product_name_tr: 'Yulaf Ezmesi',
        nutriments: {
          'energy-kcal_100g': 370,
          proteins_100g: 13.2,
          carbohydrates_100g: 58.7,
          fat_100g: 6.5,
          fiber_100g: 10,
        },
      },
    };
    expect(offAyristir(veri)).toEqual({
      ad: 'Yulaf Ezmesi',
      kalori100: 370,
      protein100: 13.2,
      karb100: 58.7,
      yag100: 6.5,
      lif100: 10,
      kaynak: 'off',
    });
  });

  it('status 0 ise null döner', () => {
    expect(offAyristir({ status: 0 })).toBeNull();
  });

  it('kalori yoksa (ya da 0) null döner', () => {
    const veri = { status: 1, product: { product_name: 'X', nutriments: {} } };
    expect(offAyristir(veri)).toBeNull();
  });

  it('lif alanı yoksa 0 yazar, çökmez', () => {
    const veri = {
      status: 1,
      product: {
        product_name: 'Kola',
        nutriments: { 'energy-kcal_100g': 42, proteins_100g: 0 },
      },
    };
    expect(offAyristir(veri)).toMatchObject({ ad: 'Kola', kalori100: 42, lif100: 0 });
  });

  it('Türkçe isim yoksa İngilizce/generic isme düşer', () => {
    const veri = {
      status: 1,
      product: {
        generic_name: 'Ketchup',
        nutriments: { 'energy-kcal_100g': 100 },
      },
    };
    expect(offAyristir(veri)?.ad).toBe('Ketchup');
  });
});

describe('usdaAyristir', () => {
  const yanit = {
    foods: [
      {
        description: 'HEINZ TOMATO KETCHUP',
        gtinUpc: '0013000006101',
        foodNutrients: [
          { nutrientId: 1008, value: 101 },
          { nutrientId: 1003, value: 1.2 },
          { nutrientId: 1005, value: 25.8 },
          { nutrientId: 1004, value: 0.1 },
          { nutrientId: 1079, value: 0.3 },
        ],
      },
    ],
  };

  it('GTIN eşleşen ürünü çözer ve BÜYÜK harfi düzeltir', () => {
    expect(usdaAyristir(yanit, '13000006101')).toEqual({
      ad: 'Heinz tomato ketchup',
      kalori100: 101,
      protein100: 1.2,
      karb100: 25.8,
      yag100: 0.1,
      lif100: 0.3,
      kaynak: 'usda',
    });
  });

  it('baştaki sıfır farkını yok sayarak eşleştirir', () => {
    expect(usdaAyristir(yanit, '013000006101')?.kaynak).toBe('usda');
  });

  it('barkodu eşleşmeyen sonuç için null döner', () => {
    expect(usdaAyristir(yanit, '9999999999999')).toBeNull();
  });

  it('foods boşsa null döner', () => {
    expect(usdaAyristir({ foods: [] }, '13000006101')).toBeNull();
  });

  it('nutrientNumber (string) ile de nutrient bulur', () => {
    const alt = {
      foods: [
        {
          description: 'MILK',
          gtinUpc: '111',
          foodNutrients: [{ nutrientNumber: '1008', amount: 60 }],
        },
      ],
    };
    expect(usdaAyristir(alt, '111')).toMatchObject({ kalori100: 60, kaynak: 'usda' });
  });

  it('Atwater yedek enerji id (2047) kalori olarak kullanılır', () => {
    const alt = {
      foods: [
        {
          description: 'NUTS',
          gtinUpc: '222',
          foodNutrients: [{ nutrientId: 2047, value: 600 }],
        },
      ],
    };
    expect(usdaAyristir(alt, '222')?.kalori100).toBe(600);
  });
});
