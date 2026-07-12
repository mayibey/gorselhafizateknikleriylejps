import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { seedUret } from '@/lib/er-meydani-mantik';
import {
  type AcikOda,
  type KatilBilgi,
  type LigDurum,
  acikOdalar,
  ligDurum,
  ligEslesme,
  odaKur,
  odayaKatil,
  rumuzAyarla,
  rumuzGetir,
} from '@/lib/er-meydani';

const SORU_SECENEK = [5, 10, 15, 20];
const SURE_SECENEK = [10, 15, 20, 30];

/** ER MEYDANI — LOBİ. Takma ad + hızlı eşleş + oda kur (ayarlı) + açık odalar + kodla katıl + sıralama. */
export default function ErMeydaniScreen() {
  const router = useRouter();
  const [rumuz, setRumuz] = useState<string | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [duzenle, setDuzenle] = useState(false);
  const [odalar, setOdalar] = useState<AcikOda[] | null>(null);
  const [odaKurAcik, setOdaKurAcik] = useState(false);
  const [ligBilgi, setLigBilgi] = useState<LigDurum | null>(null);
  const [eslesiyor, setEslesiyor] = useState(false);

  const odalariYukle = useCallback(() => {
    void acikOdalar().then(setOdalar);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void rumuzGetir().then((r) => {
        if (iptal) return;
        setRumuz(r);
        setYuklendi(true);
      });
      void ligDurum().then((d) => {
        if (!iptal) setLigBilgi(d);
      });
      odalariYukle();
      return () => {
        iptal = true;
      };
    }, [odalariYukle]),
  );

  const playAktif = !!rumuz;

  const macaGit = useCallback(
    (p: { seed: number; mod: 'hizli' | 'arkadas'; soru?: number; sure?: number }) =>
      router.push({
        pathname: '/er-meydani-mac',
        params: {
          seed: String(p.seed),
          mod: p.mod,
          ...(p.soru ? { soru: String(p.soru) } : {}),
          ...(p.sure ? { sure: String(p.sure) } : {}),
        },
      }),
    [router],
  );

  function hizliEslesme() {
    if (!playAktif) return;
    macaGit({ seed: seedUret(), mod: 'hizli' });
  }

  // Dereceli maç: seviyeye yakın rakip bul (sunucu) → lig paramlarıyla maça git.
  async function dereceliMac() {
    if (!playAktif || eslesiyor) return;
    setEslesiyor(true);
    const e = await ligEslesme();
    setEslesiyor(false);
    if (!e) return;
    router.push({
      pathname: '/er-meydani-mac',
      params: {
        seed: String(e.seed),
        mod: 'lig',
        soru: '10',
        sure: '15',
        rakip_skor: String(e.rakip_skor),
        rakip_rating: String(e.rakip_rating),
        rakip_id: e.rakip_id ?? '',
        rakip_rumuz: e.rakip_rumuz,
      },
    });
  }

  function odayaGit(k: KatilBilgi) {
    macaGit({ seed: k.seed, mod: 'arkadas', soru: k.soru_sayisi, sure: k.sure_sn });
  }

  // Listeden katıl: seed liste'de yok (sızmasın diye) → önce sunucudan odanın seed'ini al.
  async function listedenKatil(o: AcikOda) {
    if (!playAktif) return;
    const bilgi = await odayaKatil(o.id, null);
    if (bilgi) odayaGit(bilgi);
    else odalariYukle(); // oda kapanmış olabilir → listeyi tazele
  }

  return (
    <Screen title="Er Meydanı" onGeri={() => router.back()} headerAltinCizgi>
      <View style={styles.girisKart}>
        <MaterialCommunityIcons name="sword-cross" size={30} color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="anaMetin" style={styles.girisMetin}>
          10 soru, tek rakip. En hızlı ve en doğru cevaplayan kazanır. Ücretsiz — arkadaşını çağır, meydana çık!
        </AppText>
      </View>

      {/* Takma ad */}
      {!yuklendi ? (
        <ActivityIndicator color={Palette.lacivert} style={styles.yukleniyor} />
      ) : rumuz && !duzenle ? (
        <View style={styles.rumuzOzet}>
          <MaterialCommunityIcons name="account-circle" size={22} color={Palette.lacivert} />
          <AppText variant="govde" color="anaMetin" bold style={styles.rumuzAd} numberOfLines={1}>
            {rumuz}
          </AppText>
          <Pressable hitSlop={10} onPress={() => setDuzenle(true)}>
            <AppText variant="kucuk" color="lacivert" bold>Değiştir</AppText>
          </Pressable>
        </View>
      ) : (
        <RumuzForm
          mevcut={rumuz}
          onKaydedildi={(yeni) => {
            setRumuz(yeni);
            setDuzenle(false);
          }}
          onVazgec={rumuz ? () => setDuzenle(false) : undefined}
        />
      )}

      {!playAktif && yuklendi ? (
        <AppText variant="kucuk" color="amber" bold style={styles.uyari}>
          Meydana çıkmadan önce bir takma ad seç (sıralamada bu görünecek).
        </AppText>
      ) : null}

      {/* Hızlı eşleş */}
      <Pressable
        disabled={!playAktif}
        onPress={hizliEslesme}
        style={({ pressed }) => [styles.anaBtn, !playAktif && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="flash" size={24} color={Palette.beyaz} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="beyaz" bold>Hızlı Eşleş</AppText>
          <AppText variant="etiket" color="beyaz">Hemen bir rakiple 10 soru (dereceye saymaz)</AppText>
        </View>
      </Pressable>

      {/* Dereceli maç (lig) — seviyeye yakın rakip, puan kazan/kaybet */}
      <Pressable
        disabled={!playAktif || eslesiyor}
        onPress={() => void dereceliMac()}
        style={({ pressed }) => [styles.ligBtn, (!playAktif || eslesiyor) && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="chevron-triple-up" size={26} color={Palette.altinKoyu} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Dereceli Maç</AppText>
          <AppText variant="etiket" color="altinMetin" bold>
            {eslesiyor
              ? 'Seviyene uygun rakip aranıyor…'
              : ligBilgi
                ? `${ligBilgi.kademe} · ${ligBilgi.puan} puan · ${ligBilgi.sira}. sıra`
                : 'Seviyene göre rakip · kazan puan al, kaybet puan ver'}
          </AppText>
        </View>
        {eslesiyor ? <ActivityIndicator color={Palette.altinKoyu} /> : null}
      </Pressable>

      {/* Oda kur (ayarlı) */}
      {odaKurAcik ? (
        <OdaKurPanel
          aktif={playAktif}
          onKapat={() => setOdaKurAcik(false)}
          onKuruldu={(k, kod) => {
            setOdaKurAcik(false);
            odalariYukle();
            void Share.share({
              message: `Seni Er Meydanı'na davet ediyorum! Oda kodu: ${kod} — Mevzu (JSPS Hazırlık) uygulamasında bu kodla ${k.soru_sayisi} soru / ${k.sure_sn} sn'lik maçta benimle yarış! 💪`,
            });
            odayaGit(k);
          }}
        />
      ) : (
        <Pressable
          disabled={!playAktif}
          onPress={() => setOdaKurAcik(true)}
          style={({ pressed }) => [styles.ikincilBtn, !playAktif && styles.pasif, pressed && styles.basili]}>
          <MaterialCommunityIcons name="plus-box" size={22} color={Palette.lacivert} />
          <View style={styles.btnMetin}>
            <AppText variant="govde" color="lacivert" bold>Oda Kur</AppText>
            <AppText variant="etiket" color="solukMetin">Soru sayısı ve süreyi sen seç, kodu paylaş</AppText>
          </View>
        </Pressable>
      )}

      <KodlaKatil
        aktif={playAktif}
        onKatil={(k) => odayaGit(k)}
      />

      {/* Açık odalar */}
      <View style={styles.odalarBaslik}>
        <MaterialCommunityIcons name="door-open" size={18} color={Palette.altinKoyu} />
        <AppText variant="etiket" color="solukMetin" bold>AÇIK ODALAR</AppText>
        <Pressable hitSlop={10} onPress={odalariYukle} style={styles.yenileBtn}>
          <MaterialCommunityIcons name="refresh" size={18} color={Palette.lacivert} />
        </Pressable>
      </View>
      {odalar === null ? (
        <ActivityIndicator color={Palette.lacivert} style={styles.yukleniyor} />
      ) : odalar.length === 0 ? (
        <AppText variant="kucuk" color="solukMetin" style={styles.bosOda}>
          Şu an açık oda yok. "Oda Kur" ile ilk odayı sen aç!
        </AppText>
      ) : (
        odalar.map((o) => (
          <View key={o.id} style={[styles.odaSatir, o.benimki && styles.odaBenim]}>
            <View style={styles.odaBilgi}>
              <AppText variant="govde" color="anaMetin" bold numberOfLines={1}>
                {o.kuran_rumuz}{o.benimki ? ' (senin odan)' : ''}
              </AppText>
              <AppText variant="etiket" color="solukMetin">
                {o.soru_sayisi} soru · {o.sure_sn} sn · kod {o.kod}
              </AppText>
            </View>
            {!o.benimki ? (
              <Pressable
                disabled={!playAktif}
                onPress={() => void listedenKatil(o)}
                style={({ pressed }) => [styles.katilBtn, !playAktif && styles.pasif, pressed && styles.basili]}>
                <AppText variant="kucuk" color="beyaz" bold>Katıl</AppText>
              </Pressable>
            ) : null}
          </View>
        ))
      )}

      <Pressable
        onPress={() => router.push('/er-meydani-siralama')}
        style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]}>
        <MaterialCommunityIcons name="podium-gold" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Haftalık Sıralama</AppText>
          <AppText variant="etiket" color="solukMetin">Zirveye kim oynuyor?</AppText>
        </View>
      </Pressable>

      <Pressable
        onPress={() => router.push('/er-meydani-lig')}
        style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]}>
        <MaterialCommunityIcons name="chevron-triple-up" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Lig Tablosu</AppText>
          <AppText variant="etiket" color="solukMetin">Dereceli sıralama · her ay sıfırlanır</AppText>
        </View>
      </Pressable>
    </Screen>
  );
}

function RumuzForm({
  mevcut,
  onKaydedildi,
  onVazgec,
}: {
  mevcut: string | null;
  onKaydedildi: (yeni: string) => void;
  onVazgec?: () => void;
}) {
  const [deger, setDeger] = useState(mevcut ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function kaydet() {
    const v = deger.trim();
    if (v.length < 3 || kaydediliyor) return;
    setKaydediliyor(true);
    setHata(null);
    const sonuc = await rumuzAyarla(v);
    setKaydediliyor(false);
    if (sonuc.ok) onKaydedildi(v);
    else setHata(sonuc.hata ?? 'Kaydedilemedi.');
  }

  return (
    <View style={styles.form}>
      <AppText variant="etiket" color="solukMetin" bold>TAKMA AD (SIRALAMADA GÖRÜNÜR)</AppText>
      <TextInput
        style={styles.girdi}
        value={deger}
        onChangeText={setDeger}
        placeholder="Örn. Şahin34"
        placeholderTextColor={Palette.solukMetin}
        maxLength={16}
        autoCapitalize="words"
        editable={!kaydediliyor}
      />
      {hata ? (
        <AppText variant="kucuk" color="kirmizi" bold>{hata}</AppText>
      ) : (
        <AppText variant="etiket" color="solukMetin">3-16 karakter · harf, rakam, boşluk</AppText>
      )}
      <View style={styles.btnSatir}>
        {onVazgec ? (
          <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={onVazgec}>
            <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
          </Pressable>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.kaydetBtn, (deger.trim().length < 3 || kaydediliyor) && styles.pasif, pressed && styles.basili]}
          disabled={deger.trim().length < 3 || kaydediliyor}
          onPress={() => void kaydet()}>
          {kaydediliyor ? <ActivityIndicator color={Palette.beyaz} /> : <AppText variant="govde" color="beyaz" bold>Kaydet</AppText>}
        </Pressable>
      </View>
    </View>
  );
}

function OdaKurPanel({
  aktif,
  onKapat,
  onKuruldu,
}: {
  aktif: boolean;
  onKapat: () => void;
  onKuruldu: (k: KatilBilgi, kod: string) => void;
}) {
  const [soru, setSoru] = useState(10);
  const [sure, setSure] = useState(15);
  const [kuruluyor, setKuruluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kur() {
    if (!aktif || kuruluyor) return;
    setKuruluyor(true);
    setHata(null);
    const sonuc = await odaKur(soru, sure);
    setKuruluyor(false);
    if (sonuc.ok && sonuc.oda) {
      onKuruldu(
        {
          seed: sonuc.oda.seed,
          soru_sayisi: sonuc.oda.soru_sayisi,
          sure_sn: sonuc.oda.sure_sn,
          havuz: 'ucretsiz',
          kuran_id: '',
          kuran_rumuz: '',
        },
        sonuc.oda.kod,
      );
    } else {
      setHata(sonuc.hata ?? 'Oda kurulamadı.');
    }
  }

  return (
    <View style={styles.form}>
      <AppText variant="etiket" color="solukMetin" bold>SORU SAYISI</AppText>
      <ChipSatir secenekler={SORU_SECENEK} secili={soru} onSec={setSoru} />
      <AppText variant="etiket" color="solukMetin" bold style={styles.aralik}>SORU BAŞINA SÜRE (SN)</AppText>
      <ChipSatir secenekler={SURE_SECENEK} secili={sure} onSec={setSure} />
      {hata ? <AppText variant="kucuk" color="kirmizi" bold style={styles.aralik}>{hata}</AppText> : null}
      <View style={styles.btnSatir}>
        <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={onKapat}>
          <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.kaydetBtn, (!aktif || kuruluyor) && styles.pasif, pressed && styles.basili]}
          disabled={!aktif || kuruluyor}
          onPress={() => void kur()}>
          {kuruluyor ? <ActivityIndicator color={Palette.beyaz} /> : <AppText variant="govde" color="beyaz" bold>Oda Oluştur</AppText>}
        </Pressable>
      </View>
    </View>
  );
}

function ChipSatir({ secenekler, secili, onSec }: { secenekler: number[]; secili: number; onSec: (n: number) => void }) {
  return (
    <View style={styles.chipSatir}>
      {secenekler.map((n) => (
        <Pressable
          key={n}
          onPress={() => onSec(n)}
          style={({ pressed }) => [styles.chip, secili === n && styles.chipSecili, pressed && styles.basili]}>
          <AppText variant="govde" color={secili === n ? 'beyaz' : 'lacivert'} bold>{n}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

function KodlaKatil({ aktif, onKatil }: { aktif: boolean; onKatil: (k: KatilBilgi) => void }) {
  const [ac, setAc] = useState(false);
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [araniyor, setAraniyor] = useState(false);

  if (!ac) {
    return (
      <Pressable
        disabled={!aktif}
        onPress={() => setAc(true)}
        style={({ pressed }) => [styles.ikincilBtn, !aktif && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="key-variant" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Kodla Katıl</AppText>
          <AppText variant="etiket" color="solukMetin">Arkadaşının oda kodunu gir</AppText>
        </View>
      </Pressable>
    );
  }

  async function katil() {
    const k = kod.trim();
    if (k.length === 0 || araniyor) return;
    setAraniyor(true);
    setHata(null);
    const bilgi = await odayaKatil(null, k);
    setAraniyor(false);
    if (bilgi) onKatil(bilgi);
    else setHata('Oda bulunamadı ya da kapandı.');
  }

  return (
    <View style={styles.form}>
      <AppText variant="etiket" color="solukMetin" bold>ARKADAŞININ ODA KODU</AppText>
      <TextInput
        style={styles.girdi}
        value={kod}
        onChangeText={(t) => {
          setKod(t);
          setHata(null);
        }}
        placeholder="Örn. B9E21C"
        placeholderTextColor={Palette.solukMetin}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!araniyor}
      />
      {hata ? <AppText variant="kucuk" color="kirmizi" bold>{hata}</AppText> : null}
      <View style={styles.btnSatir}>
        <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={() => setAc(false)}>
          <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.kaydetBtn, (kod.trim().length === 0 || araniyor) && styles.pasif, pressed && styles.basili]}
          disabled={kod.trim().length === 0 || araniyor}
          onPress={() => void katil()}>
          {araniyor ? <ActivityIndicator color={Palette.beyaz} /> : <AppText variant="govde" color="beyaz" bold>Katıl</AppText>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  girisKart: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.l, padding: Spacing.three,
  },
  girisMetin: { flex: 1, lineHeight: 21 },
  yukleniyor: { marginVertical: Spacing.three },
  rumuzOzet: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  rumuzAd: { flex: 1 },
  form: {
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three, gap: Spacing.two,
  },
  girdi: {
    backgroundColor: Palette.beyaz, borderColor: Palette.kenarlik, borderWidth: 1,
    borderRadius: Radius.m, padding: Spacing.three, fontSize: 16, color: Palette.anaMetin,
  },
  aralik: { marginTop: Spacing.one },
  chipSatir: { flexDirection: 'row', gap: Spacing.two },
  chip: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.kremZemin, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingVertical: Spacing.two,
  },
  chipSecili: { backgroundColor: Palette.lacivert, borderColor: Palette.lacivert },
  btnSatir: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  vazgecBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.kremZemin, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingVertical: Spacing.three,
  },
  kaydetBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, paddingVertical: Spacing.three,
  },
  uyari: { textAlign: 'center' },
  anaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, padding: Spacing.three,
  },
  ikincilBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  ligBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.altinSolukYuzey, borderWidth: 1, borderColor: Palette.altinKoyu,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  btnMetin: { flex: 1, gap: 2 },
  odalarBaslik: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  yenileBtn: { marginLeft: 'auto' },
  bosOda: { textAlign: 'center', paddingVertical: Spacing.three },
  odaSatir: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  odaBenim: { borderColor: Palette.altin, backgroundColor: Palette.altinSolukYuzey },
  odaBilgi: { flex: 1, gap: 2 },
  katilBtn: {
    backgroundColor: Palette.lacivert, borderRadius: Radius.m,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
  },
  pasif: { opacity: 0.45 },
  basili: { opacity: 0.85 },
});
