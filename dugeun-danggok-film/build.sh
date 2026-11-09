#!/bin/bash
cd "$(dirname "$0")"
python3 - <<'PY'
import glob
js='\n'.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob('src/*.js')))
open('index.html','w',encoding='utf-8').write(open('shell.html',encoding='utf-8').read().replace('/*__JS__*/',js))
PY
