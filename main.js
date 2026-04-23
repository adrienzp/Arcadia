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
function initReservationForm() {
  const form = document.getElementById('resa-form');
  if (!form) return;

  // Pré-rempli la date avec demain
  const dateInput = document.getElementById('resa-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.value = tomorrow.toISOString().split('T')[0];
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
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initNav();
  loadRestaurantData();
  loadCarteData();
  initReservationForm();
  observeReveal();
});
