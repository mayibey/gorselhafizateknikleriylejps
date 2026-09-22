import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

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
  const router = useRouter();
  const tarih = tarihBicim(duyuru.created_at);
  // link='paywall' → duyuruya dokununca satın alma ekranı açılır (indirim duyuruları için).
  const paywallGit = duyuru.link === 'paywall';
  // link bir URL ise düğme çıkar; dokununca dış uygulamada/tarayıcıda açılır.
  // 22 Eyl 2026: düğme yazısı artık SABİT DEĞİL. Sunucudan "Etiket|https://..." biçiminde
  // gönderilirse o etiket kullanılır (kod değişikliği gerekmeden her duyuruya özel yazı).
  // Etiket yoksa: t.me ise "Telegram'a Katıl", değilse "Bağlantıyı Aç".
  const hamLink = duyuru.link ?? '';
  const boru = hamLink.indexOf('|');
  const linkEtiket = boru > 0 ? hamLink.slice(0, boru).trim() : '';
  const linkAdres = boru > 0 ? hamLink.slice(boru + 1).trim() : hamLink;
  const urlGit = !!linkAdres && /^(https?:\/\/|t\.me\/)/i.test(linkAdres);
  const telegramMi = /(^|\/\/)(t\.me|telegram\.)/i.test(linkAdres);
  const dugmeYazi = linkEtiket || (telegramMi ? "Telegram'a Katıl" : 'Bağlantıyı Aç');
  const dugmeIkon = telegramMi ? 'send' : 'open-in-new';
  const linkAc = () => {
    const u = linkAdres.startsWith('http') ? linkAdres : `https://${linkAdres}`;
    void Linking.openURL(u).catch(() => {});
  };

  const govde = (
    <>
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
      {paywallGit ? (
        <View style={styles.aksiyonSatir}>
          <AppText variant="kucuk" color="lacivert" bold>
            İndirimi gör
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.lacivert} />
        </View>
      ) : null}
      {urlGit ? (
        <Pressable
          style={({ pressed }) => [styles.katilBtn, pressed && styles.kartBasili]}
          onPress={linkAc}
          accessibilityRole="button"
          accessibilityLabel={dugmeYazi}>
          <MaterialCommunityIcons name={dugmeIkon} size={16} color={Palette.beyaz} />
          <AppText variant="kucuk" color="beyaz" bold>
            {dugmeYazi}
          </AppText>
        </Pressable>
      ) : null}
    </>
  );

  if (paywallGit) {
    return (
      <Pressable
        style={({ pressed }) => [styles.kart, pressed && styles.kartBasili]}
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
        accessibilityLabel={`${duyuru.baslik} — satın alma ekranını aç`}>
        {govde}
      </Pressable>
    );
  }
  return <View style={styles.kart}>{govde}</View>;
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
  kartBasili: {
    opacity: 0.7,
  },
  aksiyonSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.one,
    gap: 2,
  },
  katilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingVertical: 10,
    borderRadius: Radius.m,
    backgroundColor: Palette.lacivert,
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
