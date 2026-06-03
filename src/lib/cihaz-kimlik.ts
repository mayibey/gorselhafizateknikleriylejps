/**
 * Cihaza özel kalıcı kimlik (forensic watermark için).
 * AsyncStorage hem web (localStorage) hem native'de kalıcıdır (brans-store gibi).
 * İlk açılışta bir kez kısa rastgele ID üretilir; sonra hep aynısı okunur.
 * NOT: Üyelik YOK → bu "kurulum başına" kimliktir (reinstall'da değişir).
 * Üyelik gelince kaynak gerçek user ID'ye geçer; filigran bileşeni aynı kalır.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ANAHTAR = 'jsps.cihaz';

/** ~10 karakter, okunabilir kısa hex ID (kriptografik değil; izlenebilirlik amaçlı). */
function uretId(): string {
  let s = '';
  while (s.length < 10) s += Math.random().toString(16).slice(2);
  return s.slice(0, 10);
}

// Modül-içi cache: AsyncStorage'a app başına yalnız bir kez gidilir.
let cache: Promise<string> | null = null;

/** Cihaz kimliğini döndürür; yoksa bir kez üretip kalıcı saklar. */
export function getCihazKimlik(): Promise<string> {
  if (!cache) {
    cache = (async () => {
      const mevcut = await AsyncStorage.getItem(ANAHTAR);
      if (mevcut) return mevcut;
      const yeni = uretId();
      await AsyncStorage.setItem(ANAHTAR, yeni);
      return yeni;
    })();
  }
  return cache;
}
