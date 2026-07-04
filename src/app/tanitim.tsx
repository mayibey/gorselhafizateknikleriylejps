/**
 * Tanıtım turunu TEKRAR izleme rotası (Ayarlar → "Tanıtım turunu tekrar izle").
 * Kök kapıdaki turdan farkı: bayrakları DEĞİŞTİRMEZ (zaten görülmüş) — sadece gösterir, kapanır.
 */
import { useRouter } from 'expo-router';

import { UygulamaTuru } from '@/components/tanitim/uygulama-turu';

export default function TanitimScreen() {
  const router = useRouter();
  return <UygulamaTuru onTamam={() => router.back()} />;
}
