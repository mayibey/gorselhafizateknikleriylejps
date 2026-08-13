import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/ui/app-text';
import { KilitKarti } from '@/components/premium/kilit-karti';
import { Yolculuk } from '@/components/patika/yolculuk';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { LAW_KLASOR } from '@/db/seed';
import { useKisiselOzellik } from '@/lib/ozellik';
import { gorselOnCoz } from '@/lib/gorsel-coz';
import { indirilmisGorsel } from '@/lib/gorsel-kaynak';
import { ICERIK_TABANI } from '@/constants/config';
import {
  indirmeDestekli,
  indirmeDinle,
  indirmeDurumuAl,
  kanunIndirBaslat,
  kanunIndirilmisMi,
} from '@/lib/indirme';
import { useUyelik } from '@/lib/uyelik-context';
import { tckGirildiIsaretle } from '@/lib/indirim-hatirlatma';
import {
  getBolumler,
  getCardsByBolum,
  getCardsByLaw,
  getLaws,
  getStudyDays,
} from '@/db/database';
import type { Bolum } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { bolumIlerleme } from '@/lib/patika';
import { bugunISO } from '@/lib/srs';
import { hesaplaStreak } from '@/lib/stats';

// Patika manzara arka planı (dağ/orman/pusula — krem topografik). Görsel patika
// alanını kaplar; düğüm/bot izi/etiketler bunun ÜSTÜnde render edilir.
const ARKA_PLAN = require('../../assets/images/patika-arkaplan.png');
// Görselin doğal en-boy oranı (1844/853 = yükseklik/genişlik). Dikey TILE'da
// her dilim W * ORAN yüksekliğinde → germe/esneme YOK, doğal oran korunur.
const ARKA_PLAN_ORAN = 1844 / 853;

// ── SİNEMATİK PATİKA (bayraklı) — dağ yolu manzarası + yol eğrisine dizili bölümler + araç.
const PATIKA_ARAC = require('../../assets/images/patika-arac.webp');
// Tek parça UZUN yol görseli (900×1800, oran 2:1). Ek yeri yok; kaydırılır.
const YOL_UZUN = require('../../assets/images/patika-yol-uzun.webp');
const YOL_UZUN_ORAN = 1800 / 900; // yükseklik / genişlik
// expo-image'i Animated'e sar — araç konumu/titreşimi animasyonlanabilsin.
const AnimatedImage = Animated.createAnimatedComponent(Image);
// Görseldeki gerçek asfalt yolun eğrisi — normalize (x soldan, y üstten), alt=başlangıç →
// üst=ufuk/hedef. Duraklar ve araç bu eğriye oturur (görsel tam boyda, kırpma yok).
const YOL_EGRI = [
  { x: 0.48, y: 0.98 },
  { x: 0.43, y: 0.91 },
  { x: 0.53, y: 0.84 },
  { x: 0.57, y: 0.79 },
  { x: 0.47, y: 0.71 },
  { x: 0.44, y: 0.65 },
  { x: 0.53, y: 0.59 },
  { x: 0.55, y: 0.54 },
  { x: 0.5, y: 0.49 },
  { x: 0.52, y: 0.44 },
  { x: 0.52, y: 0.39 },
  { x: 0.53, y: 0.35 },
];
function yolNokta(t: number): { x: number; y: number } {
  const s = Math.max(0, Math.min(1, t)) * (YOL_EGRI.length - 1);
  const i = Math.min(YOL_EGRI.length - 2, Math.floor(s));
  const f = s - i;
  return {
    x: YOL_EGRI[i].x + (YOL_EGRI[i + 1].x - YOL_EGRI[i].x) * f,
    y: YOL_EGRI[i].y + (YOL_EGRI[i + 1].y - YOL_EGRI[i].y) * f,
  };
}

// Çift bot izi sprite'ı (1254×1254, şeffaf): SOL yarı=sol ayak, SAĞ yarı=sağ ayak.
// Tek <Image>'ı 2×genişlikte verip yatay kaydır + overflow:hidden → tek ayak gösterilir.
const CIFT_AYAK = require('../../assets/images/ciftayak.png');
const AYAK_W = 14; // tek ayak görünür genişliği
const AYAK_H = 28; // tek ayak yüksekliği (sprite kare → kap 2*AYAK_W × AYAK_H = kare, germe yok)
const AYAK_OFSET = 5; // yol merkez çizgisinden sol/sağ kayma

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

/**
 * Tek ayak izi (PNG sprite'ın yarısı). Kap AYAK_W×AYAK_H, içindeki Image 2× genişlikte;
 * sol ayak → left:0 (sol yarı), sağ ayak → left:-AYAK_W (sağ yarı), overflow:hidden ile
 * sadece o yarı görünür. Kap (x,y) merkezli + teğet açısına döner (yola paralel).
 */
function AyakIzi({ x, y, aci, sol }: { x: number; y: number; aci: number; sol: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - AYAK_W / 2,
        top: y - AYAK_H / 2,
        width: AYAK_W,
        height: AYAK_H,
        overflow: 'hidden',
        transform: [{ rotate: `${aci}deg` }],
      }}>
      <Image
        source={CIFT_AYAK}
        style={{ position: 'absolute', top: 0, left: sol ? 0 : -AYAK_W, width: AYAK_W * 2, height: AYAK_H }}
        contentFit="cover"
        pointerEvents="none"
      />
    </View>
  );
}

/** Bezier yaklaşık yay uzunluğu (12 örnekle). Eşit aralıklı iz dağıtımı için. */
function bezierUzunluk(p0: Pt, p1: Pt): number {
  let len = 0;
  let onceki = bezierNokta(p0, p1, 0);
  for (let s = 1; s <= 12; s++) {
    const simdi = bezierNokta(p0, p1, s / 12);
    len += Math.hypot(simdi.x - onceki.x, simdi.y - onceki.y);
    onceki = simdi;
  }
  return len;
}

/**
 * Bir (yürünmüş) segmente PNG ayak izleri serper — YOLA PARALEL + DÜZENLİ.
 *  - İz sayısı YAY UZUNLUĞUNA orantılı (eşit aralık, dağınık değil).
 *  - Her ayak o noktadaki teğet açısına döner (yürüyüş yönüne bakar).
 *  - Sol-sağ ALTERNATİF: çift k → sol ayak (+ofset), tek k → sağ ayak (−ofset) →
 *    gerçekçi yürüyüş (sol, sağ, sol…). Dik birim vektör = (cos(aci), sin(aci)).
 */
function segmentPostallari(p0: Pt, p1: Pt, anahtar: string): ReactNode[] {
  const uzunluk = bezierUzunluk(p0, p1);
  // ~32px'de bir adım (PNG ayak büyük → biraz seyrek; perf için makul).
  const izSayisi = Math.max(2, Math.min(6, Math.round(uzunluk / 32)));
  const izler: ReactNode[] = [];
  for (let k = 0; k < izSayisi; k++) {
    const t = (k + 1) / (izSayisi + 1);
    const n = bezierNokta(p0, p1, t);
    const aci = bezierAci(p0, p1, t);
    const r = (aci * Math.PI) / 180;
    const sol = k % 2 === 0;
    const ofset = sol ? AYAK_OFSET : -AYAK_OFSET;
    izler.push(
      <AyakIzi
        key={`${anahtar}-${k}`}
        x={n.x + Math.cos(r) * ofset}
        y={n.y + Math.sin(r) * ofset}
        aci={aci}
        sol={sol}
      />,
    );
  }
  return izler;
}

/**
 * Düğüm etiketi: madde_no zaten kanun etiketini taşır ("TCK m.38", "4733 m.8") →
 * başına bir de "Madde" eklenince "Madde TCK m.38" gibi ÇİFT yazı çıkıyordu.
 * Buradan kısa ve tek biçim döner: "Madde 38" · "Madde Ek 1" · "Özet".
 */
function kisaMaddeEtiket(maddeNo: string): string {
  const m = maddeNo.match(/m\.\s*((?:Ek|Geçici)\s+)?(\d+(?:\/[A-Za-zÇĞİÖŞÜçğıöşü])?)/i);
  if (m) return `Madde ${(m[1] ?? '').trim()} ${m[2]}`.replace(/\s+/g, ' ').trim();
  // Madde numarası olmayanlar ("TCK özet") — kanun etiketini at, kalanı büyük harfle başlat.
  const kalan = maddeNo.split(' ').slice(1).join(' ').trim();
  if (!kalan) return maddeNo;
  return kalan.charAt(0).toLocaleUpperCase('tr') + kalan.slice(1);
}

/** Düğümün İÇİNDE yazacak kısa numara ("38", "Ek 1"); numarasızda null (ikon çizilir). */
function dugumNumara(etiket: string): string | null {
  const m = etiket.match(/^Madde\s+(.+)$/);
  return m ? m[1] : null;
}

export default function PatikaScreen() {
  const router = useRouter();
  // GECE KARARI M5 (bayraklı): düğüm kapsam seçimi yalnız başkan+Ahmet'te.
  const kapsamSecimi = useKisiselOzellik('talim-mevzuata');
  const { brans } = useBrans();
  const { kanunErisilebilir } = useUyelik();
  const { lawId } = useLocalSearchParams<{ lawId?: string }>();
  // Çalışmaya (TCK/patika) girildi → indirim hatırlatma tetiğini aç (Karargah'a dönünce modal çıkar).
  useEffect(() => {
    void tckGirildiIsaretle();
  }, []);
  // Kanunun bloğu (müşterek/branş) — kilit kontrolü için. null = henüz bilinmiyor.
  const [lawBlok, setLawBlok] = useState<string | null>(null);
  // null = yükleniyor; bolumsuz = kanunun bölümü yok (tek düğüm).
  const [dugumler, setDugumler] = useState<BolumDugum[] | null>(null);
  const [bolumsuz, setBolumsuz] = useState(false);
  // Durak kimliği → madde başlığı ("Kast", "Zimmet"…). Numaranın yanında gösterilir;
  // yalnız sayı görünce kullanıcı "sayılar rastgele" sanıyordu (başkan, 13 Ağu).
  const [maddeBasliklari, setMaddeBasliklari] = useState<Record<number, string>>({});
  const [hata, setHata] = useState(false);
  // Üst bar — yalnızca GERÇEK veri.
  const [kanunAd, setKanunAd] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  // İNDİRME KAPISI (boş kart tedbiri): içeriği inmemiş kanunun kartına GİDİLMEZ; önce indirilir.
  // Kart akışının TEK önü patika olduğu için (Mevzuat, Ara→sık açılan, Ara→sonuç hepsi buraya /
  // buradan geçer) kapıyı burada tutmak tüm yolları kapatır → hiçbir yerden boş beyaz kart çıkmaz.
  const [indirModal, setIndirModal] = useState<Record<string, string> | null>(null);
  const [indirYuzde, setIndirYuzde] = useState(0);
  const [indirDurum, setIndirDurum] = useState<'iniyor' | 'hata'>('iniyor');
  const bekleyenRef = useRef<Record<string, string> | null>(null);

  const yukle = useCallback(() => {
    setHata(false);
    if (lawId == null || lawId === '') {
      setHata(true);
      return;
    }
    const id = Number(lawId);
    if (kapsamSecimi) {
      // DUOLINGO (bayraklı): HER MADDE bir level. Kanunun tüm kartları → düğümler (kutu=durum).
      // AYNI MADDENİN BİRDEN ÇOK KARTI TEK DÜĞÜMDE: m.35'in normal kartı ile m.35–36
      // ayırt/özet kartı ayrı düğüm olunca "m.35" listede İKİ KEZ çıkıyor ve sıra da bozuk
      // görünüyordu (ayırt kartı en büyük üye+0.5 ile sıralanır → 35, 36, 35 …). madde_no'ya
      // göre gruplayınca hem tekrar biter hem sıra artan kalır (grup sırası ilk görülme).
      void getCardsByLaw(id)
        .then((kartlar) => {
          const sira: string[] = [];
          const grup = new Map<string, typeof kartlar>();
          kartlar.forEach((k) => {
            const mevcut = grup.get(k.madde_no);
            if (mevcut) {
              mevcut.push(k);
            } else {
              grup.set(k.madde_no, [k]);
              sira.push(k.madde_no);
            }
          });
          const madde = sira.map((anahtar): BolumDugum => {
            const grubu = grup.get(anahtar) ?? [];
            const calisilan = grubu.filter((k) => k.kutu >= 1).length;
            const toplam = grubu.length;
            return {
              bolum: { id: grubu[0]?.id ?? 0, law_id: id, ad: kisaMaddeEtiket(anahtar), sira: 0 } as Bolum,
              calisilan,
              toplam,
              oran: toplam > 0 ? calisilan / toplam : 0,
            };
          });
          const basliklar: Record<number, string> = {};
          sira.forEach((anahtar) => {
            const g = grup.get(anahtar);
            const bas = g?.[0]?.baslik?.trim();
            if (g?.[0] && bas) basliklar[g[0].id] = bas;
          });
          setMaddeBasliklari(basliklar);
          setBolumsuz(false);
          setDugumler(madde);
          // ÖNDEN ÇÖZME (13 Ağu): indirilen görseller cihazda şifreli durduğu için karta
          // basınca yarım-bir saniye "hazırlanıyor" bekleniyordu. Patika açılırken SIRADAKİ
          // maddenin görseli arkada (etkileşim bitince, tek tane) çözülür → bekleme kalmaz.
          // Dar tutuldu: tek kart. Fazlası boşuna pil/hafıza harcar.
          const siradaki = madde.findIndex((d) => d.toplam > 0 && d.calisilan < d.toplam);
          const hedefKart = siradaki >= 0 ? grup.get(sira[siradaki])?.[0] : undefined;
          if (hedefKart) gorselOnCoz([indirilmisGorsel(hedefKart.gorsel_yolu)]);
          // Hazırlık KART bazlı (düğüm değil): madde başına birden çok kart olabiliyor.
          const calisilan = madde.reduce((a, d) => a + d.calisilan, 0);
          const toplam = madde.reduce((a, d) => a + d.toplam, 0);
          setHazirlik(toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0);
        })
        .catch(() => {
          setHata(true);
          setHazirlik(null);
        });
    } else {
      void getBolumler(id)
        .then(async (bolumler) => {
          if (bolumler.length === 0) {
            setBolumsuz(true);
            setDugumler([]);
            const kartlar = await getCardsByLaw(id);
            const calisilan = kartlar.filter((c) => c.kutu >= 1).length;
            setHazirlik(kartlar.length > 0 ? Math.round((calisilan / kartlar.length) * 100) : 0);
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
          const calisilan = dugum.reduce((a, d) => a + d.calisilan, 0);
          const toplam = dugum.reduce((a, d) => a + d.toplam, 0);
          setHazirlik(toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0);
        })
        .catch(() => {
          setHata(true);
          setHazirlik(null);
        });
    }

    // Üst bar verisi (degrade olur — patika ana veriyi etkilemez).
    if (brans) {
      void getLaws(brans)
        .then((laws) => {
          const law = laws.find((l) => l.id === id);
          setKanunAd(law?.ad ?? null);
          setLawBlok(law?.blok ?? null);
        })
        .catch(() => {
          setKanunAd(null);
          setLawBlok(null);
        });
    }
    void getStudyDays()
      .then((g) => setStreak(hesaplaStreak(g, bugunISO())))
      .catch(() => setStreak(null));
  }, [lawId, brans, kapsamSecimi]);

  useFocusEffect(yukle);

  // Kanun klasörü (indirme + kilit için). null = klasörü olmayan/bilinmeyen kanun.
  const klasor = lawId != null ? LAW_KLASOR[Number(lawId)] : undefined;
  // İçerik inmemiş mi? (indirme destekli + sunucu ayarlı + bu kanun henüz inmemiş). Gömülü
  // içerikli build'de (ICERIK_TABANI boş) veya web'de indirGerek hep false → kapı devre dışı.
  const indirGerek = !!klasor && indirmeDestekli && !!ICERIK_TABANI && !kanunIndirilmisMi(klasor);

  // İndirme modalı açıkken yüzdeyi durum yöneticisinden dinle (arka planda ilerledikçe güncellensin).
  useEffect(() => {
    if (!indirModal || !klasor) return;
    const guncelle = () => setIndirYuzde(indirmeDurumuAl(klasor)?.yuzde ?? 0);
    guncelle();
    return indirmeDinle(klasor, guncelle);
  }, [indirModal, klasor]);

  // Karta git — ama içerik inmemişse ÖNCE indir (yüzdeli modal), biter bitmez aç. Hangi
  // düğümden gelinirse gelinsin (tek düğüm / bölüm düğümü) boş beyaz kart çıkmaz.
  function akisAc(params: Record<string, string>) {
    if (indirGerek && klasor) {
      setIndirModal(params);
      setIndirDurum('iniyor');
      setIndirYuzde(indirmeDurumuAl(klasor)?.yuzde ?? 0);
      bekleyenRef.current = params;
      kanunIndirBaslat(klasor).then(
        () => {
          // "Arka planda indir" denmediyse (niyet hâlâ bu düğüm) → karta git.
          if (bekleyenRef.current === params) {
            bekleyenRef.current = null;
            setIndirModal(null);
            router.push({ pathname: '/akis', params });
          }
        },
        () => {
          if (bekleyenRef.current === params) setIndirDurum('hata');
        },
      );
      return;
    }
    router.push({ pathname: '/akis', params });
  }

  // Modalı kapat (otomatik-açmayı iptal et; indirme arka planda sürebilir).
  function indirModalKapat() {
    bekleyenRef.current = null;
    setIndirModal(null);
  }

  // "aktif" (altın vurgu) = ilk çalışılabilir ama bitmemiş madde (kartı olan, tamamlanmamış).
  // Kartı olmayan madde düğümleri (kapsam iskeleti) aktif sayılmaz. [DEĞİŞMEDİ]
  const aktifIndex = dugumler
    ? dugumler.findIndex((d) => d.toplam > 0 && d.calisilan < d.toplam)
    : -1;

  // Şerit sayacı KART bazlı (bölüm değil): çalışınca anında hareket eder + kartsız
  // iskelet bölümler paydayı şişirmez. calisilan = kutu>=1 görülen kart (bolumIlerleme).
  const calisilanKart = dugumler?.reduce((a, d) => a + d.calisilan, 0) ?? 0;
  const toplamKart = dugumler?.reduce((a, d) => a + d.toplam, 0) ?? 0;

  // Kilit: klasör'den (lawId) ANINDA hesaplanır — lawBlok yüklenmesini BEKLEMEZ (eski `lawBlok != null`
  // fail-open'ıydı: yükleme/catch penceresinde premium bölüm düğümleri tıklanabiliyordu). kanunErisilebilir
  // zaten _blok param'ını kullanmaz. Şalter kapalıysa hep true → kilitli asla true olmaz.
  const kilitli = !kanunErisilebilir(klasor);

  return (
    <Screen
      title="Patika"
      onGeri={() => router.back()}
      // Yolculuk modunda sayfa KAYDIRILMAZ: harita kalan alanı tam doldurur, altta beyaz kalmaz.
      scroll={!kapsamSecimi}
      headerAltinCizgi
      headerSag={<MaterialCommunityIcons name="scale-balance" size={24} color={Palette.altinAcik2} />}>
      {/* ÜST BAR — gerçek veri (uydurma can/elmas YOK). Sinematik modda gizli (temiz sahne). */}
      {kapsamSecimi ? null : (
      <>
      <View style={st.ustBar}>
        <View style={st.statChip}>
          <MaterialCommunityIcons name="fire" size={18} color={Palette.altinKoyu} />
          <AppText variant="kucuk" bold color="altinMetin">
            {streak === null ? '—' : streak}
          </AppText>
        </View>
        <View style={st.statChip}>
          <AppText variant="kucuk" bold color="lacivert">
            {hazirlik === null ? '—' : `%${hazirlik}`}
          </AppText>
          <AppText variant="etiket" color="solukMetin">
            Çalışıldı
          </AppText>
        </View>
      </View>

      {/* Kanun özet kartı — kitap + ad + gerçek kart ilerlemesi (kart bazlı) */}
      <View style={st.kanunKart}>
        <MaterialCommunityIcons name="book-open-variant" size={22} color={Palette.altin} />
        <AppText variant="govde" color="anaMetin" numberOfLines={2} style={st.seritAd}>
          {kanunAd ?? 'Mevzuat'}
        </AppText>
        {!bolumsuz && dugumler !== null ? (
          <AppText variant="kucuk" bold color="altinMetin">
            {toplamKart === 0 ? '0 kart' : `${calisilanKart}/${toplamKart} kart`}
          </AppText>
        ) : null}
      </View>
      </>
      )}

      {kilitli ? (
        <KilitKarti kanunAd={kanunAd} />
      ) : hata ? (
        <DurumKutu
          ikon="alert-circle-outline"
          baslik="Yüklenemedi"
          aciklama="Patika yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : dugumler === null ? (
        <View style={st.merkezKutu}>
          <ActivityIndicator color={Palette.lacivert} />
          <AppText variant="kucuk" color="solukMetin">
            Yükleniyor…
          </AppText>
        </View>
      ) : bolumsuz ? (
        // Bölümü olmayan kanun (TCK gibi) → tek varsayılan düğüm.
        <TekDugum onPress={() => akisAc({ lawId: String(lawId) })} />
      ) : kapsamSecimi ? (
        // SONSUZ YOLCULUK (bayraklı, 12 Ağu): tarayıcı taslağında onaylanan tasarım —
        // dikişsiz sahne katları + görselden ölçülmüş gerçek yol izi + kuşbakışı araç.
        // Eski Duolingo haritası (SinematikHarita) geri dönüş için kodda duruyor.
        <Yolculuk
          dugumler={dugumler}
          aktifIndex={aktifIndex}
          kanunAd={kanunAd}
          calisilanKart={calisilanKart}
          toplamKart={toplamKart}
          basliklar={maddeBasliklari}
          klasor={klasor ?? null}
          // Dokunulan durak = O MADDENİN kartı (akış 'kart' ile o karttan başlar).
          // 13 Ağu: her durak aynı kartı açıyordu — madde bilgisi akışa geçmiyordu.
          onDugumBas={(kartId) => akisAc({ lawId: String(lawId), kart: String(kartId) })}
          onDevam={() => akisAc({ lawId: String(lawId) })}
        />
      ) : (
        <Harita
          dugumler={dugumler}
          aktifIndex={aktifIndex}
          onDugumBas={(id) => {
            akisAc({ bolumId: String(id) });
          }}
        />
      )}

      {/* İçerik indir + aç modalı — inmemiş kanunun düğümüne basınca; biter bitmez kart açılır. */}
      <Modal
        visible={indirModal !== null}
        transparent
        animationType="fade"
        onRequestClose={indirModalKapat}>
        <View style={st.modalKatman}>
          <View style={st.modalKart}>
            {indirDurum === 'hata' ? (
              <>
                <MaterialCommunityIcons name="wifi-off" size={40} color={Palette.kirmizi} />
                <AppText variant="govde" bold color="lacivert" style={st.modalOrtali}>
                  İndirilemedi
                </AppText>
                <AppText variant="kucuk" color="solukMetin" style={st.modalOrtali}>
                  Bağlantını kontrol et, tekrar dene.
                </AppText>
                <View style={st.modalBtnlar}>
                  <Pressable
                    style={({ pressed }) => [st.modalBtnIkincil, pressed && st.pressed]}
                    onPress={indirModalKapat}>
                    <AppText variant="kucuk" bold color="lacivert">
                      Kapat
                    </AppText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [st.modalBtn, pressed && st.pressed]}
                    onPress={() => indirModal && akisAc(indirModal)}>
                    <AppText variant="kucuk" bold color="beyaz">
                      Tekrar dene
                    </AppText>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={Palette.lacivert} />
                <AppText variant="govde" bold color="lacivert" style={st.modalOrtali}>
                  İndiriliyor… %{indirYuzde}
                </AppText>
                <AppText variant="kucuk" color="solukMetin" style={st.modalOrtali}>
                  Kanun içeriği indiriliyor. Bitince kart otomatik açılacak.
                </AppText>
                <View style={st.modalBar}>
                  <View style={[st.modalBarDolu, { width: `${indirYuzde}%` }]} />
                </View>
                <Pressable
                  style={({ pressed }) => [st.modalBtnIkincil, pressed && st.pressed]}
                  onPress={indirModalKapat}>
                  <AppText variant="kucuk" bold color="lacivert">
                    Arka planda indir
                  </AppText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/** Kıvrımlı yol + alternating düğümler. Genişlik onLayout ile ölçülür (path = düğüm koordinatları). */
/** SİNEMATİK HARİTA (bayraklı) — dağ yolu manzarası; bölümler yol eğrisine dizili,
 *  aktif bölümde Jandarma aracı, altta "DEVAM ET" paneli. Tek ekran (kaydırma yok). */
function SinematikHarita({
  dugumler,
  aktifIndex,
  lawAnahtar,
  onDugumBas,
  onDevam,
  kanunAd,
  calisilanKart,
  toplamKart,
}: {
  dugumler: BolumDugum[];
  aktifIndex: number;
  lawAnahtar: string;
  onDugumBas: (bolumId: number) => void;
  onDevam: () => void;
  kanunAd: string | null;
  calisilanKart: number;
  toplamKart: number;
}) {
  const { width: WW, height: WH } = useWindowDimensions();
  const W = Math.min(WW - Spacing.four * 2, 460);
  const gorunurH = Math.round(Math.min(WH * 0.72, 700));
  const n = dugumler.length;
  const aktif = aktifIndex >= 0 ? dugumler[aktifIndex] : dugumler[dugumler.length - 1];
  // Alt bant KANUNUN ilerlemesini gösterir (eskiden aktif düğümün kendi 1 kartını
  // gösterip "0/1 madde · %0" diyordu — kanunun 17/54'ü bitmişken yanıltıcıydı).
  const kanunOran = toplamKart > 0 ? Math.round((calisilanKart / toplamKart) * 100) : 0;

  // DUOLINGO tarzı level haritası: dikey zigzag düğümler, aralıklı (üst üste YOK), yukarı ilerleme.
  const ROW = 120;
  const PAD_T = 90;
  const PAD_B = 110;
  const NODE = 62;
  const HERO = 78;
  const contentH = Math.max(gorunurH, PAD_T + PAD_B + Math.max(0, n - 1) * ROW);
  const nodeY = (i: number) => contentH - PAD_B - i * ROW; // i=0 altta (başlangıç), yukarı ilerler
  const nodeX = (i: number) => W * (i % 2 === 0 ? 0.33 : 0.67); // zigzag
  const aktifI = Math.max(0, aktifIndex);
  const scrollRef = useRef<ScrollView>(null);

  /* ARACIN YOLCULUGU (baskan istegi, 12 Agu): eskiden arac isinlaniyordu - bir karede
     eski durakta, digerinde yenisinde. Artik son birakildigi durak cihazda (kanun bazinda)
     hatirlanir; donuste arac eski duraktan yenisine SURER, arkasinda altin iz yanar.
     Konum tek Animated.Value'nun parca-parca interpolasyonuyla cozulur (native driver). */
  const [gorselIndex, setGorselIndex] = useState(aktifI);
  const [animBas, setAnimBas] = useState<number | null>(null);
  const surucu = useRef(new Animated.Value(aktifI)).current;

  // Yol uzerindeki ornek noktalar: kesirli durak indeksi -> ekran koordinati.
  const ornek = useMemo(() => {
    const idx: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    const ADIM = 8;
    for (let i = 0; i < Math.max(0, n - 1); i++) {
      const p0 = { x: nodeX(i), y: nodeY(i) };
      const p1 = { x: nodeX(i + 1), y: nodeY(i + 1) };
      for (let k = 0; k < ADIM; k++) {
        const f = k / ADIM;
        const nk = bezierNokta(p0, p1, f);
        idx.push(i + f);
        xs.push(nk.x);
        ys.push(nk.y);
      }
    }
    const sonI = Math.max(0, n - 1);
    idx.push(sonI);
    xs.push(nodeX(sonI));
    ys.push(nodeY(sonI));
    if (idx.length < 2) {
      idx.push(idx[0] + 1);
      xs.push(xs[0]);
      ys.push(ys[0]);
    }
    return { idx, xs, ys };
  }, [n, W, contentH]);

  useEffect(() => {
    let iptal = false;
    const anahtar = `patika-son-durak:${lawAnahtar}`;
    const kaydir = (i: number, ani: boolean) =>
      scrollRef.current?.scrollTo({ y: Math.max(0, nodeY(i) - gorunurH * 0.5), animated: ani });
    void (async () => {
      let onceki = aktifI;
      try {
        const ham = await AsyncStorage.getItem(anahtar);
        if (ham != null && ham !== '') onceki = Math.max(0, Math.min(n - 1, Number(ham)));
      } catch {
        /* okunamazsa animasyonsuz devam */
      }
      if (iptal) return;
      const ilerleme = aktifI - onceki;
      if (ilerleme > 0 && ilerleme <= 8) {
        setAnimBas(onceki);
        setGorselIndex(onceki);
        surucu.setValue(onceki);
        kaydir(onceki, false);
        setTimeout(() => kaydir(aktifI, true), 220);
        Animated.timing(surucu, {
          toValue: aktifI,
          duration: 700 + 450 * ilerleme,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE,
        }).start(({ finished }) => {
          if (iptal || !finished) return;
          setGorselIndex(aktifI);
          setAnimBas(null);
        });
      } else {
        surucu.setValue(aktifI);
        setGorselIndex(aktifI);
        setAnimBas(null);
        setTimeout(() => kaydir(aktifI, true), 400);
      }
      try {
        await AsyncStorage.setItem(anahtar, String(aktifI));
      } catch {
        /* yazilamazsa sonraki acilista animasyon olmaz, zarar yok */
      }
    })();
    return () => {
      iptal = true;
    };
  }, [aktifI, lawAnahtar, n, gorunurH, contentH, surucu]);

  const aracX = surucu.interpolate({ inputRange: ornek.idx, outputRange: ornek.xs, extrapolate: 'clamp' });
  const aracY = surucu.interpolate({ inputRange: ornek.idx, outputRange: ornek.ys, extrapolate: 'clamp' });

  return (
    <>
      <View style={[st.duoSahne, { height: gorunurH }]}>
        {/* Sabit dağ manzarası (atmosfer parallax) + koyu tül → düğümler öne çıksın. */}
        <Image source={YOL_UZUN} style={StyleSheet.absoluteFill} contentFit="cover" pointerEvents="none" />
        <LinearGradient
          colors={['rgba(4,26,40,0.62)', 'rgba(4,26,40,0.48)', 'rgba(4,26,40,0.72)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ height: contentH }}>
          {/* Düğümler arası yol (bezier) — geçilen altın, ileri kesikli soluk */}
          <Svg width={W} height={contentH} style={StyleSheet.absoluteFill} pointerEvents="none">
            {dugumler.slice(0, -1).map((_, i) => {
              const p0 = { x: nodeX(i), y: nodeY(i) };
              const p1 = { x: nodeX(i + 1), y: nodeY(i + 1) };
              const gecildi = aktifIndex === -1 || i + 1 <= gorselIndex;
              return (
                <Path
                  key={i}
                  d={segmentYol(p0, p1)}
                  stroke={gecildi ? Palette.altin : 'rgba(126,205,218,0.45)'}
                  strokeWidth={gecildi ? 6 : 4}
                  strokeDasharray={gecildi ? undefined : '2 13'}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </Svg>
          {/* LEVEL DÜĞÜMLERİ + madde etiketi (Duolingo tarzı) */}
          {dugumler.flatMap((d, i) => {
            const durum = durumCoz(d, i === aktifIndex);
            const buyuk = durum === 'aktif';
            const boyut = buyuk ? HERO : NODE;
            const numara = dugumNumara(d.bolum.ad);
            return [
              <Pressable
                key={`n${d.bolum.id}`}
                onPress={() => onDugumBas(d.bolum.id)}
                style={({ pressed }) => [
                  st.duoNode,
                  { left: nodeX(i) - boyut / 2, top: nodeY(i) - boyut / 2, width: boyut, height: boyut, borderRadius: boyut / 2 },
                  durum === 'tamam' && st.duoTamam,
                  durum === 'aktif' && st.duoAktif,
                  durum === 'baslanmadi' && st.duoKilit,
                  pressed && st.basili,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${d.bolum.ad}`}>
                {durum === 'tamam' ? (
                  <MaterialCommunityIcons name="check-bold" size={buyuk ? 30 : 24} color="#07334B" />
                ) : durum === 'baslanmadi' ? (
                  <MaterialCommunityIcons name="lock" size={22} color="rgba(226,236,240,0.85)" />
                ) : numara ? (
                  // Düğümün içinde SIRA sayısı değil MADDE numarası (eskiden "13" gibi
                  // anlamsız bir sayı çıkıyordu; kullanıcı hangi maddede olduğunu göremiyordu).
                  <AppText
                    variant={buyuk && numara.length <= 3 ? 'baslik' : 'govde'}
                    bold
                    numberOfLines={1}
                    color={durum === 'aktif' ? 'lacivert' : 'beyaz'}>
                    {numara}
                  </AppText>
                ) : (
                  // Madde numarası olmayan düğüm (özet/ayırt kartı) → yazı yerine ikon.
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={buyuk ? 26 : 22}
                    color={durum === 'aktif' ? '#07334B' : 'rgba(226,236,240,0.9)'}
                  />
                )}
              </Pressable>,
              <AppText
                key={`e${d.bolum.id}`}
                variant="etiket"
                bold
                color="beyaz"
                numberOfLines={1}
                style={[st.duoEtiket, { top: nodeY(i) + boyut / 2 + 3, left: nodeX(i) - 60 }]}>
                {d.bolum.ad}
              </AppText>,
            ];
          })}
          {/* ALTIN IZ - arac gectikce yanan noktalar (yalniz surerken cizilir). */}
          {animBas !== null
            ? ornek.idx.map((t, k) =>
                t > animBas && t <= aktifI ? (
                  <Animated.View
                    key={`iz${k}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: ornek.xs[k] - 4,
                      top: ornek.ys[k] - 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: Palette.altinParlak,
                      opacity: surucu.interpolate({
                        inputRange: [Math.max(0, t - 0.08), t],
                        outputRange: [0, 0.9],
                        extrapolate: 'clamp',
                      }),
                    }}
                  />
                ) : null,
              )
            : null}
          {/* Jandarma araci - ilerleyince eski duraktan yenisine SURER. */}
          {aktifIndex >= 0 && dugumler[aktifI] ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: -34,
                top: -(HERO / 2 + 54),
                width: 68,
                height: 58,
                transform: [{ translateX: aracX }, { translateY: aracY }],
              }}>
              <Image source={PATIKA_ARAC} style={StyleSheet.absoluteFill} contentFit="contain" />
            </Animated.View>
          ) : null}
        </ScrollView>
      </View>

      {/* Alt panel — ŞU ANKİ MEVZİ + DEVAM ET. */}
      {aktif ? (
        <Pressable
          style={({ pressed }) => [st.altPanel, pressed && st.basili]}
          onPress={onDevam}
          accessibilityRole="button"
          accessibilityLabel="Kaldığın yerden devam et">
          <View style={st.altSol}>
            {/* TEK SATIR olmalı: "SIRADAKİ MEVZİ · MADDE 35" iki satıra sarınca alt panel
                uzayıp kart sayacını ekranın dışına itiyordu (canlı cihazda görüldü). */}
            <AppText variant="etiket" bold color="kartMetinIkincil" numberOfLines={1} style={st.altUst}>
              {aktifIndex >= 0 ? `SIRADAKİ · ${aktif.bolum.ad.toLocaleUpperCase('tr')}` : 'ŞU ANKİ MEVZİ'}
            </AppText>
            <AppText variant="govde" bold color="beyaz" numberOfLines={1}>
              {kanunAd ?? aktif.bolum.ad}
            </AppText>
            <View style={st.altBar}>
              {kanunOran > 0 ? <View style={[st.altBarDolu, { flex: kanunOran }]} /> : null}
              <View style={{ flex: Math.max(1, 100 - kanunOran) }} />
            </View>
            <AppText variant="etiket" color="kartMetinIkincil" numberOfLines={1}>
              {toplamKart === 0 ? 'yakında' : `${calisilanKart}/${toplamKart} kart · %${kanunOran}`}
            </AppText>
          </View>
          <View style={st.devamBtn}>
            <AppText variant="kucuk" bold color="lacivert">
              DEVAM ET
            </AppText>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#07334B" />
          </View>
        </Pressable>
      ) : null}
    </>
  );
}

function Harita({
  dugumler,
  aktifIndex,
  onDugumBas,
}: {
  dugumler: BolumDugum[];
  aktifIndex: number;
  onDugumBas: (bolumId: number) => void;
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
      {/* Manzara arka planı — DİKEY TILE: görsel doğal oranında (W × W*ORAN) alt
          alta tekrarlanır → uzun patikada germe/esneme YOK. Düğüm/postal üstte. */}
      {W > 0
        ? Array.from({ length: Math.max(1, Math.ceil(haritaY / (W * ARKA_PLAN_ORAN))) }, (_, i) => (
            <Image
              key={`bg-${i}`}
              source={ARKA_PLAN}
              style={{
                position: 'absolute',
                left: 0,
                top: i * W * ARKA_PLAN_ORAN,
                width: W,
                height: W * ARKA_PLAN_ORAN,
              }}
              contentFit="cover"
              pointerEvents="none"
            />
          ))
        : null}
      {W > 0
        ? (() => {
            const konnektorler: ReactNode[] = [];
            const ayaklar: ReactNode[] = [];
            dugumler.slice(0, -1).forEach((_, i) => {
              const p0 = dugumMerkez(i, W);
              const p1 = dugumMerkez(i + 1, W);
              const gecildi = aktifIndex === -1 || i + 1 <= aktifIndex;
              const anahtar = String(dugumler[i].bolum.id);
              if (!gecildi) {
                // Yürünmemiş ara: kesikli soluk konnektör (SVG, postal YOK).
                konnektorler.push(
                  <Path
                    key={anahtar}
                    d={segmentYol(p0, p1)}
                    fill="none"
                    stroke={Palette.kenarlik}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="2 12"
                    opacity={0.9}
                  />,
                );
              } else {
                // Yürünmüş ara: PNG ayak izleri (RN Image — SVG dışında, konnektörün üstünde).
                ayaklar.push(...segmentPostallari(p0, p1, anahtar));
              }
            });
            return (
              <>
                {/* Kesikli konnektörler (yürünmemiş) — en altta */}
                <Svg width={W} height={haritaY} style={StyleSheet.absoluteFill} pointerEvents="none">
                  {konnektorler}
                </Svg>
                {/* PNG ayak izleri (yürünmüş) — konnektörün üstünde, düğümlerin altında */}
                {ayaklar}
                {dugumler.map((d, i) => (
            <Dugum
              key={d.bolum.id}
              dugum={d}
              index={i}
              durum={durumCoz(d, i === aktifIndex)}
              merkez={dugumMerkez(i, W)}
              onPress={() => onDugumBas(d.bolum.id)}
                  />
                ))}
              </>
            );
          })()
        : null}
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
      {/* Aktif düğüm: sağ-üstte altın yıldız rozeti */}
      {aktif ? (
        <View style={[st.yildizBadge, { left: BOX / 2 + cap / 2 - 13, top: -4 }]} pointerEvents="none">
          <MaterialCommunityIcons name="star" size={14} color={Palette.lacivert} />
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        {/* Aktif düğüm: yumuşak altın glow (iki katman, daire arkasında) */}
        {aktif ? (
          <>
            <View
              pointerEvents="none"
              style={[st.glow, { width: cap + 60, height: cap + 60, borderRadius: (cap + 60) / 2, top: -30, left: -30 }]}
            />
            <View
              pointerEvents="none"
              style={[st.glow2, { width: cap + 28, height: cap + 28, borderRadius: (cap + 28) / 2, top: -14, left: -14 }]}
            />
          </>
        ) : null}
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
            <MaterialCommunityIcons name="play" size={36} color={Palette.lacivert} />
          ) : durum === 'tamam' ? (
            <MaterialCommunityIcons name="check-bold" size={36} color={Palette.altinKoyu} />
          ) : durum === 'baslanmis' ? (
            <AppText variant="kucuk" bold color="lacivert">
              %{yuzde}
            </AppText>
          ) : (
            <View style={st.nokta} />
          )}
        </Pressable>
      </Animated.View>

      <View style={[st.adKutu, { top: cap + 8 }]}>
        {aktif ? (
          <View style={st.aktifEtiket}>
            <AppText variant="etiket" bold color="beyaz" numberOfLines={1}>
              {dugum.bolum.ad}
            </AppText>
            <AppText variant="etiket" bold color="altinAcik2" style={st.aktifEtiketAlt}>
              • ŞU ANKİ KONUM
            </AppText>
          </View>
        ) : (
          <AppText
            variant="etiket"
            bold
            color={durum === 'baslanmadi' ? 'solukMetin' : 'lacivert'}
            numberOfLines={1}
            style={st.adMetin}>
            {dugum.bolum.ad}
          </AppText>
        )}
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
      <View style={st.aktifEtiket}>
        <AppText variant="etiket" bold color="altinAcik2">
          ŞU ANKİ KONUM
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
        <MaterialCommunityIcons name="play" size={36} color={Palette.lacivert} />
      </Pressable>
      <AppText variant="kucuk" bold color="lacivert" style={st.adMetin}>
        Tüm Kartlar
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        Bu kanunu çalış
      </AppText>
    </Animated.View>
  );
}

/** Hata/durum kutusu (krem zemin). */
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
      <AppText variant="altBaslik" bold color="lacivert">
        {baslik}
      </AppText>
      <AppText variant="kucuk" color="solukMetin">
        {aciklama}
      </AppText>
      <Pressable
        onPress={buton.onPress}
        style={({ pressed }) => [st.retryBtn, pressed && st.pressed]}>
        <AppText variant="kucuk" bold color="lacivert">
          {buton.etiket}
        </AppText>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  // ── DUOLINGO tarzı level haritası (bayraklı) ──
  duoSahne: {
    alignSelf: 'center',
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67,203,218,0.4)',
    backgroundColor: '#072536',
  },
  duoNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3,47,69,0.95)',
    borderWidth: 3,
    borderColor: 'rgba(126,205,218,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  duoTamam: {
    backgroundColor: Palette.altin,
    borderColor: '#FFF7E0',
  },
  duoAktif: {
    backgroundColor: Palette.altinParlak,
    borderColor: '#FFFFFF',
    shadowColor: Palette.altinParlak,
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  duoKilit: {
    backgroundColor: 'rgba(3,40,56,0.85)',
    borderColor: 'rgba(126,205,218,0.35)',
  },
  duoEtiket: {
    position: 'absolute',
    width: 120,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  // ── Sinematik patika (bayraklı) ──
  sahne: {
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.35)',
    marginTop: Spacing.one,
  },
  sahneTul: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,32,48,0.18)',
  },
  sahneTulUzun: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(4,32,48,0.16)',
  },
  // Kod-çizilen sonsuz yol
  yolTul: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,26,40,0.55)',
  },
  yolSerit: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(9,14,22,0.9)',
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: 'rgba(230,238,242,0.55)',
  },
  cizgiKap: {
    position: 'absolute',
    top: 0,
    width: 6,
    overflow: 'hidden',
  },
  dash: {
    position: 'absolute',
    left: 1,
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: 'rgba(243,194,74,0.92)',
  },
  konumBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(3,40,56,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.6)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  hedefRoz: {
    position: 'absolute',
    alignItems: 'center',
  },
  hedefYazi: {
    letterSpacing: 1,
  },
  durak: {
    position: 'absolute',
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durakNokta: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(3,40,56,0.92)',
    borderWidth: 2,
    borderColor: 'rgba(226,236,240,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  durakTamam: {
    backgroundColor: Palette.altinParlak,
    borderColor: '#FFFFFF',
  },
  durakAktif: {
    backgroundColor: Palette.altinParlak,
    borderColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  durakKilit: {
    backgroundColor: 'rgba(3,40,56,0.8)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  tabela: {
    position: 'absolute',
    top: -10,
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 172,
  },
  tabelaSag: {
    left: 22,
  },
  tabelaSol: {
    right: 22,
  },
  arac: {
    position: 'absolute',
    width: 68,
    height: 60,
  },
  aracKap: {
    position: 'absolute',
  },
  aracImg: {
    ...StyleSheet.absoluteFillObject,
  },
  far: {
    position: 'absolute',
    top: -16,
    left: '26%',
    width: '48%',
    height: 32,
    borderRadius: 18,
    backgroundColor: 'rgba(243,194,74,0.16)',
  },
  iz: {
    position: 'absolute',
    bottom: 2,
    left: '36%',
    width: '28%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(226,236,240,0.16)',
  },
  altPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: 'rgba(3,47,69,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.5)',
    borderRadius: 16,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  altSol: {
    flex: 1,
    gap: 3,
  },
  altUst: {
    letterSpacing: 1,
  },
  altBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,246,220,0.18)',
    marginTop: 2,
  },
  altBarDolu: {
    backgroundColor: Palette.altinParlak,
  },
  devamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.altinParlak,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  basili: {
    opacity: 0.9,
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
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  kanunKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  seritAd: {
    flex: 1,
  },

  // Harita
  harita: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden', // tile'ın son dilimi haritaY'yi aşarsa kırpılsın
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
    borderColor: Palette.altinKoyu,
    borderWidth: 2,
  },
  daireTamam: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.lacivert,
    borderWidth: 4, // mockup: koyu lacivert KALIN halka
  },
  daireBaslanmis: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
  },
  daireBaslanmadi: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
  },
  nokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.solukMetin,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(231,188,86,0.22)', // altinAcik2 saydam — dış yumuşak halka
  },
  glow2: {
    position: 'absolute',
    backgroundColor: 'rgba(231,188,86,0.40)', // iç (daha belirgin) glow
  },
  yildizBadge: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.altin,
    borderWidth: 1.5,
    borderColor: Palette.kartKremi,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  aktifEtiket: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    alignItems: 'center',
  },
  aktifEtiketAlt: {
    marginTop: 1,
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

  // İndir + aç modalı (boş kart tedbiri)
  modalKatman: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  modalOrtali: {
    textAlign: 'center',
  },
  modalBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.ilerlemeTrack,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  modalBarDolu: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.altinKoyu,
  },
  modalBtnlar: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalBtn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  modalBtnIkincil: {
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
});
