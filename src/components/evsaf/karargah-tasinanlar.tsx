/**
 * KARARGAH'TAN TAŞINANLAR — EVSAF (9 Ağu 2026 gece, bayraklı; hiçbir şey silinmedi).
 * Gece kararları K3+K5 uyarınca Karargah'tan kaldırılan parçaların yeni evi:
 *  - IstatistikKutulari: Genel ilerleme · Nöbet serisi · Zayıf mevzi (K3).
 *  - DuyurularSatiri: megafonun yerine Evsaf'ta satır — okunmamış varsa kırmızı nokta (K5).
 * Veri hattı Karargah'takiyle birebir aynı fonksiyonlar; görünüş sade kutu/satır.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getCardCount, getStudyCards, getStudyDays, getZayifKuyruk } from '@/db/database';
import { duyurulariGetir, okunmamisVarMi } from '@/lib/duyuru';
import { calisilabilirZayif } from '@/lib/gorsel-kaynak';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';
import { useUyelik } from '@/lib/uyelik-context';

export function IstatistikKutulari() {
  const router = useRouter();
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [bekleyen, setBekleyen] = useState(0);

  const yukle = useCallback(() => {
    void Promise.all([getStudyCards(), getCardCount()])
      .then(([studied, toplam]) => {
        const ist = hesaplaIstatistik(studied, toplam);
        setHazirlik(ist.toplamKart > 0 ? Math.round((ist.calisilanKart / ist.toplamKart) * 100) : 0);
      })
      .catch(() => setHazirlik(null));
    void getStudyDays()
      .then((gunler) => setStreak(hesaplaStreak(gunler, bugunISO())))
      .catch(() => setStreak(null));
    void getZayifKuyruk()
      .then((q) => setBekleyen(calisilabilirZayif(q).length))
      .catch(() => setBekleyen(0));
  }, []);
  useFocusEffect(yukle);

  return (
    <View style={st.kutuSatir}>
      <View style={st.kutu}>
        <AppText variant="dev" bold color="anaMetin">
          %{hazirlik ?? 0}
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          Genel ilerleme
        </AppText>
      </View>
      <View style={st.kutu}>
        <View style={st.kutuDeger}>
          {streak && streak > 0 ? (
            <MaterialCommunityIcons name="fire" size={22} color={Palette.amber} />
          ) : null}
          <AppText variant="dev" bold color="anaMetin">
            {streak === null || streak === 0 ? '—' : `${streak}`}
          </AppText>
        </View>
        {/* GECE KARARI E3: seri gurur dilidir, baskı değil — kesildiyse "yeni nöbet bugün başlar". */}
        <AppText variant="etiket" color="solukMetin" style={st.kutuEtiket} numberOfLines={2}>
          {streak && streak > 0 ? 'Nöbet serisi' : 'Yeni nöbet bugün başlar'}
        </AppText>
      </View>
      <Pressable
        disabled={bekleyen === 0}
        onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
        style={({ pressed }) => [st.kutu, (pressed || bekleyen === 0) && st.soluk]}
        accessibilityRole="button"
        accessibilityLabel="Zayıf mevzileri çalış">
        <View style={st.kutuDeger}>
          <MaterialCommunityIcons name="target" size={20} color={Palette.altinKoyu} />
          <AppText variant="dev" bold color="anaMetin">
            {bekleyen}
          </AppText>
        </View>
        <AppText variant="etiket" color="solukMetin">
          Zayıf mevzi
        </AppText>
      </Pressable>
    </View>
  );
}

export function DuyurularSatiri() {
  const router = useRouter();
  const { premium } = useUyelik();
  const [okunmamis, setOkunmamis] = useState(false);
  const yukle = useCallback(() => {
    let iptal = false;
    void duyurulariGetir(premium)
      .then(async (liste) => {
        if (!iptal) setOkunmamis(await okunmamisVarMi(liste));
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, [premium]);
  useFocusEffect(yukle);

  return (
    <Pressable
      onPress={() => router.push('/duyurular')}
      style={({ pressed }) => [st.satir, pressed && st.soluk]}
      accessibilityRole="button"
      accessibilityLabel="Duyurular">
      <MaterialCommunityIcons name="bullhorn-outline" size={20} color={Palette.altinKoyu} />
      <AppText variant="kucuk" bold color="anaMetin" style={st.satirAd}>
        Duyurular
      </AppText>
      {okunmamis ? <View style={st.nokta} /> : null}
      <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  kutuSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kutu: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  kutuDeger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  kutuEtiket: { textAlign: 'center' },
  soluk: { opacity: 0.7 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  satirAd: { flex: 1 },
  nokta: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.kirmizi,
  },
});
