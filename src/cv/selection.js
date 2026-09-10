/**
 * Sij pod izbranim besedilom.
 *
 * ::selection sprejema le pescico lastnosti - barvo, ozadje in senco besedila.
 * Zabrisa ali zaobljenih robov mu ni mogoce dati, zato je sistemska izbira
 * vedno oster pravokotnik.
 *
 * Tu je narisana svoja plast: iz obmocja izbire vzamemo pravokotnike
 * (Range.getClientRects vrne enega na vrstico) in jih narisemo kot mehke
 * zaobljene lise. Zabris je na celi plasti in ne na vsaki lisi posebej - tako
 * se sosednje vrstice zlijejo v eno telo namesto v niz locenih packic.
 *
 * Zabris tece SAMO NAVZGOR IN NAVZDOL. Enakomeren zabris zamaze tudi zacetek
 * in konec izbire, in takrat se ne vidi vec, katera crka je prva izbrana in
 * katera zadnja - lisa se konca nekje v megli. Navpicni zabris pusti levi in
 * desni rob oster, kot bi ga potegnil markirni pisec, zgoraj in spodaj pa se
 * vrstice se vedno zlijejo v eno telo. Ker CSS filter blur() zamegli v obe
 * smeri enako, je zabris tu filter SVG, ki ima za vsako os svojo mero.
 *
 * Mesanje je "screen": ploskev pod besedilom se posvetli, belo besedilo pa
 * ostane belo. Navadna prosojna plast cez besedilo bi ga zbledila.
 *
 * Sama izbira ostane prava izbira - besedilo je se vedno mogoce kopirati.
 * Sistemsko ozadje le skrijemo.
 */

import "./selection.css";

/** Pod to velikostjo je pravokotnik ostanek prazne vrstice, ne besedilo. */
const NAJMANJ = 2;

/**
 * Zabrisa: eden navaden in eden za tiste, ki so gibanje izklopili.
 *
 * V obeh je vodoravna mera nic - zamegli se le po visini. sRGB je nujen:
 * privzeti linearRGB bi barvo siju spremenil, in to opazno.
 */
const FILTRI = `
  <filter id="izbira-mehko" x="-1%" y="-25%" width="102%" height="150%"
          color-interpolation-filters="sRGB">
    <feGaussianBlur stdDeviation="0 5" />
  </filter>
  <filter id="izbira-mehko-mirno" x="-1%" y="-25%" width="102%" height="150%"
          color-interpolation-filters="sRGB">
    <feGaussianBlur stdDeviation="0 2.5" />
  </filter>`;

export function installSelectionGlow() {
  const filtri = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  filtri.setAttribute("class", "izbira-filtri");
  filtri.setAttribute("aria-hidden", "true");
  filtri.innerHTML = FILTRI;
  document.body.appendChild(filtri);

  const plast = document.createElement("div");
  plast.className = "izbira-sij";
  document.body.appendChild(plast);

  let cakalec = null;

  function narisi() {
    const izbira = document.getSelection();
    plast.replaceChildren();
    if (!izbira || izbira.isCollapsed || izbira.rangeCount === 0) return;

    const obmocje = izbira.getRangeAt(0);
    const kosi = [];
    for (const r of obmocje.getClientRects()) {
      if (r.width < NAJMANJ || r.height < NAJMANJ) continue;
      const lisa = document.createElement("span");
      // Po sirini komaj kaj: zabris vodoravno ne tece, zato bi vsak dodatek
      // pomenil lisa, ki je sirsa od besedila pod njo. Po visini nic ne
      // dodajamo - zabris jo raztegne sam.
      lisa.style.cssText =
        `left:${r.left - 1}px;top:${r.top}px;` +
        `width:${r.width + 2}px;height:${r.height}px`;
      kosi.push(lisa);
    }
    plast.append(...kosi);
  }

  /**
   * Med vlecenjem se izbira spreminja ob vsakem pikslu. Risanje odlozimo v
   * naslednjo slicico, sicer bi pri dolgem besedilu racunali lege veckrat, kot
   * jih je mogoce prikazati.
   */
  function osvezi() {
    if (cakalec) return;
    cakalec = requestAnimationFrame(() => {
      cakalec = null;
      narisi();
    });
  }

  document.addEventListener("selectionchange", osvezi);
  // Lege so v koordinatah okna, zato jih ob drsenju preracunamo.
  addEventListener("scroll", osvezi, { passive: true, capture: true });
  addEventListener("resize", osvezi);
}
