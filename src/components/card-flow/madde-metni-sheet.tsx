import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MEVZUAT_KAYNAK_URL } from '@/constants/config';
import { BottomTabInset, Palette, Spacing } from '@/constants/theme';
import { maddeMetni } from '@/db/madde-metinleri';

/**
 * Madde metni alt-panel (sheet) overlay'i — gorsel-zoom.tsx pattern'i.
 * RN Modal DEĞİL → absoluteFill overlay (ekran içinde; ekran unmount olmaz → ses kesilmez).
 * Backdrop yarı saydam (0.6) → arkadaki kart LOŞ görünür; metin önde sheet içinde scroll'lanır.
 */
export function MaddeMetniSheet({
  gorunur,
  maddeNo,
  baslik,
  onKapat,
}: {
  gorunur: boolean;
  maddeNo: string;
  baslik?: string;
  onKapat: () => void;
}) {
  if (!gorunur) return null;
  const metin = maddeMetni(maddeNo);

  return (
    // Karartılmış backdrop — dışına dokunmak kapatır.
    <Pressable style={styles.backdrop} onPress={onKapat} accessibilityLabel="Kapat">
      {/* Sheet kabı — kendi üstüne dokunuş backdrop'a ULAŞMASIN (kapatmasın). */}
      <Pressable style={styles.sheet} onPress={() => {}} accessibilityRole="none">
        {/* Drag-handle ipucu */}
        <View style={styles.handle} />

        {/* Başlık şeridi: solda madde no + başlık, sağda kapat (X) */}
        <View style={styles.head}>
          <View style={styles.headMetin}>
            <AppText variant="altBaslik" bold numberOfLines={1}>
              {maddeNo}
            </AppText>
            {baslik ? (
              <AppText variant="kucuk" color="solukMetin" numberOfLines={1}>
                {baslik}
              </AppText>
            ) : null}
          </View>
          <Pressable
            style={({ pressed }) => [styles.kapat, pressed && styles.pressed]}
            onPress={onKapat}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Kapat">
            <MaterialCommunityIcons name="close" size={24} color={Palette.lacivert} />
          </Pressable>
        </View>

        {/* İçerik: metin varsa scroll'lanan tam metin, yoksa "yakında" */}
        {metin ? (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.govdeContent}>
              <AppText variant="govde" style={styles.metin}>
                {metin}
              </AppText>
            </ScrollView>
            {/* Resmî kaynak atfı (Google "Yanıltıcı İddialar" — resmî bilgi kaynağı
                tıklanabilir link olarak görünür olmalı). Panel altında sabit kalır. */}
            <Pressable
              style={({ pressed }) => [styles.kaynak, pressed && styles.pressed]}
              onPress={() => void Linking.openURL(MEVZUAT_KAYNAK_URL)}
              accessibilityRole="link"
              accessibilityLabel="Resmî kaynak: mevzuat.gov.tr (yeni sekmede açılır)">
              <MaterialCommunityIcons name="open-in-new" size={14} color={Palette.solukMetin} />
              <AppText variant="kucuk" color="solukMetin" style={styles.kaynakMetin}>
                Kaynak: mevzuat.gov.tr (T.C. resmî mevzuat veritabanı)
              </AppText>
            </Pressable>
          </>
        ) : (
          <View style={styles.bos}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color={Palette.solukMetin}
            />
            <AppText variant="altBaslik" color="solukMetin" bold>
              Madde metni yakında
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.bosAciklama}>
              {maddeNo} için resmî metin yakında eklenecek.
            </AppText>
          </View>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    // Arkadaki kart LOŞ görünsün diye düşük alfa (gorsel-zoom 0.97 yerine 0.6).
    backgroundColor: 'rgba(15, 20, 30, 0.6)',
    // Üstte ~%12 boşluk → arkadaki kartın bir kısmı görünür kalır.
    paddingTop: '12%',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: Palette.kartKremi,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    // Hafif gölge (iOS + Android + web).
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.kenarlik,
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  headMetin: {
    flex: 1,
  },
  kapat: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    // Kaynak satırı panel altına sabitlensin diye scroll esner.
    flex: 1,
  },
  govdeContent: {
    paddingTop: Spacing.two,
    // Son satır kaynak şeridinin üstünde görünür kalsın.
    paddingBottom: Spacing.three,
  },
  metin: {
    // Yorgun gözle uzun metin için rahat satır yüksekliği.
    lineHeight: 28,
  },
  kaynak: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Palette.kenarlik,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.two,
  },
  kaynakMetin: {
    textDecorationLine: 'underline',
  },
  bos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  bosAciklama: {
    textAlign: 'center',
  },
});
