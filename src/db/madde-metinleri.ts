/**
 * Orijinal kanun maddelerinin RESMÎ TAM METNİ (offline, kod-içi).
 * Anahtar = madde_no (örn. '4733 m.8'), değer = o maddenin resmî tam metni.
 * MADDE BAZINDA: aynı maddenin birden çok kartı (4733 m.8 → 10 kart) tek metni paylaşır.
 *
 * NOT: Bu DB DEĞİL — kod sabiti. Metin eklemek/düzeltmek için MIGRATION GEREKMEZ
 * (kod her açılışta taze yüklenir; seed kartlarının aksine sürüm bump'ı yok).
 * Görsel/ses registry'leriyle (KART_GORSELLERI/KART_SESLERI) aynı anahtar→değer deseni.
 *
 * Eklemek için: '4733 m.8': `... resmî tam metin ...`, satırı ekle.
 */
export const MADDE_METINLERI: Record<string, string> = {};

/** Madde metnini döndürür; yoksa null. Saf lookup (DB/IO yok). */
export function maddeMetni(maddeNo: string): string | null {
  return MADDE_METINLERI[maddeNo] ?? null;
}
