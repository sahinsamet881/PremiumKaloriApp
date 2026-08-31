export const SU_HEDEFI_MIN = 1000;
export const SU_HEDEFI_MAX = 5000;
export const SU_HEDEFI_ADIM = 250;
export const SU_HEDEFI_VARSAYILAN = 2500;

export const SU_BARDAK_SECENEKLERI = [200, 250, 330, 500];
export const SU_BARDAK_VARSAYILAN = 250;

const ML_PER_KG = 33;

export function suHedefiKisitla(mililitre: number): number {
  const yuvarli = Math.round(mililitre / SU_HEDEFI_ADIM) * SU_HEDEFI_ADIM;
  return Math.min(SU_HEDEFI_MAX, Math.max(SU_HEDEFI_MIN, yuvarli));
}

export function suHedefiOner(kiloKg: number): number {
  if (!Number.isFinite(kiloKg) || kiloKg <= 0) {
    return SU_HEDEFI_VARSAYILAN;
  }
  return suHedefiKisitla(kiloKg * ML_PER_KG);
}

export function suBardakKisitla(mililitre: number): number {
  if (SU_BARDAK_SECENEKLERI.includes(mililitre)) {
    return mililitre;
  }
  return SU_BARDAK_SECENEKLERI.reduce((enYakin, secenek) =>
    Math.abs(secenek - mililitre) < Math.abs(enYakin - mililitre) ? secenek : enYakin
  );
}
