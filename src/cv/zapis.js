/**
 * Pogon uredniske strani.
 *
 * Dolg zapis, ki se odkriva ob drsenju, in vrtiljak na koncu kot zakljucek.
 * Isti pogon poganja Delo in O meni - razlikujeta se le po besedilu, ki pride
 * iz vsebina.js. Dve strani z isto mehaniko ne smeta biti dve kopiji te
 * datoteke; ko bi popravil drsenje v eni, bi na drugo pozabil.
 *
 * Zaporedje je namerno: najprej ena poved, ki pove, kdo si; nato razdelki, ki
 * se pojavijo sele, ko prides do njih; sele na koncu vrtiljak. Kdor odide po
 * treh vrsticah, je dobil bistvo; kdor ostane, dobi podrobnosti.
 *
 * Ton je zadrzan. Kratke povedi, brez presezkov - stvar, ki se hvali, deluje
 * manjse, kot je.
 */

import "./zapis.css";
import { mediji } from "./mediji.js";

const ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const PUSCICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';

/**
 * Odprta je lahko le ena stran naenkrat.
 *
 * Obe zivita v telesu dokumenta in obe prekrivata galaksijo; ce bi se odprli
 * skupaj, bi se prekrivali med sabo, spodnja pa bi ostala ujeta pod zgornjo,
 * ker se zapre le tista, ki ima gumb na vrhu.
 */
let odprta = null;

const znacke = (seznam) =>
  `<div class="zapis-znacke">${seznam
    .map((z) => `<span class="zapis-znacka dg">${z}</span>`)
    .join("")}</div>`;

/** Naslovi lomijo vrstico z \n, ker je to v vsebini berljivejse od <br>. */
const naslovHtml = (t) => t.replace(/\n/g, "<br>");

/**
 * Izris enega razdelka.
 *
 * @param {object} o razdelek iz vsebine
 * @param {(i: number) => string} slika naslov slike po zaporedni stevilki
 */
function odsekHtml(o, slika) {
  const oznaka = `<div class="zapis-oznaka">${o.oznaka}</div>`;

  if (o.tip === "skupine") {
    const stolpci = Object.entries(o.skupine)
      .map(([ime, seznam]) => `<div class="zapis-skupina"><h3>${ime}</h3>${znacke(seznam)}</div>`)
      .join("");
    return `<section class="odsek zapis-orodja">${oznaka}
      <div class="zapis-stolpci">${stolpci}</div></section>`;
  }

  if (o.tip === "sirok") {
    return `<section class="odsek zapis-sirok">${oznaka}
      <h2>${naslovHtml(o.naslov)}</h2>
      <p>${o.telo}</p></section>`;
  }

  return `<section class="odsek zapis-par${o.obrnjen ? " obrnjen" : ""}">
      <div class="zapis-besedilo">
        ${oznaka}
        <h2>${naslovHtml(o.naslov)}</h2>
        <p>${o.telo}</p>
        ${o.znacke ? znacke(o.znacke) : ""}
      </div>
      <figure class="zapis-slika"><img alt="" loading="lazy" src="${slika(o.slika)}" /></figure>
    </section>`;
}

/** @param {import("./vsebina.js").DELO} vsebina */
export function installZapis(vsebina) {
  const slike = mediji.filter((m) => !m.video).map((m) => m.url);
  const slika = (i) => slike[i % slike.length] ?? "";

  const koren = document.createElement("div");
  koren.className = "zapis";
  koren.innerHTML = `
    <div class="zapis-zavesa"></div>
    <button class="zapis-zapri dg" type="button" aria-label="Zapri">${ZAPRI}</button>

    <div class="zapis-tok">
      <header class="odsek zapis-uvod">
        <div class="zapis-oznaka">${vsebina.uvod.oznaka}</div>
        <h1 class="zapis-glavni">${naslovHtml(vsebina.uvod.naslov)}</h1>
        <p class="zapis-vodilo">${vsebina.uvod.vodilo}</p>
      </header>

      ${vsebina.odseki.map((o) => odsekHtml(o, slika)).join("")}

      <section class="odsek zapis-zakljucek">
        <div class="zapis-oznaka">${vsebina.kartice.oznaka}</div>
        <div class="zapis-vrtiljak">
          <div class="zapis-tir">
            ${vsebina.kartice.seznam
              .map(
                (k) => `
              <article class="zapis-kartica dg">
                <div class="zapis-oznaka">${k.oznaka}</div>
                <h2 class="zapis-naslov">${naslovHtml(k.naslov)}</h2>
                <p class="zapis-telo">${k.telo}</p>
              </article>`
              )
              .join("")}
          </div>
          <button class="zapis-nazaj dg" type="button" aria-label="Prejsnja">${PUSCICA}</button>
          <button class="zapis-naprej dg" type="button" aria-label="Naslednja">${PUSCICA}</button>
        </div>
      </section>

      <footer class="odsek zapis-konec"><p>${vsebina.konec}</p></footer>
    </div>`;
  document.body.appendChild(koren);

  const tok = koren.querySelector(".zapis-tok");
  const tir = koren.querySelector(".zapis-tir");

  // --- razdelki se pojavijo, ko prides do njih -----------------------------
  const opazovalec = new IntersectionObserver(
    (vnosi) => vnosi.forEach((v) => v.isIntersecting && v.target.classList.add("vidno")),
    { root: tok, rootMargin: "-6% 0px -14% 0px", threshold: 0.01 }
  );
  koren.querySelectorAll(".odsek").forEach((o) => opazovalec.observe(o));

  // --- vrtiljak ------------------------------------------------------------
  const kartice = [...tir.querySelectorAll(".zapis-kartica")];

  /** Koliko znasa en zobnik kolesca. Windows javi 100, drugod se razlikuje. */
  const ZOBNIK = 100;
  /** Koliko casa cakamo, da se hitri zobniki zdruzijo v eno potezo. */
  const ZDRUZI_MS = 90;

  let kje = 0;
  let nabrano = 0;
  let cakalec = null;
  let gib = null;

  const korak = () => {
    const k = kartice[0];
    return k ? k.getBoundingClientRect().width + 26 : 380;
  };

  /**
   * Oznaci lege glede na sredinsko kartico.
   *
   * Sosedi dobita odmik v svojo stran in zbledita; oddaljene se umaknejo
   * povsem. Brez tega so vse kartice enakovredne in oko ne ve, katera je
   * izbrana - to je bilo videti kot vrsta, ne kot vrtiljak.
   */
  function oznaciLege() {
    kartice.forEach((k, i) => {
      k.classList.remove("sredina", "stran-leva", "stran-desna", "dalec");
      const razlika = i - kje;
      if (razlika === 0) k.classList.add("sredina");
      else if (razlika === -1) k.classList.add("stran-leva");
      else if (razlika === 1) k.classList.add("stran-desna");
      else k.classList.add("dalec");
    });
  }

  /** Pocasi na zacetku in koncu, hitro v sredini. */
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /**
   * Premik na kartico.
   *
   * Trajanje raste s stevilom kartic, a ne sorazmerno - dve kartici nista
   * dvakrat dlje, sicer bi bil dolg skok mucno pocasen.
   */
  function pojdi(nacilj) {
    const meja = kartice.length - 1;
    const nova = Math.max(0, Math.min(nacilj, meja));
    const zacetek = tir.scrollLeft;
    const konec = nova * korak();
    const razdalja = konec - zacetek;
    if (Math.abs(razdalja) < 1) {
      kje = nova;
      oznaciLege();
      return;
    }

    const kartic = Math.abs(nova - kje) || 1;
    const trajanje = 420 + Math.sqrt(kartic) * 190;
    const smer = Math.sign(razdalja);
    kje = nova;
    oznaciLege();

    const zacetniCas = performance.now();
    if (gib) cancelAnimationFrame(gib);

    (function slicica(zdaj) {
      const t = Math.min((zdaj - zacetniCas) / trajanje, 1);
      const e = easeInOut(t);
      tir.scrollLeft = zacetek + razdalja * e;

      // Squish: kartice se med potjo stisnejo v smeri gibanja in se ob koncu
      // odbijejo nazaj. Vrh je na sredini poti, kjer je hitrost najvecja.
      // Squish pise samo sredinski kartici. Stranskima lego doloca razred; ce
      // bi jima pisali se transform, bi ga prepisal in odmik bi izginil.
      const moc = Math.sin(t * Math.PI);
      const sredinska = kartice[kje];
      if (sredinska) {
        sredinska.style.transform =
          `scaleX(${1 - moc * 0.05}) scaleY(${1 + moc * 0.035})` +
          ` translateX(${-smer * moc * 9}px)`;
      }

      if (t < 1) {
        gib = requestAnimationFrame(slicica);
        return;
      }
      gib = null;
      // Odboj: sredinska se vrne z vzmetjo, nato lego spet doloca razred.
      if (sredinska) {
        sredinska.style.transform = "";
      }
      oznaciLege();
    })(zacetniCas);
  }

  oznaciLege();

  koren.querySelector(".zapis-naprej").addEventListener("click", () => pojdi(kje + 1));
  koren.querySelector(".zapis-nazaj").addEventListener("click", () => pojdi(kje - 1));

  /**
   * Klik na stransko kartico jo pripelje na sredino.
   *
   * Sredinska na klik ne odgovarja: tam besedilo beres in ga vcasih izberes,
   * premik pod prstom pa bi bil za to kazen. Iz istega razloga premik odpade,
   * ce je klik koncal izbiranje - takrat si vlekel cez besedilo, nisi ciljal
   * kartice.
   */
  tir.addEventListener("click", (e) => {
    const k = e.target instanceof Element ? e.target.closest(".zapis-kartica") : null;
    if (!k) return;
    const i = kartice.indexOf(k);
    if (i < 0 || i === kje) return;
    if (getSelection()?.isCollapsed === false) return;
    pojdi(i);
  });

  /**
   * Kolescek nad vrtiljakom.
   *
   * Zobniki se zberejo v kratkem oknu in sele nato prevedejo v kartice, po
   * pravilu ceil(n / 2): en zobnik je ena kartica, dva sta se vedno ena - da
   * pomota ne odnese predalec - trije pa dve. Brez zdruzevanja bi vsak zobnik
   * sprozil svojo animacijo in te bi se prekrivale.
   *
   * Ko je vrtiljak na koncu, dogodka ne prevzamemo vec in stran drsi naprej.
   */
  tir.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const naProstem =
        (e.deltaY > 0 && kje >= kartice.length - 1) || (e.deltaY < 0 && kje <= 0);
      if (naProstem) return;
      e.preventDefault();

      nabrano += e.deltaY;
      clearTimeout(cakalec);
      cakalec = setTimeout(() => {
        const zobnikov = Math.abs(nabrano) / ZOBNIK;
        const kartic = Math.max(1, Math.ceil(zobnikov / 2));
        pojdi(kje + Math.sign(nabrano) * kartic);
        nabrano = 0;
      }, ZDRUZI_MS);
    },
    { passive: false }
  );

  // --- mehko drsenje po strani --------------------------------------------
  let cilj = 0;
  let tece = false;

  tok.addEventListener(
    "wheel",
    (e) => {
      if (e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      cilj = Math.max(0, Math.min(cilj + e.deltaY, tok.scrollHeight - tok.clientHeight));
      if (!tece) {
        tece = true;
        requestAnimationFrame(mehko);
      }
    },
    { passive: false }
  );

  function mehko() {
    const d = cilj - tok.scrollTop;
    if (Math.abs(d) < 0.4) {
      tok.scrollTop = cilj;
      tece = false;
      return;
    }
    tok.scrollTop += d * 0.12;
    requestAnimationFrame(mehko);
  }

  tok.addEventListener("scroll", () => {
    if (!tece) cilj = tok.scrollTop;
  }, { passive: true });

  // --- odpiranje in zapiranje ---------------------------------------------
  let zapiranje = null;

  const api = { odpri, zapri };

  function odpri() {
    // Druga stran se umakne brez animacije - dve zavesi cez galaksijo hkrati
    // sta dvojna zatemnitev, ne prehod.
    if (odprta && odprta !== api) odprta.takoj();
    odprta = api;

    if (zapiranje) {
      clearTimeout(zapiranje);
      zapiranje = null;
      koren.classList.remove("zapira");
    }
    koren.classList.add("odprt");
    // Vrtiljak nazaj na prvo kartico. Brez tega ob ponovnem odprtju obvisi
    // tam, kjer si ga pustil, lege pa kazejo na prvo - in oboje se razide.
    kje = 0;
    tir.scrollLeft = 0;
    oznaciLege();
    tok.scrollTop = 0;
    cilj = 0;

    // Prihod od spodaj. Razred odvzamemo, ko animacija pretece: transform na
    // ovoju bi sicer ostal in steklu kartic vzel podlago, ki jo lomi.
    tok.classList.add("prihaja");
    tok.addEventListener(
      "animationend",
      (e) => {
        if (e.animationName === "tokPrihod") tok.classList.remove("prihaja");
      },
      { once: true }
    );
  }

  /** Zapre v hipu, brez odhodne animacije. Za zamenjavo strani. */
  function takoj() {
    clearTimeout(zapiranje);
    zapiranje = null;
    koren.classList.remove("odprt", "zapira");
  }

  function zapri() {
    if (zapiranje) return;
    if (odprta === api) odprta = null;
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
