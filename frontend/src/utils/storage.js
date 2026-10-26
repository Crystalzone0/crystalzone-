// localStorage with safe fallbacks: private browsing or blocked storage never crashes the app.
const memory = new Map();

const available = (() => {
  try {
    const key = '__cz_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
})();

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = available ? window.localStorage.getItem(key) : memory.get(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  /** Writes only when the value changed, so other tabs are not notified needlessly. */
  set(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (!available) {
        memory.set(key, raw);
      } else if (window.localStorage.getItem(key) !== raw) {
        window.localStorage.setItem(key, raw);
      }
    } catch {
      /* storage full or blocked: ignore */
    }
  },

  remove(key) {
    try {
      if (available) window.localStorage.removeItem(key);
      else memory.delete(key);
    } catch {
      /* ignore */
    }
  },
};