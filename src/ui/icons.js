const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  share: [
    ['circle', { cx: 18, cy: 5, r: 3 }],
    ['circle', { cx: 6, cy: 12, r: 3 }],
    ['circle', { cx: 18, cy: 19, r: 3 }],
    ['path', { d: 'M8.6 10.5l6.8-4M8.6 13.5l6.8 4' }],
  ],
  calendar: [
    ['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }],
    ['path', { d: 'M7 3v4M17 3v4M3 11h18M8 16h2M14 16h2' }],
  ],
  play: [['path', { d: 'M8 4l12 8-12 8z' }]],
  overview: [
    ['circle', { cx: 12, cy: 12, r: 8.5 }],
    ['path', { d: 'M12 7.5v5l3 2' }],
  ],
  milestones: [
    ['path', { d: 'M12 3.5l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8z' }],
  ],
  capsules: [
    ['rect', { x: 3.5, y: 5.5, width: 17, height: 13, rx: 2.5 }],
    ['path', { d: 'M4 7l8 6 8-6' }],
  ],
  studio: [
    ['path', { d: 'M4 7h6M14 7h6M4 17h10M18 17h2' }],
    ['circle', { cx: 12, cy: 7, r: 2 }],
    ['circle', { cx: 16, cy: 17, r: 2 }],
  ],
  settings: [
    ['circle', { cx: 12, cy: 12, r: 3 }],
    ['path', { d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z' }],
  ],
  sun: [
    ['circle', { cx: 12, cy: 12, r: 4 }],
    ['path', { d: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' }],
  ],
  moon: [['path', { d: 'M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2z' }]],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  search: [
    ['circle', { cx: 10.5, cy: 10.5, r: 6.5 }],
    ['path', { d: 'M15.5 15.5L21 21' }],
  ],
  trash: [
    ['path', { d: 'M4 7h16M9 3h6l1 4H8zM7 7l1 14h8l1-14M10 11v6M14 11v6' }],
  ],
  download: [['path', { d: 'M12 3v12M7 10l5 5 5-5M4 20h16' }]],
  upload: [['path', { d: 'M12 16V4M7 9l5-5 5 5M4 20h16' }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  arrow: [['path', { d: 'M5 12h14M13 6l6 6-6 6' }]],
  check: [['path', { d: 'M4 12.5l5 5L20 6.5' }]],
  lock: [
    ['rect', { x: 5, y: 10, width: 14, height: 10, rx: 2 }],
    ['path', { d: 'M8 10V7a4 4 0 0 1 8 0v3' }],
  ],
  reset: [
    ['path', { d: 'M4 4v6h6' }],
    ['path', { d: 'M5.5 15a8 8 0 1 0 .5-8.5L4 10' }],
  ],
  shield: [
    ['path', { d: 'M12 3l7 3v5c0 4.5-2.8 8.2-7 10-4.2-1.8-7-5.5-7-10V6z' }],
    ['path', { d: 'M9 12l2 2 4-4' }],
  ],
  info: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M12 11v6M12 7.5v.5' }],
  ],
  copy: [
    ['rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }],
    ['path', { d: 'M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3' }],
  ],
  external: [
    ['path', { d: 'M14 4h6v6M20 4l-9 9' }],
    ['path', { d: 'M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5' }],
  ],
};

export function icon(name, { size = 18, className = '' } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (className) svg.setAttribute('class', className);
  for (const [tag, attributes] of ICONS[name] ?? []) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) child.setAttribute(key, value);
    svg.append(child);
  }
  return svg;
}
