import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { eksikOzet, type EksikOzet, type ZayifKart, zayifKartlar } from '@/lib/performans';
import { ornekKayitlar } from '@/lib/sicil';
import { degerlendirSicil } from '@/lib/sicil-servis';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, type Istatistik, type KutuDagilimi, MAKS_KUTU, OGRENILDI_KUTU } from '@/lib/stats';

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
      .then(([studied, toplam]) => setIst(hesaplaIstatistik(studied, toplam)))
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
            <AppText variant="etiket" color="solukMetin" bold>
              İLERLEME
            </AppText>
            <View style={styles.statSatir}>
              <Stat deger={`${ist.calisilanKart}/${ist.toplamKart}`} etiket="Çalışılan" />
              <Stat deger={`${ist.ogrenilenKart}`} etiket="Öğrenilen" />
              <Stat deger={`%${ist.hazirlikYuzde}`} etiket="Hazırlık" />
            </View>
          </View>

          {/* Kutu dağılımı (Leitner) */}
          <View style={styles.istatistikKart}>
            <AppText variant="etiket" color="solukMetin" bold>
              KUTU DAĞILIMI
            </AppText>
            <KutuGrafik dagilim={ist.kutuDagilimi} />
            <AppText variant="etiket" color="solukMetin">
              Kutu {OGRENILDI_KUTU}+ = öğrenildi
            </AppText>
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
  const [acikId, setAcikId] = useState<number | null>(null);
  if (sicil === null) {
    return (
      <AppText variant="kucuk" color="solukMetin">
        Yükleniyor…
      </AppText>
    );
  }
  const { kayitlar, durum } = sicil;
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
          <AppText variant="etiket" color="beyaz">
            Son tarih {tarihFmt(durum.sonTarih ?? '')} — {zayifSayisi} zayıf mevzini bu süre içinde
            kapat.{durum.kademe > 0 ? ` (Sicil kademesi: ${KADEME_AD[durum.kademe]})` : ''}
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
          const acik = acikId === k.id;
          return (
            <Pressable
              key={k.id}
              onPress={() => setAcikId(acik ? null : k.id)}
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
              <AppText
                variant="etiket"
                color="solukMetin"
                numberOfLines={acik ? undefined : 1}
                style={acik ? styles.sicilMetin : undefined}>
                {acik ? k.metin : k.sebep}
              </AppText>
            </Pressable>
          );
        })
      )}
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
            {z.card.madde_no} — {z.card.baslik}
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

function Stat({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="baslik" bold>
        {deger}
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

/** Kutu 1..6 için basit dikey çubuk grafiği. Öğrenilen kutular (≥OGRENILDI_KUTU) yeşil. */
function KutuGrafik({ dagilim }: { dagilim: KutuDagilimi }) {
  const kutular = Array.from({ length: MAKS_KUTU }, (_, i) => i + 1);
  const maks = Math.max(1, ...kutular.map((k) => dagilim[k] ?? 0));

  return (
    <View style={styles.kutuSatir}>
      {kutular.map((k) => {
        const adet = dagilim[k] ?? 0;
        const yukseklik = adet === 0 ? 4 : Math.round((adet / maks) * 52) + 12;
        const ogrenildi = k >= OGRENILDI_KUTU;
        return (
          <View key={k} style={styles.kutuSutun}>
            <AppText variant="etiket" color="solukMetin">
              {adet}
            </AppText>
            <View style={styles.kutuRay}>
              <View
                style={[
                  styles.kutuBar,
                  {
                    height: yukseklik,
                    backgroundColor:
                      adet === 0 ? Palette.kenarlik : ogrenildi ? Palette.yesil : Palette.amber,
                  },
                ]}
              />
            </View>
            <AppText variant="etiket" color={ogrenildi ? 'yesil' : 'solukMetin'} bold>
              {k}
            </AppText>
          </View>
        );
      })}
    </View>
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
  statSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  kutuSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  kutuSutun: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  kutuRay: {
    height: 64,
    width: '60%',
    justifyContent: 'flex-end',
  },
  kutuBar: {
    width: '100%',
    borderRadius: Radius.s,
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
  sicilMetin: {
    marginTop: Spacing.one,
    lineHeight: 18,
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
