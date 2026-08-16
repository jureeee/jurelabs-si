/**
 * Defracted Glass by Jure — runtime del.
 *
 * Dvoje, česar CSS sam ne zmore:
 *   1. karta premikov za feDisplacementMap, ki ozadje ob robovih ukrivi in
 *      rahlo poveca (lom svetlobe);
 *   2. sij ob robovih, ki se obraca za kazalcem in slabi z oddaljenostjo.
 *
 * Vrednosti so tiste, dolocene v galaxy-lab.html.
 */

const REFRACT_SCALE = 358;
const EDGE_WIDTH = 0.65;
const LENS = 0.33;

const GLOW_RADIUS = 320;
/** Koliko kot na frame dohiteva cilj. Nizje = bolj leno, tezje steklo. */
const KOT_DUSENJE = 0.12;

/**
 * Karta premikov: R doloca premik po x, G po y, 128 pomeni brez premika.
 * Sredina je nevtralna, proti robovom potiska navzven; povecava hkrati vlece
 * vzorcenje proti srediscu, zato je ozadje za steklom vecje.
 */
/**
 * Najvecja stranica karte premikov.
 *
 * Karta je gladek preliv, zato je ni treba risati v polni locljivosti
 * ploskve - feImage jo raztegne cez njo. Ker jo gradimo po slikovnih tockah v
 * JavaScriptu, je cena kvadratna: pri celozaslonski plosci 1532x832 je to
 * 1.27 milijona ponovitev in nekaj sto milisekund zamrznjenega vmesnika. Pri
 * 192 tockah je ponovitev 37 tisoc in razlike v videzu ni.
 */
const MAX_KARTA = 192;

function drawMap(w, h) {
  const merilo = Math.min(1, MAX_KARTA / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(8, Math.round(w * merilo));
  c.height = Math.max(8, Math.round(h * merilo));
  const ctx = c.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(c.width, c.height);
  const d = img.data;

  for (let y = 0; y < c.height; y += 1) {
    for (let x = 0; x < c.width; x += 1) {
      const nx = Math.min(x, c.width - 1 - x) / (c.width * 0.5);
      const ny = Math.min(y, c.height - 1 - y) / (c.height * 0.5);
      const edge = Math.min(nx, ny);

      let jakost = 0;
      if (edge < EDGE_WIDTH) {
        const t = 1 - edge / EDGE_WIDTH;
        jakost = t * t;
      }

      const dirX = x < c.width / 2 ? -1 : 1;
      const dirY = y < c.height / 2 ? -1 : 1;
      const wx = nx <= ny ? 1 : 0.25;
      const wy = ny < nx ? 1 : 0.25;

      const relX = (x / c.width) * 2 - 1;
      const relY = (y / c.height) * 2 - 1;

      const i = (y * c.width + x) * 4;
      d[i] = Math.max(0, Math.min(255, 128 + (dirX * jakost * wx - relX * LENS) * 127));
      d[i + 1] = Math.max(0, Math.min(255, 128 + (dirY * jakost * wy - relY * LENS) * 127));
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Najkrajsa pot med kotoma, da se ob prehodu cez 360 ne zavrti nazaj. */
function priblizajKot(trenutni, cilj, delez) {
  const razlika = ((cilj - trenutni + 540) % 360) - 180;
  return trenutni + razlika * delez;
}

export function installDefractedGlass(selektor = ".dg") {
  const feImage = document.getElementById("dg-map");
  const feDisp = document.getElementById("dg-disp");

  // --- karta premikov -------------------------------------------------------
  let zadnjaMera = "";
  const posodobiKarto = () => {
    if (!feImage || !feDisp) return;
    let w = 0;
    let h = 0;
    document.querySelectorAll(selektor).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > w) w = r.width;
      if (r.height > h) h = r.height;
    });
    if (w < 2 || h < 2) return;
    const kljuc = `${Math.round(w)}x${Math.round(h)}`;
    if (kljuc === zadnjaMera) return;
    zadnjaMera = kljuc;
    feImage.setAttribute("href", drawMap(w, h));
    feDisp.setAttribute("scale", String(REFRACT_SCALE));
  };

  // Namenoma setTimeout in ne rAF: rAF na skriti strani ne tece, karta se
  // tam ne bi nikoli narisala.
  let poskus = 0;
  const poskusi = () => {
    posodobiKarto();
    poskus += 1;
    if (!zadnjaMera && poskus < 40) setTimeout(poskusi, 80);
  };
  poskusi();
  window.addEventListener("resize", posodobiKarto);

  // --- sij, ki sledi kazalcu ------------------------------------------------
  const stanje = new WeakMap();
  let mis = null;

  window.addEventListener(
    "pointermove",
    (e) => {
      mis = { x: e.clientX, y: e.clientY };
    },
    { passive: true }
  );

  /**
   * Izmerjene lege ploskev.
   *
   * getBoundingClientRect prisili brskalnik v izracun postavitve. Klicati ga
   * za vsako ploskev v vsaki slicici pomeni desetine takih izracunov na
   * slicico - prav to je delalo zatikanje ob premiku miske. Lege se
   * spremenijo le ob drsenju, spremembi velikosti okna ali ko se pojavi nova
   * ploskev, zato jih hranimo in osvezimo takrat.
   */
  let ploskve = [];
  let osveziLege = true;
  const zahtevajLege = () => { osveziLege = true; };
  window.addEventListener("scroll", zahtevajLege, { passive: true, capture: true });
  window.addEventListener("resize", zahtevajLege);
  setInterval(zahtevajLege, 500);

  const frame = () => {
    if (mis) {
      if (osveziLege) {
        osveziLege = false;
        ploskve = [...document.querySelectorAll(selektor)]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter((p) => p.r.width > 0);
      }

      ploskve.forEach(({ el, r }) => {

        // Razdalja do najblizje tocke ploskve, ne do sredisca - velike ploskve
        // bi sicer reagirale sele, ko si sredi njih.
        const dx = Math.max(r.left - mis.x, 0, mis.x - r.right);
        const dy = Math.max(r.top - mis.y, 0, mis.y - r.bottom);
        const d = Math.hypot(dx, dy);
        const cilj = d >= GLOW_RADIUS ? 0 : (1 - d / GLOW_RADIUS) ** 2;

        // Odmik normaliziramo po POLOVICNI sirini in visini. Brez tega se pri
        // siroki kapsuli kot ob premiku po x zavrti veliko hitreje kot po y.
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const nx = (mis.x - cx) / (r.width / 2);
        const ny = (mis.y - cy) / (r.height / 2);
        const ciljniKot = (Math.atan2(ny, nx) * 180) / Math.PI + 90;

        const prej = stanje.get(el) ?? { kot: ciljniKot, glow: 0 };
        const kot = priblizajKot(prej.kot, ciljniKot, KOT_DUSENJE);
        const glow = prej.glow + (cilj - prej.glow) * 0.18;
        stanje.set(el, { kot, glow });

        // Pisemo le, ko se vrednost zares premakne; vsak zapis sicer razveljavi
        // slog in sprozi ponoven izris ploskve.
        if (Math.abs(glow - prej.glow) > 0.002 || Math.abs(kot - prej.kot) > 0.2) {
          el.style.setProperty("--glow", glow.toFixed(3));
          el.style.setProperty("--glow-kot", `${kot.toFixed(1)}deg`);
        }
      });
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
