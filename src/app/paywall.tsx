/**
 * Paywall + satın alma akışı (expo-iap, DİREKT Google Play Billing).
 *
 * Model: 2 KATEGORİ (müşterek / branş) × 2 SEÇENEK (yıllık abonelik / ömür boyu tek-seferlik) = 4 ürün.
 * Akış: useIAP.fetchProducts → kullanıcı bir plana basar → requestPurchase → (native listener)
 * onPurchaseSuccess → satinAlmaDogrula(token) [Supabase Edge → Google API doğrular, hakkı SUNUCUDA yazar]
 * → finishTransaction → useUyelik.yenile(). İstemci ASLA kendini "premium" ilan etmez.
 *
 * NOT: Gating (kilit) BİLEREK KAPALI — bu ekran erişilebilir ama hiçbir yeri kilitlemiyor
 * (kapalı testte testerlar tüm içeriğe erişsin). Kilit final yayında `kanunErisilebilir` ile açılacak.
 *
 * Web/Expo Go: expo-iap native modül → yalnız gerçek Android derlemesinde çalışır. Web'de bilgi notu,
 * mağaza bağlantısı kurulamazsa (connected=false) butonlar pasif + uyarı gösterilir.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type Purchase, useIAP } from 'expo-iap';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Arma } from '@/components/auth/arma';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  ABONELIK_URUNLERI,
  TEK_SEFERLIK_URUNLERI,
  URUN_BRANS_OMURBOYU,
  URUN_BRANS_YILLIK,
  URUN_MUSTEREK_OMURBOYU,
  URUN_MUSTEREK_YILLIK,
} from '@/constants/urunler';
import { useAuth } from '@/lib/auth-context';
import { satinAlmaDogrula } from '@/lib/satinalma';
import { useUyelik } from '@/lib/uyelik-context';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Kategori = {
  slug: 'musterek' | 'brans';
  ad: string;
  aciklama: string;
  ikon: IconName;
  yillik: string;
  omurboyu: string;
};

const KATEGORILER: Kategori[] = [
  {
    slug: 'musterek',
    ad: 'Müşterek Konular',
    aciklama: 'Tüm adaylara ortak mevzuat — kanun kartları, sesli anlatım ve deneme sınavları.',
    ikon: 'bank-outline',
    yillik: URUN_MUSTEREK_YILLIK,
    omurboyu: URUN_MUSTEREK_OMURBOYU,
  },
  {
    slug: 'brans',
    ad: 'Branş Konuları',
    aciklama: 'Seçtiğin branşa özel mevzuat ve denemeler (yakında genişliyor).',
    ikon: 'medal-outline',
    yillik: URUN_BRANS_YILLIK,
    omurboyu: URUN_BRANS_OMURBOYU,
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  return (
    <Screen title="Premium" onGeri={() => router.back()} headerAltinCizgi>
      <View style={styles.marka}>
        <Arma />
        <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
          MEVZU Premium
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
          TCK ve denemesi herkese ücretsiz. Diğer tüm mevzuata tam erişim için bir plan seç.
        </AppText>
      </View>

      {Platform.OS === 'web' ? <WebNot /> : <PaywallIcerik />}
    </Screen>
  );
}

/** Web'de (dev) satın alma yok — bilgi notu. */
function WebNot() {
  return (
    <View style={styles.bilgiKart}>
      <MaterialCommunityIcons name="cellphone-arrow-down" size={22} color={Palette.amber} />
      <AppText variant="kucuk" color="solukMetin" style={styles.esnek}>
        Satın alma yalnızca Android uygulamasında (Google Play) yapılabilir. Web sürümünde önizleme
        amaçlıdır.
      </AppText>
    </View>
  );
}

function PaywallIcerik() {
  const { hazir } = useAuth();
  const { musterek, brans, yenile } = useUyelik();
  const [islemUrun, setIslemUrun] = useState<string | null>(null); // hangi ürün işleniyor (buton kilidi)
  const [durum, setDurum] = useState<'dogrulaniyor' | null>(null);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);

  const { connected, products, subscriptions, fetchProducts, requestPurchase, finishTransaction, restorePurchases } =
    useIAP({
      onPurchaseSuccess: (purchase) => {
        void tamamla(purchase);
      },
      onPurchaseError: (e) => {
        setIslemUrun(null);
        setDurum(null);
        // Kullanıcı iptal ettiyse sessiz geç.
        if (e.code === 'user-cancelled') return;
        setMesaj({ tip: 'hata', metin: __DEV__ ? `Satın alma hatası: ${e.message}` : 'Satın alma tamamlanamadı.' });
      },
      onError: () => {
        // fetchProducts vb. genel hatalar — sessiz (connected=false zaten uyarı gösteriyor).
      },
    });

  // Mağazaya bağlanınca ürünleri çek (abonelik + tek-seferlik AYRI API).
  useEffect(() => {
    if (!connected) return;
    void fetchProducts({ skus: TEK_SEFERLIK_URUNLERI, type: 'in-app' });
    void fetchProducts({ skus: ABONELIK_URUNLERI, type: 'subs' });
  }, [connected]);

  // Satın alma başarılı → sunucuda doğrula → finishTransaction → hakları yenile.
  async function tamamla(purchase: Purchase) {
    setDurum('dogrulaniyor');
    try {
      const token = purchase.purchaseToken ?? '';
      const sonuc = await satinAlmaDogrula(purchase.productId, token);
      if (!sonuc.ok) throw new Error('Sunucu doğrulaması başarısız.');
      // Doğrulandı → işlemi kapat (isConsumable:false → abonelik + kalıcı ürün tüketilmez).
      await finishTransaction({ purchase, isConsumable: false });
      await yenile();
      setMesaj({ tip: 'basari', metin: 'Satın alma tamamlandı — erişimin açıldı.' });
    } catch (e) {
      setMesaj({
        tip: 'hata',
        metin: __DEV__ ? `Doğrulama hatası: ${e instanceof Error ? e.message : e}` : 'Satın alma doğrulanamadı.',
      });
    } finally {
      setIslemUrun(null);
      setDurum(null);
    }
  }

  // Bir ürünün Play fiyatını göster (yoksa '—').
  function fiyat(urun: string): string {
    const p = products.find((x) => x.id === urun) ?? subscriptions.find((x) => x.id === urun);
    return p?.displayPrice ?? '—';
  }

  // Android abonelik için offerToken (requestPurchase subs bunu ister).
  function offerToken(urun: string): string | undefined {
    const s = subscriptions.find((x) => x.id === urun);
    if (s && s.platform === 'android') return s.subscriptionOfferDetailsAndroid?.[0]?.offerToken ?? undefined;
    return undefined;
  }

  async function satinAl(urun: string, abonelik: boolean) {
    if (!connected || islemUrun) return;
    setMesaj(null);
    setIslemUrun(urun);
    try {
      if (abonelik) {
        const token = offerToken(urun);
        await requestPurchase({
          type: 'subs',
          request: {
            google: { skus: [urun], subscriptionOffers: token ? [{ sku: urun, offerToken: token }] : [] },
          },
        });
      } else {
        await requestPurchase({
          type: 'in-app',
          request: { google: { skus: [urun] } },
        });
      }
      // Başarı/başarısızlık native listener'a (onPurchaseSuccess/onPurchaseError) düşer.
    } catch (e) {
      setIslemUrun(null);
      setMesaj({ tip: 'hata', metin: __DEV__ ? `İstek hatası: ${e instanceof Error ? e.message : e}` : 'İşlem başlatılamadı.' });
    }
  }

  async function geriYukle() {
    setMesaj(null);
    setDurum('dogrulaniyor');
    try {
      await restorePurchases();
      await yenile();
      setMesaj({ tip: 'basari', metin: 'Erişim bilgilerin yenilendi.' });
    } catch {
      setMesaj({ tip: 'hata', metin: 'Yenileme başarısız. İnternetini kontrol et.' });
    } finally {
      setDurum(null);
    }
  }

  return (
    <>
      {!hazir ? (
        <View style={styles.bilgiKart}>
          <MaterialCommunityIcons name="clock-outline" size={22} color={Palette.amber} />
          <AppText variant="kucuk" color="solukMetin" style={styles.esnek}>
            Üyelik altyapısı yakında açılacak. Şu an tüm içerik girişsiz de kullanılabilir.
          </AppText>
        </View>
      ) : null}

      {hazir && !connected ? (
        <View style={styles.bilgiKart}>
          <MaterialCommunityIcons name="store-off-outline" size={22} color={Palette.amber} />
          <AppText variant="kucuk" color="solukMetin" style={styles.esnek}>
            Play Store bağlantısı kurulamadı. Satın alma yalnızca Google Play'den yüklenmiş gerçek
            uygulamada çalışır (Expo Go'da değil).
          </AppText>
        </View>
      ) : null}

      {KATEGORILER.map((k) => {
        const sahip = k.slug === 'musterek' ? musterek : brans;
        return (
          <KategoriKart
            key={k.slug}
            kategori={k}
            sahip={sahip}
            yillikFiyat={fiyat(k.yillik)}
            omurboyuFiyat={fiyat(k.omurboyu)}
            islemUrun={islemUrun}
            aktif={connected}
            onYillik={() => void satinAl(k.yillik, true)}
            onOmurboyu={() => void satinAl(k.omurboyu, false)}
          />
        );
      })}

      {durum === 'dogrulaniyor' ? (
        <View style={styles.durumSatir}>
          <ActivityIndicator color={Palette.lacivert} />
          <AppText variant="kucuk" color="solukMetin">
            Doğrulanıyor…
          </AppText>
        </View>
      ) : null}

      {mesaj ? (
        <View style={[styles.mesajKart, mesaj.tip === 'basari' ? styles.mesajBasari : styles.mesajHata]}>
          <MaterialCommunityIcons
            name={mesaj.tip === 'basari' ? 'check-circle' : 'alert-circle-outline'}
            size={20}
            color={mesaj.tip === 'basari' ? Palette.yesil : Palette.kirmizi}
          />
          <AppText variant="kucuk" color={mesaj.tip === 'basari' ? 'yesil' : 'kirmizi'} bold style={styles.esnek}>
            {mesaj.metin}
          </AppText>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.geriYukleBtn, pressed && styles.pressed]}
        onPress={() => void geriYukle()}>
        <MaterialCommunityIcons name="restore" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" color="lacivert" bold>
          Satın alımları geri yükle
        </AppText>
      </Pressable>

      <AppText variant="etiket" color="solukMetin" style={styles.yasal}>
        Yıllık planlar bir aboneliktir ve iptal edilmezse her yıl otomatik yenilenir; dilediğin zaman
        Google Play → Abonelikler'den iptal edebilirsin. Ömür boyu planlar tek seferlik ödemedir.
        Ödemeler Google Play üzerinden alınır.
      </AppText>
    </>
  );
}

function KategoriKart({
  kategori,
  sahip,
  yillikFiyat,
  omurboyuFiyat,
  islemUrun,
  aktif,
  onYillik,
  onOmurboyu,
}: {
  kategori: Kategori;
  sahip: boolean;
  yillikFiyat: string;
  omurboyuFiyat: string;
  islemUrun: string | null;
  aktif: boolean;
  onYillik: () => void;
  onOmurboyu: () => void;
}) {
  return (
    <View style={styles.kart}>
      <View style={styles.kartUst}>
        <View style={styles.kartIkon}>
          <MaterialCommunityIcons name={kategori.ikon} size={24} color={Palette.altinKoyu} />
        </View>
        <View style={styles.esnek}>
          <AppText variant="govde" bold>
            {kategori.ad}
          </AppText>
          <AppText variant="etiket" color="solukMetin">
            {kategori.aciklama}
          </AppText>
        </View>
        {sahip ? (
          <View style={styles.sahipRozet}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={Palette.yesil} />
            <AppText variant="etiket" color="yesil" bold>
              Aktif
            </AppText>
          </View>
        ) : null}
      </View>

      {sahip ? (
        <AppText variant="kucuk" color="yesil" bold style={styles.sahipMetin}>
          Bu pakete tam erişimin var.
        </AppText>
      ) : (
        <View style={styles.planlar}>
          <PlanButon
            baslik="Yıllık"
            fiyat={yillikFiyat}
            altYazi="/yıl · yenilenir"
            vurgu
            mesgul={islemUrun === kategori.yillik}
            pasif={!aktif || (!!islemUrun && islemUrun !== kategori.yillik)}
            onPress={onYillik}
          />
          <PlanButon
            baslik="Ömür boyu"
            fiyat={omurboyuFiyat}
            altYazi="tek seferlik"
            mesgul={islemUrun === kategori.omurboyu}
            pasif={!aktif || (!!islemUrun && islemUrun !== kategori.omurboyu)}
            onPress={onOmurboyu}
          />
        </View>
      )}
    </View>
  );
}

function PlanButon({
  baslik,
  fiyat,
  altYazi,
  vurgu,
  mesgul,
  pasif,
  onPress,
}: {
  baslik: string;
  fiyat: string;
  altYazi: string;
  vurgu?: boolean;
  mesgul?: boolean;
  pasif?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={pasif || mesgul}
      onPress={onPress}
      style={({ pressed }) => [
        styles.plan,
        vurgu && styles.planVurgu,
        pressed && styles.pressed,
        (pasif || mesgul) && styles.planPasif,
      ]}>
      {vurgu ? (
        <View style={styles.planRozet}>
          <AppText variant="etiket" color="lacivert" bold>
            EN AVANTAJLI
          </AppText>
        </View>
      ) : null}
      <AppText variant="kucuk" bold color={vurgu ? 'beyaz' : 'lacivert'}>
        {baslik}
      </AppText>
      {mesgul ? (
        <ActivityIndicator color={vurgu ? Palette.beyaz : Palette.lacivert} style={styles.planSpinner} />
      ) : (
        <>
          <AppText variant="altBaslik" bold color={vurgu ? 'beyaz' : 'anaMetin'}>
            {fiyat}
          </AppText>
          <AppText variant="etiket" color={vurgu ? 'beyaz' : 'solukMetin'}>
            {altYazi}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  marka: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  ortali: {
    textAlign: 'center',
  },
  esnek: {
    flex: 1,
  },
  bilgiKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kartIkon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sahipRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sahipMetin: {
    paddingBottom: Spacing.one,
  },
  planlar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  plan: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    minHeight: 108,
    borderRadius: Radius.m,
    borderWidth: 1.5,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kremZemin,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  planVurgu: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  planPasif: {
    opacity: 0.5,
  },
  planRozet: {
    position: 'absolute',
    top: -10,
    backgroundColor: Palette.altin,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  planSpinner: {
    marginVertical: Spacing.two,
  },
  durumSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  mesajKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.m,
    borderWidth: 1,
    padding: Spacing.three,
  },
  mesajBasari: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderColor: Palette.yesil,
  },
  mesajHata: {
    backgroundColor: 'rgba(192,0,0,0.06)',
    borderColor: Palette.kirmizi,
  },
  geriYukleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  yasal: {
    textAlign: 'center',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
