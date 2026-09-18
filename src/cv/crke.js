/**
 * Besedilo, ki prileti po znakih.
 *
 * Po zgledu demonstracije "next-text-reveal-animation" (GSAP SplitText), ki jo
 * je prinesel lastnik strani. Tu je brez GSAP: besedilo razbijemo na znake in
 * jih poganjamo z Web Animations API.
 *
 * Vsak znak zacne odmaknjen v desno, prosojen in poslusan v stran; nato se
 * postavi na mesto. Zamik NI po vrsti cez cel odstavek, ampak po znakih ZNOTRAJ
 * vrstice - vse vrstice torej krenejo hkrati in besedilo se sestavi kot zavesa,
 * ne kot ena dolga kolona. Vrstice dobimo iz lege znakov po postavitvi, ker jih
 * prelom naredi sele takrat.
 *
 * Animacija stece, ko besedilo pride na zaslon. Z moznostjo "odhod" gre
 * prebrano besedilo ob drsenju navzdol z istim gibom na levo in se od tam
 * vrne, ce se pomaknes nazaj.
 */

import "./crke.css";

/**
 * Zamik med znakoma v isti vrstici in trajanje enega znaka.
 *
 * Zamik je zgornja meja, ne pravilo: dolga vrstica ga stisne, da se cela
 * sestavi v NAJVEC_ZAMIKA_MS. Brez tega bi vrstica s sestdesetimi znaki
 * prihajala tri sekunde in bralec bi cakal na konec povedi.
 */
const KORAK_MS = 22;
const NAJVEC_ZAMIKA_MS = 360;
const TRAJANJE_MS = 480;
/** power3.out iz GSAP. */
const KRIVULJA = "cubic-bezier(0.165, 0.84, 0.44, 1)";
/** Od kod prileti znak: pet visin pisave, a nikoli vec kot toliko. */
const ODMIK_NAJVEC = 100;
const NAGIB = 20;

/** Kaj razbijemo, ce klicatelj ne pove drugace. */
const PRIVZETI_IZBOR = "h1, h2, h3, h4, h5, p, li, blockquote, figcaption";

const mirno = matchMedia("(prefers-reduced-motion: reduce)");

/** Pisave, v katerih se crke med seboj povezujejo. */
const POVEZANE = /[\u0590-\u08FF\u0900-\u0DFF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/**
 * Besedilo v elementu razbije na besede in znake.
 *
 * Prehodi tudi cez vgnezdene elemente (poudarki, povezave), ker mora vsak znak
 * dobiti svojo skatlo; presledke pusti pri miru, da prelom vrstic ostane isti.
 */
function razdeli(el) {
  const crke = [];
  const obdelaj = (vozlisce) => {
    for (const o of [...vozlisce.childNodes]) {
      if (o.nodeType === Node.TEXT_NODE) {
        if (!o.nodeValue.trim()) continue;
        const kos = document.createDocumentFragment();
        for (const del of o.nodeValue.split(/(\s+)/)) {
          if (!del) continue;
          if (!del.trim()) {
            kos.appendChild(document.createTextNode(del));
            continue;
          }
          const beseda = document.createElement("span");
          beseda.className = "beseda";
          // Pisave s povezanimi crkami (arabska, hebrejska, indijske) se ne
          // smejo razbiti: crka v svoji skatli izgubi obliko, ki jo dobi od
          // sosede. Taka beseda prileti cela, kot ena "crka".
          const znaki = POVEZANE.test(del) ? [del] : [...del];
          for (const znak of znaki) {
            const c = document.createElement("span");
            c.className = "crka";
            c.textContent = znak;
            beseda.appendChild(c);
            crke.push(c);
          }
          kos.appendChild(beseda);
        }
        o.replaceWith(kos);
      } else if (o.nodeType === Node.ELEMENT_NODE) {
        // Vsebine brez besedila (ikone, platna) ne diramo.
        if (o.classList.contains("crka") || o.tagName === "SVG" || o.tagName === "svg") continue;
        if (o.tagName === "CANVAS" || o.tagName === "IMG" || o.tagName === "VIDEO") continue;
        obdelaj(o);
      }
    }
  };
  obdelaj(el);
  return crke;
}

/** Znaki po vrsticah: vrstico pove lega, ker prelom nastane sele v postavitvi. */
function poVrsticah(crke) {
  const vrstice = new Map();
  for (const c of crke) {
    // Zaokrozimo, ker znaki v isti vrstici niso vsi na pol pike natancno enaki.
    const kljuc = Math.round(c.offsetTop / 4);
    if (!vrstice.has(kljuc)) vrstice.set(kljuc, []);
    vrstice.get(kljuc).push(c);
  }
  return [...vrstice.values()];
}

/**
 * Premakne znake elementa.
 *
 * smer je -1 za levo in +1 za desno; "prihod" pomeni s te strani na mesto,
 * "odhod" pa z mesta na to stran. Stara animacija se prekine, sicer bi se
 * dve nasprotni sesteli in znak bi obvisel na pol poti.
 */
function pozeni(el, { korak, trajanje, zamik, smer = 1, odhod = false }) {
  const crke = [...el.querySelectorAll(".crka")];
  if (!crke.length) {
    el.classList.remove("crke-caka");
    return;
  }
  const velikost = parseFloat(getComputedStyle(el).fontSize) || 16;
  const odmik = Math.min(ODMIK_NAJVEC, velikost * 5) * smer;
  const zunaj = { transform: `translateX(${odmik}px) skewX(${NAGIB * smer}deg)`, opacity: 0 };
  const doma = { transform: "translateX(0) skewX(0deg)", opacity: 1 };
  el.classList.remove("crke-caka");

  for (const a of el._crkeGib ?? []) a.cancel();
  const gibi = [];
  for (const vrstica of poVrsticah(crke)) {
    // Daljsa kot je vrstica, gostejsi je korak - konec pride pravocasno.
    const k = vrstica.length > 1 ? Math.min(korak, NAJVEC_ZAMIKA_MS / (vrstica.length - 1)) : 0;
    vrstica.forEach((c, i) => {
      gibi.push(
        c.animate(odhod ? [doma, zunaj] : [zunaj, doma], {
          duration: odhod ? trajanje * 0.8 : trajanje,
          delay: zamik + i * k,
          easing: KRIVULJA,
          fill: "both",
        })
      );
    });
  }
  el._crkeGib = gibi;
}

/**
 * Besedila pod korenom prileti po znakih, ko pridejo na zaslon.
 *
 * @param {Element} koren kjer iscemo besedila
 * @param {{izbor?: string, tok?: Element|null, korak?: number, trajanje?: number, zamik?: number}} moznosti
 *   tok je drsni okvir, v katerem besedilo zivi (opazovalec meri glede nanj)
 */
export function oziviBesedilo(koren, moznosti = {}) {
  if (!koren || mirno.matches) return;
  const {
    izbor = PRIVZETI_IZBOR,
    tok = null,
    korak = KORAK_MS,
    trajanje = TRAJANJE_MS,
    zamik = 0,
    odhod = false,
  } = moznosti;

  /**
   * Na kateri strani zunaj zaslona besedilo caka: -1 levo, +1 desno.
   *
   * Prvic pride z desne. Ko ga preberes in odjadra navzgor, odide na levo in
   * od tam se tudi vrne, ce se pomaknes nazaj gor - gib ima tako smer, ki se
   * ujema z branjem, in ne skace z ene strani na drugo.
   */
  const stran = new WeakMap();

  const opazovalec = new IntersectionObserver(
    (vnosi) => {
      for (const v of vnosi) {
        const smer = stran.get(v.target) ?? 1;
        if (v.isIntersecting) {
          // Brez odhoda je vsako besedilo enkraten dogodek; z odhodom pa
          // element opazujemo naprej, ker se lahko se vrne.
          if (!odhod) opazovalec.unobserve(v.target);
          pozeni(v.target, { korak, trajanje, zamik, smer });
          continue;
        }
        if (!odhod || v.target.classList.contains("crke-caka")) continue;
        // Nad sredino zaslona: prebrano besedilo odide na levo. Pod njo: vrne se
        // tja, od koder je prislo. Merimo proti sredini in ne proti robu, ker je
        // besedilo ob odhodu tik ob robu in bi odlocitev viselo na pol pike.
        const r = v.rootBounds;
        const sredina = r ? r.top + r.height / 2 : innerHeight / 2;
        const nova = v.boundingClientRect.bottom <= sredina ? -1 : 1;
        stran.set(v.target, nova);
        pozeni(v.target, { korak, trajanje, zamik: 0, smer: nova, odhod: true });
      }
    },
    // Zgornji rob je mocno pritegnjen navznoter: odhod se zacne, ko je besedilo
    // se dobro v zgornji tretjini zaslona, zato ga med odhajanjem se vidis.
    { root: tok, rootMargin: odhod ? "-28% 0px -5% 0px" : "0px 0px -5% 0px", threshold: 0.01 }
  );

  for (const el of koren.querySelectorAll(izbor)) {
    // Ze razbito besedilo pustimo; ce ga je prevod prepisal, ga razbijemo znova.
    // Znaki tako ostanejo v strani - na pocasni napravi jih ni treba sestaviti
    // dvakrat, ceprav gre besedilo vmes z zaslona.
    if (el.querySelector(".crka")) continue;
    if (!el.textContent.trim()) continue;
    if (el.closest("[data-brez-crk]")) continue;
    razdeli(el);
    el.classList.add("crke-caka");
    opazovalec.observe(el);
  }
  return () => opazovalec.disconnect();
}
