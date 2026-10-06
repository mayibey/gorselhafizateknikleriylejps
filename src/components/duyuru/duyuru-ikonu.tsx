import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { duyurulariGetir, okunmamisVarMi } from '@/lib/duyuru';
import { useUyelik } from '@/lib/uyelik-context';

/**
 * Karargah başlığındaki duyuru ikonu (eski çan yerine). Okunmamış duyuru varsa
 * sağ üstte kırmızı nokta. Dokununca /duyurular açılır (orada okundu işaretlenir →
 * ekrana geri dönünce useFocusEffect nokta yok olur).
 * etiketli (başkan, 10 Ağu): "öyle sembol olarak durmasın" — ikon + DUYURULAR yazısı.
 */
export function DuyuruIkonu({ boyut = 22, etiketli }: { boyut?: number; etiketli?: boolean }) {
  const router = useRouter();
  const { premium } = useUyelik();
  const [okunmamis, setOkunmamis] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        const liste = await duyurulariGetir(premium);
        if (!iptal) setOkunmamis(await okunmamisVarMi(liste));
      })();
      return () => {
        iptal = true;
      };
    }, [premium]),
  );

  // 6 Eki 2026 (başkan): okunmamış duyuru varsa ikon + yazı yanıp sönsün, dikkat çeksin.
  // Hareket azaltma açıksa sabit kalır (yalnız nokta görünür).
  const nabiz = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!okunmamis) {
      nabiz.setValue(1);
      return;
    }
    let dongu: Animated.CompositeAnimation | null = null;
    let iptal = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((azalt) => {
        if (iptal || azalt) return;
        dongu = Animated.loop(
          Animated.sequence([
            Animated.timing(nabiz, { toValue: 0.25, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(nabiz, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
        );
        dongu.start();
      });
    return () => {
      iptal = true;
      dongu?.stop();
      nabiz.setValue(1);
    };
  }, [okunmamis, nabiz]);
  const olcek = nabiz.interpolate({ inputRange: [0.25, 1], outputRange: [1.35, 1] });

  // etiketli (11 Ağu — "%100 aynısı" ekran görüntüsü): zil ikonu + "DUYURULAR" yazısı;
  // okunmamış varsa zilin üstünde altın nokta (mühür rengi, kırmızı değil).
  if (etiketli) {
    return (
      <Pressable
        onPress={() => router.push('/duyurular')}
        hitSlop={10}
        style={styles.yaziSatir}
        accessibilityRole="button"
        accessibilityLabel="Duyurular">
        <Animated.View style={{ opacity: nabiz }}>
          <MaterialCommunityIcons name={okunmamis ? 'bell-ring' : 'bell-outline'} size={22} color={Palette.beyaz} />
        </Animated.View>
        {okunmamis ? <Animated.View style={[styles.zilNokta, { transform: [{ scale: olcek }] }]} /> : null}
        <Animated.View style={{ opacity: nabiz }}>
          <AppText variant="kucuk" bold color="altinParlak" style={styles.yaziEtiket}>
            DUYURULAR
          </AppText>
        </Animated.View>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => router.push('/duyurular')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Duyurular"
    >
      <Animated.View style={{ opacity: nabiz }}>
        <MaterialCommunityIcons name="bullhorn-outline" size={boyut} color={Palette.altin} />
      </Animated.View>
      {okunmamis ? <Animated.View style={[styles.nokta, { transform: [{ scale: olcek }] }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  yaziSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  yaziNokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.kirmizi,
  },
  yaziEtiket: {
    letterSpacing: 1,
  },
  zilNokta: {
    position: 'absolute',
    top: -2,
    left: 15,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.altinParlak,
  },
  nokta: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.kirmizi,
    borderWidth: 1,
    borderColor: Palette.lacivert,
  },
});
