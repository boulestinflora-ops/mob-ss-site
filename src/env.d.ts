/// <reference path="../.astro/types.d.ts" />

// Types pour Astro.locals — disponibles dans tous les composants SSR
declare namespace App {
  interface Locals {
    /** Nonce CSP généré par middleware — disponible sur les pages SSR */
    nonce: string;
  }
}
