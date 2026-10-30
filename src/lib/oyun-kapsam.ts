/**
 * OYUN BRANŞ KAPSAMI (30 Eki 2026 — Serkan Demirci, uzman erbaş: oyunlarda kapsam dışı
 * SGK/ihale/veteriner/subay yönetmeliği soruları çıkıyordu).
 *
 * Oyun sayfasının havuzları 16 branşın mevzuatından karışık. Sayfaya kullanıcının kapsamındaki
 * kanun id'leri (seed.ts) verilir → sayfa soruları bunlarla süzer (assets/oyun/oyun-merkezi.html
 * "BRANŞ KAPSAMI"). Kapsam = müşterek + kendi branşı, rütbe hariçleri düşülmüş.
 * SAF mantık. Branş yoksa null → sayfa hiçbir şeyi süzmez (eski davranış).
 */
import { SEED_BRANCHES, SEED_LAW_BRANCHES, SEED_LAWS } from '@/db/seed';
import { rutbeGorur } from '@/lib/rutbe-kapsam';
import type { Rutbe } from '@/lib/rutbe-store';

export function oyunKapsami(bransSlug: string | null, rutbe: Rutbe | null): number[] | null {
  const bid = SEED_BRANCHES.find((b) => b.slug === bransSlug)?.id;
  if (!bid) return null;
  const bransin = new Set(SEED_LAW_BRANCHES.filter((lb) => lb.branch_id === bid).map((lb) => lb.law_id));
  return SEED_LAWS.filter((l) => (l.blok === 'müşterek' || bransin.has(l.id)) && rutbeGorur(l.id, rutbe)).map((l) => l.id);
}
