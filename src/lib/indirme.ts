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
import { AppState } from 'react-native';

import { KANUN_BOYUT } from '../assets/kart-boyutlari';
import { KART_GORSEL_YOLLARI } from '../assets/kart-gorselleri';
import { KART_SES_YOLLARI } from '../assets/kart-sesleri';
import { ICERIK_TABANI } from '@/constants/config';
import { icerikAnahtari } from './cihaz-anahtar';
import { gorselFiligran, imzaliUrller } from './imzali-url';
import { aesSifrele, b64ToBytes, bytesToB64 } from './sifreleme';

/** Cihazda indirme destekleniyor mu (web'de hayır). */
export const indirmeDestekli = !!FileSystem.documentDirectory;

/** Bir kanunun indirme boyutu kestirimi (bayt) — manifesten, indirmeden ÖNCE bilinir. */
export function kanunTahminiBoyut(klasor: string): number {
  return KANUN_BOYUT[klasor] ?? 0;
}

/** Bayt → okunur boyut ("45 MB", "1.2 GB", "820 KB"). 0/negatif → boş. */
export function boyutMetni(bayt: number): string {
  if (!bayt || bayt <= 0) return '';
  const mb = bayt / 1048576;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 10) return `${Math.round(mb)} MB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bayt / 1024))} KB`;
}

const KOK = (FileSystem.documentDirectory ?? '') + 'jsps/';
const DURUM_ANAHTAR = 'jsps.indirilen.kanunlar';

// Modül-içi önbellek: indirilmiş kanun klasörleri (ör. "tck"). Çözümleyici bunu senkron okur.
let indirilmis = new Set<string>();
let yuklendi = false;

const bekle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Ön plana dönene kadar bekle. Uygulama arka plandayken ağ istekleri OS tarafından kesilir;
 * bunu "hata" saymak yerine ön planı bekleyip devam ederiz → indirme İPTAL olmaz, DURAKLAR.
 * (Ön plan servisi izni almadığımız için gerçek arka-plan indirmesi yok; duraklat-devam et modeli.)
 */
function onPlanBekle(): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        sub.remove();
        resolve();
      }
    });
  });
}

// ---- İndirme durumu yöneticisi (modül-içi, reaktif) ----
// State ekran hafızasında değil BURADA tutulur → başka sekmeye geçip dönünce / arka plandan
// gelince yüzde kaybolmaz; iki bileşen aynı indirmeyi çift başlatmaz (tek uçuş).
export type AktifIndirme = { yuzde: number; iniyor: boolean; inenBayt: number };
const aktif = new Map<string, AktifIndirme>();
const promiseler = new Map<string, Promise<void>>();
const dinleyiciler = new Map<string, Set<() => void>>();

function bildir(klasor: string) {
  dinleyiciler.get(klasor)?.forEach((fn) => fn());
}

/** Bir kanunun anlık indirme durumu (yüzde + iniyor mu). Yoksa undefined. */
export function indirmeDurumuAl(klasor: string): AktifIndirme | undefined {
  return aktif.get(klasor);
}

/** Bir kanunun indirme durumundaki değişimleri dinle (abonelik). Geri dönen fn ile çöz. */
export function indirmeDinle(klasor: string, fn: () => void): () => void {
  let s = dinleyiciler.get(klasor);
  if (!s) {
    s = new Set();
    dinleyiciler.set(klasor, s);
  }
  s.add(fn);
  return () => {
    s?.delete(fn);
  };
}

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

export type IndirmeIlerleme = { toplam: number; biten: number; yuzde: number; inenBayt: number };

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

  // İMZALI URL (ses için): tüm yollar tek çağrıda; yoksa public.
  const tumYollar = [...gorseller, ...sesler].map((d) => d.yol);
  const imzali = await imzaliUrller(tumYollar).catch(() => new Map<string, string>());
  const indirUrl = (yol: string) => imzali.get(yol) ?? `${ICERIK_TABANI}/${yol}`;
  // GÖRSEL için: filigran fonksiyonu (sunucu e-postayı piksele basar). Aktifse görseller buradan.
  const filigran = await gorselFiligran().catch(() => null);

  let biten = 0;
  let inenBayt = 0;
  const ilerle = (ekBayt: number) => {
    biten++;
    inenBayt += ekBayt;
    onIlerleme?.({ toplam, biten, yuzde: Math.round((biten / toplam) * 100), inenBayt });
  };

  // Tek dosya: GÖRSEL = (filigran fn / imzalı-public) indir + AES şifrele; SES = imzalı/public.
  // Var olanı atlar (devam-edilebilir).
  const indirTek = async (tip: 'gorsel' | 'ses', yol: string) => {
    const hedef = KOK + yol;
    const bilgi = await FileSystem.getInfoAsync(hedef);
    if (bilgi.exists && bilgi.size > 0) return;
    if (tip === 'gorsel') {
      if (filigran) {
        await FileSystem.downloadAsync(`${filigran.base}?yol=${encodeURIComponent(yol)}`, hedef, {
          headers: filigran.headers,
        });
      } else {
        await FileSystem.downloadAsync(indirUrl(yol), hedef);
      }
      const b64 = await FileSystem.readAsStringAsync(hedef, { encoding: FileSystem.EncodingType.Base64 });
      const paket = aesSifrele(b64ToBytes(b64), anahtar);
      await FileSystem.writeAsStringAsync(hedef, bytesToB64(paket), {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else {
      await FileSystem.downloadAsync(indirUrl(yol), hedef);
    }
  };

  // Dayanıklı indirme: ön planı bekle → indir. Hata OLURSA ve bu sırada uygulama arka plandaysa
  // (OS ağı kesmiştir) bunu BAŞARISIZLIK SAYMA → ön planı bekleyip yeniden dene (duraklat-devam).
  // Yalnız uygulama ÖN PLANDAYKEN oluşan hatalar sayılır (gerçek ağ hatası) → 3 denemede pes eder.
  // Yeniden denemeden önce bozuk/yarım kalmış dosyayı sil (temiz iner).
  const indirTekRetry = async (tip: 'gorsel' | 'ses', yol: string) => {
    const hedef = KOK + yol;
    let d = 0;
    for (;;) {
      await onPlanBekle();
      try {
        return await indirTek(tip, yol);
      } catch (e) {
        await FileSystem.deleteAsync(hedef, { idempotent: true }).catch(() => {});
        // Arka plana geçtiği için düştüyse: sayma, ön planı bekleyip tekrar dene.
        if (AppState.currentState !== 'active') continue;
        if (d++ >= 2) throw e;
        await bekle(600 * d);
      }
    }
  };

  // PARALEL indir (eşzamanlı havuz). Sıralı çok yavaştı: sunucu filigranı görsel başına ~5sn,
  // sıralıyken her istek soğuk başlıyordu. Havuz ile sunucu çok kopya açıp aynı anda işler
  // (ölçüm: 8 paralel ≈ 5.5sn = görsel başına ~700ms, sıralının ~7 katı hız).
  const isler: { tip: 'gorsel' | 'ses'; yol: string }[] = [
    ...gorseller.map((g) => ({ tip: 'gorsel' as const, yol: g.yol })),
    ...sesler.map((s) => ({ tip: 'ses' as const, yol: s.yol })),
  ];
  const ESZAMANLI = 6;
  let sira = 0;
  const calisan = async () => {
    while (sira < isler.length) {
      const is = isler[sira++];
      await indirTekRetry(is.tip, is.yol);
      // İnen dosyanın cihazda kapladığı boyutu topla (MB göstergesi için). Var olanı atladıysa
      // da boyutu sayılır → devam eden indirmede toplam MB doğru görünür. Okunamzsa 0.
      const sz = await FileSystem.getInfoAsync(KOK + is.yol)
        .then((b) => (b.exists && b.size ? b.size : 0))
        .catch(() => 0);
      ilerle(sz);
    }
  };
  await Promise.all(Array.from({ length: ESZAMANLI }, () => calisan()));

  indirilmis.add(klasor);
  await durumKaydet();
}

/**
 * İndirmeyi TEK UÇUŞ başlat/sürdür — durum yöneticisini besler (yüzde + iniyor).
 * Aynı kanun için zaten iniyorsa mevcut promise'i döndürür (çift indirme yok). UI bunu çağırır.
 */
export function kanunIndirBaslat(klasor: string): Promise<void> {
  const mevcut = promiseler.get(klasor);
  if (mevcut) return mevcut;
  aktif.set(klasor, {
    yuzde: aktif.get(klasor)?.yuzde ?? 0,
    iniyor: true,
    inenBayt: aktif.get(klasor)?.inenBayt ?? 0,
  });
  bildir(klasor);
  const p = kanunIndir(klasor, (pr) => {
    aktif.set(klasor, { yuzde: pr.yuzde, iniyor: true, inenBayt: pr.inenBayt });
    bildir(klasor);
  }).then(
    () => {
      aktif.set(klasor, {
        yuzde: 100,
        iniyor: false,
        inenBayt: aktif.get(klasor)?.inenBayt ?? 0,
      });
      promiseler.delete(klasor);
      bildir(klasor);
    },
    (e) => {
      aktif.delete(klasor);
      promiseler.delete(klasor);
      bildir(klasor);
      throw e;
    },
  );
  promiseler.set(klasor, p);
  return p;
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
