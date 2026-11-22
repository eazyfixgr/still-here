import { button, el } from '../dom.js';
import { icon } from '../icons.js';
import { languageSelect } from '../components/language-select.js';
import { t } from '../../core/i18n.js';
import { BASELINE_SOURCE_URL } from '../../data/baselines.js';
import { baselineLabel, formatDate } from '../../core/format.js';
import { FEEDBACK_URL, RELEASE, REPO_URL } from '../../config.js';

const GREECE_SOURCE_URL =
  'https://www.statistics.gr/documents/20181/18740733/LivingConditions_1126.pdf/de0859ae-0de7-cbc0-a37e-559791f0f639';

function sexLabel(game) {
  if (game.profile.sex === 'male') return t('sexMale');
  if (game.profile.sex === 'female') return t('sexFemale');
  return t('sexMidpoint');
}

export function renderSettings({
  game,
  isInstalled,
  onNameChange,
  onThemeChange,
  onSecondsChange,
  onLocaleChange,
  onExport,
  onImport,
  onReset,
  onShare,
  onCopyInvite,
  onInstall,
}) {
  const nameInput = el('input', {
    id: 'settings-name',
    class: 'input',
    type: 'text',
    maxlength: '40',
    value: game.profile.name,
    placeholder: t('namePlaceholder'),
    autocomplete: 'nickname',
  });
  const nameForm = el(
    'form',
    {
      class: 'name-form',
      onsubmit: (event) => {
        event.preventDefault();
        onNameChange(nameInput.value);
      },
    },
    el('label', { class: 'sr-only', for: 'settings-name' }, t('profileName')),
    nameInput,
    button(t('saveName'), { class: 'btn btn-ghost btn-small', type: 'submit' }, icon('check', { size: 15 })),
  );

  const themeButton = (theme, label, iconName) =>
    button(label, {
      class: `theme-choice${game.settings.theme === theme ? ' is-active' : ''}`,
      'aria-pressed': String(game.settings.theme === theme),
      onclick: () => onThemeChange(theme),
    }, icon(iconName, { size: 18 }));

  const seconds = el('input', {
    id: 'show-seconds',
    class: 'switch-input',
    type: 'checkbox',
    checked: game.settings.showSeconds,
    onchange: (event) => onSecondsChange(event.target.checked),
  });

  const node = el(
    'div',
    { class: 'view settings-view' },
    el(
      'div',
      { class: 'page-head' },
      el(
        'div',
        { class: 'page-head-copy' },
        el('div', { class: 'eyebrow' }, t('navSettings')),
        el('h1', { class: 'page-title' }, t('settingsTitle')),
        el('p', { class: 'page-sub' }, t('settingsCopy')),
      ),
    ),
    el(
      'div',
      { class: 'settings-grid' },
      el(
        'section',
        { class: 'settings-section' },
        el('h2', null, t('appearanceTitle')),
        el('p', { class: 'muted-copy' }, t('appearanceCopy')),
        el('div', { class: 'theme-choices' }, themeButton('dark', t('themeDark'), 'moon'), themeButton('light', t('themeLight'), 'sun')),
        el(
          'div',
          { class: 'setting-row' },
          el('div', null, el('h3', null, t('secondsTitle')), el('p', null, t('secondsCopy'))),
          el('label', { class: 'switch', for: 'show-seconds' }, seconds, el('span', { class: 'switch-track', 'aria-hidden': 'true' }), el('span', { class: 'sr-only' }, t('secondsTitle'))),
        ),
        el('p', { class: 'field-hint' }, t('secondsHint')),
      ),
      el(
        'section',
        { class: 'settings-section' },
        el('h2', null, t('languageTitle')),
        el('p', { class: 'muted-copy' }, t('languageCopy')),
        el(
          'div',
          { class: 'field' },
          el('label', { class: 'sr-only', for: 'settings-language' }, t('language')),
          languageSelect({ id: 'settings-language', value: game.settings.locale, onChange: onLocaleChange, className: 'wide' }),
        ),
      ),
      el(
        'section',
        { class: 'settings-section span-two share-settings' },
        el('h2', null, t('shareInviteTitle')),
        el('p', { class: 'muted-copy' }, t('shareInviteCopy')),
        el(
          'div',
          { class: 'button-row' },
          button(t('shareDaysButton'), { class: 'btn btn-primary btn-small', onclick: () => onShare({ kind: 'days' }) }, icon('share', { size: 16 })),
          button(t('shareMomentButton'), { class: 'btn btn-ghost btn-small', onclick: () => onShare({ kind: 'moment' }) }, icon('share', { size: 16 })),
          button(t('shareLink'), { class: 'btn btn-ghost btn-small', onclick: onCopyInvite }, icon('copy', { size: 16 })),
        ),
      ),
      el(
        'section',
        { class: 'settings-section span-two install-settings' },
        el('h2', null, t('installTitle')),
        el('p', { class: 'muted-copy' }, t('installCopy')),
        isInstalled
          ? el('p', { class: 'installed-note' }, icon('check', { size: 16 }), t('installInstalled'))
          : el('div', { class: 'install-row' }, button(t('installButton'), { class: 'btn btn-ghost btn-small', onclick: onInstall }, icon('download', { size: 16 })), el('span', { class: 'field-hint' }, t('installHint'))),
        isInstalled ? null : el('p', { class: 'field-hint' }, t('installUnsupported')),
      ),
      el(
        'section',
        { class: 'settings-section span-two' },
        el('h2', null, t('profileTitle')),
        el('p', { class: 'muted-copy' }, t('profileCopy')),
        el(
          'div',
          { class: 'profile-settings' },
          el(
            'div',
            { class: 'profile-form-block' },
            el('span', { class: 'field-label' }, t('profileName')),
            nameForm,
          ),
          el(
            'dl',
            { class: 'profile-details' },
            el('div', null, el('dt', null, t('profileBirth')), el('dd', null, formatDate(new Date(`${game.profile.birth}T00:00:00`).getTime()))),
            el('div', null, el('dt', null, t('profileBaseline')), el('dd', null, baselineLabel(game.profile.baselineId))),
            el('div', null, el('dt', null, t('profileSex')), el('dd', null, sexLabel(game))),
            el('div', null, el('dt', null, t('startedOn')), el('dd', null, formatDate(game.scenario.createdAt))),
          ),
        ),
        el('p', { class: 'setup-note' }, t('profileLocked')),
      ),
      el(
        'section',
        { class: 'settings-section' },
        el('h2', null, t('dataTitle')),
        el('p', { class: 'muted-copy' }, t('dataCopy')),
        el(
          'div',
          { class: 'button-row' },
          button(t('exportSave'), { class: 'btn btn-ghost btn-small', onclick: onExport }, icon('download', { size: 16 })),
          button(t('importSave'), { class: 'btn btn-ghost btn-small', onclick: onImport }, icon('upload', { size: 16 })),
        ),
        el('p', { class: 'field-hint' }, t('backupNote')),
      ),
      el(
        'section',
        { class: 'settings-section danger-section' },
        el('h2', null, t('resetTitle')),
        el('p', { class: 'muted-copy' }, t('resetCopy')),
        button(t('resetButton'), { class: 'btn btn-danger btn-small', onclick: onReset }, icon('reset', { size: 16 })),
      ),
      el(
        'section',
        { class: 'settings-section span-two about-section', id: 'about' },
        el('div', { class: 'about-head' }, el('div', { class: 'eyebrow' }, t('versionLabel', { version: RELEASE })), el('h2', null, t('aboutTitle'))),
        el('p', { class: 'about-lede' }, t('aboutCopy')),
        el(
          'div',
          { class: 'about-grid' },
          el('article', null, el('h3', null, t('aboutModelTitle')), el('p', null, t('aboutModelCopy'))),
          el('article', null, el('h3', null, t('aboutWeightsTitle')), el('p', null, t('aboutWeightsCopy'))),
          el('article', null, el('h3', null, t('aboutFixedTitle')), el('p', null, t('aboutFixedCopy'))),
          el('article', null, el('h3', null, t('aboutPrivacyTitle')), el('p', null, t('aboutPrivacyCopy'))),
        ),
        el(
          'div',
          { class: 'source-box' },
          el('h3', null, t('aboutSourceTitle')),
          el('p', null, t('aboutSourceCopy')),
          el(
            'div',
            { class: 'source-links' },
            el('a', { href: BASELINE_SOURCE_URL, target: '_blank', rel: 'noopener noreferrer' }, t('sourceLink'), icon('external', { size: 14 })),
            el('a', { href: GREECE_SOURCE_URL, target: '_blank', rel: 'noopener noreferrer' }, t('greeceSourceLink'), icon('external', { size: 14 })),
          ),
        ),
        el(
          'div',
          { class: 'about-links' },
          el('a', { href: FEEDBACK_URL, target: '_blank', rel: 'noopener noreferrer' }, t('feedbackLink'), icon('external', { size: 14 })),
          el('a', { href: REPO_URL, target: '_blank', rel: 'noopener noreferrer' }, t('sourceCode'), icon('external', { size: 14 })),
          el('span', null, t('madeBy')),
        ),
        el('p', { class: 'setup-note disclaimer-note' }, t('entertainmentNote')),
      ),
    ),
  );

  return { node, tick() {} };
}
