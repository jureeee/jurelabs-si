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
 * Animacija stece, ko besedilo pride na zaslon, in vsak element le enkrat.
 */

import "./crke.css";

/** Zamik med znakoma v isti vrstici in trajanje enega znaka. */
const KORAK_MS = 50;
const TRAJANJE_MS = 650;
/** power3.out iz GSAP. */
const KRIVULJA = "cubic-bezier(0.165, 0.84, 0.44, 1)";
/** Od kod prileti znak: pet visin pisave, a nikoli vec kot toliko. */
const ODMIK_NAJVEC = 100;
const NAGIB = 20;

/** Kaj razbijemo, ce klicatelj ne pove drugace. */
const PRIVZETI_IZBOR = "h1, h2, h3, h4, h5, p, li, blockquote, figcaption";

const mirno = matchMedia("(prefers-reduced-motion: reduce)");

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
          for (const znak of [...del]) {
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

function pozeni(el, { korak, trajanje, zamik }) {
  const crke = [...el.querySelectorAll(".crka")];
  if (!crke.length) {
    el.classList.remove("crke-caka");
    return;
  }
  const velikost = parseFloat(getComputedStyle(el).fontSize) || 16;
  const odmik = Math.min(ODMIK_NAJVEC, velikost * 5);
  el.classList.remove("crke-caka");
  for (const vrstica of poVrsticah(crke)) {
    vrstica.forEach((c, i) => {
      c.animate(
        [
          { transform: `translateX(${odmik}px) skewX(${NAGIB}deg)`, opacity: 0 },
          { transform: "translateX(0) skewX(0deg)", opacity: 1 },
        ],
        { duration: trajanje, delay: zamik + i * korak, easing: KRIVULJA, fill: "both" }
      );
    });
  }
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
  } = moznosti;

  const opazovalec = new IntersectionObserver(
    (vnosi) => {
      for (const v of vnosi) {
        if (!v.isIntersecting) continue;
        opazovalec.unobserve(v.target);
        pozeni(v.target, { korak, trajanje, zamik });
      }
    },
    { root: tok, rootMargin: "0px 0px -5% 0px", threshold: 0.01 }
  );

  for (const el of koren.querySelectorAll(izbor)) {
    // Ze razbito besedilo pustimo; ce ga je prevod prepisal, ga razbijemo znova.
    if (el.querySelector(".crka")) continue;
    if (!el.textContent.trim()) continue;
    if (el.closest("[data-brez-crk]")) continue;
    razdeli(el);
    el.classList.add("crke-caka");
    opazovalec.observe(el);
  }
  return () => opazovalec.disconnect();
}
