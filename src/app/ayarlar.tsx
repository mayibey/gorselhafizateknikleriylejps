import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getBranches } from '@/db/database';
import type { Branch } from '@/db/schema';
import { useAuth } from '@/lib/auth-context';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';
import { RUTBELER } from '@/lib/rutbe-store';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Ayarlar — Evsaf'tan açılır. Profil (branş/rütbe) + bildirim + yasal girişleri burada toplanır. */
export default function AyarlarScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const { kullanici, hazir } = useAuth();
  const [branches, setBranches] = useState<Branch[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getBranches()
        .then(setBranches)
        .catch(() => {});
    }, []),
  );

  const bransAd = branches?.find((b) => b.slug === brans)?.ad ?? '—';
  const rutbeAd = RUTBELER.find((r) => r.slug === rutbe)?.ad ?? '—';

  return (
    <Screen title="Ayarlar" onGeri={() => router.back()}>
      <AppText variant="etiket" color="solukMetin" bold>
        PROFİL
      </AppText>
      <Satir
        ikon="account-group-outline"
        etiket="Branş"
        deger={bransAd}
        onPress={() => router.push('/brans-sec')}
      />
      <Satir
        ikon="chevron-triple-up"
        etiket="Rütbe"
        deger={rutbeAd}
        onPress={() => router.push('/rutbe-sec')}
      />
      {hazir ? (
        <Satir
          ikon={kullanici ? 'account-check' : 'account-circle-outline'}
          etiket="Hesap"
          deger={kullanici ? (kullanici.email ?? 'Hesabım') : 'Gmail ile giriş'}
          onPress={() => router.push('/giris')}
        />
      ) : null}

      <AppText variant="etiket" color="solukMetin" bold style={styles.baslikUst}>
        UYGULAMA
      </AppText>
      <Satir
        ikon="bell-outline"
        etiket="Eğitim Planı (Bildirimler)"
        onPress={() => router.push('/egitim-plani')}
      />
      <Satir
        ikon="shield-lock-outline"
        etiket="Gizlilik & Kullanım Şartları"
        onPress={() => router.push({ pathname: '/yasal', params: { tip: 'gizlilik' } })}
      />
    </Screen>
  );
}

function Satir({
  ikon,
  etiket,
  deger,
  onPress,
}: {
  ikon: IconName;
  etiket: string;
  deger?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.satir, pressed && styles.pressed]} onPress={onPress}>
      <MaterialCommunityIcons name={ikon} size={22} color={Palette.lacivert} />
      <AppText variant="kucuk" bold style={styles.etiket}>
        {etiket}
      </AppText>
      {deger ? (
        <AppText variant="kucuk" color="solukMetin" numberOfLines={1} style={styles.deger}>
          {deger}
        </AppText>
      ) : null}
      <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baslikUst: {
    marginTop: Spacing.three,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  etiket: {
    flex: 1,
  },
  deger: {
    maxWidth: '45%',
  },
  pressed: {
    opacity: 0.75,
  },
});
