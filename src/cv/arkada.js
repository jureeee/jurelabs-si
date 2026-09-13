/**
 * Arkada - vhod v mini igre.
 *
 * Igre se niso na strani, zato gumb zaenkrat odpre le ploscico "kmalu". Ko
 * pridejo, bo ta ploscica postala seznam iger; gumb in njegovo mesto ostaneta.
 */

import "./arkada.css";
import { t, obJeziku } from "./jezik.js";

export function installArkada() {
  const gumb = document.querySelector(".arkada");
  if (!gumb) return;

  gumb.addEventListener(
    "animationend",
    (e) => {
      if (e.animationName === "dockVstop") gumb.classList.add("vstopil");
    },
    { once: true }
  );

  const plosca = document.createElement("div");
  plosca.className = "arkada-plosca dg";
  plosca.setAttribute("role", "dialog");
  document.body.appendChild(plosca);

  const narisi = () => {
    plosca.setAttribute("aria-label", t("arkada.naslov", "Arkada"));
    plosca.innerHTML = `
      <div class="arkada-slika">${gumb.querySelector("svg").outerHTML}</div>
      <div class="arkada-oznaka">${t("arkada.naslov", "Arkada")}</div>
      <p class="arkada-naslov">${t("arkada.kmalu", "Kmalu")}</p>
      <p class="arkada-opis">${t("arkada.opis", "Mini igre so v izdelavi. Kmalu jih boš lahko igral kar tukaj.")}</p>`;
  };
  narisi();
  obJeziku(narisi);

  const odprta = () => plosca.classList.contains("odprta");
  const nastavi = (da) => {
    plosca.classList.toggle("odprta", da);
    gumb.setAttribute("aria-expanded", String(da));
  };

  gumb.addEventListener("click", () => nastavi(!odprta()));
  addEventListener("pointerdown", (e) => {
    if (!odprta() || !(e.target instanceof Element)) return;
    if (e.target.closest(".arkada, .arkada-plosca")) return;
    nastavi(false);
  });
  addEventListener("keydown", (e) => e.key === "Escape" && odprta() && nastavi(false));
}
