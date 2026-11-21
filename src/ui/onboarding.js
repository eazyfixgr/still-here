import { append, button, el, option } from './dom.js';
import { brand } from './brand.js';
import { icon } from './icons.js';
import { languageSelect } from './components/language-select.js';
import { t, getLocaleMeta } from '../core/i18n.js';
import { BASELINES, findBaseline } from '../data/baselines.js';
import { HABITS } from '../data/habits.js';
import { scenarioFor } from '../core/model.js';
import { birthBounds, validBirth, birthMs } from '../core/dates.js';
import { baselineLabel, formatDate, formatNumber } from '../core/format.js';
import { YEAR } from '../core/constants.js';
import { momentFor, validMomentDate } from '../core/moments.js';

function landingHeader({ locale, theme, onLocaleChange, onThemeToggle }) {
  const dark = theme === 'dark';
  return el(
    'header',
    { class: 'landing-header' },
    el('div', { class: 'landing-header-inner wrap' }, brand(), el(
      'div',
      { class: 'header-actions' },
      el('label', { class: 'sr-only', for: 'language' }, t('language')),
      languageSelect({ value: locale, onChange: onLocaleChange }),
      el(
        'button',
        {
          class: 'icon-button',
          type: 'button',
          'aria-label': dark ? t('themeToggleLight') : t('themeToggleDark'),
          title: dark ? t('themeToggleLight') : t('themeToggleDark'),
          onclick: onThemeToggle,
        },
        icon(dark ? 'moon' : 'sun', { size: 19 }),
      ),
    )),
  );
}

function heroCopy({ onStartHere, onDemo }) {
  return el(
    'div',
    { class: 'hero-copy' },
    el('div', { class: 'eyebrow hero-eyebrow' }, el('span', { class: 'orbit-mark', 'aria-hidden': 'true' }), t('heroEyebrow')),
    el(
      'h1',
      { id: 'hero-title', class: 'hero-title' },
      el('span', null, t('heroTitleA')),
      el('br'),
      el('em', null, t('heroTitleB')),
    ),
    el('p', { class: 'hero-lede' }, t('heroCopy')),
    el(
      'div',
      { class: 'hero-actions' },
      button(t('startHere'), { class: 'btn btn-primary btn-large', onclick: onStartHere }, icon('arrow', { size: 17 })),
      button(t('tryDemo'), { class: 'btn btn-ghost btn-large', onclick: onDemo }, icon('play', { size: 15 })),
    ),
    el('p', { class: 'demo-hint' }, t('demoHint')),
    el(
      'div',
      { class: 'hero-tags' },
      el('span', null, t('heroTag1')),
      el('span', null, t('heroTag2')),
      el('span', null, t('heroTag3')),
    ),
  );
}

function featureCards() {
  return el(
    'section',
    { class: 'feature-grid', 'aria-label': t('gameRulesTitle') },
    el('article', { class: 'feature-card' }, icon('overview', { size: 22 }), el('h2', null, t('featureTimeTitle')), el('p', null, t('featureTimeCopy'))),
    el('article', { class: 'feature-card' }, icon('info', { size: 22 }), el('h2', null, t('featureMomentTitle')), el('p', null, t('featureMomentCopy'))),
    el('article', { class: 'feature-card' }, icon('shield', { size: 22 }), el('h2', null, t('featurePrivateTitle')), el('p', null, t('featurePrivateCopy'))),
  );
}

function sharedMomentCard(date, onStartHere, onShareMoment) {
  if (!validMomentDate(date)) return null;
  const moment = momentFor(date);
  return el(
    'section',
    { class: 'shared-moment', 'aria-labelledby': 'shared-moment-title' },
    el(
      'div',
      { class: 'shared-moment-copy' },
      el('div', { class: 'eyebrow' }, t('sharedMomentEyebrow')),
      el('h2', { id: 'shared-moment-title' }, t('sharedMomentTitle')),
      el('blockquote', null, t(moment.key)),
      el('p', null, t('sharedMomentCopy')),
    ),
    el(
      'div',
      { class: 'shared-moment-side' },
      el('span', { class: 'shared-moment-date' }, formatDate(new Date(`${date}T12:00:00`).getTime())),
      el(
        'div',
        { class: 'shared-moment-actions' },
        button(t('sharedMomentCta'), { class: 'btn btn-primary', onclick: onStartHere }, icon('arrow', { size: 16 })),
        button(t('momentShare'), { class: 'btn btn-ghost', onclick: () => onShareMoment(date) }, icon('share', { size: 15 })),
      ),
    ),
  );
}

function sexChoices(draft, onDraft) {
  const choices = [
    { value: 'male', label: t('sexMale') },
    { value: 'female', label: t('sexFemale') },
    { value: 'midpoint', label: t('sexMidpoint') },
  ];
  const buttons = [];
  const group = el('div', { class: 'segmented', role: 'group', 'aria-label': t('sexLabel') });
  for (const choice of choices) {
    const choiceButton = button(choice.label, {
      class: 'segment',
      'aria-pressed': String(draft.sex === choice.value),
      onclick: () => {
        draft.sex = choice.value;
        for (const item of buttons) item.setAttribute('aria-pressed', String(item === choiceButton));
        onDraft({ sex: choice.value });
      },
    });
    buttons.push(choiceButton);
    group.append(choiceButton);
  }
  return group;
}

function baselineOptions(selected) {
  const pinned = BASELINES.filter((baseline) => baseline.id === 'GR' || baseline.id === 'EU');
  const rest = BASELINES
    .filter((baseline) => baseline.id !== 'GR' && baseline.id !== 'EU')
    .sort((a, b) => baselineLabel(a.id).localeCompare(baselineLabel(b.id), getLocaleMeta().locale));
  return [...pinned, ...rest].map((baseline) =>
    option(baseline.id, baselineLabel(baseline.id), baseline.id === selected),
  );
}

function stepOne(draft, onDraft) {
  const bounds = birthBounds();
  return el(
    'div',
    { class: 'step-panel' },
    el('h2', { class: 'step-heading', tabindex: '-1' }, t('step1Title')),
    el('p', { class: 'step-sub' }, t('step1Copy')),
    el(
      'label',
      { class: 'field', for: 'player-name' },
      el('span', { class: 'field-label' }, t('nameLabel'), el('span', { class: 'optional-tag' }, t('optional'))),
      el('input', {
        id: 'player-name',
        class: 'input',
        type: 'text',
        maxlength: '40',
        value: draft.name,
        placeholder: t('namePlaceholder'),
        autocomplete: 'nickname',
        oninput: (event) => onDraft({ name: event.target.value }),
      }),
      el('span', { class: 'field-hint' }, t('nameHint')),
    ),
    el(
      'div',
      { class: 'field' },
      el('span', { class: 'field-label' }, t('sexLabel')),
      sexChoices(draft, onDraft),
      el('span', { class: 'field-hint' }, t('sexHint')),
    ),
    el(
      'label',
      { class: 'field', for: 'birth' },
      el('span', { class: 'field-label' }, t('dobLabel')),
      el('input', {
        id: 'birth',
        class: 'input',
        type: 'date',
        required: true,
        min: bounds.min,
        max: bounds.max,
        value: draft.birth,
        onchange: (event) => onDraft({ birth: event.target.value }),
      }),
    ),
    el(
      'label',
      { class: 'field', for: 'baseline' },
      el('span', { class: 'field-label' }, t('countryLabel')),
      el(
        'select',
        {
          id: 'baseline',
          class: 'select',
          onchange: (event) => onDraft({ baselineId: event.target.value }),
        },
        ...baselineOptions(draft.baselineId),
      ),
      el('span', { class: 'field-hint' }, t('countryCopy')),
    ),
    el(
      'div',
      { class: 'source-strip' },
      icon('info', { size: 15 }),
      el('span', null, t('sourceEurostat')),
      el('span', { class: 'muted-separator' }, '·'),
      el('span', null, t('baselineHint')),
    ),
  );
}

function habitControls(draft, onDraft, updatePreview) {
  const localHabits = { ...draft.habits };
  const grid = el('div', { class: 'habit-grid' });
  for (const habit of HABITS) {
    const select = el(
      'select',
      {
        class: 'select',
        id: `habit-${habit.id}`,
        onchange: (event) => {
          localHabits[habit.id] = Number(event.target.value);
          onDraft({ habits: { ...localHabits } });
          updatePreview(localHabits);
        },
      },
      ...habit.choices.map((choice, index) =>
        option(index, t(choice.labelKey), index === localHabits[habit.id]),
      ),
    );
    grid.append(
      el(
        'label',
        { class: 'habit-control', for: `habit-${habit.id}` },
        el('span', { class: 'habit-name' }, t(habit.labelKey)),
        select,
      ),
    );
  }
  return grid;
}

function previewPanel(initialScenario) {
  const years = el('strong', { class: 'preview-years' }, initialScenario ? formatNumber(initialScenario.remainingYears, 1) : '—');
  const baseline = el('strong', null, initialScenario ? formatNumber(initialScenario.baselineYears, 1) : '—');
  const modifier = el('strong', null, initialScenario ? `${formatNumber(initialScenario.modifier, 2)}×` : '—');
  const end = el('span', { class: 'preview-end' }, initialScenario ? formatDate(initialScenario.endpoint) : '—');
  const node = el(
    'aside',
    { class: 'preview-card' },
    el('div', { class: 'eyebrow' }, t('previewTitle')),
    el('div', { class: 'preview-number-row' }, years, el('span', { class: 'preview-unit' }, t('previewYears'))),
    el(
      'div',
      { class: 'preview-breakdown' },
      el('div', null, el('span', null, t('previewBaseline')), baseline),
      el('div', null, el('span', null, t('previewModifier')), modifier),
    ),
    el('div', { class: 'preview-end-row' }, el('span', null, t('scenarioEndpoint')), end),
    el('p', { class: 'preview-disclaimer' }, t('previewDisclaimer')),
  );
  function update(next) {
    years.textContent = formatNumber(next.remainingYears, 1);
    baseline.textContent = formatNumber(next.baselineYears, 1);
    modifier.textContent = `${formatNumber(next.modifier, 2)}×`;
    end.textContent = formatDate(next.endpoint);
  }
  return { node, update };
}

function stepTwo(draft, onDraft) {
  let preview = null;
  try {
    preview = scenarioFor({ ...draft, habits: draft.habits });
  } catch {
    preview = null;
  }
  const previewPanelInstance = previewPanel(preview);
  const updatePreview = (habits) => {
    try {
      previewPanelInstance.update(scenarioFor({ ...draft, habits }));
    } catch {
      previewPanelInstance.update({ remainingYears: 0, baselineYears: 0, modifier: 1, endpoint: Date.now() });
    }
  };
  return el(
    'div',
    { class: 'step-panel step-panel-wide' },
    el('h2', { class: 'step-heading', tabindex: '-1' }, t('step2Title')),
    el('p', { class: 'step-sub' }, t('step2Copy')),
    el(
      'div',
      { class: 'habit-layout' },
      el('div', null, habitControls(draft, onDraft, updatePreview), el('p', { class: 'setup-note' }, t('habitsNote'))),
      previewPanelInstance.node,
    ),
  );
}

function stepThree(draft) {
  const scenario = scenarioFor(draft);
  const baseline = findBaseline(draft.baselineId);
  const sexLabel = draft.sex === 'male' ? t('sexMale') : draft.sex === 'female' ? t('sexFemale') : t('sexMidpoint');
  const ageAtEnd = (scenario.endpoint - birthMs(draft.birth)) / YEAR;
  return el(
    'div',
    { class: 'step-panel' },
    el('h2', { class: 'step-heading', tabindex: '-1' }, t('step3Title')),
    el('p', { class: 'step-sub' }, t('step3Copy')),
    el('div', { class: 'review-number' }, formatNumber(scenario.remainingYears, 1)),
    el('div', { class: 'review-caption' }, t('previewYears')),
    el(
      'div',
      { class: 'review-box review-endpoint' },
      el('span', { class: 'review-label' }, t('scenarioEndpoint')),
      el('strong', null, formatDate(scenario.endpoint)),
      el('span', { class: 'review-age' }, t('scenarioAge', { age: formatNumber(Math.max(0, ageAtEnd), 1) })),
    ),
    el(
      'dl',
      { class: 'review-list' },
      el('div', null, el('dt', null, t('reviewProfile')), el('dd', null, draft.name.trim() || t('reviewNameMissing'))),
      el('div', null, el('dt', null, t('reviewBaseline')), el('dd', null, `${baselineLabel(baseline?.id)} · ${sexLabel}`)),
      el('div', null, el('dt', null, t('reviewHabits')), el('dd', null, t('reviewHabitsValue', { count: formatNumber(HABITS.length) }))),
      el('div', null, el('dt', null, t('dobLabel')), el('dd', null, formatDate(birthMs(draft.birth)))),
    ),
    el('p', { class: 'setup-note' }, t('readyCopy')),
    el('p', { class: 'setup-note disclaimer-note' }, t('entertainmentNote')),
  );
}

export function renderOnboarding({
  draft,
  step,
  theme,
  locale,
  warning,
  onDraft,
  onStep,
  onStart,
  onDemo,
  onShareMoment,
  onInfo,
  onLocaleChange,
  onThemeToggle,
  onImport,
  sharedMomentDate,
}) {
  const errorNode = el('p', { class: 'form-error', role: 'alert', tabindex: '-1' });
  const showError = (message) => {
    errorNode.textContent = message;
    errorNode.focus();
  };

  const root = el('div', { class: 'landing' });
  const startHere = () => {
    const card = root.querySelector('.setup-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => root.querySelector('#player-name')?.focus({ preventScroll: true }), 350);
  };
  const sharedMoment = sharedMomentCard(sharedMomentDate, startHere, onShareMoment);
  const heroPanel = heroCopy({ onStartHere: startHere, onDemo });
  if (sharedMoment) heroPanel.append(sharedMoment);
  append(
    root,
    landingHeader({ locale, theme, onLocaleChange, onThemeToggle }),
    el(
      'main',
      { id: 'main', class: 'landing-main wrap', tabindex: '-1' },
      warning ? el('div', { class: 'alert-banner', role: 'alert' }, t(warning)) : null,
      el(
        'section',
        { class: 'hero', 'aria-labelledby': 'hero-title' },
        heroPanel,
        el(
          'div',
          { class: 'setup-card' },
          el(
            'div',
            { class: 'setup-top' },
            el('span', { class: 'eyebrow' }, t('stepLabel', { step: String(step).padStart(2, '0') })),
            el('div', { class: 'step-dots', 'aria-hidden': 'true' }, ...[1, 2, 3].map((number) => el('i', { class: number <= step ? 'on' : '' }))),
          ),
          el(
            'form',
            {
              class: 'setup-form',
              novalidate: true,
              onsubmit: (event) => {
                event.preventDefault();
                errorNode.textContent = '';
                if (step === 1) {
                  if (draft.name.trim().length > 40) {
                    showError(t('formNameTooLong', { max: 40 }));
                    return;
                  }
                  if (!draft.sex) {
                    showError(t('formChooseSex'));
                    return;
                  }
                  if (!draft.birth) {
                    showError(t('formBirthRequired'));
                    return;
                  }
                  if (!validBirth(draft.birth)) {
                    const birthTime = birthMs(draft.birth);
                    showError(Number.isFinite(birthTime) && birthTime > Date.now() ? t('formBirthFuture') : t('formInvalidBirth'));
                    return;
                  }
                  if (!findBaseline(draft.baselineId)) {
                    showError(t('formInvalidBaseline'));
                    return;
                  }
                  onStep(2);
                  return;
                }
                if (step === 2) {
                  onStep(3);
                  return;
                }
                const result = onStart();
                if (result?.ok === false) showError(result.message ?? t('formInvalidBirth'));
              },
            },
            el(
              'div',
              { class: 'setup-body' },
              step === 1 ? stepOne(draft, onDraft) : step === 2 ? stepTwo(draft, onDraft) : stepThree(draft),
              errorNode,
            ),
            el(
              'div',
              { class: 'setup-footer' },
              button(t('back'), {
                class: 'btn btn-ghost',
                hidden: step === 1,
                onclick: () => {
                  errorNode.textContent = '';
                  onStep(Math.max(1, step - 1));
                },
              }),
              el('button', { class: 'btn btn-primary', type: 'submit' }, step === 3 ? t('startClock') : t('continue'), icon('arrow', { size: 17 })),
            ),
          ),
          el(
            'div',
            { class: 'restore-row' },
            el('span', null, t('restoreBackupHint')),
            button(t('restoreBackup'), { class: 'text-button', onclick: onImport }, icon('upload', { size: 15 })),
          ),
        ),
      ),
      featureCards(),
      el(
        'footer',
        { class: 'landing-footer' },
        el('span', null, t('footerTagline')),
        el(
          'div',
          { class: 'footer-links' },
          button(t('aboutPrivacyLink'), { class: 'text-button', onclick: onInfo }),
          el('a', { href: 'https://github.com/eazyfixgr/still-here/issues', target: '_blank', rel: 'noopener noreferrer' }, t('feedbackLink')),
        ),
        el('span', { class: 'footer-note' }, t('entertainmentNote')),
      ),
    ),
  );
  return { root, showError };
}
