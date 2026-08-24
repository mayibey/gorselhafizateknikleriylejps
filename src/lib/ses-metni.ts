/**
 * KART SES METNİ — TEMBEL erişim.
 *
 * NEDEN (25 Ağu 2026): `kart-ses-metinleri.ts` artık 1.511 kartın tamamını taşıyor (~1,9 MB).
 * Doğrudan `import` edilirse bu veri, onu import eden ekran yüklendiği anda ayrıştırılır —
 * kart akışı (TtsBar) her açılışta bedelini öderdi. Oysa metin YALNIZ iki yerde gerekiyor:
 *   1. ARAMA ekranı (asıl kullanıcı),
 *   2. sesi OLMAYAN kartta expo-speech okuması (25 Ağu ölçümü: sesi olmayan kart YOK).
 * Bu yüzden veri ilk gerçekten istendiğinde `require` edilir; istenmezse hiç yüklenmez.
 *
 * KURAL: `kart-ses-metinleri`'ni başka yerden DOĞRUDAN import etme — hep buradan al.
 */

let harita: Record<string, string> | null = null;

function yukle(): Record<string, string> {
  if (!harita) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    harita = require('../assets/kart-ses-metinleri').KART_SES_METINLERI as Record<string, string>;
  }
  return harita;
}

/** Tek kartın seslendirme metni (yoksa null). */
export function sesMetni(gorselYolu?: string | null): string | null {
  if (!gorselYolu) return null;
  return yukle()[gorselYolu] ?? null;
}

/** Tüm metinler — yalnız arama indeksi kurarken çağır. */
export function tumSesMetinleri(): Record<string, string> {
  return yukle();
}
