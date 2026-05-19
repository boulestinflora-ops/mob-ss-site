/**
 * MOB'SS — Système de visite guidée interactive
 * Usage : window.startTour(steps, storageKey)
 * Chaque step : { target, title, content, emoji, position }
 */
(function () {
  let steps = [];
  let current = 0;
  let storageKey = '';

  let elOverlay, elHighlight, elTooltip;

  /* ── Création du DOM du tour ───────────────────────────────────────────── */
  function buildDOM() {
    if (document.getElementById('tour-overlay')) return;

    elOverlay = document.createElement('div');
    elOverlay.id = 'tour-overlay';
    elOverlay.setAttribute('aria-hidden', 'true');

    elHighlight = document.createElement('div');
    elHighlight.id = 'tour-highlight';

    elTooltip = document.createElement('div');
    elTooltip.id = 'tour-tooltip';
    elTooltip.setAttribute('role', 'dialog');
    elTooltip.setAttribute('aria-modal', 'true');
    elTooltip.setAttribute('aria-label', 'Visite guidée');

    document.body.append(elOverlay, elHighlight, elTooltip);

    elOverlay.addEventListener('click', closeTour);
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') closeTour();
    if (e.key === 'ArrowRight') nextStep();
    if (e.key === 'ArrowLeft') prevStep();
  }

  /* ── Rendu d'une étape ─────────────────────────────────────────────────── */
  function showStep(index) {
    const step = steps[index];
    if (!step) return;
    current = index;

    const target = step.target ? document.querySelector(step.target) : null;

    // Scroll vers l'élément cible
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Légère pause pour laisser le scroll se terminer
    setTimeout(() => {
      positionHighlight(target);
      renderTooltip(step, index, target);
      elTooltip.classList.add('tour-tooltip--in');
    }, target ? 350 : 0);
  }

  function positionHighlight(target) {
    if (!target) {
      elHighlight.style.opacity = '0';
      return;
    }
    const r = target.getBoundingClientRect();
    const pad = 10;
    elHighlight.style.cssText = `
      top:${r.top + window.scrollY - pad}px;
      left:${r.left + window.scrollX - pad}px;
      width:${r.width + pad * 2}px;
      height:${r.height + pad * 2}px;
      opacity:1;
    `;
  }

  function renderTooltip(step, index, target) {
    const isLast = index === steps.length - 1;
    const isFirst = index === 0;

    // Calcul position tooltip
    let pos = step.position || 'bottom';
    let style = '';

    if (target) {
      const r = target.getBoundingClientRect();
      const ttW = 340;
      const margin = 20;
      let top, left;

      if (pos === 'bottom') {
        top = r.bottom + window.scrollY + margin;
        left = r.left + window.scrollX + r.width / 2 - ttW / 2;
      } else if (pos === 'top') {
        top = r.top + window.scrollY - margin - 220;
        left = r.left + window.scrollX + r.width / 2 - ttW / 2;
      } else if (pos === 'left') {
        top = r.top + window.scrollY + r.height / 2 - 110;
        left = r.left + window.scrollX - ttW - margin;
      } else if (pos === 'right') {
        top = r.top + window.scrollY + r.height / 2 - 110;
        left = r.right + window.scrollX + margin;
      }

      // Contraindre dans le viewport
      const vw = window.innerWidth;
      left = Math.max(margin, Math.min(left, vw - ttW - margin));
      top = Math.max(window.scrollY + margin, top);
      style = `top:${top}px;left:${left}px;width:${ttW}px;`;
    } else {
      // Centré dans le viewport (position:fixed pour ignorer le scroll)
      style = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:360px;`;
    }

    const dots = steps
      .map((_, i) => `<span class="tour-dot${i === index ? ' tour-dot--on' : ''}"></span>`)
      .join('');

    elTooltip.className = 'tour-tooltip--in';
    elTooltip.setAttribute('style', style);
    elTooltip.innerHTML = `
      <div class="tour-tt__header">
        <span class="tour-tt__emoji">${step.emoji || '👋'}</span>
        <span class="tour-tt__counter">${index + 1} / ${steps.length}</span>
        <button class="tour-tt__close" onclick="window._tourClose()" aria-label="Fermer">✕</button>
      </div>
      <h3 class="tour-tt__title">${step.title}</h3>
      <p class="tour-tt__body">${step.content}</p>
      <div class="tour-tt__footer">
        <div class="tour-tt__dots">${dots}</div>
        <div class="tour-tt__nav">
          ${!isFirst ? `<button class="tour-btn tour-btn--ghost" onclick="window._tourPrev()">← Préc.</button>` : ''}
          <button class="tour-btn tour-btn--primary" onclick="${isLast ? 'window._tourClose()' : 'window._tourNext()'}">
            ${isLast ? '🎉 Terminer !' : 'Suivant →'}
          </button>
        </div>
      </div>
    `;
  }

  /* ── Navigation ────────────────────────────────────────────────────────── */
  function nextStep() {
    if (current < steps.length - 1) {
      elTooltip.classList.remove('tour-tooltip--in');
      setTimeout(() => showStep(current + 1), 180);
    }
  }

  function prevStep() {
    if (current > 0) {
      elTooltip.classList.remove('tour-tooltip--in');
      setTimeout(() => showStep(current - 1), 180);
    }
  }

  function closeTour() {
    elOverlay && elOverlay.classList.remove('tour-on');
    elHighlight && (elHighlight.style.opacity = '0');
    elTooltip && elTooltip.classList.remove('tour-tooltip--in');
    document.body.classList.remove('tour-active');
    document.removeEventListener('keydown', onKey);
    if (storageKey) localStorage.setItem(storageKey, 'done');
  }

  /* ── API publique ──────────────────────────────────────────────────────── */
  window.startTour = function (tourSteps, key) {
    steps = tourSteps;
    storageKey = key || '';
    current = 0;

    buildDOM();
    elOverlay = document.getElementById('tour-overlay');
    elHighlight = document.getElementById('tour-highlight');
    elTooltip = document.getElementById('tour-tooltip');

    document.body.classList.add('tour-active');
    elOverlay.classList.add('tour-on');
    elHighlight.style.opacity = '0';

    showStep(0);
  };

  window._tourNext  = nextStep;
  window._tourPrev  = prevStep;
  window._tourClose = closeTour;
})();
