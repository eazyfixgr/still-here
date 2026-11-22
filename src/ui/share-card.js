import qrcode from 'qrcode-generator';

export const CARD_SIZES = { square: [1080, 1080], story: [1080, 1920] };
const THEMES = {
  night: { bg: '#10170e', text: '#f2f5e9', accent: '#d8f68d', muted: '#b1bfa6', glow: '#354322' },
  paper: { bg: '#f4f0e4', text: '#1d2919', accent: '#496b1d', muted: '#5b6952', glow: '#d3d9be' },
  ember: { bg: '#271b18', text: '#fff0e6', accent: '#f2b38d', muted: '#c6aba0', glow: '#664131' },
};
const SANS = '"Segoe UI", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

function linesFor(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > width) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function paragraph(ctx, text, x, y, width, { size = 58, maxLines = 5, lineHeight = 1.22, family = SANS, weight = 500 } = {}) {
  let lines;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    lines = linesFor(ctx, text, width);
    if (lines.length <= maxLines || size <= 26) break;
    size -= 2;
  } while (true);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * size * lineHeight));
  return y + lines.length * size * lineHeight;
}

function brandMark(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(36, 0);
  ctx.moveTo(0, 46); ctx.lineTo(36, 46);
  ctx.moveTo(4, 7); ctx.lineTo(32, 7); ctx.lineTo(18, 23);
  ctx.lineTo(32, 39); ctx.lineTo(4, 39); ctx.lineTo(18, 23); ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawQr(ctx, url, x, y, size) {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const cell = Math.max(1, Math.floor(size / (count + 8)));
  const actual = (count + 8) * cell;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, actual, actual);
  ctx.fillStyle = '#10170e';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) ctx.fillRect(x + (col + 4) * cell, y + (row + 4) * cell, cell, cell);
    }
  }
}

export function drawShareCard(canvas, content, { format = 'square', theme = 'night' } = {}) {
  const [width, height] = CARD_SIZES[format] ?? CARD_SIZES.square;
  const palette = THEMES[theme] ?? THEMES.night;
  const story = height > width;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unavailable');
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(950, story ? 650 : 280, 10, 950, story ? 650 : 280, 800);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, palette.bg);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = palette.muted;
  ctx.globalAlpha = 0.13;
  [280, 390, 500].forEach((radius) => {
    ctx.beginPath(); ctx.arc(1030, story ? 700 : 410, radius, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const margin = 86;
  const headerY = story ? 155 : 100;
  brandMark(ctx, margin, headerY - 32, palette.accent);
  ctx.fillStyle = palette.text;
  ctx.font = `700 42px ${SANS}`;
  ctx.fillText('still here.', margin + 58, headerY + 4);
  ctx.fillStyle = palette.muted;
  ctx.font = `400 24px ${SANS}`;
  ctx.fillText(content.date, margin, headerY + 65);

  const contentY = story ? 460 : 310;
  ctx.fillStyle = palette.accent;
  ctx.font = `600 24px ${SANS}`;
  ctx.fillText(content.eyebrow.toLocaleUpperCase(), margin, contentY - 42);
  ctx.fillStyle = palette.text;
  if (content.value) {
    let size = story ? 225 : 210;
    do {
      ctx.font = `500 ${size}px ${SANS}`;
      if (ctx.measureText(content.value).width <= width - margin * 2 || size < 130) break;
      size -= 4;
    } while (true);
    ctx.fillStyle = palette.accent;
    ctx.fillText(content.value, margin - 8, contentY + (story ? 240 : 210));
    ctx.fillStyle = palette.text;
    paragraph(ctx, content.label, margin, contentY + (story ? 330 : 295), width - margin * 2, { size: 58, maxLines: 2 });
    ctx.fillStyle = palette.muted;
    paragraph(ctx, content.message, margin, contentY + (story ? 465 : 390), 830, { size: 36, maxLines: 2, weight: 400 });
  } else {
    const end = paragraph(ctx, content.label, margin, contentY + 45, width - margin * 2, {
      size: story ? 86 : 72, maxLines: story ? 7 : 5, family: SERIF, weight: 400,
    });
    ctx.fillStyle = palette.muted;
    paragraph(ctx, content.message, margin, Math.max(end + 50, story ? 1150 : 745), 825, { size: 32, maxLines: 2, weight: 400 });
  }

  if (story) {
    ctx.fillStyle = palette.muted;
    paragraph(ctx, content.storyNote, margin, 1170, 760, { size: 30, maxLines: 2, weight: 400 });
    const dotY = 1300;
    for (let i = 0; i < 80; i += 1) {
      ctx.fillStyle = i < 52 ? palette.accent : palette.muted;
      ctx.globalAlpha = i < 52 ? 0.6 : 0.16;
      ctx.beginPath(); ctx.arc(margin + (i % 20) * 32, dotY + Math.floor(i / 20) * 32, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const footerY = height - (story ? 330 : 230);
  ctx.strokeStyle = palette.muted;
  ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.moveTo(margin, footerY); ctx.lineTo(width - margin, footerY); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.text;
  paragraph(ctx, content.signature, margin, footerY + 65, 620, { size: 34, maxLines: 2, family: SERIF, weight: 400 });
  ctx.fillStyle = palette.muted;
  paragraph(ctx, content.footer, margin, footerY + 150, 620, { size: 23, maxLines: 2, weight: 400 });
  drawQr(ctx, content.url, width - margin - 164, footerY + 30, 164);
  ctx.fillStyle = palette.muted;
  ctx.font = `400 22px ${SANS}`;
  ctx.fillText('eazyfixgr.github.io/still-here', margin, height - 43);
  return canvas;
}

export function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('image-export-failed')), 'image/png');
  });
}
