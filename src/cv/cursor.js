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

/**
 * Oblike kazalca.
 *
 * SVG so uvozeni kot besedilo, da jih lahko vstavimo v dokument in pobarvamo
 * s currentColor - kot slika bi ostal vsak v svoji barvi in teme ne bi mogle
 * vplivati nanj.
 */
const OBLIKE = Object.entries(
  import.meta.glob("../assets/cursor/set-solid-svg-icons/stars/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  })
)
  // Tri oblike niso v rabi, ker pri majhni velikosti ne berejo kot iskrica:
  // 01 (stirje dolgi kraki) je videti kot krizec za dodajanje, 05 kot znak za
  // zapiranje, 06 pa kot smet na zaslonu.
  .filter(([pot]) => !/0[156]-/.test(pot))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, svg]) =>
    svg
      // Barvo in velikost doloca CSS, ne datoteka.
      .replace(/\s(width|height|color)="[^"]*"/g, "")
      .replace(/fill="(?!currentColor)[^"]*"/g, 'fill="currentColor"')
  );

/** Na koliko sekund se oblika zamenja. */
const MENJAVA_S = 4.5;

/** Ploskve, na katere se kazalec prilepi. */
/**
 * Ploskve, na katere se kazalec prilepi.
 *
 * Slik namenoma ni: kazalec bi se zlil z vsebino polja in fotografije ne bi
 * bilo vec videti. Lepljenje sodi na kontrole, ne na vsebino.
 */
const LEPLJIVO = "button, a, .nast-vrstica.klikna, .spust-izbira";
/** Besedilo, nad katerim postane crtica. */
const BESEDILO = "p, h1, h2, h3, .nast-ime, .nast-opis, .prof-bio, .prof-ime, .prof-pravo";

/** Kako hitro dohiteva misko. Nizje = bolj leno. */
const DUSENJE = 0.34;
/** Kako mocno se raztegne pri hitrem gibu in kje je meja. */
const RAZTEG = 0.5;
const HITROST_MEJA = 46;
/** Kako dalec od sredisca ploskve se se drzi, kot veckratnik polovice. */
const ODLEPI = 1.5;

export function installCursor() {
  // Na dotik kazalca ni - ne rissemo ga in ne poslusamo.
  if (window.matchMedia("(hover: none)").matches) return { nastavi() {} };

  const el = document.createElement("div");
  el.className = "kaz";
  el.innerHTML = '<span class="kaz-telo"><span class="kaz-oblika"></span></span>';
  document.body.appendChild(el);
  const telo = el.querySelector(".kaz-telo");
  const oblika = el.querySelector(".kaz-oblika");

  // --- menjava oblik ---
  //
  // Prava preobrazba ene poti v drugo bi terjala interpolacijo tock; ker so
  // oblike razlicno grajene, je videti bolje, ce stara zbledi in se zavrti
  // ven, nova pa se prikaze iz zabrisanosti. Oko to bere kot preobrazbo.
  let kOblike = 0;
  function naslednjaOblika() {
    if (!OBLIKE.length) return;
    oblika.classList.add("menja");
    // setTimeout in ne rAF: na skriti strani rAF ne tece in menjava bi obstala
    // na pol poti, z oblikami vred.
    setTimeout(() => {
      oblika.innerHTML = OBLIKE[kOblike % OBLIKE.length];
      kOblike += 1;
      oblika.classList.remove("menja");
    }, 210);
  }
  if (OBLIKE.length) {
    oblika.innerHTML = OBLIKE[0];
    kOblike = 1;
    setInterval(naslednjaOblika, MENJAVA_S * 1000);
  }
  document.documentElement.classList.add("ima-kaz");

  let misX = innerWidth / 2;
  let misY = innerHeight / 2;
  let x = misX;
  let y = misY;
  let prejX = misX;
  let prejY = misY;

  let cilj = null;      // ploskev, na katero smo prilepljeni
  let ciljR = null;     // njena lega
  let ciljRob = "";     // njena zaobljenost
  let nacin = "prost";  // prost | lepi | crtica
  let zadnjaOblika = null;

  addEventListener(
    "pointermove",
    (e) => {
      misX = e.clientX;
      misY = e.clientY;

      // e.target je ze najvisji element pod kazalcem - kazalec sam ima
      // pointer-events: none. elementFromPoint bi isto ugotovil se enkrat, a
      // za ceno zadetkovnega testa in izracuna postavitve ob VSAKEM premiku.
      const pod = e.target instanceof Element ? e.target : null;
      const lepljiv = pod?.closest(LEPLJIVO) ?? null;

      if (lepljiv !== cilj) {
        cilj = lepljiv;
        // Lego in zaobljenost preberemo ob menjavi cilja, ne vsako slicico.
        if (cilj) {
          ciljR = cilj.getBoundingClientRect();
          ciljRob = getComputedStyle(cilj).borderRadius;
        } else {
          ciljR = null;
        }
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

    // Vsak zapis atributa razveljavi slog; pisemo le ob spremembi.
    if (el.dataset.nacin !== nacin) el.dataset.nacin = nacin;

    if (nacin === "lepi" && ciljR) {
      // Prevzame obliko ploskve, na kateri sedi. Zapisemo le ob spremembi.
      if (zadnjaOblika !== cilj) {
        zadnjaOblika = cilj;
        telo.style.width = `${ciljR.width}px`;
      telo.style.height = `${ciljR.height}px`;
      // Lega, ki jo racuna zanka, je SREDISCE ploskve, telo pa se rise od
      // svojega levega zgornjega kota - zato ga je treba za polovico odmakniti.
      telo.style.margin = `${-ciljR.height / 2}px 0 0 ${-ciljR.width / 2}px`;
        telo.style.borderRadius = ciljRob;
        telo.style.transform = "rotate(0deg) scale(1, 1)";
      }
    } else {
      if (zadnjaOblika !== null) {
        zadnjaOblika = null;
        telo.style.width = "";
        telo.style.height = "";
        telo.style.margin = "";
        telo.style.borderRadius = "";
      }
      // Crtica ostane pokoncna: zavrtena bi bila videti kot posevna poteza in
      // ne kot kazalec za vnos. Raztezek po hitrosti velja le za iskrico.
      telo.style.transform =
        nacin === "crtica"
          ? "none"
          : `rotate(${kot}deg) scale(${1 + hitrost * RAZTEG}, ${1 - hitrost * RAZTEG * 0.62})`;
    }

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  requestAnimationFrame(slicica);

  return {
    /** Ob izklopu vrnemo sistemski kazalec in naseg umaknemo. */
    nastavi(vklopljen) {
      document.documentElement.classList.toggle("ima-kaz", vklopljen);
      el.style.display = vklopljen ? "" : "none";
    },
  };
}

/**
 * Magnetne ploskve.
 *
 * Isti prijem kot pri lepljenju kazalca, le obrnjen: tokrat se proti kazalcu
 * premakne element. Obcutljivost je nizja - kazalec gre do desetine poti,
 * gumb pa le do MAGNET, sicer bi vmesnik plaval.
 *
 * Vse tece v isti zanki in pise samo transform. Lege beremo ob prehodu miske
 * cez ploskev in ne vsako slicico, ker getBoundingClientRect prisili
 * brskalnik v izracun postavitve.
 */
const MAGNET_DOMET = 1.45;

/**
 * @param {string} selektor ploskve, ki se nagnejo proti kazalcu
 * @param {number} jakost   koliksen del poti do kazalca prehodijo
 *
 * Kapsule dobijo nizjo jakost kot gumbi v njih. Ker se premakneta oba, se
 * ucinek sesteje in gumb pod kazalcem gre najdlje - vmesnik se nagne kot
 * celota, namesto da bi posamezni gumb plaval sam zase.
 */
export function installMagnetic(selektor, jakost = 0.22) {
  if (window.matchMedia("(hover: none)").matches) return { nastavi() {} };
  let vklopljen = true;

  let aktiven = null;
  let r = null;
  let cx = 0;
  let cy = 0;
  let x = 0;
  let y = 0;

  addEventListener(
    "pointermove",
    (e) => {
      if (!vklopljen) return;
      const el = e.target instanceof Element ? e.target.closest(selektor) : null;
      if (el !== aktiven) {
        if (aktiven) aktiven.style.transform = "";
        aktiven = el;
        r = el ? el.getBoundingClientRect() : null;
        x = 0;
        y = 0;
      }
      if (!r) return;
      cx = e.clientX - (r.left + r.width / 2);
      cy = e.clientY - (r.top + r.height / 2);
      // Zunaj dometa se odlepi, da gumb ne ostane potegnjen.
      if (Math.abs(cx) > (r.width / 2) * MAGNET_DOMET || Math.abs(cy) > (r.height / 2) * MAGNET_DOMET) {
        aktiven.style.transform = "";
        aktiven = null;
        r = null;
      }
    },
    { passive: true }
  );

  (function slicica() {
    requestAnimationFrame(slicica);
    if (!aktiven) return;
    x += (cx * jakost - x) * 0.2;
    y += (cy * jakost - y) * 0.2;
    aktiven.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  })();

  return {
    nastavi(v) {
      vklopljen = v;
      // Ob izklopu je treba potegnjeni gumb vrniti na mesto.
      if (!v && aktiven) {
        aktiven.style.transform = "";
        aktiven = null;
        r = null;
      }
    },
  };
}
