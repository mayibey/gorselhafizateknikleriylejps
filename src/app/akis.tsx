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

  // Kart değişince açık sheet'i kapat + anlatım-bitti mesajını sıfırla.
  useEffect(() => {
    setMaddeAcik(false);
    setAnlatimBitti(false);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* Üst krom: kapat + aktif kart meta (madde no + ilerleme) + blok rozeti */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={Palette.beyaz} />
        </Pressable>
        {aktif ? (
          <View style={styles.headerMeta}>
            <AppText variant="govde" color="beyaz" bold numberOfLines={1} ellipsizeMode="tail">
              {queue![index].baslik
                ? `${queue![index].madde_no} — ${queue![index].baslik}`
                : queue![index].madde_no}
            </AppText>
            <AppText variant="etiket" color="kenarlik">
              {index + 1} / {queue!.length}
            </AppText>
          </View>
        ) : (
          <View style={styles.headerMeta} />
        )}
        {aktif && queue![index].blok === 'müşterek' ? (
          <View style={styles.headerRozet}>
            <AppText variant="etiket" color="lacivert" bold>
              Müşterek
            </AppText>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {hata ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="alert-circle-outline"
            ikonRenk="kirmizi"
            baslik="Yüklenemedi"
            aciklama="Kartlar yüklenemedi."
            buton={{ etiket: 'Tekrar dene', onPress: yukle }}
          />
        </View>
      ) : queue === null ? (
        <View style={styles.kolon}>
          <Loading />
        </View>
      ) : queue.length === 0 ? (
        // Boş başlangıç: bu kanunda hiç kart yok ("yakında").
        <View style={styles.kolon}>
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
        <View style={styles.kolon}>
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
          {/* Üst blok kaydırılabilir; kart ne kadar uzun olursa olsun butonlar pinli kalır */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${((index + 1) / queue.length) * 100}%` }]} />
            </View>

            {/* Kartı saran katman: yatay swipe (ileri/geri) + sol/sağ kenarda gezinme okları
                (saf görünüm — SRS'e dokunmaz, yalnız index değiştirir). İlk kartta sol, son
                kartta sağ ok pasif. */}
            <GestureDetector gesture={kartKaydir}>
              <View style={styles.kartSar}>
                <StudyCard card={queue[index]} />
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

            {/* Sesli anlatım (TTS) — metni olan kartta görünür; kart değişince remount → durur. */}
            <TtsBar
              key={queue[index].id}
              gorselYolu={queue[index].gorsel_yolu}
              onBitti={() => setAnlatimBitti(true)}
            />

            {/* Madde Metni — resmî tam metin. Metin varsa aktif, yoksa soluk "yakında". */}
            {maddeMetni(queue[index].madde_no) !== null ? (
              <Pressable
                style={({ pressed }) => [styles.maddeBtn, pressed && styles.pressed]}
                onPress={() => setMaddeAcik(true)}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={Palette.lacivert} />
                <AppText variant="kucuk" color="lacivert" bold>
                  Madde Metni
                </AppText>
              </Pressable>
            ) : (
              <View style={[styles.maddeBtn, styles.maddeBtnPasif]}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={Palette.solukMetin} />
                <AppText variant="kucuk" color="solukMetin">
                  Madde metni yakında
                </AppText>
              </View>
            )}

            {/* Hata/öneri bildir — aktif kart bilgisi otomatik gömülür (Formspree).
               Posta adresi (FORMSPREE_ENDPOINT) boşken GİZLİ: mesaj hiçbir yere gitmeyeceği
               için "gönderildi" yanılgısı olmasın. Adres config'e yazılınca otomatik geri gelir. */}
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
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Palette.solukMetin} />
                <AppText variant="etiket" color="solukMetin">
                  Hata/öneri bildir
                </AppText>
              </Pressable>
            ) : null}
          </ScrollView>

          {/* Cevap butonları — ScrollView'ın dışında, kolonun altına sabit */}
          <View style={styles.altBlok}>
            {cevapHatasi ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.cevapHata}>
                Kaydedilemedi, tekrar dene.
              </AppText>
            ) : null}
            {anlatimBitti ? (
              /* Sesli anlatım bittiğinde: sıradaki konu + tek "devam" düğmesi. */
              <>
                <AppText variant="kucuk" bold style={styles.siradaki}>
                  {index + 1 < queue.length
                    ? `Sıradaki konu: ${queue[index + 1].baslik}`
                    : 'Bu turun son kartı'}
                </AppText>
                <Pressable
                  style={({ pressed }) => [styles.devamBtn, pressed && styles.pressed]}
                  onPress={() => void cevapla('biliyorum')}>
                  <AppText variant="govde" color="beyaz" bold>
                    {index + 1 < queue.length ? 'Tamam, sıradakine geç ▶' : 'Tamam, turu bitir'}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <View style={styles.butonSatir}>
                <Buton
                  renk={Palette.yesil}
                  etiket="Biliyorum"
                  onPress={() => void cevapla('biliyorum')}
                />
                <Buton
                  renk={Palette.amber}
                  etiket="Tekrar Hatırlat"
                  onPress={() => void cevapla('zor')}
                />
              </View>
            )}
          </View>

          {/* Madde metni sheet'i — ScrollView/alt blok ile KARDEŞ (absoluteFill).
              Açıkken cevap butonlarının da üstünü örter → yanlışlıkla index kayması olmaz. */}
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

function Buton({ renk, etiket, onPress }: { renk: string; etiket: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.buton, { backgroundColor: renk }, pressed && styles.pressed]}
      onPress={onPress}>
      <AppText variant="govde" color="beyaz" bold>
        {etiket}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
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
  // Ortak "telefon kolonu": web'de ortalanır, dar ekranda tam en.
  kolon: {
    flex: 1,
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.kenarlik,
    overflow: 'hidden',
  },
  kartSar: {
    position: 'relative',
    justifyContent: 'center',
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
  fill: {
    height: '100%',
    backgroundColor: Palette.lacivert,
  },
  altBlok: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  cevapHata: {
    textAlign: 'center',
  },
  bildir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  maddeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  maddeBtnPasif: {
    opacity: 0.55,
  },
  butonSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buton: {
    flex: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  siradaki: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  devamBtn: {
    backgroundColor: Palette.yesil,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
