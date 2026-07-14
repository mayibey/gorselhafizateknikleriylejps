/**
 * ER MEYDANI — sunucu (Supabase) istemci katmanı. Saf oyun mantığı er-meydani-mantik.ts'te.
 * - Puan/sıralama SUNUCUDA (RPC, security definer) yönetilir → istemci puan tablosuna yazamaz (anti-hile).
 * - Supabase yoksa (offline/v1) güvenli boş/hata döner; oyun yine de gölge rakiple oynanır (sadece
 *   sıralamaya yazılmaz).
 * - RLS + RPC: docs/v2/23_er_meydani.sql.
 */
import { supabase } from '@/lib/supabase';
import { uzakPushTokenAl } from '@/lib/bildirim';

/** Expo push token'ı al + sunucuya kaydet (oda bildirimleri için). Açılışta çağrılır. Sessiz. */
export async function pushTokenGuncelle(): Promise<void> {
  if (!supabase) return;
  try {
    const token = await uzakPushTokenAl();
    if (!token) return;
    await supabase.rpc('er_meydani_push_kaydet', { p_token: token, p_platform: null });
  } catch {
    /* sessiz */
  }
}

export type ErMeydaniSonuc = { verilen: number; haftalik_toplam: number; kazandim: boolean };
export type LiderlikSatir = { sira: number; rumuz: string; puan: number; mac_sayisi: number; ben: boolean };
export type Siram = { sira: number; puan: number; mac_sayisi: number };
export type Sampiyon = { rumuz: string; puan: number };

/** Oda daveti paylaşım metni — TÜM paylaşım noktalarında AYNI (sabit konsept). */
export function odaDavetMetni(kod: string): string {
  return (
    `⚔️ Seni Er Meydanı'na davet ediyorum!\n` +
    `Mevzu — JSPS Hazırlık uygulamasında düelloya var mısın?\n` +
    `👉 https://mevzujsps.com/oda/${kod}\n` +
    `Link açılmazsa uygulamada "Kodla Katıl" bölümüne şu kodu gir: ${kod}`
  );
}

/** Kullanıcının takma adı (yoksa null). */
export async function rumuzGetir(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data: k } = await supabase.auth.getUser();
    const uid = k.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.from('profiles').select('rumuz').eq('id', uid).single();
    if (error || !data) return null;
    return (data as { rumuz: string | null }).rumuz;
  } catch {
    return null;
  }
}

/** Takma ad belirler (doğrulama + benzersizlik + küfür filtresi SUNUCUDA). */
export async function rumuzAyarla(rumuz: string): Promise<{ ok: boolean; hata?: string }> {
  if (!supabase) return { ok: false, hata: 'Şu an kullanılamıyor.' };
  try {
    const { data, error } = await supabase.rpc('er_meydani_rumuz_ayarla', { p_rumuz: rumuz });
    if (error) return { ok: false, hata: error.message };
    const sonuc = String(data ?? '');
    if (sonuc === 'ok') return { ok: true };
    return { ok: false, hata: sonuc.replace(/^hata:\s*/, '') };
  } catch (e) {
    return { ok: false, hata: (e as Error).message };
  }
}

/** Maç sonucunu kaydeder → sunucu haftalık puanı verir (anti-farm). Offline → null. */
export async function sonucKaydet(p: {
  mod: 'hizli' | 'canli' | 'arkadas';
  seed: number;
  havuz?: string;
  benimPuan: number;
  rakipPuan: number;
  golge: boolean;
  rakipId?: string | null;
  rakipRumuz?: string | null;
}): Promise<ErMeydaniSonuc | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_sonuc_kaydet', {
      p_mod: p.mod,
      p_seed: p.seed,
      p_havuz: p.havuz ?? 'ucretsiz',
      p_benim_puan: p.benimPuan,
      p_rakip_puan: p.rakipPuan,
      p_golge: p.golge,
      p_rakip_id: p.rakipId ?? null,
      p_rakip_rumuz: p.rakipRumuz ?? null,
    });
    if (error || !data) return null;
    const j = data as { verilen?: number; haftalik_toplam?: number; kazandim?: boolean; hata?: string };
    if (j.hata) return null;
    return { verilen: j.verilen ?? 0, haftalik_toplam: j.haftalik_toplam ?? 0, kazandim: !!j.kazandim };
  } catch {
    return null;
  }
}

/** Bu haftanın sıralaması (ilk N). Offline → boş. */
export async function liderlikGetir(limit = 20): Promise<LiderlikSatir[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('er_meydani_liderlik', { p_limit: limit });
    if (error || !data) return [];
    return data as LiderlikSatir[];
  } catch {
    return [];
  }
}

/** Çağıranın bu haftaki sırası (henüz puanı yoksa null). */
export async function siramGetir(): Promise<Siram | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_siram');
    if (error || !data) return null;
    const arr = data as Siram[];
    return arr.length ? arr[0] : null;
  } catch {
    return null;
  }
}

/** Geçen haftanın şampiyonu (onur köşesi). Yoksa null. */
export async function gecenHaftaSampiyon(): Promise<Sampiyon | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_gecen_hafta_sampiyon');
    if (error || !data) return null;
    const arr = data as Sampiyon[];
    return arr.length ? arr[0] : null;
  } catch {
    return null;
  }
}

// ── ODA SİSTEMİ (kuran ayarlı + açık odalar) ───────────────────────────────
export type OdaBilgi = { id: string; kod: string; seed: number; soru_sayisi: number; sure_sn: number; kanunlar: number[] };
export type AcikOda = {
  id: string;
  kod: string;
  kuran_rumuz: string;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  created_at: string;
  benimki: boolean;
};
export type OdaOyuncu = { id: string; rumuz: string; skor: number | null; ben: boolean };
export type KatilBilgi = {
  oda_id: string;
  seed: number;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  kuran_rumuz: string;
};
export type OdaOnizle = {
  oda_id: string;
  kod: string;
  durum: string;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  kuran_rumuz: string;
  oyuncu_sayisi: number;
  max_oyuncu: number;
};
export type OdaDurum = {
  durum: 'acik' | 'oynaniyor' | 'bitti' | 'kapandi';
  seed: number;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  kod: string;
  max_oyuncu: number;
  ben_kuran: boolean;
  oyuncular: OdaOyuncu[];
};
export type OdaSkorSonuc = { durum: string; oyuncular: OdaOyuncu[] };
export type Odam = {
  id: string;
  kod: string;
  durum: string;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  oyuncu_sayisi: number;
  created_at: string;
};

/** Ayarlarla (soru sayısı + süre + kanunlar) oda kurar. gizli=true → şifreli (açık listede
 * görünmez, sadece kodla girilir). Boş kanunlar = karışık. Hata → {ok:false}. */
export async function odaKur(
  soruSayisi: number,
  sureSn: number,
  kanunlar: number[],
  gizli = false,
): Promise<{ ok: boolean; oda?: OdaBilgi; hata?: string }> {
  if (!supabase) return { ok: false, hata: 'Şu an kullanılamıyor.' };
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_kur', {
      p_soru_sayisi: soruSayisi,
      p_sure_sn: sureSn,
      p_kanunlar: kanunlar,
      p_gizli: gizli,
    });
    if (error || !data) return { ok: false, hata: error?.message ?? 'Oda kurulamadı.' };
    const j = data as OdaBilgi & { hata?: string };
    if (j.hata) return { ok: false, hata: j.hata };
    return { ok: true, oda: j };
  } catch (e) {
    return { ok: false, hata: (e as Error).message };
  }
}

/** Açık odalar (herkese görünür; engellenenler hariç). Offline → boş. */
export async function acikOdalar(): Promise<AcikOda[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('er_meydani_acik_odalar', { p_limit: 30 });
    if (error || !data) return [];
    return data as AcikOda[];
  } catch {
    return [];
  }
}

/** Odaya katıl (listeden id ile veya kodla) → odanın seed+ayarları. Bulunamaz/kapalı → null. */
export async function odayaKatil(odaId: string | null, kod: string | null): Promise<KatilBilgi | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_odaya_katil', {
      p_oda_id: odaId,
      p_kod: kod,
    });
    if (error || !data) return null;
    const j = data as KatilBilgi & { hata?: string };
    if (j.hata) return null;
    return j;
  } catch {
    return null;
  }
}

/** Kuranın kendi odasını kapatması. */
export async function odaKapat(odaId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('er_meydani_oda_kapat', { p_oda_id: odaId });
  } catch {
    /* sessiz */
  }
}

/** Oda durumu (bekleme odası + maç sonu için poll). */
export async function odaDurum(odaId: string): Promise<OdaDurum | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_durum', { p_oda_id: odaId });
    if (error || !data) return null;
    const j = data as OdaDurum & { hata?: string };
    return j.hata ? null : j;
  } catch {
    return null;
  }
}

/** Maç sonu kendi skorunu odaya yaz (kuran/rakip rolüne göre sunucu koyar). */
export async function odaSkor(odaId: string, skor: number): Promise<OdaSkorSonuc | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_skor', { p_oda_id: odaId, p_skor: skor });
    if (error || !data) return null;
    const j = data as OdaSkorSonuc & { hata?: string };
    return j.hata ? null : j;
  } catch {
    return null;
  }
}

/** Kuran odayı iptal eder (rakip gelmeden). */
export async function odaIptal(odaId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('er_meydani_oda_iptal', { p_oda_id: odaId });
  } catch {
    /* sessiz */
  }
}

/** Odadan AYRIL — üyeliği sil (çıkınca düş). Kuran + oda açıksa oda kapanır. Tek-oda kuralı. */
export async function odaAyril(odaId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('er_meydani_oda_ayril', { p_oda_id: odaId });
  } catch {
    /* sessiz */
  }
}

/** Kuran, odadaki bir oyuncuyu ATAR (yetki: yalnız kuran, oda 'acik' iken). Güncel oyuncu listesi / null. */
export async function odaAt(odaId: string, hedefId: string): Promise<OdaOyuncu[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_at', { p_oda_id: odaId, p_hedef_id: hedefId });
    if (error || !data) return null;
    const j = data as { oyuncular?: OdaOyuncu[]; hata?: string };
    return j.hata ? null : (j.oyuncular ?? null);
  } catch {
    return null;
  }
}

/** Odaya KATILMADAN ayar/konu + oyuncu sayısı önizle (onay ekranı). */
export async function odaOnizle(
  odaId: string | null,
  kod: string | null,
): Promise<{ ok: boolean; oda?: OdaOnizle; hata?: string }> {
  if (!supabase) return { ok: false, hata: 'Şu an kullanılamıyor.' };
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_onizle', { p_oda_id: odaId, p_kod: kod });
    if (error || !data) return { ok: false, hata: error?.message ?? 'Oda bulunamadı.' };
    const j = data as OdaOnizle & { hata?: string };
    if (j.hata) return { ok: false, hata: j.hata };
    return { ok: true, oda: j };
  } catch (e) {
    return { ok: false, hata: (e as Error).message };
  }
}

/** Kuran maçı başlatır (durum 'oynaniyor'). Yeni durum döner / null. */
export async function odaBaslat(odaId: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_baslat', { p_oda_id: odaId });
    if (error || !data) return null;
    const j = data as { durum?: string; hata?: string };
    return j.hata ? null : (j.durum ?? null);
  } catch {
    return null;
  }
}

/** Kuranın aktif odaları ("Odalarım" — geri dön). */
export async function odalarim(): Promise<Odam[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('er_meydani_odalarim');
    if (error || !data) return [];
    return data as Odam[];
  } catch {
    return [];
  }
}

// ── LİG (dereceli, gölge-usulü) ────────────────────────────────────────────
export type LigDurum = {
  puan: number;
  kademe: string;
  mac: number;
  galip: number;
  maglup: number;
  sezon: string;
  sira: number;
};
export type LigEslesme = {
  kayit_id: string | null;
  golge: boolean;
  seed: number;
  rakip_skor: number;
  rakip_rating: number;
  rakip_rumuz: string;
  rakip_id: string | null;
  benim_rating: number;
  kademe: string;
};
export type LigSonuc = { delta: number; rating: number; kademe: string; galip_mu: boolean; berabere: boolean };
export type LigTabloSatir = {
  sira: number;
  rumuz: string;
  puan: number;
  kademe: string;
  mac: number;
  galip: number;
  ben: boolean;
};

/** Kendi lig durumu (rating/kademe/sıra). Tembel sezon sıfırlaması sunucuda uygulanır. */
export async function ligDurum(): Promise<LigDurum | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_lig_durum');
    if (error || !data) return null;
    const j = data as LigDurum & { hata?: string };
    return j.hata ? null : j;
  } catch {
    return null;
  }
}

/** Dereceli eşleşme: seviyeye yakın gölge rakip (yoksa sentetik). Offline → null. */
export async function ligEslesme(): Promise<LigEslesme | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_lig_eslesme');
    if (error || !data) return null;
    const j = data as LigEslesme & { hata?: string };
    return j.hata ? null : j;
  } catch {
    return null;
  }
}

/** Dereceli maç sonucu → ELO güncellenir (sunucu). Offline → null. */
export async function ligSonuc(p: {
  seed: number;
  benimSkor: number;
  rakipSkor: number;
  rakipRating: number;
  rakipId: string | null;
}): Promise<LigSonuc | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('er_meydani_lig_sonuc', {
      p_seed: p.seed,
      p_benim_skor: p.benimSkor,
      p_rakip_skor: p.rakipSkor,
      p_rakip_rating: p.rakipRating,
      p_rakip_id: p.rakipId,
    });
    if (error || !data) return null;
    const j = data as LigSonuc & { hata?: string };
    return j.hata ? null : j;
  } catch {
    return null;
  }
}

// ─── DERECELİ CANLI KUYRUK + HAZIR-KONTROLÜ (LoL mantığı) ───
export type DereceliDurum = {
  durum: 'araniyor' | 'eslesti' | 'oynaniyor' | 'bitti' | 'iptal' | 'yok';
  mac_id?: string;
  seed?: number;
  rakip_rumuz?: string;
  rakip_elo?: number;
  ben_hazir?: boolean;
  rakip_hazir?: boolean;
  rakip_skor?: number;
  delta?: number;
  yeni_rating?: number;
  kademe?: string;
  benim_elo?: number;
};

async function dereceliRpc(fn: string, args?: Record<string, unknown>): Promise<DereceliDurum | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error || !data) return null;
    const j = data as DereceliDurum & { hata?: string };
    return j.hata ? null : j;
  } catch {
    return null;
  }
}

/** Dereceli kuyruğa gir — bekleyen gerçek rakip varsa eşleş (ready-check), yoksa 'araniyor'. */
export function dereceliGir(): Promise<DereceliDurum | null> {
  return dereceliRpc('er_meydani_dereceli_gir');
}
/** Kuyruk/maç durumunu poll et. */
export function dereceliDurumSorgu(): Promise<DereceliDurum | null> {
  return dereceliRpc('er_meydani_dereceli_durum');
}
/** HAZIR'a bas (ready-check); ikisi de hazırsa 'oynaniyor' döner. */
export function dereceliHazir(): Promise<DereceliDurum | null> {
  return dereceliRpc('er_meydani_dereceli_hazir');
}
/** Maç bitince skoru yaz; ikisi de yazınca ELO gelir ('bitti'). */
export function dereceliSkor(skor: number): Promise<DereceliDurum | null> {
  return dereceliRpc('er_meydani_dereceli_skor', { p_skor: skor });
}
/** Kuyruktan/eşleşmeden çık. */
export async function dereceliIptal(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('er_meydani_dereceli_iptal');
  } catch {
    /* sessiz */
  }
}

/** Bu sezonun lig tablosu (rating sıralaması). Offline → boş. */
export async function ligTablo(limit = 50): Promise<LigTabloSatir[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('er_meydani_lig_tablo', { p_limit: limit });
    if (error || !data) return [];
    return data as LigTabloSatir[];
  } catch {
    return [];
  }
}

// ── DÜELLO ZAYIF KANUNLAR (premium hunisi) ─────────────────────────────────
export type ZayifKanun = { kanun: number; yanlis: number };

/** Maç sonu yanlış yapılan kanunları (tekrarlı) sayaca ekle. Sessiz (fire-and-forget). */
export async function zayifKanunEkle(kanunlar: number[]): Promise<void> {
  if (!supabase || kanunlar.length === 0) return;
  try {
    await supabase.rpc('er_meydani_zayif_ekle', { p_kanunlar: kanunlar });
  } catch {
    /* sessiz */
  }
}

/** Kullanıcının düelloda zorlandığı kanunlar (yanlış çok→az). Offline → boş. */
export async function zayifKanunlar(): Promise<ZayifKanun[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('er_meydani_zayif_kanun')
      .select('kanun, yanlis')
      .order('yanlis', { ascending: false });
    if (error || !data) return [];
    return data as ZayifKanun[];
  } catch {
    return [];
  }
}

export type ZayifMadde = { madde: string; yanlis: number };

/** Maç sonu yanlış yapılan MADDELERİ ekle (paralel: kanunlar[i] + maddeler[i]). Sessiz. */
export async function zayifMaddeEkle(kanunlar: number[], maddeler: string[]): Promise<void> {
  if (!supabase || kanunlar.length === 0) return;
  try {
    await supabase.rpc('er_meydani_zayif_madde_ekle', { p_kanunlar: kanunlar, p_maddeler: maddeler });
  } catch {
    /* sessiz */
  }
}

/** Bir kanunun zorlanılan maddeleri (yanlış çok→az). Detay modalı için. Offline → boş. */
export async function zayifMaddeler(kanun: number): Promise<ZayifMadde[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('er_meydani_zayif_maddeler', { p_kanun: kanun });
    if (error || !data) return [];
    return data as ZayifMadde[];
  } catch {
    return [];
  }
}

/** Rakibi şikayet et (Apple UGC şartı). */
export async function sikayetEt(rakipId: string | null, rakipRumuz: string | null, sebep: string): Promise<void> {
  if (!supabase) throw new Error('Şu an kullanılamıyor.');
  const { data: k } = await supabase.auth.getUser();
  const uid = k.user?.id;
  if (!uid) throw new Error('Oturum bulunamadı.');
  const { error } = await supabase
    .from('er_meydani_sikayet')
    .insert({ sikayet_eden: uid, sikayet_edilen: rakipId, rumuz: rakipRumuz, sebep });
  if (error) throw new Error(error.message);
}

/** Rakibi engelle (Apple UGC şartı). */
export async function engelle(engellenenId: string): Promise<void> {
  if (!supabase) throw new Error('Şu an kullanılamıyor.');
  const { data: k } = await supabase.auth.getUser();
  const uid = k.user?.id;
  if (!uid) throw new Error('Oturum bulunamadı.');
  const { error } = await supabase
    .from('er_meydani_engel')
    .upsert({ engelleyen: uid, engellenen: engellenenId }, { onConflict: 'engelleyen,engellenen' });
  if (error) throw new Error(error.message);
}
