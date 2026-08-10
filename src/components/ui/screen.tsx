import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollToTop } from '@react-navigation/native';
import { type ReactNode, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { UfukNefesi, YildizKatmani } from '@/components/ui/yildiz-katmani';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

type ScreenProps = {
  /** Üstte lacivert krom başlık şeridi. */
  title?: string;
  /** Verilirse başlık şeridinde solda geri oku gösterir (pushed ekranlar için). */
  onGeri?: () => void;
  /** Opsiyonel: başlık şeridinde SAĞ üstte içerik (ikon vb.). Default: yok. */
  headerSag?: ReactNode;
  /** Opsiyonel: başlık şeridi dikeyde daha az yer kaplar (Evsaf yeniden tasarımı, 10 Ağu). */
  kompaktBaslik?: boolean;
  /** Opsiyonel: GECE MODU — tüm sayfa lacivert + yıldız katmanı (Şafak dokusu; 10 Ağu). */
  koyu?: boolean;
  /** Opsiyonel: başlık MARKA yazısı olur — harf aralıklı büyük yazı + altın çizgi + kalkan (11 Ağu). */
  marka?: boolean;
  /** Opsiyonel: header ile gövde arasında ince altın çizgi. Default: yok. */
  headerAltinCizgi?: boolean;
  /** İçerik kaydırılabilir mi (varsayılan: evet). */
  scroll?: boolean;
  /** Opsiyonel: kaydırmanın DIŞINDA, başlığın altında sabit duran şerit (ör. sekme seçici). */
  sabitUst?: ReactNode;
  children: ReactNode;
};

/** Krem zeminli, güvenli alanlı ortak ekran sarmalayıcı. */
export function Screen({
  title,
  onGeri,
  headerSag,
  headerAltinCizgi,
  kompaktBaslik,
  koyu,
  marka,
  scroll = true,
  sabitUst,
  children,
}: ScreenProps) {
  const body = <View style={styles.body}>{children}</View>;

  // Aktif sekmeye tekrar dokununca içeriği EN ÜSTE kaydır (React Navigation davranışı).
  // scroll=false ekranlarda ref bağlanmaz → no-op.
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  return (
    <SafeAreaView style={[styles.safe, koyu && styles.safeKoyu]} edges={['top', 'left', 'right']}>
      {koyu ? (
        <>
          {/* GECE DENİZİ v2 (başkan, 11 Ağu — "%100 aynısı" ekran görüntüsü): mavi değil
              PETROL/TURKUAZ ton — ufukta turkuaz aydınlanma, üst ve alt koyu petrol. */}
          <LinearGradient
            colors={['#0C3A4A', '#15586C', '#0B3242']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <UfukNefesi />
          <YildizKatmani />
        </>
      ) : null}
      {title ? (
        <View style={[styles.header, kompaktBaslik && styles.headerKompakt, koyu && styles.headerKoyu]}>
          {onGeri ? (
            <Pressable onPress={onGeri} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
              <MaterialCommunityIcons name="arrow-left" size={26} color={Palette.beyaz} />
            </Pressable>
          ) : null}
          {marka ? (
            /* MARKA BAŞLIK (11 Ağu ekran görüntüsü): "K A R A R G Â H" + altında
               ortası kalkanlı ince altın çizgi — sayfaya mühür kimliği. */
            <View style={styles.marka}>
              <AppText variant="baslik" color="beyaz" bold style={styles.markaYazi}>
                {title.toLocaleUpperCase('tr-TR')}
              </AppText>
              <View style={styles.markaAltSatir}>
                <View style={styles.markaCizgi} />
                <MaterialCommunityIcons name="shield-star" size={13} color={Palette.altin} />
                <View style={styles.markaCizgi} />
              </View>
            </View>
          ) : (
            <AppText variant="baslik" color="beyaz" bold>
              {title}
            </AppText>
          )}
          {headerSag ? <View style={styles.headerSag}>{headerSag}</View> : null}
        </View>
      ) : null}
      {title && headerAltinCizgi ? <View style={styles.altinCizgi} /> : null}
      {sabitUst ? <View style={styles.sabitUst}>{sabitUst}</View> : null}
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
  safeKoyu: {
    backgroundColor: '#0B3242', // gece denizi v2 taban — petrol (degrade üstüne biner)
  },
  marka: {
    gap: 4,
  },
  markaYazi: {
    fontSize: 28,
    letterSpacing: 6,
  },
  markaAltSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'stretch',
  },
  markaCizgi: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201,162,39,0.65)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerKompakt: {
    paddingVertical: Spacing.two,
  },
  headerKoyu: {
    backgroundColor: 'transparent', // gece denizinde başlık zeminle kaynaşır
  },
  headerSag: {
    marginLeft: 'auto', // başlığı solda bırak, sağ slotu en sağa it
  },
  altinCizgi: {
    height: 1,
    backgroundColor: Palette.altin,
  },
  sabitUst: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    backgroundColor: Palette.kremZemin,
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
