import { useWindowDimensions } from 'react-native';

/**
 * DİKEY ÖLÇEK (16 Ağu, başkan: "iOS'ta tam sığıyor, Android'de kayıyor").
 *
 * Gece Karargâh gibi "tek ekrana sığacak" kurgulanan sayfalar iPhone yüksekliğine
 * (~852dp) göre elle ayarlandı. Android telefonların kullanılabilir yüksekliği
 * hem cihazdan cihaza değişir hem sistem çubukları yüzünden genelde daha kısadır —
 * aynı sabit ölçüler taşar ve sayfa kaymaya başlar.
 *
 * Bu kanca ekranın gerçek yüksekliğini tasarım yüksekliğine oranlar; sabit ölçüler
 * bu katsayıyla çarpılınca kısa ekranda her şey orantılı küçülür, uzun ekranda
 * olduğu gibi kalır (1'i aşmaz — büyütme yapmayız, tasarım bozulmasın).
 * Alt sınır 0.78: ondan kısa cihazda küçültme yerine doğal kaydırma tercih edilir.
 */
export function useDikeyOlcek(tasarimYuksekligi = 852): number {
  const { height } = useWindowDimensions();
  if (!height) return 1;
  return Math.max(0.78, Math.min(1, height / tasarimYuksekligi));
}
