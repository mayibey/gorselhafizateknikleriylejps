/**
 * EVSAF ANALİZ KATEGORİLERİ (10 Ağu akşam — başkan: "olması gerekenleri ekle,
 * kategori kategori"). Hepsi MEVCUT verilerden türetilir; uydurma/yeni depo yok:
 *  - SinavProjeksiyonu: performans logu + kart sayısı + resmî sınav tarihi
 *  - KanunHaritasi: mevzuat ilerleme hattıyla aynı hesap (bölüme bağlı kartlar)
 *  - DenemeGecmisi: sinav_sonuclari tablosu (zaten yazılıyordu, hiç gösterilmiyordu)
 *  - CalismaAnalizi: son 7 gün çalışma + SRS kutu dağılımı
 *  - ErMeydaniOzeti: macGecmisi + gecmisOzet
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EvsafKategori } from '@/components/evsaf/kategori';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  getAllCards,
  getBolumKartIds,
  getCardCount,
  getLaws,
  getPerformans,
  getSinavSonuclari,
  getStudyCards,
} from '@/db/database';
import type { LawWithCount, SinavSonuc } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { type GecmisMac, gecmisOzet, macGecmisi } from '@/lib/er-meydani';
import { bugunISO } from '@/lib/srs';

/** Resmî JSPS sınav tarihi (Karargah geri sayımıyla aynı). */
const SINAV_TARIHI = new Date(2026, 8, 19, 14, 0, 0);

const gunMs = 86400000;

function tarihTRKisa(iso: string): string {
  const [y, a, g] = iso.split('-').map(Number);
  const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return y && a && g ? `${g} ${AY[a - 1]}` : iso;
}

/* ============ 1) SINAV PROJEKSİYONU ============ */

export function SinavProjeksiyonu() {
  const [veri, setVeri] = useState<{
    calisilan: number;
    toplam: number;
    tempo: number; // son 14 günde ortalama kart/gün
    kalanGun: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([getPerformans(), getStudyCards(), getCardCount()])
        .then(([perf, studied, toplam]) => {
          const bugunMs = Date.parse(`${bugunISO()}T00:00:00Z`);
          const esik = new Date(bugunMs - 14 * gunMs).toISOString().slice(0, 10);
          // Son 14 günde çalışılan BENZERSİZ kartlar (aynı kartı iki kez saymayalım).
          const set = new Set(
            perf.filter((p) => p.kaynak === 'calisma' && p.tarih > esik).map((p) => p.card_id),
          );
          const kalanGun = Math.max(1, Math.ceil((SINAV_TARIHI.getTime() - Date.now()) / gunMs));
          setVeri({
            calisilan: studied.filter((c) => c.kutu >= 1).length,
            toplam,
            tempo: set.size / 14,
            kalanGun,
          });
        })
        .catch(() => setVeri(null));
    }, []),
  );

  if (!veri || veri.toplam === 0) return null;
  const tahmini = Math.min(
    veri.toplam,
    Math.round(veri.calisilan + veri.tempo * veri.kalanGun),
  );
  const tahminiYuzde = Math.round((tahmini / veri.toplam) * 100);
  const gerekliGunluk = Math.ceil((veri.toplam - veri.calisilan) / veri.kalanGun);

  return (
    <EvsafKategori
      ikon="chart-line"
      baslik="Sınav Projeksiyonu"
      altYazi={`Bu tempoyla sınav günü: kartların %${tahminiYuzde}'i`}>
      <View style={st.satirlar}>
        <AppText variant="kucuk" color="beyaz">
          Sınava <AppText variant="kucuk" bold color="altinParlak">{veri.kalanGun} gün</AppText> var.
          Şu ana kadar {veri.calisilan}/{veri.toplam} kart çalıştın.
        </AppText>
        <AppText variant="kucuk" color="beyaz">
          Son 14 gündeki temponla (günde ~{Math.round(veri.tempo)} kart) sınav gününe kadar{' '}
          <AppText variant="kucuk" bold color="altinParlak">
            {tahmini} kart (%{tahminiYuzde})
          </AppText>{' '}
          bitirmiş olursun.
        </AppText>
        <AppText variant="kucuk" color="beyaz">
          Tamamını bitirmek için günde{' '}
          <AppText variant="kucuk" bold color="altinParlak">{gerekliGunluk} kart</AppText> gerekiyor.
        </AppText>
      </View>
    </EvsafKategori>
  );
}

/* ============ 2) KANUN HARİTASI ============ */

export function KanunHaritasi() {
  const router = useRouter();
  const { brans } = useBrans();
  const [liste, setListe] = useState<{ law: LawWithCount; calisilan: number; toplam: number }[] | null>(null);
  const [sekme, setSekme] = useState<'musterek' | 'brans'>('musterek');

  useFocusEffect(
    useCallback(() => {
      if (!brans) return;
      void Promise.all([getLaws(brans), getStudyCards(), getAllCards(), getBolumKartIds()])
        .then(([laws, studied, allCards, bolumKartIds]) => {
          // Mevzuat listesiyle AYNI payda: yalnız bölüme bağlı kartlar.
          const bagli = new Set(bolumKartIds);
          const toplamMap = new Map<number, number>();
          for (const c of allCards)
            if (bagli.has(c.id)) toplamMap.set(c.law_id, (toplamMap.get(c.law_id) ?? 0) + 1);
          const ilerlemeMap = new Map<number, number>();
          for (const c of studied)
            if (c.kutu >= 1 && bagli.has(c.id))
              ilerlemeMap.set(c.law_id, (ilerlemeMap.get(c.law_id) ?? 0) + 1);
          setListe(
            laws
              .filter((l) => (toplamMap.get(l.id) ?? 0) > 0)
              .map((law) => ({
                law,
                calisilan: ilerlemeMap.get(law.id) ?? 0,
                toplam: toplamMap.get(law.id) ?? 0,
              }))
              .sort((a, b) => b.calisilan / b.toplam - a.calisilan / a.toplam),
          );
        })
        .catch(() => setListe(null));
    }, [brans]),
  );

  if (!liste || liste.length === 0) return null;
  const baslanan = liste.filter((s) => s.calisilan > 0).length;
  const musterek = liste.filter((s) => s.law.blok === 'müşterek');
  const bransGrubu = liste.filter((s) => s.law.blok !== 'müşterek');

  const satirCiz = (s: { law: LawWithCount; calisilan: number; toplam: number }) => {
    const yuzde = Math.round((s.calisilan / s.toplam) * 100);
    return (
      <Pressable
        key={s.law.id}
        onPress={() => router.push({ pathname: '/patika', params: { lawId: String(s.law.id) } })}
        style={({ pressed }) => [st.kanunSatir, pressed && st.basili]}
        accessibilityRole="button"
        accessibilityLabel={`${s.law.ad} patikası`}>
        <AppText variant="etiket" bold color="beyaz" style={st.kanunAd} numberOfLines={1}>
          {s.law.ad}
        </AppText>
        <View style={st.kanunBar}>
          {yuzde > 0 ? <View style={[st.kanunBarDolu, { flex: yuzde }]} /> : null}
          <View style={{ flex: Math.max(1, 100 - yuzde) }} />
        </View>
        <AppText variant="etiket" bold color={yuzde > 0 ? 'altinMetin' : 'solukMetin'} style={st.kanunYuzde}>
          %{yuzde}
        </AppText>
      </Pressable>
    );
  };

  return (
    <EvsafKategori
      ikon="map-outline"
      baslik="Kanun Haritası"
      altYazi={`${liste.length} kanunun ${baslanan}'inde başladın`}>
      {/* Yan yana blok seçici — seçilen blokun listesi sabit alanda kayar. */}
      <View style={st.haritaSekmeler}>
        <Pressable
          style={[st.haritaSekme, sekme === 'musterek' && st.haritaSekmeAktif]}
          onPress={() => setSekme('musterek')}
          accessibilityRole="button"
          accessibilityLabel="Müşterek mevzuat">
          <AppText variant="etiket" bold color={sekme === 'musterek' ? 'altinParlak' : 'beyaz'}>
            MÜŞTEREK
          </AppText>
        </Pressable>
        <Pressable
          style={[st.haritaSekme, sekme === 'brans' && st.haritaSekmeAktif]}
          onPress={() => setSekme('brans')}
          accessibilityRole="button"
          accessibilityLabel="Branş mevzuatı">
          <AppText variant="etiket" bold color={sekme === 'brans' ? 'altinParlak' : 'beyaz'}>
            BRANŞ
          </AppText>
        </Pressable>
      </View>
      <ScrollView
        style={st.haritaAlan}
        contentContainerStyle={st.haritaIcerik}
        nestedScrollEnabled
        showsVerticalScrollIndicator>
        {(sekme === 'musterek' ? musterek : bransGrubu).map(satirCiz)}
        {sekme === 'brans' && bransGrubu.length === 0 ? (
          <AppText variant="etiket" color="kartMetinIkincil">
            Bu blokta henüz kart yok.
          </AppText>
        ) : null}
      </ScrollView>
    </EvsafKategori>
  );
}

/* ============ 3) DENEME GEÇMİŞİ ============ */

export function DenemeGecmisi() {
  const { brans } = useBrans();
  const [sonuclar, setSonuclar] = useState<SinavSonuc[] | null>(null);
  const [lawAd, setLawAd] = useState<Map<number, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      void getSinavSonuclari()
        .then(setSonuclar)
        .catch(() => setSonuclar([]));
      if (brans) {
        void getLaws(brans)
          .then((laws) => setLawAd(new Map(laws.map((l) => [l.id, l.ad] as const))))
          .catch(() => {});
      }
    }, [brans]),
  );

  if (sonuclar === null) return null;
  const son = [...sonuclar].reverse().slice(0, 8);
  const sonYuzde =
    son.length > 0 && son[0].toplam > 0 ? Math.round((son[0].dogru / son[0].toplam) * 100) : null;

  return (
    <EvsafKategori
      ikon="clipboard-text-outline"
      baslik="Deneme Geçmişi"
      altYazi={
        sonuclar.length === 0
          ? 'Henüz deneme çözmedin'
          : `${sonuclar.length} deneme · son: %${sonYuzde ?? 0}`
      }>
      {son.length === 0 ? (
        <AppText variant="kucuk" color="kartMetinIkincil">
          Kanun kartlarındaki "Talim Yap" ile ilk denemeni çöz — sonuçların burada birikir.
        </AppText>
      ) : (
        son.map((s) => {
          const yuzde = s.toplam > 0 ? Math.round((s.dogru / s.toplam) * 100) : 0;
          const kanun = lawAd.get(s.law_id) ?? `Kanun ${s.law_id}`;
          return (
            <View key={s.id} style={st.denemeSatir}>
              <AppText variant="etiket" bold color="beyaz" style={st.kanunAd} numberOfLines={1}>
                {kanun} · Test {s.test + 1}
              </AppText>
              <AppText variant="etiket" color="kartMetinIkincil">
                {tarihTRKisa(s.tarih)}
              </AppText>
              <AppText
                variant="etiket"
                bold
                color={yuzde >= 100 ? 'altinMetin' : yuzde >= 70 ? 'anaMetin' : 'solukMetin'}
                style={st.denemeSkor}>
                {s.dogru}/{s.toplam} · %{yuzde}
              </AppText>
            </View>
          );
        })
      )}
    </EvsafKategori>
  );
}

/* ============ 4) ÇALIŞMA ANALİZİ (haftalık şerit + kutu dağılımı) ============ */

export function CalismaAnalizi() {
  const [veri, setVeri] = useState<{
    gunler: { gun: string; adet: number }[]; // son 7 gün, eski→yeni
    saglam: number;
    tanisik: number;
    yeni: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([getPerformans(), getStudyCards(), getCardCount()])
        .then(([perf, studied, toplam]) => {
          const bugunMs = Date.parse(`${bugunISO()}T00:00:00Z`);
          const gunler: { gun: string; adet: number }[] = [];
          for (let i = 6; i >= 0; i--) {
            const t = new Date(bugunMs - i * gunMs).toISOString().slice(0, 10);
            const adet = new Set(
              perf.filter((p) => p.kaynak === 'calisma' && p.tarih === t).map((p) => p.card_id),
            ).size;
            gunler.push({ gun: t, adet });
          }
          const saglam = studied.filter((c) => c.kutu >= 4).length;
          const tanisik = studied.filter((c) => c.kutu >= 1 && c.kutu < 4).length;
          setVeri({ gunler, saglam, tanisik, yeni: Math.max(0, toplam - saglam - tanisik) });
        })
        .catch(() => setVeri(null));
    }, []),
  );

  if (!veri) return null;
  const haftaToplam = veri.gunler.reduce((a, g) => a + g.adet, 0);
  const aktifGun = veri.gunler.filter((g) => g.adet > 0).length;
  const enCok = Math.max(1, ...veri.gunler.map((g) => g.adet));
  const kutuToplam = veri.saglam + veri.tanisik + veri.yeni;
  const GUN_HARF = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

  return (
    <EvsafKategori
      ikon="chart-bar"
      baslik="Çalışma Analizim"
      altYazi={`Bu hafta ${haftaToplam} kart · ${aktifGun} gün aktif`}>
      {/* Son 7 gün — minik çubuklar (yükseklik = o günün kart sayısı). */}
      <View style={st.haftaSatir}>
        {veri.gunler.map((g) => (
          <View key={g.gun} style={st.haftaKol}>
            <View style={st.haftaCubukAlan}>
              <View
                style={[
                  st.haftaCubuk,
                  { height: `${Math.max(6, Math.round((g.adet / enCok) * 100))}%` },
                  g.adet === 0 && st.haftaCubukBos,
                ]}
              />
            </View>
            <AppText variant="etiket" color="kartMetinIkincil">
              {GUN_HARF[new Date(`${g.gun}T00:00:00Z`).getUTCDay()]}
            </AppText>
            <AppText variant="etiket" bold color={g.adet > 0 ? 'altinParlak' : 'kartMetinIkincil'}>
              {g.adet}
            </AppText>
          </View>
        ))}
      </View>
      {/* Öğrenme derinliği — SRS kutu dağılımı tek çubukta. */}
      <AppText variant="etiket" color="kartMetinIkincil" bold>
        ÖĞRENME DERİNLİĞİ
      </AppText>
      <View style={st.kutuBar}>
        {veri.saglam > 0 ? <View style={[st.kutuSaglam, { flex: veri.saglam }]} /> : null}
        {veri.tanisik > 0 ? <View style={[st.kutuTanisik, { flex: veri.tanisik }]} /> : null}
        {veri.yeni > 0 ? <View style={[st.kutuYeni, { flex: veri.yeni }]} /> : null}
      </View>
      <AppText variant="etiket" color="kartMetinIkincil">
        {veri.saglam} sağlam · {veri.tanisik} tanışık · {veri.yeni} el değmemiş ({kutuToplam} kart)
      </AppText>
    </EvsafKategori>
  );
}

/* ============ 5) ER MEYDANI ÖZETİ ============ */

export function ErMeydaniOzeti() {
  const router = useRouter();
  const [maclar, setMaclar] = useState<GecmisMac[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      void macGecmisi(60)
        .then(setMaclar)
        .catch(() => setMaclar([]));
    }, []),
  );

  if (maclar === null || maclar.length === 0) return null; // hiç maç yoksa kategori görünmez
  const ozet = gecmisOzet(maclar);

  return (
    <EvsafKategori
      ikon="sword-cross"
      baslik="Er Meydanı"
      altYazi={`${ozet.toplam} maç · ${ozet.galibiyet} galibiyet · rekor ${ozet.enYuksek}`}>
      {maclar.slice(0, 3).map((m) => (
        <View key={m.id} style={st.macSatir}>
          <MaterialCommunityIcons
            name={m.kazandim ? 'trophy-outline' : 'shield-outline'}
            size={16}
            color={m.kazandim ? Palette.altinParlak : Palette.kartMetinIkincil}
          />
          <AppText variant="etiket" bold color="beyaz" style={st.kanunAd} numberOfLines={1}>
            {m.rakip_rumuz ?? 'Rakip'}
          </AppText>
          <AppText variant="etiket" bold color={m.kazandim ? 'altinParlak' : 'kartMetinIkincil'}>
            {m.benim_puan}–{m.rakip_puan} {m.kazandim ? 'G' : 'M'}
          </AppText>
        </View>
      ))}
      <Pressable
        onPress={() => router.push('/er-meydani-gecmis')}
        style={({ pressed }) => [st.tumu, pressed && st.basili]}
        accessibilityRole="button"
        accessibilityLabel="Tüm maçlar">
        <AppText variant="etiket" bold color="altinParlak">
          Tüm maçlar
        </AppText>
        <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.altinParlak} />
      </Pressable>
    </EvsafKategori>
  );
}

/* ============ 6) VERİ GÜVENCE NOTU ============ */

export function GuvenceNotu() {
  return (
    <View style={st.guvence}>
      <MaterialCommunityIcons name="cloud-check-outline" size={15} color={Palette.kartMetinIkincil} />
      <AppText variant="etiket" color="kartMetinIkincil">
        İlerlemen sunucuya yedekli — telefon değişse de kaldığın yerden devam edersin.
      </AppText>
    </View>
  );
}

const st = StyleSheet.create({
  satirlar: { gap: Spacing.one },
  basili: { opacity: 0.85 },
  kanunSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kanunAd: { flex: 1, flexShrink: 1 },
  haritaAlan: { maxHeight: 300 },
  haritaIcerik: { gap: Spacing.two, paddingRight: 2 },
  haritaSekmeler: { flexDirection: 'row', gap: Spacing.one },
  haritaSekme: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderColor: 'rgba(126,205,218,0.3)',
  },
  haritaSekmeAktif: {
    backgroundColor: 'rgba(3,47,69,0.95)',
    borderColor: '#F3C24A',
  },
  kanunBar: {
    flexDirection: 'row',
    width: 90,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,246,220,0.18)',
    overflow: 'hidden',
  },
  kanunBarDolu: { backgroundColor: Palette.altin },
  kanunYuzde: { width: 40, textAlign: 'right' },
  denemeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  denemeSkor: { minWidth: 76, textAlign: 'right' },
  haftaSatir: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  haftaKol: { flex: 1, alignItems: 'center', gap: 2 },
  haftaCubukAlan: {
    height: 44,
    width: 14,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,246,220,0.18)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  haftaCubuk: { backgroundColor: Palette.altin, borderRadius: 4 },
  haftaCubukBos: { backgroundColor: 'rgba(255,246,220,0.12)' },
  kutuBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,246,220,0.18)',
  },
  kutuSaglam: { backgroundColor: Palette.altinKoyu },
  kutuTanisik: { backgroundColor: Palette.altin },
  kutuYeni: { backgroundColor: 'rgba(255,246,220,0.18)' },
  macSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tumu: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
  },
  guvence: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
});
