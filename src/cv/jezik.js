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

export async function nastaviJezik(koda) {
  if (!JEZIKI.some((j) => j.koda === koda)) return;
  slovar = await naloziSlovar(koda);
  trenutni = koda;
  try {
    localStorage.setItem(SHRAMBA, koda);
  } catch {
    // Izbira velja do zaprtja strani, zapomnjena pa ni.
  }
  document.documentElement.lang = koda;
  document.documentElement.dir = jeRtl(koda) ? "rtl" : "ltr";
  for (const fn of poslusalci) fn(koda);
}

/** Ob zagonu: nalozi zacetni jezik. Do takrat stran tece v slovenscini. */
export function zacniJezik() {
  return nastaviJezik(zacetni());
}
