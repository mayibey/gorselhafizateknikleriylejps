/**
 * GÜNÜN MADDESİ — MEVZUAT LİSTESİ ALTI (9 Ağu 2026 gece; GECE KARARI K4, bayraklı).
 * Karargah'tan taşındı (orada günlük görevle aynı işi iki kez teklif ediyordu).
 * Seçim mantığı Karargah'takiyle birebir: yalnız normal tek-madde kartları
 * (özet/ayırt/yer-tutucu elenir), yalnız ERİŞİLEBİLİR kanunlardan (premium sızıntı
 * kapısı), tarihe göre rotasyon. Basınca: kanun indirilmişse doğrudan o kart;
 * inmemişse patika (indirme kapısı orada).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards } from '@/db/database';
import type { CardWithLaw } from '@/db/schema';
import { LAW_KLASOR } from '@/db/seed';
import { lawErisilebilirSaf } from '@/lib/icerik-kilidi';
import { kanunIndirilmisMi } from '@/lib/indirme';
import { maddeEtiket } from '@/lib/madde-etiket';
import { bugunISO } from '@/lib/srs';
import { useUyelik } from '@/lib/uyelik-context';

export function GununMaddesiKarti() {
  const router = useRouter();
  const { premium } = useUyelik();
  const [madde, setMadde] = useState<CardWithLaw | null>(null);

  const yukle = useCallback(() => {
    void getAllCards()
      .then((cards) => {
        const ozetAyirtMi = (yol: string | null) => !!yol && /_(ayirt|ozet)(_|$)/i.test(yol);
        const adaylar = cards.filter(
          (c) =>
            !ozetAyirtMi(c.gorsel_yolu) &&
            !/^Madde\s/i.test(c.baslik) &&
            lawErisilebilirSaf(c.law_id, premium),
        );
        if (adaylar.length === 0) {
          setMadde(null);
          return;
        }
        const gun = Number(bugunISO().split('-').join('')) || 0;
        setMadde(adaylar[gun % adaylar.length]);
      })
      .catch(() => setMadde(null));
  }, [premium]);
  useFocusEffect(yukle);

  if (!madde) return null;

  function ac(g: CardWithLaw) {
    const klasor = LAW_KLASOR[g.law_id];
    if (klasor && kanunIndirilmisMi(klasor)) {
      router.push({ pathname: '/akis', params: { lawId: String(g.law_id), kart: String(g.id) } });
    } else {
      router.push({ pathname: '/patika', params: { lawId: String(g.law_id) } });
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [st.kart, pressed && st.basili]}
      onPress={() => ac(madde)}
      accessibilityRole="button"
      accessibilityLabel="Günün maddesini incele">
      <AppText variant="etiket" color="solukMetin" bold>
        GÜNÜN MADDESİ
      </AppText>
      <AppText variant="govde" bold color="anaMetin">
        {maddeEtiket(madde.madde_no, madde.baslik)}
      </AppText>
      <View style={st.alt}>
        <AppText variant="kucuk" color="solukMetin" style={st.kanunAd} numberOfLines={1}>
          {madde.law_ad}
        </AppText>
        <View style={st.incele}>
          <AppText variant="etiket" bold color="altinMetin">
            İncele
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.altinKoyu} />
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  basili: { opacity: 0.85 },
  alt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  kanunAd: { flexShrink: 1 },
  incele: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
