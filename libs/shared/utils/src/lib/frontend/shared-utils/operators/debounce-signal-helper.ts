import { Signal, signal, effect } from '@angular/core';

export function toDebouncedSignal<T>(source: Signal<T>, delay = 300): Signal<T> {
  const debounced = signal<T>(source());
  let timeoutId: ReturnType<typeof setTimeout>;

  effect((onCleanup) => {
    const value = source();
    timeoutId = setTimeout(() => debounced.set(value), delay);
    onCleanup(() => clearTimeout(timeoutId));
  });

  return debounced;
}