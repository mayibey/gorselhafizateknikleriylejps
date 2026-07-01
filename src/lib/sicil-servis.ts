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
  getSinavSonuclari,
  setGeriBesDurum,
} from '@/db/database';
import { zayifKartlar } from '@/lib/performans';
import { degerlendirGeriBes, type KanunDurum, odulDegerlendir, type YeniSicilKaydi } from '@/lib/sicil';
import { testSayisi, testSoruSayisi } from '@/lib/sinav';
import { bugunISO } from '@/lib/srs';

export type SicilSonuc = { yeniKayitlar: YeniSicilKaydi[] };

/** Ödül/ceza değerlendirmesini çalıştırır, yeni kayıtları DB'ye yazar ve döndürür. */
export async function degerlendirSicil(): Promise<SicilSonuc> {
  const [perf, allCards, sinavlar, durum, kayitlar] = await Promise.all([
    getPerformans(),
    getAllCards(),
    getSinavSonuclari(),
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

  // ÖDÜL — kanunun TÜM testleri %100 geçilince → Takdir (test bazlı; başkan kararı: her testi
  // %100 yapan kanunu bitirmiş sayılır). Bir test-kaydı "aced" = dogru===toplam VE toplam o testin
  // gerçek soru sayısı (eski/bölme-öncesi kayıtlar bölünmüş kanunda sayılmaz → yeniden çözülür).
  const acedTests = new Map<number, Set<number>>();
  for (const s of sinavlar) {
    if (s.toplam > 0 && s.dogru === s.toplam && s.toplam === testSoruSayisi(s.law_id, s.test)) {
      let set = acedTests.get(s.law_id);
      if (!set) {
        set = new Set();
        acedTests.set(s.law_id, set);
      }
      set.add(s.test);
    }
  }
  const yuzdeYuz = new Set<number>();
  for (const [lawId, set] of acedTests) {
    const n = testSayisi(lawId);
    if (n > 0 && set.size >= n) yuzdeYuz.add(lawId); // her testi aced → kanun tamam
  }
  const adMap = new Map<number, string>();
  for (const c of allCards) if (!adMap.has(c.law_id)) adMap.set(c.law_id, c.law_ad);
  const kanunDurumlari: KanunDurum[] = [...adMap.entries()].map(([lawId, lawAd]) => ({
    lawId,
    lawAd,
    tamamlandi: yuzdeYuz.has(lawId),
  }));
  yeniKayitlar.push(...odulDegerlendir(kanunDurumlari, kayitlar, bugun));

  for (const k of yeniKayitlar) await ekleSicilKaydi(k);
  return { yeniKayitlar };
}
