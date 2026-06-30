import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdimGostergesi } from '@/components/auth/adim-gostergesi';
import { AnaButon } from '@/components/auth/ana-buton';
import { Arma } from '@/components/auth/arma';
import { AuthEkrani } from '@/components/auth/auth-ekrani';
import { AuthGirdi } from '@/components/auth/auth-girdi';
import { DekoratifArkaplan } from '@/components/auth/dekoratif-arkaplan';
import { DogumTarihiSecici } from '@/components/auth/dogum-tarihi-secici';
import { KarakterFigur } from '@/components/auth/karakter-figur';
import { SecimKutu } from '@/components/auth/secim-kutu';
import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { RESMI_BAGLANTI_YOK } from '@/constants/yasal-metin';
import { getBranches } from '@/db/database';
import { type Cinsiyet, profilKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { useBrans } from '@/lib/brans-context';
import { adHatasi, telefonHatasi } from '@/lib/dogrulama';
import { type Rutbe, RUTBELER } from '@/lib/rutbe-store';
import { useRutbe } from '@/lib/rutbe-context';

/**
 * İlk açılış akışı: Tanıtım → ZORUNLU giriş/kayıt (AuthEkrani) → PROFİL (TEK adım: ad/soyad/
 * telefon/doğum/cinsiyet + branş/rütbe) → ana ekran. İlk girişte her şey BİR KEZ kurulur;
 * sonradan Evsaf → Ayarlar'dan değiştirilir. Branş/rütbe artık profilin içinde (ayrı adım yok).
 */
export default function OnboardingScreen() {
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const { kullanici, hazir, profilTamam, profilYenile } = useAuth();
  const [tanitimGecildi, setTanitimGecildi] = useState(false);
  const girisGerek = hazir && !kullanici;

  // 0: tanıtım (yeni kullanıcı, giriş öncesi).
  if (!brans && !rutbe && !tanitimGecildi) {
    return <Tanitim onBasla={() => setTanitimGecildi(true)} />;
  }
  // 0.5: ZORUNLU giriş/kayıt.
  if (girisGerek) {
    return <AuthEkrani />;
  }
  // Profil tamlığı çekiliyor → bekle.
  if (kullanici && profilTamam === null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.icerik, styles.merkezde]}>
          <ActivityIndicator color={Palette.lacivert} />
        </View>
      </SafeAreaView>
    );
  }
  // PROFİL — tek seferlik kurulum (kişisel + görev/branş/rütbe). Eksikse zorunlu.
  if (profilTamam === false) {
    return <ProfilAdim onTamam={() => void profilYenile()} />;
  }
  return null; // her şey tamam → _layout gate ana ekrana yönlendirir
}

// --- Tanıtım (değer önermesi) ---

const DEGERLER: { ikon: keyof typeof MaterialCommunityIcons.glyphMap; baslik: string; metin: string }[] = [
  { ikon: 'image-multiple', baslik: 'Görsel hafıza kartları', metin: 'Her kanun maddesi akılda kalıcı bir karikatür sahneye dönüşür.' },
  { ikon: 'clipboard-check', baslik: 'Deneme sınavları', metin: 'Kendini sına; %100 yapınca Takdir Belgesi kazan.' },
  { ikon: 'medal', baslik: 'Sicil & ödül', metin: 'İlerlemeni gör, takdir topla, zayıf mevzilerini kapat.' },
];

function Tanitim({ onBasla }: { onBasla: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <DekoratifArkaplan />
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.markaArma}>
          <Arma />
          <AppText variant="etiket" bold color="altinMetin" style={styles.markaAd}>
            MEVZU · JSPS
          </AppText>
        </View>
        <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
          Kanunları görselle, kalıcı öğren
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={[styles.ortali, styles.altyazi]}>
          Kuru metni ezberleme; karikatür kartlar, deneme sınavları ve ödül-sicil temasıyla
          JSPS'e hazırlan.
        </AppText>
        <AppText variant="etiket" color="solukMetin" style={[styles.ortali, styles.disclaimer]}>
          {RESMI_BAGLANTI_YOK}
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
        <AnaButon etiket="Başla" onPress={onBasla} />
      </View>
    </SafeAreaView>
  );
}

// --- Profil adımı (kayıt adım 2) ---

const CINSIYETLER: { deger: Cinsiyet; etiket: string }[] = [
  { deger: 'kadin', etiket: 'Kadın' },
  { deger: 'erkek', etiket: 'Erkek' },
  { deger: 'belirtmek_istemiyorum', etiket: 'Belirtmem' },
];

const iki = (n: number) => String(n).padStart(2, '0');
const tarihISO = (d: Date) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
const tarihGoster = (d: Date) => `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;

function ProfilAdim({ onTamam }: { onTamam: () => void }) {
  const { setBrans } = useBrans();
  const { setRutbe } = useRutbe();
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [dogum, setDogum] = useState<Date | null>(null);
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet | null>(null);
  const [brans, setBransSec] = useState<string | null>(null);
  const [rutbe, setRutbeSec] = useState<Rutbe | null>(null);
  const [branslar, setBranslar] = useState<{ slug: string; ad: string }[]>([]);
  const [tarihAcik, setTarihAcik] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    void getBranches().then((bs) => setBranslar(bs.map((b) => ({ slug: b.slug, ad: b.ad }))));
  }, []);

  async function kaydet() {
    const h = adHatasi(ad, 'Ad') ?? adHatasi(soyad, 'Soyad') ?? telefonHatasi(telefon);
    if (h) return setHata(h);
    if (!dogum) return setHata('Doğum tarihini seç.');
    if (!cinsiyet) return setHata('Cinsiyetini seç.');
    if (!brans) return setHata('Branşını seç.');
    if (!rutbe) return setHata('Rütbeni/statünü seç.');
    setHata(null);
    setMesgul(true);
    try {
      await profilKaydet({ ad, soyad, telefon, dogumTarihi: tarihISO(dogum), cinsiyet });
      await setBrans(brans); // müfredat filtresi (AsyncStorage + context)
      await setRutbe(rutbe);
      onTamam();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi, tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <DekoratifArkaplan />
      <ScrollView contentContainerStyle={styles.profilIcerik} keyboardShouldPersistTaps="handled">
        {/* Adım göstergesi EN ÜSTTE — karakter figürü "Tamamla"yı kapatmasın diye. */}
        <AdimGostergesi adim={2} />

        <View style={styles.profilUst}>
          <View style={styles.profilBaslikBlok}>
            <AppText variant="dev" bold color="lacivert">
              Profilini Tamamlayalım
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
              Adın kazandığın Takdir Belgelerinde yazacak. Bilgilerini eksiksiz gir.
            </AppText>
          </View>
          <KarakterFigur style={styles.profilKarakter} />
        </View>

        <View style={styles.bolumBaslik}>
          <MaterialCommunityIcons name="account-outline" size={18} color={Palette.altinKoyu} />
          <AppText variant="etiket" bold color="lacivert">
            KİŞİSEL BİLGİLER
          </AppText>
        </View>

        <View style={styles.bolumKart}>
          <View style={styles.ikili}>
            <View style={styles.yari}>
              <AuthGirdi ikon="account-outline" placeholder="Ad" value={ad} onChangeText={setAd} autoCapitalize="words" />
            </View>
            <View style={styles.yari}>
              <AuthGirdi ikon="account-outline" placeholder="Soyad" value={soyad} onChangeText={setSoyad} autoCapitalize="words" />
            </View>
          </View>

          <AuthGirdi
            ikon="phone-outline"
            placeholder="Telefon (05XX XXX XX XX)"
            value={telefon}
            onChangeText={setTelefon}
            keyboardType="phone-pad"
            inputMode="tel"
            maxLength={20}
          />

          <Pressable style={styles.tarihKutu} onPress={() => setTarihAcik(true)}>
            <MaterialCommunityIcons name="calendar-outline" size={20} color={Palette.solukMetin} />
            <AppText variant="govde" color={dogum ? 'anaMetin' : 'solukMetin'} style={styles.tarihMetin}>
              {dogum ? tarihGoster(dogum) : 'Doğum tarihi'}
            </AppText>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Palette.solukMetin} />
          </Pressable>

          <View style={styles.cinsiyet}>
            {CINSIYETLER.map((c) => {
              const secili = cinsiyet === c.deger;
              return (
                <Pressable
                  key={c.deger}
                  style={[styles.cinsBtn, secili && styles.cinsSecili]}
                  onPress={() => setCinsiyet(c.deger)}>
                  <AppText variant="etiket" bold color={secili ? 'beyaz' : 'anaMetin'} numberOfLines={1}>
                    {c.etiket}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
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

      <DogumTarihiSecici
        acik={tarihAcik}
        deger={dogum}
        onSec={(d) => {
          setDogum(d);
          setTarihAcik(false);
        }}
        onKapat={() => setTarihAcik(false)}
      />
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
  merkezde: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marka: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  markaArma: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  markaAd: {
    letterSpacing: 2,
  },
  ortali: {
    textAlign: 'center',
  },
  altyazi: {
    lineHeight: 20,
  },
  disclaimer: {
    lineHeight: 15,
    marginTop: Spacing.two,
    opacity: 0.85,
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
  anaBtn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  // Profil
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
  ikili: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  yari: {
    flex: 1,
  },
  tarihKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  tarihMetin: {
    flex: 1,
  },
  cinsiyet: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cinsBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinsSecili: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
