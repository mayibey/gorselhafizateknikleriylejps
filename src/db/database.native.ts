/**
 * Veri katmanı — NATIVE (iOS/Android): expo-sqlite.
 * expo-sqlite import'u SADECE bu dosyada bulunur; Metro web build'inde
 * `database.web.ts` seçildiği için bu dosya web grafiğine hiç girmez.
 */

import {
  type Bolum,
  CREATE_SQL,
  SCHEMA_VERSION,
  type Branch,
  type CardWithLaw,
  type CardWithSrs,
  type GeriBesDurum,
  type LawWithCount,
  type PerformansKaynak,
  type PerformansSatir,
  type SicilKaydi,
  type SinavSonuc,
  type Srs,
} from '@/db/schema';
import {
  SEED_BOLUM_KARTLARI,
  SEED_BOLUMLER,
  SEED_BRANCHES,
  SEED_CARDS,
  SEED_LAW_BRANCHES,
  SEED_LAWS,
} from '@/db/seed';
import type { Backend, IlerlemeSnapshot, RecordReviewResult } from '@/db/types';
import { kanunKuyrugu } from '@/lib/kanun-kartlari';
import { zayifKartlar } from '@/lib/performans';
import { gunlukKuyruk, type QueueCard, type SrsDurum } from '@/lib/queue';
import { bugunISO, srsGuncelle, type SrsCevap } from '@/lib/srs';

/** expo-sqlite arka ucu. */
class SqliteBackend implements Backend {
  private db: Awaited<ReturnType<typeof import('expo-sqlite').openDatabaseAsync>> | null = null;

  async init(): Promise<void> {
    const SQLite = await import('expo-sqlite');
    this.db = await SQLite.openDatabaseAsync('jsps.db');
    await this.migrate();
  }

  /**
   * PRAGMA user_version tabanlı migration runner.
   * Eksik sürümleri sırayla uygular; her sürüm idempotenttir (yeniden çalışsa
   * da güvenli). Kullanıcı verisi (srs) hiçbir adımda silinmez.
   */
  private async migrate(): Promise<void> {
    const db = this.db!;
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = row?.user_version ?? 0;

    // YENİ KURULUM HIZLI YOLU: ilk açılışta tüm şemayı oluştur + BİR KEZ tohumla, ara
    // sürümleri (v1..v17 DELETE+re-seed) ATLA. Yoksa fresh install seedReference'ı 6x,
    // seedBolumler'i 11x çalıştırıp (~25k insert) ilk açılışı saniyelerce bekletir
    // (branş ekranı getBranches→initDatabase'i beklediği için ekrana yansır).
    if (version === 0) {
      await db.execAsync(CREATE_SQL);
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS study_days (gun TEXT PRIMARY KEY);
         CREATE TABLE IF NOT EXISTS kart_performans (id INTEGER PRIMARY KEY AUTOINCREMENT, card_id INTEGER NOT NULL, kaynak TEXT NOT NULL, sonuc TEXT NOT NULL, tarih TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS bolumler (id INTEGER PRIMARY KEY, law_id INTEGER NOT NULL, ad TEXT NOT NULL, sira INTEGER NOT NULL);
         CREATE TABLE IF NOT EXISTS bolum_kartlari (bolum_id INTEGER NOT NULL, card_id INTEGER NOT NULL, sira INTEGER NOT NULL, PRIMARY KEY (bolum_id, card_id));
         CREATE TABLE IF NOT EXISTS sicil_kayitlari (id INTEGER PRIMARY KEY AUTOINCREMENT, tip TEXT NOT NULL, derece TEXT NOT NULL, baslik TEXT NOT NULL, metin TEXT NOT NULL, sebep TEXT NOT NULL, anahtar TEXT, tarih TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS geri_bes_durum (id INTEGER PRIMARY KEY, acik INTEGER NOT NULL, acilis TEXT, son_tarih TEXT, kademe INTEGER NOT NULL);`,
      );
      await this.seedReference();
      await this.seedBolumler();
      version = SCHEMA_VERSION; // tüm ara migration'lar atlanır (aşağıdaki if'ler çalışmaz)
    }

    if (version < 1) {
      // Tüm tablolar (IF NOT EXISTS) — eski kurulumlarda branches/law_branches da oluşur.
      await db.execAsync(CREATE_SQL);
      await this.seedReference();
      version = 1;
    }
    if (version < 2) {
      // Gerçek mevzuat listesi geldi ve kanun id şeması değişti (TCK id1 pinli,
      // müşterek 2-25, jandarma 26-66). INSERT OR IGNORE eski id'leri remap edemez,
      // bu yüzden REFERANS veriyi (laws/law_branches/cards) sıfırlayıp yeniden tohumlarız.
      // srs (kullanıcı ilerlemesi) AYRI tablo, card_id ile bağlı → SİLİNMEZ, korunur.
      await db.execAsync('DELETE FROM law_branches; DELETE FROM laws; DELETE FROM cards;');
      await this.seedReference();
      version = 2;
    }
    if (version < 3) {
      // study_days (streak için çalışılan günler). TAMAMEN EKLEMELİ: yalnız CREATE
      // TABLE IF NOT EXISTS — srs/laws/cards/branches'e DOKUNULMAZ (v2'deki DELETE
      // mantığı buraya TAŞINMAZ). Mevcut v2 telefonlar bu adımla study_days alır,
      // srs ilerlemesi aynen korunur.
      await db.execAsync('CREATE TABLE IF NOT EXISTS study_days (gun TEXT PRIMARY KEY)');
      version = 3;
    }
    if (version < 4) {
      // kart_performans (akıllı öğrenme — cevap logu). TAMAMEN EKLEMELİ: yalnız CREATE
      // TABLE IF NOT EXISTS — srs/study_days/laws/cards/branches'e DOKUNULMAZ.
      // Mevcut v3 telefonlar bu adımla kart_performans alır, ilerleme aynen korunur.
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS kart_performans (id INTEGER PRIMARY KEY AUTOINCREMENT, card_id INTEGER NOT NULL, kaynak TEXT NOT NULL, sonuc TEXT NOT NULL, tarih TEXT NOT NULL)',
      );
      version = 4;
    }
    if (version < 5) {
      // 4733 m.8 kartları (ve gelecekteki yeni içerik) eklendi. TAMAMEN EKLEMELİ:
      // seedReference() INSERT OR IGNORE → yeni id'ler eklenir, mevcut veri DEĞİŞMEZ,
      // srs (kullanıcı ilerlemesi) KORUNUR. DELETE/DROP YOK.
      await this.seedReference();
      version = 5;
    }
    if (version < 6) {
      // Patika bölümleri (bolumler + bolum_kartlari). TAMAMEN EKLEMELİ: yalnız CREATE
      // TABLE IF NOT EXISTS + INSERT OR IGNORE seed. cards/srs/diğer tablolara DOKUNULMAZ.
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS bolumler (id INTEGER PRIMARY KEY, law_id INTEGER NOT NULL, ad TEXT NOT NULL, sira INTEGER NOT NULL);
         CREATE TABLE IF NOT EXISTS bolum_kartlari (bolum_id INTEGER NOT NULL, card_id INTEGER NOT NULL, sira INTEGER NOT NULL, PRIMARY KEY (bolum_id, card_id));`,
      );
      await this.seedBolumler();
      version = 6;
    }
    if (version < 7) {
      // TCK görsel kartları (id 200-299) + TCK patika bölümleri (id 3-7). TAMAMEN EKLEMELİ:
      // seedReference() + seedBolumler() INSERT OR IGNORE → yeni id'ler eklenir, mevcut veri
      // (4733 dahil) DEĞİŞMEZ, srs (kullanıcı ilerlemesi) KORUNUR. DELETE/DROP YOK.
      await this.seedReference();
      await this.seedBolumler();
      version = 7;
    }
    if (version < 8) {
      // Patika artık bölüm bloğu DEĞİL, sınav kapsamı = MADDE düğümleri. bolumler ve
      // bolum_kartlari SALT REFERANS veridir (srs içermez) → güvenle sıfırlanıp yeni
      // kapsamla yeniden tohumlanır. cards/srs/laws/branches'e DOKUNULMAZ; kullanıcı
      // ilerlemesi (srs, card_id ile bağlı) KORUNUR. (Eski bölüm id 1-7 → yeni id law*1000+.)
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 8;
    }
    if (version < 9) {
      // Kapsama 13 'Tamamı' kanun daha eklendi (müşterek 2/6/9/11/15/17/22/23/25 +
      // branş yönetmelik 50/55/57/60). bolumler/bolum_kartlari yine salt referans →
      // sıfırla+yeniden tohumla; srs/cards KORUNUR. (Tek kalan eksik: id 21.)
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 9;
    }
    if (version < 10) {
      // Son eksik kanun (id 21, 6284 Uyg Yön) kapsama eklendi → 66/66 tam. bolumler
      // referans veri, sıfırla+yeniden tohumla; srs/cards KORUNUR.
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 10;
    }
    if (version < 11) {
      // Mülga (yürürlükten kalkmış) maddeler kapsamdan düşürüldü → bolumler düğümleri azaldı.
      // bolumler/bolum_kartlari referans veri, sıfırla+yeniden tohumla; srs/cards KORUNUR.
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 11;
    }
    if (version < 12) {
      // Görsel içeriği yenilendi (TCK görselleri yeni-adlandırma + Kabahatler eklendi;
      // 4733 görselleri boşaltıldı). cards SALT REFERANS → DELETE+yeniden tohumla; srs
      // (card_id ile ayrı tabloda) KORUNUR. Kart↔madde otomatik bağ değiştiği için
      // bolum_kartlari/bolumler de yeniden tohumlanır.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 12;
    }
    if (version < 13) {
      // Sicil (ödül/ceza) sistemi. TAMAMEN EKLEMELİ: yalnız CREATE TABLE IF NOT EXISTS;
      // srs/cards/diğer tablolara DOKUNULMAZ. Kullanıcı ilerlemesi korunur.
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS sicil_kayitlari (id INTEGER PRIMARY KEY AUTOINCREMENT, tip TEXT NOT NULL, derece TEXT NOT NULL, baslik TEXT NOT NULL, metin TEXT NOT NULL, sebep TEXT NOT NULL, anahtar TEXT, tarih TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS geri_bes_durum (id INTEGER PRIMARY KEY, acik INTEGER NOT NULL, acilis TEXT, son_tarih TEXT, kademe INTEGER NOT NULL);`,
      );
      version = 13;
    }
    if (version < 14) {
      // Müşterek görsel içeriği eklendi (23 yeni kanun: kvkk/disiplin/jandteskyon… ~400 yeni
      // kart) + patika kapsamı yalnız GÖRSELİ OLAN maddelerle trimlendi. cards SALT REFERANS →
      // DELETE+yeniden tohumla; srs (card_id ile ayrı tablo) KORUNUR. Kart↔madde bağı değiştiği
      // için bolum_kartlari/bolumler de yeniden tohumlanır. (TCK/Kabahatler dokunulmadı.)
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 14;
    }
    if (version < 15) {
      // TCK görselleri yeni kaynaktan tazelendi (eski 59 → yeni 54 kart). cards SALT REFERANS →
      // DELETE+yeniden tohumla; srs (card_id ile ayrı tablo) KORUNUR. Kart↔madde bağı için
      // bolum_kartlari/bolumler de yeniden tohumlanır.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 15;
    }
    if (version < 16) {
      // 4733 m.8 placeholder kartları (görselsiz → 2x2 fallback) kaldırıldı. cards SALT REFERANS →
      // DELETE+yeniden tohumla; srs KORUNUR. bolumler/bolum_kartlari da yeniden tohumlanır.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 16;
    }
    if (version < 17) {
      // Kabahatler görselleri yeni kaynaktan tazelendi (eski 70 → yeni 62) + kapsam trimlendi.
      // cards SALT REFERANS → DELETE+yeniden tohumla; srs KORUNUR.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 17;
    }
    if (version < 18) {
      // KART ID ŞEMASI DÜZELTİLDİ: law*1000+sıra. Eski şema (110000 + kanun-başına sayaç) TÜM
      // müşterek kanunları aynı id'lere bindiriyordu → INSERT OR IGNORE'da çakışıp yalnız 4 kanun
      // (TCK/Jandarma/Kabahatler/Disiplin) görünüyordu; diğer 21 kanun kartsız kalıyordu.
      // cards SALT REFERANS → DELETE+yeniden tohumla; srs eski id'lere bağlıydı → orphan olur
      // (yayın öncesi, kabul; yeni id'lerle kartlar "yeni" sayılır). bolumler de yeniden tohumlanır.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 18;
    }
    if (version < 19) {
      // 9 müşterek kanunun görselleri güncel kaynaktan (uretilen_gorseller) tazelendi +
      // GERÇEK ses (mp3) eklendi (16 kanun). Görsel seti/anahtarları değiştiği için kart
      // id'leri kaydı → cards SALT REFERANS → DELETE+yeniden tohumla; srs (ayrı tablo)
      // KORUNUR (değişen kanunlarda eski id'ler orphan olur, kabul). Patika kapsamı da
      // güncel görsellere göre değişti → bolumler/bolum_kartlari yeniden tohumlanır.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 19;
    }
    if (version < 20) {
      // Bağsız (genel-özet/ek-geçici özet) kartlar artık kanunun "Özet" patika düğümüne
      // bağlanıyor → patikada görünür + ilerleme paydasına girer (ör. 2803: 31/31). cards
      // DEĞİŞMEDİ → yalnız bolumler/bolum_kartlari yeniden tohumlanır; SRS TAM korunur.
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 20;
    }
    if (version < 21) {
      // Kalan kanunların GERÇEK sesleri eklendi (25/25 kanun) + 6 kanunun görselleri güncel
      // kaynaktan tazelendi (disiplin/eimza/resmiyazisma/aileuyg/hizmetesas/personelyon) →
      // kart id'leri değişti. cards SALT REFERANS → DELETE+yeniden tohumla; srs KORUNUR.
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 21;
    }

    if (version < 22) {
      // Deneme sınavı (Tatbikat) skor geçmişi. TAMAMEN EKLEMELİ: yalnız CREATE TABLE IF
      // NOT EXISTS — srs/kart_performans/cards/diğer tablolara DOKUNULMAZ; referans veri
      // reseed EDİLMEZ. Kullanıcı verisi tam korunur.
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS sinav_sonuclari (id INTEGER PRIMARY KEY AUTOINCREMENT, law_id INTEGER NOT NULL, dogru INTEGER NOT NULL, toplam INTEGER NOT NULL, tarih TEXT NOT NULL)',
      );
      version = 22;
    }

    if (version < 23) {
      // Ayırt/özet kartları artık patikada KENDİ düğümü ("Madde 35–36 ayırt"), son üye
      // maddesinin ardına — tek-madde düğümüne karışan eski "içerir" rozeti kaldırıldı.
      // bolumler/bolum_kartlari SALT REFERANS → sıfırla+yeniden tohumla; srs/cards KORUNUR.
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 23;
    }

    if (version < 24) {
      // Deneme sınavı testlere bölündü (Test 1/2/3) → skor kaydına "test" (0 tabanlı) eklendi.
      // TAMAMEN EKLEMELİ: ALTER ADD COLUMN (mevcut satırlar test=0). Kullanıcı verisi korunur.
      // (Sütun zaten varsa ALTER hata verir → catch ile yut: idempotent.)
      await db
        .execAsync('ALTER TABLE sinav_sonuclari ADD COLUMN test INTEGER NOT NULL DEFAULT 0')
        .catch(() => {});
      version = 24;
    }
    if (version < 25) {
      // BRANŞ İÇERİĞİ eklendi (41 kanun · ~840 görsel kartı + patika kapsamı yalnız görseli olan
      // maddeler). cards SALT REFERANS → DELETE+yeniden tohumla; srs (card_id ile AYRI tablo)
      // KORUNUR. Kart↔madde bağı değiştiği için bolum_kartlari/bolumler de yeniden tohumlanır.
      // (Bu adım OLMADAN OTA'daki yeni SEED_CARDS tabloya girmez → branş "0 kart" görünür.)
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 25;
    }
    if (version < 26) {
      // BRANŞ TCK eklendi (law 67 · Jandarma'ya özgü TCK maddeleri, müşterek TCK'dan ayrı) + 4
      // UI düzeltmesi. cards SALT REFERANS → DELETE+yeniden tohumla; srs KORUNUR. (v25'i çoktan
      // uygulamış cihazlar law 67'yi bu adımla alır.)
      await db.execAsync('DELETE FROM cards; DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedReference();
      await this.seedBolumler();
      version = 26;
    }
    if (version < 27) {
      // DİĞER BRANŞLAR (Jandarma dışı 15) talim kanunları (id 68-135) + çoklu branş bağları eklendi.
      // TAMAMEN EKLEMELİ: seedReference() INSERT OR IGNORE → yeni laws + law_branches; mevcut veri +
      // srs DEĞİŞMEZ. Bu kanunlar KART İÇERMEZ (yalnız talim deneme soruları, registry'de → Tatbikat).
      await this.seedReference();
      version = 27;
    }

    if (version < 28) {
      // ÖZET kartları kullanıcıdan GİZLENDİ (gorsel_yolu '_ozet_' deseni). Patikadan da
      // çıkarıldılar → bolumler/bolum_kartlari SALT REFERANS veri, sıfırla+yeniden tohumla.
      // cards/srs'e DOKUNULMAZ; kullanıcı ilerlemesi (srs, card_id ile bağlı) TAM korunur.
      // ('_ayirt_' kartları '_ozet_' içermez → patikada aynen kalır.)
      await db.execAsync('DELETE FROM bolum_kartlari; DELETE FROM bolumler;');
      await this.seedBolumler();
      version = 28;
    }

    if (version !== (row?.user_version ?? 0)) {
      await db.execAsync(`PRAGMA user_version = ${version}`);
    }
  }

  /**
   * Referans veriyi (laws, cards, branches, law_branches) IDEMPOTENT yükler
   * (INSERT OR IGNORE). srs'e DOKUNULMAZ → mevcut ilerleme korunur.
   * Eski kurulumlarda kartlar zaten dolu olsa da branş tabloları buradan dolar.
   */
  private async seedReference(): Promise<void> {
    const db = this.db!;
    // TEK TRANSACTION: yüzlerce INSERT'i tek disk-commit'te toplar (10-100x hızlı;
    // yoksa her satır ayrı commit → ilk açılış saniyelerce sürer).
    await db.withTransactionAsync(async () => {
      for (const law of SEED_LAWS) {
        await db.runAsync(
          'INSERT OR IGNORE INTO laws (id, blok, ad) VALUES (?, ?, ?)',
          law.id,
          law.blok,
          law.ad,
        );
      }
      for (const card of SEED_CARDS) {
        await db.runAsync(
          'INSERT OR IGNORE INTO cards (id, law_id, madde_no, baslik, anlatim_metni, gorsel_yolu, ses_yolu) VALUES (?, ?, ?, ?, ?, ?, ?)',
          card.id,
          card.law_id,
          card.madde_no,
          card.baslik,
          card.anlatim_metni,
          card.gorsel_yolu,
          card.ses_yolu,
        );
      }
      for (const b of SEED_BRANCHES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO branches (id, slug, ad, sira) VALUES (?, ?, ?, ?)',
          b.id,
          b.slug,
          b.ad,
          b.sira,
        );
      }
      for (const lb of SEED_LAW_BRANCHES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO law_branches (law_id, branch_id) VALUES (?, ?)',
          lb.law_id,
          lb.branch_id,
        );
      }
    });
  }

  /** Patika bölümlerini idempotent yükler (INSERT OR IGNORE). Tek transaction (binlerce satır). */
  private async seedBolumler(): Promise<void> {
    const db = this.db!;
    await db.withTransactionAsync(async () => {
      for (const b of SEED_BOLUMLER) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bolumler (id, law_id, ad, sira) VALUES (?, ?, ?, ?)',
          b.id,
          b.law_id,
          b.ad,
          b.sira,
        );
      }
      for (const bk of SEED_BOLUM_KARTLARI) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bolum_kartlari (bolum_id, card_id, sira) VALUES (?, ?, ?)',
          bk.bolum_id,
          bk.card_id,
          bk.sira,
        );
      }
    });
  }

  async getBolumler(lawId: number): Promise<Bolum[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<Bolum>(
      'SELECT id, law_id, ad, sira FROM bolumler WHERE law_id = ? ORDER BY sira',
      lawId,
    );
  }

  async getCardsByBolum(bolumId: number): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    // Bölümün kartları, bölüm-içi sıraya göre (kanunKuyrugu'nun madde sıralaması DEĞİL).
    const cards = await this.db.getAllAsync<CardWithLaw>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM bolum_kartlari bk
       JOIN cards c ON c.id = bk.card_id
       JOIN laws l ON l.id = c.law_id
       WHERE bk.bolum_id = ?
       ORDER BY bk.sira`,
      bolumId,
    );
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map<number, SrsDurum>(
      srsRows.map((r) => [r.card_id, { kutu: r.kutu, sonraki_tarih: r.sonraki_tarih }]),
    );
    return cards.map((card) => {
      const s = srsMap.get(card.id);
      return s
        ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
        : { ...card, kutu: 0, sonraki_tarih: '', yeni: true };
    });
  }

  async getCardsByBolumChain(bolumId: number): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    // Girilen bölümün kanununu + sırasını bul; o sıradan itibaren TÜM bölümlerin kartları.
    const bas = await this.db.getFirstAsync<{ law_id: number; sira: number }>(
      'SELECT law_id, sira FROM bolumler WHERE id = ?',
      bolumId,
    );
    if (!bas) return [];
    const cards = await this.db.getAllAsync<CardWithLaw>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM bolumler b
       JOIN bolum_kartlari bk ON bk.bolum_id = b.id
       JOIN cards c ON c.id = bk.card_id
       JOIN laws l ON l.id = c.law_id
       WHERE b.law_id = ? AND b.sira >= ?
       ORDER BY b.sira, bk.sira`,
      bas.law_id,
      bas.sira,
    );
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map<number, SrsDurum>(
      srsRows.map((r) => [r.card_id, { kutu: r.kutu, sonraki_tarih: r.sonraki_tarih }]),
    );
    return cards.map((card) => {
      const s = srsMap.get(card.id);
      return s
        ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
        : { ...card, kutu: 0, sonraki_tarih: '', yeni: true };
    });
  }

  async getStudyCards(): Promise<CardWithSrs[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<CardWithSrs>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad, s.kutu AS kutu, s.sonraki_tarih AS sonraki_tarih
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       JOIN srs s ON s.card_id = c.id
       ORDER BY c.id`,
    );
  }

  async getAllCards(): Promise<CardWithLaw[]> {
    if (!this.db) throw new Error('DB hazır değil');
    // Tüm kartlar + kanun bilgisi; srs JOIN YOK → quiz-only kartlar da gelir.
    return this.db.getAllAsync<CardWithLaw>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       ORDER BY c.id`,
    );
  }

  async getCardCount(): Promise<number> {
    if (!this.db) throw new Error('DB hazır değil');
    const row = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM cards');
    return row?.n ?? 0;
  }

  // Etüt = SADECE TEKRAR (vakti gelen due kartlar). Yeni kart öğrenme Mevzuat→patikada
  // yapılır → günlük kuyruğa yeni kart EKLENMEZ (yeniLimit=0).
  async getDailyQueue(): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const cards = await this.db.getAllAsync<CardWithLaw>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       ORDER BY c.id`,
    );
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map<number, SrsDurum>(
      srsRows.map((r) => [r.card_id, { kutu: r.kutu, sonraki_tarih: r.sonraki_tarih }]),
    );
    return gunlukKuyruk(cards, srsMap, bugunISO(), 0);
  }

  async getBranches(): Promise<Branch[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<Branch>('SELECT id, slug, ad, sira FROM branches ORDER BY sira');
  }

  async getLaws(bransSlug: string): Promise<LawWithCount[]> {
    if (!this.db) throw new Error('DB hazır değil');
    // müşterek (herkese) + seçili branşın kanunları.
    return this.db.getAllAsync<LawWithCount>(
      `SELECT l.id, l.blok, l.ad, COUNT(c.id) AS kartSayisi
       FROM laws l
       LEFT JOIN cards c ON c.law_id = l.id
       WHERE l.blok = 'müşterek'
          OR l.id IN (
            SELECT lb.law_id FROM law_branches lb
            JOIN branches b ON b.id = lb.branch_id
            WHERE b.slug = ?
          )
       GROUP BY l.id, l.blok, l.ad
       ORDER BY l.id`,
      bransSlug,
    );
  }

  async getCardsByLaw(lawId: number): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const cards = await this.db.getAllAsync<CardWithLaw>(
      // Özet kartları kullanıcıdan GİZLİ: gorsel_yolu'nda literal '_ozet_' geçenler elenir.
      // SQLite LIKE'da '_' tek-karakter jokeridir → ESCAPE '\' ile alt çizgiler LİTERAL eşleşir.
      // NOT: '_ayirt_' kartları '_ozet_' içermez → ETKİLENMEZ (yalnız özet kartları gizlenir).
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       WHERE c.law_id = ?
         AND c.gorsel_yolu NOT LIKE '%\\_ozet\\_%' ESCAPE '\\'`,
      lawId,
    );
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map<number, SrsDurum>(
      srsRows.map((r) => [r.card_id, { kutu: r.kutu, sonraki_tarih: r.sonraki_tarih }]),
    );
    return kanunKuyrugu(cards, srsMap);
  }

  async saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    // UPSERT: yeni kartta (srs satırı yoksa) oluştur, varsa güncelle.
    await this.db.runAsync(
      `INSERT INTO srs (card_id, kutu, sonraki_tarih) VALUES (?, ?, ?)
       ON CONFLICT(card_id) DO UPDATE SET kutu = excluded.kutu, sonraki_tarih = excluded.sonraki_tarih`,
      cardId,
      kutu,
      sonrakiTarih,
    );
  }

  async markStudyDay(gun: string): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    // Gün-tekil: aynı gün ikinci kez no-op.
    await this.db.runAsync('INSERT OR IGNORE INTO study_days (gun) VALUES (?)', gun);
  }

  async getStudyDays(): Promise<string[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const rows = await this.db.getAllAsync<{ gun: string }>('SELECT gun FROM study_days');
    return rows.map((r) => r.gun);
  }

  async kaydetPerformans(cardId: number, kaynak: PerformansKaynak, sonuc: string): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    await this.db.runAsync(
      'INSERT INTO kart_performans (card_id, kaynak, sonuc, tarih) VALUES (?, ?, ?, ?)',
      cardId,
      kaynak,
      sonuc,
      bugunISO(),
    );
  }

  async getPerformans(): Promise<PerformansSatir[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<PerformansSatir>(
      'SELECT card_id, kaynak, sonuc, tarih FROM kart_performans ORDER BY id',
    );
  }

  async getBolumKartIds(): Promise<number[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const rows = await this.db.getAllAsync<{ card_id: number }>(
      'SELECT DISTINCT card_id FROM bolum_kartlari',
    );
    return rows.map((r) => r.card_id);
  }

  async getZayifKuyruk(): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const [perf, cards] = [await this.getPerformans(), await this.getAllCards()];
    const zayif = zayifKartlar(perf, cards);
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map(srsRows.map((s) => [s.card_id, s]));
    return zayif.map(({ card }) => {
      const s = srsMap.get(card.id);
      return s
        ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
        : { ...card, kutu: 0, sonraki_tarih: '', yeni: true };
    });
  }

  async getSicilKayitlari(): Promise<SicilKaydi[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<SicilKaydi>(
      'SELECT id, tip, derece, baslik, metin, sebep, anahtar, tarih FROM sicil_kayitlari ORDER BY id DESC',
    );
  }

  async ekleSicilKaydi(k: Omit<SicilKaydi, 'id'>): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    await this.db.runAsync(
      'INSERT INTO sicil_kayitlari (tip, derece, baslik, metin, sebep, anahtar, tarih) VALUES (?, ?, ?, ?, ?, ?, ?)',
      k.tip,
      k.derece,
      k.baslik,
      k.metin,
      k.sebep,
      k.anahtar,
      k.tarih,
    );
  }

  async getGeriBesDurum(): Promise<GeriBesDurum> {
    if (!this.db) throw new Error('DB hazır değil');
    const row = await this.db.getFirstAsync<{
      acik: number;
      acilis: string | null;
      son_tarih: string | null;
      kademe: number;
    }>('SELECT acik, acilis, son_tarih, kademe FROM geri_bes_durum WHERE id = 1');
    if (!row) return { acik: false, acilis: null, sonTarih: null, kademe: 0 };
    return { acik: row.acik === 1, acilis: row.acilis, sonTarih: row.son_tarih, kademe: row.kademe };
  }

  async setGeriBesDurum(d: GeriBesDurum): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO geri_bes_durum (id, acik, acilis, son_tarih, kademe) VALUES (1, ?, ?, ?, ?)',
      d.acik ? 1 : 0,
      d.acilis,
      d.sonTarih,
      d.kademe,
    );
  }

  async sicilSifirla(): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    await this.db.execAsync('DELETE FROM sicil_kayitlari; DELETE FROM geri_bes_durum;');
  }

  async ekleSinavSonucu(
    lawId: number,
    test: number,
    dogru: number,
    toplam: number,
    tarih: string,
  ): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    await this.db.runAsync(
      'INSERT INTO sinav_sonuclari (law_id, test, dogru, toplam, tarih) VALUES (?, ?, ?, ?, ?)',
      lawId,
      test,
      dogru,
      toplam,
      tarih,
    );
  }

  async getSinavSonuclari(): Promise<SinavSonuc[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<SinavSonuc>(
      'SELECT id, law_id, test, dogru, toplam, tarih FROM sinav_sonuclari ORDER BY id',
    );
  }

  async ilerlemeDisaAktar(): Promise<IlerlemeSnapshot> {
    if (!this.db) throw new Error('DB hazır değil');
    const srs = await this.db.getAllAsync<{ card_id: number; kutu: number; sonraki_tarih: string }>(
      'SELECT card_id, kutu, sonraki_tarih FROM srs',
    );
    const studyDays = await this.getStudyDays();
    const performans = await this.getPerformans();
    const sicil = (await this.getSicilKayitlari()).map(({ id, ...r }) => r);
    const geriBes = await this.getGeriBesDurum();
    const sinavlar = (await this.getSinavSonuclari()).map(({ id, ...r }) => r);
    return { surum: 1, srs, studyDays, performans, sicil, geriBes, sinavlar };
  }

  async ilerlemeIceAktar(snapshot: IlerlemeSnapshot, tamYukle: boolean): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    const db = this.db;
    // SRS — güvenli birleştir: kutu ASLA geri gitmez (max); tarih kazanan kutununki.
    for (const s of snapshot.srs) {
      await db.runAsync(
        `INSERT INTO srs (card_id, kutu, sonraki_tarih) VALUES (?, ?, ?)
         ON CONFLICT(card_id) DO UPDATE SET
           sonraki_tarih = CASE WHEN excluded.kutu >= srs.kutu THEN excluded.sonraki_tarih ELSE srs.sonraki_tarih END,
           kutu = MAX(srs.kutu, excluded.kutu)`,
        [s.card_id, s.kutu, s.sonraki_tarih],
      );
    }
    // Çalışılan günler — birleştir (gün-tekil).
    for (const g of snapshot.studyDays) await this.markStudyDay(g);
    // Log/sicil/sınav: YALNIZ yeni cihazda (tam yükle) — çoğaltma/çakışma önlenir.
    if (tamYukle) {
      for (const p of snapshot.performans) {
        await db.runAsync(
          'INSERT INTO kart_performans (card_id, kaynak, sonuc, tarih) VALUES (?, ?, ?, ?)',
          [p.card_id, p.kaynak, p.sonuc, p.tarih],
        );
      }
      for (const k of snapshot.sicil) await this.ekleSicilKaydi(k);
      await this.setGeriBesDurum(snapshot.geriBes);
      for (const s of snapshot.sinavlar) {
        await this.ekleSinavSonucu(s.law_id, s.test ?? 0, s.dogru, s.toplam, s.tarih);
      }
    }
  }

  async ilerlemeSifirla(): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    // YALNIZ kullanıcı ilerlemesi — referans veri (laws/cards/branches/bolumler) korunur.
    await this.db.execAsync(
      'DELETE FROM srs; DELETE FROM study_days; DELETE FROM kart_performans; ' +
        'DELETE FROM sicil_kayitlari; DELETE FROM geri_bes_durum; DELETE FROM sinav_sonuclari;',
    );
  }
}

const backend: Backend = new SqliteBackend();

let hazir: Promise<void> | null = null;

/** Veritabanını (idempotent) açar, şemayı kurar ve gerekiyorsa tohumlar. */
export function initDatabase(): Promise<void> {
  if (!hazir) hazir = backend.init();
  return hazir;
}

/** Tüm kartları SRS durumuyla döndürür (geriye dönük; akış artık getDailyQueue kullanır). */
export async function getStudyCards(): Promise<CardWithSrs[]> {
  await initDatabase();
  return backend.getStudyCards();
}

/** Tüm kartları kanun bilgisiyle döndürür (performans analizi için metadata). */
export async function getAllCards(): Promise<CardWithLaw[]> {
  await initDatabase();
  return backend.getAllCards();
}

/** Toplam kart sayısı (istatistik paydası). */
export async function getCardCount(): Promise<number> {
  await initDatabase();
  return backend.getCardCount();
}

/** Etüt kuyruğu: yalnız vakti gelmiş TEKRARLAR (due). Yeni kart yok (Mevzuat→patikada öğrenilir). */
export async function getDailyQueue(): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getDailyQueue();
}

/** Tüm branşları (sıralı) döndürür (onboarding / branş değiştirme). */
export async function getBranches(): Promise<Branch[]> {
  await initDatabase();
  return backend.getBranches();
}

/** Müşterek + seçili branşın kanunlarını kart sayısıyla döndürür (Mevzuat listesi). */
export async function getLaws(bransSlug: string): Promise<LawWithCount[]> {
  await initDatabase();
  return backend.getLaws(bransSlug);
}

/** Bir kanunun TÜM kartlarını (due filtresiz) SRS durumuyla döndürür (kanun çalışma modu). */
export async function getCardsByLaw(lawId: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getCardsByLaw(lawId);
}

/** Bir kanunun patika bölümleri (sıralı; bölümü yoksa boş dizi). */
export async function getBolumler(lawId: number): Promise<Bolum[]> {
  await initDatabase();
  return backend.getBolumler(lawId);
}

/** Bir bölümün kartları, bölüm-içi sıraya göre (akış için). */
export async function getCardsByBolum(bolumId: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getCardsByBolum(bolumId);
}

export async function getCardsByBolumChain(bolumId: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getCardsByBolumChain(bolumId);
}

/** Patikada çalışılabilir (bölüme bağlı) TÜM kart id'leri — ilerleme paydası (genel-özet hariç). */
export async function getBolumKartIds(): Promise<number[]> {
  await initDatabase();
  return backend.getBolumKartIds();
}

/** Bir kartın cevabını işler: Leitner kuralıyla SRS kaydını UPSERT eder ve yeni durumu döndürür. */
export async function recordReview(
  cardId: number,
  mevcutKutu: number,
  cevap: SrsCevap,
): Promise<RecordReviewResult> {
  await initDatabase();
  const next = srsGuncelle(mevcutKutu, cevap);
  await backend.saveSrs(cardId, next.kutu, next.sonraki_tarih);
  await backend.markStudyDay(bugunISO());
  // Akıllı öğrenme: çalışma cevabını performans loguna ekle (SRS'ten ayrı katman).
  await backend.kaydetPerformans(cardId, 'calisma', cevap);
  return next;
}

/** Çalışılmış günleri (YYYY-MM-DD) ham liste döndürür; streak lib/stats.ts'te hesaplanır. */
export async function getStudyDays(): Promise<string[]> {
  await initDatabase();
  return backend.getStudyDays();
}

/** Bir cevabı performans loguna ekler (akıllı öğrenme — Katman 1). */
export async function kaydetPerformans(
  cardId: number,
  kaynak: PerformansKaynak,
  sonuc: string,
): Promise<void> {
  await initDatabase();
  return backend.kaydetPerformans(cardId, kaynak, sonuc);
}

/** Ham performans loglarını (ekleme sırasıyla) döndürür; analiz Katman 2'de. */
export async function getPerformans(): Promise<PerformansSatir[]> {
  await initDatabase();
  return backend.getPerformans();
}

export async function getZayifKuyruk(): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getZayifKuyruk();
}

export async function getSicilKayitlari(): Promise<SicilKaydi[]> {
  await initDatabase();
  return backend.getSicilKayitlari();
}

export async function ekleSicilKaydi(kayit: Omit<SicilKaydi, 'id'>): Promise<void> {
  await initDatabase();
  return backend.ekleSicilKaydi(kayit);
}

export async function getGeriBesDurum(): Promise<GeriBesDurum> {
  await initDatabase();
  return backend.getGeriBesDurum();
}

export async function setGeriBesDurum(durum: GeriBesDurum): Promise<void> {
  await initDatabase();
  return backend.setGeriBesDurum(durum);
}

export async function sicilSifirla(): Promise<void> {
  await initDatabase();
  return backend.sicilSifirla();
}

/** Bir deneme sınavı sonucunu kalıcı kaydeder (Tatbikat skor geçmişi). */
export async function ekleSinavSonucu(
  lawId: number,
  test: number,
  dogru: number,
  toplam: number,
  tarih: string,
): Promise<void> {
  await initDatabase();
  return backend.ekleSinavSonucu(lawId, test, dogru, toplam, tarih);
}

/** Tüm deneme sınavı sonuçlarını (eskiden yeniye) döndürür. */
export async function getSinavSonuclari(): Promise<SinavSonuc[]> {
  await initDatabase();
  return backend.getSinavSonuclari();
}

export async function ilerlemeDisaAktar(): Promise<IlerlemeSnapshot> {
  await initDatabase();
  return backend.ilerlemeDisaAktar();
}

export async function ilerlemeIceAktar(snapshot: IlerlemeSnapshot, tamYukle: boolean): Promise<void> {
  await initDatabase();
  return backend.ilerlemeIceAktar(snapshot, tamYukle);
}

/** TÜM kullanıcı ilerlemesini siler — YALNIZ hesap değişiminde (bkz. lib/senkron). */
export async function ilerlemeSifirla(): Promise<void> {
  await initDatabase();
  return backend.ilerlemeSifirla();
}
