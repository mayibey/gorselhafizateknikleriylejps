import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Takdir Belgesinde görünecek ad-soyadın kullanıcı tarafından ONAYLANDIĞINI tutan cihaz-yerel
 * bayrak. Belge İLK çıktığında "belgende görünecek adın bu mu?" bir kez sorulur (bkz.
 * components/sicil/takdir-belge-alani). Onaylanınca bir daha sorulmaz.
 *
 * Neden burada (onboarding'de değil): Apple Guideline 4/5.1.1(v) gereği isim giriş akışında
 * istenemez → isim yalnız GEREKTİĞİNDE (belge anı) ve onaylı olarak toplanır.
 */
const ANAHTAR = 'belge_isim_onaylandi_v1';

export async function belgeIsimOnayliMi(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ANAHTAR)) === '1';
  } catch {
    return false;
  }
}

export async function belgeIsimOnayla(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANAHTAR, '1');
  } catch {
    /* bayrak yazılamadı → önemsiz, belge yine gösterilir */
  }
}
