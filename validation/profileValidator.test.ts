import {
  AGRESIF_HEDEF_UYARISI,
  BMI_ENGEL_MESAJI,
  BOY_ENGEL_MESAJI,
  KALORI_TABANI_ERKEK,
  KALORI_TABANI_KADIN,
  KILO_ENGEL_MESAJI,
  profilDogrula,
  tabanlanmisKalori,
  YAS_ENGEL_MESAJI,
  type ProfilGirdisi,
} from './profileValidator';

const gecerliGirdi: ProfilGirdisi = {
  yas: 30,
  boy: 175,
  kilo: 80,
  hedefKilo: 72,
  cinsiyet: 'erkek',
  hesaplananKalori: 2200,
};

describe('profilDogrula - geçerli durum', () => {
  it('tüm değerler makul olduğunda .gecerli döndürür', () => {
    expect(profilDogrula(gecerliGirdi)).toEqual({ tur: 'gecerli' });
  });
});

describe('profilDogrula - yaş kuralı', () => {
  it('yaş 18 altındaysa .engel döndürür ve yaş mesajını verir', () => {
    expect(profilDogrula({ ...gecerliGirdi, yas: 17 })).toEqual({
      tur: 'engel',
      mesaj: YAS_ENGEL_MESAJI,
    });
  });

  it('yaş tam 18 ise engellemez', () => {
    expect(profilDogrula({ ...gecerliGirdi, yas: 18 }).tur).not.toBe('engel');
  });
});

describe('profilDogrula - boy kuralı', () => {
  it('boy 100 cm altındaysa .engel döndürür', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 99 })).toEqual({
      tur: 'engel',
      mesaj: BOY_ENGEL_MESAJI,
    });
  });

  it('boy 250 cm üstündeyse .engel döndürür', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 251 }).tur).toBe('engel');
  });

  it('boy 100 ve 250 sınır değerlerinde engellemez', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 100, kilo: 60, hedefKilo: 55 }).tur).not.toBe(
      'engel'
    );
    expect(profilDogrula({ ...gecerliGirdi, boy: 250, kilo: 130, hedefKilo: 125 }).tur).not.toBe(
      'engel'
    );
  });
});

describe('profilDogrula - kilo kuralı', () => {
  it('kilo 30 kg altındaysa .engel döndürür', () => {
    expect(profilDogrula({ ...gecerliGirdi, kilo: 29 })).toEqual({
      tur: 'engel',
      mesaj: KILO_ENGEL_MESAJI,
    });
  });

  it('kilo 300 kg üstündeyse .engel döndürür', () => {
    expect(profilDogrula({ ...gecerliGirdi, kilo: 301, hedefKilo: 260 }).tur).toBe('engel');
  });

  it('kilo 30 ve 300 sınır değerlerinde engellemez', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 150, kilo: 30, hedefKilo: 45 }).tur).not.toBe(
      'engel'
    );
    expect(profilDogrula({ ...gecerliGirdi, boy: 200, kilo: 300, hedefKilo: 290 }).tur).not.toBe(
      'engel'
    );
  });
});

describe('profilDogrula - hedef BMI kuralı', () => {
  it('hedef kilo BMI 18.5 altına düşürüyorsa .engel döndürür', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 180, kilo: 80, hedefKilo: 55 })).toEqual({
      tur: 'engel',
      mesaj: BMI_ENGEL_MESAJI,
    });
  });

  it('hedef kilo BMI 18.5 üstünde kalıyorsa BMI kuralı tetiklenmez', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 180, kilo: 70, hedefKilo: 62 })).toEqual({
      tur: 'gecerli',
    });
  });
});

describe('profilDogrula - agresif hedef kuralı', () => {
  it('hedef kilo mevcut kilodan %20 fazla düşükse .uyari döndürür', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 195, kilo: 100, hedefKilo: 79 })).toEqual({
      tur: 'uyari',
      mesaj: AGRESIF_HEDEF_UYARISI,
    });
  });

  it('hedef kilo tam %20 düşükse uyarı vermez', () => {
    expect(profilDogrula({ ...gecerliGirdi, boy: 195, kilo: 100, hedefKilo: 80 })).toEqual({
      tur: 'gecerli',
    });
  });
});

describe('profilDogrula - kalori tabanı kuralı', () => {
  it('hesaplanan kalori kadın tabanının (1200) altındaysa .uyari döndürür', () => {
    const sonuc = profilDogrula({
      ...gecerliGirdi,
      cinsiyet: 'kadin',
      hesaplananKalori: KALORI_TABANI_KADIN - 1,
    });
    expect(sonuc.tur).toBe('uyari');
    expect(sonuc).toHaveProperty('mesaj');
  });

  it('hesaplanan kalori erkek tabanının (1500) altındaysa .uyari döndürür', () => {
    expect(
      profilDogrula({ ...gecerliGirdi, hesaplananKalori: KALORI_TABANI_ERKEK - 1 }).tur
    ).toBe('uyari');
  });

  it('hesaplanan kalori tam tabandaysa uyarı vermez', () => {
    expect(
      profilDogrula({
        ...gecerliGirdi,
        cinsiyet: 'kadin',
        hesaplananKalori: KALORI_TABANI_KADIN,
      })
    ).toEqual({ tur: 'gecerli' });
  });
});

describe('profilDogrula - kural önceliği', () => {
  it('engel kuralları uyarı kurallarından önce değerlendirilir', () => {
    expect(
      profilDogrula({ ...gecerliGirdi, yas: 15, hedefKilo: 40, hesaplananKalori: 900 })
    ).toEqual({ tur: 'engel', mesaj: YAS_ENGEL_MESAJI });
  });
});

describe('tabanlanmisKalori', () => {
  it('kadın için 1200 altındaki kaloriyi 1200 e sabitler', () => {
    expect(tabanlanmisKalori(1100, 'kadin')).toEqual({ kalori: 1200, sabitlendi: true });
  });

  it('erkek için 1500 altındaki kaloriyi 1500 e sabitler', () => {
    expect(tabanlanmisKalori(1400, 'erkek')).toEqual({ kalori: 1500, sabitlendi: true });
  });

  it('taban ve üstündeki kaloriye dokunmaz', () => {
    expect(tabanlanmisKalori(1200, 'kadin')).toEqual({ kalori: 1200, sabitlendi: false });
    expect(tabanlanmisKalori(2400, 'erkek')).toEqual({ kalori: 2400, sabitlendi: false });
  });
});
