/**
 * OYUN MERKEZİ KAYDI — oyun ilerlemesi (açılan bölüm, yıldız, rekor, günlük tur…).
 *
 * NEDEN SUNUCU: oyunun kendisi ilerlemeyi tarayıcı deposuna (localStorage) yazıyor. Orada
 * kalırsa telefon değişince ya da uygulama silinince her şey gider. Bu yüzden yazılan her
 * anahtar buraya düşer, buradan hem cihaza hem sunucuya kaydedilir.
 *
 * CİHAZ + SUNUCU BİRLİKTE: cihaz kaydı ANINDA yazılır (internet olmasa da oyun ilerlemeni
 * hatırlar), sunucuya yazma gecikmeli ve toplu yapılır (her harf değişiminde istek atmasın).
 * Açılışta önce sunucu denenir; ulaşılamazsa cihazdaki kayıtla oynanır — oyun hiçbir hâlde
 * kaydı yüzünden açılmamazlık etmez.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase, supabaseHazir } from '@/lib/supabase';

const CIHAZ_ANAHTAR = 'oyun_merkezi_kayit';
const TABLO = 'oyun_ilerleme';
const YAZMA_GECIKME_MS = 4000;

export type OyunKayit = Record<string, string>;

let bellek: OyunKayit = {};
let zamanlayici: ReturnType<typeof setTimeout> | null = null;

/** Cihazdaki kayıt (internet gerekmez). */
async function cihazdanOku(): Promise<OyunKayit> {
  try {
    const ham = await AsyncStorage.getItem(CIHAZ_ANAHTAR);
    return ham ? (JSON.parse(ham) as OyunKayit) : {};
  } catch {
    return {};
  }
}

/** Sunucudaki kayıt. Ulaşılamazsa null (cihazdaki kullanılır). */
async function sunucudanOku(): Promise<OyunKayit | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user?.id) return null;
    const { data, error } = await supabase.from(TABLO).select('veri').maybeSingle();
    if (error || !data) return null;
    const v = data.veri as OyunKayit | null;
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Oyun açılırken çağrılır: oynanacak kaydı verir.
 * Sunucuda kayıt varsa O kullanılır (telefon değişse bile ilerleme gelsin); yoksa cihazdaki.
 */
export async function oyunKaydiYukle(): Promise<OyunKayit> {
  const cihaz = await cihazdanOku();
  const sunucu = await sunucudanOku();
  // Sunucu kaydı yoksa cihazdaki geçerli; varsa sunucu esas alınır ama cihazda olup
  // sunucuda olmayan anahtarlar korunur (çevrimdışı oynanan tur kaybolmasın).
  bellek = sunucu ? { ...cihaz, ...sunucu } : cihaz;
  return bellek;
}

/**
 * Oyun bir anahtar yazdı. Cihaza HEMEN, sunucuya duruma göre.
 *
 * BÖLÜM İLERLEMESİ BEKLETİLMEZ (başkan bildirdi: "bölümü geçtiğim hâlde sonrakine
 * geçmeden ilerlemem kaydolmuyor"). Sebep gecikmeli yazmaydı: bölüm geçilince kayıt
 * 4 sn kuyruğa giriyor, kullanıcı o arada uygulamayı kapatırsa sunucuya hiç ulaşmıyordu.
 * Artık `*_ilerleme` anahtarları ANINDA itiliyor; gerisi (tanıtım görüldü, günlük tur
 * sayacı gibi ucuz şeyler) toplu gitmeye devam ediyor — her tuşta istek atmayalım.
 */
const ONEMLI = /_ilerleme$|^mevzu_gunun_maddesi$/;

export function oyunKaydiYaz(anahtar: string, deger: string): void {
  if (!anahtar) return;
  bellek[anahtar] = deger;
  void AsyncStorage.setItem(CIHAZ_ANAHTAR, JSON.stringify(bellek)).catch(() => {});
  if (ONEMLI.test(anahtar)) {
    void oyunKaydiGonder();
    return;
  }
  if (zamanlayici) clearTimeout(zamanlayici);
  zamanlayici = setTimeout(() => {
    zamanlayici = null;
    void oyunKaydiGonder();
  }, YAZMA_GECIKME_MS);
}

/** Biriken kaydı sunucuya iter. Ekrandan çıkarken de çağrılır (bekleyeni kaçırmamak için). */
export async function oyunKaydiGonder(): Promise<void> {
  if (zamanlayici) {
    clearTimeout(zamanlayici);
    zamanlayici = null;
  }
  if (!supabaseHazir || !supabase) return;
  if (Object.keys(bellek).length === 0) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    await supabase
      .from(TABLO)
      .upsert({ user_id: uid, veri: bellek, guncelleme: new Date().toISOString() });
  } catch {
    // sessiz geç — cihazdaki kayıt duruyor, sonraki açılışta tekrar denenir
  }
}
