import { useRouter } from 'expo-router';

import { BransSecici } from '@/components/brans-secici';
import { useBrans } from '@/lib/brans-context';

/** Branş değiştirme (Sicil'den açılır). Seçimden sonra geri döner. */
export default function BransSecScreen() {
  const router = useRouter();
  const { brans, setBrans } = useBrans();

  async function sec(slug: string) {
    await setBrans(slug);
    router.back();
  }

  return (
    <BransSecici baslik="Branş Değiştir" seciliSlug={brans} onSelect={sec} />
  );
}
