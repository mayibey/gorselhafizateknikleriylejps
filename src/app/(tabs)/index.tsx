import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { DuyuruIkonu } from '@/components/duyuru/duyuru-ikonu';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { ICERIK_TABANI } from '@/constants/config';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  getAllCards,
  getCardCount,
  getGeriBesDurum,
  getPerformans,
  getStudyCards,
  getStudyDays,
  getZayifKuyruk,
} from '@/db/database';
import type { CardWithLaw, GeriBesDurum } from '@/db/schema';
import { degerlendirSicil } from '@/lib/sicil-servis';
import { GeriBeslemeEmri } from '@/components/sicil/geri-besleme-emri';
import { LAW_KLASOR } from '@/db/seed';
import {
  indirmeDestekli,
  indirmeDinle,
  indirmeDurumuAl,
  kanunIndirBaslat,
  kanunIndirilmisMi,
} from '@/lib/indirme';
import { calisilabilirZayif } from '@/lib/gorsel-kaynak';
import { lawErisilebilirSaf } from '@/lib/icerik-kilidi';
import { useUyelik } from '@/lib/uyelik-context';
// PERF (denetim #5): DUELLO_KANUNLAR'ı KÜÇÜK duello-kanunlar dosyasından al → er-meydani-mantik
// üzerinden gelince 1.5MB DUELLO_SORULARI boot'ta yükleniyordu; doğrudan import boot'u hafifletir.
import { DUELLO_KANUNLAR } from '../../assets/duello-kanunlar';
import { type ZayifKanun, type ZayifMadde, zayifKanunlar, zayifMaddeler } from '@/lib/er-meydani';
import { maddeEtiket } from '@/lib/madde-etiket';
import type { QueueCard } from '@/lib/queue';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';
import { UyelikTaci } from '@/components/premium/uyelik-rozeti';
import { IndirimHatirlatma } from '@/components/premium/indirim-hatirlatma';

// Metalik-ish altın gradyan (açık → ana → koyu altın). Play diski + geri besleme diski.
const ALTIN_GRADYAN = [Palette.altinAcik2, Palette.altin, Palette.altinKoyu] as const;

// Düello kanun id → kısa ad (zayıf-kanun / Geri Besleme kartı).
const KANUN_AD = new Map(DUELLO_KANUNLAR.map((k) => [k.id, k.ad] as const));

// ⏳ JSPS SINAV TARİHİ — Karargah en üstteki geri sayım buna göre işler.
// BAŞKAN: Gerçek sınav tarih/saati belli olunca SADECE bu satırı değiştir.
// new Date(yıl, AY-1, gün, saat, dakika) — AY 0-tabanlı (8 = Eylül). Şimdilik ~65 gün (placeholder).
const SINAV_TARIHI = new Date(2026, 8, 2, 10, 0, 0); // 2 Eylül 2026, 10:00

function ikiHane(n: number): string {
  return String(n).padStart(2, '0');
}

/** Karargah en üstü: JSPS sınavına canlı geri sayım (gün/saat/dk/sn). Her saniye işler. */
function SinavGeriSayim() {
  const [kalanMs, setKalanMs] = useState(() => SINAV_TARIHI.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setKalanMs(SINAV_TARIHI.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (kalanMs <= 0) {
    return (
      <View style={styles.geriSayim}>
        <AppText variant="etiket" bold color="altinAcik2" style={styles.geriSayimUst}>
          JSPS SINAVI
        </AppText>
        <AppText variant="altBaslik" bold color="beyaz">
          Sınav günü geldi 🎖️ Başarılar!
        </AppText>
      </View>
    );
  }

  const top = Math.floor(kalanMs / 1000);
  const gun = Math.floor(top / 86400);
  const saat = Math.floor((top % 86400) / 3600);
  const dk = Math.floor((top % 3600) / 60);
  const sn = top % 60;

  return (
    <View style={styles.geriSayim}>
      <AppText variant="etiket" bold color="altinAcik2" style={styles.geriSayimUst}>
        JSPS SINAVINA KALAN (TAHMİNİ)
      </AppText>
      <View style={styles.geriSayimSatir}>
        <GsBlok deger={String(gun)} etiket="GÜN" />
        <GsAyrac />
        <GsBlok deger={ikiHane(saat)} etiket="SAAT" />
        <GsAyrac />
        <GsBlok deger={ikiHane(dk)} etiket="DAKİKA" />
        <GsAyrac />
        <GsBlok deger={ikiHane(sn)} etiket="SANİYE" />
      </View>
    </View>
  );
}

function GsBlok({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={styles.gsBlok}>
      <AppText variant="dev" bold color="altinAcik2" style={styles.gsSayi}>
        {deger}
      </AppText>
      <AppText variant="etiket" color="kartMetinIkincil" style={styles.gsEtiket}>
        {etiket}
      </AppText>
    </View>
  );
}

function GsAyrac() {
  return (
    <AppText variant="dev" bold color="kartMetinIkincil" style={styles.gsAyrac}>
      :
    </AppText>
  );
}

export default function KarargahScreen() {
  const { premium } = useUyelik();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [gunMadde, setGunMadde] = useState<CardWithLaw | null>(null);
  const [tumKartlar, setTumKartlar] = useState<CardWithLaw[]>([]); // madde→kart eşleşmesi (Güç Kazandırma)
  const [sonKonu, setSonKonu] = useState<string | null>(null);
  const [bugunSayi, setBugunSayi] = useState(0);
  // Unutma uyarısı: ≥7 gündür çalışılmamış (ama daha önce çalışılmış) kanunlar.
  const [unutulan, setUnutulan] = useState<{ lawId: number; ad: string; gun: number }[]>([]);
  const [zayifKanun, setZayifKanun] = useState<ZayifKanun[]>([]);
  const [geriBesDurum, setGeriBesDurum] = useState<GeriBesDurum | null>(null);
  // TEK modal: mod 'liste' (tüm kanunlar) ↔ 'detay' (bir kanunun maddeleri). iOS iki modalı
  // üst üste açamadığı için birleşik — liste içinden kanuna dokununca aynı modal detaya geçer.
  const [modalAcik, setModalAcik] = useState(false);
  const [modalMod, setModalMod] = useState<'liste' | 'detay'>('liste');
  const [detayKanun, setDetayKanun] = useState<number | null>(null);
  const [detayMaddeler, setDetayMaddeler] = useState<ZayifMadde[]>([]);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);

  function acDetay(kanun: number) {
    setDetayKanun(kanun);
    setDetayMaddeler([]);
    setDetayYukleniyor(true);
    setModalMod('detay');
    setModalAcik(true);
    void zayifMaddeler(kanun)
      .then(setDetayMaddeler)
      .catch(() => setDetayMaddeler([]))
      .finally(() => setDetayYukleniyor(false));
  }
  function acListe() {
    setModalMod('liste');
    setModalAcik(true);
  }
  function kapatModal() {
    setModalAcik(false);
  }

  // Zorlanılan bir maddeye dokununca DOĞRUDAN o maddenin kartını aç (patika başı DEĞİL).
  // DUELLO kanun id = uygulama law_id. Numarayı eşleştir, özet/ayırt kartlarını atla.
  // Kart bulunamazsa patikaya düş (eski davranış → regresyon yok).
  function maddeKartinaGit(kanun: number, maddeNo: string) {
    kapatModal();
    const hedef = /(\d+)/.exec(maddeNo)?.[1] ?? maddeNo;
    const ozetAyirtMi = (yol: string | null) => !!yol && /_(ayirt|ozet)(_|$)/i.test(yol);
    const kartNo = (c: CardWithLaw) => /(\d+)/.exec(c.madde_no ?? '')?.[1] ?? '';
    const havuz = tumKartlar.filter((c) => c.law_id === kanun && kartNo(c) === hedef);
    const kart = havuz.find((c) => !ozetAyirtMi(c.gorsel_yolu)) ?? havuz[0];
    if (kart) router.push({ pathname: '/akis', params: { lawId: String(kanun), kart: String(kart.id) } });
    else router.push({ pathname: '/patika', params: { lawId: String(kanun) } });
  }
  const [hata, setHata] = useState(false);
  // Günün Maddesi indirilmemiş kanundansa: "indir ve aç" modalı (yüzdeli), biter bitmez karta git.
  // (Arama/Patika'daki İNDİRME KAPISI ile aynı; Günün Maddesi bu kapıyı atlayıp boş kart açıyordu.)
  const [indirModal, setIndirModal] = useState<CardWithLaw | null>(null);
  const [indirYuzde, setIndirYuzde] = useState(0);
  const [indirDurum, setIndirDurum] = useState<'iniyor' | 'hata'>('iniyor');
  // Bitince OTOMATİK karta gidilecek mi (kullanıcı "arka planda indir" derse iptal → gitme).
  const acilacakRef = useRef<CardWithLaw | null>(null);

  // İndirme modalı açıkken yüzdeyi durum yöneticisinden dinle (arka planda ilerledikçe güncellensin).
  useEffect(() => {
    if (!indirModal) return;
    const klasor = LAW_KLASOR[indirModal.law_id];
    if (!klasor) return;
    const guncelle = () => setIndirYuzde(indirmeDurumuAl(klasor)?.yuzde ?? 0);
    guncelle();
    return indirmeDinle(klasor, guncelle);
  }, [indirModal]);

  // Günün Maddesi kartını aç. DOĞRUDAN o maddenin kartını açar (tüm patikayı değil).
  const gunMaddeGit = useCallback(
    (g: CardWithLaw) =>
      router.push({ pathname: '/akis', params: { lawId: String(g.law_id), kart: String(g.id) } }),
    [router],
  );

  // İndir + biter bitmez Günün Maddesi kartına git (Arama'daki indirVeAc ile aynı desen).
  const indirVeAc = useCallback(
    (g: CardWithLaw, klasor: string) => {
      setIndirModal(g);
      setIndirDurum('iniyor');
      setIndirYuzde(indirmeDurumuAl(klasor)?.yuzde ?? 0);
      acilacakRef.current = g;
      kanunIndirBaslat(klasor).then(
        () => {
          // Kullanıcı "arka planda indir" demediyse (niyet hâlâ bu kart) → karta git.
          if (acilacakRef.current === g) {
            acilacakRef.current = null;
            setIndirModal(null);
            gunMaddeGit(g);
          }
        },
        () => {
          if (acilacakRef.current === g) setIndirDurum('hata');
        },
      );
    },
    [gunMaddeGit],
  );

  // Modalı kapat (otomatik-açmayı iptal et; indirme arka planda sürebilir).
  const indirModalKapat = useCallback(() => {
    acilacakRef.current = null;
    setIndirModal(null);
  }, []);

  // Günün Maddesi'ne basınca: içerik inmemişse ÖNCE indir (yüzdeli modal), sonra kartı aç.
  // (Aday seçimi zaten lawErisilebilirSaf ile erişilebilir kanunlardan → paywall gerekmez.)
  const gunMaddeAc = useCallback(
    (g: CardWithLaw) => {
      const klasor = LAW_KLASOR[g.law_id];
      if (klasor && indirmeDestekli && ICERIK_TABANI && !kanunIndirilmisMi(klasor)) {
        Alert.alert(
          'Kanun indirilmemiş',
          'Bu maddenin görsel kartını görmek için önce kanunun içeriğini indirmek gerekiyor. Şimdi indirilip açılsın mı?',
          [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'İndir ve aç', onPress: () => indirVeAc(g, klasor) },
          ],
        );
        return;
      }
      gunMaddeGit(g);
    },
    [gunMaddeGit, indirVeAc],
  );

  // Ekrana her dönüldüğünde tazele. Kuyruk = ana veri (hata → retry); gerisi degrade olur.
  const yukle = useCallback(() => {
    setHata(false);
    // Düello zayıf kanunları (Geri Besleme kartı + premium hunisi).
    void zayifKanunlar()
      .then(setZayifKanun)
      .catch(() => setZayifKanun([]));
    // Ödül-ceza emri: Evsaf'taki "GERİ BESLEME EĞİTİM EMRİ" Karargah'ta da görünsün.
    void degerlendirSicil()
      .then(() => getGeriBesDurum())
      .then(setGeriBesDurum)
      .catch(() => setGeriBesDurum(null));
    // Etüt = ZAYIF HAVUZ (tekrar-hatırlat + denemede yanlış). Due/Leitner DEĞİL → "zayıf
    // var ama Etüt boş" sorunu biter.
    // Akıştaki zayıf kuyruğuyla AYNI filtre (indirilmiş kanunlar) → sayaç tutarlı (63 vs 60 biter).
    void getZayifKuyruk()
      .then((q) => setQueue(calisilabilirZayif(q)))
      .catch(() => setHata(true));
    void Promise.all([getStudyCards(), getCardCount()])
      .then(([studied, toplam]) => {
        // "Çalışıldı %" = kutu≥1 / toplam (EŞİKSİZ). hazirlikYuzde (kutu≥4) DEĞİL —
        // o eşik sicil ödül + kutu grafiğinde kullanılıyor, dokunulmaz.
        const ist = hesaplaIstatistik(studied, toplam);
        const calisildiYuzde =
          ist.toplamKart > 0 ? Math.round((ist.calisilanKart / ist.toplamKart) * 100) : 0;
        setHazirlik(calisildiYuzde);
      })
      .catch(() => setHazirlik(null));
    void getStudyDays()
      .then((gunler) => setStreak(hesaplaStreak(gunler, bugunISO())))
      .catch(() => setStreak(null));
    // Günün Maddesi + bugün çalışılan + zayıf mevzi + SON KONU — tek performans+kart yüklemesinden.
    void Promise.all([getPerformans(), getAllCards()])
      .then(([perf, cards]) => {
        setTumKartlar(cards); // madde→kart doğrudan geçiş için sakla
        // Günün Maddesi adayları: YALNIZ normal tek-madde kartları. Özet/ayırt/genel-özet
        // birleşik kartları (anahtar deseni _ozet_/_ayirt_) ham anahtar sızdırıyordu
        // ("Özet — ...ayirt") → ele. Başlığı "Madde X" olan yer-tutucular da hariç.
        const ozetAyirtMi = (yol: string | null) => !!yol && /_(ayirt|ozet)(_|$)/i.test(yol);
        // PREMIUM SIZINTI KAPISI: "Günün Maddesi" yalnız ERİŞİLEBİLİR kanunlardan seçilir →
        // ücretsiz kullanıcı ana ekranda premium bir maddenin no+başlığını görmez. (Denetim.)
        const adaylar = cards.filter(
          (c) =>
            !ozetAyirtMi(c.gorsel_yolu) &&
            !/^Madde\s/i.test(c.baslik) &&
            lawErisilebilirSaf(c.law_id, premium),
        );
        if (adaylar.length > 0) {
          const gun = Number(bugunISO().split('-').join('')) || 0;
          setGunMadde(adaylar[gun % adaylar.length]);
        } else {
          setGunMadde(null);
        }
        const bugun = bugunISO();
        const bugunKartlar = new Set(
          perf.filter((p) => p.tarih === bugun && p.kaynak === 'calisma').map((p) => p.card_id),
        );
        setBugunSayi(bugunKartlar.size);
        // Unutma uyarısı: her kanunun SON çalışma tarihi (calisma logundan) → ≥7 gün
        // geçmişse "tekrar et" listesine. cardLaw haritası tek seferde kurulur.
        const cardLaw = new Map(cards.map((c) => [c.id, { id: c.law_id, ad: c.law_ad }]));
        const sonCalisma = new Map<number, { ad: string; tarih: string }>();
        for (const p of perf) {
          if (p.kaynak !== 'calisma') continue;
          const cl = cardLaw.get(p.card_id);
          if (!cl) continue;
          const mevcut = sonCalisma.get(cl.id);
          if (!mevcut || p.tarih > mevcut.tarih) sonCalisma.set(cl.id, { ad: cl.ad, tarih: p.tarih });
        }
        const bugunMs = Date.parse(`${bugun}T00:00:00Z`);
        const stale = [...sonCalisma.entries()]
          .map(([lawId, v]) => ({
            lawId,
            ad: v.ad,
            gun: Math.round((bugunMs - Date.parse(`${v.tarih}T00:00:00Z`)) / 86400000),
          }))
          .filter((u) => u.gun >= 7)
          .sort((a, b) => b.gun - a.gun);
        setUnutulan(stale);
        // Son konu: en son 'calisma' performans satırı → o kartın madde_no'su (gerçek veri).
        let son: string | null = null;
        for (let i = perf.length - 1; i >= 0; i--) {
          if (perf[i].kaynak === 'calisma') {
            const k = cards.find((c) => c.id === perf[i].card_id);
            if (k) {
              son = k.madde_no;
              break;
            }
          }
        }
        setSonKonu(son);
      })
      .catch(() => {
        setGunMadde(null);
        setUnutulan([]);
      });
  }, [premium]);

  useFocusEffect(yukle);

  // Etüt = zayıf havuz → queue tamamı zayıf mevzi (tekrar-hatırlat + denemede yanlış).
  const tekrarSayisi = queue?.length ?? 0;
  const bekleyen = queue?.length ?? 0;
  const bos = queue !== null && queue.length === 0;

  if (hata) {
    return (
      <Screen title="Karargah">
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="Günlük durum yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      </Screen>
    );
  }

  if (queue === null) {
    return (
      <Screen title="Karargah">
        <Loading metin="Yükleniyor…" />
      </Screen>
    );
  }

  return (
    <Screen
      title="Karargah"
      headerSag={
        <View style={styles.headerIkonlar}>
          {/* Ara — eski alt sekme yerine başlıkta büyüteç. */}
          <Pressable
            onPress={() => router.push('/ara')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ara">
            <MaterialCommunityIcons name="magnify" size={24} color={Palette.altin} />
          </Pressable>
          {/* Premium'sa altın taç (dokununca Üyelik ekranı) — premium değilse görünmez. */}
          <UyelikTaci boyut={18} />
          {/* Duyurular (eski çan yerine) — okunmamış varsa kırmızı nokta. */}
          <DuyuruIkonu boyut={22} />
          <Pressable
            onPress={() => router.push('/ayarlar')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Profil ve ayarlar">
            <MaterialCommunityIcons name="account-circle-outline" size={24} color={Palette.altin} />
          </Pressable>
        </View>
      }>
      {/* EN ÜST — JSPS sınavına canlı geri sayım (tarih SINAV_TARIHI sabitinde). */}
      {/* İlk gün indirimi hatırlatma modalı (koşullar tutunca kendi çıkar). */}
      <IndirimHatirlatma />

      <SinavGeriSayim />

      {/* 3 KUTU — Genel ilerleme · Nöbet serisi · Zayıf mevzi (sayacın hemen altında). */}
      <View style={styles.kutuSatir}>
        <View style={[styles.card, styles.kutu]}>
          <Halka yuzde={hazirlik} />
          <AppText variant="etiket" color="solukMetin">
            Genel ilerleme
          </AppText>
        </View>
        <View style={[styles.card, styles.kutu]}>
          <View style={styles.kutuDeger}>
            {streak && streak > 0 ? (
              <MaterialCommunityIcons name="fire" size={22} color={Palette.amber} />
            ) : null}
            <AppText variant="dev" bold color="anaMetin">
              {streak === null || streak === 0 ? '—' : `${streak}`}
            </AppText>
          </View>
          <AppText variant="etiket" color="solukMetin">
            Nöbet serisi
          </AppText>
        </View>
        {/* Zayıf mevzi kutusu — TIKLANIR: dokun → Etüt (zayıf akışı). Boşsa pasif. */}
        <Pressable
          disabled={bekleyen === 0}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
          style={({ pressed }) => [
            styles.card,
            styles.kutu,
            pressed && styles.pressed,
            bekleyen === 0 && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Zayıf mevzileri çalış">
          <View style={styles.kutuDeger}>
            <MaterialCommunityIcons name="target" size={20} color={Palette.altinKoyu} />
            <AppText variant="dev" bold color="anaMetin">
              {bekleyen}
            </AppText>
          </View>
          <AppText variant="etiket" color="solukMetin">
            Zayıf mevzi
          </AppText>
        </Pressable>
      </View>

      {/* UNUTMA UYARISI — ≥7 gündür tekrar edilmemiş kanunlar (tedbir bandı). */}
      {unutulan.length > 0 ? (
        <View style={styles.unutBanner}>
          <View style={styles.unutBaslik}>
            <MaterialCommunityIcons name="clock-alert-outline" size={18} color={Palette.amber} />
            <AppText variant="etiket" bold color="amber" style={styles.unutBaslikAd}>
              TEKRAR ZAMANI
            </AppText>
          </View>
          <AppText variant="kucuk" color="anaMetin">
            Şu kanunlara en az 7 gündür tekrar yapmadın — unutmamak için tekrar etmeni öneriyoruz:
          </AppText>
          {unutulan.slice(0, 5).map((u) => (
            <Pressable
              key={u.lawId}
              style={({ pressed }) => [styles.unutSatir, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/patika', params: { lawId: String(u.lawId) } })}>
              <MaterialCommunityIcons name="history" size={16} color={Palette.altinKoyu} />
              <AppText variant="kucuk" bold color="lacivert" style={styles.unutAd} numberOfLines={1}>
                {u.ad}
              </AppText>
              <AppText variant="etiket" color="solukMetin">
                {u.gun} gün
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
            </Pressable>
          ))}
          {unutulan.length > 5 ? (
            <AppText variant="etiket" color="solukMetin">
              +{unutulan.length - 5} kanun daha
            </AppText>
          ) : null}
        </View>
      ) : null}

      {/* ═══ GERİ BESLEME — zayıf mevziler + düello eksikleri (tek başlık altında) ═══ */}
      <View style={styles.gbUstBaslik}>
        <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={Palette.altinKoyu} />
        <AppText variant="etiket" color="solukMetin" bold style={styles.gbUstBaslikAd}>
          GERİ BESLEME
        </AppText>
      </View>

      {/* ÖDÜL-CEZA EMRİ — Evsaf'takiyle aynı kart; süre/ceza uyarısı burada da görünür. */}
      <GeriBeslemeEmri
        durum={geriBesDurum}
        zayifSayisi={bekleyen}
        onBasla={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
      />

      {/* HERO — ETÜT = zayıf havuz (eksik/zorlandığın kartları düzelt). Boşsa "zayıf yok". */}
      {bos ? (
        <Pressable
          style={({ pressed }) => [styles.hero, styles.heroBitti, pressed && styles.pressed]}
          onPress={() => router.push('/mevzuat')}
          accessibilityRole="button"
          accessibilityLabel="Mevzuat'tan konu çalış">
          <View style={styles.heroMetin}>
            <AppText variant="etiket" color="altin" bold>
              GÜNÜ TAMAMLADIN 🎖️
            </AppText>
            <AppText variant="baslik" color="beyaz" bold>
              Tüm görevleri yaptın
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              Tekrar edilecek mevzi kalmadı — Mevzuat'tan yeni konu çalış ›
            </AppText>
          </View>
          <MaterialCommunityIcons name="book-open-variant" size={52} color={Palette.altin} />
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
          accessibilityRole="button"
          accessibilityLabel="Geri Besleme — zayıf mevzileri çalış">
          <View style={styles.heroUst}>
            <View style={styles.heroMetin}>
              <AppText variant="etiket" color="altin" bold>
                ZAYIF MEVZİLER
              </AppText>
              <AppText variant="baslik" color="beyaz" bold>
                Kart Çalışması
              </AppText>
              {/* Etüt = hata + zorlandıklarını düzeltme bölümü (tekrar-hatırlat + denemede yanlış). */}
              <AppText variant="etiket" color="altinAcik2">
                Eksik ve zorlandığın kartları tekrar et
              </AppText>
              <AppText variant="kucuk" color="kenarlik">
                {bekleyen > 0
                  ? `${bekleyen} zayıf mevzi seni bekliyor`
                  : 'Şu an düzeltilecek mevzi yok'}
              </AppText>
            </View>
            {/* Metalik altın play diski — gradyan + gölge, lacivert play */}
            <LinearGradient
              colors={ALTIN_GRADYAN}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroPlay}>
              <MaterialCommunityIcons name="play" size={36} color={Palette.lacivert} />
            </LinearGradient>
          </View>

          {/* Bilgi SÜTUNLARI — gerçek/türetilmiş veri. (Günlük hedef sütunu kaldırıldı; hedef
              artık Karargah'ta sabit gösterilmiyor — kullanıcı Ayarlar → Eğitim Planı'ndan ayarlar.) */}
          <View style={styles.heroBilgi}>
            <HeroBilgi ikon="clock-outline" etiket="Tahmini süre" deger={`${bekleyen} dk`} />
            {sonKonu ? <HeroBilgi ikon="book-outline" etiket="Son konu" deger={sonKonu} /> : null}
          </View>
        </Pressable>
      )}

      {/* Er Meydanı'nda zorlandığın konular (ücretsiz görür; gidermek için premium) — Geri Besleme altında. */}
      {zayifKanun.length > 0 ? (
        <View style={styles.gbKart}>
          <View style={styles.gbBasrow}>
            <MaterialCommunityIcons name="target-account" size={18} color={Palette.kirmizi} />
            <View style={styles.gbBasKol}>
              <AppText variant="etiket" bold color="solukMetin" style={styles.gbBaslikMini}>
                ER MEYDANINDA ZORLANDIĞIN KONULAR
              </AppText>
              <AppText variant="govde" color="altinMetin" bold>Güç Kazandırma Eğitim Planı</AppText>
            </View>
          </View>
          <AppText variant="kucuk" color="anaMetin">En çok bu konularda yanlış yaptın (dokun → detay):</AppText>
          {zayifKanun.slice(0, 4).map((z) => (
            <Pressable
              key={z.kanun}
              style={({ pressed }) => [styles.gbSatir, pressed && styles.pressed]}
              onPress={() => acDetay(z.kanun)}>
              <MaterialCommunityIcons name="book-alert-outline" size={16} color={Palette.altinKoyu} />
              <AppText variant="kucuk" bold color="lacivert" style={styles.gbAd} numberOfLines={1}>
                {KANUN_AD.get(z.kanun) ?? `Kanun ${z.kanun}`}
              </AppText>
              <AppText variant="etiket" color="kirmizi" bold>{z.yanlis} yanlış</AppText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
            </Pressable>
          ))}
          {zayifKanun.length > 4 ? (
            <Pressable onPress={acListe} style={styles.gbDahaBtn}>
              <AppText variant="etiket" color="lacivert" bold>
                +{zayifKanun.length - 4} kanun/yönetmelik daha — tümünü gör
              </AppText>
              <MaterialCommunityIcons name="arrow-expand" size={15} color={Palette.lacivert} />
            </Pressable>
          ) : null}
          {!premium ? (
            <>
              <AppText variant="kucuk" color="anaMetin">Bu konuları çalışıp zayıf mevzini güçlendir.</AppText>
              <Pressable
                style={({ pressed }) => [styles.gbPremiumBtn, pressed && styles.pressed]}
                onPress={() => router.push('/paywall')}>
                <MaterialCommunityIcons name="crown" size={18} color={Palette.beyaz} />
                <AppText variant="kucuk" color="beyaz" bold style={styles.gbPremiumYazi}>Premium Al</AppText>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {/* GÜÇ KAZANDIRMA — TEK modal (liste↔detay). Dışarı tıklayınca kapanır. */}
      <Modal visible={modalAcik} transparent animationType="slide" onRequestClose={kapatModal}>
        <Pressable style={styles.gbModalArka} onPress={kapatModal}>
          <Pressable style={styles.gbModalKart} onPress={() => {}}>
            {modalMod === 'liste' ? (
              <>
                <View style={styles.gbModalBaslik}>
                  <AppText variant="altBaslik" bold color="anaMetin" style={styles.gbModalAd}>Zorlandığın Tüm Konular</AppText>
                  <Pressable onPress={kapatModal} hitSlop={10}>
                    <MaterialCommunityIcons name="close" size={24} color={Palette.solukMetin} />
                  </Pressable>
                </View>
                <ScrollView style={styles.gbModalListe} showsVerticalScrollIndicator={false}>
                  {zayifKanun.map((z) => (
                    <Pressable
                      key={z.kanun}
                      style={({ pressed }) => [styles.gbSatir, pressed && styles.pressed]}
                      onPress={() => acDetay(z.kanun)}>
                      <MaterialCommunityIcons name="book-alert-outline" size={16} color={Palette.altinKoyu} />
                      <AppText variant="kucuk" bold color="lacivert" style={styles.gbAd} numberOfLines={1}>
                        {KANUN_AD.get(z.kanun) ?? `Kanun ${z.kanun}`}
                      </AppText>
                      <AppText variant="etiket" color="kirmizi" bold>{z.yanlis} yanlış</AppText>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.gbModalBaslik}>
                  <Pressable onPress={() => setModalMod('liste')} hitSlop={10}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={Palette.lacivert} />
                  </Pressable>
                  <AppText variant="altBaslik" bold color="anaMetin" numberOfLines={1} style={styles.gbModalAd}>
                    {detayKanun != null ? (KANUN_AD.get(detayKanun) ?? `Kanun ${detayKanun}`) : ''}
                  </AppText>
                  <Pressable onPress={kapatModal} hitSlop={10}>
                    <MaterialCommunityIcons name="close" size={24} color={Palette.solukMetin} />
                  </Pressable>
                </View>
                <AppText variant="kucuk" color="solukMetin">Bu konuda zorlandığın maddeler:</AppText>
                {detayYukleniyor ? (
                  <ActivityIndicator color={Palette.lacivert} style={styles.gbModalYukle} />
                ) : detayMaddeler.length === 0 ? (
                  <AppText variant="kucuk" color="solukMetin" style={styles.gbModalYukle}>
                    Madde detayı henüz yok (yeni maçlarda birikecek).
                  </AppText>
                ) : (
                  <ScrollView style={styles.gbModalListe} showsVerticalScrollIndicator={false}>
                    {detayMaddeler.map((m) => (
                      <Pressable
                        key={m.madde}
                        disabled={!premium}
                        style={({ pressed }) => [styles.gbSatir, premium && pressed && styles.pressed]}
                        onPress={() => {
                          if (!premium || detayKanun == null) return;
                          maddeKartinaGit(detayKanun, m.madde);
                        }}>
                        <MaterialCommunityIcons name="file-document-outline" size={16} color={Palette.altinKoyu} />
                        <AppText variant="kucuk" bold color="lacivert" style={styles.gbAd}>madde {m.madde}</AppText>
                        <AppText variant="etiket" color="kirmizi" bold>{m.yanlis} yanlış</AppText>
                        {premium ? (
                          <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
                        ) : (
                          <MaterialCommunityIcons name="lock-outline" size={15} color={Palette.solukMetin} />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                {premium ? (
                  <AppText variant="etiket" color="solukMetin">Bir maddeye dokun → o konuyu çalış.</AppText>
                ) : (
                  <>
                    <AppText variant="etiket" color="solukMetin">Maddeleri çalışmak için premium gerekir.</AppText>
                    <Pressable
                      style={({ pressed }) => [styles.gbPremiumBtn, pressed && styles.pressed]}
                      onPress={() => {
                        kapatModal();
                        router.push('/paywall');
                      }}>
                      <MaterialCommunityIcons name="crown" size={18} color={Palette.beyaz} />
                      <AppText variant="kucuk" color="beyaz" bold style={styles.gbPremiumYazi}>Premium Al</AppText>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* GÜNÜN MADDESİ — tarih rotasyonlu kart + İncele */}
      {gunMadde ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() => gunMaddeAc(gunMadde)}>
          <AppText variant="etiket" color="solukMetin" bold>
            GÜNÜN MADDESİ
          </AppText>
          <AppText variant="govde" bold color="anaMetin">
            {maddeEtiket(gunMadde.madde_no, gunMadde.baslik)}
          </AppText>
          <View style={styles.gunMaddeAlt}>
            <AppText variant="kucuk" color="solukMetin" style={styles.gunMaddeAd} numberOfLines={1}>
              {gunMadde.law_ad}
            </AppText>
            <View style={styles.incele}>
              <AppText variant="etiket" bold color="altinMetin">
                İncele
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.altinKoyu} />
            </View>
          </View>
        </Pressable>
      ) : null}

      {/* İndir ve aç modalı — Günün Maddesi'nin kanunu inmemişse; biter bitmez kart açılır. */}
      <Modal
        visible={indirModal !== null}
        transparent
        animationType="fade"
        onRequestClose={indirModalKapat}>
        <View style={styles.modalKatman}>
          <View style={styles.modalKart}>
            {indirDurum === 'hata' ? (
              <>
                <MaterialCommunityIcons name="wifi-off" size={40} color={Palette.kirmizi} />
                <AppText variant="govde" bold color="lacivert" style={styles.modalOrtali}>
                  İndirilemedi
                </AppText>
                <AppText variant="kucuk" color="solukMetin" style={styles.modalOrtali}>
                  Bağlantını kontrol et, tekrar dene.
                </AppText>
                <View style={styles.modalBtnlar}>
                  <Pressable
                    style={({ pressed }) => [styles.modalBtnIkincil, pressed && styles.pressed]}
                    onPress={indirModalKapat}>
                    <AppText variant="kucuk" bold color="lacivert">
                      Kapat
                    </AppText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalBtn, pressed && styles.pressed]}
                    onPress={() =>
                      indirModal && indirVeAc(indirModal, LAW_KLASOR[indirModal.law_id] ?? '')
                    }>
                    <AppText variant="kucuk" bold color="beyaz">
                      Tekrar dene
                    </AppText>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={Palette.lacivert} />
                <AppText variant="govde" bold color="lacivert" style={styles.modalOrtali}>
                  İndiriliyor… %{indirYuzde}
                </AppText>
                <AppText variant="kucuk" color="solukMetin" numberOfLines={2} style={styles.modalOrtali}>
                  {indirModal?.law_ad} indiriliyor. Bitince madde otomatik açılacak.
                </AppText>
                <View style={styles.modalBar}>
                  <View style={[styles.modalBarDolu, { width: `${indirYuzde}%` }]} />
                </View>
                <Pressable
                  style={({ pressed }) => [styles.modalBtnIkincil, pressed && styles.pressed]}
                  onPress={indirModalKapat}>
                  <AppText variant="kucuk" bold color="lacivert">
                    Arka planda indir
                  </AppText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/** Hero içi bilgi SÜTUNU: üstte ikon+etiket (soluk), altta değer (beyaz). 3'ü yan yana. */
function HeroBilgi({
  ikon,
  etiket,
  deger,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  etiket: string;
  deger: string;
}) {
  return (
    <View style={styles.heroKutu}>
      <View style={styles.heroKutuUst}>
        <MaterialCommunityIcons name={ikon} size={15} color={Palette.altinAcik2} />
        <AppText variant="kucuk" color="beyaz" bold numberOfLines={2} style={styles.heroKutuDeger}>
          {deger}
        </AppText>
      </View>
      <AppText variant="etiket" color="kenarlik" numberOfLines={1}>
        {etiket}
      </AppText>
    </View>
  );
}

/** Dairesel ilerleme halkası — track + koyu altın yay + ortada %Z. */
function Halka({ yuzde }: { yuzde: number | null }) {
  const boyut = 58;
  const kalinlik = 8;
  const r = (boyut - kalinlik) / 2;
  const c = boyut / 2;
  const cevre = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, yuzde ?? 0));
  return (
    <View style={[styles.halka, { width: boyut, height: boyut }]}>
      <Svg width={boyut} height={boyut} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={Palette.ilerlemeTrack} strokeWidth={kalinlik} fill="none" />
        {v > 0 ? (
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={Palette.altinKoyu}
            strokeWidth={kalinlik}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={cevre}
            strokeDashoffset={cevre * (1 - v / 100)}
            transform={`rotate(-90 ${c} ${c})`}
          />
        ) : null}
      </Svg>
      <AppText variant="kucuk" bold color="anaMetin">
        {yuzde === null ? '—' : `%${v}`}
      </AppText>
    </View>
  );
}

function Gorev({ sayi, etiket }: { sayi: number; etiket: string }) {
  return (
    <View style={styles.gorev}>
      <AppText variant="altBaslik" bold color="anaMetin">
        {sayi}
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  headerIkonlar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  selam: {
    gap: Spacing.two,
  },

  // Sınav geri sayımı (en üst, koyu lacivert şerit + altın rakamlar — komuta-konsolu aksanı)
  geriSayim: {
    backgroundColor: Palette.kartYuzeyKoyu,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
  },
  geriSayimUst: {
    letterSpacing: 1.5,
  },
  geriSayimSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  gsBlok: {
    alignItems: 'center',
    minWidth: 58,
  },
  gsSayi: {
    fontVariant: ['tabular-nums'],
  },
  gsEtiket: {
    letterSpacing: 0.5,
    marginTop: -2,
  },
  gsAyrac: {
    opacity: 0.5,
    marginHorizontal: 2,
  },

  // Hero
  hero: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroBitti: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.95,
  },
  heroUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMetin: {
    gap: Spacing.half,
    flex: 1,
  },
  heroPlay: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroBilgi: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroKutu: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: Palette.kartPanelKoyu,
    borderColor: Palette.kartKenarKoyu,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
  },
  heroKutuUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  heroKutuDeger: {
    flex: 1,
  },

  // Krem kartlar
  // Unutma uyarı bandı (amber çerçeveli)
  unutBanner: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.amber,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  unutBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  unutBaslikAd: {
    letterSpacing: 1,
  },
  unutSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  unutAd: {
    flex: 1,
  },

  // Geri Besleme — bölüm başlığı + düello zayıf kanunlar kartı
  gbUstBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  gbUstBaslikAd: {
    letterSpacing: 1,
  },
  gbKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kirmizi,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  gbBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  gbBaslikAd: {
    letterSpacing: 0.5,
    flex: 1,
  },
  gbBasrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gbBasKol: {
    flex: 1,
    gap: 2,
  },
  gbBaslikMini: {
    letterSpacing: 0.5,
  },
  gbDahaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.one,
  },
  gbModalArka: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.45)',
    justifyContent: 'flex-end',
  },
  gbModalKart: {
    maxHeight: '80%',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    padding: Spacing.four,
    borderTopWidth: 1,
    borderColor: Palette.kenarlik,
  },
  gbModalBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  gbModalAd: { flex: 1 },
  gbModalListe: { flexGrow: 0 },
  gbModalYukle: { paddingVertical: Spacing.four, textAlign: 'center' },
  gbSatir: {
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
  gbAd: {
    flex: 1,
  },
  gbPremiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.altinKoyu,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  gbPremiumYazi: {
    flexShrink: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  gorevBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gorevSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gorev: {
    alignItems: 'center',
    flex: 1,
  },

  // 3 kutu
  kutuSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kutu: {
    flex: 1,
    alignItems: 'center',
  },
  kutuDeger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  halka: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bar

  // Günün maddesi
  gunMaddeAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gunMaddeAd: {
    flex: 1,
  },
  incele: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },

  // İndir ve aç modalı (Arama ekranındaki desenle aynı görünüm).
  modalKatman: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  modalOrtali: {
    textAlign: 'center',
  },
  modalBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.ilerlemeTrack,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  modalBarDolu: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.altinKoyu,
  },
  modalBtnlar: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalBtn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  modalBtnIkincil: {
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
});
