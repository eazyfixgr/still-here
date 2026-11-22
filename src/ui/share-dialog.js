import { button, el, option } from './dom.js';
import { icon } from './icons.js';
import { toast } from './toast.js';
import { getLocale, t } from '../core/i18n.js';
import { copyText, downloadBlob, shareContent } from '../core/sharing.js';
import { canvasBlob, drawShareCard } from './share-card.js';

export function openShareDialog(modal, { game, milestone, momentDate, kind } = {}) {
  const options = { kind: kind ?? (milestone ? 'milestone' : game ? 'days' : 'moment'), format: 'square', theme: 'night' };
  const now = Date.now();
  let content;
  let blob = null;
  let version = 0;
  const status = el('p', { class: 'share-status field-hint', role: 'status', 'aria-live': 'polite' });
  const canvas = el('canvas', { class: 'share-canvas', role: 'img' });
  const linkInput = el('input', { class: 'input share-link', type: 'text', readonly: true, 'aria-label': t('sharePublicLink') });
  const captionInput = el('textarea', { class: 'input textarea share-caption', rows: '3', maxlength: '1000', 'aria-label': t('shareCaptionLabel') });
  const captionField = el('label', { class: 'field share-caption-field', for: 'share-caption' }, el('span', { class: 'field-label' }, t('shareCaptionLabel')), captionInput);
  captionInput.id = 'share-caption';
  const description = el('figcaption', { class: 'sr-only', id: 'share-card-description' });
  canvas.setAttribute('aria-describedby', 'share-card-description');

  const imageButton = button(t('shareImage'), { class: 'btn btn-primary', disabled: true, onclick: async () => {
    if (!blob) return;
    const file = new File([blob], `still-here-${options.kind}-${getLocale()}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: t('appTitle'), text: `${captionInput.value}\n${content.url}` });
        status.textContent = t('shareDone');
      } catch (error) {
        if (error.name !== 'AbortError') status.textContent = t('shareError');
      }
    } else {
      downloadBlob(blob, file.name);
      status.textContent = t('shareDesktopHint');
    }
  } }, icon('share', { size: 17 }));
  const downloadButton = button(t('shareDownload'), { class: 'btn btn-ghost', disabled: true, onclick: () => {
    if (!blob) return;
    downloadBlob(blob, `still-here-${options.kind}-${options.format}.png`);
    status.textContent = t('shareDownloaded');
  } }, icon('download', { size: 16 }));

  async function render() {
    const run = ++version;
    imageButton.disabled = true;
    downloadButton.disabled = true;
    status.textContent = t('sharePreparing');
    content = shareContent({ game, milestone, momentDate, kind: options.kind, now });
    linkInput.value = content.url;
    captionInput.value = content.caption;
    const caption = `${content.eyebrow}. ${content.value} ${content.label}. ${content.message}`;
    canvas.setAttribute('aria-label', caption);
    description.textContent = caption;
    try {
      drawShareCard(canvas, content, options);
      const nextBlob = await canvasBlob(canvas);
      if (run !== version) return;
      blob = nextBlob;
      imageButton.disabled = false;
      downloadButton.disabled = false;
      status.textContent = t('shareReady');
    } catch {
      if (run === version) status.textContent = t('shareError');
    }
  }

  function control(id, label, values, key) {
    return el('label', { class: 'field', for: id }, el('span', { class: 'field-label' }, label),
      el('select', { id, class: 'select', onchange: (event) => { options[key] = event.target.value; render(); } },
        ...values.map(([value, text]) => option(value, text, options[key] === value))));
  }

  const kinds = [
    ...(game ? [['days', t('shareTypeDays')]] : []),
    ['moment', t('shareTypeMoment')],
    ...(milestone ? [['milestone', t('shareTypeMilestone')]] : []),
  ];
  const controls = el('div', { class: 'share-controls' },
    el('p', { class: 'modal-copy' }, t('shareIntro')),
    control('share-type', t('shareType'), kinds, 'kind'),
    control('share-format', t('shareFormat'), [['square', t('shareSquare')], ['story', t('shareStory')]], 'format'),
    control('share-theme', t('themeLabel'), [['night', t('shareNight')], ['paper', t('sharePaper')], ['ember', t('shareEmber')]], 'theme'),
    el('p', { class: 'share-privacy' }, icon('shield', { size: 17 }), t('sharePrivacy')),
    captionField,
    el('div', { class: 'share-actions' }, imageButton, downloadButton),
    button(t('shareCopyCaption'), { class: 'btn btn-ghost btn-small', onclick: async () => {
      const copied = await copyText(`${captionInput.value}\n\n${content.url}`);
      status.textContent = t(copied ? 'shareCaptionCopied' : 'shareCopyFailed');
    } }, icon('copy', { size: 15 })),
    status,
    el('div', { class: 'share-link-row' }, linkInput,
      button(t('shareCopyLink'), { class: 'btn btn-ghost btn-small', onclick: async () => {
        const copied = await copyText(content.url);
        if (!copied) { linkInput.focus(); linkInput.select(); }
        status.textContent = t(copied ? 'shareLinkCopied' : 'shareCopyFailed');
        if (copied) toast(t('shareLinkCopied'));
      } })),
  );
  modal.open({
    heading: t('shareTitle'), size: 'share',
    content: el('div', { class: 'share-layout' }, el('figure', { class: 'share-preview' }, canvas, description), controls),
    actions: [{ label: t('done'), kind: 'ghost' }],
  });
  render();
}
