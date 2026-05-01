/* ============================================================
   ARCADIA — animations.js
   Contrôle des overlays 3D + curseur + pages secondaires
   ============================================================ */

(function () {
  'use strict';
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* ─── LOADER ──────────────────────────────────────────────
     Barre qui se remplit → portes qui s'écartent
  ─────────────────────────────────────────────────────────── */
  var loader = document.getElementById('pageLoader');
  var fill   = document.getElementById('loaderFill');

  if (loader && fill) {
    gsap.to(fill, {
      width: '100%', duration: 1.1, ease: 'power2.inOut',
      onComplete: function () {
        var L = document.createElement('div');
        var R = document.createElement('div');
        var s = 'position:absolute;top:0;height:100%;width:50%;background:var(--noir);z-index:1;';
        L.style.cssText = s + 'left:0;'; R.style.cssText = s + 'right:0;';
        loader.appendChild(L); loader.appendChild(R);
        loader.style.overflow = 'hidden';
        loader.children[0].style.opacity = '0';
        loader.children[1].style.opacity = '0';
        gsap.to(L, { x: '-101%', duration: 1.4, ease: 'power4.inOut', delay: 0.1 });
        gsap.to(R, { x:  '101%', duration: 1.4, ease: 'power4.inOut', delay: 0.1,
          onComplete: function () { loader.classList.add('out'); }
        });
      }
    });
  }

  /* ─── CURSEUR LERPÉ ───────────────────────────────────── */
  var curDot  = document.getElementById('cursor');
  var curRing = document.getElementById('cursorRing');

  if (curDot && curRing) {
    var mouse = { x: 0, y: 0 };
    var dot   = { x: 0, y: 0 };
    var ring  = { x: 0, y: 0 };
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    gsap.ticker.add(function () {
      dot.x  += (mouse.x - dot.x)  * 0.3;
      dot.y  += (mouse.y - dot.y)  * 0.3;
      ring.x += (mouse.x - ring.x) * 0.1;
      ring.y += (mouse.y - ring.y) * 0.1;
      gsap.set(curDot,  { x: dot.x,  y: dot.y  });
      gsap.set(curRing, { x: ring.x, y: ring.y });
    });
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        gsap.to(curRing, { width: 58, height: 58, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(curDot,  { scale: 1.8, duration: 0.3 });
        curRing.classList.add('hover');
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(curRing, { width: 36, height: 36, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(curDot,  { scale: 1,  duration: 0.3 });
        curRing.classList.remove('hover');
      });
    });
  }

  /* ─── BARRE DE PROGRESSION ────────────────────────────── */
  var progBar = document.getElementById('scrollProgress');
  if (progBar) {
    window.addEventListener('scroll', function () {
      var pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      progBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ─── NAV HIDE/SHOW ───────────────────────────────────── */
  var nav = document.getElementById('navbar');
  if (nav) {
    var lastSY = 0;
    window.addEventListener('scroll', function () {
      var sy = window.scrollY;
      // On cache seulement si on est dans la zone 3D (scroll-driver)
      var driver = document.getElementById('scroll-driver');
      if (driver && sy < driver.offsetHeight) {
        if (sy > lastSY && sy > 300) {
          gsap.to(nav, { yPercent: -110, duration: 0.5, ease: 'power2.in' });
        } else {
          gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power2.out' });
        }
      } else {
        gsap.to(nav, { yPercent: 0, duration: 0.3 });
      }
      lastSY = sy;
    }, { passive: true });
  }

  /* ─── LOGIQUE OVERLAYS 3D ─────────────────────────────── */
  var driver = document.getElementById('scroll-driver');
  if (driver) {
    // Smoothstep pour transitions douces
    function ss(e0, e1, x) {
      var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    }

    // Opacité d'un overlay : fade-in entre [iStart,iEnd] et fade-out entre [oStart,oEnd]
    function ovOp(p, iStart, iEnd, oStart, oEnd) {
      return Math.min(ss(iStart, iEnd, p), 1 - ss(oStart, oEnd, p));
    }

    function setOv(id, opacity) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.opacity = opacity;
      el.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
    }

    var statsAnimated = false;

    ScrollTrigger.create({
      trigger: driver,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;

        // Mise à jour progression caméra 3D
        window._sceneProgress = p;

        // ── Overlay 1 : Entrée (0 → 14%)
        setOv('ov-hero',  ovOp(p, 0, 0.03, 0.11, 0.16));

        // ── Overlay 2 : La salle (18 → 33%)
        setOv('ov-salle', ovOp(p, 0.18, 0.23, 0.30, 0.35));

        // ── Overlay 3 : La carte (38 → 54%)
        setOv('ov-carte', ovOp(p, 0.38, 0.43, 0.51, 0.56));

        // ── Overlay 4 : Stats (58 → 70%)
        var stOp = ovOp(p, 0.58, 0.63, 0.67, 0.72);
        setOv('ov-stats', stOp);
        // Count-up déclenché une fois
        if (stOp > 0.5 && !statsAnimated) {
          statsAnimated = true;
          document.querySelectorAll('.ov-stat-num[data-target]').forEach(function (el) {
            var target = parseFloat(el.dataset.target);
            var suffix = el.dataset.suffix || '';
            if (isNaN(target)) return;
            var obj = { v: 0 };
            gsap.to(obj, { v: target, duration: 1.8, ease: 'power2.out',
              onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
            });
          });
        }

        // ── Overlay 5 : Bar & horaires (74 → 88%)
        setOv('ov-bar',   ovOp(p, 0.74, 0.79, 0.85, 0.90));

        // ── Overlay 6 : Réservation (92 → 100%)
        setOv('ov-resa',  ovOp(p, 0.92, 0.96, 1.0, 1.01));
      }
    });
  }

  /* ─── CONTENU RÉGULIER (après la zone 3D) ─────────────── */
  var regular = document.getElementById('regular-content');
  if (regular) {

    // Events : MutationObserver pour les cartes chargées dynamiquement
    var evGrid = document.getElementById('bf-evenements');
    if (evGrid) {
      var evObs = new MutationObserver(function () {
        var cards = evGrid.querySelectorAll('.event-card');
        if (!cards.length) return;
        gsap.from(cards, {
          y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14,
          scrollTrigger: { trigger: evGrid, start: 'top 82%' }
        });
        evObs.disconnect();
      });
      evObs.observe(evGrid, { childList: true });
    }

    // Reveals génériques
    regular.querySelectorAll('.reveal').forEach(function (el) {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 84%' }
      });
    });
  }

  /* ─── PAGES SECONDAIRES (menu, resa, contact, events) ─── */
  var pageHeroTitle = document.querySelector('.page-hero-title');
  if (pageHeroTitle && !document.getElementById('scroll-driver')) {

    // Titre page : split mots
    function splitWords(el) {
      if (!el || el.dataset.split) return [];
      el.dataset.split = '1';
      var html = '';
      el.childNodes.forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part.trim()) { html += '<span style="display:inline-block;width:.25em;"> </span>'; return; }
            html += '<span style="display:inline-block;overflow:hidden;"><span class="swi" style="display:inline-block;">' + part + '</span></span>';
          });
        } else if (node.nodeType === 1 && node.tagName !== 'BR') {
          var tag = node.tagName.toLowerCase();
          var inner = '';
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part.trim()) { inner += '<span style="display:inline-block;width:.25em;"> </span>'; return; }
            inner += '<span style="display:inline-block;overflow:hidden;"><span class="swi" style="display:inline-block;">' + part + '</span></span>';
          });
          html += '<' + tag + ' style="display:inline;">' + inner + '</' + tag + '>';
        } else if (node.tagName === 'BR') { html += '<br>'; }
      });
      el.innerHTML = html;
      return el.querySelectorAll('.swi');
    }

    gsap.from('.page-hero-eyebrow', { opacity: 0, y: 20, duration: 0.8, delay: 0.4 });
    var inners = splitWords(pageHeroTitle);
    if (inners.length) {
      gsap.from(inners, { y: '105%', opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.55 });
    }
    gsap.from('.page-hero-line', { width: 0, duration: 1, ease: 'power3.out', delay: 0.9 });
    gsap.from('.page-hero-sub',  { opacity: 0, y: 16, duration: 0.8, delay: 1.0 });

    // Reveals classiques sur les autres pages
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 83%' }
      });
    });

    // Section titles
    document.querySelectorAll('.section-title, .display-title').forEach(function (el) {
      gsap.from(el, {
        y: 30, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });

    // Horaires lignes
    var hList = document.querySelector('[data-bf="horaires"]');
    if (hList) {
      var hObs = new MutationObserver(function () {
        var rows = hList.querySelectorAll('.h-row');
        if (!rows.length) return;
        gsap.from(rows, {
          x: -24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: hList, start: 'top 82%' }
        });
        hObs.disconnect();
      });
      hObs.observe(hList, { childList: true });
    }

    // Philo cards
    gsap.from('.philo-card', {
      y: 70, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.16,
      scrollTrigger: { trigger: '.philo-grid', start: 'top 80%' }
    });

    // Menu items
    gsap.from('.menu-item', {
      y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04,
      scrollTrigger: { trigger: '#bf-sections', start: 'top 90%' }
    });

    // Info rows
    gsap.from('.info-row', {
      x: 28, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.infos-list', start: 'top 80%' }
    });
  }

})();
