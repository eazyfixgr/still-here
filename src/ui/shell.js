import { el } from './dom.js';
import { brand } from './brand.js';
import { icon } from './icons.js';
import { languageSelect } from './components/language-select.js';
import { t } from '../core/i18n.js';
import { formatDate, formatNumber, baselineLabel } from '../core/format.js';
import { ageAt } from '../core/dates.js';
import { capsulesDue } from '../core/game.js';

export const NAV_ITEMS = [
  { route: 'overview', labelKey: 'navOverview', icon: 'overview' },
  { route: 'milestones', labelKey: 'navMilestones', icon: 'milestones' },
  { route: 'capsules', labelKey: 'navCapsules', icon: 'capsules' },
  { route: 'studio', labelKey: 'navStudio', icon: 'studio' },
  { route: 'settings', labelKey: 'navSettings', icon: 'settings' },
];

function navLink(item, route, dueCount) {
  return el(
    'a',
    {
      class: `nav-link${route === item.route ? ' is-active' : ''}`,
      href: `#/${item.route}`,
      'aria-current': route === item.route ? 'page' : null,
    },
    icon(item.icon, { size: 19 }),
    el('span', { class: 'nav-label' }, t(item.labelKey)),
    item.route === 'capsules' && dueCount > 0
      ? el('span', { class: 'nav-badge', 'aria-label': `${formatNumber(dueCount)} ${t('readyLabel')}` }, formatNumber(dueCount))
      : null,
  );
}

function themeButton(theme, onToggle) {
  const dark = theme === 'dark';
  return el(
    'button',
    {
      class: 'icon-button',
      type: 'button',
      'aria-label': dark ? t('themeToggleLight') : t('themeToggleDark'),
      title: dark ? t('themeToggleLight') : t('themeToggleDark'),
      onclick: onToggle,
    },
    icon(dark ? 'moon' : 'sun', { size: 19 }),
  );
}

function languageControl(locale, onLocaleChange) {
  return el(
    'div',
    { class: 'language-control' },
    el('label', { class: 'sr-only', for: 'language' }, t('language')),
    languageSelect({ value: locale, onChange: onLocaleChange }),
  );
}

export function renderShell({
  game,
  route,
  theme,
  locale,
  demo,
  onStartOwn,
  onLocaleChange,
  onThemeToggle,
  storageError,
}) {
  const dueCount = capsulesDue(game).length;
  const age = Math.floor(ageAt(Date.now(), game.profile.birth));
  const profileName = game.profile.name || t('thisJourney');
  const saveLabel = demo ? t('demoNotSaved') : storageError ? t('storageError') : t('localOnDevice');

  const root = el('div', { class: 'app-shell' });
  const header = el(
    'header',
    { class: 'app-header' },
    el(
      'div',
      { class: 'app-header-inner' },
      brand({ href: '#/overview', compact: true }),
      el(
        'div',
        { class: 'header-actions' },
        el(
          'span',
          { class: `save-pill${storageError ? ' has-error' : ''}${demo ? ' is-demo' : ''}`, title: saveLabel },
          el('span', { class: 'save-dot', 'aria-hidden': 'true' }),
          el('span', { class: 'save-text' }, demo ? t('demoNotSaved') : storageError ? t('saveIssue') : t('localOnDevice')),
        ),
        languageControl(locale, onLocaleChange),
        themeButton(theme, onThemeToggle),
        el(
          'a',
          { class: 'icon-button', href: '#/settings', 'aria-label': t('settings'), title: t('settings') },
          icon('settings', { size: 19 }),
        ),
      ),
    ),
  );

  const sidebar = el(
    'aside',
    { class: 'sidebar' },
    el(
      'div',
      { class: 'profile-card' },
      el('div', { class: 'eyebrow' }, t('yourTimeline')),
      el('h2', { class: 'profile-name' }, profileName),
      el('div', { class: 'profile-meta' }, t('profileAge', { age: formatNumber(age) })),
      el(
        'div',
        { class: 'profile-baseline' },
        el('span', { class: 'baseline-dot', 'aria-hidden': 'true' }),
        baselineLabel(game.profile.baselineId),
      ),
      el('div', { class: 'profile-started' }, t('profileStarted', { date: formatDate(game.scenario.createdAt, { short: true }) })),
    ),
    el('nav', { class: 'sidebar-nav', 'aria-label': t('primaryNav') }, ...NAV_ITEMS.map((item) => navLink(item, route, dueCount))),
    el(
      'div',
      { class: 'sidebar-foot' },
      el('div', { class: 'local-note' }, icon('shield', { size: 16 }), el('span', null, demo ? t('demoHint') : t('localPrivacyNote'))),
    ),
  );

  const demoBanner = demo
    ? el(
        'div',
        { class: 'demo-banner', role: 'status' },
        el('span', { class: 'pill accent-pill' }, t('demoLabel')),
        el('div', { class: 'demo-banner-copy' }, el('strong', null, t('demoBannerTitle')), el('span', null, t('demoBannerCopy'))),
        el('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: onStartOwn }, t('demoStartMine')),
      )
    : null;

  const main = el(
    'main',
    { id: 'main', class: 'app-main', tabindex: '-1' },
    storageError ? el('div', { class: 'alert-banner', role: 'alert' }, t(storageError)) : null,
    demoBanner,
    el('div', { id: 'view-root', class: 'view-root' }),
    el(
      'footer',
      { class: 'app-footer' },
      el('span', null, t('footerTagline')),
      el('a', { href: '#/settings' }, t('aboutCalculations')),
    ),
  );

  const mobileNav = el(
    'nav',
    { class: 'mobile-nav', 'aria-label': t('primaryNav') },
    ...NAV_ITEMS.map((item) => navLink(item, route, dueCount)),
  );

  root.append(header, el('div', { class: 'app-layout' }, sidebar, main), mobileNav);
  return {
    root,
    viewHost: main.querySelector('#view-root'),
  };
}
