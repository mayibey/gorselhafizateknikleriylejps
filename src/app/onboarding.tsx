import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BransSecici } from '@/components/brans-secici';
import { GirisFormu } from '@/components/giris-formu';
import { RutbeSecici } from '@/components/rutbe-secici';
import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { girisDonusAdresi } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';

/**
 * İlk açılış akışı: (0) Tanıtım/değer önermesi → (1) branş → (2) rütbe → ana ekran.
 * Tanıtım yalnız ilk açılışta (branş seçilmeden) bir kez gösterilir; "Başla" ile geçilir.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { brans, setBrans } = useBrans();
  const { rutbe, setRutbe } = useRutbe();
  const { kullanici, hazir } = useAuth();
  const [tanitimGecildi, setTanitimGecildi] = useState(false);
  // Giriş ZORUNLU (Supabase yapılandırıldıysa). hazir=false ise gate kapalı (girişsiz akış).
  const girisGerek = hazir && !kullanici;

  // Adım 0: tanıtım (yeni kullanıcı — hiç branş/rütbe yok — en başta, giriş öncesi).
  if (!brans && !rutbe && !tanitimGecildi) {
    return <Tanitim onBasla={() => setTanitimGecildi(true)} />;
  }

  // Adım 0.5: ZORUNLU giriş (devam etmek için).
  if (girisGerek) {
    return <GirisAdim />;
  }

  // Adım 1: branş.
  if (!brans) {
    return (
      <BransSecici
        baslik="Branşını Seç"
        altyazi="Mevzuatın buna göre filtrelenecek. Sonradan Evsaf'tan değiştirebilirsin."
        onSelect={(slug) => void setBrans(slug)}
      />
    );
  }

  // Adım 2: rütbe.
  if (!rutbe) {
    return (
      <RutbeSecici
        baslik="Rütbeni Seç"
        altyazi="Konular rütbene göre filtrelenir. Sonradan Evsaf → Ayarlar'dan değiştirebilirsin."
        onSelect={(slug) => void setRutbe(slug).then(() => router.replace('/'))}
      />
    );
  }

  return null;
}

const DEGERLER: { ikon: keyof typeof MaterialCommunityIcons.glyphMap; baslik: string; metin: string }[] = [
  { ikon: 'image-multiple', baslik: 'Görsel hafıza kartları', metin: 'Her kanun maddesi akılda kalıcı bir karikatür sahneye dönüşür.' },
  { ikon: 'clipboard-check', baslik: 'Deneme sınavları', metin: 'Kendini sına; %100 yapınca Takdir Belgesi kazan.' },
  { ikon: 'medal', baslik: 'Sicil & ödül', metin: 'İlerlemeni gör, takdir topla, zayıf mevzilerini kapat.' },
];

function Tanitim({ onBasla }: { onBasla: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.marka}>
          <MaterialCommunityIcons name="shield-star" size={40} color={Palette.altinKoyu} />
          <AppText variant="etiket" bold color="altinMetin" style={styles.markaAd}>
            MEVZU · JSPS
          </AppText>
        </View>

        <AppText variant="baslik" bold color="lacivert" style={styles.baslik}>
          Kanunları görselle, kalıcı öğren
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
          Kuru metni ezberleme; karikatür kartlar, deneme sınavları ve askeri sicil temasıyla
          JSPS'e hazırlan.
        </AppText>

        <View style={styles.degerler}>
          {DEGERLER.map((d) => (
            <View key={d.baslik} style={styles.degerSatir}>
              <View style={styles.degerIkon}>
                <MaterialCommunityIcons name={d.ikon} size={22} color={Palette.altinKoyu} />
              </View>
              <View style={styles.degerMetin}>
                <AppText variant="govde" bold color="anaMetin">
                  {d.baslik}
                </AppText>
                <AppText variant="kucuk" color="solukMetin">
                  {d.metin}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.altBlok}>
        <Pressable
          style={({ pressed }) => [styles.basla, pressed && styles.pressed]}
          onPress={onBasla}>
          <AppText variant="govde" bold color="beyaz">
            Başla
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** ZORUNLU giriş adımı — devam etmek için giriş (Google + e-posta/şifre). (Atlama yok.) */
function GirisAdim() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.marka}>
          <MaterialCommunityIcons name="shield-account" size={48} color={Palette.lacivert} />
          <AppText variant="baslik" bold color="lacivert">
            MEVZU · JSPS
          </AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
            Devam etmek için giriş yap. İlerlemen ve satın alımların hesabına bağlanır, cihaz
            değiştirsen bile kaybolmaz.
          </AppText>
        </View>

        <GirisFormu />

        <AppText variant="etiket" color="solukMetin" style={styles.hataMetin}>
          Giriş/kayıt yaparak Gizlilik Politikası ve Kullanım Şartları'nı kabul etmiş olursun.
        </AppText>

        {__DEV__ ? (
          <View style={styles.teshisKart}>
            <AppText variant="etiket" color="solukMetin" bold>
              TEŞHİS — Supabase Redirect URLs'e ekle:
            </AppText>
            <AppText variant="etiket" color="lacivert" bold selectable>
              {girisDonusAdresi()}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  icerik: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  marka: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  markaAd: {
    letterSpacing: 2,
  },
  baslik: {
    textAlign: 'center',
  },
  altyazi: {
    textAlign: 'center',
    lineHeight: 20,
  },
  degerler: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  degerSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  degerIkon: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  degerMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  altBlok: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
  },
  basla: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.beyaz,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  hataMetin: {
    textAlign: 'center',
  },
  teshisKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
