import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKisiselOzellik } from '@/lib/ozellik';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { type OyunHtml, oyunHtmlGetir } from '@/lib/oyun-kaynak';
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
  const geceTema = useKisiselOzellik('talim-mevzuata');
  // YÜKLEME EKRANI (bayraklı, 16 Ağu — yalnız başkan + Kemalettin): sekmeye
  // dokunulduğu ANDA dağ görseli + "Oyunlar hazırlanıyor…" görünür. Eskiden
  // önce karanlık ekranda çıplak bir çember dönüyor, yazı ancak sayfa inince
  // bir anlığına görünüyordu. Bayrak kapalıysa davranış BİREBİR eski hâli.
  const geceYukleme = useKisiselOzellik('gece-er-meydani');
  // ÖNİZLEME (18 Ağu): boş-ekran düzeltmesi (süreç ölünce reload) yalnız başkan+Kemalettin'de
  // dener; onaylanınca herkese açılır (gerçek bir hata düzeltmesi olduğu için sonra genele).
  const onIzleme = useKisiselOzellik('on-izleme');
  const router = useRouter();
  const params = useLocalSearchParams<{ katilKod?: string; oyunKod?: string }>();
  const web = useRef<WebView>(null);
  const [kayit, setKayit] = useState<OyunKayit | null>(null);
  // Oyun sayfası SUNUCUDAN gelir, cihazda önbelleklenir, olmazsa gömülüye döner (lib/oyun-kaynak).
  // Böylece oyun düzeltmeleri için uygulama güncellemesi (OTA) gerekmiyor. null = henüz çözülmedi.
  const [oyunHtml, setOyunHtml] = useState<OyunHtml | null>(null);
  const [hazir, setHazir] = useState(false);
  const menudeMi = useRef(true);
  // PREMIUM KAPISI: kilit kararını sayfa veriyor ama üyeliği BİLMİYOR — uygulamadan
  // söylenmezse herkesi ücretsiz sayar. Üyelik bilgisi sayfa açılmadan önce enjekte
  // edilir; bekleme bitmeden basılırsa ödeyen kullanıcı bir an kilitli görürdü.
  const { premium, yukleniyor: uyelikYukleniyor } = useUyelik();

  // Derin bağlantı: /oda/KOD → burada karşılanır, oda koduyla LOBİYE aktarılır.
  useEffect(() => {
    let iptal = false;
    void oyunHtmlGetir().then((r) => {
      if (!iptal) setOyunHtml(r);
    });
    return () => {
      iptal = true;
    };
  }, []);

  useEffect(() => {
    if (params.katilKod) {
      router.push({ pathname: '/er-meydani-lobi', params: { katilKod: params.katilKod } });
    }
  }, [params.katilKod, router]);

  // OYUN DAVETİ DERİN BAĞLANTISI (/oyun/KOD → oyunKod): oyun sayfası HAZIR olunca kodu içeri
  // ilet; `meydanKabul` aynı bölüm/soruları açar (arkadaşın "meydan oku" linkindeki oyuna
  // birebir aynı sorularla girilir). Sayfa file:// yüklendiği için link kodu URL'de gelmiyor →
  // RN köprüsüyle enjekte ediyoruz. Savunmacı: meydanKabul yoksa sessiz no-op.
  useEffect(() => {
    if (hazir && params.oyunKod) {
      web.current?.injectJavaScript(
        `(function(){try{if(typeof meydanKabul==='function')meydanKabul(${JSON.stringify(params.oyunKod)});}catch(e){}})(); true;`,
      );
    }
  }, [hazir, params.oyunKod]);

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

  // Uygulama arka plana alınırken de it: oyuncu bölümü geçip sekmeden çıkmadan
  // uygulamayı kapatırsa bekleyen kayıt kaybolurdu.
  useEffect(() => {
    const abone = AppState.addEventListener('change', (durum) => {
      if (durum !== 'active') void oyunKaydiGonder();
    });
    return () => abone.remove();
  }, []);

  // OYUNLAR SEKMESİNE TEKRAR BASINCA MENÜYE DÖN (bayraklı, 16 Ağu — başkan:
  // "rütbe merdivenindeyken sekmeye tıklayınca hâlâ o ekranda kalıyor").
  // Sekme zaten açıkken tekrar basılırsa oyun sayfasına "menüye dön" komutu gider;
  // başka sekmeden dönüşte kalınan yer korunur (yarım oyun kaydı zaten sayfada).
  const navigation = useNavigation();
  useEffect(() => {
    if (!geceYukleme) return;
    // expo-router'ın tip haritasında 'tabPress' yok ama Bottom Tabs çalışma anında
    // bu olayı yayınlıyor — tip tarafında genişletmek gerekiyor.
    const abone = (navigation as unknown as {
      addListener: (tip: 'tabPress', cb: () => void) => () => void;
    }).addListener('tabPress', () => {
      if (!navigation.isFocused()) return;   // başka sekmeden geliş: yerine dokunma
      web.current?.injectJavaScript(
        `(function(){try{
           if(typeof acikOyun!=='undefined'&&(acikOyun||haritada)){
             if(typeof yeniTur==='function')yeniTur();
             acikOyun=null;haritada=false;
             var n=document.getElementById('nasil'); if(n)n.style.display='none';
             if(typeof menu==='function')menu();
           }
         }catch(e){}})(); true;`,
      );
    });
    return abone;
  }, [navigation, geceYukleme]);

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
          kunye?: string;
          soru?: string;
        };
        if (m.tip === 'hazir') setHazir(true);
        else if (m.tip === 'nerede') menudeMi.current = !m.ad;
        else if (m.tip === 'ekran' && m.ad === 'ermeydani') router.push('/er-meydani-lobi');
        else if (m.tip === 'ekran' && m.ad === 'paywall') router.push('/paywall');
        else if (m.tip === 'geribildirim') {
          // Oyunun içinden gelen hata/öneri: hangi oyun ve hangi ekran olduğu başlıkta
          // hazır gelsin ki kullanıcı "nerede oldu" diye yazmak zorunda kalmasın.
          // Başlıkta oyun adı İKİ KEZ yazılıyordu: bölüm haritasındayken sayfanın üst şeridi
          // de oyunun adını gösterdiği için "Oyun: X · X" çıkıyordu. Yer bilgisi oyun adıyla
          // aynıysa tekrarlamıyoruz.
          const oyunAd = m.oyunAd ?? '';
          const yer = m.ekran && m.ekran !== oyunAd ? ` · ${m.ekran}` : '';
          router.push({
            pathname: '/geri-bildirim',
            params: {
              baslik: `Oyun: ${oyunAd}${yer}`,
              // Ekrandaki maddenin künyesi + sorunun ilk satırı da kaydediliyor —
              // bozuk soru bildirilince hangi soru olduğu doğrudan görünsün.
              kanun: m.kunye ?? '',
              madde_no: m.soru ? m.soru.slice(0, 120) : '',
            },
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
  if (!kayit || !oyunHtml || uyelikYukleniyor) {
    if (geceYukleme) {
      return (
        <SafeAreaView style={styles.safeKoyu} edges={['top', 'left', 'right']}>
          <ImageBackground source={OYUN_YUKLEME_ARKA} style={styles.ortala} resizeMode="cover">
            <ActivityIndicator color={Palette.kirmiziParlak} />
            <AppText variant="baslik" color="kirmiziParlak" bold>Oyunlar hazırlanıyor…</AppText>
          </ImageBackground>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={[styles.safe, geceTema && styles.safeGece]} edges={['top', 'left', 'right']}>
        <View style={styles.ortala}>
          <ActivityIndicator color={Palette.lacivert} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, geceTema && styles.safeGece]} edges={['top', 'left', 'right']}>
      <View style={styles.kap}>
        <WebView
          ref={web}
          originWhitelist={['*']}
          source={{ html: oyunHtml.html, baseUrl: 'https://mevzujsps.com/oyun' }}
          // Kayıt, sayfanın kendi betiği çalışmadan ÖNCE yerine konur — oyun açılışta okuyor.
          injectedJavaScriptBeforeContentLoaded={`window.__MEVZU_KAYIT = ${JSON.stringify({
            ...kayit,
            mevzu_premium: premium ? '1' : '0',
          })}; true;`}
          onMessage={mesaj}
          // BOŞ EKRAN FIX (18 Ağu — başkan: "Patika'dayken arka plana aldım, dönünce
          // Oyunlar boş kaldı"). iOS uygulamayı arka planda tutarken bellek baskısıyla
          // WebView'in içerik sürecini öldürür; Android'de de render süreci gidebilir.
          // Süreç ölünce sayfa yeniden yüklenmezse gövde bomboş (krem) kalır. Her iki
          // platformda süreç ölümünü yakala → hazır bayrağını sıfırla + reload.
          onContentProcessDidTerminate={
            onIzleme
              ? () => {
                  setHazir(false);
                  web.current?.reload();
                }
              : undefined
          }
          onRenderProcessGone={
            onIzleme
              ? () => {
                  setHazir(false);
                  web.current?.reload();
                }
              : undefined
          }
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess={false}
          setSupportMultipleWindows={false}
          // Oyunda kaydırma sayfanın kendi gövdesinde; dışarıda ikinci bir kaydırma olmasın.
          scrollEnabled={false}
          style={styles.web}
        />
        {!hazir ? (
          geceYukleme ? (
            <ImageBackground source={OYUN_YUKLEME_ARKA} style={styles.yuklemeGece} resizeMode="cover">
              <ActivityIndicator color={Palette.kirmiziParlak} />
              <AppText variant="baslik" color="kirmiziParlak" bold>Oyunlar hazırlanıyor…</AppText>
            </ImageBackground>
          ) : (
            <View style={styles.yukleniyor}>
              <ActivityIndicator color={Palette.lacivert} />
              <AppText variant="kucuk" color="solukMetin">Oyunlar hazırlanıyor…</AppText>
            </View>
          )
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// Oyun sayfasındaki zeminin aynısı — yükleme anı ile sayfa arasında sıçrama olmasın.
const OYUN_YUKLEME_ARKA = require('../../../assets/images/oyun-yukleme.webp');

const styles = StyleSheet.create({
  safeGece: {
    backgroundColor: '#043C54', // gece taban — diğer sekmelerle aynı
  },
  safeKoyu: { flex: 1, backgroundColor: '#0A2434' },
  yuklemeGece: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
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
