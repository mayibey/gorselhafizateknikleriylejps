import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DogrulamaKapisi } from '@/components/auth/dogrulama-kapisi';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, type PaletteColor, Radius, Spacing } from '@/constants/theme';
import { getAllCards, getBolumKartIds, getLaws, getPerformans, getSinavSonuclari, getStudyCards } from '@/db/database';
import type { LawWithCount, PerformansSatir, SinavSonuc } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { type BransKitap, bransKitaplari } from '@/lib/brans-kitap';
import { bugunISO } from '@/lib/srs';
import { sonCalisilanKanun } from '@/lib/devamet';
import { useKisiselOzellik } from '@/lib/ozellik';
import { sinavVarMi, testSayisi, testSoruSayisi } from '@/lib/sinav';
import { sinavIlerlemeAnahtarlari } from '@/lib/sinav-ilerleme';
import { GununMaddesiKarti } from '@/components/mevzuat/gunun-maddesi';
import { KanunIndirButon } from '@/components/mevzuat/kanun-indir-buton';
import { ICERIK_TABANI } from '@/constants/config';
import { KILIT_AKTIF, ucretsizKanun } from '@/constants/urunler';
import { LAW_KLASOR } from '@/db/seed';
import { useKanunIndirme } from '@/hooks/use-kanun-indirme';
import { getFavoriler, toggleFavori } from '@/lib/favori';
import { indirmeDestekli, kanunIndirilmisMi, kanunTahminiBoyut } from '@/lib/indirme';
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

/**
 * Mevzuat ekranı ODAKTA mı? "İndir ve başla" akışı indirme bitince o kanunun patikasını
 * açıyor; kullanıcı bu arada başka ekrana geçtiyse (başkan, 13 Ağu: 5237'nin patikasındayken
 * arka planda inen kanunların patikaları peş peşe açılıyordu) AÇMAMALI.
 */
let mevzuatOdakli = false;

export default function MevzuatScreen() {
  useFocusEffect(
    useCallback(() => {
      mevzuatOdakli = true;
      return () => {
        mevzuatOdakli = false;
      };
    }, []),
  );
  // E-POSTA DOĞRULAMA KAPISI: doğrulanmamış hesap içeriğe giremez (girişe izin var, içerik kilitli).
  return (
    <DogrulamaKapisi>
      <MevzuatIcerik />
    </DogrulamaKapisi>
  );
}

function MevzuatIcerik() {
  // GECE KARARI K4 (kişiye özel deneme): Talim sekmesi kalkınca denemelerin kapısı burası.
  const talimBurada = useKisiselOzellik('talim-mevzuata');
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
  // Üst seçim: Müşterek (mevcut liste) / Branş (Jandarma → kanun kartları; diğer branşlar → PDF kitaplar).
  const [blok, setBlok] = useState<'müşterek' | 'brans'>('müşterek');
  // Branşın PDF özet kitapları (Jandarma dışı branşlarda dolu; branş sekmesinde liste olarak gösterilir).
  const [kitaplar, setKitaplar] = useState<BransKitap[] | null>(null);
  // Talim testlerinin durumu: law_id → (test → bitmiş sonuç) ve "law.test" → yarım kalmış.
  const [testSonuc, setTestSonuc] = useState<Map<number, Map<number, SinavSonuc>>>(new Map());
  const [testYarim, setTestYarim] = useState<Set<string>>(new Set());

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
    // Talim testi durumu (çözüldü / yarım / hiç): satırlarda etiket olarak görünür.
    // Sonuçlar id artan geldiği için son yazan (en güncel) deneme kalır.
    void getSinavSonuclari()
      .then((sonuclar) => {
        const sm = new Map<number, Map<number, SinavSonuc>>();
        for (const s of sonuclar) {
          let mp = sm.get(s.law_id);
          if (!mp) {
            mp = new Map();
            sm.set(s.law_id, mp);
          }
          mp.set(s.test, s);
        }
        setTestSonuc(sm);
      })
      .catch(() => setTestSonuc(new Map()));
    void sinavIlerlemeAnahtarlari()
      .then(setTestYarim)
      .catch(() => setTestYarim(new Set()));
    // Favoriler (AsyncStorage) — focus'ta tazelenir.
    void getFavoriler()
      .then((ids) => setFavoriler(new Set(ids)))
      .catch(() => {});
    // Branşın PDF kitapları (Jandarma dışı branşlarda dolu → branş sekmesi liste gösterir).
    void bransKitaplari(brans)
      .then(setKitaplar)
      .catch(() => setKitaplar([]));
  }, [brans]);

  const favoriToggle = (lawId: number) => {
    void toggleFavori(lawId).then((yeni) => setFavoriler(new Set(yeni)));
  };

  useFocusEffect(yukle);

  // Gösterilecek kanunlar. Müşterek sekmesi: yalnız içeriği OLAN müşterek (DEĞİŞMEDİ).
  // Branş sekmesi: branş kanunları — isimler İÇERİK GELMEDEN de görünsün (kart şartı YOK;
  // kanunlar yavaş yavaş üretildikçe otomatik dolacak). Rütbe kapsamı ikisinde de uygulanır.
  const musterek =
    blok === 'brans'
      ? (laws
          ?.filter((l) => l.blok === 'branş' && rutbeGorur(l.id, rutbe))
          // Branş TCK (law 67) EN ÜSTTE (TCK temel kanun); geri kalanlar id sırasında.
          .sort((a, b) => (a.id === 67 ? 0 : a.id) - (b.id === 67 ? 0 : b.id)) ?? [])
      : (laws?.filter((l) => l.blok === 'müşterek' && l.kartSayisi > 0 && rutbeGorur(l.id, rutbe)) ?? []);

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
    // Kanuna basınca DOĞRUDAN kart akışı başlar (eski usül). Araya "Görsel Konu Anlatımı / Zor
    // Detay Kartları" seçim ekranı (/kanun-sec) GİRMEZ — Zor Detay v2'ye ertelendi. Kilit/indirme
    // kapısı KanunSatir.satiraBas'ta zaten geçildi; /patika kendi kilit kapısını da uygular.
    router.push({ pathname: '/patika', params: { lawId: String(law.id) } });
  }

  // A2/A3 — HİÇ BAŞLAMAMIŞ KULLANICI. "Devam Et" kartı yalnız daha önce çalışılmış kanun varsa
  // çıkıyor; yeni kullanıcıda hiç çalışma olmadığı için ekranın tepesi BOMBOŞ kalıyordu — yani
  // yön gösteren tek unsur, tam da en çok yön gereken kişide görünmüyordu (başkan bildirdi).
  const hicBaslamadi =
    !!ilerleme && [...ilerleme.values()].every((v) => v === 0);
  // Ücretsiz kanunu listeden bul (TCK). Kilit kapalıysa/bulunamazsa kart gösterilmez.
  const ucretsizLaw = laws?.find((l) => ucretsizKanun(LAW_KLASOR[l.id]));

  const devamLaw =
    devam.tip === 'devam' || devam.tip === 'siradaki'
      ? laws?.find((l) => l.id === devam.lawId)
      : undefined;

  return (
    <Screen
      title="Mevzuat"
      // GECE TEMASI (IMG_3129 mock, 11 Ağu): bayraklıda Mevzuat da petrol gece + marka başlık.
      koyu={talimBurada}
      marka={talimBurada}
      markaKucukHarf
      kompaktBaslik={talimBurada}
      // Bayrak açıkken Müşterek/Branş şeridi kaydırmanın DIŞINDA sabit durur (başkan isteği).
      sabitUst={talimBurada ? (
        <View>
        {/* Mock: başlık altı mühür satırı — "N kanun • tüm müfredat". */}
        <View style={st.muhurSatir}>
          <View style={st.muhurCizgi} />
          <AppText variant="etiket" bold color="beyaz" style={st.muhurYazi}>
            {musterek.length} kanun • tüm müfredat
          </AppText>
          <View style={st.muhurCizgi} />
        </View>
        <View style={[st.blokSecici, st.blokSeciciGece]}>
        {(['müşterek', 'brans'] as const).map((b) => {
          const aktif = blok === b;
          return (
            <Pressable
              key={b}
              onPress={() => setBlok(b)}
              style={[st.blokSeg, st.blokSegGece, aktif && st.blokSegAktifGece]}
              accessibilityRole="button"
              accessibilityLabel={b === 'müşterek' ? 'Müşterek konular' : 'Branş konuları'}>
              <MaterialCommunityIcons
                name={b === 'müşterek' ? 'account-group' : 'medal-outline'}
                size={16}
                color={aktif ? Palette.altinParlak : 'rgba(226,236,240,0.8)'}
              />
              {/* Mock IMG_3129: aktif pil altın çerçeve + altın yazı, pasif soluk beyaz. */}
              <AppText variant="etiket" bold color={aktif ? 'altinParlak' : 'beyaz'} numberOfLines={1}>
                {/* 23 Ağu (başkan): "Müşterek Mevzuat / Jandarma Mevzuatı" -> "Müşterek Konular /
                    Branş Konuları". Sekme kanun listesini değil KONU kümesini ayırıyor. */}
                {b === 'müşterek' ? 'Müşterek Konular' : 'Branş Konuları'}
              </AppText>
            </Pressable>
          );
        })}
      </View>
        </View>
      ) : undefined}>
      {!talimBurada ? (
        <View style={st.blokSecici}>
        {(['müşterek', 'brans'] as const).map((b) => {
          const aktif = blok === b;
          return (
            <Pressable
              key={b}
              onPress={() => setBlok(b)}
              style={[st.blokSeg, aktif && st.blokSegAktif]}
              accessibilityRole="button"
              accessibilityLabel={b === 'müşterek' ? 'Müşterek konular' : 'Branş konuları'}>
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
      ) : null}


      {blok === 'brans' && kitaplar && kitaplar.length > 0 ? (
        <BransKitapListe
          kitaplar={kitaplar}
          gece={talimBurada}
          testSonuc={testSonuc}
          testYarim={testYarim}
          onAc={(k) => router.push({ pathname: '/kitap', params: { yol: k.dosyaYolu, baslik: k.baslik } })}
        />
      ) : (
        <>
      {!talimBurada ? (
        <>
      {/* Açıklama + Favorilerim filtresi (Screen header'da slot yok → kayan içerik) */}
      <View style={st.ustSatir}>
        <AppText variant="kucuk" color="solukMetin" style={st.aciklama}>
          {hicBaslamadi && ucretsizLaw
            ? 'TCK tamamen ücretsiz — önce onunla başla.'
            : 'Kanunları çalış, hedeflerine daha hızlı ulaş.'}
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
        </>
      ) : null}

      {/* Arama + filtre butonu (listeyle birlikte kayar).
          Bayraklı modda (başkan, 9 Ağu gece: "iki aramayı birleştirip tek yere toplayalım")
          kutu yazı almaz; dokununca TAM arama ekranı (/ara: kanun metni + madde no + kartlar)
          açılır. Karargah'taki büyüteç de bayraklıda gizlenir → arama tek yerde. */}
      <View style={st.aramaSatir}>
        {talimBurada ? (
          <Pressable
            style={[st.aramaKutu, st.aramaKutuGece]}
            onPress={() => router.push('/arama')}
            accessibilityRole="button"
            accessibilityLabel="Ara — kanun, madde, kart">
            <MaterialCommunityIcons name="magnify" size={20} color="rgba(226,236,240,0.75)" />
            <AppText variant="govde" style={[st.aramaSahte, st.aramaSahteGece]}>
              Kanun, madde veya konu ara...
            </AppText>
          </Pressable>
        ) : (
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
        )}
        <Pressable
          onPress={() => setCipGoster((v) => !v)}
          style={[st.filtreBtn, talimBurada && st.filtreBtnGece, cipGoster && st.filtreBtnAktif]}
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
      {(cipGoster || talimBurada) && !favoriAcik ? (
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
                style={[
                  st.cip,
                  aktif ? st.cipAktif : st.cipPasif,
                  talimBurada && (aktif ? st.cipAktifGece : st.cipPasifGece),
                ]}
                accessibilityRole="button"
                accessibilityLabel={c.ad}>
                <AppText
                  variant="etiket"
                  bold
                  color={talimBurada ? (aktif ? 'altinParlak' : 'beyaz') : aktif ? 'beyaz' : 'anaMetin'}>
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
          {/* Üst Talim/Genel Denemeler kartı KALDIRILDI (başkan, 9 Ağu akşam) —
              denemelere giriş her kanunun kendi "Talim Yap" düğmesinden. */}

          {/* Devam Et — YALNIZ "Tümü" görünümünde (filtre/favori seçiliyken gizli → hero
              filtreden bağımsız olduğu için "kanun her sekmede görünüyor" karışıklığı olmaz). */}
          {/* A2 — BURADAN BAŞLA: hiç çalışmamış kullanıcıya ücretsiz kanunu tek dokunuşla açan
              kart. İlk kart çalışılınca kendiliğinden kaybolur, yerini "Devam Et" alır. */}
          {aktifCip === 'tumu' && !favoriAcik && hicBaslamadi && ucretsizLaw ? (
            <BuradanBaslaKart law={ucretsizLaw} onPress={() => kanunaGit(ucretsizLaw)} />
          ) : null}

          {aktifCip === 'tumu' && !favoriAcik && !hicBaslamadi ? (
            devamLaw ? (
            // Bayraklıda bu kart KARARGAH'a taşındı (KaldiginYerKarti) — burada mükerrerdi.
            talimBurada ? null : (
            <DevamEtKart
              kompakt={talimBurada}
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
            )
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

          {/* TÜM MEVZUAT bölüm başlığı — mock'ta yok, bayraklıda gizli. */}
          {talimBurada ? null : (
          <View style={st.sectionBaslik}>
            <MaterialCommunityIcons name="scale-balance" size={18} color={Palette.solukMetin} />
            <AppText variant="etiket" bold color="solukMetin" style={st.sectionAd}>
              TÜM MEVZUAT
            </AppText>
            <AppText variant="etiket" color="solukMetin">
              Toplam {gosterilen.length} kanun
            </AppText>
          </View>
          )}

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
                talimAc={talimBurada}
                testSonuclari={testSonuc.get(law.id)}
                testYarim={testYarim}
              />
            ))
          )}
          {/* GECE KARARI K4 (bayraklı): Günün Maddesi Karargah'tan buraya, listenin altına. */}
          {talimBurada ? <GununMaddesiKarti /> : null}
        </>
      )}
        </>
      )}
    </Screen>
  );
}

/**
 * Bir testin durum etiketi: çözdüyse kaç doğru, yarım bıraktıysa "devam ediyor", hiç
 * girmediyse "çözülmedi". Yarım kayıt bitmiş sonuçtan ÖNCE gelir (yeniden başlamışsa
 * ekranda eski skor değil "devam ediyor" görünmeli). Müşterek satırı ve branş kitabı
 * AYNI fonksiyonu kullanır → iki yerde ayrı kural olmaz.
 */
function testDurumEtiketi(
  lawId: number,
  indeks: number,
  sonuclar: Map<number, SinavSonuc> | undefined,
  yarim: Set<string> | undefined,
  gece: boolean,
): { metin: string; renk: PaletteColor } {
  if (yarim?.has(`${lawId}.${indeks}`)) {
    return { metin: 'devam ediyor', renk: gece ? 'altinParlak' : 'amber' };
  }
  const s = sonuclar?.get(indeks);
  if (s && s.toplam > 0) {
    return { metin: `${s.dogru}/${s.toplam} doğru`, renk: gece ? 'yesilParlak' : 'yesil' };
  }
  return { metin: 'çözülmedi', renk: gece ? 'kartMetinIkincil' : 'solukMetin' };
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
        // 4 haneli numara (5237) küçük kutuda satıra BÖLÜNMESİN: tek satır zorunlu,
        // sığmazsa punto kendiliğinden küçülür (başkanın 9 Ağu "523/7" ekran görüntüsü).
        <AppText
          variant={variant}
          bold
          color="altin"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={{ paddingHorizontal: 2, textAlign: 'center' }}>
          {no}
        </AppText>
      ) : (
        <MaterialCommunityIcons name="book-outline" size={Math.round(boyut * 0.42)} color={Palette.altin} />
      )}
    </View>
  );
}

/** Altın ilerleme barı (track + dolu). Flex-oranlı dolum → %100'de tam dolar. */
function Bar({ yuzde, gece }: { yuzde: number; gece?: boolean }) {
  const w = Math.min(100, Math.max(0, yuzde));
  return (
    <View style={[st.barTrack, gece && st.barTrackGece]}>
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
  kompakt,
}: {
  law: LawWithCount;
  calisilan: number;
  toplam: number;
  siradaki: boolean;
  onPress: () => void;
  onTumunuGor: () => void;
  kompakt?: boolean;
}) {
  const yuzde = toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0;
  // KOMPAKT (bayraklı, başkan 9 Ağu): dev kart yerine tek satır — az yer, aynı iş.
  if (kompakt) {
    const no = law.ad.match(/^(\d+)/)?.[1] ?? null;
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [st.devamMini, pressed && st.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Çalışmaya devam et">
        <Monogram no={no} boyut={40} variant="govde" />
        <View style={st.devamMiniOrta}>
          <AppText variant="kucuk" bold color="anaMetin" numberOfLines={1}>
            {law.ad}
          </AppText>
          <AppText variant="etiket" color="solukMetin">
            {siradaki ? 'Sıradaki kanun' : 'Kaldığın yer'} · {calisilan}/{toplam} · %{yuzde}
          </AppText>
        </View>
        <View style={st.devamMiniBtn}>
          <MaterialCommunityIcons name="play" size={15} color={Palette.lacivert} />
          <AppText variant="etiket" bold color="lacivert">
            Devam
          </AppText>
        </View>
      </Pressable>
    );
  }
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
            {law.ad}
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

/**
 * A2 — "BURADAN BAŞLA" kartı. Yalnız HİÇ çalışmamış kullanıcıya, yalnız "Tümü" görünümünde.
 * Amaç: 66 satırlık listede (65'i kilitli) yeni kullanıcıya tek ve net bir giriş noktası vermek.
 * İlk kartını çalışır çalışmaz kaybolur, yerini normal "Devam Et" kartı alır.
 */
function BuradanBaslaKart({ law, onPress }: { law: LawWithCount; onPress: () => void }) {
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;
  return (
    <Pressable
      style={({ pressed }) => [st.devamKart, st.baslaKart, pressed && st.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Buradan başla: ${law.ad} — ücretsiz`}>
      <View style={st.devamBaslikSatir}>
        <View style={st.devamBaslikSol}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color={Palette.yesil} />
          <AppText variant="etiket" bold color="yesil" style={st.devamEtiket}>
            BURADAN BAŞLA
          </AppText>
        </View>
        <View style={st.ucretsizChip}>
          <MaterialCommunityIcons name="gift-outline" size={14} color={Palette.beyaz} />
          <AppText variant="etiket" bold color="beyaz">
            ÜCRETSİZ
          </AppText>
        </View>
      </View>
      <View style={st.devamGovde}>
        <Monogram no={no} boyut={72} variant="baslik" />
        <View style={st.devamOrta}>
          <AppText variant="govde" bold color="anaMetin">
            {law.ad}
          </AppText>
          <AppText variant="kucuk" color="solukMetin">
            Bu kanunun tamamı ücretsiz — kart kart çalış, ilerlemen kaydedilsin.
          </AppText>
        </View>
      </View>
      <View style={st.devamCta}>
        <MaterialCommunityIcons name="play" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" bold color="lacivert">
          Çalışmaya başla
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
  talimAc,
  testSonuclari,
  testYarim,
}: {
  law: LawWithCount;
  calisilan: number;
  toplam: number;
  sonGun: number | null;
  favori: boolean;
  onFavori: (lawId: number) => void;
  onPress: (law: LawWithCount) => void;
  talimAc?: boolean;
  /** Bu kanunun bitmiş testleri: test → son sonuç (yoksa hiç bitirilmemiş). */
  testSonuclari?: Map<number, SinavSonuc>;
  /** Yarım kalmış sınavlar ("lawId.test") — tüm kanunlar için ortak küme. */
  testYarim?: Set<string>;
}) {
  // Durum TAM SAYI sayımıyla (yuvarlama YOK) → filtreyle BİREBİR tutarlı (sınır
  // durumlarında çoklu/yanlış sekme sorunu biter). yüzde yalnız bar/etiket için.
  const tam = toplam > 0 && calisilan >= toplam;
  const bos = calisilan === 0;
  const [testlerAcik, setTestlerAcik] = useState(false);
  const klasorAdi = LAW_KLASOR[law.id];
  const indirme = useKanunIndirme(klasorAdi ?? '');
  const router = useRouter();
  const { kanunErisilebilir } = useUyelik();
  // Premium kilidi: erişim yoksa satır → paywall (indir/çalış yerine). Şalter kapalıysa hep açık.
  const kilitli = !kanunErisilebilir(klasorAdi, law.blok);
  // GECE KARARI M-K4 (bayraklı): her kanunun denemeleri kendi kartının altında.
  const denemeVar = !!talimAc && !kilitli && sinavVarMi(law.id);
  const testAdedi = denemeVar ? testSayisi(law.id) : 0;
  // A1 — ÜCRETSİZ ROZETİ: TCK bedava ama bunu hiçbir yer SÖYLEMİYORDU; ücretsizlik yalnızca
  // "kilit rozeti yok" olmasından anlaşılıyordu. 66 satırın 65'i kilitli olduğu için yeni
  // kullanıcı "her şey kilitli" sanıp çıkıyordu (başkan bildirdi, 7 Ağu 2026). Kilit varken
  // rozet gösterilmez (kilitliyse zaten ücretsiz değildir).
  const ucretsiz = !kilitli && ucretsizKanun(klasorAdi);
  // Uzak modda (içerik sunucuda): bir kanunu çalışmak için ÖNCE indirilmeli.
  const indirGerek =
    !!klasorAdi && indirmeDestekli && !!ICERIK_TABANI && indirme.durum !== 'indirildi';

  /**
   * Testin durumu (başkan, 1 Eyl 2026): çözdüyse kaç doğru, yarım bıraktıysa "devam ediyor",
   * hiç girmediyse "çözülmedi". Yarım kayıt bitmiş sonuçtan ÖNCE gelir: kullanıcı testi
   * yeniden çözmeye başlamışsa ekranda eski skor değil "devam ediyor" görünmeli.
   */
  const testDurum = (indeks: number) =>
    testDurumEtiketi(law.id, indeks, testSonuclari, testYarim, !!talimAc);

  function satiraBas() {
    if (kilitli) {
      // GECE KARARI M3 (bayraklı): doğrudan ödeme ekranı AÇILMAZ — önce ne
      // kazanacağını söyleyen kısa panel, "gör" derse ödeme ekranı.
      if (talimAc) {
        Alert.alert(
          'Tam Erişim',
          `"${law.ad}" Tam Erişim paketindedir.\n\nTam Erişim'de: tüm müşterek ve branş mevzuatı, görsel hafıza kartları, sesli anlatımlar, deneme sınavları ve oyunların tamamı.`,
          [
            { text: 'Şimdi değil', style: 'cancel' },
            { text: 'Tam Erişimi Gör', onPress: () => router.push('/paywall') },
          ],
        );
        return;
      }
      router.push('/paywall');
      return;
    }
    if (indirGerek) {
      if (indirme.durum === 'iniyor') return; // iniyorsa bekle
      // Bayraklıda düğme "İndir ve Başla" der — sözünü tutar: indirme biter bitmez
      // çalışmaya girer. Normal modda eski davranış (indir, kullanıcı tekrar basar).
      const indirVeGir = async () => {
        await indirme.indir();
        // Ekran hâlâ Mevzuat'ta mı? Değilse (kullanıcı başka kanunun patikasına geçtiyse)
        // otomatik açma YAPILMAZ — arka planda biten indirmeler ekranı ele geçiriyordu.
        if (mevzuatOdakli && talimAc && klasorAdi && kanunIndirilmisMi(klasorAdi)) onPress(law);
      };
      // A4 — ÜCRETSİZ kanunda SORMA, doğrudan indir. Yeni kullanıcı zaten "ne yapacağım"
      // aşamasında; araya bir de "indirilsin mi?" kararı koymak ikinci engel oluyordu.
      // (Ücretli kanunlarda soru KALIYOR — orada indirme bilinçli bir tercih.)
      if (ucretsiz) {
        void indirVeGir();
        return;
      }
      Alert.alert(
        'Önce indir',
        `"${law.ad}" çalışmak için önce indirilmeli. İndirildikten sonra internetsiz, anında çalışır. Şimdi indirilsin mi?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'İndir', onPress: () => void indirVeGir() },
        ],
      );
      return;
    }
    onPress(law);
  }
  // BULUT İKONU (bayraklı; Gemini önerisinden alınan fikir, başkan onayı 9 Ağu gece):
  // İndirildi/çöp çipi yerine başlık satırında tek ikon — bulut=inmemiş, tik=inmiş,
  // inerken %. Dokununca indir / cihazdan sil. Çipler kalkınca kart bir satır daha kısalır.
  const bulutVar = !!talimAc && !kilitli && !!klasorAdi && indirmeDestekli && !!ICERIK_TABANI;
  function bulutBas() {
    if (indirme.durum === 'iniyor') return;
    if (indirme.durum === 'indirildi') {
      Alert.alert('İndirilen içerik', `"${law.ad}" cihazına indirilmiş — internetsiz çalışır.`, [
        { text: 'Kapat', style: 'cancel' },
        { text: 'Cihazdan Sil', style: 'destructive', onPress: () => void indirme.sil() },
      ]);
      return;
    }
    Alert.alert(
      'İndir',
      `"${law.ad}" indirilsin mi? İndirildikten sonra internetsiz, anında çalışır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'İndir', onPress: () => void indirme.indir() },
      ],
    );
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

  // İndir + Başla/Devam (veya Kilidi Aç) kümesi — bayraklı modda kartın ÜST satırında,
  // normal modda eskisi gibi alt satırda. Tek tanım, iki yerleşim.
  const aksiyonKumesi = kilitli ? (
    <View style={st.satirSag}>
      <View style={[st.kilitChip, talimAc && st.kilitChipGece]}>
        <MaterialCommunityIcons
          name="lock"
          size={15}
          color={talimAc ? Palette.altinParlak : Palette.altinKoyu}
        />
        {/* GECE KARARI M3 (bayraklı): "Kilidi Aç" emri değil, ait olduğu paketi söyleyen rozet. */}
        <AppText variant="etiket" bold color={talimAc ? 'altinParlak' : 'altinMetin'}>
          {talimAc ? "Tam Erişim'de" : 'Kilidi Aç'}
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
          tahminiBayt={kanunTahminiBoyut(klasorAdi)}
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
  );

  return (
    <Pressable
      style={({ pressed }) => [st.satir, talimAc && st.satirGece, pressed && st.pressed]}
      onPress={satiraBas}
      accessibilityRole="button"
      accessibilityLabel={law.ad}>
      {/* ÜST: monogram + tam kanun adı BOYDAN BOYA (heceli sarma → Türkçe hece bölme).
          Bayraklıda sağda indirme durumu ikonu: bulut=inmemiş, tik=inmiş, inerken %. */}
      <View style={st.satirUst}>
        <Monogram no={no} boyut={56} variant="govde" />
        <AppText variant="govde" bold color={talimAc ? 'beyaz' : 'anaMetin'} style={st.kanunAd}>
          {law.ad}
        </AppText>
        {bulutVar ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              bulutBas();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              indirme.durum === 'indirildi' ? 'İndirildi — yönet' : 'Kanunu indir'
            }>
            {indirme.durum === 'iniyor' ? (
              <AppText variant="etiket" bold color="altinMetin">
                %{indirme.yuzde}
              </AppText>
            ) : (
              <MaterialCommunityIcons
                name={indirme.durum === 'indirildi' ? 'cloud-check-outline' : 'cloud-download-outline'}
                size={24}
                color={
                  indirme.durum === 'indirildi'
                    ? talimAc
                      ? Palette.altinParlak
                      : Palette.altinKoyu
                    : talimAc
                      ? 'rgba(226,236,240,0.8)'
                      : Palette.solukMetin
                }
              />
            )}
          </Pressable>
        ) : null}
      </View>

      {ucretsiz ? (
        <View style={st.ucretsizChip}>
          <MaterialCommunityIcons name="gift-outline" size={14} color={Palette.beyaz} />
          <AppText variant="etiket" bold color="beyaz">
            ÜCRETSİZ
          </AppText>
        </View>
      ) : null}

      {/* GECE KARARI M2 (bayraklı): sıfır asla görünmez — başlanmamış kanunda "0/31" ve
          boş çubuk yerine kanunun ne sunduğu yazar. */}
      {talimAc && bos ? (
        <AppText variant="kucuk" bold={talimAc} color={talimAc ? 'beyaz' : 'solukMetin'} style={talimAc && st.geceIkincil}>
          {toplam} kart · sesli anlatım
        </AppText>
      ) : (
        <AppText variant="kucuk" bold={talimAc} color={talimAc ? 'beyaz' : 'solukMetin'} style={talimAc && st.geceIkincil}>
          {calisilan} / {toplam} kart tamamlandı
        </AppText>
      )}
      {/* En son ne zaman çalışıldı — hiç başlanmadıysa kırmızı uyarı. Bayraklı modda
          İndir + Başla/Devam kümesi de BU satırın sağını paylaşır (başkan, 9 Ağu gece:
          "henüz başlamadın ile aynı satırı paylaşsalar") — kart bir satır daha kısalır.
          Taşma emniyeti: durum metni gerekirse "…" ile kısalır, kümeye asla binmez. */}
      <View style={st.sonSatir}>
        <MaterialCommunityIcons
          name={sonGun === null ? 'alert-circle-outline' : 'clock-outline'}
          size={13}
          color={
            sonGun === null
              ? talimAc
                ? Palette.kirmiziParlak
                : Palette.kirmizi
              : talimAc
                ? 'rgba(226,236,240,0.75)'
                : Palette.solukMetin
          }
        />
        <AppText
          variant="etiket"
          bold={sonGun === null}
          color={
            sonGun === null ? (talimAc ? 'kirmiziParlak' : 'kirmizi') : talimAc ? 'beyaz' : 'solukMetin'
          }
          numberOfLines={1}
          style={talimAc ? st.sonMetinEsnek : undefined}>
          {sonMetin}
        </AppText>
        {/* Bayraklıda çip kümesi kalktı (bulut ikonu + Çalış devraldı); yalnız kilitli
            kanunda "Kilidi Aç" burada durur. */}
        {talimAc && kilitli ? <View style={st.ustAksiyonBosluk} /> : null}
        {talimAc && kilitli ? aksiyonKumesi : null}
      </View>
      {/* M2: başlanmamışta boş çubuk + %0 hiç çizilmez (bayraklı). */}
      {talimAc && bos ? null : (
        <View style={st.barSatir}>
          <Bar yuzde={yuzde} gece={talimAc} />
          <AppText variant="etiket" bold color={talimAc ? 'altinParlak' : 'altinMetin'} style={st.barYuzde}>
            %{yuzde}
          </AppText>
        </View>
      )}

      {/* ALT SAĞ: kalp + Başla/Devam/tik — yalnız NORMAL modda (bayraklıda küme üstte). */}
      {!talimAc ? (
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
          {aksiyonKumesi}
        </View>
      ) : null}

      {/* ÇALIŞ + TALİM YAP (bayraklı — başkan emri): her kanunun altında iki düğme. */}
      {talimAc && !kilitli ? (
        <View style={st.ikiliButon}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              satiraBas();
            }}
            style={({ pressed }) => [st.calisBtn, talimAc && st.calisBtnGece, pressed && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Çalış">
            <MaterialCommunityIcons
              name={indirGerek ? 'cloud-download-outline' : 'play'}
              size={17}
              color={Palette.lacivert}
            />
            <AppText variant="kucuk" bold color="lacivert">
              {indirGerek ? 'İndir ve Başla' : bos ? 'Başla' : 'Çalış'}
            </AppText>
          </Pressable>
          {sinavVarMi(law.id) ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                // Başkan kararı (9 Ağu): kart şartı yok; tek testte de LİSTE açılır ki
                // soru sayısı görünsün (6698 doğrudan sorulara atlıyordu — tutarsızdı).
                setTestlerAcik((a) => !a);
              }}
              style={({ pressed }) => [st.talimBtn, talimAc && st.talimBtnGece, pressed && st.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Talim yap">
              <MaterialCommunityIcons
                name="target"
                size={16}
                color={talimAc ? Palette.altinParlak : Palette.altinKoyu}
              />
              <AppText variant="kucuk" bold color={talimAc ? 'altinParlak' : 'altinMetin'}>
                Talim Yap · {testAdedi}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {talimAc && !kilitli && testlerAcik
        ? Array.from({ length: testAdedi }, (_, indeks) => indeks).map((indeks) => (
            <Pressable
              key={indeks}
              onPress={(e) => {
                e.stopPropagation();
                // sinav.tsx `test` parametresini 0-TABANLI bekler (testNum).
                router.push({ pathname: '/sinav', params: { lawId: String(law.id), test: String(indeks) } });
              }}
              style={({ pressed }) => [st.denemeSatir, talimAc && st.denemeSatirGece, pressed && st.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Test ${indeks + 1}`}>
              <AppText variant="kucuk" bold color={talimAc ? 'beyaz' : 'anaMetin'}>
                Test {indeks + 1}
              </AppText>
              <View style={st.denemeDurum}>
                <AppText variant="etiket" bold color={talimAc ? 'altinParlak' : 'solukMetin'}>
                  {testSoruSayisi(law.id, indeks)} soru
                </AppText>
                <AppText variant="etiket" bold color={testDurum(indeks).renk}>
                  {testDurum(indeks).metin}
                </AppText>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={talimAc ? Palette.altinParlak : Palette.solukMetin}
              />
            </Pressable>
          ))
        : null}

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

/**
 * Branş PDF özet kitapları listesi (Jandarma dışı branşlar). Kitaba dokun → görüntüleyici.
 * PREMIUM: kitaplar ücretli içeriktir (sunucu da `pdf/...` yolunu premium kapısında tutar).
 * Erişim yoksa satır "Kilidi Aç" gösterir ve paywall'a gider — aksi hâlde görüntüleyici açılıp
 * indirme 402 ile düşer ve kullanıcı sebepsiz "hata" ekranı görürdü (KanunSatir ile aynı davranış).
 */
function BransKitapListe({
  kitaplar,
  onAc,
  gece,
  testSonuc,
  testYarim,
}: {
  kitaplar: BransKitap[];
  onAc: (k: BransKitap) => void;
  gece?: boolean;
  /** law_id → (test → son sonuç); konu kartındaki test satırları buradan etiketlenir. */
  testSonuc?: Map<number, Map<number, SinavSonuc>>;
  testYarim?: Set<string>;
}) {
  const { premium } = useUyelik();
  const kilitli = KILIT_AKTIF && !premium;
  return (
    <>
      <View style={st.ustSatir}>
        <AppText
          variant="kucuk"
          bold={gece}
          color={gece ? 'beyaz' : 'solukMetin'}
          style={[st.aciklama, gece && st.geceAciklama]}>
          Branşına özel konular. "Çalış" özet kitabı açar, "Talim Yap" o konunun testlerini.
        </AppText>
      </View>
      {kitaplar.map((k) => (
        <BransKitapKart
          key={k.id}
          kitap={k}
          gece={gece}
          kilitli={kilitli}
          onAc={onAc}
          testSonuclari={k.lawId != null ? testSonuc?.get(k.lawId) : undefined}
          testYarim={testYarim}
        />
      ))}
    </>
  );
}

/**
 * BRANŞ KONU KARTI — müşterek kanun kartıyla aynı düzen (başkan, 2 Eyl 2026: "aynı müşterek
 * konular gibi görünsün"): başlık + "Çalış" (PDF'i aç) + "Talim Yap · N" (o konunun testleri).
 * Testler 23 Ağu'da Tatbikat'tan kanun listesi kaldırılınca branşlılar için görünmez olmuştu.
 * Soru havuzu bağı sunucudan gelir (brans_kitaplari.law_id); bağ yoksa yalnız "Çalış" çıkar.
 */
function BransKitapKart({
  kitap,
  gece,
  kilitli,
  onAc,
  testSonuclari,
  testYarim,
}: {
  kitap: BransKitap;
  gece?: boolean;
  kilitli: boolean;
  onAc: (k: BransKitap) => void;
  testSonuclari?: Map<number, SinavSonuc>;
  testYarim?: Set<string>;
}) {
  const router = useRouter();
  const [testlerAcik, setTestlerAcik] = useState(false);
  const lawId = kitap.lawId;
  const testAdedi = lawId != null && sinavVarMi(lawId) ? testSayisi(lawId) : 0;
  const paywall = () => router.push('/paywall');
  return (
    <View style={[st.kitapKart, gece && st.kitapSatirGece]}>
      <Pressable
        onPress={() => (kilitli ? paywall() : onAc(kitap))}
        style={({ pressed }) => [st.kitapUst, pressed && st.kitapBasili]}
        accessibilityRole="button"
        accessibilityLabel={kilitli ? `${kitap.baslik} — kilitli` : kitap.baslik}>
        <MaterialCommunityIcons
          name={kilitli ? 'lock' : 'file-document-outline'}
          size={22}
          color={gece ? Palette.altinParlak : Palette.altinKoyu}
        />
        <AppText variant="govde" color={gece ? 'beyaz' : 'anaMetin'} bold style={st.kitapAd} numberOfLines={2}>
          {kitap.baslik}
        </AppText>
        {kilitli ? (
          <View style={[st.kilitChip, gece && st.kilitChipGece]}>
            <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'altinMetin'}>
              Kilidi Aç
            </AppText>
          </View>
        ) : null}
      </Pressable>

      <View style={st.ikiliButon}>
        <Pressable
          onPress={() => (kilitli ? paywall() : onAc(kitap))}
          style={({ pressed }) => [st.calisBtn, gece && st.calisBtnGece, pressed && st.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Çalış">
          <MaterialCommunityIcons name="book-open-variant" size={17} color={Palette.lacivert} />
          <AppText variant="kucuk" bold color="lacivert">
            Çalış
          </AppText>
        </Pressable>
        {testAdedi > 0 ? (
          <Pressable
            onPress={() => (kilitli ? paywall() : setTestlerAcik((a) => !a))}
            style={({ pressed }) => [st.talimBtn, gece && st.talimBtnGece, pressed && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Talim yap">
            <MaterialCommunityIcons
              name="target"
              size={16}
              color={gece ? Palette.altinParlak : Palette.altinKoyu}
            />
            <AppText variant="kucuk" bold color={gece ? 'altinParlak' : 'altinMetin'}>
              Talim Yap · {testAdedi}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {testlerAcik && lawId != null && !kilitli
        ? Array.from({ length: testAdedi }, (_, i) => i).map((indeks) => {
            const durum = testDurumEtiketi(lawId, indeks, testSonuclari, testYarim, !!gece);
            return (
              <Pressable
                key={indeks}
                onPress={() =>
                  router.push({ pathname: '/sinav', params: { lawId: String(lawId), test: String(indeks) } })
                }
                style={({ pressed }) => [st.denemeSatir, gece && st.denemeSatirGece, pressed && st.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Test ${indeks + 1}`}>
                <AppText variant="kucuk" bold color={gece ? 'beyaz' : 'anaMetin'}>
                  Test {indeks + 1}
                </AppText>
                <View style={st.denemeDurum}>
                  <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'solukMetin'}>
                    {testSoruSayisi(lawId, indeks)} soru
                  </AppText>
                  <AppText variant="etiket" bold color={durum.renk}>
                    {durum.metin}
                  </AppText>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={gece ? Palette.altinParlak : Palette.solukMetin}
                />
              </Pressable>
            );
          })
        : null}
    </View>
  );
}

const st = StyleSheet.create({
  // ── GECE (IMG_3129 mock) stilleri — yalniz bayrakli dal ──
  muhurSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  muhurCizgi: {
    width: 34,
    height: 1,
    backgroundColor: 'rgba(240,183,51,0.7)',
  },
  muhurYazi: {
    letterSpacing: 1,
    opacity: 0.95,
  },
  satirGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.5)',
  },
  geceIkincil: {
    opacity: 0.92,
  },
  barTrackGece: {
    backgroundColor: 'rgba(255,246,220,0.18)',
  },
  calisBtnGece: {
    backgroundColor: Palette.altinParlak,
  },
  talimBtnGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
  denemeSatirGece: {
    backgroundColor: 'rgba(3,40,56,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
  },
  kilitChipGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(243,194,74,0.55)',
  },
  geceAciklama: {
    opacity: 0.92,
  },
  kitapSatirGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.5)',
    borderRadius: Radius.l,
  },
  blokSeciciGece: {
    backgroundColor: 'transparent', // gece: krem şerit yok, haplar zeminde yüzer
    borderColor: 'transparent',
  },
  blokSegGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    borderRadius: 999,
  },
  blokSegAktifGece: {
    backgroundColor: 'rgba(3,47,69,0.9)',
    borderColor: '#F3C24A',
  },
  aramaKutuGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    borderRadius: 999,
  },
  aramaSahteGece: {
    color: 'rgba(226,236,240,0.75)',
  },
  filtreBtnGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
  },
  cipAktifGece: {
    backgroundColor: 'rgba(3,47,69,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
  cipPasifGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
  },

  talimKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  talimRoz: {
    width: 40,
    height: 40,
    borderRadius: Radius.s,
    backgroundColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  talimYazi: { flex: 1, gap: 2 },

  kitapSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  // Branş konu kartı: başlık satırı + Çalış/Talim düğmeleri + test satırları (dikey).
  kitapKart: {
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  kitapUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  kitapAd: { flex: 1 },
  kitapBasili: { opacity: 0.85 },
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
  aramaSahte: { flex: 1 },
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
  baslaKart: {
    borderColor: Palette.yesil,
  },
  // Bayraklı mod: "son çalışma" satırının sağını İndir/Devam kümesi paylaşır.
  ustAksiyonBosluk: { flex: 1 },
  sonMetinEsnek: { flexShrink: 1 },
  ucretsizChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Palette.yesil,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginBottom: 2,
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
  ikiliButon: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  calisBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.altin,
    borderRadius: Radius.s,
    paddingVertical: Spacing.one + 2,
  },
  talimBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
    borderRadius: Radius.s,
    paddingVertical: Spacing.one + 2,
  },
  // Soru sayısı + durum etiketi tek grup (satırın sağında, chevron'dan önce).
  denemeDurum: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  denemeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.s,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    marginTop: 4,
  },
  devamMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
  },
  devamMiniOrta: { flex: 1, gap: 1 },
  devamMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.altin,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
