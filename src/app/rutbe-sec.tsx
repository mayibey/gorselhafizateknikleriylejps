import { useRouter } from 'expo-router';

import { RutbeSecici } from '@/components/rutbe-secici';
import { useRutbe } from '@/lib/rutbe-context';
import type { Rutbe } from '@/lib/rutbe-store';

/** Rütbe değiştirme (Evsaf → Ayarlar'dan açılır). Seçimden sonra geri döner. */
export default function RutbeSecScreen() {
  const router = useRouter();
  const { rutbe, setRutbe } = useRutbe();

  async function sec(slug: Rutbe) {
    await setRutbe(slug);
    router.back();
  }

  return <RutbeSecici baslik="Rütbe Değiştir" seciliSlug={rutbe} onSelect={sec} />;
}
