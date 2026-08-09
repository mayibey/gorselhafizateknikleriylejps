/**
 * KALDIĞIN YER KARTI — KARARGAH (9 Ağu 2026 gece, başkan: "şu bölümü Karargah'a
 * alsak mantıklı olur mu?" → alındı; bayraklı).
 *
 * Mevzuat'ın üstündeki kompakt "Devam Et" kartının Karargah'a taşınmış hâli.
 * Mevzuat'taki mükerrerliği bitirir (aynı kanun hem üst kartta hem listede
 * görünüyordu); "nereden devam edeyim" sorusunun cevabı artık ana ekranda.
 * Veri hattı mevzuat.tsx ile aynı: bölüme bağlı kart kümesi payda, kutu≥1 pay;
 * devam kanunu sonCalisilanKanun'dan. Hiç çalışma yoksa kart hiç görünmez.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards, getBolumKartIds, getLaws, getPerformans, getStudyCards } from '@/db/database';
import type { LawWithCount } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { sonCalisilanKanun } from '@/lib/devamet';

type Durum = { law: LawWithCount; calisilan: number; toplam: number; siradaki: boolean } | null;

export function KaldiginYerKarti() {
  const router = useRouter();
  const { brans } = useBrans();
  const [durum, setDurum] = useState<Durum>(null);

  const yukle = useCallback(() => {
    if (!brans) return;
    void Promise.all([getLaws(brans), getStudyCards(), getAllCards(), getPerformans(), getBolumKartIds()])
      .then(([laws, studied, allCards, perf, bolumKartIds]) => {
        const bagli = new Set(bolumKartIds);
        const toplamMap = new Map<number, number>();
        for (const c of allCards) if (bagli.has(c.id)) toplamMap.set(c.law_id, (toplamMap.get(c.law_id) ?? 0) + 1);
        const ilerleme = new Map<number, number>();
        for (const c of studied) {
          if (c.kutu >= 1 && bagli.has(c.id)) ilerleme.set(c.law_id, (ilerleme.get(c.law_id) ?? 0) + 1);
        }
        const cardLawMap = new Map<number, number>();
        for (const c of allCards) cardLawMap.set(c.id, c.law_id);
        const lawIlerleme = new Map<number, { calisilan: number; toplam: number }>();
        for (const l of laws) {
          lawIlerleme.set(l.id, { calisilan: ilerleme.get(l.id) ?? 0, toplam: toplamMap.get(l.id) ?? 0 });
        }
        const devam = sonCalisilanKanun(perf, cardLawMap, lawIlerleme);
        if (devam.tip !== 'devam' && devam.tip !== 'siradaki') {
          setDurum(null);
          return;
        }
        const law = laws.find((l) => l.id === devam.lawId);
        if (!law) {
          setDurum(null);
          return;
        }
        setDurum({
          law,
          calisilan: ilerleme.get(law.id) ?? 0,
          toplam: toplamMap.get(law.id) ?? 0,
          siradaki: devam.tip === 'siradaki',
        });
      })
      .catch(() => setDurum(null));
  }, [brans]);
  useFocusEffect(yukle);

  if (!durum) return null;
  const yuzde = durum.toplam > 0 ? Math.round((durum.calisilan / durum.toplam) * 100) : 0;
  const no = durum.law.ad.match(/^(\d+)/)?.[1] ?? null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/patika', params: { lawId: String(durum.law.id) } })}
      style={({ pressed }) => [st.kart, pressed && st.basili]}
      accessibilityRole="button"
      accessibilityLabel="Çalışmaya devam et">
      <View style={st.monogram}>
        {no ? (
          <AppText
            variant="govde"
            bold
            color="altin"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={st.monogramYazi}>
            {no}
          </AppText>
        ) : (
          <MaterialCommunityIcons name="book-outline" size={17} color={Palette.altin} />
        )}
      </View>
      <View style={st.orta}>
        <AppText variant="kucuk" bold color="anaMetin" numberOfLines={1}>
          {durum.law.ad}
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          {durum.siradaki ? 'Sıradaki kanun' : 'Kaldığın yer'} · {durum.calisilan}/{durum.toplam} · %{yuzde}
        </AppText>
      </View>
      <View style={st.buton}>
        <MaterialCommunityIcons name="play" size={15} color={Palette.lacivert} />
        <AppText variant="etiket" bold color="lacivert">
          Devam
        </AppText>
      </View>
    </Pressable>
  );
}

/**
 * GENEL TATBİKAT GİRİŞİ — Karargah (9 Ağu gece, başkan: "tatbikatı da al oraya").
 * Talim sekmesi bardan kalkınca genel deneme sınavlarına giden kapı kalmamıştı;
 * artık Kaldığın Yer'in altındaki bu ince satır. /tatbikat rotası yaşıyor (href:null).
 */
export function TatbikatGirisi() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/tatbikat')}
      style={({ pressed }) => [st.kart, pressed && st.basili]}
      accessibilityRole="button"
      accessibilityLabel="Genel Tatbikat — deneme sınavları">
      <View style={st.monogram}>
        <MaterialCommunityIcons name="target" size={20} color={Palette.altin} />
      </View>
      <View style={st.orta}>
        <AppText variant="kucuk" bold color="anaMetin" numberOfLines={1}>
          Genel Tatbikat
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          Karma deneme sınavları — kendini dene
        </AppText>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  basili: { opacity: 0.85 },
  monogram: {
    width: 40,
    height: 40,
    borderRadius: Radius.m,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramYazi: { paddingHorizontal: 2, textAlign: 'center' },
  orta: { flex: 1, gap: 1 },
  buton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
