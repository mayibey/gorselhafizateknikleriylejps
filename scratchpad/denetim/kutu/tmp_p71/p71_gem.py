import json,sys
sys.stdout.reconfigure(encoding='utf-8')
d=json.load(open(f'gemini_calisma/girdi/resmi_metin/kanun_{sys.argv[1]}.json',encoding='utf-8'))
M=d['maddeler']
if len(sys.argv)==2:
    print(d.get('not')); print(type(M), len(M)); 
    ks = list(M.keys()) if isinstance(M,dict) else [x.get('no') for x in M]
    print(ks); sys.exit()
for no in sys.argv[2:]:
    t = M.get(no) if isinstance(M,dict) else next((x for x in M if str(x.get('no'))==no),None)
    print('#####',no,':',t)
