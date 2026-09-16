/**
 * Zacetna stran: galaksija, pod njo pa predstavitev, ko se pomaknes navzdol.
 *
 * Plast lezi cez platno in drsi sama; galaksija ostane pritrjena. Drsenje
 * javlja dvoje: kako dalec si (0 na vrhu, 1 na koncu) in sunek - kako hitro in
 * v katero smer si pravkar zavrtel. Prizor iz tega sam naredi gib kamere.
 *
 * Berljivost dela vsak razdelek zase: pod besedilom ima mehko zabrisano liso,
 * ki se na robovih zlije v nic. Ena tancica cez cel zaslon je puscala vidno
 * elipso in crto tam, kjer se je koncala.
 *
 * Razdelki uporabljajo iste razrede kot strani Delo in O meni (odsek, oznaka,
 * znacke), zato pridejo v pogled na isti nacin in stran ostane en slog.
 */

import "./zapis.css";
import "./domov.css";
import { tPredmet, obJeziku, prevediVsebino } from "./jezik.js";
import { oziviBesedilo } from "./crke.js";
import { DOMOV } from "./vsebina.js";

/** Rojstni dan samo za izracun starosti; na strani se ne izpise. */
const ROJEN = { leto: 2004, mesec: 8, dan: 1 };

function starost() {
  const d = new Date();
  const imelRojstniDan = d.getMonth() + 1 > ROJEN.mesec || (d.getMonth() + 1 === ROJEN.mesec && d.getDate() >= ROJEN.dan);
  return d.getFullYear() - ROJEN.leto - (imelRojstniDan ? 0 : 1);
}

const naslov = (s) => s.replace(/\n/g, "<br>");


const odstavki = (seznam) => seznam.map((o) => `<p>${o}</p>`).join("");
const znackeVrsta = (seznam) =>
  `<div class="zapis-znacke">${seznam.map((z) => `<span class="zapis-znacka dg">${z}</span>`).join("")}</div>`;
const gumb = (g, glavni = false) =>
  `<button type="button" class="domov-gumb dg${glavni ? " glavni" : ""}" data-stran="${g.stran}">${g.besedilo}</button>`;

function html(v) {
  const u = v.uvod;
  return `
    <div class="domov-zacetek" aria-hidden="true"></div>

    <section class="odsek domov-uvod">
      <div class="zapis-oznaka domov-ime">${u.ime}</div>
      <h1 class="domov-pozdrav">${naslov(u.naslov)}</h1>
      <div class="domov-podrocja">${u.podrocja}</div>
      <div class="domov-uvod-telo">${odstavki(u.telo)}</div>
      <div class="domov-kraj"><span class="domov-pika" aria-hidden="true"></span>${u.kraj.replace("{starost}", starost())}</div>
      <div class="domov-gumbi">${u.gumbi.map((g, i) => gumb(g, i === 0)).join("")}</div>
    </section>

    <section class="odsek domov-razdelek">
      <div class="zapis-oznaka">${v.omeni.oznaka}</div>
      <h2>${naslov(v.omeni.naslov)}</h2>
      <div class="domov-dva">${odstavki(v.omeni.telo)}</div>
    </section>

    <section class="odsek domov-pot">
      <div class="zapis-oznaka">${v.pot.oznaka}</div>
      <ol class="domov-koraki">
        ${v.pot.koraki
          .map(
            (k) => `
          <li class="domov-korak">
            <span class="domov-cas">${k.cas}</span>
            <span class="domov-tocka" aria-hidden="true"></span>
            <strong>${k.naslov}</strong>
            <span class="domov-opis">${k.opis}</span>
          </li>`
          )
          .join("")}
      </ol>
    </section>

    <section class="odsek domov-razdelek">
      <div class="zapis-oznaka">${v.izkusnje.oznaka}</div>
      ${v.izkusnje.seznam
        .map(
          (x) => `
        <article class="domov-izkusnja">
          <header>
            <h2>${x.podjetje}</h2>
            <div class="domov-vloga">${x.vloga}</div>
            <div class="domov-cas">${x.cas}</div>
          </header>
          <div class="domov-izkusnja-telo">
            ${odstavki(x.telo)}
            ${x.certifikat ? `<div class="domov-certifikat dg"><span aria-hidden="true">✦</span>${x.certifikat}</div>` : ""}
            ${x.znacke ? znackeVrsta(x.znacke) : ""}
          </div>
        </article>`
        )
        .join("")}
    </section>

    <section class="odsek domov-razdelek">
      <div class="zapis-oznaka">${v.dela.oznaka}</div>
      <div class="domov-kartice">
        ${v.dela.seznam
          .map(
            (d, i) => `
          <article class="domov-kartica dg">
            <span class="domov-stevilka">0${i + 1}</span>
            <h3>${d.naslov}</h3>
            ${odstavki(d.telo)}
            <div class="domov-podrocja malo">${d.podrocja}</div>
          </article>`
          )
          .join("")}
      </div>
    </section>

    <section class="odsek domov-razdelek domov-lab">
      <div class="zapis-oznaka">${v.lab.oznaka}</div>
      <h2>${naslov(v.lab.naslov)}</h2>
      ${odstavki(v.lab.telo)}
      <div class="domov-poudarki">${v.lab.poudarki.map((x) => `<p>${x}</p>`).join("")}</div>
      <div class="domov-gumbi">${gumb(v.lab.gumb)}</div>
    </section>

    <section class="odsek zapis-orodja domov-razdelek">
      <div class="zapis-oznaka">${v.znanja.oznaka}</div>
      <div class="zapis-stolpci domov-znanja">
        ${Object.entries(v.znanja.skupine)
          .map(([ime, s]) => `<div class="zapis-skupina"><h3>${ime}</h3>${znackeVrsta(s)}</div>`)
          .join("")}
      </div>
    </section>

    <section class="odsek domov-razdelek domov-par">
      <div>
        <div class="zapis-oznaka">${v.izobrazba.oznaka}</div>
        <h2>${naslov(v.izobrazba.naslov)}</h2>
        <div class="domov-vloga">${v.izobrazba.kraj}</div>
        <p>${v.izobrazba.telo}</p>
      </div>
      <div>
        <div class="zapis-oznaka">${v.druga.oznaka}</div>
        <h2>${naslov(v.druga.naslov)}</h2>
        ${odstavki(v.druga.telo)}
      </div>
    </section>

    <section class="odsek domov-konec">
      <div class="zapis-oznaka">${v.stik.oznaka}</div>
      <h2>${naslov(v.stik.naslov)}</h2>
      <p class="domov-kraj-konec">${v.stik.kraj}</p>
      <a class="domov-eposta" href="mailto:${v.stik.eposta}">${v.stik.eposta}</a>
      <div class="domov-gumbi sredina">
        ${v.stik.povezave
          .filter((x) => x.url)
          .map((x) => `<a class="domov-gumb dg" href="${x.url}"${x.url.startsWith("mailto:") ? "" : ' target="_blank" rel="noopener"'}>${x.ime}</a>`)
          .join("")}
      </div>
    </section>`;
}

/**
 * @param {{ obDrsenju: (delez: number, sunek: number) => void }} moznosti
 *   delez je 0-1 po strani; sunek je premik v zadnjem dogodku, v visinah zaslona
 */
export function installDomov({ obDrsenju }) {
  const koren = document.createElement("div");
  koren.className = "domov";
  koren.innerHTML = `
    <div class="domov-tok"></div>
    <button type="button" class="domov-namig" aria-hidden="true" tabindex="-1">
      <span class="domov-namig-besedilo"></span>
      <span class="domov-miska"><i></i></span>
    </button>`;
  document.body.insertBefore(koren, document.querySelector(".nav"));

  const tok = koren.querySelector(".domov-tok");
  const namig = koren.querySelector(".domov-namig");
  document.body.insertBefore(namig, koren.nextSibling);

  // Zabrisana robova zaslona: zunaj drsece plasti, da imata kaj zabrisati.
  for (const kje of ["gor", "dol"]) {
    const rob = document.createElement("div");
    rob.className = `domov-rob ${kje}`;
    rob.setAttribute("aria-hidden", "true");
    document.body.insertBefore(rob, koren.nextSibling);
  }

  const opazovalec = new IntersectionObserver(
    (vnosi) => vnosi.forEach((v) => v.isIntersecting && v.target.classList.add("vidno")),
    { root: koren, rootMargin: "-6% 0px -12% 0px", threshold: 0.01 }
  );

  function zgradi() {
    const v = prevediVsebino(DOMOV, tPredmet("vsebina.domov", null));
    const bili = new Set([...tok.querySelectorAll(".odsek.vidno")].map((_, i) => i));
    opazovalec.disconnect();
    tok.innerHTML = html(v);
    namig.querySelector(".domov-namig-besedilo").textContent = v.namig;
    tok.querySelectorAll(".odsek").forEach((o, i) => {
      if (bili.has(i)) o.classList.add("vidno");
      opazovalec.observe(o);
    });
    oziviBesedilo(tok, { tok: koren, izbor: "h1, h2, h3, p, .zapis-oznaka, .domov-vloga, .domov-podrocja" });
  }
  zgradi();
  obJeziku(zgradi);

  // Gumbi z data-stran odprejo stran iz menija; povezave (e-posta ...) ostanejo povezave.
  tok.addEventListener("click", (e) => {
    const g = e.target instanceof Element ? e.target.closest(".domov-gumb[data-stran]") : null;
    if (!g) return;
    document.querySelector(`.nav [role="tab"][data-stran="${g.dataset.stran}"]`)?.click();
  });
  namig.addEventListener("click", () => {
    koren.scrollTo({ top: koren.clientHeight * 0.9, behavior: "smooth" });
  });

  // --- drsenje -> prizor ----------------------------------------------------
  let zadnji = 0;
  const javi = () => {
    const najvec = Math.max(1, koren.scrollHeight - koren.clientHeight);
    const vrh = koren.scrollTop;
    const delez = Math.min(1, Math.max(0, vrh / najvec));
    const sunek = (vrh - zadnji) / Math.max(1, koren.clientHeight);
    zadnji = vrh;
    namig.classList.toggle("skrit", vrh > 40);
    obDrsenju(delez, sunek);
  };
  koren.addEventListener("scroll", javi, { passive: true });
  addEventListener("resize", javi);
  javi();
}
