/**
 * Ogled slike, ki priplapola.
 *
 * Klik na polje v galeriji odpre sliko cez stran - in ta se ne prizge, ampak
 * PRIPLAPOLA: cez ploskev stece val, ki jo nagane iz ravnine, sliko samo pa iz
 * nicesar odpre sum, ki se siri iz sredisca navzven in ji razje rob. Val
 * ugasne skupaj s prihodom in je ob koncu natanko nic - ploskev obmiruje
 * poravnana, zato prehod nima roba, kjer bi se ucinek koncal in slika zacela.
 * Ob zapiranju tece isto nazaj.
 *
 * Zamisel in oba sencilnika sta iz demonstracije "image reveal" (Codrops,
 * r3f-image-reveal-effect), ki jo je prinesel lastnik strani. Prenesena sta na
 * golo three.js, ker ta stran ne pozna Reacta.
 *
 * Naenkrat je odprta ena sama slika, zato je tudi izrisovalnik en sam in tece
 * le, dokler je ogled odprt. Ko se zapre, se ustavi - mreza za sabo nima
 * nicesar, kar bi se vrtelo.
 *
 * Ploskev je manjsa od platna. Val jo nagane cez njen rob in ce bi platno
 * segalo natanko do slike, bi se gube ob robu odrezale - prav one pa so tisto,
 * po cemer se prihod bere kot plapolanje in ne kot bledenje.
 *
 * Video priplapola enako. Tekstura je posnetek, ki tece naprej od trenutka, v
 * katerem je bil v mrezi, zato val gubanja nosi zivo sliko.
 */

import { t } from "./jezik.js";
import * as THREE from "three";
import { FRAGMENT, VERTEX, VAL, ZRAK } from "./val-sencilnik.js";
import "./plapol.css";

/** Koliko traja prihod slike in koliko njen odhod. */
const CAS_MS = 1500;
const ODHOD_MS = 900;

/** Koliko zaslona sme zavzeti PLATNO - torej slika skupaj s tem zrakom. */
const DELEZ_S = 0.94;
const DELEZ_V = 0.96;

/**
 * Najvecja stranica izrisa.
 *
 * Val je mehak in drobnih razlik ne nosi, zato slike ni treba risati v polni
 * gostoti zaslona. Meja je tu zato, da na velikem zaslonu z dvakratno gostoto
 * ne racunamo stirih milijonov pik za ucinek, ki traja poldrugo sekundo.
 */
const NAJVEC = 1600;

/**
 * Odprta slika je kartica v prostoru, enako kot dvignjena v mrezi: kazalec jo
 * rahlo nagne, rob pod njim se odmakne, cez njo drsi mehek odsev. Tu ploskev
 * zares zavrtimo v prizoru, zato perspektivo da kamera sama.
 */
const NAGIB_NAJVEC = 6;
const NAGIB_TOG = 120;
const NAGIB_DUS = 16;
/** Kdor je gibanje izklopil, dobi ravno sliko. */
const mirno = matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Pogon.
 *
 * Nastane ob prvem ogledu in nato ostane. Ce WebGL ni na voljo, ostane null in
 * ogled pokaze navadno sliko - to ni ucinek, brez katerega strani ni.
 */
let pogon = null;
let pogonSpodletel = false;

function pripraviPogon() {
  if (pogon || pogonSpodletel) return pogon;
  try {
    const izris = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    izris.setPixelRatio(1); // merilo je ze v merah platna
    izris.setClearAlpha(0);
    izris.domElement.className = "ogled-platno";

    // Kamera je perspektivna, ker mora biti guba videti kot guba. Vidno polje
    // na globini ploskve je visoko dve enoti.
    const kamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    kamera.position.z = 1 / Math.tan((45 * Math.PI) / 360);

    const gradivo = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      uniforms: {
        uSlika: { value: null },
        uCas: { value: 0 },
        uProgress: { value: 0 },
        uPolje: { value: new THREE.Vector2(1, 1) },
        uMere: { value: new THREE.Vector2(1, 1) },
        uVal: { value: VAL },
        uOdsev: { value: new THREE.Vector2(0.5, 0.5) },
        uOdsevMoc: { value: 0 },
      },
    });

    // Mreza ploskve mora biti dovolj gosta, da je val kriva in ne lomljenka.
    const ploskev = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), gradivo);
    const prizor = new THREE.Scene();
    prizor.add(ploskev);

    pogon = { izris, kamera, gradivo, ploskev, prizor };
    return pogon;
  } catch {
    pogonSpodletel = true;
    return null;
  }
}

/**
 * Mere platna in ploskve na njem.
 *
 * Slika se vpise v zaslon po svojem razmerju, platno pa je se za ZRAK vecje.
 * Ploskev nato zavzame natanko tisti del platna, ki pripada sliki - ostalo je
 * prostor, v katerega sme val pobegniti.
 */
function nastaviMere(p, razmerje) {
  // Meji veljata za platno in ne za sliko: platno je za ZRAK vecje in ce bi
  // vpisali sliko, bi zrak segal cez rob zaslona in bi ga ta odrezal - prav
  // tam pa so gube.
  const visina = Math.min(
    (innerWidth * DELEZ_S) / (razmerje * ZRAK),
    (innerHeight * DELEZ_V) / ZRAK
  );
  const sirina = visina * razmerje;

  const gostota = Math.min(
    devicePixelRatio || 1,
    NAJVEC / Math.max(sirina * ZRAK, visina * ZRAK)
  );
  const ps = Math.round(sirina * ZRAK * gostota);
  const pv = Math.round(visina * ZRAK * gostota);

  p.izris.setSize(ps, pv, false);
  p.izris.domElement.style.width = `${Math.round(sirina * ZRAK)}px`;
  p.izris.domElement.style.height = `${Math.round(visina * ZRAK)}px`;
  p.kamera.aspect = ps / pv;
  p.kamera.updateProjectionMatrix();

  // Vidno polje je visoko dve enoti; slika zavzame njegov delez 1/ZRAK.
  const v = 2 / ZRAK;
  p.ploskev.scale.set(v * razmerje, v, 1);
}

/** Odprti ogled; naenkrat je lahko en sam. */
let ogled = null;

function slicica(ms) {
  if (!ogled) return;
  ogled.zanka = requestAnimationFrame(slicica);
  const p = pogon;
  if (!p) return;

  const pretek = ms - ogled.zacetek;
  const cas = ogled.zapira ? ODHOD_MS : CAS_MS;
  const t = Math.min(pretek / cas, 1);
  // Mehko na obeh koncih: prihod se ne sme zaceti sunkovito, ne koncati s
  // trkom ob mirovanje.
  const gladko = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const napredek = ogled.zapira ? 1 - gladko : gladko;

  p.gradivo.uniforms.uSlika.value = ogled.tekstura;
  p.gradivo.uniforms.uCas.value = ms * 0.001;
  p.gradivo.uniforms.uProgress.value = napredek;
  p.gradivo.uniforms.uPolje.value.set(ogled.razmerje, 1);
  p.gradivo.uniforms.uMere.value.set(ogled.razmerje, 1);

  // Nagib po vzmeti; ob prihodu in odhodu raste in pojema z napredkom, da se
  // ne prepira z valom.
  const n = ogled.nagib;
  const dt = Math.min(0.05, Math.max(0, (ms - n.prej) / 1000));
  n.prej = ms;
  n.vx += ((n.cx * napredek - n.x) * NAGIB_TOG - n.vx * NAGIB_DUS) * dt;
  n.vy += ((n.cy * napredek - n.y) * NAGIB_TOG - n.vy * NAGIB_DUS) * dt;
  n.x += n.vx * dt;
  n.y += n.vy * dt;
  p.ploskev.rotation.set(THREE.MathUtils.degToRad(n.x), THREE.MathUtils.degToRad(n.y), 0);
  p.gradivo.uniforms.uOdsev.value.set(0.5 + (n.y / NAGIB_NAJVEC) * 0.5, 0.5 - (n.x / NAGIB_NAJVEC) * 0.5);
  p.gradivo.uniforms.uOdsevMoc.value = (0.05 + 0.11 * Math.min(1, Math.hypot(n.x, n.y) / NAGIB_NAJVEC)) * napredek;

  p.izris.render(p.prizor, p.kamera);

  if (t >= 1 && ogled.zapira) pospravi();
}

/** Slika, dekodirana; obljuba vrne njo in njene mere. */
function naloziSliko(url) {
  const slika = new Image();
  slika.decoding = "async";
  slika.src = url;
  return slika.decode().then(() => ({
    vir: slika, w: slika.naturalWidth, h: slika.naturalHeight, tekstura: new THREE.Texture(slika),
  }));
}

/** Posnetek od casa cas naprej, z ze dekodirano prvo slicico. */
function naloziPosnetek(url, cas) {
  return new Promise((res, rej) => {
    const v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.addEventListener("loadedmetadata", () => { if (cas) v.currentTime = cas; }, { once: true });
    v.addEventListener(
      "loadeddata",
      () => {
        v.play().catch(() => {});
        res({ vir: v, w: v.videoWidth, h: v.videoHeight, tekstura: new THREE.VideoTexture(v) });
      },
      { once: true }
    );
    v.addEventListener("error", () => rej(new Error("posnetek")), { once: true });
    v.src = url;
  });
}

/**
 * Odpre sliko ali posnetek cez stran.
 *
 * Vrne true, ce je ogled prevzel prikaz. Kadar WebGL ni na voljo vrne false in
 * klicatelj naj stori, kar bi sicer.
 */
export function odpri(url, opis = "", { video = false, cas = 0 } = {}) {
  if (ogled) zapri();
  const p = pripraviPogon();
  if (!p) return false;

  const ovoj = document.createElement("div");
  ovoj.className = "ogled";
  ovoj.innerHTML =
    `<div class="ogled-zavesa"></div>` +
    `<button class="ogled-zapri" type="button" aria-label="${t("ogled.zapri", "Zapri sliko")}">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
    `stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  if (opis) ovoj.setAttribute("aria-label", opis);
  document.body.appendChild(ovoj);
  void ovoj.offsetWidth;
  ovoj.classList.add("odprt");

  const naTipko = (e) => { if (e.key === "Escape") zapri(); };
  addEventListener("keydown", naTipko);
  ovoj.querySelector(".ogled-zapri").addEventListener("click", zapri);
  // Klik mimo slike zapre; klik na sliko ne, sicer bi se zaprla pod prstom.
  ovoj.querySelector(".ogled-zavesa").addEventListener("click", zapri);

  const naMero = () => { if (ogled) nastaviMere(p, ogled.razmerje); };
  addEventListener("resize", naMero);

  // Kam naj se kartica nagne: rob pod kazalcem se odmakne. Mere so mere slike,
  // ne platna - platno ima okoli slike se zrak za val.
  const naMisko = (e) => {
    if (!ogled || mirno.matches) return;
    const r = p.izris.domElement.getBoundingClientRect();
    const sw = r.width / ZRAK;
    const sv = r.height / ZRAK;
    const nx = ((e.clientX - (r.left + r.width / 2)) / sw) * 2;
    const ny = ((e.clientY - (r.top + r.height / 2)) / sv) * 2;
    // Nagiba se le, dokler je kazalec na sliki; ko gre z nje, se zravna.
    const naSliki = Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
    ogled.nagib.cy = naSliki ? nx * NAGIB_NAJVEC : 0;
    ogled.nagib.cx = naSliki ? ny * NAGIB_NAJVEC : 0;
  };
  // Kazalec je zapustil okno - kartica se zravna.
  const naIzhod = () => { if (ogled) ogled.nagib.cx = ogled.nagib.cy = 0; };
  addEventListener("pointermove", naMisko, { passive: true });
  document.documentElement.addEventListener("pointerleave", naIzhod);

  ogled = { ovoj, naTipko, naMero, naMisko, naIzhod, tekstura: null, posnetek: null, razmerje: 1, zapira: false,
            zacetek: performance.now(), zanka: null,
            nagib: { x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, prej: performance.now() } };

  (video ? naloziPosnetek(url, cas) : naloziSliko(url))
    .then(({ vir, w, h, tekstura }) => {
      if (!ogled || ogled.ovoj !== ovoj) {
        tekstura.dispose();
        if (video) ustaviPosnetek(vir);
        return;
      }
      if (video) ogled.posnetek = vir;
      ogled.razmerje = w / Math.max(1, h);
      ogled.tekstura = tekstura;
      // Brez barvnega prostora, namenoma. Oznaka sRGB bi teksturo ob branju
      // pretvorila v linearne vrednosti, ta sencilnik pa jih ne pretvori nazaj -
      // gama bi se uporabila dvakrat in slika bi bila temnejsa in bolj
      // kontrastna od izvirnika. Tako gredo vrednosti skozi nespremenjene.
      ogled.tekstura.colorSpace = THREE.NoColorSpace;
      ogled.tekstura.needsUpdate = true;
      nastaviMere(p, ogled.razmerje);
      ovoj.appendChild(p.izris.domElement);
      // Cas tece od trenutka, ko je slika tu, in ne od klika: sicer bi pri
      // pocasni povezavi zamudila lasten prihod.
      ogled.zacetek = performance.now();
      ogled.zanka = requestAnimationFrame(slicica);
    })
    .catch(() => zapri());

  return true;
}

/** Zacne odhod; ko se izteka, se ogled pospravi sam. */
export function zapri() {
  if (!ogled || ogled.zapira) return;
  if (!ogled.tekstura) return pospravi();     // slike se ni bilo
  ogled.zapira = true;
  ogled.zacetek = performance.now();
  ogled.ovoj.classList.remove("odprt");
}

/** Posnetek se ustavi in sprosti dekoder - src brez vira ga izprazni. */
function ustaviPosnetek(v) {
  v.pause();
  v.removeAttribute("src");
  v.load();
}

/** Vse dol: izris se ustavi, platno gre iz strani, tekstura se sprosti. */
function pospravi() {
  if (!ogled) return;
  const o = ogled;
  ogled = null;
  if (o.zanka) cancelAnimationFrame(o.zanka);
  removeEventListener("keydown", o.naTipko);
  removeEventListener("resize", o.naMero);
  removeEventListener("pointermove", o.naMisko);
  document.documentElement.removeEventListener("pointerleave", o.naIzhod);
  if (pogon) pogon.ploskev.rotation.set(0, 0, 0);
  o.tekstura?.dispose();
  if (o.posnetek) ustaviPosnetek(o.posnetek);
  if (pogon && pogon.izris.domElement.parentElement === o.ovoj) {
    o.ovoj.removeChild(pogon.izris.domElement);
  }
  o.ovoj.remove();
}
