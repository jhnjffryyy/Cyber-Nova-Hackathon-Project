import { useCallback, useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';

const THEME_KEY = 'studyhub_theme_v1';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function getStoredTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

export function applyTheme(pref: ThemePref): void {
  const dark = pref === 'dark' || (pref === 'system' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = dark ? '#0f1211' : '#f7f7f4';
}

export function useTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(getStoredTheme);

  useEffect(() => {
    applyTheme(pref);
    if (pref !== 'system') return;
    const m = media();
    const onChange = () => applyTheme('system');
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [pref]);

  const setTheme = useCallback((p: ThemePref) => {
    setPref(p);
    try {
      localStorage.setItem(THEME_KEY, p);
    } catch {}
    applyTheme(p);
  }, []);

  return [pref, setTheme];
}
