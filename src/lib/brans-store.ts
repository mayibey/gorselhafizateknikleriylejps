/**
 * Kullanıcının seçtiği ana branşın kalıcı saklanması.
 * AsyncStorage hem web (localStorage) hem native'de kalıcıdır; platform ayrımı
 * gerekmez. Değer = branş slug'ı (ör. 'jandarma'). Alt sınıf (subay/astsubay) YOK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ANAHTAR = 'jsps.brans';

export async function getBrans(): Promise<string | null> {
  return AsyncStorage.getItem(ANAHTAR);
}

export async function setBrans(slug: string): Promise<void> {
  await AsyncStorage.setItem(ANAHTAR, slug);
}
