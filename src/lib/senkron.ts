/**
 * Bulut senkron — kullanıcı ilerlemesini (srs/performans/sicil/sınav/günler) hesabıyla eşitler.
 * Yaklaşım: JSON snapshot (Supabase `kullanici_ilerleme.veri jsonb`). Son-yazan-kazanır;
 * SRS'te `max(kutu)` ile asla geri gitmez (DB tarafı ilerlemeIceAktar). Yeni cihazda TAM yükle.
 *
 * - senkronYukle(): GİRİŞTE buluttan çek → yerele birleştir (yeni cihaz = tam geri yükle).
 * - senkronKaydet(): çıkış/arka plan/önemli olayda yereli buluta yükle (upsert).
 * Hepsi try/catch — offline/tablo yoksa sessiz geçer, uygulama yerelle çalışır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { IlerlemeSnapshot } from '@/db/types';
import {
  getPerformans,
  getSicilKayitlari,
  getStudyCards,
  ilerlemeDisaAktar,
  ilerlemeIceAktar,
  ilerlemeSifirla,
} from '@/db/database';
import { setFavoriler } from '@/lib/favori';
import { sinavIlerlemeTumunuSil } from '@/lib/sinav-ilerleme';
import { sonAramalariTemizle } from '@/lib/son-aramalar';
import { supabase, supabaseHazir } from '@/lib/supabase';

const TABLO = 'kullanici_ilerleme';
// Cihazda EN SON senkronlanan hesabın id'si → hesap değişimi tespiti (bulaşma önleme).
const SON_KULLANICI_KEY = 'jsps.senkron.sonKullaniciId';

// TEK SEFERLİK İLERLEME SIFIRLAMA (test için temiz başlangıç). Bu sayı ARTIRILINCA herkeste bir
// kez daha sıfırlama çalışır (eski test verisi cihaz + buluttan silinir). 0 = kapalı/hiç yapılmadı.
const SIFIRLAMA_TOHUMU = 1;
const SIFIRLAMA_ANAHTAR = 'jsps.ilerleme.sifirlamaTohumu';

/**
 * TEK SEFERLİK ilerleme sıfırlama — testerların cihazında + bulutta kalan ESKİ ilerlemeyi temiz
 * bir teste geçmek için bir kez siler. senkronYukle içinde BULUT ÇEKİMİNDEN ÖNCE çağrılır → bulut
 * yedeği de silindiği için sonraki çekim boş gelir, geri yükleme OLMAZ. Bayrak (AsyncStorage)
 * TOHUM'a eşitlenir → bir daha çalışmaz (TOHUM artırılana kadar). Başarısızsa bayrak yazılmaz →
 * sonraki girişte tekrar denenir. Referans veri (laws/cards) `ilerlemeSifirla`'da korunur.
 */
async function ilerlemeSifirlamaMigrasyonu(uid: string): Promise<void> {
  if (SIFIRLAMA_TOHUMU <= 0) return;
  const yapilan = Number((await AsyncStorage.getItem(SIFIRLAMA_ANAHTAR)) ?? '0');
  if (yapilan >= SIFIRLAMA_TOHUMU) return; // bu cihazda zaten yapıldı
  // CİHAZ: srs/performans/sicil/geriBes/sınav + yarım sınav + favori/arama (hesaba-özel yerel).
  await ilerlemeSifirla();
  await sinavIlerlemeTumunuSil();
  await setFavoriler([]);
  await sonAramalariTemizle();
  // BULUT: bu kullanıcının yedek satırı (varsa) — silinmezse çekim geri yüklerdi.
  if (supabase) await supabase.from(TABLO).delete().eq('user_id', uid);
  await AsyncStorage.setItem(SIFIRLAMA_ANAHTAR, String(SIFIRLAMA_TOHUMU));
  aktifVeriSahibi = null; // yerel artık boş → yükleme sonunda uid'e bağlanır
}
// BU ÇALIŞAN KOPYADAKİ yerel verinin sahibi (modül hafızası). Web'de OAuth popup'ı
// uygulamanın ikinci bir kopyasını açar ve AsyncStorage'ı (localStorage) paylaşır →
// yalnız depo anahtarına güvenmek yarışa açık. Kural: bu kopyada senkronYukle(uid)
// BAŞARIYLA bitmeden push YASAK; sahibi farklıysa yükleme öncesi TEMİZLİK şart.
let aktifVeriSahibi: string | null = null;

/** Yerelde hiç kullanıcı ilerlemesi yok mu (yeni/temiz cihaz tespiti → tam geri yükleme). */
async function yerelBosMu(): Promise<boolean> {
  const [studied, perf, sicil] = await Promise.all([
    getStudyCards(),
    getPerformans(),
    getSicilKayitlari(),
  ]);
  return studied.length === 0 && perf.length === 0 && sicil.length === 0;
}

/**
 * HESAP DEĞİŞİMİ KORUMASI: cihazdaki ilerleme BAŞKA bir hesabındıysa tamamen sil.
 * (Çıkış yapıp farklı hesapla girilince önceki kullanıcının srs/sicil/sınav verisi
 * yeni hesaba birleşiyor ve onun bulutuna yazılıyordu — veri bulaşması.)
 * İlk girişte (kayıtlı id yok) cihazdaki anonim ilerleme hesaba BAĞLANIR (silinmez).
 */
async function hesapDegisimiIsle(uid: string): Promise<void> {
  const depodaki = await AsyncStorage.getItem(SON_KULLANICI_KEY);
  // İKİ kaynaktan değişim tespiti: (1) bu kopyanın hafızası (web popup deposu erken
  // yazsa bile ana penceredeki eski veri yakalanır), (2) depo (uygulama yeniden
  // başlatılınca hafıza boştur; önceki oturumun sahibini depo hatırlar).
  const oncekiSahip = aktifVeriSahibi ?? depodaki;
  if (oncekiSahip && oncekiSahip !== uid) {
    await ilerlemeSifirla();
    await sinavIlerlemeTumunuSil();
    // Cihaza bağlı ama hesaba-özel diğer yerel veri de temizlenmeli — aksi halde önceki
    // kullanıcının favorileri/arama geçmişi yeni hesaba sızar. (brans/rutbe cihaz-görevi
    // olarak KASITLI korunuyor — onboarding tekrar sormasın diye.)
    await setFavoriler([]);
    await sonAramalariTemizle();
    aktifVeriSahibi = null; // yerel artık boş/sahipsiz — yükleme sonunda uid'e bağlanır
  }
  // NOT: SON_KULLANICI_KEY burada YAZILMAZ — bulut çekimi başarıyla bitince yazılır
  // (senkronYukle sonu). Aksi halde temizlik-sonrası/çekim-öncesi bir kaydet, kullanıcının
  // kendi bulutunu BOŞ snapshot ile ezebilirdi. Anahtar yazılana dek push zaten kilitli.
}

/** GİRİŞTE: buluttaki ilerlemeyi indir + yerele birleştir. */
export async function senkronYukle(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    await hesapDegisimiIsle(uid);
    // TEK SEFERLİK sıfırlama (test temiz başlangıç) — çekimden ÖNCE (bulut da silinir → boş çekilir).
    await ilerlemeSifirlamaMigrasyonu(uid);
    const { data } = await supabase.from(TABLO).select('veri').maybeSingle();
    const snapshot = data?.veri as IlerlemeSnapshot | undefined;
    if (snapshot && snapshot.surum === 1) {
      const tamYukle = await yerelBosMu();
      await ilerlemeIceAktar(snapshot, tamYukle);
    }
    // Çekim başarıyla tamamlandı (bulutta veri yoksa da) → cihaz verisi artık bu hesabın;
    // push kilidi açılır (senkronKaydet sahip kontrolü).
    aktifVeriSahibi = uid;
    await AsyncStorage.setItem(SON_KULLANICI_KEY, uid);
  } catch {
    // sessiz geç (offline / tablo yok → yerelle çalış; push kilitli kalır, veri ezilmez)
  }
}

/** İlerlemeyi buluta yükle (push). Çıkış/arka plan/önemli olaylarda.
 *  KORUMA: cihazdaki veri bu hesapla HENÜZ eşleşmediyse (sonKullaniciId ≠ uid) PUSH YOK —
 *  aksi halde hesap değişimi anında önceki kullanıcının verisi yeni hesabın bulutuna
 *  yazılabiliyordu (senkronYukle'deki temizlikle yarışıp kirliliği kalıcılaştırıyordu). */
export async function senkronKaydet(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    // Sahiplik BU KOPYANIN hafızasından: bu kopyada senkronYukle(uid) başarıyla bitmediyse
    // itme (depo anahtarı web'de popup kopyası tarafından erken yazılabiliyor → güvenilmez).
    if (aktifVeriSahibi !== uid) return;
    const snapshot = await ilerlemeDisaAktar();
    await supabase
      .from(TABLO)
      .upsert({ user_id: uid, veri: snapshot, guncelleme: new Date().toISOString() });
  } catch {
    // sessiz geç
  }
}
