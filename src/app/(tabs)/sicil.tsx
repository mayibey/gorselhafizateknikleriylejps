import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SicilBelgesi } from '@/components/sicil/takdir-belgesi';
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
import { type Cinsiyet, type Profil, profilGetir } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { maddeEtiket } from '@/lib/madde-etiket';
import { eksikOzet, type EksikOzet, type ZayifKart, zayifKartlar } from '@/lib/performans';
import { ornekKayitlar } from '@/lib/sicil';
import { degerlendirSicil } from '@/lib/sicil-servis';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, type Istatistik } from '@/lib/stats';

type ZayifVeri = { liste: ZayifKart[]; ozet: EksikOzet };
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
    // Zayıf analizi AYRI: hatası İLERLEME/KUTU DAĞILIMI'nı bozmaz.
    void Promise.all([getPerformans(), getAllCards()])
      .then(([perf, cards]) => setZayif({ liste: zayifKartlar(perf, cards), ozet: eksikOzet(perf, cards) }))
      .catch(() => setZayif(null));
    // Ödül/Ceza: önce değerlendir (yeni kayıt/ceza işle), sonra sicil + emir durumunu yükle. AYRI catch.
    void degerlendirSicil()
      .then(() => Promise.all([getSicilKayitlari(), getGeriBesDurum()]))
      .then(([kayitlar, durum]) => setSicil({ kayitlar, durum }))
      .catch(() => setSicil(null));
  }, []);

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

  return (
    <Screen title="Evsaf">
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

      <KisiselBilgiler />

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
          {/* İlerleme özeti */}
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

          {/* Zayıf Mevziler — geri besleme havuzu (son denemede zor/yanlış) */}
          <View style={styles.istatistikKart}>
            <AppText variant="etiket" color="solukMetin" bold>
              ZAYIF MEVZİLER
            </AppText>
            <ZayifBolum
              zayif={zayif}
              onCalis={() => router.push({ pathname: '/akis', params: { mod: 'zayif' } })}
            />
          </View>

          {/* Ödül-Ceza Sicili — takdir/başarı ödülleri + geri-bes ceza merdiveni */}
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
        </>
      )}

      {/* Resmî kurum bağlantısı reddi — mağaza impersonation riskine karşı görünür ibare. */}
      <AppText variant="etiket" color="solukMetin" style={styles.resmiNot}>
        {RESMI_BAGLANTI_YOK}
      </AppText>
    </Screen>
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
function KisiselBilgiler() {
  const { kullanici, hazir } = useAuth();
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    if (!kullanici) {
      setProfil(null);
      return;
    }
    void profilGetir().then(setProfil);
  }, [kullanici]);

  if (!hazir || !kullanici) return null; // üyelik kapalıysa gösterme

  const adSoyad = `${profil?.ad ?? ''} ${profil?.soyad ?? ''}`.trim();
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

  return (
    <View style={styles.istatistikKart}>
      <View style={styles.kisiUst}>
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
      </View>
      <View style={styles.kisiAyrac} />
      {satirlar.map((s) => (
        <View key={s.etiket} style={styles.kisiSatir}>
          <MaterialCommunityIcons name={s.ikon} size={18} color={Palette.altinKoyu} />
          <AppText variant="kucuk" color="solukMetin" style={styles.kisiEtiket}>
            {s.etiket}
          </AppText>
          <AppText variant="kucuk" bold color="anaMetin" numberOfLines={1} style={styles.kisiDeger}>
            {s.deger ?? '—'}
          </AppText>
        </View>
      ))}
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
      {durum.acik ? (
        <View style={styles.emirKart}>
          <View style={styles.emirUst}>
            <MaterialCommunityIcons name="bugle" size={18} color={Palette.beyaz} />
            <AppText variant="kucuk" color="beyaz" bold>
              GERİ BESLEME EĞİTİM EMRİ
            </AppText>
          </View>

          {/* Kalan süre — vurgulu geri sayım (motive + ceza uyarısı). */}
          <View style={styles.emirSure}>
            <MaterialCommunityIcons
              name={kalanGun === 0 ? 'alarm-light-outline' : 'timer-sand'}
              size={16}
              color={Palette.beyaz}
            />
            <AppText variant="kucuk" color="beyaz" bold>
              {kalanGun === 0
                ? 'Süren bugün doluyor — SON GÜN!'
                : `Görevi tamamlamak için ${kalanGun} gün kaldı`}
            </AppText>
          </View>

          <AppText variant="etiket" color="beyaz">
            Bu süre içinde {zayifSayisi} zayıf mevzini kapatmazsan{' '}
            <AppText variant="etiket" color="beyaz" bold>
              {siradakiCeza}
            </AppText>{' '}
            cezası alırsın. (Son tarih: {tarihFmt(durum.sonTarih ?? '')})
            {durum.kademe > 0 ? ` — Şu anki kademe: ${KADEME_AD[durum.kademe]}` : ''}
          </AppText>
          <Pressable
            style={({ pressed }) => [styles.emirButon, pressed && styles.pressed]}
            onPress={onGeriBes}>
            <AppText variant="etiket" color="kirmizi" bold>
              EĞİTİME BAŞLA
            </AppText>
          </Pressable>
        </View>
      ) : null}

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
function ZayifBolum({ zayif, onCalis }: { zayif: ZayifVeri | null; onCalis: () => void }) {
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
    return (
      <AppText variant="kucuk" color="yesil" bold>
        Zayıf mevzin yok 👏
      </AppText>
    );
  }

  const ilk5 = zayif.liste.slice(0, 5);
  const kalan = zayif.liste.length - ilk5.length;
  return (
    <>
      {zayif.ozet.enZayifKanun ? (
        <AppText variant="kucuk" color="solukMetin">
          En zayıf: {zayif.ozet.enZayifKanun}
        </AppText>
      ) : null}
      {ilk5.map((z) => (
        <View key={z.card.id} style={styles.zayifSatir}>
          <AppText variant="kucuk" bold style={styles.zayifAd} numberOfLines={1}>
            {maddeEtiket(z.card.madde_no, z.card.baslik)}
          </AppText>
          <View style={styles.zayifRozet}>
            <AppText variant="etiket" color="beyaz" bold>
              {z.yanlisSayisi} yanlış
            </AppText>
          </View>
        </View>
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
  kisiAyrac: {
    height: 1,
    backgroundColor: Palette.ayirici,
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
  zayifAd: {
    flex: 1,
  },
  zayifRozet: {
    backgroundColor: Palette.kirmizi,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
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
