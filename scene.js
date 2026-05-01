/* ============================================================
   ARCADIA — scene.js  (v5 — optimisé)
   Éclairage rationalisé · < 10 PointLights · 60 fps
   ============================================================ */

(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('scene-canvas');
  if (!canvas) return;

  /* ── RENDERER ─────────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = false; // désactivé pour les perf
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0804);
  scene.fog = new THREE.Fog(0x1c1006, 20, 52);

  var camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 70);

  /* ── TEXTURES ─────────────────────────────────────────── */
  function makeTex(w, h, fn, rS, rT) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rS || 1, rT || rS || 1);
    return t;
  }

  var texFloor = makeTex(512, 512, function (ctx, w, h) {
    var cols = ['#8a5530','#7a4a26','#956040','#6e4020'];
    var ph = 48;
    for (var y = 0; y < h; y += ph) {
      ctx.fillStyle = cols[Math.floor(y/ph) % cols.length];
      ctx.fillRect(0, y, w, ph - 1);
      ctx.globalAlpha = 0.14;
      for (var i = 0; i < 18; i++) {
        var gy = y + Math.random()*ph;
        ctx.strokeStyle = Math.random()>.5 ? '#3a1e0a' : '#b07848';
        ctx.lineWidth = 0.3 + Math.random()*0.9;
        ctx.beginPath(); ctx.moveTo(0, gy);
        ctx.bezierCurveTo(w*.3, gy+(Math.random()-.5)*4, w*.7, gy+(Math.random()-.5)*4, w, gy+(Math.random()-.5)*3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, y+ph-1, w, 1);
    }
  }, 3, 9);

  var texWall = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#c8b090'; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.045;
    for (var i = 0; i < 7000; i++) {
      ctx.fillStyle = Math.random()>.5?'#fff':'#000';
      ctx.fillRect(Math.random()*w, Math.random()*h, 1+Math.random()*2, 1+Math.random()*2);
    }
    ctx.globalAlpha = 1;
  }, 2, 3);

  var texPave = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#1a1208'; ctx.fillRect(0, 0, w, h);
    var tw = 88, th = 48;
    for (var ry = 0; ry < h+th; ry += th) {
      var off = (Math.floor(ry/th)%2)*tw/2;
      for (var rx = -off; rx < w+tw; rx += tw) {
        var v = (Math.random()-.5)*18, b = 46+Math.round(v);
        ctx.fillStyle='rgb('+(b+6)+','+b+','+(b-4)+')';
        ctx.fillRect(rx+2, ry+2, tw-4, th-4);
        ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1.5;
        ctx.strokeRect(rx+2, ry+2, tw-4, th-4);
      }
    }
  }, 5, 7);

  var texBois = makeTex(256, 512, function (ctx, w, h) {
    ctx.fillStyle = '#3e2410'; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.22;
    for (var i = 0; i < 30; i++) {
      ctx.strokeStyle = Math.random()>.5?'#1e0c04':'#5e3820';
      ctx.lineWidth = 0.4+Math.random()*1.8;
      var y0 = Math.random()*h;
      ctx.beginPath(); ctx.moveTo(0,y0);
      ctx.bezierCurveTo(w*.3,y0+(Math.random()-.5)*8,w*.7,y0+(Math.random()-.5)*8,w,y0+(Math.random()-.5)*6);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }, 1, 3);

  var texFacade = makeTex(512, 512, function (ctx, w, h) {
    ctx.fillStyle='#181008'; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=0.1;
    for (var i=0; i<5000; i++) {
      ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, Math.random()*1.6, 0, Math.PI*2);
      ctx.fillStyle=Math.random()>.5?'#fff':'#000'; ctx.fill();
    }
    ctx.globalAlpha=1;
  }, 2, 3);

  var texSign = makeTex(512, 128, function (ctx, w, h) {
    ctx.fillStyle='#120a04'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#c4895a'; ctx.lineWidth=2.5; ctx.strokeRect(5,5,w-10,h-10);
    ctx.fillStyle='#d4a070'; ctx.font='italic 60px Georgia,serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('Arcadia',w/2,h/2-4);
    ctx.font='11px Georgia'; ctx.fillStyle='rgba(196,137,90,0.6)'; ctx.fillText('✦  Restaurant  ✦',w/2,h*.84);
  }, 1, 1);

  // Tableau abstrait (seed aléatoire)
  function makeArt(sd) {
    return makeTex(256, 320, function (ctx, w, h) {
      var s = sd;
      var rng = function() { s=(s*9301+49297)%233280; return s/233280; };
      ctx.fillStyle='#1a1206'; ctx.fillRect(0,0,w,h);
      for (var i=0; i<7; i++) {
        var gx=rng()*w, gy=rng()*h;
        var gr=ctx.createRadialGradient(gx,gy,0,gx,gy,70+rng()*60);
        gr.addColorStop(0,'rgba(196,137,90,'+(0.2+rng()*0.25)+')');
        gr.addColorStop(1,'transparent');
        ctx.fillStyle=gr; ctx.fillRect(0,0,w,h);
      }
      for (var j=0; j<4; j++) {
        ctx.strokeStyle='rgba(196,137,90,'+(0.15+rng()*0.2)+')';
        ctx.lineWidth=0.5+rng()*1.5;
        ctx.beginPath(); ctx.moveTo(rng()*w,rng()*h);
        ctx.bezierCurveTo(rng()*w,rng()*h,rng()*w,rng()*h,rng()*w,rng()*h); ctx.stroke();
      }
    }, 1, 1);
  }

  var texMenu = makeTex(256, 360, function (ctx, w, h) {
    ctx.fillStyle='#f5efe4'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#c4895a'; ctx.lineWidth=3; ctx.strokeRect(8,8,w-16,h-16);
    ctx.fillStyle='#2e1808'; ctx.font='italic bold 28px Georgia'; ctx.textAlign='center';
    ctx.fillText('Arcadia',w/2,48);
    ctx.strokeStyle='#c4895a'; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(28,60); ctx.lineTo(w-28,60); ctx.stroke();
    function sec(title, items, sy) {
      ctx.fillStyle='#c4895a'; ctx.font='bold 10px Georgia'; ctx.textAlign='left'; ctx.fillText(title.toUpperCase(),28,sy);
      ctx.fillStyle='#3a2010'; ctx.font='11px Georgia';
      items.forEach(function(it,i) {
        ctx.textAlign='left'; ctx.fillText(it[0],28,sy+16+i*17);
        ctx.textAlign='right'; ctx.fillText(it[1],w-28,sy+16+i*17);
      });
    }
    sec('Entrées',[['Velouté du moment','9€'],['Tartare de saumon','12€']],76);
    sec('Plats',[['Magret de canard','19€'],['Fromage chaud Jura','17€'],['Risotto champignons','15€']],140);
    sec('Desserts',[['Pavlova aux agrumes','5,50€'],['Tarte tatin','6€']],232);
    ctx.fillStyle='rgba(90,56,32,0.5)'; ctx.font='italic 9px Georgia'; ctx.textAlign='center';
    ctx.fillText('Frais · Fait maison · De saison',w/2,h-18);
  }, 1, 1);

  /* ── MATÉRIAUX ────────────────────────────────────────── */
  var M = {
    floor:  new THREE.MeshStandardMaterial({ map:texFloor, roughness:0.6,  metalness:0.03 }),
    ceil:   new THREE.MeshStandardMaterial({ color:0xd0bfa0, roughness:0.92 }),
    wall:   new THREE.MeshStandardMaterial({ map:texWall,  roughness:0.88 }),
    pave:   new THREE.MeshStandardMaterial({ map:texPave,  roughness:0.94 }),
    facade: new THREE.MeshStandardMaterial({ map:texFacade,roughness:0.86 }),
    door:   new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.52, metalness:0.05 }),
    bois:   new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.62, metalness:0.04 }),
    table:  new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.55, metalness:0.05, color:0x9a6840 }),
    beam:   new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.75, color:0x5a3820 }),
    leg:    new THREE.MeshStandardMaterial({ color:0x2e1a0a, roughness:0.85 }),
    plate:  new THREE.MeshStandardMaterial({ color:0xf8f3ec, roughness:0.2 }),
    cloth:  new THREE.MeshStandardMaterial({ color:0xf0ebe0, roughness:0.85 }),
    glass:  new THREE.MeshStandardMaterial({ color:0xaaccdd, roughness:0.04, transparent:true, opacity:0.38 }),
    gold:   new THREE.MeshStandardMaterial({ color:0xc4895a, roughness:0.18, metalness:0.78 }),
    sign:   new THREE.MeshStandardMaterial({ map:texSign,  roughness:0.45 }),
    menu:   new THREE.MeshStandardMaterial({ map:texMenu,  roughness:0.55 }),
    miroir: new THREE.MeshStandardMaterial({ color:0x90aabb, roughness:0.0, metalness:1.0 }),
    shade:  new THREE.MeshStandardMaterial({ color:0x281400, roughness:0.6, side:THREE.DoubleSide }),
    plant:  new THREE.MeshStandardMaterial({ color:0x2a5018, roughness:0.92 }),
    pot:    new THREE.MeshStandardMaterial({ color:0x8c6248, roughness:0.72 }),
    banq:   new THREE.MeshStandardMaterial({ color:0x5c2e18, roughness:0.72 }),
    frame:  new THREE.MeshStandardMaterial({ color:0x2a1a0a, roughness:0.3, metalness:0.6 }),
    art1:   new THREE.MeshStandardMaterial({ map:makeArt(123), roughness:0.6 }),
    art2:   new THREE.MeshStandardMaterial({ map:makeArt(456), roughness:0.6 }),
    art3:   new THREE.MeshStandardMaterial({ map:makeArt(789), roughness:0.6 }),
    awning: new THREE.MeshStandardMaterial({ color:0x1a0c06, roughness:0.88, side:THREE.DoubleSide }),
    ciment: new THREE.MeshStandardMaterial({ color:0x1a1408, roughness:0.96 }),
    // Émissifs (lumière simulée sans PointLight)
    bulb:   new THREE.MeshStandardMaterial({ color:0xffee99, emissive:new THREE.Color(0xffee99), emissiveIntensity:1.2 }),
    candle: new THREE.MeshStandardMaterial({ color:0xfff9f2, roughness:0.92 }),
    flame:  new THREE.MeshBasicMaterial({ color:0xffbb22, transparent:true, opacity:0.9 }),
    copper: new THREE.MeshStandardMaterial({ color:0xb87040, roughness:0.25, metalness:0.85 }),
  };

  /* ── HELPERS ──────────────────────────────────────────── */
  function box(w,h,d,mat,x,y,z,ry) {
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z); if(ry) m.rotation.y=ry;
    scene.add(m); return m;
  }
  function cyl(rt,rb,h,seg,mat,x,y,z) {
    var m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);
    m.position.set(x,y,z); scene.add(m); return m;
  }
  function pln(w,d,mat,x,y,z,rx,ry) {
    var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
    m.position.set(x,y,z);
    if(rx!==undefined) m.rotation.x=rx;
    if(ry!==undefined) m.rotation.y=ry;
    scene.add(m); return m;
  }

  /* ── LUMIÈRES — max 8 PointLights ────────────────────── */
  // 1. Ambiance chaude (forte, compense l'absence de nombreuses sources)
  scene.add(new THREE.AmbientLight(0xffddaa, 2.8));
  // 2. Directionnel doux d'en haut
  var dir = new THREE.DirectionalLight(0xffc87a, 0.8);
  dir.position.set(3, 8, 5); scene.add(dir);
  // 3. Lumière extérieure froide (rue)
  var extL = new THREE.PointLight(0x8899bb, 2.5, 24, 1.5);
  extL.position.set(0, 5, 22); scene.add(extL);
  // 4. Zone entrée (chaud)
  var entL = new THREE.PointLight(0xffaa55, 2.2, 14, 1.8);
  entL.position.set(0, 3.2, 10); scene.add(entL);
  // 5. Milieu salle
  var midL = new THREE.PointLight(0xffcc88, 2.0, 18, 1.5);
  midL.position.set(0, 3.0, -2); scene.add(midL);
  // 6. Zone tables gauche (banquette)
  var leftL = new THREE.PointLight(0xffbb66, 1.8, 14, 1.8);
  leftL.position.set(-5, 2.8, -6); scene.add(leftL);
  // 7. Zone tables droite
  var rightL = new THREE.PointLight(0xffbb66, 1.8, 14, 1.8);
  rightL.position.set(5, 2.8, -6); scene.add(rightL);
  // 8. Bar
  var barL = new THREE.PointLight(0xffcc88, 2.5, 16, 1.5);
  barL.position.set(0, 2.6, -23); scene.add(barL);

  /* ── ARCHITECTURE ─────────────────────────────────────── */
  var W = 7.5;  // demi-largeur (15 total)

  // Sol + trottoir
  pln(W*2, 54, M.floor, 0, 0.001, -4, -Math.PI/2);
  pln(26, 20, M.pave,   0, -0.01, 23, -Math.PI/2);
  box(W*2+1, 0.12, 3, M.pave, 0, 0.06, 17);

  // Plafond
  pln(W*2, 54, M.ceil, 0, 4.1, -4, Math.PI/2);

  // Murs
  pln(54, 4.4, M.wall, -W, 2.1, -4, 0,  Math.PI/2);
  pln(54, 4.4, M.wall,  W, 2.1, -4, 0, -Math.PI/2);
  pln(W*2, 4.4, M.wall, 0, 2.1, -31);

  // Plinthe + cimaise
  box(0.08, 0.16, 52, M.beam,  -W+0.04, 0.08, -4);
  box(0.08, 0.16, 52, M.beam,   W-0.04, 0.08, -4);
  box(0.06, 0.04, 52, M.gold,  -W+0.04, 1.38, -4);
  box(0.06, 0.04, 52, M.gold,   W-0.04, 1.38, -4);
  box(W*2, 0.04, 0.08, M.gold, 0, 1.38, -30.9);

  // Poutres plafond en travers
  [-8,-14,-20].forEach(function(z) {
    box(W*2+0.2, 0.26, 0.34, M.beam, 0, 3.97, z);
  });
  // Poutre longitudinale centrale
  box(0.2, 0.2, 52, M.beam, 0, 3.92, -4);

  /* ── FAÇADE ───────────────────────────────────────────── */
  // Panneaux
  box(1.8, 4.4, 0.28, M.facade, -5.8, 2.1, 16.2);
  box(1.8, 4.4, 0.28, M.facade,  5.8, 2.1, 16.2);
  box(1.5, 4.4, 0.28, M.facade, -3.8, 2.1, 16.2);
  box(1.5, 4.4, 0.28, M.facade,  3.8, 2.1, 16.2);
  box(3.2, 0.65, 0.28, M.facade, 0, 3.65, 16.2);
  box(W*2+0.5, 0.14, 0.38, M.gold,   0, 4.26, 16.2);
  box(W*2+0.5, 0.28, 0.38, M.ciment, 0, 0.14, 16.2);

  // Vitrines
  [[-4.9],[4.9]].forEach(function(cx) {
    box(2.2, 2.6, 0.1, M.glass, cx[0], 1.7, 16.12);
    box(2.32, 0.07, 0.16, M.gold, cx[0], 3.02, 16.16);
    box(2.32, 0.07, 0.16, M.gold, cx[0], 0.42, 16.16);
    box(0.07, 2.68, 0.16, M.gold, cx[0]-1.16, 1.7, 16.16);
    box(0.07, 2.68, 0.16, M.gold, cx[0]+1.16, 1.7, 16.16);
  });

  // Enseigne
  box(4.5, 0.68, 0.08, M.sign,  0, 3.1, 16.22);
  box(4.62, 0.8, 0.06, M.gold, 0, 3.1, 16.26);

  /* ── PORTE (2 battants animés) ────────────────────────── */
  box(0.1, 3.5, 0.24, M.gold, -1.55, 1.85, 16.1);
  box(0.1, 3.5, 0.24, M.gold,  1.55, 1.85, 16.1);
  box(3.22, 0.1, 0.24, M.gold, 0, 3.45, 16.1);
  box(3.18, 0.07, 0.26, M.gold, 0, 0.035, 16.1);

  var doorL = new THREE.Group();
  doorL.position.set(-1.55, 1.85, 16.1);
  var dpL = new THREE.Mesh(new THREE.BoxGeometry(1.36, 3.26, 0.08), M.door);
  dpL.position.x = -0.68; doorL.add(dpL);
  [0.72,-0.72].forEach(function(py) {
    var p = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.04), M.door);
    p.position.set(-0.68, py, 0.065); doorL.add(p);
  });
  var hG = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), M.gold);
  hG.rotation.z = Math.PI/2; hG.position.set(-0.22, 0, 0.11); doorL.add(hG);
  scene.add(doorL);

  var doorR = new THREE.Group();
  doorR.position.set(1.55, 1.85, 16.1);
  var dpR = new THREE.Mesh(new THREE.BoxGeometry(1.36, 3.26, 0.08), M.door);
  dpR.position.x = 0.68; doorR.add(dpR);
  [0.72,-0.72].forEach(function(py) {
    var p = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.04), M.door);
    p.position.set(0.68, py, 0.065); doorR.add(p);
  });
  var hD = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), M.gold);
  hD.rotation.z = Math.PI/2; hD.position.set(0.22, 0, 0.11); doorR.add(hD);
  scene.add(doorR);

  /* ── AUVENT ───────────────────────────────────────────── */
  box(5.5, 0.08, 1.5, M.awning, 0, 4.3, 15.5);
  var aw = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.55), M.awning);
  aw.position.set(0, 3.85, 15.0); aw.rotation.x = 0.28; scene.add(aw);

  /* ── RÉVERBÈRES ───────────────────────────────────────── */
  function lantern(x, z) {
    cyl(0.035, 0.035, 4.2, 8, M.ciment, x, 2.1, z);
    box(0.22, 0.36, 0.22, M.ciment, x, 4.28, z);
    // Halo émissif (pas de PointLight)
    var hm = new THREE.MeshBasicMaterial({ color:0xffcc66, transparent:true, opacity:0.18, blending:THREE.AdditiveBlending, depthWrite:false });
    var halo = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), hm);
    halo.position.set(x, 4.1, z); scene.add(halo);
  }
  lantern(-6, 21);
  lantern( 6, 21);

  /* ── PLANTES ──────────────────────────────────────────── */
  function plante(x, z) {
    cyl(0.24, 0.19, 0.44, 10, M.pot, x, 0.22, z);
    var f = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 5), M.plant);
    f.scale.y = 1.3; f.position.set(x, 0.72, z); scene.add(f);
  }
  plante(-2.8, 16.8);
  plante( 2.8, 16.8);
  plante(-6.5, -22);
  plante( 6.5,  -4);

  /* ── DÉCO MURALE ──────────────────────────────────────── */
  // Tableau gauche
  box(0.06, 1.8, 1.3, M.frame, -W+0.04, 2.2, 7);
  pln(1.18, 1.62, M.art1, -W+0.09, 2.2, 7, 0, Math.PI/2);
  // Tableau droit
  box(0.06, 2.0, 1.5, M.frame, W-0.04, 2.3, 2);
  pln(1.38, 1.82, M.art2, W-0.09, 2.3, 2, 0, -Math.PI/2);
  // Tableau gauche profond
  box(0.06, 2.2, 1.7, M.frame, -W+0.04, 2.4, -8);
  pln(1.58, 2.02, M.art3, -W+0.09, 2.4, -8, 0, Math.PI/2);
  // Miroir droit
  box(0.06, 2.4, 1.8, M.frame, W-0.04, 2.4, -14);
  box(0.03, 2.28, 1.68, M.miroir, W-0.06, 2.4, -14);

  /* ── BANQUETTE (mur gauche) ───────────────────────────── */
  box(1.4, 0.16, 14, M.banq, -W+1.1, 0.5,  -7);
  box(0.12, 0.52, 14, M.banq, -W+0.38, 0.92, -7);
  box(1.18, 0.08, 13.8, new THREE.MeshStandardMaterial({ color:0x7a3a20, roughness:0.75 }), -W+1.1, 0.6, -7);

  /* ── TABLES ───────────────────────────────────────────── */
  var flameMeshes = [];

  function makeCandle(x, z) {
    cyl(0.028, 0.028, 0.14, 7, M.candle, x, 0.93, z);
    var flm = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.055, 6), M.flame);
    flm.position.set(x, 1.015, z); scene.add(flm);
    // Halo émissif autour de la bougie
    var hm = new THREE.MeshBasicMaterial({ color:0xff9922, transparent:true, opacity:0.1, blending:THREE.AdditiveBlending, depthWrite:false });
    var halo = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 7), hm);
    halo.position.set(x, 1.015, z); scene.add(halo);
    flameMeshes.push({ flm:flm, halo:halo, off:Math.random()*Math.PI*2 });
  }

  function tableRect(x, z) {
    box(1.46, 0.07, 0.9, M.table, x, 0.8, z);
    cyl(0.04, 0.04, 0.8, 7, M.leg, x, 0.4, z);
    cyl(0.3, 0.3, 0.04, 10, M.leg, x, 0.02, z);
    box(1.52, 0.005, 0.95, M.cloth, x, 0.84, z);
    cyl(0.22, 0.22, 0.015, 14, M.plate, x, 0.85, z-0.22);
    cyl(0.22, 0.22, 0.015, 14, M.plate, x, 0.85, z+0.22);
    cyl(0.05, 0.038, 0.18, 8, M.glass, x+0.28, 0.94, z-0.22);
    cyl(0.05, 0.038, 0.18, 8, M.glass, x+0.28, 0.94, z+0.22);
    makeCandle(x, z);
    // Luminaire plafond (ampoule émissive, pas de PointLight)
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), M.bulb);
    bulb.position.set(x, 3.0, z); scene.add(bulb);
    box(0.012, 0.6, 0.012, M.leg, x, 3.62, z);
    var sh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 10, 1, true), M.shade);
    sh.position.set(x, 3.16, z); scene.add(sh);
  }

  function tableRnd(x, z) {
    cyl(0.55, 0.55, 0.07, 18, M.table, x, 0.8, z);
    cyl(0.04, 0.04, 0.8, 7, M.leg, x, 0.4, z);
    cyl(0.3, 0.3, 0.04, 12, M.leg, x, 0.02, z);
    cyl(0.58, 0.58, 0.005, 18, M.cloth, x, 0.84, z);
    cyl(0.22, 0.22, 0.015, 14, M.plate, x-0.22, 0.85, z);
    cyl(0.22, 0.22, 0.015, 14, M.plate, x+0.22, 0.85, z);
    cyl(0.05, 0.038, 0.18, 8, M.glass, x, 0.94, z-0.3);
    cyl(0.05, 0.038, 0.18, 8, M.glass, x, 0.94, z+0.3);
    makeCandle(x, z);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), M.bulb);
    bulb.position.set(x, 3.0, z); scene.add(bulb);
    box(0.012, 0.6, 0.012, M.leg, x, 3.62, z);
    var sh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 10, 1, true), M.shade);
    sh.position.set(x, 3.16, z); scene.add(sh);
  }

  // Banquette (côté gauche)
  tableRect(-W+1.8,  5);
  tableRect(-W+1.8, -1);  // ← arrêt caméra + menu
  tableRect(-W+1.8, -8);
  tableRect(-W+1.8,-14);
  // Rondes (côté droit)
  tableRnd(W-2.2,  6);
  tableRnd(W-2.2, -1);
  tableRnd(W-2.2, -9);
  // Centrales
  tableRect(0.8,   3);
  tableRect(-0.5, -5);
  tableRect(0.5, -12);

  /* ── CARTE SUR TABLE ──────────────────────────────────── */
  var menuObj = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.008, 0.40), M.menu);
  menuObj.position.set(-W+1.8, 0.862, -0.8); menuObj.rotation.y = 0.25;
  scene.add(menuObj);
  var spine = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.012, 0.405),
    new THREE.MeshStandardMaterial({ color:0xc4895a, roughness:0.25, metalness:0.55 }));
  spine.position.set(-W+1.8, 0.858, -0.8); spine.rotation.y = 0.25; scene.add(spine);

  /* ── CHAISES (simplifiées) ────────────────────────────── */
  function chaise(x, z, ry) {
    var g = new THREE.Group();
    var sm = new THREE.MeshStandardMaterial({ color:0x5a3018, roughness:0.7 });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.44), sm);
    seat.position.y = 0.47; g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.05), sm);
    back.position.set(0, 0.74, -0.2); g.add(back);
    [[-0.2,-0.18],[0.2,-0.18],[-0.2,0.18],[0.2,0.18]].forEach(function(p) {
      var l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), M.leg);
      l.position.set(p[0], 0.23, p[1]); g.add(l);
    });
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    scene.add(g);
  }
  // Chaises banquette (1 côté seulement — l'autre c'est le mur)
  [5,-1,-8,-14].forEach(function(z) {
    chaise(-W+1.8+0.9, z, -Math.PI/2);
    chaise(-W+1.8, z-0.68, 0);
    chaise(-W+1.8, z+0.68, Math.PI);
  });
  // Tables rondes
  [[W-2.2,6],[W-2.2,-1],[W-2.2,-9]].forEach(function(t) {
    chaise(t[0]-0.82, t[1], Math.PI/2);
    chaise(t[0]+0.82, t[1], -Math.PI/2);
    chaise(t[0], t[1]-0.72, 0);
    chaise(t[0], t[1]+0.72, Math.PI);
  });
  // Centrales
  [[0.8,3],[-0.5,-5],[0.5,-12]].forEach(function(t) {
    chaise(t[0]-0.9, t[1], Math.PI/2);
    chaise(t[0]+0.9, t[1], -Math.PI/2);
    chaise(t[0], t[1]-0.68, 0);
    chaise(t[0], t[1]+0.68, Math.PI);
  });

  /* ── BAR ──────────────────────────────────────────────── */
  box(10, 1.18, 0.74, M.bois,  0, 0.59, -24.5);
  box(10.12, 0.065, 0.84, M.gold, 0, 1.22, -24.5);
  box(9.8, 0.08, 0.7, M.copper, 0, 0.08, -24.5);
  // Tabourets
  for (var si = 0; si < 5; si++) {
    var sx = -2.8 + si * 1.4;
    cyl(0.22, 0.2, 0.04, 12, M.banq, sx, 0.78, -23.4);
    cyl(0.04, 0.04, 0.78, 7, M.copper, sx, 0.39, -23.4);
    cyl(0.24, 0.24, 0.03, 10, M.copper, sx, 0.02, -23.4);
  }
  // Mur fond bar + étagères
  pln(W*2, 4.4, M.wall, 0, 2.1, -27.5);
  [2.55, 2.0, 1.5].forEach(function(hy) {
    box(7, 0.05, 0.25, M.beam, 0, hy, -27.2);
  });
  // Bouteilles (quelques-unes, pas 36)
  for (var bi = 0; bi < 12; bi++) {
    var bx = -2.5 + bi * 0.44;
    var bcols = [0x1e2d4a, 0x2a3e20, 0x3a1a10];
    var bmat = new THREE.MeshStandardMaterial({ color:bcols[bi%3], roughness:0.08, metalness:0.5, transparent:true, opacity:0.82 });
    var bh = 0.28 + (bi%3)*0.04;
    cyl(0.042, 0.036, bh, 7, bmat, bx, 2.55+bh/2, -27.14);
    cyl(0.042, 0.036, bh, 7, bmat, bx, 2.0+bh/2,  -27.14);
  }
  // Miroir bar
  box(8.2, 2.0, 0.04, M.frame,  0, 2.4, -27.44);
  box(8.0, 1.82, 0.03, M.miroir, 0, 2.4, -27.42);

  /* ── PARTICULES (peu) ─────────────────────────────────── */
  var PC = 120;
  var pPos = new Float32Array(PC*3);
  var pVel = new Float32Array(PC);
  for (var pi = 0; pi < PC; pi++) {
    pPos[pi*3]   = (Math.random()-.5)*14;
    pPos[pi*3+1] = Math.random()*3.8;
    pPos[pi*3+2] = Math.random()*-46+16;
    pVel[pi] = 0.0003 + Math.random()*0.0005;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color:0xd4a870, size:0.015, transparent:true, opacity:0.4,
    blending:THREE.AdditiveBlending, depthWrite:false
  })));

  /* ── WAYPOINTS ────────────────────────────────────────── */
  var WP = [
    { px: 1.5,  py:1.78, pz:27,   lx:-0.5, ly:1.5,  lz:16   },
    { px: 0.4,  py:1.72, pz:19,   lx: 0,   ly:1.65, lz:13   },
    { px:-0.8,  py:1.68, pz:12,   lx: 1.5, ly:1.5,  lz:2    },
    { px:-1.5,  py:1.62, pz: 4,   lx: 2,   ly:1.4,  lz:-5   },
    { px:-W+2.8,py:1.12, pz:-0.2, lx:-W+1.8,ly:0.86,lz:-0.8 },
    { px: 1.8,  py:1.62, pz:-10,  lx:-1,   ly:1.4,  lz:-20  },
    { px: 0.5,  py:1.48, pz:-21,  lx: 0,   ly:1.65, lz:-27  },
  ];

  window._sceneProgress = 0;

  function eio(t) { return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }

  function getWP(p) {
    var n=WP.length-1, s=Math.max(0,Math.min(1,p))*n;
    var i=Math.min(Math.floor(s),n-1), t=eio(s-i);
    var a=WP[i], b=WP[Math.min(i+1,n)];
    return { px:a.px+(b.px-a.px)*t, py:a.py+(b.py-a.py)*t, pz:a.pz+(b.pz-a.pz)*t,
             lx:a.lx+(b.lx-a.lx)*t, ly:a.ly+(b.ly-a.ly)*t, lz:a.lz+(b.lz-a.lz)*t };
  }

  /* ── BOUCLE ───────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var lv = new THREE.Vector3();
  var sm = { px:WP[0].px, py:WP[0].py, pz:WP[0].pz, lx:WP[0].lx, ly:WP[0].ly, lz:WP[0].lz };
  var doorAng = 0;

  function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    var prog = window._sceneProgress || 0;

    // Caméra
    var wp = getWP(prog);
    var k = 0.055;
    ['px','py','pz','lx','ly','lz'].forEach(function(key) { sm[key]+=(wp[key]-sm[key])*k; });
    camera.position.set(sm.px, sm.py, sm.pz);
    lv.set(sm.lx, sm.ly, sm.lz); camera.lookAt(lv);

    // Portes (s'ouvrent entre prog 0.14 et 0.26)
    var dp = Math.max(0, Math.min(1, (prog-0.14)/0.12));
    var ds = dp*dp*(3-2*dp);
    doorAng += (ds*1.45 - doorAng)*0.06;
    doorL.rotation.y = -(0.04 + doorAng);
    doorR.rotation.y  =  (0.04 + doorAng);

    // Flammes (animation légère)
    flameMeshes.forEach(function(c) {
      c.flm.scale.y = 0.8 + 0.22*Math.sin(t*9+c.off);
      c.halo.scale.setScalar(0.85+0.18*Math.sin(t*5.2+c.off));
    });

    // Particules
    var pa = pGeo.attributes.position;
    for (var i=0; i<PC; i++) {
      pa.array[i*3+1]+=pVel[i];
      if(pa.array[i*3+1]>3.9) pa.array[i*3+1]=0;
    }
    pa.needsUpdate=true;
    renderer.render(scene, camera);
  }
  tick();

  window.addEventListener('resize', function() {
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
