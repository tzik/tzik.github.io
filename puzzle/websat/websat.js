
import {loadWasm} from "./wasm_loader.js";
import {encodeUTF8, decodeUTF8} from "./text_decoder.js";

let module = null;
let memory = null;
let instance = null;
export let websat_ready = (async () => {
  module = await loadWasm('websat.wasm');
  memory = new WebAssembly.Memory({initial: 2});
  let env = {
    memory: memory,
    pow: Math.pow,
    print: (address, length) => print(readText(memory, address, length)),
    throwError: (msg, msg_len, filename, filename_len, lineno) => {
      throw new Error();
      throw new Error(readText(memory, msg, msg_len),
                      readText(memory, filename, filename_len),
                      lineno);
    }
  };
  instance = await WebAssembly.instantiate(module, {env});
})();

function readText(memory, address, length) {
  return decodeUTF8(new Uint8Array(memory.buffer, address, length));
}

export class WebSAT {
  constructor() {
    this.solver = instance.exports.createSolver();
  }

  newLiteral() {
    return instance.exports.newLiteral(this.solver);
  }

  addClause(...literals) {
    let length = literals.length;
    let address = instance.exports.malloc(length * 4);
    if (address === 0) {
      throw new Error("OOM");
    }

    let buf = new Int32Array(memory.buffer, address, length);
    buf.set(literals);
    buf = null;

    instance.exports.addClause(this.solver, address, length);
    instance.exports.free(address);
  }

  solve(...literals) {
    let length = literals.length;
    let address = instance.exports.malloc(length * 4);
    if (address === 0) {
      throw new Error("OOM");
    }

    let buf = new Int32Array(memory.buffer, address, length);
    buf.set(literals);
    buf = null;

    let rv = instance.exports.solve(this.solver, address, length);
    instance.exports.free(address);
    return !!rv;
  }

  extract() {
    let length = instance.exports.getNVars(this.solver);
    let address = instance.exports.malloc(length * 4);
    if (address === 0) {
      throw new Error("OOM");
    }

    let m = ['true', 'false', 'undef'];
    let res = ['undef'];
    instance.exports.extract(this.solver, address, length);
    let buf = new Uint8Array(memory.buffer, address, length);
    for (let v of buf) {
      res.push(m[v]);
    }
    buf = null;
    instance.exports.free(address);
    return res;
  }

  destroy() {
    instance.exports.destroySolver(this.solver);
    this.solver = null;
  }
}
