import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { GeriBesDurum } from '@/db/schema';
import { bugunISO } from '@/lib/srs';

const KADEME_AD = ['—', 'Yazılı İkaz', 'Uyarı', 'Kınama', 'Aylıktan Kesme'];
const tarihFmt = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '—');

/**
 * GERİ BESLEME EĞİTİM EMRİ — süre/ceza uyarı kartı. `durum.acik` değilse hiçbir şey çizmez.
 * Hem Evsaf (Sicil) hem Karargah'ta AYNI kart gösterilir (tek kaynak).
 */
export function GeriBeslemeEmri({
  durum,
  zayifSayisi,
  onBasla,
}: {
  durum: GeriBesDurum | null;
  zayifSayisi: number;
  onBasla: () => void;
}) {
  if (!durum || !durum.acik) return null;
  const kalanGun = durum.sonTarih
    ? Math.max(
        0,
        Math.round(
          (Date.parse(`${durum.sonTarih}T00:00:00Z`) - Date.parse(`${bugunISO()}T00:00:00Z`)) / 86400000,
        ),
      )
    : 0;
  const siradakiCeza = KADEME_AD[Math.min(durum.kademe + 1, KADEME_AD.length - 1)];
  return (
    <View style={styles.emirKart}>
      <View style={styles.emirUst}>
        <MaterialCommunityIcons name="bugle" size={18} color={Palette.beyaz} />
        <AppText variant="kucuk" color="beyaz" bold>
          GERİ BESLEME EĞİTİM EMRİ
        </AppText>
      </View>

      <View style={styles.emirSure}>
        <MaterialCommunityIcons
          name={kalanGun === 0 ? 'alarm-light-outline' : 'timer-sand'}
          size={16}
          color={Palette.beyaz}
        />
        <AppText variant="kucuk" color="beyaz" bold>
          {kalanGun === 0 ? 'Süren bugün doluyor — SON GÜN!' : `Görevi tamamlamak için ${kalanGun} gün kaldı`}
        </AppText>
      </View>

      <AppText variant="etiket" color="beyaz">
        Bu süre içinde {zayifSayisi} zayıf mevzini kapatmazsan{' '}
        <AppText variant="etiket" color="beyaz" bold>
          {siradakiCeza}
        </AppText>{' '}
        cezası alırsın. (Son tarih: {tarihFmt(durum.sonTarih ?? '')})
        {durum.kademe > 0 ? ` — Şu anki kademe: ${KADEME_AD[durum.kademe]}` : ''}
      </AppText>
      <Pressable style={({ pressed }) => [styles.emirButon, pressed && styles.basili]} onPress={onBasla}>
        <AppText variant="etiket" color="kirmizi" bold>
          EĞİTİME BAŞLA
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emirKart: { backgroundColor: Palette.kirmizi, borderRadius: Radius.s, padding: Spacing.two, gap: Spacing.one },
  emirUst: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  emirSure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
  emirButon: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.beyaz,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.s,
    marginTop: Spacing.half,
  },
  basili: { opacity: 0.8 },
});
