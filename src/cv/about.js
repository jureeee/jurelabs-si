/**
 * O meni.
 *
 * Dolg zapis, ki se odkriva ob drsenju, in vrtiljak na koncu kot zakljucek.
 *
 * Zaporedje je namerno: najprej ena poved, ki pove, kdo si; nato razdelki, ki
 * se pojavijo sele, ko prides do njih; sele na koncu vrtiljak. Kdor odide po
 * treh vrsticah, je dobil bistvo; kdor ostane, dobi podrobnosti.
 *
 * Ton je zadrzan. Kratke povedi, brez presezkov - stvar, ki se hvali, deluje
 * manjse, kot je.
 */

import "./about.css";
import { mediji } from "./mediji.js";

const ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const PUSCICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';

/** Orodja, s katerimi delam. Splosno navzven, ne interna imena izdelkov. */
const ORODJA = {
  Jeziki: ["Python", "C", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Bash"],
  "Ogrodja in orodja": ["React", "Vite", "Flask", "Three.js", "Node", "Git", "Docker"],
  Sistemi: ["Linux", "Windows Server", "Active Directory", "Omrezja", "Virtualizacija"],
  Podrocja: ["Racunalniski vid", "Avtomatizacija", "Nadzorni sistemi", "Vgrajeni sistemi"],
};

/** Zakljucne kartice. Ena misel na kartico. */
const KARTICE = [
  {
    oznaka: "Pristop",
    naslov: "Razumeti,\nne le uporabiti.",
    telo: "Sistem, ki ga ne razumem pod povrsjem, znam le upravljati. Zanima me, zakaj deluje.",
  },
  {
    oznaka: "Metoda",
    naslov: "Ucim se z gradnjo.",
    telo: "Nova tehnologija postane moja sele, ko z njo nekaj nastane. Dokumentacija je zacetek, ne konec.",
  },
  {
    oznaka: "Merilo",
    naslov: "Deluje ali ne deluje.",
    telo: "Cilj ni zapletenost, ampak resitev, ki dela in ki jo je cez pol leta se mogoce razumeti.",
  },
  {
    oznaka: "Naprej",
    naslov: "Dovolj tezko,\nda je zanimivo.",
    telo: "Zanima me delo, kjer se srecajo programska oprema, sistemi in nove tehnologije.",
  },
];

const znacke = (seznam) =>
  `<div class="omeni-znacke">${seznam
    .map((z) => `<span class="omeni-znacka dg">${z}</span>`)
    .join("")}</div>`;

export function installAbout() {
  const slike = mediji.filter((m) => !m.video).map((m) => m.url);
  const slika = (i) => slike[i % slike.length] ?? "";

  const koren = document.createElement("div");
  koren.className = "omeni";
  koren.innerHTML = `
    <div class="omeni-zavesa"></div>
    <button class="omeni-zapri dg" type="button" aria-label="Zapri">${ZAPRI}</button>

    <div class="omeni-tok">
      <header class="odsek omeni-uvod">
        <div class="omeni-oznaka">Jure Blatnik</div>
        <h1 class="omeni-glavni">Gradim programsko opremo<br>in sisteme, na katerih tece.</h1>
        <p class="omeni-vodilo">
          Delam na presecisu razvoja, infrastrukture in tehnicnih sistemov.
          Vecina tega, kar sem zgradil, je nastala iz dejanske potrebe pri delu.
        </p>
      </header>

      <section class="odsek omeni-par">
        <div class="omeni-besedilo">
          <div class="omeni-oznaka">Kaj delam</div>
          <h2>Strojna in programska oprema,<br>ne eno ali drugo.</h2>
          <p>
            Streznisko okolje, omrezja in tehnicni sistemi na eni strani, polni
            razvoj aplikacij na drugi. Obojega ne locujem - vecina problemov
            stoji ravno na meji med njima.
          </p>
        </div>
        <figure class="omeni-slika"><img alt="" loading="lazy" src="${slika(1)}" /></figure>
      </section>

      <section class="odsek omeni-par obrnjen">
        <div class="omeni-besedilo">
          <div class="omeni-oznaka">Delo</div>
          <h2>Trace Space</h2>
          <p>
            Nadzorna plosca za senzorje kakovosti zraka in varnosti. Zbira
            meritve, prepozna vzorce in opozori, preden postane tezava.
          </p>
          ${znacke(["Python", "Flask", "SQLite", "Nadzorne plosce"])}
        </div>
        <figure class="omeni-slika"><img alt="" loading="lazy" src="${slika(4)}" /></figure>
      </section>

      <section class="odsek omeni-par">
        <div class="omeni-besedilo">
          <div class="omeni-oznaka">Delo</div>
          <h2>Vantage</h2>
          <p>
            Aplikacija za odkrivanje, nastavljanje in vodenje omreznih kamer ter
            njihovih leg. Namesto desetih locenih vmesnikov ena povrsina, ki jih
            zna vse.
          </p>
          ${znacke(["Python", "React", "TypeScript", "ONVIF", "SSE"])}
        </div>
        <figure class="omeni-slika"><img alt="" loading="lazy" src="${slika(7)}" /></figure>
      </section>

      <section class="odsek omeni-sirok">
        <div class="omeni-oznaka">Lastni projekti</div>
        <h2>Racunalniski vid v realnem casu</h2>
        <p>
          Zaznavanje, prepoznavanje in sledenje predmetov z modeli YOLO,
          napisano v C in razposlano kot samostojna aplikacija. Nastalo je zunaj
          delovnih obveznosti.
        </p>
      </section>

      <section class="odsek omeni-orodja">
        <div class="omeni-oznaka">S cim delam</div>
        <div class="omeni-stolpci">
          ${Object.entries(ORODJA)
            .map(
              ([skupina, seznam]) => `
            <div class="omeni-skupina">
              <h3>${skupina}</h3>
              ${znacke(seznam)}
            </div>`
            )
            .join("")}
        </div>
      </section>

      <section class="odsek omeni-zakljucek">
        <div class="omeni-oznaka">Kako delam</div>
        <div class="omeni-vrtiljak">
          <div class="omeni-tir">
            ${KARTICE.map(
              (k) => `
              <article class="omeni-kartica dg">
                <div class="omeni-oznaka">${k.oznaka}</div>
                <h2 class="omeni-naslov">${k.naslov.replace(/\n/g, "<br>")}</h2>
                <p class="omeni-telo">${k.telo}</p>
              </article>`
            ).join("")}
          </div>
          <button class="omeni-nazaj dg" type="button" aria-label="Prejsnja">${PUSCICA}</button>
          <button class="omeni-naprej dg" type="button" aria-label="Naslednja">${PUSCICA}</button>
        </div>
      </section>

      <footer class="odsek omeni-konec"><p>Se vedno gradim.</p></footer>
    </div>`;
  document.body.appendChild(koren);

  const tok = koren.querySelector(".omeni-tok");
  const tir = koren.querySelector(".omeni-tir");

  // --- razdelki se pojavijo, ko prides do njih -----------------------------
  const opazovalec = new IntersectionObserver(
    (vnosi) => vnosi.forEach((v) => v.isIntersecting && v.target.classList.add("vidno")),
    { root: tok, rootMargin: "-6% 0px -14% 0px", threshold: 0.01 }
  );
  koren.querySelectorAll(".odsek").forEach((o) => opazovalec.observe(o));

  // --- vrtiljak ------------------------------------------------------------
  const korak = () => {
    const k = tir.querySelector(".omeni-kartica");
    return k ? k.getBoundingClientRect().width + 22 : 380;
  };
  koren.querySelector(".omeni-naprej").addEventListener("click", () =>
    tir.scrollBy({ left: korak(), behavior: "smooth" })
  );
  koren.querySelector(".omeni-nazaj").addEventListener("click", () =>
    tir.scrollBy({ left: -korak(), behavior: "smooth" })
  );

  /**
   * Kolescek nad vrtiljakom ga premika vodoravno, a le dokler ima kam.
   * Ko pride do konca, dogodka ne prevzamemo vec in stran drsi naprej - sicer
   * bi vrtiljak lovil kolescek in obiskovalec bi obtical na njem.
   */
  tir.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const konec = tir.scrollWidth - tir.clientWidth;
      const naProstem =
        (e.deltaY > 0 && tir.scrollLeft >= konec - 1) || (e.deltaY < 0 && tir.scrollLeft <= 1);
      if (naProstem) return;
      e.preventDefault();
      tir.scrollLeft += e.deltaY;
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

  function odpri() {
    if (zapiranje) {
      clearTimeout(zapiranje);
      zapiranje = null;
      koren.classList.remove("zapira");
    }
    koren.classList.add("odprt");
    tok.scrollTop = 0;
    cilj = 0;
  }

  function zapri() {
    if (zapiranje) return;
    koren.classList.add("zapira");
    // setTimeout in ne rAF: na skriti strani rAF ne tece.
    zapiranje = setTimeout(() => {
      koren.classList.remove("odprt", "zapira");
      zapiranje = null;
    }, 420);
  }

  koren.querySelector(".omeni-zapri").addEventListener("click", zapri);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && koren.classList.contains("odprt")) zapri();
  });

  return { odpri, zapri };
}
