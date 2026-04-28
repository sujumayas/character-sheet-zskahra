import json, sys
data = json.load(open('/Users/esenespinosa/Development/personal/projects/Zskahra - Character Sheet/.tmp/sheets/TALENTS_FLAWS_LIST.json'))
mode = sys.argv[1] if len(sys.argv) > 1 else 'meta'

cells = data['cells']

if mode == 'meta':
    print('name:', data.get('name'))
    print('max_row:', data.get('max_row'))
    print('max_col:', data.get('max_col'))
    print('cells count:', len(cells))
    print('merged count:', len(data.get('merged', [])))
    rows = {}
    cols = {}
    for c in cells:
        rows.setdefault(c['row'], 0)
        rows[c['row']] += 1
        cols.setdefault(c['col'], 0)
        cols[c['col']] += 1
    print('row range:', min(rows.keys()), '-', max(rows.keys()), '/ count:', len(rows))
    print('col range:', min(cols.keys()), '-', max(cols.keys()), '/ count:', len(cols))
    print('cols by population:')
    for k in sorted(cols.keys()):
        print(f"  col {k}: {cols[k]} cells")
    print('\n=== MERGED ===')
    for m in data.get('merged', [])[:30]:
        print(' ', m)

elif mode == 'rows':
    lo = int(sys.argv[2])
    hi = int(sys.argv[3])
    sub = [c for c in cells if lo <= c['row'] <= hi]
    sub.sort(key=lambda c: (c['row'], c['col']))
    for c in sub:
        f = c.get('f')
        v = c.get('v')
        addr = c['addr']
        if f:
            print(f"{addr}\tF: {f}\t=> {v!r}")
        else:
            print(f"{addr}\tV: {v!r}")

elif mode == 'col':
    col = int(sys.argv[2])
    sub = [c for c in cells if c['col'] == col]
    sub.sort(key=lambda c: c['row'])
    for c in sub:
        v = c.get('v')
        print(f"{c['addr']}: {v!r}")

elif mode == 'header':
    sub = [c for c in cells if c['row'] <= 5]
    sub.sort(key=lambda c: (c['row'], c['col']))
    for c in sub:
        print(f"{c['addr']}\t{c.get('v')!r}")

elif mode == 'formulas':
    sub = [c for c in cells if c.get('f')]
    print('Total formulas:', len(sub))
    seen = set()
    for c in sub[:60]:
        f = c['f']
        # normalize
        key = ''.join([ch for ch in f if not ch.isdigit()])
        print(f"{c['addr']}\t{f}")
