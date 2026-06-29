/**
 * Kayıt/profil form doğrulamaları — saçma/hatalı girişleri engeller, dostça uyarı döndürür.
 * Saf fonksiyonlar (UI'dan bağımsız). Hata yoksa null döner.
 */

/** Ad/Soyad: ≥2 harf, yalnız harf + boşluk/'-. (rakam/sembol yasak). */
export function adHatasi(s: string, alan = 'Ad'): string | null {
  const t = s.trim();
  if (t.length < 2) return `${alan} en az 2 harf olmalı.`;
  if (t.length > 40) return `${alan} çok uzun.`;
  if (!/^[A-Za-zÇĞİÖŞÜçğıöşü\s'.-]+$/.test(t)) return `${alan} yalnız harf içerebilir.`;
  return null;
}

/**
 * TR cep telefonu. Kabul: 05XXXXXXXXX, 5XXXXXXXXX, +905XXXXXXXXX, 905XXXXXXXXX (boşluk/tire serbest).
 * Geçerliyse normalize edilmiş `05XXXXXXXXX` döndürür; değilse null.
 */
export function telefonNormalize(s: string): string | null {
  let n = s.replace(/\D/g, ''); // yalnız rakam
  if (n.startsWith('90') && n.length === 12) n = n.slice(2);
  else if (n.startsWith('0') && n.length === 11) n = n.slice(1);
  // n şimdi 10 hane olmalı ve 5 ile başlamalı (TR cep)
  return /^5\d{9}$/.test(n) ? `0${n}` : null;
}

export function telefonHatasi(s: string): string | null {
  if (!s.trim()) return 'Telefon numarası gir.';
  return telefonNormalize(s) === null
    ? 'Geçerli bir TR cep numarası gir (örn. 0532 123 45 67).'
    : null;
}

/** Şifre: ≥8 karakter + en az bir harf ve bir rakam (saçma şifreyi engeller). */
export function sifreHatasi(s: string): string | null {
  if (s.length < 8) return 'Şifre en az 8 karakter olmalı.';
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s) || !/\d/.test(s)) {
    return 'Şifre en az bir harf ve bir rakam içermeli.';
  }
  return null;
}

/** Basit e-posta biçim kontrolü. */
export function epostaHatasi(s: string): string | null {
  const t = s.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Geçerli bir e-posta gir.';
  return null;
}
