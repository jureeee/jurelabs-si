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
 * Video ne plapola. Ucinek je preslikava mirujoce slike; na sliki, ki se ze
 * sama premika, bi bil samo hrup - zato se video v ogledu odpre kar tak, kot
 * je.
 */

import { t } from "./jezik.js";
import * as THREE from "three";
import "./plapol.css";

/** Koliko traja prihod slike in koliko njen odhod. */
const CAS_MS = 1500;
const ODHOD_MS = 900;

/** Koliko prostora okoli slike pusti platno, da se gube ob robu ne odrezejo. */
const ZRAK = 1.18;

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
 * Koliko val nagane ploskev iz ravnine, v enotah njene visine.
 *
 * Ploskev je visoka dve enoti in kamera je perspektivna - zato se odmik po z
 * vidi kot pravo gubanje in ne kot svetlejsi pas.
 */
const VAL = 0.42;

const VERTEX = /* glsl */ `
  uniform float uProgress;
  uniform float uVal;
  varying vec2 vUv;

  void main() {
    vec3 novaLega = position;

    // Razdalja do sredisca ploskve; val tece od tam navzven.
    float doSredisca = distance(vec2(0.5), uv);

    // Val ugasne skupaj s prihodom: pri uProgress 1 je natanko nic.
    float val = (1.0 - uProgress) * sin(doSredisca * 20.0 - uProgress * 5.0);
    novaLega.z += val * uVal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(novaLega, 1.0);
    vUv = uv;
  }
`;

/** Klasicni Perlinov sum 3D, Stefan Gustavson. Vzet, kot je. */
const SUM = /* glsl */ `
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec3 P)
{
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 

    return 2.2 * n_xyz;
}
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uSlika;
  uniform float uCas;
  uniform float uProgress;
  uniform vec2 uPolje;
  uniform vec2 uMere;

  varying vec2 vUv;

  ${SUM}

  /**
   * Izrez kot pri object-fit: cover.
   *
   * Polje in slika imata vsak svoje razmerje; brez tega bi bila slika
   * raztegnjena, kar je v mrezi z mozaiki in stopnicami takoj vidno.
   */
  vec2 pokrij(vec2 u, vec2 p, vec2 s) {
    float rp = p.x / p.y;
    float rs = s.x / s.y;
    vec2 m = rp < rs ? vec2(s.x * p.y / s.y, p.y) : vec2(p.x, s.y * p.x / s.x);
    vec2 o = (rp < rs ? vec2((m.x - p.x) * 0.5, 0.0) : vec2(0.0, (m.y - p.y) * 0.5)) / m;
    return u * p / m + o;
  }

  void main() {
    vec2 uv = pokrij(vUv, uPolje, uMere);

    // Sum, ki mu je vhod ze sam zamaknjen s sumom - rob prihoda zato ni
    // gladka crta, ampak razjeden.
    vec2 zamaknjen = vUv + cnoise(vec3(vUv * 5.0, uCas * 0.1));
    float moc = cnoise(vec3(zamaknjen * 5.0, uCas * 0.2));

    // Krog, ki se siri iz sredisca: ta nosi napredek, sum mu le razje rob.
    moc += distance(vUv, vec2(0.5)) * 12.5 - 7.0 * uProgress;
    moc = 1.0 - clamp(moc, 0.0, 1.0);

    // Vogali ostanejo razjedeni tudi ob koncu - krog iz sredisca do njih ne
    // seze. To je namerno: valujoci robovi v vseh stirih kotih so del ucinka.
    // (Temna in kontrastna slika je bila druga napaka, barvni prostor.)

    vec3 barva = texture2D(uSlika, uv).rgb;
    float vidnost = smoothstep(0.0, 0.7, uProgress);

    gl_FragColor = vec4(barva, moc * vidnost);
  }
`;

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
  p.izris.render(p.prizor, p.kamera);

  if (t >= 1 && ogled.zapira) pospravi();
}

/**
 * Odpre sliko cez stran.
 *
 * Vrne true, ce je ogled prevzel prikaz. Pri video posnetku in kadar WebGL ni
 * na voljo vrne false in klicatelj naj stori, kar bi sicer.
 */
export function odpri(url, opis = "") {
  if (ogled) zapri();
  const p = pripraviPogon();
  if (!p) return false;

  const slika = new Image();
  slika.decoding = "async";
  slika.src = url;

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

  ogled = { ovoj, naTipko, naMero, tekstura: null, razmerje: 1, zapira: false,
            zacetek: performance.now(), zanka: null };

  slika
    .decode()
    .then(() => {
      if (!ogled || ogled.ovoj !== ovoj) return;
      ogled.razmerje = slika.naturalWidth / Math.max(1, slika.naturalHeight);
      ogled.tekstura = new THREE.Texture(slika);
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

/** Vse dol: izris se ustavi, platno gre iz strani, tekstura se sprosti. */
function pospravi() {
  if (!ogled) return;
  const o = ogled;
  ogled = null;
  if (o.zanka) cancelAnimationFrame(o.zanka);
  removeEventListener("keydown", o.naTipko);
  removeEventListener("resize", o.naMero);
  o.tekstura?.dispose();
  if (pogon && pogon.izris.domElement.parentElement === o.ovoj) {
    o.ovoj.removeChild(pogon.izris.domElement);
  }
  o.ovoj.remove();
}
