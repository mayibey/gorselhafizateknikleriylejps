import { useRouter } from 'expo-router';

import { BransSecici } from '@/components/brans-secici';
import { useBrans } from '@/lib/brans-context';

/** İlk açılış: branş seçilmemişse buraya yönlendirilir. */
export default function OnboardingScreen() {
  const router = useRouter();
  const { setBrans } = useBrans();

  async function sec(slug: string) {
    await setBrans(slug);
    router.replace('/');
  }

  return (
    <BransSecici
      baslik="Branşını Seç"
      altyazi="Mevzuatın buna göre filtrelenecek. Sonradan Evsaf'tan değiştirebilirsin."
      onSelect={sec}
    />
  );
}
