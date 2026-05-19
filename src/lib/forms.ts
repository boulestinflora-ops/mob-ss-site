/**
 * MOB'SS — Utilitaires de validation et de messages pour les formulaires
 * Usage : import { showMessage, markError, validateEmail } from '../lib/forms';
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type MsgType = 'success' | 'error' | 'warning' | 'info';

// ── Styles de messages ─────────────────────────────────────────────────────────
const MSG_STYLES: Record<MsgType, { bg: string; color: string; border: string }> = {
  success: { bg: '#E8F4EA', color: '#2D6E3F', border: '1px solid #B8DBC0' },
  error:   { bg: '#FBE5E5', color: '#A02323', border: '1px solid #F0B8B8' },
  warning: { bg: '#FEF3C7', color: '#92400E', border: '1px solid #F0E68C' },
  info:    { bg: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' },
};

// ── showMessage — affiche un message dans une zone dédiée ──────────────────────
export function showMessage(
  elOrId: HTMLElement | string,
  type: MsgType,
  text: string
): void {
  const el = typeof elOrId === 'string'
    ? (document.getElementById(elOrId) as HTMLElement | null)
    : elOrId;
  if (!el) return;

  const s = MSG_STYLES[type];
  el.style.display    = 'block';
  el.style.background = s.bg;
  el.style.color      = s.color;
  el.style.border     = s.border;
  el.style.padding    = '14px 18px';
  el.style.borderRadius = 'var(--radius-md, 8px)';
  el.style.fontSize   = '0.95rem';
  el.style.marginBottom = '16px';
  el.textContent      = text;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── hideMessage — cache la zone de message ─────────────────────────────────────
export function hideMessage(elOrId: HTMLElement | string): void {
  const el = typeof elOrId === 'string'
    ? (document.getElementById(elOrId) as HTMLElement | null)
    : elOrId;
  if (el) el.style.display = 'none';
}

// ── markError — souligne un champ en rouge avec un message ────────────────────
export function markError(inputId: string, message?: string): void {
  const input = document.getElementById(inputId) as HTMLElement | null;
  if (!input) return;
  input.style.borderColor = '#EF4444';
  input.style.boxShadow   = '0 0 0 2px rgba(239,68,68,0.15)';

  if (message) {
    // Crée ou met à jour le message d'erreur inline sous le champ
    const fieldEl = input.closest('.field') as HTMLElement | null;
    if (fieldEl) {
      let errEl = fieldEl.querySelector<HTMLElement>('.field-err-msg');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'field-err-msg';
        errEl.style.cssText = 'color:#A02323;font-size:0.8rem;margin:4px 0 0;';
        fieldEl.appendChild(errEl);
      }
      errEl.textContent = message;
    }
  }
}

// ── clearErrors — remet un champ à son état normal ────────────────────────────
export function clearErrors(...inputIds: string[]): void {
  inputIds.forEach(id => {
    const input = document.getElementById(id) as HTMLElement | null;
    if (!input) return;
    input.style.borderColor = '';
    input.style.boxShadow   = '';
    const fieldEl = input.closest('.field');
    fieldEl?.querySelector('.field-err-msg')?.remove();
  });
}

// ── validateEmail ─────────────────────────────────────────────────────────────
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ── validatePhone ─────────────────────────────────────────────────────────────
export function validatePhone(tel: string): boolean {
  return /^(\+33|0)[1-9](\s?\d{2}){4}$/.test(tel.trim().replace(/[\s.\-]/g, ''));
}

// ── validatePassword — règles MOB'SS : 8 car., 1 maj., 1 chiffre ─────────────
export function validatePassword(pwd: string): { valid: boolean; error: string } {
  if (pwd.length < 8)    return { valid: false, error: 'Au moins 8 caractères requis.' };
  if (!/[A-Z]/.test(pwd))return { valid: false, error: 'Au moins 1 lettre majuscule requise.' };
  if (!/\d/.test(pwd))   return { valid: false, error: 'Au moins 1 chiffre requis.' };
  return { valid: true, error: '' };
}

// ── setLoading — active/désactive le bouton submit avec texte intermédiaire ──
export function setLoading(btn: HTMLButtonElement, loading: boolean, label = 'Envoyer'): void {
  btn.disabled    = loading;
  btn.textContent = loading ? 'Chargement…' : label;
  btn.style.opacity = loading ? '0.7' : '';
}
