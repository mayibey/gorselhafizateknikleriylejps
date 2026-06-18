import { useRouter } from 'expo-router';

import { BransSecici } from '@/components/brans-secici';
import { RutbeSecici } from '@/components/rutbe-secici';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';

/**
 * İlk açılış: branş + rütbe seçilmemişse buraya yönlendirilir.
 * İki adım: önce branş, sonra rütbe (ikisi de müfredat filtresi). Branş seçilince
 * state güncellenir → bu bileşen rütbe adımına geçer; rütbe seçilince ana ekrana.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { brans, setBrans } = useBrans();
  const { rutbe, setRutbe } = useRutbe();

  // Adım 1: branş.
  if (!brans) {
    return (
      <BransSecici
        baslik="Branşını Seç"
        altyazi="Mevzuatın buna göre filtrelenecek. Sonradan Evsaf'tan değiştirebilirsin."
        onSelect={(slug) => void setBrans(slug)}
      />
    );
  }

  // Adım 2: rütbe.
  if (!rutbe) {
    return (
      <RutbeSecici
        baslik="Rütbeni Seç"
        altyazi="Konular rütbene göre filtrelenir. Sonradan Evsaf → Ayarlar'dan değiştirebilirsin."
        onSelect={(slug) => void setRutbe(slug).then(() => router.replace('/'))}
      />
    );
  }

  return null;
}
