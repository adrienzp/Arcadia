/* ============================================================
   ARCADIA — animations.js
   Effets cinématographiques : curseur lerpé, rideau d'entrée,
   révélations clip-path, texte lettre par lettre, parallaxe,
   compteurs.
   ============================================================ */

(function() {

  /* ─────────────────────────────────────────
     1. CURSEUR LERPÉ (smooth magnetic follow)
  ───────────────────────────────────────── */
  var cursor    = document.getElementById('cursor');
  var ring      = document.getElementById('cursorRing');
  var mouseX = 0, mouseY = 0;
  var curX = 0,   curY = 0;
  var ringX = 0,  ringY = 0;

  if (cursor && ring) {
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function lerpCursor() {
      curX  += (mouseX - curX)  * 0.25;
      curY  += (mouseY - curY)  * 0.25;
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;

      cursor.style.left = curX + 'px';
      cursor.style.top  = curY + 'px';
      ring.style.left   = ringX + 'px';
      ring.style.top    = ringY + 'px';

      requestAnimationFrame(lerpCursor);
    }
    lerpCursor();

    document.querySelectorAll('a, button, .food-card, .philo-card, .menu-item').forEach(function(el) {
      el.addEventListener('mouseenter', function() { ring.classList.add('hover'); cursor.style.transform = 'translate(-50%,-50%) scale(1.6)'; });
      el.addEventListener('mouseleave', function() { ring.classList.remove('hover'); cursor.style.transform = 'translate(-50%,-50%) scale(1)'; });
    });
  }

  /* ─────────────────────────────────────────
     2. RIDEAU D'ENTRÉE (portes du restaurant)
        Deux panneaux noirs qui s'écartent
  ───────────────────────────────────────── */
  var hero = document.querySelector('.hero');
  if (hero) {
    var doorL = document.createElement('div');
    var doorR = document.createElement('div');
    var doorStyle = {
      position: 'fixed', top: '0', height: '100vh', width: '50vw',
      background: 'var(--noir)', zIndex: '500',
      transition: 'transform 1.4s cubic-bezier(0.76,0,0.24,1) 0.2s',
      willChange: 'transform'
    };
    Object.assign(doorL.style, doorStyle, { left: '0' });
    Object.assign(doorR.style, doorStyle, { right: '0' });
    document.body.appendChild(doorL);
    document.body.appendChild(doorR);

    window.addEventListener('load', function() {
      // Petite pause pour que l'utilisateur voit l'effet
      setTimeout(function() {
        doorL.style.transform = 'translateX(-101%)';
        doorR.style.transform = 'translateX(101%)';
        setTimeout(function() {
          doorL.remove();
          doorR.remove();
        }, 1600);
      }, 150);
    });
  }

  /* ─────────────────────────────────────────
     3. SPLIT TEXT — titres lettre par lettre
  ───────────────────────────────────────── */
  function splitAndAnimate(el, delay) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';

    // On parcourt les noeuds — on split uniquement les textes, on laisse les <em> intacts
    var html = '';
    el.childNodes.forEach(function(node) {
      if (node.nodeType === 3) { // texte brut
        node.textContent.split('').forEach(function(ch, i) {
          var d = (delay || 0) + i * 28;
          if (ch === ' ') {
            html += '<span style="display:inline-block;width:.25em;"> </span>';
          } else {
            html += '<span class="char" style="display:inline-block;opacity:0;transform:translateY(40px) rotateX(-60deg);transition:opacity .6s cubic-bezier(.25,.46,.45,.94) ' + d + 'ms, transform .7s cubic-bezier(.25,.46,.45,.94) ' + d + 'ms;transform-origin:50% 100%;perspective:600px;">' + ch + '</span>';
          }
        });
      } else if (node.nodeType === 1) { // élément (<em>, etc.)
        var tag = node.tagName.toLowerCase();
        var innerHtml = '';
        node.textContent.split('').forEach(function(ch, i) {
          var d = (delay || 0) + i * 28;
          if (ch === ' ') {
            innerHtml += '<span style="display:inline-block;width:.25em;"> </span>';
          } else {
            innerHtml += '<span class="char" style="display:inline-block;opacity:0;transform:translateY(40px) rotateX(-60deg);transition:opacity .6s cubic-bezier(.25,.46,.45,.94) ' + d + 'ms, transform .7s cubic-bezier(.25,.46,.45,.94) ' + d + 'ms;transform-origin:50% 100%;perspective:600px;">' + ch + '</span>';
          }
        });
        html += '<' + tag + ' style="font-style:italic;">' + innerHtml + '</' + tag + '>';
      }
    });
    el.innerHTML = html;
  }

  function revealChars(el) {
    el.querySelectorAll('.char').forEach(function(ch) {
      ch.style.opacity = '1';
      ch.style.transform = 'translateY(0) rotateX(0)';
    });
  }

  /* ─────────────────────────────────────────
     4. CLIP-PATH IMAGE REVEAL (rideau vertical)
  ───────────────────────────────────────── */
  function addClipReveal(img) {
    if (!img || img.dataset.clip) return;
    img.dataset.clip = '1';

    // Wrap l'image dans un conteneur overflow:hidden si pas déjà
    var parent = img.parentElement;
    if (!parent.classList.contains('clip-wrap')) {
      var wrap = document.createElement('div');
      wrap.className = 'clip-wrap';
      wrap.style.cssText = 'overflow:hidden;display:block;width:100%;height:100%;';
      parent.insertBefore(wrap, img);
      wrap.appendChild(img);
    }

    img.style.cssText += 'clip-path:inset(0 100% 0 0);transition:clip-path 1.2s cubic-bezier(0.76,0,0.24,1);will-change:clip-path;';
  }

  /* ─────────────────────────────────────────
     5. COUNT-UP (stats)
  ───────────────────────────────────────── */
  function animateCount(el) {
    var raw = el.textContent.trim();
    // Gère les cas : "100%", "5", "0", "∞"
    if (raw === '∞') return;
    var num = parseFloat(raw.replace('%','').replace(',','.'));
    if (isNaN(num)) return;
    var hasPct = raw.includes('%');
    var duration = 1600;
    var start = null;
    var from = 0;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // ease out expo
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      var val = Math.round(from + (num - from) * e);
      el.textContent = val + (hasPct ? '%' : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ─────────────────────────────────────────
     6. PARALLAXE HERO
  ───────────────────────────────────────── */
  var heroBg = document.querySelector('.hero-bg');
  var heroLines = document.querySelector('.hero-lines');

  function updateParallax() {
    var sy = window.scrollY;
    if (heroBg)    heroBg.style.transform    = 'translateY(' + (sy * 0.4) + 'px)';
    if (heroLines) heroLines.style.transform = 'translateY(' + (sy * 0.2) + 'px)';
  }

  /* ─────────────────────────────────────────
     7. STAGGER ENFANTS dans les grilles
  ───────────────────────────────────────── */
  function staggerChildren(parent) {
    var children = parent.querySelectorAll('.philo-card, .food-card, .stat-item, .event-card, .resa-info-card, .menu-item');
    children.forEach(function(child, i) {
      child.style.transitionDelay = (i * 80) + 'ms';
    });
  }

  /* ─────────────────────────────────────────
     8. INTERSECTION OBSERVER PRINCIPAL
  ───────────────────────────────────────── */
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;

      // Titres split
      if (el.classList.contains('do-split')) {
        splitAndAnimate(el);
        revealChars(el);
      }

      // Révélation image
      if (el.tagName === 'IMG' && el.dataset.clip) {
        el.style.clipPath = 'inset(0 0% 0 0)';
      }

      // Count-up
      if (el.classList.contains('stat-num')) {
        animateCount(el);
      }

      // Reveal classique
      if (el.classList.contains('reveal')) {
        el.classList.add('visible');
      }

      obs.unobserve(el);
    });
  }, { threshold: 0.15 });

  /* ─────────────────────────────────────────
     9. INITIALISATION
  ───────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function() {

    // Parallaxe
    window.addEventListener('scroll', updateParallax, { passive: true });

    // Titres à splitter
    document.querySelectorAll('.display-title, .section-title, .page-hero-title').forEach(function(el) {
      el.classList.add('do-split');
      obs.observe(el);
    });

    // Images avec clip reveal
    document.querySelectorAll('.about-img-main, .food-card-img, .event-img-wrap img').forEach(function(img) {
      addClipReveal(img);
      obs.observe(img);
    });

    // Stats count-up
    document.querySelectorAll('.stat-num').forEach(function(el) {
      obs.observe(el);
    });

    // Reveals classiques
    document.querySelectorAll('.reveal').forEach(function(el) {
      obs.observe(el);
    });

    // Stagger enfants
    document.querySelectorAll('.philo-grid, .food-grid, .stats-grid, .events-grid').forEach(function(el) {
      staggerChildren(el);
    });

    // Line de progression au scroll (barre en haut de page)
    var progressBar = document.createElement('div');
    progressBar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:var(--bois);z-index:9999;width:0%;transition:width .1s linear;';
    document.body.appendChild(progressBar);
    window.addEventListener('scroll', function() {
      var pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      progressBar.style.width = pct + '%';
    }, { passive: true });

  });

})();
