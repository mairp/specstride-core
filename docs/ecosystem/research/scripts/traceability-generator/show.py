import sys
from load import load
rows,cl=load()
mod=sys.argv[1]; w=int(sys.argv[2]) if len(sys.argv)>2 else 170
kinds=sys.argv[3].split(',') if len(sys.argv)>3 else None
for r in rows:
    if r['path'].endswith(mod) and (not kinds or r['kind'] in kinds):
        cov=r['as_is_coverage']; cov='' if cov.startswith('none') else ' ['+cov+']'
        print(r['b_item'][2:],r['kind'][:4],r['item'][:w].replace('`','')+cov)
