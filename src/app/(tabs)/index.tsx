import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
    // Günün Maddesi + bugün çalışılan + zayıf mevzi — tek performans+kart yüklemesinden.
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
      })
      .catch(() => setGunMadde(null));
  }, []);

  useFocusEffect(yukle);

  const tekrarSayisi = queue?.filter((c) => !c.yeni).length ?? 0;
  const yeniSayisi = queue?.filter((c) => c.yeni).length ?? 0;
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
    <Screen title="Karargah">
      {/* A) Selamlama + branş/rütbe rozeti */}
      <View style={styles.selam}>
        <AppText variant="altBaslik" bold>
          Göreve hazır!
        </AppText>
        {bransAd || rutbeAd ? (
          <View style={styles.rozetSatir}>
            {bransAd ? <Chip ikon="account-group" metin={bransAd} /> : null}
            {rutbeAd ? <Chip ikon="chevron-triple-up" metin={rutbeAd} /> : null}
          </View>
        ) : null}
      </View>

      {/* Devam Et — kuyruk doluysa akışa götürür; boşsa "bugünlük bitti" */}
      {bos ? (
        <View style={[styles.devamEt, styles.devamEtBitti]}>
          <View style={styles.devamEtMetin}>
            <AppText variant="etiket" color="altin" bold>
              BUGÜNLÜK BİTTİ
            </AppText>
            <AppText variant="altBaslik" color="beyaz" bold>
              Tebrikler
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              Yarın yeni tekrarlar gelecek
            </AppText>
          </View>
          <MaterialCommunityIcons name="check-decagram" size={48} color={Palette.altin} />
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.devamEt, pressed && styles.pressed]}
          onPress={() => router.push('/akis')}>
          <View style={styles.devamEtMetin}>
            <AppText variant="etiket" color="altin" bold>
              DEVAM ET
            </AppText>
            <AppText variant="altBaslik" color="beyaz" bold>
              Kart Akışı
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              {tekrarSayisi + yeniSayisi > 0
                ? `${tekrarSayisi + yeniSayisi} kart seni bekliyor`
                : 'Kaldığın yerden çalış'}
            </AppText>
          </View>
          <MaterialCommunityIcons name="play-circle" size={48} color={Palette.altin} />
        </Pressable>
      )}

      {/* B) Bugünün Görevi — günlük hedef ilerleme çubuğu + Tekrar/Yeni */}
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

      {/* C) Zayıf mevzi kısayolu — zayıf kart varsa geri-besleme akışına götürür */}
      {zayifSayi > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.zayif, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}>
          <MaterialCommunityIcons name="target" size={28} color={Palette.amber} />
          <View style={styles.zayifMetin}>
            <AppText variant="kucuk" color="amber" bold>
              GERİ BESLEME
            </AppText>
            <AppText variant="kucuk" bold>
              {zayifSayi} zayıf mevzi — şimdi çalış
            </AppText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
        </Pressable>
      ) : null}

      {/* D) Metrik kartları — görsel cila (hazırlık çubuğu + nöbet alevi) */}
      <View style={styles.metrikSatir}>
        <View style={[styles.card, styles.metrik]}>
          <AppText variant="dev" bold>
            {hazirlik === null ? '—' : `%${hazirlik}`}
          </AppText>
          <Bar oran={(hazirlik ?? 0) / 100} />
          <AppText variant="kucuk" color="solukMetin">
            Çalışıldı
          </AppText>
        </View>
        <View style={[styles.card, styles.metrik]}>
          <View style={styles.nobetDeger}>
            {streak && streak > 0 ? (
              <MaterialCommunityIcons name="fire" size={22} color={Palette.amber} />
            ) : null}
            <AppText variant="dev" bold>
              {streak === null || streak === 0 ? '—' : `${streak}`}
            </AppText>
          </View>
          <AppText variant="kucuk" color="solukMetin">
            Nöbet serisi
          </AppText>
        </View>
      </View>

      {/* Günün Maddesi — gerçek karta bağlı; tıkla → o kanunun patikası */}
      {gunMadde ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/patika', params: { lawId: String(gunMadde.law_id) } })
          }>
          <AppText variant="etiket" color="solukMetin" bold>
            GÜNÜN MADDESİ
          </AppText>
          <AppText variant="altBaslik" bold>
            {gunMadde.madde_no} — {gunMadde.baslik}
          </AppText>
          <AppText variant="kucuk" color="solukMetin">
            {gunMadde.law_ad}
          </AppText>
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

/** İlerleme çubuğu (oran 0..1). */
function Bar({ oran }: { oran: number }) {
  const yuzde = Math.min(100, Math.max(0, oran * 100));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${yuzde}%` }]} />
    </View>
  );
}

function Gorev({ sayi, etiket }: { sayi: number; etiket: string }) {
  return (
    <View style={styles.gorev}>
      <AppText variant="baslik" bold>
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
  devamEt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
  },
  devamEtBitti: {
    opacity: 0.9,
  },
  devamEtMetin: {
    gap: Spacing.half,
  },
  card: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
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
  metrikSatir: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metrik: {
    flex: 1,
    alignItems: 'center',
  },
  nobetDeger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.kenarlik,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Palette.lacivert,
  },
});
