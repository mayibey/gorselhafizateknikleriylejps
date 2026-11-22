#!/usr/bin/env node
/**
 * PROJE HARİTASI (22 Kas 2026) — yerel, internetsiz, yapay zekâsız kod haritası.
 *
 * Projede zaten olan TypeScript derleyicisiyle src/ ve supabase/functions/ dosyalarını okur:
 * kim neyi import ediyor, ne dışa açıyor, hangi tablo/RPC/sunucu fonksiyonu/bayrak/AsyncStorage
 * anahtarını kullanıyor. Uygulama koduna DOKUNMAZ, yalnız harita/ klasörüne yazar.
 *
 *   node scripts/proje-haritasi.mjs uret            → harita/PROJE_HARITASI.md + harita.html + harita.json
 *   node scripts/proje-haritasi.mjs etki <ne> [--derinlik 3]
 *        <ne> = dosya yolu (parçası olur), dışa açılan ad, tablo, rpc, sunucu fonksiyonu, bayrak, anahtar
 *
 * Etki sorgusu her seferinde kodu baştan tarar (birkaç saniye) → harita hiçbir zaman bayat olmaz.
 * UYARI: harita yol gösterir, son söz gerçek dosyadır (dinamik adlar, string ile kurulan yollar kaçabilir).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = path.join(KOK, 'harita');
const TARAMA_KOKLERI = ['src', 'supabase/functions'];
const KOD_UZANTI = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const PLATFORM = ['.native', '.web', '.ios', '.android'];
/** Codegen ile üretilen, binlerce resim require'ı içeren dev kayıt dosyaları: düğüm olur, içi taranmaz. */
const TARANMAZ = new Set(['src/assets/kart-gorselleri.ts', 'src/assets/kart-sesleri.ts']);
/** Bu boyuttan büyük dosyalar (soru/metin verisi) tam ağaçla değil, hızlı import taramasıyla okunur. */
const BUYUK_DOSYA = 400 * 1024;
const VARLIK_UZANTI = /\.(png|jpe?g|webp|gif|svg|mp3|m4a|wav|mp4|ttf|otf|json|html|css|txt|pdf)$/i;
const ASYNC_METOT = new Set(['getItem', 'setItem', 'removeItem', 'mergeItem', 'multiGet', 'multiSet', 'multiRemove']);
const BAYRAK_FN = new Set(['useKisiselOzellik', 'kisiselOzellikAcikMi']);

const goreli = (p) => path.relative(KOK, p).split(path.sep).join('/');
const var_ = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

// ───────────────────────────── dosyaları topla ─────────────────────────────
function dosyalariTopla() {
  const out = [];
  const gez = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) gez(p);
      else if (KOD_UZANTI.includes(path.extname(e.name))) out.push(goreli(p));
    }
  };
  for (const k of TARAMA_KOKLERI) if (fs.existsSync(path.join(KOK, k))) gez(path.join(KOK, k));
  return out.sort();
}

function tur(rel) {
  if (rel.startsWith('src/app/')) return 'ekran';
  if (rel.startsWith('src/components/')) return 'bilesen';
  if (rel.startsWith('src/db/')) return 'db';
  if (rel.startsWith('src/assets/')) return 'veri';
  if (rel.startsWith('supabase/')) return 'sunucu';
  return 'lib'; // src/lib, src/hooks, src/constants, kökteki tip dosyaları
}

/** expo-router: src/app/(tabs)/index.tsx → "/" ; oda/[kod].tsx → "/oda/[kod]" ; _layout → düzen */
function rota(rel) {
  if (!rel.startsWith('src/app/')) return null;
  let r = rel.slice('src/app/'.length).replace(/\.(tsx?|jsx?)$/, '');
  for (const p of PLATFORM) if (r.endsWith(p)) r = r.slice(0, -p.length);
  const parca = r.split('/');
  const son = parca[parca.length - 1];
  const duzen = son === '_layout';
  const yol = parca.filter((s) => !/^\(.*\)$/.test(s) && s !== 'index' && s !== '_layout');
  return { yol: '/' + yol.join('/'), duzen, ozel: son.startsWith('+') };
}

function platformKoku(rel) {
  let b = rel.replace(/\.d\.ts$/, '').replace(/\.(tsx?|jsx?|mjs)$/, '');
  for (const p of PLATFORM) if (b.endsWith(p)) return b.slice(0, -p.length);
  return b;
}

// ───────────────────────────── import çözümü ─────────────────────────────
function cozBaz(baz) {
  // tam dosya adı verilmişse
  if (KOD_UZANTI.includes(path.extname(baz)) && var_(baz)) return [baz];
  const bul = [];
  for (const u of KOD_UZANTI) if (var_(baz + u)) bul.push(baz + u);
  for (const p of PLATFORM) for (const u of KOD_UZANTI) if (var_(baz + p + u)) bul.push(baz + p + u);
  if (var_(baz + '.d.ts')) bul.push(baz + '.d.ts');
  if (bul.length) return bul;
  for (const u of KOD_UZANTI) if (var_(path.join(baz, 'index' + u))) return [path.join(baz, 'index' + u)];
  return [];
}

/** → { tip: 'yerel', hedefler:[rel] } | { tip:'paket', ad } | { tip:'varlik' } | { tip:'cozulemedi' } */
function coz(spec, kimden) {
  if (/^(https?:|npm:|jsr:|node:)/.test(spec)) return { tip: 'paket', ad: spec.replace(/@[\d.^~]+.*$/, '').replace(/^npm:/, '') };
  let adaylar = [];
  if (spec.startsWith('.')) adaylar = [path.resolve(KOK, path.dirname(kimden), spec)];
  else if (spec.startsWith('@/assets/')) adaylar = [path.join(KOK, 'assets', spec.slice(9)), path.join(KOK, 'src/assets', spec.slice(9))];
  else if (spec.startsWith('@/')) adaylar = [path.join(KOK, 'src', spec.slice(2))];
  else {
    const p = spec.split('/');
    return { tip: 'paket', ad: spec.startsWith('@') ? p.slice(0, 2).join('/') : p[0] };
  }
  if (VARLIK_UZANTI.test(spec)) return { tip: 'varlik' };
  for (const a of adaylar) {
    const r = cozBaz(a);
    if (r.length) return { tip: 'yerel', hedefler: r.map(goreli) };
  }
  return { tip: 'cozulemedi' };
}

// ───────────────────────────── tek dosya analizi ─────────────────────────────
function bosKayit(rel) {
  return {
    rel, tur: tur(rel), rota: rota(rel), boyut: 0, satir: 0, tarama: 'tam',
    importlar: [], // { spec, hedefler, adlar:[], tipMi, nasil:'import'|'reexport'|'dinamik'|'require'|'tip' }
    paketler: new Set(), varlikSayisi: 0, cozulemeyen: [],
    disaAcik: [], tablolar: new Set(), rpcler: new Set(), kovalar: new Set(), fonksiyonlar: new Set(),
    bayraklar: new Set(), anahtarlar: new Set(), dinamikNotlar: [],
  };
}

function importEkle(k, spec, adlar, tipMi, nasil) {
  const c = coz(spec, k.rel);
  if (c.tip === 'paket') k.paketler.add(c.ad);
  else if (c.tip === 'varlik') k.varlikSayisi++;
  else if (c.tip === 'cozulemedi') k.cozulemeyen.push(spec);
  else k.importlar.push({ spec, hedefler: c.hedefler, adlar, tipMi, nasil });
}

function analiz(rel) {
  const k = bosKayit(rel);
  const tam = path.join(KOK, rel);
  const metin = fs.readFileSync(tam, 'utf8');
  k.boyut = metin.length;
  k.satir = metin.split('\n').length;
  if (TARANMAZ.has(rel)) { k.tarama = 'codegen (taranmadı)'; return k; }

  if (metin.length > BUYUK_DOSYA) {
    // Veri dosyası: hızlı import taraması + dışa açılan adlar regex ile.
    k.tarama = 'hızlı (veri dosyası)';
    const pp = ts.preProcessFile(metin, true, true);
    for (const f of pp.importedFiles) importEkle(k, f.fileName, ['?'], false, 'import');
    for (const m of metin.matchAll(/^export\s+(?:declare\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm)) k.disaAcik.push(m[1]);
    if (/^export\s+default/m.test(metin)) k.disaAcik.push('default');
    return k;
  }

  const sf = ts.createSourceFile(tam, metin, ts.ScriptTarget.Latest, true, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  // dosya içindeki sabit metinler: const TABLO = 'x'
  const sabit = new Map();
  const sabitTopla = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      const i = n.initializer;
      if (ts.isStringLiteral(i) || ts.isNoSubstitutionTemplateLiteral(i)) sabit.set(n.name.text, i.text);
      else if (ts.isAsExpression(i) && (ts.isStringLiteral(i.expression))) sabit.set(n.name.text, i.expression.text);
    }
    ts.forEachChild(n, sabitTopla);
  };
  sabitTopla(sf);

  /** argüman → { deger, kesin } (sabit çözülemezse kod parçası döner) */
  const argDeger = (a) => {
    if (!a) return null;
    if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) return { deger: a.text, kesin: true };
    if (ts.isIdentifier(a) && sabit.has(a.text)) return { deger: sabit.get(a.text), kesin: true };
    if (ts.isTemplateExpression(a)) {
      // `${ONEK}${ad}` → ONEK çözülürse "onek*"
      let s = a.head.text;
      for (const sp of a.templateSpans) {
        const e = sp.expression;
        if (ts.isIdentifier(e) && sabit.has(e.text)) s += sabit.get(e.text);
        else { s += '*'; }
        s += sp.literal.text;
      }
      return { deger: s, kesin: false };
    }
    if (ts.isBinaryExpression(a) && a.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const l = argDeger(a.left), r = argDeger(a.right);
      return { deger: (l ? l.deger : '*') + (r ? r.deger : '*'), kesin: false };
    }
    if (ts.isCallExpression(a) && ts.isIdentifier(a.expression) && sabit.has(a.expression.text)) return { deger: sabit.get(a.expression.text) + '*', kesin: false };
    return { deger: a.getText(sf).slice(0, 40), kesin: false, ham: true };
  };
  const zincirdeVar = (e, ad) => {
    while (e) {
      if (ts.isIdentifier(e)) return e.text === ad;
      if (ts.isPropertyAccessExpression(e)) { if (e.name.text === ad) return true; e = e.expression; }
      else if (ts.isCallExpression(e)) e = e.expression;
      else if (ts.isNonNullExpression(e) || ts.isParenthesizedExpression(e)) e = e.expression;
      else return false;
    }
    return false;
  };

  const ihracMi = (n) => !!(ts.getCombinedModifierFlags(n) & ts.ModifierFlags.Export);
  const varsayilanMi = (n) => !!(ts.getCombinedModifierFlags(n) & ts.ModifierFlags.Default);

  const ziyaret = (n) => {
    // ---- import / export bildirimleri
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const c = n.importClause;
      const adlar = [];
      let hepsiTip = !!c?.isTypeOnly;
      if (c) {
        if (c.name) adlar.push('default');
        const nb = c.namedBindings;
        if (nb && ts.isNamespaceImport(nb)) adlar.push('*');
        if (nb && ts.isNamedImports(nb)) {
          const elemanlar = nb.elements;
          for (const el of elemanlar) adlar.push((el.propertyName || el.name).text);
          if (!c.name && elemanlar.length && elemanlar.every((el) => el.isTypeOnly)) hepsiTip = true;
        }
      } else adlar.push('(yan etki)');
      importEkle(k, n.moduleSpecifier.text, adlar, hepsiTip, 'import');
    } else if (ts.isExportDeclaration(n)) {
      if (n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
        const adlar = n.exportClause && ts.isNamedExports(n.exportClause) ? n.exportClause.elements.map((e) => (e.propertyName || e.name).text) : ['*'];
        importEkle(k, n.moduleSpecifier.text, adlar, n.isTypeOnly, 'reexport');
        if (n.exportClause && ts.isNamedExports(n.exportClause)) for (const e of n.exportClause.elements) k.disaAcik.push(e.name.text);
        else k.disaAcik.push('* (' + n.moduleSpecifier.text + ')');
      } else if (n.exportClause && ts.isNamedExports(n.exportClause)) {
        for (const e of n.exportClause.elements) k.disaAcik.push(e.name.text);
      }
    } else if (ts.isExportAssignment(n)) {
      k.disaAcik.push('default');
    } else if (ts.isImportEqualsDeclaration(n) && ts.isExternalModuleReference(n.moduleReference) && ts.isStringLiteral(n.moduleReference.expression)) {
      importEkle(k, n.moduleReference.expression.text, ['*'], n.isTypeOnly, 'require');
    } else if (ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument) && ts.isStringLiteral(n.argument.literal)) {
      importEkle(k, n.argument.literal.text, [n.qualifier ? n.qualifier.getText(sf).split('.')[0] : '*'], true, 'tip');
    }

    // ---- dışa açılan bildirimler (yalnız en üst düzey)
    if (n.parent === sf) {
      if (ts.isVariableStatement(n) && ihracMi(n)) for (const d of n.declarationList.declarations) { if (ts.isIdentifier(d.name)) k.disaAcik.push(d.name.text); }
      else if ((ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isEnumDeclaration(n) || ts.isModuleDeclaration(n)) && ihracMi(n)) {
        k.disaAcik.push(varsayilanMi(n) ? 'default' + (n.name ? ' (' + n.name.text + ')' : '') : n.name ? n.name.text : '?');
      }
    }

    // ---- çağrılar
    if (ts.isCallExpression(n)) {
      const e = n.expression;
      const a0 = n.arguments[0];
      if (e.kind === ts.SyntaxKind.ImportKeyword) {
        if (a0 && ts.isStringLiteralLike(a0)) importEkle(k, a0.text, ['*'], false, 'dinamik');
        else k.dinamikNotlar.push('import(' + (a0 ? a0.getText(sf) : '') + ')');
      } else if (ts.isIdentifier(e) && e.text === 'require') {
        if (a0 && ts.isStringLiteralLike(a0)) importEkle(k, a0.text, ['*'], false, 'require');
        else k.dinamikNotlar.push('require(' + (a0 ? a0.getText(sf).slice(0, 40) : '') + ')');
      } else if (ts.isIdentifier(e) && BAYRAK_FN.has(e.text) && !(rel === 'src/lib/ozellik.ts')) {
        const v = argDeger(a0);
        if (v) k.bayraklar.add(v.kesin ? v.deger : '⟨dinamik: ' + v.deger + '⟩');
      } else if (ts.isPropertyAccessExpression(e)) {
        const m = e.name.text;
        const v = argDeger(a0);
        if (m === 'from' && v?.kesin && /^[a-z_][a-z0-9_-]*$/i.test(v.deger) && !zincirdeVar(e.expression, 'Array') && !zincirdeVar(e.expression, 'Buffer')) {
          if (zincirdeVar(e.expression, 'storage')) k.kovalar.add(v.deger);
          else if (/^[a-z_][a-z0-9_]*$/.test(v.deger)) k.tablolar.add(v.deger);
        } else if (m === 'from' && v && !v.kesin && (zincirdeVar(e.expression, 'supabase') || zincirdeVar(e.expression, 'storage'))) {
          k.dinamikNotlar.push('.from(' + v.deger + ')');
        } else if (m === 'rpc' && v) {
          if (v.kesin) k.rpcler.add(v.deger); else k.dinamikNotlar.push('.rpc(' + v.deger + ')');
        } else if (m === 'invoke' && zincirdeVar(e.expression, 'functions') && v) {
          if (v.kesin) k.fonksiyonlar.add(v.deger); else k.dinamikNotlar.push('functions.invoke(' + v.deger + ')');
        } else if (ASYNC_METOT.has(m) && zincirdeVar(e.expression, 'AsyncStorage') && a0) {
          if (ts.isArrayLiteralExpression(a0)) {
            for (const el of a0.elements) {
              const ev = argDeger(ts.isArrayLiteralExpression(el) ? el.elements[0] : el);
              if (ev) k.anahtarlar.add(ev.ham ? '⟨' + ev.deger + '⟩' : ev.deger);
            }
          } else if (v) k.anahtarlar.add(v.ham ? '⟨' + v.deger + '⟩' : v.deger);
        }
      }
    }
    // ---- doğrudan çağrılan sunucu fonksiyonu: `${URL}/functions/v1/ad`
    if ((ts.isTemplateExpression(n) || ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))) {
      const t = n.getText(sf);
      const m = t.match(/\/functions\/v1\/([a-z0-9-]+)/);
      if (m) k.fonksiyonlar.add(m[1]);
    }
    ts.forEachChild(n, ziyaret);
  };
  ziyaret(sf);
  // aynı modülü iki kez (ör. hem tip hem değer) import edenleri birleştirmeye gerek yok; kenar olarak ayrı tutulur
  return k;
}

// ───────────────────────────── haritayı kur ─────────────────────────────
function haritaKur() {
  const t0 = performance.now();
  const dosyalar = dosyalariTopla();
  const kayit = new Map();
  for (const rel of dosyalar) kayit.set(rel, analiz(rel));

  // kenarlar
  const kenarlar = []; // { kaynak, hedef, adlar, tipMi, nasil }
  for (const k of kayit.values()) for (const im of k.importlar) for (const h of im.hedefler) {
    if (!kayit.has(h)) kayit.set(h, Object.assign(bosKayit(h), { tarama: 'tarama dışı' }));
    kenarlar.push({ kaynak: k.rel, hedef: h, adlar: im.adlar, tipMi: im.tipMi, nasil: im.nasil });
  }
  const kullananlar = new Map(); // hedef → [kenar]
  for (const e of kenarlar) {
    if (!kullananlar.has(e.hedef)) kullananlar.set(e.hedef, []);
    kullananlar.get(e.hedef).push(e);
  }
  // platform çiftleri
  const ciftler = new Map();
  for (const rel of kayit.keys()) {
    const kok = platformKoku(rel);
    if (!ciftler.has(kok)) ciftler.set(kok, []);
    ciftler.get(kok).push(rel);
  }
  const platformCiftleri = [...ciftler.entries()].filter(([, v]) => v.length > 1).map(([kok, v]) => ({ kok, dosyalar: v.sort() }));

  // ters dizinler
  const dizin = (alan) => {
    const m = new Map();
    for (const k of kayit.values()) for (const v of k[alan]) { if (!m.has(v)) m.set(v, []); m.get(v).push(k.rel); }
    return new Map([...m.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  };
  const sure = performance.now() - t0;
  return {
    kayit, kenarlar, kullananlar, platformCiftleri, sure,
    tablolar: dizin('tablolar'), rpcler: dizin('rpcler'), kovalar: dizin('kovalar'), fonksiyonlar: dizin('fonksiyonlar'),
    bayraklar: dizin('bayraklar'), anahtarlar: dizin('anahtarlar'), paketler: dizin('paketler'),
  };
}

// ───────────────────────────── çıktılar ─────────────────────────────
const kisa = (rel) => rel.replace(/^src\//, '').replace(/^supabase\/functions\//, 'sunucu/');

function mdYaz(h) {
  const L = [];
  const dosyaSay = [...h.kayit.values()].filter((k) => k.tarama !== 'tarama dışı').length;
  L.push('# Proje haritası (otomatik üretildi — ELLE DÜZENLEME)');
  L.push('');
  L.push(`Üretim: ${new Date().toLocaleString('tr-TR')} · ${dosyaSay} dosya · ${h.kenarlar.length} import kenarı · ${Math.round(h.sure)} ms`);
  L.push('');
  L.push('> Harita yol gösterir, son söz gerçek dosyadır. Dinamik adlar `⟨…⟩` ile işaretli; tam doğrulama için dosyayı aç.');
  L.push('> Etki sorgusu: `npm run harita:etki -- <dosya|ad|tablo|bayrak>` (her seferinde taze tarar).');
  L.push('');

  L.push('## Ekranlar (expo-router)');
  const ekranlar = [...h.kayit.values()].filter((k) => k.rota).sort((a, b) => a.rota.yol.localeCompare(b.rota.yol) || a.rel.localeCompare(b.rel));
  for (const k of ekranlar) L.push(`- \`${k.rota.yol}\`${k.rota.duzen ? ' (düzen)' : ''} → ${kisa(k.rel)}`);
  L.push('');

  L.push('## Platform çiftleri (Metro uzantıya göre seçer; HEPSİ birlikte güncellenir)');
  for (const c of h.platformCiftleri) L.push(`- ${kisa(c.kok)}: ${c.dosyalar.map((d) => path.basename(d)).join(' · ')}`);
  L.push('');

  const bolum = (baslik, m) => {
    L.push(`## ${baslik} (${m.size})`);
    for (const [ad, ds] of m) L.push(`- **${ad}** → ${ds.map(kisa).join(', ')}`);
    L.push('');
  };
  bolum('Supabase tabloları', h.tablolar);
  bolum('Supabase RPC', h.rpcler);
  bolum('Depolama kovaları', h.kovalar);
  bolum('Sunucu fonksiyonları (çağıranlar)', h.fonksiyonlar);
  bolum('Kişisel özellik bayrakları', h.bayraklar);
  bolum('AsyncStorage anahtarları', h.anahtarlar);

  const dinamik = [...h.kayit.values()].filter((k) => k.dinamikNotlar.length);
  if (dinamik.length) {
    L.push('## Elle bakılması gereken dinamik yerler');
    for (const k of dinamik) L.push(`- ${kisa(k.rel)}: ${[...new Set(k.dinamikNotlar)].join(' · ')}`);
    L.push('');
  }
  const coz = [...h.kayit.values()].filter((k) => k.cozulemeyen.length);
  if (coz.length) {
    L.push('## Çözülemeyen importlar');
    for (const k of coz) L.push(`- ${kisa(k.rel)}: ${k.cozulemeyen.join(', ')}`);
    L.push('');
  }

  L.push('## Dosyalar');
  L.push('Biçim: `dosya [tür] satır` · dışa: … · kullanır: … · kullanan: … (tip-yalnız importlar `~` ile)');
  L.push('');
  const tumu = [...h.kayit.values()].sort((a, b) => a.rel.localeCompare(b.rel));
  for (const k of tumu) {
    const ek = [];
    if (k.rota) ek.push('rota ' + k.rota.yol);
    if (k.tarama !== 'tam') ek.push(k.tarama);
    L.push(`### ${kisa(k.rel)} [${k.tur}] ${k.satir}${ek.length ? ' · ' + ek.join(' · ') : ''}`);
    if (k.disaAcik.length) L.push(`- dışa: ${[...new Set(k.disaAcik)].join(', ')}`);
    const kul = new Map();
    for (const im of k.importlar) for (const hd0 of im.hedefler) {
      // platform kardeşleri tek satırda: db/database.{native,web,d}
      const hd = im.hedefler.length > 1 ? platformKoku(hd0) + '.{' + im.hedefler.map((x) => x.slice(platformKoku(x).length + 1).replace(/\.?(tsx?|jsx?)$/, '') || 'ts').join(',') + '}' : hd0;
      const a = kul.get(hd) || { adlar: new Set(), tip: true };
      im.adlar.forEach((x) => a.adlar.add(x));
      a.tip = a.tip && im.tipMi;
      kul.set(hd, a);
    }
    if (kul.size) L.push(`- kullanır: ${[...kul].map(([hd, a]) => `${a.tip ? '~' : ''}${kisa(hd)}{${[...a.adlar].join(',')}}`).join(' · ')}`);
    const kn = [...new Set((h.kullananlar.get(k.rel) || []).map((e) => (e.tipMi ? '~' : '') + kisa(e.kaynak)))];
    if (kn.length) L.push(`- kullanan (${kn.length}): ${kn.join(', ')}`);
    const diger = [];
    if (k.tablolar.size) diger.push('tablo ' + [...k.tablolar].join(','));
    if (k.rpcler.size) diger.push('rpc ' + [...k.rpcler].join(','));
    if (k.kovalar.size) diger.push('kova ' + [...k.kovalar].join(','));
    if (k.fonksiyonlar.size) diger.push('sunucu ' + [...k.fonksiyonlar].join(','));
    if (k.bayraklar.size) diger.push('bayrak ' + [...k.bayraklar].join(','));
    if (k.anahtarlar.size) diger.push('anahtar ' + [...k.anahtarlar].join(','));
    if (k.paketler.size) diger.push('paket ' + [...k.paketler].join(','));
    if (k.varlikSayisi) diger.push(`${k.varlikSayisi} varlık`);
    if (diger.length) L.push(`- ${diger.join(' · ')}`);
  }
  L.push('');
  return L.join('\n');
}

function jsonVeri(h) {
  const dugumler = [...h.kayit.values()].map((k) => ({
    id: k.rel, ad: kisa(k.rel), tur: k.tur, rota: k.rota ? k.rota.yol + (k.rota.duzen ? ' (düzen)' : '') : null,
    satir: k.satir, tarama: k.tarama, disa: [...new Set(k.disaAcik)],
    tablo: [...k.tablolar], rpc: [...k.rpcler], kova: [...k.kovalar], fn: [...k.fonksiyonlar],
    bayrak: [...k.bayraklar], anahtar: [...k.anahtarlar], paket: [...k.paketler],
  }));
  const tekil = new Map();
  for (const e of h.kenarlar) {
    const key = e.kaynak + '→' + e.hedef;
    const o = tekil.get(key) || { k: e.kaynak, h: e.hedef, adlar: [], tip: true };
    o.adlar.push(...e.adlar);
    o.tip = o.tip && e.tipMi;
    tekil.set(key, o);
  }
  return { uretim: new Date().toISOString(), dugumler, kenarlar: [...tekil.values()].map((o) => ({ ...o, adlar: [...new Set(o.adlar)] })) };
}

function htmlYaz(veri) {
  const json = JSON.stringify(veri).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mevzu JSPS — Proje Haritası</title>
<style>
:root{--lac:#0B1F3A;--lac2:#173B6B;--metin:#1B2A4A;--krem:#F7F3EA;--kart:#FFFCF5;--kenar:#E7DCC7;--ayir:#EFE6D6;--soluk:#6E6047;--altin:#C9A227;--kir:#C00000}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--krem);color:var(--metin);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Inter,sans-serif}
header{position:fixed;top:0;left:0;right:0;height:56px;display:flex;align-items:center;gap:12px;padding:0 16px;background:var(--lac);color:#fff;z-index:3}
header h1{font:700 17px Georgia,"Playfair Display",serif;margin:0;white-space:nowrap}
#ara{flex:1;max-width:380px;padding:8px 12px;border-radius:8px;border:1px solid var(--kenar);background:var(--kart);color:var(--metin);font-size:14px}
#lejant{display:flex;gap:6px;flex-wrap:wrap}
.lj{display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:99px;background:rgba(255,255,255,.1);cursor:pointer;font-size:12px;user-select:none}
.lj.kapali{opacity:.35}.lj i{width:10px;height:10px;border-radius:50%;display:inline-block}
#tuval{position:fixed;top:56px;left:0;width:calc(100% - 360px);height:calc(100% - 56px);cursor:grab}
#panel{position:fixed;top:56px;right:0;width:360px;bottom:0;overflow:auto;background:var(--kart);border-left:1px solid var(--kenar);padding:16px}
#panel h2{font:700 16px Georgia,serif;margin:0 0 4px;color:var(--lac);word-break:break-all}
#panel h3{font-size:11px;letter-spacing:1px;color:var(--soluk);margin:14px 0 4px;text-transform:uppercase}
#panel ul{margin:0;padding-left:16px}#panel li{margin:2px 0;word-break:break-all}
.bag{color:var(--lac2);cursor:pointer;text-decoration:underline;text-decoration-color:var(--kenar)}
.bag:hover{color:var(--kir)}.rozet{display:inline-block;padding:1px 7px;border-radius:99px;font-size:11px;color:#fff;margin-right:4px}
.soluk{color:var(--soluk)}#ipucu{position:fixed;left:12px;bottom:10px;color:var(--soluk);font-size:12px;background:rgba(247,243,234,.9);padding:4px 8px;border-radius:6px}
@media (max-width:760px){#tuval{width:100%;height:calc(55% - 56px)}#panel{top:55%;width:100%;border-left:0;border-top:1px solid var(--kenar)}#lejant{display:none}}
</style></head><body>
<header><h1>Proje Haritası</h1><input id="ara" placeholder="Dosya, fonksiyon, tablo, bayrak ara…" autocomplete="off"><div id="lejant"></div></header>
<canvas id="tuval"></canvas>
<aside id="panel"></aside>
<div id="ipucu">Kutuya tıkla → bağlıları parlar · sürükle: kaydır · tekerlek: yakınlaş · boşluğa tıkla: temizle</div>
<script>
const V=${json};
const RENK={ekran:'#C00000',bilesen:'#173B6B',lib:'#C9A227',db:'#2E7D32',veri:'#8A5A12',sunucu:'#6A3D9A'};
const AD={ekran:'Ekran',bilesen:'Bileşen',lib:'Kütüphane',db:'Veri katmanı',veri:'Veri dosyası',sunucu:'Sunucu'};
const N=V.dugumler, E=V.kenarlar, byId=new Map(N.map((n,i)=>(n.i=i,[n.id,n])));
for(const e of E){e.s=byId.get(e.k);e.t=byId.get(e.h);}
const disa=new Map(), iceri=new Map();N.forEach(n=>{disa.set(n,[]);iceri.set(n,[])});
for(const e of E){disa.get(e.s).push(e);iceri.get(e.t).push(e);}
const gizli=new Set();let secili=null,arama='',vurgu=null;
// --- yerleşim: türe göre kümelenmiş başlangıç + basit kuvvet benzetimi (sabit tohum → her açılışta aynı)
let tohum=7;const rnd=()=>(tohum=(tohum*16807)%2147483647)/2147483647;
const turler=Object.keys(RENK);
N.forEach(n=>{const a=turler.indexOf(n.tur)/turler.length*Math.PI*2;n.x=Math.cos(a)*420+rnd()*160-80;n.y=Math.sin(a)*420+rnd()*160-80;n.vx=0;n.vy=0;
  n.r=4+Math.min(10,Math.sqrt(iceri.get(n).length)*2);});
(function benzet(){for(let it=0;it<320;it++){const al=1-it/320;
  for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++){const a=N[i],b=N[j];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+.01;if(d2>90000)continue;const f=900/d2*al;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;}
  for(const e of E){if(e.s===e.t)continue;const dx=e.t.x-e.s.x,dy=e.t.y-e.s.y,d=Math.sqrt(dx*dx+dy*dy)+.01,f=(d-70)/d*.03*al;e.s.vx+=dx*f;e.s.vy+=dy*f;e.t.vx-=dx*f;e.t.vy-=dy*f;}
  for(const n of N){const a=turler.indexOf(n.tur)/turler.length*Math.PI*2;n.vx+=(Math.cos(a)*300-n.x)*.004;n.vy+=(Math.sin(a)*300-n.y)*.004;const hz=Math.hypot(n.vx,n.vy);if(hz>40){n.vx*=40/hz;n.vy*=40/hz;}n.x+=n.vx*.5;n.y+=n.vy*.5;n.vx*=.6;n.vy*=.6;}}})();
const cv=document.getElementById('tuval'),cx=cv.getContext('2d');let W,H,dpr,ox=0,oy=0,ol=0.7;
function boyut(){dpr=devicePixelRatio||1;W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ciz();}
addEventListener('resize',boyut);
const ekr=(n)=>[(n.x*ol+ox)+W/2,(n.y*ol+oy)+H/2];
function gorunur(n){return !gizli.has(n.tur)}
function eslesir(n){if(!arama)return false;const q=arama;return n.ad.toLowerCase().includes(q)||(n.rota||'').toLowerCase().includes(q)||n.disa.some(x=>x.toLowerCase()===q)||[...n.tablo,...n.rpc,...n.kova,...n.fn,...n.bayrak,...n.anahtar].some(x=>x.toLowerCase().includes(q));}
function ciz(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  const odak=vurgu;
  for(const e of E){if(!gorunur(e.s)||!gorunur(e.t))continue;const acik=odak&&(odak.has(e.s)&&odak.has(e.t))&&(e.s===secili||e.t===secili||!secili);
    const [x1,y1]=ekr(e.s),[x2,y2]=ekr(e.t);cx.strokeStyle=acik?(e.s===secili?'#173B6B':'#C00000'):odak?'rgba(110,96,71,.05)':'rgba(110,96,71,.16)';cx.lineWidth=acik?1.6:.7;
    if(e.tip)cx.setLineDash([3,3]);else cx.setLineDash([]);cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke();}
  cx.setLineDash([]);
  for(const n of N){if(!gorunur(n))continue;const [x,y]=ekr(n);const r=n.r*Math.max(.6,ol);const sön=odak&&!odak.has(n);
    cx.globalAlpha=sön?.15:1;cx.fillStyle=RENK[n.tur];cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
    if(n===secili||(arama&&eslesir(n))){cx.lineWidth=3;cx.strokeStyle='#0B1F3A';cx.stroke();}
    if(!sön&&(ol>1.1||n.r>9||odak)){cx.fillStyle='#1B2A4A';cx.font=(n===secili?'700 ':'')+'11px system-ui';cx.fillText(n.ad.split('/').pop(),x+r+3,y+4);}
    cx.globalAlpha=1;}}
function bul(mx,my){let en=null,ed=1e9;for(const n of N){if(!gorunur(n))continue;const [x,y]=ekr(n);const d=(x-mx)**2+(y-my)**2;if(d<ed&&d<(n.r*Math.max(.6,ol)+6)**2){ed=d;en=n;}}return en;}
function sec(n){secili=n;if(!n){vurgu=arama?new Set(N.filter(eslesir)):null;panelBos();ciz();return;}
  vurgu=new Set([n,...disa.get(n).map(e=>e.t),...iceri.get(n).map(e=>e.s)]);panelDoldur(n);ciz();}
const P=document.getElementById('panel');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function liste(baslik,arr){return arr.length?'<h3>'+baslik+' ('+arr.length+')</h3><ul>'+arr.join('')+'</ul>':''}
const bagla=(n,ek)=>'<li><span class="bag" data-id="'+esc(n.id)+'">'+esc(n.ad)+'</span>'+(ek?' <span class="soluk">'+esc(ek)+'</span>':'')+'</li>';
function panelDoldur(n){
  let h='<span class="rozet" style="background:'+RENK[n.tur]+'">'+AD[n.tur]+'</span><span class="soluk">'+n.satir+' satır'+(n.tarama!=='tam'?' · '+esc(n.tarama):'')+'</span><h2>'+esc(n.ad)+'</h2>';
  if(n.rota)h+='<div>Ekran yolu: <b>'+esc(n.rota)+'</b></div>';
  h+=liste('Dışa açtıkları',n.disa.map(x=>'<li>'+esc(x)+'</li>'));
  h+=liste('Kullandıkları',disa.get(n).map(e=>bagla(e.t,(e.tip?'yalnız tip · ':'')+e.adlar.join(', '))));
  h+=liste('Onu kullananlar',iceri.get(n).map(e=>bagla(e.s,(e.tip?'yalnız tip · ':'')+e.adlar.join(', '))));
  const dg=[['Tablolar',n.tablo],['RPC',n.rpc],['Kovalar',n.kova],['Sunucu fonksiyonları',n.fn],['Bayraklar',n.bayrak],['Cihaz anahtarları',n.anahtar],['Dış paketler',n.paket]];
  for(const [b,a] of dg)h+=liste(b,a.map(x=>'<li>'+esc(x)+'</li>'));
  P.innerHTML=h;}
function panelBos(){const say={};N.forEach(n=>say[n.tur]=(say[n.tur]||0)+1);
  P.innerHTML='<h2>Mevzu JSPS kod haritası</h2><p class="soluk">'+N.length+' dosya · '+E.length+' bağlantı · üretim '+new Date(V.uretim).toLocaleString('tr-TR')+'</p>'+
  '<p>Bir kutuya tıkla: kullandıkları <b style="color:#173B6B">lacivert</b>, onu kullananlar ve kendisi <b style="color:#C00000">kırmızı</b> çizgiyle parlar. Kesikli çizgi = yalnız tip bağlantısı.</p>'+
  (arama?liste('Arama sonuçları',N.filter(eslesir).map(n=>bagla(n,n.rota||''))):'')+
  '<h3>Gruplar</h3><ul>'+Object.keys(RENK).map(t=>'<li><span class="rozet" style="background:'+RENK[t]+'">'+AD[t]+'</span>'+(say[t]||0)+'</li>').join('')+'</ul>'+
  '<p class="soluk" style="margin-top:16px">Harita yol gösterir; son söz gerçek dosyadır.</p>';}
P.addEventListener('click',ev=>{const id=ev.target.dataset&&ev.target.dataset.id;if(id){const n=byId.get(id);odakla(n);sec(n);}});
function odakla(n){ox=-n.x*ol;oy=-n.y*ol;}
const lj=document.getElementById('lejant');
lj.innerHTML=Object.keys(RENK).map(t=>'<span class="lj" data-t="'+t+'"><i style="background:'+RENK[t]+'"></i>'+AD[t]+'</span>').join('');
lj.addEventListener('click',ev=>{const s=ev.target.closest('.lj');if(!s)return;const t=s.dataset.t;gizli.has(t)?gizli.delete(t):gizli.add(t);s.classList.toggle('kapali');ciz();});
document.getElementById('ara').addEventListener('input',ev=>{arama=ev.target.value.trim().toLowerCase();secili=null;const es=N.filter(eslesir);vurgu=arama?new Set(es):null;
  if(es.length===1){ol=Math.max(ol,1.2);odakla(es[0]);sec(es[0]);return;}panelBos();ciz();});
let surukle=null,tasindi=false;
cv.addEventListener('mousedown',ev=>{surukle={x:ev.offsetX,y:ev.offsetY,ox,oy};tasindi=false;cv.style.cursor='grabbing';});
addEventListener('mousemove',ev=>{if(!surukle)return;const dx=ev.offsetX-surukle.x,dy=ev.offsetY-surukle.y;if(Math.abs(dx)+Math.abs(dy)>3)tasindi=true;ox=surukle.ox+dx;oy=surukle.oy+dy;ciz();});
addEventListener('mouseup',ev=>{if(surukle&&!tasindi&&ev.target===cv)sec(bul(ev.offsetX,ev.offsetY));surukle=null;cv.style.cursor='grab';});
cv.addEventListener('wheel',ev=>{ev.preventDefault();const k=ev.deltaY<0?1.15:1/1.15;const mx=ev.offsetX-W/2,my=ev.offsetY-H/2;ox=mx-(mx-ox)*k;oy=my-(my-oy)*k;ol*=k;ciz();},{passive:false});
cv.addEventListener('touchend',ev=>{const t=ev.changedTouches[0],r=cv.getBoundingClientRect();sec(bul(t.clientX-r.left,t.clientY-r.top));});
function sigdir(){const xs=N.map(n=>n.x),ys=N.map(n=>n.y);const w=Math.max(...xs)-Math.min(...xs)+60,hh=Math.max(...ys)-Math.min(...ys)+60;ol=Math.min(cv.clientWidth/w,cv.clientHeight/hh);ox=-(Math.max(...xs)+Math.min(...xs))/2*ol;oy=-(Math.max(...ys)+Math.min(...ys))/2*ol;}
panelBos();sigdir();boyut();
// adres çubuğundan arama: harita.html#ozellik.ts
if(location.hash.length>1){const ai=document.getElementById('ara');ai.value=decodeURIComponent(location.hash.slice(1));ai.dispatchEvent(new Event('input'));}
</script></body></html>`;
}

// ───────────────────────────── etki sorgusu ─────────────────────────────
function etki(h, sorgu, derinlik) {
  const q = sorgu.trim();
  const ql = q.toLowerCase();
  const bas = []; // { neden, dosyalar:[{rel, not}] }

  for (const [alan, ad] of [['tablolar', 'tablo'], ['rpcler', 'rpc'], ['kovalar', 'kova'], ['fonksiyonlar', 'sunucu fonksiyonu'], ['bayraklar', 'bayrak'], ['anahtarlar', 'cihaz anahtarı']]) {
    for (const [isim, ds] of h[alan]) if (isim.toLowerCase() === ql) bas.push({ neden: `${ad} "${isim}"`, dosyalar: ds.map((rel) => ({ rel, not: ad + ' kullanıyor' })) });
  }
  if (h.fonksiyonlar.has(q)) {
    const srv = [...h.kayit.keys()].filter((r) => r.startsWith(`supabase/functions/${q}/`));
    if (srv.length) bas.push({ neden: `sunucu fonksiyonunun kendi kodu`, dosyalar: srv.map((rel) => ({ rel, not: 'sunucu kodu' })) });
  }
  // dışa açılan ad (platform kopyaları — database.native/web/d.ts — tek tanım sayılır)
  const tanimGrup = new Map();
  for (const k of h.kayit.values()) {
    if (!k.disaAcik.some((x) => x === q || x === `default (${q})`)) continue;
    const kk = platformKoku(k.rel);
    if (!tanimGrup.has(kk)) tanimGrup.set(kk, []);
    tanimGrup.get(kk).push(k);
  }
  for (const [kk, ks] of tanimGrup) {
    const dog = [];
    const kuyruk = ks.map((k) => [k.rel, k.disaAcik.includes(q) ? q : 'default']);
    const gorulen = new Set();
    while (kuyruk.length) {
      const [hedef, isim] = kuyruk.shift();
      if (gorulen.has(hedef + '#' + isim)) continue;
      gorulen.add(hedef + '#' + isim);
      for (const e of h.kullananlar.get(hedef) || []) {
        if (!(e.adlar.includes(isim) || e.adlar.includes('*') || e.adlar.includes('?'))) continue;
        dog.push({ rel: e.kaynak, not: `${isim} ← ${kisa(ks.length > 1 ? kk : hedef)}${e.tipMi ? ' (yalnız tip)' : ''}${e.adlar.includes('?') ? ' (veri dosyası, ad belirsiz)' : ''}` });
        if (e.nasil === 'reexport') kuyruk.push([e.kaynak, isim]);
      }
    }
    bas.push({ adSorgusu: true, neden: `"${q}" — tanım: ${ks.map((k) => kisa(k.rel)).join(' · ')}`, dosyalar: [...ks.map((k) => ({ rel: k.rel, not: 'tanım burada' })), ...dog] });
  }
  // dosya yolu
  if (!bas.length) {
    const norm = ql.replace(/\\/g, '/');
    let es = [...h.kayit.keys()].filter((r) => r.toLowerCase().includes(norm));
    const tam = es.filter((r) => r.toLowerCase() === norm || platformKoku(r).toLowerCase().endsWith(norm.replace(/\.(tsx?|jsx?)$/, '')));
    if (tam.length) es = tam;
    if (es.length > 8) {
      console.log(`"${q}" ${es.length} dosyaya uyuyor, daha belirgin yaz:`);
      es.slice(0, 40).forEach((r) => console.log('  ' + r));
      return;
    }
    // aynı dosyanın platform kopyaları (database.native/web/d.ts) tek blokta
    const gruplar = new Map();
    for (const rel of es) { const kk = platformKoku(rel); if (!gruplar.has(kk)) gruplar.set(kk, []); gruplar.get(kk).push(rel); }
    for (const [kk, ds] of gruplar) bas.push({ neden: `dosya ${kisa(ds.length > 1 ? kk : ds[0])}`, dosyalar: ds.map((rel) => ({ rel, not: 'değişen dosya' })) });
  }
  if (!bas.length) { console.log(`"${q}" için eşleşme yok (dosya, dışa açılan ad, tablo, rpc, kova, sunucu fonksiyonu, bayrak, anahtar arandı).`); return; }

  for (const b of bas) {
    console.log(`\n━━ ${b.neden}`);
    const seviye = new Map(); // rel → { d, not, tipYolu }
    const kuyruk = [];
    const ekle = (rel, d, not, tip) => { if (seviye.has(rel)) return; seviye.set(rel, { d, not, tip }); kuyruk.push(rel); };
    for (const d of b.dosyalar) ekle(d.rel, d.not === 'tanım burada' || d.not === 'değişen dosya' ? 0 : 1, d.not, /yalnız tip/.test(d.not));
    // platform kardeşi de etkilenir (aynı arayüzü paylaşır) → onu kullananlar da sayılır
    for (const rel of [...kuyruk]) if (seviye.get(rel).d === 0) for (const c of h.platformCiftleri) if (c.dosyalar.includes(rel)) for (const kd of c.dosyalar) ekle(kd, 0, 'platform kardeşi — birlikte güncelle', false);
    // genişlik öncelikli: d. kademe → onu import edenler d+1
    for (let i = 0; i < kuyruk.length; i++) {
      const rel = kuyruk[i];
      const s0 = seviye.get(rel);
      if (s0.d >= derinlik) continue;
      if (b.adSorgusu && s0.d === 0) continue; // tanım dosyası: yalnız adı alanlar (yukarıda) etkilenir
      for (const e of h.kullananlar.get(rel) || []) ekle(e.kaynak, s0.d + 1, `← ${kisa(rel)}`, e.tipMi || s0.tip);
    }
    const sirali = [...seviye.entries()].sort((a, b) => a[1].d - b[1].d || a[0].localeCompare(b[0]));
    for (const [rel, s] of sirali) {
      const k = h.kayit.get(rel);
      const r = k?.rota ? `  [ekran ${k.rota.yol}${k.rota.duzen ? ' düzen' : ''}]` : '';
      console.log(`  ${'  '.repeat(Math.min(s.d, 4))}${s.d === 0 ? '●' : s.d}. ${kisa(rel)}${r}  — ${s.not}${s.tip && s.d > 0 ? ' (yalnız tip yolu)' : ''}`);
    }
    const ekran = sirali.filter(([rel]) => h.kayit.get(rel)?.rota);
    console.log(`  Toplam ${sirali.length} dosya, ${ekran.length} ekran (derinlik ≤ ${derinlik}).`);
  }
  console.log('\nNot: harita yol gösterir, son söz gerçek dosyadır.');
}

// ───────────────────────────── giriş ─────────────────────────────
const [komut = 'uret', ...kalan] = process.argv.slice(2);
const derIdx = kalan.indexOf('--derinlik');
const derinlik = derIdx >= 0 ? Math.max(1, Number(kalan[derIdx + 1]) || 3) : 3;
const sorgu = kalan.filter((_, i) => derIdx < 0 || (i !== derIdx && i !== derIdx + 1)).join(' ');

const h = haritaKur();
if (komut === 'uret') {
  fs.mkdirSync(CIKTI, { recursive: true });
  const veri = jsonVeri(h);
  fs.writeFileSync(path.join(CIKTI, 'PROJE_HARITASI.md'), mdYaz(h));
  fs.writeFileSync(path.join(CIKTI, 'harita.json'), JSON.stringify(veri));
  fs.writeFileSync(path.join(CIKTI, 'harita.html'), htmlYaz(veri));
  console.log(`Harita üretildi: ${veri.dugumler.length} dosya, ${veri.kenarlar.length} bağlantı, tarama ${Math.round(h.sure)} ms → harita/`);
} else if (komut === 'etki') {
  if (!sorgu) { console.log('Kullanım: npm run harita:etki -- <dosya|ad|tablo|bayrak> [--derinlik 3]'); process.exit(1); }
  etki(h, sorgu, derinlik);
} else {
  console.log('Komutlar: uret | etki <ne>');
  process.exit(1);
}
