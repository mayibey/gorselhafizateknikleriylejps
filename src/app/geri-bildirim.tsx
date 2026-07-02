import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useCihazKimlik } from '@/hooks/use-cihaz-kimlik';
import { type GeriBildirimTip, gonderGeriBildirim } from '@/lib/geri-bildirim';
import { bugunISO } from '@/lib/srs';

const TIPLER: { key: GeriBildirimTip; ad: string }[] = [
  { key: 'hata', ad: 'Hata' },
  { key: 'oneri', ad: 'Öneri' },
  { key: 'diger', ad: 'Diğer' },
];

export default function GeriBildirimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    card_id?: string;
    madde_no?: string;
    baslik?: string;
    kanun?: string;
  }>();
  const { kimlik } = useCihazKimlik();

  const [tip, setTip] = useState<GeriBildirimTip>('oneri');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [hata, setHata] = useState(false);

  // Başarılı gönderimden kısa süre sonra otomatik geri dön.
  useEffect(() => {
    if (!basarili) return;
    const t = setTimeout(() => router.back(), 1800);
    return () => clearTimeout(t);
  }, [basarili, router]);

  async function gonder() {
    if (!mesaj.trim() || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(false);
    try {
      await gonderGeriBildirim({
        tip,
        mesaj: mesaj.trim(),
        card_id: params.card_id ? Number(params.card_id) : null,
        madde_no: params.madde_no ?? '',
        baslik: params.baslik ?? '',
        kanun: params.kanun ?? '',
        tarih: bugunISO(),
        cihaz_kimlik: kimlik ?? '',
      });
      setBasarili(true);
    } catch {
      setHata(true);
    } finally {
      setGonderiliyor(false);
    }
  }

  if (basarili) {
    return (
      <Screen title="Hata/Öneri Bildir" onGeri={() => router.back()}>
        <View style={styles.basariKutu}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={Palette.yesil} />
          <AppText variant="baslik" bold style={styles.ortala}>
            Teşekkürler
          </AppText>
          <AppText variant="govde" color="solukMetin" style={styles.ortala}>
            Değerlendirmeniz bize ulaştı 🙏
          </AppText>
        </View>
      </Screen>
    );
  }

  const gonderPasif = mesaj.trim().length === 0 || gonderiliyor;

  return (
    <Screen title="Hata/Öneri Bildir" onGeri={() => router.back()}>
      {/* Hangi kart için (bilgi; kullanıcı yazmasa da gönderime gömülür) */}
      {params.madde_no ? (
        <AppText variant="kucuk" color="solukMetin">
          {params.madde_no}
          {params.baslik ? ` — ${params.baslik}` : ''}
        </AppText>
      ) : null}

      {/* Tip seçimi */}
      <View style={styles.tipSatir}>
        {TIPLER.map((t) => {
          const secili = t.key === tip;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTip(t.key)}
              style={[styles.tip, secili && styles.tipSecili]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: secili }}
              accessibilityLabel={t.ad}>
              <AppText variant="kucuk" color={secili ? 'beyaz' : 'lacivert'} bold>
                {t.ad}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Mesaj */}
      <TextInput
        style={styles.metin}
        value={mesaj}
        onChangeText={setMesaj}
        placeholder="Görüşünüzü yazın…"
        placeholderTextColor={Palette.solukMetin}
        multiline
        textAlignVertical="top"
        editable={!gonderiliyor}
      />

      {hata ? (
        <AppText variant="kucuk" color="kirmizi" bold>
          Gönderilemedi, tekrar dene.
        </AppText>
      ) : null}

      <Pressable
        style={[styles.gonder, gonderPasif && styles.gonderPasif]}
        disabled={gonderPasif}
        onPress={() => void gonder()}>
        {gonderiliyor ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <AppText variant="govde" color="beyaz" bold>
            Gönder
          </AppText>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tipSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
    borderWidth: 1,
    borderColor: Palette.lacivert,
    backgroundColor: Palette.kartKremi,
  },
  tipSecili: {
    backgroundColor: Palette.lacivert,
  },
  metin: {
    minHeight: 140,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    fontSize: 16,
    color: Palette.lacivert,
  },
  gonder: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  gonderPasif: {
    opacity: 0.4,
  },
  basariKutu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    minHeight: 240,
  },
  ortala: {
    textAlign: 'center',
  },
});
