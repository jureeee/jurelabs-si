/**
 * Okno z aplikacijo.
 *
 * Projekt na strani Delo ima lahko gumb, ki odpre njegov pravi vmesnik - v
 * oknu cez stran, v okvirju (iframe). Aplikacija v njem je predstavitvena
 * razlicica: vmesnik je zgrajen iz izvirne kode, streznik pa je nadomescen z
 * izmisljenimi podatki, ker ga na spletni strani ni.
 *
 * Okvir je svoj dokument, zato kazalca strani v njem ni: dokler je miska nad
 * okvirjem, se kazalec strani skrije, aplikacija pa pokaze svojega.
 */

import { t } from "./jezik.js";
import "./aplikacija.css";

const ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ZUNAJ =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></svg>';

/** Koliko traja odhod okna, preden gre iz strani. */
const ODHOD_MS = 420;

let odprto = null;

/**
 * Odpre aplikacijo v oknu.
 *
 * @param {string} url naslov predstavitvene razlicice
 * @param {string} ime ime aplikacije v glavi okna
 */
export function odpri(url, ime) {
  if (odprto) zapri(true);

  const koren = document.createElement("div");
  koren.className = "apl";
  koren.setAttribute("role", "dialog");
  koren.setAttribute("aria-modal", "true");
  koren.setAttribute("aria-label", ime);
  koren.innerHTML = `
    <div class="apl-zavesa"></div>
    <div class="apl-okno">
      <div class="apl-glava">
        <div class="apl-ime"><span class="apl-pika"></span>${ime}</div>
        <div class="apl-demo">${t("aplikacija.demo", "Predstavitvena različica · podatki so izmišljeni")}</div>
        <div class="apl-gumbi">
          <a class="apl-gumb dg" href="${url}" target="_blank" rel="noopener" aria-label="${t("aplikacija.zavihek", "Odpri v novem zavihku")}">${ZUNAJ}</a>
          <button class="apl-gumb dg" type="button" aria-label="${t("aplikacija.zapri", "Zapri aplikacijo")}">${ZAPRI}</button>
        </div>
      </div>
      <div class="apl-telo">
        <div class="apl-nalaga">${ime}</div>
        <iframe class="apl-okvir" src="${url}" title="${ime}" loading="eager"></iframe>
      </div>
    </div>`;
  document.body.appendChild(koren);

  const okvir = koren.querySelector(".apl-okvir");
  okvir.addEventListener("load", () => koren.classList.add("nalozeno"), { once: true });
  // Kazalec strani nad okvirjem nima kaj iskati - aplikacija ima svojega.
  okvir.addEventListener("pointerenter", () => document.documentElement.classList.add("apl-v-okvirju"));
  okvir.addEventListener("pointerleave", () => document.documentElement.classList.remove("apl-v-okvirju"));

  koren.querySelector(".apl-zavesa").addEventListener("click", () => zapri());
  koren.querySelector("button.apl-gumb").addEventListener("click", () => zapri());
  const naTipko = (e) => { if (e.key === "Escape") zapri(); };
  addEventListener("keydown", naTipko);

  void koren.offsetWidth;
  koren.classList.add("odprt");
  odprto = { koren, naTipko };
}

/** Zapre okno; takoj = brez odhoda (ko se odpira drugo). */
export function zapri(takoj = false) {
  if (!odprto) return;
  const { koren, naTipko } = odprto;
  odprto = null;
  removeEventListener("keydown", naTipko);
  document.documentElement.classList.remove("apl-v-okvirju");
  koren.classList.remove("odprt");
  if (takoj) koren.remove();
  else setTimeout(() => koren.remove(), ODHOD_MS);
}
