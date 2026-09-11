/**
 * Izbirnik jezika - zgoraj desno.
 *
 * Zrcalo profila na levi: ista visina, isto steklo, isti odmik od roba. Ni
 * kapsula z imenom, ampak ikona sveta in koda jezika - dovolj, da jo najde,
 * kdor jezik isce, in premalo, da bi tekmovala z menijem na sredini.
 *
 * Seznam uporablja iste razrede kot spustni meniji v nastavitvah in galeriji,
 * zato je iz istega stekla in se odpira z istim gibom. Zivi v body, ne ob
 * gumbu: prednik s filtrom bi mu vzel position: fixed (ista past kot pri
 * spustnih menijih v nastavitvah).
 */

import "./izbirnik-jezika.css";
import { JEZIKI, jezik, nastaviJezik, obJeziku, t } from "./jezik.js";

const IKONA_SVET =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9s1.2-6.5 3.6-9z"/></svg>';
const IKONA_KLJUKICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>';

export function installIzbirnikJezika() {
  const gumb = document.createElement("button");
  gumb.type = "button";
  gumb.className = "jez dg";
  gumb.setAttribute("aria-haspopup", "listbox");
  gumb.setAttribute("aria-expanded", "false");
  gumb.innerHTML = `<span class="jez-ikona">${IKONA_SVET}</span><span class="jez-koda"></span>`;
  document.body.appendChild(gumb);
  // Po vstopu animacija z fill: both drzi transform in bi preglasila stisk ob
  // pritisku - ista past kot pri profilu.
  gumb.addEventListener("animationend", () => gumb.classList.add("vstopil"), { once: true });

  const seznam = document.createElement("div");
  seznam.className = "spust-seznam jez-seznam dg";
  seznam.setAttribute("role", "listbox");
  for (const j of JEZIKI) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "spust-izbira";
    b.dataset.koda = j.koda;
    b.setAttribute("role", "option");
    // Vsako ime v svojem jeziku in smeri - arabscina se bere z desne.
    b.lang = j.koda;
    if (j.rtl) b.dir = "rtl";
    b.innerHTML = `<span>${j.ime}</span><span class="spust-kljukica">${IKONA_KLJUKICA}</span>`;
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      zapri();
      await nastaviJezik(j.koda);
    });
    seznam.appendChild(b);
  }
  document.body.appendChild(seznam);

  function osvezi() {
    const koda = jezik();
    gumb.querySelector(".jez-koda").textContent = koda.toUpperCase();
    const ime = JEZIKI.find((j) => j.koda === koda)?.ime ?? koda;
    gumb.setAttribute("aria-label", `${t("jezik.naslov", "Jezik")}: ${ime}`);
    seznam.setAttribute("aria-label", t("jezik.naslov", "Jezik"));
    seznam.querySelectorAll(".spust-izbira").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.koda === koda));
    });
  }

  function odpri() {
    // Lega pod gumbom, poravnana na desni rob. Visina je omejena na prostor,
    // ki ga seznam dejansko ima - trideset vrstic je vec, kot gre na zaslon.
    const r = gumb.getBoundingClientRect();
    seznam.style.top = `${r.bottom + 10}px`;
    seznam.style.left = "auto";
    seznam.style.right = `${Math.max(12, innerWidth - r.right)}px`;
    seznam.style.maxHeight = `${Math.max(180, innerHeight - r.bottom - 34)}px`;
    seznam.style.transformOrigin = "top right";
    seznam.classList.add("odprt");
    gumb.setAttribute("aria-expanded", "true");
    seznam.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
  }

  function zapri() {
    seznam.classList.remove("odprt");
    gumb.setAttribute("aria-expanded", "false");
  }

  gumb.addEventListener("click", (e) => {
    e.stopPropagation();
    if (seznam.classList.contains("odprt")) zapri();
    else odpri();
  });
  document.addEventListener("click", (e) => {
    if (!seznam.contains(/** @type {Node} */ (e.target))) zapri();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") zapri();
  });

  obJeziku(osvezi);
  osvezi();
  return { osvezi, zapri };
}
