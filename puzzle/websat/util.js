
export function exclusive(solver, xs) {
  solver.addClause(...xs);
  for (let i = 0; i < xs.length; ++i) {
    for (let j = i + 1; j < xs.length; ++j) {
      solver.addClause(-xs[i], -xs[j]);
    }
  }
}
