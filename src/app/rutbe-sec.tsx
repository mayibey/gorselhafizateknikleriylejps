import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { RutbeSecici } from '@/components/rutbe-secici';
import { useRutbe } from '@/lib/rutbe-context';
import type { Rutbe } from '@/lib/rutbe-store';

/** Rütbe KİLİTLİ: bir kez belirlenir, sonra değiştirilemez (topluluk rütbe grupları için). */
export default function RutbeSecScreen() {
  const router = useRouter();
  const { rutbe, setRutbe } = useRutbe();

  async function sec(slug: Rutbe) {
    // Rütbe zaten belirlenmişse değişime izin verme (immutable).
    if (rutbe) {
      Alert.alert('Rütbe kilitli', 'Rütbe bir kez belirlenir ve sonradan değiştirilemez. Yardım gerekiyorsa destek ile iletişime geç.');
      return;
    }
    await setRutbe(slug);
    router.back();
  }

  return <RutbeSecici baslik="Rütbe" seciliSlug={rutbe} onSelect={sec} />;
}
