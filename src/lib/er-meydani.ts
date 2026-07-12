/**
 * ER MEYDANI — sunucu (Supabase) istemci katmanı. Saf oyun mantığı er-meydani-mantik.ts'te.
 * - Puan/sıralama SUNUCUDA (RPC, security definer) yönetilir → istemci puan tablosuna yazamaz (anti-hile).
 * - Supabase yoksa (offline/v1) güvenli boş/hata döner; oyun yine de gölge rakiple oynanır (sadece
 *   sıralamaya yazılmaz).
 * - RLS + RPC: docs/v2/23_er_meydani.sql.
 */
import { supabase } from '@/lib/supabase';

export type ErMeydaniSonuc = { verilen: number; haftalik_toplam: number; kazandim: boolean };
export type LiderlikSatir = { sira: number; rumuz: string; puan: number; mac_sayisi: number; ben: boolean };
export type Siram = { sira: number; puan: number; mac_sayisi: number };
export type Sampiyon = { rumuz: string; puan: number };

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
export type KatilBilgi = {
  oda_id: string;
  seed: number;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  kuran_rumuz: string;
  rol: string;
};
export type OdaDurum = {
  durum: 'acik' | 'oynaniyor' | 'bitti' | 'kapandi';
  kuran_rumuz: string;
  rakip_rumuz: string | null;
  seed: number;
  soru_sayisi: number;
  sure_sn: number;
  kanunlar: number[];
  kuran_skor: number | null;
  rakip_skor: number | null;
  rol: 'kuran' | 'rakip' | 'yok';
};
export type OdaSkorSonuc = { durum: string; kuran_skor: number | null; rakip_skor: number | null };

/** Ayarlarla (soru sayısı + süre + kanunlar) açık oda kurar. Boş kanunlar = karışık. Hata → {ok:false}. */
export async function odaKur(
  soruSayisi: number,
  sureSn: number,
  kanunlar: number[],
): Promise<{ ok: boolean; oda?: OdaBilgi; hata?: string }> {
  if (!supabase) return { ok: false, hata: 'Şu an kullanılamıyor.' };
  try {
    const { data, error } = await supabase.rpc('er_meydani_oda_kur', {
      p_soru_sayisi: soruSayisi,
      p_sure_sn: sureSn,
      p_kanunlar: kanunlar,
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
