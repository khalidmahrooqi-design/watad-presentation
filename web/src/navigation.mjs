export function nextIndex(current, delta, count) {
  return Math.max(0, Math.min(count - 1, current + delta));
}
export function keyboardDelta(key, rtl) {
  if (key === 'ArrowRight') return rtl ? -1 : 1;
  if (key === 'ArrowLeft') return rtl ? 1 : -1;
  if (key === 'PageDown') return 1;
  if (key === 'PageUp') return -1;
  return 0;
}
export function shouldIgnoreShortcut(target) {
  return !!target?.closest?.(
    'input,textarea,select,[contenteditable="true"],[role="dialog"],[data-shortcuts="local"]',
  );
}
