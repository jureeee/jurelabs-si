/**
 * Obiski in kdo stran gleda zdaj.
 *
 * Stevilke so prave. Stejemo pri javnem stevcu Abacus, ki ne rabi racuna ne
 * kljuca - brskalnik ga poklice neposredno.
 *
 *   Obiskov skupaj: vsako odprtje strani je en obisk, stevilo samo raste.
 *   Stevec je nastal, ko je stran ze tekla; obiski pred njim so ZACETEK.
 *
 *   Zdaj gleda: cas je razdeljen na okna po OKNO_S sekund. Vsak odprt in
 *   viden zavihek se v vsakem oknu oglasi natanko enkrat, v stevec tega okna.
 *   Koliko oglasitev ima zadnje polno okno, toliko ljudi je gledalo. Brez
 *   streznika in brez seznama obiskovalcev - samo stevila.
 *
 * Na lokalnem razvoju stevec samo bere: preizkusanje ne sme napihovati
 * stevilk.
 */

import { jezik, obJeziku, t } from "./jezik.js";

const STEVEC = "https://abacus.jasoncameron.dev";
const PROSTOR = "jurelabs-si";
const OKNO_S = 120;
/** Obiski, preden je stevec obstajal. Pristeje se vsemu, kar izmeri. */
const ZACETEK = 35;

const lokalno = /^(localhost|127\.|192\.168\.)/.test(location.hostname);

async function beri(pot) {
  try {
    const r = await fetch(`${STEVEC}/${pot}`, { cache: "no-store" });
    if (r.status === 404) return 0;
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j.value === "number" && j.value >= 0 ? j.value : 0;
  } catch {
    return null;
  }
}

const hit = (kljuc) => beri(`hit/${PROSTOR}/${kljuc}`);
const get = (kljuc) => beri(`get/${PROSTOR}/${kljuc}`);
const okno = (zamik = 0) => Math.floor(Date.now() / 1000 / OKNO_S) + zamik;

/** Slovenska dvojina in mnozina: 1 obisk, 2 obiska, 3 obiski, 5 obiskov. */
function sklon(n, [ena, dve, tri, pet]) {
  const s = n % 100;
  if (s === 1) return ena;
  if (s === 2) return dve;
  if (s === 3 || s === 4) return tri;
  return pet;
}

const stanje = { skupaj: null, zdaj: null };

function narisi() {
  const { skupaj, zdaj } = stanje;
  document.querySelectorAll(".domov-obiski").forEach((el) => {
    if (skupaj === null) return;
    const sl = jezik() === "sl";
    const st = (n) => n.toLocaleString(sl ? "sl-SI" : "en-GB");
    const obiskov = sl
      ? sklon(skupaj, ["obisk", "obiska", "obiski", "obiskov"])
      : t("obiski.obiskov", skupaj === 1 ? "visit" : "visits");
    let besedilo = `<b>${st(skupaj)}</b> ${obiskov}`;
    if (zdaj !== null) {
      const gleda = sl
        ? sklon(zdaj, ["gleda zdaj", "gledata zdaj", "gledajo zdaj", "gleda zdaj"])
        : t("obiski.zdaj", "viewing now");
      besedilo += ` · <b>${st(zdaj)}</b> ${gleda}`;
    }
    el.innerHTML = besedilo;
    el.hidden = false;
  });
}

async function prestejObisk() {
  const v = lokalno ? await get("odprtja") : await hit("odprtja");
  if (v === null) return;
  stanje.skupaj = ZACETEK + v;
  narisi();
}

/** Oglasitev v trenutnem oknu - enkrat na okno in le, ce je zavihek viden. */
let oglaseno = -1;
async function oglasiSe() {
  if (lokalno || document.hidden) return;
  const zdaj = okno();
  if (oglaseno === zdaj) return;
  oglaseno = zdaj;
  await hit(`zdaj-${zdaj}`);
}

/** Koliko jih gleda: vecje od zadnjega polnega okna in trenutnega. */
async function preberiGledalce() {
  const [prej, zdaj] = await Promise.all([get(`zdaj-${okno(-1)}`), get(`zdaj-${okno()}`)]);
  if (prej === null && zdaj === null) return;
  // Kdor gleda, je vsaj en - tudi ce se se ni utegnil oglasiti.
  stanje.zdaj = Math.max(1, prej ?? 0, zdaj ?? 0);
  narisi();
}

export function installObiski() {
  prestejObisk();
  oglasiSe().then(preberiGledalce);
  // Vsakih 20 s pogledamo, ali se je zacelo novo okno - v njem se oglasimo
  // enkrat. Vmes beremo, koliko jih gleda.
  setInterval(oglasiSe, 20 * 1000);
  setInterval(preberiGledalce, 30 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) oglasiSe().then(preberiGledalce);
  });
  // Domaca stran se ob menjavi jezika zgradi znova; vrstico napolnimo spet.
  obJeziku(narisi);
  return { narisi };
}
