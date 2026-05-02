/* ============================================================
   ARCADIA — scene.js  (v6 — ES module + UnrealBloom)
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';

var canvas = document.getElementById('scene-canvas');
if (!canvas) throw new Error('no canvas');

/* ── RENDERER ─────────────────────────────────────────── */
var renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x080608);
scene.fog = new THREE.Fog(0x080608, 22, 55);

var camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 70);

/* ── POST-PROCESSING — Bloom ──────────────────────────── */
var composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
var bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35,  // strength réduit — plus de "fumée" blanche
  0.3,   // radius
  0.92   // threshold très élevé — seuls les ampoules et néons blooment
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

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
  var cols = ['#d4b878','#c8a860','#dcc888','#bea058'];
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
      ctx.bezierCurveTo(w*.3,gy+(Math.random()-.5)*4,w*.7,gy+(Math.random()-.5)*4,w,gy+(Math.random()-.5)*3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, y+ph-1, w, 1);
  }
}, 3, 9);

var texWall = makeTex(512, 512, function (ctx, w, h) {
  ctx.fillStyle = '#f0ece4'; ctx.fillRect(0, 0, w, h);
  // Grain plâtre plus marqué
  ctx.globalAlpha = 0.07;
  for (var i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random()>.5?'#fff':'#000';
    ctx.fillRect(Math.random()*w, Math.random()*h, 1+Math.random()*2.5, 1+Math.random()*2.5);
  }
  // Légères stries verticales (effet crépi)
  ctx.globalAlpha = 0.04;
  for (var j = 0; j < w; j += 4) {
    ctx.strokeStyle = '#7a5830'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(j, 0); ctx.lineTo(j+(Math.random()-0.5)*3, h); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}, 7, 2);

var texPave = makeTex(512, 512, function (ctx, w, h) {
  ctx.fillStyle = '#1a1208'; ctx.fillRect(0, 0, w, h);
  var tw = 88, th = 48;
  for (var ry = 0; ry < h+th; ry += th) {
    var off = (Math.floor(ry/th)%2)*tw/2;
    for (var rx = -off; rx < w+tw; rx += tw) {
      var vv = (Math.random()-.5)*18, b = 46+Math.round(vv);
      ctx.fillStyle='rgb('+(b+6)+','+b+','+(b-4)+')';
      ctx.fillRect(rx+2, ry+2, tw-4, th-4);
      ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1.5;
      ctx.strokeRect(rx+2, ry+2, tw-4, th-4);
    }
  }
}, 5, 7);

var texBois = makeTex(256, 512, function (ctx, w, h) {
  ctx.fillStyle='#3e2410'; ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=0.22;
  for (var i=0; i<30; i++) {
    ctx.strokeStyle=Math.random()>.5?'#1e0c04':'#5e3820';
    ctx.lineWidth=0.4+Math.random()*1.8;
    var y0=Math.random()*h;
    ctx.beginPath(); ctx.moveTo(0,y0);
    ctx.bezierCurveTo(w*.3,y0+(Math.random()-.5)*8,w*.7,y0+(Math.random()-.5)*8,w,y0+(Math.random()-.5)*6);
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}, 1, 3);

var texFacade = makeTex(512, 512, function (ctx, w, h) {
  // Pierre haussmannienne — beige clair
  ctx.fillStyle='#c8b890'; ctx.fillRect(0,0,w,h);
  // Grain pierre léger
  ctx.globalAlpha=0.06;
  for (var i=0; i<6000; i++) {
    ctx.fillStyle=Math.random()>.5?'#fff':'#000';
    ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);
  }
  // Joints horizontaux (assises de pierre)
  ctx.globalAlpha=0.14;
  for (var j=0; j<h; j+=28) {
    ctx.strokeStyle='#9a8060'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(w,j); ctx.stroke();
  }
  // Joints verticaux décalés (appareillage)
  ctx.globalAlpha=0.08;
  for (var r=0; r<h; r+=28) {
    var off=(Math.floor(r/28)%2)*56;
    for (var c=off; c<w; c+=112) {
      ctx.strokeStyle='#9a8060'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(c,r); ctx.lineTo(c,r+28); ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
}, 2, 3);

var texSign = makeTex(512, 128, function (ctx, w, h) {
  ctx.fillStyle='#120a04'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#c4895a'; ctx.lineWidth=2.5; ctx.strokeRect(5,5,w-10,h-10);
  ctx.fillStyle='#d4a070'; ctx.font='italic 60px Georgia,serif';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('Arcadia',w/2,h/2-4);
  ctx.font='11px Georgia'; ctx.fillStyle='rgba(196,137,90,0.7)'; ctx.fillText('✦  Restaurant  ✦',w/2,h*.84);
}, 1, 1);

var texCuisine = makeTex(256, 360, function (ctx, w, h) {
  // Fond bois sombre
  ctx.fillStyle = '#2e1808'; ctx.fillRect(0, 0, w, h);
  // Panneau encadré
  ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, w-20, h-20);
  ctx.strokeStyle = '#4a2808'; ctx.lineWidth = 1; ctx.strokeRect(15, 15, w-30, h-30);
  // Hublot rond
  var cx = w/2, cy = h*0.38, r = 36;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = '#2a3a48'; ctx.fill();
  ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 5; ctx.stroke();
  // Croisillons hublot
  ctx.strokeStyle = '#6a4018'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx-r, cy); ctx.lineTo(cx+r, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy-r); ctx.lineTo(cx, cy+r); ctx.stroke();
  // Reflet hublot
  ctx.beginPath(); ctx.arc(cx-10, cy-12, 8, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
  // Texte "Cuisine"
  ctx.fillStyle = '#c4a060'; ctx.font = 'italic bold 24px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Cuisine', w/2, h*0.68);
  // Trait décoratif
  ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(35, h*0.76); ctx.lineTo(w-35, h*0.76); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(35, h*0.60); ctx.lineTo(w-35, h*0.60); ctx.stroke();
}, 1, 1);

function makeArt(sd) {
  return makeTex(256, 320, function (ctx, w, h) {
    var s = sd;
    var rng = function() { s=(s*9301+49297)%233280; return s/233280; };
    ctx.fillStyle='#1a1206'; ctx.fillRect(0,0,w,h);
    for (var i=0; i<7; i++) {
      var gx=rng()*w, gy=rng()*h;
      var gr=ctx.createRadialGradient(gx,gy,0,gx,gy,70+rng()*60);
      gr.addColorStop(0,'rgba(196,137,90,'+(0.2+rng()*0.28)+')');
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
  ceil:   new THREE.MeshStandardMaterial({ color:0xf5f2ec, roughness:0.92 }),
  wall:   new THREE.MeshStandardMaterial({ map:texWall,  roughness:0.88, side:THREE.DoubleSide }),
  pave:   new THREE.MeshStandardMaterial({ map:texPave,  roughness:0.94 }),
  facade: new THREE.MeshStandardMaterial({ map:texFacade,roughness:0.86 }),
  door:   new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.52, metalness:0.05 }),
  bois:   new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.62, metalness:0.04 }),
  table:  new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.55, metalness:0.05, color:0xc49a68 }),
  beam:   new THREE.MeshStandardMaterial({ map:texBois,  roughness:0.75, color:0x7a5838 }),
  leg:    new THREE.MeshStandardMaterial({ color:0x2e1a0a, roughness:0.85 }),
  plate:  new THREE.MeshStandardMaterial({ color:0xf8f3ec, roughness:0.2 }),
  cloth:  new THREE.MeshStandardMaterial({ color:0xf0ebe0, roughness:0.85 }),
  glass:  new THREE.MeshStandardMaterial({ color:0x556677, roughness:0.04, transparent:true, opacity:0.88, metalness:0.3 }),
  gold:   new THREE.MeshStandardMaterial({ color:0xc4895a, roughness:0.18, metalness:0.78 }),
  sign:   new THREE.MeshStandardMaterial({ map:texSign,    roughness:0.45 }),
  menu:   new THREE.MeshStandardMaterial({ map:texMenu,    roughness:0.55 }),
  cuisine:new THREE.MeshStandardMaterial({ map:texCuisine, roughness:0.52 }),
  miroir: new THREE.MeshStandardMaterial({ color:0x90aabb, roughness:0.02, metalness:0.95 }),
  shade:  new THREE.MeshStandardMaterial({ color:0x281400, roughness:0.6, side:THREE.DoubleSide }),
  plant:  new THREE.MeshStandardMaterial({ color:0x2a5018, roughness:0.92 }),
  pot:    new THREE.MeshStandardMaterial({ color:0x8c6248, roughness:0.72 }),
  banq:   new THREE.MeshStandardMaterial({ color:0x7a5030, roughness:0.72 }),
  frame:  new THREE.MeshStandardMaterial({ color:0x2a1a0a, roughness:0.3, metalness:0.6 }),
  art1:   new THREE.MeshStandardMaterial({ map:makeArt(123), roughness:0.6 }),
  art2:   new THREE.MeshStandardMaterial({ map:makeArt(456), roughness:0.6 }),
  art3:   new THREE.MeshStandardMaterial({ map:makeArt(789), roughness:0.6 }),
  awning: new THREE.MeshStandardMaterial({ color:0x1a0c06, roughness:0.88, side:THREE.DoubleSide }),
  ciment: new THREE.MeshStandardMaterial({ color:0x1a1408, roughness:0.96 }),
  copper: new THREE.MeshStandardMaterial({ color:0xb87040, roughness:0.25, metalness:0.85 }),
  // Émissifs — bloom les fera vraiment briller
  bulb:   new THREE.MeshStandardMaterial({ color:0xffffff, emissive:new THREE.Color(0xffeeaa), emissiveIntensity:1.6 }),
  flame:  new THREE.MeshBasicMaterial({ color:0xffcc44 }),          // très lumineux = bloom fort
  glowR:  new THREE.MeshBasicMaterial({ color:0xff6600, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false }),
  winLit: new THREE.MeshStandardMaterial({ color:0xffcc88, emissive:new THREE.Color(0xffcc66), emissiveIntensity:1.1 }),
  winDim: new THREE.MeshStandardMaterial({ color:0x4a5830, emissive:new THREE.Color(0x3a4820), emissiveIntensity:0.4 }),
  winOff: new THREE.MeshStandardMaterial({ color:0x0a0c10, roughness:0.5 }),
  bldg:   new THREE.MeshStandardMaterial({ color:0x161210, roughness:0.92 }),
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

/* ── LUMIÈRES ─────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffeecc, 1.2));
var dir = new THREE.DirectionalLight(0xffc87a, 0.8);
dir.position.set(3, 8, 5); scene.add(dir);
// Spots de façade (éclairent la pierre depuis le bas)
var facL1 = new THREE.SpotLight(0xffd090, 3.5, 12, Math.PI/5, 0.4); facL1.position.set(-4, 0.5, 17.5); facL1.target.position.set(-4, 4, 16); scene.add(facL1); scene.add(facL1.target);
var facL2 = new THREE.SpotLight(0xffd090, 3.5, 12, Math.PI/5, 0.4); facL2.position.set( 4, 0.5, 17.5); facL2.target.position.set( 4, 4, 16); scene.add(facL2); scene.add(facL2.target);
// Spot d'entrée — éclaire la porte en or/cuivré depuis l'extérieur
var doorSpot = new THREE.SpotLight(0xffcc66, 4.0, 10, Math.PI/6, 0.5); doorSpot.position.set(0, 5.5, 18); doorSpot.target.position.set(0, 1.8, 16.1); scene.add(doorSpot); scene.add(doorSpot.target);
// Lumière terrasse
var terL = new THREE.PointLight(0xffcc66, 2.0, 16, 1.6); terL.position.set(0, 3.5, 19.5); scene.add(terL);
// Zones intérieur — éclairage chaud, dosé
var entL  = new THREE.PointLight(0xffcc88, 2.2, 14, 1.8); entL.position.set(0,3.2,10);    scene.add(entL);
var midL  = new THREE.PointLight(0xffcc88, 2.0, 16, 1.6); midL.position.set(0,3.0,-2);    scene.add(midL);
var leftL = new THREE.PointLight(0xffbb66, 1.8, 12, 1.8); leftL.position.set(-5,2.8,-6);  scene.add(leftL);
var rightL= new THREE.PointLight(0xffbb66, 1.8, 12, 1.8); rightL.position.set(5,2.8,-6);  scene.add(rightL);
var backL = new THREE.PointLight(0xffcc88, 2.0, 16, 1.6); backL.position.set(0,3.0,-16);  scene.add(backL);
var barL  = new THREE.PointLight(0xffcc88, 2.5, 16, 1.5); barL.position.set(0,2.6,-23);   scene.add(barL);
// Fenêtres côté gauche — lumière naturelle douce
var winL1 = new THREE.PointLight(0xfff0e8, 1.4, 10, 1.8); winL1.position.set(-W+0.5,2.2,-4);  scene.add(winL1);
var winL2 = new THREE.PointLight(0xfff0e8, 1.4, 10, 1.8); winL2.position.set(-W+0.5,2.2,-13); scene.add(winL2);
// Extérieur nuit (froid)
var extL  = new THREE.PointLight(0x6677aa, 2.0, 24, 1.5); extL.position.set(0,5,22);    scene.add(extL);

/* ── ARCHITECTURE ─────────────────────────────────────── */
var W = 5.5;  // demi-largeur intérieure (11m total, bistrot réaliste)

// SOL — s'arrête à la façade (z≈16)
pln(W*2, 46, M.floor,  0, 0.001, -6.8, -Math.PI/2);
pln(26, 20,  M.pave,   0, -0.01, 23,   -Math.PI/2);
box(W*2+1, 0.12, 3, M.pave, 0, 0.06, 17);

// PLAFOND — s'arrête à la façade
pln(W*2, 46, M.ceil, 0, 4.1, -6.8, Math.PI/2);

// MURS LATÉRAUX — de -29 à 16
pln(46, 4.4, M.wall, -W, 2.1, -6.8, 0,  Math.PI/2);
pln(46, 4.4, M.wall,  W, 2.1, -6.8, 0, -Math.PI/2);
pln(W*2, 4.4, M.wall, 0, 2.1, -31);

// Murs extérieurs du bâtiment (épais, visibles de la rue) — front face à z≈16.35 pour recouvrir la façade
box(0.35, 11, 47.7, M.bldg, -W-0.18, 5.4, -7.15);
box(0.35, 11, 47.7, M.bldg,  W+0.18, 5.4, -7.15);

// Lambris bas (wainscoting bois sombre — de 0 à 1.38m)
var lambrisMat = new THREE.MeshStandardMaterial({ map:texBois, roughness:0.65, color:0x9a7848 });
pln(46, 1.38, lambrisMat, -W+0.06, 0.69, -6.8, 0, Math.PI/2);
pln(46, 1.38, lambrisMat,  W-0.06, 0.69, -6.8, 0, -Math.PI/2);
// Plinthes + cimaises
box(0.08, 0.18, 46, M.beam, -W+0.04, 0.09, -6.8);
box(0.08, 0.18, 46, M.beam,  W-0.04, 0.09, -6.8);

// ── PILASTRES — lignes verticales sur les murs pour perspective ──
// Pilastres mur gauche (z = -3, -8, -13, -18, -23)
var pilMat = new THREE.MeshStandardMaterial({ map:texBois, roughness:0.62, color:0xb08858 });
[-3, -8, -13, -18, -23].forEach(function(pz) {
  // Corps du pilastre (bois clair, légèrement saillant)
  box(0.1, 4.4, 0.12, pilMat, -W+0.06, 2.1, pz);
  // Chapiteaux haut/bas
  box(0.14, 0.08, 0.16, M.gold, -W+0.06, 4.1, pz);
  box(0.14, 0.08, 0.16, M.gold, -W+0.06, 0.24, pz);
});
// Pilastres mur droit
[-3, -8, -13, -18, -23].forEach(function(pz) {
  box(0.1, 4.4, 0.12, pilMat,  W-0.06, 2.1, pz);
  box(0.14, 0.08, 0.16, M.gold,  W-0.06, 4.1, pz);
  box(0.14, 0.08, 0.16, M.gold,  W-0.06, 0.24, pz);
});

// ── FENÊTRES côté gauche — lumière naturelle simulée ──
var winFrameMat = new THREE.MeshStandardMaterial({ color:0xd4c4a8, roughness:0.5 });
var winGlassMat = new THREE.MeshStandardMaterial({ color:0xfff0d8, emissive:new THREE.Color(0xffead0), emissiveIntensity:0.6, roughness:0.05, transparent:true, opacity:0.65 });
[[-4, 2.4], [-13, 2.4]].forEach(function(fw) {
  var fz = fw[0], fy = fw[1];
  // Cadre fenêtre
  box(0.1, 1.8, 0.12, winFrameMat, -W+0.05, fy, fz);
  // Vitrage lumineux
  box(0.04, 1.6, 1.1, winGlassMat, -W+0.04, fy, fz);
  // Traverses
  box(0.08, 0.05, 1.16, winFrameMat, -W+0.06, fy+0.78, fz);
  box(0.08, 0.05, 1.16, winFrameMat, -W+0.06, fy-0.78, fz);
  box(0.08, 1.66, 0.05, winFrameMat, -W+0.06, fy, fz-0.58);
  box(0.08, 1.66, 0.05, winFrameMat, -W+0.06, fy, fz+0.58);
});
box(0.06, 0.04, 46, M.gold, -W+0.04, 1.38, -6.8);
box(0.06, 0.04, 46, M.gold,  W-0.04, 1.38, -6.8);
box(W*2, 0.04, 0.08, M.gold, 0, 1.38, -30.9);

// Poutres plafond
[-8,-14,-20].forEach(function(z) { box(W*2+0.2, 0.26, 0.34, M.beam, 0, 3.97, z); });
box(0.2, 0.2, 46, M.beam, 0, 3.92, -6.8);

/* ── FAÇADE RDC ───────────────────────────────────────── */
// Piliers extérieurs gauche/droit (rescalés pour W=5.5)
box(1.6, 4.4, 0.28, M.facade, -4.25, 2.1, 16.2);
box(1.6, 4.4, 0.28, M.facade,  4.25, 2.1, 16.2);
// Piliers intérieurs gauche/droit
box(1.3, 4.4, 0.28, M.facade, -2.8, 2.1, 16.2);
box(1.3, 4.4, 0.28, M.facade,  2.8, 2.1, 16.2);
// Bandeau au-dessus de la porte (pleine largeur ouverture)
box(3.22, 1.25, 0.28, M.facade, 0, 3.72, 16.2);
// Bandes horizontales
box(W*2+0.5, 0.14, 0.38, M.gold,   0, 4.26, 16.2);
box(W*2+0.5, 0.28, 0.38, M.ciment, 0, 0.14, 16.2);

// (fond vestibule supprimé — la caméra le traversait)

// Vitrines (rescalées pour W=5.5) + fond sombre intérieur pour bloquer la vue
[[-3.6],[3.6]].forEach(function(cx) {
  // Fond opaque côté intérieur (empêche de voir la salle depuis l'ext)
  box(2.4, 2.8, 0.08, new THREE.MeshStandardMaterial({ color:0x0e0c0a, roughness:0.7 }), cx[0], 1.7, 15.7);
  box(2.2, 2.6, 0.1, M.glass, cx[0], 1.7, 16.12);
  box(2.32, 0.07, 0.16, M.gold, cx[0], 3.02, 16.16);
  box(2.32, 0.07, 0.16, M.gold, cx[0], 0.42, 16.16);
  box(0.07, 2.68, 0.16, M.gold, cx[0]-1.16, 1.7, 16.16);
  box(0.07, 2.68, 0.16, M.gold, cx[0]+1.16, 1.7, 16.16);
});

// Enseigne
box(4.5, 0.68, 0.08, M.sign,  0, 3.1, 16.22);
box(4.62, 0.8, 0.06, M.gold, 0, 3.1, 16.26);

/* ── BÂTIMENT — ÉTAGES SUPÉRIEURS ────────────────────── */
// Étage 1
box(W*2+0.5, 3.2, 0.32, M.bldg, 0, 5.94, 16.2);
box(W*2+0.5, 0.1, 0.35, M.gold, 0, 7.52, 16.2);
var w1pos = [-4.5,-2.7,-0.9,0.9,2.7,4.5];
var w1lit  = [true,false,true,true,false,true];
w1pos.forEach(function(wx,wi) {
  box(1.4, 2.0, 0.1, wi%3===0?M.winLit:wi%3===1?M.winDim:M.winOff, wx, 5.94, 16.3);
  box(0.07, 2.1, 0.15, M.bldg, wx-0.75, 5.94, 16.3);
  box(0.07, 2.1, 0.15, M.bldg, wx+0.75, 5.94, 16.3);
  box(1.54, 0.07, 0.15, M.bldg, wx, 7.0,  16.3);
  box(1.54, 0.07, 0.15, M.bldg, wx, 4.95, 16.3);
});

// Étage 2
box(W*2+0.5, 2.9, 0.32, M.bldg, 0, 8.98, 16.2);
box(W*2+0.5, 0.1, 0.35, M.gold, 0, 10.42, 16.2);
var w2pos = [-4.0,-2.0,0,2.0,4.0];
w2pos.forEach(function(wx,wi) {
  box(1.3, 1.8, 0.1, wi%2===0?M.winDim:M.winLit, wx, 8.98, 16.3);
  box(0.07, 1.9, 0.15, M.bldg, wx-0.69, 8.98, 16.3);
  box(0.07, 1.9, 0.15, M.bldg, wx+0.69, 8.98, 16.3);
  box(1.44, 0.07, 0.15, M.bldg, wx, 9.9,  16.3);
  box(1.44, 0.07, 0.15, M.bldg, wx, 8.06, 16.3);
});

// Attique / toit
box(W*2+0.5, 0.5, 0.4, M.bldg, 0, 10.72, 16.1);
box(W*2+0.6, 0.12, 0.5, M.gold, 0, 10.97, 16.1);

/* ── IMMEUBLES VOISINS — facades sombres, sans fenêtres criantes ── */
var nbMat = new THREE.MeshStandardMaterial({ color:0x100e0c, roughness:0.96 });
var nbMat2 = new THREE.MeshStandardMaterial({ color:0x0e0c0a, roughness:0.96 });
// Très petites fenêtres quasi-invisibles (juste des creuses sombres)
var winSubtle = new THREE.MeshStandardMaterial({ color:0x1a1e14, roughness:0.7 });

// Immeuble voisin gauche — plus large et plus haut
box(12, 18, 1.0, nbMat, -W-6.5, 9.0, 16.1);
[[-3,5],[0,5],[3,5],[-3,9],[0,9],[3,9],[-3,13],[0,13],[3,13]].forEach(function(p) {
  box(0.9, 1.2, 0.06, winSubtle, -W-6.5+p[0], p[1], 16.62);
});
// Prolongement encore plus large (fond de rue gauche)
box(14, 16, 0.8, nbMat2, -W-19, 8.0, 16.1);
[[-4,5],[0,5],[4,5],[-4,9.5],[0,9.5],[4,9.5],[-4,13],[0,13],[4,13]].forEach(function(p) {
  box(0.9, 1.1, 0.05, winSubtle, -W-19+p[0], p[1], 16.46);
});

// Immeuble voisin droit — plus large et plus haut
box(12, 16, 1.0, nbMat,  W+6.5, 8.0, 16.1);
[[-3,4.5],[0,4.5],[3,4.5],[-3,9],[0,9],[3,9],[-3,12.5],[0,12.5],[3,12.5]].forEach(function(p) {
  box(0.9, 1.2, 0.06, winSubtle, W+6.5+p[0], p[1], 16.62);
});
// Prolongement encore plus large (fond de rue droit)
box(14, 14, 0.8, nbMat2,  W+19, 7.0, 16.1);
[[-4,4.5],[0,4.5],[4,4.5],[-4,9],[0,9],[4,9],[-4,12],[0,12],[4,12]].forEach(function(p) {
  box(0.9, 1.1, 0.05, winSubtle, W+19+p[0], p[1], 16.46);
});

// Trottoir + route — élargi pour couvrir toute la scène
box(W*2+60, 0.15, 0.3, M.ciment, 0, 0.075, 19.3);
pln(70, 6, new THREE.MeshStandardMaterial({ color:0x0a0908, roughness:0.98 }), 0, -0.01, 25.5, -Math.PI/2);

// (mur de fond de rue supprimé — bloquait la vue sur la porte)

/* ── AUVENT pleine façade ─────────────────────────────── */
// Barre de fixation
box(W*2+0.3, 0.1, 0.18, M.gold, 0, 4.32, 16.16);
// Toit horizontal de l'auvent
box(W*2+0.2, 0.07, 2.0, M.awning, 0, 4.28, 15.22);
// Pan incliné avant
var awFront = new THREE.Mesh(new THREE.PlaneGeometry(W*2+0.2, 2.0), M.awning);
awFront.position.set(0, 3.45, 14.3); awFront.rotation.x = 0.55; scene.add(awFront);
// Valance tombante (bord)
box(W*2+0.2, 0.45, 0.05, M.awning, 0, 2.65, 13.35);

/* ── PORTE (2 battants animés) ────────────────────────── */
box(0.1, 3.5, 0.24, M.gold, -1.55, 1.85, 16.1);
box(0.1, 3.5, 0.24, M.gold,  1.55, 1.85, 16.1);
box(3.22, 0.1, 0.24, M.gold, 0, 3.45, 16.1);
box(3.18, 0.07, 0.26, M.gold, 0, 0.035, 16.1);

var doorL = new THREE.Group();
doorL.position.set(-1.55, 1.85, 16.1);
var dpL = new THREE.Mesh(new THREE.BoxGeometry(1.52, 3.26, 0.08), M.door);
dpL.position.x = +0.76; doorL.add(dpL);
[0.72,-0.72].forEach(function(py) {
  var p = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.95, 0.04), M.door);
  p.position.set(+0.76, py, 0.065); doorL.add(p);
});
var hG = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), M.gold);
hG.rotation.z = Math.PI/2; hG.position.set(+1.36, 0, 0.11); doorL.add(hG);
scene.add(doorL);

var doorR = new THREE.Group();
doorR.position.set(1.55, 1.85, 16.1);
var dpR = new THREE.Mesh(new THREE.BoxGeometry(1.52, 3.26, 0.08), M.door);
dpR.position.x = -0.76; doorR.add(dpR);
[0.72,-0.72].forEach(function(py) {
  var p = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.95, 0.04), M.door);
  p.position.set(-0.76, py, 0.065); doorR.add(p);
});
var hD = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), M.gold);
hD.rotation.z = Math.PI/2; hD.position.set(-1.36, 0, 0.11); doorR.add(hD);
scene.add(doorR);

/* ── RÉVERBÈRES ───────────────────────────────────────── */
function lantern(x, z) {
  cyl(0.035, 0.035, 4.2, 8, M.ciment, x, 2.1, z);
  box(0.24, 0.38, 0.24, M.ciment, x, 4.3, z);
  // Ampoule petite — bloom doux
  var lb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 7), M.bulb);
  lb.position.set(x, 4.08, z); scene.add(lb);
  var lp = new THREE.PointLight(0xffcc66, 1.2, 10, 2);
  lp.position.set(x, 4.08, z); scene.add(lp);
}
lantern(-6, 21);
lantern( 6, 21);

/* ── PLANTES ──────────────────────────────────────────── */
function plante(x, z) {
  cyl(0.24, 0.19, 0.44, 10, M.pot, x, 0.22, z);
  var f = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 5), M.plant);
  f.scale.y = 1.3; f.position.set(x, 0.72, z); scene.add(f);
}
plante(-2.8, 16.8); plante(2.8, 16.8);
plante(-6.5, -22);  plante(6.5, -4);
/* ── TERRASSE BISTROT — côté gauche du restaurant ────────── */
// Terrasse à gauche de l'entrée (x : -8.5 à -14.5, z : 17 à 23)
var TX = -11.5; // centre horizontal de la terrasse
var TZ =  20.0; // centre en profondeur

// Sol terrasse (pavés clairs)
pln(6.0, 6.2, new THREE.MeshStandardMaterial({ color:0xc0b090, roughness:0.92 }), TX, 0.002, TZ, -Math.PI/2);

// Garde-corps métal noir — style bistrot parisien
var railMat = new THREE.MeshStandardMaterial({ color:0x181818, roughness:0.28, metalness:0.75 });
// Barre haute + basse côté rue (z = 23.1)
box(6.0, 0.05, 0.04, railMat, TX, 0.95, 23.1);
box(6.0, 0.05, 0.04, railMat, TX, 0.52, 23.1);
// Côté gauche (x = -14.5)
box(0.04, 0.97, 6.2, railMat, -14.5, 0.49, TZ);
box(0.04, 0.05, 6.2, railMat, -14.5, 0.95, TZ);
// Potelets côté rue
[-14.5,-12.5,-10.5,-8.5].forEach(function(px) {
  cyl(0.022,0.022,0.98,6,railMat,px,0.49,23.1);
});
// Potelets côté gauche
[17.0,19.0,21.0,23.1].forEach(function(pz) {
  cyl(0.022,0.022,0.98,6,railMat,-14.5,0.49,pz);
});

// Tables bistrot : plateau zinc rond, pied fonte
var zincMat  = new THREE.MeshStandardMaterial({ color:0x9aaa9a, roughness:0.35, metalness:0.55 });
var fonteMat = new THREE.MeshStandardMaterial({ color:0x141414, roughness:0.45, metalness:0.6  });

function tableBistrot(x, z) {
  // Plateau zinc
  cyl(0.36, 0.36, 0.03, 14, zincMat, x, 0.74, z);
  // Pied central fonte (évasé en bas)
  cyl(0.018, 0.018, 0.72, 7, fonteMat, x, 0.36, z);
  // Base en croix
  box(0.64, 0.025, 0.06, fonteMat, x, 0.025, z);
  box(0.06, 0.025, 0.64, fonteMat, x, 0.025, z);
  // Collerette décorative mi-pied
  cyl(0.055, 0.03, 0.06, 9, fonteMat, x, 0.52, z);
}

// Chaise bistrot Thonet (bois courbé, assise cannée)
var thonetMat = new THREE.MeshStandardMaterial({ color:0x2e1a08, roughness:0.75 });
var canneMat  = new THREE.MeshStandardMaterial({ color:0xc8a060, roughness:0.82 });

function chaiseBistrot(x, z, ry) {
  var g = new THREE.Group();
  // Assise cannée
  var seat = new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.03,12), canneMat); seat.position.y=0.46; g.add(seat);
  // Dossier arrondi (2 montants + traverses)
  var back = new THREE.Mesh(new THREE.TorusGeometry(0.18,0.018,6,14,Math.PI), thonetMat);
  back.position.set(0,0.82,-0.18); back.rotation.x=Math.PI/2; g.add(back);
  var bL = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.42,6), thonetMat);
  bL.position.set(-0.14,0.62,-0.19); bL.rotation.x=-0.18; g.add(bL);
  var bR = bL.clone(); bR.position.set(0.14,0.62,-0.19); g.add(bR);
  // 4 pieds galbés
  [[-0.17,-0.15,Math.PI*0.06],[-0.17,0.15,-Math.PI*0.06],[0.17,-0.15,Math.PI*0.06],[0.17,0.15,-Math.PI*0.06]].forEach(function(p) {
    var l = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.47,6), thonetMat);
    l.position.set(p[0],0.23,p[1]); l.rotation.x=p[2]; g.add(l);
  });
  g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
}

// 3 tables + 2 chaises chacune
tableBistrot(-13.0, 18.2); chaiseBistrot(-13.0, 17.35, 0);    chaiseBistrot(-13.0, 19.05, Math.PI);
tableBistrot(-11.5, 20.5); chaiseBistrot(-11.5, 19.65, 0);    chaiseBistrot(-11.5, 21.35, Math.PI);
tableBistrot(-10.0, 18.2); chaiseBistrot(-10.0, 17.35, 0);    chaiseBistrot(-10.0, 19.05, Math.PI);

// Plantes d'ambiance terrasse
plante(-14.2, 17.2); plante(-8.6, 17.2);

/* ── DÉCO MURALE ──────────────────────────────────────── */
box(0.06, 1.8, 1.3, M.frame, -W+0.04, 2.2, 7);
pln(1.18, 1.62, M.art1, -W+0.09, 2.2, 7, 0, Math.PI/2);
box(0.06, 2.0, 1.5, M.frame, W-0.04, 2.3, 2);
pln(1.38, 1.82, M.art2, W-0.09, 2.3, 2, 0, -Math.PI/2);
box(0.06, 2.2, 1.7, M.frame, -W+0.04, 2.4, -8);
pln(1.58, 2.02, M.art3, -W+0.09, 2.4, -8, 0, Math.PI/2);
box(0.06, 2.4, 1.8, M.frame, W-0.04, 2.4, -14);
box(0.03, 2.28, 1.68, M.miroir, W-0.06, 2.4, -14);

/* ── BANQUETTE ────────────────────────────────────────── */
box(0.8, 0.16, 14, M.banq, -W+0.62, 0.5, -7);
box(0.12, 0.52, 14, M.banq, -W+0.1, 0.92, -7);
box(0.72, 0.08, 13.8, new THREE.MeshStandardMaterial({ color:0xa07848, roughness:0.75 }), -W+0.62, 0.6, -7);

/* ── PUPITRE D'ACCUEIL ────────────────────────────────── */
box(0.58, 1.1, 0.48, M.bois,  1.5, 0.55, 12.5);
box(0.6,  0.04, 0.5, M.gold,  1.5, 1.12, 12.5);
var pupTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.5), M.beam);
pupTop.position.set(1.5, 1.16, 12.5); pupTop.rotation.x = -0.2; scene.add(pupTop);

/* ── TABLES ───────────────────────────────────────────── */
var flameMeshes = [];

function makeCandle(x, z) {
  cyl(0.028, 0.028, 0.14, 7, new THREE.MeshStandardMaterial({ color:0xfff9f2, roughness:0.9 }), x, 0.93, z);
  var flm = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), M.flame);
  flm.position.set(x, 1.02, z); scene.add(flm);
  var hl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 7), M.glowR);
  hl.position.set(x, 1.02, z); scene.add(hl);
  flameMeshes.push({ flm, hl, off: Math.random()*Math.PI*2 });
}

function tableRect(x, z) {
  box(1.46, 0.07, 0.9, M.table, x, 0.8, z);
  cyl(0.04, 0.04, 0.8, 7, M.leg, x, 0.4, z);
  cyl(0.3, 0.3, 0.04, 10, M.leg, x, 0.02, z);
  cyl(0.22, 0.22, 0.015, 14, M.plate, x, 0.85, z-0.22);
  cyl(0.22, 0.22, 0.015, 14, M.plate, x, 0.85, z+0.22);
  cyl(0.05, 0.038, 0.18, 8, M.glass, x+0.28, 0.94, z-0.22);
  cyl(0.05, 0.038, 0.18, 8, M.glass, x+0.28, 0.94, z+0.22);
  makeCandle(x, z);
  // Ampoule pendante (bloom)
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), M.bulb);
  bulb.position.set(x, 3.06, z); scene.add(bulb);
  box(0.012, 0.6, 0.012, M.leg, x, 3.68, z);
  var sh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 10, 1, true), M.shade);
  sh.position.set(x, 3.22, z); scene.add(sh);
}

function tableRnd(x, z) {
  cyl(0.55, 0.55, 0.07, 18, M.table, x, 0.8, z);
  cyl(0.04, 0.04, 0.8, 7, M.leg, x, 0.4, z);
  cyl(0.22, 0.22, 0.015, 14, M.plate, x-0.22, 0.85, z);
  cyl(0.22, 0.22, 0.015, 14, M.plate, x+0.22, 0.85, z);
  cyl(0.05, 0.038, 0.18, 8, M.glass, x, 0.94, z-0.3);
  cyl(0.05, 0.038, 0.18, 8, M.glass, x, 0.94, z+0.3);
  makeCandle(x, z);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), M.bulb);
  bulb.position.set(x, 3.06, z); scene.add(bulb);
  box(0.012, 0.6, 0.012, M.leg, x, 3.68, z);
  var sh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 10, 1, true), M.shade);
  sh.position.set(x, 3.22, z); scene.add(sh);
}

tableRect(-W+1.8,  5); tableRect(-W+1.8, -1);
tableRect(-W+1.8, -8); tableRect(-W+1.8,-14);
tableRnd(W-2.2,  6);   tableRnd(W-2.2, -1);  tableRnd(W-2.2, -9);
tableRect(0.8,  3);    tableRect(-0.5, -5);   tableRect(0.5,-12);

/* ── CARTE MENU ───────────────────────────────────────── */
var menuObj = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.008, 0.40), M.menu);
menuObj.position.set(-W+1.8, 0.862, -0.8); menuObj.rotation.y = 0.25; scene.add(menuObj);
var spine = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.012, 0.405),
  new THREE.MeshStandardMaterial({ color:0xc4895a, roughness:0.25, metalness:0.55 }));
spine.position.set(-W+1.8, 0.858, -0.8); spine.rotation.y = 0.25; scene.add(spine);

/* ── CHAISES ──────────────────────────────────────────── */
function chaise(x, z, ry) {
  var g = new THREE.Group();
  var sm = new THREE.MeshStandardMaterial({ color:0x5a3018, roughness:0.7 });
  var seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.44), sm); seat.position.y=0.47; g.add(seat);
  var back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.05), sm); back.position.set(0,0.74,-0.2); g.add(back);
  [[-0.2,-0.18],[0.2,-0.18],[-0.2,0.18],[0.2,0.18]].forEach(function(p) {
    var l=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.46,0.04),M.leg); l.position.set(p[0],0.23,p[1]); g.add(l);
  });
  g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
}
[5,-1,-8,-14].forEach(function(z) {
  chaise(-W+1.8+0.9, z, -Math.PI/2);
  chaise(-W+1.8, z-0.68, 0);
  chaise(-W+1.8, z+0.68, Math.PI);
});
[[W-2.2,6],[W-2.2,-1],[W-2.2,-9]].forEach(function(t) {
  chaise(t[0]-0.82,t[1],Math.PI/2); chaise(t[0]+0.82,t[1],-Math.PI/2);
  chaise(t[0],t[1]-0.72,0);         chaise(t[0],t[1]+0.72,Math.PI);
});
[[0.8,3],[-0.5,-5],[0.5,-12]].forEach(function(t) {
  chaise(t[0]-0.9,t[1],Math.PI/2); chaise(t[0]+0.9,t[1],-Math.PI/2);
  chaise(t[0],t[1]-0.68,0);        chaise(t[0],t[1]+0.68,Math.PI);
});

/* ── BAR ──────────────────────────────────────────────── */
box(10, 1.18, 0.74, M.bois,   0, 0.59, -24.5);
box(10.12, 0.065, 0.84, M.gold, 0, 1.22, -24.5);
box(9.8, 0.08, 0.7, M.copper,  0, 0.08, -24.5);
for (var si=0; si<5; si++) {
  var sx=-2.8+si*1.4;
  cyl(0.22,0.2,0.04,12,M.banq,sx,0.78,-23.4);
  cyl(0.04,0.04,0.78,7,M.copper,sx,0.39,-23.4);
  cyl(0.24,0.24,0.03,10,M.copper,sx,0.02,-23.4);
}
pln(W*2, 4.4, M.wall, 0, 2.1, -27.5);
[2.55,2.0,1.5].forEach(function(hy) { box(7,0.05,0.25,M.beam,0,hy,-27.2); });
for (var bi=0; bi<12; bi++) {
  var bx=-2.5+bi*0.44;
  var bcols=[0x1e2d4a,0x2a3e20,0x3a1a10];
  var bmat=new THREE.MeshStandardMaterial({ color:bcols[bi%3],roughness:0.08,metalness:0.5,transparent:true,opacity:0.82 });
  var bh=0.28+(bi%3)*0.04;
  cyl(0.042,0.036,bh,7,bmat,bx,2.55+bh/2,-27.14);
  cyl(0.042,0.036,bh,7,bmat,bx,2.0+bh/2,-27.14);
}
box(8.2,2.0,0.04,M.frame,0,2.4,-27.44);
box(8.0,1.82,0.03,M.miroir,0,2.4,-27.42);
// Néon/lumière bar (émissif bloom)
var barNeon = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.04, 0.04),
  new THREE.MeshStandardMaterial({ color:0xffd090, emissive:new THREE.Color(0xffcc66), emissiveIntensity:3.0 }));
barNeon.position.set(0, 1.46, -27.1); scene.add(barNeon);

/* ── PORTE CUISINE ─────────────────────────────────────── */
// À droite du bar, dans le mur du fond
var DKX = W - 0.9; // centre horizontal porte cuisine
// Encadrement (retraite dans le mur)
box(1.05, 2.4, 0.18, new THREE.MeshStandardMaterial({ color:0x1a0e06, roughness:0.8 }), DKX, 1.2, -27.5);
// Montants cadre
box(0.08, 2.4, 0.22, M.beam, DKX - 0.54, 1.2, -27.4);
box(0.08, 2.4, 0.22, M.beam, DKX + 0.54, 1.2, -27.4);
box(1.08, 0.08, 0.22, M.beam, DKX, 2.45, -27.4);
box(1.08, 0.06, 0.22, M.gold, DKX, 2.5,  -27.4);
// Vantail de porte avec texture "Cuisine"
box(0.9, 2.2, 0.06, M.cuisine, DKX, 1.1, -27.38);
// Poignée
cyl(0.014, 0.014, 0.15, 6, M.gold, DKX - 0.34, 1.1, -27.32);
// Petite lumière au-dessus de la porte cuisine
var kitL = new THREE.PointLight(0xffe8b0, 1.0, 5, 2.2);
kitL.position.set(DKX, 2.8, -27.0); scene.add(kitL);
var kitBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), M.bulb);
kitBulb.position.set(DKX, 2.7, -27.1); scene.add(kitBulb);

/* ── PARTICULES ───────────────────────────────────────── */
var PC = 100;
var pPos = new Float32Array(PC*3);
var pVel = new Float32Array(PC);
for (var pi=0; pi<PC; pi++) {
  pPos[pi*3]=(Math.random()-.5)*14; pPos[pi*3+1]=Math.random()*3.8; pPos[pi*3+2]=Math.random()*-46+16;
  pVel[pi]=0.0003+Math.random()*0.0005;
}
var pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0xffcc88,size:0.018,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false })));

/* ── WAYPOINTS ────────────────────────────────────────── */
var WP = [
  { px: 0.5,  py:1.72, pz:21,   lx: 0,   ly:1.62, lz:15.5 }, // Face à la façade, proche
  { px: 0,    py:1.68, pz:15,   lx: 0,   ly:1.6,  lz:5    }, // Franchit la porte
  { px:-0.8,  py:1.65, pz:9,    lx: 1.5, ly:1.5,  lz:0    }, // Entrée salle
  { px:-1.5,  py:1.62, pz: 3,   lx: 2,   ly:1.4,  lz:-6   }, // Vue salle
  { px:-W+2.8,py:1.12, pz:-0.2, lx:-W+1.8,ly:0.86,lz:-0.8 }, // Table + carte
  { px: 1.8,  py:1.62, pz:-10,  lx:-1,   ly:1.4,  lz:-20  }, // Vers bar
  { px: 0.5,  py:1.48, pz:-21,  lx: 0,   ly:1.65, lz:-27  }, // Au bar
];

window._sceneProgress = 0;
function eio(t) { return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
function getWP(p) {
  var n=WP.length-1, s=Math.max(0,Math.min(1,p))*n;
  var i=Math.min(Math.floor(s),n-1), t=eio(s-i), a=WP[i], b=WP[Math.min(i+1,n)];
  return { px:a.px+(b.px-a.px)*t, py:a.py+(b.py-a.py)*t, pz:a.pz+(b.pz-a.pz)*t,
           lx:a.lx+(b.lx-a.lx)*t, ly:a.ly+(b.ly-a.ly)*t, lz:a.lz+(b.lz-a.lz)*t };
}

/* ── BOUCLE ───────────────────────────────────────────── */
var clock = new THREE.Clock();
var lv = new THREE.Vector3();
var sm = { px:WP[0].px,py:WP[0].py,pz:WP[0].pz,lx:WP[0].lx,ly:WP[0].ly,lz:WP[0].lz };
var doorAng = 0;

function tick() {
  requestAnimationFrame(tick);
  var t = clock.getElapsedTime();
  var prog = window._sceneProgress || 0;

  var wp = getWP(prog);
  ['px','py','pz','lx','ly','lz'].forEach(function(k) { sm[k]+=(wp[k]-sm[k])*0.055; });
  camera.position.set(sm.px,sm.py,sm.pz);
  lv.set(sm.lx,sm.ly,sm.lz); camera.lookAt(lv);

  // Portes — ouverture anticipée dès prog=0.04 (avant que la caméra arrive)
  var dp=Math.max(0,Math.min(1,(prog-0.04)/0.10)), ds=dp*dp*(3-2*dp);
  doorAng+=(ds*1.45-doorAng)*0.06;
  doorL.rotation.y=+doorAng;
  doorR.rotation.y=-doorAng;

  // Flammes (bloom fait le reste)
  flameMeshes.forEach(function(c) {
    c.flm.scale.y=0.8+0.22*Math.sin(t*9+c.off);
    c.hl.scale.setScalar(0.85+0.18*Math.sin(t*5.2+c.off));
  });

  // Particules
  var pa=pGeo.attributes.position;
  for (var i=0; i<PC; i++) { pa.array[i*3+1]+=pVel[i]; if(pa.array[i*3+1]>3.9) pa.array[i*3+1]=0; }
  pa.needsUpdate=true;

  composer.render();  // ← remplace renderer.render() : applique le bloom
}
tick();

window.addEventListener('resize', function() {
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.resolution.set(window.innerWidth, window.innerHeight);
});
