/* ============================================================
   ARCADIA — animations.js
   ============================================================ */

(function () {
  'use strict';
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* ─── LOADER ──────────────────────────────────────────────── */
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
        if (loader.children[0]) loader.children[0].style.opacity = '0';
        if (loader.children[1]) loader.children[1].style.opacity = '0';
        gsap.to(L, { x: '-101%', duration: 1.4, ease: 'power4.inOut', delay: 0.1 });
        gsap.to(R, { x:  '101%', duration: 1.4, ease: 'power4.inOut', delay: 0.1,
          onComplete: function () { loader.classList.add('out'); }
        });
      }
    });
  }

  /* ─── BARRE DE PROGRESSION ────────────────────────────────── */
  var progBar = document.getElementById('scrollProgress');
  if (progBar) {
    window.addEventListener('scroll', function () {
      var pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      progBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ─── HOMEPAGE : hero & reveals ───────────────────────────── */
  var isHomepage = !!document.querySelector('.hero');

  if (isHomepage) {
    // Events dynamiques (mutation observer)
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

    // Plats aperçu (mutation observer)
    var platsContainer = document.getElementById('ov-plats-container');
    if (platsContainer) {
      var platsObs = new MutationObserver(function () {
        var plats = platsContainer.querySelectorAll('.ov-plat');
        if (!plats.length) return;
        gsap.from(plats, {
          y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: platsContainer, start: 'top 84%' }
        });
        platsObs.disconnect();
      });
      platsObs.observe(platsContainer, { childList: true });
    }

    // Reveals génériques sur la homepage
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 84%' }
        }
      );
    });

    // Philo cards
    if (document.querySelector('.philo-grid')) {
      gsap.fromTo('.philo-card',
        { y: 70, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', stagger: 0.16,
          scrollTrigger: { trigger: '.philo-grid', start: 'top 80%' }
        }
      );
    }

    // Stats items
    if (document.querySelector('.stat-item')) {
      gsap.fromTo('.stat-item',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '.stats-grid', start: 'top 80%' }
        }
      );
    }

    // Horaires
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
  }

  /* ─── PAGES SECONDAIRES ────────────────────────────────────── */
  var pageHeroTitle = document.querySelector('.page-hero-title');
  if (pageHeroTitle) {

    // Titre page animé mot par mot
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

    // Reveals classiques
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        }
      );
    });

    // Section titles
    document.querySelectorAll('.section-title, .display-title').forEach(function (el) {
      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%' }
        }
      );
    });

    // Horaires
    var hList2 = document.querySelector('[data-bf="horaires"]');
    if (hList2) {
      var hObs2 = new MutationObserver(function () {
        var rows = hList2.querySelectorAll('.h-row');
        if (!rows.length) return;
        gsap.from(rows, {
          x: -24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: hList2, start: 'top 82%' }
        });
        hObs2.disconnect();
      });
      hObs2.observe(hList2, { childList: true });
    }

    // Philo cards (present on some secondary pages too)
    if (document.querySelector('.philo-grid')) {
      gsap.fromTo('.philo-card',
        { y: 70, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', stagger: 0.16,
          scrollTrigger: { trigger: '.philo-grid', start: 'top 80%' }
        }
      );
    }

    // Menu items
    if (document.querySelector('#bf-sections')) {
      gsap.fromTo('.menu-item',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.04,
          scrollTrigger: { trigger: '#bf-sections', start: 'top 90%' }
        }
      );
    }

    // Events
    var evGrid2 = document.getElementById('bf-evenements');
    if (evGrid2) {
      var evObs2 = new MutationObserver(function () {
        var cards = evGrid2.querySelectorAll('.event-card');
        if (!cards.length) return;
        gsap.from(cards, {
          y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14,
          scrollTrigger: { trigger: evGrid2, start: 'top 82%' }
        });
        evObs2.disconnect();
      });
      evObs2.observe(evGrid2, { childList: true });
    }

    // Info rows
    if (document.querySelector('.infos-list')) {
      gsap.fromTo('.info-row',
        { x: 28, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '.infos-list', start: 'top 80%' }
        }
      );
    }
  }

})();
