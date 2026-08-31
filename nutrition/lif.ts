/**
 * Günlük lif (diyet lifi) hedefi.
 *
 * Yetişkinler için yaygın öneri günde 25–30 g aralığındadır. Bu hedef
 * kullanıcıya özel hesaplanmaz; sabit bir aralık olarak kullanılır.
 */
export const LIF_HEDEF_MIN = 25;
export const LIF_HEDEF_MAX = 30;

/** Makro kartındaki ilerleme çubuğu için tek referans değer (aralığın alt sınırı). */
export const LIF_HEDEF_VARSAYILAN = LIF_HEDEF_MIN;

/** Ana ekran / analiz ekranında gösterilecek hedef etiketi. */
export const LIF_HEDEF_ETIKETI = `${LIF_HEDEF_MIN}–${LIF_HEDEF_MAX}`;

export type LifDurumu = 'dusuk' | 'ideal' | 'yuksek';

export function lifDurumu(alinanGram: number): LifDurumu {
  if (!Number.isFinite(alinanGram) || alinanGram < LIF_HEDEF_MIN) {
    return 'dusuk';
  }
  if (alinanGram > LIF_HEDEF_MAX) {
    return 'yuksek';
  }
  return 'ideal';
}
