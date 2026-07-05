/**
 * İNDİRİM HATIRLATMA tetik durumu (cihaz-yerel, AsyncStorage).
 * Modal ne zaman çıkar: kullanıcı TCK/patika çalışmasına GİRDİKTEN sonra (ilk tetik) + sonraki
 * açılışlarda, en fazla `MAX` kez (her oturumda bir; oturum bayrağı bileşende). Yalnız ilk-giriş
 * indirimi aktif + premium değilse gösterilir (bunlar bileşende kontrol edilir).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TCK_KEY = 'jsps.indhat.tck'; // TCK/patika'ya girildi mi (ilk tetik şartı)
const SAYAC_KEY = 'jsps.indhat.sayac'; // hatırlatma kaç kez gösterildi
const MAX = 3;

/** Kullanıcı çalışmaya (patika) girince işaretle → hatırlatma tetiği açılır. */
export async function tckGirildiIsaretle(): Promise<void> {
  try {
    await AsyncStorage.setItem(TCK_KEY, '1');
  } catch {
    // yut
  }
}

/** Hatırlatma gösterilebilir mi? (çalışmaya girilmiş + MAX'tan az gösterilmiş) */
export async function hatirlatUygunMu(): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(TCK_KEY)) !== '1') return false;
    const s = parseInt((await AsyncStorage.getItem(SAYAC_KEY)) ?? '0', 10) || 0;
    return s < MAX;
  } catch {
    return false;
  }
}

/** Hatırlatma gösterildi → toplam sayacı artır (MAX'a ulaşınca bir daha çıkmaz). */
export async function hatirlatGosterildi(): Promise<void> {
  try {
    const s = parseInt((await AsyncStorage.getItem(SAYAC_KEY)) ?? '0', 10) || 0;
    await AsyncStorage.setItem(SAYAC_KEY, String(s + 1));
  } catch {
    // yut
  }
}
