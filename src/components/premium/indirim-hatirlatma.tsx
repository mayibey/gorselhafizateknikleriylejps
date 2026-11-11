import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { kalanParcala } from '@/lib/geri-sayim';
import { type IndirimDurumu, indirimDurumuOku } from '@/lib/indirim';
import {
  hatirlatBirDahaGosterme,
  hatirlatGosterildi,
  hatirlatGosterildiV2,
  hatirlatUygunMu,
  hatirlatUygunMuV2,
} from '@/lib/indirim-hatirlatma';
import { useKisiselOzellik } from '@/lib/ozellik';
import { useUyelik } from '@/lib/uyelik-context';
import { ayarOku } from '@/lib/uzak-ayar';

// Oturum bayrağı (modül-yerel): uygulama açık kaldığı sürece hatırlatma bir kez çıkar.
// Uygulama tamamen kapanıp açılınca modül yeniden yüklenir → sıfırlanır (yeni oturum).
let seansGosterildi = false;

function ikiHane(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * İlk gün indirimini hatırlatan modal. Karargah'a yerleşir; koşullar tutunca (çalışmaya girilmiş +
 * en fazla 3 kez + premium değil + ilk-giriş indirimi aktif) canlı geri sayımlı fırsat kartı gösterir.
 *
 * 🔴 iOS'TA SUNUCU ŞALTERİNE BAĞLI (7 Ağu 2026, başkan bildirdi: "indirim paneline tıklayıp satın
 * almaya gidince indirim uygulanmıyor"). Sebep: Apple tek seferlik üründe kişiye özel indirim
 * DESTEKLEMİYOR; indirim App Store'da ayrı ucuz ürünle (musterek_omurboyu_i20) uygulanıyor. O ürün
 * Apple incelemesinden geçene kadar panel gösterilmemeli — yoksa indirim vaat edip tam fiyat
 * alınır (yanıltıcı + App Store 3.1.1 riski).
 * ŞALTER: uygulama_ayar.ios_indirim_aktif — Apple onaylayınca '1' yapılır, kod/build/OTA GEREKMEZ.
 * Android'de şalter aranmaz (orada indirim Play teklifiyle zaten çalışıyor).
 */
export function IndirimHatirlatma() {
  const router = useRouter();
  const { premium } = useUyelik();
  // V2 (11 Kas 2026): 'bir daha gösterme' + ara ara hatırlatma (3 saatte bir, en çok 5) + çalışmadan
  // da tetik (ilk açılıştan 10 dk sonra). Kurallar lib/indirim-hatirlatma.ts V2 bölümünde.
  const v2 = useKisiselOzellik('indirim-hatirlat-v2');
  const [indirimDesteklenir, setDesteklenir] = useState(Platform.OS === 'android');
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void ayarOku('ios_indirim_aktif').then((v) => setDesteklenir(v === '1'));
  }, []);
  const [durum, setDurum] = useState<IndirimDurumu | null>(null); // dolu ise modal açık
  const [simdi, setSimdi] = useState(() => Date.now());

  // Karargah'a her odaklanışta koşulları dene (oturumda bir kez).
  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        if (!indirimDesteklenir || premium || seansGosterildi) return;
        if (!(await (v2 ? hatirlatUygunMuV2() : hatirlatUygunMu()))) return;
        const d = await indirimDurumuOku();
        if (iptal || !d || d.kaynak !== 'ilk_giris' || !d.bitis) return;
        if (new Date(d.bitis).getTime() <= Date.now()) return; // süresi bitmiş
        seansGosterildi = true;
        await (v2 ? hatirlatGosterildiV2() : hatirlatGosterildi());
        if (!iptal) {
          setSimdi(Date.now());
          setDurum(d);
        }
      })();
      return () => {
        iptal = true;
      };
    }, [premium, indirimDesteklenir, v2]),
  );

  // Modal açıkken saniyede bir tikle.
  useEffect(() => {
    if (!durum) return;
    const t = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(t);
  }, [durum]);

  if (!durum || !durum.bitis) return null;
  const p = kalanParcala(durum.bitis, simdi);
  const kapat = () => setDurum(null);
  if (!p) {
    // Süre modal açıkken bitti → sessizce kapat.
    return null;
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={kapat} statusBarTranslucent>
      <View style={styles.zemin}>
        <View style={styles.kart}>
          <Pressable style={styles.kapatX} onPress={kapat} hitSlop={10} accessibilityLabel="Kapat">
            <MaterialCommunityIcons name="close" size={20} color={Palette.solukMetin} />
          </Pressable>

          <View style={styles.rozet}>
            <MaterialCommunityIcons name="ticket-percent" size={30} color={Palette.beyaz} />
          </View>

          <AppText variant="altBaslik" bold color="lacivert" style={styles.ortali}>
            İlk Gün Fırsatın Sürüyor!
          </AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
            %{durum.yuzde} indirimli üyelik için kalan süre
          </AppText>

          <View style={styles.sayacSatir}>
            <Kutu deger={p.gun} etiket="GÜN" />
            <Ayrac />
            <Kutu deger={p.sa} etiket="SAAT" />
            <Ayrac />
            <Kutu deger={p.dk} etiket="DK" />
            <Ayrac />
            <Kutu deger={p.sn} etiket="SN" />
          </View>

          <AppText variant="kucuk" color="anaMetin" style={styles.aciklama}>
            Yıllık ve ömür boyu üyeliği bu süre içinde %{durum.yuzde} indirimli alabilirsin. Süre dolunca
            fiyat normale döner.
          </AppText>

          <Pressable
            style={({ pressed }) => [styles.alBtn, pressed && styles.basili]}
            onPress={() => {
              kapat();
              router.push('/paywall');
            }}>
            <MaterialCommunityIcons name="flash" size={18} color={Palette.beyaz} />
            <AppText variant="govde" color="beyaz" bold>
              İndirimli Al
            </AppText>
          </Pressable>
          <Pressable onPress={kapat} hitSlop={8} style={styles.sonra}>
            <AppText variant="kucuk" color="solukMetin" bold>
              {v2 ? 'Sonra hatırlat' : 'Şimdilik kapat'}
            </AppText>
          </Pressable>
          {v2 ? (
            <Pressable
              onPress={() => {
                void hatirlatBirDahaGosterme();
                kapat();
              }}
              hitSlop={8}
              style={styles.birDaha}
              accessibilityRole="button">
              <AppText variant="etiket" color="solukMetin" style={styles.altCizgi}>
                Bir daha gösterme
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Kutu({ deger, etiket }: { deger: number; etiket: string }) {
  return (
    <View style={styles.kutuSar}>
      <View style={styles.kutu}>
        <AppText variant="baslik" bold color="beyaz" style={styles.kutuDeger}>
          {ikiHane(deger)}
        </AppText>
      </View>
      <AppText variant="etiket" bold color="solukMetin" style={styles.kutuEtiket}>
        {etiket}
      </AppText>
    </View>
  );
}

function Ayrac() {
  return (
    <AppText variant="baslik" bold color="altin" style={styles.ayrac}>
      :
    </AppText>
  );
}

const styles = StyleSheet.create({
  zemin: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  kart: {
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  kapatX: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    padding: Spacing.one,
    zIndex: 2,
  },
  rozet: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  ortali: {
    textAlign: 'center',
  },
  sayacSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  kutuSar: {
    alignItems: 'center',
    gap: Spacing.one,
    minWidth: 56,
  },
  kutu: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    minWidth: 52,
    alignItems: 'center',
  },
  kutuDeger: {
    fontVariant: ['tabular-nums'],
  },
  kutuEtiket: {
    fontSize: 10,
    letterSpacing: 1,
  },
  ayrac: {
    marginHorizontal: 2,
    marginTop: Spacing.two,
  },
  aciklama: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  alBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  basili: {
    opacity: 0.85,
  },
  sonra: {
    paddingVertical: Spacing.two,
  },
  birDaha: {
    paddingBottom: Spacing.one,
  },
  altCizgi: {
    textDecorationLine: 'underline',
  },
});
