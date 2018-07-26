
export class UnionFind {
  constructor(n) {
    this.nodes_ = new Array(n);
    for (let i = 0; i < n; ++i) {
      this.nodes_[i] = {parent: i, rank: 0};
    }
  }

  find(i) {
    let n = this.nodes_[i];
    if (n.parent != i) {
      n.parent = this.find(n.parent);
    }
    return n.parent;
  }

  union(i, j) {
    i = this.find(i);
    j = this.find(j);
    if (i === j) {
      return false;
    }

    let x = this.nodes_[i];
    let y = this.nodes_[j];
    if (x.rank ===  y.rank) {
      x.parent = j;
      y.rank += 1;
    } else if (x.rank < y.rank) {
      x.parent = j;
    } else {
      y.parent = i;
    }
    return true;
  }
}
