import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DogrulamaKapisi } from '@/components/auth/dogrulama-kapisi';
import { AppText } from '@/components/ui/app-text';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { genelDenemeErisilebilir } from '@/constants/urunler';
import { getAllCards, getBolumKartIds, getLaws, getSinavSonuclari, getStudyCards } from '@/db/database';
import type { LawWithCount, SinavSonuc } from '@/db/schema';
import { LAW_KLASOR } from '@/db/seed';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';
import { rutbeGorur } from '@/lib/rutbe-kapsam';
import { genelDenemeler, PUAN_KATSAYI, sinavSoruSayisi, sinavVarMi, testSayisi, testSoruSayisi } from '@/lib/sinav';
import { useUyelik } from '@/lib/uyelik-context';

/** Bir kanunun deneme sınavı durumu (kilit + ilerleme). */
type Durum = { calisilan: number; toplam: number; tamam: boolean };

/**
 * Tatbikat — kanun bazlı deneme sınavı.
 * Bir kanunun TÜM (bölüme bağlı) kartları çalışılınca (Mevzuat'taki "Tamamlananlar"
 * ile birebir) o kanunun deneme sınavı AÇILIR; aksi hâlde KİLİTLİ ("önce çalış").
 * Yalnız soru havuzu olan müşterek kanunlar listelenir; branş içeriği "çok yakında".
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
  const { rutbe } = useRutbe();
  const [laws, setLaws] = useState<LawWithCount[] | null>(null);
  // law_id → kilit/ilerleme durumu (Mevzuat ile aynı: bölüme bağlı + kutu≥1).
  const [durumMap, setDurumMap] = useState<Map<number, Durum>>(new Map());
  // law_id → (test → SON deneme sonucu). Her testin son skoru ayrı ("Son: X/Y").
  const [sonucMap, setSonucMap] = useState<Map<number, Map<number, SinavSonuc>>>(new Map());
  // Üst seçim: Talim (kanun denemeleri) / Tatbikat (Genel Deneme 1/2/3).
  const [mod, setMod] = useState<'talim' | 'tatbikat'>('talim');
  // Üst seçim: Müşterek (mevcut) / Branş (içerik güncellemelerle eklenecek → "hazırlanıyor").
  const [blok, setBlok] = useState<'müşterek' | 'brans'>('müşterek');
  const { kanunErisilebilir } = useUyelik();
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    if (!brans) return;
    setHata(false);
    void getLaws(brans)
      .then(setLaws)
      .catch(() => setHata(true));
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
    // İlerleme/kilit: Mevzuat'taki "tamam" tanımı (bölüme bağlı kart kümesi + kutu≥1).
    void Promise.all([getStudyCards(), getAllCards(), getBolumKartIds()])
      .then(([studied, allCards, bolumKartIds]) => {
        const bagli = new Set(bolumKartIds);
        const toplam = new Map<number, number>();
        for (const c of allCards) {
          if (bagli.has(c.id)) toplam.set(c.law_id, (toplam.get(c.law_id) ?? 0) + 1);
        }
        const calisilan = new Map<number, number>();
        for (const c of studied) {
          if (c.kutu >= 1 && bagli.has(c.id)) {
            calisilan.set(c.law_id, (calisilan.get(c.law_id) ?? 0) + 1);
          }
        }
        const m = new Map<number, Durum>();
        for (const lawId of toplam.keys()) {
          const top = toplam.get(lawId) ?? 0;
          const cal = calisilan.get(lawId) ?? 0;
          m.set(lawId, { calisilan: cal, toplam: top, tamam: top > 0 && cal >= top });
        }
        setDurumMap(m);
      })
      .catch(() => setDurumMap(new Map()));
  }, [brans]);

  useFocusEffect(yukle);

  // Sınavı (soru havuzu) olan + rütbe kapsamındaki kanunlar. Müşterek sekmesi: müşterek;
  // Branş sekmesi: branş kanunları (Jandarma deneme soruları law 26-66'ya yüklendi).
  const musterek = (
    laws?.filter(
      (l) => l.blok === (blok === 'brans' ? 'branş' : 'müşterek') && sinavVarMi(l.id) && rutbeGorur(l.id, rutbe),
    ) ?? []
  ).sort((a, b) =>
    blok === 'brans' ? (a.id === 67 ? 0 : a.id) - (b.id === 67 ? 0 : b.id) : 0,
  ); // branş sekmesinde TCK (67) en üstte

  function sinavaGit(law: LawWithCount, test: number) {
    router.push({ pathname: '/sinav', params: { lawId: String(law.id), test: String(test) } });
  }

  function genelDenemeGit(no: number, brans = false) {
    router.push({
      pathname: '/sinav',
      params: brans ? { genel: String(no), gblok: 'brans' } : { genel: String(no) },
    });
  }

  // Tatbikat sınavları (genel denemeler) HERKESE ücretsiz (başkan kararı) — müşterek + branş.
  const genelKilitli = !genelDenemeErisilebilir();

  return (
    <Screen title="Talim">
      {/* ÜST SEÇİM: Müşterek (mevcut) / Branş (içerik hazırlanıyor, güncellemelerle eklenir). */}
      <View style={styles.blokSecici}>
        {(['müşterek', 'brans'] as const).map((b) => {
          const aktif = blok === b;
          return (
            <Pressable
              key={b}
              onPress={() => setBlok(b)}
              style={[styles.blokSeg, aktif && styles.blokSegAktif]}
              accessibilityRole="button"
              accessibilityLabel={b === 'müşterek' ? 'Müşterek sınavlar' : 'Branş sınavları'}>
              <MaterialCommunityIcons
                name={b === 'müşterek' ? 'account-group' : 'medal-outline'}
                size={16}
                color={aktif ? Palette.beyaz : Palette.solukMetin}
              />
              <AppText variant="etiket" bold color={aktif ? 'beyaz' : 'anaMetin'}>
                {b === 'müşterek' ? 'Müşterek' : 'Branş'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {(
        <>
      {/* ALT SEÇİM: Talim (kanun denemeleri) / Tatbikat (genel denemeler). Müşterek + Branş İKİSİNDE
          de gösterilir (aynı düzen). Branş genel denemesi henüz yok → Tatbikat'ta "yakında". */}
      <View style={styles.blokSecici}>
        {(['talim', 'tatbikat'] as const).map((m) => {
          const aktif = mod === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMod(m)}
              style={[styles.blokSeg, aktif && styles.blokSegAktif]}
              accessibilityRole="button"
              accessibilityLabel={m === 'talim' ? 'Talim — kanun denemeleri' : 'Tatbikat — genel denemeler'}>
              <MaterialCommunityIcons
                name={m === 'talim' ? 'clipboard-check-outline' : 'flag-checkered'}
                size={16}
                color={aktif ? Palette.beyaz : Palette.solukMetin}
              />
              <AppText variant="etiket" bold color={aktif ? 'beyaz' : 'anaMetin'}>
                {m === 'talim' ? 'Talim' : 'Tatbikat'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {mod === 'tatbikat' ? (
        <>
          <AppText variant="kucuk" color="solukMetin">
            {blok === 'brans'
              ? 'Branş genel denemeleri 5 sınav × 50 karma sorudur. Her soru 2 puan (toplam 100). Yanlışların zayıf mevzilerine düşer.'
              : 'Genel denemeler 25 müşterek kanundan karma 50 sorudur. Her soru 2 puan (toplam 100). Yanlışların zayıf mevzilerine düşer.'}
          </AppText>
          {genelDenemeler(blok === 'brans' ? 'brans' : undefined).map((d) => (
            <GenelDenemeSatir
              key={d.no}
              deneme={d}
              // Sanal law_id: branş -(100+no), müşterek -no (sinav.tsx ile birebir).
              sonuc={sonucMap.get(blok === 'brans' ? -(100 + d.no) : -d.no)?.get(0)}
              kilitli={genelKilitli}
              onGit={() =>
                genelKilitli ? router.push('/paywall') : genelDenemeGit(d.no, blok === 'brans')
              }
            />
          ))}
        </>
      ) : hata ? (
        <DurumKutu
          ikon="alert-circle-outline"
          baslik="Yüklenemedi"
          aciklama="Sınav listesi yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : laws === null ? (
        <Loading metin="Yükleniyor…" />
      ) : (
        <>
          <AppText variant="kucuk" color="solukMetin">
            Uzun kanunlar 20'şer soruluk testlere bölündü. Her soru 2 puan. İstersen önce Mevzuat'tan çalış,
            sonra kendini sına.
          </AppText>
          {musterek.length === 0 ? (
            <AppText variant="kucuk" color="solukMetin">
              Bu branşta deneme sınavı olan kanun yok.
            </AppText>
          ) : (
            musterek.map((law) => (
              <KanunSatir
                key={law.id}
                law={law}
                durum={durumMap.get(law.id)}
                sonuclar={sonucMap.get(law.id)}
                onSinav={sinavaGit}
              />
            ))
          )}
        </>
      )}
        </>
      )}
    </Screen>
  );
}

/** Genel deneme (Tatbikat) satırı: başlık + soru sayısı + son puan + kilit. */
function GenelDenemeSatir({
  deneme,
  sonuc,
  kilitli,
  onGit,
}: {
  deneme: { no: number; baslik: string; soruSayisi: number };
  sonuc: SinavSonuc | undefined;
  kilitli: boolean;
  onGit: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.genelSatir, pressed && styles.pressed]}
      onPress={onGit}
      accessibilityRole="button"
      accessibilityLabel={deneme.baslik}>
      <View style={styles.monogram}>
        <MaterialCommunityIcons name="flag-checkered" size={22} color={Palette.altin} />
      </View>
      <View style={styles.satirMetin}>
        <AppText variant="govde" bold color="anaMetin">
          {deneme.baslik}
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          {deneme.soruSayisi} soru · {deneme.soruSayisi * PUAN_KATSAYI} puan
          {sonuc ? ` · Son: ${sonuc.dogru * PUAN_KATSAYI}/${sonuc.toplam * PUAN_KATSAYI} puan` : ''}
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

/** Lacivert kare monogram: ad'dan kanun no (altın), yoksa kitap ikonu. */
function Monogram({ no }: { no: string | null }) {
  return (
    <View style={styles.monogram}>
      {no ? (
        <AppText
          variant="govde"
          bold
          color="altin"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.monoNo}>
          {no}
        </AppText>
      ) : (
        <MaterialCommunityIcons name="book-outline" size={24} color={Palette.altin} />
      )}
    </View>
  );
}

function KanunSatir({
  law,
  durum,
  sonuclar,
  onSinav,
}: {
  law: LawWithCount;
  durum: Durum | undefined;
  sonuclar: Map<number, SinavSonuc> | undefined;
  onSinav: (law: LawWithCount, test: number) => void;
}) {
  const [acik, setAcik] = useState(false);
  const calisilan = durum?.calisilan ?? 0;
  const toplam = durum?.toplam ?? law.kartSayisi;
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;
  const router = useRouter();
  const { kanunErisilebilir } = useUyelik();
  // Premium kilidi: erişim yoksa sınav yerine paywall. Şalter kapalıysa hep açık.
  const kilitli = !kanunErisilebilir(LAW_KLASOR[law.id], law.blok);

  const testN = testSayisi(law.id);
  const toplamSoru = sinavSoruSayisi(law.id);
  const tekTest = testN <= 1; // ≤20 soru → tek test: başlığa basınca doğrudan aç

  function basHeader() {
    if (kilitli) {
      router.push('/paywall');
      return;
    }
    if (tekTest) {
      onSinav(law, 0);
      return;
    }
    setAcik((v) => !v);
  }

  const sagIkon = kilitli ? 'lock' : tekTest ? 'play-circle' : acik ? 'chevron-up' : 'chevron-down';
  const tekSon = sonuclar?.get(0);

  return (
    <View style={styles.satir}>
      <Pressable
        onPress={basHeader}
        style={({ pressed }) => [styles.satirBas, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${law.ad} deneme sınavı`}>
        <View style={styles.satirUst}>
          <Monogram no={no} />
          <AppText variant="govde" bold color="anaMetin" style={styles.kanunAd}>
            {law.ad}
          </AppText>
          <MaterialCommunityIcons
            name={sagIkon}
            size={28}
            color={kilitli ? Palette.altinKoyu : Palette.lacivert}
          />
        </View>

        <View style={styles.altSatir}>
          <MaterialCommunityIcons
            name={kilitli ? 'lock-open-outline' : 'clipboard-check-outline'}
            size={16}
            color={Palette.altinKoyu}
          />
          <AppText variant="kucuk" bold color="altinMetin">
            {kilitli
              ? 'Kilidi Aç'
              : tekTest
                ? `Deneme Sınavı · ${toplamSoru} soru`
                : `${testN} test · ${toplamSoru} soru`}
          </AppText>
        </View>

        {/* Hazırlık (kilit DEĞİL — sadece bilgi: ne kadarını çalıştın). */}
        {toplam > 0 ? (
          <View style={styles.altSatir}>
            <MaterialCommunityIcons name="book-clock-outline" size={16} color={Palette.solukMetin} />
            <AppText variant="etiket" color="solukMetin">
              Hazırlık: {calisilan}/{toplam} kart çalışıldı
            </AppText>
          </View>
        ) : null}

        {/* Tek testli kanunda son skor başlıkta (çok testli → her testin altında). */}
        {tekTest && !kilitli && tekSon ? (
          <View style={styles.altSatir}>
            <MaterialCommunityIcons name="history" size={16} color={Palette.solukMetin} />
            <AppText variant="etiket" bold color="solukMetin">
              Son deneme: {tekSon.dogru}/{tekSon.toplam}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {/* Çok testli kanun → açılınca Test 1..N (her biri ayrı sınav + kendi son skoru). */}
      {acik && !tekTest && !kilitli ? (
        <View style={styles.testler}>
          {Array.from({ length: testN }, (_, t) => {
            const ss = sonuclar?.get(t);
            const soru = testSoruSayisi(law.id, t);
            const aced = !!ss && ss.toplam > 0 && ss.dogru === ss.toplam;
            return (
              <Pressable
                key={t}
                onPress={() => onSinav(law, t)}
                style={({ pressed }) => [styles.testSatir, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Test ${t + 1}`}>
                <MaterialCommunityIcons
                  name={aced ? 'check-circle' : 'play-circle-outline'}
                  size={22}
                  color={aced ? Palette.altinKoyu : Palette.lacivert}
                />
                <View style={styles.testOrta}>
                  <AppText variant="kucuk" bold color="anaMetin">
                    Test {t + 1}
                  </AppText>
                  <AppText variant="etiket" color="solukMetin">
                    {soru} soru{ss ? ` · Son: ${ss.dogru}/${ss.toplam}` : ''}
                  </AppText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
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
