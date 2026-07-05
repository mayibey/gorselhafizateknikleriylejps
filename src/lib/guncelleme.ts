/**
 * ZORUNLU GÜNCELLEME kontrolü. Sunucudaki `zorunlu_min_surum` (uygulama_ayar, versionCode değeri)
 * cihazdaki sürümden BÜYÜKSE → kullanıcı güncellemeden devam edemez (kök _layout kapısı gösterir).
 * Başkan yeni build yayınlayınca bu değeri o build'in versionCode'una çeker → eski sürümdeki herkes
 * güncellemeye zorlanır (BUILD gerektirmez, panelden). 0 / okunamaz (offline) → engelleme YOK (güvenli).
 */
import Constants from 'expo-constants';

import { ayarOku } from '@/lib/uzak-ayar';

/** Cihazın kurulu sürümü (Android versionCode). Bilinmiyorsa 0. */
export function suankiSurum(): number {
  return Number(Constants.expoConfig?.android?.versionCode ?? 0);
}

/** Zorunlu güncelleme gerekiyor mu? (sunucu min sürüm > cihaz sürümü). Hata/0 → false. */
export async function zorunluGuncellemeGerekli(): Promise<boolean> {
  try {
    const min = parseInt((await ayarOku('zorunlu_min_surum')) ?? '0', 10) || 0;
    if (min <= 0) return false;
    const suan = suankiSurum();
    return suan > 0 && suan < min; // sürüm bilinmiyorsa (0) kilitleme
  } catch {
    return false;
  }
}
