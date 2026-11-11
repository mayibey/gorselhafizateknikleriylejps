# Başkan test hesabı (baskantest1@mevzujsps.com) senaryoları. Kullanım: python scratchpad/test-hesap.py yeni|durum
#   yeni  → hesabı "yeni açılmış" yap (24 saatlik ilk giriş indirimi yeniden başlar), premium/satın alma kaydı yoksa dokunmaz.
#   durum → hesabın yaşı + indirim durumu.
import json, sys, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
UID = '4fd74524-7650-4695-bd7f-5c0f10da9827'
env = dict(l.split('=', 1) for l in open('.env', encoding='utf-8').read().splitlines() if '=' in l and not l.startswith('#'))
def sql(q):
    r = urllib.request.Request('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', data=json.dumps({'query': q}).encode(),
        headers={'Authorization': 'Bearer ' + env['SUPABASE_ACCESS_TOKEN'].strip(), 'Content-Type': 'application/json', 'User-Agent': 'mevzu'}, method='POST')
    return json.load(urllib.request.urlopen(r, timeout=60))
k = sys.argv[1] if len(sys.argv) > 1 else 'durum'
if k == 'yeni':
    # profiles_created_at_koru tetikleyicisi created_at'i kilitler (indirim güvenliği). Tetikleyiciyi DEĞİŞTİRMEDEN,
    # yalnız bu işlemde (set local) tetikleyicileri atlayıp SADECE test hesabını güncelliyoruz.
    print(sql(f"begin; set local session_replication_role = replica; update profiles set created_at=now() where id='{UID}'; commit; select created_at from profiles where id='{UID}'"))
print(sql(f"select created_at, now()-created_at as yas, (select count(*) from satin_alma_log where user_id='{UID}') satin_alma from profiles where id='{UID}'"))
