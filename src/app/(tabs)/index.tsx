import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  getAllCards,
  getCardCount,
  getPerformans,
  getStudyCards,
  getStudyDays,
  getZayifKuyruk,
} from '@/db/database';
import type { CardWithLaw } from '@/db/schema';
import type { QueueCard } from '@/lib/queue';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';

// Metalik-ish altın gradyan (açık → ana → koyu altın). Play diski + geri besleme diski.
const ALTIN_GRADYAN = [Palette.altinAcik2, Palette.altin, Palette.altinKoyu] as const;

// ⏳ JSPS SINAV TARİHİ — Karargah en üstteki geri sayım buna göre işler.
// BAŞKAN: Gerçek sınav tarih/saati belli olunca SADECE bu satırı değiştir.
// new Date(yıl, AY-1, gün, saat, dakika) — AY 0-tabanlı (8 = Eylül). Şimdilik ~65 gün (placeholder).
const SINAV_TARIHI = new Date(2026, 8, 2, 10, 0, 0); // 2 Eylül 2026, 10:00

function ikiHane(n: number): string {
  return String(n).padStart(2, '0');
}

/** Karargah en üstü: JSPS sınavına canlı geri sayım (gün/saat/dk/sn). Her saniye işler. */
function SinavGeriSayim() {
  const [kalanMs, setKalanMs] = useState(() => SINAV_TARIHI.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setKalanMs(SINAV_TARIHI.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (kalanMs <= 0) {
    return (
      <View style={styles.geriSayim}>
        <AppText variant="etiket" bold color="altinAcik2" style={styles.geriSayimUst}>
          JSPS SINAVI
        </AppText>
        <AppText variant="altBaslik" bold color="beyaz">
          Sınav günü geldi 🎖️ Başarılar!
        </AppText>
      </View>
    );
  }

  const top = Math.floor(kalanMs / 1000);
  const gun = Math.floor(top / 86400);
  const saat = Math.floor((top % 86400) / 3600);
  const dk = Math.floor((top % 3600) / 60);
  const sn = top % 60;

  return (
    <View style={styles.geriSayim}>
      <AppText variant="etiket" bold color="altinAcik2" style={styles.geriSayimUst}>
        JSPS SINAVINA KALAN
      </AppText>
      <View style={styles.geriSayimSatir}>
        <GsBlok deger={String(gun)} etiket="GÜN" />
        <GsAyrac />
        <GsBlok deger={ikiHane(saat)} etiket="SAAT" />
        <GsAyrac />
        <GsBlok deger={ikiHane(dk)} etiket="DAKİKA" />
        <GsAyrac />
        <GsBlok deger={ikiHane(sn)} etiket="SANİYE" />
      </View>
    </View>
  );
}

function GsBlok({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={styles.gsBlok}>
      <AppText variant="dev" bold color="altinAcik2" style={styles.gsSayi}>
        {deger}
      </AppText>
      <AppText variant="etiket" color="kartMetinIkincil" style={styles.gsEtiket}>
        {etiket}
      </AppText>
    </View>
  );
}

function GsAyrac() {
  return (
    <AppText variant="dev" bold color="kartMetinIkincil" style={styles.gsAyrac}>
      :
    </AppText>
  );
}

export default function KarargahScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [gunMadde, setGunMadde] = useState<CardWithLaw | null>(null);
  const [sonKonu, setSonKonu] = useState<string | null>(null);
  const [bugunSayi, setBugunSayi] = useState(0);
  // Unutma uyarısı: ≥7 gündür çalışılmamış (ama daha önce çalışılmış) kanunlar.
  const [unutulan, setUnutulan] = useState<{ lawId: number; ad: string; gun: number }[]>([]);
  const [hata, setHata] = useState(false);

  // Ekrana her dönüldüğünde tazele. Kuyruk = ana veri (hata → retry); gerisi degrade olur.
  const yukle = useCallback(() => {
    setHata(false);
    // Etüt = ZAYIF HAVUZ (tekrar-hatırlat + denemede yanlış). Due/Leitner DEĞİL → "zayıf
    // var ama Etüt boş" sorunu biter.
    void getZayifKuyruk()
      .then(setQueue)
      .catch(() => setHata(true));
    void Promise.all([getStudyCards(), getCardCount()])
      .then(([studied, toplam]) => {
        // "Çalışıldı %" = kutu≥1 / toplam (EŞİKSİZ). hazirlikYuzde (kutu≥4) DEĞİL —
        // o eşik sicil ödül + kutu grafiğinde kullanılıyor, dokunulmaz.
        const ist = hesaplaIstatistik(studied, toplam);
        const calisildiYuzde =
          ist.toplamKart > 0 ? Math.round((ist.calisilanKart / ist.toplamKart) * 100) : 0;
        setHazirlik(calisildiYuzde);
      })
      .catch(() => setHazirlik(null));
    void getStudyDays()
      .then((gunler) => setStreak(hesaplaStreak(gunler, bugunISO())))
      .catch(() => setStreak(null));
    // Günün Maddesi + bugün çalışılan + zayıf mevzi + SON KONU — tek performans+kart yüklemesinden.
    void Promise.all([getPerformans(), getAllCards()])
      .then(([perf, cards]) => {
        const adaylar = cards.filter((c) => !/^Madde\s/i.test(c.baslik));
        if (adaylar.length > 0) {
          const gun = Number(bugunISO().split('-').join('')) || 0;
          setGunMadde(adaylar[gun % adaylar.length]);
        } else {
          setGunMadde(null);
        }
        const bugun = bugunISO();
        const bugunKartlar = new Set(
          perf.filter((p) => p.tarih === bugun && p.kaynak === 'calisma').map((p) => p.card_id),
        );
        setBugunSayi(bugunKartlar.size);
        // Unutma uyarısı: her kanunun SON çalışma tarihi (calisma logundan) → ≥7 gün
        // geçmişse "tekrar et" listesine. cardLaw haritası tek seferde kurulur.
        const cardLaw = new Map(cards.map((c) => [c.id, { id: c.law_id, ad: c.law_ad }]));
        const sonCalisma = new Map<number, { ad: string; tarih: string }>();
        for (const p of perf) {
          if (p.kaynak !== 'calisma') continue;
          const cl = cardLaw.get(p.card_id);
          if (!cl) continue;
          const mevcut = sonCalisma.get(cl.id);
          if (!mevcut || p.tarih > mevcut.tarih) sonCalisma.set(cl.id, { ad: cl.ad, tarih: p.tarih });
        }
        const bugunMs = Date.parse(`${bugun}T00:00:00Z`);
        const stale = [...sonCalisma.entries()]
          .map(([lawId, v]) => ({
            lawId,
            ad: v.ad,
            gun: Math.round((bugunMs - Date.parse(`${v.tarih}T00:00:00Z`)) / 86400000),
          }))
          .filter((u) => u.gun >= 7)
          .sort((a, b) => b.gun - a.gun);
        setUnutulan(stale);
        // Son konu: en son 'calisma' performans satırı → o kartın madde_no'su (gerçek veri).
        let son: string | null = null;
        for (let i = perf.length - 1; i >= 0; i--) {
          if (perf[i].kaynak === 'calisma') {
            const k = cards.find((c) => c.id === perf[i].card_id);
            if (k) {
              son = k.madde_no;
              break;
            }
          }
        }
        setSonKonu(son);
      })
      .catch(() => {
        setGunMadde(null);
        setUnutulan([]);
      });
  }, []);

  useFocusEffect(yukle);

  // Etüt = zayıf havuz → queue tamamı zayıf mevzi (tekrar-hatırlat + denemede yanlış).
  const tekrarSayisi = queue?.length ?? 0;
  const bekleyen = queue?.length ?? 0;
  const bos = queue !== null && queue.length === 0;

  if (hata) {
    return (
      <Screen title="Karargah">
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="Günlük durum yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      </Screen>
    );
  }

  if (queue === null) {
    return (
      <Screen title="Karargah">
        <Loading metin="Yükleniyor…" />
      </Screen>
    );
  }

  return (
    <Screen
      title="Karargah"
      headerSag={
        <View style={styles.headerIkonlar}>
          <Pressable
            onPress={() => router.push('/egitim-plani')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Bildirim ayarları">
            <MaterialCommunityIcons name="bell-outline" size={22} color={Palette.altin} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/ayarlar')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Profil ve ayarlar">
            <MaterialCommunityIcons name="account-circle-outline" size={24} color={Palette.altin} />
          </Pressable>
        </View>
      }>
      {/* EN ÜST — JSPS sınavına canlı geri sayım (tarih SINAV_TARIHI sabitinde). */}
      <SinavGeriSayim />

      {/* Header altı açıklama. (Branş/rütbe artık YALNIZ Evsaf → Ayarlar'dan değişir;
          buradaki rol/kademe dropdown'ları kaldırıldı, yer 7-gün uyarı bandına bırakıldı.) */}
      <View style={styles.selam}>
        <AppText variant="kucuk" color="solukMetin">
          Bugünkü çalışma özetin burada.
        </AppText>
      </View>

      {/* UNUTMA UYARISI — ≥7 gündür tekrar edilmemiş kanunlar (tedbir bandı). */}
      {unutulan.length > 0 ? (
        <View style={styles.unutBanner}>
          <View style={styles.unutBaslik}>
            <MaterialCommunityIcons name="clock-alert-outline" size={18} color={Palette.amber} />
            <AppText variant="etiket" bold color="amber" style={styles.unutBaslikAd}>
              TEKRAR ZAMANI
            </AppText>
          </View>
          <AppText variant="kucuk" color="anaMetin">
            Şu kanunlara en az 7 gündür tekrar yapmadın — unutmamak için tekrar etmeni öneriyoruz:
          </AppText>
          {unutulan.slice(0, 5).map((u) => (
            <Pressable
              key={u.lawId}
              style={({ pressed }) => [styles.unutSatir, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/patika', params: { lawId: String(u.lawId) } })}>
              <MaterialCommunityIcons name="history" size={16} color={Palette.altinKoyu} />
              <AppText variant="kucuk" bold color="lacivert" style={styles.unutAd} numberOfLines={1}>
                {u.ad}
              </AppText>
              <AppText variant="etiket" color="solukMetin">
                {u.gun} gün
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
            </Pressable>
          ))}
          {unutulan.length > 5 ? (
            <AppText variant="etiket" color="solukMetin">
              +{unutulan.length - 5} kanun daha
            </AppText>
          ) : null}
        </View>
      ) : null}

      {/* HERO — ETÜT = zayıf havuz (eksik/zorlandığın kartları düzelt). Boşsa "zayıf yok". */}
      {bos ? (
        <Pressable
          style={({ pressed }) => [styles.hero, styles.heroBitti, pressed && styles.pressed]}
          onPress={() => router.push('/mevzuat')}
          accessibilityRole="button"
          accessibilityLabel="Mevzuat'tan konu çalış">
          <View style={styles.heroMetin}>
            <AppText variant="etiket" color="altin" bold>
              GÜNÜ TAMAMLADIN 🎖️
            </AppText>
            <AppText variant="baslik" color="beyaz" bold>
              Tüm görevleri yaptın
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              Tekrar edilecek mevzi kalmadı — Mevzuat'tan yeni konu çalış ›
            </AppText>
          </View>
          <MaterialCommunityIcons name="book-open-variant" size={52} color={Palette.altin} />
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
          accessibilityRole="button"
          accessibilityLabel="Geri Besleme — zayıf mevzileri çalış">
          <View style={styles.heroUst}>
            <View style={styles.heroMetin}>
              <AppText variant="etiket" color="altin" bold>
                GERİ BESLEME
              </AppText>
              <AppText variant="baslik" color="beyaz" bold>
                Zayıf Mevziler
              </AppText>
              {/* Etüt = hata + zorlandıklarını düzeltme bölümü (tekrar-hatırlat + denemede yanlış). */}
              <AppText variant="etiket" color="altinAcik2">
                Eksik ve zorlandığın kartları tekrar et
              </AppText>
              <AppText variant="kucuk" color="kenarlik">
                {bekleyen > 0
                  ? `${bekleyen} zayıf mevzi seni bekliyor`
                  : 'Şu an düzeltilecek mevzi yok'}
              </AppText>
            </View>
            {/* Metalik altın play diski — gradyan + gölge, lacivert play */}
            <LinearGradient
              colors={ALTIN_GRADYAN}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroPlay}>
              <MaterialCommunityIcons name="play" size={36} color={Palette.lacivert} />
            </LinearGradient>
          </View>

          {/* Bilgi SÜTUNLARI — gerçek/türetilmiş veri. (Günlük hedef sütunu kaldırıldı; hedef
              artık Karargah'ta sabit gösterilmiyor — kullanıcı Ayarlar → Eğitim Planı'ndan ayarlar.) */}
          <View style={styles.heroBilgi}>
            <HeroBilgi ikon="clock-outline" etiket="Tahmini süre" deger={`${bekleyen} dk`} />
            {sonKonu ? <HeroBilgi ikon="book-outline" etiket="Son konu" deger={sonKonu} /> : null}
          </View>
        </Pressable>
      )}

      {/* BUGÜNÜN GÖREVİ — günlük aktivite (sabit hedef/15-kart bandı KALDIRILDI; hedef
          kullanıcı tarafından Ayarlar → Eğitim Planı'ndan belirlenir). Sayaçlar gün-bazlı. */}
      <View style={styles.card}>
        <View style={styles.gorevBaslik}>
          <AppText variant="etiket" color="solukMetin" bold>
            BUGÜNÜN GÖREVİ
          </AppText>
        </View>
        <View style={styles.gorevSatir}>
          <Gorev sayi={tekrarSayisi} etiket="Zayıf mevzi" />
          <Gorev sayi={bugunSayi} etiket="Bugün çalışılan" />
        </View>
      </View>

      {/* 3 KUTU — Genel ilerleme (halka) · Nöbet serisi · Zayıf mevzi */}
      <View style={styles.kutuSatir}>
        <View style={[styles.card, styles.kutu]}>
          <Halka yuzde={hazirlik} />
          <AppText variant="etiket" color="solukMetin">
            Genel ilerleme
          </AppText>
        </View>
        <View style={[styles.card, styles.kutu]}>
          <View style={styles.kutuDeger}>
            {streak && streak > 0 ? (
              <MaterialCommunityIcons name="fire" size={22} color={Palette.amber} />
            ) : null}
            <AppText variant="dev" bold color="anaMetin">
              {streak === null || streak === 0 ? '—' : `${streak}`}
            </AppText>
          </View>
          <AppText variant="etiket" color="solukMetin">
            Nöbet serisi
          </AppText>
        </View>
        {/* Zayıf mevzi kutusu — TIKLANIR: dokun → Etüt (zayıf akışı). Boşsa pasif. */}
        <Pressable
          disabled={bekleyen === 0}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
          style={({ pressed }) => [
            styles.card,
            styles.kutu,
            pressed && styles.pressed,
            bekleyen === 0 && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Zayıf mevzileri çalış">
          <View style={styles.kutuDeger}>
            <MaterialCommunityIcons name="target" size={20} color={Palette.altinKoyu} />
            <AppText variant="dev" bold color="anaMetin">
              {bekleyen}
            </AppText>
          </View>
          <AppText variant="etiket" color="solukMetin">
            Zayıf mevzi
          </AppText>
        </Pressable>
      </View>

      {/* GÜNÜN MADDESİ — tarih rotasyonlu kart + İncele */}
      {gunMadde ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/patika', params: { lawId: String(gunMadde.law_id) } })
          }>
          <AppText variant="etiket" color="solukMetin" bold>
            GÜNÜN MADDESİ
          </AppText>
          <AppText variant="govde" bold color="anaMetin">
            {gunMadde.madde_no} — {gunMadde.baslik}
          </AppText>
          <View style={styles.gunMaddeAlt}>
            <AppText variant="kucuk" color="solukMetin" style={styles.gunMaddeAd} numberOfLines={1}>
              {gunMadde.law_ad}
            </AppText>
            <View style={styles.incele}>
              <AppText variant="etiket" bold color="altinKoyu">
                İncele
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.altinKoyu} />
            </View>
          </View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

/** Hero içi bilgi SÜTUNU: üstte ikon+etiket (soluk), altta değer (beyaz). 3'ü yan yana. */
function HeroBilgi({
  ikon,
  etiket,
  deger,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  etiket: string;
  deger: string;
}) {
  return (
    <View style={styles.heroKutu}>
      <View style={styles.heroKutuUst}>
        <MaterialCommunityIcons name={ikon} size={15} color={Palette.altinAcik2} />
        <AppText variant="kucuk" color="beyaz" bold numberOfLines={2} style={styles.heroKutuDeger}>
          {deger}
        </AppText>
      </View>
      <AppText variant="etiket" color="kenarlik" numberOfLines={1}>
        {etiket}
      </AppText>
    </View>
  );
}

/** Dairesel ilerleme halkası — track + koyu altın yay + ortada %Z. */
function Halka({ yuzde }: { yuzde: number | null }) {
  const boyut = 58;
  const kalinlik = 8;
  const r = (boyut - kalinlik) / 2;
  const c = boyut / 2;
  const cevre = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, yuzde ?? 0));
  return (
    <View style={[styles.halka, { width: boyut, height: boyut }]}>
      <Svg width={boyut} height={boyut} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={Palette.ilerlemeTrack} strokeWidth={kalinlik} fill="none" />
        {v > 0 ? (
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={Palette.altinKoyu}
            strokeWidth={kalinlik}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={cevre}
            strokeDashoffset={cevre * (1 - v / 100)}
            transform={`rotate(-90 ${c} ${c})`}
          />
        ) : null}
      </Svg>
      <AppText variant="kucuk" bold color="anaMetin">
        {yuzde === null ? '—' : `%${v}`}
      </AppText>
    </View>
  );
}

function Gorev({ sayi, etiket }: { sayi: number; etiket: string }) {
  return (
    <View style={styles.gorev}>
      <AppText variant="altBaslik" bold color="anaMetin">
        {sayi}
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  headerIkonlar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  selam: {
    gap: Spacing.two,
  },

  // Sınav geri sayımı (en üst, koyu lacivert şerit + altın rakamlar — komuta-konsolu aksanı)
  geriSayim: {
    backgroundColor: Palette.kartYuzeyKoyu,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
  },
  geriSayimUst: {
    letterSpacing: 1.5,
  },
  geriSayimSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  gsBlok: {
    alignItems: 'center',
    minWidth: 58,
  },
  gsSayi: {
    fontVariant: ['tabular-nums'],
  },
  gsEtiket: {
    letterSpacing: 0.5,
    marginTop: -2,
  },
  gsAyrac: {
    opacity: 0.5,
    marginHorizontal: 2,
  },

  // Hero
  hero: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroBitti: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.95,
  },
  heroUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMetin: {
    gap: Spacing.half,
    flex: 1,
  },
  heroPlay: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroBilgi: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroKutu: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: Palette.kartPanelKoyu,
    borderColor: Palette.kartKenarKoyu,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
  },
  heroKutuUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  heroKutuDeger: {
    flex: 1,
  },

  // Krem kartlar
  // Unutma uyarı bandı (amber çerçeveli)
  unutBanner: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.amber,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  unutBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  unutBaslikAd: {
    letterSpacing: 1,
  },
  unutSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  unutAd: {
    flex: 1,
  },
  card: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  gorevBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gorevSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gorev: {
    alignItems: 'center',
    flex: 1,
  },

  // 3 kutu
  kutuSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kutu: {
    flex: 1,
    alignItems: 'center',
  },
  kutuDeger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  halka: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bar

  // Günün maddesi
  gunMaddeAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gunMaddeAd: {
    flex: 1,
  },
  incele: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
});
