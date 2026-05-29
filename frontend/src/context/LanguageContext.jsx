/**
 * LanguageContext — lazy-loaded locale bundles
 *
 * Instead of inlining all 148 KB of translations in the initial JS bundle,
 * each locale (hi, en, mr, ta, te, bn) is now a separate JSON file loaded
 * only when the user selects that language. This reduces initial bundle size
 * by ~130 KB and keeps Vite's code-splitting working correctly.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

// Locale loaders — Vite will chunk these into separate files at build time
const loaders = {
  en: () => import('./locales/en.json'),
  hi: () => import('./locales/hi.json'),
  mr: () => import('./locales/mr.json'),
  ta: () => import('./locales/ta.json'),
  te: () => import('./locales/te.json'),
  bn: () => import('./locales/bn.json'),
};

// Tiny in-memory cache so switching back to a language doesn't re-fetch
const cache = {};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('swasth_lang') || 'en'
  );
  const [t, setT] = useState(null); // null = still loading

  const loadLocale = useCallback(async (locale) => {
    if (cache[locale]) { setT(cache[locale]); return; }
    const mod = await (loaders[locale] || loaders.en)();
    const data = mod.default || mod;
    cache[locale] = data;
    setT(data);
  }, []);

  useEffect(() => { loadLocale(lang); }, [lang, loadLocale]);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('swasth_lang', newLang);
  };

  // While the JSON is loading, serve English from cache if available (instant)
  const effective = t || cache.en || {};

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: effective }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
