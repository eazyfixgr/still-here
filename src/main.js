import './styles/index.css';
import { createLocalPersistence } from './core/persistence.js';
import { setLocale } from './core/i18n.js';
import { launchContext } from './core/sharing.js';
import { StillHereApp } from './app.js';

const persistence = createLocalPersistence();
const prefs = persistence.loadPrefs();
const loaded = persistence.loadGame();
const launch = launchContext(window.location.search);
const locale = launch.locale ?? loaded.state?.settings.locale ?? prefs.locale;
const theme = loaded.state?.settings.theme ?? prefs.theme;

setLocale(locale);
document.documentElement.lang = locale;
document.documentElement.dataset.theme = theme;

const app = new StillHereApp({
  persistence,
  loaded,
  prefs: { ...prefs, locale, theme },
  launchMomentDate: launch.momentDate,
  launchLocale: launch.locale,
});
app.start();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
