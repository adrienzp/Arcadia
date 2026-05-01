/* ============================================================
   ARCADIA — scene.js  (v4)
   Espace naturel · Portes animées · Ambiance bistrot
   ============================================================ */

(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('scene-canvas');
  if (!canvas) return;

  /* ── RENDERER ────────────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100a04);
  // Fog plus léger et chaud — donne de la profondeur sans noyer l'espace
  scene.fog = new THREE.Fog(0x1e1206, 18, 55);

  var camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 80);

  /* ═══════════════════════════════════════════════════════════
     TEXTURES PROCÉDURALES
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

  // Parquet — planches avec grain naturel
  var texFloor = makeTex(512, 512, function (ctx, w, h) {
    var colors = ['#8a5530','#7a4a26','#956040','#6e4020','#a06040'];
    var plankH = 48;
    for (var y = 0; y < h; y += plankH) {
      var ci = Math.floor(y / plankH) % colors.length;
      ctx.fillStyle = colors[ci];
      ctx.fillRect(0, y, w, plankH - 1);
      ctx.globalAlpha = 0.15;
      for (var i = 0; i < 22; i++) {
        var gy = y + Math.random() * plankH;
        ctx.strokeStyle = Math.random() > 0.5 ? '#3a1e0a' : '#b07848';
        ctx.lineWidth = 0.3 + Math.random() * 0.9;
        ctx.beginPath(); ctx.moveTo(0, gy);
        ctx.bezierCurveTo(w*.3, gy+(Math.random()-.5)*5, w*.7, gy+(Math.random()-.5)*5, w, gy+(Math.random()-.5)*3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, y + plankH - 1, w, 1);
      if (Math.floor(y / plankH) % 3 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(w * (0.3 + Math.random()*0.12), y, 1, plankH);
      }
    }
  }, 3, 9);

  // Mur crème chaude — enduit plâtre
  var texWall = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#cdb898';
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < 9000; i++) {
      var x = Math.random()*w, y = Math.random()*h;
      ctx.globalAlpha = Math.random()*0.055;
      ctx.fillStyle = Math.random()>.5 ? '#fff' : '#000';
      ctx.fillRect(x, y, 1 + Math.random()*2, 1 + Math.random()*2);
    }
    ctx.globalAlpha = 0.035;
    for (var j = 0; j < h; j += 2) {
      ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(w,j); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, 2, 3);

  // Pavé extérieur
  var texPave = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(0, 0, w, h);
    var tw = 88, th = 48, offset = 0;
    for (var ry = 0; ry < h + th; ry += th) {
      offset = (Math.floor(ry/th) % 2 === 0) ? 0 : tw/2;
      for (var rx = -offset; rx < w + tw; rx += tw) {
        var v = (Math.random()-.5)*18;
        var b = 46 + Math.round(v);
        ctx.fillStyle = 'rgb('+(b+6)+','+b+','+(b-4)+')';
        ctx.fillRect(rx+2, ry+2, tw-4, th-4);
        ctx.globalAlpha = 0.07;
        for (var k = 0; k < 25; k++) {
          ctx.fillStyle = Math.random()>.5?'#fff':'#000';
          ctx.fillRect(rx+2+Math.random()*(tw-4), ry+2+Math.random()*(th-4), 2, 2);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(rx+2, ry+2, tw-4, th-4);
      }
    }
  }, 5, 7);

  // Bois sombre
  var texBois = makeTex(256, 512, function (ctx, w, h) {
    ctx.fillStyle = '#3e2410';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.24;
    for (var i = 0; i < 35; i++) {
      ctx.strokeStyle = Math.random()>.5 ? '#1e0c04' : '#5e3820';
      ctx.lineWidth = 0.4 + Math.random()*1.8;
      var y0 = Math.random()*h;
      ctx.beginPath(); ctx.moveTo(0, y0);
      ctx.bezierCurveTo(w*.3, y0+(Math.random()-.5)*10, w*.7, y0+(Math.random()-.5)*10, w, y0+(Math.random()-.5)*7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, 1, 3);

  // Façade
  var texFacade = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#181008';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.1;
    for (var i = 0; i < 6000; i++) {
      var x = Math.random()*w, y = Math.random()*h;
      ctx.beginPath(); ctx.arc(x, y, Math.random()*1.8, 0, Math.PI*2);
      ctx.fillStyle = Math.random()>.5?'#fff':'#000'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, 2, 3);

  // Enseigne
  var texSign = makeTex(512, 128, function (ctx, w, h) {
    ctx.fillStyle = '#120a04';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c4895a'; ctx.lineWidth = 2.5;
    ctx.strokeRect(5, 5, w-10, h-10);
    ctx.strokeStyle = 'rgba(196,137,90,0.4)'; ctx.lineWidth = 0.8;
    ctx.strokeRect(11, 11, w-22, h-22);
    ctx.fillStyle = '#d4a070';
    ctx.font = 'italic 60px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Arcadia', w/2, h/2 - 4);
    ctx.font = '11px Georgia'; ctx.fillStyle = 'rgba(196,137,90,0.6)';
    ctx.fillText('✦  Restaurant  ✦', w/2, h*0.84);
  }, 1, 1);

  // Tableau abstrait (art mural)
  function makeArtwork(seed) {
    return makeTex(256, 320, function (ctx, w, h) {
      var bg = seed % 3 === 0 ? '#1a1206' : seed % 3 === 1 ? '#0e1a10' : '#1a0e0a';
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var rng = function(n) { seed = (seed * 9301 + 49297) % 233280; return (seed / 233280) * (n||1); };
      for (var i = 0; i < 8; i++) {
        var gx = rng()*w, gy = rng()*h;
        var gr = ctx.createRadialGradient(gx,gy,0, gx,gy,80+rng()*60);
        var hues = ['rgba(196,137,90,0.35)','rgba(120,80,40,0.25)','rgba(200,160,80,0.2)','rgba(80,120,60,0.2)'];
        gr.addColorStop(0, hues[Math.floor(rng()*hues.length)]);
        gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      }
      for (var j = 0; j < 3; j++) {
        ctx.strokeStyle = 'rgba(196,137,90,'+(0.15+rng()*0.25)+')';
        ctx.lineWidth = 0.5 + rng()*1.5;
        ctx.beginPath(); ctx.moveTo(rng()*w, rng()*h);
        ctx.bezierCurveTo(rng()*w,rng()*h, rng()*w,rng()*h, rng()*w,rng()*h);
        ctx.stroke();
      }
    }, 1, 1);
  }

  // Menu (carte sur table)
  var texMenu = makeTex(256, 360, function (ctx, w, h) {
    ctx.fillStyle = '#f5efe4'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c4895a'; ctx.lineWidth = 3; ctx.strokeRect(8, 8, w-16, h-16);
    ctx.strokeStyle = 'rgba(196,137,90,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(14, 14, w-28, h-28);
    ctx.fillStyle = '#2e1808'; ctx.font = 'italic bold 28px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('Arcadia', w/2, 50);
    ctx.strokeStyle = '#c4895a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28,62); ctx.lineTo(w-28,62); ctx.stroke();
    function sec(title, items, sy) {
      ctx.fillStyle = '#c4895a'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'left';
      ctx.fillText(title.toUpperCase(), 28, sy);
      ctx.strokeStyle = 'rgba(196,137,90,0.25)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(28,sy+5); ctx.lineTo(w-28,sy+5); ctx.stroke();
      ctx.fillStyle = '#3a2010'; ctx.font = '11px Georgia';
      items.forEach(function(it, i) {
        ctx.textAlign='left'; ctx.fillText(it[0], 28, sy+18+i*18);
        ctx.textAlign='right'; ctx.fillText(it[1], w-28, sy+18+i*18);
      });
    }
    sec('Entrées',[['Velouté du moment','9€'],['Tartare de saumon','12€'],['Burrata locale','11€']], 80);
    sec('Plats',[['Magret de canard','19€'],['Fromage chaud du Jura','17€'],['Risotto champignons','15€']], 155);
    sec('Desserts',[['Pavlova aux agrumes','5,50€'],['Tarte tatin','6€']], 248);
    ctx.fillStyle='rgba(90,56,32,0.5)'; ctx.font='italic 9px Georgia'; ctx.textAlign='center';
    ctx.fillText('Frais · Fait maison · De saison', w/2, h-18);
  }, 1, 1);

  /* ── MATÉRIAUX ───────────────────────────────────────────── */
  var M = {
    floor:   new THREE.MeshStandardMaterial({ map: texFloor, roughness: 0.58, metalness: 0.04 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xd5c4a0, roughness: 0.92 }),
    wall:    new THREE.MeshStandardMaterial({ map: texWall,  roughness: 0.88 }),
    pave:    new THREE.MeshStandardMaterial({ map: texPave,  roughness: 0.94 }),
    facade:  new THREE.MeshStandardMaterial({ map: texFacade, roughness: 0.86 }),
    door:    new THREE.MeshStandardMaterial({ map: texBois,  roughness: 0.52, metalness: 0.06 }),
    table:   new THREE.MeshStandardMaterial({ map: texBois,  roughness: 0.55, metalness: 0.06, color: 0x9a6840 }),
    beam:    new THREE.MeshStandardMaterial({ map: texBois,  roughness: 0.72, color: 0x5a3820 }),
    leg:     new THREE.MeshStandardMaterial({ color: 0x2e1a0a, roughness: 0.85 }),
    plate:   new THREE.MeshStandardMaterial({ color: 0xf8f3ec, roughness: 0.18 }),
    candle:  new THREE.MeshStandardMaterial({ color: 0xfff9f2, roughness: 0.92 }),
    flame:   new THREE.MeshBasicMaterial({ color: 0xffaa22 }),
    bar:     new THREE.MeshStandardMaterial({ map: texBois,  roughness: 0.28, metalness: 0.22, color: 0x6a4020 }),
    gold:    new THREE.MeshStandardMaterial({ color: 0xc4895a, roughness: 0.18, metalness: 0.78 }),
    glass:   new THREE.MeshStandardMaterial({ color: 0xaaccdd, roughness: 0.02, transparent: true, opacity: 0.38, metalness: 0.1 }),
    sign:    new THREE.MeshStandardMaterial({ map: texSign,  roughness: 0.45 }),
    menu:    new THREE.MeshStandardMaterial({ map: texMenu,  roughness: 0.55 }),
    miroir:  new THREE.MeshStandardMaterial({ color: 0x90aabb, roughness: 0.0, metalness: 1.0 }),
    shade:   new THREE.MeshStandardMaterial({ color: 0x281400, roughness: 0.6, side: THREE.DoubleSide }),
    plant:   new THREE.MeshStandardMaterial({ color: 0x2a5018, roughness: 0.92 }),
    pot:     new THREE.MeshStandardMaterial({ color: 0x8c6248, roughness: 0.72, metalness: 0.08 }),
    banq:    new THREE.MeshStandardMaterial({ color: 0x5c2e18, roughness: 0.7 }), // velours banquette
    cloth:   new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.82 }),
    frame:   new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.3, metalness: 0.6 }),
    art1:    new THREE.MeshStandardMaterial({ map: makeArtwork(123), roughness: 0.6 }),
    art2:    new THREE.MeshStandardMaterial({ map: makeArtwork(456), roughness: 0.6 }),
    art3:    new THREE.MeshStandardMaterial({ map: makeArtwork(789), roughness: 0.6 }),
    awning:  new THREE.MeshStandardMaterial({ color: 0x1a0c06, roughness: 0.88, side: THREE.DoubleSide }),
    ciment:  new THREE.MeshStandardMaterial({ color: 0x1a1408, roughness: 0.96 }),
    wine:    new THREE.MeshStandardMaterial({ color: 0x1a2a38, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.82 }),
    copper:  new THREE.MeshStandardMaterial({ color: 0xb87040, roughness: 0.25, metalness: 0.85 }),
  };

  /* ── HELPERS ─────────────────────────────────────────────── */
  function box(w, h, d, mat, x, y, z, ry) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m;
  }
  function plane(w, d, mat, x, y, z, rx, ry) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.position.set(x, y, z);
    if (rx !== undefined) m.rotation.x = rx;
    if (ry !== undefined) m.rotation.y = ry;
    m.receiveShadow = true; scene.add(m); return m;
  }

  /* ── LUMIÈRES ────────────────────────────────────────────── */
  // Ambiance générale chaude
  scene.add(new THREE.AmbientLight(0xffddb0, 1.8));

  // Lumière directionnelle douce (simule halo diffus intérieur)
  var sun = new THREE.DirectionalLight(0xffcc88, 0.6);
  sun.position.set(2, 7, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.far = 50;
  scene.add(sun);

  // Appliques murales (chaleur côtés)
  function wallLight(x, y, z) {
    var pl = new THREE.PointLight(0xff9940, 1.1, 12, 1.8);
    pl.position.set(x, y, z); scene.add(pl);
    return pl;
  }
  wallLight(-7.3, 2.3, 5);   wallLight(7.3, 2.3, 5);
  wallLight(-7.3, 2.3, -3);  wallLight(7.3, 2.3, -3);
  wallLight(-7.3, 2.3,-12);  wallLight(7.3, 2.3,-12);

  // Lumière extérieure froide (rue, nuit)
  var extL = new THREE.PointLight(0x7888aa, 2.2, 22, 1.5);
  extL.position.set(0, 5, 22); scene.add(extL);

  // Lumière chaude devanture
  var frontL = new THREE.PointLight(0xffbb66, 1.8, 14, 1.5);
  frontL.position.set(0, 3.5, 15); scene.add(frontL);

  /* ═══════════════════════════════════════════════════════════
     ARCHITECTURE — salle + 15 unités de large
  ═══════════════════════════════════════════════════════════ */

  var W = 7.5;   // demi-largeur (15 au total)
  var FLOOR_L = 52; // longueur totale du sol

  // SOL
  plane(W*2, FLOOR_L, M.floor, 0, 0.001, -3, -Math.PI/2);
  // Trottoir extérieur
  plane(28, 20, M.pave, 0, -0.01, 23, -Math.PI/2);
  box(W*2+1, 0.12, 3, M.pave, 0, 0.06, 17);

  // PLAFOND avec légère courbure (2 plans)
  plane(W*2, FLOOR_L, M.ceiling, 0, 4.1, -3, Math.PI/2);

  // MURS LATÉRAUX
  plane(FLOOR_L, 4.4, M.wall, -W, 2.1, -3, 0,  Math.PI/2);
  plane(FLOOR_L, 4.4, M.wall,  W, 2.1, -3, 0, -Math.PI/2);
  // Mur du fond
  plane(W*2, 4.4, M.wall, 0, 2.1, -29);

  // PLINTHE (moulure basse)
  box(W*2, 0.18, 0.1, M.beam, 0, 0.09, -28.9);
  box(0.1, 0.18, FLOOR_L, M.beam, -W+0.05, 0.09, -3);
  box(0.1, 0.18, FLOOR_L, M.beam, W-0.05, 0.09, -3);

  // CIMAISE mi-hauteur (moulure à 1.4m)
  box(W*2, 0.045, 0.1, M.gold, 0, 1.38, -28.9);
  box(0.1, 0.045, FLOOR_L, M.gold, -W+0.05, 1.38, -3);
  box(0.1, 0.045, FLOOR_L, M.gold,  W-0.05, 1.38, -3);

  // POUTRES PLAFOND — en travers tous les 5 unités
  [-8, -13, -18, -23].forEach(function(z) {
    box(W*2+0.2, 0.28, 0.36, M.beam, 0, 3.96, z);
  });
  // Poutre longitudinale centrale
  box(0.22, 0.22, FLOOR_L, M.beam, 0, 3.92, -3);

  /* ── FAÇADE ──────────────────────────────────────────────── */
  // Panneaux façade (laissant place porte 3m et 2 vitrines)
  box(1.8, 4.4, 0.3, M.facade, -5.8, 2.1, 16.2);
  box(1.8, 4.4, 0.3, M.facade,  5.8, 2.1, 16.2);
  box(1.5, 4.4, 0.3, M.facade, -3.8, 2.1, 16.2); // entre vitrine et porte
  box(1.5, 4.4, 0.3, M.facade,  3.8, 2.1, 16.2);
  // Imposte (dessus porte)
  box(3.2, 0.65, 0.3, M.facade, 0, 3.65, 16.2);
  // Corniche haute
  box(W*2+1, 0.14, 0.4, M.gold, 0, 4.24, 16.2);
  // Soubassement
  box(W*2+1, 0.3, 0.4, M.ciment, 0, 0.15, 16.2);

  // Vitrines (grandes fenêtres)
  [[-4.9],[4.9]].forEach(function(cx) {
    box(2.2, 2.6, 0.1, M.glass, cx[0], 1.7, 16.1);
    // Encadrements dorés
    box(2.32, 0.07, 0.18, M.gold, cx[0], 2.97, 16.15);
    box(2.32, 0.07, 0.18, M.gold, cx[0], 0.42, 16.15);
    box(0.07, 2.68, 0.18, M.gold, cx[0]-1.16, 1.7, 16.15);
    box(0.07, 2.68, 0.18, M.gold, cx[0]+1.16, 1.7, 16.15);
  });

  // Enseigne
  var signMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.68, 0.08), M.sign);
  signMesh.position.set(0, 3.1, 16.22); scene.add(signMesh);
  box(4.62, 0.8, 0.06, M.gold, 0, 3.1, 16.26);

  /* ── PORTE (2 battants — s'ouvrent au scroll) ────────────── */
  // Cadre
  box(0.1, 3.5, 0.25, M.gold, -1.55, 1.85, 16.1);
  box(0.1, 3.5, 0.25, M.gold,  1.55, 1.85, 16.1);
  box(3.22, 0.1, 0.25, M.gold, 0, 3.44, 16.1);
  box(3.18, 0.07, 0.28, M.gold, 0, 0.035, 16.1);

  // Panneau gauche (pivote depuis x=-1.55 sur axe Y)
  var doorL = new THREE.Group();
  doorL.position.set(-1.55, 1.85, 16.1);
  var dpL = new THREE.Mesh(new THREE.BoxGeometry(1.36, 3.26, 0.085), M.door);
  dpL.position.x = -0.68;
  // Panneaux moulurés
  [0.7, -0.7].forEach(function(py) {
    var mp = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.0, 0.04), M.door);
    mp.position.set(-0.68, py, 0.06); doorL.add(mp);
    var mf = new THREE.Mesh(new THREE.BoxGeometry(1.01, 0.96, 0.02), M.door);
    mf.position.set(-0.68, py, 0.075); doorL.add(mf);
  });
  doorL.add(dpL);
  var hG = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), M.gold);
  hG.rotation.z = Math.PI/2; hG.position.set(-0.22, 0, 0.12); doorL.add(hG);
  var hGb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), M.gold);
  hGb.position.set(-0.1, 0, 0.12); doorL.add(hGb);
  scene.add(doorL);

  // Panneau droite
  var doorR = new THREE.Group();
  doorR.position.set(1.55, 1.85, 16.1);
  var dpR = new THREE.Mesh(new THREE.BoxGeometry(1.36, 3.26, 0.085), M.door);
  dpR.position.x = 0.68;
  [0.7, -0.7].forEach(function(py) {
    var mp = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.0, 0.04), M.door);
    mp.position.set(0.68, py, 0.06); doorR.add(mp);
    var mf = new THREE.Mesh(new THREE.BoxGeometry(1.01, 0.96, 0.02), M.door);
    mf.position.set(0.68, py, 0.075); doorR.add(mf);
  });
  doorR.add(dpR);
  var hD = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), M.gold);
  hD.rotation.z = Math.PI/2; hD.position.set(0.22, 0, 0.12); doorR.add(hD);
  var hDb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), M.gold);
  hDb.position.set(0.1, 0, 0.12); doorR.add(hDb);
  scene.add(doorR);

  /* ── AUVENT ──────────────────────────────────────────────── */
  box(5.5, 0.08, 1.5, M.awning, 0, 4.3, 15.5);
  var awCloth = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.55), M.awning);
  awCloth.position.set(0, 3.85, 15.0); awCloth.rotation.x = 0.28; scene.add(awCloth);
  box(5.52, 0.05, 0.05, M.gold, 0, 3.55, 14.3);

  /* ── RUE / EXTÉRIEUR ─────────────────────────────────────── */
  // Réverbères
  function lantern(x, z) {
    cyl(0.035, 0.035, 4.2, 8, M.ciment, x, 2.1, z);
    // Tête
    box(0.22, 0.36, 0.22, M.ciment, x, 4.28, z);
    var lp = new THREE.PointLight(0xffcc66, 2.0, 12, 2);
    lp.position.set(x, 4.1, z); scene.add(lp);
    var hm = new THREE.MeshBasicMaterial({ color:0xffbb44, transparent:true, opacity:0.12, blending:THREE.AdditiveBlending, depthWrite:false });
    var halo = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), hm);
    halo.position.set(x, 4.1, z); scene.add(halo);
  }
  lantern(-6, 21);
  lantern( 6, 21);

  // Plantes en pot (entrée)
  function plante(x, z) {
    cyl(0.24, 0.19, 0.44, 12, M.pot, x, 0.22, z);
    var f1 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), M.plant);
    f1.scale.y = 1.35; f1.position.set(x, 0.74, z); f1.castShadow = true; scene.add(f1);
    var f2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), M.plant);
    f2.scale.set(1.1, 1.5, 1.0); f2.position.set(x+0.14, 0.95, z-0.1); scene.add(f2);
  }
  plante(-2.8, 16.8);
  plante( 2.8, 16.8);
  // Grande plante au fond du bar
  plante(-6.5, -22);
  plante( 6.5,  -5);

  /* ── MURS DÉCORÉS (tableaux + appliques) ────────────────── */
  // Tableau gauche (entrée)
  box(0.06, 1.8, 1.3, M.frame, -W+0.04, 2.2, 8);
  plane(1.18, 1.62, M.art1, -W+0.09, 2.2, 8, 0, Math.PI/2);

  // Tableau droite (milieu)
  box(0.06, 2.0, 1.5, M.frame, W-0.04, 2.3, 2);
  plane(1.38, 1.82, M.art2, W-0.09, 2.3, 2, 0, -Math.PI/2);

  // Grand tableau gauche (profond)
  box(0.06, 2.2, 1.7, M.frame, -W+0.04, 2.4, -8);
  plane(1.58, 2.02, M.art3, -W+0.09, 2.4, -8, 0, Math.PI/2);

  // Grand miroir côté droit (profond) — reflet chaleureux
  box(0.06, 2.4, 1.8, M.frame, W-0.04, 2.4, -14);
  box(0.04, 2.28, 1.68, M.miroir, W-0.07, 2.4, -14);

  // Appliques murales décoratives (abat-jour cuivre)
  function applique(x, y, z, ry) {
    var g = new THREE.Group();
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.26), M.copper);
    arm.position.set(0, 0, 0.13); g.add(arm);
    var sh = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 10, 1, true), M.shade);
    sh.position.set(0, -0.05, 0.28); g.add(sh);
    var pl = new THREE.PointLight(0xffaa44, 1.4, 8, 2);
    pl.position.set(0, 0.1, 0.4); g.add(pl);
    g.position.set(x, y, z); if (ry) g.rotation.y = ry;
    scene.add(g);
  }
  applique(-W+0.05, 2.5, 5,   Math.PI/2);
  applique(-W+0.05, 2.5,-5,   Math.PI/2);
  applique(-W+0.05, 2.5,-15,  Math.PI/2);
  applique( W-0.05, 2.5, 0,  -Math.PI/2);
  applique( W-0.05, 2.5,-10, -Math.PI/2);
  applique( W-0.05, 2.5,-20, -Math.PI/2);

  /* ── BANQUETTE (côté gauche, contre le mur) ─────────────── */
  // Assise
  box(1.4, 0.16, 13, M.banq, -W+1.1, 0.5, -7);
  // Dossier
  box(0.12, 0.52, 13, M.banq, -W+0.38, 0.92, -7);
  // Coussin
  box(1.18, 0.08, 12.8, new THREE.MeshStandardMaterial({ color:0x7a3a20, roughness:0.75 }), -W+1.1, 0.6, -7);

  /* ── DISPOSITION DES TABLES (naturelle, non symétrique) ─── */
  var candleData = [];

  function makeTable(x, z, round) {
    if (round) {
      // Table ronde
      cyl(0.56, 0.56, 0.07, 20, M.table, x, 0.8, z);
      cyl(0.04, 0.04, 0.8, 8, M.leg, x, 0.4, z);
      cyl(0.32, 0.32, 0.04, 16, M.leg, x, 0.02, z);
      // Nappe ronde
      cyl(0.6, 0.6, 0.005, 20, M.cloth, x, 0.84, z);
      // Assiettes
      cyl(0.22, 0.22, 0.016, 16, M.plate, x-0.22, 0.85, z);
      cyl(0.22, 0.22, 0.016, 16, M.plate, x+0.22, 0.85, z);
      cyl(0.052, 0.04, 0.18, 10, M.glass, x-0.08, 0.945, z-0.28);
      cyl(0.052, 0.04, 0.18, 10, M.glass, x+0.08, 0.945, z+0.28);
    } else {
      // Table rectangulaire
      box(1.46, 0.07, 0.9, M.table, x, 0.8, z);
      cyl(0.04, 0.04, 0.8, 8, M.leg, x, 0.4, z);
      cyl(0.32, 0.32, 0.04, 14, M.leg, x, 0.02, z);
      box(1.52, 0.005, 0.95, M.cloth, x, 0.84, z);
      cyl(0.22, 0.22, 0.016, 16, M.plate, x, 0.85, z-0.22);
      cyl(0.22, 0.22, 0.016, 16, M.plate, x, 0.85, z+0.22);
      cyl(0.052, 0.04, 0.18, 10, M.glass, x+0.3, 0.945, z-0.22);
      cyl(0.052, 0.04, 0.18, 10, M.glass, x+0.3, 0.945, z+0.22);
      cyl(0.04, 0.036, 0.25, 8, M.glass, x-0.3, 0.97, z);
    }
    // Bougie
    cyl(0.03, 0.03, 0.15, 8, M.candle, x, 0.93, z);
    var flm = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), M.flame);
    flm.position.set(x, 1.02, z); scene.add(flm);
    var glm = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color:0xff8833, transparent:true, opacity:0.09, blending:THREE.AdditiveBlending, depthWrite:false }));
    glm.position.set(x, 1.02, z); scene.add(glm);
    var pl = new THREE.PointLight(0xffcc66, 2.6, 4.5, 2);
    pl.position.set(x, 1.1, z); scene.add(pl);
    candleData.push({ light:pl, flame:flm, glow:glm, offset:Math.random()*Math.PI*2, base:2.6 });
  }

  // Tables banquette (collées côté gauche)
  makeTable(-W+1.8,  5, false);  // banquette table 1
  makeTable(-W+1.8, -1, false);  // banquette table 2 (c'est ici qu'on s'arrête)
  makeTable(-W+1.8, -8, false);  // banquette table 3
  makeTable(-W+1.8,-15, false);  // banquette table 4

  // Tables rondes côté droit (espacées, organiques)
  makeTable( W-2.2, 6,  true);
  makeTable( W-2.2,-1,  true);
  makeTable( W-2.2,-9,  true);

  // Tables centrales (légèrement décalées)
  makeTable( 0.8,  3, false);
  makeTable(-0.5, -5, false);
  makeTable( 0.5,-12, false);

  /* ── CARTE MENU sur la table de la banquette (WP4) ──────── */
  var menuObj = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.008, 0.40), M.menu);
  menuObj.position.set(-W+1.8, 0.862, -0.8);
  menuObj.rotation.y = 0.25;
  menuObj.castShadow = true; scene.add(menuObj);
  var menuSpine = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.012, 0.405),
    new THREE.MeshStandardMaterial({ color:0xc4895a, roughness:0.25, metalness:0.55 }));
  menuSpine.position.set(-W+1.8, 0.858, -0.8); menuSpine.rotation.y = 0.25; scene.add(menuSpine);

  /* ── CHAISES ─────────────────────────────────────────────── */
  function chaise(x, z, ry) {
    var g = new THREE.Group();
    var sm = new THREE.MeshStandardMaterial({ color:0x5a3018, roughness:0.68 });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.44), sm);
    seat.position.y = 0.47; g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.05), sm);
    back.position.set(0, 0.74, -0.2); g.add(back);
    [[-0.2,-0.18],[0.2,-0.18],[-0.2,0.18],[0.2,0.18]].forEach(function(p) {
      var l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), M.leg);
      l.position.set(p[0], 0.23, p[1]); g.add(l);
    });
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    g.traverse(function(c) { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
    scene.add(g);
  }
  // Chaises côté droit des tables banquette seulement
  [5,-1,-8,-15].forEach(function(z) {
    chaise(-W+1.8+0.85, z, -Math.PI/2);
    chaise(-W+1.8, z-0.68, 0);
    chaise(-W+1.8, z+0.68, Math.PI);
  });
  // Chaises tables rondes
  [[W-2.2,6],[W-2.2,-1],[W-2.2,-9]].forEach(function(t) {
    chaise(t[0]-0.78, t[1], Math.PI/2);
    chaise(t[0]+0.78, t[1], -Math.PI/2);
    chaise(t[0], t[1]-0.72, 0);
    chaise(t[0], t[1]+0.72, Math.PI);
  });
  // Chaises tables centrales
  [[0.8,3],[-0.5,-5],[0.5,-12]].forEach(function(t) {
    chaise(t[0]-0.85, t[1], Math.PI/2);
    chaise(t[0]+0.85, t[1], -Math.PI/2);
    chaise(t[0], t[1]-0.68, 0);
    chaise(t[0], t[1]+0.68, Math.PI);
  });

  /* ── LUMINAIRES PLAFOND ──────────────────────────────────── */
  function pendant(x, z) {
    box(0.015, 0.65, 0.015, M.leg, x, 3.73, z);
    var sh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 12, 1, true), M.shade);
    sh.position.set(x, 3.22, z); scene.add(sh);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6),
      new THREE.MeshBasicMaterial({ color:0xffee99 }));
    bulb.position.set(x, 3.06, z); scene.add(bulb);
    var pl = new THREE.PointLight(0xffcc88, 1.2, 6, 2);
    pl.position.set(x, 2.88, z); scene.add(pl);
  }
  // Au-dessus de chaque table
  [[-W+1.8,5],[-W+1.8,-1],[-W+1.8,-8],[-W+1.8,-15]].forEach(function(t) { pendant(t[0], t[1]); });
  [[W-2.2,6],[W-2.2,-1],[W-2.2,-9]].forEach(function(t) { pendant(t[0], t[1]); });
  [[0.8,3],[-0.5,-5],[0.5,-12]].forEach(function(t) { pendant(t[0], t[1]); });
  // Couloir central
  [10, 4, -2, -7].forEach(function(z) { pendant(0, z); });

  /* ── BAR ─────────────────────────────────────────────────── */
  // Comptoir incurvé (simulé avec 2 segments)
  box(10, 1.18, 0.75, M.bar, 0, 0.59, -24.5);
  box(10.12, 0.065, 0.85, M.gold, 0, 1.22, -24.5);
  // Pied de bar arrondi
  box(9.8, 0.08, 0.7, M.copper, 0, 0.08, -24.5);
  // Tabourets de bar
  for (var si = 0; si < 6; si++) {
    var sx = -3.5 + si * 1.4;
    cyl(0.22, 0.2, 0.04, 14, M.banq, sx, 0.78, -23.4);
    cyl(0.04, 0.04, 0.78, 8, M.copper, sx, 0.39, -23.4);
    cyl(0.24, 0.24, 0.04, 12, M.copper, sx, 0.02, -23.4);
  }
  // Mur bar (fond)
  plane(W*2, 4.4, M.wall, 0, 2.1, -27.5);
  // Étagères
  [2.55, 2.0, 1.5].forEach(function(hy) {
    box(7, 0.055, 0.26, M.beam, 0, hy, -27.2);
  });
  // Bouteilles sur étagères
  for (var bi = 0; bi < 18; bi++) {
    var bx = -3.3 + bi * 0.38;
    var bcol = [0x1e2d4a, 0x2a3e20, 0x3a1a10, 0x2e2818][bi % 4];
    var bmat = new THREE.MeshStandardMaterial({ color:bcol, roughness:0.08, metalness:0.55, transparent:true, opacity:0.82 });
    var bh = 0.28 + (bi % 3) * 0.04;
    cyl(0.042, 0.036, bh, 8, bmat, bx, 2.55 + bh/2, -27.12);
    cyl(0.022, 0.022, 0.06, 6, bmat, bx, 2.55 + bh + 0.03, -27.12);
    cyl(0.042, 0.036, bh, 8, bmat, bx, 2.0 + bh/2, -27.12);
    cyl(0.022, 0.022, 0.06, 6, bmat, bx, 2.0 + bh + 0.03, -27.12);
  }
  // Grand miroir derrière bar
  box(8.2, 2.0, 0.04, M.frame, 0, 2.4, -27.44);
  box(8.0, 1.82, 0.03, M.miroir, 0, 2.4, -27.42);
  // Lumières bar
  var barPL1 = new THREE.PointLight(0xffcc88, 2.0, 10, 2);
  barPL1.position.set(-2, 2.3, -23); scene.add(barPL1);
  var barPL2 = new THREE.PointLight(0xffcc88, 2.0, 10, 2);
  barPL2.position.set( 2, 2.3, -23); scene.add(barPL2);
  // Lumière chaude sous étagères
  var underShelfL = new THREE.PointLight(0xff9944, 1.5, 8, 2);
  underShelfL.position.set(0, 2.2, -25.5); scene.add(underShelfL);

  /* ── PARTICULES AMBIANCE ─────────────────────────────────── */
  var PC = 280;
  var pPos = new Float32Array(PC * 3);
  var pVel = new Float32Array(PC);
  for (var pi = 0; pi < PC; pi++) {
    pPos[pi*3]   = (Math.random() - 0.5) * 14;
    pPos[pi*3+1] = Math.random() * 3.8;
    pPos[pi*3+2] = Math.random() * -45 + 16;
    pVel[pi] = 0.0003 + Math.random() * 0.0005;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color:0xd4a870, size:0.016, transparent:true, opacity:0.45,
    blending:THREE.AdditiveBlending, depthWrite:false
  }));
  scene.add(pMesh);

  /* ═══════════════════════════════════════════════════════════
     WAYPOINTS — trajectoire qui courbe (pas un couloir droit)
  ═══════════════════════════════════════════════════════════ */
  var WP = [
    // Vue façade depuis la rue (légèrement décalé pour avoir une perspective)
    { px: 1.5,  py: 1.78, pz: 27,   lx:-0.5, ly:1.5,  lz:16   },
    // Devant la porte — on voit les portes s'ouvrir
    { px: 0.4,  py: 1.72, pz: 19,   lx: 0,   ly:1.65, lz:13   },
    // Entrée dans la salle — regard vers les tables
    { px:-0.8,  py: 1.68, pz: 12,   lx: 1.5, ly:1.5,  lz:2    },
    // On glisse vers le côté banquette — espace qui s'ouvre
    { px:-1.5,  py: 1.62, pz: 4,    lx: 2,   ly:1.4,  lz:-5   },
    // ── ARRÊT TABLE : assis côté banquette, regard sur la carte
    { px:-W+2.8,py: 1.12, pz:-0.2,  lx:-W+1.8, ly:0.86, lz:-0.8 },
    // Remontée vers le bar — regard latéral sur la salle entière
    { px: 1.8,  py: 1.62, pz:-10,   lx:-1,   ly:1.4,  lz:-20  },
    // Au comptoir du bar
    { px: 0.5,  py: 1.48, pz:-21,   lx: 0,   ly:1.65, lz:-27  },
  ];

  window._sceneProgress = 0;

  function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

  function getWP(p) {
    var n = WP.length - 1;
    var s = Math.max(0, Math.min(1, p)) * n;
    var i = Math.min(Math.floor(s), n - 1);
    var t = easeInOut(s - i);
    var a = WP[i], b = WP[Math.min(i+1, n)];
    return {
      px: a.px+(b.px-a.px)*t, py: a.py+(b.py-a.py)*t, pz: a.pz+(b.pz-a.pz)*t,
      lx: a.lx+(b.lx-a.lx)*t, ly: a.ly+(b.ly-a.ly)*t, lz: a.lz+(b.lz-a.lz)*t
    };
  }

  /* ── BOUCLE ──────────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var lv = new THREE.Vector3();
  var sm = { px:WP[0].px, py:WP[0].py, pz:WP[0].pz, lx:WP[0].lx, ly:WP[0].ly, lz:WP[0].lz };
  var doorAngleL = 0, doorAngleR = 0; // current door angles (lerped)

  function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    var prog = window._sceneProgress || 0;

    // ── CAMÉRA
    var wp = getWP(prog);
    var k = 0.055;
    ['px','py','pz','lx','ly','lz'].forEach(function(key) { sm[key] += (wp[key] - sm[key]) * k; });
    camera.position.set(sm.px, sm.py, sm.pz);
    lv.set(sm.lx, sm.ly, sm.lz); camera.lookAt(lv);

    // ── ANIMATION PORTES (s'ouvrent entre progress 0.14 et 0.26)
    var dp = Math.max(0, Math.min(1, (prog - 0.14) / 0.12));
    var ds = dp*dp*(3-2*dp); // smoothstep
    var targetDoorAngle = ds * 1.4; // max ~80°
    doorAngleL += (targetDoorAngle - doorAngleL) * 0.06;
    doorAngleR += (targetDoorAngle - doorAngleR) * 0.06;
    doorL.rotation.y = -(0.04 + doorAngleL);
    doorR.rotation.y  =  (0.04 + doorAngleR);

    // ── FLAMMES BOUGIES
    candleData.forEach(function(c) {
      var f = 1 + 0.2*Math.sin(t*7.4+c.offset) + 0.08*Math.sin(t*13.9+c.offset*1.6);
      c.light.intensity = c.base * f;
      c.flame.scale.y = 0.8 + 0.22*Math.sin(t*9+c.offset);
      c.glow.scale.setScalar(0.86 + 0.16*Math.sin(t*5.2+c.offset));
    });

    // ── PARTICULES
    var pa = pGeo.attributes.position;
    for (var i = 0; i < PC; i++) {
      pa.array[i*3+1] += pVel[i];
      if (pa.array[i*3+1] > 3.9) pa.array[i*3+1] = 0;
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
