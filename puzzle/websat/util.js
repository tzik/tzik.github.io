
export function exclusive(solver, ...xs) {
  solver.addClause(...xs);
  for (let i = 0; i < xs.length; ++i) {
    for (let j = i + 1; j < xs.length; ++j) {
      solver.addClause(-xs[i], -xs[j]);
    }
  }
}

// x <=> y
export function equivalent(solver, x, y) {
  solver.addClause(x, -y);
  solver.addClause(-x, y);
}

// g => (x <=> y)
export function glue(solver, g, x, y) {
  solver.addClause(-g, -x, y);
  solver.addClause(-g, x, -y);
}

// (x & y) => g
export function stick(solver, g, x, y) {
  solver.addClause(g, -x, -y);
}

function choose(k, f, xs, ys) {
  let n = xs.length;
  if (k > n) {
    return;
  }

  if (k === 0) {
    f(...ys);
    return;
  }

  if (k === n) {
    f(...ys, ...xs);
    return;
  }

  let x = xs.shift();
  ys.push(x);
  choose(k - 1, f, xs, ys);
  ys.pop();

  choose(k, f, xs, ys);
  xs.unshift(x);
}

// Less than |k| of |literals| are true.
export function lessThan(solver, k, ...literals) {
  choose(k, (...xs) => {
    solver.addClause(...xs);
  }, literals.map(x => -x), []);
}

// More than |k| of |literals| are true.
export function greaterThan(solver, k, ...literals) {
  choose(literals.length - k, (...xs) => {
    solver.addClause(...xs);
  }, literals, []);
}

// Exactly |k| of |literals| are true.
export function exact(solver, n, ...literals) {
  lessThan(solver, n + 1, ...literals);
  greaterThan(solver, n - 1, ...literals);
}
