import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollToTop } from '@react-navigation/native';
import { type ReactNode, useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
          {/* GECE DENİZİ v4 (handoff v2 COLOR_SPEC): 5 duraklı açık petrol aile —
              görsel yüklenene kadarki taban; üstüne GERÇEK dağ görseli biner. */}
          <LinearGradient
            colors={['#064B62', '#075D72', '#087087', '#064E66', '#043C54']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* GERÇEK ARKA PLAN (başkan, 11 Ağu): ChatGPT üretimi temiz dağ görseli.
              İki aday sırayla deneniyor — DEĞİŞTİRMEK İÇİN sadece require yolunu çevir:
              karargah-arka-turkuaz.webp ↔ karargah-arka-mavi.webp */}
          <Image
            source={require('../../../assets/images/karargah-arka-turkuaz.webp')}
            style={styles.arkaGorsel}
            resizeMode="cover"
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
                <MaterialCommunityIcons name="shield-star" size={13} color={Palette.altinParlak} />
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
    backgroundColor: '#043C54', // gece denizi v4 taban — petrol (degrade üstüne biner)
  },
  arkaGorsel: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  marka: {
    gap: 2,
  },
  markaYazi: {
    fontSize: 23, // tek-ekran sığdırma (11 Ağu): 28 → 23
    letterSpacing: 5,
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
    backgroundColor: 'rgba(240,183,51,0.8)', // sıcak parlak altın (handoff)
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
