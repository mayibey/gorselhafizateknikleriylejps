# Kesik metin ile yeni metin arasındaki farkları gösterir (normalize edilmiş, kelime düzeyinde).
# Kullanım: python fark.py <kanun_id> <madde_no> [min_kelime]
import sys, io, difflib, re
from ayikla import madde_cikar, kesik_metin, tr_lower

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def kelimeler(s):
    s = tr_lower(s)
    return re.findall(r'[0-9a-zçğıöşüâîû]+', s)


def goster(kid, no, esik=1, **kw):
    r = madde_cikar(kid, no, **kw)
    k = kesik_metin(kid, no)
    a, b = kelimeler(k), kelimeler(r['metin'])
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    print(f'--- kanun {kid} m.{no}: kesik {len(a)} kelime, yeni {len(b)} kelime')
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            continue
        if max(i2 - i1, j2 - j1) < esik:
            continue
        ka = ' '.join(a[i1:i2])
        yb = ' '.join(b[j1:j2])
        print(f'  [{op}] kesik[{i1}:{i2}] -> yeni[{j1}:{j2}]')
        if ka:
            print('     KESİK:', ka[:700])
        if yb:
            print('     YENİ :', yb[:700])


if __name__ == '__main__':
    kid, no = sys.argv[1], sys.argv[2]
    esik = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    goster(kid, no, esik)
