import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Komşu kart önyükleme (prefetch) registry — bundle görselleri (require asset id).
import { gorselOnCoz } from '@/lib/gorsel-coz';
import { gorselKaynak, gorselVarMi, indirilmisGorsel } from '@/lib/gorsel-kaynak';
// Gerçek ses (mp3) registry — kartın gorsel_yolu ile anahtarlı (varsa TTS yerine çalar).
import { KART_SESLERI } from '../assets/kart-sesleri';
import { HatirlaQuiz } from '@/components/card-flow/hatirla-quiz';
import { SesOynatici } from '@/components/card-flow/ses-oynatici';
import { StudyCard } from '@/components/card-flow/study-card';
import { TtsBar } from '@/components/card-flow/tts-bar';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { CardFlowMaxWidth, Palette, Spacing } from '@/constants/theme';
import { getAyar } from '@/lib/bildirim';
import { erteleBugun, ertelemeAktifMi } from '@/lib/modal-erteleme';
import {
  getCardsByBolumChain,
  getCardsByLaw,
  getDailyQueue,
  getZayifKuyruk,
  recordReview,
} from '@/db/database';
import { maddeMetni } from '@/db/madde-metinleri';
import { getSinavSorulari, type KartSoru, sinavVarMi } from '@/lib/sinav';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

type Cozulen = { tekrar: number; yeni: number };

// Görselin üstüne binen TEK panel alanı: aynı anda yalnız biri (ses/madde) ya da hiçbiri.
type AcikPanel = 'yok' | 'ses' | 'madde';

// Swipe için yatay eşik (px): bundan fazla yatay sürükleme kartı değiştirir.
const SWIPE_ESIK = 45;

/** Günlük kuyruğu kullanıcının "oturum başına kart" hedefine göre sınırlar (Eğitim Planı). */
async function gunlukSinirli(): Promise<QueueCard[]> {
  const [ayar, kuyruk] = await Promise.all([getAyar(), getDailyQueue()]);
  return kuyruk.slice(0, ayar.gunlukKart);
}

export default function AkisScreen() {
  // (Ekran görüntüsü/kayıt engeli artık GLOBAL — root _layout'ta useEkranKoruma.)
  const router = useRouter();
  const { lawId, bolumId, mod, kart } = useLocalSearchParams<{
    lawId?: string;
    bolumId?: string;
    mod?: string;
    kart?: string; // Arama'dan gelince: kuyrukta bu kart id'sinden başla.
  }>();
  const bolumModu = bolumId != null && bolumId !== '';
  const kanunModu = lawId != null && lawId !== '';
  const zayifModu = mod === 'zayif'; // geri-bes oturumu (zayıf mevzi kuyruğu)
  // Patika/kanun/zayıf modu = günlük kuyruk DEĞİL (mesaj/etiket bunu kullanır).
  const tekKanun = bolumModu || kanunModu || zayifModu;
  // Öğrenme modu (kanun/bölüm) → akış bitince "aktif hatırlama" mini-quiz çıkar (zayıf'ta YOK).
  const ogrenmeModu = kanunModu || bolumModu;
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hata, setHata] = useState(false);
  const [index, setIndex] = useState(0);
  const [cozulen, setCozulen] = useState<Cozulen>({ tekrar: 0, yeni: 0 });
  // Aktif hatırlama: akış bitince yüklenen 2-3 soru + tamamlanma bayrağı.
  const [hatirlaSorular, setHatirlaSorular] = useState<KartSoru[] | null>(null);
  const [hatirlaBitti, setHatirlaBitti] = useState(false);
  const [cevapHatasi, setCevapHatasi] = useState(false);
  // Sesli anlatım sonuna kadar okununca true → "sıradakine geç" mesajı çıkar.
  const [anlatimBitti, setAnlatimBitti] = useState(false);
  // TEK panel alanı (görselin üstüne biner): 'ses' kontrolleri / 'madde' metni / 'yok'.
  // Ses OTOMATİK çalar (TtsBar mount'ta, panel kapalıyken de); bu bayrak yalnız
  // hangi panelin görselin üstüne açılacağını seçer (biri açılınca diğeri kapanır).
  const [acikPanel, setAcikPanel] = useState<AcikPanel>('yok');

  // Görsel alanı ölçüsü (onLayout) → görsel kutusu doğal orana göre boyutlanır,
  // kalan alana sığar (contain mantığı; boşluk/kırpma yok). Bkz. gorselBoyut.
  const [alan, setAlan] = useState({ w: 0, h: 0 });
  // Görselin DOĞAL oranı (genişlik/yükseklik). expo-image onLoad'dan gelir → web+native
  // AYNI (resolveAssetSource web'de YOK, crash ederdi). Yüklenene kadar null → fallback.
  const [oran, setOran] = useState<number | null>(null);

  // Madde paneli panel-içi scroll: metin kutuya sığmıyorsa "Devamını gör" + scroll.
  const maddeScrollRef = useRef<ScrollView>(null);
  const maddeVpRef = useRef(0); // panel-içi görünür yükseklik
  const maddeIcerikRef = useRef(0); // metnin tam yüksekliği
  const maddeOfsetRef = useRef(0); // mevcut scroll konumu
  const [maddeUzun, setMaddeUzun] = useState(false); // metin sığmıyor mu (buton göster)
  const [maddeSonda, setMaddeSonda] = useState(false); // en alta gelindi mi (butonu gizle)

  // Ses bitince "geçelim mi?" modalı + "bugün sorma" işareti (ekran-içi overlay).
  const [modalAcik, setModalAcik] = useState(false);
  const [bugunSorma, setBugunSorma] = useState(false);

  // Görsel ekranda görünene (yüklenene/hata) kadar "Öğrendim" basılamaz → görmeden
  // öğrendim işaretlenmesin. Kart değişince sıfırlanır; StudyCard onGorundu ile true olur.
  const [gorselGorundu, setGorselGorundu] = useState(false);

  // Madde uzunluğunu (sığmıyor mu) içerik vs görünür yükseklikten hesapla.
  const maddeUzunHesapla = useCallback(() => {
    setMaddeUzun(maddeIcerikRef.current > maddeVpRef.current + 4);
  }, []);

  // Kart değişince: anlatım-bitti sıfırla + paneli kapat + madde scroll durumunu sıfırla.
  useEffect(() => {
    setAnlatimBitti(false);
    setAcikPanel('yok');
    setMaddeUzun(false);
    setMaddeSonda(false);
    maddeOfsetRef.current = 0;
    maddeScrollRef.current?.scrollTo({ y: 0, animated: false });
    setOran(null); // yeni kartın oranı onLoad ile gelene kadar fallback
    setGorselGorundu(false); // yeni görsel görünene kadar Öğrendim kilitli
    setModalAcik(false); // yeni kartta modal kapalı (anlatimBitti zaten sıfırlanıyor)
    setBugunSorma(false);
    // PRELOAD: mevcut + komşu ŞİFRELİ kartları arkada önden çöz → açılış beklemesi gizlenir.
    gorselOnCoz([
      indirilmisGorsel(queue?.[index]?.gorsel_yolu),
      indirilmisGorsel(queue?.[index + 1]?.gorsel_yolu),
      indirilmisGorsel(queue?.[index - 1]?.gorsel_yolu),
    ]);
  }, [index, queue]);

  // Ses (otomatik anlatım) bitince → erteleme penceresinde DEĞİLSEK "geçelim mi?" modalı.
  // onBitti yalnız doğal bitişte gelir (durdur/seek/kart değişimi tetiklemez → yanlış
  // açılma yok). Footer NORMAL kalır; bu modal EK olarak açılır.
  useEffect(() => {
    if (!anlatimBitti) return;
    let iptal = false;
    void ertelemeAktifMi().then((aktif) => {
      if (!iptal && !aktif) setModalAcik(true);
    });
    return () => {
      iptal = true;
    };
  }, [anlatimBitti]);

  const yukle = useCallback(() => {
    setHata(false);
    setQueue(null);
    setIndex(0);
    setCozulen({ tekrar: 0, yeni: 0 });
    setHatirlaSorular(null);
    setHatirlaBitti(false);
    // Öncelik: zayıf (geri-bes) > bölüm > kanun > günlük kuyruk. (Mevcut davranış korunur.)
    const p = zayifModu
      ? getZayifKuyruk()
      : bolumModu
        ? getCardsByBolumChain(Number(bolumId)) // girilen maddeden kanun sonuna kadar sürekli akış
        : kanunModu
          ? getCardsByLaw(Number(lawId))
          : gunlukSinirli();
    void p
      .then((q) => {
        setQueue(q);
        // Arama sonucundan gelindiyse eşleşen karta atla (yoksa baştan).
        if (kart) {
          const i = q.findIndex((c) => c.id === Number(kart));
          if (i >= 0) setIndex(i);
        }
      })
      .catch(() => setHata(true));
  }, [zayifModu, bolumModu, bolumId, kanunModu, lawId, kart]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  async function cevapla(cevap: SrsCevap) {
    if (!queue) return;
    const card = queue[index];
    try {
      setCevapHatasi(false);
      await recordReview(card.id, card.kutu, cevap);
      setCozulen((c) => (card.yeni ? { ...c, yeni: c.yeni + 1 } : { ...c, tekrar: c.tekrar + 1 }));
      setIndex((i) => i + 1);
    } catch {
      // Buton kilitlenmez; kullanıcı tekrar deneyebilir.
      setCevapHatasi(true);
    }
  }

  // Modal seçimi: "bugün sorma" işaretliyse hangi butona basılırsa basılsın ertele.
  // 'biliyorum'/'zor' → cevapla (SRS kaydı + sonraki kart); 'incele' → sadece kapat
  // (cevapla ÇAĞRILMAZ → index değişmez, kart ekranda kalır).
  function modalSec(aksiyon: SrsCevap | 'incele') {
    if (bugunSorma) void erteleBugun();
    setModalAcik(false);
    if (aksiyon !== 'incele') void cevapla(aksiyon);
  }

  const bitti = queue !== null && queue.length > 0 && index >= queue.length;
  const aktif = !hata && queue !== null && queue.length > 0 && index < queue.length;
  // Kanun/bölüm modu bitince o kanunun deneme sınavı varsa CTA göster (zayıf/günlük hariç).
  // bölüm modunda lawId param yok → biten kuyruğun kartlarından law_id türetilir.
  const bitenLawId = kanunModu ? Number(lawId) : bolumModu ? (queue?.[0]?.law_id ?? null) : null;
  const sinavGoster =
    bitenLawId != null && !Number.isNaN(bitenLawId) && sinavVarMi(bitenLawId);

  // Aktif hatırlama: akış bitince (öğrenme modunda) o kanunun sorularından 2-3 tane yükle (bir kez).
  useEffect(() => {
    if (!bitti || !ogrenmeModu || bitenLawId == null || Number.isNaN(bitenLawId)) return;
    if (hatirlaBitti || hatirlaSorular !== null) return;
    const hepsi = getSinavSorulari(bitenLawId);
    if (hepsi.length === 0) {
      setHatirlaBitti(true); // soru yoksa hatırlamayı atla → doğrudan tamamlandı
      return;
    }
    setHatirlaSorular([...hepsi].sort(() => Math.random() - 0.5).slice(0, Math.min(3, hepsi.length)));
  }, [bitti, ogrenmeModu, bitenLawId, hatirlaBitti, hatirlaSorular]);

  const hatirlaGoster =
    bitti && ogrenmeModu && !hatirlaBitti && !!hatirlaSorular && hatirlaSorular.length > 0;
  // Patika/kanun modunda geri = patika (Mevzuat → patika → akış); günlükte Karargah.
  const geriEtiket = tekKanun ? 'Geri dön' : "Karargah'a dön";
  const ozetMetin = tekKanun
    ? `${cozulen.tekrar + cozulen.yeni} kart çalıştın.`
    : `Bugün ${cozulen.tekrar} tekrar · ${cozulen.yeni} yeni kart çalıştın.`;

  const c = aktif ? queue![index] : null;
  const yuzde = aktif ? Math.round(((index + 1) / queue!.length) * 100) : 0;
  const maddeTxt = c ? maddeMetni(c.madde_no) : null;
  // Kartın GERÇEK ses dosyası (mp3) var mı → varsa TtsBar (robotik TTS) yerine SesOynatici.
  const sesVar = !!(c && c.gorsel_yolu && KART_SESLERI[c.gorsel_yolu]);
  // Kartın görseli var mı (registry'de). Görselli kartta görsel görünmeden "Öğrendim"
  // basılamaz / kart KAYDIRILAMAZ; görselsiz (yer tutucu) kartta beklenecek görsel yok → açık.
  const gorselVar = gorselVarMi(c?.gorsel_yolu);
  const ogrenebilir = !gorselVar || gorselGorundu;

  // Kart üzerinde yatay swipe = ileri/geri (oklarla aynı; SADECE index, SRS'e dokunmaz).
  // Yatay-only: tap zoom'a, dikey sürükleme ScrollView'a kalır. runOnJS → worklet gerekmez.
  // GÖRSEL GÖRÜNMEDEN kaydırma YOK (ogrenebilir false → swipe yutulur).
  const sonIdx = (queue?.length ?? 1) - 1;
  const kartKaydir = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (!ogrenebilir) return; // görsel görünene kadar kaydırma kilitli
      if (e.translationX <= -SWIPE_ESIK) setIndex((i) => Math.min(sonIdx, i + 1));
      else if (e.translationX >= SWIPE_ESIK) setIndex((i) => Math.max(0, i - 1));
    });

  // GÖRSEL KUTUSU = görselin DOĞAL oranı, kalan alana sığar (contain). Oran expo-image
  // onLoad'dan (oran state) gelir → web+native AYNI, crash YOK. Kutu bu orana göre alan
  // genişliğine kadar büyür ama alan yüksekliğini AŞMAZ (footer/ikon örtülmez). Kutu
  // görselle aynı oranda → letterbox/kırpma YOK. Çok uzun görselde yükseklik sınıra
  // oturur, genişlik orana göre azalır (yine tam + boşluksuz). oran yokken → fallback.
  const gorselBoyut = useMemo(() => {
    if (!oran || oran <= 0 || alan.w <= 0 || alan.h <= 0) return null;
    let bw = alan.w;
    let bh = bw / oran;
    if (bh > alan.h) {
      bh = alan.h;
      bw = bh * oran;
    }
    return { w: Math.round(bw), h: Math.round(bh) };
  }, [oran, alan.w, alan.h]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* SADE header: ✕ (sol) + ortada "X/Y · %Z" + ince ilerleme barı.
          Başlık + Müşterek rozeti KALDIRILDI (görsel içinde künye zaten yazıyor) →
          kazanılan dikey alan görsele gider. İlerleme verisi korunur. */}
      <View style={styles.header}>
        <View style={styles.headerUst}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Kapat">
            <MaterialCommunityIcons name="close" size={26} color={Palette.kartMetinAcik} />
          </Pressable>
          <AppText variant="etiket" bold color="kartMetinAcik" style={styles.headerMetaMetin}>
            {aktif ? `${index + 1}/${queue!.length} · %${yuzde}` : 'Kart Akışı'}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        {aktif ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${yuzde}%` }]} />
          </View>
        ) : null}
      </View>

      {hata ? (
        <View style={styles.durumKolon}>
          <EmptyState
            ikon="alert-circle-outline"
            ikonRenk="kirmizi"
            baslik="Yüklenemedi"
            aciklama="Kartlar yüklenemedi."
            buton={{ etiket: 'Tekrar dene', onPress: yukle }}
          />
        </View>
      ) : queue === null ? (
        <View style={styles.durumKolon}>
          <Loading />
        </View>
      ) : queue.length === 0 ? (
        // Boş başlangıç: bu kanunda hiç kart yok ("yakında").
        <View style={styles.durumKolon}>
          <EmptyState
            ikon={zayifModu ? 'shield-check-outline' : 'clock-outline'}
            ikonRenk={zayifModu ? 'yesil' : undefined}
            baslik={zayifModu ? 'Zayıf mevzin yok' : tekKanun ? 'Yakında' : 'Bugünlük bitti'}
            aciklama={
              zayifModu
                ? 'Tüm mevziler sağlam — geri besleme eğitimi gerekmiyor. 🎖️'
                : tekKanun
                  ? 'Bu bölümün kartları yakında eklenecek.'
                  : 'Bugün için vakti gelmiş kart yok.'
            }
            buton={{ etiket: geriEtiket, onPress: () => router.back() }}
          />
        </View>
      ) : bitti && hatirlaGoster ? (
        // Akış bitti → önce AKTİF HATIRLAMA (2-3 mini soru), sonra tamamlandı ekranı.
        <View style={styles.durumKolon}>
          <HatirlaQuiz sorular={hatirlaSorular!} onTamamla={() => setHatirlaBitti(true)} />
        </View>
      ) : bitti ? (
        // Çalışıp tükenince: tamamlandı.
        <View style={styles.durumKolon}>
          <EmptyState
            ikon="check-decagram"
            ikonRenk="yesil"
            baslik="Bu turu tamamladın"
            aciklama={ozetMetin}
            buton={
              sinavGoster
                ? {
                    etiket: 'Deneme sınavına gir',
                    onPress: () =>
                      router.push({
                        pathname: '/sinav',
                        params: { lawId: String(bitenLawId) },
                      }),
                  }
                : { etiket: geriEtiket, onPress: () => router.back() }
            }
            ikincilButon={
              sinavGoster ? { etiket: geriEtiket, onPress: () => router.back() } : undefined
            }
          />
        </View>
      ) : (
        <View style={styles.kolon}>
          {/* GÖRSEL ALANI — tek ekran sabit (dış scroll YOK). Görsel doğal oranında,
              kalan alana sığacak şekilde ortalı (boşluk/kırpma yok). onLayout ile alan
              ölçülür → gorselBoyut. Panel açıkken alt kısmı overlay ile örtülür. */}
          <View
            style={styles.gorselAlan}
            onLayout={(e: LayoutChangeEvent) => {
              const { width, height } = e.nativeEvent.layout;
              if (width > 0 && height > 0 && (width !== alan.w || height !== alan.h)) {
                setAlan({ w: width, h: height });
              }
            }}>
            {/* Kartı saran katman: yatay swipe (ileri/geri). Gezinme YALNIZ swipe ile
                (saf görünüm — SRS'e dokunmaz, yalnız index değiştirir; sol/sağ ok butonları
                kaldırıldı). */}
            <GestureDetector gesture={kartKaydir}>
              <View style={styles.kartSar}>
                <View
                  style={[
                    styles.gorselSar,
                    gorselBoyut
                      ? { width: gorselBoyut.w, height: gorselBoyut.h }
                      : styles.gorselSarOran,
                  ]}>
                  <StudyCard
                    card={queue[index]}
                    onOran={setOran}
                    onGorundu={() => setGorselGorundu(true)}
                  />
                </View>
              </View>
            </GestureDetector>

            {/* Komşu kartların (index±1) görselini ÖNDEN decode et (opacity 0, tam ölçü →
                cache'e doğru boyutta girer) → swipe/sonraki kart anında hazır. */}
            <View style={styles.onyukle} pointerEvents="none">
              {[index - 1, index + 1].map((i) => {
                const k = queue[i];
                const g = gorselKaynak(k?.gorsel_yolu) ?? null;
                return g ? (
                  <Image
                    key={`pre-${k.id}`}
                    source={g}
                    style={styles.onyukleGorsel}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                ) : null;
              })}
            </View>

            {/* Panel AÇIKKEN görselin boş bir yerine dokununca panel kapanır (backdrop).
                Panel zIndex'i daha yüksek → panel kontrolleri/✕ çalışmaya devam eder. */}
            {acikPanel !== 'yok' ? (
              <Pressable
                style={styles.panelKapatKatman}
                onPress={() => setAcikPanel('yok')}
                accessibilityLabel="Paneli kapat"
              />
            ) : null}

            {/* PANEL — görselin ALT kısmının ÜSTÜNE biner (absolute overlay). 'yok' iken
                display:none → TtsBar mount KALIR, otomatik çalan ses KESİLMEZ. ✕ ya da
                aktif ikona tekrar basınca kapanır. Panel absolute → görsel boyutunu/akışı
                bozmaz, ekranı uzatmaz. YÜKSEKLİK İÇERİĞE göre: ses kısa (sadece
                kontroller kadar), madde uzun (maks yükseklik + panel-içi scroll). */}
            <View
              style={[
                styles.panel,
                acikPanel === 'madde' && styles.panelMadde,
                acikPanel === 'yok' && styles.gizli,
              ]}>
              <Pressable
                onPress={() => setAcikPanel('yok')}
                style={styles.panelKapat}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Paneli kapat">
                <MaterialCommunityIcons name="close" size={22} color={Palette.kartMetinAcik} />
              </Pressable>

              {/* SES kontrolleri — GÖRSEL EKRANDA GÖRÜNENE KADAR mount EDİLMEZ (ogrenebilir
                  false iken) → otomatik başlama görsel yüklenince başlar (görselsiz kartta
                  hemen). Mount olunca display-toggle ile panel kapalıyken/madde'ye geçince
                  KESİLMEZ. Kartın GERÇEK mp3'ü varsa SesOynatici, yoksa TtsBar (robotik TTS). */}
              <View style={acikPanel === 'ses' ? null : styles.gizli}>
                {ogrenebilir ? (
                  sesVar ? (
                    <SesOynatici
                      key={queue[index].id}
                      sesYolu={queue[index].gorsel_yolu}
                      onBitti={() => setAnlatimBitti(true)}
                    />
                  ) : (
                    <TtsBar
                      key={queue[index].id}
                      gorselYolu={queue[index].gorsel_yolu}
                      onBitti={() => setAnlatimBitti(true)}
                    />
                  )
                ) : null}
              </View>

              {/* MADDE metni — kutu SABİT (panelMadde maxHeight), metin kutu İÇİNDE
                  kaydırılır → dış ekran/kutu uzamaz. Kısa metinde buton yok; uzun
                  metinde "Devamını gör →" (basınca bir ekran aşağı kayar). Metin yoksa
                  "yakında". (Ayrı tam-metin sheet KALDIRILDI; panel-içi scroll yeter.) */}
              <View style={acikPanel === 'madde' ? styles.panelIcerikMadde : styles.gizli}>
                {maddeTxt !== null ? (
                  <>
                    <AppText variant="kucuk" bold color="kartMetinAcik" style={styles.panelBaslik}>
                      Madde Metni
                    </AppText>
                    <ScrollView
                      ref={maddeScrollRef}
                      style={styles.maddeKaydir}
                      showsVerticalScrollIndicator
                      scrollEventThrottle={16}
                      onLayout={(e: LayoutChangeEvent) => {
                        maddeVpRef.current = e.nativeEvent.layout.height;
                        maddeUzunHesapla();
                      }}
                      onContentSizeChange={(_w, h) => {
                        maddeIcerikRef.current = h;
                        maddeUzunHesapla();
                      }}
                      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                        maddeOfsetRef.current = contentOffset.y;
                        setMaddeSonda(
                          contentOffset.y + layoutMeasurement.height >= contentSize.height - 4,
                        );
                      }}>
                      <AppText variant="kucuk" color="kartMetinAcik">
                        {maddeTxt}
                      </AppText>
                    </ScrollView>
                    {maddeUzun && !maddeSonda ? (
                      <Pressable
                        onPress={() =>
                          maddeScrollRef.current?.scrollTo({
                            y: maddeOfsetRef.current + maddeVpRef.current * 0.9,
                            animated: true,
                          })
                        }
                        style={({ pressed }) => [styles.maddeAc, pressed && styles.pressed]}>
                        <AppText variant="kucuk" bold color="altinAcik2">
                          Devamını gör →
                        </AppText>
                      </Pressable>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.maddeYakinda}>
                    <MaterialCommunityIcons name="file-document-outline" size={26} color={Palette.kartMetinIkincil} />
                    <AppText variant="kucuk" color="kartMetinIkincil">
                      Madde metni yakında
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 🎧/📄 — GÖRSELİN ALTINDA yan yana 2 buton (görsel üstü TAMAMEN temiz →
              çakışma kökten biter). Aktif altın dolu, pasif altın çerçeve. Biri açılınca
              diğeri kapanır (TEK panel alanı). */}
          <View style={styles.ikonSatir}>
            <Pressable
              disabled={!ogrenebilir}
              onPress={() => setAcikPanel((p) => (p === 'ses' ? 'yok' : 'ses'))}
              style={[
                styles.ikonBtn,
                acikPanel === 'ses' && styles.ikonBtnAktif,
                !ogrenebilir && styles.btnPasif,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ogrenebilir }}
              accessibilityLabel="Sesli anlatım">
              <MaterialCommunityIcons
                name="headphones"
                size={20}
                color={acikPanel === 'ses' ? Palette.lacivert : Palette.altinAcik2}
              />
              <AppText variant="etiket" bold color={acikPanel === 'ses' ? 'lacivert' : 'kartMetinAcik'}>
                Sesli Anlatım
              </AppText>
            </Pressable>
            <Pressable
              disabled={!ogrenebilir}
              onPress={() => setAcikPanel((p) => (p === 'madde' ? 'yok' : 'madde'))}
              style={[
                styles.ikonBtn,
                acikPanel === 'madde' && styles.ikonBtnAktif,
                !ogrenebilir && styles.btnPasif,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ogrenebilir }}
              accessibilityLabel="Madde metni">
              <MaterialCommunityIcons
                name="file-document-outline"
                size={20}
                color={acikPanel === 'madde' ? Palette.lacivert : Palette.altinAcik2}
              />
              <AppText variant="etiket" bold color={acikPanel === 'madde' ? 'lacivert' : 'kartMetinAcik'}>
                Madde Metni
              </AppText>
            </Pressable>
          </View>

          {/* Hata/öneri bildir — HER kartta görünür; kart context'iyle Supabase'e yazılır. */}
          <Pressable
            style={({ pressed }) => [styles.bildir, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: '/geri-bildirim',
                params: {
                  card_id: String(queue[index].id),
                  madde_no: queue[index].madde_no,
                  baslik: queue[index].baslik,
                  kanun: queue[index].law_ad,
                },
              })
            }>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Palette.kartMetinIkincil} />
            <AppText variant="etiket" color="kartMetinIkincil">
              Hata/öneri bildir
            </AppText>
          </Pressable>

          {/* SABİT footer — cevap butonları her zaman altta. Ses bitince footer NORMAL
              kalır (Öğrendim/Tekrar Hatırlat); "geçelim mi?" sorusu EK modalda sorulur. */}
          <View style={styles.footer}>
            {cevapHatasi ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.cevapHata}>
                Kaydedilemedi, tekrar dene.
              </AppText>
            ) : null}
            <View style={styles.butonSatir}>
              {/* Öğrendim — görsel görünene kadar KİLİTLİ (görmeden öğrendim işaretlenmesin). */}
              <Pressable
                disabled={!ogrenebilir}
                style={({ pressed }) => [
                  styles.bildimBtn,
                  pressed && styles.pressed,
                  !ogrenebilir && styles.btnPasif,
                ]}
                onPress={() => void cevapla('biliyorum')}
                accessibilityState={{ disabled: !ogrenebilir }}>
                <View style={styles.bildimDaire}>
                  <MaterialCommunityIcons
                    name={ogrenebilir ? 'check-bold' : 'eye-off-outline'}
                    size={18}
                    color={Palette.lacivert}
                  />
                </View>
                <AppText variant="govde" color="kartMetinAcik" bold>
                  {ogrenebilir ? 'Öğrendim' : 'Önce görseli gör'}
                </AppText>
              </Pressable>
              {/* Tekrar Hatırlat — Öğrendim ile aynı: görsel görünene kadar KİLİTLİ. */}
              <Pressable
                disabled={!ogrenebilir}
                style={({ pressed }) => [
                  styles.tekrarBtn,
                  pressed && styles.pressed,
                  !ogrenebilir && styles.btnPasif,
                ]}
                onPress={() => void cevapla('zor')}
                accessibilityState={{ disabled: !ogrenebilir }}>
                <MaterialCommunityIcons name="refresh" size={20} color={Palette.altinKoyu} />
                <AppText variant="govde" color="altinKoyu" bold>
                  Tekrar Hatırlat
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* SES BİTİNCE "geçelim mi?" MODALI — RN Modal DEĞİL, ekran-içi absoluteFill
              overlay (GorselZoom deseni) → AkisScreen unmount olmaz, TtsBar mount kalır
              (ses kesilmez). Footer'ı kapsayan tam-ekran katman. */}
          {modalAcik ? (
            <View style={styles.modalOverlay}>
              <View style={styles.modalKart}>
                <AppText variant="altBaslik" color="anaMetin" bold style={styles.modalBaslik}>
                  Anlatım bitti
                </AppText>
                <AppText variant="kucuk" color="solukMetin" style={styles.modalAlt}>
                  Bu kartı öğrendin mi, sıradakine geçelim mi?
                </AppText>

                <Pressable
                  style={({ pressed }) => [styles.modalOgrendim, pressed && styles.pressed]}
                  onPress={() => modalSec('biliyorum')}>
                  <MaterialCommunityIcons name="check-bold" size={18} color={Palette.lacivert} />
                  <AppText variant="govde" color="lacivert" bold>
                    Öğrendim
                  </AppText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.modalTekrar, pressed && styles.pressed]}
                  onPress={() => modalSec('zor')}>
                  <MaterialCommunityIcons name="refresh" size={18} color={Palette.altinKoyu} />
                  <AppText variant="govde" color="altinKoyu" bold>
                    Tekrar Hatırlat
                  </AppText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.modalIncele, pressed && styles.pressed]}
                  onPress={() => modalSec('incele')}>
                  <AppText variant="kucuk" color="solukMetin" bold>
                    Kartı inceleyeceğim
                  </AppText>
                </Pressable>

                <Pressable
                  style={styles.modalBugunSorma}
                  onPress={() => setBugunSorma((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: bugunSorma }}
                  hitSlop={8}>
                  <MaterialCommunityIcons
                    name={bugunSorma ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={20}
                    color={bugunSorma ? Palette.altinKoyu : Palette.solukMetin}
                  />
                  <AppText variant="kucuk" color="solukMetin">
                    Bugün tekrar sorma
                  </AppText>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kartZeminKoyu,
  },
  header: {
    backgroundColor: Palette.kartYuzeyKoyu,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  headerUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerSpacer: {
    width: 26,
  },
  // Sade header ortası: "X/Y · %Z" — ✕ ile sağdaki spacer arasında ortalanır.
  headerMetaMetin: {
    flex: 1,
    textAlign: 'center',
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.kartKenarKoyu,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.altinAcik2,
  },
  // Ortak "telefon kolonu": web'de ortalanır, dar ekranda tam en. TEK ekran sabit
  // (scroll YOK) → flex column: görsel alanı (flex) + ikon satırı + footer.
  kolon: {
    flex: 1,
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    alignSelf: 'center',
  },
  // Yükleme/hata/boş/bitti — krem zeminli (EmptyState/Loading açık temalı, okunur kalsın).
  durumKolon: {
    flex: 1,
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    alignSelf: 'center',
    backgroundColor: Palette.kremZemin,
  },
  // GÖRSEL ALANI — kalan dikey alanı doldurur (flex). Görsel ortalanır; taşarsa
  // kırpılır (overflow) → ekran SABİT kalır, scroll açılmaz. Panel bu alanın altına
  // absolute biner → görseli/akışı uzatmaz.
  gorselAlan: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // kutu alandan darsa (yüksek görsel) yatay ortalanır
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: Spacing.two,
  },
  kartSar: {
    position: 'relative',
    justifyContent: 'center',
  },
  // Görsel kutusu: ölçü gorselBoyut'tan inline gelir (görselin doğal oranı + alana
  // sığma). Ölçü henüz yokken (ilk layout / oran bilinmiyor) gorselSarOran'a düşer.
  gorselSar: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Palette.altin,
    backgroundColor: Palette.kartKremi,
    overflow: 'hidden',
  },
  gorselSarOran: {
    width: '100%',
    aspectRatio: 0.8,
  },
  // Önyükleme katmanı: tam ölçü ama görünmez (opacity 0) + arkada → komşu görselleri
  // doğru boyutta decode edip cache'ler; layout'u/scroll'u etkilemez (absolute).
  onyukle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },
  onyukleGorsel: {
    width: '100%',
    aspectRatio: 0.8,
  },
  // Sabit alt footer — cevap butonları her zaman erişilir.
  footer: {
    borderTopColor: Palette.kartKenarKoyu,
    borderTopWidth: 1,
    backgroundColor: Palette.kartZeminKoyu,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  // PANEL — görselin alt kısmının ÜSTÜNE binen koyu overlay (absolute). Üst yarı +
  // künye görünür kalır. Yatay payla görselin içine değil kenarlardan biraz içeride.
  panel: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    bottom: Spacing.two,
    // Yükseklik İÇERİĞE göre (height yok) → ses paneli sadece kontroller kadar yüksek
    // olur, gereksiz boşluk kalmaz. Madde paneli panelMadde ile maks yüksekliğe oturur.
    backgroundColor: Palette.kartYuzeyKoyu,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five, // sağ üst ✕ için boşluk
    paddingBottom: Spacing.three,
    zIndex: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  // Madde paneli: kutu HER ZAMAN AYNI yükseklik (sabit %60) → kısa/uzun metin fark etmez,
  // metin panel-içi ScrollView ile (scroll bar) okunur, kutu/ekran BÜYÜMEZ.
  panelMadde: {
    height: '60%',
  },
  // Panel açıkken görselin boş alanına dokunma katmanı (panel zIndex 5'in altında).
  panelKapatKatman: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  panelKapat: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  // Madde içerik sarmalı: flex:1 → panelMadde maks yüksekliğe oturunca ScrollView
  // sınırlı yükseklik alır ve metin İÇERİDE kayar (kutu büyümez).
  panelIcerikMadde: {
    flex: 1,
  },
  panelBaslik: {
    marginBottom: Spacing.one,
  },
  // Madde metni panel İÇİNDE kaydırılır → dış ekran sabit kalır (uzamaz).
  maddeKaydir: {
    flex: 1,
  },
  maddeYakinda: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  maddeAc: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  // 🎧/📄 — görselin ALTINDA yan yana 2 eşit buton.
  ikonSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  ikonBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Palette.altin,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  ikonBtnAktif: {
    backgroundColor: Palette.altinAcik2,
    borderColor: Palette.altinAcik2,
  },
  gizli: {
    display: 'none',
  },
  bildir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  cevapHata: {
    textAlign: 'center',
  },
  // Ses bitince "geçelim mi?" modalı — ekran-içi absoluteFill overlay (RN Modal DEĞİL).
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 31, 58, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    zIndex: 1000,
    elevation: 1000,
  },
  modalKart: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  modalBaslik: {
    textAlign: 'center',
  },
  modalAlt: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  modalOgrendim: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Palette.altin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  modalTekrar: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  modalIncele: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  modalBugunSorma: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  butonSatir: {
    flexDirection: 'row',
    gap: 12,
  },
  bildimBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    backgroundColor: Palette.lacivert,
    borderColor: Palette.altin,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  bildimDaire: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tekrarBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  btnPasif: {
    opacity: 0.45,
  },
});
