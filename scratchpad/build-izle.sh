AND=4780537b-a84a-4fb8-823a-f770a0ea071a
IOS=c758b6f5-2a2e-48e5-90af-08086d61668c
for i in $(seq 1 22); do
  sleep 120
  A=$(npx eas build:view $AND --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).status)}catch(e){console.log('?')}})")
  I=$(npx eas build:view $IOS --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).status)}catch(e){console.log('?')}})")
  echo "[$i] android=$A ios=$I"
  case "$A" in FINISHED|ERRORED|CANCELED) AD=1;; *) AD=0;; esac
  case "$I" in FINISHED|ERRORED|CANCELED) ID=1;; *) ID=0;; esac
  if [ "$AD" = 1 ] && [ "$ID" = 1 ]; then echo "IKISI DE BITTI: android=$A ios=$I"; break; fi
done
