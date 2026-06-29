import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type BildirimAyar, getAyar, planla, setAyar, testBildirimi } from '@/lib/bildirim';

const pad = (n: number) => n.toString().padStart(2, '0');
const ssMM = (saat: number, dakika: number) => `${pad(saat)}:${pad(dakika)}`;

export default function EgitimPlaniScreen() {
  const router = useRouter();
  const [ayar, setAyarState] = useState<BildirimAyar | null>(null);
  const [durum, setDurum] = useState<string | null>(null);
  const [kaydediyor, setKaydediyor] = useState(false);

  useEffect(() => {
    void getAyar().then(setAyarState);
  }, []);

  function guncelle(p: Partial<BildirimAyar>) {
    setAyarState((a) => (a ? { ...a, ...p } : a));
    setDurum(null);
  }

  async function kaydet() {
    if (!ayar) return;
    setKaydediyor(true);
    setDurum(null);
    await setAyar(ayar);
    const sonuc = await planla(ayar);
    setKaydediyor(false);
    setDurum(
      sonuc === 'ok'
        ? ayar.aktif
          ? 'Eğitim planı kuruldu — içtimalar zamanında düşecek. 🫡'
          : 'Bildirimler kapatıldı.'
        : sonuc === 'izin-yok'
          ? 'Bildirim izni verilmedi. Ayarlardan izni açman gerekiyor.'
          : sonuc === 'web'
            ? 'Ayar kaydedildi. Bildirimler yalnız telefonda (development build) çalışır.'
            : 'Planlama yapılamadı, tekrar dene.',
    );
  }

  async function testEt() {
    setDurum(null);
    const sonuc = await testBildirimi();
    setDurum(
      sonuc === 'ok'
        ? 'Test bildirimi ~5 saniye içinde düşecek 🔔 (uygulamayı arkaya alıp bekleyebilirsin).'
        : sonuc === 'izin-yok'
          ? 'Bildirim izni verilmedi — izin verince tekrar dene.'
          : sonuc === 'web'
            ? 'Test yalnız telefonda (Expo Go / build) çalışır.'
            : 'Test başarısız, tekrar dene.',
    );
  }

  if (!ayar) {
    return (
      <Screen title="Eğitim Planı" onGeri={() => router.back()}>
        <Loading metin="Yükleniyor…" />
      </Screen>
    );
  }

  return (
    <Screen title="Eğitim Planı" onGeri={() => router.back()}>
      <View style={styles.kart}>
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <AppText variant="govde" bold>
              Bildirimler
            </AppText>
            <AppText variant="etiket" color="solukMetin">
              Günde 3 içtima: sabah, gece ve fırsat eğitimi.
            </AppText>
          </View>
          <Switch
            value={ayar.aktif}
            onValueChange={(v) => guncelle({ aktif: v })}
            trackColor={{ true: Palette.lacivert, false: Palette.kenarlik }}
            thumbColor={Palette.beyaz}
          />
        </View>
      </View>

      <View style={styles.kart}>
        <SaatSatir
          ikon="weather-sunset-up"
          ad="Sabah İçtiması"
          saat={ayar.sabahSaat}
          dakika={ayar.sabahDakika}
          onDegis={(s, d) => guncelle({ sabahSaat: s, sabahDakika: d })}
        />
        <View style={styles.ayrac} />
        <SaatSatir
          ikon="weather-night"
          ad="Gece Eğitimi"
          saat={ayar.geceSaat}
          dakika={ayar.geceDakika}
          onDegis={(s, d) => guncelle({ geceSaat: s, geceDakika: d })}
        />
        <View style={styles.ayrac} />
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <View style={styles.adSatir}>
              <MaterialCommunityIcons name="flash-outline" size={20} color={Palette.amber} />
              <AppText variant="govde" bold>
                Fırsat Eğitimi
              </AppText>
            </View>
            <AppText variant="etiket" color="solukMetin">
              Sabah ve gece arasında rastgele bir saatte (sürpriz hatırlatma).
            </AppText>
          </View>
          <Switch
            value={ayar.firsatAktif}
            onValueChange={(v) => guncelle({ firsatAktif: v })}
            trackColor={{ true: Palette.lacivert, false: Palette.kenarlik }}
            thumbColor={Palette.beyaz}
          />
        </View>
      </View>

      <View style={styles.kart}>
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <AppText variant="govde" bold>
              Oturum başına kart
            </AppText>
            <AppText variant="etiket" color="solukMetin">
              İçtimada kaç kart çalışacağın (günlük kuyruğu sınırlar).
            </AppText>
          </View>
          <Stepper
            deger={ayar.gunlukKart}
            etiket={`${ayar.gunlukKart}`}
            onAzalt={() => guncelle({ gunlukKart: Math.max(5, ayar.gunlukKart - 5) })}
            onArtir={() => guncelle({ gunlukKart: Math.min(50, ayar.gunlukKart + 5) })}
          />
        </View>
      </View>

      {durum ? (
        <AppText variant="kucuk" color="lacivert" bold style={styles.durum}>
          {durum}
        </AppText>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.kaydet, pressed && styles.pressed, kaydediyor && styles.pasif]}
        disabled={kaydediyor}
        onPress={() => void kaydet()}>
        <AppText variant="govde" color="beyaz" bold>
          {kaydediyor ? 'Planlanıyor…' : 'Kaydet & Planla'}
        </AppText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.testBtn, pressed && styles.pressed]}
        onPress={() => void testEt()}>
        <MaterialCommunityIcons name="bell-ring-outline" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" color="lacivert" bold>
          Test bildirimi gönder (5 sn)
        </AppText>
      </Pressable>
    </Screen>
  );
}

function SaatSatir({
  ikon,
  ad,
  saat,
  dakika,
  onDegis,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  ad: string;
  saat: number;
  dakika: number;
  onDegis: (saat: number, dakika: number) => void;
}) {
  return (
    <View style={styles.saatSatir}>
      <View style={styles.adSatir}>
        <MaterialCommunityIcons name={ikon} size={20} color={Palette.lacivert} />
        <AppText variant="govde" bold>
          {ad}
        </AppText>
        <AppText variant="govde" bold color="altinKoyu" style={styles.saatBuyuk}>
          {ssMM(saat, dakika)}
        </AppText>
      </View>
      <View style={styles.saatKontrol}>
        <View style={styles.saatGrup}>
          <Stepper
            deger={saat}
            etiket={pad(saat)}
            onAzalt={() => onDegis((saat + 23) % 24, dakika)}
            onArtir={() => onDegis((saat + 1) % 24, dakika)}
          />
          <AppText variant="etiket" color="solukMetin">
            saat
          </AppText>
        </View>
        <View style={styles.saatGrup}>
          <Stepper
            deger={dakika}
            etiket={pad(dakika)}
            onAzalt={() => onDegis(saat, (dakika + 55) % 60)}
            onArtir={() => onDegis(saat, (dakika + 5) % 60)}
          />
          <AppText variant="etiket" color="solukMetin">
            dakika (5'er)
          </AppText>
        </View>
      </View>
    </View>
  );
}

function Stepper({
  etiket,
  onAzalt,
  onArtir,
}: {
  deger: number;
  etiket: string;
  onAzalt: () => void;
  onArtir: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]} onPress={onAzalt}>
        <MaterialCommunityIcons name="minus" size={20} color={Palette.beyaz} />
      </Pressable>
      <AppText variant="govde" bold style={styles.stepDeger}>
        {etiket}
      </AppText>
      <Pressable style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]} onPress={onArtir}>
        <MaterialCommunityIcons name="plus" size={20} color={Palette.beyaz} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  satirMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  adSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  saatSatir: {
    gap: Spacing.two,
  },
  saatBuyuk: {
    marginLeft: 'auto', // ad solda, büyük saat sağda
  },
  saatKontrol: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  saatGrup: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  ayrac: {
    height: 1,
    backgroundColor: Palette.kenarlik,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.s,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDeger: {
    minWidth: 52,
    textAlign: 'center',
  },
  durum: {
    textAlign: 'center',
  },
  kaydet: {
    backgroundColor: Palette.kirmizi,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
