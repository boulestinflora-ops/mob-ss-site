/**
 * explorez.ts — Logique complète de la page /explorez
 *
 * Séparé d'explorez.astro pour réduire la dette technique (monolith → module).
 * Exports : initExplorez()
 *
 * Sections :
 *   1. Données géographiques (DEPTS_BY_REGION, CITY_COORDS)
 *   2. Fonctions pures (haversine, esc, mapSpace, buildSpaceCard)
 *   3. initExplorez() — wiring DOM, filtres, chargement Supabase
 */

import { supabase } from './supabase';

// ══════════════════════════════════════════════════════════════════════════════
//  Départements par région
// ══════════════════════════════════════════════════════════════════════════════
const DEPTS_BY_REGION: Record<string, {num:string; name:string}[]> = {
  "Auvergne-Rhône-Alpes": [
    {num:"01",name:"Ain"},{num:"03",name:"Allier"},{num:"07",name:"Ardèche"},
    {num:"15",name:"Cantal"},{num:"26",name:"Drôme"},{num:"38",name:"Isère"},
    {num:"42",name:"Loire"},{num:"43",name:"Haute-Loire"},{num:"63",name:"Puy-de-Dôme"},
    {num:"69",name:"Rhône"},{num:"73",name:"Savoie"},{num:"74",name:"Haute-Savoie"},
  ],
  "Bourgogne-Franche-Comté": [
    {num:"21",name:"Côte-d'Or"},{num:"25",name:"Doubs"},{num:"39",name:"Jura"},
    {num:"58",name:"Nièvre"},{num:"70",name:"Haute-Saône"},{num:"71",name:"Saône-et-Loire"},
    {num:"89",name:"Yonne"},{num:"90",name:"Territoire de Belfort"},
  ],
  "Bretagne": [
    {num:"22",name:"Côtes-d'Armor"},{num:"29",name:"Finistère"},
    {num:"35",name:"Ille-et-Vilaine"},{num:"56",name:"Morbihan"},
  ],
  "Centre-Val de Loire": [
    {num:"18",name:"Cher"},{num:"28",name:"Eure-et-Loir"},{num:"36",name:"Indre"},
    {num:"37",name:"Indre-et-Loire"},{num:"41",name:"Loir-et-Cher"},{num:"45",name:"Loiret"},
  ],
  "Corse": [{num:"2A",name:"Corse-du-Sud"},{num:"2B",name:"Haute-Corse"}],
  "Grand Est": [
    {num:"08",name:"Ardennes"},{num:"10",name:"Aube"},{num:"51",name:"Marne"},
    {num:"52",name:"Haute-Marne"},{num:"54",name:"Meurthe-et-Moselle"},
    {num:"55",name:"Meuse"},{num:"57",name:"Moselle"},
    {num:"67",name:"Bas-Rhin"},{num:"68",name:"Haut-Rhin"},{num:"88",name:"Vosges"},
  ],
  "Guadeloupe":  [{num:"971",name:"Guadeloupe"}],
  "Guyane":      [{num:"973",name:"Guyane"}],
  "Hauts-de-France": [
    {num:"02",name:"Aisne"},{num:"59",name:"Nord"},{num:"60",name:"Oise"},
    {num:"62",name:"Pas-de-Calais"},{num:"80",name:"Somme"},
  ],
  "Île-de-France": [
    {num:"75",name:"Paris"},{num:"77",name:"Seine-et-Marne"},
    {num:"78",name:"Yvelines"},{num:"91",name:"Essonne"},
    {num:"92",name:"Hauts-de-Seine"},{num:"93",name:"Seine-Saint-Denis"},
    {num:"94",name:"Val-de-Marne"},{num:"95",name:"Val-d'Oise"},
  ],
  "La Réunion":  [{num:"974",name:"La Réunion"}],
  "Martinique":  [{num:"972",name:"Martinique"}],
  "Mayotte":     [{num:"976",name:"Mayotte"}],
  "Normandie": [
    {num:"14",name:"Calvados"},{num:"27",name:"Eure"},
    {num:"50",name:"Manche"},{num:"61",name:"Orne"},{num:"76",name:"Seine-Maritime"},
  ],
  "Nouvelle-Aquitaine": [
    {num:"16",name:"Charente"},{num:"17",name:"Charente-Maritime"},{num:"19",name:"Corrèze"},
    {num:"23",name:"Creuse"},{num:"24",name:"Dordogne"},{num:"33",name:"Gironde"},
    {num:"40",name:"Landes"},{num:"47",name:"Lot-et-Garonne"},{num:"64",name:"Pyrénées-Atlantiques"},
    {num:"79",name:"Deux-Sèvres"},{num:"86",name:"Vienne"},{num:"87",name:"Haute-Vienne"},
  ],
  "Occitanie": [
    {num:"09",name:"Ariège"},{num:"11",name:"Aude"},{num:"12",name:"Aveyron"},
    {num:"30",name:"Gard"},{num:"31",name:"Haute-Garonne"},{num:"32",name:"Gers"},
    {num:"34",name:"Hérault"},{num:"46",name:"Lot"},{num:"48",name:"Lozère"},
    {num:"65",name:"Hautes-Pyrénées"},{num:"66",name:"Pyrénées-Orientales"},
    {num:"81",name:"Tarn"},{num:"82",name:"Tarn-et-Garonne"},
  ],
  "Pays de la Loire": [
    {num:"44",name:"Loire-Atlantique"},{num:"49",name:"Maine-et-Loire"},
    {num:"53",name:"Mayenne"},{num:"72",name:"Sarthe"},{num:"85",name:"Vendée"},
  ],
  "Provence-Alpes-Côte d'Azur": [
    {num:"04",name:"Alpes-de-Haute-Provence"},{num:"05",name:"Hautes-Alpes"},
    {num:"06",name:"Alpes-Maritimes"},{num:"13",name:"Bouches-du-Rhône"},
    {num:"83",name:"Var"},{num:"84",name:"Vaucluse"},
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
//  Lookup coordonnées pour les villes de référence (démo)
// ══════════════════════════════════════════════════════════════════════════════
const CITY_COORDS: Record<string, {lat:number; lng:number}> = {
  "caen":          {lat:49.1829, lng:0.3707},  "rouen":         {lat:49.4432, lng:1.0993},
  "cherbourg":     {lat:49.6333, lng:-1.6167}, "le havre":      {lat:49.4944, lng:0.1079},
  "bayeux":        {lat:49.2744, lng:-0.7046}, "évreux":        {lat:49.0242, lng:1.1514},
  "evreux":        {lat:49.0242, lng:1.1514},  "alençon":       {lat:48.4306, lng:0.0925},
  "alencon":       {lat:48.4306, lng:0.0925},  "dieppe":        {lat:49.9232, lng:1.0806},
  "paris":         {lat:48.8566, lng:2.3522},  "lyon":          {lat:45.7640, lng:4.8357},
  "marseille":     {lat:43.2965, lng:5.3698},  "toulouse":      {lat:43.6047, lng:1.4442},
  "nice":          {lat:43.7102, lng:7.2620},  "nantes":        {lat:47.2184, lng:-1.5536},
  "bordeaux":      {lat:44.8378, lng:-0.5792}, "strasbourg":    {lat:48.5734, lng:7.7521},
  "lille":         {lat:50.6292, lng:3.0573},  "rennes":        {lat:48.1173, lng:-1.6778},
  "montpellier":   {lat:43.6108, lng:3.8767},  "grenoble":      {lat:45.1885, lng:5.7245},
};

// ══════════════════════════════════════════════════════════════════════════════
//  Haversine — distance en km entre deux points GPS
// ══════════════════════════════════════════════════════════════════════════════
function haversine(lat1:number, lng1:number, lat2:number, lng2:number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ══════════════════════════════════════════════════════════════════════════════
//  Mapping DB → format interne
// ══════════════════════════════════════════════════════════════════════════════
function esc(str: string): string {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function mapSpace(row: any) {
  return {
    id:          row.id,
    title:       row.titre || 'Espace disponible',
    city:        row.ville || '',
    department:  row.departement || '',
    region:      row.region || '',
    type:        row.type_espace || '',
    host:        row.profiles?.role || 'collectivite',
    tags:        Array.isArray(row.equipements)       ? row.equipements       : [],
    jours:       Array.isArray(row.jours_disponibles) ? row.jours_disponibles : [],
    superficie:  row.superficie  || 0,
    capacite:    row.capacite    || 0,
    tarif_type:  row.tarif_type  || 'gratuit',
    lat:         row.lat || 0,
    lng:         row.lng || 0,
    photos:      Array.isArray(row.photos) ? row.photos : [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  Construction d'une carte HTML (reproduit SpaceCard.astro côté client)
// ══════════════════════════════════════════════════════════════════════════════
const GRADIENTS    = ['from-cream','from-pink','from-green','from-blue','from-yellow','from-teal','from-rose','from-orange'];
const GRADIENT_CSS: Record<string,string> = {
  'from-cream':  'linear-gradient(135deg,var(--color-cream) 0%,#E8C99A 100%)',
  'from-pink':   'linear-gradient(135deg,#E8C0B5,#D88E80)',
  'from-green':  'linear-gradient(135deg,#C8D6C5,#9DB59A)',
  'from-blue':   'linear-gradient(135deg,#D8DDF0,#A5B0DC)',
  'from-yellow': 'linear-gradient(135deg,#F0E0BE,#D8B968)',
  'from-teal':   'linear-gradient(135deg,#D9E6E2,#7FAA9F)',
  'from-rose':   'linear-gradient(135deg,#EAD4DA,#C786A0)',
  'from-orange': 'linear-gradient(135deg,#F0DCC8,#C99876)',
};
const TYPE_ICONS: Record<string,string> = {
  'Salle communale':    '🏛️',
  'Cabinet paramédical':'🩺',
  'Studio bien-être':   '🧘',
  'Salle de sport':     '🏋️',
  'Espace entreprise':  '🏢',
  'Espace extérieur':   '🌳',
};

function buildSpaceCard(space: any): string {
  let h = 0;
  for (let i = 0; i < space.id.length; i++) h = space.id.charCodeAt(i) + ((h << 5) - h);
  const gradient = GRADIENTS[Math.abs(h) % GRADIENTS.length];
  const bgStyle  = GRADIENT_CSS[gradient];
  const icon     = TYPE_ICONS[space.type] || '🏠';
  const photo    = space.photos?.[0] || '';
  const tagsHTML = (space.tags as string[]).slice(0,4).map(t => `<span class="tag">${esc(t)}</span>`).join('');

  return `
    <article class="space-card">
      <div class="space-card__media" style="${photo ? '' : `background:${bgStyle};`}">
        ${photo
          ? `<img src="${esc(photo)}" alt="${esc(space.title)}" width="400" height="220" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />`
          : `<span aria-hidden="true" style="font-size:3rem;">${icon}</span>`}
        <span class="space-card__badge">${esc(space.type)}</span>
        <button class="space-card__fav" aria-label="Ajouter aux favoris" data-space-id="${esc(space.id)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="space-card__body">
        <p class="space-card__loc">${esc(space.city)} · ${esc(space.department)}</p>
        <h3>${esc(space.title)}</h3>
        <div class="space-card__meta">${tagsHTML}</div>
        <div class="space-card__footer">
          <span class="badge--gratuit">🤝 Mise à disposition gracieuse</span>
          <a href="/annonce/${esc(space.id)}" class="btn btn--ghost">Voir →</a>
        </div>
      </div>
    </article>`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Initialisation — appelée depuis explorez.astro (<script>)
// ══════════════════════════════════════════════════════════════════════════════
export function initExplorez(): void {
  // ══════════════════════════════════════════════════════════════════════════════
  //  Éléments DOM
  // ══════════════════════════════════════════════════════════════════════════════
  const grid          = document.getElementById('listing-grid')        as HTMLElement;
  const loadingEl     = document.getElementById('spaces-loading')      as HTMLElement;
  const noResults     = document.getElementById('no-results')          as HTMLElement;
  const resultsCount  = document.getElementById('results-count')       as HTMLElement;
  const filterSummary = document.getElementById('filters-summary')     as HTMLElement;
  const activeBadge   = document.getElementById('filters-active-count')as HTMLElement;

  let allSpaces: ReturnType<typeof mapSpace>[] = [];

  // ── Restaurer depuis sessionStorage ─────────────────────────────────────────
  const locInput   = document.getElementById('filter-loc')  as HTMLInputElement;
  const typeSelect = document.getElementById('filter-type') as HTMLSelectElement;
  const storedLoc  = sessionStorage.getItem('search_loc') || sessionStorage.getItem('search_metier') || '';
  if (storedLoc && locInput) locInput.value = storedLoc;

  // ── Toggle tiroir filtres ────────────────────────────────────────────────────
  const toggleBtn   = document.getElementById('filters-toggle') as HTMLButtonElement;
  const filtersBody = document.getElementById('filters-bar-body') as HTMLElement;
  toggleBtn?.addEventListener('click', () => {
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    filtersBody.classList.toggle('filters-bar-body--closed', isOpen);
    (toggleBtn.querySelector('.filters-toggle__chevron') as SVGElement).style.transform = isOpen ? '' : 'rotate(180deg)';
  });

  // ── Cascade Région → Département ────────────────────────────────────────────
  const regionSelect = document.getElementById('filter-region-h') as HTMLSelectElement;
  const deptSelect   = document.getElementById('filter-dept-h')   as HTMLSelectElement;

  function updateDepts() {
    const region = regionSelect.value;
    deptSelect.innerHTML = '<option value="">Tous les départements</option>';
    if (region && DEPTS_BY_REGION[region]) {
      DEPTS_BY_REGION[region].forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.num; opt.textContent = `${d.num} – ${d.name}`;
        deptSelect.appendChild(opt);
      });
      deptSelect.disabled = false;
    } else {
      deptSelect.disabled = true;
    }
    applyFilters();
  }
  regionSelect.addEventListener('change', updateDepts);
  deptSelect.disabled = true;

  // ── Slider de distance ───────────────────────────────────────────────────────
  const refCityInput  = document.getElementById('filter-ref-city')   as HTMLInputElement;
  const distSlider    = document.getElementById('filter-distance')    as HTMLInputElement;
  const distVal       = document.getElementById('filter-distance-val') as HTMLElement;
  const distHint      = document.getElementById('distance-hint')      as HTMLElement;
  let refCoords: {lat:number; lng:number} | null = null;

  // Pré-remplir depuis le profil local (stocké après connexion)
  const profileCity = localStorage.getItem('mobss_profile_city') || '';
  if (profileCity) { refCityInput.value = profileCity; resolveRefCity(); }

  function resolveRefCity() {
    const key = refCityInput.value.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g,'');
    // Essai direct
    let found = CITY_COORDS[key] || CITY_COORDS[refCityInput.value.toLowerCase().trim()];
    // Essai partiel
    if (!found) {
      const match = Object.keys(CITY_COORDS).find(k => k.includes(key) || key.includes(k));
      if (match) found = CITY_COORDS[match];
    }
    if (found) {
      refCoords = found;
      distSlider.disabled = false;
      distHint.textContent = `📍 ${refCityInput.value} — rayon actif`;
      distHint.style.color = 'var(--color-primary)';
    } else {
      refCoords = null;
      distSlider.disabled = true;
      distHint.textContent = refCityInput.value ? '⚠️ Ville non reconnue. Essayez une grande ville.' : 'Entrez une ville pour activer le filtre par distance.';
      distHint.style.color = refCityInput.value ? '#B45309' : 'var(--color-text-soft)';
    }
    applyFilters();
  }

  refCityInput.addEventListener('change', resolveRefCity);
  refCityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') resolveRefCity(); });
  distSlider.addEventListener('input', () => {
    distVal.textContent = distSlider.value + ' km';
    applyFilters();
  });

  // ── Lecture des filtres actifs ───────────────────────────────────────────────
  function getActiveFilters() {
    const supRadio = document.querySelector('.filter-sup:checked') as HTMLInputElement | null;
    return {
      loc:       locInput?.value.toLowerCase().trim() || '',
      type:      typeSelect?.value || '',
      region:    regionSelect.value,
      dept:      deptSelect.value,
      host:      (document.getElementById('filter-host-h')  as HTMLSelectElement).value,
      tarif:     (document.getElementById('filter-tarif')   as HTMLSelectElement).value,
      capacite:  parseInt((document.getElementById('filter-capacite') as HTMLSelectElement).value || '0') || 0,
      superficie: supRadio?.value || '',
      distance:  refCoords ? parseInt(distSlider.value) : 0,
      equip:     Array.from(document.querySelectorAll('.filter-equip:checked')).map((cb:any) => cb.value as string),
      jours:     Array.from(document.querySelectorAll('.filter-jour:checked')).map((cb:any) => cb.value as string),
    };
  }

  // ── Application des filtres (data-driven : re-render la grille) ──────────────
  function applyFilters() {
    const f    = getActiveFilters();
    const sort = (document.getElementById('sort-select') as HTMLSelectElement).value;

    let filtered = allSpaces.filter(space => {
      const matchLoc = !f.loc ||
        space.city.toLowerCase().includes(f.loc) ||
        space.region.toLowerCase().includes(f.loc) ||
        space.department.includes(f.loc);
      const matchType     = !f.type   || space.type      === f.type;
      const matchRegion   = !f.region || space.region    === f.region;
      const matchDept     = !f.dept   || space.department === f.dept;
      const matchHost     = !f.host   || space.host      === f.host;
      const matchTarif    = !f.tarif  || space.tarif_type === f.tarif;
      const matchCapacite = !f.capacite ||
        (f.capacite === 1   && space.capacite <= 2)  ||
        (f.capacite === 5   && space.capacite <= 5)  ||
        (f.capacite === 10  && space.capacite <= 10) ||
        (f.capacite === 20  && space.capacite <= 20) ||
        (f.capacite === 999 && space.capacite > 20);

      let matchSup = true;
      if      (f.superficie === '25')  matchSup = space.superficie < 25;
      else if (f.superficie === '50')  matchSup = space.superficie >= 25  && space.superficie < 50;
      else if (f.superficie === '100') matchSup = space.superficie >= 50  && space.superficie < 100;
      else if (f.superficie === '999') matchSup = space.superficie >= 100;

      let matchDist = true;
      if (refCoords && f.distance > 0) {
        const km = haversine(refCoords.lat, refCoords.lng, space.lat, space.lng);
        (space as any)._dist = Math.round(km);
        matchDist = km <= f.distance;
      } else {
        (space as any)._dist = null;
      }

      const matchEquip = f.equip.length === 0 ||
        f.equip.every(eq => space.tags.some(tag => tag.toLowerCase().includes(eq.toLowerCase())));
      const matchJours = f.jours.length === 0 ||
        f.jours.some(j => space.jours.includes(j));

      return matchLoc && matchType && matchRegion && matchDept &&
             matchHost && matchTarif && matchCapacite && matchSup &&
             matchDist && matchEquip && matchJours;
    });

    // ── Tri ───────────────────────────────────────────────────────────────────
    if (sort !== 'pertinence') {
      filtered = [...filtered].sort((a, b) => {
        if (sort === 'distance')        return ((a as any)._dist ?? 999) - ((b as any)._dist ?? 999);
        if (sort === 'superficie-desc') return b.superficie - a.superficie;
        if (sort === 'superficie-asc')  return a.superficie - b.superficie;
        if (sort === 'gratuit')         return a.tarif_type === 'gratuit' ? -1 : 1;
        if (sort === 'host-collec')     return a.host === 'collectivite' ? -1 : 1;
        if (sort === 'host-entrep')     return a.host === 'entreprise'   ? -1 : 1;
        return 0;
      });
    }

    // ── Re-render la grille ───────────────────────────────────────────────────
    const visible = filtered.length;
    grid.innerHTML = filtered.map(buildSpaceCard).join('');

    if (resultsCount) resultsCount.textContent = `${visible} espace${visible !== 1 ? 's' : ''}`;
    if (noResults)    noResults.style.display  = visible === 0 ? 'block' : 'none';
    if (grid)         grid.style.display       = visible === 0 ? 'none'  : '';

    // Badge filtres actifs
    const activeCount = countActiveFilters(f);
    if (activeBadge) {
      activeBadge.textContent = String(activeCount);
      activeBadge.style.display = activeCount > 0 ? 'inline-flex' : 'none';
    }

    // Résumé textuel
    const parts: string[] = [];
    if (f.region)        parts.push(f.region);
    if (f.dept)          parts.push(`Dép. ${f.dept}`);
    if (f.tarif)         parts.push(f.tarif === 'gratuit' ? 'Gratuit' : 'Payant');
    if (f.distance)      parts.push(`≤ ${f.distance} km`);
    if (f.equip.length)  parts.push(`${f.equip.length} équipement${f.equip.length > 1 ? 's' : ''}`);
    if (f.jours.length)  parts.push(`${f.jours.length} jour${f.jours.length > 1 ? 's' : ''}`);
    if (filterSummary)   filterSummary.textContent = parts.length ? parts.join(' · ') : '';
  }

  function countActiveFilters(f: ReturnType<typeof getActiveFilters>): number {
    let n = 0;
    if (f.region) n++;
    if (f.dept) n++;
    if (f.host) n++;
    if (f.tarif) n++;
    if (f.capacite) n++;
    if (f.superficie) n++;
    if (f.distance) n++;
    n += f.equip.length;
    n += f.jours.length;
    return n;
  }

  // ── Listeners ────────────────────────────────────────────────────────────────
  ['filter-loc','filter-type','filter-host-h','filter-tarif','filter-capacite'].forEach(id => {
    document.getElementById(id)?.addEventListener('input',  applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  document.querySelectorAll('.filter-equip,.filter-jour,.filter-sup').forEach(el => {
    el.addEventListener('change', applyFilters);
  });
  document.getElementById('sort-select')?.addEventListener('change', applyFilters);
  document.getElementById('search-btn')?.addEventListener('click', applyFilters);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  document.getElementById('empty-reset-filters')?.addEventListener('click', () => {
    document.getElementById('reset-filters')?.click();
  });

  document.getElementById('reset-filters')?.addEventListener('click', () => {
    locInput.value = '';
    typeSelect.value = '';
    regionSelect.value = ''; updateDepts();
    (document.getElementById('filter-host-h')  as HTMLSelectElement).value = '';
    (document.getElementById('filter-tarif')   as HTMLSelectElement).value = '';
    (document.getElementById('filter-capacite')as HTMLSelectElement).value = '';
    refCityInput.value = ''; refCoords = null;
    distSlider.value = '50'; distVal.textContent = '50 km'; distSlider.disabled = true;
    distHint.textContent = 'Entrez une ville pour activer le filtre par distance.';
    distHint.style.color = 'var(--color-text-soft)';
    document.querySelectorAll('.filter-equip,.filter-jour').forEach((cb:any) => { cb.checked = false; });
    (document.querySelector('.filter-sup[value=""]') as HTMLInputElement).checked = true;
    applyFilters();
  });

  // ── Pré-remplissage depuis query params ──────────────────────────────────────
  const params  = new URLSearchParams(window.location.search);
  const qLoc    = params.get('loc')?.trim()    || '';
  const qMetier = params.get('metier')?.trim() || '';
  const qType   = params.get('type')?.trim()   || '';
  if (qLoc    && locInput)        locInput.value  = qLoc;
  if (qMetier && !qLoc && locInput) locInput.value = qMetier;
  if (qType   && typeSelect) {
    const match = Array.from(typeSelect.options).find(o =>
      o.value.toLowerCase().includes(qType.toLowerCase()) ||
      o.text.toLowerCase().includes(qType.toLowerCase()));
    if (match) typeSelect.value = match.value;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  Chargement depuis Supabase (paginé — PAGE_SIZE résultats par page)
  // ══════════════════════════════════════════════════════════════════════════════
  const PAGE_SIZE = 50;
  let _spacesOffset = 0;
  let _spacesTotal  = 0;
  let _spacesController: AbortController | null = null;

  const loadMoreWrap = document.getElementById('load-more-wrap') as HTMLElement;
  const loadMoreBtn  = document.getElementById('load-more-spaces') as HTMLButtonElement;

  function updateLoadMoreBtn() {
    if (!loadMoreWrap) return;
    loadMoreWrap.style.display = _spacesOffset < _spacesTotal ? 'block' : 'none';
  }

  async function loadSpaces(append = false) {
    _spacesController?.abort();
    _spacesController = new AbortController();
    const { signal } = _spacesController;

    const emptyEl = document.getElementById('empty-state') as HTMLElement;
    const errorEl = document.getElementById('error-state') as HTMLElement;

    if (!append) {
      _spacesOffset = 0;
      allSpaces = [];
      loadingEl.style.display = 'block';
      grid.style.display      = 'none';
      noResults.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    } else {
      if (loadMoreBtn) { loadMoreBtn.disabled = true; loadMoreBtn.textContent = 'Chargement…'; }
    }

    try {
      const { data, error, count } = await supabase
        .from('annonces')
        .select(`
          id, titre, type_espace, ville, region, departement,
          superficie, capacite, tarif_type, equipements,
          jours_disponibles, lat, lng, photos,
          profiles:user_id ( role )
        `, { count: append ? undefined : 'exact' })
        .eq('status', 'publie')
        .order('created_at', { ascending: false })
        .range(_spacesOffset, _spacesOffset + PAGE_SIZE - 1)
        .abortSignal(signal);

      if (signal.aborted) return;
      if (error) throw error;

      if (!append && count !== null) _spacesTotal = count ?? 0;
      _spacesOffset += (data?.length ?? 0);

      const newSpaces = (data || []).map(mapSpace);
      allSpaces = append ? [...allSpaces, ...newSpaces] : newSpaces;

      if (!append && allSpaces.length === 0) {
        loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
        updateLoadMoreBtn();
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('Erreur chargement espaces :', e);
      loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'block';
      return;
    } finally {
      if (loadMoreBtn) { loadMoreBtn.disabled = false; loadMoreBtn.textContent = 'Charger plus d\'espaces'; }
    }

    loadingEl.style.display = 'none';
    applyFilters();
    updateLoadMoreBtn();
  }

  loadMoreBtn?.addEventListener('click', () => loadSpaces(true));

  (window as any).loadSpaces = loadSpaces;
  loadSpaces();
}
