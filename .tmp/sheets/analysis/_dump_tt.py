import json, sys
data = json.load(open('/Users/esenespinosa/Development/personal/projects/Zskahra - Character Sheet/.tmp/sheets/Talents_tables.json'))
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
    for m in data.get('merged', [])[:50]:
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
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    sub = [c for c in cells if c['row'] <= n]
    sub.sort(key=lambda c: (c['row'], c['col']))
    for c in sub:
        print(f"{c['addr']}\t{c.get('v')!r}")

elif mode == 'formulas':
    sub = [c for c in cells if c.get('f')]
    print('Total formulas:', len(sub))
    for c in sub[:80]:
        f = c['f']
        print(f"{c['addr']}\t{f}")

elif mode == 'rowdense':
    # Show row population to find blocks
    rows = {}
    for c in cells:
        rows.setdefault(c['row'], 0)
        rows[c['row']] += 1
    for k in sorted(rows.keys()):
        print(f"row {k}: {rows[k]} cells")

elif mode == 'colvals':
    # Show distinct values per column
    col = int(sys.argv[2])
    vals = {}
    for c in cells:
        if c['col'] == col:
            vals.setdefault(str(c.get('v')), 0)
            vals[str(c.get('v'))] += 1
    for k, v in sorted(vals.items(), key=lambda x: -x[1]):
        print(f"  {k!r}: {v}")

elif mode == 'block':
    lo = int(sys.argv[2])
    hi = int(sys.argv[3])
    sub = [c for c in cells if lo <= c['row'] <= hi]
    by_row = {}
    cols_used = set()
    for c in sub:
        by_row.setdefault(c['row'], {})[c['col']] = c.get('v')
        cols_used.add(c['col'])
    cols_sorted = sorted(cols_used)
    # header
    print('row\t' + '\t'.join(str(c) for c in cols_sorted))
    for r in sorted(by_row.keys()):
        line = [str(r)]
        for cc in cols_sorted:
            v = by_row[r].get(cc, '')
            line.append(str(v)[:25] if v is not None else '')
        print('\t'.join(line))
