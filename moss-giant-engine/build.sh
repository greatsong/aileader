#!/bin/bash
# src/*.js 를 순서대로 이어 붙여 shell.html 에 넣고 단일 파일 index.html 을 만든다.
cd "$(dirname "$0")"
python3 - <<'PY'
import glob
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob('src/*.js')))
open('index.html', 'w', encoding='utf-8').write(open('shell.html', encoding='utf-8').read().replace('/*__JS__*/', js))
print('built index.html', len(js), 'bytes of script')
PY
