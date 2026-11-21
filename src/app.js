import { el } from './ui/dom.js';
import { toast } from './ui/toast.js';
import { createModal } from './ui/modal.js';
import { renderOnboarding } from './ui/onboarding.js';
import { renderShell } from './ui/shell.js';
import { renderOverview } from './ui/views/overview.js';
import { renderMilestones } from './ui/views/milestones.js';
import { renderCapsules } from './ui/views/capsules.js';
import { renderStudio } from './ui/views/studio.js';
import { renderSettings } from './ui/views/settings.js';
import { t, setLocale, getLocale } from './core/i18n.js';
import { DEFAULT_HABITS } from './data/habits.js';
import { DEFAULT_BASELINE, findBaseline } from './data/baselines.js';
import { validBirth, birthMs, toDateTimeLocal, parseDateTimeLocal } from './core/dates.js';
import {
  addCapsule,
  addCustomMilestone,
  createGame,
  exportPayload,
  openCapsule,
  removeCapsule,
  removeCustomMilestone,
  updateName,
  validateImport,
} from './core/game.js';
import { syncAchievements } from './core/achievements.js';
import { formatDateTime, formatNumber } from './core/format.js';

const ROUTES = new Set(['overview', 'milestones', 'capsules', 'studio', 'settings']);
const SAVE_IMPORT_LIMIT = 2000000;

function freshDraft() {
  return {
    name: '',
    sex: null,
    birth: '',
    baselineId: DEFAULT_BASELINE,
    habits: { ...DEFAULT_HABITS },
  };
}

function routeFromHash() {
  const name = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return ROUTES.has(name) ? name : 'overview';
}

function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export class StillHereApp {
  constructor({ persistence, loaded, prefs }) {
    this.persistence = persistence;
    this.game = loaded.state;
    this.prefs = prefs;
    this.warning = loaded.error || persistence.getError();
    this.migrated = loaded.migrated;
    this.route = this.game ? routeFromHash() : 'overview';
    this.draft = freshDraft();
    this.step = 1;
    this.awayCount = 0;
    this.activeView = null;
    this.lastTick = Date.now();
    this.timer = null;
    this.theme = this.game?.settings.theme ?? prefs.theme;
    setLocale(this.game?.settings.locale ?? prefs.locale);
    this.modal = createModal();
    this.fileInput = el('input', {
      type: 'file',
      accept: '.json,application/json',
      hidden: true,
      onchange: (event) => this.handleImportFile(event),
    });
    document.body.append(this.fileInput);
  }

  start() {
    if (this.game) {
      const now = Date.now();
      const previousSeen = this.game.meta.lastSeen;
      const wasLegacy = Boolean(this.game.meta.legacy);
      const fresh = syncAchievements(this.game, now);
      if (fresh.length && !wasLegacy && now - previousSeen > 30000) this.awayCount = fresh.length;
      this.game.meta.lastSeen = now;
      if (wasLegacy) delete this.game.meta.legacy;
      this.persistGame();
    }
    this.applyDocument();
    this.applyTheme();
    this.bindEvents();
    this.render({ focusMain: Boolean(this.game) });
    this.timer = window.setInterval(() => this.tick(), 1000);
    if (this.migrated) {
      window.setTimeout(() => toast(t('imported')), 500);
    }
  }

  bindEvents() {
    window.addEventListener('hashchange', () => {
      if (!this.game) return;
      const next = routeFromHash();
      if (!window.location.hash) {
        window.history.replaceState(null, '', '#/overview');
      }
      if (next === this.route) return;
      this.route = next;
      this.render({ focusMain: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    window.addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (!this.game) return;
      if (document.hidden) this.flush();
      else this.tick();
    });
  }

  applyDocument() {
    document.documentElement.lang = getLocale();
    document.documentElement.dir = 'ltr';
    document.title = t('appTitle');
    document.querySelector('.skip-link')?.replaceChildren(t('skipToContent'));
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.dataset.theme = this.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = this.theme === 'light' ? '#f4f2e8' : '#10150f';
  }

  persistPrefs() {
    const ok = this.persistence.savePrefs({ locale: getLocale(), theme: this.theme });
    if (!ok) this.warning = this.persistence.getError() || 'storageError';
  }

  persistGame() {
    if (!this.game) return false;
    this.game.meta.lastSeen = Math.max(this.game.meta.lastSeen, Date.now());
    const ok = this.persistence.saveGame(this.game);
    if (!ok) this.warning = this.persistence.getError() || 'storageError';
    else if (this.warning === 'storageError' || this.warning === 'corruptSave') this.warning = null;
    return ok;
  }

  flush() {
    if (!this.game) return;
    this.game.meta.lastSeen = Math.max(this.game.meta.lastSeen, Date.now());
    this.persistence.saveGame(this.game);
  }

  finishGameChange() {
    this.persistGame();
    this.persistPrefs();
    this.render();
  }

  render({ focusMain = false, focusStep = false } = {}) {
    this.applyDocument();
    const root = document.getElementById('app');
    if (!this.game) {
      const onboarding = renderOnboarding({
        draft: this.draft,
        step: this.step,
        theme: this.theme,
        locale: getLocale(),
        warning: this.warning,
        onDraft: (patch) => Object.assign(this.draft, patch),
        onStep: (step) => {
          this.step = step;
          this.render({ focusStep: true });
        },
        onStart: () => this.startGame(),
        onLocaleChange: (code) => this.changeLocale(code),
        onThemeToggle: () => this.changeTheme(this.theme === 'dark' ? 'light' : 'dark'),
        onImport: () => this.openImportPicker(),
      });
      root.replaceChildren(onboarding.root);
      this.activeView = null;
      if (focusStep) {
        window.requestAnimationFrame(() => root.querySelector('.step-heading')?.focus());
      }
      return;
    }

    if (!ROUTES.has(this.route)) this.route = 'overview';
    const shell = renderShell({
      game: this.game,
      route: this.route,
      theme: this.theme,
      locale: getLocale(),
      onLocaleChange: (code) => this.changeLocale(code),
      onThemeToggle: () => this.changeTheme(this.theme === 'dark' ? 'light' : 'dark'),
      storageError: this.warning,
    });
    const view = this.createView();
    this.activeView = view;
    shell.viewHost.append(view.node);
    root.replaceChildren(shell.root);
    if (focusMain) {
      window.requestAnimationFrame(() => shell.root.querySelector('.app-main')?.focus({ preventScroll: true }));
    }
  }

  createView() {
    if (this.route === 'overview') {
      return renderOverview({
        game: this.game,
        awayCount: this.awayCount,
        showSeconds: this.game.settings.showSeconds,
        onAwayDismiss: () => {
          this.awayCount = 0;
          this.render();
        },
      });
    }
    if (this.route === 'milestones') {
      return renderMilestones({
        game: this.game,
        onAddMilestone: () => this.openMilestoneForm(),
        onDeleteMilestone: (id) => this.requestDeleteMilestone(id),
      });
    }
    if (this.route === 'capsules') {
      return renderCapsules({
        game: this.game,
        onAddCapsule: () => this.openCapsuleForm(),
        onOpenCapsule: (capsule) => this.readCapsule(capsule),
        onDeleteCapsule: (id) => this.requestDeleteCapsule(id),
      });
    }
    if (this.route === 'studio') {
      return renderStudio({ game: this.game });
    }
    return renderSettings({
      game: this.game,
      onNameChange: (name) => this.changeName(name),
      onThemeChange: (theme) => this.changeTheme(theme),
      onSecondsChange: (value) => {
        this.game.settings.showSeconds = value;
        this.finishGameChange();
      },
      onLocaleChange: (code) => this.changeLocale(code),
      onExport: () => this.exportGame(),
      onImport: () => this.openImportPicker(),
      onReset: () => this.requestReset(),
    });
  }

  startGame() {
    if (!this.draft.sex) return { ok: false, message: t('formChooseSex') };
    if (!validBirth(this.draft.birth)) return { ok: false, message: t('formInvalidBirth') };
    if (!findBaseline(this.draft.baselineId)) return { ok: false, message: t('formInvalidBaseline') };
    let created;
    try {
      created = createGame(this.draft, this.draft.habits, {
        locale: getLocale(),
        theme: this.theme,
        showSeconds: true,
      }, Date.now());
    } catch {
      return { ok: false, message: t('formInvalidBirth') };
    }
    const now = Date.now();
    this.game = created;
    syncAchievements(this.game, now);
    this.game.meta.lastSeen = now;
    this.awayCount = 0;
    this.warning = null;
    const saved = this.persistGame();
    this.persistPrefs();
    if (!saved) this.warning = this.persistence.getError() || 'storageError';
    this.route = 'overview';
    this.step = 1;
    window.history.replaceState(null, '', '#/overview');
    this.render({ focusMain: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
    toast(t('clockStarted'));
    return { ok: true };
  }

  changeLocale(code) {
    setLocale(code);
    if (this.game) this.game.settings.locale = code;
    this.persistPrefs();
    this.applyDocument();
    this.render();
  }

  changeTheme(theme) {
    this.theme = theme;
    if (this.game) this.game.settings.theme = theme;
    this.persistPrefs();
    if (this.game) this.persistGame();
    this.applyTheme();
    this.render();
  }

  changeName(value) {
    const trimmed = value.trim();
    if (trimmed.length > 40) {
      toast(t('nameTooLong', { max: 40 }));
      return;
    }
    updateName(this.game, trimmed);
    this.finishGameChange();
    toast(t('profileNameSaved'));
  }

  tick() {
    if (!this.game || document.hidden) return;
    const now = Date.now();
    if (now < this.lastTick - 60000) toast(t('clockWarning'));
    this.lastTick = now;
    const fresh = syncAchievements(this.game, now);
    if (fresh.length) {
      this.persistGame();
      toast(fresh.length === 1
        ? t('milestoneToast', { title: fresh[0].title })
        : t('moreMilestonesMany', { count: formatNumber(fresh.length) }));
      const active = document.activeElement;
      const typing = active
        && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)
        && !this.modal.dialog.contains(active);
      if (!typing) this.render();
    }
    this.activeView?.tick?.(now);
  }

  openMilestoneForm() {
    const error = el('p', { class: 'form-error', role: 'alert' });
    const title = el('input', { id: 'milestone-title', class: 'input', maxlength: '80', required: true, autofocus: true });
    const date = el('input', { id: 'milestone-date', class: 'input', type: 'date', required: true });
    const note = el('textarea', { id: 'milestone-note', class: 'input textarea', maxlength: '500', rows: '3' });
    const form = el(
      'form',
      {
        id: 'milestone-form',
        class: 'modal-form',
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          error.textContent = '';
          const cleanTitle = title.value.trim();
          if (!cleanTitle) {
            error.textContent = t('milestoneTitleRequired');
            title.focus();
            return;
          }
          if (!date.value) {
            error.textContent = t('milestoneDateRequired');
            date.focus();
            return;
          }
          const at = parseDateTimeLocal(`${date.value}T12:00`);
          if (!Number.isFinite(at) || at < birthMs(this.game.profile.birth)) {
            error.textContent = t('milestoneDateInvalid');
            date.focus();
            return;
          }
          const item = addCustomMilestone(this.game, { title: cleanTitle, note: note.value, at });
          if (!item) {
            error.textContent = t('milestoneDateInvalid');
            return;
          }
          syncAchievements(this.game, Date.now());
          this.modal.close();
          this.persistGame();
          this.render();
          toast(t('milestoneAdded'));
        },
      },
      el('label', { class: 'field', for: 'milestone-title' }, el('span', { class: 'field-label' }, t('milestoneTitleLabel')), title),
      el('label', { class: 'field', for: 'milestone-date' }, el('span', { class: 'field-label' }, t('milestoneDateLabel')), date),
      el('label', { class: 'field', for: 'milestone-note' }, el('span', { class: 'field-label' }, `${t('milestoneNoteLabel')} (${t('optional')})`), note),
      error,
    );
    this.modal.open({
      heading: t('addMilestoneTitle'),
      content: [el('p', { class: 'modal-copy' }, t('addMilestoneCopy')), form],
      actions: [
        { label: t('cancel'), kind: 'ghost' },
        { label: t('addMilestone'), kind: 'primary', type: 'submit', form: 'milestone-form' },
      ],
    });
  }

  async requestDeleteMilestone(id) {
    const item = this.game.customMilestones.find((milestone) => milestone.id === id);
    if (!item) return;
    const confirmed = await this.modal.confirm({
      heading: t('deleteMilestoneTitle'),
      message: t('deleteMilestoneCopy'),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
      danger: true,
    });
    if (!confirmed) return;
    removeCustomMilestone(this.game, id);
    this.finishGameChange();
    toast(t('milestoneDeleted'));
  }

  openCapsuleForm() {
    const error = el('p', { class: 'form-error', role: 'alert' });
    const now = Date.now();
    const title = el('input', { id: 'capsule-title-new', class: 'input', maxlength: '80', required: true, autofocus: true });
    const message = el('textarea', { id: 'capsule-message-new', class: 'input textarea capsule-textarea', maxlength: '5000', rows: '7', required: true });
    const openAt = el('input', {
      id: 'capsule-open-at',
      class: 'input',
      type: 'datetime-local',
      required: true,
      min: toDateTimeLocal(now + 60000),
      value: toDateTimeLocal(now + 86400000),
    });
    const form = el(
      'form',
      {
        id: 'capsule-form',
        class: 'modal-form',
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          error.textContent = '';
          if (!title.value.trim()) {
            error.textContent = t('capsuleTitleRequired');
            title.focus();
            return;
          }
          if (!message.value.trim()) {
            error.textContent = t('capsuleMessageRequired');
            message.focus();
            return;
          }
          if (!openAt.value) {
            error.textContent = t('capsuleDateRequired');
            openAt.focus();
            return;
          }
          const at = parseDateTimeLocal(openAt.value);
          if (!Number.isFinite(at) || at < Date.now() + 60000) {
            error.textContent = t('capsuleDateFuture');
            openAt.focus();
            return;
          }
          const capsule = addCapsule(this.game, { title: title.value, message: message.value, openAt: at });
          if (!capsule) {
            error.textContent = t('capsuleDateFuture');
            return;
          }
          this.modal.close();
          this.persistGame();
          this.render();
          toast(t('capsuleSealedToast', { date: formatDateTime(at) }));
        },
      },
      el('label', { class: 'field', for: 'capsule-title-new' }, el('span', { class: 'field-label' }, t('capsuleTitleLabel')), title),
      el('label', { class: 'field', for: 'capsule-message-new' }, el('span', { class: 'field-label' }, t('capsuleMessageLabel')), message),
      el('label', { class: 'field', for: 'capsule-open-at' }, el('span', { class: 'field-label' }, t('capsuleOpenAtLabel')), openAt),
      error,
    );
    this.modal.open({
      heading: t('addCapsuleTitle'),
      content: [el('p', { class: 'modal-copy' }, t('addCapsuleCopy')), form],
      actions: [
        { label: t('cancel'), kind: 'ghost' },
        { label: t('sealCapsule'), kind: 'primary', type: 'submit', form: 'capsule-form' },
      ],
      size: 'wide',
    });
  }

  readCapsule(capsule) {
    if (!capsule.openedAt) {
      const opened = openCapsule(this.game, capsule.id);
      if (!opened) return;
      this.persistGame();
      this.render();
      toast(t('capsuleOpenedToast'));
    }
    this.modal.open({
      heading: capsule.title,
      content: el(
        'div',
        { class: 'capsule-read' },
        el('p', { class: 'modal-copy' }, t('openedOn', { date: formatDateTime(capsule.openedAt ?? Date.now()) })),
        el('p', { class: 'capsule-message' }, capsule.message),
      ),
      actions: [{ label: t('close'), kind: 'primary' }],
      size: 'wide',
    });
  }

  async requestDeleteCapsule(id) {
    const confirmed = await this.modal.confirm({
      heading: t('capsuleDeleteTitle'),
      message: t('capsuleDeleteCopy'),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
      danger: true,
    });
    if (!confirmed) return;
    if (!removeCapsule(this.game, id)) return;
    this.finishGameChange();
    toast(t('capsuleDeleted'));
  }

  exportGame() {
    if (!this.game) {
      toast(t('noSave'));
      return;
    }
    this.persistGame();
    try {
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(`still-here-backup-${date}.json`, exportPayload(this.game));
      toast(t('backupExported'));
    } catch {
      toast(t('exportFailed'), { tone: 'error' });
    }
  }

  openImportPicker() {
    this.fileInput.value = '';
    this.fileInput.click();
  }

  async handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > SAVE_IMPORT_LIMIT) throw new Error('too-large');
      const raw = JSON.parse(await file.text());
      const imported = validateImport(raw, { locale: getLocale(), theme: this.theme }, Date.now());
      if (!imported) throw new Error('invalid');
      const apply = () => this.applyImport(imported);
      if (this.game) {
        const confirmed = await this.modal.confirm({
          heading: t('importConfirmTitle'),
          message: t('importConfirmCopy'),
          confirmLabel: t('importSave'),
          cancelLabel: t('cancel'),
        });
        if (!confirmed) return;
      }
      apply();
    } catch {
      toast(t('importFailed'), { tone: 'error' });
    }
  }

  applyImport(imported) {
    const now = Date.now();
    this.game = imported;
    this.game.meta.lastSeen = now;
    setLocale(this.game.settings.locale);
    this.theme = this.game.settings.theme;
    this.awayCount = 0;
    this.warning = null;
    syncAchievements(this.game, now);
    this.persistGame();
    this.persistPrefs();
    this.applyDocument();
    this.applyTheme();
    this.route = 'overview';
    this.step = 1;
    this.draft = freshDraft();
    window.history.replaceState(null, '', '#/overview');
    this.render({ focusMain: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
    toast(t('importSuccess'));
  }

  async requestReset() {
    const confirmed = await this.modal.confirm({
      heading: t('resetConfirmTitle'),
      message: t('resetConfirmCopy'),
      confirmLabel: t('resetButton'),
      cancelLabel: t('cancel'),
      danger: true,
    });
    if (!confirmed) return;
    this.game = null;
    this.activeView = null;
    this.draft = freshDraft();
    this.step = 1;
    this.awayCount = 0;
    this.warning = null;
    this.persistence.clear();
    this.persistPrefs();
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    this.render({ focusStep: true });
    toast(t('resetDone'));
  }
}
