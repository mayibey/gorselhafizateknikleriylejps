import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getBranches } from '@/db/database';
import type { Branch } from '@/db/schema';
import { adminMi } from '@/lib/admin';
import { useAuth } from '@/lib/auth-context';
import { okunmamisCevapVarMi } from '@/lib/destek';
import { useKisiselOzellik } from '@/lib/ozellik';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';
import { RUTBELER } from '@/lib/rutbe-store';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Ayarlar — Evsaf'tan açılır. Profil (branş/rütbe) + bildirim + yasal girişleri burada toplanır. */
export default function AyarlarScreen() {
  const router = useRouter();
  const telegramSatiri = useKisiselOzellik('talim-mevzuata');
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const { kullanici, hazir } = useAuth();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [admin, setAdmin] = useState(false);
  const [destekRozet, setDestekRozet] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void getBranches()
        .then(setBranches)
        .catch(() => {});
      let iptal = false;
      void adminMi().then((v) => {
        if (!iptal) setAdmin(v);
      });
      void okunmamisCevapVarMi().then((v) => {
        if (!iptal) setDestekRozet(v);
      });
      return () => {
        iptal = true;
      };
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
      {/* Rütbe kilitli: bir kez seçilir, uygulamadan değiştirilemez (topluluk rütbe grupları için). */}
      <Satir ikon="chevron-triple-up" etiket="Rütbe" deger={rutbeAd} kilitli />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- yeni route; expo-router tip codegen'i expo start'ta yenilenir */}
      <Satir ikon="send-circle-outline" etiket="Telegram'a Bağlan" onPress={() => router.push('/telegram-baglan' as any)} />

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
        ikon="star-circle-outline"
        etiket="Premium / Abonelik"
        onPress={() => router.push('/paywall')}
      />
      {/* Promosyon Kodu — iOS'ta GİZLİ (Apple 3.1.1: içerik App Store dışı mekanizmayla açılamaz). */}
      {Platform.OS !== 'ios' ? (
        <Satir
          ikon="ticket-percent-outline"
          etiket="Promosyon Kodu"
          onPress={() => router.push('/promo-kod')}
        />
      ) : null}
      <Satir
        ikon="bell-outline"
        etiket="Eğitim Planı (Bildirimler)"
        onPress={() => router.push('/egitim-plani')}
      />
      {/* Bayraklı (10 Ağu, ChatGPT fikri): Telegram topluluğu + bot eşleşmesi tek dokunuşla.
          Bot tarafında /baglan akışı zaten var; buradan Telegram'da bot açılır. */}
      {telegramSatiri ? (
        <Satir
          ikon="send-circle-outline"
          etiket="Telegram'a Bağlan"
          onPress={() => void Linking.openURL('https://t.me/Mevzujspsbot').catch(() => {})}
        />
      ) : null}
      <Satir
        ikon="lifebuoy"
        etiket="Destek / Taleplerim"
        rozet={destekRozet}
        onPress={() => router.push('/destek')}
      />
      <Satir
        ikon="play-circle-outline"
        etiket="Tanıtım turunu tekrar izle"
        onPress={() => router.push('/tanitim')}
      />
      <Satir
        ikon="shield-lock-outline"
        etiket="Gizlilik & Kullanım Şartları"
        onPress={() => router.push({ pathname: '/yasal', params: { tip: 'gizlilik' } })}
      />
      {admin ? (
        <Satir
          ikon="shield-crown-outline"
          etiket="Yönetim Paneli"
          onPress={() => router.push('/admin')}
        />
      ) : null}
    </Screen>
  );
}

function Satir({
  ikon,
  etiket,
  deger,
  rozet,
  onPress,
  kilitli,
}: {
  ikon: IconName;
  etiket: string;
  deger?: string;
  rozet?: boolean;
  onPress?: () => void;
  kilitli?: boolean;
}) {
  const icerik = (
    <>
      <MaterialCommunityIcons name={ikon} size={22} color={Palette.lacivert} />
      <AppText variant="kucuk" bold style={styles.etiket}>
        {etiket}
      </AppText>
      {rozet ? <View style={styles.rozetNokta} /> : null}
      {deger ? (
        <AppText variant="kucuk" color="solukMetin" numberOfLines={1} style={styles.deger}>
          {deger}
        </AppText>
      ) : null}
      <MaterialCommunityIcons
        name={kilitli ? 'lock-outline' : 'chevron-right'}
        size={22}
        color={Palette.solukMetin}
      />
    </>
  );
  // Kilitli ya da onPress yoksa -> salt-okunur (dokunulamaz) satır.
  if (kilitli || !onPress) {
    return <View style={styles.satir}>{icerik}</View>;
  }
  return (
    <Pressable style={({ pressed }) => [styles.satir, pressed && styles.pressed]} onPress={onPress}>
      {icerik}
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
  rozetNokta: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.kirmizi,
  },
  pressed: {
    opacity: 0.75,
  },
});
