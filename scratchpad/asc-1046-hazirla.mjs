/**
 * 1.0.46 iOS — SÜRÜM NOTU GÜNCELLE + KONTROL LİSTESİ.
 * Önceki red (3.1.2 EULA) düzeltmesinin YERİNDE olduğunu da doğrular.
 *   node scratchpad/asc-1046-hazirla.mjs          → sadece dener/gösterir
 *   node scratchpad/asc-1046-hazirla.mjs --yaz    → sürüm notunu yazar
 */
import { api, APPID } from './asc.mjs';

const VER = '2d732a21-07c1-4d87-ac12-d1d65990f6c6';
const LOC = 'c3c76536-4aa2-4235-aaee-5be17d9b82f8';
const SET = 'cf83ba22-0ba8-4e20-a08a-d8643aeb3d4e';

// ⚠️ EMOJİ YOK — App Store Connect sürüm notunda emojiyi reddediyor.
const NOT = `Tasarım baştan yenilendi: koyu tema uygulamanın tamamına geldi, Karargâh sadeleşti, Evsaf yeniden düzenlendi.
Er Meydanı yeni görünümüyle: lobi, maç, lig ve sıralama ekranları elden geçti.
Oyun Merkezi: 14 oyunla mevzuatı oynayarak öğren - Çengel Bulmaca, Boşluk Doldurma, Doğru mu Yanlış, Rütbe Merdiveni, Adam Asmaca, Er Meydanı (canlı 1v1) ve daha fazlası.
Deneme sınavları artık her kanunun kendi sayfasında: Mevzuat'ta kanunu aç, Talim Yap ile o kanunun denemelerine gir.
Patika yenilendi: bölüm bölüm ilerleyen, tamamladıkça açılan harita.
Sesli anlatım her kart açılışında otomatik başlıyor, çalışma sırasında ekran kapanmıyor.
Çeşitli iyileştirmeler ve hata düzeltmeleri.`;

const yaz = process.argv.includes('--yaz');
if (yaz) {
  const r = await api(`appStoreVersionLocalizations/${LOC}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: { type: 'appStoreVersionLocalizations', id: LOC, attributes: { whatsNew: NOT } } }),
  });
  console.log('SÜRÜM NOTU YAZMA:', r.status, r.status === 200 ? 'OK' : JSON.stringify(r.body).slice(0, 400));
}

console.log('\n===== 1.0.46 KONTROL LİSTESİ =====');
const v = await api(`appStoreVersions/${VER}`);
const a = v.body.data.attributes;
console.log(`sürüm            : ${a.versionString}  (${a.appStoreState})`);
console.log(`yayın tipi       : ${a.releaseType}`);

const l = (await api(`appStoreVersionLocalizations/${LOC}`)).body.data.attributes;
console.log(`açıklama         : ${l.description.length} karakter`);
console.log(`  3.1.2 EULA linki : ${l.description.includes('https://mevzujsps.com/sartlar.html') ? 'VAR ✅' : 'YOK ❌'}`);
console.log(`  abonelik bloğu   : ${l.description.includes('ABONELİK ve SATIN ALMA') ? 'VAR ✅' : 'YOK ❌'}`);
console.log(`  gizlilik linki   : ${l.description.includes('Gizlilik Politikası:') ? 'VAR ✅' : 'YOK ❌'}`);
console.log(`sürüm notu       : ${l.whatsNew.length} karakter · emoji: ${/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(l.whatsNew) ? 'VAR ❌' : 'yok ✅'}`);
console.log(`anahtar kelimeler: ${l.keywords.length}/100`);
console.log(`destek adresi    : ${l.supportUrl}`);

const d = (await api(`appStoreVersions/${VER}/appStoreReviewDetail`)).body.data.attributes;
console.log(`inceleme hesabı  : ${d.demoAccountName} · şifre ${d.demoAccountPassword ? 'dolu ✅' : 'BOŞ ❌'} · gerekli: ${d.demoAccountRequired}`);
console.log(`inceleme notu    : ${d.notes ? d.notes.length + ' karakter' : 'YOK'}`);

const s = await api(`appScreenshotSets/${SET}/appScreenshots?limit=10&fields[appScreenshots]=fileName,assetDeliveryState`);
const g = s.body.data || [];
console.log(`ekran görüntüsü  : ${g.length} adet · ${g.filter((x) => x.attributes.assetDeliveryState?.state === 'COMPLETE').length} hazır`);

const b = await api(`appStoreVersions/${VER}/build`);
console.log(`bağlı build      : ${b.body?.data ? b.body.data.id : 'HENÜZ YOK (1.0.46 derleniyor)'}`);

const sg = await api(`apps/${APPID}/subscriptionGroups?limit=3`);
for (const grp of (sg.body?.data || [])) {
  const su = await api(`subscriptionGroups/${grp.id}/subscriptions?limit=10&fields[subscriptions]=name,productId,state`);
  for (const x of (su.body?.data || [])) {
    const iyi = x.attributes.state === 'APPROVED';
    console.log(`abonelik         : ${x.attributes.productId.padEnd(18)} ${x.attributes.state} ${iyi ? '✅' : '← incelemeye sokulmalı'}`);
  }
}
