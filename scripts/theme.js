(() => {
  const THEME_STORAGE_KEY = 'habit-checklist-theme';
  const VALID_THEMES = ['light', 'dark', 'synthwave'];

  function normalizeTheme(value) {
    const theme = String(value || '').trim();
    return VALID_THEMES.includes(theme) ? theme : 'light';
  }

  function getSavedTheme() {
    try {
      return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'light';
    }
  }

  function applyTheme(theme) {
    const normalized = normalizeTheme(theme);
    if (document.body) {
      document.body.dataset.theme = normalized;
    }
    return normalized;
  }

  function setTheme(theme) {
    const normalized = applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // Ignore localStorage errors.
    }
    return normalized;
  }

  function initializeTheme() {
    applyTheme(getSavedTheme());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme, { once: true });
  } else {
    initializeTheme();
  }

  window.habitTheme = {
    key: THEME_STORAGE_KEY,
    themes: [...VALID_THEMES],
    get: getSavedTheme,
    set: setTheme,
    apply: applyTheme,
  };
})();
