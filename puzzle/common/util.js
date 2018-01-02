
export let dom_ready = new Promise(resolve => {
  let check = () => {
    if (document.readyState === 'interactive' ||
        document.readyState === 'complete') {
      document.removeEventListener('readystatechange', check);
      resolve();
      return;
    }
  };

  document.addEventListener('readystatechange', check);
  check();
});

export function* range(begin, end, step) {
  if (end == undefined) {
    end = begin;
    begin = 0;
  }

  if (step === undefined) {
    step = 1;
  }

  for (let i = begin; i < end; i += step) {
    yield i;
  }
}
