import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  type BildirimAyar,
  type PushTani,
  getAyar,
  planla,
  pushTaniOku,
  setAyar,
  uzakPushTokenAl,
} from '@/lib/bildirim';
import { useKisiselOzellik } from '@/lib/ozellik';

const pad = (n: number) => n.toString().padStart(2, '0');
const ssMM = (saat: number, dakika: number) => `${pad(saat)}:${pad(dakika)}`;

export default function EgitimPlaniScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const [ayar, setAyarState] = useState<BildirimAyar | null>(null);
  const [durum, setDurum] = useState<string | null>(null);
  const [izinYok, setIzinYok] = useState(false);
  const [kaydediyor, setKaydediyor] = useState(false);

  // Uzak (push) bildirim tanısı — token alınabiliyor mu, alınamıyorsa nerede takılıyor.
  // iPhone'larda push token hiç oluşmuyordu ve sebebi görünmüyordu; artık burada yazıyor.
  const [tani, setTani] = useState<PushTani | null>(null);

  useEffect(() => {
    void getAyar().then(setAyarState);
    void uzakPushTokenAl().then(() => setTani(pushTaniOku()));
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
    setIzinYok(sonuc === 'izin-yok');
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


  if (!ayar) {
    return (
      <Screen title="Eğitim Planı" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
        <Loading metin="Yükleniyor…" />
      </Screen>
    );
  }

  return (
    <Screen title="Eğitim Planı" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
      <View style={[styles.kart, gece && styles.kartGece]}>
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
              Bildirimler
            </AppText>
            <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
              Günde 3 içtima: sabah, gece ve fırsat eğitimi.
            </AppText>
          </View>
          <Switch
            value={ayar.aktif}
            onValueChange={(v) => guncelle({ aktif: v })}
            trackColor={{ true: gece ? Palette.altin : Palette.lacivert, false: gece ? 'rgba(255,246,220,0.3)' : Palette.kenarlik }}
            thumbColor={Palette.beyaz}
            accessibilityLabel="Bildirimleri aç/kapat"
          />
        </View>
      </View>

      <View style={[styles.kart, gece && styles.kartGece]}>
        <SaatSatir
          gece={gece}
          ikon="weather-sunset-up"
          ad="Sabah İçtiması"
          saat={ayar.sabahSaat}
          dakika={ayar.sabahDakika}
          onDegis={(s, d) => guncelle({ sabahSaat: s, sabahDakika: d })}
        />
        <View style={[styles.ayrac, gece && styles.ayracGece]} />
        <SaatSatir
          gece={gece}
          ikon="weather-night"
          ad="Gece Eğitimi"
          saat={ayar.geceSaat}
          dakika={ayar.geceDakika}
          onDegis={(s, d) => guncelle({ geceSaat: s, geceDakika: d })}
        />
        <View style={[styles.ayrac, gece && styles.ayracGece]} />
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <View style={styles.adSatir}>
              <MaterialCommunityIcons
                name="flash-outline"
                size={20}
                color={gece ? Palette.altinParlak : Palette.amber}
              />
              <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
                Fırsat Eğitimi
              </AppText>
            </View>
            <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
              Sabah ve gece arasında rastgele bir saatte (sürpriz hatırlatma).
            </AppText>
          </View>
          <Switch
            value={ayar.firsatAktif}
            onValueChange={(v) => guncelle({ firsatAktif: v })}
            trackColor={{ true: gece ? Palette.altin : Palette.lacivert, false: gece ? 'rgba(255,246,220,0.3)' : Palette.kenarlik }}
            thumbColor={Palette.beyaz}
            accessibilityLabel="Fırsat eğitimini aç/kapat"
          />
        </View>
      </View>

      <View style={[styles.kart, gece && styles.kartGece]}>
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
              Oturum başına kart
            </AppText>
            <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
              İçtimada kaç kart çalışacağın (günlük kuyruğu sınırlar).
            </AppText>
          </View>
          <Stepper
            gece={gece}
            deger={ayar.gunlukKart}
            etiket={`${ayar.gunlukKart}`}
            ad="kart sayısı"
            onAzalt={() => guncelle({ gunlukKart: Math.max(5, ayar.gunlukKart - 5) })}
            onArtir={() => guncelle({ gunlukKart: Math.min(50, ayar.gunlukKart + 5) })}
          />
        </View>
      </View>

      {durum ? (
        <AppText variant="kucuk" color={gece ? 'altinParlak' : 'lacivert'} bold style={styles.durum}>
          {durum}
        </AppText>
      ) : null}

      {/* Uzak bildirim tanısı — SADECE sorun varsa görünür. Sorun yoksa kullanıcıyı meşgul etmez. */}
      {tani && tani.asama !== 'tamam' && tani.asama !== 'web' ? (
        <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.durum}>
          {tani.asama === 'izin-verilmedi'
            ? 'Uzak bildirimler kapalı: telefon ayarlarından bu uygulamaya bildirim izni ver.'
            : tani.asama === 'gercek-cihaz-degil'
              ? 'Uzak bildirimler yalnız gerçek telefonda çalışır.'
              : `Uzak bildirimler bu cihazda kurulamadı (${tani.asama}${tani.hata ? ': ' + tani.hata : ''}).`}
        </AppText>
      ) : null}

      {izinYok ? (
        <Pressable
          style={({ pressed }) => [styles.testBtn, gece && styles.testBtnGece, pressed && styles.pressed]}
          onPress={() => void Linking.openSettings()}
          accessibilityRole="button">
          <MaterialCommunityIcons
            name="cog-outline"
            size={18}
            color={gece ? Palette.altinParlak : Palette.lacivert}
          />
          <AppText variant="kucuk" color={gece ? 'altinParlak' : 'lacivert'} bold>
            Bildirim ayarlarını aç
          </AppText>
        </Pressable>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.kaydet, gece && styles.kaydetGece, pressed && styles.pressed, kaydediyor && styles.pasif]}
        disabled={kaydediyor}
        onPress={() => void kaydet()}
        accessibilityRole="button">
        <AppText variant="govde" color="beyaz" bold>
          {kaydediyor ? 'Planlanıyor…' : 'Kaydet & Planla'}
        </AppText>
      </Pressable>

    </Screen>
  );
}

function SaatSatir({
  gece,
  ikon,
  ad,
  saat,
  dakika,
  onDegis,
}: {
  gece: boolean;
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  ad: string;
  saat: number;
  dakika: number;
  onDegis: (saat: number, dakika: number) => void;
}) {
  return (
    <View style={styles.saatSatir}>
      <View style={styles.adSatir}>
        <MaterialCommunityIcons
          name={ikon}
          size={20}
          color={gece ? Palette.altinParlak : Palette.lacivert}
        />
        <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
          {ad}
        </AppText>
        <AppText variant="govde" bold color={gece ? 'altinParlak' : 'altinKoyu'} style={styles.saatBuyuk}>
          {ssMM(saat, dakika)}
        </AppText>
      </View>
      <View style={styles.saatKontrol}>
        <View style={styles.saatGrup}>
          <Stepper
            gece={gece}
            deger={saat}
            etiket={pad(saat)}
            ad={`${ad} saati`}
            onAzalt={() => onDegis((saat + 23) % 24, dakika)}
            onArtir={() => onDegis((saat + 1) % 24, dakika)}
          />
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            saat
          </AppText>
        </View>
        <View style={styles.saatGrup}>
          <Stepper
            gece={gece}
            deger={dakika}
            etiket={pad(dakika)}
            ad={`${ad} dakikası`}
            onAzalt={() => onDegis(saat, (dakika + 55) % 60)}
            onArtir={() => onDegis(saat, (dakika + 5) % 60)}
          />
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            dakika (5'er)
          </AppText>
        </View>
      </View>
    </View>
  );
}

function Stepper({
  gece,
  etiket,
  ad,
  onAzalt,
  onArtir,
}: {
  gece: boolean;
  deger: number;
  etiket: string;
  ad?: string;
  onAzalt: () => void;
  onArtir: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={({ pressed }) => [styles.stepBtn, gece && styles.stepBtnGece, pressed && styles.pressed]}
        onPress={onAzalt}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={ad ? `${ad} azalt` : 'Azalt'}>
        <MaterialCommunityIcons name="minus" size={20} color={Palette.beyaz} />
      </Pressable>
      <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'} style={styles.stepDeger}>
        {etiket}
      </AppText>
      <Pressable
        style={({ pressed }) => [styles.stepBtn, gece && styles.stepBtnGece, pressed && styles.pressed]}
        onPress={onArtir}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={ad ? `${ad} artır` : 'Artır'}>
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: Spacing.two,
    columnGap: Spacing.four,
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
    backgroundColor: Palette.lacivert,
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
  // Gece dili (bayraklı)
  kartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  ayracGece: {
    backgroundColor: 'rgba(126,205,218,0.3)',
  },
  testBtnGece: {
    borderColor: '#F3C24A',
  },
  kaydetGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
  stepBtnGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.7)',
  },
});
