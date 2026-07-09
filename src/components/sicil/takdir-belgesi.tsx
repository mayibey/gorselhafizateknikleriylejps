/**
 * Sicil belgeleri — görsel/resmi belge kartı (antetli sertifika üslubu).
 *  - TakdirBelgesi: sınav %100 sonuç ekranında anında gösterilir (kanun adından metin üretir).
 *  - SicilBelgesi:  Evsaf'ta bir sicil kaydına (ödül/ceza) basınca tam belge olarak açılır.
 * Salt görsel (veri enjekte). Kayıt ayrıca sicil_kayitlari'na işlenir (lib/sicil-servis).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { SicilKaydi } from '@/db/schema';

type VurguRenk = 'altinKoyu' | 'kirmizi';
type BaslikRenk = 'lacivert' | 'kirmizi';

function tarihFmt(iso: string): string {
  const [y, a, g] = iso.split('-');
  return y && a && g ? `${g}.${a}.${y}` : iso;
}

// Türkçe-uyumlu büyük harf: i→İ, ı→I (JS toUpperCase 'i'→'I' yapıp "TAKDIR" üretiyordu).
function trUpper(s: string): string {
  return s.replace(/ı/g, 'I').replace(/i/g, 'İ').toUpperCase();
}

/** Ortak belge çerçevesi (antet + ikon + başlık + gövde + imza). */
function BelgeCerceve({
  ikon,
  vurgu,
  baslikRenk,
  baslik,
  govde,
  tarih,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  vurgu: VurguRenk;
  baslikRenk: BaslikRenk;
  baslik: string;
  govde: ReactNode;
  tarih: string;
}) {
  const vurguHex = Palette[vurgu];
  return (
    <View style={[styles.belge, { borderColor: vurguHex }]}>
      <View style={styles.icCerceve}>
        <View style={styles.celenk}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={vurguHex} />
          <MaterialCommunityIcons name={ikon} size={46} color={vurguHex} />
          <MaterialCommunityIcons name="star-four-points" size={14} color={vurguHex} />
        </View>
        <AppText variant="etiket" bold color={vurgu} style={styles.antet}>
          MEVZU · JSPS
        </AppText>
        <AppText variant="baslik" bold color={baslikRenk} style={styles.baslik}>
          {trUpper(baslik)}
        </AppText>
        <View style={[styles.ayrac, { backgroundColor: vurguHex }]} />
        <AppText variant="govde" color="anaMetin" style={styles.govde}>
          {govde}
        </AppText>
        <View style={styles.alt}>
          <AppText variant="etiket" color="solukMetin">
            {tarihFmt(tarih)}
          </AppText>
          <AppText variant="etiket" bold color="solukMetin">
            — Mevzu · JSPS
          </AppText>
        </View>
      </View>
    </View>
  );
}

/**
 * Sınav %100 → Takdir Belgesi (kanun adından metin üretir). `isim` verilirse belgede "Sn. Ad Soyad"
 * görünür (3. şahıs metin); yoksa isimsiz (2. şahıs "tarafınıza"). İsim onayı TakdirBelgeAlani'nde.
 */
export function TakdirBelgesi({ kanunAd, tarih, isim }: { kanunAd: string; tarih: string; isim?: string | null }) {
  return (
    <BelgeCerceve
      ikon="medal"
      vurgu="altinKoyu"
      baslikRenk="lacivert"
      baslik="Takdir Belgesi"
      tarih={tarih}
      govde={
        <>
          {isim ? (
            <>
              <AppText variant="govde" bold color="lacivert">
                Sn. {isim}
              </AppText>
              {'\n\n'}
            </>
          ) : null}
          <AppText variant="govde" bold color="lacivert">
            {kanunAd}
          </AppText>{' '}
          deneme sınavını{' '}
          <AppText variant="govde" bold color="altinKoyu">
            %100 doğrulukla
          </AppText>{' '}
          {isim
            ? 'tamamladığı için TAKDİR takdim edilmiştir'
            : 'tamamladığınız için tarafınıza TAKDİR takdim edilmiştir'}
          . Bu azim ve disiplin, birliğe örnektir.
        </>
      }
    />
  );
}

/** Evsaf'ta bir sicil kaydını (ödül/ceza) tam görsel belge olarak açar. */
export function SicilBelgesi({ kayit }: { kayit: SicilKaydi }) {
  const odul = kayit.tip === 'odul';
  // metin = "ANTET — BAŞLIK\n\n{gövde}\n\n— imza" → ortadaki gövdeyi al.
  const parcalar = kayit.metin.split('\n\n');
  const govde = parcalar.length >= 2 ? parcalar[1] : kayit.sebep;
  return (
    <BelgeCerceve
      ikon={odul ? 'medal' : 'shield-alert'}
      vurgu={odul ? 'altinKoyu' : 'kirmizi'}
      baslikRenk={odul ? 'lacivert' : 'kirmizi'}
      baslik={kayit.baslik}
      tarih={kayit.tarih}
      govde={govde}
    />
  );
}

const styles = StyleSheet.create({
  belge: {
    backgroundColor: Palette.kartKremi,
    borderWidth: 2,
    borderRadius: Radius.l,
    padding: Spacing.two,
  },
  icCerceve: {
    borderColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  celenk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  antet: {
    letterSpacing: 2,
    marginTop: Spacing.one,
  },
  baslik: {
    letterSpacing: 1,
    textAlign: 'center',
  },
  ayrac: {
    width: 60,
    height: 2,
    marginVertical: Spacing.one,
  },
  govde: {
    textAlign: 'center',
    lineHeight: 22,
  },
  alt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: Spacing.three,
  },
});
