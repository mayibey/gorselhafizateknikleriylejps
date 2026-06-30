/**
 * İndirme yöneticisi — bir kanunun TÜM görsellerini cihaza (documentDirectory/jsps/...) indirir;
 * çalışırken yerelden okunur (anında + offline). Per-dosya iner (var olanı atlar → kopan yerden
 * devam). İndirilen kanun klasörleri AsyncStorage'da tutulur; çözümleyici (gorsel-kaynak) bunu
 * SENKRON okur → yerel dosya varsa onu kullanır.
 *
 * Web: documentDirectory yok → indirme desteklenmez (UI butonu gizler; içerik gömülü/uzak okunur).
 * NOT (v2 sertleştirme): per-dosya sha256 (expo-crypto) checksum + createDownloadResumable byte-
 * ilerleme + AES at-rest şifreleme (expo-secure-store anahtar) — bu temelin üstüne eklenir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { KART_GORSEL_YOLLARI } from '../assets/kart-gorselleri';
import { KART_SES_YOLLARI } from '../assets/kart-sesleri';
import { ICERIK_TABANI } from '@/constants/config';
import { icerikAnahtari } from './cihaz-anahtar';
import { aesSifrele, b64ToBytes, bytesToB64 } from './sifreleme';

/** Cihazda indirme destekleniyor mu (web'de hayır). */
export const indirmeDestekli = !!FileSystem.documentDirectory;

const KOK = (FileSystem.documentDirectory ?? '') + 'jsps/';
const DURUM_ANAHTAR = 'jsps.indirilen.kanunlar';

// Modül-içi önbellek: indirilmiş kanun klasörleri (ör. "tck"). Çözümleyici bunu senkron okur.
let indirilmis = new Set<string>();
let yuklendi = false;

/** Uygulama açılışında bir kez çağır → indirilmiş kanun listesini belleğe al. */
export async function indirmeDurumYukle(): Promise<void> {
  if (yuklendi) return;
  try {
    const ham = await AsyncStorage.getItem(DURUM_ANAHTAR);
    if (ham) indirilmis = new Set(JSON.parse(ham) as string[]);
  } catch {
    // sessiz: ilk açılış / bozuk kayıt → boş set
  }
  yuklendi = true;
}

async function durumKaydet() {
  try {
    await AsyncStorage.setItem(DURUM_ANAHTAR, JSON.stringify([...indirilmis]));
  } catch {
    // sessiz
  }
}

/** Bu kanun klasörü tamamen indirilmiş mi? (çözümleyici senkron çağırır) */
export function kanunIndirilmisMi(klasor: string): boolean {
  return indirilmis.has(klasor);
}

/** Bir kanun klasörünün tüm görsel kayıtları (manifest'ten). */
export function kanunGorselleri(klasor: string): { key: string; yol: string }[] {
  return Object.entries(KART_GORSEL_YOLLARI)
    .filter(([, yol]) => yol.startsWith(`${klasor}/`))
    .map(([key, yol]) => ({ key, yol }));
}

/** Bir kanun klasörünün tüm ses kayıtları (manifest'ten). */
export function kanunSesleri(klasor: string): { key: string; yol: string }[] {
  return Object.entries(KART_SES_YOLLARI)
    .filter(([, yol]) => yol.startsWith(`${klasor}/`))
    .map(([key, yol]) => ({ key, yol }));
}

/** İçerik-göreli yolun (ör. "tck/tck_m1.webp") yerel dosya URI'si. */
export function yerelDosyaUri(yol: string): string {
  return KOK + yol;
}

export type IndirmeIlerleme = { toplam: number; biten: number; yuzde: number };

/**
 * Bir kanunu indir (per-dosya; var olanı atlar = devam edilebilir). onIlerleme ile yüzde bildirir.
 * Tümü inince kanun "indirildi" işaretlenir (atomik: hepsi bitmeden işaretlenmez).
 */
export async function kanunIndir(
  klasor: string,
  onIlerleme?: (p: IndirmeIlerleme) => void,
): Promise<void> {
  if (!indirmeDestekli) throw new Error('İndirme bu platformda desteklenmiyor.');
  if (!ICERIK_TABANI) throw new Error('İçerik sunucusu ayarlı değil (ICERIK_TABANI boş).');

  const gorseller = kanunGorselleri(klasor);
  const sesler = kanunSesleri(klasor);
  const toplam = gorseller.length + sesler.length;
  if (toplam === 0) throw new Error(`Kanun bulunamadı: ${klasor}`);

  await FileSystem.makeDirectoryAsync(KOK + klasor, { intermediates: true }).catch(() => {});
  const anahtar = await icerikAnahtari();

  let biten = 0;
  const ilerle = () => {
    biten++;
    onIlerleme?.({ toplam, biten, yuzde: Math.round((biten / toplam) * 100) });
  };

  // GÖRSELLER — indir + AES şifrele (diskte düz görsel kalmaz).
  for (const { yol } of gorseller) {
    const hedef = KOK + yol;
    const bilgi = await FileSystem.getInfoAsync(hedef);
    if (!bilgi.exists || bilgi.size === 0) {
      await FileSystem.downloadAsync(`${ICERIK_TABANI}/${yol}`, hedef);
      const b64 = await FileSystem.readAsStringAsync(hedef, { encoding: FileSystem.EncodingType.Base64 });
      const paket = aesSifrele(b64ToBytes(b64), anahtar);
      await FileSystem.writeAsStringAsync(hedef, bytesToB64(paket), {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    ilerle();
  }

  // SESLER — indir (şifresiz; anlatım içeriği, asıl koruma serving fazında imzalı URL).
  for (const { yol } of sesler) {
    const hedef = KOK + yol;
    const bilgi = await FileSystem.getInfoAsync(hedef);
    if (!bilgi.exists || bilgi.size === 0) {
      await FileSystem.downloadAsync(`${ICERIK_TABANI}/${yol}`, hedef);
    }
    ilerle();
  }

  indirilmis.add(klasor);
  await durumKaydet();
}

/** İndirilen kanunu cihazdan sil. */
export async function kanunSil(klasor: string): Promise<void> {
  if (!indirmeDestekli) return;
  await FileSystem.deleteAsync(KOK + klasor, { idempotent: true }).catch(() => {});
  indirilmis.delete(klasor);
  await durumKaydet();
}

/** İndirilen bir kanunun kapladığı toplam boyut (bayt). 0 = indirilmemiş. */
export async function kanunBoyut(klasor: string): Promise<number> {
  if (!indirmeDestekli || !kanunIndirilmisMi(klasor)) return 0;
  let toplam = 0;
  for (const { yol } of kanunGorselleri(klasor)) {
    const bilgi = await FileSystem.getInfoAsync(KOK + yol);
    if (bilgi.exists && bilgi.size) toplam += bilgi.size;
  }
  return toplam;
}
