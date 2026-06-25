import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  getAllCards,
  getBranches,
  getCardCount,
  getDailyQueue,
  getPerformans,
  getStudyCards,
  getStudyDays,
} from '@/db/database';
import type { Branch, CardWithLaw } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { getAyar } from '@/lib/bildirim';
import { zayifKartlar } from '@/lib/performans';
import type { QueueCard } from '@/lib/queue';
import { useRutbe } from '@/lib/rutbe-context';
import { RUTBELER } from '@/lib/rutbe-store';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';

export default function KarargahScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [gunMadde, setGunMadde] = useState<CardWithLaw | null>(null);
  const [sonKonu, setSonKonu] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [hedef, setHedef] = useState<number | null>(null);
  const [bugunSayi, setBugunSayi] = useState(0);
  const [zayifSayi, setZayifSayi] = useState(0);
  const [hata, setHata] = useState(false);

  // Ekrana her dönüldüğünde tazele. Kuyruk = ana veri (hata → retry); gerisi degrade olur.
  const yukle = useCallback(() => {
    setHata(false);
    void getDailyQueue()
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
    void getBranches()
      .then(setBranches)
      .catch(() => {});
    void getAyar()
      .then((a) => setHedef(a.gunlukKart))
      .catch(() => {});
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
        setZayifSayi(zayifKartlar(perf, cards).length);
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
      .catch(() => setGunMadde(null));
  }, []);

  useFocusEffect(yukle);

  const tekrarSayisi = queue?.filter((c) => !c.yeni).length ?? 0;
  const yeniSayisi = queue?.filter((c) => c.yeni).length ?? 0;
  const bekleyen = queue?.length ?? 0;
  const bos = queue !== null && queue.length === 0;
  const bransAd = branches?.find((b) => b.slug === brans)?.ad ?? null;
  const rutbeAd = RUTBELER.find((r) => r.slug === rutbe)?.ad ?? null;

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
          <MaterialCommunityIcons name="bell-outline" size={22} color={Palette.altin} />
          <MaterialCommunityIcons name="account-circle-outline" size={24} color={Palette.altin} />
        </View>
      }>
      {/* Header altı açıklama + branş/rütbe rozeti (kayan içerik) */}
      <View style={styles.selam}>
        <AppText variant="kucuk" color="solukMetin">
          Bugünkü çalışma özetin burada.
        </AppText>
        {bransAd || rutbeAd ? (
          <View style={styles.rozetSatir}>
            {bransAd ? <Chip ikon="account-group" metin={bransAd} /> : null}
            {rutbeAd ? <Chip ikon="chevron-triple-up" metin={rutbeAd} /> : null}
          </View>
        ) : null}
      </View>

      {/* HERO — Devam Et / Kart Akışı (lacivert). Boşsa "bugünlük bitti". */}
      {bos ? (
        <View style={[styles.hero, styles.heroBitti]}>
          <View style={styles.heroMetin}>
            <AppText variant="etiket" color="altin" bold>
              BUGÜNLÜK BİTTİ
            </AppText>
            <AppText variant="baslik" color="beyaz" bold>
              Tebrikler
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              Yarın yeni tekrarlar gelecek
            </AppText>
          </View>
          <MaterialCommunityIcons name="check-decagram" size={52} color={Palette.altin} />
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
          onPress={() => router.push('/akis')}
          accessibilityRole="button"
          accessibilityLabel="Kart akışına devam et">
          {/* Silik dekoratif arma (lacivert üstünde çok soluk, içeriği boğmaz) */}
          <MaterialCommunityIcons
            name="shield-star-outline"
            size={150}
            color={Palette.altinAcik2}
            style={styles.heroArma}
          />
          <View style={styles.heroUst}>
            <View style={styles.heroMetin}>
              <AppText variant="etiket" color="altin" bold>
                DEVAM ET
              </AppText>
              <AppText variant="baslik" color="beyaz" bold>
                Kart Akışı
              </AppText>
              <AppText variant="kucuk" color="kenarlik">
                {bekleyen > 0 ? `${bekleyen} kart seni bekliyor` : 'Kaldığın yerden çalış'}
              </AppText>
            </View>
            {/* Dolu altın play diski (mockup) — büyük, lacivert play */}
            <View style={styles.heroPlay}>
              <MaterialCommunityIcons name="play" size={34} color={Palette.lacivert} />
            </View>
          </View>

          {/* 3 bilgi SÜTUNU yan yana — hepsi gerçek/türetilmiş veri */}
          <View style={styles.heroBilgi}>
            <HeroBilgi ikon="clock-outline" etiket="Tahmini süre" deger={`${bekleyen} dk`} />
            {sonKonu ? <HeroBilgi ikon="book-outline" etiket="Son konu" deger={sonKonu} /> : null}
            <HeroBilgi ikon="target" etiket="Hedef" deger="Bugünkü görevi tamamla" />
          </View>
        </Pressable>
      )}

      {/* BUGÜNÜN GÖREVİ — günlük hedef ilerleme + Tekrar/Yeni/Bugün */}
      <View style={styles.card}>
        <View style={styles.gorevBaslik}>
          <AppText variant="etiket" color="solukMetin" bold>
            BUGÜNÜN GÖREVİ
          </AppText>
          {hedef && hedef > 0 ? (
            <AppText variant="etiket" color="solukMetin">
              {Math.min(bugunSayi, hedef)} / {hedef} kart
            </AppText>
          ) : null}
        </View>
        {hedef && hedef > 0 ? <Bar oran={bugunSayi / hedef} /> : null}
        <View style={styles.gorevSatir}>
          <Gorev sayi={tekrarSayisi} etiket="Tekrar" />
          <Gorev sayi={yeniSayisi} etiket="Yeni" />
          <Gorev sayi={bugunSayi} etiket="Bugün çalışılan" />
        </View>
      </View>

      {/* GERİ BESLEME — zayıf mevzi (varsa) */}
      {zayifSayi > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.zayif, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}>
          <MaterialCommunityIcons name="target" size={28} color={Palette.amber} />
          <View style={styles.zayifMetin}>
            <AppText variant="etiket" color="amber" bold>
              GERİ BESLEME
            </AppText>
            <AppText variant="kucuk" bold color="anaMetin">
              {zayifSayi} zayıf mevzi — şimdi güçlendir
            </AppText>
            <AppText variant="etiket" color="solukMetin">
              Son 3 oturumda zorlandığın konular
            </AppText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
        </Pressable>
      ) : null}

      {/* 3 KUTU — Genel ilerleme (halka) · Nöbet serisi · Bekleyen kart */}
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
        <View style={[styles.card, styles.kutu]}>
          <View style={styles.kutuDeger}>
            <MaterialCommunityIcons name="layers-triple-outline" size={20} color={Palette.altinKoyu} />
            <AppText variant="dev" bold color="anaMetin">
              {bekleyen}
            </AppText>
          </View>
          <AppText variant="etiket" color="solukMetin">
            Bekleyen kart
          </AppText>
        </View>
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

function Chip({ ikon, metin }: { ikon: keyof typeof MaterialCommunityIcons.glyphMap; metin: string }) {
  return (
    <View style={styles.chip}>
      <MaterialCommunityIcons name={ikon} size={14} color={Palette.lacivert} />
      <AppText variant="etiket" color="lacivert" bold>
        {metin}
      </AppText>
    </View>
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
    <View style={styles.heroSutun}>
      <View style={styles.heroSutunUst}>
        <MaterialCommunityIcons name={ikon} size={14} color={Palette.altin} />
        <AppText variant="etiket" color="kenarlik" numberOfLines={1} style={styles.heroSutunEtiket}>
          {etiket}
        </AppText>
      </View>
      <AppText variant="kucuk" color="beyaz" bold numberOfLines={2}>
        {deger}
      </AppText>
    </View>
  );
}

/** İlerleme çubuğu (oran 0..1) — altın dolgu. */
function Bar({ oran }: { oran: number }) {
  const yuzde = Math.min(100, Math.max(0, oran * 100));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${yuzde}%` }]} />
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
  rozetSatir: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },

  // Hero
  hero: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden', // silik arma taşmasın
  },
  heroArma: {
    position: 'absolute',
    right: -28,
    top: -16,
    opacity: 0.1,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBilgi: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderTopColor: 'rgba(255,255,255,0.14)',
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  heroSutun: {
    flex: 1,
    gap: Spacing.half,
  },
  heroSutunUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  heroSutunEtiket: {
    flexShrink: 1,
  },

  // Krem kartlar
  card: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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

  zayif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.amber,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  zayifMetin: {
    flex: 1,
    gap: Spacing.half,
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
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.ilerlemeTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Palette.altinKoyu,
  },

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
