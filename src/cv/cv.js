/**
 * blatnikjuree — cist zacetek.
 *
 * Na strani sta samo dve stvari: 3D galaksija in meni.
 *
 * Zaporedje kamere:
 *   1. prilet z zelo dalec proti galaksiji, 2.6 s, easeInOutCubic
 *   2. nato KAMERA krozi okoli galaksije
 *
 * Bistveno: galaksija se NE vrti. Model miruje, premika se kamera. Vrtenje
 * modela pri mirujoci kameri oko prebere kot vrtljiv podstavek, ne kot let.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import galaxyModelUrl from "../assets/3d models/need_some_space.glb?url";
import avatarUrl from "../assets/images/profile picture.png";
import { installDefractedGlass } from "./defractedGlass.js";
import { installSettings, nastavitve } from "./settings.js";
import { installProfile } from "./profile.js";
import { installContextMenu } from "./context.js";
import { installAbout } from "./about.js";
import { installCursor, installMagnetic } from "./cursor.js";
import { installSelectionGlow } from "./selection.js";

// --- nastavitve --------------------------------------------------------------
/**
 * Kolikeni delez visine zaslona naj zavzame galaksija v mirovanju.
 * Cez 1 pomeni, da disk sega cez rob zaslona - tako kot na Sketchfabu.
 */
const TARGET_SCREEN_FILL = 1.45;

/**
 * Delez tock, ki doloca "pravi" polmer galaksije.
 *
 * Ocrtana skatla je tu neuporabna: model ima nekaj osamljenih tock zelo dalec
 * od diska. Oko jih ne vidi, skatlo pa razpotegnejo, zato kamera obstane
 * predalec in galaksija je videti kot pika. Polmer, v katerem lezi 92 % tock,
 * ustreza temu, kar je dejansko videti.
 */
const RADIUS_PERCENTILE = 0.92;

// --- zvezde ------------------------------------------------------------------
/** Najmanjsa zvezda, kot delez polmera galaksije. Velika vecina je pri tem. */
const STAR_SIZE_MIN = 0.0016;
/** Koliko lahko zvezda zraste cez najmanjso. Le pesc jih pride blizu vrha. */
const STAR_SIZE_SPREAD = 0.0085;
const STAR_BRIGHT_MIN = 0.32;
const STAR_BRIGHT_SPREAD = 2.6;
/** Skupna moc; nizja pusti vec prostora barvam, visja pregori jedro v belo. */
const STAR_INTENSITY = 0.62;
/** Oddaljena galaksija v ozadju: koliksen delez merila in svetlosti. */
const DALJNA_MERILO = 0.42;
const DALJNA_MOC = 0.3;

/** 1 = barve iz modela, vec = odmik od sivine. Model je le rahlo obarvan. */
const SATURATION = 2.6;

// --- meglenica ---------------------------------------------------------------
/** Kolikokrat vecja od zvezde. Toliko, da se sosednje lise prekrivajo. */
const DUST_SIZE_MUL = 16;
/** Zelo nizko: megla sme le zapolniti crnino, ne pa preglasiti zvezd. */
const DUST_INTENSITY = 0.058;
/** Nizji upad = bolj plosca, bolj razlita lisa. */
const DUST_FALLOFF = 1.3;

/** Radianov na sekundo. Miren obhod, ne vrtiljak. */
const ORBIT_SPEED = 0.042;

const FLIGHT_START_MUL = 16;   // od kod prileti, kot veckratnik mirovne razdalje
const FLIGHT_MS = 7200;        // umirjen prilet
const ORBIT_HEIGHT_MUL = 0.34; // visina kamere nad ravnino orbite

/**
 * Kolikokrat hitreje se kamera vrti na zacetku priletu kot v orbiti.
 *
 * Hitrost vrtenja je vezana na PREOSTALO RAZDALJO, ne na cas: bolj ko se
 * kamera priblizuje, pocasneje krozi, in ko obmiruje, ostane le se mirna
 * orbita. Tako se prilet in orbita ne stikata - sta ista poteza.
 */
const FLIGHT_SWEEP = 9;
/**
 * Ukrivljenost tega pojemanja. Pod 1 pomeni, da vrtenje popusti sele proti
 * koncu, zato kamera dolgo obkroza in se sele tik pred ciljem umiri.
 */
const SWEEP_FALLOFF = 0.65;

// --- odziv na misko ---------------------------------------------------------
/** Najvecji odklon kamere po vodoravnici, v radianih (~5°). */
const PARALLAX_ANGLE = 0.09;
/** Najvecji odklon po visini, kot delez razdalje. */
const PARALLAX_HEIGHT = 0.075;
/** Casovna konstanta dusenja v sekundah. Visje = bolj leno, tezje. */
const PARALLAX_TAU = 0.85;
/**
 * Priblizanje ob premiku miske: proti sredini se malenkost priblizamo, proti
 * robu odmaknemo. Zelo malo - to se sme le cutiti, ne videti.
 */
const PARALLAX_ZOOM = 0.055;
/** Lastno pocasno nihanje razdalje, da orbita ni mrtva. */
const ZOOM_DRIFT = 0.035;

// --- sij ---------------------------------------------------------------------
const BLOOM_STRENGTH = 0.44;
const BLOOM_RADIUS = 0.3;
/**
 * Prag: sijejo naj le svetlejse zvezde in zgoscено jedro, ne cisto vse. Pri
 * pragu 0 zazari tudi najbolj medla tocka v obrobju in galaksija postane
 * mlecna packa.
 */
const BLOOM_THRESHOLD = 0.38;

const canvas = document.getElementById("galaxy");
// Brez alfe: sij se sesteva na crno podlago in ne skozi prosojnost na stran.
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  // Nujno za zamrznitev: brez tega brskalnik po izrisu izprazni medpomnilnik
  // in platno pocrni, takoj ko neha risati.
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 1);
// Additivno mesanje v jedru sesteje dalec cez 1. Brez preslikave se to odreze
// v plosko belo in barve zvezd izginejo; ACES vrhove stisne, zato jedro
// ostane svetlo, a se vedno obarvano.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, 1, 0.05, 200000);
const target = new THREE.Vector3(0, 0, 0);

// Sij: brez njega so tocke le drobne pike. Sketchfabov videz je v veliki meri
// prav bloom - svetloba, ki se razlije cez rob zvezde.
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
/**
 * Bloom risemo v dvakratni locljivosti. Njegov najgrobji mip je 32x manjsi od
 * te slike in prav ta se ob povecavi razteza v kvadratke okoli svetlih zvezd;
 * pri dvojni locljivosti so ti bloki pol manjsi in zato veliko manj opazni.
 */
const BLOOM_SUPERSAMPLE = 2;

const bloom = new UnrealBloomPass(
  new THREE.Vector2(
    window.innerWidth * BLOOM_SUPERSAMPLE,
    window.innerHeight * BLOOM_SUPERSAMPLE
  ),
  BLOOM_STRENGTH,
  BLOOM_RADIUS,
  BLOOM_THRESHOLD
);
composer.addPass(bloom);

// Brez tega izhod skladatelja ni pretvorjen v sRGB in vsi srednji toni
// odletijo v belo - prav to je galaksijo spremenilo v belo packo.
composer.addPass(new OutputPass());

let materiali = [];
let galaksija = null;   // koren modela
let megla = null;       // plast meglenice okoli zvezd
let daljnaGal = null;   // oddaljena galaksija
let velikostMul = 1;    // mnozitelj velikosti zvezd iz nastavitev
let restDistance = 60;
let startDistance = 60;
let orbitPhase = 0;
let startMs = 0;
let lastMs = 0;
let ready = false;
let zamrznjeno = false;

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Zvezdni material.
 *
 * PointsMaterial vse tocke narise enako velike in enako svetle, zato je disk
 * videti kot enakomeren prah. V resnici - in na Sketchfabu - je nekaj zvezd
 * velikih in zarecih, velika vecina pa drobnih. Ker model velikosti ne nosi,
 * jo dodelimo sami: pow(r, 7) da tezek rep, torej je le pesc zvezd velikih.
 *
 * Svetlost je vezana na velikost; velike zvezde presezejo prag bloomа in
 * zato zazarijo z avreolo, drobne pa ostanejo pike.
 */
function zvezdniMaterial(geometry, radius) {
  const n = geometry.attributes.position.count;
  const vir = geometry.attributes.color;

  const velikost = new Float32Array(n);
  const svetlost = new Float32Array(n);
  const barva = new Float32Array(n * 3);

  for (let i = 0; i < n; i += 1) {
    const r = Math.random();
    const rep = Math.pow(r, 11);
    velikost[i] = radius * (STAR_SIZE_MIN + rep * STAR_SIZE_SPREAD);
    svetlost[i] = STAR_BRIGHT_MIN + rep * STAR_BRIGHT_SPREAD;

    // Nasicenost odmaknemo od sivine, sicer so modri in topli odtenki iz
    // modela presibki, da bi jih bilo na crnini sploh videti.
    if (vir) {
      const cr = vir.getX(i);
      const cg = vir.getY(i);
      const cb = vir.getZ(i);
      const siva = (cr + cg + cb) / 3;
      barva[i * 3] = siva + (cr - siva) * SATURATION;
      barva[i * 3 + 1] = siva + (cg - siva) * SATURATION;
      barva[i * 3 + 2] = siva + (cb - siva) * SATURATION;
    } else {
      barva[i * 3] = barva[i * 3 + 1] = barva[i * 3 + 2] = 1;
    }
  }

  geometry.setAttribute("aVelikost", new THREE.BufferAttribute(velikost, 1));
  geometry.setAttribute("aSvetlost", new THREE.BufferAttribute(svetlost, 1));
  geometry.setAttribute("aBarva", new THREE.BufferAttribute(barva, 3));

  return {
    zvezde: tockovniMaterial({
      velikostMul: 1,
      moc: STAR_INTENSITY,
      upad: 4.6,
      // Vec prostora, da so kraki sploh vidni; jedro ostane majhno.
      meja: 54,
      kraki: true,
    }),
    megla: tockovniMaterial({
      velikostMul: DUST_SIZE_MUL,
      moc: DUST_INTENSITY,
      upad: DUST_FALLOFF,
      meja: 260,
      kraki: false,
    }),
  };
}

/**
 * Ena sencilna predloga za obe plasti.
 *
 * velikostMul in moc locita ostre zvezde od mehke megle: megla je ista
 * geometrija, le veliko vecja in veliko sibkejsa. Brez nje je prostor med
 * zvezdami cisto crn in disk razpade na posamezne pike; z njo se zlije v
 * zvezno svetlikavo meglenico, kot na Sketchfabu.
 */
function tockovniMaterial({ velikostMul, moc, upad, meja, kraki }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMerilo: { value: 1 },
      uMoc: { value: moc },
      uVelikostMul: { value: velikostMul },
      uUpad: { value: upad },
      uMeja: { value: meja },
      uKraki: { value: kraki ? 1 : 0 },
    },
    vertexShader: `
      attribute float aVelikost;
      attribute float aSvetlost;
      attribute vec3 aBarva;
      uniform float uMerilo;
      uniform float uVelikostMul;
      uniform float uMeja;
      varying vec3 vBarva;
      varying float vSvetlost;
      void main() {
        vBarva = aBarva;
        vSvetlost = aSvetlost;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // Perspektivno pojemanje: velikost v svetovnih enotah deljena z globino.
        // Zgornja meja: brez nje tocke tik ob kameri narastejo v packe.
        gl_PointSize = clamp(aVelikost * uVelikostMul * uMerilo / -mv.z, 1.0, uMeja);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uMoc;
      uniform float uUpad;
      uniform float uKraki;
      varying vec3 vBarva;
      varying float vSvetlost;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        float pad = max(1.0 - d, 0.0);

        // Ostro jedro in okoli njega sirsi, sibkejsi halo. Sam upad brez halo
        // dela ploske lise; sam halo dela packe.
        // Sij vecinoma prispevata ta dva sirsa clena, ne bloom: bloom nad
        // dolocено mocjo pokaze svojo mipovo mrezo kot kvadrat okoli zvezde,
        // ta upad pa je racunan iz razdalje do sredisca in je vedno okrogel.
        float a = pow(pad, uUpad) + pow(pad, uUpad * 0.5) * 0.1
              + pow(pad, uUpad * 0.22) * 0.04;

        if (uKraki > 0.5) {
          // Difrakcijski kraki: v teleskopu jih naredijo nosilci zrcala. Brez
          // njih je svetla zvezda le okrogla lisa in je oko ne prebere kot
          // zvezdo - prav to je delalo kvadratne packe.
          vec2 p = uv * 2.0;
          float os = exp(-abs(p.x) * 62.0) * exp(-abs(p.y) * 0.85)
                   + exp(-abs(p.y) * 62.0) * exp(-abs(p.x) * 0.85);
          vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.70711;
          float diag = exp(-abs(q.x) * 78.0) * exp(-abs(q.y) * 1.3)
                     + exp(-abs(q.y) * 78.0) * exp(-abs(q.x) * 1.3);
          // Krake dobijo le najsvetlejse zvezde; drobne ostanejo pike.
          float mera = smoothstep(1.1, 2.4, vSvetlost);
          a += (os * 0.66 + diag * 0.28) * mera;
        }

        if (a <= 0.002) discard;
        gl_FragColor = vec4(vBarva * vSvetlost * uMoc, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/** Okrogla tocka, da zvezde niso kvadrati. */
function circleTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Polmer, v katerem lezi RADIUS_PERCENTILE tock, merjeno v svetovnem prostoru.
 *
 * Vsako 4. tocko vzorcimo: pri stotisocih tock je razlika v rezultatu pod
 * odstotkom, cas pa se skrajsa za stirikrat.
 */
function percentilniPolmer(root, sredisce) {
  const razdalje = [];
  const p = new THREE.Vector3();

  root.traverse((node) => {
    const poz = node.isPoints ? node.geometry?.attributes?.position : null;
    if (!poz) return;
    node.updateWorldMatrix(true, false);
    for (let i = 0; i < poz.count; i += 4) {
      p.fromBufferAttribute(poz, i).applyMatrix4(node.matrixWorld);
      razdalje.push(p.distanceTo(sredisce));
    }
  });

  if (!razdalje.length) return 0;
  razdalje.sort((a, b) => a - b);
  const idx = Math.min(razdalje.length - 1, Math.floor(razdalje.length * RADIUS_PERCENTILE));
  return razdalje[idx];
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w * BLOOM_SUPERSAMPLE, h * BLOOM_SUPERSAMPLE);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Merilo pretvarja svetovno velikost zvezde v slikovne tocke. Vezano mora
  // biti na visino okna in vidni kot, sicer se zvezde ob spremembi velikosti
  // okna ne skalirajo z galaksijo.
  if (materiali.length) {
    const fovRad = (camera.fov * Math.PI) / 180;
    const merilo = (h * renderer.getPixelRatio()) / (2 * Math.tan(fovRad / 2));
    materiali.forEach((m) => {
      m.uniforms.uMerilo.value = merilo * velikostMul;
    });
  }
}

new GLTFLoader().load(galaxyModelUrl, (gltf) => {
  const root = gltf.scene;

  // Model je point cloud (glTF primitive mode 0). GLTFLoader iz njega naredi
  // THREE.Points sam, mi le poenotimo videz vseh najdenih tock.
  let geometry = null;
  root.traverse((node) => {
    if (!node.isPoints) return;
    geometry = geometry || node.geometry;
    node.frustumCulled = false;
  });

  if (!geometry) return;

  scene.add(root);

  // Velikost merimo v SVETOVNEM prostoru, ne iz surove geometrije.
  // GLB ima na vozliscih svoje transformacije (pogosto tudi skaliranje), zato
  // je polmer surove geometrije lahko veckrat drugacen od dejanskega - prav
  // zato je bila galaksija videti kot pika.
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(root);

  // Sredisce skatle je za orbito dovolj natancno; polmer pa merimo po tockah.
  box.getCenter(target);
  const radius = percentilniPolmer(root, target) || box.getSize(new THREE.Vector3()).length() / 2;

  // Velikosti so vezane na polmer, da so razmerja enaka ne glede na merilo GLB.
  const plasti = zvezdniMaterial(geometry, radius);
  root.traverse((node) => {
    if (node.isPoints) node.material = plasti.zvezde;
  });

  // Meglenica je ista geometrija se enkrat, le mehka in sibka. Additivno
  // mesanje pomeni, da vrstni red izrisa ni pomemben.
  megla = new THREE.Points(geometry, plasti.megla);
  megla.frustumCulled = false;
  root.add(megla);

  materiali = [plasti.zvezde, plasti.megla];

  // Oddaljena galaksija: ista geometrija se enkrat, manjsa, sibkejsa in dalec
  // zadaj. Ker stoji v istem prostoru, se ob krozenju kamere premika s pravo
  // parallakso - ploska slika v ozadju bi ostala pribita na zaslon.
  const daljna = new THREE.Points(geometry, plasti.zvezde.clone());
  daljnaGal = daljna;
  daljna.material.uniforms.uMoc.value = STAR_INTENSITY * DALJNA_MOC;
  // Vidno polje se z globino siri: pri oddaljenosti D pokriva 0.625*D na
  // vsako stran. Precni odmik mora ostati pod tem, sicer je galaksija vedno
  // izven okvirja - pri prvem poskusu je bila 9 polmerov vstran in je nikoli
  // ni bilo videti.
  daljna.position.set(
    target.x - radius * 2.8,
    target.y + radius * 0.9,
    target.z - radius * 4.6
  );
  daljna.rotation.set(0.9, 0.4, 0.35);
  daljna.scale.setScalar(DALJNA_MERILO);
  daljna.frustumCulled = false;
  scene.add(daljna);
  materiali.push(daljna.material);

  // Razdalja, pri kateri galaksija zavzame TARGET_SCREEN_FILL visine zaslona.
  const fovRad = (camera.fov * Math.PI) / 180;
  restDistance = (radius * 2) / (TARGET_SCREEN_FILL * 2 * Math.tan(fovRad / 2));

  startDistance = restDistance * FLIGHT_START_MUL;

  // Ravnini blizine in daljave morata objeti tako prilet kot mirovanje.
  camera.near = Math.max(0.01, radius / 2000);
  camera.far = startDistance * 3;
  camera.updateProjectionMatrix();

  // Meglice potrebujejo polmer in sredisce, zato sele tu.
  galaksija = root;

  resize();
  startMs = performance.now();
  lastMs = startMs;
  ready = true;
});

// --- odziv na misko ---------------------------------------------------------
// Cilj je surova lega kazalca, misX/misY pa jo lovita z zamikom. Brez dusenja
// bi se pogled lepil na kazalec; z njim je obcutek, da galaksija le rahlo
// zaniha za gibom.
let misCiljX = 0;
let misCiljY = 0;
let misX = 0;
let misY = 0;

window.addEventListener(
  "pointermove",
  (e) => {
    misCiljX = (e.clientX / window.innerWidth) * 2 - 1;
    misCiljY = (e.clientY / window.innerHeight) * 2 - 1;
  },
  { passive: true }
);

/** Kamera na orbiti; model se ne dotaknemo. */
function placeCamera(angle, distance, height) {
  camera.position.set(
    target.x + Math.cos(angle) * distance,
    target.y + distance * height,
    target.z + Math.sin(angle) * distance
  );
  camera.lookAt(target);
}

function tick(ts) {
  requestAnimationFrame(tick);
  if (!ready) return;

  // Zamrznitev namesto vzporednega izrisa.
  //
  // Galaksija je 50 000 tock in bloom v dvojni locljivosti. Ce bi tekla med
  // brskanjem po galeriji, bi si delila cas z nalaganjem in dekodiranjem
  // videov in oboje bi trzalo. Ustavimo izris, platno pa obdrzi zadnjo
  // slicico - kar je videti kot mirujoce ozadje in ne stane nic.
  if (zamrznjeno) {
    lastMs = ts;
    return;
  }

  // Vse vezemo na pretecen cas, ne na stevilo slicic - sicer je gibanje na
  // 144 Hz zaslonu dvakrat hitrejse kot na 60 Hz.
  const dt = Math.min((ts - lastMs) / 1000, 0.05);
  lastMs = ts;

  const t = Math.min((ts - startMs) / FLIGHT_MS, 1);
  const e = easeInOutCubic(t);

  // Razdalja: konec easeInOutCubic ima niceln odvod, zato se prilet sam od
  // sebe umiri v orbito, brez zaustavitve.
  let distance = startDistance + (restDistance - startDistance) * e;

  // Kot integriramo NEPREKINJENO skozi prilet in orbito, hitrost pa vezemo na
  // preostalo razdaljo: dalec = hitro obkrozanje, blizu = mirna orbita. Ker
  // razdalja proti koncu miruje, se vrtenje umiri samo od sebe - prehoda med
  // priletom in orbito ni, ker ni dveh stanj.
  const preostanek = (distance - restDistance) / (startDistance - restDistance);
  const zalet = FLIGHT_SWEEP * Math.pow(Math.max(preostanek, 0), SWEEP_FALLOFF);
  orbitPhase += dt * ORBIT_SPEED * (nastavitve.hitrostOrbite / 42) * (1 + zalet);

  // Dusenje, neodvisno od hitrosti osvezevanja.
  const k = 1 - Math.exp(-dt / PARALLAX_TAU);
  misX += (misCiljX - misX) * k;
  misY += (misCiljY - misY) * k;

  // Priblizanje: proti sredini blize, proti robu dlje, plus lastno nihanje z
  // dvema nesorazmernima frekvencama - vsota se ne ponovi na uho zaznavno in
  // zato ne deluje kot zanka.
  const ts_ = ts / 1000;
  const nihanje = Math.sin(ts_ * 0.11) * 0.6 + Math.sin(ts_ * 0.047) * 0.4;
  const misVklop = nastavitve.odzivNaMisko ? 1 : 0;
  const odmik =
    (Math.hypot(misX, misY) - 0.5) * PARALLAX_ZOOM * misVklop + nihanje * ZOOM_DRIFT;
  distance *= 1 + odmik * e;

  // Med priletom odziva na misko se ni - vklopi se sele, ko kamera obmiruje.
  placeCamera(
    orbitPhase + misX * PARALLAX_ANGLE * e * misVklop,
    distance,
    ORBIT_HEIGHT_MUL + misY * PARALLAX_HEIGHT * e * misVklop
  );


  composer.render();
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(tick);

// --- profilna slika ---------------------------------------------------------
const avatar = document.getElementById("nav-avatar");
if (avatar) avatar.src = avatarUrl;

// --- Defracted Glass: lom ob robovih in sij, ki sledi kazalcu ---------------
installDefractedGlass();

// --- squish, pop in izbira zavihka -----------------------------------------
const nav = document.querySelector(".nav");

function enkratna(el, razred) {
  if (!el || el.classList.contains(razred)) return;
  el.classList.add(razred);
  const konec = () => {
    el.classList.remove(razred);
    el.removeEventListener("animationend", konec);
  };
  el.addEventListener("animationend", konec);
}

nav?.addEventListener("pointerover", (e) => {
  const b = e.target instanceof Element ? e.target.closest("button") : null;
  enkratna(b, "squish");
});

// --- nastavitve --------------------------------------------------------------
installSelectionGlow();

const kazalec = installCursor();
// Gumbi se nagnejo mocneje, kapsule okoli njih sibkeje - ucinek se sesteje.
const magnetGumbi = installMagnetic(
  ".nav button, .dock-icon, .prof-gumb, .prof-zavihek, .prof-zapri, .nast-zapri, .nast-nazaj, .spust-gumb",
  0.22
);
const magnetKapsule = installMagnetic(".nav, .dock, .profil, .prof-zgodba", 0.09);
const magnet = {
  nastavi(v) {
    magnetGumbi.nastavi(v);
    magnetKapsule.nastavi(v);
  },
};

const profil = installProfile({
  onOdprt: () => { zamrznjeno = true; },
  onZaprt: () => { zamrznjeno = false; },
});
document.querySelector(".profil")?.addEventListener("click", () => profil.odpri());

const plosca = installSettings();
document
  .querySelector('.dock-icon[aria-label="Nastavitve"]')
  ?.addEventListener("click", () => plosca.odpri());

const omeni = installAbout();
nav?.querySelectorAll('[role="tab"]').forEach((t) => {
  if (t.textContent.trim() === "O meni") t.addEventListener("click", () => omeni.odpri());
});

installContextMenu(profil, plosca);

/**
 * Prenese nastavitve na prizor.
 *
 * Klicana je ob vsaki spremembi in enkrat ob zagonu, da je zacetno stanje
 * gotovo skladno z vrednostmi v plosci - sicer se stikalo in prizor razideta
 * ze pred prvim klikom.
 */
function uporabiNastavitve() {
  const prizorVklopljen = nastavitve.ozadje !== "izklop";

  if (galaksija) galaksija.visible = prizorVklopljen;
  if (daljnaGal) {
    daljnaGal.visible =
      prizorVklopljen && nastavitve.ozadje === "galaksija" && nastavitve.daljnaGalaksija;
  }
  // "Samo zvezde" pomeni brez mlecne plasti med njimi.
  if (megla) megla.visible = prizorVklopljen && nastavitve.ozadje === "galaksija";

  kazalec.nastavi(nastavitve.kazalec);
  magnet.nastavi(nastavitve.magnet);

  bloom.strength = (nastavitve.sij / 46) * BLOOM_STRENGTH;

  velikostMul = nastavitve.velikostZvezd / 21;
  resize();

  // Tema. Svetla je resena z obratom platna, ne z drugim izrisom - glej
  // opombo v index.html.
  const sistemSvetla =
    nastavitve.tema === "sistem"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
      : nastavitve.tema === "svetla";
  document.documentElement.dataset.tema = sistemSvetla ? "svetla" : "temna";

  // Prosojnost je alfa podlage, ki jo bere ves UI prek --dg-tint.
  document.documentElement.style.setProperty(
    "--dg-tint",
    `rgba(30, 35, 44, ${(nastavitve.prosojnost / 100).toFixed(3)})`
  );
}

document.addEventListener("nast-sprememba", uporabiNastavitve);
uporabiNastavitve();

nav?.addEventListener("click", (e) => {
  const b = e.target instanceof Element ? e.target.closest("button") : null;
  if (!b) return;
  enkratna(b, "pop");

  if (b.getAttribute("role") === "tab") {
    nav.querySelectorAll('[role="tab"]').forEach((t) =>
      t.setAttribute("aria-selected", String(t === b))
    );
  }
});
