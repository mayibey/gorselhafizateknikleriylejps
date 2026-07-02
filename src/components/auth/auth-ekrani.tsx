/**
 * Premium giriş / kayıt ekranı (KREM tema). Referans tasarıma uyarlandı:
 * karakter figürü (kemer üstü) + altın arma + temalı girdiler + Google/Apple + güvenlik notu.
 * - mod 'giris': e-posta/şifre + şifremi unuttum + Giriş yap.
 * - mod 'kayit': adım göstergesi (1) + e-posta/şifre/tekrar + şartlar + Devam et.
 * Oturum açılınca akışı (profil/branş) onboarding + auth-context yönetir.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { RESMI_BAGLANTI_YOK } from '@/constants/yasal-metin';
import { epostaGiris, epostaKayit, epostaKullanimda, girisDonusAdresi, sifreSifirla } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { epostaHatasi, sifreHatasi } from '@/lib/dogrulama';
import { sifreSizmisMi } from '@/lib/sifre-guvenlik';

import { AdimGostergesi } from './adim-gostergesi';
import { AnaButon } from './ana-buton';
import { Arma } from './arma';
import { AuthGirdi } from './auth-girdi';
import { DekoratifArkaplan } from './dekoratif-arkaplan';
import { KarakterFigur } from './karakter-figur';
import { SaglayiciButonlari } from './saglayici-butonlari';

type Mod = 'giris' | 'kayit';
type Mesaj = { tip: 'hata' | 'bilgi'; metin: string };

function hataMetni(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (/invalid login credentials/i.test(m)) return 'E-posta veya şifre hatalı.';
  if (/already registered|already exists/i.test(m)) return 'Bu e-posta zaten kayıtlı. Giriş yap.';
  if (/email not confirmed/i.test(m)) return 'E-postanı doğrula (gelen kutunu kontrol et).';
  return __DEV__ && m ? `Hata: ${m}` : 'İşlem yapılamadı, tekrar dene.';
}

export function AuthEkrani() {
  const router = useRouter();
  const { girisYap } = useAuth();
  const [mod, setMod] = useState<Mod>('giris');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [sartlar, setSartlar] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [mesaj, setMesaj] = useState<Mesaj | null>(null);

  const kayitMi = mod === 'kayit';

  const RIZA_UYARI = "Devam etmek için Kullanım Şartları ve Gizlilik Politikası'nı kabul et.";

  async function google() {
    if (!sartlar) return setMesaj({ tip: 'hata', metin: RIZA_UYARI });
    setMesaj(null);
    setMesgul(true);
    try {
      await girisYap();
    } catch (e) {
      setMesaj({ tip: 'hata', metin: hataMetni(e) });
    } finally {
      setMesgul(false);
    }
  }

  function apple() {
    if (!sartlar) return setMesaj({ tip: 'hata', metin: RIZA_UYARI });
    setMesaj({ tip: 'bilgi', metin: 'Apple ile giriş iOS sürümünde aktifleşecek.' });
  }

  async function gonder() {
    if (!eposta.trim() || !sifre) {
      setMesaj({ tip: 'hata', metin: 'E-posta ve şifre gir.' });
      return;
    }
    if (!sartlar) return setMesaj({ tip: 'hata', metin: RIZA_UYARI });
    if (kayitMi) {
      const dHata = epostaHatasi(eposta) ?? sifreHatasi(sifre);
      if (dHata) return setMesaj({ tip: 'hata', metin: dHata });
      if (sifre !== sifreTekrar) return setMesaj({ tip: 'hata', metin: 'Şifreler aynı değil.' });
    }
    setMesaj(null);
    setMesgul(true);
    try {
      if (!kayitMi) {
        await epostaGiris(eposta, sifre);
      } else {
        if (await epostaKullanimda(eposta)) {
          setMesaj({ tip: 'hata', metin: 'Bu e-posta zaten kayıtlı. "Giriş yap"a geç.' });
          return;
        }
        if (await sifreSizmisMi(sifre)) {
          setMesaj({
            tip: 'hata',
            metin: 'Bu şifre bilinen veri ihlallerinde görülmüş. Güvenliğin için başka bir şifre seç.',
          });
          return;
        }
        const { dogrulamaGerek } = await epostaKayit(eposta, sifre);
        if (dogrulamaGerek) {
          setMesaj({
            tip: 'bilgi',
            metin: 'Doğrulama e-postası gönderildi. Onayladıktan sonra giriş yap.',
          });
        }
      }
    } catch (e) {
      // Giriş başarısız + e-posta kayıtlı DEĞİLSE → net "hesap yok" mesajı (tester #1).
      // (Kayıtlıysa veya kontrol edilemezse genel "e-posta/şifre hatalı".)
      if (!kayitMi && !(await epostaKullanimda(eposta).catch(() => true))) {
        setMesaj({ tip: 'hata', metin: 'Bu e-posta ile kayıtlı hesap yok. "Kayıt ol"a geçip üye ol.' });
      } else {
        setMesaj({ tip: 'hata', metin: hataMetni(e) });
      }
    } finally {
      setMesgul(false);
    }
  }

  async function sifremiUnuttum() {
    if (!eposta.trim()) return setMesaj({ tip: 'hata', metin: 'Önce e-posta adresini gir.' });
    try {
      await sifreSifirla(eposta);
      setMesaj({ tip: 'bilgi', metin: 'Şifre sıfırlama e-postası gönderildi.' });
    } catch (e) {
      setMesaj({ tip: 'hata', metin: hataMetni(e) });
    }
  }

  function modDegis(yeni: Mod) {
    setMod(yeni);
    setMesaj(null);
    setSifreTekrar('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <DekoratifArkaplan />
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        {/* Üst: arma (orta) + karakter (sağ) */}
        <View style={styles.ust}>
          <View style={styles.armaSar}>
            <Arma />
          </View>
          <KarakterFigur style={styles.karakter} />
        </View>

        <AppText variant="dev" bold color="lacivert">
          {kayitMi ? 'Hesap Oluştur' : 'Giriş Yap'}
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
          {kayitMi
            ? 'Hızlıca hesabını oluştur, sonra profilini tamamlayalım.'
            : 'Kaldığın yerden devam et, ilerlemene güvenle ulaş.'}
        </AppText>

        {kayitMi ? <AdimGostergesi adim={1} /> : null}

        <View style={styles.form}>
          <AuthGirdi
            ikon="email-outline"
            placeholder="E-posta adresi"
            value={eposta}
            onChangeText={setEposta}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="email"
          />
          <AuthGirdi
            ikon="lock-outline"
            placeholder="Şifre"
            value={sifre}
            onChangeText={setSifre}
            sifre
          />
          {kayitMi ? (
            <AuthGirdi
              ikon="lock-check-outline"
              placeholder="Şifre (tekrar)"
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
              sifre
            />
          ) : (
            <Pressable onPress={() => void sifremiUnuttum()} style={styles.unuttumSar} hitSlop={8}>
              <AppText variant="kucuk" color="lacivert" bold>
                Şifremi unuttum
              </AppText>
            </Pressable>
          )}

          <Pressable
            style={styles.sartSatir}
            onPress={() => setSartlar((s) => !s)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: sartlar }}
            accessibilityLabel="Kullanım Şartları ve Gizlilik Politikası'nı kabul ediyorum">
            <View style={[styles.kutu, sartlar && styles.kutuDolu]}>
              {sartlar ? (
                <MaterialCommunityIcons name="check" size={14} color={Palette.beyaz} />
              ) : null}
            </View>
            <AppText variant="etiket" color="solukMetin" style={styles.sartMetin}>
              <AppText
                variant="etiket"
                color="lacivert"
                bold
                onPress={() => router.push({ pathname: '/yasal', params: { tip: 'sartlar' } })}>
                Kullanım Şartları ve Gizlilik Politikası
              </AppText>
              'nı okudum, kabul ediyorum.
            </AppText>
          </Pressable>

          <AnaButon
            etiket={kayitMi ? 'Devam et' : 'Giriş yap'}
            onPress={() => void gonder()}
            mesgul={mesgul}
          />
          <View style={styles.btnArasi} />

          {mesaj ? (
            <AppText
              variant="kucuk"
              bold
              color={mesaj.tip === 'hata' ? 'kirmizi' : 'yesil'}
              style={styles.mesaj}>
              {mesaj.metin}
            </AppText>
          ) : null}
        </View>

        <View style={styles.ayrac}>
          <View style={styles.ayracCizgi} />
          <AppText variant="etiket" color="solukMetin">
            veya
          </AppText>
          <View style={styles.ayracCizgi} />
        </View>

        <SaglayiciButonlari onGoogle={() => void google()} onApple={apple} mesgul={mesgul} kayit={kayitMi} />

        <Pressable
          style={styles.altLink}
          onPress={() => modDegis(kayitMi ? 'giris' : 'kayit')}
          hitSlop={8}>
          <AppText variant="kucuk" color="solukMetin">
            {kayitMi ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
            <AppText variant="kucuk" color="lacivert" bold>
              {kayitMi ? 'Giriş yap' : 'Hesap oluştur'}
            </AppText>
          </AppText>
        </Pressable>

        <View style={styles.guvenlik}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color={Palette.solukMetin} />
          <AppText variant="etiket" color="solukMetin">
            Bilgilerin 256-bit şifreleme ile korunur.
          </AppText>
        </View>

        <AppText variant="etiket" color="solukMetin" style={styles.disclaimer}>
          {RESMI_BAGLANTI_YOK}
        </AppText>

        {__DEV__ ? (
          <View style={styles.teshis}>
            <AppText variant="etiket" color="solukMetin" bold>
              TEŞHİS — dönüş adresi (Supabase Redirect URLs listesinde OLMALI):
            </AppText>
            <AppText variant="etiket" color="lacivert" bold selectable>
              {girisDonusAdresi()}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  icerik: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: 12,
  },
  ust: {
    height: 140,
    justifyContent: 'flex-start',
  },
  armaSar: {
    position: 'absolute',
    top: Spacing.two,
    alignSelf: 'center',
  },
  karakter: {
    position: 'absolute',
    right: -Spacing.three,
    top: 0,
  },
  altyazi: {
    lineHeight: 20,
    maxWidth: '64%',
  },
  form: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  unuttumSar: {
    alignSelf: 'flex-end',
  },
  sartSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kutu: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Palette.kenarlik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuDolu: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  sartMetin: {
    flex: 1,
    lineHeight: 18,
  },
  btnArasi: {
    height: Spacing.one,
  },
  mesaj: {
    textAlign: 'center',
  },
  ayrac: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  ayracCizgi: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.kenarlik,
  },
  altLink: {
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 15,
    marginTop: Spacing.two,
    opacity: 0.8,
  },
  guvenlik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  teshis: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.two,
    gap: Spacing.half,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
