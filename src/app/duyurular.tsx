import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type Duyuru, duyurulariGetir, duyurulariGoruldu } from '@/lib/duyuru';
import { useUyelik } from '@/lib/uyelik-context';

/** Geçmiş dâhil tüm aktif duyurular. Boşsa "Henüz duyuru yok". Açılışta okundu işaretlenir. */
export default function DuyurularScreen() {
  const router = useRouter();
  const { premium } = useUyelik();
  const [duyurular, setDuyurular] = useState<Duyuru[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        const liste = await duyurulariGetir(premium);
        if (!iptal) setDuyurular(liste);
        await duyurulariGoruldu(); // rozeti temizle
      })();
      return () => {
        iptal = true;
      };
    }, [premium]),
  );

  return (
    <Screen title="Duyurular" onGeri={() => router.back()}>
      {duyurular === null ? null : duyurular.length === 0 ? (
        <View style={styles.bos}>
          <MaterialCommunityIcons name="bullhorn-outline" size={44} color={Palette.solukMetin} />
          <AppText variant="govde" color="solukMetin" style={styles.bosYazi}>
            Henüz duyuru yok.
          </AppText>
        </View>
      ) : (
        duyurular.map((d) => <DuyuruKarti key={d.id} duyuru={d} />)
      )}
    </Screen>
  );
}

function DuyuruKarti({ duyuru }: { duyuru: Duyuru }) {
  const tarih = tarihBicim(duyuru.created_at);
  return (
    <View style={styles.kart}>
      <View style={styles.baslikSatir}>
        <AppText variant="govde" bold style={styles.baslik}>
          {duyuru.baslik}
        </AppText>
        {duyuru.hedef === 'premium' ? (
          <View style={styles.rozet}>
            <AppText variant="etiket" color="beyaz" bold style={styles.rozetYazi}>
              PREMİUM
            </AppText>
          </View>
        ) : null}
      </View>
      {tarih ? (
        <AppText variant="kucuk" color="solukMetin">
          {tarih}
        </AppText>
      ) : null}
      <AppText variant="kucuk" style={styles.metin}>
        {duyuru.metin}
      </AppText>
    </View>
  );
}

/** ISO → "5 Temmuz 2026" (tr-TR). Hata olursa boş döner. */
function tarihBicim(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  bos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  bosYazi: {
    textAlign: 'center',
  },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  baslikSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  baslik: {
    flex: 1,
  },
  metin: {
    marginTop: Spacing.one,
    lineHeight: 20,
  },
  rozet: {
    backgroundColor: Palette.altin,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  rozetYazi: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
