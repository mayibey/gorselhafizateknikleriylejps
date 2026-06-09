/**
 * Sicil değerlendirme servisi (IO orkestrasyonu — saf DEĞİL).
 * Ekrana odak gelince çağrılır: zayıf mevzi + kanun bitiş durumlarını okur, lib/sicil.ts
 * saf mantığını çalıştırır, yeni ödül/ceza kayıtlarını ve geri-bes durumunu DB'ye yazar.
 * Pure parite: tüm karar lib/sicil.ts'te; bu dosya yalnız okuma/yazma yapar.
 */

import {
  ekleSicilKaydi,
  getAllCards,
  getGeriBesDurum,
  getPerformans,
  getSicilKayitlari,
  getStudyCards,
  setGeriBesDurum,
} from '@/db/database';
import { zayifKartlar } from '@/lib/performans';
import { degerlendirGeriBes, type KanunDurum, odulDegerlendir, type YeniSicilKaydi } from '@/lib/sicil';
import { bugunISO } from '@/lib/srs';
import { OGRENILDI_KUTU } from '@/lib/stats';

export type SicilSonuc = { yeniKayitlar: YeniSicilKaydi[] };

/** Ödül/ceza değerlendirmesini çalıştırır, yeni kayıtları DB'ye yazar ve döndürür. */
export async function degerlendirSicil(): Promise<SicilSonuc> {
  const [perf, allCards, studied, durum, kayitlar] = await Promise.all([
    getPerformans(),
    getAllCards(),
    getStudyCards(),
    getGeriBesDurum(),
    getSicilKayitlari(),
  ]);
  const bugun = bugunISO();
  const yeniKayitlar: YeniSicilKaydi[] = [];

  // CEZA — geri besleme devamsızlık merdiveni.
  const zayifSayisi = zayifKartlar(perf, allCards).length;
  const { durum: yeniDurum, ceza } = degerlendirGeriBes(zayifSayisi, durum, bugun);
  await setGeriBesDurum(yeniDurum);
  if (ceza) yeniKayitlar.push(ceza);

  // ÖDÜL — kanun bitimi: o kanunun TÜM kartları kutu>=OGRENILDI_KUTU.
  const kutuMap = new Map(studied.map((c) => [c.id, c.kutu]));
  const kanunMap = new Map<number, { ad: string; cardIds: number[] }>();
  for (const c of allCards) {
    const g = kanunMap.get(c.law_id) ?? { ad: c.law_ad, cardIds: [] };
    g.cardIds.push(c.id);
    kanunMap.set(c.law_id, g);
  }
  const kanunDurumlari: KanunDurum[] = [...kanunMap.entries()].map(([lawId, g]) => ({
    lawId,
    lawAd: g.ad,
    tamamlandi:
      g.cardIds.length > 0 && g.cardIds.every((id) => (kutuMap.get(id) ?? 0) >= OGRENILDI_KUTU),
  }));
  yeniKayitlar.push(...odulDegerlendir(kanunDurumlari, kayitlar, bugun));

  for (const k of yeniKayitlar) await ekleSicilKaydi(k);
  return { yeniKayitlar };
}
