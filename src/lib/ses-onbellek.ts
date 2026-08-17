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
export async function sesiOnbellekle(yol: string, uzakUri: string): Promise<string | null> {
  if (!KLASOR) return null;
  const hazir = bellek.get(yol);
  if (hazir) return hazir;
  const mevcut = suren.get(yol);
  if (mevcut) return mevcut;

  const gorev = (async (): Promise<string | null> => {
    const hedef = `${KLASOR}${dosyaAdi(yol)}`;
    try {
      // Diskte önceki oturumdan kalmış olabilir → indirmeden kullan.
      const bilgi = await FileSystem.getInfoAsync(hedef);
      if (bilgi.exists && bilgi.size && bilgi.size > 1024) {
        bellek.set(yol, hedef);
        return hedef;
      }
      await FileSystem.makeDirectoryAsync(KLASOR, { intermediates: true }).catch(() => {});
      const sonuc = await FileSystem.downloadAsync(uzakUri, hedef);
      if (sonuc.status !== 200) {
        await FileSystem.deleteAsync(hedef, { idempotent: true }).catch(() => {});
        return null;
      }
      bellek.set(yol, hedef);
      return hedef;
    } catch {
      await FileSystem.deleteAsync(hedef, { idempotent: true }).catch(() => {});
      return null;
    } finally {
      suren.delete(yol);
    }
  })();

  suren.set(yol, gorev);
  return gorev;
}
