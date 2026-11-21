export function append(parent, ...children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'value' || key === 'checked' || key === 'selected' || key === 'disabled' || key === 'hidden') {
      node[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  return append(node, children);
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export function option(value, label, selected = false) {
  return el('option', { value, selected }, label);
}

export function button(label, props = {}, ...children) {
  return el('button', { type: 'button', ...props }, label, ...children);
}

export function link(label, href, props = {}) {
  return el('a', { href, ...props }, label);
}

export function p(text, props = {}) {
  return el('p', props, text);
}

export function field(label, control, hint) {
  const id = control.id;
  return el(
    'label',
    { class: 'field', for: id },
    el('span', { class: 'field-label' }, label),
    control,
    hint ? el('span', { class: 'field-hint' }, hint) : null,
  );
}

export function sectionEyebrow(text) {
  return el('div', { class: 'eyebrow' }, text);
}
