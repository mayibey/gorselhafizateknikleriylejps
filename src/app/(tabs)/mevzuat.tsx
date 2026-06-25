import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards, getLaws, getPerformans, getStudyCards } from '@/db/database';
import type { LawWithCount, PerformansSatir } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { sonCalisilanKanun } from '@/lib/devamet';
import { useRutbe } from '@/lib/rutbe-context';
import { rutbeGorur } from '@/lib/rutbe-kapsam';

// Filtre çipleri (ilerleme bazlı, elde süzme — yeni sorgu yok).
const CIPLER = [
  { k: 'tumu', ad: 'Tümü' },
  { k: 'devam', ad: 'Devam Ettiklerim' },
  { k: 'bitmeyen', ad: 'Bitmeyenler' },
  { k: 'tamam', ad: 'Tamamlananlar' },
] as const;
type Cip = (typeof CIPLER)[number]['k'];

export default function MevzuatScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const [laws, setLaws] = useState<LawWithCount[] | null>(null);
  // law_id → kutu≥1 (çalışılmış) kart sayısı. null = henüz yüklenmedi.
  const [ilerleme, setIlerleme] = useState<Map<number, number> | null>(null);
  // card_id → law_id (Devam Et için) ve kronolojik performans log'u (son çalışma).
  const [cardLawMap, setCardLawMap] = useState<Map<number, number> | null>(null);
  const [perf, setPerf] = useState<PerformansSatir[] | null>(null);
  const [arama, setArama] = useState('');
  const [aktifCip, setAktifCip] = useState<Cip>('tumu');
  const [cipGoster, setCipGoster] = useState(true);
  const [hata, setHata] = useState(false);

  // Branş değişince + odağa her dönüşte tazele (çalışıp dönünce ilerleme/Devam Et güncel).
  const yukle = useCallback(() => {
    if (!brans) return;
    setHata(false);
    void getLaws(brans)
      .then(setLaws)
      .catch(() => setHata(true));
    // İlerleme + Devam Et verisi AYRI (degrade olur): tek tur getStudyCards/getAllCards/getPerformans.
    // Parite: kutu≥1 filtresi web/native'de AYNI "çalışılmış" kümesini verir.
    void Promise.all([getStudyCards(), getAllCards(), getPerformans()])
      .then(([studied, allCards, p]) => {
        const im = new Map<number, number>();
        for (const c of studied) {
          if (c.kutu >= 1) im.set(c.law_id, (im.get(c.law_id) ?? 0) + 1);
        }
        setIlerleme(im);
        const clm = new Map<number, number>();
        for (const c of allCards) clm.set(c.id, c.law_id);
        setCardLawMap(clm);
        setPerf(p);
      })
      .catch(() => {
        setIlerleme(new Map());
        setCardLawMap(new Map());
        setPerf([]);
      });
  }, [brans]);

  useFocusEffect(yukle);

  // DEĞİŞMEDİ: yalnız içeriği OLAN müşterek + rütbe kapsamındaki kanunlar.
  const musterek =
    laws?.filter((l) => l.blok === 'müşterek' && l.kartSayisi > 0 && rutbeGorur(l.id, rutbe)) ?? [];

  // law_id → {calisilan, toplam} (Devam Et + bar + çip filtresi). musterek'ten kurulur.
  const lawIlerleme = new Map<number, { calisilan: number; toplam: number }>();
  for (const l of musterek) {
    lawIlerleme.set(l.id, { calisilan: ilerleme?.get(l.id) ?? 0, toplam: l.kartSayisi });
  }
  const yuzdesi = (l: LawWithCount) => {
    const il = lawIlerleme.get(l.id);
    return il && il.toplam > 0 ? (il.calisilan / il.toplam) * 100 : 0;
  };

  // Filtre zinciri: musterek → ÇİP → arama → map (hepsi elde, yeni sorgu yok).
  const cipli = musterek.filter((l) => {
    const y = yuzdesi(l);
    switch (aktifCip) {
      case 'devam':
        return y > 0 && y < 100;
      case 'bitmeyen':
        return y < 100;
      case 'tamam':
        return y === 100;
      default:
        return true;
    }
  });
  const q = arama.trim().toLocaleLowerCase('tr');
  const gosterilen = q ? cipli.filter((l) => l.ad.toLocaleLowerCase('tr').includes(q)) : cipli;

  const devam =
    perf && cardLawMap && ilerleme
      ? sonCalisilanKanun(perf, cardLawMap, lawIlerleme)
      : ({ tip: 'yok' } as const);

  function kanunaGit(law: LawWithCount) {
    // DEĞİŞMEDİ: Kanun → Patika (bölümler). Bölümsüz kanun patikada tek düğüm gösterir.
    router.push({ pathname: '/patika', params: { lawId: String(law.id) } });
  }

  const devamLaw =
    devam.tip === 'devam' || devam.tip === 'siradaki'
      ? laws?.find((l) => l.id === devam.lawId)
      : undefined;

  return (
    <Screen title="Mevzuat">
      {/* Açıklama (Screen header'da slot yok → kayan içerik) */}
      <AppText variant="kucuk" color="solukMetin" style={st.aciklama}>
        Kanunları çalış, hedeflerine daha hızlı ulaş.
      </AppText>

      {/* Arama + filtre butonu (listeyle birlikte kayar) */}
      <View style={st.aramaSatir}>
        <View style={st.aramaKutu}>
          <MaterialCommunityIcons name="magnify" size={20} color={Palette.solukMetin} />
          <TextInput
            style={st.aramaInput}
            value={arama}
            onChangeText={setArama}
            placeholder="Kanun, madde veya konu ara…"
            placeholderTextColor={Palette.solukMetin}
            returnKeyType="search"
            autoCorrect={false}
          />
          {arama.length > 0 ? (
            <Pressable onPress={() => setArama('')} hitSlop={8} accessibilityLabel="Aramayı temizle">
              <MaterialCommunityIcons name="close-circle" size={18} color={Palette.solukMetin} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setCipGoster((v) => !v)}
          style={[st.filtreBtn, cipGoster && st.filtreBtnAktif]}
          accessibilityRole="button"
          accessibilityLabel="Filtreleri aç/kapat">
          <MaterialCommunityIcons
            name="filter-variant"
            size={22}
            color={cipGoster ? Palette.beyaz : Palette.solukMetin}
          />
        </Pressable>
      </View>

      {/* Filtre çipleri (ilerleme bazlı) */}
      {cipGoster ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.cipSeridi}>
          {CIPLER.map((c) => {
            const aktif = aktifCip === c.k;
            return (
              <Pressable
                key={c.k}
                onPress={() => setAktifCip(c.k)}
                style={[st.cip, aktif ? st.cipAktif : st.cipPasif]}
                accessibilityRole="button"
                accessibilityLabel={c.ad}>
                <AppText variant="etiket" bold color={aktif ? 'beyaz' : 'anaMetin'}>
                  {c.ad}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {hata ? (
        <DurumKutu
          ikon="alert-circle-outline"
          baslik="Yüklenemedi"
          aciklama="Mevzuat listesi yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : laws === null ? (
        <DurumKutu ikon="book-open-variant" baslik="Yükleniyor…" aciklama="" />
      ) : (
        <>
          {/* Devam Et — son çalışılan / sıradaki kanun (3A türetmesi). 'yok' → gizli. */}
          {devamLaw ? (
            <DevamEtKart
              law={devamLaw}
              calisilan={ilerleme?.get(devamLaw.id) ?? 0}
              siradaki={devam.tip === 'siradaki'}
              onPress={() => kanunaGit(devamLaw)}
            />
          ) : devam.tip === 'hepsiBitti' ? (
            <View style={st.bittiKart}>
              <AppText variant="altBaslik" bold color="lacivert">
                Tüm mevzuat tamamlandı 🎖️
              </AppText>
              <AppText variant="kucuk" color="solukMetin">
                Tebrikler — tüm müşterek mevzuatı bitirdin.
              </AppText>
            </View>
          ) : null}

          {/* TÜM MEVZUAT bölüm başlığı */}
          <View style={st.sectionBaslik}>
            <MaterialCommunityIcons name="scale-balance" size={18} color={Palette.solukMetin} />
            <AppText variant="etiket" bold color="solukMetin" style={st.sectionAd}>
              TÜM MEVZUAT
            </AppText>
            <AppText variant="etiket" color="solukMetin">
              Toplam {gosterilen.length} kanun
            </AppText>
          </View>

          {gosterilen.length === 0 ? (
            <AppText variant="kucuk" color="solukMetin">
              {q
                ? 'Eşleşen kanun yok.'
                : aktifCip !== 'tumu'
                  ? 'Bu filtrede kanun yok.'
                  : 'Bu bölümde kanun yok.'}
            </AppText>
          ) : (
            gosterilen.map((law) => (
              <KanunSatir
                key={law.id}
                law={law}
                calisilan={ilerleme?.get(law.id) ?? 0}
                onPress={kanunaGit}
              />
            ))
          )}
        </>
      )}
    </Screen>
  );
}

/** Lacivert kare monogram: ad'dan kanun no (altın), yoksa kitap ikonu. */
function Monogram({
  no,
  boyut,
  variant,
}: {
  no: string | null;
  boyut: number;
  variant: 'govde' | 'baslik';
}) {
  return (
    <View style={[st.monogram, { width: boyut, height: boyut }]}>
      {no ? (
        <AppText variant={variant} bold color="altin">
          {no}
        </AppText>
      ) : (
        <MaterialCommunityIcons name="book-outline" size={Math.round(boyut * 0.42)} color={Palette.altin} />
      )}
    </View>
  );
}

/** Altın ilerleme barı (track + dolu). */
function Bar({ yuzde }: { yuzde: number }) {
  const w = Math.min(100, Math.max(0, yuzde));
  return (
    <View style={st.barTrack}>
      <View style={[st.barFill, { width: `${w}%` }]} />
    </View>
  );
}

function DevamEtKart({
  law,
  calisilan,
  siradaki,
  onPress,
}: {
  law: LawWithCount;
  calisilan: number;
  siradaki: boolean;
  onPress: () => void;
}) {
  const toplam = law.kartSayisi;
  const yuzde = toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0;
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;

  return (
    <Pressable
      style={({ pressed }) => [st.devamKart, pressed && st.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Çalışmaya devam et: ${law.ad}`}>
      <AppText variant="etiket" bold color="altinKoyu" style={st.devamEtiket}>
        {siradaki ? '🎖️ BİTTİ — SIRADAKİ' : 'DEVAM ET'}
      </AppText>
      <View style={st.devamGovde}>
        <Monogram no={no} boyut={72} variant="baslik" />
        <View style={st.devamOrta}>
          <AppText variant="govde" bold color="anaMetin" numberOfLines={2}>
            {law.ad}
          </AppText>
          <AppText variant="kucuk" color="solukMetin">
            {calisilan} / {toplam} kart tamamlandı
          </AppText>
          <View style={st.barSatir}>
            <Bar yuzde={yuzde} />
            <AppText variant="etiket" bold color="altinKoyu">
              %{yuzde}
            </AppText>
          </View>
        </View>
      </View>
      <View style={st.devamCta}>
        <MaterialCommunityIcons name="play" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" bold color="lacivert">
          Çalışmaya devam et
        </AppText>
      </View>
    </Pressable>
  );
}

function KanunSatir({
  law,
  calisilan,
  onPress,
}: {
  law: LawWithCount;
  calisilan: number;
  onPress: (law: LawWithCount) => void;
}) {
  const toplam = law.kartSayisi;
  const yuzde = toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0;
  const tam = yuzde === 100;
  const bos = yuzde === 0;
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;

  return (
    <Pressable
      style={({ pressed }) => [st.satir, pressed && st.pressed]}
      onPress={() => onPress(law)}
      accessibilityRole="button"
      accessibilityLabel={law.ad}>
      <Monogram no={no} boyut={56} variant="govde" />

      <View style={st.satirOrta}>
        <AppText variant="govde" bold color="anaMetin" numberOfLines={1} ellipsizeMode="tail">
          {law.ad}
        </AppText>
        <AppText variant="kucuk" color="solukMetin">
          {calisilan} / {toplam} kart tamamlandı
        </AppText>
        <View style={st.barSatir}>
          <Bar yuzde={yuzde} />
          <AppText variant="etiket" bold color="altinKoyu">
            %{yuzde}
          </AppText>
        </View>
      </View>

      {/* Sağ durum: tamam → altın tik (yeşil DEĞİL) · değilse play + Başla/Devam + chevron */}
      <View style={st.satirSag}>
        {tam ? (
          <MaterialCommunityIcons name="check-circle" size={24} color={Palette.altinKoyu} />
        ) : (
          <>
            <MaterialCommunityIcons name="play" size={16} color={Palette.altin} />
            <AppText variant="etiket" bold color="altinKoyu">
              {bos ? 'Başla' : 'Devam'}
            </AppText>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
          </>
        )}
      </View>
    </Pressable>
  );
}

/** Yükleniyor/hata kutusu (krem zemin). */
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
    <View style={st.merkezKutu}>
      <MaterialCommunityIcons name={ikon} size={40} color={Palette.solukMetin} />
      <AppText variant="altBaslik" bold color="lacivert">
        {baslik}
      </AppText>
      {aciklama ? (
        <AppText variant="kucuk" color="solukMetin">
          {aciklama}
        </AppText>
      ) : null}
      {buton ? (
        <Pressable onPress={buton.onPress} style={({ pressed }) => [st.retryBtn, pressed && st.pressed]}>
          <AppText variant="kucuk" bold color="lacivert">
            {buton.etiket}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  aciklama: {
    marginTop: -Spacing.one,
  },
  aramaSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'stretch',
  },
  aramaKutu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  filtreBtn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
  },
  filtreBtnAktif: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  cipSeridi: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  cip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.l,
    borderWidth: 1,
    justifyContent: 'center',
  },
  cipAktif: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  cipPasif: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
  },
  aramaInput: {
    flex: 1,
    color: Palette.anaMetin,
    fontSize: 16,
    paddingVertical: Spacing.one,
  },

  // Devam Et kartı (hero)
  devamKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1.5,
    borderRadius: Radius.l,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  devamEtiket: {
    letterSpacing: 1,
  },
  devamGovde: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  devamOrta: {
    flex: 1,
    gap: Spacing.one,
  },
  devamCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.altin,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
  },

  bittiKart: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },

  // Bölüm başlığı
  sectionBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionAd: {
    flex: 1,
    letterSpacing: 1.5,
  },

  // Monogram
  monogram: {
    borderRadius: Radius.m,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // İlerleme barı
  barSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.ilerlemeTrack,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.ilerlemeDolu,
  },

  // Liste satırı
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  satirOrta: {
    flex: 1,
    gap: Spacing.one,
  },
  satirSag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },

  merkezKutu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
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
