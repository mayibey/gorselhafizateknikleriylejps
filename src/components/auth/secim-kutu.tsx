/**
 * Dropdown seçim kutusu (branş/rütbe vb.) — ikon + seçili değer + alttan açılan seçenek modalı.
 * AuthGirdi ile aynı görsel dil (krem, yuvarlak, gölge).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type Secenek<T extends string> = { slug: T; ad: string };

export function SecimKutu<T extends string>({
  ikon,
  placeholder,
  baslik,
  deger,
  secenekler,
  onSec,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  placeholder: string;
  baslik: string;
  deger: T | null;
  secenekler: Secenek<T>[];
  onSec: (slug: T) => void;
}) {
  const [acik, setAcik] = useState(false);
  const secili = secenekler.find((s) => s.slug === deger);
  return (
    <>
      <Pressable style={styles.kutu} onPress={() => setAcik(true)}>
        <MaterialCommunityIcons name={ikon} size={20} color={Palette.solukMetin} />
        <AppText variant="govde" color={secili ? 'anaMetin' : 'solukMetin'} style={styles.deger} numberOfLines={1}>
          {secili?.ad ?? placeholder}
        </AppText>
        <MaterialCommunityIcons name="chevron-down" size={20} color={Palette.solukMetin} />
      </Pressable>

      <Modal visible={acik} transparent animationType="slide" onRequestClose={() => setAcik(false)}>
        <Pressable style={styles.katman} onPress={() => setAcik(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <AppText variant="govde" bold color="lacivert" style={styles.panelBaslik}>
              {baslik}
            </AppText>
            <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
              {secenekler.map((s) => {
                const sec = s.slug === deger;
                return (
                  <Pressable
                    key={s.slug}
                    style={[styles.secenek, sec && styles.secenekSecili]}
                    onPress={() => {
                      onSec(s.slug);
                      setAcik(false);
                    }}>
                    <AppText variant="govde" bold={sec} color={sec ? 'beyaz' : 'anaMetin'}>
                      {s.ad}
                    </AppText>
                    {sec ? (
                      <MaterialCommunityIcons name="check" size={20} color={Palette.beyaz} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  kutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    height: 54,
    shadowColor: Palette.kartGolge,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  deger: {
    flex: 1,
  },
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
    gap: Spacing.two,
    maxHeight: '70%',
  },
  panelBaslik: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  liste: {
    flexGrow: 0,
  },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.two,
  },
  secenekSecili: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
});
