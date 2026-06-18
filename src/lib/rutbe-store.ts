/**
 * Kullanıcının rütbesinin kalıcı saklanması (branş deseninin aynısı — AsyncStorage).
 * Resmî JSPS Ek-1 listesi rütbeye göre konu ayırıyor → rütbe, müfredat filtresinin
 * ikinci boyutu (branş ile birlikte). 4 resmî rütbe.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type Rutbe = 'sb' | 'asb' | 'uzmj' | 'uzmerb';

/** Resmî 4 rütbe (Ek-1 sütunları). Sıra = seçim ekranı sırası. */
export const RUTBELER: { slug: Rutbe; ad: string }[] = [
  { slug: 'sb', ad: 'Subay' },
  { slug: 'asb', ad: 'Astsubay' },
  { slug: 'uzmj', ad: 'Uzman Jandarma' },
  { slug: 'uzmerb', ad: 'Uzman Erbaş' },
];

const ANAHTAR = 'jsps.rutbe';

export async function getRutbe(): Promise<Rutbe | null> {
  const v = await AsyncStorage.getItem(ANAHTAR);
  return v && RUTBELER.some((r) => r.slug === v) ? (v as Rutbe) : null;
}

export async function setRutbe(slug: Rutbe): Promise<void> {
  await AsyncStorage.setItem(ANAHTAR, slug);
}
