/**
 * Birleşik (ayırt/özet) kart yardımcıları — platform-bağımsız, saf.
 *
 * Bir "ayırt"/"özet" kartı BİRDEN ÇOK maddeyi tek görselde birleştirir. Üye madde
 * numaraları görsel anahtarında kodludur (örn. "tck_ayirt_m247_250_252" → 247,250,252;
 * "tck_ozet_m37_44" → 37,44). Seed (patika bağlama) ve kanunKuyrugu (sıralama) bu TEK
 * kaynaktan üye listesini okur → kart, içerdiği TÜM maddeler görüldükten SONRA gelir.
 */

/**
 * Görsel anahtarından birleşik kartın ÜYE madde numaraları.
 * - Çok üyeli ayırt/özet → [a, b, ...] (görseldeki sıra).
 * - Tek üyeli ayırt (örn. "eimza_ayirt_m4") veya birleşik OLMAYAN kart → null.
 */
export function birlesikUyeler(gorselYolu: string | null | undefined): number[] | null {
  if (!gorselYolu) return null;
  const us = gorselYolu.indexOf('_');
  if (us < 0) return null;
  const geri = gorselYolu.slice(us + 1); // 'ayirt_m247_250_252' | 'ozet_m37_44' | 'm35_1'
  let govde: string | null = null;
  if (geri.startsWith('ayirt_m')) govde = geri.slice(7);
  else if (geri.startsWith('ozet_m')) govde = geri.slice(6);
  if (govde === null) return null;
  const uyeler = govde
    .split('_')
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return uyeler.length > 1 ? uyeler : null;
}

/** Ayırt/özet kartının üye maddeleri + tipi (TEK üyeli de DAHİL — patika düğüm adı için). */
export type AyirtOzet = { uyeler: number[]; tip: 'ayırt' | 'özet' };

/**
 * Bir ayırt/özet kartının üyeleri + tipi. `birlesikUyeler`'den FARKI: tek üyeli kartı da
 * döndürür (örn. "eimza_ayirt_m4" → {uyeler:[4], tip:'ayırt'}) ve tip bilgisini taşır →
 * patikada her ayırt/özet kartına KENDİ düğümü ("Madde 35–36 ayırt") verilir.
 * Birleşik (ayırt/özet) olmayan veya madde-no'suz genel-özet (ozet_tutar) → null.
 */
export function ayirtOzetBilgi(gorselYolu: string | null | undefined): AyirtOzet | null {
  if (!gorselYolu) return null;
  const us = gorselYolu.indexOf('_');
  if (us < 0) return null;
  const geri = gorselYolu.slice(us + 1);
  let tip: 'ayırt' | 'özet' | null = null;
  let govde: string | null = null;
  if (geri.startsWith('ayirt_m')) {
    tip = 'ayırt';
    govde = geri.slice(7);
  } else if (geri.startsWith('ozet_m')) {
    tip = 'özet';
    govde = geri.slice(6);
  }
  if (!tip || !govde) return null;
  const uyeler = govde
    .split('_')
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return uyeler.length ? { uyeler, tip } : null;
}

/** Ayırt/özet düğümünün adı: "Madde 35–36 ayırt" / "Madde 247–250–252 özet" / "Madde 4 ayırt". */
export function birlesikDugumAd(bilgi: AyirtOzet): string {
  return `Madde ${bilgi.uyeler.join('–')} ${bilgi.tip}`;
}

/**
 * "ozet_" önekli AMA aslında GERÇEK madde olan kartlar (yanlışlıkla genel-özete düşmesin diye).
 *  - 'ek'   → Ek Madde   (bir veya birkaç madde birleşik)
 *  - 'gec'  → Geçici Madde
 *  - 'harf' → harfli madde (13/A gibi)
 */
export type OzetMadde =
  | { kind: 'ek'; maddeler: number[]; panel: number }
  | { kind: 'gec'; maddeler: number[]; panel: number }
  | { kind: 'harf'; no: number; harf: string; panel: number };

/**
 * Ek/Geçici madde gövdesini (ek/gec öneki atılmış hâli) madde numaraları + panele çözer.
 * Ayırıcı `x`. İki alt-biçim: `x05x1` (ekx…/gecx…) ya da `7x1` (ek7…).
 * KURAL: sondaki TEK-basamaklı token dizisinin uzunluğu 1 ise → o token PANEL (madde değil);
 * 0 veya ≥2 ise → tüm tokenlar madde. Böylece:
 *  ekx05x1→[5] (panel 1) · ekx03x5→[3] (panel 5) · ekx01x2x6→[1,2,6] · ekx14x17→[14,17] ·
 *  ek7x1→[7] (panel 1) · gecx01x3x5x7→[1,3,5,7] · gecx04x1→[4] (panel 1).
 */
function ekGecCoz(s: string): { maddeler: number[]; panel: number } {
  if (s.startsWith('x')) s = s.slice(1); // ekx…/gecx… biçimindeki baştaki ayırıcı
  const toks = s.split('x').filter((t) => /^\d+$/.test(t));
  if (!toks.length) return { maddeler: [], panel: 0 };
  let run = 0;
  let k = toks.length;
  while (k > 1 && toks[k - 1].length === 1) {
    run++;
    k--;
  }
  if (run === 1) {
    return { maddeler: toks.slice(0, -1).map(Number), panel: Number(toks[toks.length - 1]) };
  }
  return { maddeler: toks.map(Number), panel: 0 };
}

/**
 * Görsel anahtarının "ozet_" önekli AMA aslında gerçek madde (Ek/Geçici/harfli) olup olmadığını
 * çözer. Dosya adı deseni:
 *  - `<kanun>_ozet_ek…`  → Ek Madde   (ekx05x1, ek7x1, ekx01x2x6, ekx14x17 …)
 *  - `<kanun>_ozet_gec…` → Geçici Madde (gecx04x1, gecx01x3x5x7)
 *  - `<kanun>_ozet_<sayı><harf>[x<panel>]` → harfli madde (13ax1 → 13/A)
 * GERÇEK özet/karşılaştırma kartları (ozet_ozet, ozet_surelerxayirt, ozet_04v5xayirt …) → null.
 * Not: `04v5xayirt` gibi "harf sonrası rakam" biçimleri (4-vs-5 karşılaştırması) harfli SANILMAZ
 * ($ çapası ile eleniyor) → genel-özet kalır.
 */
export function ozetMaddeBilgi(gorselYolu: string | null | undefined): OzetMadde | null {
  if (!gorselYolu) return null;
  const us = gorselYolu.indexOf('_');
  if (us < 0) return null;
  const geri = gorselYolu.slice(us + 1);
  if (!geri.startsWith('ozet_')) return null;
  const after = geri.slice(5); // 'ekx05x1' | 'ek7x1' | 'gecx04x1' | '13ax1' | 'ozet' | '04v5xayirt'
  if (/^ek(x|\d)/.test(after)) {
    const { maddeler, panel } = ekGecCoz(after.slice(2));
    return maddeler.length ? { kind: 'ek', maddeler, panel } : null;
  }
  if (/^gec(x|\d)/.test(after)) {
    const { maddeler, panel } = ekGecCoz(after.slice(3));
    return maddeler.length ? { kind: 'gec', maddeler, panel } : null;
  }
  const h = /^(\d+)([a-z])(?:x(\d+))?$/.exec(after);
  if (h) return { kind: 'harf', no: Number(h[1]), harf: h[2].toUpperCase(), panel: h[3] ? Number(h[3]) : 1 };
  return null;
}

/** Ek/Geçici/harfli madde düğüm+başlık adı: "Ek Madde 5" / "Ek Madde 1-2-6" / "Geçici Madde 4" / "Madde 13/A". */
export function ozetMaddeAd(om: OzetMadde): string {
  if (om.kind === 'ek') return `Ek Madde ${om.maddeler.join('-')}`;
  if (om.kind === 'gec') return `Geçici Madde ${om.maddeler.join('-')}`;
  return `Madde ${om.no}/${om.harf}`;
}
