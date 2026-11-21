import en from './locales/en.js';
import el from './locales/el.js';
import enLaunch from './locales/en.launch.js';
import elLaunch from './locales/el.launch.js';
import { DEFAULT_LOCALE } from './constants.js';

export const MESSAGES = {
  en: { ...en, ...enLaunch },
  el: { ...el, ...elLaunch },
};

export const LANGUAGES = [
  { code: 'en', name: 'English', locale: 'en-GB', messages: MESSAGES.en },
  { code: 'el', name: 'Ελληνικά', locale: 'el-GR', messages: MESSAGES.el },
];

const languageMap = new Map(LANGUAGES.map((language) => [language.code, language]));
let currentCode = DEFAULT_LOCALE;

export function isLanguage(code) {
  return languageMap.has(code);
}

export function setLocale(code) {
  currentCode = isLanguage(code) ? code : DEFAULT_LOCALE;
  return currentCode;
}

export function getLocale() {
  return currentCode;
}

export function getLocaleMeta(code = currentCode) {
  return languageMap.get(code) ?? languageMap.get(DEFAULT_LOCALE);
}

export function getMessages(code = currentCode) {
  return getLocaleMeta(code).messages;
}

export function t(key, values = {}) {
  const messages = getMessages();
  const fallback = getMessages(DEFAULT_LOCALE);
  const template = messages[key] ?? fallback[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

export function languageOptions() {
  return LANGUAGES.map(({ code, name }) => ({ code, name }));
}
