/**
 * Val na mestu slike.
 *
 * Slike v besedilu se ne prizgejo, ampak priplapolajo - z istim valom, kot
 * odpre sliko ogled v galeriji. Razlika je v legi: ogled zavzame cel zaslon,
 * tu pa val stece v okvirju, kjer slika ze stoji, in to sam od sebe, ko
 * prides do nje. Klika ni treba.
 *
 * Izrisovalnik je en sam in neviden. Vsaka slika ima svoje platno 2D, v
 * katero prepisemo sliko iz WebGL - tako lahko tece vec valov hkrati, ne da bi
 * za vsako sliko odpirali svoj graficni kontekst. Ko je val pri koncu, se prava
 * slika zbledi in izostri cez platno, platno pa gre tiho za njo - konca zato
 * ni videti.
 *
 * Ploskev je manjsa od platna (za ZRAK), da ima val kam pobegniti. Presezek
 * okvir odreze, a ravno toliko, da se gube ob robu se vidijo.
 */

import * as THREE from "three";
import { FRAGMENT, VERTEX, VAL, ZRAK } from "./val-sencilnik.js";
import "./val.css";

/** Koliko traja prihod. Isto kot v ogledu, da je ucinek en in isti. */
const CAS_MS = 1500;
/**
 * Najdaljsa stranica izrisa.
 *
 * Mora biti dovolj velika, da je slika iz vala enako ostra kot prava slika
 * pod njim - ce je mehkejsa, ob koncu vidis, kako slika skoci v ostrino.
 */
const NAJVEC_PIK = 1600;
/** Koliko valov tece hkrati; ostali pocakajo v vrsti. */
const HKRATI = 2;
/** Koliko casa se pod platnom prizge prava slika in koliko nato bledi platno. */
const PRIHOD_MS = 520;
const ODHOD_MS = 560;
/** Kdor je gibanje izklopil, dobi navadno sliko. */
const mirno = matchMedia("(prefers-reduced-motion: reduce)");

let pogon = null;
let pogonSpodletel = false;

function pripraviPogon() {
  if (pogon || pogonSpodletel) return pogon;
  try {
    const izris = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    izris.setPixelRatio(1); // merilo je ze v merah platna
    izris.setClearAlpha(0);

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
        // Odsev je stvar kartice v ogledu; slika v besedilu ga ne nosi.
        uOdsev: { value: new THREE.Vector2(0.5, 0.5) },
        uOdsevMoc: { value: 0 },
      },
    });

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

const gladko = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Valovi, ki tecejo, in tisti, ki cakajo. */
const tecejo = new Set();
const vrsta = [];
let zanka = null;

function naprej() {
  while (tecejo.size < HKRATI && vrsta.length) zacni(vrsta.shift());
  if (tecejo.size && !zanka) zanka = requestAnimationFrame(slicica);
}

/** Pripravi platno in teksturo ter uvrsti val med tekoce. */
function zacni(delo) {
  const { okvir, slika } = delo;
  const p = pripraviPogon();
  if (!p || !okvir.isConnected) {
    konec(delo);
    return;
  }
  const r = okvir.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) {
    konec(delo);
    return;
  }
  const razmerje = r.width / r.height;
  const gostota = Math.min(devicePixelRatio || 1, NAJVEC_PIK / Math.max(r.width, r.height));

  const platno = document.createElement("canvas");
  platno.className = "val-platno";
  platno.width = Math.max(2, Math.round(r.width * ZRAK * gostota));
  platno.height = Math.max(2, Math.round(r.height * ZRAK * gostota));
  okvir.appendChild(platno);

  const tekstura = new THREE.Texture(slika);
  // Brez barvnega prostora, kot v ogledu: sencilnik vrednosti ne pretvarja,
  // zato gredo skozi nespremenjene in slika ima iste barve kot v besedilu.
  tekstura.colorSpace = THREE.NoColorSpace;
  tekstura.needsUpdate = true;

  Object.assign(delo, {
    platno,
    ctx: platno.getContext("2d"),
    tekstura,
    razmerje,
    mere: slika.naturalWidth / Math.max(1, slika.naturalHeight),
    zacetek: performance.now(),
  });
  tecejo.add(delo);
  okvir.classList.add("val-tece");
}

function slicica(ms) {
  zanka = null;
  const p = pogon;
  if (!p) {
    for (const d of [...tecejo]) konec(d);
    return;
  }
  for (const d of [...tecejo]) {
    const t = Math.min((ms - d.zacetek) / CAS_MS, 1);
    p.gradivo.uniforms.uSlika.value = d.tekstura;
    p.gradivo.uniforms.uCas.value = ms * 0.001;
    p.gradivo.uniforms.uProgress.value = gladko(t);
    p.gradivo.uniforms.uPolje.value.set(d.razmerje, 1);
    p.gradivo.uniforms.uMere.value.set(d.mere, 1);
    // Vidno polje je visoko dve enoti; slika zavzame njegov delez 1/ZRAK.
    const v = 2 / ZRAK;
    p.ploskev.scale.set(v * d.razmerje, v, 1);
    p.izris.setSize(d.platno.width, d.platno.height, false);
    p.kamera.aspect = d.platno.width / d.platno.height;
    p.kamera.updateProjectionMatrix();
    p.izris.render(p.prizor, p.kamera);
    d.ctx.clearRect(0, 0, d.platno.width, d.platno.height);
    d.ctx.drawImage(p.izris.domElement, 0, 0, d.platno.width, d.platno.height);
    if (t >= 1) konec(d);
  }
  if (tecejo.size) zanka = requestAnimationFrame(slicica);
  else naprej();
}

/**
 * Konec vala, v dveh stopnjah - in nobena ne zniza svetlosti.
 *
 * Najprej se POD polnim platnom pocasi prizge prava slika. Ker je platno se
 * povsem neprozorno, je to videti le tam, kjer ga je sum razjedel: koticki in
 * robovi se zapolnijo mehko, namesto da bi poknili v ostro sliko.
 *
 * Nato zbledi samo platno in pod njim ostane ista slika - prelivata se dve
 * enaki sliki, zato prehoda ni videti. Slika sama nima zameglitve, ki bi ji
 * brskalnik ob koncu odvzel svojo plast in jo prerisal; prav to se je prej
 * videlo kot sunek.
 */
function konec(delo) {
  tecejo.delete(delo);
  delo.tekstura?.dispose();
  const platno = delo.platno;
  const okvir = delo.okvir;
  if (!platno) {
    okvir.classList.remove("val-tece", "val-caka");
    naprej();
    return;
  }
  // Slicica vmes, da prehod prosojnosti na sliki res stece.
  requestAnimationFrame(() => okvir.classList.remove("val-tece", "val-caka"));
  setTimeout(() => platno.classList.add("odhaja"), PRIHOD_MS);
  setTimeout(() => platno.remove(), PRIHOD_MS + ODHOD_MS + 120);
  naprej();
}

/**
 * Slike pod korenom priplapolajo, ko pridejo na zaslon.
 *
 * @param {Element} koren kjer iscemo slike
 * @param {{izbor?: string, tok?: Element|null}} moznosti tok je drsni okvir,
 *   v katerem slike zivijo (opazovalec meri glede nanj)
 */
export function namestiVal(koren, { izbor = ".zapis-slika", tok = null } = {}) {
  if (!koren || mirno.matches) return () => {};

  const opazovalec = new IntersectionObserver(
    (vnosi) => {
      for (const v of vnosi) {
        if (!v.isIntersecting) continue;
        opazovalec.unobserve(v.target);
        const okvir = v.target;
        const slika = okvir.querySelector("img:not(.zapis-sij)");
        if (!slika) continue;
        const url = slika.currentSrc || slika.src;
        if (!url) continue;
        // Val potrebuje sliko v pomnilniku; dokler je ni, okvir ostane prazen.
        const kopija = new Image();
        kopija.decoding = "async";
        kopija.src = url;
        kopija
          .decode()
          .then(() => {
            if (!okvir.isConnected) return;
            vrsta.push({ okvir, slika: kopija });
            naprej();
          })
          .catch(() => okvir.classList.remove("val-caka"));
      }
    },
    { root: tok, rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
  );

  for (const okvir of koren.querySelectorAll(izbor)) {
    if (okvir.dataset.val === "1") continue;
    okvir.dataset.val = "1";
    okvir.classList.add("val-caka");
    opazovalec.observe(okvir);
  }
  return () => opazovalec.disconnect();
}
