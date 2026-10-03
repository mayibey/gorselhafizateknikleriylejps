# Parti 13 yardımcı: GOREV_BLOK.md'deki sıkı sınırları (başlık 6, öz 70, sorulur 40, akılda 30, neden 15 kelime) denetler.
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
S = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
for yol in sys.argv[1:]:
    B = json.load(open(yol, encoding='utf-8'))
    print('==', yol, len(B), 'blok')
    for b in B:
        if 'atla' in b:
            print('  m.%s ATLA: %s' % (b['madde'], b['atla']))
            continue
        k = lambda t: len(str(t).split())
        sorun = []
        if k(b['baslik']) > S['baslik']: sorun.append('baslik %d' % k(b['baslik']))
        if k(b['oz']) > S['oz']: sorun.append('oz %d' % k(b['oz']))
        for x in b['sorulur']:
            if k(x) > S['sorulur']: sorun.append('sorulur %d' % k(x))
        for x in b['akilda']:
            if k(x) > S['akilda']: sorun.append('akilda %d' % k(x))
        for x in b.get('karis', []):
            if k(x['neden']) > S['neden']: sorun.append('neden %d' % k(x['neden']))
        print('  m.%s oz=%d sor=%s akl=%s kar=%s %s' % (b['madde'], k(b['oz']), [k(x) for x in b['sorulur']],
              [k(x) for x in b['akilda']], [k(x['neden']) for x in b.get('karis', [])], ('SORUN: ' + ', '.join(sorun)) if sorun else 'ok'))
