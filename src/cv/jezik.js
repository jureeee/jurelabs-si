/**
 * Jezik strani.
 *
 * Slovenscina je izvor: vsa besedila so napisana v njej, vsi drugi jeziki so
 * prevodi istih kljucev. Prevodi niso v glavnem svezenju - vsak jezik je svoja
 * datoteka in pride sele, ko ga kdo izbere. Trideset jezikov v prvem nalaganju
 * bi pomenilo, da vsak obiskovalec potegne devetindvajset, ki jih ne bo bral.
 *
 * Kar manjka v prevodu, ostane slovensko. Manjkajoc kljuc ni napaka, ki bi
 * stran ustavila - le beseda, ki se se ni prevedla.
 *
 * Izbira se zapomni v brskalniku. Ob prvem obisku velja jezik brskalnika, ce
 * ga imamo, sicer slovenscina.
 */

/**
 * Jeziki, kot jih bere govorec - vsak s svojim imenom v svoji pisavi. Kdor
 * isce svoj jezik, ga isce po tem, kako ga pise sam.
 */
export const JEZIKI = [
  { koda: "sl", ime: "Slovenščina" },
  { koda: "en", ime: "English" },
  { koda: "de", ime: "Deutsch" },
  { koda: "it", ime: "Italiano" },
  { koda: "fr", ime: "Français" },
  { koda: "es", ime: "Español" },
  { koda: "pt", ime: "Português" },
  { koda: "nl", ime: "Nederlands" },
  { koda: "pl", ime: "Polski" },
  { koda: "cs", ime: "Čeština" },
  { koda: "sk", ime: "Slovenčina" },
  { koda: "hu", ime: "Magyar" },
  { koda: "hr", ime: "Hrvatski" },
  { koda: "sr", ime: "Српски" },
  { koda: "mk", ime: "Македонски" },
  { koda: "bg", ime: "Български" },
  { koda: "ro", ime: "Română" },
  { koda: "el", ime: "Ελληνικά" },
  { koda: "tr", ime: "Türkçe" },
  { koda: "uk", ime: "Українська" },
  { koda: "ru", ime: "Русский" },
  { koda: "sv", ime: "Svenska" },
  { koda: "fi", ime: "Suomi" },
  { koda: "no", ime: "Norsk" },
  { koda: "ar", ime: "العربية", rtl: true },
  { koda: "he", ime: "עברית", rtl: true },
  { koda: "hi", ime: "हिन्दी" },
  { koda: "zh", ime: "中文" },
  { koda: "ja", ime: "日本語" },
  { koda: "ko", ime: "한국어" },
];

const SHRAMBA = "jezik";
const nalozeni = new Map();
const poslusalci = new Set();

let trenutni = "sl";
let slovar = null;

/** Prevodi se nalozijo po potrebi; Vite iz tega naredi po eno datoteko na jezik. */
const nalagalniki = import.meta.glob("./prevodi/*.js");

function zacetni() {
  try {
    const shranjen = localStorage.getItem(SHRAMBA);
    if (shranjen && JEZIKI.some((j) => j.koda === shranjen)) return shranjen;
  } catch {
    // Brez shrambe (zasebno okno, izklopljeni piskotki) velja privzeto.
  }
  const brskalnik = (navigator.language || "sl").slice(0, 2).toLowerCase();
  return JEZIKI.some((j) => j.koda === brskalnik) ? brskalnik : "sl";
}

async function naloziSlovar(koda) {
  if (koda === "sl") return null;
  if (nalozeni.has(koda)) return nalozeni.get(koda);
  const nalozi = nalagalniki[`./prevodi/${koda}.js`];
  if (!nalozi) return null;
  const modul = await nalozi();
  nalozeni.set(koda, modul.default);
  return modul.default;
}

/**
 * Prevod kljuca.
 *
 * @param {string} kljuc npr. "meni.delo"
 * @param {string} izvor slovensko besedilo - velja, ce prevoda ni
 */
export function t(kljuc, izvor) {
  if (!slovar) return izvor;
  const v = slovar[kljuc];
  return v == null ? izvor : v;
}

/** Prevod celega predmeta (npr. vsebine strani): kar je prevedeno, zamenja. */
export function tPredmet(kljuc, izvor) {
  if (!slovar || !slovar[kljuc]) return izvor;
  return slovar[kljuc];
}

/**
 * Zlije prevod v izvorno vsebino strani.
 *
 * Prevod nosi le besede. Vse ostalo - vrsta razdelka, zaporedna stevilka
 * slike, ali je obrnjen - pride iz izvora, zato ga prevajalec ne more
 * pokvariti. Seznami predmetov (razdelki, kartice) se zlivajo po vrstnem
 * redu; seznami besed (znacke) in skupine se zamenjajo v celoti, ker so v
 * prevodu lahko drugacni - ime skupine je ze samo besedilo.
 */
export function prevediVsebino(izvor, prevod) {
  if (prevod == null) return izvor;
  if (typeof izvor === "string") return typeof prevod === "string" ? prevod : izvor;
  if (Array.isArray(izvor)) {
    if (!Array.isArray(prevod)) return izvor;
    if (izvor.every((x) => typeof x === "string")) return prevod;
    return izvor.map((x, i) => prevediVsebino(x, prevod[i]));
  }
  if (izvor && typeof izvor === "object") {
    const ven = {};
    for (const k of Object.keys(izvor)) {
      ven[k] = k === "skupine" && prevod[k] ? prevod[k] : prevediVsebino(izvor[k], prevod[k]);
    }
    return ven;
  }
  return izvor;
}

export function jezik() {
  return trenutni;
}

export function jeRtl(koda = trenutni) {
  return !!JEZIKI.find((j) => j.koda === koda)?.rtl;
}

/** Klice fn ob vsaki menjavi jezika (po tem, ko je slovar ze nalozen). */
export function obJeziku(fn) {
  poslusalci.add(fn);
  return () => poslusalci.delete(fn);
}

/** Kaj se ob menjavi jezika zamegli - ploskve, na katerih so napisi. */
const ZAMEGLI = ".nav, .dock, .jez, .zapis-tok, .prof-vsebina, .nast-plosca";
const KRIVULJA_JEZIK = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Tece zameglitev; drzimo jo, da jo znamo prekiniti ob vrnitvi. */
let megla = [];

/**
 * Vmesnik zdrsne iz ostrine in nazaj.
 *
 * Z Web Animations API in ne s CSS: meni, dock in izbirnik jezika imajo
 * vstopno animacijo s fill: both, ki lastnost filter drzi zase - dokler jo
 * drzi animacija, CSS prehod ne stece in menjava je oster preskok. Animacije
 * iz skripte so v cascadi nad tistimi iz CSS, zato prevzamejo.
 */
function zamegli(ven) {
  const okvirji = ven
    ? [{ filter: "blur(0px)", opacity: 1 }, { filter: "blur(9px)", opacity: 0.15 }]
    : [{ filter: "blur(9px)", opacity: 0.15 }, { filter: "blur(0px)", opacity: 1 }];
  const tece = [...document.querySelectorAll(ZAMEGLI)].map((el) =>
    el.animate(okvirji, {
      duration: ven ? 240 : 340,
      easing: KRIVULJA_JEZIK,
      // Ob odhodu megla obstane, dokler ne zamenjamo besedila; ob vrnitvi se
      // animacija umakne in ploskev je spet taka, kot jo doloca slog.
      fill: ven ? "forwards" : "none",
    })
  );
  return tece;
}

/**
 * Zamenja jezik.
 *
 * Napisi v drugem jeziku so drugace dolgi, zato se ploskve pod njimi
 * prerisejo in premaknejo. Da to ni sunek, vmesnik najprej zdrsne iz ostrine,
 * zamenjava se zgodi v megli in nato se izostri nazaj. Ob zagonu strani
 * prehoda ni - takrat se ni bilo cesa zamenjati.
 */
export async function nastaviJezik(koda, { tiho = false } = {}) {
  if (!JEZIKI.some((j) => j.koda === koda)) return;
  const prehod = !tiho && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prehod) {
    for (const a of megla) a.cancel();
    megla = zamegli(true);
  }
  slovar = await naloziSlovar(koda);
  // Pocakamo, da megla pride; sele nato zamenjamo besedilo. Cakamo na cas in
  // ne na animacijo: v skritem zavihku ta ne tece in menjava bi obvisela.
  if (prehod) await new Promise((r) => setTimeout(r, 240));
  trenutni = koda;
  try {
    localStorage.setItem(SHRAMBA, koda);
  } catch {
    // Izbira velja do zaprtja strani, zapomnjena pa ni.
  }
  document.documentElement.lang = koda;
  document.documentElement.dir = jeRtl(koda) ? "rtl" : "ltr";
  for (const fn of poslusalci) fn(koda);
  if (prehod) {
    for (const a of megla) a.cancel();
    megla = zamegli(false);
  }
}

/** Ob zagonu: nalozi zacetni jezik. Do takrat stran tece v slovenscini. */
export function zacniJezik() {
  return nastaviJezik(zacetni(), { tiho: true });
}
