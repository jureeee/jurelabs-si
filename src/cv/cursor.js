/**
 * Kazalec.
 *
 * Prijem za lepljenje je povzet po prilozenem primeru (sticky-cursor), le da
 * je tu brez React in framer-motion: bistvo so tri stvari, ki jih dela ta
 * primer, in vse tri so navadna matematika.
 *
 *   1. Ko je kazalec nad ploskvijo, se ne postavi na misko, ampak na sredisce
 *      ploskve plus desetina poti proti miski. Zato se zdi prilepljen, a se
 *      vseeno odziva.
 *   2. Zavrti se v smer miske (atan2) in se v tej smeri raztegne. Raztezek je
 *      tisto, po cemer se bere kot snov in ne kot obroc.
 *   3. Ko gre miska dovolj dalec, se odlepi in vrne v svojo obliko.
 *
 * Doda je se odziv na hitrost: kazalec se v smeri gibanja raztegne in precno
 * stisne, kar je ista poteza kot squash & stretch v risanki. Nad besedilom se
 * spremeni v crtico.
 *
 * Vse tece v eni zanki in pise samo transform - torej brez preracunavanja
 * postavitve, ki bi trzalo.
 */

import "./cursor.css";

/** Ploskve, na katere se kazalec prilepi. */
const LEPLJIVO = "button, a, .prof-polje, .nast-vrstica.klikna, .spust-izbira";
/** Besedilo, nad katerim postane crtica. */
const BESEDILO = "p, h1, h2, h3, .nast-ime, .nast-opis, .prof-bio, .prof-ime, .prof-pravo";

/** Kako hitro dohiteva misko. Nizje = bolj leno. */
const DUSENJE = 0.19;
/** Kako mocno se raztegne pri hitrem gibu in kje je meja. */
const RAZTEG = 0.5;
const HITROST_MEJA = 46;
/** Kako dalec od sredisca ploskve se se drzi, kot veckratnik polovice. */
const ODLEPI = 1.5;

export function installCursor() {
  // Na dotik kazalca ni - ne rissemo ga in ne poslusamo.
  if (window.matchMedia("(hover: none)").matches) return;

  const el = document.createElement("div");
  el.className = "kaz";
  el.innerHTML = '<span class="kaz-telo"></span>';
  document.body.appendChild(el);
  const telo = el.querySelector(".kaz-telo");
  document.documentElement.classList.add("ima-kaz");

  let misX = innerWidth / 2;
  let misY = innerHeight / 2;
  let x = misX;
  let y = misY;
  let prejX = misX;
  let prejY = misY;

  let cilj = null;      // ploskev, na katero smo prilepljeni
  let ciljR = null;     // njena lega
  let nacin = "prost";  // prost | lepi | crtica

  addEventListener(
    "pointermove",
    (e) => {
      misX = e.clientX;
      misY = e.clientY;

      const pod = document.elementFromPoint(misX, misY);
      const lepljiv = pod?.closest(LEPLJIVO) ?? null;

      if (lepljiv !== cilj) {
        cilj = lepljiv;
        ciljR = cilj ? cilj.getBoundingClientRect() : null;
      }
      if (cilj) {
        nacin = "lepi";
      } else if (pod?.closest(BESEDILO)) {
        nacin = "crtica";
      } else {
        nacin = "prost";
      }
    },
    { passive: true }
  );

  addEventListener("pointerdown", () => el.classList.add("pritisk"));
  addEventListener("pointerup", () => el.classList.remove("pritisk"));
  addEventListener("pointerleave", () => el.classList.add("skrit"));
  addEventListener("pointerenter", () => el.classList.remove("skrit"));
  // Lege se ob drsenju premaknejo; ceneje je pozabiti kot meriti vsako slicico.
  addEventListener("scroll", () => { ciljR = cilj?.getBoundingClientRect() ?? null; }, {
    passive: true,
    capture: true,
  });

  function slicica() {
    requestAnimationFrame(slicica);

    let ciljX = misX;
    let ciljY = misY;

    if (nacin === "lepi" && ciljR) {
      const sx = ciljR.left + ciljR.width / 2;
      const sy = ciljR.top + ciljR.height / 2;
      const dx = misX - sx;
      const dy = misY - sy;

      // Odlepi se, ko gre miska dlje od polovice ploskve, pomnozene z ODLEPI.
      if (
        Math.abs(dx) > (ciljR.width / 2) * ODLEPI ||
        Math.abs(dy) > (ciljR.height / 2) * ODLEPI
      ) {
        cilj = null;
        ciljR = null;
        nacin = "prost";
      } else {
        // Sredisce ploskve plus desetina poti proti miski.
        ciljX = sx + dx * 0.1;
        ciljY = sy + dy * 0.1;
      }
    }

    x += (ciljX - x) * DUSENJE;
    y += (ciljY - y) * DUSENJE;

    // Raztezek v smeri gibanja: hitreje kot gres, bolj je podolgovat.
    const hx = x - prejX;
    const hy = y - prejY;
    prejX = x;
    prejY = y;
    const hitrost = Math.min(Math.hypot(hx, hy) / HITROST_MEJA, 1);
    const kot = (Math.atan2(hy, hx) * 180) / Math.PI;

    el.dataset.nacin = nacin;

    if (nacin === "lepi" && ciljR) {
      // Prevzame obliko ploskve, na kateri sedi.
      telo.style.width = `${ciljR.width}px`;
      telo.style.height = `${ciljR.height}px`;
      // Lega, ki jo racuna zanka, je SREDISCE ploskve, telo pa se rise od
      // svojega levega zgornjega kota - zato ga je treba za polovico odmakniti.
      telo.style.margin = `${-ciljR.height / 2}px 0 0 ${-ciljR.width / 2}px`;
      telo.style.borderRadius = getComputedStyle(cilj).borderRadius;
      telo.style.transform = "rotate(0deg) scale(1, 1)";
    } else {
      telo.style.width = "";
      telo.style.height = "";
      telo.style.margin = "";
      telo.style.borderRadius = "";
      telo.style.transform =
        `rotate(${kot}deg) scale(${1 + hitrost * RAZTEG}, ${1 - hitrost * RAZTEG * 0.62})`;
    }

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  requestAnimationFrame(slicica);
}
