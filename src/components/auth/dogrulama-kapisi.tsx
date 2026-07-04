/**
 * E-posta doğrulama KAPISI — içerik ekranlarını (Mevzuat/Tatbikat) sarar.
 * Kural: girişe izin var (kayıt sonrası kullanıcı içeri girer) ama e-posta DOĞRULANMADAN
 * içeriğe girilemez. Sunucudan taze okunur; offline/hata → FAIL-OPEN (mağduriyet yok).
 * Telefonla ya da Google ile girenler zaten doğrulanmış sayılır (confirmed_at dolu).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnaButon } from '@/components/auth/ana-buton';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { dogrulamaMailiGonder, epostaDogrulanmisMi } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

// Kullanıcı bir kez doğrulandıysa oturum boyunca tekrar sunucuya sorma (ekran odağı başına sorgu olmasın).
const dogrulanmislar = new Set<string>();

export function DogrulamaKapisi({ children }: { children: ReactNode }) {
  const { kullanici } = useAuth();
  const [kapali, setKapali] = useState(false); // true = doğrulanmamış → kapı ekranı
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const kontrol = useCallback(async () => {
    if (!kullanici || dogrulanmislar.has(kullanici.id)) {
      setKapali(false);
      return;
    }
    const sonuc = await epostaDogrulanmisMi();
    if (sonuc === true) {
      dogrulanmislar.add(kullanici.id);
      setKapali(false);
      setMesaj(null);
    } else if (sonuc === false) {
      setKapali(true);
    } else {
      setKapali(false); // okunamadı (offline) → fail-open
    }
  }, [kullanici]);

  useFocusEffect(
    useCallback(() => {
      void kontrol();
    }, [kontrol]),
  );

  if (!kapali || !kullanici) return <>{children}</>;

  async function tekrarGonder() {
    if (!kullanici?.email) return;
    setMesgul(true);
    try {
      await dogrulamaMailiGonder(kullanici.email);
      setMesaj('Doğrulama e-postası gönderildi — gelen kutunu (ve spam klasörünü) kontrol et.');
    } catch {
      setMesaj('Gönderilemedi. Biraz bekleyip tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  async function dogruladim() {
    setMesgul(true);
    setMesaj(null);
    try {
      await kontrol();
      // hâlâ kapalıysa kullanıcı linke tıklamamış demektir
      setMesaj((m) => m ?? 'Henüz doğrulanmamış görünüyor. Maildeki bağlantıya dokunduktan sonra tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <Screen title="E-posta Doğrulama">
      <View style={styles.kart}>
        <MaterialCommunityIcons name="email-alert-outline" size={44} color={Palette.altinKoyu} />
        <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
          Önce e-postanı doğrula
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
          {kullanici.email ?? 'E-posta adresine'} bir doğrulama bağlantısı gönderdik. İçeriğe
          erişmek için o bağlantıya dokunman yeterli — sonra buraya dönüp "Doğruladım"a bas.
        </AppText>
        {mesaj ? (
          <AppText variant="kucuk" color="amber" bold style={styles.ortali}>
            {mesaj}
          </AppText>
        ) : null}
        <AnaButon etiket="Doğruladım — kontrol et" onPress={() => void dogruladim()} mesgul={mesgul} />
        <AppText
          variant="kucuk"
          color="lacivert"
          bold
          style={styles.ortali}
          onPress={() => {
            if (!mesgul) void tekrarGonder();
          }}>
          Doğrulama e-postasını tekrar gönder
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kart: {
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  ortali: {
    textAlign: 'center',
  },
});
