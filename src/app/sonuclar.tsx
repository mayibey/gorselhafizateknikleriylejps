/**
 * SONUÇLAR — çözülen denemelerin kalıcı kaydı + puan sıralaması.
 *
 * Başkan (23 Ağu 2026): "genel deneme sınavı sonuçlarını düzgünce tut; kullanıcı hangi
 * kanun maddesinde yanlış yapmış, kaç puan almış deneme bitiminde görebilsin, sonuçlar
 * bölümü olsun orada kalsın, istediği zaman bakabilsin. Hatta puan sıralama tablosu yap."
 *
 * İKİ SEKME
 *   SONUÇLARIM — çözdüğün her deneme: puan, yüzde, süre, tarih. Satıra dokununca
 *                YANLIŞLARIN TAMAMI açılır: hangi kanun/madde, senin cevabın, doğrusu,
 *                açıklaması. Kayıt CİHAZDA durur (internet gerekmez) ve ayrıca sunucuya
 *                gönderilir.
 *   SIRALAMA    — her deneme için ilk 50 (kişi başına en iyi puan). Sunucudaki
 *                deneme_siralama() yalnız ad + puan döndürür; e-posta/kimlik sızmaz.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  kendiSiram,
  siralamaGetir,
  sonuclariOku,
  type DenemeSonuc,
  type DenemeTakim,
  type SiraSatiri,
} from '@/lib/deneme-servis';
import { useKisiselOzellik } from '@/lib/ozellik';
import { soruBicimle } from '@/lib/soru-bicim';

const TAKIM_AD: Record<DenemeTakim, string> = {
  musterek: 'Müşterek Konular',
  brans: 'Branş',
  karma: 'Genel',
};

const tarihYaz = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const sureYaz = (sn: number | null) => {
  if (!sn) return '—';
  const dk = Math.floor(sn / 60);
  return dk >= 60 ? `${Math.floor(dk / 60)} sa ${dk % 60} dk` : `${dk} dk ${sn % 60} sn`;
};

export default function SonuclarScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const { ac } = useLocalSearchParams<{ ac?: string }>();
  const [sekme, setSekme] = useState<'sonuclarim' | 'siralama'>('sonuclarim');
  const [liste, setListe] = useState<DenemeSonuc[] | null>(null);
  const [acik, setAcik] = useState<string | null>(ac ?? null);

  useFocusEffect(
    useCallback(() => {
      void sonuclariOku().then(setListe);
    }, []),
  );

  return (
    <Screen title="Sonuçlar" koyu={gece} kompaktBaslik={gece}>
      <View style={[st.secici, gece && st.seciciGece]}>
        {(['sonuclarim', 'siralama'] as const).map((s) => {
          const aktif = sekme === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSekme(s)}
              style={[st.seg, gece && st.segGece, aktif && (gece ? st.segAktifGece : st.segAktif)]}
              accessibilityRole="button">
              <MaterialCommunityIcons
                name={s === 'sonuclarim' ? 'history' : 'podium'}
                size={16}
                color={aktif ? (gece ? Palette.altinParlak : Palette.beyaz) : gece ? 'rgba(226,236,240,0.75)' : Palette.solukMetin}
              />
              <AppText
                variant="etiket"
                bold
                color={aktif ? (gece ? 'altinParlak' : 'beyaz') : gece ? 'beyaz' : 'anaMetin'}>
                {s === 'sonuclarim' ? 'Sonuçlarım' : 'Sıralama'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {sekme === 'sonuclarim' ? (
        liste === null ? (
          <Loading metin="Yükleniyor…" />
        ) : liste.length === 0 ? (
          <EmptyState
            ikon="clipboard-text-clock-outline"
            baslik="Henüz deneme çözmedin"
            aciklama="Bir deneme bitirince sonucu buraya düşer; istediğin zaman dönüp yanlışlarına bakabilirsin."
            buton={{ etiket: 'Denemelere git', onPress: () => router.replace({ pathname: '/tatbikat', params: { mod: 'tatbikat' } }) }}
          />
        ) : (
          liste.map((s) => (
            <SonucKarti
              key={s.yerelId}
              sonuc={s}
              gece={gece}
              acik={acik === s.yerelId}
              onAc={() => setAcik(acik === s.yerelId ? null : s.yerelId)}
            />
          ))
        )
      ) : (
        <Siralama gece={gece} sonuclar={liste ?? []} />
      )}
    </Screen>
  );
}

// ──────────────────────────────────────────────────────────── SONUÇ KARTI
function SonucKarti({
  sonuc,
  gece,
  acik,
  onAc,
}: {
  sonuc: DenemeSonuc;
  gece: boolean;
  acik: boolean;
  onAc: () => void;
}) {
  const yuzde = sonuc.toplam ? Math.round((100 * sonuc.dogru) / sonuc.toplam) : 0;
  const renk = yuzde >= 70 ? Palette.yesil : yuzde >= 50 ? Palette.amber : Palette.kirmizi;
  return (
    <View style={[st.kart, gece && st.kartGece]}>
      <Pressable onPress={onAc} style={({ pressed }) => [st.kartUst, pressed && st.basili]} accessibilityRole="button">
        <View style={[st.puanHalka, { borderColor: renk }]}>
          <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
            {sonuc.puan}
          </AppText>
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            /{sonuc.toplamPuan}
          </AppText>
        </View>
        <View style={st.kartMetin}>
          <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'} numberOfLines={1}>
            {sonuc.baslik || `${TAKIM_AD[sonuc.takim]} Deneme ${sonuc.denemeNo}`}
          </AppText>
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            {sonuc.dogru}/{sonuc.toplam} doğru · %{yuzde} · {sureYaz(sonuc.sureSn)}
          </AppText>
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            {tarihYaz(sonuc.tarih)}
            {sonuc.gonderildi ? '' : ' · cihazda (henüz gönderilmedi)'}
          </AppText>
        </View>
        <MaterialCommunityIcons
          name={acik ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={gece ? Palette.altinParlak : Palette.solukMetin}
        />
      </Pressable>

      {acik ? (
        sonuc.yanlislar.length === 0 ? (
          <AppText variant="kucuk" bold color="yesil" style={st.tamIsabet}>
            🎯 Tam isabet — bu denemede hiç yanlışın yok.
          </AppText>
        ) : (
          <View style={st.yanlisKap}>
            <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'solukMetin'}>
              YANLIŞLARIN ({sonuc.yanlislar.length})
            </AppText>
            {sonuc.yanlislar.map((y, i) => (
              <View key={`${y.id}-${i}`} style={[st.yanlis, gece && st.yanlisGece]}>
                {y.kaynak ? (
                  <AppText variant="etiket" bold color="kirmizi">
                    {y.kaynak}
                  </AppText>
                ) : null}
                <AppText variant="kucuk" color={gece ? 'beyaz' : 'anaMetin'}>
                  {soruBicimle(y.soru)}
                </AppText>
                <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
                  Senin cevabın:{' '}
                  {y.secilen >= 0 ? `${String.fromCharCode(65 + y.secilen)}) ${y.siklar[y.secilen]}` : 'boş bıraktın'}
                </AppText>
                <AppText variant="etiket" bold color="yesil">
                  Doğrusu: {String.fromCharCode(65 + y.dogru)}) {y.siklar[y.dogru]}
                </AppText>
                {y.aciklama ? (
                  <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
                    {y.aciklama}
                  </AppText>
                ) : null}
              </View>
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────────────────── SIRALAMA
function Siralama({ gece, sonuclar }: { gece: boolean; sonuclar: DenemeSonuc[] }) {
  // Sıralamada gösterilecek deneme: kullanıcının çözdükleri (yoksa Genel Deneme 1).
  const secenekler =
    sonuclar.length > 0
      ? [...new Map(sonuclar.map((s) => [`${s.takim}-${s.denemeNo}`, s])).values()].slice(0, 12)
      : [{ takim: 'karma' as DenemeTakim, denemeNo: 1, baslik: 'Genel Deneme 1' } as DenemeSonuc];
  const [secili, setSecili] = useState(0);
  const [satirlar, setSatirlar] = useState<SiraSatiri[] | null>(null);
  const [benim, setBenim] = useState<{ sira: number; toplam_kisi: number; puan: number } | null>(null);
  const hedef = secenekler[Math.min(secili, secenekler.length - 1)];

  useFocusEffect(
    useCallback(() => {
      let yasiyor = true;
      setSatirlar(null);
      void siralamaGetir(hedef.takim, hedef.denemeNo).then((r) => yasiyor && setSatirlar(r));
      void kendiSiram(hedef.takim, hedef.denemeNo).then((r) => yasiyor && setBenim(r));
      return () => {
        yasiyor = false;
      };
    }, [hedef.takim, hedef.denemeNo]),
  );

  return (
    <>
      <View style={st.denemeSecici}>
        {secenekler.map((s, i) => (
          <Pressable
            key={`${s.takim}-${s.denemeNo}`}
            onPress={() => setSecili(i)}
            style={[st.denemeHap, gece && st.denemeHapGece, i === secili && (gece ? st.segAktifGece : st.segAktif)]}>
            <AppText
              variant="etiket"
              bold
              color={i === secili ? (gece ? 'altinParlak' : 'beyaz') : gece ? 'beyaz' : 'anaMetin'}>
              {TAKIM_AD[s.takim]} {s.denemeNo}
            </AppText>
          </Pressable>
        ))}
      </View>

      {benim ? (
        <View style={[st.benimKutu, gece && st.kartGece]}>
          <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'solukMetin'}>
            SENİN SIRAN
          </AppText>
          <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'}>
            {benim.sira}. sıra · {benim.puan} puan
          </AppText>
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
            {benim.toplam_kisi} kişi arasında
          </AppText>
        </View>
      ) : null}

      {satirlar === null ? (
        <Loading metin="Sıralama alınıyor…" />
      ) : satirlar.length === 0 ? (
        <EmptyState
          ikon="podium"
          baslik="Sıralama henüz boş"
          aciklama="Bu denemeyi çözen ilk kişi sen olabilirsin. Sonuçlar kaydedildikçe tablo dolar."
        />
      ) : (
        satirlar.map((r) => (
          <View key={`${r.sira}-${r.ad}`} style={[st.siraSatir, gece && st.kartGece, r.benim && st.siraBenim]}>
            <AppText
              variant="govde"
              bold
              color={r.sira <= 3 ? 'altinMetin' : gece ? 'beyaz' : 'anaMetin'}
              style={st.siraNo}>
              {r.sira}
            </AppText>
            <AppText variant="kucuk" bold={r.benim} color={gece ? 'beyaz' : 'anaMetin'} numberOfLines={1} style={st.siraAd}>
              {r.ad}
              {r.benim ? ' (sen)' : ''}
            </AppText>
            <AppText variant="kucuk" bold color={gece ? 'altinParlak' : 'altinMetin'}>
              {r.puan}
            </AppText>
          </View>
        ))
      )}
    </>
  );
}

const st = StyleSheet.create({
  secici: { flexDirection: 'row', gap: Spacing.one },
  seciciGece: { gap: Spacing.one },
  seg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.m,
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
  },
  segGece: {
    backgroundColor: 'rgba(3,40,56,0.55)',
    borderColor: 'rgba(126,205,218,0.3)',
    borderRadius: 999,
  },
  segAktif: { backgroundColor: Palette.lacivert, borderColor: Palette.lacivert },
  segAktifGece: { backgroundColor: 'rgba(3,47,69,0.9)', borderColor: '#F3C24A' },

  kart: {
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  kartGece: { backgroundColor: 'rgba(3,40,56,0.55)', borderColor: 'rgba(126,205,218,0.3)' },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  kartMetin: { flex: 1, gap: 2 },
  basili: { opacity: 0.75 },
  puanHalka: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tamIsabet: { textAlign: 'center', paddingVertical: Spacing.two },
  yanlisKap: { gap: Spacing.two },
  yanlis: {
    backgroundColor: Palette.kremZemin,
    borderRadius: Radius.m,
    padding: Spacing.two,
    gap: 3,
  },
  yanlisGece: { backgroundColor: 'rgba(3,32,46,0.6)' },

  denemeSecici: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  denemeHap: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
  },
  denemeHapGece: { backgroundColor: 'rgba(3,40,56,0.55)', borderColor: 'rgba(126,205,218,0.3)' },
  benimKutu: {
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: 2,
  },
  siraSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
  },
  siraBenim: { borderColor: Palette.altin, borderWidth: 2 },
  siraNo: { minWidth: 28, textAlign: 'center' },
  siraAd: { flex: 1 },
});
