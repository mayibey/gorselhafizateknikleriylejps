/**
 * DESTEK — okundu takibi (uygulama içi bildirim rozeti). AsyncStorage'ta son görülme
 * zamanını (ms) tutar; herhangi bir talebe admin cevabı bundan sonra geldiyse Destek
 * girişinde okunmamış rozeti çıkar (duyuru.ts okundu deseninin destek karşılığı).
 * Telefon push'u YOK — yalnız uygulama içi rozet.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SON_GORULME_KEY = 'destek_son_goruldu_v1';

/** Destek ekranının en son görüldüğü an (ms). Kayıt yoksa / hata olursa 0. */
export async function destekSonGoruldu(): Promise<number> {
  try {
    const deger = await AsyncStorage.getItem(SON_GORULME_KEY);
    return deger ? Number(deger) : 0;
  } catch {
    return 0;
  }
}

/** "Şimdi görüldü" işaretle — Destek ekranı açılınca çağrılır. */
export async function destekGoruldu(): Promise<void> {
  try {
    await AsyncStorage.setItem(SON_GORULME_KEY, String(Date.now()));
  } catch {
    // yut — okunmamış rozeti bir sonraki açılışta düzelir
  }
}
