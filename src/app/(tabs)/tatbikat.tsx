import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DogrulamaKapisi } from '@/components/auth/dogrulama-kapisi';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { genelDenemeErisilebilir } from '@/constants/urunler';
import { getSinavSonuclari } from '@/db/database';
import type { SinavSonuc } from '@/db/schema';
import { useKisiselOzellik } from '@/lib/ozellik';
import { useBrans } from '@/lib/brans-context';
import { genelDenemeler, puanKatsayisi } from '@/lib/sinav';

/**
 * DENEMELER — üç takım deneme sınavı: Müşterek Konular (3×50) · Branş (5×50, Jandarma) ·
 * Karma/Genel (5×100, müşterek + branş).
 *
 * 23 Ağu (başkan): "talimi de tatbikatı da kaldır, adam direkt deneme için giriyor zaten;
 * kaldığı yere gidecekse ya da zayıf mevzisini çalışacaksa çalışma bölümüne gitsin —
 * orası ayrı, burası ayrı." Kanun kanun talim artık YALNIZ Mevzuat'taki "Talim Yap"
 * düğmesinden; bu ekranda kanun listesi YOK.
 */
export default function TatbikatScreen() {
  // E-POSTA DOĞRULAMA KAPISI: doğrulanmamış hesap içeriğe giremez (girişe izin var, içerik kilitli).
  return (
    <DogrulamaKapisi>
      <TatbikatIcerik />
    </DogrulamaKapisi>
  );
}

function TatbikatIcerik() {
  const router = useRouter();
  const { brans } = useBrans();
  // law_id → (test → SON deneme sonucu). Genel denemelerde sanal law_id kullanılır.
  const [sonucMap, setSonucMap] = useState<Map<number, Map<number, SinavSonuc>>>(new Map());
  // 23 Ağu (başkan: "talimi de tatbikatı da kaldır, adam direkt deneme için giriyor"):
  // bu ekran ARTIK YALNIZ DENEMELER. Kanun kanun talim Mevzuat'taki "Talim Yap" düğmesinde,
  // kaldığın yer / zayıf mevzi ise çalışma bölümünde — burası ayrı, orası ayrı.
  // Takım seçimi: Müşterek Konular / Branş / Karma (Genel).
  const [blok, setBlok] = useState<'müşterek' | 'brans' | 'karma'>('müşterek');
  // 23 Ağu: karma denemeler ÖNCE BAŞKANDA. Onay gelince sunucudan (ozellik_herkes)
  // herkese açılır — yeni yayın gerekmez.
  const karmaAcik = useKisiselOzellik('karma-deneme');
  // Başkan (23 Ağu): "bu alandaki arka planı uygulamada neyse öyle yap." Karargâh ve
  // Mevzuat gece temasındayken Denemeler krem kalıyordu — aynı bayrağa bağlandı.
  const geceTema = useKisiselOzellik('talim-mevzuata');
  const yukle = useCallback(() => {
    // Son deneme skorları (law_id → en güncel; getSinavSonuclari id artan → son yazan kalır).
    void getSinavSonuclari()
      .then((sonuclar) => {
        const sm = new Map<number, Map<number, SinavSonuc>>();
        for (const s of sonuclar) {
          let m = sm.get(s.law_id);
          if (!m) {
            m = new Map();
            sm.set(s.law_id, m);
          }
          m.set(s.test, s); // id artan → son yazan (en güncel) kalır
        }
        setSonucMap(sm);
      })
      .catch(() => setSonucMap(new Map()));
  }, []);

  useFocusEffect(yukle);

  function genelDenemeGit(no: number, takim: 'müşterek' | 'brans' | 'karma' = 'müşterek') {
    router.push({
      pathname: '/sinav',
      params: takim === 'müşterek' ? { genel: String(no) } : { genel: String(no), gblok: takim },
    });
  }

  // Tatbikat sınavları (genel denemeler) HERKESE ücretsiz (başkan kararı) — müşterek + branş.
  const genelKilitli = !genelDenemeErisilebilir();

  return (
    <Screen title="Denemeler" koyu={geceTema} kompaktBaslik={geceTema}>
      {/* TAKIM SEÇİMİ: Müşterek Konular · Branş · Karma (Genel). */}
      <View style={styles.blokSecici}>
        {(karmaAcik
          ? (['müşterek', 'brans', 'karma'] as const)
          : (['müşterek', 'brans'] as const)
        ).map((b) => {
          const aktif = blok === b;
          return (
            <Pressable
              key={b}
              onPress={() => setBlok(b)}
              style={[
                styles.blokSeg,
                geceTema && styles.blokSegGece,
                aktif && (geceTema ? styles.blokSegAktifGece : styles.blokSegAktif),
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                b === 'müşterek' ? 'Müşterek sınavlar' : b === 'brans' ? 'Branş sınavları' : 'Karma genel denemeler'
              }>
              <MaterialCommunityIcons
                name={b === 'müşterek' ? 'account-group' : b === 'brans' ? 'medal-outline' : 'shuffle-variant'}
                size={16}
                color={aktif ? (geceTema ? Palette.altinParlak : Palette.beyaz) : geceTema ? 'rgba(226,236,240,0.75)' : Palette.solukMetin}
              />
              <AppText
                variant="etiket"
                bold
                color={aktif ? (geceTema ? 'altinParlak' : 'beyaz') : geceTema ? 'beyaz' : 'anaMetin'}>
                {b === 'müşterek' ? 'Müşterek' : b === 'brans' ? 'Branş' : 'Karma'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Branş denemeleri YALNIZ Jandarma'ya özgü (5×50). Diğer branşlarda henüz yok.
          Karma denemeler tüm branşlara açık. */}
      {blok === 'brans' && brans !== 'jandarma' ? (
          <DurumKutu
            ikon="flag-checkered"
            baslik="Yakında"
            aciklama="Bu branşın denemeleri hazırlanıyor. Müşterek ve Karma denemeleri üstteki sekmelerden çözebilirsin."
          />
        ) : (
        <>
          <AppText variant="kucuk" color={geceTema ? 'kartMetinIkincil' : 'solukMetin'}>
            {blok === 'karma'
              ? 'Genel denemeler müşterek + branş konularından 100 sorudur (50 + 50) — gerçek sınav uzunluğu. Her soru 1 puan (toplam 100). Yanlışların zayıf mevzilerine düşer.'
              : blok === 'brans'
                ? 'Branş denemeleri branş kanunlarından karma 50 sorudur. Her soru 2 puan (toplam 100). Yanlışların zayıf mevzilerine düşer.'
                : 'Müşterek Konular denemeleri 25 müşterek kanundan karma 50 sorudur. Her soru 2 puan (toplam 100). Yanlışların zayıf mevzilerine düşer.'}
          </AppText>
          {genelDenemeler(blok === 'müşterek' ? undefined : blok).map((d) => (
            <GenelDenemeSatir
              key={d.no}
              deneme={{ ...d, baslik: denemeAdi(blok, d.no) }}
              katsayi={puanKatsayisi(blok === 'müşterek' ? undefined : blok)}
              // Sanal law_id: karma -(200+no), branş -(100+no), müşterek -no (sinav.tsx ile birebir).
              sonuc={sonucMap
                .get(blok === 'karma' ? -(200 + d.no) : blok === 'brans' ? -(100 + d.no) : -d.no)
                ?.get(0)}
              kilitli={genelKilitli}
              gece={geceTema}
              onGit={() => (genelKilitli ? router.push('/paywall') : genelDenemeGit(d.no, blok))}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

/**
 * Deneme adı (başkan, 23 Ağu): müşterek → "Müşterek Konular Deneme 1",
 * branş → "Branş Deneme 1", karma → "Genel Deneme 1". Veri dosyalarındaki `baslik`
 * yerine burada üretilir (üreteçleri yeniden çalıştırmaya gerek kalmasın).
 */
function denemeAdi(blok: 'müşterek' | 'brans' | 'karma', no: number): string {
  if (blok === 'karma') return `Genel Deneme ${no}`;
  if (blok === 'brans') return `Branş Deneme ${no}`;
  return `Müşterek Konular Deneme ${no}`;
}

/** Genel deneme (Tatbikat) satırı: başlık + soru sayısı + son puan + kilit. */
function GenelDenemeSatir({
  deneme,
  katsayi,
  sonuc,
  kilitli,
  gece,
  onGit,
}: {
  deneme: { no: number; baslik: string; soruSayisi: number };
  katsayi: number;
  sonuc: SinavSonuc | undefined;
  kilitli: boolean;
  gece?: boolean;
  onGit: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.genelSatir, gece && styles.genelSatirGece, pressed && styles.pressed]}
      onPress={onGit}
      accessibilityRole="button"
      accessibilityLabel={deneme.baslik}>
      <View style={[styles.monogram, gece && styles.monogramGece]}>
        <MaterialCommunityIcons name="flag-checkered" size={22} color={Palette.altin} />
      </View>
      <View style={styles.satirMetin}>
        <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
          {deneme.baslik}
        </AppText>
        <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
          {deneme.soruSayisi} soru · {deneme.soruSayisi * katsayi} puan
          {sonuc ? ` · Son: ${sonuc.dogru * katsayi}/${sonuc.toplam * katsayi} puan` : ''}
        </AppText>
      </View>
      <MaterialCommunityIcons
        name={kilitli ? 'lock' : 'chevron-right'}
        size={22}
        color={kilitli ? Palette.altinKoyu : Palette.solukMetin}
      />
    </Pressable>
  );
}


/** Yükleniyor/hata/placeholder kutusu (krem zemin). */
function DurumKutu({
  ikon,
  baslik,
  aciklama,
  buton,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  aciklama: string;
  buton?: { etiket: string; onPress: () => void };
}) {
  return (
    <View style={styles.merkezKutu}>
      <MaterialCommunityIcons name={ikon} size={40} color={Palette.solukMetin} />
      <AppText variant="altBaslik" bold color="lacivert">
        {baslik}
      </AppText>
      {aciklama ? (
        <AppText variant="kucuk" color="solukMetin" style={styles.merkezAciklama}>
          {aciklama}
        </AppText>
      ) : null}
      {buton ? (
        <Pressable onPress={buton.onPress} style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
          <AppText variant="kucuk" bold color="lacivert">
            {buton.etiket}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blokSecici: {
    flexDirection: 'row',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  blokSeg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.m,
  },
  blokSegAktif: {
    backgroundColor: Palette.lacivert,
  },
  // GECE TEMASI (Mevzuat ekranıyla aynı dil): saydam petrol hap + altın kenar.
  blokSegGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    borderRadius: 999,
  },
  blokSegAktifGece: {
    backgroundColor: 'rgba(3,47,69,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
    borderRadius: 999,
  },
  // Lacivert monogram, koyu kartın üstünde kayboluyordu → altın tuşlu saydam kare.
  monogramGece: {
    backgroundColor: 'rgba(243,194,74,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(243,194,74,0.45)',
  },
  genelSatirGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderColor: 'rgba(126,205,218,0.3)',
  },
  satir: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  genelSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  satirMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  satirBas: {
    gap: Spacing.two,
  },
  testler: {
    marginTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Palette.ayirici,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  testSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  testOrta: {
    flex: 1,
    gap: Spacing.half,
  },
  satirUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  kanunAd: {
    flex: 1,
  },
  ucretsizChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Palette.yesil,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginTop: Spacing.half,
  },
  altSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  monogram: {
    width: 48,
    height: 48,
    borderRadius: Radius.m,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Kanun no (örn. 5237) kutuya TEK SATIR sığsın — küçülerek (alt satıra taşmaz).
  monoNo: {
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  merkezKutu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  merkezAciklama: {
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.two,
    backgroundColor: Palette.altin,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
