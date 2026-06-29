/**
 * Türkçe doğum tarihi seçici — Gün / Ay (Türkçe) / Yıl üç sütun modal.
 * Native takvim cihaz diline bağlı (İngilizce ay çıkabiliyor); bu tam kontrol + TR garantisi.
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function DogumTarihiSecici({
  acik,
  deger,
  onSec,
  onKapat,
}: {
  acik: boolean;
  deger: Date | null;
  onSec: (d: Date) => void;
  onKapat: () => void;
}) {
  const buYil = new Date().getFullYear();
  const [gun, setGun] = useState(deger?.getDate() ?? 1);
  const [ay, setAy] = useState(deger?.getMonth() ?? 0);
  const [yil, setYil] = useState(deger?.getFullYear() ?? 2000);

  const gunler = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const yillar = useMemo(
    () => Array.from({ length: buYil - 1939 }, (_, i) => buYil - i),
    [buYil],
  );

  function onayla() {
    const sonGun = new Date(yil, ay + 1, 0).getDate(); // o ayın gün sayısı
    onSec(new Date(yil, ay, Math.min(gun, sonGun)));
  }

  return (
    <Modal visible={acik} transparent animationType="slide" onRequestClose={onKapat}>
      <Pressable style={styles.katman} onPress={onKapat}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <AppText variant="govde" bold color="lacivert" style={styles.baslik}>
            Doğum Tarihi
          </AppText>
          <View style={styles.kolonlar}>
            <Kolon veri={gunler} secili={gun} onSec={setGun} yaz={(n) => String(n)} genis={1} />
            <Kolon veri={AYLAR.map((_, i) => i)} secili={ay} onSec={setAy} yaz={(i) => AYLAR[i]} genis={1.6} />
            <Kolon veri={yillar} secili={yil} onSec={setYil} yaz={(n) => String(n)} genis={1.2} />
          </View>
          <Pressable style={({ pressed }) => [styles.tamam, pressed && styles.pressed]} onPress={onayla}>
            <AppText variant="govde" bold color="beyaz">
              Tamam
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Kolon({
  veri,
  secili,
  onSec,
  yaz,
  genis,
}: {
  veri: number[];
  secili: number;
  onSec: (n: number) => void;
  yaz: (n: number) => string;
  genis: number;
}) {
  return (
    <ScrollView style={[styles.kolon, { flex: genis }]} showsVerticalScrollIndicator={false}>
      {veri.map((n) => {
        const s = n === secili;
        return (
          <Pressable key={n} style={[styles.satir, s && styles.satirSecili]} onPress={() => onSec(n)}>
            <AppText variant="govde" bold={s} color={s ? 'beyaz' : 'anaMetin'} numberOfLines={1}>
              {yaz(n)}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  katman: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Palette.kremZemin,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  baslik: {
    textAlign: 'center',
  },
  kolonlar: {
    flexDirection: 'row',
    gap: Spacing.two,
    height: 240,
  },
  kolon: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
  },
  satir: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    borderRadius: Radius.s,
  },
  satirSecili: {
    backgroundColor: Palette.lacivert,
  },
  tamam: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
