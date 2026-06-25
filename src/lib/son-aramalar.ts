/**
 * Son arama geçmişinin kalıcı saklanması (Ara ekranı).
 * favori/brans-store deseni: tek anahtar, JSON, try/catch. AsyncStorage hem web
 * (localStorage) hem native'de kalıcı → platform ayrımı YOK, DB/migration YOK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'jsps.sonAramalar';
const MAX = 8;
const MIN_UZUNLUK = 2;

/** TR-duyarlı küçük harf (tekrarsızlık karşılaştırması için). */
function kucuk(s: string): string {
  return s.toLocaleLowerCase('tr-TR');
}

export async function getSonAramalar(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function yaz(liste: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(liste));
  } catch {
    // sessiz geç (depolama hatası geçmişi bozmasın)
  }
}

/** Sorguyu en BAŞA ekler (tekrarsız: varsa eskisini çıkar), max 8. <2 harf eklenmez. */
export async function sonAramaEkle(sorgu: string): Promise<string[]> {
  const q = sorgu.trim();
  if (q.length < MIN_UZUNLUK) return getSonAramalar();
  const mevcut = await getSonAramalar();
  const temiz = mevcut.filter((s) => kucuk(s) !== kucuk(q)); // aynı sorgu varsa çıkar
  const yeni = [q, ...temiz].slice(0, MAX);
  await yaz(yeni);
  return yeni;
}

export async function sonAramalariTemizle(): Promise<void> {
  await yaz([]);
}
