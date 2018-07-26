
export class BitField {
  constructor(n) {
    this.field = new Uint8Array(Math.floor((n + 7) / 8));
  }

  _index(i) { return [Math.floor(i / 8), 1 << (i % 8)]; }

  get(i) {
    let [x, y] = this._index(i);
    return !!(this.field[x] & y);
  }

  set(i, b) {
    let [x, y] = this._index(i);
    this.field[x] = b ? (this.field[x] | y) : (this.field[x] & ~y);
  }

  fill() { this.field.fill(0xff); }
  clear() { this.field.fill(0); }
}
