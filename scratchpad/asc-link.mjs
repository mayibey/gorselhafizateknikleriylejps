/** Sayfadaki bağlantıların adreslerini (href) listeler — hangi adrese gideceğimizi bulmak için. */
const PORT = 9222;
const hedefler = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const sayfa = hedefler.find((x) => x.type === 'page' && (x.url || '').includes('appstoreconnect.apple.com'));
const ws = new WebSocket(sayfa.webSocketDebuggerUrl);
let id = 0; const bekleyen = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const cagir = (metot, par) => new Promise((res) => { const i = ++id; bekleyen.set(i, (m) => res(m.result)); ws.send(JSON.stringify({ id: i, method: metot, params: par })); });
await cagir('Runtime.enable', {});
const suz = process.argv[2] || '';
const r = await cagir('Runtime.evaluate', {
  expression: `JSON.stringify([...document.querySelectorAll('a[href]')].filter(a=>a.offsetParent).map(a=>({y:(a.innerText||'').trim().replace(/\\s+/g,' ').slice(0,50),h:a.getAttribute('href')})).filter(x=>x.h&&x.h.indexOf(${JSON.stringify(suz)})>=0).slice(0,40))`,
  returnByValue: true,
});
for (const x of JSON.parse(r?.result?.value || '[]')) console.log(`${x.y.padEnd(30)} -> ${x.h}`);
process.exit(0);
