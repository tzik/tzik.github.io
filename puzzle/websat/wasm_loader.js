
export async function loadWasm(url) {
  let relative_to = 'https://tzik.github.io/puzzle/websat/wasm_loader.js';
  // let relative_to = import.meta.url;
  let response = fetch(new URL(url, relative_to));
  try {
    return WebAssembly.compileStreaming(response);
  } catch (e) {
    if (!(e instanceof ReferenceError)) {
      throw e;
    }
  }
  let res = await response;
  let buf = await res.arrayBuffer();
  return WebAssembly.compile(buf);
}
