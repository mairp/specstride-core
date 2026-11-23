#!/usr/bin/env python3
"""R21v: does the recorded pass cost include subagent usage? Two-coefficient least squares, cost ~ a*W_main + b*W_sub."""
import numpy as np, runpy, sys, io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    g = runpy.run_path('cost.py')
rows, P, W = g['rows'], g['P'], g['W']
K = [(P[i]['cost'], W(u, 2.0), W(s, 2.0)) for i, (u, s) in rows.items() if P[i].get('cost')]
y = np.array([k[0] for k in K]); X = np.array([[k[1], k[2]] for k in K])
(a, b), res, *_ = np.linalg.lstsq(X, y, rcond=None)
print('n', len(K), 'a(main) $/Mtok-eq', a*1e6, 'b(sub) $/Mtok-eq', b*1e6, 'passes with subagent usage', int((X[:, 1] > 0).sum()))
pred = X @ np.array([a, b]); print('R2', 1 - ((y-pred)**2).sum()/((y-y.mean())**2).sum())
U = np.array([[W(u, 2.0), W(s, 2.0)] for i, (u, s) in rows.items() if not P[i].get('cost')])
print('estimate with separate coefficients $', float((U @ np.array([a, b])).sum()), ' with one coefficient $', float(U.sum()*y.sum()/X.sum()))
a1 = float((X.sum(1) @ y)/(X.sum(1) @ X.sum(1))); print('one-coefficient least squares $', float(U.sum()*a1))
