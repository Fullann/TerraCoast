import { lazy, ComponentType, LazyExoticComponent } from "react";

/**
 * Enveloppe React.lazy avec une reprise automatique en cas de chunk obsolète (404 après déploiement).
 * Si le module dynamique échoue à se charger (hash modifié par un nouveau déploiement sur le serveur),
 * une actualisation automatique de la page est déclenchée une seule fois pour récupérer le dernier bundle.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | Record<string, unknown>>
): LazyExoticComponent<T> {
  return lazy(async () => {
    const reloadKey = "tc_chunk_reload_done";
    const hasStorage = typeof sessionStorage !== "undefined";
    const alreadyReloaded = hasStorage && sessionStorage.getItem(reloadKey) === "true";

    try {
      const module = await factory();
      if (hasStorage) {
        sessionStorage.removeItem(reloadKey);
      }
      if ("default" in module) {
        return module as { default: T };
      }
      const firstExport = Object.values(module)[0];
      return { default: firstExport as T };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkError =
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script failed") ||
        message.includes("Loading chunk") ||
        message.includes("error loading dynamically imported module");

      if (isChunkError && !alreadyReloaded) {
        if (hasStorage) {
          sessionStorage.setItem(reloadKey, "true");
        }
        if (typeof window !== "undefined" && window.location) {
          window.location.reload();
        }
        // Promesse non résolue le temps que le navigateur recharge la page
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
