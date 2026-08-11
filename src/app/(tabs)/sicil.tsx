import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { SicilBelgesi } from '@/components/sicil/takdir-belgesi';
import { GeriBeslemeEmri } from '@/components/sicil/geri-besleme-emri';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, type PaletteColor, Radius, Spacing } from '@/constants/theme';
import { RESMI_BAGLANTI_YOK } from '@/constants/yasal-metin';
import {
  ekleSicilKaydi,
  getAllCards,
  getCardCount,
  getGeriBesDurum,
  getPerformans,
  getSicilKayitlari,
  getStudyCards,
  sicilSifirla,
} from '@/db/database';
import type { GeriBesDurum, SicilDerece, SicilKaydi } from '@/db/schema';
import { type Cinsiyet, type Profil, profilGetir, profilKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import {
  type ZayifKanun as ZayifKanunSatir,
  zayifKanunlar as erMeydaniZayifKanunlar,
  zayifMaddeler as erMeydaniZayifMaddeler,
} from '@/lib/er-meydani';
import { oyunKaydiYukle } from '@/lib/oyun-kayit';
import { urunBilgi } from '@/constants/urunler';
import { eslesenKartIdleri } from '@/lib/sinav';
import type { CardWithLaw } from '@/db/schema';
import { DUELLO_KANUNLAR } from '../../assets/duello-kanunlar';

const OYUN_KANUN_AD = new Map(DUELLO_KANUNLAR.map((k) => [k.id, k.ad] as const));
import { calisilabilirZayifMevzi, kartKlasoru } from '@/lib/gorsel-kaynak';
import { maddeEtiket } from '@/lib/madde-etiket';
import { useUyelik } from '@/lib/uyelik-context';
import { type ZayifKart } from '@/lib/performans';
import { type ZayifVeri, zayifVeriYukle } from '@/lib/zayif-veri';
import { ornekKayitlar, TAKDIR_PER_BASARI } from '@/lib/sicil';
import { degerlendirSicil } from '@/lib/sicil-servis';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, type Istatistik } from '@/lib/stats';
import { UyelikKarti } from '@/components/premium/uyelik-rozeti';
import { useEvsafIstatistik } from '@/components/evsaf/karargah-tasinanlar';
import { EvsafKategori } from '@/components/evsaf/kategori';
import {
  CalismaAnalizi,
  DenemeGecmisi,
  ErMeydaniOzeti,
  GuvenceNotu,
  KanunHaritasi,
  SinavProjeksiyonu,
} from '@/components/evsaf/analiz';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';
import { RUTBELER } from '@/lib/rutbe-store';
import { getBranches } from '@/db/database';
import { useKisiselOzellik } from '@/lib/ozellik';

// liste = ÇALIŞILABİLİR (indirilmiş) zayıflar; kilitli = üyelik gerektiren kanunlarda (indirilemez);
// inebilir = erişilebilir ama henüz indirilmemiş (Mevzuat'tan inince çalışılır).
// ZayifVeri + yükleyici lib/zayif-veri.ts'e taşındı (10 Ağu) — /zayif-mevziler sayfası da kullanıyor.
type SicilVeri = { kayitlar: SicilKaydi[]; durum: GeriBesDurum };
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const DERECE_BILGI: Record<SicilDerece, { ikon: IconName; renk: PaletteColor }> = {
  takdir: { ikon: 'medal-outline', renk: 'altin' },
  basari: { ikon: 'medal', renk: 'altin' },
  ustun_basari: { ikon: 'trophy', renk: 'altin' },
  yazili_ikaz: { ikon: 'alert-outline', renk: 'amber' },
  uyari: { ikon: 'alert', renk: 'amber' },
  kinama: { ikon: 'gavel', renk: 'kirmizi' },
  ayliktan_kesme: { ikon: 'cash-remove', renk: 'kirmizi' },
};
const KADEME_AD = ['—', 'Yazılı İkaz', 'Uyarı', 'Kınama', 'Aylıktan Kesme'];
const tarihFmt = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '—');

export default function SicilScreen() {
  const router = useRouter();
  const { kanunErisilebilir } = useUyelik();
  const karargahTasindi = useKisiselOzellik('talim-mevzuata');
  // Zayıf Mevziler sekmesi: Denemeler (kart/sınav) · Oyunlar (Er Meydanı yanlışları).
  const [zayifSekme, setZayifSekme] = useState<'denemeler' | 'oyunlar'>('denemeler');
  // Zayıf Mevziler ana kartı: özet + ilk 3 hep açık; tam detay (sekmeler) ok ile açılır.
  const [zayifDetay, setZayifDetay] = useState(false);
  const [ist, setIst] = useState<Istatistik | null>(null);
  const [zayif, setZayif] = useState<ZayifVeri | null>(null);
  const [sicil, setSicil] = useState<SicilVeri | null>(null);
  const [hata, setHata] = useState(false);

  // Odağa her gelindiğinde (çalışmadan dönünce) branş + istatistik + zayıf analizi tazele.
  // İstatistik = ana veri (hata → retry); branş adı + zayıf analizi degrade olur (ayrı catch).
  const yukle = useCallback(() => {
    setHata(false);
    void Promise.all([getStudyCards(), getCardCount()])
      .then(([cards, toplam]) => setIst(hesaplaIstatistik(cards, toplam)))
      .catch(() => setHata(true));
    // Zayıf analizi AYRI: hatası İLERLEME/KUTU DAĞILIMI'nı bozmaz. Liste ÇALIŞILABİLİR (indirilmiş)
    // mevzilere indirgenir → Karargah/akış sayacıyla tutarlı; içeriği inmemiş zayıflar `indirilmemis`
    // olarak ayrı sayılır (kullanıcı "indir de çalış" uyarısı görsün, sessizce kaybolmasın).
    void zayifVeriYukle(kanunErisilebilir)
      .then(setZayif)
      .catch(() => setZayif(null));
    // Ödül/Ceza: önce değerlendir (yeni kayıt/ceza işle), sonra sicil + emir durumunu yükle. AYRI catch.
    void degerlendirSicil()
      .then(() => Promise.all([getSicilKayitlari(), getGeriBesDurum()]))
      .then(([kayitlar, durum]) => setSicil({ kayitlar, durum }))
      .catch(() => setSicil(null));
  }, [kanunErisilebilir]);

  useFocusEffect(yukle);

  // METRİKLER (kutusuz, performans temelli):
  //  Çalışılan = en az 1 kez cevaplanan kart. Hazırlık = (çalışılan − zayıf) ÷ toplam,
  //  yani oturmuş (zayıf havuzda olmayan) kart oranı. Kalan = 100 − hazırlık.
  const zayifN = zayif?.liste.length ?? 0;
  const calisilanN = ist?.calisilanKart ?? 0;
  const toplamN = ist?.toplamKart ?? 0;
  const ogrenilenN = Math.max(0, calisilanN - zayifN); // hazırlık payı (oturmuş kart)
  const hazirlikN = toplamN > 0 ? Math.round((ogrenilenN / toplamN) * 100) : 0;
  const kalanN = toplamN > 0 ? 100 - hazirlikN : 0;

  // GECE KARARI E1 (bayraklı): teknik satırlar başı işgal etmesin — Ayarlar sağ üst
  // dişliye, Hata Bildir + Destek en alttaki "YARDIM" grubuna. Bayraksızda hepsi eski yerinde.
  const yardimSatirlari = (
    <>
      {/* Genel hata/öneri bildirimi (kart-bağımsız) — karttaki bildirimle aynı yere (Supabase
          geri_bildirim tablosu) düşer, sadece kart bilgisi olmadan. */}
      <Pressable
        style={({ pressed }) => [styles.planKart, pressed && styles.pressed]}
        onPress={() => router.push('/geri-bildirim')}>
        <MaterialCommunityIcons name="message-alert-outline" size={20} color={Palette.lacivert} />
        <AppText variant="kucuk" bold style={styles.planAd}>
          Hata / Öneri Bildir
        </AppText>
        <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
      </Pressable>

      {/* Çift yönlü destek — talep aç, karşılıklı yazış (biz /admin'den yanıtlarız). */}
      <Pressable
        style={({ pressed }) => [styles.planKart, pressed && styles.pressed]}
        onPress={() => router.push('/destek')}>
        <MaterialCommunityIcons name="lifebuoy" size={20} color={Palette.lacivert} />
        <AppText variant="kucuk" bold style={styles.planAd}>
          Destek / Taleplerim
        </AppText>
        <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
      </Pressable>
    </>
  );

  return (
    <Screen
      title="Evsaf"
      koyu={karargahTasindi}
      marka={karargahTasindi}
      markaKucukHarf
      kompaktBaslik={karargahTasindi}
      headerSag={
        karargahTasindi ? (
          <Pressable
            onPress={() => router.push('/ayarlar')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ayarlar">
            <MaterialCommunityIcons name="cog-outline" size={24} color={Palette.altin} />
          </Pressable>
        ) : undefined
      }>
      {/* 10 Ağu REDESIGN (bayraklı): sıra = Profil+Üyelik özeti → istatistikler →
          Zayıf Mevziler (ana odak) → Ödül-Ceza → Yardım → yasal link. */}
      {/* 10 Ağu akşam: ASKERİ KÜNYE BANDI — profil kartı + istatistik kutularının yerine.
          Ardından analiz kategorileri: projeksiyon (kimlikten hemen sonra en can alıcı soru). */}
      {karargahTasindi ? (
        <>
          <KunyeBandi />
          <SinavProjeksiyonu />
        </>
      ) : null}
      {!karargahTasindi ? (
        <>
          {/* Ayarlar — branş/rütbe/bildirim/yasal girişleri burada toplandı (Evsaf sadeleşti). */}
          <Pressable
            style={({ pressed }) => [styles.planKart, pressed && styles.pressed]}
            onPress={() => router.push('/ayarlar')}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={Palette.lacivert} />
            <AppText variant="kucuk" bold style={styles.planAd}>
              Ayarlar (Branş · Rütbe · Bildirimler · Yasal)
            </AppText>
            <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.solukMetin} />
          </Pressable>
          {yardimSatirlari}
          <KisiselBilgiler />
          {/* Premium'sa "Üyeliğim" kartı (aktif paketler) — değilse görünmez. */}
          <UyelikKarti />
        </>
      ) : null}

      {hata ? (
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="İstatistikler yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : ist === null ? (
        <Loading metin="İstatistikler yükleniyor…" />
      ) : (
        <>
          {/* İlerleme özeti — bayraklıda GİZLİ (başkan, 10 Ağu: "2 farklı ilerleme bölümü
              var"; üstteki kutu satırı tek ilerleme göstergesi olarak kaldı). */}
          {karargahTasindi ? null : (
          <View style={styles.istatistikKart}>
            <BolumBaslik
              baslik="İLERLEME"
              bilgi="Çalışılan = en az 1 kez gördüğün kart. Hazırlık % = oturmuş (zayıf mevzilerde olmayan) kart ÷ toplam, sınava hazırlık oranın. Kalan % = 100 − hazırlık, daha sağlamlaştırılacak kısım."
            />
            <View style={styles.statSatir}>
              <Stat deger={`${calisilanN}/${toplamN}`} etiket="Çalışılan" />
              <Stat deger={`%${hazirlikN}`} etiket="Hazırlık" />
              <Stat deger={`%${kalanN}`} etiket="Kalan" />
            </View>
          </View>
          )}

          {/* Zayıf Mevziler — geri besleme havuzu (son denemede zor/yanlış).
              Başkan (10 Ağu): iki sekme — Denemeler (kart/sınav kaynaklı) · Oyunlar
              (Er Meydanı yanlışları). Bayraklıda KATEGORİ: başlığa dokun → aşağı açılır. */}
          {karargahTasindi ? (
            /* 10 Ağu v2 (başkan: "neye tıkladığım belli değil, ok'la açılan detay kötü"):
               kart TEK işe odaklı — kartın kendisi TAM SAYFAYA götürür (/zayif-mevziler),
               içindeki tek düğme çalışmaya başlatır ve ne olacağını söyler. En zayıf 3
               satır SALT BİLGİ (tıklanmaz) → tıklama hedefi yalnız iki tane, ikisi de net. */
            <Pressable
              style={({ pressed }) => [
                styles.istatistikKart,
                styles.istatistikKartGece,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/zayif-mevziler')}
              accessibilityRole="button"
              accessibilityLabel="Zayıf mevziler — tümünü gör">
              <View style={styles.kategoriBaslik}>
                <View style={[styles.kategoriIkon, styles.kategoriIkonGece]}>
                  <MaterialCommunityIcons name="target" size={22} color={Palette.altinParlak} />
                </View>
                <View style={styles.kategoriAd}>
                  <AppText variant="govde" bold color="beyaz">
                    Zayıf Mevziler
                  </AppText>
                  <AppText variant="etiket" bold color="beyaz" style={styles.geceSolukYazi}>
                    {zayifN > 0
                      ? `${zayifN} konu tekrar bekliyor · tümünü gör`
                      : 'Tekrar bekleyen konu yok'}
                  </AppText>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="rgba(226,236,240,0.75)"
                />
              </View>
              {zayif && zayif.liste.length > 0 ? (
                <>
                  {zayif.liste.slice(0, 3).map((z) => (
                    <View key={z.card.id} style={styles.zayifSatir}>
                      <AppText variant="kucuk" bold color="beyaz" style={styles.zayifAd} numberOfLines={1}>
                        {maddeEtiket(z.card.madde_no, z.card.baslik)}
                      </AppText>
                      <AppText variant="etiket" bold color="altinParlak">
                        ×{z.yanlisSayisi}
                      </AppText>
                    </View>
                  ))}
                  <Pressable
                    style={({ pressed }) => [styles.zayifCta, pressed && styles.pressed]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: '/akis', params: { mod: 'zayif' } });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Zayıf konuları çalış">
                    <MaterialCommunityIcons name="book-open-variant" size={18} color={Palette.lacivert} />
                    <View>
                      <AppText variant="kucuk" bold color="lacivert">
                        Zayıf Konuları Çalış
                      </AppText>
                      <AppText variant="etiket" color="lacivert">
                        {zayifN} kart · yaklaşık {zayifN} dk · kart akışı açılır
                      </AppText>
                    </View>
                  </Pressable>
                </>
              ) : (
                <AppText variant="kucuk" bold color="beyaz" style={styles.geceSolukYazi}>
                  Henüz zayıf mevzu bulunmuyor — Tatbikatta kendini dene.
                </AppText>
              )}
            </Pressable>
          ) : (
          <View style={styles.istatistikKart}>
            <View style={styles.zayifBaslikSatir}>
              <AppText variant="etiket" color="solukMetin" bold>
                ZAYIF MEVZİLER
              </AppText>
            </View>
            <ZayifBolum
              zayif={zayif}
              onCalis={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
            />
          </View>
          )}

          {/* Analiz kategorileri (10 Ağu akşam): harita → deneme geçmişi → çalışma analizi → Er Meydanı. */}
          {karargahTasindi ? (
            <>
              <KanunHaritasi />
              <DenemeGecmisi />
              <CalismaAnalizi />
              <ErMeydaniOzeti />
            </>
          ) : null}

          {/* Ödül-Ceza Sicili — takdir/başarı ödülleri + geri-bes ceza merdiveni.
              Bayraklıda kategori (dokun → açılır). */}
          {karargahTasindi ? (
            <EvsafKategori
              ikon="medal-outline"
              baslik="Ödül-Ceza Sicili"
              altYazi={(() => {
                // Sicil notu (10 Ağu): tek bakışta durum — dikkat çeksin, defteri açtırsın.
                const o = sicil?.kayitlar.filter((k) => k.tip === 'odul').length ?? 0;
                const c = sicil?.kayitlar.filter((k) => k.tip === 'ceza').length ?? 0;
                if (o === 0 && c === 0) return 'Tertemiz — ilk takdirini kazan';
                const not =
                  c === 0 ? 'Pekiyi' : o > c ? 'İyi' : o === c ? 'Orta' : 'Gelişmeye açık';
                return `Sicil notun: ${not} · ${o} ödül · ${c} ceza`;
              })()}>
              <SicilBolum
                sicil={sicil}
                zayifSayisi={zayif?.liste.length ?? 0}
                onGeriBes={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
              />
            </EvsafKategori>
          ) : (
          <View style={styles.istatistikKart}>
            <AppText variant="etiket" color="solukMetin" bold>
              ÖDÜL-CEZA SİCİLİ
            </AppText>
            <SicilBolum
              sicil={sicil}
              zayifSayisi={zayif?.liste.length ?? 0}
              onGeriBes={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
            />
            {/* Test paneli — yalnız geliştirme modunda (expo start). Yayın build'inde gizli. */}
            {__DEV__ ? (
              <View style={styles.demoSatir}>
                <Pressable
                  style={({ pressed }) => [styles.demoBtn, pressed && styles.pressed]}
                  onPress={() => {
                    void (async () => {
                      for (const k of ornekKayitlar(bugunISO())) await ekleSicilKaydi(k);
                      yukle();
                    })();
                  }}>
                  <AppText variant="etiket" color="lacivert" bold>
                    🧪 Örnek kayıt ekle
                  </AppText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.demoBtn, pressed && styles.pressed]}
                  onPress={() => void sicilSifirla().then(yukle)}>
                  <AppText variant="etiket" color="kirmizi" bold>
                    Temizle
                  </AppText>
                </Pressable>
              </View>
            ) : null}
          </View>
          )}
        </>
      )}

      {/* E1 (bayraklı): yardım satırları en altta kendi KATEGORİSİNDE (dokun → açılır). */}
      {karargahTasindi ? (
        <EvsafKategori ikon="lifebuoy" baslik="Yardım" altYazi="Hata bildir · Destek">
          {yardimSatirlari}
        </EvsafKategori>
      ) : null}

      {/* Resmî kurum bağlantısı reddi — mağaza impersonation riskine karşı görünür ibare.
          10 Ağu redesign (bayraklı): dev paragraf yerine küçük link; metin SİLİNMEDİ,
          dokununca aynen gösteriliyor. Bayraksızda paragraf aynen. */}
      {karargahTasindi ? <GuvenceNotu /> : null}
      {karargahTasindi ? (
        <Pressable
          onPress={() => Alert.alert('Yasal bilgilendirme', RESMI_BAGLANTI_YOK, [{ text: 'Tamam' }])}
          style={({ pressed }) => [styles.yasalLink, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Yasal bilgilendirme">
          <MaterialCommunityIcons name="shield-outline" size={15} color={Palette.solukMetin} />
          <AppText variant="etiket" color="solukMetin" bold>
            Yasal bilgilendirme
          </AppText>
        </Pressable>
      ) : (
        <AppText variant="etiket" color="solukMetin" style={styles.resmiNot}>
          {RESMI_BAGLANTI_YOK}
        </AppText>
      )}
    </Screen>
  );
}

// --- ASKERİ KÜNYE BANDI (10 Ağu akşam; başkan "genel olarak hoşuma gitmedi" → seçilen yön) ---
// Lacivert kimlik bandı: avatar + ad + rütbe/branş + üyelik mührü + altın istatistikler.
// Dokununca altında kişisel bilgi + üyelik detayı (mevcut gomulu bileşenler) açılır.

function KunyeBandi() {
  const { kullanici, hazir } = useAuth();
  const { aktifHaklar } = useUyelik();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const { hazirlik, streak, bekleyen } = useEvsafIstatistik();
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined);
  const [bransAd, setBransAd] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      if (!kullanici) {
        setProfil(null);
        return;
      }
      void profilGetir().then((p) => {
        if (!iptal) setProfil(p);
      });
      void getBranches()
        .then((bs) => {
          if (!iptal) setBransAd(bs.find((b) => b.slug === brans)?.ad ?? null);
        })
        .catch(() => {});
      return () => {
        iptal = true;
      };
    }, [kullanici, brans]),
  );

  if (!hazir || !kullanici) return null;
  const adSoyad = profil ? `${profil.ad ?? ''} ${profil.soyad ?? ''}`.trim() : '';
  const rutbeAd = RUTBELER.find((r) => r.slug === rutbe)?.ad ?? null;
  const gorevSatiri = [rutbeAd, bransAd].filter(Boolean).join(' · ');
  // Mühür: paket adının kısa hâli. Ayırıcı üründe "·" / "–" / "-" olabiliyor —
  // hangisi gelirse gelsin İLK parça alınır ("Tam Erişim · Ömür Boyu" → "Tam Erişim").
  // (10 Ağu: yalnız "–" bölünüyordu, uzun mühür görev satırını eziyordu.)
  const muhur =
    aktifHaklar.length > 0
      ? ((urunBilgi(aktifHaklar[0].urun)?.ad ?? 'Tam Erişim').split(/[·–-]/)[0].trim() ||
        'Tam Erişim')
      : null;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.kunye, pressed && styles.pressed]}
        onPress={() => setAcik((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Künye — kişisel bilgi ve üyelik detayını aç/kapat">
        <View style={styles.kunyeUst}>
          <View style={styles.kunyeAvatar}>
            <MaterialCommunityIcons name="account" size={26} color={Palette.altin} />
          </View>
          <View style={styles.kunyeAdBlok}>
            <AppText variant="baslik" bold color="beyaz" numberOfLines={1}>
              {adSoyad || 'Hesabım'}
            </AppText>
            <View style={styles.kunyeGorevSatir}>
              {gorevSatiri ? (
                <AppText variant="etiket" color="altinAcik2" numberOfLines={1} style={styles.kunyeGorev}>
                  {gorevSatiri}
                </AppText>
              ) : null}
              {muhur ? (
                <View style={styles.kunyeMuhur}>
                  <MaterialCommunityIcons name="shield-star" size={12} color={Palette.altin} />
                  <AppText variant="etiket" bold color="altinAcik2">
                    {muhur}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
          <MaterialCommunityIcons
            name={acik ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={Palette.altinAcik2}
          />
        </View>
        <View style={styles.kunyeAyrac} />
        <View style={styles.kunyeIstSatir}>
          <View style={styles.kunyeIst}>
            <AppText variant="dev" bold color="altinAcik2">
              %{hazirlik ?? 0}
            </AppText>
            <AppText variant="etiket" color="kenarlik">
              İlerleme
            </AppText>
          </View>
          <View style={styles.kunyeIst}>
            <AppText variant="dev" bold color="altinAcik2">
              {streak === null || streak === 0 ? '—' : streak}
            </AppText>
            <AppText variant="etiket" color="kenarlik">
              Çalışma serisi
            </AppText>
          </View>
          <View style={styles.kunyeIst}>
            <AppText variant="dev" bold color="altinAcik2">
              {bekleyen}
            </AppText>
            <AppText variant="etiket" color="kenarlik">
              Zayıf mevzi
            </AppText>
          </View>
        </View>
      </Pressable>
      {acik ? (
        <View style={styles.istatistikKart}>
          <KisiselBilgiler gomulu onProfil={profil ?? null} onDegisti={(p) => setProfil(p)} />
          <View style={styles.kisiAyrac} />
          <UyelikKarti gomulu />
        </View>
      ) : null}
    </>
  );
}

// --- Profil + Üyelik BİRLEŞİK özet kartı (10 Ağu redesign: iki kart → tek kart) ---
// Veri: ad profiles'tan (profilGetir), üyelik useUyelik.aktifHaklar'dan — hard-code YOK.
// Dokununca mevcut kişisel bilgi (maskeli alanlar + ad düzenleme) ve üyelik detayı açılır.

function ProfilUyelikKarti() {
  const { kullanici, hazir } = useAuth();
  const { aktifHaklar } = useUyelik();
  // Profil EKRAN AÇILIRKEN çekilir (panel açılmadan) → panele hazır verilir,
  // kullanıcı "Yükleniyor" görmez (başkan, 10 Ağu).
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined);
  const [acik, setAcik] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      if (!kullanici) {
        setProfil(null);
        return;
      }
      void profilGetir().then((p) => {
        if (!iptal) setProfil(p);
      });
      return () => {
        iptal = true;
      };
    }, [kullanici]),
  );

  if (!hazir || !kullanici) return null;
  const adSoyad = profil ? `${profil.ad ?? ''} ${profil.soyad ?? ''}`.trim() : '';
  // Ürün adı ("Tam Erişim – Ömür Boyu") süreyi zaten içeriyor — tekrar ekleme
  // ("Ömür Boyu · Ömür Boyu" tekrarını başkan yakaladı, 10 Ağu).
  const uyelikOzet =
    aktifHaklar.length > 0
      ? aktifHaklar.map((h) => urunBilgi(h.urun)?.ad ?? h.urun).join(' · ')
      : 'Ücretsiz hesap';

  return (
    <View style={styles.istatistikKart}>
      <Pressable
        style={styles.kategoriBaslik}
        onPress={() => setAcik((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Profil ve üyelik detayını aç/kapat">
        <View style={styles.kategoriIkon}>
          <MaterialCommunityIcons name="account" size={24} color={Palette.lacivert} />
        </View>
        <View style={styles.kategoriAd}>
          <AppText variant="govde" bold color="lacivert" numberOfLines={1}>
            {adSoyad || 'Hesabım'}
          </AppText>
          <AppText variant="etiket" color="solukMetin" numberOfLines={1}>
            {uyelikOzet}
          </AppText>
        </View>
        <MaterialCommunityIcons
          name={acik ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={Palette.solukMetin}
        />
      </Pressable>
      {acik ? (
        <>
          <View style={styles.kisiAyrac} />
          <KisiselBilgiler gomulu onProfil={profil ?? null} onDegisti={(p) => setProfil(p)} />
          <View style={styles.kisiAyrac} />
          <UyelikKarti gomulu />
        </>
      ) : null}
    </View>
  );
}

// EvsafKategori components/evsaf/kategori.tsx'e taşındı (analiz kategorileri de kullanıyor).

// --- Oyun Zayıfları (Er Meydanı + Oyun Merkezi yanlışları — 10 Ağu) ---

/** Oyun künyesinden ("5271 Ceza Muhakemesi Kanunu m.140") kartı bul: önce kanun no ile
 *  kanun süz, sonra madde eşleştir. Yönetmelik/karşılıksız künyede null (kart yok). */
function oyunKaynagindanKart(ref: string, cards: CardWithLaw[]): CardWithLaw | null {
  const no = ref.match(/\b(\d{3,5})\b/);
  if (!no) return null;
  const havuz = cards.filter((c) => c.law_ad.includes(no[1]));
  if (havuz.length === 0) return null;
  const ids = eslesenKartIdleri(ref, havuz);
  return ids.length > 0 ? (havuz.find((c) => c.id === ids[0]) ?? null) : null;
}

export function OyunZayiflari({ karttanCalis }: { karttanCalis: (lawId: number, cardId: number) => void }) {
  const [liste, setListe] = useState<ZayifKanunSatir[] | null>(null);
  // Oyun Merkezi defteri (mevzu_zayif_oyun: künye → yanlış sayısı) + kart eşleşmesi.
  const [merkez, setMerkez] = useState<{ ref: string; yanlis: number; kart: CardWithLaw | null }[]>([]);
  const yukle = useCallback(() => {
    void erMeydaniZayifKanunlar()
      .then(setListe)
      .catch(() => setListe([]));
    void Promise.all([oyunKaydiYukle(), getAllCards()])
      .then(([kayit, cards]) => {
        const ham = kayit['mevzu_zayif_oyun'];
        if (!ham) {
          setMerkez([]);
          return;
        }
        const m = JSON.parse(ham) as Record<string, number>;
        setMerkez(
          Object.entries(m)
            .map(([ref, yanlis]) => ({ ref, yanlis, kart: oyunKaynagindanKart(ref, cards) }))
            .sort((a, b) => b.yanlis - a.yanlis)
            .slice(0, 8),
        );
      })
      .catch(() => setMerkez([]));
  }, []);
  useFocusEffect(yukle);

  if (liste === null) {
    return (
      <AppText variant="kucuk" color="kartMetinIkincil">
        Yükleniyor…
      </AppText>
    );
  }
  if (liste.length === 0 && merkez.length === 0) {
    return (
      <AppText variant="kucuk" color="kartMetinIkincil">
        Oyunlarda henüz zorlandığın konu yok — oynadıkça yanlışların burada toplanır.
      </AppText>
    );
  }
  function detayGoster(kanun: number) {
    void erMeydaniZayifMaddeler(kanun)
      .then((maddeler) => {
        const govde =
          maddeler.length > 0
            ? maddeler
                .slice(0, 6)
                .map((m) => `• ${m.madde} — ${m.yanlis} yanlış`)
                .join('\n')
            : 'Madde detayı yok (eski maçlar madde kaydetmiyordu).';
        Alert.alert(OYUN_KANUN_AD.get(kanun) ?? `Kanun ${kanun}`, govde, [{ text: 'Tamam' }]);
      })
      .catch(() => {});
  }
  return (
    <>
      {merkez.length > 0 ? (
        <>
          <AppText variant="etiket" color="kartMetinIkincil" bold>
            OYUN MERKEZİ
          </AppText>
          <AppText variant="kucuk" color="beyaz">
            Oyunlarda yanlış yaptığın konular (dokun → o maddeyi çalış):
          </AppText>
          {merkez.map((z) => (
            <Pressable
              key={z.ref}
              disabled={!z.kart}
              onPress={() => z.kart && karttanCalis(z.kart.law_id, z.kart.id)}
              style={({ pressed }) => [styles.zayifSatir, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Bu maddeyi çalış">
              <MaterialCommunityIcons
                name="gamepad-variant-outline"
                size={16}
                color={Palette.altinParlak}
              />
              <AppText variant="kucuk" bold color="altinParlak" style={styles.zayifAd} numberOfLines={1}>
                {z.kart ? maddeEtiket(z.kart.madde_no, z.kart.baslik) : z.ref}
              </AppText>
              <AppText variant="etiket" bold color="kartMetinIkincil">
                ×{z.yanlis}
              </AppText>
              {z.kart ? (
                <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.kartMetinIkincil} />
              ) : null}
            </Pressable>
          ))}
        </>
      ) : null}
      {liste.length > 0 ? (
        <>
          <AppText variant="etiket" color="kartMetinIkincil" bold>
            ER MEYDANI
          </AppText>
          <AppText variant="kucuk" color="beyaz">
            Maçlarda en çok bu konularda yanlış yaptın (dokun → maddeler):
          </AppText>
          {liste.slice(0, 6).map((z) => (
            <Pressable
              key={z.kanun}
              onPress={() => detayGoster(z.kanun)}
              style={({ pressed }) => [styles.zayifSatir, pressed && styles.pressed]}
              accessibilityRole="button">
              <MaterialCommunityIcons name="book-alert-outline" size={16} color={Palette.altinParlak} />
              <AppText variant="kucuk" bold color="altinParlak" style={styles.zayifAd} numberOfLines={1}>
                {OYUN_KANUN_AD.get(z.kanun) ?? `Kanun ${z.kanun}`}
              </AppText>
              <AppText variant="etiket" bold color="kartMetinIkincil">
                ×{z.yanlis}
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.kartMetinIkincil} />
            </Pressable>
          ))}
          {liste.length > 6 ? (
            <AppText variant="etiket" color="kartMetinIkincil">
              +{liste.length - 6} konu daha
            </AppText>
          ) : null}
        </>
      ) : null}
    </>
  );
}

// --- Kişisel Bilgiler (Evsaf) ---

const CINSIYET_AD: Record<Cinsiyet, string> = {
  kadin: 'Kadın',
  erkek: 'Erkek',
  belirtmek_istemiyorum: 'Belirtilmedi',
};

function tarihTR(iso: string | null): string | null {
  if (!iso) return null;
  const [y, a, g] = iso.split('-');
  return y && a && g ? `${g}.${a}.${y}` : iso;
}

/** Evsaf üst kartı: hesap + ad/soyad/telefon/doğum/cinsiyet (profilden çekilir). */
function KisiselBilgiler({
  gomulu,
  onProfil,
  onDegisti,
}: {
  gomulu?: boolean;
  /** Üst kart profili ZATEN çekmişse buradan gelir → panel ANINDA açılır ("Yükleniyor" yok). */
  onProfil?: Profil | null;
  /** Ad kaydedilince üst karta haber (başlıktaki isim tazelensin). */
  onDegisti?: (p: Profil | null) => void;
} = {}) {
  const { kullanici, hazir } = useAuth();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [duzenle, setDuzenle] = useState(false);
  // GECE KARARI E1 (bayraklı): e-posta/telefon gibi kişisel bilgiler VARSAYILAN GİZLİ —
  // omuz üstünden bakan görmesin; "Göster"e basınca açılır.
  const varsayilanGizli = useKisiselOzellik('talim-mevzuata');
  const [bilgiGoster, setBilgiGoster] = useState(false);
  // Başkan (10 Ağu): bilgiler ekranda dizili durmasın — tek "Kişisel Bilgiler" satırı,
  // dokununca AÇILIR (akordeon). Bayraksızda eski açık hâl.
  const [panelAcik, setPanelAcik] = useState(false);
  const [adG, setAdG] = useState('');
  const [soyadG, setSoyadG] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Profil gelmeden gövde ÇİZİLMEZ (10 Ağu: "ad-soyad gir" çağrısı bir kare parlayıp
  // sönüyordu). Üst kart ön-yükleme geçtiyse (onProfil) hiç beklenmez; kendi çekimi
  // arkada sessizce tazeler — "Yükleniyor" yalnız hiç veri yokken görünür.
  const [profilHazir, setProfilHazir] = useState(onProfil !== undefined);
  useEffect(() => {
    if (onProfil !== undefined) setProfil(onProfil);
  }, [onProfil]);
  useEffect(() => {
    if (!kullanici) {
      setProfil(null);
      setProfilHazir(false);
      return;
    }
    void profilGetir()
      .then(setProfil)
      .finally(() => setProfilHazir(true));
  }, [kullanici]);

  function duzenleAc() {
    setAdG(profil?.ad ?? '');
    setSoyadG(profil?.soyad ?? '');
    setDuzenle(true);
  }
  async function adKaydet() {
    setKaydediliyor(true);
    try {
      await profilKaydet({ ad: adG.trim(), soyad: soyadG.trim() });
      const yeni = await profilGetir();
      setProfil(yeni);
      onDegisti?.(yeni);
    } catch {
      /* sessiz — kayıt olmazsa pencere kapanır, tekrar denenebilir */
    }
    setKaydediliyor(false);
    setDuzenle(false);
  }

  if (!hazir || !kullanici) return null; // üyelik kapalıysa gösterme

  const adSoyad = `${profil?.ad ?? ''} ${profil?.soyad ?? ''}`.trim();
  const isimYok = !adSoyad;
  const satirlar: { ikon: IconName; etiket: string; deger: string | null }[] = [
    { ikon: 'email-outline', etiket: 'E-posta', deger: kullanici.email },
    { ikon: 'phone-outline', etiket: 'Telefon', deger: profil?.telefon ?? null },
    { ikon: 'calendar-outline', etiket: 'Doğum tarihi', deger: tarihTR(profil?.dogumTarihi ?? null) },
    {
      ikon: 'gender-male-female',
      etiket: 'Cinsiyet',
      deger: profil?.cinsiyet ? CINSIYET_AD[profil.cinsiyet] : null,
    },
  ];

  // Bayraklı: kapalıyken tek satır; başlığa dokununca panel açılır/kapanır.
  // gomulu (10 Ağu redesign): birleşik Profil kartının İÇİNDE — kendi kartı/başlığı yok,
  // hep açık; yalnız "KİŞİSEL BİLGİLER" etiketi + Düzenle + satırlar.
  const kapali = !gomulu && varsayilanGizli && !panelAcik;

  return (
    <View style={gomulu ? styles.gomuluBlok : styles.istatistikKart}>
      {gomulu ? (
        <View style={styles.gomuluBaslik}>
          <AppText variant="etiket" color="kartMetinIkincil" bold style={styles.gomuluBaslikAd}>
            KİŞİSEL BİLGİLER
          </AppText>
          {!isimYok ? (
            <Pressable hitSlop={10} onPress={duzenleAc} accessibilityRole="button" accessibilityLabel="Adını düzenle">
              <AppText variant="kucuk" color="altinParlak" bold>
                Düzenle
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
      <Pressable
        style={styles.kisiUst}
        disabled={!varsayilanGizli}
        onPress={() => setPanelAcik((v) => !v)}
        accessibilityRole={varsayilanGizli ? 'button' : undefined}
        accessibilityLabel="Kişisel bilgileri aç/kapat">
        <View style={styles.kisiAvatar}>
          <MaterialCommunityIcons name="account" size={28} color={Palette.altinParlak} />
        </View>
        <View style={styles.kisiAdBlok}>
          <AppText variant="govde" bold color="altinParlak" numberOfLines={1}>
            {adSoyad || 'Hesabım'}
          </AppText>
          <AppText variant="etiket" color="kartMetinIkincil">
            KİŞİSEL BİLGİLER
          </AppText>
        </View>
        {!isimYok && !kapali ? (
          <Pressable hitSlop={10} onPress={duzenleAc} accessibilityRole="button" accessibilityLabel="Adını düzenle">
            <AppText variant="kucuk" color="altinParlak" bold>
              Düzenle
            </AppText>
          </Pressable>
        ) : null}
        {varsayilanGizli ? (
          <MaterialCommunityIcons
            name={kapali ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={Palette.kartMetinIkincil}
          />
        ) : null}
      </Pressable>
      )}
      {kapali ? null : !profilHazir ? (
        <AppText variant="etiket" color="kartMetinIkincil">
          Yükleniyor…
        </AppText>
      ) : (
      <>

      {/* İsim yoksa (çoğunlukla Apple ile girenler) belirgin çağrı — belge/sicil/takip için gerekli. */}
      {isimYok ? (
        <Pressable
          onPress={duzenleAc}
          style={({ pressed }) => [styles.adCagri, pressed && styles.adCagriBasili]}
          accessibilityRole="button"
          accessibilityLabel="Ad ve soyadını gir">
          <MaterialCommunityIcons name="account-edit-outline" size={20} color={Palette.altinParlak} />
          <AppText variant="kucuk" color="beyaz" bold style={styles.adCagriMetin}>
            Ad ve soyadını gir — sicilin, takdir/başarı belgelerin ve kişisel takibin için.
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.kartMetinIkincil} />
        </Pressable>
      ) : null}

      <View style={styles.kisiAyrac} />
      {satirlar.map((s) => (
        <View key={s.etiket} style={styles.kisiSatir}>
          <MaterialCommunityIcons name={s.ikon} size={18} color={Palette.altinParlak} />
          <AppText variant="kucuk" color="kartMetinIkincil" style={styles.kisiEtiket}>
            {s.etiket}
          </AppText>
          <AppText variant="kucuk" bold color="beyaz" numberOfLines={1} style={styles.kisiDeger}>
            {varsayilanGizli && !bilgiGoster && s.deger ? '••••••••' : (s.deger ?? '—')}
          </AppText>
        </View>
      ))}
      {varsayilanGizli ? (
        <Pressable
          onPress={() => setBilgiGoster((v) => !v)}
          hitSlop={8}
          style={styles.bilgiGosterBtn}
          accessibilityRole="button"
          accessibilityLabel={bilgiGoster ? 'Bilgileri gizle' : 'Bilgileri göster'}>
          <MaterialCommunityIcons
            name={bilgiGoster ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={Palette.kartMetinIkincil}
          />
          <AppText variant="etiket" color="kartMetinIkincil" bold>
            {bilgiGoster ? 'Gizle' : 'Göster'}
          </AppText>
        </Pressable>
      ) : null}
      </>
      )}

      <Modal visible={duzenle} transparent animationType="fade" onRequestClose={() => setDuzenle(false)}>
        <View style={styles.adPerde}>
          <View style={styles.adKutu}>
            <MaterialCommunityIcons name="account-circle-outline" size={38} color={Palette.altinParlak} />
            <AppText variant="baslik" bold color="altinParlak" style={styles.adOrtali}>
              Ad ve Soyad
            </AppText>
            <AppText variant="kucuk" color="kartMetinIkincil" style={styles.adOrtali}>
              Belgende ve sicilinde görünecek. İstediğin zaman değiştirebilirsin.
            </AppText>
            <TextInput
              style={styles.adGirdi}
              value={adG}
              onChangeText={setAdG}
              placeholder="Ad"
              placeholderTextColor={Palette.solukMetin}
              autoCapitalize="words"
              maxLength={40}
              editable={!kaydediliyor}
            />
            <TextInput
              style={styles.adGirdi}
              value={soyadG}
              onChangeText={setSoyadG}
              placeholder="Soyad"
              placeholderTextColor={Palette.solukMetin}
              autoCapitalize="words"
              maxLength={40}
              editable={!kaydediliyor}
            />
            <View style={styles.adBtnSatir}>
              <Pressable
                style={({ pressed }) => [styles.adVazgec, pressed && styles.adCagriBasili]}
                onPress={() => setDuzenle(false)}
                disabled={kaydediliyor}>
                <AppText variant="govde" color="kartMetinIkincil" bold>
                  Vazgeç
                </AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.adKaydet, pressed && styles.adCagriBasili]}
                onPress={() => void adKaydet()}
                disabled={kaydediliyor}>
                {kaydediliyor ? (
                  <ActivityIndicator color={Palette.beyaz} />
                ) : (
                  <AppText variant="govde" color="beyaz" bold>
                    Kaydet
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Geri-bes emir uyarısı + sicil defteri (ödül/ceza kayıtları; tıkla → temsili metin). */
function SicilBolum({
  sicil,
  zayifSayisi,
  onGeriBes,
}: {
  sicil: SicilVeri | null;
  zayifSayisi: number;
  onGeriBes: () => void;
}) {
  // Bayraklı (başkan 10 Ağu): kırmızı emir kartı Evsaf'tan da kalkar — aynı işi
  // Karargah'taki altın "Bugünün Emri" yapıyor; burada sicil DEFTERİ kalır.
  const sadeEvsaf = useKisiselOzellik('talim-mevzuata');
  const router = useRouter();
  const [secili, setSecili] = useState<SicilKaydi | null>(null);
  if (sicil === null) {
    return (
      <AppText variant="kucuk" color="kartMetinIkincil">
        Yükleniyor…
      </AppText>
    );
  }
  const { kayitlar, durum } = sicil;
  // Emri yerine getirmek için KALAN SÜRE (gün) + süre dolunca gelecek ceza kademesi.
  const kalanGun = durum.sonTarih
    ? Math.max(
        0,
        Math.round(
          (Date.parse(`${durum.sonTarih}T00:00:00Z`) - Date.parse(`${bugunISO()}T00:00:00Z`)) /
            86400000,
        ),
      )
    : 0;
  const siradakiCeza = KADEME_AD[Math.min(durum.kademe + 1, KADEME_AD.length - 1)];
  // 10 Ağu SİCİL YENİLEME (sade mod): not + hedef + telafi + gruplanmış zaman çizelgesi.
  const oduller = kayitlar.filter((k) => k.tip === 'odul');
  const cezalar = kayitlar.filter((k) => k.tip === 'ceza');
  // Aynı derece+sebepli cezalar tek satırda toplanır ("Yazılı İkaz ×2") — kopyala-yapıştır hissi biter.
  const cezaGruplari = (() => {
    const m = new Map<string, { kayit: SicilKaydi; adet: number }>();
    for (const k of cezalar) {
      const anahtar = `${k.derece}|${k.sebep}`;
      const g = m.get(anahtar);
      if (!g) m.set(anahtar, { kayit: k, adet: 1 });
      else {
        g.adet += 1;
        if (k.tarih > g.kayit.tarih) g.kayit = k; // en yeni kayıt temsilci
      }
    }
    return [...m.values()];
  })();
  // TELAFİ (görünüm kuralı, kayda dokunmaz): cezalar geri-bes ihmalinden gelir; şu an
  // bekleyen zayıf yoksa görev kapatılmış demektir → cezalara "telafi edildi" damgası.
  const telafiEdildi = zayifSayisi === 0;

  function sicilSatiri(k: SicilKaydi, adet: number, damga: boolean) {
    const b = DERECE_BILGI[k.derece];
    const odulMu = k.tip === 'odul';
    return (
      <Pressable
        key={`${k.id}-${adet}`}
        onPress={() => setSecili(k)}
        accessibilityRole="button"
        accessibilityLabel={`${k.baslik} belgesini aç`}
        style={({ pressed }) => [styles.sicilSatir, pressed && styles.pressed]}>
        <View style={styles.sicilUst}>
          {sadeEvsaf ? (
            <View style={[styles.sicilNokta, odulMu ? styles.sicilNoktaOdul : styles.sicilNoktaCeza]}>
              <MaterialCommunityIcons
                name={odulMu ? 'medal' : b.ikon}
                size={16}
                color={odulMu ? Palette.altinKoyu : Palette[b.renk]}
              />
            </View>
          ) : (
            <MaterialCommunityIcons name={b.ikon} size={20} color={Palette[b.renk]} />
          )}
          <AppText variant="kucuk" bold style={styles.sicilAd} numberOfLines={1}>
            {k.baslik}
            {adet > 1 ? ` ×${adet}` : ''}
          </AppText>
          {damga ? (
            <View style={styles.telafiDamga}>
              <AppText variant="etiket" bold color="altinParlak">
                TELAFİ EDİLDİ
              </AppText>
            </View>
          ) : null}
          <AppText variant="etiket" color="kartMetinIkincil">
            {tarihFmt(k.tarih)}
          </AppText>
        </View>
        <View style={styles.sicilAltSatir}>
          <AppText variant="etiket" color="kartMetinIkincil" numberOfLines={1} style={styles.sicilSebep}>
            {k.sebep}
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.kartMetinIkincil} />
        </View>
      </Pressable>
    );
  }

  return (
    <>
      {sadeEvsaf ? null : (
        <GeriBeslemeEmri durum={durum} zayifSayisi={zayifSayisi} onBasla={onGeriBes} />
      )}

      {/* SİCİL NOTU + YOL GÖSTERME (sade mod) — defter pasif kalmasın, koçluk yapsın. */}
      {sadeEvsaf ? (
        <>
          {oduller.length === 0 ? (
            <Pressable
              onPress={() => router.push('/tatbikat')}
              style={({ pressed }) => [styles.sicilHedef, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Denemelere git">
              <MaterialCommunityIcons name="medal-outline" size={18} color={Palette.altinParlak} />
              <AppText variant="etiket" color="beyaz" style={styles.sicilHedefMetin}>
                🎖 İlk <AppText variant="etiket" bold color="altinParlak">Takdir Belgen</AppText> için:
                bir kanunun deneme sınavını tam puanla geç.
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.kartMetinIkincil} />
            </Pressable>
          ) : (
            <AppText variant="etiket" color="kartMetinIkincil">
              {TAKDIR_PER_BASARI - (oduller.length % TAKDIR_PER_BASARI)} takdir daha → Başarı Belgesi.
            </AppText>
          )}
          {cezalar.length > 0 && !telafiEdildi ? (
            <AppText variant="etiket" color="amber">
              Zayıflarını kapatırsan cezaların "telafi edildi" sayılır ve kademe yükselmez.
            </AppText>
          ) : null}
        </>
      ) : null}

      {kayitlar.length === 0 ? (
        <AppText variant="kucuk" color="kartMetinIkincil">
          Sicilin tertemiz. Mevzileri öğrendikçe takdir, ihmal edince ceza burada işlenir.
        </AppText>
      ) : sadeEvsaf ? (
        <>
          {oduller.map((k) => sicilSatiri(k, 1, false))}
          {cezaGruplari.map((g) => sicilSatiri(g.kayit, g.adet, telafiEdildi))}
        </>
      ) : (
        kayitlar.map((k) => sicilSatiri(k, 1, false))
      )}

      {/* Görsel belge modalı — kayda basınca tam sertifika/ceza yazısı. */}
      <Modal
        visible={secili !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSecili(null)}>
        <Pressable style={styles.modalKatman} onPress={() => setSecili(null)}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalIcerik}
            showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => {}}>
              {secili ? <SicilBelgesi kayit={secili} /> : null}
              <Pressable
                style={({ pressed }) => [styles.modalKapat, pressed && styles.pressed]}
                onPress={() => setSecili(null)}>
                <AppText variant="govde" bold color="beyaz">
                  Kapat
                </AppText>
              </Pressable>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Modal>
    </>
  );
}

/** Geri besleme havuzu: top-5 zayıf kart + özet + "Zayıfları çalış" (geri-bes oturumu). */
export function ZayifBolum({
  zayif,
  onCalis,
  karttanCalis,
}: {
  zayif: ZayifVeri | null;
  onCalis: () => void;
  /** Bayraklı (10 Ağu, ChatGPT fikri): satıra dokun → YALNIZ o maddeyi çalış (tek kart oturumu). */
  karttanCalis?: (lawId: number, cardId: number) => void;
}) {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  // Sade mod: kanun grupları katlanır; ilk grup açık başlar (10 Ağu).
  const [acikKanunlar, setAcikKanunlar] = useState<Set<number> | null>(null);
  if (zayif === null) {
    return (
      <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
        Yükleniyor…
      </AppText>
    );
  }
  if (zayif.ozet.toplamDeneme === 0) {
    return (
      <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
        Henüz yeterli veri yok — çalış veya quiz çöz, zayıf konuların burada toplanır.
      </AppText>
    );
  }
  if (zayif.liste.length === 0) {
    // Çalışılabilir zayıf yok — ama çalışılamayan (kilitli/inmemiş) zayıflar varsa DOĞRU yönlendir.
    // Kilitli kanunun mevzisi indirilemez → "indir" değil "üyeliğinle açılır" demeliyiz.
    if (zayif.kilitli > 0 || zayif.inebilir > 0) {
      return (
        <>
          {zayif.kilitli > 0 ? (
            <AppText variant="kucuk" color={gece ? 'altinParlak' : 'amber'}>
              {zayif.kilitli} zayıf mevzin, üyelik gerektiren kanunlarda. Üyeliğini aldığında bu
              mevziler açılır ve burada çalışabilirsin.
            </AppText>
          ) : null}
          {zayif.inebilir > 0 ? (
            <AppText variant="kucuk" color={gece ? 'altinParlak' : 'amber'}>
              {zayif.inebilir} zayıf mevzin, henüz indirilmemiş kanunlarda. Mevzuat'tan o kanunları
              indirince burada çalışabilirsin.
            </AppText>
          ) : null}
        </>
      );
    }
    // (10 Ağu) Boş durum kutlama + yönlendirme: kuru "yok" yerine sıradaki adım.
    if (karttanCalis) {
      return (
        <Pressable
          onPress={() => router.push('/tatbikat')}
          style={({ pressed }) => [styles.sicilHedef, gece && styles.istatistikKartGece, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Tatbikata git">
          <AppText variant="kucuk" color={gece ? 'beyaz' : 'anaMetin'} style={styles.sicilHedefMetin}>
            Tüm mevziler sağlam 🎖️ — Tatbikatta kendini dene.
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={16} color={gece ? Palette.kartMetinIkincil : Palette.solukMetin} />
        </Pressable>
      );
    }
    return (
      <AppText variant="kucuk" color="yesil" bold>
        Zayıf mevzin yok 🎖️
      </AppText>
    );
  }

  const ilk5 = zayif.liste.slice(0, 5);
  const kalan = zayif.liste.length - ilk5.length;
  // SADE mod (bayraklı; başkan 10 Ağu "amatör görünüyor"): kırmızı hap duvarı yok
  // (sessiz ×N), tek tip kaynak rozeti tekrarı yok (yalnız KARIŞIKSA gösterilir).
  const sade = !!karttanCalis;
  const karisik =
    ilk5.some((z) => z.kaynaklar.talim) && ilk5.some((z) => z.kaynaklar.tatbikat);

  if (sade) {
    // 10 Ağu Zayıf Mevziler yenilemesi: gelişim cümlesi + kanun bazlı katlanır gruplar +
    // her maddede kurtulma (X/2 ✓) ve bekleme süresi. Veriler zayifKartlar'dan — uydurma yok.
    const bugunMs = Date.parse(`${bugunISO()}T00:00:00Z`);
    const gunFarki = (t: string) =>
      Math.max(0, Math.round((bugunMs - Date.parse(`${t}T00:00:00Z`)) / 86400000));
    // Kanun grupları (liste zaten yanlış sayısına göre sıralı → grup içi sıra korunur).
    const gruplar = (() => {
      const m = new Map<number, { ad: string; liste: ZayifKart[] }>();
      for (const z of zayif.liste) {
        const g = m.get(z.card.law_id);
        if (g) g.liste.push(z);
        else m.set(z.card.law_id, { ad: z.card.law_ad, liste: [z] });
      }
      return [...m.entries()].sort((a, b) => b[1].liste.length - a[1].liste.length);
    })();
    const acik = acikKanunlar ?? new Set(gruplar.length > 0 ? [gruplar[0][0]] : []);
    const kapat = zayif.simdiki < zayif.haftaOnce;
    return (
      <>
        {kapat ? (
          <AppText variant="etiket" color={gece ? 'altinParlak' : 'altinMetin'} bold>
            Geçen hafta {zayif.haftaOnce} zayıftın, bugün {zayif.simdiki} —{' '}
            {zayif.haftaOnce - zayif.simdiki} mevzi kapattın 🎖️
          </AppText>
        ) : zayif.ozet.enZayifKanun ? (
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            En zayıf: {zayif.ozet.enZayifKanun}
          </AppText>
        ) : null}
        {gruplar.map(([lawId, g]) => (
          <View key={lawId} style={styles.zayifGrup}>
            <Pressable
              onPress={() => {
                const yeni = new Set(acik);
                if (yeni.has(lawId)) yeni.delete(lawId);
                else yeni.add(lawId);
                setAcikKanunlar(yeni);
              }}
              style={styles.zayifGrupBaslik}
              accessibilityRole="button"
              accessibilityLabel={`${g.ad} zayıflarını aç/kapat`}>
              <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'lacivert'} style={styles.zayifAd} numberOfLines={1}>
                {g.ad}
              </AppText>
              <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
                {g.liste.length} madde
              </AppText>
              <MaterialCommunityIcons
                name={acik.has(lawId) ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={gece ? Palette.kartMetinIkincil : Palette.solukMetin}
              />
            </Pressable>
            {acik.has(lawId)
              ? g.liste.map((z) => (
                  <Pressable
                    key={z.card.id}
                    onPress={() => karttanCalis?.(z.card.law_id, z.card.id)}
                    style={({ pressed }) => [styles.zayifMadde, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Bu maddeyi çalış">
                    <View style={styles.zayifMaddeUst}>
                      <AppText variant="kucuk" bold style={styles.zayifAd} numberOfLines={1}>
                        {maddeEtiket(z.card.madde_no, z.card.baslik)}
                      </AppText>
                      {/* Kurtulma: son 2 deneme iyi olunca havuzdan çıkar — kural aynı, artık GÖRÜNÜR. */}
                      <View style={[styles.kurtulma, z.ardisikIyi > 0 && styles.kurtulmaYakin]}>
                        <AppText
                          variant="etiket"
                          bold
                          color={z.ardisikIyi > 0 ? 'altinMetin' : 'solukMetin'}>
                          {z.ardisikIyi}/2 ✓
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.zayifMaddeAlt}>
                      <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} numberOfLines={1} style={styles.zayifAd}>
                        ×{z.yanlisSayisi}
                        {' · '}
                        {gunFarki(z.sonTarih) === 0
                          ? 'bugün denendi'
                          : gunFarki(z.sonTarih) === 1
                            ? 'dün denendi'
                            : `${gunFarki(z.sonTarih)} gündür bekliyor`}
                        {z.ardisikIyi === 1 ? ' · bir iyi deneme kaldı' : ''}
                      </AppText>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={gece ? Palette.kartMetinIkincil : Palette.solukMetin} />
                    </View>
                  </Pressable>
                ))
              : null}
          </View>
        ))}
        <Pressable
          style={({ pressed }) => [styles.zayifCalisBtn, pressed && styles.pressed]}
          onPress={onCalis}>
          <MaterialCommunityIcons name="target" size={18} color={Palette.beyaz} />
          <AppText variant="kucuk" color="beyaz" bold>
            Zayıfları güçlendir
          </AppText>
        </Pressable>
      </>
    );
  }

  return (
    <>
      {zayif.ozet.enZayifKanun ? (
        <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
          En zayıf: {zayif.ozet.enZayifKanun}
        </AppText>
      ) : null}
      {/* Eski (bayraksız) görünüm — satırlar tıklanmaz, karttanCalis bu dalda hiç gelmez. */}
      {ilk5.map((z) => (
        <View key={z.card.id} style={styles.zayifSatir}>
          <AppText variant="kucuk" bold style={styles.zayifAd} numberOfLines={1}>
            {maddeEtiket(z.card.madde_no, z.card.baslik)}
          </AppText>
          {/* Nereden zayıf düştü — Talim (çalışma/kanun sınavı) ve/veya Tatbikat (genel deneme).
              Sade modda yalnız kaynaklar KARIŞIKSA gösterilir (beş kez "Talim" tekrarı ucuz). */}
          {(!sade || karisik) && z.kaynaklar.tatbikat ? (
            <View style={[styles.kaynakRozet, styles.kaynakTatbikat]}>
              <AppText variant="etiket" color={gece ? 'altinParlak' : 'amber'} bold>
                Tatbikat
              </AppText>
            </View>
          ) : null}
          {(!sade || karisik) && z.kaynaklar.talim ? (
            <View style={[styles.kaynakRozet, styles.kaynakTalim]}>
              <AppText variant="etiket" color={gece ? 'altinParlak' : 'lacivert'} bold>
                Talim
              </AppText>
            </View>
          ) : null}
          {sade ? (
            <AppText variant="etiket" bold color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
              ×{z.yanlisSayisi}
            </AppText>
          ) : (
            <View style={styles.zayifRozet}>
              <AppText variant="etiket" color="beyaz" bold>
                {z.yanlisSayisi} yanlış
              </AppText>
            </View>
          )}
        </View>
      ))}
      {kalan > 0 ? (
        <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
          +{kalan} daha
        </AppText>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.zayifCalisBtn, pressed && styles.pressed]}
        onPress={onCalis}>
        <MaterialCommunityIcons name="target" size={18} color={Palette.beyaz} />
        <AppText variant="kucuk" color="beyaz" bold>
          Zayıfları çalış (geri-bes)
        </AppText>
      </Pressable>
    </>
  );
}

/** Bölüm başlığı + ⓘ; dokununca altında sade bilgilendirici metin açılır. */
function BolumBaslik({ baslik, bilgi }: { baslik: string; bilgi: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <Pressable
        style={styles.bolumBaslik}
        onPress={() => setAcik((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${baslik} — bilgi`}>
        <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold>
          {baslik}
        </AppText>
        <MaterialCommunityIcons
          name={acik ? 'information' : 'information-outline'}
          size={15}
          color={gece ? Palette.altinParlak : Palette.lacivert}
        />
      </Pressable>
      {acik ? (
        <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.bolumBilgi}>
          {bilgi}
        </AppText>
      ) : null}
    </>
  );
}

function Stat({
  deger,
  etiket,
  onPress,
  aktif,
}: {
  deger: string;
  etiket: string;
  onPress?: () => void;
  aktif?: boolean;
}) {
  const ic = (
    <>
      <AppText variant="baslik" bold>
        {deger}
      </AppText>
      <View style={styles.statEtiket}>
        <AppText variant="etiket" color={onPress ? 'lacivert' : 'solukMetin'} bold={!!onPress}>
          {etiket}
        </AppText>
        {onPress ? (
          <MaterialCommunityIcons
            name={aktif ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={gece ? Palette.altinParlak : Palette.lacivert}
          />
        ) : null}
      </View>
    </>
  );
  return onPress ? (
    <Pressable style={styles.stat} onPress={onPress} accessibilityRole="button">
      {ic}
    </Pressable>
  ) : (
    <View style={styles.stat}>{ic}</View>
  );
}

const styles = StyleSheet.create({
  istatistikKartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
    borderWidth: 1,
  },
  kategoriIkonGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
  },
  geceSolukYazi: {
    opacity: 0.88,
  },
  pressed: {
    opacity: 0.85,
  },
  istatistikKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  kisiUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  kisiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kisiAdBlok: {
    flex: 1,
    gap: Spacing.half,
  },
  bilgiGosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  kisiAyrac: {
    height: 1,
    backgroundColor: Palette.ayirici,
  },
  adCagri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    borderRadius: Radius.m,
    padding: Spacing.two,
  },
  adCagriBasili: { opacity: 0.85 },
  adCagriMetin: { flex: 1, lineHeight: 18 },
  adPerde: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  adKutu: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.l,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  adOrtali: { textAlign: 'center' },
  adGirdi: {
    width: '100%',
    backgroundColor: Palette.kremZemin,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: Palette.anaMetin,
    fontSize: 16,
  },
  adBtnSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.one,
  },
  adVazgec: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
  },
  adKaydet: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.m,
    backgroundColor: Palette.lacivert,
  },
  kisiSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kisiEtiket: {
    width: 96,
  },
  kisiDeger: {
    flex: 1,
    textAlign: 'right',
  },
  statSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bolumBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  bolumBilgi: {
    lineHeight: 17,
    backgroundColor: Palette.kremZemin,
    borderRadius: Radius.s,
    padding: Spacing.two,
  },
  zayifSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  // ASKERİ KÜNYE BANDI — lacivert kimlik kartı (Karargah geri sayımıyla aynı aile).
  kunye: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.altinKoyu,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  kunyeUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kunyeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Palette.altin,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kunyeAdBlok: {
    flex: 1,
    gap: 2,
  },
  kunyeGorevSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kunyeGorev: {
    flexShrink: 1,
    flex: 1,
  },
  kunyeMuhur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  kunyeAyrac: {
    height: 1,
    backgroundColor: Palette.altinKoyu,
    opacity: 0.5,
  },
  kunyeIstSatir: {
    flexDirection: 'row',
  },
  kunyeIst: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  gomuluBlok: {
    gap: Spacing.two,
  },
  gomuluBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gomuluBaslikAd: {
    flex: 1,
  },
  kategoriBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kategoriIkon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kategoriAd: {
    flex: 1,
    gap: 1,
  },
  zayifSekmelerSag: {
    alignItems: 'flex-end',
  },
  // 10 Ağu zayıf yenileme: kanun grupları + kurtulma rozeti + iki satırlı madde.
  zayifGrup: {
    borderColor: Palette.ayirici,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    gap: Spacing.one,
  },
  zayifGrupBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  zayifMadde: {
    gap: 2,
    paddingVertical: Spacing.one,
    borderTopColor: Palette.ayirici,
    borderTopWidth: 1,
  },
  zayifMaddeUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  zayifMaddeAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kurtulma: {
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  kurtulmaYakin: {
    borderColor: Palette.altinKoyu,
    backgroundColor: Palette.altinSolukYuzey,
  },
  // 10 Ağu sicil yenileme: zaman çizelgesi noktaları + telafi damgası + hedef satırı.
  sicilNokta: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sicilNoktaOdul: {
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
  },
  sicilNoktaCeza: {
    backgroundColor: Palette.kremZemin,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
  },
  telafiDamga: {
    borderWidth: 1,
    borderColor: Palette.altinKoyu,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  sicilHedef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  sicilHedefMetin: {
    flex: 1,
    flexShrink: 1,
  },
  // 10 Ağu redesign: altın CTA (Zayıf Konuları Çalış) + küçük yasal link.
  zayifCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.altin,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  yasalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  zayifBaslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  zayifSekmeler: {
    flexDirection: 'row',
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: 2,
    gap: 2,
  },
  zayifSekme: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.s,
  },
  zayifSekmeAktif: {
    backgroundColor: Palette.lacivert,
  },
  zayifAd: {
    flex: 1,
  },
  zayifRozet: {
    backgroundColor: Palette.kirmizi,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
  kaynakRozet: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
    borderWidth: 1,
  },
  kaynakTatbikat: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
  },
  kaynakTalim: {
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statEtiket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emirKart: {
    backgroundColor: Palette.kirmizi,
    borderRadius: Radius.s,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  emirUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  emirSure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
  emirButon: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.beyaz,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.s,
    marginTop: Spacing.half,
  },
  sicilSatir: {
    borderTopWidth: 1,
    borderTopColor: Palette.kenarlik,
    paddingTop: Spacing.two,
    gap: Spacing.half,
  },
  sicilUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sicilAd: {
    flex: 1,
  },
  sicilAltSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sicilSebep: {
    flex: 1,
  },
  modalKatman: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 0,
    maxHeight: '90%',
  },
  modalIcerik: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalKapat: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  zayifCalisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.s,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  planKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  planAd: {
    flex: 1,
  },
  demoSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.kenarlik,
    paddingTop: Spacing.two,
  },
  demoBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingVertical: Spacing.two,
  },
  resmiNot: {
    textAlign: 'center',
    marginTop: Spacing.two,
    lineHeight: 16,
  },
});
