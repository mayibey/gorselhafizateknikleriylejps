import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioBar } from '@/components/card-flow/audio-bar';
import { StudyCard } from '@/components/card-flow/study-card';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getCardsByBolum, getCardsByLaw, getDailyQueue, recordReview } from '@/db/database';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

type Cozulen = { tekrar: number; yeni: number };

export default function AkisScreen() {
  const router = useRouter();
  const { lawId, bolumId } = useLocalSearchParams<{ lawId?: string; bolumId?: string }>();
  const bolumModu = bolumId != null && bolumId !== '';
  const kanunModu = lawId != null && lawId !== '';
  // Patika/kanun modu = günlük kuyruk DEĞİL (mesaj/etiket bunu kullanır).
  const tekKanun = bolumModu || kanunModu;
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hata, setHata] = useState(false);
  const [index, setIndex] = useState(0);
  const [cozulen, setCozulen] = useState<Cozulen>({ tekrar: 0, yeni: 0 });
  const [cevapHatasi, setCevapHatasi] = useState(false);

  const yukle = useCallback(() => {
    setHata(false);
    setQueue(null);
    setIndex(0);
    setCozulen({ tekrar: 0, yeni: 0 });
    // Öncelik: bölüm > kanun > günlük kuyruk. (Mevcut lawId/daily davranışı korunur.)
    const p = bolumModu
      ? getCardsByBolum(Number(bolumId))
      : kanunModu
        ? getCardsByLaw(Number(lawId))
        : getDailyQueue();
    void p.then(setQueue).catch(() => setHata(true));
  }, [bolumModu, bolumId, kanunModu, lawId]);

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
            ikon="clock-outline"
            baslik={tekKanun ? 'Yakında' : 'Bugünlük bitti'}
            aciklama={
              tekKanun
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

            <StudyCard card={queue[index]} />
            {/* Sesli anlatım kontrolü. key=kart id → kart değişince remount → önceki ses durur. */}
            <AudioBar key={queue[index].id} sesYolu={queue[index].ses_yolu} />

            {/* Hata/öneri bildir — aktif kart bilgisi otomatik gömülür (Formspree). */}
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
          </ScrollView>

          {/* Cevap butonları — ScrollView'ın dışında, kolonun altına sabit */}
          <View style={styles.altBlok}>
            {cevapHatasi ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.cevapHata}>
                Kaydedilemedi, tekrar dene.
              </AppText>
            ) : null}
            <View style={styles.butonSatir}>
              <Buton renk={Palette.yesil} etiket="Biliyorum" onPress={() => void cevapla('biliyorum')} />
              <Buton renk={Palette.amber} etiket="Tekrar" onPress={() => void cevapla('tekrar')} />
              <Buton renk={Palette.kirmizi} etiket="Zor" onPress={() => void cevapla('zor')} />
            </View>
          </View>
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
  butonSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buton: {
    flex: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
