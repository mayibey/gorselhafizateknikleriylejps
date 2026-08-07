/**
 * Paywall + satın alma akışı (expo-iap — Android: Google Play Billing, iOS: StoreKit 2).
 * Platform ayrımı `satinAl`'da: Android teklif/indirim (offerToken); iOS base ürün (appAccountToken=UUID,
 * ilk sürüm indirimsiz). İndirim fonksiyonları iOS'ta zaten no-op (platform!=='android'). Yıllık→ömür
 * boyu: Android farkla yükseltme (URUN_YUKSELTME), iOS tam fiyat (URUN_OMURBOYU — fark ürünü yok).
 *
 * TEK KAPSAM modeli (4 Tem): uygulamanın TAMAMI tek pakettir → YILLIK (abonelik) ya da
 * ÖMÜR BOYU (tek seferlik) satın alınır; aktif yıllık sahibi FARK fiyatıyla ömür boyuna yükselir.
 * Akış: useIAP.fetchProducts → kullanıcı plana basar → requestPurchase → onPurchaseSuccess
 * → acknowledge → satinAlmaDogrula (Supabase Edge → Google doğrular, hakkı SUNUCUDA yazar)
 * → useUyelik.yenile(). İstemci ASLA kendini "premium" ilan etmez.
 *
 * Web/Expo Go: expo-iap native modül → yalnız gerçek Android derlemesinde çalışır.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAvailablePurchases, presentCodeRedemptionSheetIOS, type Purchase, useIAP } from 'expo-iap';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Arma } from '@/components/auth/arma';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  ABONELIK_URUNLERI,
  TEK_SEFERLIK_URUNLERI,
  INDIRIMLI_OMURBOYU_URUNLERI,
  URUN_OMURBOYU,
  URUN_YILLIK,
  URUN_YUKSELTME,
} from '@/constants/urunler';
import { useAuth } from '@/lib/auth-context';
import { kalanMetin } from '@/lib/geri-sayim';
import { type IndirimDurumu, indirimDurumuOku } from '@/lib/indirim';
import { DogrulamaReddi, satinAlmaDogrula } from '@/lib/satinalma';
import { useUyelik } from '@/lib/uyelik-context';

/** Google Play abonelik yönetimi (yükseltme sonrası yıllığı iptal için). */
const PLAY_ABONELIKLER = 'https://play.google.com/store/account/subscriptions';

/** Paket kapsamı (tek kart üstünde madde madde gösterilir). */
const KAPSAM = [
  'Tüm kanunların görsel hafıza kartları',
  'Sesli anlatımlar ve madde metinleri',
  'Talim deneme sınavları + genel denemeler',
  'Zayıf mevzi takibi ve kişisel gelişim sicili',
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
          TCK ve denemesi herkese ücretsiz. Uygulamanın TAMAMINA erişim için bir plan seç —
          tek paket, her şey dahil.
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
        Satın alma yalnızca telefon uygulamasında (App Store / Google Play) yapılabilir. Web
        sürümünde önizleme amaçlıdır.
      </AppText>
    </View>
  );
}

function PaywallIcerik() {
  const router = useRouter();
  const { hazir, kullanici } = useAuth();
  const { aktifHaklar, cihazKilit, yenile } = useUyelik();
  const [islemUrun, setIslemUrun] = useState<string | null>(null); // hangi ürün işleniyor (buton kilidi)
  const [durum, setDurum] = useState<'dogrulaniyor' | null>(null);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);
  const [indirim, setIndirim] = useState<IndirimDurumu | null>(null); // güncel indirim (kod %30 / ilk giriş %20)

  // Kullanıcının güncel indirim durumunu oku (sunucu tek/en yüksek indirimi verir; üst üste binmez).
  useEffect(() => {
    if (!kullanici) {
      setIndirim(null);
      return;
    }
    let iptal = false;
    void indirimDurumuOku().then((d) => {
      if (!iptal) setIndirim(d);
    });
    return () => {
      iptal = true;
    };
  }, [kullanici]);

  // Süreli indirimler için CANLI geri sayım — bitiş sunucudan gelir; yalnız gerekince saniyede bir tikler.
  // İlk giriş (yeni hesap) ve kampanya (herkese süreli) indirimlerinin bitişi vardır.
  const [simdi, setSimdi] = useState(() => Date.now());
  const geriSayimVar =
    indirim != null &&
    (indirim.kaynak === 'ilk_giris' || indirim.kaynak === 'kampanya') &&
    !!indirim.bitis;
  useEffect(() => {
    if (!geriSayimVar) return;
    const t = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(t);
  }, [geriSayimVar]);

  // Sahiplik TİPE göre: ömür boyu → tam; yalnız yıllık → yükseltme teklif edilir.
  const sahipOmur = aktifHaklar.some((h) => h.tip === 'omurboyu');
  const sahipYillik = !sahipOmur && aktifHaklar.some((h) => h.tip === 'abonelik');
  // iOS'ta ayrı "farkla yükseltme" ürünü YOK (URUN_YUKSELTME oluşturulmadı) → yıllık sahibi ömür boyuna
  // TAM fiyatla geçer. Abonelik yönetimi de platforma göre (Apple / Google).
  const ios = Platform.OS === 'ios';
  const yukseltUrun = ios ? URUN_OMURBOYU : URUN_YUKSELTME;
  const ABONELIK_YONETIM = ios
    ? 'https://apps.apple.com/account/subscriptions'
    : PLAY_ABONELIKLER;

  const { connected, products, subscriptions, fetchProducts, requestPurchase, finishTransaction } =
    useIAP({
      onPurchaseSuccess: (purchase) => {
        void tamamla(purchase);
      },
      onPurchaseError: (e) => {
        setIslemUrun(null);
        setDurum(null);
        if (e.code === 'user-cancelled') return; // kullanıcı vazgeçti → sessiz
        setMesaj({ tip: 'hata', metin: __DEV__ ? `Satın alma hatası: ${e.message}` : 'Satın alma tamamlanamadı.' });
      },
      onError: () => {
        // fetchProducts vb. genel hatalar — sessiz (connected=false zaten uyarı gösteriyor).
      },
    });

  // Mağazaya bağlanınca ürünleri çek (abonelik + tek-seferlik AYRI API).
  useEffect(() => {
    if (!connected) return;
    // Tek-seferlik ürünler. iOS'ta YALNIZ App Store'da var olan ürünü çek: URUN_YUKSELTME (fark
    // ürünü) sadece Google'da tanımlı → iOS'ta geçersiz SKU StoreKit fetch'ini bozup "ürünler
    // yüklenemedi" (Apple 2.1 ret) yapıyordu. Android'de tümü (ömür boyu + yükseltme).
    // iOS'ta İNDİRİMLİ ÖMÜR BOYU ürünü de çekilir (musterek_omurboyu_i20). Apple tek seferlik
    // üründe kişiye özel indirim desteklemiyor → indirim AYRI, ucuz ürünle uygulanıyor. Sunucu
    // (indirim_durumu.omurboyu_urun) hangi SKU olduğunu söyler; App Store'da yoksa StoreKit onu
    // yok sayar, fiyat/satın alma temel ürüne düşer (güvenli).
    const iosIndirimliSku =
      Platform.OS === 'ios' && indirim?.omurboyu_urun &&
      INDIRIMLI_OMURBOYU_URUNLERI.includes(indirim.omurboyu_urun)
        ? [indirim.omurboyu_urun]
        : [];
    const tekSeferlikSkus =
      Platform.OS === 'ios' ? [URUN_OMURBOYU, ...iosIndirimliSku] : TEK_SEFERLIK_URUNLERI;
    void fetchProducts({ skus: tekSeferlikSkus, type: 'in-app' });
    void fetchProducts({ skus: ABONELIK_URUNLERI, type: 'subs' });
  }, [connected, indirim?.omurboyu_urun]);

  // Satın alma başarılı → ÖNCE acknowledge (iade önle) → sunucuda doğrula → hakları yenile.
  async function tamamla(purchase: Purchase) {
    setDurum('dogrulaniyor');
    const token = purchase.purchaseToken ?? '';
    // ACKNOWLEDGE (isConsumable:false → sahiplik kalır). Doğrulama sonucundan BAĞIMSIZ hemen
    // onaylanır → Google'ın 3-gün "onaylanmadı → iade" kuralı devreye girmez; hak yine SUNUCUDA yazılır.
    await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    try {
      const sonuc = await satinAlmaDogrula(purchase.productId, token);
      if (!sonuc.ok) throw new Error('Sunucu doğrulaması başarısız.');
      await yenile();
      setMesaj({ tip: 'basari', metin: 'Satın alma tamamlandı — erişimin açıldı.' });
    } catch (e) {
      // Sunucunun NET reddi (başka hesaba bağlı / yükseltme şartı) → mesajı olduğu gibi göster.
      if (e instanceof DogrulamaReddi) {
        setMesaj({ tip: 'hata', metin: e.message });
        return;
      }
      setMesaj({
        tip: 'hata',
        metin: __DEV__
          ? `Doğrulama hatası: ${e instanceof Error ? e.message : e}`
          : 'Ödemen alındı ve kaydedildi. Doğrulama şu an tamamlanamadı — birkaç dakika sonra "Satın alımları geri yükle" ile erişimin açılır.',
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

  // Yıllık için indirimli teklif (durum + Play'de o offerId varsa). Yoksa undefined.
  function yillikIndirimliTeklif() {
    if (!indirim) return undefined;
    const s = subscriptions.find((x) => x.id === URUN_YILLIK);
    if (!s || s.platform !== 'android') return undefined;
    const hedef = indirim.yillik_offer;
    return s.subscriptionOfferDetailsAndroid?.find((o) => o.offerId === hedef);
  }
  // Ömür boyu için indirimli TEKLİF: musterek_omurboyu ürününe eklenmiş tek-seferlik teklif (offerId
  // = indirim20/indirim30, yıllıkla AYNI). Ayrı ürün YOK; teklif token'ıyla base ürün indirimli alınır.
  function omurboyuIndirimliTeklif() {
    if (!indirim) return undefined;
    const p = products.find((x) => x.id === URUN_OMURBOYU);
    if (!p || p.platform !== 'android') return undefined;
    return p.oneTimePurchaseOfferDetailsAndroid?.find((o) => o.offerId === indirim.yillik_offer);
  }
  // İndirim GERÇEKTEN uygulanabilir mi (Play tarafı hazır)? Banner/etiket yalnız buna göre gösterilir
  // → "indirim vaat edip tam fiyat çekme" olmaz.
  const yillikInd = !!yillikIndirimliTeklif();
  // iOS: indirimli ÖMÜR BOYU ürünü App Store'dan gerçekten geldiyse indirim uygulanabilir.
  // (Ürün onaylanmadıysa StoreKit onu döndürmez → otomatik olarak temel fiyata düşeriz; yani
  //  "indirim vaat edip tam fiyat çekme" durumu oluşamaz. Bayrak koda gömülü DEĞİL, mağazadan gelir.)
  function iosIndirimliOmurUrun() {
    if (Platform.OS !== 'ios' || !indirim?.omurboyu_urun) return undefined;
    if (!INDIRIMLI_OMURBOYU_URUNLERI.includes(indirim.omurboyu_urun)) return undefined;
    return products.find((x) => x.id === indirim.omurboyu_urun);
  }
  const omurInd = !!omurboyuIndirimliTeklif() || !!iosIndirimliOmurUrun();
  const indirimUygulanabilir = yillikInd || omurInd;
  /** Ömür boyu satın almada KULLANILACAK SKU — iOS'ta indirim varsa ucuz ürün, yoksa temel. */
  function omurboyuSku(): string {
    return iosIndirimliOmurUrun()?.id ?? URUN_OMURBOYU;
  }
  // Banner kapsamı GERÇEK duruma göre: yalnız Play'de hazır olan plan(lar) için "geçerli" de
  // → sadece biri hazırken "yıllık ve ömür boyunda geçerli" diye fazla vaat etme (denetim F4).
  const indirimKapsam =
    yillikInd && omurInd ? 'yıllık ve ömür boyunda' : yillikInd ? 'yıllıkta' : 'ömür boyunda';
  // İlk giriş indiriminin kalan süresi (varsa). Süre bitince null → sayaç gizlenir.
  const geriSayim = geriSayimVar && indirim?.bitis ? kalanMetin(indirim.bitis, simdi) : null;

  // Yıllık gösterilecek fiyat: indirimli teklif varsa onun fiyatı, yoksa temel fiyat.
  function yillikGosterFiyat(): string {
    const ph = yillikIndirimliTeklif()?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice;
    return ph ?? fiyat(URUN_YILLIK);
  }
  // Ömür boyu gösterilecek fiyat: indirimli teklif varsa onun (indirimli) fiyatı, yoksa temel fiyat.
  function omurboyuGosterFiyat(): string {
    return (
      omurboyuIndirimliTeklif()?.formattedPrice ??      // Android: temel ürüne eklenmiş indirim teklifi
      iosIndirimliOmurUrun()?.displayPrice ??           // iOS: ayrı indirimli ürünün kendi fiyatı
      fiyat(URUN_OMURBOYU)
    );
  }

  // Android abonelik için offerToken (requestPurchase subs bunu ister).
  // İndirim hakkı olan kullanıcıya (YALNIZ yıllık) indirimli teklif; yoksa TEMEL teklif seçilir.
  // (Eskiden hep [0] seçiliyordu — teklif eklenince yanlışlıkla herkese indirim gidebilirdi.)
  function offerToken(urun: string): string | undefined {
    const s = subscriptions.find((x) => x.id === urun);
    if (!s || s.platform !== 'android') return undefined;
    const teklifler = s.subscriptionOfferDetailsAndroid ?? [];
    if (urun === URUN_YILLIK) {
      const indirimli = yillikIndirimliTeklif();
      if (indirimli) return indirimli.offerToken;
    }
    const temel = teklifler.find((o) => !o.offerId) ?? teklifler[0];
    return temel?.offerToken;
  }

  async function satinAl(urun: string, abonelik: boolean) {
    if (!connected || islemUrun) return;
    setMesaj(null);
    setIslemUrun(urun);
    try {
      // Hesap kimliği (UUID) → satın alma mağaza tarafında da hesaba bağlanır (sunucu sahiplik kontrolü).
      const hesapId = kullanici?.id;
      if (Platform.OS === 'ios') {
        // iOS/StoreKit: indirim/teklif YOK (ilk sürüm base ürün — Android'deki offerToken sistemi
        // iOS'ta yok). appAccountToken = kullanıcı UUID (Apple tarafı hesaba bağlar). subs/in-app ayrı
        // çağrı — requestPurchase args `type` ile ayrışır (tek ternary TS'i daraltmaz).
        if (abonelik) {
          await requestPurchase({
            type: 'subs',
            request: { apple: { sku: urun, appAccountToken: hesapId } },
          });
        } else {
          await requestPurchase({
            type: 'in-app',
            request: { apple: { sku: urun, appAccountToken: hesapId } },
          });
        }
      } else if (abonelik) {
        const token = offerToken(urun);
        await requestPurchase({
          type: 'subs',
          request: {
            google: {
              skus: [urun],
              subscriptionOffers: token ? [{ sku: urun, offerToken: token }] : [],
              obfuscatedAccountId: hesapId,
            },
          },
        });
      } else {
        // Ömür boyu indirimi: base ürünü indirimli TEKLİF token'ıyla al (ayrı ürün yok). Token yoksa temel fiyat.
        const tekToken = urun === URUN_OMURBOYU ? omurboyuIndirimliTeklif()?.offerToken : undefined;
        await requestPurchase({
          type: 'in-app',
          request: { google: { skus: [urun], obfuscatedAccountId: hesapId, offerToken: tekToken } },
        });
      }
      // Başarı/başarısızlık native listener'a (onPurchaseSuccess/onPurchaseError) düşer.
    } catch (e) {
      setIslemUrun(null);
      setMesaj({ tip: 'hata', metin: __DEV__ ? `İstek hatası: ${e instanceof Error ? e.message : e}` : 'İşlem başlatılamadı.' });
    }
  }

  // iOS: Apple'ın NATIVE indirim/teklif kodu ekranını uygulama içinden açar (App Store offer code).
  // Bu Apple'ın kendi mekanizması → 3.1.1 uyumlu (kendi promo-kod ekranımız /promo-kod iOS'ta gizli).
  // Yalnız gerçek cihazda çalışır (simülatörde no-op). Kullanıcı kodu girip indirimli satın alır.
  async function iosIndirimKodu() {
    try {
      await presentCodeRedemptionSheetIOS();
    } catch {
      setMesaj({ tip: 'hata', metin: 'İndirim kodu ekranı açılamadı. Lütfen tekrar dene.' });
    }
  }

  async function geriYukle() {
    setMesaj(null);
    setDurum('dogrulaniyor');
    try {
      // Play'deki mevcut satın almaları çek → HER BİRİNİ SUNUCUDA yeniden doğrula (hak yaz).
      const alinmis = await getAvailablePurchases();
      let dogrulandi = 0;
      let reddi: string | null = null; // sunucunun NET reddi (örn. "başka hesaba bağlı")
      for (const p of alinmis) {
        const token = p.purchaseToken ?? '';
        if (!token) continue;
        // ACKNOWLEDGE her durumda → iade/iptal önlenir; sahiplik kalır.
        await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
        try {
          const sonuc = await satinAlmaDogrula(p.productId, token);
          if (sonuc.ok) dogrulandi++;
        } catch (e) {
          if (e instanceof DogrulamaReddi) reddi = e.message;
        }
      }
      await yenile();
      setMesaj(
        dogrulandi > 0
          ? { tip: 'basari', metin: 'Satın alımların doğrulandı — erişimin açıldı.' }
          : {
              tip: 'hata',
              metin:
                reddi ??
                'Aktif satın alma bulunamadı. Ödeme yaptıysan birkaç dakika sonra tekrar dene.',
            },
      );
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
            Mağaza bağlantısı kurulamadı. Satın alma yalnızca mağazadan ({ios ? 'App Store' : 'Google Play'})
            yüklenmiş gerçek uygulamada çalışır (Expo Go'da değil).
          </AppText>
        </View>
      ) : null}

      {cihazKilit ? (
        <View style={[styles.bilgiKart, styles.kilitKart]}>
          <MaterialCommunityIcons name="shield-alert-outline" size={22} color={Palette.kirmizi} />
          <AppText variant="kucuk" color="anaMetin" style={styles.esnek}>
            Hesabın kısa sürede çok fazla farklı cihazda kullanıldığı için güvenlik amacıyla geçici
            olarak kilitlendi. Üyeliğin geçerli — açmak için{' '}
            <AppText
              variant="kucuk"
              color="lacivert"
              bold
              onPress={() => void Linking.openURL('mailto:iletisim@mevzujsps.com?subject=Hesap%20kilidi')}>
              iletisim@mevzujsps.com
            </AppText>
            {' '}adresine yaz.
          </AppText>
        </View>
      ) : null}

      {/* TEK PAKET kartı — kapsam listesi + duruma göre planlar / yükseltme / tam-erişim */}
      <View style={styles.kart}>
        <View style={styles.kartUst}>
          <View style={styles.kartIkon}>
            <MaterialCommunityIcons name="crown-outline" size={24} color={Palette.altinKoyu} />
          </View>
          <View style={styles.esnek}>
            <AppText variant="govde" bold>
              Tam Erişim
            </AppText>
            <AppText variant="etiket" color="solukMetin">
              Tek paket — uygulamadaki her şey dahil.
            </AppText>
          </View>
          {sahipOmur || sahipYillik ? (
            <View style={styles.sahipRozet}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={Palette.yesil} />
              <AppText variant="etiket" color="yesil" bold>
                {sahipOmur ? 'Aktif' : 'Yıllık aktif'}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.kapsam}>
          {KAPSAM.map((k) => (
            <View key={k} style={styles.kapsamSatir}>
              <MaterialCommunityIcons name="check" size={16} color={Palette.yesil} />
              <AppText variant="etiket" color="anaMetin" style={styles.esnek}>
                {k}
              </AppText>
            </View>
          ))}
        </View>

        {sahipOmur ? (
          <AppText variant="kucuk" color="yesil" bold style={styles.sahipMetin}>
            Ömür boyu tam erişimin var — her şey açık.
          </AppText>
        ) : sahipYillik ? (
          // Yıllık sahibi → ömür boyuna geçiş. Android: FARK fiyatıyla (URUN_YUKSELTME).
          // iOS: fark ürünü yok → TAM fiyatla ömür boyu (URUN_OMURBOYU).
          <View style={styles.yukseltmeSar}>
            <AppText variant="kucuk" color="yesil" bold style={styles.sahipMetin}>
              {ios
                ? 'Yıllık planın aktif. İstersen ömür boyu tam erişime geçebilirsin.'
                : 'Yıllık planın aktif. İstersen aradaki farkı ödeyerek ömür boyuna geçebilirsin.'}
            </AppText>
            <PlanButon
              baslik={ios ? 'Ömür boyuna geç' : 'Ömür boyuna yükselt'}
              fiyat={fiyat(yukseltUrun)}
              altYazi={ios ? 'tek seferlik — tam erişim' : 'tek seferlik fark ödemesi'}
              vurgu
              mesgul={islemUrun === yukseltUrun}
              pasif={!connected || (!!islemUrun && islemUrun !== yukseltUrun)}
              onPress={() => void satinAl(yukseltUrun, false)}
            />
            <AppText variant="etiket" color="solukMetin" style={styles.yukseltmeNot}>
              Geçtikten sonra yıllık aboneliğin otomatik iptal OLMAZ — çift ödeme olmaması için{' '}
              <AppText
                variant="etiket"
                color="lacivert"
                bold
                onPress={() => void Linking.openURL(ABONELIK_YONETIM)}>
                {ios ? 'Ayarlar → Abonelikler' : 'Google Play → Abonelikler'}
              </AppText>
              'den yıllığı iptal et (kalan süren zaten ömür boyu erişimin içinde).
            </AppText>
          </View>
        ) : (
          <>
            {indirimUygulanabilir && indirim ? (
              <View style={styles.indirimSerit}>
                <MaterialCommunityIcons
                  name={geriSayim ? 'clock-fast' : 'ticket-percent'}
                  size={18}
                  color={Palette.yesil}
                />
                <AppText variant="kucuk" color="yesil" bold style={styles.esnek}>
                  %{indirim.yuzde} indirimin uygulanıyor — {indirimKapsam} geçerli.
                  {geriSayim
                    ? indirim.kaynak === 'kampanya'
                      ? ` Kampanya bitişine ${geriSayim} kaldı!`
                      : ` İlk gün fırsatı: ${geriSayim} kaldı!`
                    : indirim.kaynak === 'ilk_giris'
                      ? ' (ilk gün fırsatı)'
                      : ''}
                </AppText>
              </View>
            ) : null}
            <View style={styles.planlar}>
              <PlanButon
                baslik="Yıllık"
                fiyat={yillikGosterFiyat()}
                // İndirimliyken ANA fiyatı üstü çizili göster → indirim base fiyat üzerinden belli olsun.
                eskiFiyat={yillikIndirimliTeklif() ? fiyat(URUN_YILLIK) : undefined}
                altYazi={
                  yillikIndirimliTeklif() ? `/yıl · %${indirim?.yuzde} indirimli` : '/yıl · yenilenir'
                }
                mesgul={islemUrun === URUN_YILLIK}
                pasif={!connected || (!!islemUrun && islemUrun !== URUN_YILLIK)}
                onPress={() => void satinAl(URUN_YILLIK, true)}
              />
              <PlanButon
                baslik="Ömür boyu"
                fiyat={omurboyuGosterFiyat()}
                eskiFiyat={omurboyuIndirimliTeklif() ? fiyat(URUN_OMURBOYU) : undefined}
                altYazi={
                  omurboyuIndirimliTeklif()
                    ? `tek seferlik · %${indirim?.yuzde} indirimli`
                    : 'tek seferlik · hep senin'
                }
                vurgu
                mesgul={islemUrun === omurboyuSku()}
                pasif={!connected || (!!islemUrun && islemUrun !== URUN_OMURBOYU)}
                onPress={() => void satinAl(omurboyuSku(), false)}
              />
            </View>
          </>
        )}
      </View>

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
        onPress={() => void geriYukle()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Satın alımları geri yükle">
        <MaterialCommunityIcons name="restore" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" color="lacivert" bold>
          Satın alımları geri yükle
        </AppText>
      </Pressable>

      {/* İndirim/promosyon kodu — platforma göre DOĞRU mekanizma:
          • iOS: Apple'ın NATIVE offer-code ekranı (presentCodeRedemptionSheetIOS) → 3.1.1 uyumlu.
            (Kendi /promo-kod ekranımız iOS'ta gizli; App Store dışı içerik açma yasak.)
          • Android: kendi /promo-kod ekranımız (Google izin verir). */}
      <Pressable
        style={({ pressed }) => [styles.geriYukleBtn, pressed && styles.pressed]}
        onPress={() => (ios ? void iosIndirimKodu() : router.push('/promo-kod'))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="İndirim kodu kullan">
        <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" color="lacivert" bold>
          İndirim kodum var
        </AppText>
      </Pressable>

      <AppText variant="etiket" color="solukMetin" style={styles.yasal}>
        Yıllık plan bir aboneliktir ve iptal edilmezse her yıl otomatik yenilenir; dilediğin zaman{' '}
        {ios ? 'Ayarlar → Abonelikler' : 'Google Play → Abonelikler'}'den iptal edebilirsin. Ömür boyu
        plan tek seferlik ödemedir. Ödemeler {ios ? 'App Store' : 'Google Play'} üzerinden alınır.
      </AppText>

      {/* Apple 3.1.2 (ve Google): otomatik yenilenen abonelikte ödeme ekranında işlevsel
          Kullanım Şartları (EULA) + Gizlilik Politikası linki ZORUNLU. */}
      <View style={styles.yasalLinkler}>
        <AppText
          variant="etiket"
          color="lacivert"
          bold
          onPress={() => router.push({ pathname: '/yasal', params: { tip: 'sartlar' } })}>
          Kullanım Şartları
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          {'   ·   '}
        </AppText>
        <AppText
          variant="etiket"
          color="lacivert"
          bold
          onPress={() => router.push({ pathname: '/yasal', params: { tip: 'gizlilik' } })}>
          Gizlilik Politikası
        </AppText>
      </View>
    </>
  );
}

function PlanButon({
  baslik,
  fiyat,
  eskiFiyat,
  altYazi,
  vurgu,
  mesgul,
  pasif,
  onPress,
}: {
  baslik: string;
  fiyat: string;
  eskiFiyat?: string;
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
          {eskiFiyat ? (
            <AppText
              variant="etiket"
              color={vurgu ? 'beyaz' : 'solukMetin'}
              style={styles.eskiFiyat}>
              {eskiFiyat}
            </AppText>
          ) : null}
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
  kilitKart: {
    backgroundColor: 'rgba(192,0,0,0.06)',
    borderColor: Palette.kirmizi,
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
  kapsam: {
    gap: Spacing.one,
  },
  kapsamSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sahipRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sahipMetin: {
    paddingBottom: Spacing.one,
  },
  yukseltmeSar: {
    gap: Spacing.two,
  },
  yukseltmeNot: {
    lineHeight: 16,
  },
  planlar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  indirimSerit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.s,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
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
  eskiFiyat: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
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
  yasalLinkler: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pressed: {
    opacity: 0.85,
  },
});
