
import {websat_ready, WebSAT} from "../websat/websat.js";
import {exclusive} from "../websat/util.js";
import {dom_ready} from "../common/util.js";

(async () => {
  await websat_ready;
  await dom_ready;

  let solver = new WebSAT();

  let n = 3;
  let range = Array.from(new Array(n * n).keys());

  let field = document.getElementById('field');
  for (let i of range) {
    let block = document.createElement('div');
    block.classList.add('block');
    block.classList.add(`col-${i%n}`);
    block.classList.add(`row-${i/n|0}`);

    for (let j of range) {
      let cell = document.createElement('div');
      cell.classList.add('cell');
      cell.classList.add(`col-${j%n}`);
      cell.classList.add(`row-${j/n|0}`);
      cell.setAttribute('contenteditable', '');

      let x = n * (i % n) + j % n;
      let y = n * (i / n | 0) + (j / n | 0);
      cell.setAttribute('id', `cell-${x}-${y}`);
      block.appendChild(cell);
    }
    field.appendChild(block);
  }

  let vars = [];
  for (let i of range) {
    let row = [];
    for (let j of range) {
      let cell = [];
      for (let k of range) {
        cell.push(solver.newLiteral());
      }
      row.push(cell);
    }
    vars.push(row);
  }

  for (let i of range) {
    for (let j of range) {
      exclusive(solver, ...range.map(k => vars[i][j][k]));
      exclusive(solver, ...range.map(k => vars[j][k][i]));
      exclusive(solver, ...range.map(k => vars[k][i][j]));

      let y = n * (j / n | 0);
      let x = n * (j % n);
      exclusive(solver, ...range.map(k => vars[y + (k / n | 0)][x + k % n][i]));
    }
  }

  let go = document.getElementById('solve');
  go.addEventListener('click', () => {
    let filled = [];
    for (let i of range) {
      for (let j of range) {
        let v = document.getElementById(`cell-${i}-${j}`).textContent;
        if (v.match(/^[1-9]$/)) {
          filled.push(vars[i][j][parseInt(v, 10) - 1]);
        }
      }
    }

    if (solver.solve(...filled)) {
      let result = solver.extract();
      let uniq_check = [];
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            if (result[vars[i][j][k]] === 'true') {
              uniq_check.push(-vars[i][j][k]);
              document.getElementById(`cell-${i}-${j}`).textContent = k + 1;
              break;
            }
          }
        }
      }

      let dummy = solver.newLiteral();
      uniq_check.push(dummy);
      solver.addClause(...uniq_check);
      if (!solver.solve(-dummy, ...filled)) {
        document.getElementById('result').textContent = 'uniquely solvable';
      } else {
        document.getElementById('result').textContent = 'solvable';
      }
      solver.addClause(dummy);
    } else {
      document.getElementById('result').textContent = 'unsolvable';
    }
  });
  go.removeAttribute('disabled');

  let clear = document.getElementById('clear');
  clear.addEventListener('click', () => {
    for (let i of range) {
      for (let j of range) {
        document.getElementById(`cell-${i}-${j}`).textContent = '';
      }
    }
    document.getElementById('result').textContent = '';
  });
  clear.removeAttribute('disabled');

  let example = document.getElementById('example');
  example.addEventListener('click', () => {
    // From http://www.nature.com/news/mathematician-claims-breakthrough-in-sudoku-puzzle-1.9751
    let example_input = `   8 1   
       43
5        
    7 8  
      1  
 2  3    
6      75
  34     
   2  6  `.split('\n').map(x => x.split(''));
    for (let i of range) {
      for (let j of range) {
        let x = example_input[j][i];
        document.getElementById(`cell-${i}-${j}`).textContent =
          x.match(/^[1-9]$/) ? x : '';
      }
    }
    document.getElementById('result').textContent = '';
  });
  example.removeAttribute('disabled');
})();
