import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Komşu kart önyükleme (prefetch) registry — bundle görselleri (require asset id).
import { KART_GORSELLERI } from '../assets/kart-gorselleri';
import { MaddeMetniSheet } from '@/components/card-flow/madde-metni-sheet';
import { StudyCard } from '@/components/card-flow/study-card';
import { TtsBar } from '@/components/card-flow/tts-bar';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { FORMSPREE_ENDPOINT } from '@/constants/config';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getAyar } from '@/lib/bildirim';
import {
  getCardsByBolumChain,
  getCardsByLaw,
  getDailyQueue,
  getZayifKuyruk,
  recordReview,
} from '@/db/database';
import { maddeMetni } from '@/db/madde-metinleri';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

type Cozulen = { tekrar: number; yeni: number };

// Swipe için yatay eşik (px): bundan fazla yatay sürükleme kartı değiştirir.
const SWIPE_ESIK = 45;

/** Günlük kuyruğu kullanıcının "oturum başına kart" hedefine göre sınırlar (Eğitim Planı). */
async function gunlukSinirli(): Promise<QueueCard[]> {
  const [ayar, kuyruk] = await Promise.all([getAyar(), getDailyQueue()]);
  return kuyruk.slice(0, ayar.gunlukKart);
}

// GEÇİCİ: SS almak için kapatıldı, geri açılacak → true yapınca koruma geri gelir.
const EKRAN_KORUMA_AKTIF = false;

export default function AkisScreen() {
  // İçerik koruması: kart akışı açıkken ekran görüntüsü/kaydı engellenir (Android FLAG_SECURE).
  // Yalnız NATIVE'de — web'de expo-screen-capture API'si yok (çağrı atılırsa hata) → guard.
  // GEÇİCİ: EKRAN_KORUMA_AKTIF=false iken koruma UYGULANMAZ (SS almak için kapatıldı).
  useEffect(() => {
    if (!EKRAN_KORUMA_AKTIF || Platform.OS === 'web') return;
    void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);
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
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hata, setHata] = useState(false);
  const [index, setIndex] = useState(0);
  const [cozulen, setCozulen] = useState<Cozulen>({ tekrar: 0, yeni: 0 });
  const [cevapHatasi, setCevapHatasi] = useState(false);
  // Madde metni sheet'i (ekran-içi overlay; queue/index/SRS'e dokunmaz).
  const [maddeAcik, setMaddeAcik] = useState(false);
  // Sesli anlatım sonuna kadar okununca true → "sıradakine geç" mesajı çıkar.
  const [anlatimBitti, setAnlatimBitti] = useState(false);
  // Yan ikon toggle'ları (sekme YOK): ses kontrol paneli açık mı / madde paneli genişledi mi.
  // Ses OTOMATİK çalar (TtsBar mount'ta); bu bayraklar yalnız kontrolleri/önizlemeyi gösterir.
  const [sesAcik, setSesAcik] = useState(false);
  const [maddeGenis, setMaddeGenis] = useState(false);

  // Kart değişince: açık sheet'i kapat + anlatım-bitti sıfırla + yan panelleri kapat.
  useEffect(() => {
    setMaddeAcik(false);
    setAnlatimBitti(false);
    setSesAcik(false);
    setMaddeGenis(false);
  }, [index]);

  const yukle = useCallback(() => {
    setHata(false);
    setQueue(null);
    setIndex(0);
    setCozulen({ tekrar: 0, yeni: 0 });
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

  const bitti = queue !== null && queue.length > 0 && index >= queue.length;
  const aktif = !hata && queue !== null && queue.length > 0 && index < queue.length;
  // Patika/kanun modunda geri = patika (Mevzuat → patika → akış); günlükte Karargah.
  const geriEtiket = tekKanun ? 'Geri dön' : "Karargah'a dön";
  const ozetMetin = tekKanun
    ? `${cozulen.tekrar + cozulen.yeni} kart çalıştın.`
    : `Bugün ${cozulen.tekrar} tekrar · ${cozulen.yeni} yeni kart çalıştın.`;

  // Kart üzerinde yatay swipe = ileri/geri (oklarla aynı; SADECE index, SRS'e dokunmaz).
  // Yatay-only: tap zoom'a, dikey sürükleme ScrollView'a kalır. runOnJS → worklet gerekmez.
  const sonIdx = (queue?.length ?? 1) - 1;
  const kartKaydir = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX <= -SWIPE_ESIK) setIndex((i) => Math.min(sonIdx, i + 1));
      else if (e.translationX >= SWIPE_ESIK) setIndex((i) => Math.max(0, i - 1));
    });

  const c = aktif ? queue![index] : null;
  const yuzde = aktif ? Math.round(((index + 1) / queue!.length) * 100) : 0;
  const maddeTxt = c ? maddeMetni(c.madde_no) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* KOYU header: kapat + kart meta (madde no + X/Y) + blok rozeti + ilerleme */}
      <View style={styles.header}>
        <View style={styles.headerUst}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Kapat">
            <MaterialCommunityIcons name="close" size={26} color={Palette.kartMetinAcik} />
          </Pressable>
          {aktif && c ? (
            <View style={styles.headerMeta}>
              <AppText
                variant="govde"
                color="kartMetinAcik"
                bold
                numberOfLines={1}
                ellipsizeMode="tail">
                {c.baslik ? `${c.madde_no} — ${c.baslik}` : c.madde_no}
              </AppText>
              <AppText variant="etiket" color="kartMetinIkincil">
                {index + 1} / {queue!.length}
              </AppText>
            </View>
          ) : (
            <View style={styles.headerMeta}>
              <AppText variant="govde" color="kartMetinAcik" bold>
                Kart Akışı
              </AppText>
            </View>
          )}
          {aktif && c?.blok === 'müşterek' ? (
            <View style={styles.headerRozet}>
              <AppText variant="etiket" color="lacivert" bold>
                Müşterek
              </AppText>
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {aktif ? (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${yuzde}%` }]} />
            </View>
            <AppText variant="etiket" bold color="altinAcik2" style={styles.yuzdeMetin}>
              %{yuzde}
            </AppText>
          </>
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
      ) : bitti ? (
        // Çalışıp tükenince: tamamlandı.
        <View style={styles.durumKolon}>
          <EmptyState
            ikon="check-decagram"
            ikonRenk="yesil"
            baslik="Bu turu tamamladın"
            aciklama={ozetMetin}
            buton={{ etiket: geriEtiket, onPress: () => router.back() }}
          />
        </View>
      ) : (
        <View style={styles.kolon}>
          {/* TEK dış scroll: görsel kart + alt blok burada akar (görsel kart İÇİNDE scroll YOK) */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Kartı saran katman: yatay swipe (ileri/geri) + sol/sağ kenarda gezinme okları
                (saf görünüm — SRS'e dokunmaz, yalnız index değiştirir). */}
            <GestureDetector gesture={kartKaydir}>
              <View style={styles.kartSar}>
                <View style={styles.gorselSar}>
                  <StudyCard card={queue[index]} />
                </View>
                <Pressable
                  disabled={index === 0}
                  onPress={() => setIndex((i) => Math.max(0, i - 1))}
                  style={[styles.okBtn, styles.okSol, index === 0 && styles.okPasif]}
                  hitSlop={8}
                  accessibilityLabel="Önceki kart">
                  <MaterialCommunityIcons name="chevron-left" size={32} color={Palette.beyaz} />
                </Pressable>
                <Pressable
                  disabled={index >= queue.length - 1}
                  onPress={() => setIndex((i) => Math.min(queue.length - 1, i + 1))}
                  style={[styles.okBtn, styles.okSag, index >= queue.length - 1 && styles.okPasif]}
                  hitSlop={8}
                  accessibilityLabel="Sonraki kart">
                  <MaterialCommunityIcons name="chevron-right" size={32} color={Palette.beyaz} />
                </Pressable>

                {/* Sağ-alt 2 dikey ikon (sekme DEĞİL → toggle): ses kontrolleri / madde paneli.
                    Aktifken altın dolu, pasifken altın çerçeve. */}
                <View style={styles.yanIkonlar}>
                  <Pressable
                    onPress={() => setSesAcik((v) => !v)}
                    style={styles.yanBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Sesli anlatım kontrolleri">
                    <View style={[styles.yanDaire, sesAcik && styles.yanDaireAktif]}>
                      <MaterialCommunityIcons
                        name="headphones"
                        size={22}
                        color={sesAcik ? Palette.lacivert : Palette.altinAcik2}
                      />
                    </View>
                    <AppText variant="etiket" bold color="kartMetinAcik" style={styles.yanEtiket}>
                      Sesli Anlatım
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => setMaddeGenis((v) => !v)}
                    style={styles.yanBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Madde metni paneli">
                    <View style={[styles.yanDaire, maddeGenis && styles.yanDaireAktif]}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={22}
                        color={maddeGenis ? Palette.lacivert : Palette.altinAcik2}
                      />
                    </View>
                    <AppText variant="etiket" bold color="kartMetinAcik" style={styles.yanEtiket}>
                      Madde Metni
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            {/* Komşu kartların (index±1) görselini ÖNDEN decode et (opacity 0, tam ölçü →
                cache'e doğru boyutta girer) → swipe/sonraki kart anında hazır. */}
            <View style={styles.onyukle} pointerEvents="none">
              {[index - 1, index + 1].map((i) => {
                const k = queue[i];
                const g = k && k.gorsel_yolu ? KART_GORSELLERI[k.gorsel_yolu] : null;
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

            {/* Alt blok — TEK dış scroll içinde (görsel kart başrol, kart içi scroll yok) */}
            <View style={styles.altBlok}>
            {/* SES kontrol paneli — sesAcik ile aç/kapa (display; TtsBar mount KALIR →
                otomatik çalan ses kesilmez). Ses, panel kapalıyken de çalar. */}
            <View style={sesAcik ? null : styles.gizli}>
              <TtsBar
                key={queue[index].id}
                gorselYolu={queue[index].gorsel_yolu}
                onBitti={() => setAnlatimBitti(true)}
              />
            </View>

            {/* MADDE METNİ paneli — DEFAULT KAPALI; yalnız 📄 ikonuyla açılınca görünür. */}
            {maddeGenis ? (
              maddeTxt !== null ? (
                <View style={styles.maddeKart}>
                  <Pressable
                    onPress={() => setMaddeGenis(false)}
                    style={styles.maddeBaslik}
                    accessibilityRole="button"
                    accessibilityLabel="Madde metnini kapat">
                    <MaterialCommunityIcons name="file-document-outline" size={18} color={Palette.altinKoyu} />
                    <AppText variant="kucuk" bold color="anaMetin" style={styles.maddeBaslikAd}>
                      Madde Metni
                    </AppText>
                    <AppText variant="etiket" color="solukMetin">
                      kapat
                    </AppText>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={Palette.solukMetin} />
                  </Pressable>
                  <AppText variant="kucuk" color="anaMetin" numberOfLines={30}>
                    {maddeTxt}
                  </AppText>
                  <View style={styles.maddeAyirici} />
                  <Pressable
                    onPress={() => setMaddeAcik(true)}
                    style={({ pressed }) => [styles.maddeAc, pressed && styles.pressed]}>
                    <AppText variant="kucuk" bold color="altinKoyu">
                      Tam metni aç →
                    </AppText>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.maddeKart, styles.maddeKartPasif]}>
                  <MaterialCommunityIcons name="file-document-outline" size={22} color={Palette.solukMetin} />
                  <AppText variant="kucuk" color="solukMetin">
                    Madde metni yakında
                  </AppText>
                </View>
              )
            ) : null}

            {/* Hata/öneri bildir — FORMSPREE_ENDPOINT boşken gizli. */}
            {FORMSPREE_ENDPOINT ? (
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
            ) : null}

            </View>
          </ScrollView>

          {/* SABİT footer — cevap butonları her zaman altta (scroll DIŞINDA). */}
          <View style={styles.footer}>
            {cevapHatasi ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.cevapHata}>
                Kaydedilemedi, tekrar dene.
              </AppText>
            ) : null}
            {anlatimBitti ? (
              /* Sesli anlatım bittiğinde: sıradaki konu + tek "devam" düğmesi. */
              <>
                <AppText variant="kucuk" bold color="kartMetinIkincil" style={styles.siradaki}>
                  {index + 1 < queue.length
                    ? `Sıradaki konu: ${queue[index + 1].baslik}`
                    : 'Bu turun son kartı'}
                </AppText>
                <Pressable
                  style={({ pressed }) => [styles.devamBtn, pressed && styles.pressed]}
                  onPress={() => void cevapla('biliyorum')}>
                  <AppText variant="govde" color="kartMetinAcik" bold>
                    {index + 1 < queue.length ? 'Tamam, sıradakine geç ▶' : 'Tamam, turu bitir'}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <View style={styles.butonSatir}>
                <Pressable
                  style={({ pressed }) => [styles.bildimBtn, pressed && styles.pressed]}
                  onPress={() => void cevapla('biliyorum')}>
                  <View style={styles.bildimDaire}>
                    <MaterialCommunityIcons name="check-bold" size={18} color={Palette.lacivert} />
                  </View>
                  <AppText variant="govde" color="kartMetinAcik" bold>
                    Bildim
                  </AppText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.tekrarBtn, pressed && styles.pressed]}
                  onPress={() => void cevapla('zor')}>
                  <MaterialCommunityIcons name="refresh" size={20} color={Palette.altinKoyu} />
                  <AppText variant="govde" color="altinKoyu" bold>
                    Tekrar Hatırlat
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Madde metni sheet'i — kolon ile KARDEŞ (absoluteFill). */}
          <MaddeMetniSheet
            gorunur={maddeAcik}
            maddeNo={queue[index].madde_no}
            baslik={queue[index].baslik}
            onKapat={() => setMaddeAcik(false)}
          />
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
  headerMeta: {
    flex: 1,
    alignItems: 'center',
  },
  headerRozet: {
    backgroundColor: Palette.altin,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.kartKenarKoyu,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.altinAcik2,
  },
  yuzdeMetin: {
    textAlign: 'center',
  },
  // Ortak "telefon kolonu": web'de ortalanır, dar ekranda tam en.
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // Kısa içerik dikey ORTALANSIN → görsel+sekme+panel bloğu ortada, footer'la
    // arasındaki ölü boşluk dengelenir (tek dipte dev boşluk kalmaz).
    justifyContent: 'center',
    // Görsel TAM EKRAN genişliği (full-bleed) → en büyük render. Diğer modüller
    // (sekme/panel/bildir) altBlok'ta kendi yatay padding'ini alır.
    paddingHorizontal: 0,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  kartSar: {
    position: 'relative',
    justifyContent: 'center',
  },
  gorselSar: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Palette.altin,
    backgroundColor: Palette.kartKremi,
    overflow: 'hidden',
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
  okBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.lacivert,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 2,
  },
  okSol: {
    left: 6,
  },
  okSag: {
    right: 6,
  },
  okPasif: {
    opacity: 0.25,
  },
  altBlok: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  // Sabit alt footer (ScrollView dışında) — cevap butonları her zaman erişilir.
  footer: {
    borderTopColor: Palette.kartKenarKoyu,
    borderTopWidth: 1,
    backgroundColor: Palette.kartZeminKoyu,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  // Görsel sağ kenarı, alt-orta: 2 dikey toggle ikonu (ses / madde). bottom '16%' →
  // görselin alt rozet/konuşma-balonu şeridinin ÜSTÜNDE kalır (içeriği ezmez), okSag
  // (dikey ortadaki ileri oku) ile de çakışmaz (onun altında).
  yanIkonlar: {
    position: 'absolute',
    right: 8,
    bottom: '16%',
    gap: Spacing.two,
    alignItems: 'center',
    zIndex: 3,
  },
  yanBtn: {
    width: 64,
    alignItems: 'center',
    gap: Spacing.half,
  },
  yanDaire: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,23,48,0.72)', // koyu yarı-saydam → görsel üstünde okunur
    borderWidth: 1.5,
    borderColor: Palette.altin,
  },
  yanDaireAktif: {
    backgroundColor: Palette.altinAcik2,
    borderColor: Palette.altinAcik2,
  },
  yanEtiket: {
    textAlign: 'center',
  },
  gizli: {
    display: 'none',
  },
  // Madde Metni kartı (krem — koyu ekranda kontrast)
  maddeKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  maddeKartPasif: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    opacity: 0.7,
  },
  maddeBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  maddeBaslikAd: {
    flex: 1,
  },
  maddeAyirici: {
    height: 1,
    backgroundColor: Palette.kenarlik,
    marginTop: Spacing.one,
  },
  maddeAc: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
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
  siradaki: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  devamBtn: {
    height: 58,
    borderRadius: 18,
    backgroundColor: Palette.lacivert,
    borderColor: Palette.altin,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
});
