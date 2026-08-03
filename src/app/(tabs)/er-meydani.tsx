import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';

import { KanunSecici } from '@/components/er-meydani/kanun-secici';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useBrans } from '@/lib/brans-context';
import { DUELLO_KANUNLAR, kullaniciKanunlari, seedUret } from '@/lib/er-meydani-mantik';
import {
  type AcikOda,
  type LigDurum,
  type Odam,
  type OdaBilgi,
  type OdaOnizle,
  acikOdalar,
  ligDurum,
  ligEslesme,
  odaDavetMetni,
  odaKur,
  odaOnizle,
  odalarim,
  odayaKatil,
  rumuzAyarla,
  rumuzGetir,
} from '@/lib/er-meydani';

const SORU_SECENEK = [5, 10, 15, 20];
const SURE_SECENEK = [20, 30, 45, 60];
const KANUN_AD = new Map(DUELLO_KANUNLAR.map((k) => [k.id, k.ad] as const));

/** Kanun id listesini okunur metne çevirir ("Karışık" ya da kanun adları). */
function kanunlarMetni(ids: number[]): string {
  if (!ids || ids.length === 0) return 'Karışık (tüm kanunlar)';
  return ids.map((id) => KANUN_AD.get(id) ?? `Kanun ${id}`).join(', ');
}

/** ER MEYDANI — LOBİ. Takma ad + hızlı eşleş + oda kur (ayarlı) + açık odalar + kodla katıl + sıralama. */
export default function ErMeydaniScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ katilKod?: string }>();
  const katilKodRef = useRef<string | null>(null);
  const [rumuz, setRumuz] = useState<string | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [duzenle, setDuzenle] = useState(false);
  const [odalar, setOdalar] = useState<AcikOda[] | null>(null);
  const [odaKurAcik, setOdaKurAcik] = useState(false);
  const [ligBilgi, setLigBilgi] = useState<LigDurum | null>(null);
  const [eslesiyor, setEslesiyor] = useState(false);
  const [benimOdalar, setBenimOdalar] = useState<Odam[]>([]);
  const { brans } = useBrans();
  const hizliScope = useMemo(() => kullaniciKanunlari(brans), [brans]);
  const [hizliAcik, setHizliAcik] = useState(false);
  const [hizliKanunlar, setHizliKanunlar] = useState<number[]>([]); // boş = karışık (kapsam)
  const [onayOda, setOnayOda] = useState<OdaOnizle | null>(null);
  const [katiliyor, setKatiliyor] = useState(false);

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
      void odalarim().then((o) => {
        if (!iptal) setBenimOdalar(o);
      });
      odalariYukle();
      return () => {
        iptal = true;
      };
    }, [odalariYukle]),
  );

  const playAktif = !!rumuz;

  // Derin bağlantı: mevzujsps.com/oda/KOD → lobiye katilKod ile gelir → katılım onayını aç.
  useEffect(() => {
    const kk = params.katilKod;
    if (kk && kk !== katilKodRef.current && playAktif) {
      katilKodRef.current = kk;
      void katilOnayIste(null, kk);
    }
    // katilOnayIste function declaration → hoisted; deps sade tutuldu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.katilKod, playAktif]);

  const macaGit = useCallback(
    (p: { seed: number; mod: 'hizli' | 'arkadas'; soru?: number; sure?: number; kanunlar?: number[] }) =>
      router.push({
        pathname: '/er-meydani-mac',
        params: {
          seed: String(p.seed),
          mod: p.mod,
          ...(p.soru ? { soru: String(p.soru) } : {}),
          ...(p.sure ? { sure: String(p.sure) } : {}),
          ...(p.kanunlar && p.kanunlar.length ? { kanun: p.kanunlar.join(',') } : {}),
        },
      }),
    [router],
  );

  function hizliEslesme() {
    if (!playAktif) return;
    setHizliAcik(true); // önce konu (kanun) seçtir, sonra sisteme karşı başlat
  }
  function hizliBasla() {
    // Seçim yoksa kullanıcının TÜM kapsamı (müşterek + branşı); tüm 135 kanun DEĞİL.
    const efektif = hizliKanunlar.length ? hizliKanunlar : [...hizliScope.musterek, ...hizliScope.brans].map((k) => k.id);
    setHizliAcik(false);
    // Hızlı eşleşmede soru başına süre 45 sn (başkan kararı, 2 Ağu). Oda modunda süre zaten
    // kurucunun seçimi; burada varsayılan 15 sn kısa geliyordu.
    macaGit({ seed: seedUret(), mod: 'hizli', sure: 45, kanunlar: efektif });
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
        sure: '60',
        rakip_skor: String(e.rakip_skor),
        rakip_rating: String(e.rakip_rating),
        rakip_id: e.rakip_id ?? '',
        rakip_rumuz: e.rakip_rumuz,
      },
    });
  }

  function beklemeOdasinaGit(odaId: string) {
    router.push({ pathname: '/er-meydani-oda', params: { oda: odaId } });
  }

  // Katılım onayı: önce ODAYI ÖNİZLE (ayar/konu/oyuncu) → onay ekranı → onaylayınca katıl → bekleme odası.
  async function katilOnayIste(odaId: string | null, kod: string | null) {
    if (!playAktif) return;
    const r = await odaOnizle(odaId, kod);
    if (r.ok && r.oda) setOnayOda(r.oda);
    else {
      // Ölü/kapalı oda linki çökmesin → duruma göre NET, dostça mesaj göster.
      const mesaj =
        r.hata === 'oda bulunamadı'
          ? 'Bu oda artık mevcut değil. Kurucu odayı kapatmış ya da kod yanlış olabilir.'
          : r.hata === 'oda kapandı'
            ? 'Bu oda kapanmış. Yeni bir oda açabilir ya da açık odalardan birine katılabilirsin.'
            : r.hata === 'oda dolu'
              ? 'Bu oda dolmuş (en fazla 5 kişi).'
              : r.hata === 'kendi odan'
                ? 'Bu zaten senin odan.'
                : (r.hata ?? 'Odaya katılınamadı. Bağlantını kontrol edip tekrar dene.');
      Alert.alert('Odaya katılınamadı', mesaj);
      odalariYukle();
    }
  }

  async function katilOnayla() {
    if (!onayOda || katiliyor) return;
    setKatiliyor(true);
    const k = await odayaKatil(onayOda.oda_id, null);
    setKatiliyor(false);
    const hedef = onayOda.oda_id;
    setOnayOda(null);
    if (k) beklemeOdasinaGit(hedef);
    else Alert.alert('Katılınamadı', 'Oda dolmuş ya da kapanmış olabilir.');
  }

  return (
    <Screen title="Er Meydanı" headerAltinCizgi>
      <View style={styles.girisKart}>
        <MaterialCommunityIcons name="sword-cross" size={30} color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="anaMetin" style={styles.girisMetin}>
          10 soru, tek rakip. En hızlı ve en doğru cevaplayan kazanır. Ücretsiz — arkadaşını çağır, meydana çık!
        </AppText>
      </View>

      {/* Takma ad yoksa: en üstte belirgin uyarı (butonlar pasif olduğu için kullanıcı neden
          bir şey olmadığını anlamıyordu → önce takma ad gir yönlendirmesi). */}
      {yuklendi && !playAktif ? (
        <View style={styles.rumuzUyariKart}>
          <MaterialCommunityIcons name="account-alert" size={24} color={Palette.kirmizi} />
          <View style={styles.rumuzUyariMetin}>
            <AppText variant="govde" color="anaMetin" bold>Önce takma adını gir</AppText>
            <AppText variant="kucuk" color="solukMetin">
              Oda kurmak, arkadaşını çağırmak ve rakip bulmak için aşağıya bir takma ad yazıp kaydet. Butonlar ondan sonra açılır.
            </AppText>
          </View>
          <MaterialCommunityIcons name="arrow-down" size={22} color={Palette.altinKoyu} />
        </View>
      ) : null}

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
        onPress={() => router.push('/dereceli-kuyruk')}
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
          onKuruldu={(oda) => {
            setOdaKurAcik(false);
            odalariYukle();
            void Share.share({
              message: odaDavetMetni(oda.kod),
            });
            // Kuran bekleme odasına gider; rakip gelince ikisi de maça girer.
            router.push({ pathname: '/er-meydani-oda', params: { oda: oda.id, kod: oda.kod } });
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

      <KodlaKatil aktif={playAktif} onKod={(kod) => void katilOnayIste(null, kod)} />

      {/* Odalarım — kuranın aktif odaları (geri dönmek için) */}
      {benimOdalar.length > 0 ? (
        <>
          <View style={styles.odalarBaslik}>
            <MaterialCommunityIcons name="door-closed" size={18} color={Palette.altinKoyu} />
            <AppText variant="etiket" color="solukMetin" bold>ODALARIM</AppText>
          </View>
          {benimOdalar.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => beklemeOdasinaGit(o.id)}
              style={({ pressed }) => [styles.odaSatir, styles.odaBenim, pressed && styles.basili]}>
              <View style={styles.odaBilgi}>
                <AppText variant="govde" color="anaMetin" bold numberOfLines={1}>
                  Kod {o.kod} · {Number(o.oyuncu_sayisi)} oyuncu
                </AppText>
                <AppText variant="etiket" color="solukMetin">
                  {o.soru_sayisi} soru · {o.sure_sn} sn · {o.durum === 'oynaniyor' ? 'başladı' : 'bekliyor'}
                </AppText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Palette.altinKoyu} />
            </Pressable>
          ))}
        </>
      ) : null}

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
              <AppText variant="etiket" color="solukMetin" numberOfLines={1}>
                {o.soru_sayisi} soru · {o.sure_sn} sn · {kanunlarMetni(o.kanunlar)}
              </AppText>
            </View>
            {!o.benimki ? (
              <Pressable
                disabled={!playAktif}
                onPress={() => void katilOnayIste(o.id, null)}
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

      <Pressable
        onPress={() => router.push('/er-meydani-gecmis')}
        style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]}>
        <MaterialCommunityIcons name="history" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Geçmiş Maçlar</AppText>
          <AppText variant="etiket" color="solukMetin">Tüm maçların · galibiyet, skor, tarih</AppText>
        </View>
      </Pressable>

      {/* Katılım onayı — konu/süre/oyuncu gör, onayla, katıl */}
      <Modal visible={onayOda != null} transparent animationType="fade" onRequestClose={() => setOnayOda(null)}>
        <View style={styles.modalKatman}>
          <View style={styles.modalKart}>
            <MaterialCommunityIcons name="sword-cross" size={34} color={Palette.altinKoyu} />
            <AppText variant="baslik" color="anaMetin" bold style={styles.mOrtali}>
              {onayOda?.kuran_rumuz} · Oda
            </AppText>
            <View style={styles.mBilgiSatir}>
              <MBilgi etiket="Soru" deger={`${onayOda?.soru_sayisi}`} />
              <MBilgi etiket="Süre" deger={`${onayOda?.sure_sn} sn`} />
              <MBilgi etiket="Oyuncu" deger={`${onayOda?.oyuncu_sayisi}/${onayOda?.max_oyuncu}`} />
            </View>
            <AppText variant="etiket" color="solukMetin" bold>KONULAR</AppText>
            <AppText variant="kucuk" color="anaMetin" style={styles.mOrtali}>
              {onayOda ? kanunlarMetni(onayOda.kanunlar) : ''}
            </AppText>
            <View style={styles.btnSatir}>
              <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={() => setOnayOda(null)}>
                <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.kaydetBtn, katiliyor && styles.pasif, pressed && styles.basili]}
                disabled={katiliyor}
                onPress={() => void katilOnayla()}>
                {katiliyor ? <ActivityIndicator color={Palette.beyaz} /> : <AppText variant="govde" color="beyaz" bold>Katıl ve Bekle</AppText>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hızlı eşleş — önce konu (kanun) seçimi (müşterek/branş), sonra sisteme karşı başla */}
      <Modal visible={hizliAcik} transparent animationType="slide" onRequestClose={() => setHizliAcik(false)}>
        <View style={styles.modalKatman}>
          <View style={styles.modalKartGenis}>
            <AppText variant="baslik" color="anaMetin" bold style={styles.mOrtali}>Hangi konulardan?</AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.mOrtali}>
              Seçmezsen müşterek + branşından karışık gelir.
            </AppText>
            <ScrollView style={styles.hizliListe} contentContainerStyle={styles.hizliListeIcerik}>
              <KanunSecici musterek={hizliScope.musterek} brans={hizliScope.brans} kanunlar={hizliKanunlar} setKanunlar={setHizliKanunlar} />
            </ScrollView>
            <View style={styles.btnSatir}>
              <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={() => setHizliAcik(false)}>
                <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.kaydetBtn, pressed && styles.basili]} onPress={hizliBasla}>
                <MaterialCommunityIcons name="flash" size={20} color={Palette.beyaz} />
                <AppText variant="govde" color="beyaz" bold>Başla</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function MBilgi({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <View style={styles.mBilgi}>
      <AppText variant="altBaslik" color="lacivert" bold>{deger}</AppText>
      <AppText variant="etiket" color="solukMetin">{etiket}</AppText>
    </View>
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
  onKuruldu: (oda: OdaBilgi) => void;
}) {
  const [soru, setSoru] = useState(10);
  const [sure, setSure] = useState(30);
  const [kanunlar, setKanunlar] = useState<number[]>([]); // boş = karışık (kullanıcının tüm kapsamı)
  const [kanunAcik, setKanunAcik] = useState(false);
  const [gizli, setGizli] = useState(false); // false = herkese açık · true = şifreli (sadece kodla)
  const [kuruluyor, setKuruluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const { brans } = useBrans();
  const { musterek, brans: bransKanunlar } = useMemo(() => kullaniciKanunlari(brans), [brans]);

  async function kur() {
    if (!aktif || kuruluyor) return;
    setKuruluyor(true);
    setHata(null);
    // "Karışık" (seçim yok) = kullanıcının TÜM kapsamı (müşterek + branşı); tüm 135 kanun DEĞİL.
    const efektif = kanunlar.length ? kanunlar : [...musterek, ...bransKanunlar].map((k) => k.id);
    const sonuc = await odaKur(soru, sure, efektif, gizli);
    setKuruluyor(false);
    if (sonuc.ok && sonuc.oda) {
      onKuruldu(sonuc.oda);
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

      <AppText variant="etiket" color="solukMetin" bold style={styles.aralik}>KANUNLAR (KONU)</AppText>
      <Pressable
        onPress={() => setKanunAcik((a) => !a)}
        style={({ pressed }) => [styles.kanunDropdown, pressed && styles.basili]}>
        <MaterialCommunityIcons name="format-list-checks" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" color="anaMetin" bold style={styles.kanunDropdownMetin} numberOfLines={1}>
          {kanunlar.length === 0 ? 'Karışık (müşterek + branşın)' : `${kanunlar.length} kanun seçili`}
        </AppText>
        <MaterialCommunityIcons name={kanunAcik ? 'chevron-up' : 'chevron-down'} size={20} color={Palette.solukMetin} />
      </Pressable>
      {kanunAcik ? (
        <KanunSecici musterek={musterek} brans={bransKanunlar} kanunlar={kanunlar} setKanunlar={setKanunlar} />
      ) : null}

      <AppText variant="etiket" color="solukMetin" bold style={styles.aralik}>ODA TİPİ</AppText>
      <View style={styles.tipSatir}>
        <Pressable
          onPress={() => setGizli(false)}
          style={({ pressed }) => [styles.tipChip, !gizli && styles.tipSecili, pressed && styles.basili]}>
          <MaterialCommunityIcons name="earth" size={16} color={!gizli ? Palette.beyaz : Palette.lacivert} />
          <AppText variant="kucuk" color={!gizli ? 'beyaz' : 'lacivert'} bold>Herkese Açık</AppText>
        </Pressable>
        <Pressable
          onPress={() => setGizli(true)}
          style={({ pressed }) => [styles.tipChip, gizli && styles.tipSecili, pressed && styles.basili]}>
          <MaterialCommunityIcons name="lock" size={16} color={gizli ? Palette.beyaz : Palette.lacivert} />
          <AppText variant="kucuk" color={gizli ? 'beyaz' : 'lacivert'} bold>Şifreli</AppText>
        </Pressable>
      </View>
      <AppText variant="etiket" color="solukMetin">
        {gizli
          ? 'Sadece kodu (davet linkini) gönderdiğin kişiler girebilir; açık listede görünmez.'
          : 'Açık odalar listesinde herkes görür ve katılabilir.'}
      </AppText>

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

function KodlaKatil({ aktif, onKod }: { aktif: boolean; onKod: (kod: string) => void }) {
  const [ac, setAc] = useState(false);
  const [kod, setKod] = useState('');

  if (!ac) {
    return (
      <Pressable
        disabled={!aktif}
        onPress={() => setAc(true)}
        style={({ pressed }) => [styles.ikincilBtn, !aktif && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="key-variant" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Kodla Katıl</AppText>
          <AppText variant="etiket" color="solukMetin">Arkadaşının 4 haneli oda kodunu gir</AppText>
        </View>
      </Pressable>
    );
  }

  function katil() {
    const k = kod.trim();
    if (k.length === 0) return;
    onKod(k); // parent önizler + onay ekranı gösterir
    setKod('');
    setAc(false);
  }

  return (
    <View style={styles.form}>
      <AppText variant="etiket" color="solukMetin" bold>ARKADAŞININ ODA KODU</AppText>
      <TextInput
        style={styles.girdi}
        value={kod}
        onChangeText={setKod}
        placeholder="Örn. 4271"
        placeholderTextColor={Palette.solukMetin}
        keyboardType="number-pad"
        maxLength={4}
        autoCorrect={false}
      />
      <View style={styles.btnSatir}>
        <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={() => setAc(false)}>
          <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.kaydetBtn, kod.trim().length === 0 && styles.pasif, pressed && styles.basili]}
          disabled={kod.trim().length === 0}
          onPress={katil}>
          <AppText variant="govde" color="beyaz" bold>Devam</AppText>
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
  tipSatir: { flexDirection: 'row', gap: Spacing.two },
  tipChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one,
    backgroundColor: Palette.kremZemin, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingVertical: Spacing.two,
  },
  tipSecili: { backgroundColor: Palette.lacivert, borderColor: Palette.lacivert },
  kanunRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.two, paddingHorizontal: Spacing.two, borderRadius: Radius.s,
  },
  kanunSecili: { backgroundColor: Palette.altinSolukYuzey },
  kanunAd: { flex: 1 },
  kanunDropdown: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  kanunDropdownMetin: { flex: 1 },
  kanunListe: {
    marginTop: Spacing.one, gap: 2,
    borderWidth: 1, borderColor: Palette.kenarlik, borderRadius: Radius.m, padding: Spacing.one,
  },
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
  rumuzUyariKart: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.l,
    borderWidth: 1.5, borderColor: Palette.kirmizi, padding: Spacing.three,
  },
  rumuzUyariMetin: { flex: 1, gap: 2 },
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
  modalKatman: {
    flex: 1, backgroundColor: 'rgba(11,31,58,0.55)', justifyContent: 'center', padding: Spacing.four,
  },
  modalKart: {
    backgroundColor: Palette.kartKremi, borderColor: Palette.kenarlik, borderWidth: 1,
    borderRadius: Radius.l, padding: Spacing.four, gap: Spacing.two, alignItems: 'center',
  },
  modalKartGenis: {
    backgroundColor: Palette.kartKremi, borderColor: Palette.kenarlik, borderWidth: 1,
    borderRadius: Radius.l, padding: Spacing.four, gap: Spacing.two, maxHeight: '85%',
  },
  hizliListe: { width: '100%', marginVertical: Spacing.two },
  hizliListeIcerik: { paddingBottom: Spacing.two },
  mOrtali: { textAlign: 'center' },
  mBilgiSatir: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: Spacing.one },
  mBilgi: { alignItems: 'center' },
});
