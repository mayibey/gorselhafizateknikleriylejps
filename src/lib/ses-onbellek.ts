/**
 * SES ÖNBELLEĞİ (17 Ağu — başkan: "ses kesiliyor").
 *
 * SORUN: kanun indirilmemişse ses UZAK URL'den canlı akıtılıyordu (stream). Uzun
 * anlatımlarda (2 dk'ya varan mp3) bağlantı bir an zayıflayınca ses ortadan kesiliyor.
 * Kısa seslerde bir çırpıda buffer'a doluyor, fark edilmiyordu; uzunda duyuluyor.
 *
 * ÇÖZÜM: sesi çalmadan önce SESSİZCE diske indir, sonra YEREL dosyadan çal. Bir kez
 * iner (cache dizini), sonraki çalışlar anında + kesintisiz. İndirme başarısızsa null →
 * çağıran eski davranışa (stream) düşer, yani en kötü ihtimalde bugünkü durum.
 *
 * NOT: kanunun TAMAMINI indirmekten (lib/indirme) ayrıdır — bu yalnız o an çalınan TEK
 * mp3'ü önbelleğe alır; kullanıcı "indir" demeden, tıkladığı sesi pürüzsüz dinlesin diye.
 */
import * as FileSystem from 'expo-file-system/legacy';

import { SES_BOYUT } from '../assets/ses-boyutlari';

const KLASOR = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}jsps-ses/` : null;

// Bellek-içi: aynı oturumda inen mp3'lerin yerel uri'si (senkron erişim için).
const bellek = new Map<string, string>();
// Süren indirmeler: aynı sese iki kez basınca tek indirme.
const suren = new Map<string, Promise<string | null>>();

/** ".mp3" uzantılı güvenli dosya adı (yol içindeki / → _). */
function dosyaAdi(yol: string): string {
  return yol.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** Önbellekte HAZIR yerel uri (senkron). Yoksa null — indirme tetiklenmez. */
export function onbellekUri(yol: string): string | null {
  return bellek.get(yol) ?? null;
}

/**
 * mp3'ü önbelleğe indirir; yerel file:// uri döndürür. Zaten indirildiyse anında döner.
 * Başarısızsa null (çağıran stream'e düşer). ASLA throw etmez.
 */
/**
 * 🔴 23 Ağu 2026 — DONMA (Bünyamin Ak bildirdi: "hızlı kart geçmeye başlayınca uygulama
 * donuyor"). Sebep: her kart değişiminde YENİ bir mp3 indirmesi başlıyordu ve öncekiler
 * iptal edilmiyordu. Hızlı geçen kullanıcıda onlarca indirme aynı anda koşuyor; sesler
 * 1-2 MB olduğu için ağ ve bellek boğuluyor, arayüz kilitleniyor.
 *
 * ÇÖZÜM (üç katman):
 *  1. use-kart-sesi: kart ekranda YARIM SANİYE durmadan indirme başlamaz (hızlı geçişte hiç).
 *  2. Burada: aynı anda EN FAZLA BİR indirme — gerisi sıraya girer.
 *  3. Sıradaki iş başlarken kullanıcı o karttan ayrıldıysa (`halaGerekli`) indirme İPTAL.
 * En kötü hâlde eski davranışa (uzaktan akıtma) düşer; ses kaybolmaz.
 */
let sira: Promise<unknown> = Promise.resolve();

export async function sesiOnbellekle(
  yol: string,
  uzakUri: string,
  halaGerekli?: () => boolean,
): Promise<string | null> {
  if (!KLASOR) return null;
  const klasor = KLASOR; // iç fonksiyonda daralma korunsun (TS)
  const hazir = bellek.get(yol);
  if (hazir) return hazir;
  const mevcut = suren.get(yol);
  if (mevcut) return mevcut;

  const gorev = sira.then(async (): Promise<string | null> => {
    // Sıra bize gelene kadar kullanıcı başka karta geçmiş olabilir → boşuna indirme.
    if (halaGerekli && !halaGerekli()) { suren.delete(yol); return null; }
    return isiYap();
  });
  sira = gorev.catch(() => {});
  suren.set(yol, gorev);
  return gorev;

  async function isiYap(): Promise<string | null> {
    const hedef = `${klasor}${dosyaAdi(yol)}`;
    try {
      // Diskte önceki oturumdan kalmış olabilir → indirmeden kullan. 7 Eki 2026 (Cahit Güçlü:
      // "2-3 saniye ses gelip kesiliyor"): indirme yarıda kopunca YARIM mp3 kalıyordu ve
      // "1KB'tan büyük" diye tam sayılıyordu. Artık sunucudaki boyuttan küçükse yeniden iner.
      const beklenen = SES_BOYUT[yol] ?? 0;
      const bilgi = await FileSystem.getInfoAsync(hedef);
      if (bilgi.exists && bilgi.size && bilgi.size > 1024 && bilgi.size >= beklenen) {
        bellek.set(yol, hedef);
        return hedef;
      }
      await FileSystem.makeDirectoryAsync(klasor, { intermediates: true }).catch(() => {});
      // Önce geçici dosyaya iner, TAMAMI gelince asıl adına taşınır → yarım dosya asıl adla kalmaz.
      const gecici = `${hedef}.part`;
      await FileSystem.deleteAsync(gecici, { idempotent: true }).catch(() => {});
      const sonuc = await FileSystem.downloadAsync(uzakUri, gecici);
      const inen = await FileSystem.getInfoAsync(gecici);
      if (sonuc.status !== 200 || !sesTamIndiMi(inen.exists ? (inen.size ?? 0) : 0, beklenen, sonuc.headers)) {
        await FileSystem.deleteAsync(gecici, { idempotent: true }).catch(() => {});
        return null;
      }
      await FileSystem.deleteAsync(hedef, { idempotent: true }).catch(() => {});
      await FileSystem.moveAsync({ from: gecici, to: hedef });
      bellek.set(yol, hedef);
      return hedef;
    } catch {
      await FileSystem.deleteAsync(hedef, { idempotent: true }).catch(() => {});
      await FileSystem.deleteAsync(`${hedef}.part`, { idempotent: true }).catch(() => {});
      return null;
    } finally {
      suren.delete(yol);
    }
  }
}

/**
 * Yeni inen ses dosyası TAM mı? Sunucunun bildirdiği uzunluk (Content-Length) varsa ona birebir
 * uymalı; yoksa bilinen boyuttan küçük olmamalı. (Sunucuda dosya sonradan değişirse başlık doğruyu
 * söyler → sonsuz yeniden indirme olmaz.)
 */
export function sesTamIndiMi(boyut: number, beklenen: number, basliklar?: Record<string, string>): boolean {
  if (boyut <= 1024) return false;
  const uzunluk = Object.entries(basliklar ?? {}).find(([k]) => k.toLowerCase() === 'content-length')?.[1];
  const n = uzunluk ? Number(uzunluk) : NaN;
  if (Number.isFinite(n) && n > 0) return boyut === n;
  return boyut >= beklenen;
}
