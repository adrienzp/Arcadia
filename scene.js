/* ============================================================
   ARCADIA — scene.js
   Restaurant 3D complet avec Three.js
   La caméra avance au scroll — tu entres dans le restaurant
   ============================================================ */

(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  /* ── RENDERER ─────────────────────────────────────────── */
  var canvas = document.getElementById('scene-canvas');
  if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ── SCENE ────────────────────────────────────────────── */
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0f07);
  scene.fog = new THREE.FogExp2(0x1a0f07, 0.045);

  /* ── CAMERA ───────────────────────────────────────────── */
  var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 80);
  var camPos = { x: 0, y: 1.75, z: 22 };
  var lookAt  = { x: 0, y: 1.5,  z: 0  };
  camera.position.set(camPos.x, camPos.y, camPos.z);

  /* ── MATÉRIAUX ────────────────────────────────────────── */
  var M = {
    // Parquet bois chaud — comme le vrai Arcadia
    floor:    new THREE.MeshStandardMaterial({ color: 0x7a4e2a, roughness: 0.55, metalness: 0.08 }),
    ceiling:  new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.92 }),
    // Murs crème/beige chaud
    wall:     new THREE.MeshStandardMaterial({ color: 0xc8b090, roughness: 0.85 }),
    wallDark: new THREE.MeshStandardMaterial({ color: 0x3d2a18, roughness: 0.92 }),
    // Tables bois foncé
    table:    new THREE.MeshStandardMaterial({ color: 0x5c3a20, roughness: 0.65, metalness: 0.04 }),
    leg:      new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.82, metalness: 0.08 }),
    plate:    new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.22, metalness: 0.06 }),
    candle:   new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.9 }),
    flame:    new THREE.MeshBasicMaterial({ color: 0xff8800 }),
    // Bar bois sombre
    bar:      new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.32, metalness: 0.18 }),
    gold:     new THREE.MeshStandardMaterial({ color: 0xc4895a, roughness: 0.22, metalness: 0.72 }),
    glass:    new THREE.MeshStandardMaterial({ color: 0x8ab0c8, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.45 }),
    ext:      new THREE.MeshStandardMaterial({ color: 0x1a0f07, roughness: 0.95 }),
    // Façade extérieure sombre (contraste avec l'intérieur chaud)
    facade:   new THREE.MeshStandardMaterial({ color: 0x2a1e12, roughness: 0.82 }),
    shade:    new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.55, side: THREE.DoubleSide }),
  };

  /* ── HELPERS ──────────────────────────────────────────── */
  function box(w, h, d, mat, x, y, z, ry) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m); return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    scene.add(m); return m;
  }
  function plane(w, d, mat, x, y, z, rx, ry) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry;
    m.receiveShadow = true;
    scene.add(m); return m;
  }

  /* ── LUMIÈRES GLOBALES ────────────────────────────────── */
  // Ambiance générale chaude — comme un bistro bien éclairé le soir
  scene.add(new THREE.AmbientLight(0xffddb0, 1.8));
  // Lumière directionnelle douce depuis le plafond
  var dirLight = new THREE.DirectionalLight(0xffcc88, 0.8);
  dirLight.position.set(0, 8, 0); dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);
  // Lumière chaude depuis les murs (simule les appliques)
  var wallLightL = new THREE.PointLight(0xff9944, 0.6, 12, 1.5);
  wallLightL.position.set(-5, 2.5, -3); scene.add(wallLightL);
  var wallLightR = new THREE.PointLight(0xff9944, 0.6, 12, 1.5);
  wallLightR.position.set(5, 2.5, -3); scene.add(wallLightR);

  /* ── SOL ──────────────────────────────────────────────── */
  // Intérieur
  plane(12, 44, M.floor, 0, 0, -5, -Math.PI / 2);
  // Extérieur (devant le resto)
  plane(20, 14, M.ext,   0, 0, 20, -Math.PI / 2);

  /* ── PLAFOND ──────────────────────────────────────────── */
  plane(12, 44, M.ceiling, 0, 3.8, -5, Math.PI / 2);

  /* ── MURS INTÉRIEURS ──────────────────────────────────── */
  // Fond
  plane(12, 4,  M.wall, 0, 1.9, -27);
  // Gauche
  plane(44, 4,  M.wall, -6, 1.9, -5, 0, Math.PI / 2);
  // Droite
  plane(44, 4,  M.wall,  6, 1.9, -5, 0, -Math.PI / 2);

  /* ── FAÇADE (mur avant avec porte) ───────────────────── */
  // Panneau gauche
  box(2.8, 4, 0.25, M.facade, -4.4, 1.9, 16);
  // Panneau droit
  box(2.8, 4, 0.25, M.facade,  4.4, 1.9, 16);
  // Dessus porte
  box(5, 0.9, 0.25, M.facade,  0, 3.65, 16);
  // Moulure dorée autour de la porte
  box(0.08, 3.3, 0.28, M.gold, -1.52, 1.8, 15.92);
  box(0.08, 3.3, 0.28, M.gold,  1.52, 1.8, 15.92);
  box(3.12, 0.08, 0.28, M.gold, 0, 3.2, 15.92);
  // Sol extérieur devant l'entrée (marche)
  box(3.5, 0.06, 1.0, M.gold, 0, 0.03, 16.8);

  /* ── LIGNE MURALE DORÉE (décoration) ─────────────────── */
  box(11.8, 0.025, 0.07, M.gold, 0, 1.5, -6.0);
  box(0.025, 3.8, 0.07, M.gold, -5.95, 1.9, -5, 0);

  /* ── TABLES + BOUGIES ─────────────────────────────────── */
  var candleData = [];

  function createTable(x, z) {
    // Plateau
    box(1.45, 0.065, 0.95, M.table, x, 0.8, z);
    // Pied
    cyl(0.04, 0.04, 0.8, 8, M.leg, x, 0.4, z);
    cyl(0.28, 0.28, 0.03, 12, M.leg, x, 0.015, z);
    // Assiettes
    cyl(0.22, 0.22, 0.018, 16, M.plate, x, 0.838, z - 0.18);
    cyl(0.22, 0.22, 0.018, 16, M.plate, x, 0.838, z + 0.18);
    // Verre (cylindre transparent)
    cyl(0.055, 0.04, 0.18, 10, M.glass, x + 0.3, 0.93, z - 0.18);
    cyl(0.055, 0.04, 0.18, 10, M.glass, x + 0.3, 0.93, z + 0.18);

    // Bougie
    var cy  = cyl(0.026, 0.026, 0.15, 8, M.candle, x, 0.9, z);
    var flm = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.05, 6), M.flame);
    flm.position.set(x, 0.98, z);
    scene.add(flm);

    // Halo de lueur autour de la flamme
    var glowM = new THREE.MeshBasicMaterial({
      color: 0xff8833, transparent: true, opacity: 0.09,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
    });
    var glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), glowM);
    glow.position.set(x, 0.98, z);
    scene.add(glow);

    // PointLight bougie
    var pl = new THREE.PointLight(0xffcc66, 2.2, 4.5, 2);
    pl.position.set(x, 1.05, z);
    scene.add(pl);

    candleData.push({ light: pl, flame: flm, glow: glow, offset: Math.random() * Math.PI * 2, base: 2.2 });
  }

  // 4 tables gauche, 4 droite
  createTable(-3.2,  6);
  createTable(-3.2,  1);
  createTable(-3.2, -5);
  createTable(-3.2,-11);
  createTable( 3.2,  6);
  createTable( 3.2,  1);
  createTable( 3.2, -5);
  createTable( 3.2,-11);

  /* ── LUMINAIRES PLAFOND ───────────────────────────────── */
  function createPendant(x, z) {
    box(0.012, 0.7, 0.012, M.leg, x, 3.45, z);
    var sh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 10, 1, true), M.shade);
    sh.position.set(x, 2.95, z); scene.add(sh);
    var pl = new THREE.PointLight(0xffcc88, 1.0, 6, 2);
    pl.position.set(x, 2.7, z); pl.castShadow = false;
    scene.add(pl);
  }
  createPendant(-3.2, 6);   createPendant(3.2, 6);
  createPendant(-3.2, 1);   createPendant(3.2, 1);
  createPendant(-3.2, -5);  createPendant(3.2, -5);
  createPendant(-3.2,-11);  createPendant(3.2,-11);
  // Pendentif central aisle
  createPendant(0, 3); createPendant(0, -2); createPendant(0, -8);

  /* ── BAR / COMPTOIR ───────────────────────────────────── */
  // Comptoir
  box(9, 1.12, 0.72, M.bar, 0, 0.56, -23.5);
  box(9, 0.055, 0.78, M.gold, 0, 1.15, -23.5);
  // Arrière-bar
  plane(9, 3.6, M.wallDark, 0, 1.8, -27);
  // Étagères
  box(6, 0.04, 0.28, M.gold, 0, 2.4, -26.85);
  box(6, 0.04, 0.28, M.gold, 0, 1.85, -26.85);
  // Bouteilles
  for (var bi = 0; bi < 9; bi++) {
    var bx2 = -2.8 + bi * 0.7;
    var bcol = bi % 3 === 0 ? 0x2a4020 : bi % 3 === 1 ? 0x1a2540 : 0x3a1a10;
    var bmat = new THREE.MeshStandardMaterial({ color: bcol, roughness: 0.08, metalness: 0.55, transparent: true, opacity: 0.8 });
    cyl(0.045, 0.04, 0.34, 8, bmat, bx2, 2.59, -26.85);
    cyl(0.045, 0.04, 0.30, 8, bmat, bx2, 2.04, -26.85);
  }
  // Lumière bar
  var barPL = new THREE.PointLight(0xffcc88, 1.4, 9, 2);
  barPL.position.set(0, 2.2, -22); scene.add(barPL);
  // Petit miroir derrière le bar
  var mirrorM = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.0, metalness: 1.0, envMapIntensity: 1.5 });
  box(5, 1.8, 0.04, mirrorM, 0, 2.3, -26.94);
  box(5.12, 0.05, 0.1, M.gold, 0, 3.22, -26.9);
  box(5.12, 0.05, 0.1, M.gold, 0, 1.42, -26.9);

  /* ── CHAISES (simples) ────────────────────────────────── */
  function createChair(x, z, angle) {
    var g = new THREE.Group();
    // Assise
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.46), M.table);
    seat.position.y = 0.48;
    // Dossier
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.04), M.table);
    back.position.set(0, 0.77, -0.21);
    // Pieds
    [[-0.22, 0, -0.19], [0.22, 0, -0.19], [-0.22, 0, 0.19], [0.22, 0, 0.19]].forEach(function(p) {
      var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), M.leg);
      leg2.position.set(p[0], 0.24, p[2]);
      g.add(leg2);
    });
    g.add(seat); g.add(back);
    g.position.set(x, 0, z);
    g.rotation.y = angle || 0;
    g.traverse(function(c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(g);
  }

  // Chaises autour des tables
  [[-3.2,6],[-3.2,1],[-3.2,-5],[-3.2,-11],[3.2,6],[3.2,1],[3.2,-5],[3.2,-11]].forEach(function(t) {
    createChair(t[0]-0.78, t[1], Math.PI / 2);
    createChair(t[0]+0.78, t[1], -Math.PI / 2);
    createChair(t[0], t[1]-0.65, 0);
    createChair(t[0], t[1]+0.65, Math.PI);
  });

  /* ── PARTICULES ────────────────────────────────────────── */
  var PC = 300;
  var pPos = new Float32Array(PC * 3);
  var pVel = new Float32Array(PC);
  for (var pi = 0; pi < PC; pi++) {
    pPos[pi*3]   = (Math.random() - 0.5) * 10;
    pPos[pi*3+1] = Math.random() * 3.5;
    pPos[pi*3+2] = Math.random() * -40 + 18;
    pVel[pi] = 0.0004 + Math.random() * 0.0006;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xc4895a, size: 0.018, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ── WAYPOINTS DE CAMÉRA ──────────────────────────────── */
  // Progression 0→1 (contrôlée par le scroll via window._sceneProgress)
  var WP = [
    { px:0,  py:1.75, pz:22,  lx:0,  ly:1.5,  lz:15  }, // Dehors, vue façade
    { px:0,  py:1.75, pz:17,  lx:0,  ly:1.65, lz:8   }, // Devant la porte
    { px:0,  py:1.7,  pz:10,  lx:0,  ly:1.55, lz:0   }, // On vient d'entrer
    { px:0,  py:1.65, pz:3,   lx:0,  ly:1.45, lz:-8  }, // Milieu restaurant
    { px:-0.4,py:1.55,pz:-5,  lx:0,  ly:0.9,  lz:-6  }, // À une table, regard assiette
    { px:0,  py:1.6,  pz:-14, lx:0,  ly:1.4,  lz:-22 }, // Vers le bar
    { px:0,  py:1.45, pz:-20, lx:0,  ly:1.6,  lz:-26 }, // Au bar, regardant les bouteilles
  ];

  window._sceneProgress = 0;

  function lerp3(a, b, t) {
    // Ease cubic in-out
    t = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    return { px: a.px+(b.px-a.px)*t, py: a.py+(b.py-a.py)*t, pz: a.pz+(b.pz-a.pz)*t,
             lx: a.lx+(b.lx-a.lx)*t, ly: a.ly+(b.ly-a.ly)*t, lz: a.lz+(b.lz-a.lz)*t };
  }

  function getWaypoint(p) {
    var n = WP.length - 1;
    var s = p * n;
    var i = Math.min(Math.floor(s), n - 1);
    return lerp3(WP[i], WP[Math.min(i+1, n)], s - i);
  }

  /* ── BOUCLE D'ANIMATION ───────────────────────────────── */
  var clock = new THREE.Clock();
  var lv = new THREE.Vector3();
  var smooth = { px:WP[0].px, py:WP[0].py, pz:WP[0].pz, lx:WP[0].lx, ly:WP[0].ly, lz:WP[0].lz };

  function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();

    // Lerp caméra (smooth, décalé derrière le scroll)
    var wp = getWaypoint(window._sceneProgress || 0);
    var k = 0.055;
    smooth.px += (wp.px - smooth.px) * k;
    smooth.py += (wp.py - smooth.py) * k;
    smooth.pz += (wp.pz - smooth.pz) * k;
    smooth.lx += (wp.lx - smooth.lx) * k;
    smooth.ly += (wp.ly - smooth.ly) * k;
    smooth.lz += (wp.lz - smooth.lz) * k;

    camera.position.set(smooth.px, smooth.py, smooth.pz);
    lv.set(smooth.lx, smooth.ly, smooth.lz);
    camera.lookAt(lv);

    // Scintillement bougies
    candleData.forEach(function(c) {
      var f = 1 + 0.18 * Math.sin(t * 7.3 + c.offset) + 0.1 * Math.sin(t * 14.1 + c.offset * 1.7);
      c.light.intensity = c.base * f;
      c.flame.scale.y   = 0.85 + 0.18 * Math.sin(t * 8.7 + c.offset);
      c.flame.position.x += 0.0004 * Math.sin(t * 6.2 + c.offset);
      c.glow.scale.setScalar(0.9 + 0.12 * Math.sin(t * 5 + c.offset));
    });

    // Particules montent doucement
    var pa = pGeo.attributes.position;
    for (var i = 0; i < PC; i++) {
      pa.array[i*3+1] += pVel[i];
      if (pa.array[i*3+1] > 3.6) pa.array[i*3+1] = 0;
    }
    pa.needsUpdate = true;

    renderer.render(scene, camera);
  }
  tick();

  /* ── RESIZE ───────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
