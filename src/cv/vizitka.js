// Vizitka - ploskev se razpre iz gumba cez celo stran in postane platno.
//
// Prenesena iz Trace Space (static/v2/vizitka.js). Vizitka je znamka in mora
// biti povsod ista, zato je vsebina nedotaknjena; spremenjeno je le troje:
//
//   - slike duhca gredo skozi Vite in ne po poti do streznika,
//   - ploskev se razpre iz gumba, ki jo je odprl, in ne iz stranskega menija,
//     ki ga ta stran nima,
//   - barve so temne in ploskev stoji v steklu, ker tu ne lezi na svetli
//     nadzorni plosci, ampak nad galaksijo.
//
// Nosi tri animacije - duhca, epruveto in ASCII morph - zato se nalozi sele
// ob prvem odprtju. Nic od tega ne gre v omrezje: slike so lokalne, pisave
// sistemske.

import "./vizitka.css";
import duhecBody from "../assets/vizitka/duhec-body.png";
import duhecIdle from "../assets/vizitka/duhec-idle.png";
import duhecWink from "../assets/vizitka/duhec-wink.png";
import duhecClosed from "../assets/vizitka/duhec-closed.png";
import duhecSurprised from "../assets/vizitka/duhec-surprised.png";
import duhecExcited from "../assets/vizitka/duhec-excited.png";

/** Naslovi slik po imenu obraza; Vite jih ob gradnji zamenja s pravimi. */
const SLIKE = {
  body: duhecBody,
  idle: duhecIdle,
  wink: duhecWink,
  closed: duhecClosed,
  surprised: duhecSurprised,
  excited: duhecExcited,
};

const REDUCE = matchMedia("(prefers-reduced-motion: reduce)");
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- duhec (gumb) ----------
// Telo je ena slika, obrazi so plasti cez njega. Menja se samo obraz, zato
// duhec nikoli ne "skoci" - to je isti trik kot pri epruveti.
const OBRAZI = ["wink", "closed", "surprised", "excited"];

function duhecMarkup() {
  const face = (n, on) =>
    `<img class="duh-face${on ? " on" : ""}" data-face="${n}" src="${SLIKE[n]}" alt="">`;
  return (
    '<span class="duh">' +
    `<img class="duh-body" src="${SLIKE.body}" alt="">` +
    face("idle", true) + OBRAZI.map((n) => face(n, false)).join("") +
    "</span>"
  );
}

// samodejno=false: izraze sprozi klicatelj (leteci duhec jih veze na konec
// premika, da menjava ne pade sredi leta)
function duhecZivi(el, samodejno = true) {
  const obrazi = new Map([...el.querySelectorAll("[data-face]")].map((f) => [f.dataset.face, f]));
  let cakalec = 0, povratek = 0, hover = false, zadnji = null;

  const pokazi = (ime) => obrazi.forEach((f, n) => f.classList.toggle("on", n === ime));

  const izberi = () => {
    const na = OBRAZI.filter((x) => x !== zadnji);
    zadnji = na[Math.floor(Math.random() * na.length)];
    return zadnji;
  };

  function sprozi(trajanje) {
    if (hover || REDUCE.matches) return;
    clearTimeout(povratek);
    pokazi(izberi());
    povratek = setTimeout(() => { if (!hover) pokazi("idle"); }, trajanje || rand(1100, 1900));
  }

  function naprej() {
    clearTimeout(cakalec);
    if (!samodejno || hover || REDUCE.matches) return;
    cakalec = setTimeout(() => {
      if (hover || document.hidden) return naprej();
      sprozi(rand(900, 1500));
      setTimeout(naprej, 1600);
    }, rand(7000, 12000));
  }

  // Na gumbu je duhec do hoverja neviden, zato hover lovi gumb in ne duhec.
  const cilj = el.closest(".viz-btn") || el;
  cilj.addEventListener("pointerenter", () => {
    hover = true;
    clearTimeout(cakalec); clearTimeout(povratek);
    pokazi("excited");
  });
  cilj.addEventListener("pointerleave", () => {
    hover = false;
    pokazi("idle");
    naprej();
  });
  naprej();
  return { sprozi, pokazi };
}

// Ko odpres vizitko, duhec zapusti gumb in se do zaprtja potika po platnu.
// Cilj menja sam od sebe; miska ga NE vodi, samo rahlo nagne - toliko, da se
// vidi, da te opazi, ne toliko, da bi mu ukazoval.
// Kje je leteci duhec (v koordinatah okna). Druge animacije to berejo, da se
// odzovejo, ko gre cezenj -- duhec ni nalepka nad stranjo, ampak nekaj, kar
// se strani dotika.
let DUH_POZ = null;

function duhecPoleti(izhod) {
  const VEL = 68;
  const el = document.createElement("div");
  el.className = "duh-let";
  el.innerHTML = duhecMarkup();
  document.body.appendChild(el);
  const obraz = duhecZivi(el.querySelector(".duh"), false);

  let x = izhod.left + izhod.width / 2 - VEL / 2;
  let y = izhod.top + izhod.height / 2 - VEL / 2;
  let vx = 0, vy = -2.6, sc = Math.max(0.3, izhod.width / VEL), ciljSc = 1;
  let tx = x + rand(60, 150), ty = Math.max(60, y - rand(180, 300));
  let ciljOb = performance.now() + 1500;
  let nagib = 0, zadnjaX = null, vracanje = null, konecOb = 0, prispel = false;
  let raf = 0, tece = true, zadnjiCas = performance.now();

  function novCilj(now) {
    // Nov cilj pomeni, da je prejsnji premik koncan -- ce duhec ni prisel
    // cisto do konca, se obraz zamenja tukaj. Tako je menjava vedno vezana
    // na konec premika in nikoli ne pade sredi poti.
    if (!prispel) obraz.sprozi();
    tx = rand(innerWidth * 0.06, innerWidth * 0.88);
    ty = rand(innerHeight * 0.08, innerHeight * 0.7);
    ciljOb = now + rand(2600, 5400);
    prispel = false;
  }

  const naMisko = (e) => {
    if (zadnjaX !== null) nagib = nagib * 0.72 + (e.clientX - zadnjaX) * 0.28;
    zadnjaX = e.clientX;
  };
  addEventListener("pointermove", naMisko, { passive: true });

  function korak(now) {
    if (!tece) return;
    const dt = clamp((now - zadnjiCas) / 16.67, 0.35, 3);
    zadnjiCas = now;
    const cilj = vracanje || (now > ciljOb ? (novCilj(now), { x: tx, y: ty }) : { x: tx, y: ty });
    const k = vracanje ? 0.011 : 0.0042;
    vx += (cilj.x - x) * k * dt;
    vy += (cilj.y - y) * k * dt;
    const d = Math.pow(vracanje ? 0.9 : 0.955, dt);
    vx *= d; vy *= d;
    x += vx * dt; y += vy * dt;
    sc += (ciljSc - sc) * 0.055 * dt;
    nagib *= Math.pow(0.9, dt);
    // Obraz se zamenja SELE, ko pristane: med letom je duhec zbran, ob
    // prihodu pa se ustavi, te pogleda in sele nato odplava naprej. Postanek
    // je namenoma viden -- brez njega bi menjava padla nekam sredi poti in
    // ne bi bila povezana s premikom.
    if (!vracanje && !prispel) {
      const odmik = Math.hypot(tx - x, ty - y), hitrost = Math.hypot(vx, vy);
      if (odmik < 46 && hitrost < 1.1) {
        prispel = true;
        tx = x; ty = y;                       // ostani pri miru
        ciljOb = now + rand(1000, 1900);      // postanek
        obraz.sprozi();
      }
    }
    const bob = vracanje ? 0 : Math.sin(now / 820) * 5;
    const rot = clamp(nagib * 0.5, -9, 9) + Math.sin(now / 1500) * 2.2;
    el.style.transform =
      `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    DUH_POZ = { x: x + VEL / 2, y: y + bob + VEL / 2 };
    if (vracanje && now > konecOb) return odstrani();
    raf = requestAnimationFrame(korak);
  }

  function odstrani() {
    tece = false;
    DUH_POZ = null;
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", naMisko);
    el.remove();
  }

  el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${sc})`;
  raf = requestAnimationFrame(korak);

  return {
    // nazaj v gumb: isti mehanizem, samo cilj je fiksen in vzmet trsa
    vrni(cilj) {
      if (!tece) return;
      vracanje = { x: cilj.left + cilj.width / 2 - VEL / 2, y: cilj.top + cilj.height / 2 - VEL / 2 };
      ciljSc = Math.max(0.3, cilj.width / VEL);
      konecOb = performance.now() + 620;
      setTimeout(odstrani, 900);      // ce slike ne tecejo
    },
    stop: odstrani,
  };
}

// ---------- epruveta ----------
function epruvetaMarkup() {
  return `<svg class="epr" viewBox="0 0 420 470" role="img" aria-label="Maskota Jure Labs">
  <defs>
    <linearGradient id="eprRob" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a9c7ff"/><stop offset=".5" stop-color="#6d9aff"/>
      <stop offset="1" stop-color="#4776e8"/>
    </linearGradient>
    <linearGradient id="eprTek" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1f6ff"/><stop offset=".5" stop-color="#dce9ff"/>
      <stop offset="1" stop-color="#bfd4ff"/>
    </linearGradient>
    <clipPath id="eprClip">
      <path d="M145 68 L145 175 C145 198 91 276 72 325 C48 387 90 431 153 434 L267 434 C330 431 372 387 348 325 C329 276 275 198 275 175 L275 68 Z"/>
    </clipPath>
  </defs>
  <g class="epr-body">
    <ellipse cx="210" cy="438" rx="120" ry="16" fill="#7da5ff" opacity=".12"/>
    <path class="epr-glass" d="M145 68 L145 175 C145 198 91 276 72 325 C48 387 90 431 153 434 L267 434 C330 431 372 387 348 325 C329 276 275 198 275 175 L275 68 Z"/>
    <rect x="126" y="42" width="168" height="52" rx="26" class="epr-glass"/>
    <rect x="139" y="54" width="142" height="25" rx="12.5" fill="#fff" opacity=".95"/>
    <g clip-path="url(#eprClip)">
      <path class="epr-liquid" d="M60 319 C105 291 143 340 184 315 C225 290 263 339 305 314 C338 295 370 307 385 317 L385 460 L50 460 Z"/>
      <path d="M93 339 C110 305 132 267 145 238" class="epr-shine" opacity=".45"/>
    </g>
    <path class="epr-inner" d="M157 92 L157 177 C157 203 103 282 87 327 C69 379 100 416 156 419 L264 419 C320 416 351 379 333 327 C317 282 263 203 263 177 L263 92"/>
    <g class="epr-face">
      <ellipse class="epr-cheek l" cx="144" cy="371" rx="25" ry="12"/>
      <ellipse class="epr-cheek r" cx="276" cy="371" rx="25" ry="12"/>
      <path class="epr-brow l" d="M139 323 Q157 312 174 323"/>
      <path class="epr-brow r" d="M246 323 Q263 312 281 323"/>
      <g class="epr-eye l">
        <ellipse class="epr-eyeball" cx="160" cy="347" rx="18" ry="22"/>
        <circle class="epr-shine2" cx="153" cy="339" r="6"/>
        <circle class="epr-shine2" cx="168" cy="352" r="3" opacity=".72"/>
      </g>
      <g class="epr-eye r">
        <ellipse class="epr-eyeball" cx="260" cy="347" rx="18" ry="22"/>
        <circle class="epr-shine2" cx="253" cy="339" r="6"/>
        <circle class="epr-shine2" cx="268" cy="352" r="3" opacity=".72"/>
      </g>
      <path class="epr-mouth" d="M190 374 Q210 394 230 374"/>
    </g>
    <g opacity=".9">
      <circle cx="183" cy="272" r="11" fill="#fff" opacity=".55" stroke="#8db2ff" stroke-width="3"/>
      <circle cx="228" cy="235" r="7" fill="#fff" opacity=".45" stroke="#8db2ff" stroke-width="3"/>
      <circle cx="252" cy="290" r="15" fill="#fff" opacity=".42" stroke="#8db2ff" stroke-width="3"/>
      <circle cx="197" cy="211" r="5" fill="#fff" opacity=".5"/>
    </g>
    <path class="epr-sparkle" d="M86 209 v22 M75 220 h22"/>
    <path class="epr-sparkle" d="M344 191 v18 M335 200 h18"/>
  </g>
  <g class="epr-bubbles">
    <circle class="epr-bubble" cx="175" cy="55" r="10"/>
    <circle class="epr-bubble" cx="212" cy="38" r="14"/>
    <circle class="epr-bubble" cx="246" cy="61" r="8"/>
    <circle class="epr-bubble" cx="193" cy="12" r="7"/>
    <circle class="epr-bubble" cx="267" cy="24" r="11"/>
    <circle class="epr-bubble" cx="228" cy="-4" r="6"/>
  </g>
</svg>`;
}

// 12 sličic na sekundo je namerno: epruveta je risanka, ne 3D predmet, in
// pri 60 fps izgubi značaj (pa tudi baterijo je škoda).
function epruvetaZivi(svg) {
  const STEP = 1000 / 12;
  const body = svg.querySelector(".epr-body");
  const liquid = svg.querySelector(".epr-liquid");
  const oci = [...svg.querySelectorAll(".epr-eye")];
  const zenice = [...svg.querySelectorAll(".epr-shine2")];
  const usta = svg.querySelector(".epr-mouth");
  const obrvi = [...svg.querySelectorAll(".epr-brow")];
  const lica = [...svg.querySelectorAll(".epr-cheek")];
  const mehurcki = [...svg.querySelectorAll(".epr-bubble")];

  let frame = 0, hover = false, val = false, valOd = 0, izrazTimer = 0, hoverMig = 0;
  let duhNad = false;
  let naslednjiIzraz = performance.now() + rand(7000, 12000);
  let naslednjiVal = performance.now() + 15000;

  const cx = [160, 260];
  function eyes(x = 1, y = 1) {
    oci.forEach((o, i) => o.setAttribute("transform",
      `translate(${cx[i] * (1 - x)} ${347 * (1 - y)}) scale(${x} ${y})`));
    zenice.forEach((s) => (s.style.opacity = y < 0.28 ? 0 : 1));
  }
  function brows(show, tip = "soft") {
    obrvi.forEach((b) => (b.style.opacity = show ? 1 : 0));
    const d = tip === "annoyed" ? ["M139 327 Q157 318 174 323", "M246 323 Q263 318 281 327"]
      : tip === "surprised" ? ["M139 319 Q157 306 174 319", "M246 319 Q263 306 281 319"]
      : ["M139 323 Q157 314 174 325", "M246 325 Q263 314 281 323"];
    obrvi.forEach((b, i) => b.setAttribute("d", d[i]));
  }
  function cheeks(sc = 1, op = 0.76) {
    lica.forEach((c) => { c.setAttribute("rx", 25 * sc); c.style.opacity = op; });
  }
  function obraz(ime) {
    clearTimeout(izrazTimer);
    brows(false); cheeks(1, 0.76);
    if (ime === "cute") { eyes(1, 1); usta.setAttribute("d", "M190 374 Q210 394 230 374"); }
    else if (ime === "happy") { eyes(1, 0.18); usta.setAttribute("d", "M185 369 Q210 405 235 369"); cheeks(1.12, 0.9); }
    else if (ime === "inspired") { eyes(1.14, 1.14); usta.setAttribute("d", "M198 376 Q210 386 222 376"); cheeks(1.08, 0.88); }
    else if (ime === "surprised") { eyes(1.08, 1.15); brows(true, "surprised"); usta.setAttribute("d", "M210 369 m-10 0 a10 13 0 1 0 20 0 a10 13 0 1 0 -20 0"); cheeks(0.92, 0.62); }
    else if (ime === "annoyed") { eyes(1, 0.68); brows(true, "annoyed"); usta.setAttribute("d", "M194 383 Q210 375 226 383"); cheeks(0.9, 0.58); }
    else if (ime === "uneasy") { eyes(1, 0.9); brows(true, "soft"); usta.setAttribute("d", "M190 381 Q200 369 210 381 Q220 393 230 381"); cheeks(0.95, 0.72); }
    else if (ime === "blink") { eyes(1, 0.08); usta.setAttribute("d", "M190 374 Q210 394 230 374"); }
  }
  function zacasno(ime, ms = 850) {
    obraz(ime);
    izrazTimer = setTimeout(() => { if (!val) obraz(hover ? "annoyed" : "cute"); }, ms);
  }
  function valTece(now) {
    const t = now - valOd;
    mehurcki.forEach((b, i) => {
      const local = t - i * 220, life = 1500;
      if (local < 0 || local > life) { b.style.opacity = 0; return; }
      const p = local / life;
      b.style.opacity = Math.sin(Math.PI * p) * 0.95;
      b.style.transform = `translate(${Math.sin(p * 6 + i) * 9}px,${-p * 120}px) scale(${0.72 + 0.35 * p})`;
    });
    if (t > 3300) {
      val = false;
      mehurcki.forEach((b) => { b.style.opacity = 0; b.style.transform = ""; });
      obraz(hover ? "annoyed" : "cute");
      naslednjiVal = now + rand(14000, 18000);
    }
  }
  function tick() {
    if (document.hidden) return;
    const now = performance.now();
    frame++;
    let sx = 0, sr = 0;
    if (val) { sx = Math.sin(frame * 1.8) * 2.3; sr = Math.sin(frame * 1.4) * 0.7; valTece(now); }
    body.style.transform = `translateX(${sx}px) rotate(${sr}deg) scale(${1 + Math.sin(frame / 18) * 0.006})`;
    liquid.style.transform = `translateY(${Math.sin(frame / 9) * 4}px)`;
    if (!hover && !val && now >= naslednjiIzraz) {
      const p = ["happy", "inspired", "surprised", "blink"];
      const c = p[Math.floor(Math.random() * p.length)];
      zacasno(c, c === "blink" ? 260 : 1200);
      naslednjiIzraz = now + rand(7000, 12000);
    }
    if (!val && now >= naslednjiVal) { val = true; valOd = now; obraz("uneasy"); }
  }

  // Duhec steje kot obisk: ko preleti epruveto, se ta razveseli enako kot ob
  // miski. Preverjamo poceni, petkrat na sekundo -- vec ni potrebno.
  const duhCheck = setInterval(() => {
    if (!DUH_POZ || document.hidden) return;
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const notri = DUH_POZ.x > r.left - 20 && DUH_POZ.x < r.right + 20 &&
                  DUH_POZ.y > r.top - 20 && DUH_POZ.y < r.bottom + 20;
    if (notri === duhNad) return;
    duhNad = notri;
    if (notri) vesela(); else if (!hover && !val) obraz("cute");
  }, 200);

  // Nagajivo navdusena: poskoci, se zaziba in ostane nasmejana. Ce gres cez
  // maskoto (ali gre cezenj duhec), te mora to veseliti, ne motiti.
  function vesela() {
    obraz("happy");
    if (REDUCE.matches) return;
    svg.animate([
      { transform: "translateY(0) rotate(0deg) scale(1)" },
      { transform: "translateY(-9px) rotate(-4deg) scale(1.05, 0.96)", offset: 0.3 },
      { transform: "translateY(2px) rotate(3deg) scale(0.97, 1.04)", offset: 0.58 },
      { transform: "translateY(-3px) rotate(-1.5deg) scale(1.01, 0.99)", offset: 0.8 },
      { transform: "translateY(0) rotate(0deg) scale(1)" },
    ], { duration: 900, easing: "cubic-bezier(0.34, 1.4, 0.5, 1)" });
    clearTimeout(hoverMig);
    hoverMig = setTimeout(() => { if ((hover || duhNad) && !val) obraz("happy"); }, 520);
  }

  svg.addEventListener("pointerenter", () => {
    hover = true;
    if (val) return;
    vesela();
  });
  svg.addEventListener("pointerleave", () => {
    hover = false;
    clearTimeout(hoverMig);
    if (!val) obraz("cute");
    naslednjiIzraz = performance.now() + rand(3000, 7000);
  });
  svg.addEventListener("pointerdown", () => { if (!val) zacasno("inspired", 700); });

  obraz("cute");
  if (REDUCE.matches) return () => {};
  const id = setInterval(tick, STEP);
  return () => {
    clearInterval(id); clearInterval(duhCheck);
    clearTimeout(izrazTimer); clearTimeout(hoverMig);
  };
}

// ---------- ASCII morph ----------
// Isti motor kot v predlogi, samo barve so prestavljene na svetlo podlago:
// namesto svetlecih znakov na crnini so modri znaki na belem papirju.
// Risbe so napisane v mrezi 56 x 34. Znaki so bili pri tem debeli in slika
// groba, zato mrezo zgostimo: risalne koordinate pomnozimo z GOSTOTA, mreza
// pa je toliko vecja. Risb ni treba pisati na novo, znakov je 2,5-krat vec in
// so manjsi -- ilustracija je bolj podrobna.
const OSNOVA_W = 56, OSNOVA_H = 34, GOSTOTA = 1.6;
const GRID_W = Math.round(OSNOVA_W * GOSTOTA), GRID_H = Math.round(OSNOVA_H * GOSTOTA);
const VIEW_W = 800, VIEW_H = 640, TAU = Math.PI * 2;

const PALETE = {
  pour:  ["#8fb4ff", "#6d9aff", "#b9cdff", "#3f63c8"],
  wave:  ["#7fb0ff", "#5d8fff", "#a9c7ff", "#3355b5"],
  dino:  ["#6bbfb6", "#6d9aff", "#a99cf0", "#3f63c8"],
  star:  ["#d9a94b", "#e888b6", "#8fb0ff", "#3f63c8"],
  ghost: ["#93aefc", "#a993f5", "#77c2f0", "#5d8fff", "#3a2a8a", "#e0629f"],
  leo:   ["#8e97a8", "#5d6b80", "#a9b6cc", "#38414f"],
  lab:   ["#4fb3a2", "#5d8fff", "#9b83ec", "#3f63c8"],
  code:  ["#3fa6cc", "#6f78e2", "#dd6fb4", "#3f63c8"],
};

// Tretje stevilo je cas MIROVANJA (koliko casa slika stoji), ne cel krog.
// Prehod je svojih MORPH_MS in se zgodi za tem -- prej je bilo oboje eno in
// isto, zato se je slika komaj postavila, ze je odsla.
const MORPH_MS = 1250;
const FAZE = [
  // Slike, ki nekaj POVEDO, stojijo 5-9 s. Koraki hoje so sliciice enega
  // giba, zato so kratki -- s petimi sekundami na korak to ne bi bila hoja,
  // ampak diaprojekcija.
  ["POUR", "pour", 5200], ["POUR", "pour", 5000], ["POUR", "pour", 5400],
  ["SPLASH", "pour", 6200], ["WAVE", "wave", 6000], ["WAVE", "wave", 6400],
  ["WILD WAVE", "wave", 7600],
  // Cetrto polje: "rez" = menjava brez preliva. Hoja je zaporedje slicic
  // ENEGA telesa; ce jih prelivamo, znak z noge odpotuje v glavo naslednje
  // slicice in namesto koraka vidis mesanico. Zato med koraki rezemo, kot pri
  // risanki, in prelivamo samo takrat, ko se res spremeni predmet.
  ["DINO / KORAK 1", "dino", 260, true], ["DINO / KORAK 2", "dino", 260, true],
  ["DINO / KORAK 3", "dino", 260, true], ["DINO / KORAK 4", "dino", 260, true],
  ["DINO / KORAK 5", "dino", 260, true], ["DINO / KORAK 6", "dino", 260, true],
  ["DINO / KORAK 7", "dino", 260, true], ["DINO / KORAK 8", "dino", 260, true],
  ["DINOSAUR", "dino", 5600],
  ["LEOPARD / KORAK 1", "leo", 260, true], ["LEOPARD / KORAK 2", "leo", 260, true],
  ["LEOPARD / KORAK 3", "leo", 260, true], ["LEOPARD / KORAK 4", "leo", 260, true],
  ["LEOPARD / KORAK 5", "leo", 260, true], ["LEOPARD / KORAK 6", "leo", 260, true],
  ["LEOPARD / SKOK", "leo", 420, true], ["LEOPARD / ZOGA", "leo", 5200],
  ["STAR / FORM", "star", 5600], ["STAR", "star", 8200],
  ["GHOST / FORM", "ghost", 5800], ["GHOST / HELLO", "ghost", 8600],
  ["GHOST / WINK", "ghost", 8600],
  ["LAB / FORM", "lab", 6000], ["LAB", "lab", 8800], ["TERMINAL", "code", 7000],
  ["CODE", "code", 9000], ["REBOOT", "code", 5600],
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fract = (v) => v - Math.floor(v);
const hash = (x, y, seed = 0) => fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453);
const ease3 = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

function hexRgb(hex) {
  const r = hex.replace("#", "");
  return [parseInt(r.slice(0, 2), 16), parseInt(r.slice(2, 4), 16), parseInt(r.slice(4, 6), 16)];
}
function zmesaj(a, b, k, alpha) {
  const ca = hexRgb(a), cb = hexRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * k));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}
function vPoligonu(x, y, poly) {
  let notri = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 0.0001) + xi) notri = !notri;
  }
  return notri;
}

function narisi(index, builder) {
  const cells = new Map();
  const paleta = PALETE[FAZE[index][1]];

  function put(x, y, char = "*", role = 0, opacity = 1, priority = 1) {
    x = Math.round(x * GOSTOTA); y = Math.round(y * GOSTOTA);
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H || char === " ") return;
    const k = x + "," + y, o = cells.get(k);
    if (!o || priority >= o.priority) {
      cells.set(k, { x, y, char: String(char)[0], color: paleta[clamp(role, 0, paleta.length - 1)], opacity, priority });
    }
  }
  const text = (x, y, v, role = 3, pr = 5) => [...v].forEach((c, i) => put(x + i, y, c, role, 1, pr));
  function line(x1, y1, x2, y2, char = "*", role = 0, th = 1, pr = 2) {
    const n = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2 * GOSTOTA);
    for (let i = 0; i <= n; i++) {
      const t = i / Math.max(1, n), x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      for (let ox = -th + 1; ox < th; ox++) for (let oy = -th + 1; oy < th; oy++) {
        if (Math.abs(ox) + Math.abs(oy) < th + 0.2) put(x + ox, y + oy, char, role, 1, pr);
      }
    }
  }
  const polyline = (pts, chars = "/*", role = 0, th = 1, pr = 2) => {
    for (let i = 0; i < pts.length - 1; i++) {
      line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], chars[i % chars.length], role, th, pr);
    }
  };
  // Maska je pisana v risalnih koordinatah, mreza pa je gostejsa -- zato
  // hodimo po gosti mrezi in masko sprasujemo v njenih enotah. Tako dobimo
  // vec znakov na isti obliki.
  function fill(mask, chars = "@#*+:.", role = 0, density = 1, seed = index, pr = 1) {
    for (let gy = 0; gy < GRID_H; gy++) for (let gx = 0; gx < GRID_W; gx++) {
      const x = gx / GOSTOTA, y = gy / GOSTOTA;
      if (!mask(x, y)) continue;
      const n = hash(gx, gy, seed);
      if (n > density) continue;
      put(x, y, chars[Math.floor(n * chars.length) % chars.length], role + (n > 0.76 ? 1 : 0), 0.76 + n * 0.24, pr);
    }
  }
  const ellipse = (cx, cy, rx, ry, chars = "@#*+:.", role = 0, d = 1, seed = index, pr = 1) =>
    fill((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, chars, role, d, seed, pr);
  const polygon = (pts, chars = "@#*+:.", role = 0, d = 1, seed = index, pr = 1) =>
    fill((x, y) => vPoligonu(x + 0.5, y + 0.5, pts), chars, role, d, seed, pr);
  function ring(cx, cy, r, chars = "*+.", role = 0, d = 0.8, seed = index) {
    for (let a = 0; a < TAU; a += 0.12 / GOSTOTA) {
      const w = 1 + Math.sin(a * 5 + seed) * 0.08;
      const x = cx + Math.cos(a) * r * w, y = cy + Math.sin(a) * r * 0.58 * w;
      if (hash(Math.round(x), Math.round(y), seed) <= d) {
        put(x, y, chars[Math.floor(hash(x, y, seed + 9) * chars.length)], role, 1, 2);
      }
    }
  }

  builder({ put, text, line, polyline, fill, ellipse, polygon, ring });

  // Vrstni red je "bustrofedon" (leva-desna, desna-leva): ko se ena slika
  // preliva v drugo, znaki potujejo po pasovih in ne cez celo platno.
  const points = [...cells.values()].sort((a, b) => {
    const pa = Math.floor(a.y / 3), pb = Math.floor(b.y / 3);
    if (pa !== pb) return pa - pb;
    return pa % 2 === 0 ? a.x - b.x : b.x - a.x;
  });
  return { label: FAZE[index][0], paleta: FAZE[index][1], mir: FAZE[index][2],
           rez: !!FAZE[index][3], points };
}

function addPour(api, amount, seed) {
  const { put, line, ellipse, ring } = api;
  const sx = 38 - amount * 1.3, bottom = 9 + amount * 4.2;
  for (let y = -1; y <= bottom; y++) {
    const w = amount > 1 ? 1 : 0;
    for (let o = -w; o <= w; o++) {
      if (hash(o + 8, y, seed) > 0.18 + amount * 0.2) {
        const chars = "jure01<>/\\.:*+";
        put(sx + Math.sin(y * 0.55 + seed) * (0.5 + amount * 0.15) + o, y,
          chars[Math.floor(hash(y, o, seed + 4) * chars.length)], (y + o + seed) % 3,
          0.72 + hash(y, seed, o) * 0.28, 2);
      }
    }
  }
  if (amount >= 1) { line(sx, bottom - 1, 29, 27, "\\", 1, 1, 2); ellipse(28, 28, 3 + amount * 4.2, 0.7 + amount * 1.25, "~.:*+", 0, 0.72, seed); }
  if (amount >= 2) { ring(28, 27, 4 + amount * 1.7, ".*+", 2, 0.55, seed); put(20, 22, "*", 3, 1, 4); put(23, 19, "+", 2, 1, 4); put(34, 21, ".", 1, 1, 4); }
}

function addWave(api, size, seed, forming = false) {
  const { put, fill, line, polyline } = api;
  const cx = 20 + size * 1.8, cy = 12 - size * 0.35, r = 7 + size * 1.6;
  fill((x, y) => {
    const base = y >= 23 + Math.sin(x * 0.48 + seed) * (1.3 + size * 0.25);
    const outer = Math.sqrt(((x - cx) / r) ** 2 + ((y - cy) / (r * 0.82)) ** 2);
    const inner = Math.sqrt(((x - (cx + 3 + size)) / (r * 0.62)) ** 2 + ((y - (cy + 2.5)) / (r * 0.52)) ** 2);
    const curl = outer <= 1.05 && inner >= 0.82 && x < cx + r * 0.75 && y < 24;
    const slope = y >= 16 + (x - 12) * 0.3 && x > 9 && x < 48;
    return base || curl || slope;
  }, "~#/\\*+.:", 0, forming ? 0.69 : 0.87, seed, 1);
  polyline([[4, 25], [11, 23 - size * 0.45], [17, 19 - size], [cx - 3, cy], [cx + 3, cy - 2],
    [cx + r * 0.72, cy + 4], [cx + r * 0.25, cy + 9], [cx + 3, cy + 7]], "/*\\~", 2, 1, 4);
  for (let i = 0; i < 18 + size * 5; i++) {
    const a = Math.PI * (1.02 + hash(i, seed, 2) * 0.78), rr = r * (0.7 + hash(i, seed, 3) * 0.55);
    put(cx + Math.cos(a) * rr + hash(i, seed, 4) * 4, cy + Math.sin(a) * rr * 0.62 - hash(i, seed, 5) * 3,
      i % 3 === 0 ? "*" : ".", 3, 0.8 + hash(i, seed) * 0.2, 5);
  }
  for (let x = 1; x < GRID_W - 1; x += 2) {
    const y = 27 + Math.sin(x * 0.57 + seed) * 1.5;
    line(x, y, x + 1, y + Math.sin(x), "~", x % 4 ? 0 : 2, 1, 3);
  }
}

// korak: 0..1 skozi en korak hoje. Noge se izmenjujeta, telo se ob dotiku tal
// rahlo spusti -- brez tega dinozaver drsi, namesto da bi hodil.
function addDino(api, desno, lean, seed, duh = false, dx = 0, korak = 0) {
  const { put, line, ellipse, polygon } = api;
  const m = (x) => (desno ? GRID_W - 1 - (x + dx) : x + dx);
  const nihaj = Math.sin(korak * Math.PI * 2);
  const dvig = Math.abs(Math.cos(korak * Math.PI * 2)) * 0.55 - 0.3;   // telo gor/dol
  const pts = (p) => p.map(([x, y]) => [m(x), y + (lean * (x - 28)) / 16 + dvig]);
  const ch = "@#%*+=:.";
  ellipse(m(30), 18 + dvig, 9.5, 5.7, ch, 0, duh ? 0.53 : 0.86, seed, 1);
  ellipse(m(18), 11 + lean * -0.55 + dvig, 5.8, 3.8, ch, 0, duh ? 0.48 : 0.88, seed + 1, 1);
  polygon(pts([[8, 10], [14, 8], [22, 8.5], [24, 11.5], [20, 14], [10, 13]]), ch, 0, duh ? 0.5 : 0.9, seed + 2, 1);
  polygon(pts([[20, 11], [29, 13.5], [31, 20], [23, 19]]), ch, 1, duh ? 0.5 : 0.87, seed + 3, 1);
  // rep se ob hoji ziblje v nasprotno smer kot noge
  polygon(pts([[37, 15], [53 - nihaj * 2, 10.5 + nihaj], [46, 16], [39, 21]]), ch, 1, duh ? 0.48 : 0.84, seed + 4, 1);
  // sprednja in zadnja noga: ena naprej, druga nazaj
  const n1 = nihaj * 2.2, n2 = -nihaj * 2.2;
  polygon(pts([[24 + n1, 21], [29 + n1, 21], [28 + n1, 29], [22 + n1, 29], [25 + n1, 27]]), ch, 0, 0.9, seed + 5, 1);
  polygon(pts([[32 + n2, 21], [37 + n2, 20], [40 + n2, 28], [34 + n2, 29], [36 + n2, 27]]), ch, 1, 0.9, seed + 6, 1);
  line(m(24), 15 + dvig, m(17), 18 + lean + dvig, "/", 2, 1, 4);
  line(m(17), 18 + lean + dvig, m(14), 17 + lean + dvig, "-", 2, 1, 4);
  line(m(13), 10 + lean + dvig, m(14), 10 + lean + dvig, "o", 3, 1, 6);
  line(m(9), 12 + lean + dvig, m(18), 12 + lean + dvig, "-", 3, 1, 6);
  put(m(10), 12 + lean + dvig, "<", 3, 1, 7);
  for (let x = 22; x <= 37; x += 3) {
    put(m(x), 13 + dvig + Math.sin(x) - Math.abs(x - 29) * 0.08, "^", 2, 1, 5);
  }
}

// ---------- snezni leopard ----------
// Iz druge risbe: mladic hodi proti zogi, jo udari in se z njo zavali. Isti
// jezik kot dinozaver -- telo iz elips, obraz iz znakov, zoga iz obroca.
function addLeopard(api, faza, seed, dx = 0, korak = 0) {
  const { put, line, ellipse, polygon, ring, fill } = api;
  const X = (x) => x + dx;
  const nihaj = Math.sin(korak * Math.PI * 2);
  const dvig = Math.abs(Math.cos(korak * Math.PI * 2)) * 0.5 - 0.25;
  const skok = faza === "skok" ? -3.2 : 0;        // med skokom je v zraku
  const ch = "@#%*+=:.";
  const y0 = 19 + dvig + skok;

  // telo in glava
  ellipse(X(27), y0, 8.4, 4.4, ch, 0, 0.86, seed, 1);
  ellipse(X(17), y0 - 3.4, 4.6, 3.6, ch, 0, 0.9, seed + 1, 1);
  // usesa
  polygon([[X(14), y0 - 6.4], [X(15.6), y0 - 8.8], [X(17), y0 - 6.2]], ch, 1, 0.95, seed + 2, 1);
  polygon([[X(18), y0 - 6.6], [X(19.6), y0 - 9], [X(21), y0 - 6.4]], ch, 1, 0.95, seed + 3, 1);
  // oci, nos, brki
  put(X(15), y0 - 3.8, "o", 3, 1, 8);
  put(X(19), y0 - 3.8, "o", 3, 1, 8);
  put(X(17), y0 - 2.4, "v", 2, 1, 8);
  line(X(12), y0 - 2.6, X(14.5), y0 - 2.9, "-", 2, 1, 5);
  line(X(19.5), y0 - 2.9, X(22), y0 - 2.6, "-", 2, 1, 5);
  // noge: ena naprej, druga nazaj
  const n1 = nihaj * 1.8, n2 = -nihaj * 1.8;
  polygon([[X(21 + n1), y0 + 3], [X(23.6 + n1), y0 + 3], [X(23 + n1), y0 + 7.4], [X(20.6 + n1), y0 + 7.4]], ch, 0, 0.92, seed + 4, 1);
  polygon([[X(30 + n2), y0 + 3], [X(32.6 + n2), y0 + 3], [X(32 + n2), y0 + 7.4], [X(29.6 + n2), y0 + 7.4]], ch, 0, 0.92, seed + 5, 1);
  // rep se zavihti
  const rx = X(35), ry = y0 - 1;
  for (let t = 0; t <= 1.001; t += 0.08) {
    put(rx + t * 8, ry - Math.sin(t * Math.PI) * (4 + nihaj * 1.6) - t * 2, "~", 1, 1, 4);
  }
  // pege
  for (let i = 0; i < 9; i++) {
    const a = hash(i, seed, 3) * TAU, r = hash(i, seed, 4) * 5.4;
    put(X(27) + Math.cos(a) * r, y0 + Math.sin(a) * r * 0.55, "o", 2, 0.9, 6);
  }
  // zoga
  const zx = faza === "kotali" ? X(40) + korak * 4 : X(42);
  const zy = y0 + 4.6;
  ring(zx, zy, 3.4, "o.", 3, 0.9, seed + 6);
  if (faza === "skok") {
    for (const [px, py] of [[X(24), y0 + 9], [X(30), y0 + 9.5], [X(36), y0 + 9]]) {
      put(px, py, "-", 1, 0.7, 3);
    }
  }
}

function zvezdaPoly(cx, cy, outer, inner, n = 5, rot = -Math.PI / 2) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner, a = rot + (i * Math.PI) / n;
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return p;
}

function addStar(api, hrapavost, seed) {
  const { put, polygon, ring, line, polyline } = api;
  const cx = 28 + hrapavost * 0.7, cy = 17;
  const pts = zvezdaPoly(cx, cy, 12, 5.1 + hrapavost, 5, -Math.PI / 2 + hrapavost * 0.04);
  polygon(pts, "*+x:.", 0, 0.78 + hrapavost * 0.04, seed, 1);
  polyline([...pts, pts[0]], hrapavost ? "x+*" : "*+.", 2, 1, 4);
  ring(cx, cy, 14, ".*+", 2, 0.48, seed);
  [[8, 8], [46, 7], [49, 23], [10, 26], [42, 30]].forEach(([x, y], i) => {
    put(x, y, i % 2 ? "+" : "*", i % 3, 0.78 + hash(i, seed) * 0.22, 5);
    if (i < 3 && hrapavost < 0.4) line(x - 1, y, x + 1, y, ".", i % 3, 1, 2);
  });
}

const duhMaska = (x, y) => {
  const head = ((x - 28) / 12) ** 2 + ((y - 13.4) / 7.5) ** 2 <= 1;
  const body = x >= 16.5 && x <= 39.5 && y >= 12 && y <= 22.3;
  const la = ((x - 15.7) / 4.3) ** 2 + ((y - 17.2) / 2.9) ** 2 <= 1;
  const ra = ((x - 40.3) / 4.3) ** 2 + ((y - 17.2) / 2.9) ** 2 <= 1;
  const lobes = [20.5, 28, 35.5].some((cx) => ((x - cx) / 4.5) ** 2 + ((y - 22.1) / 3.4) ** 2 <= 1);
  return (head || body || la || ra || lobes) && y <= 24.3 + Math.sin((x - 17) * 0.72) * 0.9;
};

function addGhost(api, mode, seed) {
  const { put, text, line, fill, ring } = api;
  fill(duhMaska, "@#*+:.", 0, mode === "form" ? 0.64 : 0.86, seed, 1);
  for (let a = Math.PI * 0.92; a <= Math.PI * 2.08; a += 0.09) {
    put(28 + Math.cos(a) * 12.5, 13.4 + Math.sin(a) * 8, a < Math.PI * 1.5 ? "/" : "\\", 2, 1, 4);
  }
  if (mode !== "form") {
    if (mode === "wink") {
      text(20, 14, "---", 4, 8); text(32, 13, "@@@", 4, 8); text(32, 14, "@@@", 4, 8);
      put(32, 13, "*", 3, 1, 9); text(26, 19, "\\w/", 5, 8);
    } else {
      text(20, 13, "@@@", 4, 8); text(20, 14, "@@@", 4, 8);
      text(32, 13, "@@@", 4, 8); text(32, 14, "@@@", 4, 8);
      put(20, 13, "*", 3, 1, 9); put(32, 13, "*", 3, 1, 9); text(26, 19, "\\_/", 5, 8);
    }
    text(18, 18, "oo", 5, 7); text(36, 18, "oo", 5, 7);
    text(21, 10, "^", 4, 7); text(33, 10, "^", 4, 7);
  }
  ring(28, 17, mode === "form" ? 13.5 : 14.3, ".*", 2, mode === "wink" ? 0.38 : 0.24, seed);
  if (mode === "wink") { put(45, 8, "*", 3, 1, 8); line(43, 8, 47, 8, ".", 2, 1, 3); line(45, 6, 45, 10, ".", 2, 1, 3); }
}

const eprPoly = () => [[24, 5], [32, 5], [32, 13], [39, 26], [38, 29], [18, 29], [17, 26], [24, 13]];

function addFlask(api, mode, seed) {
  const { put, text, line, fill, polyline, ring } = api;
  const f = eprPoly();
  fill((x, y) => vPoligonu(x + 0.5, y + 0.5, f) && y >= (mode === "form" ? 23 : 20), "~+o*.", 0, mode === "form" ? 0.58 : 0.83, seed, 1);
  polyline([...f, f[0]], "/\\|_", 2, 1, 5);
  line(23, 5, 33, 5, "=", 3, 1, 6);
  line(25, 8, 31, 8, "-", 1, 1, 4);
  line(18, 21, 38, 21, "~", 3, 1, 6);
  if (mode === "full") {
    text(25, 25, "H2O", 3, 8);
    [[22, 17, "o"], [35, 14, "O"], [16, 11, "o"], [42, 19, "*"], [38, 8, "+"]].forEach(([x, y, c], i) => put(x, y, c, i % 3, 1, 8));
    ring(28, 17, 14.5, "o.*", 1, 0.32, seed);
  } else {
    for (let x = 20; x <= 36; x += 2) put(x, 16 + Math.abs(x - 28) * 0.2, ".", 1, 0.62, 2);
  }
}

function terminal(api, gost, seed) {
  const { put, text, line } = api;
  const l = 10, r = 46, t = 5, b = 29;
  line(l, t, r, t, "-", 2, 1, 5); line(l, b, r, b, "-", 2, 1, 5);
  line(l, t, l, b, "|", 1, 1, 5); line(r, t, r, b, "|", 1, 1, 5);
  [[l, t], [r, t], [l, b], [r, b]].forEach(([x, y]) => put(x, y, "+", 3, 1, 8));
  text(13, 8, "o  o  o", 3, 7);
  line(l + 1, 10, r - 1, 10, "-", 1, 1, 4);
  if (gost) {
    text(14, 14, "const ghost = () => {", 0, 8);
    text(16, 18, "return <JureLabs/>;", 2, 8);
    text(14, 22, "};", 0, 8);
    text(14, 26, ">_ run morph.loop()", 3, 8);
  } else {
    text(14, 15, ">_ initializing", 0, 8);
    text(14, 20, "{  </>  }", 3, 8);
    for (let x = 14; x < 41; x += 3) if (hash(x, seed, 2) > 0.35) put(x, 25, ".:01"[x % 4], x % 3, 0.7, 3);
  }
}

let _slike = null;
function slike() {
  if (_slike) return _slike;
  _slike = [
    narisi(0, (a) => addPour(a, 0.35, 1)),
    narisi(1, (a) => addPour(a, 1, 2)),
    narisi(2, (a) => addPour(a, 1.75, 3)),
    narisi(3, (a) => { addPour(a, 2.45, 4); a.line(7, 28, 48, 28, "~", 0, 1, 2); }),
    narisi(4, (a) => addWave(a, 1.1, 5, true)),
    narisi(5, (a) => addWave(a, 2.05, 6, false)),
    narisi(6, (a) => addWave(a, 3.2, 7, false)),
    // Dinozaver prehodi platno: vsak korak ga premakne za tri celice, noge
    // in rep se izmenjujeta. Ker vmesne slike prehaja morph, je gibanje
    // zvezno in ne poskakuje.
    // Osem slicic koraka, vsaka 260 ms in brez preliva -- to je hoja.
    ...Array.from({ length: 8 }, (_, i) =>
      narisi(7 + i, (a) => addDino(a, false, -0.10 - Math.sin(i / 8 * Math.PI * 2) * 0.06,
        9, false, -14 + i * 3.4, i / 8))),
    narisi(15, (a) => addDino(a, true, 0.22, 10, false, 8, 0.0)),
    // Snezni leopard: pride do zoge, jo udari in se z njo zakotali.
    ...Array.from({ length: 6 }, (_, i) =>
      narisi(16 + i, (a) => addLeopard(a, "hoja", 21, -14 + i * 2.6, i / 6))),
    narisi(22, (a) => addLeopard(a, "skok", 21, 3, 0.5)),
    narisi(23, (a) => addLeopard(a, "kotali", 21, 4, 0.6)),
    narisi(24, (a) => { addStar(a, 0.86, 11); a.ring(28, 17, 9, ".:", 1, 0.22, 31); }),
    narisi(25, (a) => addStar(a, 0, 12)),
    narisi(26, (a) => {
      addGhost(a, "form", 13);
      zvezdaPoly(28, 17, 12, 5.2).forEach(([x, y], i) => { if (i % 2 === 0) a.put(x, y, "*", 3, 0.86, 7); });
    }),
    narisi(27, (a) => addGhost(a, "open", 14)),
    narisi(28, (a) => addGhost(a, "wink", 15)),
    narisi(29, (a) => { addFlask(a, "form", 16); a.ring(28, 18, 12, ".*", 1, 0.24, 16); }),
    narisi(30, (a) => addFlask(a, "full", 17)),
    narisi(31, (a) => terminal(a, false, 18)),
    narisi(32, (a) => terminal(a, true, 19)),
    narisi(33, (a) => {
      terminal(a, false, 20);
      for (let y = 17; y < 34; y++) a.put(38 + Math.sin(y * 0.62) * 1.2, y, "{}[]</>01"[y % 9], y % 3, 1, 9);
    }),
  ];

  return _slike;
}

function asciiZivi(canvas, label) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const f = slike();
  const stDelcev = Math.max(...f.map((x) => x.points.length));

  // Vsaka slika mora imeti enako stevilo delcev, sicer se ob prelivu znaki
  // "rodijo" iz nicesar. Manjkajoce polozimo v sredisce z alfo 0.
  const cilji = f.map((frame, fi) => {
    const src = frame.points;
    const c = src.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
    c.x /= Math.max(1, src.length); c.y /= Math.max(1, src.length);
    return Array.from({ length: stDelcev }, (_, i) => {
      if (i < src.length) return src[i];
      const a = hash(i, fi, 2) * TAU;
      return { x: c.x + Math.cos(a) * 1.4, y: c.y + Math.sin(a) * 0.9, char: ".", color: PALETE[frame.paleta][0], opacity: 0, priority: 0 };
    });
  });

  // Zanka se ne zacne pri "POUR" (skoraj prazna slika), ampak pri duhcu, ki
  // pomaha -- ob odprtju vizitke te takoj nekaj pozdravi.
  let aktivna = 27, zacetek = performance.now(), raf = 0, ustavljeno = false, zadnjaOznaka = "";
  let zadnjiCas = performance.now();

  // Odriv ima dve plasti. Glavna je CELOTA: slika se kot eno telo umakne
  // kazalcu -- to je tisto, kar se vidi, in zato je pocasnejsa in mehkejsa.
  // Druga je drobna razmaknitev posameznih znakov, ki deluje samo tik ob
  // kazalcu; brez nje bi bilo videti kot premikanje nalepke, z veliko pa se
  // slika razleti in postane nemirna.
  const C_DOSEG = 210, C_ODRIV = 0.011, C_VZMET = 0.0060, C_DUSENJE = 0.945, C_NAJVEC = 38;
  const DOSEG = 78, ODRIV = 1.5, VZMET = 0.045, DUSENJE = 0.87;
  let cx0 = 0, cy0 = 0, cvx = 0, cvy = 0;   // odmik celotne slike
  // Celota se ne umika TOCNO tja, kamor kaze miska, in ne isti hip: sledi ji
  // z zamikom in v priblizni smeri. Natancno zrcaljenje kazalca je izgledalo
  // strojno; zamik in rahel zasuk dasta vtis, da se slika umika sama od sebe.
  let mgX = -1e5, mgY = -1e5;
  const odx = new Float32Array(stDelcev), ody = new Float32Array(stDelcev);
  const vx = new Float32Array(stDelcev), vy = new Float32Array(stDelcev);
  let miskaX = -1e5, miskaY = -1e5;

  const naMisko = (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    miskaX = (e.clientX - r.left) * (VIEW_W / r.width);
    miskaY = (e.clientY - r.top) * (VIEW_H / r.height);
  };
  const miskaStran = () => { miskaX = miskaY = -1e5; };
  addEventListener("pointermove", naMisko, { passive: true });
  addEventListener("pointerleave", miskaStran, { passive: true });

  function meri() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = VIEW_W * dpr; canvas.height = VIEW_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function risi(now) {
    if (ustavljeno) return;
    const dt = clamp((now - zadnjiCas) / 16.67, 0.35, 3);   // koraki neodvisni od hitrosti
    zadnjiCas = now;
    let nasl = (aktivna + 1) % f.length, p = 0;
    if (!document.hidden && !REDUCE.matches) {
      const prelivMs = f[aktivna].rez ? 0 : MORPH_MS;
      const krog = f[aktivna].mir + prelivMs;
      const pretecen = now - zacetek;
      if (pretecen >= krog) {
        aktivna = nasl; nasl = (aktivna + 1) % f.length;
        zacetek = now - (pretecen - krog);
      }
      const preliv = f[aktivna].rez ? 0 : MORPH_MS;
      const lok = clamp(now - zacetek, 0, f[aktivna].mir + preliv);
      p = preliv === 0 ? 0
        : lok <= f[aktivna].mir ? 0 : ease3((lok - f[aktivna].mir) / preliv);
    } else {
      zacetek = now;
    }

    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    const cellX = 13.2 / GOSTOTA, cellY = 16.2 / GOSTOTA;
    const ox = (VIEW_W - GRID_W * cellX) / 2 + cellX / 2;
    const oy = (VIEW_H - GRID_H * cellY) / 2 + cellY / 2 + 4;
    const od = cilji[aktivna], doo = cilji[nasl];
    const plava = REDUCE.matches ? 0 : Math.sin(now * 0.0016) * 0.36;

    ctx.font = '600 ' + (15 / GOSTOTA).toFixed(1) +
      'px "SFMono-Regular","Cascadia Code","Consolas","DejaVu Sans Mono",monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Duhec steje enako kot kazalec: ko preleti sliko, jo tudi on odrine.
    let dhX = -1e5, dhY = -1e5;
    if (DUH_POZ) {
      const rr = canvas.getBoundingClientRect();
      if (rr.width) {
        dhX = (DUH_POZ.x - rr.left) * (VIEW_W / rr.width);
        dhY = (DUH_POZ.y - rr.top) * (VIEW_H / rr.height);
      }
    }

    // Zaostala miska: sledi pravi z zamikom, zato se slika ne premika z njo
    // hip na hip. Ce je miska proc, se zaostala mirno vrne v neskoncnost.
    const cilj = Math.hypot(miskaX, miskaY) < 1e4 ? { x: miskaX, y: miskaY }
      : (Math.hypot(dhX, dhY) < 1e4 ? { x: dhX, y: dhY } : null);
    if (cilj) {
      if (mgX < -1e4) { mgX = cilj.x; mgY = cilj.y; }
      const k = 1 - Math.pow(0.90, dt);       // ~10 % na slicico -> viden zamik
      mgX += (cilj.x - mgX) * k;
      mgY += (cilj.y - mgY) * k;
    } else { mgX = -1e5; mgY = -1e5; }

    // Celota: sila deluje iz zaostale miske proti sredini slike in pada z
    // razdaljo. Smer je rahlo zasukana s pocasnim nihanjem, da umik ni
    // natancno nasproten kazalcu.
    const sx0 = ox + (GRID_W / 2) * cellX + cx0;
    const sy0 = oy + (GRID_H / 2) * cellY + cy0;
    const gx = sx0 - mgX, gy = sy0 - mgY;
    const gr2 = gx * gx + gy * gy;
    if (gr2 < C_DOSEG * C_DOSEG) {
      const gd = Math.sqrt(gr2) || 1;
      const f = (1 - gd / C_DOSEG) * C_ODRIV * dt;
      const zasuk = Math.sin(now * 0.00035) * 0.45;      // +-26 stopinj, pocasi
      const cs = Math.cos(zasuk), sn = Math.sin(zasuk);
      const ux = gx / gd, uy = gy / gd;
      cvx += (ux * cs - uy * sn) * f * C_DOSEG;
      cvy += (ux * sn + uy * cs) * f * C_DOSEG;
    }
    cvx -= cx0 * C_VZMET * dt;
    cvy -= cy0 * C_VZMET * dt;
    const gdmp = Math.pow(C_DUSENJE, dt);
    cvx *= gdmp; cvy *= gdmp;
    cx0 += cvx * dt; cy0 += cvy * dt;
    // slika se ne sme odseliti s platna
    const dl = Math.hypot(cx0, cy0);
    if (dl > C_NAJVEC) { cx0 = (cx0 / dl) * C_NAJVEC; cy0 = (cy0 / dl) * C_NAJVEC; }

    for (let i = 0; i < stDelcev; i++) {
      const a = od[i], b = doo[i];
      const alpha = a.opacity + (b.opacity - a.opacity) * p;
      if (alpha <= 0.025) continue;
      const x = a.x + (b.x - a.x) * p, y = a.y + (b.y - a.y) * p;
      // na belem papirju je alfa .76 komaj vidna -> dvignemo spodnjo mejo
      ctx.fillStyle = zmesaj(a.color, b.color, p, 0.42 + alpha * 0.58);
      const diha = aktivna >= 26 && aktivna <= 28 ? Math.sin(now * 0.0026 + x * 0.16) * 0.22 : 0;
      const val = aktivna >= 4 && aktivna <= 7 ? Math.sin(now * 0.004 + x * 0.31) * 0.28 : 0;
      const sx = ox + x * cellX + cx0, sy = oy + (y + plava + diha + val) * cellY + cy0;

      // Kazalec znake odrine, vzmet pa jih vrne na mesto. Sila pada z
      // razdaljo, zato se slika "razmakne" in ne razleti.
      for (const [px, py] of [[miskaX, miskaY], [dhX, dhY]]) {
        const zx = sx + odx[i] - px, zy = sy + ody[i] - py;
        const r2 = zx * zx + zy * zy;
        if (r2 >= DOSEG * DOSEG) continue;
        const d = Math.sqrt(r2) || 1, sila = (1 - d / DOSEG) * ODRIV * dt;
        vx[i] += (zx / d) * sila; vy[i] += (zy / d) * sila;
      }
      vx[i] -= odx[i] * VZMET * dt;
      vy[i] -= ody[i] * VZMET * dt;
      const d2 = Math.pow(DUSENJE, dt);
      vx[i] *= d2; vy[i] *= d2;
      odx[i] += vx[i] * dt; ody[i] += vy[i] * dt;

      ctx.fillText(p < 0.52 ? a.char : b.char, sx + odx[i], sy + ody[i]);
    }

    const o = String(aktivna + 1).padStart(2, "0") + " / " + f[aktivna].label;
    if (label && o !== zadnjaOznaka) { label.textContent = o; zadnjaOznaka = o; }
    raf = requestAnimationFrame(risi);
  }

  meri();
  addEventListener("resize", meri);
  risi(performance.now());        // prva slicica takoj, brez praznega platna
  return () => {
    ustavljeno = true;
    cancelAnimationFrame(raf);
    removeEventListener("resize", meri);
    removeEventListener("pointermove", naMisko);
    removeEventListener("pointerleave", miskaStran);
  };
}

// ---------- vizitka ----------
const IKONE = {
  mail: '<path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15 0 18M12 3c-2.5 2.7-2.5 15 0 18"/>',
  git: '<path d="M9 19c-4 1.4-4-2.2-6-2.7m12 5.2v-3.4c0-1 .1-1.4-.5-2 2.6-.3 5.2-1.3 5.2-5.7a4.4 4.4 0 0 0-1.2-3.1 4.1 4.1 0 0 0-.1-3.1s-1-.3-3.3 1.2a11.3 11.3 0 0 0-6 0C6.8 3.9 5.8 4.2 5.8 4.2a4.1 4.1 0 0 0-.1 3.1 4.4 4.4 0 0 0-1.2 3.1c0 4.4 2.6 5.4 5.2 5.7-.4.4-.5.9-.5 1.5V22"/>',
};
const ikona = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKONE[n]}</svg>`;

function vizitkaMarkup(opro) {
  const vrstica = (ik, txt, href) =>
    `<a class="viz-link" href="${href}" target="_blank" rel="noopener noreferrer">
       <span class="viz-ico">${ikona(ik)}</span><span>${txt}</span></a>`;
  return `
    <button class="viz-close" type="button" aria-label="Zapri vizitko">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="viz-okras" aria-hidden="true"></div>
    <div class="viz-card">
      <div class="viz-pika bl" aria-hidden="true"></div>
      <div class="viz-zvezda a" aria-hidden="true">✦</div>
      <div class="viz-zvezda b" aria-hidden="true">✦</div>

      <div class="viz-vrh viz-vrh-levo">
        <div class="viz-znamka">
          <div class="viz-beseda"><span>JURE</span><span class="b">LABS</span></div>
          <div class="viz-roka">
            <span class="viz-roka-txt">made by jureb</span>
            <span class="viz-srce">♥</span>
            <span class="viz-pero" aria-hidden="true"></span>
          </div>
        </div>
      </div>

      <div class="viz-opro">${
        opro().map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join("")
      }</div>

      <div class="viz-dno">
        <div class="viz-ascii">
          <canvas width="800" height="640" aria-label="ASCII animacija Jure Labs"></canvas>
          <div class="viz-ascii-oznaka"><i></i><span>01 / POUR</span></div>
        </div>
        <div class="viz-epruveta">
          <div class="viz-blob" aria-hidden="true"></div>
          ${epruvetaMarkup()}
        </div>
      </div>

      <div class="viz-meta viz-kot">
        <div class="viz-links">
          ${vrstica("mail", "jure.blatnik10@gmail.com", "mailto:jure.blatnik10@gmail.com")}
          ${vrstica("globe", "www.jurelabs.si", "https://www.jurelabs.si")}
          ${vrstica("git", "github.com/jureeee", "https://github.com/jureeee")}
        </div>
        <div class="viz-meta-t">Spletne aplikacije po meri</div>
        <div class="viz-meta-s">Hitre. Zanesljive. Učinkovite.</div>
        <div class="viz-pika meta" aria-hidden="true"></div>
        </div>
    </div>`;
}

// Ozadje zivi: zvezdice se prizgejo in ugasnejo po celem listu, od spodaj pa
// neprestano prihajajo mehurcki. Oboje je na svoji plasti brez zaznavanja
// miske, da ne moti branja in klikanja.
const ISKRA_D = "M12 0 C12.7 6.6 17.4 11.3 24 12 C17.4 12.7 12.7 17.4 12 24 " +
  "C11.3 17.4 6.6 12.7 0 12 C6.6 11.3 11.3 6.6 12 0 Z";

function okrasje(sheet) {
  const host = sheet.querySelector(".viz-okras");
  if (!host) return () => {};
  let casovniki = [];

  function iskra() {
    if (host.querySelectorAll(".viz-iskra").length > 11) return;
    const d = document.createElement("div");
    d.className = "viz-iskra";
    const v = rand(11, 27);
    d.style.cssText =
      `left:${rand(2, 96).toFixed(1)}%;top:${rand(4, 92).toFixed(1)}%;` +
      `width:${v.toFixed(0)}px;height:${v.toFixed(0)}px;` +
      `animation-duration:${rand(1600, 2700).toFixed(0)}ms`;
    d.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ISKRA_D}"/></svg>`;
    host.appendChild(d);
    d.addEventListener("animationend", () => d.remove());
    setTimeout(() => d.remove(), 3200);          // ce animacije ne tecejo
  }

  function mehurcek() {
    if (host.querySelectorAll(".viz-mehur").length > 15) return;
    const d = document.createElement("div");
    d.className = "viz-mehur";
    const v = rand(9, 34);
    d.style.cssText =
      `left:${rand(-2, 100).toFixed(1)}%;width:${v.toFixed(0)}px;height:${v.toFixed(0)}px;` +
      `--dx:${rand(-70, 70).toFixed(0)}px;--o:${rand(0.45, 0.9).toFixed(2)};` +
      `animation-duration:${rand(9000, 19000).toFixed(0)}ms`;
    host.appendChild(d);
    d.addEventListener("animationend", () => d.remove());
    setTimeout(() => d.remove(), 21000);
  }

  const zanka = (fn, min, max) => {
    const t = setTimeout(() => { if (!document.hidden) fn(); zanka(fn, min, max); }, rand(min, max));
    casovniki.push(t);
    if (casovniki.length > 40) casovniki = casovniki.slice(-8);
  };
  for (let i = 0; i < 5; i++) mehurcek();        // da ne zacne s prazno stranjo
  zanka(iskra, 380, 900);
  zanka(mehurcek, 650, 1500);

  return () => { casovniki.forEach(clearTimeout); host.innerHTML = ""; };
}

// Pisava z nalivnikom: crke se odkrivajo od leve proti desni, konica pa
// potuje tocno po robu odkritega dela. Zato ne rabimo poti crk - iluzijo
// naredi ujemanje maske in konice.
function pisi(root, reduced) {
  const txt = root.querySelector(".viz-roka-txt");
  const pero = root.querySelector(".viz-pero");
  const srce = root.querySelector(".viz-srce");
  if (!txt) return;
  if (reduced) {
    txt.style.clipPath = "inset(0 0 0 0)";
    pero.style.opacity = 0; srce.style.opacity = 1;
    return;
  }
  const w = txt.getBoundingClientRect().width || 220;
  const MS = 1750, KRIVULJA = "cubic-bezier(0.62, 0.02, 0.35, 1)";
  const a1 = txt.animate([{ clipPath: "inset(-25% 100% -35% 0)" }, { clipPath: "inset(-25% -6% -35% 0)" }],
    { duration: MS, easing: KRIVULJA, fill: "backwards" });
  // Varovalka: ce se animacije ne izvedejo (zavihek v ozadju, varcevanje),
  // bi "backwards" pustil napis skrit. Po roku jih odpovemo in obvelja CSS,
  // ki je koncno stanje -- napis je torej viden v vsakem primeru.
  const a2 = pero.animate([
    { transform: "translateX(0) rotate(-16deg)", opacity: 0, offset: 0 },
    { transform: "translateX(0) rotate(-16deg)", opacity: 1, offset: 0.06 },
    { transform: `translateX(${w}px) rotate(-16deg)`, opacity: 1, offset: 0.97 },
    { transform: `translateX(${w + 6}px) rotate(-8deg)`, opacity: 0 },
  ], { duration: MS + 120, easing: KRIVULJA, fill: "backwards" });
  const a3 = srce.animate([
    { opacity: 0, transform: "scale(.4)", offset: 0 },
    { opacity: 0, transform: "scale(.4)", offset: 0.86 },
    { opacity: 1, transform: "scale(1.25)", offset: 0.94 },
    { opacity: 1, transform: "scale(1)" },
  ], { duration: MS + 320, easing: "cubic-bezier(0.16, 1, 0.22, 1)", fill: "backwards" });
  setTimeout(() => [a1, a2, a3].forEach((a) => { try { a.cancel(); } catch {} }), MS + 700);
}

export function mountVizitka(host, opts = {}) {
  const reduced = opts.reduced || (() => REDUCE.matches);
  const opro = opts.opro || (() => []);      // kljucni podatki o programu

  host.innerHTML =
    '<button class="viz-btn" type="button" title="Vizitka" aria-label="Odpri vizitko">' +
      duhecMarkup() +
      '<span class="viz-btn-txt">Vizitka</span>' +
      '<span class="viz-btn-info" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.6"/></svg>' +
      "</span>" +
    "</button>";

  const btn = host.querySelector(".viz-btn");
  duhecZivi(btn.querySelector(".duh"));

  let odprta = null;
  btn.addEventListener("click", () => (odprta ? zapri() : odpri()));

  /**
   * Odrezek, iz katerega ploskev zraste in v katerega se vrne.
   *
   * V Trace Space je bil to stranski meni: vizitka se je razprla iz njega in
   * je bila zato videti kot isti meni, le raztegnjen. Tu stranskega menija
   * ni, zato ploskev raste iz gumba, ki jo je odprl - ista misel, drug izvor.
   */
  function robIzvora() {
    const r = btn.getBoundingClientRect();
    return `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ` +
      `${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 999px)`;
  }

  function odpri() {
    if (odprta) return;
    const sheet = document.createElement("div");
    sheet.className = "viz-sheet";
    sheet.innerHTML = vizitkaMarkup(opro);
    document.body.appendChild(sheet);
    document.documentElement.classList.add("viz-open");

    const mir = reduced();
    const stop = [];
    // duhec zapusti gumb in gre na platno
    let duh = null;
    if (!mir) {
      duh = duhecPoleti(btn.querySelector(".duh").getBoundingClientRect());
      btn.classList.add("leti");
    }
    if (!mir) stop.push(okrasje(sheet));
    stop.push(epruvetaZivi(sheet.querySelector(".epr")));
    stop.push(asciiZivi(sheet.querySelector(".viz-ascii canvas"),
      sheet.querySelector(".viz-ascii-oznaka span")));

    // Meni se raztegne cez stran: odrezek raste iz njegovega roba na cel
    // zaslon. Vsebina je ze na svojem mestu in se samo odkrije - zato ni
    // videti kot okno, ki bi se odprlo nad stranjo, ampak kot isti meni.
    if (!mir) {
      sheet.animate([{ clipPath: robIzvora() }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }],
        { duration: 760, easing: "cubic-bezier(0.16, 1, 0.22, 1)", fill: "backwards" });
      const card = sheet.querySelector(".viz-card");
      [...card.querySelectorAll(".viz-vrh > *, .viz-dno > *")].forEach((el, i) => {
        el.animate([
          { opacity: 0, transform: "translateY(14px) scale(.985)", filter: "blur(9px)" },
          { opacity: 1, transform: "none", filter: "blur(0px)" },
        ], { duration: 620, delay: 260 + i * 90, easing: "cubic-bezier(0.16, 1, 0.22, 1)", fill: "backwards" });
      });
    }
    setTimeout(() => pisi(sheet, mir), mir ? 0 : 620);

    const naTipko = (e) => { if (e.key === "Escape") zapri(); };
    addEventListener("keydown", naTipko);
    sheet.querySelector(".viz-close").addEventListener("click", zapri);

    odprta = { sheet, stop, naTipko, duh };
    btn.classList.add("on");
  }

  function zapri() {
    if (!odprta) return;
    const { sheet, stop, naTipko, duh } = odprta;
    odprta = null;
    removeEventListener("keydown", naTipko);
    btn.classList.remove("on");
    // duhec leti nazaj v gumb; gumb ga spet pokaze sele, ko pristane
    if (duh) duh.vrni(btn.querySelector(".duh").getBoundingClientRect());
    setTimeout(() => btn.classList.remove("leti"), duh ? 640 : 0);
    const konec = () => {
      stop.forEach((f) => f && f());
      if (duh) duh.stop();
      sheet.remove();
      document.documentElement.classList.remove("viz-open");
    };
    if (reduced()) return konec();
    sheet.querySelector(".viz-card").animate(
      [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(10px)" }],
      { duration: 260, easing: "ease-in", fill: "forwards" });
    const a = sheet.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: robIzvora() }],
      { duration: 480, delay: 90, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)", fill: "forwards" });
    a.onfinish = konec;
    setTimeout(() => { if (sheet.isConnected) konec(); }, 700);   // ce slike ne tecejo
  }
}
