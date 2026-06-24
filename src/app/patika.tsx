import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import {
  getBolumler,
  getCardCount,
  getCardsByBolum,
  getLaws,
  getStudyCards,
  getStudyDays,
} from '@/db/database';
import type { Bolum } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { bolumIlerleme } from '@/lib/patika';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';

type BolumDugum = { bolum: Bolum; calisilan: number; toplam: number; oran: number };
/** Düğümün görsel durumu — MEVCUT veri (calisilan/toplam/aktifIndex) türetilir, davranış değil. */
type Durum = 'aktif' | 'tamam' | 'baslanmis' | 'baslanmadi';

// Animasyon native sürücüsü web'de desteklenmez (RNW uyarı basar) → platforma göre.
const USE_NATIVE = Platform.OS !== 'web';

// Kıvrımlı yol geometrisi (düğüm merkezleri SVG path ile birebir aynı koordinatlardan geçer).
const NODE = 76; // normal düğüm çapı
const HERO = 98; // aktif düğüm (büyük / hero)
const ROW_GAP = 134; // düğümler arası dikey ritim
const PAD_TOP = 70; // üstte "buradasın" pill'ine yer
const PAD_BOTTOM = 60;
const COL_SOL = 0.3; // sola alternating düğüm merkez x oranı
const COL_SAG = 0.7; // sağa alternating düğüm merkez x oranı

function dugumMerkez(i: number, W: number): { x: number; y: number } {
  return { x: W * (i % 2 === 0 ? COL_SOL : COL_SAG), y: PAD_TOP + i * ROW_GAP + NODE / 2 };
}

/** İki düğüm merkezini birleştiren yumuşak (dikey S) bezier segmenti. */
function segmentYol(p0: { x: number; y: number }, p1: { x: number; y: number }): string {
  const ortaY = (p0.y + p1.y) / 2;
  return `M ${p0.x} ${p0.y} C ${p0.x} ${ortaY}, ${p1.x} ${ortaY}, ${p1.x} ${p1.y}`;
}

// --- Postal izi: yürünmüş segmenti çizgi yerine bot tabanı izleriyle döşeriz. ---
// Kontrol noktaları segmentYol ile AYNI: C1=(p0.x,ortaY) C2=(p1.x,ortaY).
type Pt = { x: number; y: number };

/** Kübik bezier üzerinde t∈[0,1] noktası. B(t)=(1-t)³P0+3(1-t)²t·C1+3(1-t)t²·C2+t³P3. */
function bezierNokta(p0: Pt, p1: Pt, t: number): Pt {
  const ortaY = (p0.y + p1.y) / 2;
  const c1x = p0.x;
  const c2x = p1.x;
  const u = 1 - t;
  const x = u * u * u * p0.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * p1.x;
  const y = u * u * u * p0.y + 3 * u * u * t * ortaY + 3 * u * t * t * ortaY + t * t * t * p1.y;
  return { x, y };
}

/** Teğet açısı (derece). RN dönüşü için +90 → iz şekli "ileri/yukarı" bakar. */
function bezierAci(p0: Pt, p1: Pt, t: number): number {
  const ortaY = (p0.y + p1.y) / 2;
  const c1x = p0.x;
  const c2x = p1.x;
  const u = 1 - t;
  // B'(t) = 3(1-t)²(C1-P0) + 6(1-t)t(C2-C1) + 3t²(P3-C2)
  const dx = 3 * u * u * (c1x - p0.x) + 6 * u * t * (c2x - c1x) + 3 * t * t * (p1.x - c2x);
  const dy = 3 * u * u * (ortaY - p0.y) + 6 * u * t * (ortaY - ortaY) + 3 * t * t * (p1.y - ortaY);
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

/** Tek postal izi: ileri bakan iki elips (ön taban + topuk), yerel uzayda "yukarı". */
function PostalIzi({ x, y, aci, renk }: { x: number; y: number; aci: number; renk: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${aci})`}>
      <Ellipse cx={0} cy={-2} rx={2.4} ry={3.4} fill={renk} />
      <Ellipse cx={0} cy={3.6} rx={1.6} ry={2} fill={renk} />
    </G>
  );
}

/**
 * Bir (yürünmüş) segmente postal izleri serper.
 *  - İz sayısı segment boyuna orantılı (clamp 2..5).
 *  - t kenarlardan içeri alınır (düğüme binmesin).
 *  - Ardışık izler yürüyüş yönüne dik ±2.5px alternatif kaydırılır.
 * Dik birim vektör = (cos(aci), sin(aci)); aci zaten teğet+90 → (-dy,dx)/|.| ile aynı.
 */
function segmentPostallari(p0: Pt, p1: Pt, renk: string, anahtar: string): ReactNode[] {
  const mesafe = Math.abs(p1.y - p0.y);
  const izSayisi = Math.max(2, Math.min(5, Math.round(mesafe / 34)));
  const izler: ReactNode[] = [];
  for (let k = 0; k < izSayisi; k++) {
    const t = (k + 1) / (izSayisi + 1);
    const n = bezierNokta(p0, p1, t);
    const aci = bezierAci(p0, p1, t);
    const r = (aci * Math.PI) / 180;
    const ofset = k % 2 === 0 ? 2.5 : -2.5;
    izler.push(
      <PostalIzi
        key={`${anahtar}-${k}`}
        x={n.x + Math.cos(r) * ofset}
        y={n.y + Math.sin(r) * ofset}
        aci={aci}
        renk={renk}
      />,
    );
  }
  return izler;
}

export default function PatikaScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { lawId } = useLocalSearchParams<{ lawId?: string }>();
  // null = yükleniyor; bolumsuz = kanunun bölümü yok (tek düğüm).
  const [dugumler, setDugumler] = useState<BolumDugum[] | null>(null);
  const [bolumsuz, setBolumsuz] = useState(false);
  const [hata, setHata] = useState(false);
  // Üst bar — yalnızca GERÇEK veri.
  const [kanunAd, setKanunAd] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);

  const yukle = useCallback(() => {
    setHata(false);
    if (lawId == null || lawId === '') {
      setHata(true);
      return;
    }
    const id = Number(lawId);
    void getBolumler(id)
      .then(async (bolumler) => {
        if (bolumler.length === 0) {
          setBolumsuz(true);
          setDugumler([]);
          return;
        }
        const dugum = await Promise.all(
          bolumler.map(async (b): Promise<BolumDugum> => {
            const kartlar = await getCardsByBolum(b.id);
            return { bolum: b, ...bolumIlerleme(kartlar) };
          }),
        );
        setBolumsuz(false);
        setDugumler(dugum);
      })
      .catch(() => setHata(true));

    // Üst bar verisi (degrade olur — patika ana veriyi etkilemez).
    if (brans) {
      void getLaws(brans)
        .then((laws) => setKanunAd(laws.find((l) => l.id === id)?.ad ?? null))
        .catch(() => setKanunAd(null));
    }
    void getStudyDays()
      .then((g) => setStreak(hesaplaStreak(g, bugunISO())))
      .catch(() => setStreak(null));
    void Promise.all([getStudyCards(), getCardCount()])
      .then(([s, t]) => setHazirlik(hesaplaIstatistik(s, t).hazirlikYuzde))
      .catch(() => setHazirlik(null));
  }, [lawId, brans]);

  useFocusEffect(yukle);

  // "aktif" (altın vurgu) = ilk çalışılabilir ama bitmemiş madde (kartı olan, tamamlanmamış).
  // Kartı olmayan madde düğümleri (kapsam iskeleti) aktif sayılmaz. [DEĞİŞMEDİ]
  const aktifIndex = dugumler
    ? dugumler.findIndex((d) => d.toplam > 0 && d.calisilan < d.toplam)
    : -1;

  // Bölüm şeridi sayacı: tamamlanan bölüm / toplam bölüm (mevcut veriden türetilir).
  // Şerit sayacı KART bazlı (bölüm değil): çalışınca anında hareket eder + kartsız
  // iskelet bölümler paydayı şişirmez. calisilan = kutu>=1 görülen kart (bolumIlerleme).
  const calisilanKart = dugumler?.reduce((a, d) => a + d.calisilan, 0) ?? 0;
  const toplamKart = dugumler?.reduce((a, d) => a + d.toplam, 0) ?? 0;

  return (
    <DarkScaffold title="Patika" onGeri={() => router.back()}>
      <StatusBar style="light" />

      {/* ÜST BAR — gerçek veri (uydurma can/elmas YOK) */}
      <View style={st.ustBar}>
        <View style={st.statChip}>
          <MaterialCommunityIcons name="fire" size={18} color={Palette.altin} />
          <AppText variant="kucuk" bold color="altinAcik">
            {streak === null ? '—' : streak}
          </AppText>
        </View>
        <View style={st.statChip}>
          <AppText variant="kucuk" bold color="metinAcik">
            {hazirlik === null ? '—' : `%${hazirlik}`}
          </AppText>
          <AppText variant="etiket" color="metinSolukAcik">
            Hazırlık
          </AppText>
        </View>
      </View>

      {/* Kanun şeridi — aktif kanun adı + gerçek kart ilerlemesi (kart bazlı) */}
      <View style={st.serit}>
        <MaterialCommunityIcons name="book-open-variant" size={18} color={Palette.metinSolukAcik} />
        <AppText variant="kucuk" bold color="metinAcik" numberOfLines={1} style={st.seritAd}>
          {kanunAd ?? 'Mevzuat'}
        </AppText>
        {!bolumsuz && dugumler !== null ? (
          <AppText variant="kucuk" bold color="altinAcik">
            {toplamKart === 0 ? '0 kart' : `${calisilanKart}/${toplamKart} kart`}
          </AppText>
        ) : null}
      </View>

      {hata ? (
        <DurumKutu
          ikon="alert-circle-outline"
          baslik="Yüklenemedi"
          aciklama="Patika yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : dugumler === null ? (
        <View style={st.merkezKutu}>
          <ActivityIndicator color={Palette.altin} />
          <AppText variant="kucuk" color="metinSolukAcik">
            Yükleniyor…
          </AppText>
        </View>
      ) : bolumsuz ? (
        // Bölümü olmayan kanun (TCK gibi) → tek varsayılan düğüm.
        <TekDugum
          onPress={() => router.push({ pathname: '/akis', params: { lawId: String(lawId) } })}
        />
      ) : (
        <Harita dugumler={dugumler} aktifIndex={aktifIndex} router={router} />
      )}
    </DarkScaffold>
  );
}

/** Koyu zeminli, kendi başlık şeritli ekran sarmalayıcı (dark-first, patika'ya özel). */
function DarkScaffold({
  title,
  onGeri,
  children,
}: {
  title: string;
  onGeri: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={st.safe} edges={['top', 'left', 'right']}>
      <View style={st.header}>
        <Pressable onPress={onGeri} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
          <MaterialCommunityIcons name="arrow-left" size={26} color={Palette.metinAcik} />
        </Pressable>
        <AppText variant="baslik" color="metinAcik" bold>
          {title}
        </AppText>
      </View>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
        <View style={st.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Kıvrımlı yol + alternating düğümler. Genişlik onLayout ile ölçülür (path = düğüm koordinatları). */
function Harita({
  dugumler,
  aktifIndex,
  router,
}: {
  dugumler: BolumDugum[];
  aktifIndex: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [W, setW] = useState(0);
  const olc = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== W) setW(w);
  };

  const n = dugumler.length;
  const haritaY = PAD_TOP + (n - 1) * ROW_GAP + NODE + PAD_BOTTOM;

  return (
    <View style={[st.harita, { height: haritaY }]} onLayout={olc}>
      {W > 0 ? (
        <>
          {/* Yürünmüş segment → postal izi (çizgi yok); yürünmemiş → kesikli soluk konnektör */}
          <Svg width={W} height={haritaY} style={StyleSheet.absoluteFill} pointerEvents="none">
            {(() => {
              const konnektorler: ReactNode[] = [];
              const postallar: ReactNode[] = [];
              dugumler.slice(0, -1).forEach((_, i) => {
                const p0 = dugumMerkez(i, W);
                const p1 = dugumMerkez(i + 1, W);
                const gecildi = aktifIndex === -1 || i + 1 <= aktifIndex;
                const anahtar = String(dugumler[i].bolum.id);
                if (!gecildi) {
                  // Yürünmemiş ara: mevcut kesikli/soluk konnektör (postal YOK, önü temiz).
                  konnektorler.push(
                    <Path
                      key={anahtar}
                      d={segmentYol(p0, p1)}
                      fill="none"
                      stroke={Palette.metinSolukAcik}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray="2 12"
                      opacity={0.6}
                    />,
                  );
                } else {
                  // Yürünmüş ara: konnektör çizgisi yerine postal izleri serpiştir.
                  postallar.push(...segmentPostallari(p0, p1, Palette.altin, anahtar));
                }
              });
              // Önce konnektörler, sonra postallar (üstte kalsın).
              return [...konnektorler, ...postallar];
            })()}
          </Svg>

          {dugumler.map((d, i) => (
            <Dugum
              key={d.bolum.id}
              dugum={d}
              index={i}
              durum={durumCoz(d, i === aktifIndex)}
              merkez={dugumMerkez(i, W)}
              onPress={() =>
                router.push({ pathname: '/akis', params: { bolumId: String(d.bolum.id) } })
              }
            />
          ))}
        </>
      ) : null}
    </View>
  );
}

/** MEVCUT veri → görsel durum. Aktif (i===aktifIndex) zaten tamamlanmamış kart-düğüm. */
function durumCoz(d: BolumDugum, aktif: boolean): Durum {
  const kartVar = d.toplam > 0;
  const tamam = kartVar && d.calisilan === d.toplam;
  if (aktif) return 'aktif';
  if (tamam) return 'tamam';
  if (kartVar && d.calisilan > 0) return 'baslanmis';
  return 'baslanmadi';
}

function Dugum({
  dugum,
  index,
  durum,
  merkez,
  onPress,
}: {
  dugum: BolumDugum;
  index: number;
  durum: Durum;
  merkez: { x: number; y: number };
  onPress: () => void;
}) {
  const aktif = durum === 'aktif';
  const cap = aktif ? HERO : NODE;
  const yuzde = dugum.toplam > 0 ? Math.round((dugum.calisilan / dugum.toplam) * 100) : 0;

  // Giriş (fade + scale, sıralı) + aktifte yumuşak pulse.
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 300,
      delay: Math.min(index, 12) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE,
    }).start();
    if (aktif) {
      const dongu = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE,
          }),
        ]),
      );
      dongu.start();
      return () => dongu.stop();
    }
  }, [aktif, index, enter, pulse]);

  const girisScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  // Konteyner merkezi = düğüm merkezi; pill üstte, ad altta (akış dışı, absolute).
  const BOX = 150;
  return (
    <Animated.View
      style={[
        st.dugumKutu,
        {
          left: merkez.x - BOX / 2,
          top: merkez.y - cap / 2,
          width: BOX,
          height: cap,
          opacity: enter,
          transform: [{ scale: girisScale }],
        },
      ]}>
      {aktif ? (
        <View style={st.buradasinPill}>
          <AppText variant="etiket" bold color="zeminKoyu">
            buradasın
          </AppText>
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={dugum.bolum.ad}
          style={({ pressed }) => [
            st.daire,
            { width: cap, height: cap, borderRadius: cap / 2 },
            durum === 'aktif' && st.daireAktif,
            durum === 'tamam' && st.daireTamam,
            durum === 'baslanmis' && st.daireBaslanmis,
            durum === 'baslanmadi' && st.daireBaslanmadi,
            pressed && st.pressed,
          ]}>
          {durum === 'aktif' ? (
            <MaterialCommunityIcons name="play" size={36} color={Palette.zeminKoyu} />
          ) : durum === 'tamam' ? (
            <MaterialCommunityIcons name="check-bold" size={32} color={Palette.yesilAcik} />
          ) : durum === 'baslanmis' ? (
            <AppText variant="kucuk" bold color="metinAcik">
              %{yuzde}
            </AppText>
          ) : (
            <View style={st.nokta} />
          )}
        </Pressable>
      </Animated.View>

      <View style={[st.adKutu, { top: cap + 6 }]}>
        <AppText
          variant="etiket"
          bold
          color={durum === 'baslanmadi' ? 'metinSolukAcik' : 'metinAcik'}
          numberOfLines={1}
          style={st.adMetin}>
          {dugum.bolum.ad}
        </AppText>
      </View>
    </Animated.View>
  );
}

/** Bölümsüz kanun → tek hero düğüm ("Tüm Kartlar"). */
function TekDugum({ onPress }: { onPress: () => void }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE,
    }).start();
  }, [enter]);
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View style={[st.tekSatir, { opacity: enter, transform: [{ scale }] }]}>
      <View style={st.buradasinPill}>
        <AppText variant="etiket" bold color="zeminKoyu">
          buradasın
        </AppText>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Tüm Kartlar"
        style={({ pressed }) => [
          st.daire,
          { width: HERO, height: HERO, borderRadius: HERO / 2 },
          st.daireAktif,
          pressed && st.pressed,
        ]}>
        <MaterialCommunityIcons name="play" size={36} color={Palette.zeminKoyu} />
      </Pressable>
      <AppText variant="kucuk" bold color="metinAcik" style={st.adMetin}>
        Tüm Kartlar
      </AppText>
      <AppText variant="etiket" color="metinSolukAcik">
        Bu kanunu çalış
      </AppText>
    </Animated.View>
  );
}

/** Koyu zeminli hata/durum kutusu. */
function DurumKutu({
  ikon,
  baslik,
  aciklama,
  buton,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  aciklama: string;
  buton: { etiket: string; onPress: () => void };
}) {
  return (
    <View style={st.merkezKutu}>
      <MaterialCommunityIcons name={ikon} size={44} color={Palette.kirmizi} />
      <AppText variant="altBaslik" bold color="metinAcik">
        {baslik}
      </AppText>
      <AppText variant="kucuk" color="metinSolukAcik">
        {aciklama}
      </AppText>
      <Pressable
        onPress={buton.onPress}
        style={({ pressed }) => [st.retryBtn, pressed && st.pressed]}>
        <AppText variant="kucuk" bold color="zeminKoyu">
          {buton.etiket}
        </AppText>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.zeminKoyu,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.yuzeyKoyu,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  scroll: {
    flex: 1,
    backgroundColor: Palette.zeminKoyu,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  body: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },

  // Üst bar
  ustBar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.yuzeyKoyu,
    borderColor: Palette.kenarlikKoyu,
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  serit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.yuzeyKoyu,
    borderColor: Palette.kenarlikKoyu,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  seritAd: {
    flex: 1,
  },

  // Harita
  harita: {
    position: 'relative',
    width: '100%',
  },
  dugumKutu: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daire: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  daireAktif: {
    backgroundColor: Palette.altin,
    borderColor: Palette.altinAcik,
    borderWidth: 2,
  },
  daireTamam: {
    backgroundColor: Palette.yuzeyKoyu,
    borderColor: Palette.yesil,
  },
  daireBaslanmis: {
    backgroundColor: Palette.yuzeyKoyu,
    borderColor: Palette.altin,
  },
  daireBaslanmadi: {
    backgroundColor: Palette.yuzeyKoyuSoluk,
    borderColor: Palette.kenarlikKoyu,
  },
  nokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.metinSolukAcik,
  },
  buradasinPill: {
    position: 'absolute',
    top: -28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  adKutu: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  adMetin: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },

  // Tek düğüm / durum kutuları
  tekSatir: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  merkezKutu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  retryBtn: {
    marginTop: Spacing.two,
    backgroundColor: Palette.altin,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
