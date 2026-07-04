import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DogrulamaKapisi } from '@/components/auth/dogrulama-kapisi';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Yakinda } from '@/components/ui/yakinda';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards, getBolumKartIds, getLaws, getPerformans, getStudyCards } from '@/db/database';
import type { LawWithCount, PerformansSatir } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { hecele } from '@/lib/hece';
import { bugunISO } from '@/lib/srs';
import { sonCalisilanKanun } from '@/lib/devamet';
import { KanunIndirButon } from '@/components/mevzuat/kanun-indir-buton';
import { ICERIK_TABANI } from '@/constants/config';
import { LAW_KLASOR } from '@/db/seed';
import { useKanunIndirme } from '@/hooks/use-kanun-indirme';
import { getFavoriler, toggleFavori } from '@/lib/favori';
import { indirmeDestekli } from '@/lib/indirme';
import { useRutbe } from '@/lib/rutbe-context';
import { rutbeGorur } from '@/lib/rutbe-kapsam';
import { useUyelik } from '@/lib/uyelik-context';

// Filtre çipleri (ilerleme bazlı, elde süzme — yeni sorgu yok).
const CIPLER = [
  { k: 'tumu', ad: 'Tümü' },
  { k: 'devam', ad: 'Devam Ettiklerim' },
  { k: 'baslamadi', ad: 'Başlamadıklarım' },
  { k: 'tamam', ad: 'Tamamlananlar' },
] as const;
type Cip = (typeof CIPLER)[number]['k'];

export default function MevzuatScreen() {
  // E-POSTA DOĞRULAMA KAPISI: doğrulanmamış hesap içeriğe giremez (girişe izin var, içerik kilitli).
  return (
    <DogrulamaKapisi>
      <MevzuatIcerik />
    </DogrulamaKapisi>
  );
}

function MevzuatIcerik() {
  const router = useRouter();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const [laws, setLaws] = useState<LawWithCount[] | null>(null);
  // law_id → kutu≥1 ÇALIŞILMIŞ (bölüme bağlı) kart sayısı. null = henüz yüklenmedi.
  const [ilerleme, setIlerleme] = useState<Map<number, number> | null>(null);
  // law_id → patikada ÇALIŞILABİLİR (bölüme bağlı) toplam kart sayısı = ilerleme paydası.
  // getLaws.kartSayisi TÜM kartları (genel-özet dahil) sayar → %100 imkânsız olurdu; bu
  // yüzden paydayı bölüme bağlı kartlarla hesaplıyoruz (genel-özet kartlar hariç).
  const [toplamMap, setToplamMap] = useState<Map<number, number> | null>(null);
  // law_id → SON çalışma tarihi (YYYY-MM-DD); yoksa kanun hiç çalışılmamış.
  const [sonCalisma, setSonCalisma] = useState<Map<number, string>>(new Map());
  // card_id → law_id (Devam Et için) ve kronolojik performans log'u (son çalışma).
  const [cardLawMap, setCardLawMap] = useState<Map<number, number> | null>(null);
  const [perf, setPerf] = useState<PerformansSatir[] | null>(null);
  const [arama, setArama] = useState('');
  const [aktifCip, setAktifCip] = useState<Cip>('tumu');
  const [cipGoster, setCipGoster] = useState(true);
  const [favoriler, setFavoriler] = useState<Set<number>>(new Set());
  const [favoriAcik, setFavoriAcik] = useState(false);
  const [hata, setHata] = useState(false);
  // Üst seçim: Müşterek (mevcut liste) / Branş (içerik güncellemelerle eklenecek → "hazırlanıyor").
  const [blok, setBlok] = useState<'müşterek' | 'brans'>('müşterek');

  // Branş değişince + odağa her dönüşte tazele (çalışıp dönünce ilerleme/Devam Et güncel).
  const yukle = useCallback(() => {
    if (!brans) return;
    setHata(false);
    void getLaws(brans)
      .then(setLaws)
      .catch(() => setHata(true));
    // İlerleme + Devam Et verisi AYRI (degrade olur): tek tur. getBolumKartIds = patikada
    // çalışılabilir (bölüme bağlı) kart kümesi → hem toplam payda hem "çalışılmış" SADECE
    // bu kümeden sayılır (genel-özet kartlar paydayı şişirip %100'ü imkânsız kılmasın).
    void Promise.all([getStudyCards(), getAllCards(), getPerformans(), getBolumKartIds()])
      .then(([studied, allCards, p, bolumKartIds]) => {
        const bagli = new Set(bolumKartIds);
        // toplam (payda): law_id → bölüme bağlı kart sayısı.
        const tm = new Map<number, number>();
        for (const c of allCards) if (bagli.has(c.id)) tm.set(c.law_id, (tm.get(c.law_id) ?? 0) + 1);
        setToplamMap(tm);
        // çalışılmış (pay): yalnız bölüme bağlı + kutu≥1.
        const im = new Map<number, number>();
        for (const c of studied) {
          if (c.kutu >= 1 && bagli.has(c.id)) im.set(c.law_id, (im.get(c.law_id) ?? 0) + 1);
        }
        setIlerleme(im);
        const clm = new Map<number, number>();
        for (const c of allCards) clm.set(c.id, c.law_id);
        setCardLawMap(clm);
        setPerf(p);
        // law_id → SON çalışma tarihi (calisma logundan) → "en son ... çalıştın" satırı.
        const sc = new Map<number, string>();
        for (const satir of p) {
          if (satir.kaynak !== 'calisma') continue;
          const lw = clm.get(satir.card_id);
          if (lw == null) continue;
          const mevcut = sc.get(lw);
          if (!mevcut || satir.tarih > mevcut) sc.set(lw, satir.tarih);
        }
        setSonCalisma(sc);
      })
      .catch(() => {
        setIlerleme(new Map());
        setToplamMap(new Map());
        setCardLawMap(new Map());
        setPerf([]);
        setSonCalisma(new Map());
      });
    // Favoriler (AsyncStorage) — focus'ta tazelenir.
    void getFavoriler()
      .then((ids) => setFavoriler(new Set(ids)))
      .catch(() => {});
  }, [brans]);

  const favoriToggle = (lawId: number) => {
    void toggleFavori(lawId).then((yeni) => setFavoriler(new Set(yeni)));
  };

  useFocusEffect(yukle);

  // DEĞİŞMEDİ: yalnız içeriği OLAN müşterek + rütbe kapsamındaki kanunlar.
  const musterek =
    laws?.filter((l) => l.blok === 'müşterek' && l.kartSayisi > 0 && rutbeGorur(l.id, rutbe)) ?? [];

  // law_id → {calisilan, toplam} (Devam Et + bar + çip filtresi). toplam = bölüme bağlı
  // (çalışılabilir) kart sayısı → %100 ulaşılabilir (genel-özet kartlar paydaya girmez).
  const toplamKart = (id: number) => toplamMap?.get(id) ?? 0;
  // Kanunun son çalışmasından bu yana geçen gün (null = hiç çalışılmadı).
  const sonGun = (id: number): number | null => {
    const t = sonCalisma.get(id);
    if (!t) return null;
    return Math.round((Date.parse(`${bugunISO()}T00:00:00Z`) - Date.parse(`${t}T00:00:00Z`)) / 86400000);
  };
  const lawIlerleme = new Map<number, { calisilan: number; toplam: number }>();
  for (const l of musterek) {
    lawIlerleme.set(l.id, { calisilan: ilerleme?.get(l.id) ?? 0, toplam: toplamKart(l.id) });
  }
  // Durum TAM SAYI sayımıyla (yuvarlama YOK) → 3 kategori KESİN ayrık (bos/devam/tamam),
  // KanunSatir görünümüyle birebir. Eski yuvarlanmış yüzde sınır durumlarında (ör. 199/200
  // → görünümde %100 ama filtrede <100) çoklu/yanlış sekme yapıyordu.
  const lawDurum = (l: LawWithCount): 'bos' | 'devam' | 'tamam' => {
    const il = lawIlerleme.get(l.id);
    const cal = il?.calisilan ?? 0;
    const top = il?.toplam ?? 0;
    if (top > 0 && cal >= top) return 'tamam';
    if (cal > 0) return 'devam';
    return 'bos';
  };

  // Filtre zinciri: musterek → FAVORİ → ÇİP → arama → map (hepsi elde, yeni sorgu yok).
  const taban = favoriAcik ? musterek.filter((l) => favoriler.has(l.id)) : musterek;
  const cipli = taban.filter((l) => {
    const d = lawDurum(l);
    switch (aktifCip) {
      case 'devam':
        return d === 'devam';
      case 'baslamadi':
        return d === 'bos';
      case 'tamam':
        return d === 'tamam';
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
    // Kanun → SEÇİM ekranı: Görsel Konu Anlatımı (→ patika/akış) veya Zor Detay Kartları (→ salt
    // görüntüleme). Kilit/indirme kapısı KanunSatir.satiraBas'ta zaten geçildi.
    router.push({ pathname: '/kanun-sec', params: { lawId: String(law.id), ad: law.ad } });
  }

  const devamLaw =
    devam.tip === 'devam' || devam.tip === 'siradaki'
      ? laws?.find((l) => l.id === devam.lawId)
      : undefined;

  return (
    <Screen title="Mevzuat">
      {/* ÜST SEÇİM: Müşterek (mevcut liste) / Branş (içerik hazırlanıyor, güncellemelerle eklenir). */}
      <View style={st.blokSecici}>
        {(['müşterek', 'brans'] as const).map((b) => {
          const aktif = blok === b;
          return (
            <Pressable
              key={b}
              onPress={() => setBlok(b)}
              style={[st.blokSeg, aktif && st.blokSegAktif]}
              accessibilityRole="button"
              accessibilityLabel={b === 'müşterek' ? 'Müşterek mevzuat' : 'Branş mevzuatı'}>
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
        <Yakinda
          ikon="shield-star-outline"
          baslik="Branş konuları hazırlanıyor"
          aciklama="Branşına özel mevzuat kartları hazırlanıyor ve güncellemelerle eklenecek. Üyeliğin bunları da kapsar — çıktıkça uygulamanda otomatik görünür. Şimdilik müşterek kanunlardan çalışmaya devam et."
        />
      ) : (
        <>
      {/* Açıklama + Favorilerim filtresi (Screen header'da slot yok → kayan içerik) */}
      <View style={st.ustSatir}>
        <AppText variant="kucuk" color="solukMetin" style={st.aciklama}>
          Kanunları çalış, hedeflerine daha hızlı ulaş.
        </AppText>
        <Pressable
          onPress={() => setFavoriAcik((v) => !v)}
          style={[st.favBtn, favoriAcik && st.favBtnAktif]}
          accessibilityRole="button"
          accessibilityLabel="Favorilerim filtresi">
          <MaterialCommunityIcons
            name={favoriAcik ? 'heart' : 'heart-outline'}
            size={16}
            color={favoriAcik ? Palette.lacivert : Palette.altinKoyu}
          />
          <AppText variant="etiket" bold color={favoriAcik ? 'lacivert' : 'altinKoyu'}>
            Favorilerim
          </AppText>
        </Pressable>
      </View>

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

      {/* Filtre çipleri (ilerleme bazlı). Favori filtresi açıkken gizli (kafa karışmasın). */}
      {cipGoster && !favoriAcik ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={st.cipScroll}
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
          {/* Devam Et — YALNIZ "Tümü" görünümünde (filtre/favori seçiliyken gizli → hero
              filtreden bağımsız olduğu için "kanun her sekmede görünüyor" karışıklığı olmaz). */}
          {aktifCip === 'tumu' && !favoriAcik ? (
            devamLaw ? (
            <DevamEtKart
              law={devamLaw}
              calisilan={ilerleme?.get(devamLaw.id) ?? 0}
              toplam={toplamKart(devamLaw.id)}
              siradaki={devam.tip === 'siradaki'}
              onPress={() => kanunaGit(devamLaw)}
              onTumunuGor={() => {
                // "Tümünü gör" → 'Devam Ettiklerim' filtresine geç (0<%<100).
                setAktifCip('devam');
                setFavoriAcik(false); // çip filtresi görünür olsun
                setCipGoster(true); // çip şeridi açık → seçili çip görünsün
              }}
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
          ) : null
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
              {favoriAcik && favoriler.size === 0
                ? 'Henüz favori kanun yok — bir kanunun kalbine dokun.'
                : q
                  ? 'Eşleşen kanun yok.'
                  : favoriAcik
                    ? 'Bu filtrede favori kanun yok.'
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
                toplam={toplamKart(law.id)}
                sonGun={sonGun(law.id)}
                favori={favoriler.has(law.id)}
                onFavori={favoriToggle}
                onPress={kanunaGit}
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

/** Altın ilerleme barı (track + dolu). Flex-oranlı dolum → %100'de tam dolar. */
function Bar({ yuzde }: { yuzde: number }) {
  const w = Math.min(100, Math.max(0, yuzde));
  return (
    <View style={st.barTrack}>
      {w > 0 ? <View style={[st.barFill, { flex: w }]} /> : null}
      {w < 100 ? <View style={{ flex: 100 - w }} /> : null}
    </View>
  );
}

function DevamEtKart({
  law,
  calisilan,
  toplam,
  siradaki,
  onPress,
  onTumunuGor,
}: {
  law: LawWithCount;
  calisilan: number;
  toplam: number;
  siradaki: boolean;
  onPress: () => void;
  onTumunuGor: () => void;
}) {
  const yuzde = toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0;
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;

  return (
    <Pressable
      style={({ pressed }) => [st.devamKart, pressed && st.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Çalışmaya devam et: ${law.ad}`}>
      <View style={st.devamBaslikSatir}>
        <View style={st.devamBaslikSol}>
          <MaterialCommunityIcons name="bookmark" size={16} color={Palette.altinKoyu} />
          <AppText variant="etiket" bold color="altinMetin" style={st.devamEtiket}>
            {siradaki ? '🎖️ SIRADAKİ KANUN' : 'DEVAM ET'}
          </AppText>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onTumunuGor();
          }}
          hitSlop={6}
          style={st.tumunuGor}
          accessibilityRole="button"
          accessibilityLabel="Tümünü gör">
          <AppText variant="etiket" bold color="solukMetin">
            Tümünü gör
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.solukMetin} />
        </Pressable>
      </View>
      <View style={st.devamGovde}>
        <Monogram no={no} boyut={72} variant="baslik" />
        <View style={st.devamOrta}>
          <AppText variant="govde" bold color="anaMetin">
            {hecele(law.ad)}
          </AppText>
          <AppText variant="kucuk" color="solukMetin">
            {calisilan} / {toplam} kart tamamlandı
          </AppText>
          <View style={st.barSatir}>
            <Bar yuzde={yuzde} />
            <AppText variant="etiket" bold color="altinMetin" style={st.barYuzde}>
              %{yuzde}
            </AppText>
          </View>
        </View>
        <View style={st.bookDaire}>
          <MaterialCommunityIcons name="book-open-variant" size={26} color={Palette.altinKoyu} />
        </View>
      </View>
      <View style={st.devamCta}>
        <MaterialCommunityIcons name="play" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" bold color="lacivert">
          {siradaki ? 'Bununla devam et' : 'Çalışmaya devam et'}
        </AppText>
      </View>
    </Pressable>
  );
}

function KanunSatir({
  law,
  calisilan,
  toplam,
  sonGun,
  favori,
  onFavori,
  onPress,
}: {
  law: LawWithCount;
  calisilan: number;
  toplam: number;
  sonGun: number | null;
  favori: boolean;
  onFavori: (lawId: number) => void;
  onPress: (law: LawWithCount) => void;
}) {
  // Durum TAM SAYI sayımıyla (yuvarlama YOK) → filtreyle BİREBİR tutarlı (sınır
  // durumlarında çoklu/yanlış sekme sorunu biter). yüzde yalnız bar/etiket için.
  const tam = toplam > 0 && calisilan >= toplam;
  const bos = calisilan === 0;
  const klasorAdi = LAW_KLASOR[law.id];
  const indirme = useKanunIndirme(klasorAdi ?? '');
  const router = useRouter();
  const { kanunErisilebilir } = useUyelik();
  // Premium kilidi: erişim yoksa satır → paywall (indir/çalış yerine). Şalter kapalıysa hep açık.
  const kilitli = !kanunErisilebilir(klasorAdi, law.blok);
  // Uzak modda (içerik sunucuda): bir kanunu çalışmak için ÖNCE indirilmeli.
  const indirGerek =
    !!klasorAdi && indirmeDestekli && !!ICERIK_TABANI && indirme.durum !== 'indirildi';

  function satiraBas() {
    if (kilitli) {
      router.push('/paywall');
      return;
    }
    if (indirGerek) {
      if (indirme.durum === 'iniyor') return; // iniyorsa bekle
      Alert.alert(
        'Önce indir',
        `"${law.ad}" çalışmak için önce indirilmeli. İndirildikten sonra internetsiz, anında çalışır. Şimdi indirilsin mi?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'İndir', onPress: () => void indirme.indir() },
        ],
      );
      return;
    }
    onPress(law);
  }
  const yuzde = toplam > 0 ? Math.min(100, Math.round((calisilan / toplam) * 100)) : 0;
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;
  // "En son ne zaman çalışıldı" metni. sonGun null → hiç başlanmamış (kırmızı uyarı).
  const sonMetin =
    sonGun === null
      ? 'Henüz başlamadın'
      : sonGun <= 0
        ? 'En son bugün çalıştın'
        : sonGun === 1
          ? 'En son dün çalıştın'
          : `En son ${sonGun} gün önce çalıştın`;

  return (
    <Pressable
      style={({ pressed }) => [st.satir, pressed && st.pressed]}
      onPress={satiraBas}
      accessibilityRole="button"
      accessibilityLabel={law.ad}>
      {/* ÜST: monogram + tam kanun adı BOYDAN BOYA (heceli sarma → Türkçe hece bölme). */}
      <View style={st.satirUst}>
        <Monogram no={no} boyut={56} variant="govde" />
        <AppText variant="govde" bold color="anaMetin" style={st.kanunAd}>
          {hecele(law.ad)}
        </AppText>
      </View>

      <AppText variant="kucuk" color="solukMetin">
        {calisilan} / {toplam} kart tamamlandı
      </AppText>
      {/* En son ne zaman çalışıldı — hiç başlanmadıysa kırmızı uyarı. */}
      <View style={st.sonSatir}>
        <MaterialCommunityIcons
          name={sonGun === null ? 'alert-circle-outline' : 'clock-outline'}
          size={13}
          color={sonGun === null ? Palette.kirmizi : Palette.solukMetin}
        />
        <AppText variant="etiket" bold={sonGun === null} color={sonGun === null ? 'kirmizi' : 'solukMetin'}>
          {sonMetin}
        </AppText>
      </View>
      <View style={st.barSatir}>
        <Bar yuzde={yuzde} />
        <AppText variant="etiket" bold color="altinMetin" style={st.barYuzde}>
          %{yuzde}
        </AppText>
      </View>

      {/* ALT SAĞ: kalp + Başla/Devam/tik (kartın sağ altında). */}
      <View style={st.satirAlt}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onFavori(law.id);
          }}
          hitSlop={8}
          style={st.kalp}
          accessibilityRole="button"
          accessibilityLabel={favori ? 'Favoriden çıkar' : 'Favoriye ekle'}>
          <MaterialCommunityIcons
            name={favori ? 'heart' : 'heart-outline'}
            size={22}
            color={favori ? Palette.altin : Palette.solukMetin}
          />
        </Pressable>
        {kilitli ? (
          <View style={st.satirSag}>
            <View style={st.kilitChip}>
              <MaterialCommunityIcons name="lock" size={15} color={Palette.altinKoyu} />
              <AppText variant="etiket" bold color="altinMetin">
                Kilidi Aç
              </AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
          </View>
        ) : (
          <>
            {klasorAdi ? (
              <KanunIndirButon
                durum={indirme.durum}
                yuzde={indirme.yuzde}
                inenBayt={indirme.inenBayt}
                onIndir={indirme.indir}
                onSil={indirme.sil}
              />
            ) : null}
            {tam ? (
              <View style={st.satirSag}>
                <MaterialCommunityIcons name="check-circle" size={24} color={Palette.altinKoyu} />
              </View>
            ) : (
              <View style={st.satirSag}>
                <View style={st.baslaBtn}>
                  <MaterialCommunityIcons name="play" size={15} color={Palette.altinKoyu} />
                  <AppText variant="etiket" bold color="altinMetin">
                    {bos ? 'Başla' : 'Devam'}
                  </AppText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
              </View>
            )}
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
  // Üst Müşterek/Branş seçici (segmented)
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
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  aciklama: {
    flex: 1,
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  favBtnAktif: {
    backgroundColor: Palette.altin,
    borderColor: Palette.altin,
  },
  kalp: {
    padding: Spacing.one,
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
  cipScroll: {
    flexGrow: 0, // yatay ScrollView flex column içinde dikey büyümesin (DEV SÜTUN bug fix)
  },
  cipSeridi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  cip: {
    height: 44,
    alignSelf: 'flex-start', // dikey esneme yok
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.l,
    borderWidth: 1,
    alignItems: 'center',
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
  devamBaslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devamBaslikSol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  devamEtiket: {
    letterSpacing: 1,
  },
  tumunuGor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
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
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.ilerlemeTrack,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.altinKoyu, // krem üstünde okunur (şampanya altın soluk kalıyordu)
  },
  barYuzde: {
    minWidth: 40,
    textAlign: 'right',
    flexShrink: 0,
  },

  // Liste satırı — DİKEY kart: üst (monogram+ad boydan boya) · ilerleme · alt sağ (kalp+Başla)
  satir: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  satirUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  // Kanun adı: kalan genişliği tam kaplar (monogram dışında boydan boya), heceli sarar.
  kanunAd: {
    flex: 1,
  },
  sonSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  // Alt aksiyon satırı: kalp + Başla/Devam/tik → kartın SAĞ ALTINDA.
  satirAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  satirSag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  baslaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  kilitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  bookDaire: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.altinSolukYuzey,
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
