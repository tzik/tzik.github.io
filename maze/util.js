
export let dom = new Promise(resolve => {
  function check() {
    if (document.readyState === 'interactive' ||
        document.readyState === 'complete') {
      document.removeEventListener('readystatechange', check);
      resolve();
      return;
    }
    document.addEventListener('readystatechange', check);
  }
  check();
});

export function shuffle(xs) {
  for (let i = 0; i < xs.length; ++i) {
    let j = i + Math.floor(Math.random() * (xs.length - i));
    let t = xs[i];
    xs[i] = xs[j];
    xs[j] = t;
  }
}
