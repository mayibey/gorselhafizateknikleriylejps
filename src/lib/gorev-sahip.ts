/**
 * Cihazdaki branş/rütbe seçimi KİME ait — hesap kimliğini tutar.
 *
 * NEDEN: branş ve rütbe context'leri girişte sunucuyu esas alıyor; sunucuda seçim yoksa
 * cihazdakini SİLİYOR. Bu kural hesap değişimi için doğru (önceki kullanıcının branşı
 * yeni kullanıcıya görünmesin). AMA sunucu yazması bir sebeple düşmüşse (yeni kayıtta
 * profiles satırı henüz oluşmamışken yazma denenmesi gibi) aynı kullanıcının kendi
 * seçimi de siliniyordu → uygulama branş/rütbeyi 2. KEZ soruyordu.
 *
 * Bu yüzden artık "cihazdaki seçim bu hesaba mı ait" bilgisi de saklanıyor:
 *   · sahip == şu anki kullanıcı  → sunucu boşsa SİLME, sunucuya GERİ YAZ (kendi kendini onarır)
 *   · sahip farklı/bilinmiyor     → eski davranış: temizle (hesap değişimi)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANAHTAR = 'jsps.gorev.sahip';

export async function gorevSahibiOku(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ANAHTAR);
  } catch {
    return null;
  }
}

export async function gorevSahibiYaz(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ANAHTAR, uid);
  } catch {
    /* sessiz */
  }
}
