import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnaButon } from '@/components/auth/ana-buton';
import { AuthEkrani } from '@/components/auth/auth-ekrani';
import { DekoratifArkaplan } from '@/components/auth/dekoratif-arkaplan';
import { KarakterFigur } from '@/components/auth/karakter-figur';
import { SecimKutu } from '@/components/auth/secim-kutu';
import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getBranches } from '@/db/database';
import { useAuth } from '@/lib/auth-context';
import { useBrans } from '@/lib/brans-context';
import { type Rutbe, RUTBELER } from '@/lib/rutbe-store';
import { useRutbe } from '@/lib/rutbe-context';

/**
 * İlk açılış akışı: ZORUNLU giriş/kayıt (AuthEkrani) → GÖREV (branş/rütbe) → (sonra _layout Tanıtım
 * turunu gösterir) → ana ekran.
 *
 * KİŞİSEL BİLGİ TOPLANMAZ (Apple reddi gereği). Uygulama yalnız İŞLEVSEL bilgiyi (branş/rütbe =
 * hangi mevzuat gösterilecek) ister. AD/SOYAD ise SADECE gerektiğinde — Takdir Belgesi ilk çıkınca
 * "belgende görünecek adın bu mu?" diye bir kez sorulur (bkz. components/sicil/belge-isim-sor).
 * Böylece Apple Guideline 4/5.1.1(v) ile çakışmaz (giriş sonrası isim istenmez).
 */
export default function OnboardingScreen() {
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const { kullanici, hazir, profilYenile } = useAuth();
  const girisGerek = hazir && !kullanici;

  // ZORUNLU giriş/kayıt. (Uygulama turu artık _layout kök kapısında — yeni + mevcut herkese bir kez.)
  if (girisGerek) {
    return <AuthEkrani />;
  }
  // Yeni (veya cihazı sıfırlanmış) kullanıcı: branş/rütbe eksikse TEK-seferlik görev seçimi.
  if (!brans || !rutbe) {
    return <GorevAdim onTamam={() => void profilYenile()} />;
  }
  return null; // her şey tamam → _layout gate ana ekrana yönlendirir
}

// --- Görev adımı: yalnız branş/rütbe (işlevsel; hangi mevzuatın gösterileceğini belirler) ---
function GorevAdim({ onTamam }: { onTamam: () => void }) {
  const { setBrans } = useBrans();
  const { setRutbe } = useRutbe();
  const [brans, setBransSec] = useState<string | null>(null);
  const [rutbe, setRutbeSec] = useState<Rutbe | null>(null);
  const [branslar, setBranslar] = useState<{ slug: string; ad: string }[]>([]);
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    void getBranches().then((bs) => setBranslar(bs.map((b) => ({ slug: b.slug, ad: b.ad }))));
  }, []);

  async function kaydet() {
    if (!brans) return setHata('Branşını seç.');
    if (!rutbe) return setHata('Rütbeni/statünü seç.');
    setHata(null);
    setMesgul(true);
    try {
      await setBrans(brans); // müfredat filtresi (AsyncStorage + context)
      await setRutbe(rutbe);
      onTamam();
    } catch (e) {
      setHata(__DEV__ && e instanceof Error ? e.message : 'Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <DekoratifArkaplan />
      <ScrollView contentContainerStyle={styles.profilIcerik} keyboardShouldPersistTaps="handled">
        <View style={styles.profilUst}>
          <View style={styles.profilBaslikBlok}>
            <AppText variant="dev" bold color="lacivert">
              Görev{'\n'}Bilgilerin
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
              Sana doğru mevzuatı göstermemiz için branş ve rütbeni seç.
            </AppText>
          </View>
          <KarakterFigur style={styles.profilKarakter} />
        </View>

        <View style={styles.bolumBaslik}>
          <MaterialCommunityIcons name="shield-account-outline" size={18} color={Palette.altinKoyu} />
          <AppText variant="etiket" bold color="lacivert">
            GÖREV BİLGİLERİ
          </AppText>
        </View>
        <View style={styles.bolumKart}>
          <SecimKutu
            ikon="medal-outline"
            placeholder="Rütben / Statün"
            baslik="Rütbeni Seç"
            deger={rutbe}
            secenekler={RUTBELER}
            onSec={setRutbeSec}
          />
          <SecimKutu
            ikon="shield-account-outline"
            placeholder="Branşın / Sınıfın"
            baslik="Branşını Seç"
            deger={brans}
            secenekler={branslar}
            onSec={setBransSec}
          />
        </View>

        <AnaButon etiket="Devam et" onPress={() => void kaydet()} mesgul={mesgul} />

        {hata ? (
          <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
            {hata}
          </AppText>
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
  ortali: {
    textAlign: 'center',
  },
  altyazi: {
    lineHeight: 20,
  },
  profilIcerik: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  profilUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  profilBaslikBlok: {
    flex: 1,
    gap: Spacing.half,
  },
  profilKarakter: {
    width: 116,
    height: 146,
    marginRight: -Spacing.two,
  },
  bolumKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bolumBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
});
