import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { DuyuruIkonu } from '@/components/duyuru/duyuru-ikonu';
import { useIndirKapisi } from '@/components/mevzuat/indir-kapisi';
import { TelegramKatil } from '@/components/ui/telegram-katil';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
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
import { calisilabilirZayif } from '@/lib/gorsel-kaynak';
import { lawErisilebilirSaf } from '@/lib/icerik-kilidi';
import { useUyelik } from '@/lib/uyelik-context';
// PERF (denetim #5): DUELLO_KANUNLAR'ı KÜÇÜK duello-kanunlar dosyasından al → er-meydani-mantik
// üzerinden gelince 1.5MB DUELLO_SORULARI boot'ta yükleniyordu; doğrudan import boot'u hafifletir.
import { DUELLO_KANUNLAR } from '../../assets/duello-kanunlar';
import { type ZayifKanun, type ZayifMadde, zayifKanunlar, zayifMaddeler } from '@/lib/er-meydani';
import { maddeEtiket } from '@/lib/madde-etiket';
import { hafifDokun, ortaDokun } from '@/lib/dokunus';
import { useKisiselOzellik } from '@/lib/ozellik';
// KaldiginYerKarti/TatbikatYarim: 11 Ağu "%100 aynısı" yerleşiminde ekrandan kalktı
// (bileşenler duruyor — geri istenirse import edip yerine koy).
import { EmirHalka, IsiltiSerit, Nabiz, Sallan } from '@/components/karargah/safak';
import { Image as ExpoImage } from 'expo-image';

// Tatbikat/Oyun panel arka planları (sinematik gece; hedef+bayrak / satranç atı).
const TATBIKAT_ARKA = require('../../../assets/images/tatbikat-arka.webp');
const OYUN_ARKA = require('../../../assets/images/oyun-arka.webp');
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
// BAŞKAN: Tarih/saat değişirse SADECE bu satırları değiştir.
// new Date(yıl, AY-1, gün, saat, dakika) — AY 0-tabanlı (8 = Eylül, 7 = Ağustos).
const SINAV_TARIHI = new Date(2026, 8, 19, 14, 0, 0); // 19 Eylül 2026, 14:00 (RESMÎ)
// 📋 BAŞVURU PENCERESİ — geri sayımın altındaki ince şerit buna göre işler:
// açılmadan önce "şu tarihte açılıyor", açıkken son güne canlı sayaç, kapanınca gizlenir.
const BASVURU_BASLANGIC = new Date(2026, 7, 3, 0, 0, 0); // 3 Ağustos 2026
const BASVURU_BITIS = new Date(2026, 7, 23, 23, 59, 59); // 23 Ağustos 2026 (son gün, gece yarısına kadar)

function ikiHane(n: number): string {
  return String(n).padStart(2, '0');
}

/** Karargah en üstü: JSPS sınavına canlı geri sayım (gün/saat/dk/sn). Her saniye işler.
 *  kompakt (GECE KARARI K2, bayraklı): saniyeli koca sayaç yerine tek satır —
 *  uygulamanın ilk sözü "vaktin tükeniyor" olmasın. */
function SinavGeriSayim({ kompakt, buyuk }: { kompakt?: boolean; buyuk?: boolean }) {
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

  // Başvuru şeridi — sade: pencere kapanana kadar tarihleri gösterir, son gün kırmızıyla uyarır,
  // 23 Ağustos'tan sonra kendiliğinden gizlenir. (kalanMs her saniye değiştiği için birlikte tazelenir.)
  const simdi = SINAV_TARIHI.getTime() - kalanMs;
  let basvuru: { metin: string; vurgu: boolean } | null = null;
  if (simdi <= BASVURU_BITIS.getTime()) {
    const sonGun = simdi >= BASVURU_BASLANGIC.getTime() &&
      Math.ceil((BASVURU_BITIS.getTime() - simdi) / 86400000) <= 1;
    basvuru = sonGun
      ? { metin: 'BAŞVURU İÇİN SON GÜN!', vurgu: true }
      : { metin: 'BAŞVURULAR: 3–23 AĞUSTOS', vurgu: false };
  }

  // 10 Ağu gece yerleşimi: başlığın altında İRİ, kutusuz sayaç + altın başvuru bandı.
  if (buyuk) {
    return (
      <View style={styles.geriSayimBuyuk}>
        <AppText variant="dev" bold color="lacivert" style={styles.geriSayimBuyukYazi}>
          19 Eylül'e {gun} gün
        </AppText>
        {basvuru ? (
          <View style={[styles.basvuruBant, basvuru.vurgu && styles.basvuruBantVurgu]}>
            <AppText variant="etiket" bold color={basvuru.vurgu ? 'beyaz' : 'lacivert'}>
              {basvuru.vurgu ? basvuru.metin : 'Sınav Başvuru Dönemi Açıldı · 3–23 Ağustos'}
            </AppText>
          </View>
        ) : null}
      </View>
    );
  }
  if (kompakt) {
    return (
      <View style={styles.geriSayimKompakt}>
        <View style={styles.geriSayimKompaktSatir}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={Palette.altin} />
          <AppText variant="kucuk" bold color="beyaz" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            JSPS sınavına {gun} gün · 19 Eylül 14.00
          </AppText>
        </View>
        {basvuru ? (
          <AppText variant="etiket" bold color={basvuru.vurgu ? 'kirmizi' : 'altinAcik2'} numberOfLines={1}>
            {basvuru.metin}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.geriSayim}>
      <AppText variant="etiket" bold color="altinAcik2" style={styles.geriSayimUst}>
        JSPS SINAVINA KALAN · 19 EYLÜL 14.00
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
      {basvuru && (
        <View style={[styles.basvuruSerit, basvuru.vurgu && styles.basvuruSeritVurgu]}>
          <AppText variant="etiket" bold color={basvuru.vurgu ? 'beyaz' : 'altinAcik2'} style={styles.basvuruMetin}>
            {basvuru.metin}
          </AppText>
        </View>
      )}
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
  // Bayraklı modda arama TEK yerde (Mevzuat'taki kutu → /ara) → buradaki büyüteç gizlenir.
  const aramaMevzuatta = useKisiselOzellik('talim-mevzuata');
  // Tekrar Zamanı yarım kartı: dokununca paslanan kanun listesi açılır (10 Ağu gece yerleşimi).
  const [tekrarAcik, setTekrarAcik] = useState(false);
  // ŞAFAK SAHNESİ verileri (bayraklı): kalan gün + başvuru penceresi + haftalık gün halkaları.
  const kalanGun = Math.max(0, Math.ceil((SINAV_TARIHI.getTime() - Date.now()) / 86400000));
  // CANLI geri sayım (başkan, 11 Ağu): tek satır "39 GÜN 13:07:42" — saniyede bir işler.
  const [kalanSn, setKalanSn] = useState(() =>
    Math.max(0, Math.floor((SINAV_TARIHI.getTime() - Date.now()) / 1000)),
  );
  useEffect(() => {
    if (!aramaMevzuatta) return;
    const t = setInterval(
      () => setKalanSn(Math.max(0, Math.floor((SINAV_TARIHI.getTime() - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(t);
  }, [aramaMevzuatta]);
  const p2 = (n: number) => String(n).padStart(2, '0');
  const geriSayim = `${Math.floor(kalanSn / 86400)} GÜN ${p2(Math.floor((kalanSn % 86400) / 3600))}:${p2(Math.floor((kalanSn % 3600) / 60))}:${p2(kalanSn % 60)}`;
  const basvuruAcik = Date.now() >= BASVURU_BASLANGIC.getTime() && Date.now() <= BASVURU_BITIS.getTime();
  const [hafta, setHafta] = useState<{ harf: string; tamam: boolean }[]>([]);
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  const [hicCalisilan, setHicCalisilan] = useState(false); // hiç kart çalışmamış (yeni üye)
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
  // ORTAK İNDİRME KAPISI (23 Ağu): bu ekranın kendi kopyası kaldırıldı, tek yere alındı.
  const { kapidanGec, IndirModal } = useIndirKapisi();
  // Bitince OTOMATİK karta gidilecek mi (kullanıcı "arka planda indir" derse iptal → gitme).

  // İndirme modalı açıkken yüzdeyi durum yöneticisinden dinle (arka planda ilerledikçe güncellensin).

  // Günün Maddesi kartını aç. DOĞRUDAN o maddenin kartını açar (tüm patikayı değil).
  const gunMaddeGit = useCallback(
    (g: CardWithLaw) =>
      router.push({ pathname: '/akis', params: { lawId: String(g.law_id), kart: String(g.id) } }),
    [router],
  );

  // İndir + biter bitmez Günün Maddesi kartına git (Arama'daki indirVeAc ile aynı desen).

  // Modalı kapat (otomatik-açmayı iptal et; indirme arka planda sürebilir).


  // Günün Maddesi'ne basınca: içerik inmemişse ÖNCE indir (yüzdeli modal), sonra kartı aç.
  // (Aday seçimi zaten lawErisilebilirSaf ile erişilebilir kanunlardan → paywall gerekmez.)
  const gunMaddeAc = useCallback(
    (g: CardWithLaw) => {
      kapidanGec(g.law_id, g.law_ad ?? 'Bu kanun', () => gunMaddeGit(g));
    },
    [gunMaddeGit, kapidanGec],
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
        // HİÇ başlamamış kullanıcı: zayıf havuz da boş olur ve ekran "Tüm görevleri yaptın"
        // diyordu — henüz tek kart bile çalışmamışken. Yüzdeye bakmak yetmez (1511 kartta
        // 7 kart = %0'a yuvarlanıyor); ham sayıya bakılıyor.
        setHicCalisilan(ist.calisilanKart === 0);
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
        // Haftalık gün halkaları (Şafak sahnesi): son 7 günün her birinde çalışma var mı?
        const GUN_HARF = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
        const bugunMs0 = Date.parse(`${bugun}T00:00:00Z`);
        const gunSet = new Set(perf.filter((p) => p.kaynak === 'calisma').map((p) => p.tarih));
        setHafta(
          Array.from({ length: 7 }, (_, i) => {
            const t = new Date(bugunMs0 - (6 - i) * 86400000);
            return {
              harf: GUN_HARF[t.getUTCDay()],
              tamam: gunSet.has(t.toISOString().slice(0, 10)),
            };
          }),
        );
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
      title={aramaMevzuatta ? 'Karargâh' : 'Karargah'}
      koyu={aramaMevzuatta}
      marka={aramaMevzuatta}
      kompaktBaslik={aramaMevzuatta}
      headerSag={
        <View style={styles.headerIkonlar}>
          {/* Ara — eski alt sekme yerine başlıkta büyüteç (bayraklıda Mevzuat'a taşındı). */}
          {!aramaMevzuatta ? (
            <Pressable
              onPress={() => router.push('/ara')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Ara">
              <MaterialCommunityIcons name="magnify" size={24} color={Palette.altin} />
            </Pressable>
          ) : null}
          {/* GECE KARARI K5 (bayraklı): açıklanmasız taç kalktı. Başkan (10 Ağu): sağ üst
              köşede ayarlar DEĞİL Duyurular dursun (okunmamışta kırmızı nokta) — ayarlara
              Evsaf'taki dişliden gidiliyor. */}
          {!aramaMevzuatta ? (
            <>
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
            </>
          ) : (
            /* Başkan (10 Ağu gece): köşede ikon değil YAZI — "Duyurular" + okunmamış noktası.
               23 Ağu: hemen ALTINA Telegram "KATIL" hapı (başkan isteği) — grup ikinci
               iletişim kanalımız; eskiden Ayarlar'da üç tık derindeydi, kimse bulmuyordu. */
            <View style={styles.sagUstSutun}>
              <DuyuruIkonu etiketli />
              <TelegramKatil />
            </View>
          )}
        </View>
      }>
      {/* EN ÜST — JSPS sınavına canlı geri sayım (tarih SINAV_TARIHI sabitinde). */}
      {/* İlk gün indirimi hatırlatma modalı (koşullar tutunca kendi çıkar). */}
      <IndirimHatirlatma />

      {/* ŞAFAK NÖBETİ SAHNESİ (10 Ağu gece — başkanın tarzı): yıldızlı lacivert gök içinde
          sayaç + başvuru + gün halkaları + BUGÜNÜN EMRİ + ışıltılı TAARRUZA BAŞLA;
          altta dalgayla krem gövdeye iniş. Bayraksızda eski tam sayaç. */}
      {aramaMevzuatta ? (
        /* Doğal yerleşim (başkan, 10 Ağu gece): panel/kutu YOK — içerik doğrudan gece
           göğünde; bölümleri ince altın ayraçlar ve nefes boşlukları ayırır. */
        <View style={styles.gokAkis}>
            {/* ═══ ÜST BLOK — sol: sınav takvimi · sağ: dev geri sayım (11 Ağu "%100 aynısı"
                ekran görüntüsü). Arkada SVG ufuk silüeti — fotoğraf yok, OTA-güvenli. */}
            {/* SVG dağ silüeti kaldırıldı (11 Ağu): arka planda artık GERÇEK dağ görseli var
                (screen.tsx koyu modu) — çizim taklidi onunla çakışıyordu. */}
            {/* Başkan (11 Ağu): SINAV TAKVİMİ bloğu + tarih SİLİNDİ (süreli içerik derdi yok).
                Yerine: ortada TEK SATIR canlı geri sayım (dev serif font, saniye işler) +
                mühür + "JSPS sınavına kalan süre". Başvuru tarihi küçük satır — 23 Ağustos
                geçince kendiliğinden kaybolur. */}
            <View style={styles.sayacMerkez}>
              {/* Başkan (23 Ağu): açıklama ve başvuru bandı sayacın ALTINDA üç satır yer
                  kaplıyor, oyunlara/tatbikata giden kartlar ekranın altında kalıyordu.
                  İkisi de sayacın HEMEN ÜSTÜNDE tek satıra alındı — solda ne olduğu,
                  sağda başvuru penceresi. Mühür ayracı da kaldırıldı (yer açmak için). */}
              <View style={styles.sayacUstSatir}>
                <AppText variant="etiket" bold color="beyaz" numberOfLines={1}>
                  JSPS sınavına kalan süre
                </AppText>
                {basvuruAcik ? (
                  <View style={styles.basvuruKapsul}>
                    <AppText variant="etiket" bold color="altinParlak" numberOfLines={1}>
                      Başvurular: 3 – 23 Ağustos
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText
                variant="dev"
                bold
                color="beyaz"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.devTekSatir}>
                {geriSayim}
              </AppText>
            </View>

            {/* ═══ BUGÜNÜN EMRİ KARTI — yumuşak petrol panel + ilerleme halkası.
                Sağ üst köşede çapraz KURDELE (ref v3): rozet değil, kırmızı şerit. */}
            <View style={[styles.gecePanel, styles.emirPanelUst]}>
              {/* SOL PLAKA (mock birebir): FLAMA kesimli zemin — sağ kenar çapraz,
                  altın konturlu; kartın üst çizgisine BİNER (kopuk pill değil). */}
              {/* PLAKA: kesik uçlu FLAMA (başkan, 12 Ağu görseli) + defne arması. */}
              <View style={styles.plakaKap}>
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 218 58"
                  preserveAspectRatio="none"
                  style={StyleSheet.absoluteFill}>
                  <Path
                    d="M7,2 L210,2 L172,56 L7,56 Q2,56 2,51 L2,7 Q2,2 7,2 Z"
                    fill="#0B2F44"
                    stroke="#F3C24A"
                    strokeWidth={1.6}
                  />
                </Svg>
                <Image
                  source={require('../../../assets/images/mock-arma.webp')}
                  style={styles.plakaArmaGorsel}
                />
                <View>
                  <AppText variant="etiket" bold color="altinParlak" style={styles.plakaUst}>
                    BUGÜNÜN
                  </AppText>
                  <AppText variant="baslik" bold color="beyaz" style={styles.plakaAlt}>
                    EMRİ
                  </AppText>
                </View>
              </View>
              {/* Ref v5 SAĞ PLAKA: altın kenarlı kırmızı ZAYIF MEVZİLER (kurdele emekli). */}
              {!bos ? (
                /* Başkan (12 Ağu görseli): uçları pahlı kırmızı bant + altın kontur. */
                /* GERÇEK etiket — TAM hali: sol üst kıvrım da sağ alttaki gibi
                   kenar çizgisiyle kesişip 'kenardan dolanıyor' okunur. */
                <View style={styles.zayifEtiketSar} pointerEvents="none">
                  <Image
                    source={require('../../../assets/images/mock-zayif-etiket.webp')}
                    style={styles.zayifEtiketGorsel}
                    resizeMode="cover"
                  />
                </View>
              ) : bos && hicCalisilan ? (
                /* Yeni kullanıcı: ALTIN oval rozet — İLK EMİR. */
                <LinearGradient
                  colors={['#F6CE5B', '#D99A16']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.zayifOval, styles.ilkEmirOval]}>
                  <AppText variant="etiket" bold style={[styles.kurdeleYazi, styles.ctaYazi]}>
                    İLK EMİR
                  </AppText>
                </LinearGradient>
              ) : null}
              <View style={styles.kenarUstuCizgi} pointerEvents="none" />
              <View style={styles.emirSatir}>
                <View style={styles.emirSol}>
                  {bos ? (
                    hicCalisilan ? (
                      <>
                        <AppText variant="baslik" bold color="beyaz" style={styles.emirManset}>
                          {'İLK '}
                          <AppText variant="baslik" bold color="altinParlak" style={styles.emirManset}>
                            MEVZİNİ
                          </AppText>
                        </AppText>
                        <AppText
                          variant="baslik"
                          bold
                          color="beyaz"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={styles.emirManset}>
                          GÖZETLEME GÖREVİ
                        </AppText>
                      </>
                    ) : (
                      <>
                        <AppText variant="baslik" bold color="beyaz" style={styles.emirManset}>
                          TÜM GÖREVLERİ
                        </AppText>
                        <AppText variant="baslik" bold color="altinParlak" style={styles.emirManset}>
                          YAPTIN 🎖️
                        </AppText>
                      </>
                    )
                  ) : (
                    /* Ref v4: iki satır — "ZAYIF 8 MEVZİNİ" (MEVZİNİ altın) / "GÜÇLENDİR". */
                    <>
                      <AppText variant="baslik" bold color="beyaz" style={styles.emirManset}>
                        {`ZAYIF ${bekleyen} `}
                        <AppText variant="baslik" bold color="altinParlak" style={styles.emirManset}>
                          MEVZİNİ
                        </AppText>
                      </AppText>
                      <AppText variant="baslik" bold color="beyaz" style={styles.emirManset}>
                        GÜÇLENDİR
                      </AppText>
                    </>
                  )}
                  {bos && !hicCalisilan ? (
                    <AppText variant="kucuk" bold color="beyaz" style={styles.emirAlt}>
                      Tekrar edilecek mevzi kalmadı — yeni konu çalış
                    </AppText>
                  ) : null}
                </View>
                {!bos ? (
                  <EmirHalka tamam={bugunSayi} toplam={bugunSayi + bekleyen} />
                ) : hicCalisilan ? (
                  /* İlk görev hedefi: 8 kartlık gözetleme turu. */
                  <EmirHalka tamam={0} toplam={8} />
                ) : (
                  /* Görev bitti: sağda denge unsuru — altın madalya (halkanın yerini alır). */
                  <View style={styles.madalyon}>
                    <View style={styles.madalyonIc}>
                      <MaterialCommunityIcons name="medal" size={28} color={Palette.altinParlak} />
                    </View>
                  </View>
                )}
              </View>
              {!bos ? (
                /* Ref v4: çerçeveli meta alt-paneli — süre | dikey ayraç | son konu. */
                <View style={styles.emirMetaPanel}>
                  <View style={styles.emirMetaKol}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={Palette.beyaz} />
                    <AppText variant="kucuk" bold color="beyaz">
                      {bekleyen} dk
                    </AppText>
                  </View>
                  {sonKonu ? (
                    <>
                      <View style={styles.emirMetaAyrac} />
                      <View style={styles.emirMetaKol}>
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          size={16}
                          color={Palette.beyaz}
                        />
                        <AppText variant="kucuk" bold color="beyaz" numberOfLines={1}>
                          {sonKonu.replace(' m.', ' · Madde ')}
                        </AppText>
                      </View>
                    </>
                  ) : null}
                </View>
              ) : bos && hicCalisilan ? (
                <View style={styles.emirMetaPanel}>
                  <View style={styles.emirMetaKol}>
                    <MaterialCommunityIcons name="cards-outline" size={16} color={Palette.beyaz} />
                    <AppText variant="kucuk" bold color="beyaz">
                      8 kart
                    </AppText>
                  </View>
                  <View style={styles.emirMetaAyrac} />
                  <View style={styles.emirMetaKol}>
                    <MaterialCommunityIcons name="timer-outline" size={16} color={Palette.beyaz} />
                    <AppText variant="kucuk" bold color="beyaz">
                      ≈ 8 dk
                    </AppText>
                  </View>
                </View>
              ) : null}
              <Nabiz>
                <Pressable
                  style={({ pressed }) => [styles.safakCta, pressed && styles.pressed]}
                  onPress={() => {
                    ortaDokun();
                    if (bos) router.push('/mevzuat');
                    else router.push({ pathname: '/akis', params: { mod: 'zayif' } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={bos ? 'Mevzuata git' : 'Taarruza başla — zayıf kartları çalış'}>
                  <LinearGradient
                    colors={['#F5C34F', '#EFB12F', '#E29B17']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <AppText variant="govde" bold style={styles.ctaYazi}>
                    {bos ? (hicCalisilan ? 'GÖZETLEMEYE BAŞLA' : 'YENİ KONU SEÇ') : 'TAARRUZA BAŞLA'}
                  </AppText>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color="#07334B"
                    style={styles.ctaOk}
                  />
                  <IsiltiSerit />
                </Pressable>
              </Nabiz>
              {bos && hicCalisilan ? (
                <View style={styles.emirNot}>
                  <View style={styles.notNokta} />
                  <AppText variant="etiket" color="beyaz" style={styles.notYazi}>
                    İlk çalışmandan sonra emirlerin sana özel hazırlanacak.
                  </AppText>
                  <View style={styles.notNokta} />
                </View>
              ) : null}
            </View>
        </View>
      ) : (
        <SinavGeriSayim />
      )}

      {/* 3 KUTU — Genel ilerleme · Nöbet serisi · Zayıf mevzi (sayacın hemen altında).
          GECE KARARI K3 (bayraklı): kutular Karargah'tan kalkar (Evsaf'a taşınacak) —
          yeni kullanıcı üç sıfırla karşılanmasın. */}
      {aramaMevzuatta ? null : (
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
      )}

      {/* UNUTMA UYARISI — ≥7 gündür tekrar edilmemiş kanunlar (tedbir bandı). */}
      {/* Bayraklıda bu bant otomatik çıkmaz — Tekrar Zamanı yarım kartından açılır (10 Ağu gece). */}
      {unutulan.length > 0 && !aramaMevzuatta ? (
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

      {/* ═══ GERİ BESLEME — zayıf mevziler + düello eksikleri (tek başlık altında) ═══
          GECE KARARI K5+K7 (bayraklı): açıklanmasız "GERİ BESLEME" başlığı ve kırmızı
          ödül-ceza emri kartı kalkar — emir dili aşağıdaki altın hero'da, tek yerde. */}
      {aramaMevzuatta ? null : (
      <>
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
      </>
      )}

      {/* HERO — ETÜT = zayıf havuz (eksik/zorlandığın kartları düzelt). Boşsa "zayıf yok". */}
      {/* Bayraklıda emir tamamen Şafak sahnesinde — hero yalnız ESKİ görünümde çizilir. */}
      {aramaMevzuatta ? null : bos ? (
        <Pressable
          style={({ pressed }) => [
            styles.hero,
            styles.heroBitti,
            aramaMevzuatta && styles.heroKrem,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/mevzuat')}
          accessibilityRole="button"
          accessibilityLabel="Mevzuat'tan konu çalış">
          <View style={styles.heroMetin}>
            {/* YENİ ÜYE ile GÜNÜ BİTİREN aynı değil: ikisinde de zayıf havuz boş, ama hiç kart
                çalışmamış birine "Tüm görevleri yaptın" demek yanlış — nereden başlayacağını
                söylemek gerekiyor. (Başkan tespiti, 7 Ağu 2026.) */}
            <AppText variant="etiket" color={aramaMevzuatta ? 'altinMetin' : 'altin'} bold>
              {aramaMevzuatta ? 'BUGÜNÜN EMRİ 🎖️' : hicCalisilan ? 'BURADAN BAŞLA 🎖️' : 'GÜNÜ TAMAMLADIN 🎖️'}
            </AppText>
            <AppText variant="baslik" color={aramaMevzuatta ? 'lacivert' : 'beyaz'} bold>
              {hicCalisilan ? 'İlk mevzini seç' : 'Tüm görevleri yaptın'}
            </AppText>
            <AppText variant="kucuk" color={aramaMevzuatta ? 'solukMetin' : 'kenarlik'}>
              {hicCalisilan
                ? "Mevzuat'tan bir kanun aç, kartları çalışmaya başla ›"
                : "Tekrar edilecek mevzi kalmadı — Mevzuat'tan yeni konu çalış ›"}
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={52}
            color={aramaMevzuatta ? Palette.altinKoyu : Palette.altin}
          />
        </Pressable>
      ) : (
        aramaMevzuatta ? null : (
        <Pressable
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
          accessibilityRole="button"
          accessibilityLabel="Geri Besleme — zayıf mevzileri çalış">
          <View style={styles.heroUst}>
            <View style={styles.heroMetin}>
              {/* GECE KARARI K1+K7 (bayraklı): "ZAYIF MEVZİLER" değil "BUGÜNÜN EMRİ";
                  alarm dili yerine altın "güçlendir" dili. Zemin KREM (başkan, 10 Ağu:
                  "koyu içimizi karartıyor — Codex'te onaylanan renk dili"). */}
              <AppText variant="etiket" color={aramaMevzuatta ? 'altinMetin' : 'altin'} bold>
                {aramaMevzuatta ? 'BUGÜNÜN EMRİ 🎖️' : 'ZAYIF MEVZİLER'}
              </AppText>
              <AppText variant="baslik" color={aramaMevzuatta ? 'lacivert' : 'beyaz'} bold>
                {aramaMevzuatta ? `Zorlandığın ${bekleyen} kartı güçlendir` : 'Kart Çalışması'}
              </AppText>
              {/* Etüt = hata + zorlandıklarını düzeltme bölümü (tekrar-hatırlat + denemede yanlış). */}
              <AppText variant="etiket" color={aramaMevzuatta ? 'altinMetin' : 'altinAcik2'}>
                Eksik ve zorlandığın kartları tekrar et
              </AppText>
              <AppText variant="kucuk" color={aramaMevzuatta ? 'solukMetin' : 'kenarlik'}>
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
            <HeroBilgi ikon="clock-outline" etiket="Tahmini süre" deger={`${bekleyen} dk`} krem={aramaMevzuatta} />
            {sonKonu ? (
              <HeroBilgi ikon="book-outline" etiket="Son konu" deger={sonKonu} krem={aramaMevzuatta} />
            ) : null}
          </View>
        </Pressable>
        )
      )}

      {/* 11 Ağu "%100 aynısı" yerleşimi: TEKRAR ZAMANI tam satır (kırmızı uyarı dili —
          tema kuralı: kırmızı SADECE uyarı, burası uyarı) + [TATBİKAT | ER MEYDANI] paneller.
          NOT: Kaldığın Yer kartı + moral satırı ekran görüntüsünde YOK → gizlendi, silinmedi
          (başkan kuralı: "bir şey silme, sonra geri isteyebiliriz"). Geri almak için bu
          bloğun üstüne <KaldiginYerKarti /> ve altına moral satırını ekle. */}
      {aramaMevzuatta ? (
        <>
          {hicCalisilan ? (
            /* Yeni kullanıcı: paslanma yok — TEKRAR SİSTEMİ tanıtım bandı (mock). */
            <View style={[styles.gecePanel, styles.tekrarSatir, styles.blokArasi]}>
              <View style={styles.emirIkonHalka}>
                <MaterialCommunityIcons name="sync" size={22} color={Palette.altinParlak} />
              </View>
              <View style={styles.erMetin}>
                <AppText variant="kucuk" bold color="altinParlak" style={styles.tekrarBaslik2}>
                  TEKRAR SİSTEMİ
                </AppText>
                <AppText variant="kucuk" bold color="beyaz">
                  {'Çalıştıkça tekrar zamanını\nbiz takip edeceğiz.'}
                </AppText>
              </View>
              <View style={styles.tekrarEtSag}>
                <AppText variant="etiket" bold color="altinParlak" style={styles.tekrarBaslik2}>
                  HAZIR
                </AppText>
                <MaterialCommunityIcons
                  name="chevron-right-circle-outline"
                  size={20}
                  color={Palette.altinParlak}
                />
              </View>
            </View>
          ) : (
          <Pressable
            onPress={() => {
              hafifDokun();
              if (unutulan.length === 1)
                router.push({ pathname: '/patika', params: { lawId: String(unutulan[0].lawId) } });
              else setTekrarAcik((v) => !v);
            }}
            style={({ pressed }) => [
              styles.gecePanel,
              styles.tekrarSatir,
              styles.blokArasi,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tekrar zamanı — paslanan kanunlar">
            {/* Handoff şartnamesi: uyarı KIRMIZI kalır ama PARLAK kırmızı (#F04438) —
                koyu kırmızının okunmama derdi böyle çözüldü. Paslanma yoksa altın-sakin. */}
            <View style={styles.emirIkonHalka}>
              <Sallan aktif={unutulan.length > 0}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={24}
                  color={unutulan.length > 0 ? Palette.kirmiziParlak : Palette.altinParlak}
                />
              </Sallan>
            </View>
            <View style={[styles.erMetin, styles.tekrarYaziAlani]}>
              {unutulan.length > 0 ? (
                <View style={styles.paslanmaSatir}>
                  <AppText variant="kucuk" bold color="kirmiziParlak" numberOfLines={1}>
                    {unutulan.length} kanun
                  </AppText>
                  <AppText variant="kucuk" bold color="beyaz" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                    {' paslanmaya başladı'}
                  </AppText>
                </View>
              ) : (
                <AppText variant="kucuk" bold color="beyaz">
                  Paslanan kanun yok
                </AppText>
              )}
            </View>
            {unutulan.length > 0 ? (
              <View style={styles.tekrarEtKose}>
                <AppText variant="etiket" bold color="kirmiziParlak" style={styles.tekrarBaslik2}>
                  TEKRAR ET
                </AppText>
                <MaterialCommunityIcons name="arrow-right" size={16} color={Palette.kirmiziParlak} />
              </View>
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.altinParlak} />
            )}
          </Pressable>
          )}
          {/* GENEL DENEME ŞERİDİ (başkan, 23 Ağu): paslanma şeridinin hemen altında.
              Genel denemeler Tatbikat Merkezi'nin içinde ikinci sekmede duruyordu, kimse
              bulamıyordu — başkan bile aradı. Buradan doğrudan o sekme açılır; müşterek/branş
              seçimi orada kullanıcıya bırakılır. */}
          <Pressable
            onPress={() => { hafifDokun(); router.push({ pathname: '/tatbikat', params: { mod: 'tatbikat' } }); }}
            style={({ pressed }) => [styles.gecePanel, styles.tekrarSatir, styles.blokArasi, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Genel deneme sınavı çöz">
            <View style={styles.emirIkonHalka}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={24} color={Palette.altinParlak} />
            </View>
            <View style={[styles.erMetin, styles.tekrarYaziAlani]}>
              <AppText variant="kucuk" bold color="beyaz" numberOfLines={1}>
                Genel deneme çöz
              </AppText>
            </View>
            <View style={styles.tekrarEtKose}>
              <AppText variant="etiket" bold color="altinParlak" style={styles.tekrarBaslik2}>
                DENEMELER
              </AppText>
              <MaterialCommunityIcons name="arrow-right" size={16} color={Palette.altinParlak} />
            </View>
          </Pressable>
          <View style={[styles.ikizSatir, styles.blokArasi]}>
            <Pressable
              onPress={() => { hafifDokun(); router.push('/tatbikat'); }}
              style={({ pressed }) => [styles.gorselPanel, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Tatbikat Merkezi — karma deneme sınavları">
              {/* SEMBOL ÜSTTE, küçültülmüş (contain) — başkan: "logoyu küçült, yukarı taşı".
                  Yazılar ALTTA: başlık, hemen altında açıklama. */}
              {/* Sembol bloğun ÜST tarafına çekildi (başkan, 13 Ağu): görselin daha ALT
                  bandı gösterilince hedef tahtası yukarı çıkar, yazılar yerinde kalır. */}
              <ExpoImage
                source={TATBIKAT_ARKA}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition={{ top: -46 }}
              />
              <LinearGradient
                colors={['rgba(4,26,40,0)', 'rgba(4,26,40,0.55)', 'rgba(4,26,40,0.96)']}
                locations={[0.32, 0.6, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.panelYazi}>
                <AppText variant="baslik" bold color="altinParlak" style={styles.gorselBaslik} numberOfLines={2}>
                  TATBİKAT MERKEZİ
                </AppText>
                <AppText variant="kucuk" bold color="beyaz" style={styles.gorselAciklama} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Karma sınavlarla kendini sına.
                </AppText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => { hafifDokun(); router.push('/er-meydani'); }}
              style={({ pressed }) => [styles.gorselPanel, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Oyun Merkezi — oynayarak öğren">
              <ExpoImage
                source={OYUN_ARKA}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition={{ top: -52 }}
              />
              <LinearGradient
                colors={['rgba(4,26,40,0)', 'rgba(4,26,40,0.55)', 'rgba(4,26,40,0.96)']}
                locations={[0.32, 0.6, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.panelYazi}>
                <AppText variant="baslik" bold color="altinParlak" style={styles.gorselBaslik} numberOfLines={2}>
                  OYUN MERKEZİ
                </AppText>
                <AppText variant="kucuk" bold color="beyaz" style={styles.gorselAciklama} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Oynayarak öğren, pekiştir.
                </AppText>
              </View>
            </Pressable>
          </View>
          {tekrarAcik && unutulan.length > 0 ? (
            <View style={styles.tekrarListe}>
              {unutulan.slice(0, 5).map((u) => (
                <Pressable
                  key={u.lawId}
                  style={({ pressed }) => [styles.unutSatir, styles.unutSatirGece, pressed && styles.pressed]}
                  onPress={() => router.push({ pathname: '/patika', params: { lawId: String(u.lawId) } })}>
                  <MaterialCommunityIcons name="history" size={16} color={Palette.altinParlak} />
                  <AppText variant="kucuk" bold color="beyaz" style={styles.unutAd} numberOfLines={1}>
                    {u.ad}
                  </AppText>
                  <AppText variant="kucuk" bold color="altinAcik2">
                    {u.gun} gün
                  </AppText>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.kenarlik} />
                </Pressable>
              ))}
              {unutulan.length > 5 ? (
                <AppText variant="kucuk" bold color="altinAcik2">
                  +{unutulan.length - 5} kanun daha
                </AppText>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      {/* Er Meydanı'nda zorlandığın konular (ücretsiz görür; gidermek için premium) — Geri Besleme altında.
          Başkan (10 Ağu): bayraklıda bu kart EVSAF'a taşındı (Zayıf Mevziler → Oyunlar sekmesi). */}
      {zayifKanun.length > 0 && !aramaMevzuatta ? (
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

      {/* GÜNÜN MADDESİ — tarih rotasyonlu kart + İncele.
          GECE KARARI K4 (bayraklı): Karargah'tan kalkar (günlük görevle aynı işi iki kez
          teklif ediyordu); Mevzuat listesi altına taşınması ayrıca yapılacak. */}
      {gunMadde && !aramaMevzuatta ? (
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

      {/* Ortak indirme kapısı modalı (components/mevzuat/indir-kapisi). */}
      <IndirModal />
    </Screen>
  );
}

/** Hero içi bilgi SÜTUNU: üstte ikon+etiket (soluk), altta değer (beyaz). 3'ü yan yana. */
function HeroBilgi({
  ikon,
  etiket,
  deger,
  krem,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  etiket: string;
  deger: string;
  /** Bayraklı krem hero içinde: açık zemin + lacivert metin (Codex dili). */
  krem?: boolean;
}) {
  return (
    <View style={[styles.heroKutu, krem && styles.heroKutuKrem]}>
      <View style={styles.heroKutuUst}>
        <MaterialCommunityIcons name={ikon} size={15} color={krem ? Palette.altinKoyu : Palette.altinAcik2} />
        <AppText
          variant="kucuk"
          color={krem ? 'lacivert' : 'beyaz'}
          bold
          numberOfLines={2}
          style={styles.heroKutuDeger}>
          {deger}
        </AppText>
      </View>
      <AppText variant="etiket" color={krem ? 'solukMetin' : 'kenarlik'} numberOfLines={1}>
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
  // Sağ üst: DUYURULAR üstte, Telegram KATIL hapı hemen altında (sağa hizalı).
  sagUstSutun: { alignItems: 'flex-end', gap: 6 },
  pressed: {
    opacity: 0.85,
  },
  // Bayraklı: geri sayımın altındaki Kaldığın Yer + Genel Tatbikat ikilisi.
  karargahGiris: {
    gap: Spacing.two,
    marginTop: Spacing.two,
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
  // Büyük sayaç (10 Ağu gece yerleşimi): kutusuz iri yazı + altın başvuru bandı.
  geriSayimBuyuk: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  geriSayimBuyukYazi: {
    textAlign: 'center',
  },
  basvuruBant: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  basvuruBantVurgu: {
    backgroundColor: Palette.kirmizi,
    borderColor: Palette.kirmizi,
  },
  // K2 (bayraklı): tek satırlık sayaç — koca bloğun yerine ince şerit.
  // Başvuru uyarısı AYRI ikinci satırda (aynı satıra sıkışıp taşıyordu — başkan, 9 Ağu gece).
  geriSayimKompakt: {
    alignItems: 'center',
    gap: 2,
    backgroundColor: Palette.kartYuzeyKoyu,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  geriSayimKompaktSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: '100%',
  },
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
  // Başvuru penceresi şeridi (geri sayımın altı — ince, altın çerçeveli bilgi bandı)
  basvuruSerit: {
    marginTop: Spacing.one,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    backgroundColor: 'rgba(201,162,39,0.12)',
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
  },
  basvuruSeritVurgu: {
    backgroundColor: Palette.kirmizi,
    borderColor: Palette.kirmizi,
  },
  basvuruMetin: {
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Hero
  hero: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  // ŞAFAK SAHNESİ (10 Ağu gece): gökteki öğeler.
  safakSayac: {
    textAlign: 'center',
  },
  safakBasvuru: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Palette.altin,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
  },
  safakEmir: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  emirAlt: {
    textAlign: 'center',
    opacity: 0.95,
  },
  safakCta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    overflow: 'hidden', // zemin = altın degrade (LinearGradient absoluteFill)
  },
  // 10 Ağu gece yerleşimi: merkezli emir + CTA + ikiz yarım kartlar.
  heroMerkez: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  emirEtiket: {
    letterSpacing: 2,
  },
  emirBaslik: {
    textAlign: 'center',
  },
  emirCta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Palette.altin,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  ikizSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  // Renk mozaiği dersi (Drops): ikizlerin her biri kendi doygun kimliğinde —
  // Tatbikat ALTIN, Tekrar LACİVERT. Çerçeveli beyaz yok.
  // Doğal yerleşim: kutu yok — şeffaf sütun, ayrımı dikey altın kıl çizgi yapar.
  tekrarYarim: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  tekrarBaslik: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  erKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  erMetin: {
    flex: 1,
    gap: 2,
  },
  moralSatir: {
    textAlign: 'center',
    paddingVertical: Spacing.one,
  },
  tekrarListe: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  gokAkis: {
    gap: Spacing.three, // eşit blok ritmi — taşınca kısıldı (11 Ağu)
  },
  // ═══ 11 Ağu "%100 aynısı" ekran görüntüsü stilleri ═══
  takvimSahne: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  // Ortalı tek-satır canlı sayaç sahnesi (11 Ağu)
  sayacMerkez: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2, // 23 Ağu: ekran tek sayfaya sığsın diye dikey boşluk kısıldı
  },
  // Sayacın hemen ÜSTÜ: solda "ne kadar kaldı" açıklaması, sağda başvuru penceresi.
  sayacUstSatir: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: 1,
  },
  devTekSatir: {
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    alignSelf: 'stretch',
    // Açık gökte keskinlik: yumuşak koyu iz (başkan eleştirisi, 11 Ağu)
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  muhurDar: {
    alignSelf: 'center',
    width: '62%',
    paddingHorizontal: 0,
  },
  basvuruMini: {
    letterSpacing: 1,
  },
  emirPanelKirp: {
    overflow: 'hidden', // (kullanım dışı — kurdele dönemi)
  },
  emirPanelUst: {
    paddingTop: 62, // plaka -9'dan biner (49 içeride) + nefes — manşet altında başlar
  },
  emirPlaka: {
    position: 'absolute',
    top: -26,
    left: -2,
    width: 186,
    height: 56,
  },
  plakaKap: {
    position: 'absolute',
    top: -2, // başkan: 2 piksel daha aşağı
    left: 10,
    width: 218,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: 10,
    paddingRight: 54, // çapraz kesiğin altına yazı giremez
  },
  plakaArmaGorsel: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  zayifEtiketSar: {
    position: 'absolute',
    top: -9, // başkan hizası
    right: -12,
    width: 188, // TAM genişlik — sol üst kıvrım görünür (sağ alt gibi)
    height: 57,
  },
  zayifEtiketGorsel: {
    position: 'absolute',
    right: 0, // sağa hizalı; taşan sol kısım kırpılır
    top: 0,
    width: 188,
    height: 57, // 362x110 kesit oranı
  },
  kenarUstuCizgi: {
    // Kart üst kenarını şeridin ÜZERİNE yeniden çizer → şeridin kart içindeki kısmı
    // çizginin arkasında kalır; ekrandan taşan sağ ucu önde görünür (derinlik).
    position: 'absolute',
    top: -1,
    left: 16,
    right: 16,
    height: 1.5,
    backgroundColor: 'rgba(67,203,218,0.5)',
  },
  zayifOval: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 999, // oval köşeli rozet (katlama işaretsiz)
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(243,194,74,0.9)',
  },
  ilkEmirOval: {
    borderColor: '#FFE9A8',
  },
  plakaIc: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.four,
  },
  plakaArma: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(243,194,74,0.5)',
    backgroundColor: 'rgba(2,20,30,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plakaUst: {
    letterSpacing: 1.5,
    fontSize: 11,
  },
  plakaAlt: {
    fontSize: 20,
    lineHeight: 23,
  },
  zayifPlakaSar: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  zayifKurdele: {
    width: 176,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plakaKivrim: {
    position: 'absolute',
    left: 10,
    bottom: -7,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: '#7A120C',
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
  },
  kurdele: {
    ...StyleSheet.absoluteFillObject,
  },
  kurdeleSerit: {
    position: 'absolute',
    top: 40,
    right: -70,
    width: 260,
    transform: [{ rotate: '45deg' }],
    paddingVertical: 4,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  kurdeleYazi: {
    letterSpacing: 1,
  },
  unutSatirGece: {
    backgroundColor: 'rgba(3,47,69,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.35)',
    borderRadius: Radius.m,
  },
  kirmiziSolCubuk: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: Palette.kirmiziParlak,
  },
  tekrarEtSag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emirNot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  notNokta: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.altinParlak,
  },
  notYazi: {
    opacity: 0.9,
  },
  // TEK SATIR (başkan, 13 Ağu): yazı solda, "TEKRAR ET" sağda, aynı hizada.
  // Eskiden yazı alanı tüm satırı kaplayıp TEKRAR ET'i alt satıra itiyordu.
  tekrarYaziAlani: {
    flex: 1,
    minWidth: 0,
  },
  tekrarEtKose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  madalyon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: Palette.altinKoyu,
    backgroundColor: 'rgba(2,20,30,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  madalyonIc: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(243,194,74,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBaslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tileBaslik: {
    fontSize: 15,
    letterSpacing: 1,
  },
  tileCizgi: {
    width: 14,
    height: 1,
    backgroundColor: 'rgba(243,194,74,0.6)',
  },
  blokArasi: {
    marginTop: Spacing.one, // gövde gap'iyle birlikte bloklar arası eşit ~16 (taşma fixi)
  },
  basvuruKapsul: {
    // Artık sayacın üstünde, açıklamanın sağında duruyor → üstten boşluk yok.
    backgroundColor: 'rgba(3,32,46,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.25)',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  takvimSol: {
    flex: 1.15,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  takvimIkonKutu: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.7)',
    backgroundColor: 'rgba(5,26,36,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  takvimEtiket: {
    letterSpacing: 1.5,
  },
  takvimCizgi: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(214,236,239,0.16)', // handoff v2 iç ayraç
    marginVertical: Spacing.one,
  },
  detayLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  takvimSag: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  devGun: {
    fontSize: 62, // tek-ekran sığdırma: 84 → 62
    lineHeight: 68,
  },
  devGunAlt: {
    letterSpacing: 5,
    marginTop: -6,
  },
  sagMuhurSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
  },
  sagMuhurCizgi: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(240,183,51,0.75)',
  },
  jspsEtiket: {
    letterSpacing: 4,
  },
  sagAltYazi: {
    opacity: 0.9,
  },
  // Yumuşak petrol panel — kutu hissi vermeyen düşük kontrastlı kart (mock'taki gibi).
  gecePanel: {
    backgroundColor: 'rgba(3,47,69,0.88)', // handoff: derin dolgun kart
    borderWidth: 1,
    borderColor: 'rgba(67,203,218,0.5)', // handoff v2: cyan kenar (neon'dan kısıldı)
    borderRadius: Radius.l,
    padding: Spacing.three,
    gap: Spacing.one, // tek-ekran sığdırma
  },
  emirUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  emirIkonHalka: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zayifRozet: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)', // emaye/metal cila kenarı (handoff)
    overflow: 'hidden',
  },
  emirSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emirSol: {
    flex: 1,
    gap: 2,
  },
  emirManset: {
    fontSize: 24, // tek-ekran sığdırma: 30 → 24
    lineHeight: 30,
  },
  emirMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  metaNokta: {
    marginHorizontal: 2,
  },
  emirMetaPanel: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    borderRadius: Radius.m,
    backgroundColor: 'rgba(3,40,56,0.5)',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  emirMetaKol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  emirMetaAyrac: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: 'rgba(214,236,239,0.25)',
  },
  ctaOk: {
    position: 'absolute',
    right: Spacing.three,
    top: '50%',
    marginTop: -10,
  },
  ctaYazi: {
    color: '#07334B', // handoff v2: CTA yazısı koyu petrol (lacivert değil)
  },
  tekrarSatir: {
    flexDirection: 'row',
    alignItems: 'center', // tek satır: ikon, yazı ve TEKRAR ET aynı hizada
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  tekrarBaslik2: {
    letterSpacing: 1,
  },
  paslanmaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  takvimDikey: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(214,236,239,0.16)', // handoff v2 iç ayraç
    marginVertical: Spacing.two,
  },
  yarimPanel: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  // Sinematik arka planlı panel (Tatbikat / Oyun Merkezi) — görsel kutuya oturur, taşmaz.
  gorselPanel: {
    flex: 1,
    // 246 iPhone'da alt sekme çubuğuna taşıyordu (13 Ağu) → 198. 17 Ağu: başkan "alt boşluk
    // fazla, kartlar biraz büyüsün" → 220 (246 ile 198 arası güvenli orta; taşmadan boşluğu doldurur).
    height: 220,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: 'rgba(67,203,218,0.5)',
    overflow: 'hidden',
    // Görsel paneli TAM kaplar (contain'de kenarlarda boşluk kalıyordu — başkan, 13 Ağu);
    // yazılar dibe yaslanır, üstlerine koyu degrade biner.
    justifyContent: 'flex-end',
    backgroundColor: '#05202F',
  },
  panelYazi: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    gap: 3,
  },
  gorselBaslik: {
    // 17 punto yarım genişliğe sığmıyordu ("TATBİKAT MERKE…"). 15 + iki satır izni → kırpılmaz.
    fontSize: 15,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  gorselAciklama: {
    opacity: 0.94,
    textAlign: 'center',
    fontSize: 12,
  },
  yarimBaslik2: {
    letterSpacing: 1,
    marginTop: Spacing.one,
  },
  yarimAlt2: {
    opacity: 0.92,
    textAlign: 'center',
  },
  yarimOk: {
    alignSelf: 'flex-end',
  },
  altinAyrac: {
    height: 1,
    backgroundColor: 'rgba(201,162,39,0.28)',
    marginVertical: Spacing.one,
  },
  dikeyAyrac: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(201,162,39,0.28)',
  },
  // Bayraklı (başkan, 10 Ağu): koyu lacivert hero "içimizi karartıyor" → Codex'te onaylanan
  // krem dil: kart kremi zemin + altın kenarlık + lacivert metin.
  heroKrem: {
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.altin,
  },
  heroKutuKrem: {
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
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
