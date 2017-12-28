
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
