import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdimGostergesi } from '@/components/auth/adim-gostergesi';
import { AuthEkrani } from '@/components/auth/auth-ekrani';
import { AuthGirdi } from '@/components/auth/auth-girdi';
import { KarakterFigur } from '@/components/auth/karakter-figur';
import { BransSecici } from '@/components/brans-secici';
import { RutbeSecici } from '@/components/rutbe-secici';
import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { type Cinsiyet, profilKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { useBrans } from '@/lib/brans-context';
import { adHatasi, telefonHatasi } from '@/lib/dogrulama';
import { useRutbe } from '@/lib/rutbe-context';

/**
 * İlk açılış akışı: Tanıtım → ZORUNLU giriş/kayıt (AuthEkrani) → PROFİL (ad/soyad/telefon/
 * doğum/cinsiyet) → branş → rütbe → ana ekran. Giriş + profil zorunlu (gate: _layout).
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { brans, setBrans } = useBrans();
  const { rutbe, setRutbe } = useRutbe();
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
  // 0.7: PROFİL (eksikse zorunlu).
  if (profilTamam === false) {
    return <ProfilAdim onTamam={() => void profilYenile()} />;
  }
  // 1: branş.
  if (!brans) {
    return (
      <BransSecici
        baslik="Branşını Seç"
        altyazi="Mevzuatın buna göre filtrelenecek. Sonradan Evsaf'tan değiştirebilirsin."
        onSelect={(slug) => void setBrans(slug)}
      />
    );
  }
  // 2: rütbe.
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

// --- Tanıtım (değer önermesi) ---

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
        <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
          Kanunları görselle, kalıcı öğren
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={[styles.ortali, styles.altyazi]}>
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
        <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.pressed]} onPress={onBasla}>
          <AppText variant="govde" bold color="beyaz">
            Başla
          </AppText>
        </Pressable>
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
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [dogum, setDogum] = useState<Date | null>(null);
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet | null>(null);
  const [tarihAcik, setTarihAcik] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function tarihSecildi(e: DateTimePickerEvent, d?: Date) {
    setTarihAcik(false);
    if (e.type === 'set' && d) setDogum(d);
  }

  async function kaydet() {
    const h = adHatasi(ad, 'Ad') ?? adHatasi(soyad, 'Soyad') ?? telefonHatasi(telefon);
    if (h) return setHata(h);
    if (!dogum) return setHata('Doğum tarihini seç.');
    if (!cinsiyet) return setHata('Cinsiyetini seç.');
    setHata(null);
    setMesgul(true);
    try {
      await profilKaydet({ ad, soyad, telefon, dogumTarihi: tarihISO(dogum), cinsiyet });
      onTamam();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi, tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.profilIcerik} keyboardShouldPersistTaps="handled">
        <View style={styles.profilUst}>
          <View style={styles.arma}>
            <MaterialCommunityIcons name="shield-star" size={26} color={Palette.altinKoyu} />
          </View>
          <KarakterFigur style={styles.profilKarakter} />
        </View>

        <AdimGostergesi adim={2} />

        <AppText variant="dev" bold color="lacivert" style={styles.profilBaslik}>
          Profilini Tanıyalım
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
          Adın kazandığın Takdir Belgelerinde yazacak. Bilgilerini eksiksiz gir.
        </AppText>

        <View style={styles.bolumBaslik}>
          <MaterialCommunityIcons name="account-outline" size={18} color={Palette.altinKoyu} />
          <AppText variant="etiket" bold color="lacivert">
            Kişisel Bilgiler
          </AppText>
        </View>

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
        {tarihAcik ? (
          <DateTimePicker
            value={dogum ?? new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={tarihSecildi}
          />
        ) : null}

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

        <Pressable
          disabled={mesgul}
          style={({ pressed }) => [styles.anaBtnRow, pressed && styles.pressed, mesgul && styles.pasif]}
          onPress={() => void kaydet()}>
          {mesgul ? (
            <ActivityIndicator color={Palette.beyaz} />
          ) : (
            <>
              <AppText variant="govde" bold color="beyaz">
                Devam et
              </AppText>
              <MaterialCommunityIcons name="arrow-right" size={20} color={Palette.beyaz} />
            </>
          )}
        </Pressable>

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
  markaAd: {
    letterSpacing: 2,
  },
  ortali: {
    textAlign: 'center',
  },
  altyazi: {
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
    height: 130,
  },
  arma: {
    position: 'absolute',
    top: Spacing.two,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilKarakter: {
    position: 'absolute',
    right: -Spacing.two,
    top: 0,
  },
  profilBaslik: {
    marginTop: Spacing.one,
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
  anaBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    height: 52,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
