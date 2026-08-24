/**
 * BAYAT İÇERİK TAZELEME — sunucuda düzeltilen bir kart görselini/sesini, o kanunu ZATEN
 * İNDİRMİŞ cihazlara ulaştırır.
 *
 * NEDEN (24 Ağu 2026): Jandarma Teşkilat Yön. m.1 kartı uygulamada 4 sütunlu ESKİ hâliyle
 * duruyordu (fabrikada 21 Haziran'da 7 sütunlu doğrusu üretilmiş ama aktarılmamış). Görsel
 * sunucuda düzeltildi — fakat `indirme.ts` "dosya var + doluysa atla" dediği için kanunu
 * indirmiş cihazlarda ESKİ kopya kalıyordu. Dosya adı değişmediğinden önbellek de ıskalamaz.
 *
 * NASIL: sunucuda iki ayar tutulur —
 *   `bayat_icerik`       : JSON dizi, tazelenecek yollar (ör. ["jandteskyon/jandteskyon_m1_1.webp"])
 *   `bayat_icerik_damga` : bu listenin damgası (ör. "2026-08-24-1"). Damga DEĞİŞMEDİKÇE
 *                          cihaz hiçbir şey yapmaz → her açılışta boşuna iş yok.
 * Cihaz: damga yeniyse listedeki dosyaları siler, sonra o kanunların indirmesini tetikler.
 * `kanunIndir` var olan dosyaları atladığı için YALNIZ silinenler iner (birkaç yüz KB).
 *
 * EMNİYET: silme ile yeniden inme arasında kart açılırsa StudyCard `onError` ile uzak
 * kaynağa düşer (zaten var olan davranış) → kullanıcı yine DOĞRU görseli görür, bozuk kart yok.
 * Her hata yutulur; bu iş kullanıcı akışını asla bozmamalı.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { bozukIcerikSil, indirmeDestekli, kanunIndirBaslat, kanunIndirilmisMi } from '@/lib/indirme';
import { ayarOku } from '@/lib/uzak-ayar';

const DAMGA_ANAHTARI = 'jsps.bayat.damga';

export async function bayatIcerikTazele(): Promise<void> {
  if (!indirmeDestekli) return;
  try {
    const damga = await ayarOku('bayat_icerik_damga');
    if (!damga) return; // sunucuda iş yok
    const yerelDamga = await AsyncStorage.getItem(DAMGA_ANAHTARI);
    if (yerelDamga === damga) return; // bu tazeleme zaten yapıldı

    const ham = await ayarOku('bayat_icerik');
    let yollar: string[] = [];
    try {
      const c = ham ? JSON.parse(ham) : [];
      if (Array.isArray(c)) yollar = c.filter((y) => typeof y === 'string' && y.includes('/'));
    } catch {
      return; // bozuk liste → dokunma (damgayı da yazma, düzelince tekrar denenir)
    }

    const klasorler = new Set<string>();
    for (const yol of yollar) {
      const klasor = yol.slice(0, yol.indexOf('/'));
      // İnmemiş kanunda yapacak bir şey yok: kart zaten sunucudaki güncel hâlini gösterir.
      if (!klasor || !kanunIndirilmisMi(klasor)) continue;
      await bozukIcerikSil(yol);
      klasorler.add(klasor);
    }

    for (const klasor of klasorler) {
      await kanunIndirBaslat(klasor).catch(() => {});
    }
    // Damga her hâlükârda yazılır: indirme aksasa bile dosya silindiği için kart uzak
    // kaynaktan DOĞRU görünür, bir sonraki kanun indirmesinde yerel kopya da tamamlanır.
    await AsyncStorage.setItem(DAMGA_ANAHTARI, damga);
  } catch {
    /* sessiz — tazeleme kullanıcı akışını asla bozmaz */
  }
}
