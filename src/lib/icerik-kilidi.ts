/**
 * İÇERİK PREMIUM KİLİDİ — mekanizma-seviyesi ortak kapı (ekran-ekran whack-a-mole yerine).
 * Premium içeriğe (kart görsel/ses/madde metni, sınav, zor-detay) ulaşan HER ekran bunu kullanır.
 * `lawErisilebilirSaf`: bir kanunun (lawId) erişilebilirliği (kuyruk süzme için saf).
 * `useKanunKilidi`: belirli bir kanun için kapı — yükleme bitene kadar bekler (ÖDEYENİ cezalandırmaz),
 * erişim yoksa paywall'a yönlendirir; döndürdüğü `kilitli` ile ekran içeriği gizler (yanıp sönme yok).
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { kanunErisilebilirSaf } from '@/constants/urunler';
import { LAW_KLASOR } from '@/db/seed';
import { useUyelik } from '@/lib/uyelik-context';

/** Bir kanun (lawId) erişilebilir mi (saf). Bilinmeyen/geçersiz lawId → premium şartı (güvenli). */
export function lawErisilebilirSaf(lawId: number | null | undefined, premium: boolean): boolean {
  const klasor = typeof lawId === 'number' && Number.isFinite(lawId) ? LAW_KLASOR[lawId] : undefined;
  return kanunErisilebilirSaf(klasor, premium);
}

/**
 * Belirli bir kanun için premium kapısı. lawId null iken (karışık/çok-kanun mod) yönlendirmez —
 * o durumda çağıran KUYRUĞU `lawErisilebilirSaf` ile süzmeli. Erişim yoksa /paywall'a replace eder.
 */
export function useKanunKilidi(lawId: number | null): boolean {
  const router = useRouter();
  const { premium, yukleniyor } = useUyelik();
  // yukleniyor bitene kadar kilitleme (premium bilgisi taze gelmeden ödeyeni paywall'a atma — yarış fix).
  const kilitli = lawId != null && !yukleniyor && !lawErisilebilirSaf(lawId, premium);
  useEffect(() => {
    if (kilitli) router.replace('/paywall');
  }, [kilitli, router]);
  return kilitli;
}
