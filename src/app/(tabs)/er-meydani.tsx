import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { OYUN_MERKEZI_HTML } from '../../assets/oyun-merkezi-html';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/theme';
import { type OyunKayit, oyunKaydiGonder, oyunKaydiYaz, oyunKaydiYukle } from '@/lib/oyun-kayit';
import { useUyelik } from '@/lib/uyelik-context';

/**
 * OYUN MERKEZİ — sekmenin kendisi.
 *
 * Oyunlar tek bir web sayfası olarak yazıldı (14 oyun, bölüm haritası, madde metinleri) ve
 * uygulamanın içinde gömülü çalışıyor: internet olmasa da açılır. Er Meydanı bu menünün EN
 * BAŞINDA duruyor ama o WebView içinde DEĞİL — uygulamanın kendi ekranında (canlı rakip, oda,
 * lig). Menüde ona basılınca sayfa uygulamaya haber veriyor, biz lobiye götürüyoruz.
 *
 * YOL ADI KORUNDU: dosya hâlâ `er-meydani` — 10'dan fazla yerde `/er-meydani` yönlendirmesi ve
 * derin bağlantı (mevzujsps.com/oda/KOD) buraya düşüyor. Oda koduyla gelen kullanıcı oyun
 * menüsünde takılmasın diye doğrudan lobiye aktarılıyor.
 */
export default function OyunMerkeziScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ katilKod?: string }>();
  const web = useRef<WebView>(null);
  const [kayit, setKayit] = useState<OyunKayit | null>(null);
  const [hazir, setHazir] = useState(false);
  const menudeMi = useRef(true);
  // PREMIUM KAPISI: kilit kararını sayfa veriyor ama üyeliği BİLMİYOR — uygulamadan
  // söylenmezse herkesi ücretsiz sayar. Üyelik bilgisi sayfa açılmadan önce enjekte
  // edilir; bekleme bitmeden basılırsa ödeyen kullanıcı bir an kilitli görürdü.
  const { premium, yukleniyor: uyelikYukleniyor } = useUyelik();

  // Derin bağlantı: /oda/KOD → burada karşılanır, oda koduyla LOBİYE aktarılır.
  useEffect(() => {
    if (params.katilKod) {
      router.push({ pathname: '/er-meydani-lobi', params: { katilKod: params.katilKod } });
    }
  }, [params.katilKod, router]);

  // Kayıt sayfa yüklenmeden ÖNCE hazır olmalı (oyun açılışta okuyor) → önce yükle, sonra bas.
  useEffect(() => {
    void oyunKaydiYukle().then(setKayit);
  }, []);

  // Sekmeden ayrılırken bekleyen kaydı sunucuya it (4 sn'lik gecikmeyi kaçırmayalım).
  useFocusEffect(
    useCallback(() => {
      return () => {
        void oyunKaydiGonder();
      };
    }, []),
  );

  // Android geri tuşu: oyun içindeysek menüye dön, menüdeysek sekmeden çık.
  useFocusEffect(
    useCallback(() => {
      const abone = BackHandler.addEventListener('hardwareBackPress', () => {
        if (menudeMi.current) return false;
        web.current?.injectJavaScript('document.getElementById("geri")?.click(); true;');
        return true;
      });
      return () => abone.remove();
    }, []),
  );

  const mesaj = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const m = JSON.parse(e.nativeEvent.data) as {
          tip: string;
          ad?: string;
          anahtar?: string;
          deger?: string;
          oyunAd?: string;
          ekran?: string;
        };
        if (m.tip === 'hazir') setHazir(true);
        else if (m.tip === 'nerede') menudeMi.current = !m.ad;
        else if (m.tip === 'ekran' && m.ad === 'ermeydani') router.push('/er-meydani-lobi');
        else if (m.tip === 'ekran' && m.ad === 'paywall') router.push('/paywall');
        else if (m.tip === 'geribildirim') {
          // Oyunun içinden gelen hata/öneri: hangi oyun ve hangi ekran olduğu başlıkta
          // hazır gelsin ki kullanıcı "nerede oldu" diye yazmak zorunda kalmasın.
          router.push({
            pathname: '/geri-bildirim',
            params: { baslik: `Oyun: ${m.oyunAd ?? ''}${m.ekran ? ' · ' + m.ekran : ''}` },
          });
        } else if (m.tip === 'kayit' && m.anahtar) oyunKaydiYaz(m.anahtar, m.deger ?? '');
      } catch {
        /* yoksay */
      }
    },
    [router],
  );

  // BAŞLIK YOK — sayfanın KENDİ üst şeridi (lacivert + altın çizgi, uygulamanın kimliğiyle
  // birebir) başlık görevini görüyor; ayrıca oyun içindeyken geri oku ve "nasıl oynanır"
  // düğmesi orada. Üstüne bir de uygulamanın başlığını koyunca "Oyun Merkezi" iki kez
  // yazıyordu. Ortak `Screen` sarmalayıcısı da kullanılmıyor: onun gövdesinde kenar boşluğu
  // ve genişlik sınırı var, oyun onların içinde panel gibi duruyordu (başkan gösterdi).
  if (!kayit || uyelikYukleniyor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.ortala}>
          <ActivityIndicator color={Palette.lacivert} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.kap}>
        <WebView
          ref={web}
          originWhitelist={['*']}
          source={{ html: OYUN_MERKEZI_HTML, baseUrl: 'https://mevzujsps.com/oyun' }}
          // Kayıt, sayfanın kendi betiği çalışmadan ÖNCE yerine konur — oyun açılışta okuyor.
          injectedJavaScriptBeforeContentLoaded={`window.__MEVZU_KAYIT = ${JSON.stringify({
            ...kayit,
            mevzu_premium: premium ? '1' : '0',
          })}; true;`}
          onMessage={mesaj}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess={false}
          setSupportMultipleWindows={false}
          // Oyunda kaydırma sayfanın kendi gövdesinde; dışarıda ikinci bir kaydırma olmasın.
          scrollEnabled={false}
          style={styles.web}
        />
        {!hazir ? (
          <View style={styles.yukleniyor}>
            <ActivityIndicator color={Palette.lacivert} />
            <AppText variant="kucuk" color="solukMetin">Oyunlar hazırlanıyor…</AppText>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.kremZemin },
  kap: { flex: 1 },
  web: { flex: 1, backgroundColor: Palette.kremZemin },
  ortala: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  yukleniyor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kremZemin,
  },
});
