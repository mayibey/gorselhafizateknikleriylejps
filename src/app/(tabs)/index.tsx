import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { RUTBELER, type Rutbe } from '@/lib/rutbe-store';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';

// Metalik-ish altın gradyan (açık → ana → koyu altın). Play diski + geri besleme diski.
const ALTIN_GRADYAN = [Palette.altinAcik2, Palette.altin, Palette.altinKoyu] as const;

export default function KarargahScreen() {
  const router = useRouter();
  const { brans, setBrans } = useBrans();
  const { rutbe, setRutbe } = useRutbe();
  // Açık dropdown ('rol'=branş / 'kademe'=rütbe / null). Aynı anda yalnız biri.
  const [acikDD, setAcikDD] = useState<'rol' | 'kademe' | null>(null);
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

  // Etüt artık SADECE tekrar (yeni kart yok) → queue tamamı "tekrar".
  const tekrarSayisi = queue?.length ?? 0;
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
      {/* Header altı açıklama + branş/rütbe rozeti (kayan içerik) */}
      <View style={styles.selam}>
        <AppText variant="kucuk" color="solukMetin">
          Bugünkü çalışma özetin burada.
        </AppText>
        <View style={styles.rolKademe}>
          <Dropdown
            etiket="Rol"
            ikon="account-group"
            seciliAd={bransAd ?? 'Seç'}
            secenekler={branches?.map((b) => ({ slug: b.slug, ad: b.ad })) ?? []}
            seciliSlug={brans}
            acik={acikDD === 'rol'}
            onAc={() => setAcikDD(acikDD === 'rol' ? null : 'rol')}
            onSec={(slug) => {
              void setBrans(slug);
              setAcikDD(null);
            }}
          />
          <Dropdown
            etiket="Kademe"
            ikon="chevron-triple-up"
            seciliAd={rutbeAd ?? 'Seç'}
            secenekler={RUTBELER.map((r) => ({ slug: r.slug, ad: r.ad }))}
            seciliSlug={rutbe}
            acik={acikDD === 'kademe'}
            onAc={() => setAcikDD(acikDD === 'kademe' ? null : 'kademe')}
            onSec={(slug) => {
              void setRutbe(slug as Rutbe);
              setAcikDD(null);
            }}
          />
        </View>
      </View>

      {/* HERO — Devam Et / Kart Akışı (lacivert). Boşsa "bugünlük bitti". */}
      {bos ? (
        <View style={[styles.hero, styles.heroBitti]}>
          <View style={styles.heroMetin}>
            <AppText variant="etiket" color="altin" bold>
              TEKRAR YOK
            </AppText>
            <AppText variant="baslik" color="beyaz" bold>
              Etüt boş
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              Tekrarı gelen kart yok — Mevzuat'tan yeni kart öğrenebilirsin
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
          <View style={styles.heroUst}>
            <View style={styles.heroMetin}>
              <AppText variant="etiket" color="altin" bold>
                GÜNLÜK ETÜT
              </AppText>
              <AppText variant="baslik" color="beyaz" bold>
                Etüt
              </AppText>
              {/* Ne işe yaradığını açıkça anlat: SADECE aralıklı tekrar (yeni öğrenme Mevzuat'ta). */}
              <AppText variant="etiket" color="altinAcik2">
                Öğrendiklerini tekrar et (aralıklı tekrar)
              </AppText>
              <AppText variant="kucuk" color="kenarlik">
                {bekleyen > 0
                  ? `${bekleyen} kartın tekrarı geldi`
                  : 'Tekrar zamanı gelen kart yok'}
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

          {/* 3 bilgi SÜTUNU yan yana — hepsi gerçek/türetilmiş veri */}
          <View style={styles.heroBilgi}>
            <HeroBilgi ikon="clock-outline" etiket="Tahmini süre" deger={`${bekleyen} dk`} />
            {sonKonu ? <HeroBilgi ikon="book-outline" etiket="Son konu" deger={sonKonu} /> : null}
            <HeroBilgi
              ikon="target"
              etiket="Günlük hedef"
              deger={hedef && hedef > 0 ? `${hedef} kart` : 'Günü tamamla'}
            />
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
          <Gorev sayi={tekrarSayisi} etiket="Bekleyen tekrar" />
          <Gorev sayi={bugunSayi} etiket="Bugün çalışılan" />
        </View>
      </View>

      {/* GERİ BESLEME — zayıf mevzi (varsa) */}
      {zayifSayi > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.zayif, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}>
          <LinearGradient
            colors={ALTIN_GRADYAN}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gbDisk}>
            <MaterialCommunityIcons name="target" size={26} color={Palette.lacivert} />
          </LinearGradient>
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

/** İnline (sayfadan çıkmadan açılan) Rol/Kademe seçici. Seçince context'i anında günceller. */
function Dropdown({
  etiket,
  ikon,
  seciliAd,
  secenekler,
  seciliSlug,
  acik,
  onAc,
  onSec,
}: {
  etiket: string;
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  seciliAd: string;
  secenekler: { slug: string; ad: string }[];
  seciliSlug: string | null;
  acik: boolean;
  onAc: () => void;
  onSec: (slug: string) => void;
}) {
  return (
    <View style={styles.dd}>
      <Pressable
        style={({ pressed }) => [styles.ddTetik, pressed && styles.pressed]}
        onPress={onAc}
        accessibilityRole="button"
        accessibilityLabel={`${etiket}: ${seciliAd}`}>
        <MaterialCommunityIcons name={ikon} size={14} color={Palette.lacivert} />
        <View style={styles.ddTetikMetin}>
          <AppText variant="etiket" color="solukMetin">
            {etiket}
          </AppText>
          <AppText variant="kucuk" bold color="anaMetin" numberOfLines={1}>
            {seciliAd}
          </AppText>
        </View>
        <MaterialCommunityIcons
          name={acik ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Palette.solukMetin}
        />
      </Pressable>
      {acik ? (
        <View style={styles.ddPanel}>
          {secenekler.length === 0 ? (
            <AppText variant="kucuk" color="solukMetin" style={styles.ddBos}>
              Seçenek yok
            </AppText>
          ) : (
            secenekler.map((o) => {
              const sec = o.slug === seciliSlug;
              return (
                <Pressable
                  key={o.slug}
                  style={({ pressed }) => [
                    styles.ddSecenek,
                    sec && styles.ddSecenekSecili,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onSec(o.slug)}>
                  <AppText
                    variant="kucuk"
                    bold
                    color={sec ? 'beyaz' : 'anaMetin'}
                    style={styles.ddSecenekAd}>
                    {o.ad}
                  </AppText>
                  {sec ? (
                    <MaterialCommunityIcons name="check-bold" size={16} color={Palette.altin} />
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
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
  rolKademe: {
    flexDirection: 'row',
    alignItems: 'flex-start', // biri açılınca diğeri üstte kalsın (inline expander)
    gap: Spacing.two,
    zIndex: 1,
  },
  dd: {
    flex: 1,
  },
  ddTetik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  ddTetikMetin: {
    flex: 1,
  },
  ddPanel: {
    marginTop: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.one,
    gap: Spacing.half,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ddSecenek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  ddSecenekSecili: {
    backgroundColor: Palette.lacivert,
  },
  ddSecenekAd: {
    flex: 1,
  },
  ddBos: {
    padding: Spacing.two,
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
  gbDisk: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
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
