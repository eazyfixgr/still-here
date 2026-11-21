import { append, button, clear, el } from './dom.js';
import { icon } from './icons.js';
import { t } from '../core/i18n.js';

export function createModal(host = document.getElementById('modal-root')) {
  const title = el('h2', { id: 'modal-title', class: 'modal-title' });
  const body = el('div', { class: 'modal-body' });
  const footer = el('div', { class: 'modal-footer' });
  const closeButton = el(
    'button',
    { class: 'icon-button modal-close', type: 'button', 'aria-label': t('close') },
    icon('close', { size: 20 }),
  );
  const dialog = el(
    'dialog',
    { class: 'modal', 'aria-labelledby': 'modal-title' },
    el('div', { class: 'modal-card' }, el('header', { class: 'modal-head' }, title, closeButton), body, footer),
  );
  host.append(dialog);

  function close() {
    if (dialog.open) dialog.close();
  }

  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  function open({ heading, content, actions = [], size = 'default' }) {
    title.textContent = heading;
    clear(body);
    append(body, content);
    clear(footer);
    dialog.dataset.size = size;
    footer.hidden = actions.length === 0;
    for (const action of actions) {
      const actionButton = button(action.label, {
        class: `btn ${action.kind === 'primary' ? 'btn-primary' : action.kind === 'danger' ? 'btn-danger' : 'btn-ghost'}`,
        type: action.type ?? 'button',
        ...(action.form ? { form: action.form } : {}),
      });
      if (action.onClick) {
        actionButton.addEventListener('click', (event) => {
          const result = action.onClick(event);
          if (result !== false && action.closes !== false) close();
        });
      }
      footer.append(actionButton);
    }
    if (dialog.open) dialog.close();
    dialog.showModal();
    window.setTimeout(() => {
      const focusTarget = body.querySelector('[autofocus]') ?? footer.querySelector('.btn-primary') ?? closeButton;
      focusTarget?.focus();
    }, 30);
  }

  function confirmAction({ heading, message, confirmLabel = t('confirm'), cancelLabel = t('cancel'), danger = false }) {
    return new Promise((resolve) => {
      let decided = false;
      const settle = (value) => {
        if (decided) return;
        decided = true;
        resolve(value);
      };
      const actions = [
        {
          label: cancelLabel,
          kind: 'ghost',
          onClick: () => settle(false),
        },
        {
          label: confirmLabel,
          kind: danger ? 'danger' : 'primary',
          onClick: () => settle(true),
        },
      ];
      open({ heading, content: el('p', { class: 'modal-copy' }, message), actions });
      dialog.addEventListener('close', () => settle(false), { once: true });
    });
  }

  return { dialog, open, close, confirm: confirmAction };
}
