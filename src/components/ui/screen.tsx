import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { type ReactNode, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

type ScreenProps = {
  /** Üstte lacivert krom başlık şeridi. */
  title?: string;
  /** Verilirse başlık şeridinde solda geri oku gösterir (pushed ekranlar için). */
  onGeri?: () => void;
  /** Opsiyonel: başlık şeridinde SAĞ üstte içerik (ikon vb.). Default: yok. */
  headerSag?: ReactNode;
  /** Opsiyonel: header ile gövde arasında ince altın çizgi. Default: yok. */
  headerAltinCizgi?: boolean;
  /** İçerik kaydırılabilir mi (varsayılan: evet). */
  scroll?: boolean;
  children: ReactNode;
};

/** Krem zeminli, güvenli alanlı ortak ekran sarmalayıcı. */
export function Screen({
  title,
  onGeri,
  headerSag,
  headerAltinCizgi,
  scroll = true,
  children,
}: ScreenProps) {
  const body = <View style={styles.body}>{children}</View>;

  // Aktif sekmeye tekrar dokununca içeriği EN ÜSTE kaydır (React Navigation davranışı).
  // scroll=false ekranlarda ref bağlanmaz → no-op.
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {title ? (
        <View style={styles.header}>
          {onGeri ? (
            <Pressable onPress={onGeri} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
              <MaterialCommunityIcons name="arrow-left" size={26} color={Palette.beyaz} />
            </Pressable>
          ) : null}
          <AppText variant="baslik" color="beyaz" bold>
            {title}
          </AppText>
          {headerSag ? <View style={styles.headerSag}>{headerSag}</View> : null}
        </View>
      ) : null}
      {title && headerAltinCizgi ? <View style={styles.altinCizgi} /> : null}
      {scroll ? (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerSag: {
    marginLeft: 'auto', // başlığı solda bırak, sağ slotu en sağa it
  },
  altinCizgi: {
    height: 1,
    backgroundColor: Palette.altin,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    // Alt sekme çubuğu içeriği örtmesin (son satır görünür kalsın).
    paddingBottom: BottomTabInset,
  },
  body: {
    // flexGrow: tek ekran-içi durumda (Loading/EmptyState flex:1) dikey ortalansın;
    // normal içerik yine üstten dizilir.
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
