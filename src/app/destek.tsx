import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing, type PaletteColor } from '@/constants/theme';
import {
  type DestekDurum,
  type DestekMesaj,
  type DestekTalebi,
  destekTalepleriGetir,
  talebeMesajEkle,
  talepMesajlariGetir,
  yeniTalep,
} from '@/lib/destek';
import { destekGoruldu } from '@/lib/destek-okundu';
import { useKisiselOzellik } from '@/lib/ozellik';

type Goruntu = 'liste' | 'thread' | 'yeni';

const DURUM_RENK: Record<DestekDurum, PaletteColor> = {
  acik: 'amber',
  cevaplandi: 'yesil',
  kapandi: 'solukMetin',
};

const DURUM_ETIKET: Record<DestekDurum, string> = {
  acik: 'Açık',
  cevaplandi: 'Cevaplandı',
  kapandi: 'Kapandı',
};

/** Destek / Taleplerim — tek ekranda üç görünüm: talep listesi · thread · yeni talep formu. */
export default function DestekScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const [goruntu, setGoruntu] = useState<Goruntu>('liste');
  const [talepler, setTalepler] = useState<DestekTalebi[] | null>(null);
  const [seciliTalep, setSeciliTalep] = useState<DestekTalebi | null>(null);
  const [mesajlar, setMesajlar] = useState<DestekMesaj[] | null>(null);

  const listeYukle = useCallback(async () => {
    const liste = await destekTalepleriGetir();
    setTalepler(liste);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (goruntu === 'liste') void listeYukle();
      void destekGoruldu(); // ekran açık → okunmamış rozeti temizle
    }, [goruntu, listeYukle]),
  );

  async function talepAc(talep: DestekTalebi) {
    setSeciliTalep(talep);
    setMesajlar(null);
    setGoruntu('thread');
    const liste = await talepMesajlariGetir(talep.id);
    setMesajlar(liste);
  }

  function listeyeDon() {
    setSeciliTalep(null);
    setMesajlar(null);
    setGoruntu('liste');
  }

  const geriBas = goruntu === 'liste' ? () => router.back() : listeyeDon;

  const baslik =
    goruntu === 'thread'
      ? (seciliTalep?.konu ?? 'Talep')
      : goruntu === 'yeni'
        ? 'Yeni Talep'
        : 'Destek / Taleplerim';

  return (
    <Screen title={baslik} onGeri={geriBas} koyu={gece} kompaktBaslik={gece}>
      {goruntu === 'yeni' ? (
        <YeniTalepForm
          onGonderildi={async () => {
            await listeYukle();
            setGoruntu('liste');
          }}
        />
      ) : goruntu === 'thread' && seciliTalep ? (
        <ThreadGorunum
          talep={seciliTalep}
          mesajlar={mesajlar}
          onYenile={() => talepAc(seciliTalep)}
        />
      ) : (
        <ListeGorunum
          talepler={talepler}
          onYeni={() => setGoruntu('yeni')}
          onSec={(t) => void talepAc(t)}
        />
      )}
    </Screen>
  );
}

/** (a) TALEP LİSTESİ — üstte "Yeni Talep", altında talep kartları (konu + durum rozeti + tarih). */
function ListeGorunum({
  talepler,
  onYeni,
  onSec,
}: {
  talepler: DestekTalebi[] | null;
  onYeni: () => void;
  onSec: (t: DestekTalebi) => void;
}) {
  const gece = useKisiselOzellik('talim-mevzuata');
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.yeniBtn, gece && styles.btnGece, pressed && styles.pressed]}
        onPress={onYeni}>
        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={Palette.beyaz} />
        <AppText variant="govde" color="beyaz" bold>
          Yeni Talep
        </AppText>
      </Pressable>

      {talepler === null ? null : talepler.length === 0 ? (
        <View style={styles.bos}>
          <MaterialCommunityIcons
            name="lifebuoy"
            size={44}
            color={gece ? Palette.kartMetinIkincil : Palette.solukMetin}
          />
          <AppText variant="govde" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortala}>
            Henüz bir talebin yok. Bir sorun veya sorun için "Yeni Talep" ile bize yazabilirsin.
          </AppText>
        </View>
      ) : (
        talepler.map((t) => (
          <Pressable
            key={t.id}
            style={({ pressed }) => [styles.kart, gece && styles.kartGece, pressed && styles.pressed]}
            onPress={() => onSec(t)}>
            <View style={styles.kartUst}>
              <AppText
                variant="govde"
                bold
                color={gece ? 'beyaz' : 'anaMetin'}
                style={styles.konu}
                numberOfLines={2}>
                {t.konu}
              </AppText>
              <DurumRozet durum={t.durum} />
            </View>
            <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
              {tarihBicim(t.guncelleme_at)}
            </AppText>
          </Pressable>
        ))
      )}
    </>
  );
}

/** (b) THREAD — mesaj baloncukları (kullanıcı sağ / admin sol) + altta cevap kutusu. */
function ThreadGorunum({
  talep,
  mesajlar,
  onYenile,
}: {
  talep: DestekTalebi;
  mesajlar: DestekMesaj[] | null;
  onYenile: () => void;
}) {
  const gece = useKisiselOzellik('talim-mevzuata');
  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(false);

  async function gonder() {
    const temiz = metin.trim();
    if (!temiz || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(false);
    try {
      await talebeMesajEkle(talep.id, temiz);
      setMetin('');
      onYenile();
    } catch {
      setHata(true);
    } finally {
      setGonderiliyor(false);
    }
  }

  const kapali = talep.durum === 'kapandi';
  const gonderPasif = metin.trim().length === 0 || gonderiliyor;

  return (
    <>
      <View style={styles.threadUst}>
        <DurumRozet durum={talep.durum} />
        <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
          {tarihBicim(talep.created_at)}
        </AppText>
      </View>

      {mesajlar === null ? (
        <ActivityIndicator
          color={gece ? Palette.altinParlak : Palette.lacivert}
          style={styles.yukleniyor}
        />
      ) : (
        mesajlar.map((m) => <Baloncuk key={m.id} mesaj={m} />)
      )}

      {kapali ? (
        <View style={[styles.kapaliNot, gece && styles.kartGece]}>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={22}
            color={gece ? Palette.kartMetinIkincil : Palette.solukMetin}
          />
          <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.kapaliNotYazi}>
            Bu talep kapatıldı. Yeni bir sorunun olursa yeni talep açabilirsin.
          </AppText>
        </View>
      ) : (
        <>
          <TextInput
            style={[styles.girdi, gece && styles.girdiGece]}
            value={metin}
            onChangeText={setMetin}
            placeholder="Cevap yaz…"
            placeholderTextColor={gece ? 'rgba(226,236,240,0.5)' : Palette.solukMetin}
            multiline
            textAlignVertical="top"
            editable={!gonderiliyor}
          />
          {hata ? (
            <AppText variant="kucuk" color={gece ? 'kirmiziParlak' : 'kirmizi'} bold>
              Gönderilemedi, tekrar dene.
            </AppText>
          ) : null}
          <Pressable
            style={[styles.gonderBtn, gece && styles.btnGece, gonderPasif && styles.pasif]}
            disabled={gonderPasif}
            onPress={() => void gonder()}>
            {gonderiliyor ? (
              <ActivityIndicator color={Palette.beyaz} />
            ) : (
              <AppText variant="govde" color="beyaz" bold>
                Gönder
              </AppText>
            )}
          </Pressable>
        </>
      )}
    </>
  );
}

/** (c) YENİ TALEP formu — konu + ilk mesaj + gönder. */
function YeniTalepForm({ onGonderildi }: { onGonderildi: () => void | Promise<void> }) {
  const gece = useKisiselOzellik('talim-mevzuata');
  const [konu, setKonu] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(false);

  async function gonder() {
    const konuTemiz = konu.trim();
    const mesajTemiz = mesaj.trim();
    if (!konuTemiz || !mesajTemiz || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(false);
    try {
      await yeniTalep(konuTemiz, mesajTemiz);
      await onGonderildi();
    } catch {
      setHata(true);
    } finally {
      setGonderiliyor(false);
    }
  }

  const gonderPasif = konu.trim().length === 0 || mesaj.trim().length === 0 || gonderiliyor;

  return (
    <>
      <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold>
        KONU
      </AppText>
      <TextInput
        style={[styles.konuGirdi, gece && styles.girdiGece]}
        value={konu}
        onChangeText={setKonu}
        placeholder="Kısa bir başlık"
        placeholderTextColor={gece ? 'rgba(226,236,240,0.5)' : Palette.solukMetin}
        editable={!gonderiliyor}
        maxLength={120}
      />

      <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold style={styles.aralik}>
        MESAJ
      </AppText>
      <TextInput
        style={[styles.girdi, gece && styles.girdiGece]}
        value={mesaj}
        onChangeText={setMesaj}
        placeholder="Sorununu veya önerini yaz…"
        placeholderTextColor={gece ? 'rgba(226,236,240,0.5)' : Palette.solukMetin}
        multiline
        textAlignVertical="top"
        editable={!gonderiliyor}
      />

      {hata ? (
        <AppText variant="kucuk" color={gece ? 'kirmiziParlak' : 'kirmizi'} bold>
          Gönderilemedi, tekrar dene.
        </AppText>
      ) : null}

      <Pressable
        style={[styles.gonderBtn, gece && styles.btnGece, gonderPasif && styles.pasif]}
        disabled={gonderPasif}
        onPress={() => void gonder()}>
        {gonderiliyor ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <AppText variant="govde" color="beyaz" bold>
            Talebi Gönder
          </AppText>
        )}
      </Pressable>
    </>
  );
}

function Baloncuk({ mesaj }: { mesaj: DestekMesaj }) {
  const gece = useKisiselOzellik('talim-mevzuata');
  const kullanici = mesaj.gonderen === 'kullanici';
  return (
    <View style={[styles.baloncukSarma, kullanici ? styles.sag : styles.sol]}>
      <View
        style={[
          styles.baloncuk,
          kullanici ? styles.baloncukKullanici : styles.baloncukAdmin,
          gece && (kullanici ? styles.baloncukKullaniciGece : styles.kartGece),
        ]}>
        <AppText variant="kucuk" color={kullanici || gece ? 'beyaz' : 'anaMetin'}>
          {mesaj.metin}
        </AppText>
      </View>
      <AppText
        variant="etiket"
        color={gece ? 'kartMetinIkincil' : 'solukMetin'}
        style={kullanici ? styles.ortala : undefined}>
        {kullanici ? 'Sen' : 'Destek'} · {tarihBicim(mesaj.created_at)}
      </AppText>
    </View>
  );
}

function DurumRozet({ durum }: { durum: DestekDurum }) {
  const gece = useKisiselOzellik('talim-mevzuata');
  // Gece: amber/soluk koyu zeminde kaybolur → parlak karşılıkları.
  const renk: PaletteColor = gece
    ? durum === 'acik'
      ? 'altinParlak'
      : durum === 'cevaplandi'
        ? 'yesil'
        : 'kartMetinIkincil'
    : DURUM_RENK[durum];
  return (
    <View style={[styles.rozet, gece && styles.rozetGece]}>
      <View style={[styles.rozetNokta, { backgroundColor: Palette[renk] }]} />
      <AppText variant="etiket" color={renk} bold>
        {DURUM_ETIKET[durum]}
      </AppText>
    </View>
  );
}

/** ISO → "5 Temmuz 2026 14:30" (tr-TR). Hata olursa boş döner. */
function tarihBicim(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  yeniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  bos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  ortala: {
    textAlign: 'center',
  },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  konu: {
    flex: 1,
  },
  threadUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  yukleniyor: {
    marginVertical: Spacing.four,
  },
  baloncukSarma: {
    maxWidth: '85%',
    gap: Spacing.half,
  },
  sag: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  sol: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  baloncuk: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  baloncukKullanici: {
    backgroundColor: Palette.lacivert,
  },
  baloncukAdmin: {
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
  },
  girdi: {
    minHeight: 120,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    fontSize: 16,
    color: Palette.anaMetin,
  },
  konuGirdi: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    fontSize: 16,
    color: Palette.anaMetin,
  },
  aralik: {
    marginTop: Spacing.two,
  },
  gonderBtn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pasif: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  rozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  rozetNokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kapaliNot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  kapaliNotYazi: {
    flex: 1,
  },
  // Gece dili (bayraklı)
  kartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
    borderWidth: 1,
  },
  btnGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
  girdiGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderColor: 'rgba(126,205,218,0.5)',
    color: Palette.beyaz,
  },
  baloncukKullaniciGece: {
    backgroundColor: 'rgba(3,40,56,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.6)',
  },
  rozetGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.35)',
  },
});
