/**
 * Telegram bağlama kodu: sunucudaki `telegram_kod_uret` RPC'sini çağırır (kendi hesabın için 6 haneli
 * tek-kullanımlık kod üretir, 1 saat geçerli). Kullanıcı bu kodu Telegram'daki bota verip hesabını bağlar.
 */
import { supabase } from '@/lib/supabase';

export const TELEGRAM_BOT = 'Mevzujspsbot';

export async function telegramKodUret(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('telegram_kod_uret');
    if (error || !data) return null;
    return String(data).toUpperCase();
  } catch {
    return null;
  }
}
