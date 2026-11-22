import { SITE_URL } from '../config.js';
import { getLocale, getLocaleMeta, isLanguage, t } from './i18n.js';
import { lifeInNumbers, momentFor, validMomentDate } from './moments.js';
import { localDateString } from './dates.js';

export function launchContext(search = '') {
  const params = new URLSearchParams(search);
  const language = params.get('lang');
  const date = params.get('moment');
  return {
    locale: isLanguage(language) ? language : null,
    momentDate: validMomentDate(date) ? date : null,
  };
}

export function publicLink({ locale = getLocale(), momentDate } = {}) {
  const url = new URL(SITE_URL);
  if (isLanguage(locale) && locale !== 'en') url.searchParams.set('lang', locale);
  if (validMomentDate(momentDate)) url.searchParams.set('moment', momentDate);
  return url.href;
}

export function shareContent({ game, kind = 'days', milestone, momentDate, now = Date.now() } = {}) {
  const safeKind = kind === 'milestone' && milestone
    ? 'milestone'
    : kind === 'days' && game ? 'days' : 'moment';
  const locale = getLocaleMeta().locale;
  const number = (value) => new Intl.NumberFormat(locale).format(value);
  const moment = momentFor(momentDate ?? localDateString(new Date(now)));
  const common = {
    kind: safeKind,
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(now)),
    url: publicLink({ momentDate: safeKind === 'moment' ? moment.date : undefined }),
    footer: t('shareCardFooter'),
    signature: t('shareCardSignature'),
    storyNote: t('shareStoryNote'),
  };
  if (safeKind === 'days') {
    const { days } = lifeInNumbers(game.profile.birth, now);
    return {
      ...common,
      eyebrow: t('shareDaysEyebrow'),
      value: number(days),
      label: t('shareDaysLabel'),
      message: t('shareDaysMessage'),
      caption: t('shareDaysCaption', { days: number(days) }),
    };
  }
  if (safeKind === 'milestone') {
    const title = String(milestone.title).slice(0, 80);
    return {
      ...common,
      eyebrow: t('shareMilestoneEyebrow'),
      value: '',
      label: title,
      message: t('shareMilestoneMessage'),
      caption: t('shareMilestoneCaption', { title }),
    };
  }
  const question = t(moment.key);
  return {
    ...common,
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${moment.date}T12:00:00`)),
    eyebrow: t('shareMomentEyebrow'),
    value: '',
    label: question,
    message: t('shareMomentMessage'),
    caption: t('shareMomentCaption', { question }),
  };
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {}
  const input = document.createElement('textarea');
  const previous = document.activeElement;
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.cssText = 'position:fixed;left:-9999px;top:0;';
  (document.querySelector('dialog[open]') ?? document.body).append(input);
  input.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch {}
  input.remove();
  previous?.focus({ preventScroll: true });
  return copied;
}
