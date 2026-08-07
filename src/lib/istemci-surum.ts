/**
 * İSTEMCİ SÜRÜM BİLDİRİMİ — kim hangi sürümde / hangi güncelleme paketinde?
 *
 * NEDEN: bir OTA yayınladığımızda kaç kişinin gerçekten aldığını göremiyorduk. Duyuru atıp
 * "uygulamayı kapat aç" dedikten sonra kaçının güncellediğini bilmek istiyoruz (başkan isteği,
 * 7 Ağu 2026). Her açılışta tek satır yazılır (kullanıcı başına tek kayıt, üzerine yazılır).
 *
 * `paket`: `Updates.updateId` — OTA paketi uygulanmışsa o paketin kimliği. Uygulanmamışsa null
 * döner ve 'gomulu' yazarız: yani kullanıcı hâlâ mağazadan indirdiği build'in kendi paketinde,
 * güncellemeyi ALMAMIŞ demektir. Sayacın esas ayrımı budur.
 *
 * ⚠️ Sayaç yalnızca bu kodu ALMIŞ kişileri sayabilir (kod da güncellemeyle geliyor). Bu bir
 * eksiklik değil; ölçmek istediğimiz şey zaten "kaç kişi güncellemeyi aldı".
 *
 * Sunucu tarafı: docs/v2/40_istemci_surum.sql (tablo + RPC). RPC yoksa sessizce geçer.
 */
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export async function istemciSurumBildir(): Promise<void> {
  if (!supabase) return;
  try {
    const paket = !Updates.isEnabled
      ? 'gelistirme'
      : (Updates.updateId ?? 'gomulu');
    await supabase.rpc('istemci_surum_kaydet', {
      p_app: Constants.expoConfig?.version ?? null,
      p_paket: paket,
      p_platform: Platform.OS,
    });
  } catch {
    /* sessiz — sürüm bildirimi kullanıcı akışını asla bozmamalı */
  }
}
