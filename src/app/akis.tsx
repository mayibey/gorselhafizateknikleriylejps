import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function AkisScreen() {
  // İçerik koruması: kart akışı açıkken ekran görüntüsü/kaydı engellenir (Android FLAG_SECURE).
  // Yalnız NATIVE'de — web'de expo-screen-capture API'si yok (çağrı atılırsa hata) → guard.
  useEffect(() => {
    if (Platform.OS === 'web') return;
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
  // Ses / Madde Metni sekmesi (görselin altında; açılışta ses açık).
  const [aktifSekme, setAktifSekme] = useState<'ses' | 'madde'>('ses');

  // Kart değişince açık sheet'i kapat + anlatım-bitti mesajını sıfırla + sekmeyi ses'e al.
  useEffect(() => {
    setMaddeAcik(false);
    setAnlatimBitti(false);
    setAktifSekme('ses');
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
              </View>
            </GestureDetector>

            {/* Alt blok — TEK dış scroll içinde (görsel kart başrol, kart içi scroll yok) */}
            <View style={styles.altBlok}>
            {/* Yan yana sekmeler: Sesli Anlatım | Madde Metni (görsel başrol; tek panel açık) */}
            <View style={styles.sekmeCubuk}>
              <Pressable
                onPress={() => setAktifSekme('ses')}
                style={[styles.sekme, aktifSekme === 'ses' ? styles.sekmeAktif : styles.sekmePasif]}
                accessibilityRole="button"
                accessibilityLabel="Sesli Anlatım sekmesi">
                <MaterialCommunityIcons
                  name="volume-high"
                  size={18}
                  color={aktifSekme === 'ses' ? Palette.lacivert : Palette.kartMetinIkincil}
                />
                <AppText variant="kucuk" bold color={aktifSekme === 'ses' ? 'lacivert' : 'kartMetinIkincil'}>
                  Sesli Anlatım
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setAktifSekme('madde')}
                style={[styles.sekme, aktifSekme === 'madde' ? styles.sekmeAktif : styles.sekmePasif]}
                accessibilityRole="button"
                accessibilityLabel="Madde Metni sekmesi">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={aktifSekme === 'madde' ? Palette.lacivert : Palette.kartMetinIkincil}
                />
                <AppText variant="kucuk" bold color={aktifSekme === 'madde' ? 'lacivert' : 'kartMetinIkincil'}>
                  Madde Metni
                </AppText>
              </Pressable>
            </View>

            {/* SES paneli — display ile gizlenir (TtsBar mount KALIR → TTS kesilmez). */}
            <View style={aktifSekme === 'ses' ? null : styles.gizli}>
              <TtsBar
                key={queue[index].id}
                gorselYolu={queue[index].gorsel_yolu}
                onBitti={() => setAnlatimBitti(true)}
              />
            </View>

            {/* MADDE paneli — yalnız madde sekmesinde (başlık sekme; daha çok satır) */}
            {aktifSekme === 'madde' ? (
              maddeTxt !== null ? (
                <View style={styles.maddeKart}>
                  <AppText variant="kucuk" color="anaMetin" numberOfLines={8}>
                    {maddeTxt}
                  </AppText>
                  <View style={styles.maddeAyirici} />
                  <Pressable
                    onPress={() => setMaddeAcik(true)}
                    style={({ pressed }) => [styles.maddeAc, pressed && styles.pressed]}>
                    <AppText variant="kucuk" bold color="altinKoyu">
                      Tam metni aç
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
    padding: Spacing.three,
    paddingBottom: Spacing.four, // sabit footer'ın hemen üstünde nefes payı
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
    left: -6,
  },
  okSag: {
    right: -6,
  },
  okPasif: {
    opacity: 0.25,
  },
  altBlok: {
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
  // Ses | Madde sekmeleri
  sekmeCubuk: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sekme: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.m,
    borderWidth: 1,
  },
  sekmeAktif: {
    backgroundColor: Palette.altinAcik2,
    borderColor: Palette.altinAcik2,
  },
  sekmePasif: {
    backgroundColor: Palette.kartYuzeyKoyu,
    borderColor: Palette.kartKenarKoyu,
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
