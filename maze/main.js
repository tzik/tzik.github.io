
import {UnionFind} from "./union_find.js"
import {BitField} from "./bit_field.js"
import {dom, shuffle} from "./util.js"

class Maze {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.walls = new BitField((w - 1) * h + w * (h - 1));
    this.walls.fill();
  }

  _hIndex(i, j) { return j * (this.w - 1) + i; }
  _vIndex(i, j) { return j * this.w + i  + (this.w - 1) * this.h; }

  east(i, j) { return this.walls.get(this._hIndex(i, j)); }
  setEast(i, j, b) { this.walls.set(this._hIndex(i, j), b); }
  west(i, j) { return this.east(i - 1, j); }
  setWest(i, j, b) { this.setEast(i - 1, j, b); }
  south(i, j) { return this.walls.get(this._vIndex(i, j)); }
  setSouth(i, j, b) { this.walls.set(this._vIndex(i, j), b); }
  north(i, j) { return this.south(i, j - 1); }
  setNorth(i, j, b) { this.setSouth(i, j - 1, b); }

  generate() {
    let walls = []
    for (let j = 0; j < this.h; ++j) {
      for (let i = 0; i < this.w; ++i) {
        if (i < this.w - 1) {
          walls.push([[i,j], [i+1,j]]);
        }
        if (j < this.h - 1) {
          walls.push([[i,j], [i,j+1]]);
        }
      }
    }
    shuffle(walls);

    this.walls.fill();
    let uf = new UnionFind(this.w * this.h);
    for (let [[i, j], [k, l]] of walls) {
      if (uf.union(j * this.w + i, l * this.w + k)) {
        if (k === i + 1) {
          this.setEast(i, j, false);
        } else {
          this.setSouth(i, j, false);
        }
      }
    }
  }

  show(image_data) {
    for (let j = 0; j < this.h; ++j) {
      for (let i = 0; i < this.w; ++i) {
        if (i < this.w - 1 && !this.east(i, j)) {
          let p = (2 * j + 1) * image_data.width + (2 * i + 2);
          for (let k of [0, 1, 2]) {
            image_data.data[p * 4 + k] = 0xff;
          }
        }
        if (j < this.h - 1 && !this.south(i, j)) {
          let p = (2 * j + 2) * image_data.width + (2 * i + 1);
          for (let k of [0, 1, 2]) {
            image_data.data[p * 4 + k] = 0xff;
          }
        }
      }
    }
  }
}

function dfs(maze, image_data) {
  let s = [[0,0]];
  let visited = new BitField(maze.w * maze.h);
  let visit = (i, j, ii, jj) => {
    let k = jj * maze.w + ii;
    if (visited.get(k)) {
      return false;
    }

    let p = (j + jj + 1) * image_data.width + (i + ii + 1);
    let pp = (jj * 2 + 1) * image_data.width + (ii * 2 + 1);
    image_data.data[p * 4] = 0;
    image_data.data[p * 4 + 1] = 128;
    image_data.data[p * 4 + 2] = 255;
    image_data.data[pp * 4] = 0;
    image_data.data[pp * 4 + 1] = 128;
    image_data.data[pp * 4 + 2] = 255;

    visited.set(k, true);
    return true;
  };

  visit(0, 0, 0, 0);
  while (s.length !== 0) {
    let [i, j] = s.pop();

    for (let [dx, dy, dir] of [
      [1, 0, Maze.prototype.east],
      [0, 1, Maze.prototype.south],
      [-1, 0, Maze.prototype.west],
      [0, -1, Maze.prototype.north]]) {
      let ii = i + dx;
      let jj = j + dy;
      if (ii < 0 || ii >= maze.w || jj < 0 || jj >= maze.h) {
        continue;
      }
      if (dir.call(maze, i, j)) {
        continue;
      }

      if (!visit(i, j, ii, jj)) {
        continue;
      }

      if (ii === maze.w - 1 && jj === maze.h - 1) {
        console.log("goal");
        return;
      }

      s.push([ii, jj]);
    }
  }
}

(async () => {
  let start = performance.now();
  await dom;
  let field = document.getElementById('field');
  let w = Math.floor((field.width - 1) / 2);
  let h = Math.floor((field.height - 1) / 2);

  let context = field.getContext('2d');
  context.fillStyle = 'black';
  context.fillRect(0, 0, field.width, field.height);
  let image_data = context.getImageData(0, 0, field.width, field.height);
  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      let p = (j * 2 + 1) * image_data.width + (i * 2 + 1);
      for (let k of [0, 1, 2]) {
        image_data.data[p * 4 + k] = 255;
      }
    }
  }

  let maze = new Maze(w, h);
  maze.generate();
  maze.show(image_data);

  dfs(maze, image_data);

  context.putImageData(image_data, 0, 0);
  console.log(performance.now() - start);
})();
