/**
 * Stik.
 *
 * Ploskev cez galaksijo, kot ostale strani, a brez dolgega besedila: kdor
 * pride sem, isce naslov in ne zgodbe. Zato so povezave prve in velike,
 * vse drugo pa pride za njimi.
 *
 * Uporablja isto zaveso in isti prihod kot uredniske strani (razredi zapis-*),
 * ker ne sme biti videti kot druga vrsta okna. Vsebina znotraj je svoja.
 *
 * Dve stvari se pojavita sami:
 *   - vizitka, ki se razpre iz gumba cez celo stran,
 *   - pozdrav, ki se sestavi iz delcev sekundo po odprtju. Sekunda je
 *     namerna: najprej se ustali stran, sele nato pride pozdrav, sicer se
 *     dva gibanja prekrivata in nobeno ni videti.
 */

import "./stik.css";
import { prevzemiOdprto, sprostiOdprto } from "./zapis.js";
import { mountVizitka } from "./vizitka.js";
import { mediji } from "./mediji.js";

const ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const IKONE = {
  posta:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>',
  splet:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"/></svg>',
  git:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
};

/** Povezave. Ista trojica kot na vizitki - dva razlicna naslova bi bila napaka. */
const POVEZAVE = [
  { ikona: "posta", ime: "jure.blatnik10@gmail.com", url: "mailto:jure.blatnik10@gmail.com" },
  { ikona: "splet", ime: "www.jurelabs.si", url: "https://www.jurelabs.si" },
  { ikona: "git", ime: "github.com/jureeee", url: "https://github.com/jureeee" },
];

/**
 * Vrstice na vizitki.
 *
 * V Trace Space so opisovale program, ki ga gledas. Tu opisujejo stran, ki jo
 * gledas - vizitka naj pove nekaj o tem, kje stoji, sicer je le nalepka.
 */
const OPRO = () => [
  ["STRAN", "blatnikjuree"],
  ["PRIZOR", "galaksija, 50 000 tock"],
  ["IZRIS", "WebGL, lasten sencilnik"],
  ["OGRODJE", "Vite, brez okvirja"],
  ["GALERIJA", `${mediji.length} objav`],
];

/** Koliko po odprtju pride pozdrav. */
const POZDRAV_ZAMIK_MS = 1000;

export function installStik() {
  const koren = document.createElement("div");
  koren.className = "zapis stik";
  koren.innerHTML = `
    <div class="zapis-zavesa"></div>
    <button class="zapis-zapri dg" type="button" aria-label="Zapri">${ZAPRI}</button>

    <div class="zapis-tok stik-tok">
      <div class="stik-pozdrav" aria-hidden="true"></div>

      <div class="stik-vsebina">
        <div class="zapis-oznaka">Stik</div>
        <h1 class="stik-glavni">Najlažje po e-pošti.</h1>
        <p class="stik-vodilo">
          Odgovorim v dnevu ali dveh. Če gre za delo, napiši, kaj potrebuješ in
          do kdaj – ostalo se zmeniva sproti.
        </p>

        <div class="stik-povezave">
          ${POVEZAVE.map(
            (p) => `
            <a class="stik-povezava dg" href="${p.url}" target="_blank" rel="noopener noreferrer">
              <span class="stik-ikona">${IKONE[p.ikona]}</span>
              <span class="stik-ime">${p.ime}</span>
            </a>`
          ).join("")}
        </div>

        <div class="stik-vizitka"><div class="stik-vizitka-host"></div></div>
      </div>
    </div>`;
  document.body.appendChild(koren);

  const tok = koren.querySelector(".zapis-tok");

  mountVizitka(koren.querySelector(".stik-vizitka-host"), { opro: OPRO });

  // --- pozdrav -------------------------------------------------------------
  // Pogon je velik in ga nima smisla nalozili, dokler Stika nihce ne odpre.
  // Naloziva ga ob prvem odprtju in ga nato obdrziva.
  const gnezdo = koren.querySelector(".stik-pozdrav");
  let pozdrav = null;
  let nalaganje = null;
  let cakalec = null;

  function pripraviPozdrav() {
    if (pozdrav) return Promise.resolve(pozdrav);
    if (!nalaganje) {
      nalaganje = import("./pozdrav.js")
        .then((m) => {
          pozdrav = m.installPozdrav(gnezdo);
          return pozdrav;
        })
        .catch(() => null);
    }
    return nalaganje;
  }

  // --- odpiranje in zapiranje ---------------------------------------------
  let zapiranje = null;
  const api = { odpri, zapri };

  function odpri() {
    prevzemiOdprto(api);

    if (zapiranje) {
      clearTimeout(zapiranje);
      zapiranje = null;
      koren.classList.remove("zapira");
    }
    koren.classList.add("odprt");
    tok.scrollTop = 0;

    tok.classList.add("prihaja");
    tok.addEventListener(
      "animationend",
      (e) => {
        if (e.animationName === "tokPrihod") tok.classList.remove("prihaja");
      },
      { once: true }
    );

    clearTimeout(cakalec);
    cakalec = setTimeout(() => {
      pripraviPozdrav().then((p) => p?.pokazi());
    }, POZDRAV_ZAMIK_MS);
  }

  /** Zapre v hipu, brez odhodne animacije. Za zamenjavo strani. */
  function takoj() {
    clearTimeout(zapiranje);
    clearTimeout(cakalec);
    zapiranje = null;
    koren.classList.remove("odprt", "zapira");
    pozdrav?.skrij();
  }

  function zapri() {
    if (zapiranje) return;
    sprostiOdprto(api);
    clearTimeout(cakalec);
    pozdrav?.skrij();
    koren.classList.add("zapira");
    // setTimeout in ne rAF: na skriti strani rAF ne tece.
    zapiranje = setTimeout(() => {
      koren.classList.remove("odprt", "zapira");
      zapiranje = null;
    }, 420);
  }

  koren.querySelector(".zapis-zapri").addEventListener("click", zapri);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && koren.classList.contains("odprt")) zapri();
  });

  return Object.assign(api, { takoj });
}
