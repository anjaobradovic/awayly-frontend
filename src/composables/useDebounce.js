// odloži poziv dok korisnik ne stane, ima i .cancel() i .flush()

import { getCurrentInstance, onUnmounted, unref } from "vue";

export const useDebounce = (fn, delay = 0) => {
  let timer = null;
  let last_args = null;

  const resolveDelay = () => {
    const value = typeof delay === "function" ? delay() : unref(delay);

    return Number(value) || 0;
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    last_args = null;
  };

  const flush = () => {
    if (!timer) return;

    const args = last_args;

    cancel();
    fn(...(args ?? []));
  };

  const debounced = (...args) => {
    const wait = resolveDelay();

    // bez kašnjenja zovi odmah
    if (wait <= 0) {
      cancel();
      fn(...args);

      return;
    }

    last_args = args;

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      last_args = null;
      fn(...args);
    }, wait);
  };

  debounced.cancel = cancel;
  debounced.flush = flush;

  // van komponente (npr. iz store-a) nema onUnmounted
  if (getCurrentInstance()) onUnmounted(cancel);

  return debounced;
};
