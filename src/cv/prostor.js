/**
 * Prostor 3D.
 *
 * Galerija kot polje v prostoru, po zgledu "Perfect Pair" (shoe-finder), ki ga
 * je prinesel lastnik strani. Tam je React z react-three-fiber; tu je ista
 * zamisel na golem three.js, ker ta stran Reacta ne pozna.
 *
 * Od dalec je mreza izbocena v kroglo: vsako polje se odmakne v globino s
 * kvadratom oddaljenosti od sredisca zaslona, zato robovi bezijo nazaj. Od
 * blizu je ravna in sega cez robove zaslona. Z misko jo vleces; kamera se ob
 * hitrem vlecenju malo nagne v smer giba, ob izpustu mreza se malo odplava.
 *
 * Klik od dalec pripelje kamero k sliki; klik od blizu jo odpre v ogledu z
 * valom. Kolesce drsi stran kot povsod drugje; priblizuje se z gumbom ali s
 * ctrl + kolesce (na sledilni ploscici je to scip dveh prstov).
 *
 * Teksture so pomanjsane na TEKSTURA_NAJVEC pik. 137 slik v polni velikosti
 * bi pojedlo vec kot gigabajt graficnega pomnilnika, od blizu pa je polje na
 * zaslonu veliko okoli 250 pik. Video ima mirujoco slicico; ko je kazalec na
 * njem, se predvaja - vedno le eden.
 */

import * as THREE from "three";
import { obJeziku, t } from "./jezik.js";
import "./prostor.css";

/** Polje v mrezi in razmik med polji, v enotah prizora. */
const VELIKOST = 2.5;
const RAZMIK = 0.4;
const KORAK = VELIKOST + RAZMIK;
/** Slika zavzame toliko polja; ostalo je zrak okoli nje. */
const DELEZ_SLIKE = 0.92;
/** Zaobljenost vogalov, v enotah prizora. */
const POLMER = 0.1;

/** Oddaljenost kamere od blizu in najblize, kar pusti ctrl + kolesce. */
const ZOOM_BLIZU = 12;
const ZOOM_NAJBLIZE = 7;
/** Za koliko globlje od kamere zbezijo vogali mreze v pogledu od dalec. */
const GLOBINA_ROBA = 16;

/** Vlecenje: hitrost glede na prst, sledenje (s), upor cez rob in najvec cez rob. */
const VLEK = 1.5;
const SLEDENJE = 0.2;
const ZOOM_SLEDENJE = 0.3;
const UPOR = 0.25;
const PREKORAK = 3;
/** Pod toliko pik premika je pritisk klik, ne vlecenje. */
const KLIK_PRAG = 6;
/** Ob izpustu mreza odplava toliko sekund svoje hitrosti. */
const ZAGON = 0.2;
/** Nagib kamere ob hitrem vlecenju. */
const NAGIB = 0.08;

const TEKSTURA_NAJVEC = 448;
/** Vstop: polja priletijo iz globine, vsako s svojim zamikom. */
const VHOD_Z = -50;
const VHOD_ZAMIK_MS = 450;
/** Koliko datotek se nalaga hkrati. */
const HKRATI_SLIK = 4;
const HKRATI_VIDEOV = 2;
const FOV = 45;

const IKONA_PLUS =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const IKONA_MINUS =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>';

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uImaTex;
  uniform float uProsojnost;
  uniform vec2 uMere;
  uniform float uPolmer;
  uniform float uSij;
  varying vec2 vUv;

  void main() {
    // Zaobljen pravokotnik: razdalja do roba, mehko na eni piki.
    vec2 p = (vUv - 0.5) * uMere;
    vec2 q = abs(p) - uMere * 0.5 + uPolmer;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uPolmer;
    float aa = fwidth(d);
    float maska = 1.0 - smoothstep(-aa, aa, d);

    // Dokler slike ni, je polje temna steklena ploscica.
    vec3 slika = texture2D(uTex, vUv).rgb;
    vec3 barva = mix(vec3(0.09, 0.1, 0.13), slika, uImaTex);
    float a = mix(0.35, 1.0, uImaTex);

    // Pas svetlobe, ki ob prihodu kazalca enkrat preleti sliko.
    float diag = vUv.x * 0.8 + vUv.y;
    float pas = pow(1.0 - smoothstep(0.0, 0.5, abs(diag - uSij * 2.6)), 3.0);
    pas *= (1.0 - smoothstep(0.75, 1.0, uSij)) * step(0.001, uSij);
    barva += vec3(0.85, 0.92, 1.0) * pas * 0.55;

    gl_FragColor = vec4(barva, a * maska * uProsojnost);
  }
`;

/** Dusenje kot v maath.easing.damp: kriticno duseno, neodvisno od hitrosti slicic. */
function blazi(tr, cilj, cas, dt) {
  const o = 2 / cas;
  const x = o * dt;
  const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  return cilj + (tr - cilj) * e;
}
const gladko3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const omeji = (v, m) => Math.max(-m, Math.min(m, v));

/**
 * @param {HTMLElement} mreza mreza profila; oder gre vanjo
 * @param {{url: string, video: boolean}[]} mediji
 * @param {{ odpri: (m: {url: string, video: boolean}, cas: number) => void }} moznosti
 */
export function namestiProstor(mreza, mediji, { odpri }) {
  const mirno = matchMedia("(prefers-reduced-motion: reduce)");

  const oder = document.createElement("div");
  oder.className = "prostor";
  oder.innerHTML =
    `<canvas class="prostor-platno"></canvas>` +
    `<div class="prostor-pult"><button class="prostor-zoom dg" type="button"></button></div>`;
  mreza.appendChild(oder);
  const platno = oder.querySelector("canvas");
  const gumb = oder.querySelector(".prostor-zoom");

  const izris = new THREE.WebGLRenderer({ canvas: platno, alpha: true, antialias: true });
  izris.setClearAlpha(0);
  const kamera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  const prizor = new THREE.Scene();
  const ploskev = new THREE.PlaneGeometry(1, 1);
  const prazna = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  prazna.needsUpdate = true;
  const aniz = Math.min(8, izris.capabilities.getMaxAnisotropy());

  // Mreza je skoraj kvadratna - od dalec se tako bere kot krogla in ne kot trak.
  const stolpci = Math.max(4, Math.round(Math.sqrt(mediji.length * 1.25)));
  const vrstice = Math.ceil(mediji.length / stolpci);
  const sirinaMreze = stolpci * KORAK;
  const visinaMreze = vrstice * KORAK;
  const najdlje = Math.hypot(sirinaMreze / 2, visinaMreze / 2);
  const ukrivljenost = GLOBINA_ROBA / (najdlje * najdlje);

  const polja = mediji.map((m, i) => {
    const bx = (i % stolpci) * KORAK - sirinaMreze / 2 + KORAK / 2;
    const by = -Math.floor(i / stolpci) * KORAK + visinaMreze / 2 - KORAK / 2;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTex: { value: prazna },
        uImaTex: { value: 0 },
        uProsojnost: { value: 0 },
        uMere: { value: new THREE.Vector2(1, 1) },
        uPolmer: { value: POLMER },
        uSij: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(ploskev, mat);
    mesh.userData.i = i;
    prizor.add(mesh);
    const s = VELIKOST * DELEZ_SLIKE;
    return {
      m, bx, by, mesh, mat,
      w: s, h: s, cw: s, ch: s,
      stanje: "prazno", poskusi: 0, poster: null, zivo: null,
      vhodZ: 0, vhodOd: 0, pros: 0, lebdi: 0, sij: 0, sijTece: false,
    };
  });
  const telesa = polja.map((p) => p.mesh);

  const pan = new THREE.Vector2();
  const cilj = new THREE.Vector2();
  const prejPan = new THREE.Vector2();
  let zoomDalec = 40;
  let zoomCilj = 40;
  kamera.position.z = 40;

  let aktivno = false;
  let vidno = false;
  let zanka = null;
  let prej = 0;
  let prvic = true;
  /** Polje pod kazalcem in polje, ki se ta hip predvaja. */
  let nad = null;
  let zivi = null;

  const vidnaVisina = (z) => 2 * Math.tan((FOV * Math.PI) / 360) * z;
  const oddaljeno = () => zoomCilj > ZOOM_BLIZU + 2;

  /** Koliko sme mreza zdrsniti, da rob se ostane na zaslonu. */
  function meje(z) {
    const vh = vidnaVisina(z);
    const vw = vh * kamera.aspect;
    return {
      x: Math.max(0, (sirinaMreze - vw) / 2 + 2),
      y: Math.max(0, (visinaMreze - vh) / 2 + 2),
      vh,
    };
  }

  /**
   * Mere platna. Oder je v stolpcu profila, platno pa stopi iz njega na celo
   * sirino okna - polja od blizu segajo cez rob strani. Odmik racunamo iz
   * offsetLeft, ker ta ne vidi transformacije vstopne animacije.
   */
  function izmeri() {
    const koren = mreza.closest(".prof") || document.documentElement;
    let x = 0;
    for (let el = oder; el && el !== koren; el = el.offsetParent) x += el.offsetLeft;
    const w = koren.clientWidth;
    const h = Math.max(1, oder.clientHeight);
    platno.style.left = `${-x}px`;
    platno.style.width = `${w}px`;
    izris.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    izris.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    const staro = zoomDalec;
    const f = 2 * Math.tan((FOV * Math.PI) / 360);
    zoomDalec = Math.max(visinaMreze / f, sirinaMreze / (f * kamera.aspect)) * 0.9;
    // Kdor je gledal od dalec, gleda od dalec tudi po novi velikosti okna.
    if (Math.abs(zoomCilj - staro) < 0.01) zoomCilj = zoomDalec;
  }

  function osveziGumb() {
    const dalec = oddaljeno();
    gumb.innerHTML = dalec ? IKONA_PLUS : IKONA_MINUS;
    gumb.setAttribute(
      "aria-label",
      dalec ? t("gal.prostor.priblizaj", "Približaj") : t("gal.prostor.oddalji", "Oddalji")
    );
  }
  obJeziku(osveziGumb);

  // --- nalaganje ---------------------------------------------------------

  /** Od sredisca navzven: najprej se napolni tisto, kar je na zaslonu. */
  const vrsta = [...polja].sort((a, b) => Math.hypot(a.bx, a.by) - Math.hypot(b.bx, b.by));
  let slikTece = 0;
  let videovTece = 0;

  function vTeksturo(vir, w, h) {
    const s = Math.min(1, TEKSTURA_NAJVEC / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * s));
    c.height = Math.max(1, Math.round(h * s));
    c.getContext("2d").drawImage(vir, 0, 0, c.width, c.height);
    const tx = new THREE.CanvasTexture(c);
    // Brez barvnega prostora, kot pri ogledu: sencilnik vrednosti ne pretvarja,
    // zato gredo skozi nespremenjene in barve so iste kot v mrezi.
    tx.colorSpace = THREE.NoColorSpace;
    tx.anisotropy = aniz;
    return tx;
  }

  /** Slika je tu: polje dobi teksturo in pravo razmerje (vpisano v kvadrat). */
  function obleci(p, tx, w, h) {
    p.poster = tx;
    if (!p.zivo?.vt) p.mat.uniforms.uTex.value = tx;
    const r = w / Math.max(1, h);
    const s = VELIKOST * DELEZ_SLIKE;
    p.w = r >= 1 ? s : s * r;
    p.h = r >= 1 ? s / r : s;
    p.stanje = "polno";
  }

  function spodletelo(p) {
    p.poskusi += 1;
    p.stanje = p.poskusi < 3 ? "prazno" : "napaka";
  }

  function naloziSliko(p) {
    const img = new Image();
    img.decoding = "async";
    img.src = p.m.url;
    return img
      .decode()
      .then(() => obleci(p, vTeksturo(img, img.naturalWidth, img.naturalHeight), img.naturalWidth, img.naturalHeight))
      .catch(() => spodletelo(p));
  }

  /** Mirujoca slicica videa: kratek skok v posnetek, izris, predvajalnik proc. */
  function naloziVideo(p) {
    return new Promise((res) => {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      let konec = false;
      const koncaj = (ok) => {
        if (konec) return;
        konec = true;
        clearTimeout(ura);
        if (ok) {
          try {
            obleci(p, vTeksturo(v, v.videoWidth, v.videoHeight), v.videoWidth, v.videoHeight);
          } catch {
            spodletelo(p);
          }
        } else spodletelo(p);
        v.removeAttribute("src");
        v.load();
        res();
      };
      const ura = setTimeout(() => koncaj(false), 12000);
      // Prva slicica telefonskih posnetkov je pogosto crna - vzamemo desetinko kasneje.
      v.addEventListener("loadedmetadata", () => { v.currentTime = Math.min(0.1, (v.duration || 1) / 2); }, { once: true });
      v.addEventListener("seeked", () => koncaj(v.videoWidth > 0), { once: true });
      v.addEventListener("error", () => koncaj(false), { once: true });
      v.src = p.m.url;
    });
  }

  function nalagaj() {
    for (const p of vrsta) {
      if (p.stanje !== "prazno") continue;
      if (p.m.video) {
        if (videovTece >= HKRATI_VIDEOV) continue;
        videovTece += 1;
        p.stanje = "nalaga";
        naloziVideo(p).finally(() => { videovTece -= 1; nalagaj(); });
      } else {
        if (slikTece >= HKRATI_SLIK) continue;
        slikTece += 1;
        p.stanje = "nalaga";
        naloziSliko(p).finally(() => { slikTece -= 1; nalagaj(); });
      }
    }
  }

  // --- zivi video pod kazalcem --------------------------------------------

  function ugasni(p) {
    const z = p.zivo;
    if (!z) return;
    p.zivo = null;
    p.mat.uniforms.uTex.value = p.poster || prazna;
    z.vt?.dispose();
    z.v.pause();
    z.v.removeAttribute("src");
    z.v.load();
  }

  function prizgiZivo(p) {
    if (zivi === p) return;
    if (zivi) ugasni(zivi);
    zivi = null;
    if (!p || !p.m.video || p.stanje !== "polno") return;
    zivi = p;
    const v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.src = p.m.url;
    p.zivo = { v, vt: null };
    // Tekstura se zamenja sele, ko posnetek res tece - do takrat ostane slicica.
    v.addEventListener(
      "playing",
      () => {
        if (zivi !== p || !p.zivo) return;
        const vt = new THREE.VideoTexture(v);
        vt.colorSpace = THREE.NoColorSpace;
        p.zivo.vt = vt;
        p.mat.uniforms.uTex.value = vt;
      },
      { once: true }
    );
    v.play().catch(() => {});
  }

  // --- kazalec ------------------------------------------------------------

  const zarek = new THREE.Raycaster();
  const tocka = new THREE.Vector2();
  function zadetek(e) {
    const r = platno.getBoundingClientRect();
    tocka.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    zarek.setFromCamera(tocka, kamera);
    const h = zarek.intersectObjects(telesa, false)[0];
    return h ? polja[h.object.userData.i] : null;
  }

  function nastaviNad(p) {
    if (nad === p) return;
    nad = p;
    oder.classList.toggle("nad-sliko", !!p);
    if (p && !mirno.matches) {
      p.sij = 0;
      p.sijTece = true;
    }
    prizgiZivo(p);
  }

  let dol = null;
  let vlece = false;
  const sledi = [];

  /** Cez rob gre mreza z uporom, a ne dlje kot PREKORAK. */
  function upri(v, m) {
    if (v > m) v = m + (v - m) * UPOR;
    else if (v < -m) v = -m + (v + m) * UPOR;
    return Math.max(-m - PREKORAK, Math.min(m + PREKORAK, v));
  }

  platno.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dol = { x: e.clientX, y: e.clientY, cx: cilj.x, cy: cilj.y, max: 0 };
    vlece = false;
    sledi.length = 0;
    sledi.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    platno.setPointerCapture(e.pointerId);
    oder.classList.add("vlece");
  });

  platno.addEventListener("pointermove", (e) => {
    if (!dol) {
      if (e.pointerType !== "touch") nastaviNad(zadetek(e));
      return;
    }
    const dx = e.clientX - dol.x;
    const dy = e.clientY - dol.y;
    dol.max = Math.max(dol.max, Math.hypot(dx, dy));
    if (!vlece && dol.max > (e.pointerType === "touch" ? 15 : KLIK_PRAG)) {
      vlece = true;
      nastaviNad(null);
    }
    const m = meje(kamera.position.z);
    const obcut = (m.vh / Math.max(1, platno.clientHeight)) * VLEK;
    cilj.set(upri(dol.cx + dx * obcut, m.x), upri(dol.cy - dy * obcut, m.y));
    sledi.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (sledi.length > 6) sledi.shift();
  });

  function spusti(e) {
    if (!dol) return;
    dol = null;
    oder.classList.remove("vlece");
    if (!vlece) {
      if (e.type === "pointerup") klik(e);
      return;
    }
    vlece = false;
    // Od dalec se mreza vedno vrne na sredino; od blizu obstane, kjer je.
    if (oddaljeno()) {
      cilj.set(0, 0);
      return;
    }
    const m = meje(zoomCilj);
    const a = sledi[0];
    const b = sledi[sledi.length - 1];
    if (a && b && performance.now() - b.t < 90) {
      const cas = Math.max(16, b.t - a.t) / 1000;
      const obcut = (m.vh / Math.max(1, platno.clientHeight)) * VLEK;
      cilj.x += ((b.x - a.x) / cas) * obcut * ZAGON;
      cilj.y -= ((b.y - a.y) / cas) * obcut * ZAGON;
    }
    cilj.set(omeji(cilj.x, m.x), omeji(cilj.y, m.y));
  }
  platno.addEventListener("pointerup", spusti);
  platno.addEventListener("pointercancel", spusti);
  platno.addEventListener("pointerleave", () => { if (!dol) nastaviNad(null); });

  function klik(e) {
    const p = zadetek(e);
    if (!p) return;
    if (oddaljeno()) {
      cilj.set(-p.bx, -p.by);
      zoomCilj = ZOOM_BLIZU;
      osveziGumb();
      return;
    }
    odpri(p.m, p.zivo?.v.currentTime || 0);
  }

  gumb.addEventListener("click", (e) => {
    e.stopPropagation();
    if (oddaljeno()) {
      zoomCilj = ZOOM_BLIZU;
    } else {
      zoomCilj = zoomDalec;
      cilj.set(0, 0);
    }
    osveziGumb();
  });

  // Navadno kolesce drsi stran; ctrl + kolesce (in scip na ploscici) priblizuje.
  platno.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();
      zoomCilj = Math.min(zoomDalec * 1.1, Math.max(ZOOM_NAJBLIZE, zoomCilj * Math.exp(e.deltaY * 0.0025)));
      const m = meje(zoomCilj);
      cilj.set(omeji(cilj.x, m.x), omeji(cilj.y, m.y));
      osveziGumb();
    },
    { passive: false }
  );

  // --- izris --------------------------------------------------------------

  function slicica(ms) {
    zanka = requestAnimationFrame(slicica);
    const dt = Math.min(0.05, Math.max(0.001, (ms - prej) / 1000));
    prej = ms;

    pan.x = blazi(pan.x, cilj.x, SLEDENJE, dt);
    pan.y = blazi(pan.y, cilj.y, SLEDENJE, dt);
    kamera.position.z = blazi(kamera.position.z, zoomCilj, ZOOM_SLEDENJE, dt);
    const z = kamera.position.z;

    // Nagib kamere po hitrosti mreze, od blizu mocnejsi kot od dalec.
    const vx = (pan.x - prejPan.x) / dt;
    const vy = (pan.y - prejPan.y) / dt;
    prejPan.copy(pan);
    const zf = mirno.matches ? 0 : Math.min(1, ZOOM_BLIZU / z);
    kamera.rotation.x = blazi(kamera.rotation.x, (vy / 60) * NAGIB * zf, 0.2, dt);
    kamera.rotation.y = blazi(kamera.rotation.y, (-vx / 60) * NAGIB * zf, 0.2, dt);

    // Krogla od dalec, ravnina od blizu - vmes gladko.
    const r = THREE.MathUtils.clamp((z - ZOOM_BLIZU) / Math.max(0.001, zoomDalec - ZOOM_BLIZU), 0, 1);
    const krog = gladko3(r) * ukrivljenost;
    const zdaj = performance.now();

    for (const p of polja) {
      const x = p.bx + pan.x;
      const y = p.by + pan.y;
      if (zdaj >= p.vhodOd) {
        p.vhodZ = blazi(p.vhodZ, 0, 0.35, dt);
        p.pros = blazi(p.pros, 1, 0.5, dt);
      }
      p.lebdi = blazi(p.lebdi, p === nad && !vlece ? 1 : 0, 0.15, dt);
      p.cw = blazi(p.cw, p.w, 0.25, dt);
      p.ch = blazi(p.ch, p.h, 0.25, dt);
      const sk = 1 + 0.05 * p.lebdi;
      p.mesh.position.set(x, y, -(x * x + y * y) * krog + 0.5 * p.lebdi + p.vhodZ);
      p.mesh.scale.set(p.cw * sk, p.ch * sk, 1);

      const u = p.mat.uniforms;
      u.uMere.value.set(p.cw * sk, p.ch * sk);
      u.uImaTex.value = blazi(u.uImaTex.value, p.stanje === "polno" ? 1 : 0, 0.3, dt);
      u.uProsojnost.value = p.pros;
      if (p.sijTece) {
        p.sij += dt / 0.9;
        if (p.sij >= 1) {
          p.sij = 0;
          p.sijTece = false;
        }
      }
      u.uSij.value = p.sij;
    }
    izris.render(prizor, kamera);
  }

  /** Zanka tece le, ko je prostor izbran, profil odprt in oder na zaslonu. */
  function osvezi() {
    const tece = aktivno && vidno && !document.hidden;
    if (tece && !zanka) {
      prej = performance.now();
      zanka = requestAnimationFrame(slicica);
    } else if (!tece && zanka) {
      cancelAnimationFrame(zanka);
      zanka = null;
    }
  }

  new IntersectionObserver(([v]) => {
    vidno = v.isIntersecting;
    osvezi();
  }).observe(oder);
  document.addEventListener("visibilitychange", osvezi);
  new ResizeObserver(() => { if (aktivno) izmeri(); }).observe(oder);
  addEventListener("resize", () => { if (aktivno) izmeri(); });

  /** Vstop: polja priletijo iz globine, vsako ob svojem casu. */
  function vstop() {
    const zdaj = performance.now();
    for (const p of polja) {
      p.vhodZ = mirno.matches ? 0 : VHOD_Z;
      p.pros = mirno.matches ? 1 : 0;
      p.vhodOd = zdaj + Math.random() * VHOD_ZAMIK_MS;
    }
  }

  function nastavi(da) {
    if (da === aktivno) return;
    aktivno = da;
    if (da) {
      izmeri();
      if (prvic) {
        prvic = false;
        zoomCilj = zoomDalec;
        kamera.position.z = zoomDalec;
      }
      vstop();
      nalagaj();
      osveziGumb();
    } else {
      dol = null;
      vlece = false;
      oder.classList.remove("vlece");
      nastaviNad(null);
    }
    osvezi();
  }

  return { nastavi };
}
