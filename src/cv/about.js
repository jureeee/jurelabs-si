/**
 * O meni.
 *
 * Vrtiljak in ne dolg zapis. Zivljenjepis v odstavkih se prebere enkrat in
 * nikoli vec; kartice pa lahko gres skozi v desetih sekundah in se ustavis
 * tam, kjer te zanima.
 *
 * Vsebina je namerno kratka in brez nastevanja sol in delodajalcev - kdo si,
 * se bere iz tega, kaj si zgradil.
 *
 * Drsenje je s pripenjanjem (scroll-snap): kartica se vedno postavi na svoje
 * mesto, zato vrtiljak nikoli ne obstane na pol poti med dvema.
 */

import "./about.css";

const PUSCICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
const ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/** Ena kartica na misel. Vec misli na kartico pomeni, da nobena ne obvelja. */
const KARTICE = [
  {
    oznaka: "Jure Blatnik",
    naslov: "Gradim stvari,\nki delujejo.",
    telo:
      "Delam na presecisu programske opreme, sistemov in infrastrukture. " +
      "Zanima me, kako stvari delujejo pod povrsjem - in kako iz tega nastane " +
      "nekaj uporabnega.",
  },
  {
    oznaka: "Kaj delam",
    naslov: "Strojna in programska,\nne eno ali drugo.",
    telo:
      "Streznisko okolje, omrezja, varnostni sistemi - in hkrati polni razvoj " +
      "aplikacij. Vecino je nastalo iz dejanske potrebe pri delu, ne iz vaje.",
  },
  {
    oznaka: "Delo · 2026",
    naslov: "Trace Space",
    telo:
      "Nadzorna plosca za senzorje Avigilon HALO: kakovost zraka in varnost v " +
      "solah, javnih prostorih in vojaskih objektih. Zbira meritve, prepozna " +
      "vzorce in opozori, preden postane tezava.",
    znacke: ["Python", "Flask", "Senzorji", "Nadzorne plosce"],
  },
  {
    oznaka: "Delo · 2026",
    naslov: "Vantage",
    telo:
      "Aplikacija za odkrivanje, nastavljanje in vodenje omreznih kamer ter " +
      "njihovih prednastavljenih leg. Namesto klikanja po desetih locenih " +
      "vmesnikih ena povrsina, ki jih zna vse.",
    znacke: ["Python", "React", "TypeScript", "ONVIF", "SSE"],
  },
  {
    oznaka: "Lastni projekti",
    naslov: "Racunalniski vid",
    telo:
      "Zaznavanje, prepoznavanje in sledenje predmetov v zivo z modeli YOLO. " +
      "Napisano v C in razposlano kot samostojna aplikacija.",
    znacke: ["C", "YOLO", "Racunalniski vid"],
  },
  {
    oznaka: "Podlaga",
    naslov: "S cim delam",
    telo: "",
    znacke: [
      "Windows in domene",
      "Active Directory",
      "Strezniki",
      "Cisco omrezja",
      "Avigilon Unity 8",
      "Kontrola pristopa",
      "Vgrajeni sistemi",
      "Avtomatizacija",
    ],
  },
  {
    oznaka: "Kako delam",
    naslov: "Radoveden po navadi,\nhiter po potrebi.",
    telo:
      "Nove tehnologije se ucim tako, da z njimi nekaj zgradim. Cilj ni " +
      "zapletenost, ampak da stvar dela - in da jo je cez pol leta se mogoce " +
      "razumeti.",
  },
  {
    oznaka: "Naprej",
    naslov: "Se vedno gradim.",
    telo:
      "Zanima me zahtevno tehnicno delo, kjer se srecajo programska oprema, " +
      "sistemi in nove tehnologije. Dovolj tezko, da je zanimivo.",
  },
];

export function installAbout() {
  const koren = document.createElement("div");
  koren.className = "omeni";
  koren.innerHTML = `
    <div class="omeni-zavesa"></div>
    <button class="omeni-zapri dg" type="button" aria-label="Zapri">${ZAPRI}</button>
    <div class="omeni-tir">
      ${KARTICE.map(
        (k, i) => `
        <article class="omeni-kartica dg" style="--i:${i}">
          <div class="omeni-oznaka">${k.oznaka}</div>
          <h2 class="omeni-naslov">${k.naslov.replace(/\n/g, "<br>")}</h2>
          ${k.telo ? `<p class="omeni-telo">${k.telo}</p>` : ""}
          ${
            k.znacke
              ? `<div class="omeni-znacke">${k.znacke
                  .map((z) => `<span class="omeni-znacka dg">${z}</span>`)
                  .join("")}</div>`
              : ""
          }
        </article>`
      ).join("")}
    </div>
    <button class="omeni-nazaj dg" type="button" aria-label="Prejsnja">${PUSCICA}</button>
    <button class="omeni-naprej dg" type="button" aria-label="Naslednja">${PUSCICA}</button>
    <div class="omeni-pike">
      ${KARTICE.map((_, i) => `<button class="omeni-pika" type="button" data-i="${i}" aria-label="Kartica ${i + 1}"></button>`).join("")}
    </div>`;
  document.body.appendChild(koren);

  const tir = koren.querySelector(".omeni-tir");
  const pike = [...koren.querySelectorAll(".omeni-pika")];
  let kje = 0;

  function oznaciPiko() {
    pike.forEach((p, i) => p.setAttribute("aria-current", String(i === kje)));
  }

  /** Kartica ima svojo sirino, zato racunamo iz nje in ne iz sirine okna. */
  function korak() {
    const k = tir.querySelector(".omeni-kartica");
    return k ? k.getBoundingClientRect().width + 26 : 420;
  }

  function pojdi(i) {
    kje = Math.max(0, Math.min(i, KARTICE.length - 1));
    tir.scrollTo({ left: kje * korak(), behavior: "smooth" });
    oznaciPiko();
  }

  koren.querySelector(".omeni-naprej").addEventListener("click", () => pojdi(kje + 1));
  koren.querySelector(".omeni-nazaj").addEventListener("click", () => pojdi(kje - 1));
  pike.forEach((p) => p.addEventListener("click", () => pojdi(Number(p.dataset.i))));

  // Ko drsis rocno, pike sledijo temu, kar je na zaslonu.
  tir.addEventListener(
    "scroll",
    () => {
      const novo = Math.round(tir.scrollLeft / korak());
      if (novo !== kje) {
        kje = novo;
        oznaciPiko();
      }
    },
    { passive: true }
  );

  // Kolescek navpicno premika vrtiljak vodoravno - miska brez vodoravnega
  // kolesca bi sicer ostala brez nacina, da gre naprej.
  tir.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      tir.scrollLeft += e.deltaY;
    },
    { passive: false }
  );

  let zapiranje = null;

  function odpri() {
    if (zapiranje) {
      clearTimeout(zapiranje);
      zapiranje = null;
      koren.classList.remove("zapira");
    }
    koren.classList.add("odprt");
    tir.scrollLeft = 0;
    kje = 0;
    oznaciPiko();
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
  koren.querySelector(".omeni-zavesa").addEventListener("click", zapri);
  addEventListener("keydown", (e) => {
    if (!koren.classList.contains("odprt")) return;
    if (e.key === "Escape") zapri();
    if (e.key === "ArrowRight") pojdi(kje + 1);
    if (e.key === "ArrowLeft") pojdi(kje - 1);
  });

  oznaciPiko();
  return { odpri, zapri };
}
