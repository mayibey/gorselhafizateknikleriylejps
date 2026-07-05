/**
 * Paywall + satın alma akışı (expo-iap, DİREKT Google Play Billing).
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
import { getAvailablePurchases, type Purchase, useIAP } from 'expo-iap';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Arma } from '@/components/auth/arma';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  ABONELIK_URUNLERI,
  INDIRIMLI_OMURBOYU_URUNLERI,
  TEK_SEFERLIK_URUNLERI,
  URUN_OMURBOYU,
  URUN_YILLIK,
  URUN_YUKSELTME,
} from '@/constants/urunler';
import { useAuth } from '@/lib/auth-context';
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
        Satın alma yalnızca Android uygulamasında (Google Play) yapılabilir. Web sürümünde önizleme
        amaçlıdır.
      </AppText>
    </View>
  );
}

/** Kalan süreyi "S sa D dk" (1 saatten çoksa) ya da "D dk S sn" biçiminde yazar. Bitti/negatif → null. */
function kalanYazi(bitisISO: string, simdi: number): string | null {
  const kalan = Math.floor((new Date(bitisISO).getTime() - simdi) / 1000);
  if (kalan <= 0) return null;
  const sa = Math.floor(kalan / 3600);
  const dk = Math.floor((kalan % 3600) / 60);
  const sn = kalan % 60;
  return sa > 0 ? `${sa} sa ${dk} dk` : `${dk} dk ${sn} sn`;
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

  // İLK GİRİŞ indirimi için CANLI geri sayım — bitiş sunucudan gelir; yalnız gerekince saniyede bir tikler.
  const [simdi, setSimdi] = useState(() => Date.now());
  const geriSayimVar = indirim != null && indirim.kaynak === 'ilk_giris' && !!indirim.bitis;
  useEffect(() => {
    if (!geriSayimVar) return;
    const t = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(t);
  }, [geriSayimVar]);

  // Sahiplik TİPE göre: ömür boyu → tam; yalnız yıllık → yükseltme teklif edilir.
  const sahipOmur = aktifHaklar.some((h) => h.tip === 'omurboyu');
  const sahipYillik = !sahipOmur && aktifHaklar.some((h) => h.tip === 'abonelik');

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
    // İndirimli ömür boyu SKU'ları da çek (varsa fiyatını/satın almasını gösterebilelim; yoksa sessiz).
    void fetchProducts({ skus: [...TEK_SEFERLIK_URUNLERI, ...INDIRIMLI_OMURBOYU_URUNLERI], type: 'in-app' });
    void fetchProducts({ skus: ABONELIK_URUNLERI, type: 'subs' });
  }, [connected]);

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
  // Ömür boyu için indirimli ürün (durum + Play'de o SKU çekilebildiyse). Yoksa undefined.
  function omurboyuIndirimliUrun() {
    if (!indirim) return undefined;
    return products.find((p) => p.id === indirim.omurboyu_urun);
  }
  // İndirim GERÇEKTEN uygulanabilir mi (Play tarafı hazır)? Banner/etiket yalnız buna göre gösterilir
  // → "indirim vaat edip tam fiyat çekme" olmaz.
  const indirimUygulanabilir = !!(yillikIndirimliTeklif() || omurboyuIndirimliUrun());
  // İlk giriş indiriminin kalan süresi (varsa). Süre bitince null → sayaç gizlenir.
  const geriSayim = geriSayimVar && indirim?.bitis ? kalanYazi(indirim.bitis, simdi) : null;

  // Yıllık gösterilecek fiyat: indirimli teklif varsa onun fiyatı, yoksa temel fiyat.
  function yillikGosterFiyat(): string {
    const ph = yillikIndirimliTeklif()?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice;
    return ph ?? fiyat(URUN_YILLIK);
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
      // obfuscatedAccountId = kullanıcının hesap kimliği → satın alma GOOGLE tarafında da hesaba bağlanır.
      const hesapId = kullanici?.id;
      if (abonelik) {
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
        await requestPurchase({
          type: 'in-app',
          request: { google: { skus: [urun], obfuscatedAccountId: hesapId } },
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
            Play Store bağlantısı kurulamadı. Satın alma yalnızca Google Play'den yüklenmiş gerçek
            uygulamada çalışır (Expo Go'da değil).
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
          // Yıllık sahibi → ömür boyuna FARK fiyatıyla yükseltme teklifi.
          <View style={styles.yukseltmeSar}>
            <AppText variant="kucuk" color="yesil" bold style={styles.sahipMetin}>
              Yıllık planın aktif. İstersen aradaki farkı ödeyerek ömür boyuna geçebilirsin.
            </AppText>
            <PlanButon
              baslik="Ömür boyuna yükselt"
              fiyat={fiyat(URUN_YUKSELTME)}
              altYazi="tek seferlik fark ödemesi"
              vurgu
              mesgul={islemUrun === URUN_YUKSELTME}
              pasif={!connected || (!!islemUrun && islemUrun !== URUN_YUKSELTME)}
              onPress={() => void satinAl(URUN_YUKSELTME, false)}
            />
            <AppText variant="etiket" color="solukMetin" style={styles.yukseltmeNot}>
              Yükselttikten sonra yıllık aboneliğin otomatik iptal OLMAZ — çift ödeme olmaması için{' '}
              <AppText
                variant="etiket"
                color="lacivert"
                bold
                onPress={() => void Linking.openURL(PLAY_ABONELIKLER)}>
                Google Play → Abonelikler
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
                  %{indirim.yuzde} indirimin uygulanıyor — yıllık ve ömür boyunda geçerli.
                  {geriSayim
                    ? ` İlk gün fırsatı: ${geriSayim} kaldı!`
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
                altYazi={
                  yillikIndirimliTeklif() ? `/yıl · %${indirim?.yuzde} indirimli` : '/yıl · yenilenir'
                }
                mesgul={islemUrun === URUN_YILLIK}
                pasif={!connected || (!!islemUrun && islemUrun !== URUN_YILLIK)}
                onPress={() => void satinAl(URUN_YILLIK, true)}
              />
              <PlanButon
                baslik="Ömür boyu"
                fiyat={omurboyuIndirimliUrun()?.displayPrice ?? fiyat(URUN_OMURBOYU)}
                altYazi={
                  omurboyuIndirimliUrun()
                    ? `tek seferlik · %${indirim?.yuzde} indirimli`
                    : 'tek seferlik · hep senin'
                }
                vurgu
                mesgul={islemUrun === (omurboyuIndirimliUrun()?.id ?? URUN_OMURBOYU)}
                pasif={
                  !connected ||
                  (!!islemUrun && islemUrun !== (omurboyuIndirimliUrun()?.id ?? URUN_OMURBOYU))
                }
                onPress={() => void satinAl(omurboyuIndirimliUrun()?.id ?? URUN_OMURBOYU, false)}
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

      <Pressable
        style={({ pressed }) => [styles.geriYukleBtn, pressed && styles.pressed]}
        onPress={() => router.push('/promo-kod')}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Promosyon kodu kullan">
        <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={Palette.lacivert} />
        <AppText variant="kucuk" color="lacivert" bold>
          Promosyon veya indirim kodun mu var?
        </AppText>
      </Pressable>

      <AppText variant="etiket" color="solukMetin" style={styles.yasal}>
        Yıllık plan bir aboneliktir ve iptal edilmezse her yıl otomatik yenilenir; dilediğin zaman
        Google Play → Abonelikler'den iptal edebilirsin. Ömür boyu plan tek seferlik ödemedir.
        Ödemeler Google Play üzerinden alınır.
      </AppText>
    </>
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
