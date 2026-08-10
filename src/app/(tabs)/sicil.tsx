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
import { eksikOzet, type EksikOzet, type ZayifKart, zayifKartlar } from '@/lib/performans';
import { ornekKayitlar } from '@/lib/sicil';
import { degerlendirSicil } from '@/lib/sicil-servis';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, type Istatistik } from '@/lib/stats';
import { UyelikKarti } from '@/components/premium/uyelik-rozeti';
import { IstatistikKutulari } from '@/components/evsaf/karargah-tasinanlar';
import { useKisiselOzellik } from '@/lib/ozellik';

// liste = ÇALIŞILABİLİR (indirilmiş) zayıflar; kilitli = üyelik gerektiren kanunlarda (indirilemez);
// inebilir = erişilebilir ama henüz indirilmemiş (Mevzuat'tan inince çalışılır).
type ZayifVeri = { liste: ZayifKart[]; ozet: EksikOzet; kilitli: number; inebilir: number };
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
    void Promise.all([getPerformans(), getAllCards()])
      .then(([perf, cards]) => {
        const tum = zayifKartlar(perf, cards);
        // PREMIUM SIZINTI KAPISI: çalışılabilir zayıf listesi yalnız ERİŞİLEBİLİR kanunları içerir →
        // süresi biten kullanıcı premium bir zayıf mevzinin no+başlığını listede görmez. Kilitliler
        // aşağıda `disari`→`kilitli` sayacına düşer (zaten "üyelik gerek" uyarısı veriliyor). (Denetim.)
        const liste = calisilabilirZayifMevzi(tum).filter((z) =>
          kanunErisilebilir(kartKlasoru(z.card.gorsel_yolu), z.card.blok),
        );
        const calisSet = new Set(liste.map((z) => z.card.id));
        // Çalışılamayan (indirilmemiş) zayıfları kilit durumuna göre ayır: kilitli kanunun mevzisi
        // İNDİRİLEMEZ (üyelik gerek) → "indir" demek yanıltıcı; erişilebilir olan indirilebilir.
        const disari = tum.filter((z) => !calisSet.has(z.card.id));
        const kilitli = disari.filter(
          (z) => !kanunErisilebilir(kartKlasoru(z.card.gorsel_yolu), z.card.blok),
        ).length;
        setZayif({
          liste,
          ozet: eksikOzet(perf, cards),
          kilitli,
          inebilir: disari.length - kilitli,
        });
      })
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
      {karargahTasindi ? (
        <>
          <ProfilUyelikKarti />
          <IstatistikKutulari />
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
            <View style={styles.istatistikKart}>
              {/* 10 Ağu REDESIGN: sayfanın ana odağı — özet + en zayıf 3 + altın CTA
                  hep görünür; ok'a dokununca tam detay (sekmeler) açılır. */}
              <Pressable
                style={styles.kategoriBaslik}
                onPress={() => setZayifDetay((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Zayıf mevziler detayını aç/kapat">
                <View style={styles.kategoriIkon}>
                  <MaterialCommunityIcons name="target" size={22} color={Palette.lacivert} />
                </View>
                <View style={styles.kategoriAd}>
                  <AppText variant="govde" bold color="lacivert">
                    Zayıf Mevziler
                  </AppText>
                  <AppText variant="etiket" color="solukMetin">
                    {zayifN > 0 ? `${zayifN} konu tekrar bekliyor` : 'Tekrar bekleyen konu yok'}
                  </AppText>
                </View>
                <MaterialCommunityIcons
                  name={zayifDetay ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={Palette.solukMetin}
                />
              </Pressable>
              {zayif && zayif.liste.length > 0 ? (
                <>
                  {zayif.liste.slice(0, 3).map((z) => (
                    <Pressable
                      key={z.card.id}
                      onPress={() =>
                        router.push({
                          pathname: '/akis',
                          params: { lawId: String(z.card.law_id), kart: String(z.card.id) },
                        })
                      }
                      style={({ pressed }) => [styles.zayifSatir, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Bu maddeyi çalış">
                      <AppText variant="kucuk" bold color="anaMetin" style={styles.zayifAd} numberOfLines={1}>
                        {maddeEtiket(z.card.madde_no, z.card.baslik)}
                      </AppText>
                      <AppText variant="etiket" bold color="solukMetin">
                        ×{z.yanlisSayisi}
                      </AppText>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
                    </Pressable>
                  ))}
                  <Pressable
                    style={({ pressed }) => [styles.zayifCta, pressed && styles.pressed]}
                    onPress={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
                    accessibilityRole="button"
                    accessibilityLabel="Zayıf konuları çalış">
                    <MaterialCommunityIcons name="book-open-variant" size={18} color={Palette.lacivert} />
                    <AppText variant="kucuk" bold color="lacivert">
                      Zayıf Konuları Çalış
                    </AppText>
                  </Pressable>
                </>
              ) : (
                <AppText variant="kucuk" color="solukMetin">
                  Henüz zayıf mevzu bulunmuyor.
                </AppText>
              )}
              {zayifDetay ? (
              <>
              <View style={styles.zayifSekmelerSag}>
                <View style={styles.zayifSekmeler}>
                  {(['denemeler', 'oyunlar'] as const).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setZayifSekme(s)}
                      style={[styles.zayifSekme, zayifSekme === s && styles.zayifSekmeAktif]}
                      accessibilityRole="button">
                      <AppText
                        variant="etiket"
                        bold
                        color={zayifSekme === s ? 'beyaz' : 'solukMetin'}>
                        {s === 'denemeler' ? 'Denemeler' : 'Oyunlar'}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
              {zayifSekme === 'denemeler' ? (
                <ZayifBolum
                  zayif={zayif}
                  onCalis={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
                  karttanCalis={(lawId, cardId) =>
                    router.push({
                      pathname: '/akis',
                      params: { lawId: String(lawId), kart: String(cardId) },
                    })
                  }
                />
              ) : (
                <OyunZayiflari
                  karttanCalis={(lawId, cardId) =>
                    router.push({
                      pathname: '/akis',
                      params: { lawId: String(lawId), kart: String(cardId) },
                    })
                  }
                />
              )}
              </>
              ) : null}
            </View>
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

          {/* Ödül-Ceza Sicili — takdir/başarı ödülleri + geri-bes ceza merdiveni.
              Bayraklıda kategori (dokun → açılır). */}
          {karargahTasindi ? (
            <EvsafKategori
              ikon="medal-outline"
              baslik="Ödül-Ceza Sicili"
              altYazi={
                sicil && sicil.kayitlar.length > 0
                  ? `Toplam ${sicil.kayitlar.filter((k) => k.tip === 'odul').length} ödül · ${sicil.kayitlar.filter((k) => k.tip === 'ceza').length} ceza`
                  : 'Kayıt yok'
              }>
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

// --- Profil + Üyelik BİRLEŞİK özet kartı (10 Ağu redesign: iki kart → tek kart) ---
// Veri: ad profiles'tan (profilGetir), üyelik useUyelik.aktifHaklar'dan — hard-code YOK.
// Dokununca mevcut kişisel bilgi (maskeli alanlar + ad düzenleme) ve üyelik detayı açılır.

function ProfilUyelikKarti() {
  const { kullanici, hazir } = useAuth();
  const { aktifHaklar } = useUyelik();
  const [adSoyad, setAdSoyad] = useState('');
  const [acik, setAcik] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      if (!kullanici) {
        setAdSoyad('');
        return;
      }
      void profilGetir().then((p) => {
        if (!iptal) setAdSoyad(`${p?.ad ?? ''} ${p?.soyad ?? ''}`.trim());
      });
      return () => {
        iptal = true;
      };
    }, [kullanici]),
  );

  if (!hazir || !kullanici) return null;
  const uyelikOzet =
    aktifHaklar.length > 0
      ? aktifHaklar
          .map((h) => {
            const b = urunBilgi(h.urun);
            return `${b ? b.ad : h.urun} · ${h.tip === 'abonelik' ? 'Yıllık' : 'Ömür Boyu'}`;
          })
          .join(' · ')
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
          <KisiselBilgiler gomulu />
          <View style={styles.kisiAyrac} />
          <UyelikKarti gomulu />
        </>
      ) : null}
    </View>
  );
}

// --- Evsaf Kategorisi (başkan 10 Ağu: "alanlar kategori kategori, tıklayınca aşağı açılsın") ---

function EvsafKategori({
  ikon,
  baslik,
  altYazi,
  children,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  altYazi?: string;
  children: ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <View style={styles.istatistikKart}>
      <Pressable
        style={styles.kategoriBaslik}
        onPress={() => setAcik((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${baslik} bölümünü aç/kapat`}>
        <View style={styles.kategoriIkon}>
          <MaterialCommunityIcons name={ikon} size={22} color={Palette.lacivert} />
        </View>
        <View style={styles.kategoriAd}>
          <AppText variant="govde" bold color="lacivert" numberOfLines={1}>
            {baslik}
          </AppText>
          {altYazi ? (
            <AppText variant="etiket" color="solukMetin" numberOfLines={1}>
              {altYazi}
            </AppText>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={acik ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={Palette.solukMetin}
        />
      </Pressable>
      {acik ? children : null}
    </View>
  );
}

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

function OyunZayiflari({ karttanCalis }: { karttanCalis: (lawId: number, cardId: number) => void }) {
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
      <AppText variant="kucuk" color="solukMetin">
        Yükleniyor…
      </AppText>
    );
  }
  if (liste.length === 0 && merkez.length === 0) {
    return (
      <AppText variant="kucuk" color="solukMetin">
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
          <AppText variant="etiket" color="solukMetin" bold>
            OYUN MERKEZİ
          </AppText>
          <AppText variant="kucuk" color="anaMetin">
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
                color={Palette.altinKoyu}
              />
              <AppText variant="kucuk" bold color="lacivert" style={styles.zayifAd} numberOfLines={1}>
                {z.kart ? maddeEtiket(z.kart.madde_no, z.kart.baslik) : z.ref}
              </AppText>
              <AppText variant="etiket" bold color="solukMetin">
                ×{z.yanlis}
              </AppText>
              {z.kart ? (
                <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
              ) : null}
            </Pressable>
          ))}
        </>
      ) : null}
      {liste.length > 0 ? (
        <>
          <AppText variant="etiket" color="solukMetin" bold>
            ER MEYDANI
          </AppText>
          <AppText variant="kucuk" color="anaMetin">
            Maçlarda en çok bu konularda yanlış yaptın (dokun → maddeler):
          </AppText>
          {liste.slice(0, 6).map((z) => (
            <Pressable
              key={z.kanun}
              onPress={() => detayGoster(z.kanun)}
              style={({ pressed }) => [styles.zayifSatir, pressed && styles.pressed]}
              accessibilityRole="button">
              <MaterialCommunityIcons name="book-alert-outline" size={16} color={Palette.altinKoyu} />
              <AppText variant="kucuk" bold color="lacivert" style={styles.zayifAd} numberOfLines={1}>
                {OYUN_KANUN_AD.get(z.kanun) ?? `Kanun ${z.kanun}`}
              </AppText>
              <AppText variant="etiket" bold color="solukMetin">
                ×{z.yanlis}
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
            </Pressable>
          ))}
          {liste.length > 6 ? (
            <AppText variant="etiket" color="solukMetin">
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
function KisiselBilgiler({ gomulu }: { gomulu?: boolean } = {}) {
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
  // sönüyordu — profil async geldiği için isimYok ilk karede yanlış hesaplanıyordu).
  const [profilHazir, setProfilHazir] = useState(false);
  useEffect(() => {
    if (!kullanici) {
      setProfil(null);
      setProfilHazir(false);
      return;
    }
    setProfilHazir(false);
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
          <AppText variant="etiket" color="solukMetin" bold style={styles.gomuluBaslikAd}>
            KİŞİSEL BİLGİLER
          </AppText>
          {!isimYok ? (
            <Pressable hitSlop={10} onPress={duzenleAc} accessibilityRole="button" accessibilityLabel="Adını düzenle">
              <AppText variant="kucuk" color="lacivert" bold>
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
          <MaterialCommunityIcons name="account" size={28} color={Palette.lacivert} />
        </View>
        <View style={styles.kisiAdBlok}>
          <AppText variant="govde" bold color="lacivert" numberOfLines={1}>
            {adSoyad || 'Hesabım'}
          </AppText>
          <AppText variant="etiket" color="solukMetin">
            KİŞİSEL BİLGİLER
          </AppText>
        </View>
        {!isimYok && !kapali ? (
          <Pressable hitSlop={10} onPress={duzenleAc} accessibilityRole="button" accessibilityLabel="Adını düzenle">
            <AppText variant="kucuk" color="lacivert" bold>
              Düzenle
            </AppText>
          </Pressable>
        ) : null}
        {varsayilanGizli ? (
          <MaterialCommunityIcons
            name={kapali ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={Palette.solukMetin}
          />
        ) : null}
      </Pressable>
      )}
      {kapali ? null : !profilHazir ? (
        <AppText variant="etiket" color="solukMetin">
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
          <MaterialCommunityIcons name="account-edit-outline" size={20} color={Palette.altinKoyu} />
          <AppText variant="kucuk" color="anaMetin" bold style={styles.adCagriMetin}>
            Ad ve soyadını gir — sicilin, takdir/başarı belgelerin ve kişisel takibin için.
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
        </Pressable>
      ) : null}

      <View style={styles.kisiAyrac} />
      {satirlar.map((s) => (
        <View key={s.etiket} style={styles.kisiSatir}>
          <MaterialCommunityIcons name={s.ikon} size={18} color={Palette.altinKoyu} />
          <AppText variant="kucuk" color="solukMetin" style={styles.kisiEtiket}>
            {s.etiket}
          </AppText>
          <AppText variant="kucuk" bold color="anaMetin" numberOfLines={1} style={styles.kisiDeger}>
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
            color={Palette.solukMetin}
          />
          <AppText variant="etiket" color="solukMetin" bold>
            {bilgiGoster ? 'Gizle' : 'Göster'}
          </AppText>
        </Pressable>
      ) : null}
      </>
      )}

      <Modal visible={duzenle} transparent animationType="fade" onRequestClose={() => setDuzenle(false)}>
        <View style={styles.adPerde}>
          <View style={styles.adKutu}>
            <MaterialCommunityIcons name="account-circle-outline" size={38} color={Palette.altinKoyu} />
            <AppText variant="baslik" bold color="lacivert" style={styles.adOrtali}>
              Ad ve Soyad
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.adOrtali}>
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
                <AppText variant="govde" color="solukMetin" bold>
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
  const [secili, setSecili] = useState<SicilKaydi | null>(null);
  if (sicil === null) {
    return (
      <AppText variant="kucuk" color="solukMetin">
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
  return (
    <>
      {sadeEvsaf ? null : (
        <GeriBeslemeEmri durum={durum} zayifSayisi={zayifSayisi} onBasla={onGeriBes} />
      )}


      {kayitlar.length === 0 ? (
        <AppText variant="kucuk" color="solukMetin">
          Sicilin tertemiz. Mevzileri öğrendikçe takdir, ihmal edince ceza burada işlenir.
        </AppText>
      ) : (
        kayitlar.map((k) => {
          const b = DERECE_BILGI[k.derece];
          return (
            <Pressable
              key={k.id}
              onPress={() => setSecili(k)}
              accessibilityRole="button"
              accessibilityLabel={`${k.baslik} belgesini aç`}
              style={({ pressed }) => [styles.sicilSatir, pressed && styles.pressed]}>
              <View style={styles.sicilUst}>
                <MaterialCommunityIcons name={b.ikon} size={20} color={Palette[b.renk]} />
                <AppText variant="kucuk" bold style={styles.sicilAd} numberOfLines={1}>
                  {k.baslik}
                </AppText>
                <AppText variant="etiket" color="solukMetin">
                  {tarihFmt(k.tarih)}
                </AppText>
              </View>
              <View style={styles.sicilAltSatir}>
                <AppText variant="etiket" color="solukMetin" numberOfLines={1} style={styles.sicilSebep}>
                  {k.sebep}
                </AppText>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
              </View>
            </Pressable>
          );
        })
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
function ZayifBolum({
  zayif,
  onCalis,
  karttanCalis,
}: {
  zayif: ZayifVeri | null;
  onCalis: () => void;
  /** Bayraklı (10 Ağu, ChatGPT fikri): satıra dokun → YALNIZ o maddeyi çalış (tek kart oturumu). */
  karttanCalis?: (lawId: number, cardId: number) => void;
}) {
  if (zayif === null) {
    return (
      <AppText variant="kucuk" color="solukMetin">
        Yükleniyor…
      </AppText>
    );
  }
  if (zayif.ozet.toplamDeneme === 0) {
    return (
      <AppText variant="kucuk" color="solukMetin">
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
            <AppText variant="kucuk" color="amber">
              {zayif.kilitli} zayıf mevzin, üyelik gerektiren kanunlarda. Üyeliğini aldığında bu
              mevziler açılır ve burada çalışabilirsin.
            </AppText>
          ) : null}
          {zayif.inebilir > 0 ? (
            <AppText variant="kucuk" color="amber">
              {zayif.inebilir} zayıf mevzin, henüz indirilmemiş kanunlarda. Mevzuat'tan o kanunları
              indirince burada çalışabilirsin.
            </AppText>
          ) : null}
        </>
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
  return (
    <>
      {zayif.ozet.enZayifKanun ? (
        <AppText variant="kucuk" color="solukMetin">
          En zayıf: {zayif.ozet.enZayifKanun}
        </AppText>
      ) : null}
      {ilk5.map((z) => (
        <Pressable
          key={z.card.id}
          disabled={!karttanCalis}
          onPress={() => karttanCalis?.(z.card.law_id, z.card.id)}
          style={({ pressed }) => [styles.zayifSatir, pressed && styles.pressed]}
          accessibilityRole={karttanCalis ? 'button' : undefined}
          accessibilityLabel={karttanCalis ? 'Bu maddeyi çalış' : undefined}>
          <AppText variant="kucuk" bold style={styles.zayifAd} numberOfLines={1}>
            {maddeEtiket(z.card.madde_no, z.card.baslik)}
          </AppText>
          {/* Nereden zayıf düştü — Talim (çalışma/kanun sınavı) ve/veya Tatbikat (genel deneme).
              Sade modda yalnız kaynaklar KARIŞIKSA gösterilir (beş kez "Talim" tekrarı ucuz). */}
          {(!sade || karisik) && z.kaynaklar.tatbikat ? (
            <View style={[styles.kaynakRozet, styles.kaynakTatbikat]}>
              <AppText variant="etiket" color="amber" bold>
                Tatbikat
              </AppText>
            </View>
          ) : null}
          {(!sade || karisik) && z.kaynaklar.talim ? (
            <View style={[styles.kaynakRozet, styles.kaynakTalim]}>
              <AppText variant="etiket" color="lacivert" bold>
                Talim
              </AppText>
            </View>
          ) : null}
          {sade ? (
            <AppText variant="etiket" bold color="solukMetin">
              ×{z.yanlisSayisi}
            </AppText>
          ) : (
            <View style={styles.zayifRozet}>
              <AppText variant="etiket" color="beyaz" bold>
                {z.yanlisSayisi} yanlış
              </AppText>
            </View>
          )}
          {karttanCalis ? (
            <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.solukMetin} />
          ) : null}
        </Pressable>
      ))}
      {kalan > 0 ? (
        <AppText variant="etiket" color="solukMetin">
          +{kalan} daha
        </AppText>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.zayifCalisBtn, pressed && styles.pressed]}
        onPress={onCalis}>
        <MaterialCommunityIcons name="target" size={18} color={Palette.beyaz} />
        <AppText variant="kucuk" color="beyaz" bold>
          {sade ? 'Zayıfları güçlendir' : 'Zayıfları çalış (geri-bes)'}
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
        <AppText variant="etiket" color="solukMetin" bold>
          {baslik}
        </AppText>
        <MaterialCommunityIcons
          name={acik ? 'information' : 'information-outline'}
          size={15}
          color={Palette.lacivert}
        />
      </Pressable>
      {acik ? (
        <AppText variant="etiket" color="solukMetin" style={styles.bolumBilgi}>
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
            color={Palette.lacivert}
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
