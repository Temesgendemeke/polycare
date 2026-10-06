// i18n configuration

import { Language } from '../types';
import en from './locales/en.json';
import am from './locales/am.json';
import or from './locales/or.json';
import ti from './locales/ti.json';
import gz from './locales/gz.json';

const translations: Record<Language, any> = {
  en,
  am,
  or,
  ti,
  gz,
};

export const getTranslation = (language: Language, key: string, params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, p) =>
    params[p] !== undefined ? String(params[p]) : `{${p}}`
  );
};

export const t = (key: string, language?: Language, params?: Record<string, string | number>): string => {
  const currentLanguage = language || 'en';
  return getTranslation(currentLanguage, key, params);
};

export const supportedLanguages: Language[] = ['en', 'am', 'or', 'ti', 'gz'];

export const languageNames: Record<Language, string> = {
  en: 'English',
  am: 'አማርኛ',
  or: 'Afaan Oromoo',
  ti: 'ትግርኛ',
  gz: 'ጉራጊኛ',
};
