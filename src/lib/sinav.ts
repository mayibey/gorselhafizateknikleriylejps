/**
 * Saf deneme sınavı (Tatbikat) mantığı — platform-bağımsız, DB/IO YOK.
 * Küratörlü SORULAR.json'lardan üretilen `KART_SORULARI` registry'sini (law_id → sorular)
 * okur; soru sırasını karıştırır ve puanlar. SRS'e DOKUNMAZ (sınav salt ölçümdür).
 *
 * NOT: Şık SIRASI karıştırılmaz — bazı açıklamalar "(C) şıkkı..." gibi harfe atıf yapar;
 * şıklar registry'de zaten "A) " önekinden ayıklanmış, doğru cevap index ile tutulur.
 */

import { KART_SORULARI, type KartSoru } from '../assets/kart-sorulari';
import { birlesikUyeler } from '@/lib/birlesik';

export type { KartSoru } from '../assets/kart-sorulari';

/** Bir sınav cevabı: hangi soru, hangi şık seçildi. */
export type SinavCevap = { soruIndex: number; secilenIndex: number };

/** Bir kanunun deneme sınavı var mı (en az 1 soru)? */
export function sinavVarMi(lawId: number): boolean {
  return (KART_SORULARI[lawId]?.length ?? 0) > 0;
}

/** Bir kanunun deneme sınavı soru sayısı (yoksa 0). */
export function sinavSoruSayisi(lawId: number): number {
  return KART_SORULARI[lawId]?.length ?? 0;
}

/** Fisher-Yates karıştırma (enjekte RNG ile). Girdiyi mutasyona uğratmaz. */
function karistir<T>(dizi: readonly T[], rastgele: () => number): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Bir kanunun sınav sorularını (soru sırası karıştırılmış) döndürür.
 * `rastgele` enjekte edilebilir → saf/test edilebilir (default Math.random).
 * Kanunun sorusu yoksa boş dizi.
 */
export function getSinavSorulari(lawId: number, rastgele: () => number = Math.random): KartSoru[] {
  const sorular = KART_SORULARI[lawId];
  if (!sorular || sorular.length === 0) return [];
  return karistir(sorular, rastgele);
}

/**
 * Bir soru kaynağından ("5237 m.1/1", "5237 m.21-22", "5237 m.247-250-252") madde
 * numaralarını çıkarır. Yalnız "m." sonrası madde no(lar)ı alınır; alt-fıkra (/2) ve
 * fıkra-aralığı (-3) yok sayılır; "-" ile ayrılan madde no'ları DISKRET listedir
 * (kaynak verisi "247-250-252" gibi maddeleri tek tek sayar). Birden çok "m." atfı
 * (örn. "m.21/2, m.36") da toplanır. Madde no yoksa (Ek/Geçici madde atfı) boş dizi.
 */
export function kaynakMaddeNolari(kaynak: string): number[] {
  const out = new Set<number>();
  const re = /m\.\s*(\d+(?:-\d+)*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(kaynak)) !== null) {
    for (const parca of m[1].split('-')) {
      const n = parseInt(parca, 10);
      if (!Number.isNaN(n)) out.add(n);
    }
  }
  return [...out];
}

/** Zayıf havuz eşleştirmesi için karttan gereken minimum alanlar. */
export type EslesmeKart = { id: number; madde_no: string; gorsel_yolu: string | null };

/**
 * Verilen soru kaynağıyla eşleşen kart id'lerini bulur (saf).
 * Bir kart eşleşir = kaynaktaki madde no'larından en az biri kartın maddesidir.
 * Kart maddeleri: madde_no'daki "m.<no>" + (birleşik/ayırt-özet kartlarda) gorsel
 * anahtarından TÜM üye madde no'ları → ör. m.21-22 ayırt kartı, "m.22" sorusuyla da eşleşir.
 * Eşleşme yoksa boş dizi (çağıran sessiz geçer).
 */
export function eslesenKartIdleri(kaynak: string, kartlar: readonly EslesmeKart[]): number[] {
  const hedef = new Set(kaynakMaddeNolari(kaynak));
  if (hedef.size === 0) return [];
  const ids: number[] = [];
  for (const k of kartlar) {
    const kartNolari = new Set<number>();
    const mm = k.madde_no.match(/m\.\s*(\d+)/i);
    if (mm) kartNolari.add(parseInt(mm[1], 10));
    const uyeler = birlesikUyeler(k.gorsel_yolu);
    if (uyeler) for (const u of uyeler) kartNolari.add(u);
    for (const n of kartNolari) {
      if (hedef.has(n)) {
        ids.push(k.id);
        break;
      }
    }
  }
  return ids;
}

/** Verilen cevapları puanlar (saf). */
export function puanlaSinav(
  cevaplar: SinavCevap[],
  sorular: KartSoru[],
): { dogru: number; toplam: number; yuzde: number } {
  const toplam = sorular.length;
  let dogru = 0;
  for (const c of cevaplar) {
    const soru = sorular[c.soruIndex];
    if (soru && c.secilenIndex === soru.dogru) dogru++;
  }
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
  return { dogru, toplam, yuzde };
}
