// src/shared/composables/useTheme.ts

import { ref, watch } from 'vue';

/**
 * Theme preference (GoDatalize brand §4.5):
 *  - 'dark'  — always dark (the default: dark is the brand identity)
 *  - 'light' — always light
 *  - 'auto'  — follow the operating system's prefers-color-scheme
 *
 * Persisted in localStorage under the legacy 'restMode' key as
 * 'true' (dark) / 'false' (light) / 'auto', which the pre-paint script in
 * apps/web/core/templates/{index,admin}.rue reads before Vue mounts.
 */
export type ThemePreference = 'dark' | 'light' | 'auto';

const STORAGE_KEY = 'restMode';

const isDarkMode = ref(true);
const themePreference = ref<ThemePreference>('dark');
const themeListeners = new Set<(isDark: boolean) => void>();
const isInitialized = ref(false);

let systemQuery: MediaQueryList | null = null;

function readStoredPreference(): ThemePreference {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored === 'false') return 'light';
  if (stored === 'auto') return 'auto';
  return 'dark';
}

function storePreference(preference: ThemePreference): void {
  if (typeof localStorage === 'undefined') return;
  const value = preference === 'auto' ? 'auto' : String(preference === 'dark');
  localStorage.setItem(STORAGE_KEY, value);
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    !!window.matchMedia('(prefers-color-scheme: dark)')?.matches
  );
}

function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === 'auto') return systemPrefersDark();
  return preference === 'dark';
}

export function useTheme() {
  const notify = () => themeListeners.forEach((listener) => listener(isDarkMode.value));

  const updateDarkMode = () => {
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    document.documentElement.classList.toggle('light', !isDarkMode.value);
  };

  const onSystemChange = () => {
    if (themePreference.value !== 'auto') return;
    isDarkMode.value = systemPrefersDark();
    updateDarkMode();
    notify();
  };

  const initializeTheme = () => {
    if (isInitialized.value) return;
    themePreference.value = readStoredPreference();
    isDarkMode.value = resolveIsDark(themePreference.value);
    updateDarkMode();

    if (typeof window !== 'undefined' && 'matchMedia' in window && !systemQuery) {
      systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
      systemQuery?.addEventListener?.('change', onSystemChange);
    }
    isInitialized.value = true;
  };

  const onThemeChange = (callback: (isDark: boolean) => void) => {
    themeListeners.add(callback);
    return () => themeListeners.delete(callback);
  };

  /** Set an explicit preference ('dark' | 'light' | 'auto') and persist it. */
  const setThemePreference = (preference: ThemePreference) => {
    if (!isInitialized.value) initializeTheme();
    themePreference.value = preference;
    storePreference(preference);
    isDarkMode.value = resolveIsDark(preference);
    updateDarkMode();
    notify();
  };

  /** Flip between explicit dark and light (leaves 'auto'). */
  const toggleDarkMode = () => {
    if (!isInitialized.value) initializeTheme();
    setThemePreference(isDarkMode.value ? 'light' : 'dark');
  };

  const setTheme = (themeName: string) => {
    const preferences: ThemePreference[] = ['dark', 'light', 'auto'];
    const preference = preferences.find((p) => p === themeName) ?? 'light';
    setThemePreference(preference);
  };

  function getThemeListenersSize() {
    return themeListeners.size;
  }

  watch(isDarkMode, updateDarkMode);

  return {
    isDarkMode,
    themePreference,
    toggleDarkMode,
    setThemePreference,
    initializeTheme,
    onThemeChange,
    setTheme,
    isInitialized,
    getThemeListenersSize,
    clearThemeListeners: () => themeListeners.clear(),
  };
}
