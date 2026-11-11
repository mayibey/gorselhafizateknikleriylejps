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
// V2 (11 Kas 2026, başkan): "ilkinde almazsa biraz kullandıktan sonra pop-up çıksın, altında
// 'bir daha gösterme' olsun; seçerse bir daha göstermeyiz, seçmezse ara ara hatırlatırız."
// Bayrak: 'indirim-hatirlat-v2'. Kurallar:
//  - Tetik: çalışmaya (patika) girmiş OLMAK ya da uygulamayı ilk açılıştan ≥ ILK_BEKLE_DK dakika
//    sonra kullanıyor olmak (biraz gezinmiş/ücretsiz bir şey denemiş).
//  - "Bir daha gösterme" seçildiyse ASLA.
//  - İki gösterim arası en az ARA_SAAT saat; toplam en fazla V2_MAX (indirim zaten 24 saat sürer).
// ─────────────────────────────────────────────────────────────────────────────
const ILK_ACILIS_KEY = 'jsps.indhat.ilkacilis'; // ilk görülme zamanı (ms)
const SON_KEY = 'jsps.indhat.son'; // son gösterim zamanı (ms)
const GOSTERME_KEY = 'jsps.indhat.gosterme'; // '1' = bir daha gösterme
const ILK_BEKLE_DK = 10;
const ARA_SAAT = 3;
const V2_MAX = 5;

async function sayiOku(k: string): Promise<number> {
  return parseInt((await AsyncStorage.getItem(k)) ?? '0', 10) || 0;
}

/** V2: hatırlatma şimdi gösterilebilir mi? */
export async function hatirlatUygunMuV2(simdi = Date.now()): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(GOSTERME_KEY)) === '1') return false;
    let ilk = await sayiOku(ILK_ACILIS_KEY);
    if (!ilk) {
      ilk = simdi;
      await AsyncStorage.setItem(ILK_ACILIS_KEY, String(simdi));
    }
    const calisti = (await AsyncStorage.getItem(TCK_KEY)) === '1';
    const gezindi = simdi - ilk >= ILK_BEKLE_DK * 60_000;
    if (!calisti && !gezindi) return false;
    if ((await sayiOku(SAYAC_KEY)) >= V2_MAX) return false;
    const son = await sayiOku(SON_KEY);
    return !son || simdi - son >= ARA_SAAT * 3_600_000;
  } catch {
    return false;
  }
}

/** V2: gösterildi → sayaç + son gösterim zamanı. */
export async function hatirlatGosterildiV2(simdi = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(SAYAC_KEY, String((await sayiOku(SAYAC_KEY)) + 1));
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
