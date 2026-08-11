/**
 * ZAYIF MEVZİLER — TAM SAYFA (10 Ağu 2026; başkan: "kartın içinde ok'la açılan detay
 * çok kötü, neye tıkladığım belli değil").
 *
 * Evsaf'taki kart artık yalnız ÖZET + iki net eylem taşır; bütün detay (Denemeler/
 * Oyunlar sekmeleri, kanun grupları, kurtulma/bekleme bilgileri) bu ayrı sayfada
 * rahatça yaşar. Veri kaynağı Evsaf'la birebir aynı: lib/zayif-veri.ts.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useKisiselOzellik } from '@/lib/ozellik';
import { useUyelik } from '@/lib/uyelik-context';
import { type ZayifVeri, zayifVeriYukle } from '@/lib/zayif-veri';

import { OyunZayiflari, ZayifBolum } from './(tabs)/sicil';

export default function ZayifMevzilerScreen() {
  const router = useRouter();
  const { kanunErisilebilir } = useUyelik();
  const gece = useKisiselOzellik('talim-mevzuata');
  const [veri, setVeri] = useState<ZayifVeri | null>(null);
  const [sekme, setSekme] = useState<'denemeler' | 'oyunlar'>('denemeler');

  useFocusEffect(
    useCallback(() => {
      void zayifVeriYukle(kanunErisilebilir)
        .then(setVeri)
        .catch(() => setVeri(null));
    }, [kanunErisilebilir]),
  );

  return (
    <Screen title="Zayıf Mevziler" onGeri={() => router.back()} kompaktBaslik koyu={gece}>
      {/* Sekmeler — kaynak seçimi net ve büyük: Denemeler (kart/sınav) · Oyunlar. */}
      <View style={[st.sekmeler, gece && st.sekmelerGece]}>
        {(['denemeler', 'oyunlar'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSekme(s)}
            style={[st.sekme, sekme === s && (gece ? st.sekmeAktifGece : st.sekmeAktif)]}
            accessibilityRole="button">
            <MaterialCommunityIcons
              name={s === 'denemeler' ? 'target' : 'gamepad-variant-outline'}
              size={16}
              color={
                sekme === s
                  ? gece
                    ? Palette.altinParlak
                    : Palette.beyaz
                  : gece
                    ? 'rgba(226,236,240,0.8)'
                    : Palette.solukMetin
              }
            />
            <AppText
              variant="kucuk"
              bold
              color={sekme === s ? (gece ? 'altinParlak' : 'beyaz') : gece ? 'beyaz' : 'solukMetin'}>
              {s === 'denemeler' ? 'Denemeler' : 'Oyunlar'}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={[st.icerik, gece && st.icerikGece]}>
        {sekme === 'denemeler' ? (
          <ZayifBolum
            zayif={veri}
            onCalis={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
            karttanCalis={(lawId, cardId) =>
              router.push({
                pathname: '/akis',
                params: { lawId: String(lawId), kart: String(cardId) },
              })
            }
          />
        ) : (
          <OyunZayiflari
            karttanCalis={(lawId, cardId) =>
              router.push({
                pathname: '/akis',
                params: { lawId: String(lawId), kart: String(cardId) },
              })
            }
          />
        )}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  sekmelerGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderColor: 'rgba(126,205,218,0.3)',
  },
  sekmeAktifGece: {
    backgroundColor: 'rgba(3,47,69,0.95)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
  icerikGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  sekmeler: {
    flexDirection: 'row',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: 3,
    gap: 3,
  },
  sekme: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
  },
  sekmeAktif: {
    backgroundColor: Palette.lacivert,
  },
  icerik: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
