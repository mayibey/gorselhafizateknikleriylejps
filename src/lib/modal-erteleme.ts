/**
 * "Ses bitince geçiş modalı"nın "bugün sorma" ertelemesinin kalıcı saklanması.
 * son-aramalar/favori deseni: tek anahtar, JSON, try/catch. AsyncStorage hem web
 * (localStorage) hem native'de kalıcı → platform ayrımı YOK, DB/migration YOK.
 *
 * Saklanan değer: ertelemenin BİTİŞ zamanı (epoch ms). Şu an < bu zaman ise modal çıkmaz.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'jsps.modalErteleme';

/** Saklı erteleme bitiş zamanı (epoch ms); yoksa/bozuksa 0. */
export async function getErteleme(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return 0;
    const v: unknown = JSON.parse(raw);
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/** "Bugün sorma" → YARIN 08:00'e kadar ertele (o zamana dek modal çıkmaz). */
export async function erteleBugun(): Promise<void> {
  try {
    const y = new Date();
    y.setDate(y.getDate() + 1);
    y.setHours(8, 0, 0, 0);
    await AsyncStorage.setItem(KEY, JSON.stringify(y.getTime()));
  } catch {
    // sessiz geç (depolama hatası akışı bozmasın)
  }
}

/** Şu an erteleme penceresinin içinde miyiz? (true → modalı GÖSTERME) */
export async function ertelemeAktifMi(): Promise<boolean> {
  return Date.now() < (await getErteleme());
}
