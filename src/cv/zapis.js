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

import { obJeziku, t, tPredmet, prevediVsebino } from "./jezik.js";
import "./zapis.css";
import { mediji } from "./mediji.js";
import { oziviBesedilo } from "./crke.js";
import { namestiVal } from "./val.js";

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

/**
 * Prijava odprte strani.
 *
 * Register stoji tu, ker je bila ta datoteka prva, ki je odpirala strani, in
 * ker vse strani uporabljajo isto ploskev. Uporablja ga tudi Stik, ki ima
 * svojo vsebino, a isto zaveso - dve zavesi cez galaksijo hkrati sta dvojna
 * zatemnitev, ne prehod.
 *
 * @param {{takoj: () => void}} api stran, ki se odpira
 */
export function prevzemiOdprto(api) {
  if (odprta && odprta !== api) odprta.takoj();
  odprta = api;
}

/** Odjava ob zapiranju. Register se ne sme drzati strani, ki je ni vec. */
export function sprostiOdprto(api) {
  if (odprta === api) odprta = null;
}

const znacke = (seznam) =>
  `<div class="zapis-znacke">${seznam
    .map((z) => `<span class="zapis-znacka dg">${z}</span>`)
    .join("")}</div>`;

/** Naslovi lomijo vrstico z \n, ker je to v vsebini berljivejse od <br>. */
const naslovHtml = (t) => t.replace(/\n/g, "<br>");

/**
 * Ikone uvoda.
 *
 * Stojijo tu in ne v vsebini, ker v vsebini ne sme biti oznak - kdor popravlja
 * povedi, naj ne pade v SVG.
 *
 * Arhivska skatla je risana tako, da se da odpreti: kartica je svoja skupina
 * in obrezana na pas nad pokrovom, zato je pod njim ni videti, dokler se ne
 * dvigne. Brez obrezovanja bi kartica lezala cez skatlo - ploskve so prazne
 * in nic ne zakriva, kar je za njim.
 */
const IKONE = {
  arhiv: `
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs><clipPath id="zapis-arhiv-nad"><rect x="0" y="0" width="48" height="17"/></clipPath></defs>
      <g clip-path="url(#zapis-arhiv-nad)">
        <g class="ark-karta">
          <rect x="16" y="3" width="16" height="15" rx="2"/>
          <path d="M20 8h8M20 12h6"/>
        </g>
      </g>
      <g class="ark-pokrov"><rect x="7" y="17" width="34" height="9" rx="2.5"/></g>
      <g class="ark-telo">
        <path d="M10 26v13a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V26"/>
        <path d="M20 32h8"/>
      </g>
    </svg>`,
};

const IKONA_APLIKACIJA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></svg>';

/**
 * Gumb, ki odpre pravi vmesnik projekta. Pot je relativna na koren strani,
 * zato deluje tudi, ce stran ne tece na korenu domene.
 */
const gumbAplikacije = (a) =>
  `<button class="zapis-odpri dg" type="button" data-aplikacija="${import.meta.env.BASE_URL}${a.pot}" data-ime="${a.ime}">` +
  `${IKONA_APLIKACIJA}<span>${t("zapis.odpri", "Odpri aplikacijo")}</span></button>`;

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
        ${o.aplikacija ? gumbAplikacije(o.aplikacija) : ""}
      </div>
      <figure class="zapis-slika"${o.razmerje ? ` style="aspect-ratio:${o.razmerje}"` : ""}>
        <div class="zapis-sij" style="background-image:url(${slika(o.slika)})" aria-hidden="true"></div>
        <div class="zapis-okvir"><img alt="" loading="lazy" src="${slika(o.slika)}" /></div>
      </figure>
    </section>`;
}

/**
 * @param {import("./vsebina.js").DELO} vsebina slovenski izvor
 * @param {string} [kljuc] pod katerim kljucem je prevod te strani ("delo" ...)
 */
export function installZapis(vsebina, kljuc) {
  const slike = mediji.filter((m) => !m.video).map((m) => m.url);
  // Stevilka je mesto v galeriji, niz pa svoja datoteka - zapis, ki ima svojo
  // sliko, je ne jemlje iz mreze.
  const slika = (i) => (typeof i === "string" ? i : slike[i % slike.length] ?? "");

  /**
   * Vsebina toka iz podatkov.
   *
   * V svoji funkciji, ker jo ob menjavi jezika zgradimo znova - zavesa in
   * gumb za zapiranje ostaneta, tok dobi nove besede.
   *
   * Vrtiljak je neobvezen: Arhiv je kratek in bi ga sklepni vrtiljak naredil
   * daljsega od tega, kar ima povedati.
   */
  function vsebinaHtml(v) {
    const kartice = v.kartice?.seznam ?? [];
    return `
      <header class="odsek zapis-uvod">
        ${v.uvod.ikona ? `<div class="zapis-ikona">${IKONE[v.uvod.ikona]}</div>` : ""}
        <div class="zapis-oznaka">${v.uvod.oznaka}</div>
        <h1 class="zapis-glavni">${naslovHtml(v.uvod.naslov)}</h1>
        <p class="zapis-vodilo">${v.uvod.vodilo}</p>
      </header>

      ${v.odseki.map((o) => odsekHtml(o, slika)).join("")}

      ${
        kartice.length
          ? `<section class="odsek zapis-zakljucek">
        <div class="zapis-oznaka">${v.kartice.oznaka}</div>
        <div class="zapis-vrtiljak">
          <div class="zapis-tir">
            ${kartice
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
          <button class="zapis-nazaj dg" type="button" aria-label="${t("zapis.prejsnja", "Prejšnja")}">${PUSCICA}</button>
          <button class="zapis-naprej dg" type="button" aria-label="${t("zapis.naslednja", "Naslednja")}">${PUSCICA}</button>
        </div>
      </section>`
          : ""
      }

      <footer class="odsek zapis-konec"><p>${v.konec}</p></footer>`;
  }

  const koren = document.createElement("div");
  koren.className = "zapis";
  koren.innerHTML = `
    <div class="zapis-zavesa"></div>
    <button class="zapis-zapri dg" type="button" aria-label="Zapri">${ZAPRI}</button>
    <div class="zapis-tok">${vsebinaHtml(vsebina)}</div>`;
  document.body.appendChild(koren);

  const tok = koren.querySelector(".zapis-tok");
  let tir = koren.querySelector(".zapis-tir");

  /**
   * Klik na sliko jo odpre cez stran z istim valom kot v galeriji.
   *
   * Ogled je tezek - nosi sencilnika in svoj izris - zato pride sele ob prvem
   * kliku. Kdor je gibanje izklopil, ostane brez njega, tako kot v galeriji.
   */
  const mirnoGibanje = matchMedia("(prefers-reduced-motion: reduce)");
  // Gumb projekta odpre njegovo aplikacijo v oknu cez stran.
  tok.addEventListener("click", (e) => {
    const gumb = e.target instanceof Element ? e.target.closest(".zapis-odpri") : null;
    if (!gumb) return;
    import("./aplikacija.js")
      .then((m) => m.odpri(gumb.dataset.aplikacija, gumb.dataset.ime))
      .catch(() => null);
  });
  tok.addEventListener("click", (e) => {
    const slika = e.target instanceof Element ? e.target.closest(".zapis-slika img") : null;
    if (!slika || mirnoGibanje.matches) return;
    const url = slika.currentSrc || slika.src;
    if (!url) return;
    import("./plapol.js")
      .then((m) => m.odpri(url, slika.alt || ""))
      .catch(() => null);
  });

  /** Besedilo prileti po znakih, ko prides do njega. */
  const IZBOR_CRK = "h1, h2, h3, p, .zapis-oznaka, .zapis-znacka";
  const oziviTok = () => {
    oziviBesedilo(tok, { tok, izbor: IZBOR_CRK });
    // Slika priplapola sama, z istim valom kot ogled v galeriji.
    namestiVal(tok, { tok, izbor: ".zapis-okvir" });
  };
  oziviTok();

  // --- razdelki se pojavijo, ko prides do njih -----------------------------
  const opazovalec = new IntersectionObserver(
    (vnosi) => vnosi.forEach((v) => v.isIntersecting && v.target.classList.add("vidno")),
    { root: tok, rootMargin: "-6% 0px -14% 0px", threshold: 0.01 }
  );
  koren.querySelectorAll(".odsek").forEach((o) => opazovalec.observe(o));

  // --- vrtiljak (samo ce ga stran ima) -------------------------------------
  let ponastaviVrtiljak = tir ? namestiVrtiljak() : () => {};

  /**
   * Menjava jezika: tok zgradimo znova v prevodu.
   *
   * Stari razdelki gredo iz strani, zato jih nehamo opazovati; novi so ze
   * prikazani, ce je stran odprta - sicer bi ob menjavi jezika sredi branja
   * besedilo za trenutek izginilo.
   */
  function zgradiZnova(v) {
    const odprta = koren.classList.contains("odprt");
    opazovalec.disconnect();
    tok.innerHTML = vsebinaHtml(v);
    tok.querySelectorAll(".odsek").forEach((o) => {
      if (odprta) o.classList.add("vidno");
      opazovalec.observe(o);
    });
    tir = koren.querySelector(".zapis-tir");
    ponastaviVrtiljak = tir ? namestiVrtiljak() : () => {};
    oziviTok();
    koren.querySelector(".zapis-zapri").setAttribute("aria-label", t("zapis.zapri", "Zapri"));
  }
  if (kljuc) {
    obJeziku(() => zgradiZnova(prevediVsebino(vsebina, tPredmet(`vsebina.${kljuc}`, null))));
  }

  /**
   * Vrtiljak v svoji funkciji, ker ga nima vsaka stran: Arhiv je kratek in se
   * konca z zadnjim razdelkom, zato tam ni ne tira ne puscic.
   *
   * Vrne opravilo, ki vrtiljak ob odprtju strani postavi nazaj na prvo
   * kartico - to je edino, kar od njega potrebuje zunanji svet.
   */
  function namestiVrtiljak() {
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

    return () => {
      kje = 0;
      tir.scrollLeft = 0;
      oznaciLege();
    };
  }

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
    prevzemiOdprto(api);

    if (zapiranje) {
      clearTimeout(zapiranje);
      zapiranje = null;
      koren.classList.remove("zapira");
    }
    koren.classList.add("odprt");
    // Vrtiljak nazaj na prvo kartico. Brez tega ob ponovnem odprtju obvisi
    // tam, kjer si ga pustil, lege pa kazejo na prvo - in oboje se razide.
    ponastaviVrtiljak();
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
    sprostiOdprto(api);
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
