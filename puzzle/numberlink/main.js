
import {websat_ready, WebSAT} from "../websat/websat.js";
import {exclusive, greaterThan, lessThan, exact, glue, stick} from "../websat/util.js";
import {dom_ready, range} from "../common/util.js";

function makeLiterals(solver, n) {
  let literals = [];
  for (let i of range(n)) {
    literals.push(solver.newLiteral());
  }
  return literals;
}

const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

class Numberlink {
  constructor(w, h, p) {
    this.solver = new WebSAT();
    this.w = w;
    this.h = h;
    this.p = p;
    this.assignments = makeLiterals(this.solver, p * w * h);
    this.left_right = makeLiterals(this.solver, (w + 1) * h);
    this.up_down = makeLiterals(this.solver, w * (h + 1));
  }

  assignment(i, j, k) {
    return this.assignments[(i * this.w + j) * this.p + k];
  }

  edge(i, j, d) {
    switch (d) {
      case LEFT:
      case RIGHT:
        return this.left_right[i * (this.w + 1) + j + (d === LEFT ? 0 : 1)];
      case UP:
      case DOWN:
        return this.up_down[(i + (d === UP ? 0 : 1)) * this.w + j];
    }
  }

  setUpBasicConstraints() {
    this.setUpAssignmentConstraints();
    this.setUpWallConstraints();
    this.setUpDegreeConstraints();
    this.setUpLinkConstraints();
  }

  // So-called Nikoli constraints.
  setUpSpanningUniqueConstraints() {
    this.setUpSpanningConstraints();
    this.setUpStickConstraints();
    this.setUpCornerPropagationConstraints();
  }

  setUpAssignmentConstraints() {
    for (let i of range(this.h)) {
      for (let j of range(this.w)) {
        let xs = [];
        for (let k of range(this.p)) {
          xs.push(this.assignment(i, j, k));
        }
        lessThan(this.solver, 2, ...xs);
      }
    }
  }

  setUpWallConstraints() {
    for (let i of range(this.h)) {
      this.solver.addClause(-this.edge(i, 0, LEFT));
      this.solver.addClause(-this.edge(i, this.w - 1, RIGHT));
    }
    for (let j of range(this.w)) {
      this.solver.addClause(-this.edge(0, j, UP));
      this.solver.addClause(-this.edge(this.h - 1, j, DOWN));
    }
  }

  setUpDegreeConstraints() {
    for (let i of range(this.h)) {
      for (let j of range(this.w)) {
        let xs = [];
        for (let d of [LEFT, RIGHT, UP, DOWN])
          xs.push(this.edge(i, j, d));
        lessThan(this.solver, 3, ...xs);
      }
    }
  }

  setUpLinkConstraints() {
    for (let i of range(1, this.h)) {
      for (let j of range(this.w)) {
        let e = this.edge(i, j, UP);
        for (let k of range(this.p)) {
          glue(this.solver, e,
               this.assignment(i, j, k),
               this.assignment(i - 1, j, k));
        }
      }
    }

    for (let i of range(this.h)) {
      for (let j of range(1, this.w)) {
        let e = this.edge(i, j, LEFT);
        for (let k of range(this.p)) {
          glue(this.solver, e,
               this.assignment(i, j, k),
               this.assignment(i, j - 1, k));
        }
      }
    }
  }

  setUpSpanningConstraints() {
    for (let i of range(this.h)) {
      for (let j of range(this.w)) {
        let xs = [];
        for (let d of [LEFT, RIGHT, UP, DOWN])
          xs.push(this.edge(i, j, d));
        this.solver.addClause(...xs);
      }
    }
  }

  setUpStickConstraints() {
    for (let i of range(1, this.h)) {
      for (let j of range(this.w)) {
        let e = this.edge(i, j, UP);
        for (let k of range(this.p)) {
          stick(this.solver, e,
                this.assignment(i, j, k),
                this.assignment(i - 1, j, k));
        }
      }
    }

    for (let i of range(this.h)) {
      for (let j of range(1, this.w)) {
        let e = this.edge(i, j, LEFT);
        for (let k of range(this.p)) {
          stick(this.solver, e,
                this.assignment(i, j, k),
                this.assignment(i, j - 1, k));
        }
      }
    }
  }

  cornerPropagation(i, j, d1, d2) {
    let ii = i + (d1 === UP ? -1 : 1);
    let jj = j + (d2 === LEFT ? -1 : 1);
    let dd1 = d1 == UP ? DOWN : UP;
    let dd2 = d2 == LEFT ? RIGHT : LEFT;

    let e = this.edge(i, j, d1);
    let f = this.edge(i, j, d2);
    this.solver.addClause(-e, -f, -this.edge(ii, jj, dd1));
    this.solver.addClause(-e, -f, -this.edge(ii, jj, dd2));
  }

  setUpCornerPropagationConstraints() {
    for (let i of range(this.h)) {
      for (let j of range(this.w)) {
        if (i > 0 && j > 0)
          this.cornerPropagation(i, j, UP, LEFT);
        if (i > 0 && j < this.w - 1)
          this.cornerPropagation(i, j, UP, RIGHT);
        if (i < this.h - 1 && j > 0)
          this.cornerPropagation(i, j, DOWN, LEFT);
        if (i < this.h - 1 && j < this.w - 1)
          this.cornerPropagation(i, j, DOWN, RIGHT);
      }
    }
  }

  fill(i, j, k) {
    this.solver.addClause(this.assignment(i, j, k));

    let xs = [];
    for (let d of [LEFT, RIGHT, UP, DOWN]) {
      xs.push(this.edge(i, j, d));
    }
    exact(this.solver, 1, ...xs);
  }

  empty(i, j) {
    for (let d of [LEFT, RIGHT, UP, DOWN]) {
      let xs = [];
      for (let dd of [LEFT, RIGHT, UP, DOWN]) {
        xs.push((d === dd ? -1 : 1) * this.edge(i, j, dd));
      }
      this.solver.addClause(...xs);
    }
  }

  solve() {
    return this.solver.solve();
  }

  extract() {
    let model = this.solver.extract();
    let result = [];
    for (let i of range(this.h)) {
      let row = [];
      for (let j of range(this.w)) {
        let cell = {
          assignment: -1,
          link: []
        };
        for (let k of range(this.p)) {
          if (model[this.assignment(i, j, k)] === 'true') {
            cell.assignment = k;
            break;
          }
        }

        for (let d of [LEFT, RIGHT, UP, DOWN]) {
          if (model[this.edge(i, j, d)] === 'true') {
            cell.link.push(d);
          }
        }
        row.push(cell);
      }
      result.push(row);
    }
    return result;
  }
}

function prepare(w, h) {
  let field = document.getElementById('field');
  field.style.setProperty('--x-cells', w);
  field.style.setProperty('--y-cells', h);
  while (field.lastChild) {
    field.removeChild(field.lastChild);
  }

  for (let i of range(h)) {
    // let row = document.createElement('div');
    // row.classList.add('row');
    for (let j of range(w)) {
      let cell = document.createElement('div');
      cell.setAttribute('id', `cell-${j}-${i}`);
      cell.setAttribute('contenteditable', '');
      cell.classList.add('cell');
      // row.appendChild(cell);
      field.appendChild(cell);
    }
    // field.appendChild(row);
  }
}

function solve(w, h, p, field, nikoli) {
  let nl;
  try {
    nl = new Numberlink(w, h, p);
    nl.setUpBasicConstraints();
    if (nikoli)
      nl.setUpSpanningUniqueConstraints();
    for (let i of range(h)) {
      for (let j of range(w)) {
        if (field[i][j] < 0) {
          nl.empty(i, j);
        } else {
          nl.fill(i, j, field[i][j]);
        }
      }
    }

    return nl.solve() ? nl.extract() : null;
  } finally {
    nl.solver.destroy();
  }
}

(async () => {
  await websat_ready;
  await dom_ready;

  let go = document.getElementById('solve');
  go.addEventListener('click', () => {
    let field_elem = document.getElementById('field');
    let w = field_elem.style.getPropertyValue('--x-cells');
    let h = field_elem.style.getPropertyValue('--y-cells');
    let labels = [];
    let label_index = new Map;
    let field = [];

    for (let i of range(h)) {
      let row = [];
      for (let j of range(w)) {
        let x = document.getElementById(`cell-${j}-${i}`).textContent;
        if (x === '') {
          row.push(-1);
        } else {
          let v = label_index.get(x);
          if (v === undefined) {
            v = labels.length;
            labels.push(x);
            label_index.set(x, v);
          }
          row.push(v);
        }
      }
      field.push(row);
    }
    let p = labels.length;

    let result = solve(w, h, p, field, true);
    let is_nikoli = !!result;
    if (!result)
      result = solve(w, h, p, field, false);
    if (result) {
      for (let i of range(h)) {
        for (let j of range(w)) {
          let c = result[i][j];
          let elem = document.getElementById(`cell-${j}-${i}`);
          const link_name = ['left', 'right', 'up', 'down'];
          for (let d of c.link) {
            elem.classList.add(`link-${link_name[d]}`);
          }
        }
      }

      // TODO: Check uniqueness.
      document.getElementById('result').textContent =
        is_nikoli ? 'solvable as a Nikoli instance' : 'solvable';
    } else {
      document.getElementById('result').textContent = 'unsolvable';
    }
  });
  go.removeAttribute('disabled');

  let prep = document.getElementById('prepare');
  prep.addEventListener('click', () => {
    let m = document.getElementById('size').value;
    if (m === '') {
      m = '5x5';
      document.getElementById('size').value = m;
    }
    let r = m.match(/^([0-9]+)x([0-9]+)$/);
    if (!r) {
      return;
    }
    prepare(parseInt(r[1], 10), parseInt(r[2], 10));
  });
  prep.removeAttribute('disabled');

  let example = document.getElementById('example');
  example.addEventListener('click', () => {
    let example_input = `   4   
 3  25 
   31  
   5   
       
  1    
2   4  `.split('\n').map(x => x.split(''));
    prepare(example_input[0].length, example_input.length);
    let k = 0;
    for (let i = 0; i < example_input.length; ++i) {
      let row = example_input[i]
      for (let j = 0; j < row.length; ++j) {
        let v = row[j];
        if (v.match(/[0-9]/)) {
          document.getElementById(`cell-${j}-${i}`).textContent = v;
        }
      }
    }
    document.getElementById('size').value = `${example_input[0].length}x${example_input.length}`;
    document.getElementById('result').textContent = '';
  });
  example.removeAttribute('disabled');
})();
