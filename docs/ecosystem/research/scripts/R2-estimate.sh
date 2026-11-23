#!/usr/bin/env bash
# R2 port-size estimate. Re-runnable: bash estimate.sh
set -euo pipefail
export LC_ALL=C LANG=C
S=/tmp/specstride-research/R2
rm -rf "$S/ss" "$S/mol"; mkdir -p "$S/ss" "$S/mol"
git -C /root/specstride archive 9cab15d | tar -x -C "$S/ss"
git -C /root/mixture-of-loops archive 9c88f86 | tar -x -C "$S/mol"
{
cd "$S/ss"
cloc --quiet --by-file --csv --force-lang="Bourne Again Shell",sh \
  orchestrator.sh proposer.sh specstride specstride-digest.sh specstride-lib.sh wiggum wiggum-lib.sh
cloc --quiet --by-file --csv --include-lang=Python --exclude-dir=fixtures \
  --not-match-f='^(test_.*|_test_.*|conftest)\.py$' lib
cd "$S/mol"
cloc --quiet --by-file --csv --include-lang=Python skills
cloc --quiet --by-file --csv bin/onboard-skill
} 2>/dev/null | grep -E '^(Python|Bourne)' > "$S/counts.csv"
python3 - "$S/counts.csv" <<'PY'
import csv,sys
ZERO={'wiggum','wiggum-lib.sh'}          # legacy aliases, superseded by decision 3
HALF={'lib/specstride_env.py'}           # half is legacy-prefix compatibility
tot={}
print('file,lang,code,factor,est_ts')
for lang,f,b,c,code in csv.reader(open(sys.argv[1])):
    code=int(code); sys_='mol' if f.startswith(('skills/','bin/')) else 'ss'
    fac=0.0 if f in ZERO else (0.85 if lang.startswith('Bourne') else 1.10)
    if f in HALF: fac=0.55
    est=round(code*fac)
    k=(sys_,'Bash' if lang.startswith('Bourne') else 'Python')
    a=tot.setdefault(k,[0,0]); a[0]+=code; a[1]+=est
    print(f'{f},{lang},{code},{fac:.2f},{est}')
print('--- totals (system,language,cloc code,estimated TS code)')
g=[0,0]
for k,v in sorted(tot.items()): print(*k,*v,sep=','); g[0]+=v[0]; g[1]+=v[1]
print('ALL',g[0],g[1],sep=',')
PY
