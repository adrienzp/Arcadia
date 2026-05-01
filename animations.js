/* ============================================================
   ARCADIA — animations.js
   Expérience cinématographique complète avec GSAP + ScrollTrigger
   Tu entres dans le restaurant, tu découvres la salle,
   la carte s'ouvre, tu réserves ta table.
   ============================================================ */

(function() {
  'use strict';

  // ── Guard : on attend que GSAP soit dispo ──────────────────
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────────────────────
     LOADER
     Barre qui se remplit, puis les panneaux s'écartent
  ───────────────────────────────────────────────────────── */
  var loader = document.getElementById('pageLoader');
  var fill   = document.getElementById('loaderFill');

  if (loader && fill) {
    // Remplit la barre sur 900ms
    gsap.to(fill, {
      width: '100%',
      duration: 0.9,
      ease: 'power2.inOut',
      onComplete: function() {
        // Deux panneaux qui s'écartent (effet portes de restaurant)
        var left  = Object.assign(document.createElement('div'), {
          style: 'position:absolute;top:0;left:0;width:50%;height:100%;background:var(--noir);z-index:1;'
        });
        var right = Object.assign(document.createElement('div'), {
          style: 'position:absolute;top:0;right:0;width:50%;height:100%;background:var(--noir);z-index:1;'
        });
        loader.appendChild(left);
        loader.appendChild(right);
        loader.style.overflow = 'hidden';

        // Retire le texte / barre
        gsap.to(loader.children[0], { opacity: 0, duration: 0.3 });
        gsap.to(loader.children[1], { opacity: 0, duration: 0.3 });

        // Écarte les portes
        gsap.to(left,  { x: '-101%', duration: 1.2, ease: 'power4.inOut', delay: 0.15 });
        gsap.to(right, {
          x: '101%', duration: 1.2, ease: 'power4.inOut', delay: 0.15,
          onComplete: function() {
            loader.classList.add('out');
          }
        });
      }
    });
  } else {
    // Pas de loader sur les autres pages — rien à faire
  }

  /* ─────────────────────────────────────────────────────────
     CURSEUR LERPÉ (smooth magnetic follow)
  ───────────────────────────────────────────────────────── */
  var cursorDot  = document.getElementById('cursor');
  var cursorRing = document.getElementById('cursorRing');

  if (cursorDot && cursorRing) {
    var mouse = { x: 0, y: 0 };
    var pos   = { x: 0, y: 0 };
    var ring  = { x: 0, y: 0 };

    document.addEventListener('mousemove', function(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    gsap.ticker.add(function() {
      pos.x  += (mouse.x - pos.x)  * 0.28;
      pos.y  += (mouse.y - pos.y)  * 0.28;
      ring.x += (mouse.x - ring.x) * 0.1;
      ring.y += (mouse.y - ring.y) * 0.1;

      gsap.set(cursorDot,  { x: pos.x,  y: pos.y });
      gsap.set(cursorRing, { x: ring.x, y: ring.y });
    });

    // Hover magnétique sur les éléments interactifs
    document.querySelectorAll('a, button, .food-card, .philo-card, .event-card').forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        gsap.to(cursorRing, { width: 60, height: 60, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(cursorDot,  { scale: 1.8, duration: 0.3 });
        cursorRing.classList.add('hover');
      });
      el.addEventListener('mouseleave', function() {
        gsap.to(cursorRing, { width: 36, height: 36, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(cursorDot,  { scale: 1, duration: 0.3 });
        cursorRing.classList.remove('hover');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     BARRE DE PROGRESSION
  ───────────────────────────────────────────────────────── */
  var progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    gsap.to(progressBar, {
      width: '100%',
      ease: 'none',
      scrollTrigger: { start: 'top top', end: 'bottom bottom', scrub: 0 }
    });
  }

  /* ─────────────────────────────────────────────────────────
     SPLIT TEXT
     Découpe les titres en mots, chaque mot est un overflow:hidden
     avec un inner qui monte de bas en haut
  ───────────────────────────────────────────────────────── */
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = '1';

    var words = [];
    var html = '';

    // On garde les <em> intacts
    el.childNodes.forEach(function(node) {
      if (node.nodeType === 3) {
        // Texte brut
        node.textContent.split(/(\s+)/).forEach(function(part) {
          if (!part.trim()) { html += '<span style="display:inline-block;width:.25em;"> </span>'; return; }
          html += '<span class="split-word"><span class="split-word-inner">' + part + '</span></span>';
          words.push(part);
        });
      } else if (node.nodeType === 1) {
        // Élément (<em>, <br>, etc.)
        var tag = node.tagName.toLowerCase();
        if (tag === 'br') { html += '<br>'; return; }
        var innerWords = [];
        var innerHtml = '';
        node.textContent.split(/(\s+)/).forEach(function(part) {
          if (!part.trim()) { innerHtml += '<span style="display:inline-block;width:.25em;"> </span>'; return; }
          innerHtml += '<span class="split-word"><span class="split-word-inner">' + part + '</span></span>';
          innerWords.push(part);
        });
        html += '<' + tag + ' style="display:inline;">' + innerHtml + '</' + tag + '>';
        words = words.concat(innerWords);
      }
    });

    el.innerHTML = html;
    return el.querySelectorAll('.split-word-inner');
  }

  /* ─────────────────────────────────────────────────────────
     HELPER : animation titre avec ScrollTrigger
  ───────────────────────────────────────────────────────── */
  function animateTitle(el, triggerEl, delay) {
    if (!el) return;
    var inners = splitWords(el);
    if (!inners.length) return;

    gsap.from(inners, {
      y: '105%',
      opacity: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.06,
      delay: delay || 0,
      scrollTrigger: {
        trigger: triggerEl || el,
        start: 'top 82%'
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 1 — HÉRO : tu pousses la porte
     → background zoom progressif au scroll
     → contenu s'estompe en montant
  ───────────────────────────────────────────────────────── */
  var heroBg   = document.getElementById('heroBgImg');
  var heroInner = document.getElementById('heroInner');
  var heroLines = document.querySelector('.hero-lines');

  if (heroBg) {
    // Le fond s'approche — illusion de marche vers l'intérieur
    gsap.to(heroBg, {
      scale: 1.35,
      ease: 'none',
      scrollTrigger: {
        trigger: '#s-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.8
      }
    });
  }

  if (heroInner) {
    // Le titre monte et disparaît quand on quitte le hero
    gsap.to(heroInner, {
      y: -100,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#s-hero',
        start: '25% top',
        end: '75% top',
        scrub: 1.2
      }
    });
  }

  if (heroLines) {
    // Les lignes de grille se dilatent comme si on s'en approchait
    gsap.to(heroLines, {
      scale: 1.25,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#s-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 2
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 2 — LA SALLE : tu entres, tu regardes
  ───────────────────────────────────────────────────────── */
  var salleImg = document.getElementById('salleImg');

  if (salleImg) {
    // Image : clip-path rideau qui s'ouvre de droite à gauche
    gsap.fromTo(salleImg,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.5,
        ease: 'power4.inOut',
        scrollTrigger: {
          trigger: '#s-salle',
          start: 'top 70%'
        }
      }
    );

    // Léger parallaxe sur l'image
    gsap.to(salleImg, {
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: '#s-salle',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5
      }
    });
  }

  // Eyebrow fade
  gsap.from('#salleEyebrow', {
    opacity: 0, y: 20, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '#s-salle', start: 'top 72%' }
  });

  // Titre
  animateTitle(document.getElementById('salleTitle'), '#s-salle');

  // Ligne bois
  gsap.from('#salleLine', {
    width: 0, duration: 1.2, ease: 'power3.out', delay: 0.3,
    scrollTrigger: { trigger: '#s-salle', start: 'top 65%' }
  });

  // Intro text + bouton
  gsap.from(['#salleIntro', '#salleBtn'], {
    y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: 0.2,
    scrollTrigger: { trigger: '#salleIntro', start: 'top 80%' }
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 3 — PHILOSOPHIE
  ───────────────────────────────────────────────────────── */
  gsap.from('#philoEyebrow', {
    opacity: 0, y: 16, duration: 0.7,
    scrollTrigger: { trigger: '#s-philo', start: 'top 75%' }
  });

  animateTitle(document.getElementById('philoTitle'), '#s-philo');

  gsap.from('#philoLine', {
    width: 0, duration: 1, ease: 'power3.out', delay: 0.2,
    scrollTrigger: { trigger: '#s-philo', start: 'top 68%' }
  });

  // Cards : arrivent une par une du bas, avec délai croissant
  gsap.from('#philoGrid .philo-card', {
    y: 80,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    stagger: 0.18,
    scrollTrigger: {
      trigger: '#philoGrid',
      start: 'top 78%'
    }
  });

  // Numéros : grossissent depuis 0
  gsap.from('#philoGrid .philo-num', {
    scale: 0.5,
    opacity: 0,
    duration: 0.8,
    ease: 'back.out(2)',
    stagger: 0.18,
    scrollTrigger: {
      trigger: '#philoGrid',
      start: 'top 78%'
    }
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 4 — LA CARTE : les plats arrivent devant toi
  ───────────────────────────────────────────────────────── */
  gsap.from('#carteEyebrow', {
    opacity: 0, y: 16, duration: 0.7,
    scrollTrigger: { trigger: '#s-carte', start: 'top 75%' }
  });

  animateTitle(document.getElementById('carteTitle'), '#s-carte');

  gsap.from('#carteBtnMore', {
    opacity: 0, x: 20, duration: 0.8,
    scrollTrigger: { trigger: '#s-carte', start: 'top 70%' }
  });

  // Chaque carte food : clip-path révélation montante + léger délai
  ['food0','food1','food2','food3'].forEach(function(id, i) {
    var card = document.getElementById(id);
    if (!card) return;

    gsap.fromTo(card,
      { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
      {
        clipPath: 'inset(0% 0 0 0)',
        opacity: 1,
        duration: 1.3,
        ease: 'power4.out',
        delay: i * 0.12,
        scrollTrigger: {
          trigger: '#foodGrid',
          start: 'top 80%'
        }
      }
    );

    // Zoom très subtil au hover (en plus du CSS)
    var img = card.querySelector('.food-card-img');
    if (img) {
      card.addEventListener('mouseenter', function() {
        gsap.to(img, { scale: 1.06, duration: 0.8, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', function() {
        gsap.to(img, { scale: 1, duration: 0.8, ease: 'power2.out' });
      });
    }
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 5 — STATS : count-up dramatique
  ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.stat-num').forEach(function(el) {
    var target  = el.dataset.target;
    var suffix  = el.dataset.suffix || '';

    if (target === '∞') return; // On laisse le symbole infini tel quel

    var num = parseFloat(target);
    if (isNaN(num)) return;

    var obj = { val: 0 };
    gsap.to(obj, {
      val: num,
      duration: 2,
      ease: 'power2.out',
      onUpdate: function() {
        el.textContent = Math.round(obj.val) + suffix;
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      }
    });
  });

  // Stat items : arrivent de bas en haut avec stagger
  gsap.from('#statsGrid .stat-item', {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: {
      trigger: '#statsGrid',
      start: 'top 78%'
    }
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 6 — ÉVÉNEMENTS
  ───────────────────────────────────────────────────────── */
  gsap.from('#eventsEyebrow', {
    opacity: 0, y: 16, duration: 0.7,
    scrollTrigger: { trigger: '#s-events', start: 'top 75%' }
  });

  animateTitle(document.getElementById('eventsTitle'), '#s-events');

  // Les event-cards sont chargées dynamiquement par main.js
  // On observe leur apparition avec un MutationObserver
  var eventsGrid = document.getElementById('bf-evenements');
  if (eventsGrid) {
    var eventsObserver = new MutationObserver(function() {
      var cards = eventsGrid.querySelectorAll('.event-card');
      if (!cards.length) return;
      gsap.from(cards, {
        y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14,
        scrollTrigger: { trigger: eventsGrid, start: 'top 80%' }
      });
      eventsObserver.disconnect();
    });
    eventsObserver.observe(eventsGrid, { childList: true });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 7 — HORAIRES
  ───────────────────────────────────────────────────────── */
  animateTitle(document.getElementById('horairesTitle'), '#s-horaires');
  animateTitle(document.getElementById('contactTitle'), '#s-horaires', 0.1);

  gsap.from(['#horairesLine', '#contactLine'], {
    width: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#s-horaires', start: 'top 70%' }
  });

  // Les lignes horaires sont générées par main.js — on observe aussi
  var horairesList = document.getElementById('horairesList');
  if (horairesList) {
    var horairesObserver = new MutationObserver(function() {
      var rows = horairesList.querySelectorAll('.h-row');
      if (!rows.length) return;
      gsap.from(rows, {
        x: -30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: horairesList, start: 'top 80%' }
      });
      horairesObserver.disconnect();
    });
    horairesObserver.observe(horairesList, { childList: true });
  }

  gsap.from('.info-row', {
    x: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: '#horairesRight', start: 'top 78%' }
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 8 — CTA FINAL : réservation
     Le grand mot "Arcadia" grossit en fond pendant que tu t'approches
  ───────────────────────────────────────────────────────── */
  var bgWord = document.getElementById('bgWord');
  if (bgWord) {
    gsap.fromTo(bgWord,
      { scale: 0.85, opacity: 0 },
      {
        scale: 1.05,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#s-resa-cta',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2
        }
      }
    );
  }

  gsap.from('#ctaEyebrow', {
    opacity: 0, y: 20, duration: 0.9,
    scrollTrigger: { trigger: '#s-resa-cta', start: 'top 70%' }
  });

  animateTitle(document.getElementById('ctaTitle'), '#s-resa-cta');

  gsap.from('#ctaBtn', {
    y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.4,
    scrollTrigger: { trigger: '#s-resa-cta', start: 'top 65%' }
  });

  /* ─────────────────────────────────────────────────────────
     PAGES SECONDAIRES — animations légères (menu, resa…)
  ───────────────────────────────────────────────────────── */
  // Page-hero : titre split + eyebrow fade
  var pageHeroTitle = document.querySelector('.page-hero-title');
  if (pageHeroTitle) {
    gsap.from('.page-hero-eyebrow', { opacity: 0, y: 20, duration: 0.8, delay: 0.4 });
    var phInners = splitWords(pageHeroTitle);
    if (phInners.length) {
      gsap.from(phInners, { y: '105%', opacity: 0, duration: 1.2, ease: 'power4.out', stagger: 0.08, delay: 0.6 });
    }
    gsap.from('.page-hero-line', { width: 0, duration: 1, ease: 'power3.out', delay: 1 });
    gsap.from('.page-hero-sub',  { opacity: 0, y: 16, duration: 0.8, delay: 1.1 });
  }

  // Tous les .section-title sur les autres pages
  document.querySelectorAll('.section-title:not([data-split])').forEach(function(el) {
    animateTitle(el, el);
  });

  // Reveals généraux (fallback pour tout ce qui n'est pas géré explicitement)
  document.querySelectorAll('.reveal:not([data-animated])').forEach(function(el) {
    el.dataset.animated = '1';
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%' }
    });
  });

  /* ─────────────────────────────────────────────────────────
     NAV : disparaît légèrement quand on scroll vite vers le bas,
           réapparaît quand on remonte
  ───────────────────────────────────────────────────────── */
  var nav = document.getElementById('navbar');
  if (nav) {
    var lastScroll = 0;
    window.addEventListener('scroll', function() {
      var sy = window.scrollY;
      if (sy > lastScroll && sy > 200) {
        gsap.to(nav, { yPercent: -100, duration: 0.4, ease: 'power2.in' });
      } else {
        gsap.to(nav, { yPercent: 0, duration: 0.4, ease: 'power2.out' });
      }
      lastScroll = sy;
    }, { passive: true });
  }

})();
