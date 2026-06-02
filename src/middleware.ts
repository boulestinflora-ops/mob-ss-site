/**
 * middleware.ts — Sécurité CSP avec nonces par requête
 *
 * Pour les pages SSR (prerender = false), génère un nonce cryptographique
 * par requête et l'injecte dans le header Content-Security-Policy.
 * Cela remplace unsafe-inline pour les scripts des pages dynamiques.
 *
 * Pour les pages statiques (prerender = true, servis par Vercel CDN),
 * le CSP de vercel.json s'applique (avec strict-dynamic).
 */

import type { MiddlewareHandler } from 'astro';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

function buildCSP(nonce: string): string {
  const directives = [
    "default-src 'self'",
    // strict-dynamic remplace unsafe-inline sur les navigateurs modernes.
    // Sur les anciens, le nonce + self reste permissif mais attendu.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://unpkg.com https://eu.posthog.com`,
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://eu.posthog.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ];
  return directives.join('; ') + ';';
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const nonce = generateNonce();
  // Rendre le nonce disponible dans les composants Astro (Astro.locals.nonce)
  context.locals.nonce = nonce;

  const response = await next();

  // N'écraser le CSP que si la page est dynamique (SSR, pas pre-render)
  // Les pages statiques continuent d'utiliser le CSP de vercel.json
  const prerendered = response.headers.get('x-astro-prerendered');
  if (!prerendered) {
    response.headers.set('Content-Security-Policy', buildCSP(nonce));
  }

  return response;
};
