import { el } from './dom.js';

let root = null;

function getRoot() {
  if (!root) root = document.getElementById('toast-root');
  return root;
}

export function toast(message, { tone = 'default', duration = 4800 } = {}) {
  const host = getRoot();
  if (!host) return;
  const item = el(
    'div',
    { class: `toast toast-${tone}` },
    el('span', { class: 'toast-dot', 'aria-hidden': 'true' }),
    el('span', { class: 'toast-message' }, message),
  );
  host.append(item);
  while (host.children.length > 3) host.firstElementChild?.remove();
  requestAnimationFrame(() => item.classList.add('is-visible'));
  window.setTimeout(() => {
    item.classList.remove('is-visible');
    item.addEventListener('transitionend', () => item.remove(), { once: true });
    window.setTimeout(() => item.remove(), 600);
  }, duration);
}
