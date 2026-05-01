/* ============================================================
   ARCADIA — main.js
   Connexion à l'API Burstflow
   ============================================================ */

const RESTAURANT_SLUG = 'arcadia';
const BURSTFLOW_API   = 'https://www.burstflow.fr/api/public/restaurant/' + RESTAURANT_SLUG;
const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// ─────────────────────────────────────────
// HORAIRES
// ─────────────────────────────────────────
function formatHoraire(schedule) {
  if (!schedule || schedule.open === false) return 'Fermé';
  const parts = [];
  if (schedule.lunch)  parts.push(schedule.lunch.start  + ' – ' + schedule.lunch.end);
  if (schedule.dinner) parts.push(schedule.dinner.start + ' – ' + schedule.dinner.end);
  return parts.length ? parts.join(' · ') : 'Ouvert';
}

async function loadRestaurantData() {
  try {
    const res = await fetch(BURSTFLOW_API);
    if (!res.ok) return;
    const data = await res.json();

    document.querySelectorAll('[data-bf="nom"]').forEach(el => el.textContent = data.nom || 'Arcadia');
    document.querySelectorAll('[data-bf="adresse"]').forEach(el => el.textContent = data.adresse || '');
    document.querySelectorAll('[data-bf="telephone"]').forEach(el => {
      el.textContent = data.telephone || '';
      if (el.tagName === 'A') el.href = 'tel:' + (data.telephone || '').replace(/\s/g, '');
    });
    document.querySelectorAll('[data-bf="email"]').forEach(el => {
      el.textContent = data.email || '';
      if (el.tagName === 'A') el.href = 'mailto:' + (data.email || '');
    });

    if (data.horaires) {
      _horaires = data.horaires;
      // Met à jour les heures dispo si le formulaire est déjà chargé
      const dateInput = document.getElementById('resa-date');
      if (dateInput && dateInput.value) updateHeures(dateInput.value);

      document.querySelectorAll('[data-bf="horaires"]').forEach(container => {
        container.innerHTML = '';
        [1, 2, 3, 4, 5, 6, 0].forEach(dayIndex => {
          const sched = data.horaires[String(dayIndex)];
          const h = formatHoraire(sched);
          const ferme = !sched || sched.open === false;
          const row = document.createElement('div');
          row.className = 'horaires-table-row';
          row.innerHTML = `<span class="jour">${JOURS[dayIndex]}</span><span class="heure${ferme ? ' ferme' : ''}">${h}</span>`;
          container.appendChild(row);
        });
      });
    }
  } catch(e) {}
}

// ─────────────────────────────────────────
// CARTE (menu page)
// ─────────────────────────────────────────
async function loadCarteData() {
  try {
    const res = await fetch(BURSTFLOW_API + '/carte');
    if (!res.ok) return;
    const { carte } = await res.json();
    if (!carte || carte.length === 0) return;

    const tabsContainer     = document.getElementById('bf-tabs');
    const sectionsContainer = document.getElementById('bf-sections');
    if (!tabsContainer || !sectionsContainer) return;

    tabsContainer.innerHTML = '';
    sectionsContainer.innerHTML = '';

    carte.forEach(function(cat, index) {
      const id = cat.nom.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Onglet
      const btn = document.createElement('button');
      btn.className = 'menu-tab' + (index === 0 ? ' active' : '');
      btn.textContent = cat.nom;
      btn.onclick = function() { showTab(id, btn); };
      tabsContainer.appendChild(btn);

      // Section
      const section = document.createElement('div');
      section.className = 'menu-content' + (index === 0 ? ' active' : '');
      section.id = id;

      if (!cat.articles || cat.articles.length === 0) {
        section.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--texte-doux);padding:48px 0;">Aucun plat disponible pour le moment.</div>';
      } else {
        section.innerHTML = cat.articles.map(function(a) {
          let badges = '';
          if (a.vegetarien) badges += '<span class="badge-vege">🌿 Végétarien</span>';
          if (a.vegan)      badges += '<span class="badge-vegan">🌱 Vegan</span>';
          if (a.allergenes) {
            a.allergenes.split(',').forEach(function(al) {
              badges += '<span class="badge-allergene">' + al.trim() + '</span>';
            });
          }
          return '<div class="menu-item reveal">' +
            '<div class="menu-item-header">' +
              '<span class="menu-item-name">' + a.nom + '</span>' +
              (a.prix ? '<span class="menu-item-price">' + a.prix + '€</span>' : '') +
            '</div>' +
            (a.description ? '<div class="menu-item-desc">' + a.description + '</div>' : '') +
            (badges ? '<div class="menu-item-badges">' + badges + '</div>' : '') +
          '</div>';
        }).join('');

        // Note enfants à la fin de chaque section
        section.innerHTML += '<div class="enfants-note"><strong>Pour les enfants</strong><br>Tous nos plats sont disponibles en portion réduite.</div>';
      }

      sectionsContainer.appendChild(section);
    });

    // Note philosophie
    sectionsContainer.innerHTML += '<div class="menu-note">Ici, tout est :<br>Source localement quand c\'est possible (sinon via distributeurs du coin) · Frais · Fait maison · De saison.</div>';

    observeReveal();
  } catch(e) {}
}

function showTab(id, btn) {
  document.querySelectorAll('.menu-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.menu-content').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  const section = document.getElementById(id);
  if (section) section.classList.add('active');
}

// ─────────────────────────────────────────
// FORMULAIRE RÉSERVATION
// ─────────────────────────────────────────
let _horaires = {};

function isJourOuvert(date) {
  if (!Object.keys(_horaires).length) return true;
  const jour = new Date(date + 'T12:00:00').getDay();
  const sched = _horaires[String(jour)];
  return sched && sched.open !== false;
}

function getHeuresDisponibles(date) {
  if (!Object.keys(_horaires).length) return null;
  const jour = new Date(date + 'T12:00:00').getDay();
  const sched = _horaires[String(jour)];
  if (!sched || sched.open === false) return [];

  const slots = [];
  function addSlot(slot) {
    if (!slot) return;
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur <= end) {
      const h = String(Math.floor(cur / 60)).padStart(2, '0');
      const m = String(cur % 60).padStart(2, '0');
      slots.push(h + ':' + m);
      cur += 30;
    }
  }
  addSlot(sched.lunch);
  addSlot(sched.dinner);
  return slots;
}

function updateHeures(date) {
  const select = document.getElementById('resa-heure');
  if (!select || !date) return;

  const heures = getHeuresDisponibles(date);
  if (!heures) return; // pas de config horaires, on laisse les options fixes

  const prev = select.value;
  select.innerHTML = '<option value="">Choisir…</option>';

  if (heures.length === 0) {
    select.innerHTML = '<option value="">Fermé ce jour</option>';
    return;
  }

  // Groupe déjeuner / dîner
  let lastGroup = '';
  heures.forEach(function(h) {
    const hh = parseInt(h.split(':')[0]);
    const group = hh < 16 ? 'Déjeuner' : 'Dîner';
    if (group !== lastGroup) {
      const og = document.createElement('optgroup');
      og.label = group;
      select.appendChild(og);
      lastGroup = group;
    }
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h.replace(':', 'h');
    if (h === prev) opt.selected = true;
    select.lastChild.appendChild(opt);
  });
}

function initReservationForm() {
  const form = document.getElementById('resa-form');
  if (!form) return;

  // Pré-rempli la date avec le prochain jour ouvert
  const dateInput = document.getElementById('resa-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];

    // Trouve le prochain jour ouvert
    let candidate = new Date(tomorrow);
    for (let i = 0; i < 14; i++) {
      const str = candidate.toISOString().split('T')[0];
      if (isJourOuvert(str)) { dateInput.value = str; break; }
      candidate.setDate(candidate.getDate() + 1);
    }

    dateInput.addEventListener('change', function() {
      const val = dateInput.value;
      if (!isJourOuvert(val)) {
        document.getElementById('resa-jour-ferme') && (document.getElementById('resa-jour-ferme').style.display = 'block');
      } else {
        document.getElementById('resa-jour-ferme') && (document.getElementById('resa-jour-ferme').style.display = 'none');
      }
      updateHeures(val);
    });

    updateHeures(dateInput.value);
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    const body = {
      nom:       document.getElementById('resa-nom').value,
      email:     document.getElementById('resa-email').value,
      telephone: document.getElementById('resa-tel').value,
      personnes: document.getElementById('resa-personnes').value,
      date:      document.getElementById('resa-date').value,
      heure:     document.getElementById('resa-heure').value,
      message:   document.getElementById('resa-message').value,
      slug:      RESTAURANT_SLUG,
    };

    try {
      const res = await fetch('https://www.burstflow.fr/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        form.style.display = 'none';
        document.getElementById('resa-success').classList.add('show');
      } else {
        alert(data.error || 'Une erreur est survenue, veuillez réessayer.');
        btn.disabled = false;
        btn.textContent = 'Envoyer ma demande';
      }
    } catch(err) {
      alert('Erreur de connexion, veuillez réessayer.');
      btn.disabled = false;
      btn.textContent = 'Envoyer ma demande';
    }
  });
}

// ─────────────────────────────────────────
// NAV SCROLL
// ─────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  function update() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
      nav.classList.remove('on-dark');
    } else {
      nav.classList.remove('scrolled');
      // Si la page commence par un hero sombre
      if (document.querySelector('.hero, .page-hero')) {
        nav.classList.add('on-dark');
      }
    }
  }
  window.addEventListener('scroll', update);
  update();
}

// ─────────────────────────────────────────
// REVEAL AU SCROLL
// ─────────────────────────────────────────
function observeReveal() {
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
}

// ─────────────────────────────────────────
// ÉVÉNEMENTS
// ─────────────────────────────────────────
async function loadEvenements() {
  const container = document.getElementById('bf-evenements');
  if (!container) return;

  try {
    const res = await fetch(BURSTFLOW_API);
    if (!res.ok) return;
    const data = await res.json();
    const events = data.events || [];

    if (events.length === 0) {
      container.innerHTML = '<p style="color:var(--texte-doux);font-size:14px;text-align:center;padding:40px 0;">Aucun événement à venir pour le moment.</p>';
      return;
    }

    container.innerHTML = events.map(function(ev) {
      const debut = new Date(ev.starts_at);
      const dateStr = debut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const heureStr = debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      return '<div class="event-card reveal">' +
        (ev.image_url ? '<div class="event-img"><img src="' + ev.image_url + '" alt="' + ev.title + '" loading="lazy"></div>' : '') +
        '<div class="event-body">' +
          '<div class="event-date">' + dateStr + ' à ' + heureStr + '</div>' +
          '<h3 class="event-title">' + ev.title + '</h3>' +
          (ev.description ? '<p class="event-desc">' + ev.description + '</p>' : '') +
          (ev.capacity ? '<p class="event-capacity">Capacité : ' + ev.capacity + ' personnes</p>' : '') +
          (ev.registration_url
            ? '<a href="' + ev.registration_url + '" target="_blank" rel="noopener" class="event-btn">S\'inscrire</a>'
            : '<a href="reservation.html" class="event-btn">Réserver une table</a>') +
        '</div>' +
      '</div>';
    }).join('');

    observeReveal();
  } catch(e) {}
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initNav();
  loadRestaurantData();
  loadCarteData();
  loadEvenements();
  initReservationForm();
  observeReveal();
});
