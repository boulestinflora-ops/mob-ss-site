/* ========================================================
   MOB'SS — Script global (v2 — corrigé P0)
   ======================================================== */

(function () {
  'use strict';

  // ----- Menu mobile -----
  const menuToggle = document.querySelector('.menu-toggle');
  const nav        = document.querySelector('#main-nav');
  const backdrop   = document.querySelector('#nav-backdrop');

  function openNav() {
    nav.classList.add('is-open');
    backdrop && backdrop.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    nav.classList.remove('is-open');
    backdrop && backdrop.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeNav() : openNav();
    });

    // Fermer le menu si on clique sur un lien
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Fermer avec la touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        menuToggle.focus();
      }
    });

    // Fermer si clic sur le backdrop
    backdrop && backdrop.addEventListener('click', closeNav);
  }

  // ----- Onglets capsule (Comment ça marche) avec ARIA -----
  const tabButtons = document.querySelectorAll('[data-tab]');
  if (tabButtons.length) {
    // Prépare l'ARIA
    const tablist = tabButtons[0].parentElement;
    if (tablist) tablist.setAttribute('role', 'tablist');
    tabButtons.forEach((btn, i) => {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
      const target = btn.dataset.tab;
      const panel = document.getElementById('tab-' + target);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', btn.id || ('tab-btn-' + target));
        if (!btn.id) btn.id = 'tab-btn-' + target;
      }
    });

    function activate(btn) {
      tabButtons.forEach(b => {
        b.classList.remove('btn--primary');
        b.classList.add('btn--outline');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      });
      btn.classList.remove('btn--outline');
      btn.classList.add('btn--primary');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
      const panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) panel.style.display = 'block';
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => activate(btn));
      btn.addEventListener('keydown', (e) => {
        const idx = Array.from(tabButtons).indexOf(btn);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = e.key === 'ArrowRight'
            ? tabButtons[(idx + 1) % tabButtons.length]
            : tabButtons[(idx - 1 + tabButtons.length) % tabButtons.length];
          next.focus();
          activate(next);
        }
      });
    });

    // Active le premier
    if (tabButtons[0]) activate(tabButtons[0]);
  }

  // ----- Onglets dashboard avec ARIA -----
  const dashTabs = document.querySelectorAll('.tabs button[data-panel]');
  if (dashTabs.length) {
    const tablist = dashTabs[0].parentElement;
    if (tablist) tablist.setAttribute('role', 'tablist');
    dashTabs.forEach((btn, i) => {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', btn.classList.contains('is-active') ? 'true' : 'false');
      btn.setAttribute('tabindex', btn.classList.contains('is-active') ? '0' : '-1');
      const panel = document.getElementById(btn.dataset.panel);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        if (!btn.id) btn.id = 'dashtab-' + btn.dataset.panel;
        panel.setAttribute('aria-labelledby', btn.id);
      }
    });

    function activatePanel(btn) {
      dashTabs.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
      const panel = document.getElementById(btn.dataset.panel);
      if (panel) panel.classList.add('is-active');
    }

    dashTabs.forEach(btn => {
      btn.addEventListener('click', () => activatePanel(btn));
      btn.addEventListener('keydown', (e) => {
        const idx = Array.from(dashTabs).indexOf(btn);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = e.key === 'ArrowRight'
            ? dashTabs[(idx + 1) % dashTabs.length]
            : dashTabs[(idx - 1 + dashTabs.length) % dashTabs.length];
          next.focus();
          activatePanel(next);
        }
      });
    });
  }

  // ----- Pré-sélection du rôle depuis ?role=... (sanitisée) -----
  const ALLOWED_ROLES = ['praticien', 'collectivite', 'entreprise'];
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');
  if (roleParam && ALLOWED_ROLES.includes(roleParam)) {
    const matchOption = document.querySelector('.role-option[data-role="' + CSS.escape(roleParam) + '"]');
    if (matchOption) {
      const input = matchOption.querySelector('input');
      if (input) input.checked = true;
      matchOption.classList.add('is-selected');
    }
  }

  // ----- Mise à jour des champs en fonction du rôle -----
  const roleInputs = document.querySelectorAll('input[name="role"]');
  const fieldOrg = document.getElementById('field-organisation');
  const fieldAct = document.getElementById('field-activite');
  function updateRoleFields() {
    const selected = document.querySelector('input[name="role"]:checked');
    if (!selected) return;
    if (fieldOrg) fieldOrg.style.display = (selected.value === 'collectivite' || selected.value === 'entreprise') ? 'block' : 'none';
    if (fieldAct) fieldAct.style.display = (selected.value === 'praticien') ? 'block' : 'none';
    document.querySelectorAll('.role-option').forEach(o => o.classList.remove('is-selected'));
    selected.closest('.role-option')?.classList.add('is-selected');
  }
  if (roleInputs.length) {
    roleInputs.forEach(r => r.addEventListener('change', updateRoleFields));
    updateRoleFields();
  }

  // ----- Sticky header shadow on scroll -----
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 8 ? 'var(--shadow-sm)' : 'none';
    }, { passive: true });
  }

  // ----- Search button feedback -----
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchBtn.textContent = 'Recherche en cours…';
      setTimeout(() => { searchBtn.textContent = 'Rechercher'; }, 700);
    });
  }

  // ----- Filtres : reset -----
  const resetBtn = document.querySelector('.filters .btn--outline');
  if (resetBtn && resetBtn.textContent.trim() === 'Réinitialiser') {
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('.filters input[type="checkbox"]').forEach(c => c.checked = false);
      document.querySelectorAll('.filters input[type="range"]').forEach(r => r.value = 40);
      const firstRadio = document.querySelector('.filters input[type="radio"]');
      if (firstRadio) firstRadio.checked = true;
    });
  }

  // ----- Favoris (avec persistance localStorage) -----
  const FAV_KEY = 'mobss_favorites_v1';
  let favorites = [];
  try { favorites = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { favorites = []; }

  document.querySelectorAll('.space-card__fav').forEach((btn, i) => {
    const id = btn.dataset.spaceId || ('fav-' + i);
    btn.dataset.spaceId = id;
    btn.setAttribute('aria-pressed', favorites.includes(id) ? 'true' : 'false');
    if (favorites.includes(id)) {
      btn.classList.add('is-fav');
      btn.querySelector('svg')?.setAttribute('fill', 'currentColor');
      btn.style.color = '#B0414B';
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isFav = btn.classList.toggle('is-fav');
      btn.setAttribute('aria-pressed', String(isFav));
      const svg = btn.querySelector('svg');
      if (isFav) {
        svg?.setAttribute('fill', 'currentColor');
        btn.style.color = '#B0414B';
        if (!favorites.includes(id)) favorites.push(id);
      } else {
        svg?.setAttribute('fill', 'none');
        btn.style.color = '';
        favorites = favorites.filter(x => x !== id);
      }
      try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch (e) {}
    });
  });

  // ----- Calendar : navigable au clavier + ARIA -----
  const calDays = document.querySelectorAll('.cal__day:not(.is-empty)');
  calDays.forEach((d, i) => {
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    if (d.classList.contains('has-event')) {
      d.setAttribute('aria-label', 'Le ' + d.textContent.trim() + ' mai, journée avec réservation');
    } else {
      d.setAttribute('aria-label', 'Le ' + d.textContent.trim() + ' mai');
    }
    function select() {
      document.querySelectorAll('.cal__day').forEach(x => x.classList.remove('is-selected'));
      d.classList.add('is-selected');
    }
    d.addEventListener('click', select);
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select();
      } else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const offset = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        const next = calDays[i + offset];
        if (next) next.focus();
      }
    });
  });

  // ----- Form submit demo -----
  document.querySelectorAll('form[data-demo="true"]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        const original = submitBtn.textContent;
        submitBtn.textContent = '✓ Envoyé !';
        submitBtn.disabled = true;
        submitBtn.style.background = 'var(--color-success)';
        submitBtn.style.color = '#fff';
        setTimeout(() => {
          submitBtn.textContent = original;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
        }, 2200);
      }
    });
  });

  // ----- Connexion : login simulé sécurisé (jamais en GET) -----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // En vrai backend : POST vers /api/login, cookie HTTPOnly, jamais en URL
      const emailInput = loginForm.querySelector('input[type="email"]');
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (!emailInput.value) return;
      submitBtn.textContent = 'Connexion…';
      submitBtn.disabled = true;
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    });
  }

  // ----- Bandeau cookies RGPD -----
  const COOKIE_KEY = 'mobss_cookies_consent_v1';
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    let consent = null;
    try { consent = localStorage.getItem(COOKIE_KEY); } catch (e) {}
    if (!consent) {
      banner.hidden = false;
    }
    banner.querySelectorAll('[data-cookie-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.cookieAction;
        try { localStorage.setItem(COOKIE_KEY, action); } catch (e) {}
        banner.hidden = true;
      });
    });
  }

})();
