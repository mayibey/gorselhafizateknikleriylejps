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

// ─────────────────────────────────────────────────────────────────────────────
// V2 (11 Kas 2026, başkan): "uygulama içinde bir şeyler yapınca göstermeli; zamana bağlı olmasın.
// Altında 'bir daha gösterme' olsun." Bayrak: 'indirim-hatirlat-v2'. Kurallar:
//  - Tetik: BU OTURUMDA bir eylem yapılmış olmalı (çalışma/patika, kart akışı, oyun, deneme bitirme)
//    → Karargah'a dönünce çıkar. Eylem yoksa çıkmaz (sadece açıp bakana gösterilmez).
//  - Oturumda en fazla bir kez (bayrak bileşende). Hemen kapat-aç ile sıkıştırmasın diye iki gösterim
//    arası en az ARA_DK dakika.
//  - "Bir daha gösterme" seçildiyse ASLA. Sayı sınırı yok; indirim süresi (24 saat) bitince kendiliğinden biter.
// ─────────────────────────────────────────────────────────────────────────────
const SON_KEY = 'jsps.indhat.son'; // son gösterim zamanı (ms)
const GOSTERME_KEY = 'jsps.indhat.gosterme'; // '1' = bir daha gösterme
const ARA_DK = 30;

// Modül-yerel: uygulama açık kaldığı sürece geçerli (kapat-aç → yeni oturum → sıfır).
let seansEylem = false;

/** Kullanıcı uygulamada bir şey yaptı (çalışma, kart, oyun, deneme) → hatırlatma tetiği açılır. */
export function indirimEylemIsaretle(): void {
  seansEylem = true;
}

/** V2: hatırlatma şimdi gösterilebilir mi? */
export async function hatirlatUygunMuV2(simdi = Date.now()): Promise<boolean> {
  if (!seansEylem) return false;
  try {
    if ((await AsyncStorage.getItem(GOSTERME_KEY)) === '1') return false;
    const son = parseInt((await AsyncStorage.getItem(SON_KEY)) ?? '0', 10) || 0;
    return !son || simdi - son >= ARA_DK * 60_000;
  } catch {
    return false;
  }
}

/** V2: gösterildi → son gösterim zamanı. */
export async function hatirlatGosterildiV2(simdi = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(SON_KEY, String(simdi));
  } catch {
    // yut
  }
}

/** V2: "Bir daha gösterme". */
export async function hatirlatBirDahaGosterme(): Promise<void> {
  try {
    await AsyncStorage.setItem(GOSTERME_KEY, '1');
  } catch {
    // yut
  }
}
