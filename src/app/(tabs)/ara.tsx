import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// Seslendirme metni registry'si ('@/assets' alias gerçek assets/'a gittiği için göreli).
import { KART_SES_METINLERI } from '../../assets/kart-ses-metinleri';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards, getLaws } from '@/db/database';
import { maddeMetni } from '@/db/madde-metinleri';
import type { CardWithLaw, LawWithCount } from '@/db/schema';
import { araIndeksHazirla, araKanunlar, trKucuk, type AraKapsam, type AramaSonuc } from '@/lib/ara';
import { useBrans } from '@/lib/brans-context';
import { getSonAramalar, sonAramaEkle, sonAramalariTemizle } from '@/lib/son-aramalar';

// Sekme değişiminde / sonuca gidip dönünce SON ARAMA hatırlansın. Modül seviyesinde.
let sonSorgu = '';

type CipKey = 'metin' | 'madde' | 'kart' | 'civile';
const CIPLER: { k: CipKey; ad: string; ikon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { k: 'metin', ad: 'Kanun metni', ikon: 'book-open-variant' },
  { k: 'madde', ad: 'Madde no', ikon: 'pound' },
  { k: 'kart', ad: 'Kartlar', ikon: 'cards-outline' },
  { k: 'civile', ad: 'Aklına Çivile', ikon: 'pin-outline' },
];

// Popüler aramalar — SABİT, curated, TEK kelime (PHRASE arama → çok kelime güvenli değil).
const POPULER = ['kasten', 'taksir', 'izin', 'yetki', 'görev', 'silah'];
const ORNEKLER = ['kast', 'TCK 318'];

// Sık açılan mevzuatlar — SABİT curated law_id; ad getLaws'tan (yoksa fb gerçek isim).
const SIK_ACILAN: { id: number; kisa: string; fb: string }[] = [
  { id: 1, kisa: 'TCK', fb: '5237 sayılı Türk Ceza Kanunu' },
  { id: 26, kisa: 'CMK', fb: '5271 sayılı Ceza Muhakemesi Kanunu' },
  { id: 12, kisa: 'Disiplin', fb: '7068 sayılı Genel Kolluk Disiplin Hükümleri Kanunu' },
  { id: 2, kisa: 'Jandarma', fb: '2803 sayılı Jandarma Teşkilat, Görev ve Yetkileri Kanunu' },
  { id: 25, kisa: 'Silahlar', fb: '6136 sayılı Ateşli Silahlar ve Bıçaklar Kanunu' },
];

export default function AraScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const [sorgu, setSorgu] = useState(sonSorgu);
  const [aktifCip, setAktifCip] = useState<CipKey | null>(null);
  const [cards, setCards] = useState<CardWithLaw[] | null>(null);
  const [laws, setLaws] = useState<LawWithCount[]>([]);
  const [sonAramalar, setSonAramalar] = useState<string[]>([]);
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    setHata(false);
    getAllCards()
      .then(setCards)
      .catch(() => setHata(true));
  }, []);

  // Odakta: kartlar (yoksa) + son aramalar geçmişi + kanun adları (sık açılan için).
  useFocusEffect(
    useCallback(() => {
      if (cards === null) yukle();
      void getSonAramalar().then(setSonAramalar);
      if (brans) void getLaws(brans).then(setLaws).catch(() => {});
    }, [cards, yukle, brans]),
  );

  // Kapsam: aktif çip → arama alanını daraltır. 'civile' artık GERÇEK kapsam (ses metninin
  // "Aklınıza çivileyin" kısmı); 'kart' = gerçek seslendirme metni (placeholder değil).
  const kapsam: AraKapsam = aktifCip === null ? 'hepsi' : aktifCip;

  const indeks = useMemo(
    () =>
      cards
        ? araIndeksHazirla(cards, maddeMetni, (g) => (g ? KART_SES_METINLERI[g] ?? null : null))
        : [],
    [cards],
  );
  const sonuclar = useMemo(() => araKanunlar(indeks, sorgu, kapsam), [indeks, sorgu, kapsam]);

  // Son arama kaydı: sorgu ~700ms durunca + ≥2 harf (debounce, spam yok).
  useEffect(() => {
    const q = sorgu.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      void sonAramaEkle(q).then(setSonAramalar);
    }, 700);
    return () => clearTimeout(t);
  }, [sorgu]);

  function degis(t: string) {
    sonSorgu = t;
    setSorgu(t);
  }

  function ac(s: AramaSonuc) {
    router.push({ pathname: '/akis', params: { lawId: String(s.lawId), kart: String(s.cardId) } });
  }

  function temizle() {
    void sonAramalariTemizle();
    setSonAramalar([]);
  }

  const lawAd = (id: number) => laws.find((l) => l.id === id)?.ad ?? null;
  const az = sorgu.trim().length < 2;

  return (
    <Screen title="Ara" scroll={false}>
      {/* Arama kutusu — altın terazi + büyüteç + input */}
      <View style={styles.aramaKart}>
        <MaterialCommunityIcons name="scale-balance" size={22} color={Palette.altin} />
        <View style={styles.aramaInputSar}>
          <MaterialCommunityIcons name="magnify" size={20} color={Palette.solukMetin} />
          <TextInput
            value={sorgu}
            onChangeText={degis}
            placeholder="Kanun, madde, konu veya kelime ara…"
            placeholderTextColor={Palette.solukMetin}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {sorgu.length > 0 ? (
            <Pressable onPress={() => degis('')} hitSlop={8} accessibilityLabel="Temizle">
              <MaterialCommunityIcons name="close-circle" size={18} color={Palette.solukMetin} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filtre çipleri — kapsam daraltır (Aklına Çivile = Kartlar) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cipScroll}
        contentContainerStyle={styles.cipSerit}>
        {CIPLER.map((c) => {
          const aktif = aktifCip === c.k;
          return (
            <Pressable
              key={c.k}
              onPress={() => setAktifCip(aktif ? null : c.k)}
              style={[styles.cip, aktif ? styles.cipAktif : styles.cipPasif]}
              accessibilityRole="button">
              <MaterialCommunityIcons
                name={c.ikon}
                size={14}
                color={aktif ? Palette.beyaz : Palette.solukMetin}
              />
              <AppText variant="etiket" bold color={aktif ? 'beyaz' : 'anaMetin'}>
                {c.ad}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {hata ? (
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="Kanun verisi yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : cards === null ? (
        <Loading />
      ) : az ? (
        // Boş/kısa sorgu → keşif bölümleri
        <ScrollView
          style={styles.akis}
          contentContainerStyle={styles.oneriler}
          keyboardShouldPersistTaps="handled">
          {sonAramalar.length > 0 ? (
            <View style={styles.bolum}>
              <View style={styles.bolumBaslik}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={Palette.solukMetin} />
                <AppText variant="etiket" bold color="solukMetin" style={styles.bolumAd}>
                  SON ARAMALAR
                </AppText>
                <Pressable onPress={temizle} hitSlop={8} style={styles.temizle} accessibilityLabel="Geçmişi temizle">
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color={Palette.kirmizi} />
                  <AppText variant="etiket" bold color="kirmizi">
                    Temizle
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.kelimeSerit}>
                {sonAramalar.map((s) => (
                  <Pressable key={s} onPress={() => degis(s)} style={styles.kelimeCip}>
                    <MaterialCommunityIcons name="history" size={13} color={Palette.solukMetin} />
                    <AppText variant="kucuk" color="lacivert">
                      {s}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.bolum}>
            <View style={styles.bolumBaslik}>
              <MaterialCommunityIcons name="fire" size={16} color={Palette.amber} />
              <AppText variant="etiket" bold color="solukMetin" style={styles.bolumAd}>
                POPÜLER ARAMALAR
              </AppText>
            </View>
            <View style={styles.kelimeSerit}>
              {POPULER.map((k) => (
                <Pressable key={k} onPress={() => degis(k)} style={styles.kelimeCip}>
                  <AppText variant="kucuk" color="lacivert">
                    {k}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bolum}>
            <View style={styles.bolumBaslik}>
              <MaterialCommunityIcons name="book-multiple-outline" size={16} color={Palette.solukMetin} />
              <AppText variant="etiket" bold color="solukMetin" style={styles.bolumAd}>
                SIK AÇILAN MEVZUATLAR
              </AppText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sikSerit}>
              {SIK_ACILAN.map((s) => {
                const ad = lawAd(s.id) ?? s.fb;
                const no = ad.match(/^(\d+)/)?.[1] ?? null;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push({ pathname: '/patika', params: { lawId: String(s.id) } })}
                    style={({ pressed }) => [styles.sikKart, pressed && styles.pressed]}>
                    <View style={styles.sikMono}>
                      {no ? (
                        <AppText
                          variant="kucuk"
                          bold
                          color="altin"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={styles.sikMonoNo}>
                          {no}
                        </AppText>
                      ) : (
                        <MaterialCommunityIcons name="book-outline" size={18} color={Palette.altin} />
                      )}
                    </View>
                    <AppText variant="kucuk" bold color="lacivert">
                      {s.kisa}
                    </AppText>
                    <AppText variant="etiket" color="solukMetin" numberOfLines={2}>
                      {ad}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.ipucu}>
            <MaterialCommunityIcons name="magnify" size={20} color={Palette.solukMetin} />
            <AppText variant="kucuk" color="solukMetin" style={styles.ipucuMetin}>
              En az 2 harf yaz; kanun, madde ve kartlarda arama yapar.
            </AppText>
            <View style={styles.kelimeSerit}>
              {ORNEKLER.map((o) => (
                <Pressable key={o} onPress={() => degis(o)} style={styles.kelimeCip}>
                  <AppText variant="etiket" color="lacivert">
                    Örnek: {o}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : sonuclar.length === 0 ? (
        <EmptyState
          ikon="file-search-outline"
          baslik="Sonuç yok"
          aciklama={`"${sorgu.trim()}" bu kapsamda bulunamadı.`}
        />
      ) : (
        <FlatList
          data={sonuclar}
          keyExtractor={(s) => `${s.lawId}-${s.maddeNo}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.liste}
          ListHeaderComponent={
            <AppText variant="kucuk" color="solukMetin" style={styles.sayac}>
              {sonuclar.length} madde bulundu
            </AppText>
          }
          renderItem={({ item }) => <Sonuc s={item} q={sorgu.trim()} onPress={() => ac(item)} />}
        />
      )}
    </Screen>
  );
}

/** Tek sonuç kartı: kanun · madde no — başlık · vurgulu snippet. */
function Sonuc({ s, q, onPress }: { s: AramaSonuc; q: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.kart, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.ust}>
        <AppText variant="etiket" color="solukMetin" numberOfLines={1} style={styles.kanun}>
          {s.kanun}
        </AppText>
        <View style={styles.rozet}>
          <AppText variant="etiket" color="lacivert" bold>
            {s.blok === 'müşterek' ? 'Müşterek' : 'Branş'}
          </AppText>
        </View>
      </View>
      <AppText variant="govde" color="lacivert" bold style={styles.baslik}>
        {s.baslik ? `${s.maddeNo} — ${s.baslik}` : s.maddeNo}
      </AppText>
      {vurgula(s.snippet, q)}
    </Pressable>
  );
}

/** Snippet içinde sorgu geçişlerini (Türkçe-duyarlı) kalın+lacivert vurgular. */
function vurgula(metin: string, q: string) {
  const qK = trKucuk(q);
  if (!qK) {
    return (
      <AppText variant="kucuk" color="solukMetin" style={styles.snippet}>
        {metin}
      </AppText>
    );
  }
  const mK = trKucuk(metin);
  const parcalar: { t: string; v: boolean }[] = [];
  let i = 0;
  while (i < metin.length) {
    const idx = mK.indexOf(qK, i);
    if (idx === -1) {
      parcalar.push({ t: metin.slice(i), v: false });
      break;
    }
    if (idx > i) parcalar.push({ t: metin.slice(i, idx), v: false });
    parcalar.push({ t: metin.slice(idx, idx + q.length), v: true });
    i = idx + q.length;
  }
  return (
    <AppText variant="kucuk" color="solukMetin" style={styles.snippet}>
      {parcalar.map((p, k) =>
        p.v ? (
          <AppText key={k} variant="kucuk" color="lacivert" bold>
            {p.t}
          </AppText>
        ) : (
          p.t
        ),
      )}
    </AppText>
  );
}

const styles = StyleSheet.create({
  // Arama kutusu
  aramaKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1.5,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  aramaInputSar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily,
    fontSize: 16,
    color: Palette.anaMetin,
    paddingVertical: Spacing.one,
  },

  // Çipler
  cipScroll: {
    flexGrow: 0,
  },
  cipSerit: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  cip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    height: 38,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.l,
    borderWidth: 1,
  },
  cipAktif: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  cipPasif: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
  },

  // Keşif bölümleri
  akis: {
    flex: 1,
  },
  oneriler: {
    gap: Spacing.four,
    paddingBottom: Spacing.five,
  },
  bolum: {
    gap: Spacing.two,
  },
  bolumBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bolumAd: {
    flex: 1,
    letterSpacing: 1,
  },
  temizle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  kelimeSerit: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kelimeCip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sikSerit: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  sikKart: {
    width: 150,
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  sikMono: {
    width: 36,
    height: 36,
    borderRadius: Radius.s,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  // Kanun no kutuya tek satır sığsın (4 hane "5237" alt satıra kaymasın → küçülerek sığar).
  sikMonoNo: {
    width: '100%',
    textAlign: 'center',
  },
  ipucu: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  ipucuMetin: {
    textAlign: 'center',
  },

  // Sonuçlar
  liste: {
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  sayac: {
    paddingVertical: Spacing.one,
  },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  kanun: {
    flex: 1,
  },
  rozet: {
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
  baslik: {
    marginTop: Spacing.half,
  },
  snippet: {
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
