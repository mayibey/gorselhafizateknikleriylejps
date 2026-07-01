/**
 * Deneme sınavı "kaldığın yerden devam" — yarım kalan sınavı cihazda saklar (AsyncStorage).
 * Sınav soruları HER açılışta karıştırıldığı için işaretlerle birlikte O ANKİ SORU SIRASINI da
 * saklarız → devam ederken sıra bozulmaz. Sınav bitince (ya da "Tekrar çöz") kayıt silinir.
 * Yalnız yerel (yarım sınav geçici veri → buluta senkron edilmez).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KartSoru } from '@/lib/sinav';

const ONEK = 'jsps.sinav.ilerleme.';

// Anahtar kanun+test bazlı (her testin yarım kalanı ayrı saklanır).
const anahtar = (lawId: number, test: number) => `${ONEK}${lawId}.${test}`;

export type SinavIlerleme = {
  /** O oturumdaki (karıştırılmış) soru sırası — devam ederken aynı sırayı korumak için. */
  sorular: KartSoru[];
  /** Soru başına seçilen şık index'i (null = henüz cevaplanmadı). sorular ile aynı uzunlukta. */
  secimler: (number | null)[];
  /** Bulunulan soru index'i. */
  index: number;
};

export async function sinavIlerlemeOku(lawId: number, test: number): Promise<SinavIlerleme | null> {
  try {
    const ham = await AsyncStorage.getItem(anahtar(lawId, test));
    if (!ham) return null;
    const v = JSON.parse(ham) as SinavIlerleme;
    // Sağlamlık: bozuk/eksik kayıt ya da uzunluk uyuşmazlığı → yok say (baştan başlar).
    if (!Array.isArray(v.sorular) || !Array.isArray(v.secimler)) return null;
    if (v.sorular.length === 0 || v.sorular.length !== v.secimler.length) return null;
    return v;
  } catch {
    return null;
  }
}

export async function sinavIlerlemeKaydet(
  lawId: number,
  test: number,
  v: SinavIlerleme,
): Promise<void> {
  try {
    await AsyncStorage.setItem(anahtar(lawId, test), JSON.stringify(v));
  } catch {
    // sessiz: yarım-sınav kaydı kritik değil
  }
}

export async function sinavIlerlemeSil(lawId: number, test: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(anahtar(lawId, test));
  } catch {
    // sessiz
  }
}
