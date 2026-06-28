import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards, getBolumKartIds, getLaws, getStudyCards } from '@/db/database';
import type { LawWithCount } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { hecele } from '@/lib/hece';
import { useRutbe } from '@/lib/rutbe-context';
import { rutbeGorur } from '@/lib/rutbe-kapsam';
import { sinavSoruSayisi, sinavVarMi } from '@/lib/sinav';

/** Bir kanunun deneme sınavı durumu (kilit + ilerleme). */
type Durum = { calisilan: number; toplam: number; tamam: boolean };

/**
 * Tatbikat — kanun bazlı deneme sınavı.
 * Bir kanunun TÜM (bölüme bağlı) kartları çalışılınca (Mevzuat'taki "Tamamlananlar"
 * ile birebir) o kanunun deneme sınavı AÇILIR; aksi hâlde KİLİTLİ ("önce çalış").
 * Yalnız soru havuzu olan müşterek kanunlar listelenir; branş içeriği "çok yakında".
 */
export default function TatbikatScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const [laws, setLaws] = useState<LawWithCount[] | null>(null);
  // law_id → kilit/ilerleme durumu (Mevzuat ile aynı: bölüme bağlı + kutu≥1).
  const [durumMap, setDurumMap] = useState<Map<number, Durum>>(new Map());
  const [blok, setBlok] = useState<'müşterek' | 'brans'>('müşterek');
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    if (!brans) return;
    setHata(false);
    void getLaws(brans)
      .then(setLaws)
      .catch(() => setHata(true));
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

  // Yalnız sınavı (soru havuzu) olan + rütbe kapsamındaki müşterek kanunlar.
  const musterek =
    laws?.filter((l) => l.blok === 'müşterek' && sinavVarMi(l.id) && rutbeGorur(l.id, rutbe)) ?? [];

  function sinavaGit(law: LawWithCount) {
    router.push({ pathname: '/sinav', params: { lawId: String(law.id) } });
  }

  function kanunaGit(law: LawWithCount) {
    // Kilitli kanun → önce çalış: o kanunun patikasına götür.
    router.push({ pathname: '/patika', params: { lawId: String(law.id) } });
  }

  return (
    <Screen title="Tatbikat">
      {/* ÜST SEÇİM: Müşterek / Branş (Mevzuat ile aynı desen). */}
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

      {blok === 'brans' ? (
        <DurumKutu
          ikon="hammer-wrench"
          baslik="Çok yakında"
          aciklama="Branşına özel deneme sınavları hazırlanıyor."
        />
      ) : hata ? (
        <DurumKutu
          ikon="alert-circle-outline"
          baslik="Yüklenemedi"
          aciklama="Sınav listesi yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : laws === null ? (
        <DurumKutu ikon="clipboard-text-clock-outline" baslik="Yükleniyor…" aciklama="" />
      ) : (
        <>
          <AppText variant="kucuk" color="solukMetin">
            Bir kanunun tüm kartlarını çalış, deneme sınavının kilidini aç.
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
                soruSayisi={sinavSoruSayisi(law.id)}
                onSinav={sinavaGit}
                onCalis={kanunaGit}
              />
            ))
          )}
        </>
      )}
    </Screen>
  );
}

/** Lacivert kare monogram: ad'dan kanun no (altın), yoksa kitap ikonu. */
function Monogram({ no }: { no: string | null }) {
  return (
    <View style={styles.monogram}>
      {no ? (
        <AppText variant="govde" bold color="altin">
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
  soruSayisi,
  onSinav,
  onCalis,
}: {
  law: LawWithCount;
  durum: Durum | undefined;
  soruSayisi: number;
  onSinav: (law: LawWithCount) => void;
  onCalis: (law: LawWithCount) => void;
}) {
  const acik = durum?.tamam ?? false;
  const calisilan = durum?.calisilan ?? 0;
  const toplam = durum?.toplam ?? law.kartSayisi;
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;

  return (
    <Pressable
      style={({ pressed }) => [styles.satir, !acik && styles.satirKilitli, pressed && styles.pressed]}
      onPress={() => (acik ? onSinav(law) : onCalis(law))}
      accessibilityRole="button"
      accessibilityLabel={acik ? `${law.ad} deneme sınavı` : `${law.ad} — önce çalış`}>
      <View style={styles.satirUst}>
        <Monogram no={no} />
        <AppText variant="govde" bold color="anaMetin" style={styles.kanunAd}>
          {hecele(law.ad)}
        </AppText>
        {acik ? (
          <MaterialCommunityIcons name="play-circle" size={28} color={Palette.lacivert} />
        ) : (
          <MaterialCommunityIcons name="lock-outline" size={24} color={Palette.solukMetin} />
        )}
      </View>

      {acik ? (
        <View style={styles.altSatir}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={Palette.altinKoyu} />
          <AppText variant="kucuk" bold color="altinKoyu">
            Deneme Sınavı · {soruSayisi} soru
          </AppText>
        </View>
      ) : (
        <View style={styles.altSatir}>
          <MaterialCommunityIcons name="book-clock-outline" size={16} color={Palette.solukMetin} />
          <AppText variant="kucuk" color="solukMetin">
            Önce tüm kartları çalış ({calisilan}/{toplam})
          </AppText>
        </View>
      )}
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
  satir: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  satirKilitli: {
    opacity: 0.7,
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
