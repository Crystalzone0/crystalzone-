import { lazy } from 'react';

const RELOAD_KEY = 'cz_chunk_reload';

/** True when a page's code file could not be downloaded (usually: the site was updated while the tab was open). */
export const isChunkLoadError = (error) =>
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    `${error?.name || ''} ${error?.message || ''}`
  );

const readLastReload = () => {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
  } catch {
    return 0;
  }
};
const writeLastReload = () => {
  try {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* storage blocked: the reload guard simply will not remember */
  }
};

/**
 * Same as React.lazy, plus: when a page's file is missing after a new deployment, reload once to get the new version.
 * (React caches a failed import forever, so retrying without a reload can never work.)
 * The 15 second guard prevents a reload loop if the file is genuinely unreachable.
 */
export default function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      if (isChunkLoadError(error) && Date.now() - readLastReload() > 15_000) {
        writeLastReload();
        window.location.reload();
        return new Promise(() => {}); // never settles: the page is reloading
      }
      throw error;
    }
  });
}