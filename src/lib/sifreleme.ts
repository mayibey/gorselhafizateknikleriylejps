/**
 * AES-256-CTR at-rest şifreleme (modern, optimize @noble/ciphers) + ÖLÇÜM aracı.
 * İndirilen görselleri diskte şifreli tutmak için; gösterirken çözülür.
 * NOT (entegrasyonda): anahtar → expo-secure-store (donanım keystore) + sunucudan kullanıcı-anahtarı.
 * Her dosya için rastgele 16-bayt nonce şifreli verinin başına eklenir (CTR nonce tekrarı olmaz).
 */
import { ctr } from '@noble/ciphers/aes.js';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

// --- base64 <-> bytes (Hermes global atob/btoa; büyük veri için parçalı) ---
export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  const yig = 0x2000; // 8KB parça → Hermes argüman limitini (spread) zorlamaz
  for (let i = 0; i < bytes.length; i += yig) {
    bin += String.fromCharCode(...bytes.subarray(i, i + yig));
  }
  return btoa(bin);
}

export function rastgeleAnahtar(): Uint8Array {
  return Crypto.getRandomBytes(32); // AES-256
}

/** Şifrele → [16B nonce | ciphertext]. */
export function aesSifrele(plain: Uint8Array, key: Uint8Array): Uint8Array {
  const nonce = Crypto.getRandomBytes(16);
  const cipher = ctr(key, nonce).encrypt(plain);
  const out = new Uint8Array(nonce.length + cipher.length);
  out.set(nonce, 0);
  out.set(cipher, nonce.length);
  return out;
}

/** Çöz: [16B nonce | ciphertext] → plain. */
export function aesCoz(paket: Uint8Array, key: Uint8Array): Uint8Array {
  const nonce = paket.subarray(0, 16);
  const cipher = paket.subarray(16);
  return ctr(key, nonce).decrypt(cipher);
}

/**
 * ÖLÇÜM: indirilmiş bir TCK görselini şifrele→çöz, süreleri döndürür.
 * "ÇÖZ+encode" = bir kartı GÖSTERMEDEN önce ödenecek gerçek maliyet (data-URI hazırlama).
 */
export async function sifrelemeOlcum(): Promise<string> {
  const uri = (FileSystem.documentDirectory ?? '') + 'jsps/tck/tck_m1_1.webp';
  const bilgi = await FileSystem.getInfoAsync(uri);
  if (!bilgi.exists) return 'Önce TCK indir (Mevzuat → İndir), sonra ölç.';

  const t0 = Date.now();
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const plain = b64ToBytes(b64);
  const t1 = Date.now();

  const key = rastgeleAnahtar();
  const paket = aesSifrele(plain, key);
  const t2 = Date.now();

  const plain2 = aesCoz(paket, key);
  const b64geri = bytesToB64(plain2);
  const t3 = Date.now();

  const kb = Math.round(plain.length / 1024);
  const eslesme = b64geri.length === b64.length ? 'OK' : 'FARK!';
  return `${kb}KB · oku ${t1 - t0}ms · şifrele ${t2 - t1}ms · ÇÖZ+encode ${t3 - t2}ms (${eslesme})`;
}
