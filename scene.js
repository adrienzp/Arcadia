/* ============================================================
   ARCADIA — scene.js  (v3)
   Textures procédurales · Porte complète · Rue · Carte sur table
   ============================================================ */

(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  /* ── RENDERER ────────────────────────────────────────────── */
  var canvas = document.getElementById('scene-canvas');
  if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ── SCENE ───────────────────────────────────────────────── */
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0a06);
  scene.fog = new THREE.FogExp2(0x120c07, 0.042);

  /* ── CAMERA ──────────────────────────────────────────────── */
  var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 80);

  /* ═══════════════════════════════════════════════════════════
     TEXTURES PROCÉDURALES — canvas 2D
  ═══════════════════════════════════════════════════════════ */

  function makeTex(w, h, fn, repS, repT) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repS) t.repeat.set(repS, repT || repS);
    return t;
  }

  // Parquet bois — planches horizontales avec grain
  var texFloor = makeTex(512, 512, function (ctx, w, h) {
    var plankH = 56;
    var colors = ['#7a4e2a','#6e4424','#855430','#704a26'];
    for (var y = 0; y < h; y += plankH) {
      var c0 = colors[Math.floor(y / plankH) % colors.length];
      // planche de base
      ctx.fillStyle = c0;
      ctx.fillRect(0, y, w, plankH - 1);
      // grain fin
      ctx.globalAlpha = 0.18;
      for (var i = 0; i < 18; i++) {
        var gy = y + Math.random() * plankH;
        ctx.strokeStyle = Math.random() > 0.5 ? '#3a2010' : '#9a6035';
        ctx.lineWidth = 0.4 + Math.random() * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        var cx1 = w * 0.33, cy1 = gy + (Math.random()-0.5)*6;
        var cx2 = w * 0.66, cy2 = gy + (Math.random()-0.5)*6;
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, w, gy + (Math.random()-0.5)*4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // joint entre planches
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, y + plankH - 1, w, 1);
      // Joints verticaux aléatoires tous les 2 rangs
      if (Math.floor(y / plankH) % 2 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(w * 0.42 + Math.random()*4, y, 1, plankH);
      }
    }
  }, 3, 8);

  // Enduit mur crème — légère texture plâtre
  var texWall = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#c8b090';
    ctx.fillRect(0, 0, w, h);
    // Bruit de plâtre
    for (var i = 0; i < 8000; i++) {
      var x = Math.random() * w, y = Math.random() * h;
      var a = Math.random() * 0.06;
      var r = Math.random() * 1.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,'+a+')' : 'rgba(0,0,0,'+a+')';
      ctx.fill();
    }
    // Légères stries horizontales de lissage
    ctx.globalAlpha = 0.04;
    for (var j = 0; j < h; j += 3) {
      ctx.strokeStyle = '#8a6040';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(w,j); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, 2, 3);

  // Pavé extérieur — pierres taillées
  var texPave = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#2e2418';
    ctx.fillRect(0, 0, w, h);
    var tw = 90, th = 50, offset = 0;
    for (var ry = 0; ry < h + th; ry += th) {
      offset = (Math.floor(ry / th) % 2 === 0) ? 0 : tw / 2;
      for (var rx = -offset; rx < w + tw; rx += tw) {
        var v = (Math.random() - 0.5) * 20;
        var base = parseInt('2e', 16) + Math.round(v);
        ctx.fillStyle = 'rgb(' + (base+8) + ',' + (base) + ',' + (base-6) + ')';
        ctx.fillRect(rx + 2, ry + 2, tw - 4, th - 4);
        // Bruit sur chaque pierre
        ctx.globalAlpha = 0.08;
        for (var k = 0; k < 30; k++) {
          ctx.fillStyle = Math.random()>0.5?'#fff':'#000';
          ctx.fillRect(rx + 2 + Math.random()*(tw-4), ry + 2 + Math.random()*(th-4), 2, 2);
        }
        ctx.globalAlpha = 1;
        // Joint
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx + 2, ry + 2, tw - 4, th - 4);
      }
    }
  }, 4, 6);

  // Bois sombre pour porte + bar
  var texBois = makeTex(256, 512, function (ctx, w, h) {
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.22;
    for (var i = 0; i < 30; i++) {
      ctx.strokeStyle = Math.random()>0.5 ? '#2a1808' : '#6a4028';
      ctx.lineWidth = 0.5 + Math.random()*1.5;
      var y0 = Math.random()*h;
      ctx.beginPath(); ctx.moveTo(0, y0);
      ctx.bezierCurveTo(w*.3, y0+(Math.random()-0.5)*8, w*.7, y0+(Math.random()-0.5)*8, w, y0+(Math.random()-0.5)*6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, 1, 3);

  // Façade crépi — enduit extérieur brun foncé
  var texFacade = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#1e1408';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.12;
    for (var i = 0; i < 5000; i++) {
      var x = Math.random()*w, y = Math.random()*h;
      var r = Math.random()*2;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = Math.random()>0.5?'#ffffff':'#000000';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, 2, 2);

  // Texture enseigne "Arcadia"
  var texSign = makeTex(512, 128, function (ctx, w, h) {
    ctx.fillStyle = '#1a0e06';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c4895a'; ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, w-10, h-10);
    ctx.fillStyle = '#c4895a';
    ctx.font = 'italic 58px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Arcadia', w/2, h/2);
    // Petites étoiles décoratives
    ctx.font = '14px serif'; ctx.fillStyle = 'rgba(196,137,90,0.5)';
    ctx.fillText('✦  Restaurant  ✦', w/2, h*0.82);
  }, 1, 1);

  // Texture menu (carte posée sur la table)
  var texMenu = makeTex(256, 360, function (ctx, w, h) {
    // Fond crème
    ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, w, h);
    // Bordure dorée
    ctx.strokeStyle = '#c4895a'; ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, w-16, h-16);
    ctx.strokeStyle = 'rgba(196,137,90,0.4)'; ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, w-28, h-28);
    // Logo / Titre
    ctx.fillStyle = '#3a2010';
    ctx.font = 'italic bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Arcadia', w/2, 52);
    ctx.strokeStyle = '#c4895a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30,64); ctx.lineTo(w-30,64); ctx.stroke();
    // Sections
    function section(title, items, startY) {
      ctx.fillStyle = '#c4895a';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(title.toUpperCase(), 28, startY);
      ctx.strokeStyle = 'rgba(196,137,90,0.3)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(28,startY+4); ctx.lineTo(w-28,startY+4); ctx.stroke();
      ctx.fillStyle = '#3a2010'; ctx.font = '11px Georgia, serif';
      items.forEach(function(item, i) {
        ctx.textAlign = 'left';
        ctx.fillText(item[0], 28, startY + 18 + i*18);
        ctx.textAlign = 'right';
        ctx.fillText(item[1], w-28, startY + 18 + i*18);
      });
    }
    section('Entrées', [['Velouté du moment','9€'],['Tartare saumon','12€']], 82);
    section('Plats', [['Magret de canard','19€'],['Fromage chaud Jura','17€'],['Risotto champignons','15€']], 150);
    section('Desserts', [['Pavlova agrumes','5,50€'],['Tarte tatin','6€']], 236);
    // Note bas
    ctx.fillStyle = 'rgba(90,56,32,0.5)'; ctx.font = 'italic 9px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Frais · Fait maison · De saison', w/2, h-22);
  }, 1, 1);

  /* ═══════════════════════════════════════════════════════════
     MATÉRIAUX avec textures
  ═══════════════════════════════════════════════════════════ */
  var M = {
    floor:   new THREE.MeshStandardMaterial({ map: texFloor, roughness: 0.62, metalness: 0.05 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xd8cbb0, roughness: 0.9 }),
    wall:    new THREE.MeshStandardMaterial({ map: texWall,   roughness: 0.88 }),
    pave:    new THREE.MeshStandardMaterial({ map: texPave,   roughness: 0.92 }),
    facade:  new THREE.MeshStandardMaterial({ map: texFacade, roughness: 0.85 }),
    door:    new THREE.MeshStandardMaterial({ map: texBois,   roughness: 0.55, metalness: 0.04 }),
    table:   new THREE.MeshStandardMaterial({ map: texBois,   roughness: 0.62, metalness: 0.04, color: 0x8a5a30 }),
    leg:     new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.82 }),
    plate:   new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.22 }),
    candle:  new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.9 }),
    flame:   new THREE.MeshBasicMaterial({ color: 0xff9900 }),
    bar:     new THREE.MeshStandardMaterial({ map: texBois,   roughness: 0.32, metalness: 0.18 }),
    gold:    new THREE.MeshStandardMaterial({ color: 0xc4895a, roughness: 0.22, metalness: 0.72 }),
    glass:   new THREE.MeshStandardMaterial({ color: 0xa8c8e0, roughness: 0.04, transparent: true, opacity: 0.42 }),
    sign:    new THREE.MeshStandardMaterial({ map: texSign,   roughness: 0.5 }),
    menu:    new THREE.MeshStandardMaterial({ map: texMenu,   roughness: 0.6, metalness: 0.01 }),
    miroir:  new THREE.MeshStandardMaterial({ color: 0x88a0b0, roughness: 0.0, metalness: 1.0 }),
    shade:   new THREE.MeshStandardMaterial({ color: 0x2e1c0e, roughness: 0.55, side: THREE.DoubleSide }),
    plant:   new THREE.MeshStandardMaterial({ color: 0x2d5020, roughness: 0.9 }),
    pot:     new THREE.MeshStandardMaterial({ color: 0x8b6040, roughness: 0.7, metalness: 0.1 }),
    ciment:  new THREE.MeshStandardMaterial({ color: 0x1e1810, roughness: 0.95 }),
    awning:  new THREE.MeshStandardMaterial({ color: 0x1a0e06, roughness: 0.85, side: THREE.DoubleSide }),
  };

  /* ── HELPERS ─────────────────────────────────────────────── */
  function box(w, h, d, mat, x, y, z, ry) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m); return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z, ry) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = true;
    scene.add(m); return m;
  }
  function plane(w, d, mat, x, y, z, rx, ry) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.position.set(x, y, z);
    if (rx !== undefined) m.rotation.x = rx;
    if (ry !== undefined) m.rotation.y = ry;
    m.receiveShadow = true; scene.add(m); return m;
  }

  /* ── LUMIÈRES ────────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0xffddb0, 2.0));
  var dir = new THREE.DirectionalLight(0xffcc88, 0.9);
  dir.position.set(0, 8, 0); dir.castShadow = true;
  dir.shadow.mapSize.set(1024,1024); scene.add(dir);
  // Appliques murales
  var appL = new THREE.PointLight(0xff9944, 0.8, 14, 1.5);
  appL.position.set(-5.2, 2.4, -3); scene.add(appL);
  var appR = new THREE.PointLight(0xff9944, 0.8, 14, 1.5);
  appR.position.set(5.2, 2.4, -3); scene.add(appR);
  // Lumière extérieure (réverbère froid)
  var extLight = new THREE.PointLight(0x8898bb, 1.8, 18, 1.5);
  extLight.position.set(0, 5, 20); scene.add(extLight);

  /* ── SOL ─────────────────────────────────────────────────── */
  plane(12, 46, M.floor, 0, 0.001, -5, -Math.PI/2);
  plane(24, 18, M.pave,  0, 0,     22,  -Math.PI/2);
  // Trottoir surélevé devant l'entrée
  box(14, 0.12, 3, M.pave, 0, 0.06, 17.5);

  /* ── PLAFOND ─────────────────────────────────────────────── */
  plane(12, 46, M.ceiling, 0, 3.9, -5, Math.PI/2);

  /* ── MURS INTÉRIEURS ─────────────────────────────────────── */
  plane(46, 4.2, M.wall, -6, 2,  -5, 0,  Math.PI/2);
  plane(46, 4.2, M.wall,  6, 2,  -5, 0, -Math.PI/2);
  plane(12, 4.2, M.wall,  0, 2, -28);

  /* ── CIMAISE (moulure mi-hauteur) ────────────────────────── */
  box(11.8, 0.05, 0.12, M.gold, 0, 1.4, -5.9);
  box(11.8, 0.05, 0.12, M.gold, 0, 1.4,  5.9);

  /* ── FAÇADE + DEVANTURE ──────────────────────────────────── */
  // Panneau gauche
  box(2.5, 4.2, 0.28, M.facade, -4.25, 2, 16);
  // Panneau droit
  box(2.5, 4.2, 0.28, M.facade,  4.25, 2, 16);
  // Imposte (dessus porte)
  box(3.5, 0.7, 0.28, M.facade,  0, 3.55, 16);
  // Corniche haute (frise dorée)
  box(11.5, 0.12, 0.35, M.gold, 0, 4.02, 16);
  // Soubassement bas
  box(11.5, 0.28, 0.35, M.ciment, 0, 0.14, 16);

  // Fenêtres de vitrine (gauche et droite)
  box(1.8, 2.2, 0.1, M.glass, -4.0, 1.6, 15.92);
  box(1.8, 2.2, 0.1, M.glass,  4.0, 1.6, 15.92);
  // Encadrements fenêtres
  [[-4.0],[ 4.0]].forEach(function(cx) {
    box(1.88, 0.06, 0.15, M.gold, cx[0], 2.72, 15.92);
    box(1.88, 0.06, 0.15, M.gold, cx[0], 0.5,  15.92);
    box(0.06, 2.24, 0.15, M.gold, cx[0]-0.93, 1.6, 15.92);
    box(0.06, 2.24, 0.15, M.gold, cx[0]+0.93, 1.6, 15.92);
  });

  // Enseigne "Arcadia" sur la façade
  var signM = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.62, 0.08), M.sign);
  signM.position.set(0, 3.05, 15.95); scene.add(signM);

  // Cadre doré enseigne
  box(4.3, 0.72, 0.06, M.gold, 0, 3.05, 15.98);

  /* ── PORTE (vraie porte à 2 battants) ───────────────────── */
  // Cadre porte
  box(0.09, 3.4, 0.22, M.gold, -1.52, 1.8, 15.9);
  box(0.09, 3.4, 0.22, M.gold,  1.52, 1.8, 15.9);
  box(3.12, 0.09, 0.22, M.gold, 0, 3.3, 15.9);
  // Seuil
  box(3.1, 0.06, 0.25, M.gold, 0, 0.03, 15.9);

  // Panneau porte gauche — légèrement entrouverte
  var doorL = new THREE.Group();
  var dpL = new THREE.Mesh(new THREE.BoxGeometry(1.38, 3.2, 0.08), M.door);
  dpL.position.x = -0.69;
  // Panneaux moulurés sur la porte
  [-0.95, 0.65].forEach(function(py) {
    var mp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.04), M.door);
    mp.position.set(-0.69, py, 0.05); doorL.add(mp);
  });
  doorL.add(dpL);
  // Poignée gauche
  var handleG = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), M.gold);
  handleG.rotation.z = Math.PI/2; handleG.position.set(-0.2, 0.0, 0.1); doorL.add(handleG);
  doorL.position.set(1.52, 1.75, 15.9);
  doorL.rotation.y = -0.22; // légèrement entrouverte
  scene.add(doorL);

  // Panneau porte droite
  var doorR = new THREE.Group();
  var dpR = new THREE.Mesh(new THREE.BoxGeometry(1.38, 3.2, 0.08), M.door);
  dpR.position.x = 0.69;
  [-0.95, 0.65].forEach(function(py) {
    var mp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.04), M.door);
    mp.position.set(0.69, py, 0.05); doorR.add(mp);
  });
  doorR.add(dpR);
  var handleD = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), M.gold);
  handleD.rotation.z = Math.PI/2; handleD.position.set(0.2, 0.0, 0.1); doorR.add(handleD);
  doorR.position.set(-1.52, 1.75, 15.9);
  doorR.rotation.y = 0.22;
  scene.add(doorR);

  /* ── AUVENT / MARQUISE ───────────────────────────────────── */
  // Structure
  box(5.5, 0.07, 1.4, M.awning, 0, 4.12, 15.3);
  // Tissu (léger penché)
  var awFront = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.45), M.awning);
  awFront.position.set(0, 3.7, 14.85); awFront.rotation.x = 0.3; scene.add(awFront);
  // Tringles dorées auvent
  box(5.52, 0.04, 0.04, M.gold, 0, 3.38, 14.55);
  box(5.52, 0.04, 0.04, M.gold, 0, 4.16, 16.0);

  /* ── RÉVERBÈRE EXTÉRIEUR ─────────────────────────────────── */
  function createLantern(x, z) {
    cyl(0.03, 0.03, 3.8, 8, M.ciment, x, 1.9, z);
    box(0.16, 0.32, 0.16, M.ciment, x, 3.88, z);
    var lp = new THREE.PointLight(0xffcc77, 1.5, 10, 2);
    lp.position.set(x, 3.78, z); scene.add(lp);
    // Halo
    var hm = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    var hg = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), hm);
    hg.position.set(x, 3.78, z); scene.add(hg);
  }
  createLantern(-5.5, 20);
  createLantern( 5.5, 20);

  /* ── PLANTES EN POT (entrée) ─────────────────────────────── */
  function createPlant(x, z) {
    // Pot
    cyl(0.22, 0.18, 0.42, 12, M.pot, x, 0.21, z);
    // Feuilles (sphère aplatie verte)
    var fm = M.plant.clone();
    var fe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 5), fm);
    fe.scale.y = 1.3; fe.position.set(x, 0.7, z);
    fe.castShadow = true; scene.add(fe);
    var fe2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), fm);
    fe2.scale.set(1.2, 1.4, 0.9); fe2.position.set(x+0.12, 0.88, z-0.08);
    scene.add(fe2);
  }
  createPlant(-2.4, 16.5);
  createPlant( 2.4, 16.5);

  /* ── TABLES ──────────────────────────────────────────────── */
  var candleData = [];

  function createTable(x, z) {
    box(1.48, 0.07, 0.96, M.table, x, 0.8, z);
    cyl(0.04, 0.04, 0.8, 8, M.leg, x, 0.4, z);
    cyl(0.3, 0.3, 0.035, 12, M.leg, x, 0.018, z);
    // Nappe (légèrement plus grande)
    box(1.55, 0.005, 1.02, new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.7 }), x, 0.84, z);
    // Assiettes + verres
    cyl(0.22, 0.22, 0.018, 16, M.plate, x, 0.85, z - 0.2);
    cyl(0.22, 0.22, 0.018, 16, M.plate, x, 0.85, z + 0.2);
    cyl(0.055, 0.04, 0.2, 10, M.glass, x + 0.32, 0.95, z - 0.2);
    cyl(0.055, 0.04, 0.2, 10, M.glass, x + 0.32, 0.95, z + 0.2);
    // Bouteille d'eau
    cyl(0.04, 0.038, 0.28, 8, M.glass, x - 0.32, 0.97, z);

    // Bougie
    cyl(0.028, 0.028, 0.16, 8, M.candle, x, 0.93, z);
    var flm = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.055, 6), M.flame);
    flm.position.set(x, 1.02, z); scene.add(flm);
    var glm = new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
    var gls = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), glm);
    gls.position.set(x, 1.02, z); scene.add(gls);
    var pl = new THREE.PointLight(0xffcc66, 2.4, 4.5, 2);
    pl.position.set(x, 1.1, z); scene.add(pl);
    candleData.push({ light: pl, flame: flm, glow: gls, offset: Math.random()*Math.PI*2, base: 2.4 });
  }

  // 4 tables à gauche, 4 à droite
  createTable(-3.2,  7);
  createTable(-3.2,  1.0); // <- table où on s'arrête pour la carte
  createTable(-3.2, -5);
  createTable(-3.2,-11);
  createTable( 3.2,  7);
  createTable( 3.2,  1.0);
  createTable( 3.2, -5);
  createTable( 3.2,-11);

  /* ── CARTE / MENU sur la table (−3.2, z=1) ──────────────── */
  var menuObj = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.008, 0.42), M.menu);
  menuObj.position.set(-3.2, 0.862, 0.9);
  menuObj.rotation.y = 0.2; // légèrement de biais
  menuObj.castShadow = true;
  scene.add(menuObj);
  // Tranche du menu
  var menuSpine = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.012, 0.43),
    new THREE.MeshStandardMaterial({ color: 0xc4895a, roughness: 0.3, metalness: 0.5 }));
  menuSpine.position.set(-3.2, 0.858, 0.9); menuSpine.rotation.y = 0.2; scene.add(menuSpine);

  /* ── LUMINAIRES PLAFOND ──────────────────────────────────── */
  function createPendant(x, z) {
    box(0.014, 0.7, 0.014, M.leg, x, 3.55, z);
    var sh = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 12, 1, true), M.shade);
    sh.position.set(x, 3.05, z); scene.add(sh);
    // Ampoule
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffee99 }));
    bulb.position.set(x, 2.88, z); scene.add(bulb);
    var pl = new THREE.PointLight(0xffcc88, 1.1, 6, 2);
    pl.position.set(x, 2.72, z); scene.add(pl);
  }
  createPendant(-3.2, 7);   createPendant(3.2, 7);
  createPendant(-3.2, 1);   createPendant(3.2, 1);
  createPendant(-3.2,-5);   createPendant(3.2,-5);
  createPendant(-3.2,-11);  createPendant(3.2,-11);
  createPendant(0, 4); createPendant(0, -1); createPendant(0, -7);

  /* ── BAR ─────────────────────────────────────────────────── */
  box(9, 1.14, 0.74, M.bar, 0, 0.57, -23.5);
  box(9, 0.06, 0.8, M.gold, 0, 1.17, -23.5);
  plane(9, 4, M.wall, 0, 2, -27.4);
  box(6.2, 0.05, 0.3, M.gold, 0, 2.45, -27.2);
  box(6.2, 0.05, 0.3, M.gold, 0, 1.88, -27.2);
  for (var bi = 0; bi < 10; bi++) {
    var bx = -3.2 + bi * 0.72;
    var bcol = bi%3===0 ? 0x2a4020 : bi%3===1 ? 0x1e2d4a : 0x3a1a10;
    var bmat = new THREE.MeshStandardMaterial({ color: bcol, roughness: 0.08, metalness: 0.55, transparent: true, opacity: 0.8 });
    cyl(0.046, 0.04, 0.35, 8, bmat, bx, 2.63, -27.2);
    cyl(0.046, 0.04, 0.3, 8, bmat, bx, 2.05, -27.2);
  }
  box(5.5, 1.9, 0.06, M.miroir, 0, 2.35, -27.36);
  box(5.62, 0.06, 0.1, M.gold, 0, 3.32, -27.3);
  box(5.62, 0.06, 0.1, M.gold, 0, 1.42, -27.3);
  var barPL = new THREE.PointLight(0xffcc88, 1.5, 10, 2);
  barPL.position.set(0, 2.2, -22.5); scene.add(barPL);

  /* ── CHAISES (simplifiées) ───────────────────────────────── */
  function chair(x, z, ry) {
    var g = new THREE.Group();
    var seatM = new THREE.MeshStandardMaterial({ color: 0x5c3a20, roughness: 0.65 });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.44), seatM); seat.position.y = 0.48; g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), seatM); back.position.set(0, 0.76, -0.2); g.add(back);
    [[-0.21, -0.18],[0.21, -0.18],[-0.21, 0.18],[0.21, 0.18]].forEach(function(p) {
      var l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), M.leg); l.position.set(p[0], 0.24, p[1]); g.add(l);
    });
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    g.traverse(function(c) { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
    scene.add(g);
  }
  [[-3.2,7],[-3.2,1.0],[-3.2,-5],[-3.2,-11],[3.2,7],[3.2,1.0],[3.2,-5],[3.2,-11]].forEach(function(t) {
    chair(t[0]-0.82, t[1], Math.PI/2);
    chair(t[0]+0.82, t[1], -Math.PI/2);
    chair(t[0], t[1]-0.68, 0);
    chair(t[0], t[1]+0.68, Math.PI);
  });

  /* ── PARTICULES (ambiance) ───────────────────────────────── */
  var PC = 320;
  var pPos = new Float32Array(PC * 3);
  var pVel = new Float32Array(PC);
  for (var pi = 0; pi < PC; pi++) {
    pPos[pi*3]   = (Math.random()-0.5) * 10;
    pPos[pi*3+1] = Math.random() * 3.6;
    pPos[pi*3+2] = Math.random() * -42 + 18;
    pVel[pi] = 0.0004 + Math.random() * 0.0006;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xc4895a, size: 0.018, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })));

  /* ── WAYPOINTS DE CAMÉRA ─────────────────────────────────── */
  var WP = [
    { px:0,    py:1.75, pz:24,   lx:0,    ly:1.6,  lz:14   }, // Dehors rue, vue façade
    { px:0,    py:1.72, pz:18.5, lx:0,    ly:1.65, lz:10   }, // Juste devant la porte
    { px:0,    py:1.68, pz:11,   lx:0,    ly:1.55, lz:0    }, // On entre dans la salle
    { px:0,    py:1.62, pz:3.5,  lx:0,    ly:1.45, lz:-8   }, // Milieu restaurant
    // ── ARRÊT AU-DESSUS DE LA TABLE : on voit la carte
    { px:-2.8, py:1.15, pz:2.2,  lx:-3.2, ly:0.86, lz:0.9  }, // Assis, regard sur la carte posée
    { px:0,    py:1.58, pz:-12,  lx:0,    ly:1.42, lz:-22  }, // Vers le bar
    { px:0,    py:1.42, pz:-20,  lx:0,    ly:1.55, lz:-27  }, // Au bar
  ];

  window._sceneProgress = 0;

  function lerp3(a, b, t) {
    t = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    return { px:a.px+(b.px-a.px)*t, py:a.py+(b.py-a.py)*t, pz:a.pz+(b.pz-a.pz)*t,
             lx:a.lx+(b.lx-a.lx)*t, ly:a.ly+(b.ly-a.ly)*t, lz:a.lz+(b.lz-a.lz)*t };
  }

  function getWP(p) {
    var n = WP.length - 1, s = p * n, i = Math.min(Math.floor(s), n-1);
    return lerp3(WP[i], WP[Math.min(i+1, n)], s - i);
  }

  /* ── BOUCLE ──────────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var lv = new THREE.Vector3();
  var sm = { px:WP[0].px, py:WP[0].py, pz:WP[0].pz, lx:WP[0].lx, ly:WP[0].ly, lz:WP[0].lz };

  function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    var wp = getWP(window._sceneProgress || 0);
    var k = 0.052;
    ['px','py','pz','lx','ly','lz'].forEach(function(key) { sm[key] += (wp[key] - sm[key]) * k; });
    camera.position.set(sm.px, sm.py, sm.pz);
    lv.set(sm.lx, sm.ly, sm.lz);
    camera.lookAt(lv);

    candleData.forEach(function(c) {
      var f = 1 + 0.18*Math.sin(t*7.3+c.offset) + 0.1*Math.sin(t*14.1+c.offset*1.7);
      c.light.intensity = c.base * f;
      c.flame.scale.y = 0.82 + 0.2*Math.sin(t*8.7+c.offset);
      c.glow.scale.setScalar(0.88 + 0.14*Math.sin(t*5+c.offset));
    });

    var pa = pGeo.attributes.position;
    for (var i = 0; i < PC; i++) {
      pa.array[i*3+1] += pVel[i];
      if (pa.array[i*3+1] > 3.7) pa.array[i*3+1] = 0;
    }
    pa.needsUpdate = true;
    renderer.render(scene, camera);
  }
  tick();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
