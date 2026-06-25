/**
 * Favori kanunların kalıcı saklanması (law_id listesi).
 * brans-store/bildirim deseni: tek anahtar, JSON, try/catch. AsyncStorage hem web
 * (localStorage) hem native'de kalıcı → platform ayrımı YOK, DB/migration YOK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'jsps.favori';

export async function getFavoriler(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

export async function setFavoriler(ids: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // sessiz geç (depolama hatası favoriyi bozmasın)
  }
}

/** Oku → varsa çıkar / yoksa ekle → yaz → yeni listeyi döndür. */
export async function toggleFavori(lawId: number): Promise<number[]> {
  const mevcut = await getFavoriler();
  const yeni = mevcut.includes(lawId)
    ? mevcut.filter((id) => id !== lawId)
    : [...mevcut, lawId];
  await setFavoriler(yeni);
  return yeni;
}
