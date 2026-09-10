/**
 * Stik.
 *
 * Trije zasloni, en pod drugim:
 *
 *   1. samo pozdrav iz znakov, na sredini, in podpis "jure labs" spodaj levo,
 *   2. naslov, poved in povezave - torej to, po kar je kdo prisel,
 *   3. Zemlja, ki se zavrti in ustavi pri Sloveniji.
 *
 * Pozdrav ima dve platni. Besedilo lezi v prvem zaslonu in z drsenjem odide
 * gor kot vsak drug element; frekvencno ozadje pa je sestra drsnega toka in
 * zato miruje - ostane in tece naprej pod vsebino. Prvi zaslon torej ni
 * predsoba, ki bi jo bilo treba prehoditi, ampak isto ozadje drzi vse tri
 * skupaj.
 *
 * Prihod Zemlje je vezan na lego drsnika in ne na prag: globus pripotuje,
 * medtem ko drsis proti njemu, in se ob vracanju enako umakne.
 *
 * Zemlja in pozdrav se nalozita sele ob prvem odprtju - model je tri megabajte
 * in nima kaj lezati v glavnem svezniku.
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

    <div class="stik-ozadje" aria-hidden="true"></div>

    <div class="zapis-tok stik-tok">
      <section class="stik-zaslon stik-uvod">
        <div class="stik-napis" aria-hidden="true"></div>
      </section>

      <section class="stik-zaslon stik-info">
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
      </section>

      <section class="stik-zaslon stik-kje">
        <div class="stik-zemlja" aria-hidden="true"></div>
        <div class="stik-megla" aria-hidden="true"></div>
        <div class="stik-kje-besedilo">
          <div class="zapis-oznaka">Kje sem</div>
          <h2 class="stik-naslov2">Ljubljana, Slovenija.</h2>
          <p class="stik-vodilo">
            Delam od tod. Za delo na daljavo razdalja ni ovira – za kavo pa je
            dobro vedeti, da je do mene bliže, kot je videti od zgoraj.
          </p>
        </div>
      </section>
    </div>`;
  document.body.appendChild(koren);

  const tok = koren.querySelector(".zapis-tok");

  mountVizitka(koren.querySelector(".stik-vizitka-host"), { opro: OPRO });

  // --- tezke stvari se nalozijo sele ob prvem odprtju ----------------------
  const naloziEnkrat = (uvoz, namesti) => {
    let stvar = null;
    let tece = null;
    return () => {
      if (stvar) return Promise.resolve(stvar);
      if (!tece) {
        tece = uvoz()
          .then((m) => (stvar = namesti(m)))
          .catch(() => null);
      }
      return tece;
    };
  };

  const gnezdoOzadja = koren.querySelector(".stik-ozadje");
  const gnezdoNapisa = koren.querySelector(".stik-napis");
  const gnezdoZemlje = koren.querySelector(".stik-zemlja");
  let pozdrav = null;
  let zemlja = null;

  const pripraviPozdrav = naloziEnkrat(
    () => import("./pozdrav.js"),
    (m) => (pozdrav = m.installPozdrav(gnezdoOzadja, gnezdoNapisa))
  );
  const pripraviZemljo = naloziEnkrat(
    () => import("./zemlja.js"),
    (m) => (zemlja = m.installZemlja(gnezdoZemlje))
  );

  // --- drsenje -------------------------------------------------------------
  /**
   * Prihod Zemlje.
   *
   * Delez povemo iz lege tretjega zaslona glede na okno: 0, ko je se cel pod
   * robom, 1, ko stoji na svojem mestu. Ker je to funkcija lege in ne dogodek,
   * gre gib ob vracanju sam po sebi nazaj.
   *
   * Vrtenje je druga stvar: odigra se enkrat, ko globus prvic pripotuje.
   * Vrtenje nazaj ob drsenju navzgor bi bilo videti kot previjanje.
   */
  const zaslonKje = koren.querySelector(".stik-kje");
  let zavrtelo = false;

  function obDrsenju() {
    const okno = tok.clientHeight || 1;
    const vrh = zaslonKje.getBoundingClientRect().top - tok.getBoundingClientRect().top;
    const delez = 1 - Math.max(0, Math.min(vrh / okno, 1));
    zemlja?.nastaviPrihod(delez);
    if (delez > 0.12) {
      pripraviZemljo().then((z) => {
        z?.nastaviPrihod(delez);
        if (!zavrtelo) {
          zavrtelo = true;
          z?.pokazi();
        }
      });
    }
  }

  tok.addEventListener("scroll", obDrsenju, { passive: true });

  // --- odpiranje in zapiranje ---------------------------------------------
  let zapiranje = null;
  let cakalec = null;
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
    zavrtelo = false;
    zemlja?.nastaviPrihod(0);

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
    zemlja?.skrij();
  }

  function zapri() {
    if (zapiranje) return;
    sprostiOdprto(api);
    clearTimeout(cakalec);
    pozdrav?.skrij();
    zemlja?.skrij();
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
