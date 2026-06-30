/**
 * Sızmış-şifre kontrolü — HaveIBeenPwned "Pwned Passwords" k-anonymity API'si.
 * GİZLİLİK: şifre ASLA gönderilmez. Yalnız SHA-1 hash'inin İLK 5 hanesi (prefix) API'ye gider;
 * API o prefix'le eşleşen tüm son-ekleri döner, eşleşme CİHAZDA yapılır. (Supabase Pro'daki
 * "leaked password protection" ile aynı yöntem — bağımlılıksız, ücretsiz.)
 */

function utf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c >= 0xd800 && c <= 0xdbff) {
      const c2 = str.charCodeAt(++i);
      const cp = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return bytes;
}

const rotl = (n: number, s: number) => ((n << s) | (n >>> (32 - s))) >>> 0;

/** Saf-JS SHA-1 → 40 haneli BÜYÜK harf hex. (UTF-8 baytları üzerinde.) */
export function sha1Hex(str: string): string {
  const bytes = utf8Bytes(str);
  const ml = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(Math.floor(ml / 2 ** (i * 8)) & 0xff);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const w = new Array<number>(80);
    for (let i = 0; i < 16; i++) {
      w[i] =
        ((bytes[chunk + i * 4] << 24) |
          (bytes[chunk + i * 4 + 1] << 16) |
          (bytes[chunk + i * 4 + 2] << 8) |
          bytes[chunk + i * 4 + 3]) >>>
        0;
    }
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const tmp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = tmp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const hx = (n: number) => `0000000${(n >>> 0).toString(16)}`.slice(-8);
  return (hx(h0) + hx(h1) + hx(h2) + hx(h3) + hx(h4)).toUpperCase();
}

/**
 * Şifre bilinen veri ihlallerinde görülmüş mü? true = sızmış (reddet).
 * Ağ hatası/offline → false (FAIL-OPEN: güvenlik kontrolü kaydı engellemez).
 */
export async function sifreSizmisMi(sifre: string): Promise<boolean> {
  try {
    const hash = sha1Hex(sifre);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }, // gerçek sonuç sayısını gizler
    });
    if (!res.ok) return false;
    const metin = await res.text();
    for (const satir of metin.split('\n')) {
      const [s, sayi] = satir.trim().split(':');
      if (s === suffix && Number(sayi) > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}
