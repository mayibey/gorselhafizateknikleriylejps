import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

type ScreenProps = {
  /** Üstte lacivert krom başlık şeridi. */
  title?: string;
  /** Verilirse başlık şeridinde solda geri oku gösterir (pushed ekranlar için). */
  onGeri?: () => void;
  /** İçerik kaydırılabilir mi (varsayılan: evet). */
  scroll?: boolean;
  children: ReactNode;
};

/** Krem zeminli, güvenli alanlı ortak ekran sarmalayıcı. */
export function Screen({ title, onGeri, scroll = true, children }: ScreenProps) {
  const body = <View style={styles.body}>{children}</View>;

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
        </View>
      ) : null}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>{body}</ScrollView>
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
