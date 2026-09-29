# Tüm branşların Merkez sayfalarını kurar: veri_uret → nokta_ayristir → kur2  (python hepsini_kur.py <calisma_dir> [slug ...])
import os, sys, subprocess, json
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.dirname(os.path.abspath(__file__))
C = sys.argv[1]
SLUGLAR = sys.argv[2:] or ['mebs', 'jandarma', 'havacilik', 'personel', 'maliye', 'istihkam', 'ikmal', 'bakim', 'bando', 'tabip', 'dis_tabibi', 'eczaci', 'saglik', 'kimyager', 'veteriner', 'muhendis']
env = dict(os.environ, PYTHONIOENCODING='utf-8')
ozet = []
for s in SLUGLAR:
    v1 = os.path.join(C, f'veri-{s}.json'); v2 = os.path.join(C, f'veri2-{s}.json')
    r = subprocess.run([sys.executable, os.path.join(KOK, 'veri_uret.py'), s, v1], capture_output=True, text=True, encoding='utf-8', env=env)
    if r.returncode: print(r.stdout, r.stderr); sys.exit(1)
    satir = r.stdout.strip().split('\n')[0]
    r2 = subprocess.run([sys.executable, os.path.join(KOK, 'nokta_ayristir.py'), v1, v2], capture_output=True, text=True, encoding='utf-8', env=env)
    if r2.returncode: print(r2.stdout, r2.stderr); sys.exit(1)
    r3 = subprocess.run([sys.executable, os.path.join(KOK, 'kur2.py'), C, s], capture_output=True, text=True, encoding='utf-8', env=env)
    if r3.returncode: print(r3.stdout, r3.stderr); sys.exit(1)
    boy = os.path.getsize(os.path.join(C, f'masa-app-{s}.html')) / 1e6
    n = json.load(open(v2, encoding='utf-8'))
    nokta = sum(len(k['n']) for k in n['kanun']); tz = sum(len(k['tz']) for k in n['kanun'])
    print(f'{satir} · nokta {nokta} · tuzak {tz} · sayfa {boy:.1f} MB')
    for ek in r.stdout.strip().split('\n')[1:]: print('  ', ek.strip())
print('BITTI')
