/**
 * Lebdenje nad sliko v galeriji.
 *
 * Ko je kazalec nad sliko, se ta dvigne iz mreze: nad poljem se pojavi njena
 * kopija, ki se iz izreza polja razpre v PRAVO razmerje slike in je malo vecja
 * - vidis celo sliko, ne le tisto, kar je polje odrezalo. Za njo se svet
 * rahlo zabrise, da je jasno, kaj je spredaj.
 *
 * Kopija je zunaj mreze in lebdi nad njo. Ce bi se raztegnilo polje samo, bi
 * se premaknila cela mreza pod njim.
 *
 * Po petih sekundah pod kazalcem se slika prelije v rebrasto steklo: navpicna
 * rebra, vsako lomi sliko s svojim zamikom, rahlo se nagnejo za kazalcem.
 * Sencilnik je iz demonstracije "Glassform" (Codegrid), ki jo je prinesel
 * lastnik strani; tu je na golem WebGL in brez knjiznice. Na zacetku je steklo
 * nic in platno je natanko enako sliki, zato prehoda ni videti - rebra
 * zrastejo iz ravne slike.
 *
 * Klik slike ne odpre takoj. Najprej se malo stisne in nato poci navzven v sij
 * - izpuhti - in sele za tem se odpre ogled s svojim valom.
 *
 * Video dobi vse isto. Dvigne se ISTI predvajalnik, ki je bil v polju - preseli
 * se v dvignjeni okvir in tece naprej, brez drugega prenosa in brez zacetka od
 * nule. Steklo pa v vsaki slicici znova vzame trenutno slicico posnetka. Ko se
 * okvir spusti, gre predvajalnik nazaj v polje, v okvirju pa ostane njegova
 * zadnja slicica, da je odhod poln.
 */

import "./lebdenje.css";

/** Toliko mora kazalec obstati nad poljem, da se dvigne - prehod cez mrezo ne sme prizgati vsakega. */
const ZAMIK_MS = 110;
/** Za koliko je dvignjena slika vecja od polja, po dolzini. */
const POVECAVA = 1.12;
/** Kdaj se slika prelije v steklo in koliko casa se preliva. */
const STEKLO_PO_MS = 5000;
const STEKLO_TRAJA_MS = 1400;
/** Koliko sme kazalec zaiti cez rob, preden se slika spusti. */
const TOLERANCA = 8;
/** Koliko traja pok, preden pride ogled. */
const POK_MS = 380;

/** Nastavitve stekla - iste kot v izvirni demonstraciji. */
const STEKLO = {
  rebra: 35,
  moc: 2,
  gladkost: 0.0001,
  rob: 0.1,
  paralaksa: 0.1,
  izkrivljenje: 10,
};

const VERTEX = `
attribute vec2 lega;
varying vec2 vUv;
void main() {
  vUv = lega * 0.5 + 0.5;
  gl_Position = vec4(lega, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
uniform sampler2D uSlika;
uniform vec2 uLoc;
uniform vec2 uMere;
uniform vec2 uMiska;
uniform float uSteklo;
uniform float uRebra;
uniform float uMoc;
uniform float uGladkost;
uniform float uRob;
uniform float uParalaksa;
uniform float uIzkrivljenje;
varying vec2 vUv;

// Izrez kot pri object-fit: cover - platno in slika imata lahko razlicno razmerje.
vec2 pokrij(vec2 uv) {
  vec2 s = uLoc / uMere;
  float m = max(s.x, s.y);
  vec2 v = uMere * m;
  vec2 o = (uLoc - v) * 0.5;
  return (uv * uLoc - o) / v;
}

// Zobati zamik: znotraj vsakega rebra raste in na njegovem robu skoci nazaj.
float premik(float x) { return mod(x, 1.0 / uRebra) * uMoc; }

// Povprecje sosednjih zamikov zgladi ostri skok na robu rebra.
float steklo(float x) {
  float d = 0.0;
  for (int i = -5; i <= 5; i++) d += premik(x + float(i) * uGladkost);
  return x + d / 11.0;
}

// Ob levem in desnem robu steklo pojema, da slika ne pobegne cez rob.
float rob(float x) {
  if (x < uRob) return smoothstep(0.0, uRob, x);
  if (x > 1.0 - uRob) return smoothstep(1.0, 1.0 - uRob, x);
  return 1.0;
}

void main() {
  vec2 uv = vUv;
  float x0 = uv.x;
  float r = rob(x0) * uSteklo;
  uv.x = mix(x0, steklo(x0), r);
  float izk = uv.x - x0;
  float smer = -sign(0.5 - uMiska.x);
  uv.x += smer * abs(uMiska.x - 0.5) * uParalaksa * (1.0 + abs(izk) * uIzkrivljenje) * r;
  gl_FragColor = texture2D(uSlika, clamp(pokrij(uv), 0.0, 1.0));
}
`;

/** En izrisovalnik za vse - naenkrat je dvignjena ena sama slika. */
let pogon = null;
let pogonSpodletel = false;

function pripraviPogon() {
  if (pogon || pogonSpodletel) return pogon;
  try {
    const platno = document.createElement("canvas");
    const gl = platno.getContext("webgl", { premultipliedAlpha: false, antialias: true });
    if (!gl) throw new Error("brez WebGL");
    const prevedi = (tip, izvor) => {
      const sh = gl.createShader(tip);
      gl.shaderSource(sh, izvor);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const program = gl.createProgram();
    gl.attachShader(program, prevedi(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, prevedi(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);
    const trak = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trak);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const lega = gl.getAttribLocation(program, "lega");
    gl.enableVertexAttribArray(lega);
    gl.vertexAttribPointer(lega, 2, gl.FLOAT, false, 0, 0);
    const u = (ime) => gl.getUniformLocation(program, ime);
    const enote = {
      loc: u("uLoc"), mere: u("uMere"), miska: u("uMiska"), steklo: u("uSteklo"),
    };
    gl.uniform1i(u("uSlika"), 0);
    gl.uniform1f(u("uRebra"), STEKLO.rebra);
    gl.uniform1f(u("uMoc"), STEKLO.moc);
    gl.uniform1f(u("uGladkost"), STEKLO.gladkost);
    gl.uniform1f(u("uRob"), STEKLO.rob);
    gl.uniform1f(u("uParalaksa"), STEKLO.paralaksa);
    gl.uniform1f(u("uIzkrivljenje"), STEKLO.izkrivljenje);
    const tekstura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tekstura);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    pogon = { platno, gl, enote, tekstura };
    return pogon;
  } catch {
    pogonSpodletel = true;
    return null;
  }
}

const gladko = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const jeVideo = (m) => m instanceof HTMLVideoElement;
/** Prave mere vsebine polja - slike ali posnetka. */
const mereOd = (m) => (jeVideo(m) ? { w: m.videoWidth, h: m.videoHeight } : { w: m.naturalWidth, h: m.naturalHeight });
/** Ali je v vsebini ze kaj za pokazati. */
const pripravljeno = (m) => (jeVideo(m) ? m.readyState >= 2 && m.videoWidth > 0 : m.complete && m.naturalWidth > 0);

/**
 * @param {HTMLElement} mreza galerija
 * @param {{ klik: (polje: HTMLElement) => void }} moznosti klik na dvignjeno sliko
 */
export function namestiLebdenje(mreza, { klik }) {
  const mirno = matchMedia("(prefers-reduced-motion: reduce)");

  const zavesa = document.createElement("div");
  zavesa.className = "lebdi-zavesa";
  document.body.appendChild(zavesa);

  let aktivno = null;
  let cakamo = null;
  /** Polje pod kazalcem - posnetek, ki se se nalaga, se dvigne le, ce je kazalec se tam. */
  let nad = null;
  /**
   * Polje, ki je pravkar poknilo. Kazalec je po kliku se nad njim in brez tega
   * bi se med pokom dvignilo znova - pod ogledom. Zaklep pade, ko kazalec polje
   * zapusti.
   */
  let zaklenjeno = null;
  const miska = { x: 0, y: 0, u: 0.5, cilj: 0.5 };

  /** Kam se dvigne: sredisce polja, pravo razmerje slike, malo vecja, v zaslonu. */
  function cilj(r, slika) {
    const m = mereOd(slika);
    const razmerje = m.w / Math.max(1, m.h);
    const ploscina = r.width * r.height * POVECAVA * POVECAVA;
    let w = Math.sqrt(ploscina * razmerje);
    let h = w / razmerje;
    const naj = Math.min(1, (innerWidth * 0.9) / w, (innerHeight * 0.88) / h);
    w *= naj;
    h *= naj;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const left = Math.min(Math.max(12, cx - w / 2), innerWidth - w - 12);
    const top = Math.min(Math.max(12, cy - h / 2), innerHeight - h - 12);
    return { left, top, width: w, height: h };
  }

  const postavi = (el, r) => {
    el.style.left = `${r.left}px`;
    el.style.top = `${r.top}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  };

  function dvigni(polje) {
    const video = polje.querySelector("video");
    const slika = video || polje.querySelector("img:not(.prof-sij)");
    if (!slika) return;
    if (!pripravljeno(slika)) {
      // Posnetek se se nalaga: dvigne se, ko pride prva slicica, ce je kazalec se nad njim.
      if (video) {
        video.addEventListener(
          "loadeddata",
          () => { if (nad === polje && aktivno?.polje !== polje && zaklenjeno !== polje) dvigni(polje); },
          { once: true }
        );
      }
      return;
    }
    spusti(true);

    const r = polje.getBoundingClientRect();
    const ovoj = document.createElement("div");
    ovoj.className = "lebdi";
    if (!video) ovoj.innerHTML = `<img alt="" src="${slika.currentSrc || slika.src}" />`;
    postavi(ovoj, r);
    document.body.appendChild(ovoj);
    if (video) {
      // Selitev v istem opravilu - brskalnik predvajalnika ne ustavi, ker ni
      // nikoli zares zunaj strani.
      ovoj.appendChild(video);
      video.play().catch(() => {});
    }
    void ovoj.offsetWidth;
    postavi(ovoj, cilj(r, slika));
    zavesa.classList.add("vidno");

    ovoj.addEventListener("click", (e) => {
      e.stopPropagation();
      klik(polje);
    });

    aktivno = {
      polje, ovoj, slika, video,
      steklo: 0, stekloOd: 0, zanka: null,
      casovnik: mirno.matches ? null : setTimeout(() => prizgiSteklo(), STEKLO_PO_MS),
    };
  }

  function prizgiSteklo() {
    if (!aktivno) return;
    const p = pripraviPogon();
    if (!p) return;
    const a = aktivno;
    const r = a.ovoj.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    p.platno.width = Math.max(2, Math.round(r.width * dpr));
    p.platno.height = Math.max(2, Math.round(r.height * dpr));
    p.gl.viewport(0, 0, p.platno.width, p.platno.height);
    p.gl.bindTexture(p.gl.TEXTURE_2D, p.tekstura);
    p.gl.texImage2D(p.gl.TEXTURE_2D, 0, p.gl.RGBA, p.gl.RGBA, p.gl.UNSIGNED_BYTE, a.slika);
    p.gl.uniform2f(p.enote.loc, p.platno.width, p.platno.height);
    const m = mereOd(a.slika);
    p.gl.uniform2f(p.enote.mere, m.w, m.h);
    a.ovoj.appendChild(p.platno);
    a.stekloOd = performance.now();
    miska.u = miska.cilj;

    const slicica = (ms) => {
      if (aktivno !== a) return;
      a.zanka = requestAnimationFrame(slicica);
      a.steklo = gladko(Math.min((ms - a.stekloOd) / STEKLO_TRAJA_MS, 1));
      miska.u += (miska.cilj - miska.u) * 0.06;
      // Posnetek tece naprej tudi pod steklom: vsaka slicica gre znova v teksturo.
      if (a.video && a.video.readyState >= 2) {
        p.gl.bindTexture(p.gl.TEXTURE_2D, p.tekstura);
        p.gl.texImage2D(p.gl.TEXTURE_2D, 0, p.gl.RGBA, p.gl.RGBA, p.gl.UNSIGNED_BYTE, a.video);
      }
      p.gl.uniform1f(p.enote.steklo, a.steklo);
      p.gl.uniform2f(p.enote.miska, miska.u, 0.5);
      p.gl.drawArrays(p.gl.TRIANGLE_STRIP, 0, 4);
    };
    a.zanka = requestAnimationFrame((ms) => {
      slicica(ms);
      // Platno pokazemo sele, ko je v njem prva slicica - prej je prazno.
      a.ovoj.classList.add("steklo");
    });
  }

  /**
   * Predvajalnik gre nazaj v svoje polje. Ce okvir se odhaja, v njem ostane
   * zadnja slicica - sicer bi odhajal prazen.
   */
  function vrniVideo(a, posnetek) {
    const v = a.video;
    if (!v || v.parentElement === a.polje) return;
    if (posnetek && v.videoWidth) {
      const c = document.createElement("canvas");
      const s = Math.min(1, 900 / v.videoWidth);
      c.width = Math.max(1, Math.round(v.videoWidth * s));
      c.height = Math.max(1, Math.round(v.videoHeight * s));
      c.className = "lebdi-posnetek";
      try {
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      } catch {
        // brez slicice okvir le izgine
      }
      a.ovoj.insertBefore(c, a.ovoj.firstChild);
    }
    a.polje.appendChild(v);
    if (a.polje.classList.contains("igra")) v.play().catch(() => {});
    else v.pause();
  }

  /** Slika se spusti nazaj v polje; takoj = brez gibanja (drsenje, zaprt profil). */
  function spusti(takoj = false) {
    clearTimeout(cakamo);
    cakamo = null;
    const a = aktivno;
    if (!a) return;
    aktivno = null;
    clearTimeout(a.casovnik);
    if (a.zanka) cancelAnimationFrame(a.zanka);
    if (pogon && pogon.platno.parentElement === a.ovoj) a.ovoj.removeChild(pogon.platno);
    vrniVideo(a, !takoj && a.polje.isConnected);
    zavesa.classList.remove("vidno");
    if (takoj || !a.polje.isConnected) {
      a.ovoj.remove();
      return;
    }
    postavi(a.ovoj, a.polje.getBoundingClientRect());
    a.ovoj.classList.add("odhaja");
    setTimeout(() => a.ovoj.remove(), 420);
  }

  /** Pok ob kliku. Vrne obljubo, ki se izpolni, ko je slika izpuhtela. */
  function pokni(polje) {
    zaklenjeno = polje;
    const a = aktivno;
    if (!a || a.polje !== polje || mirno.matches) {
      spusti(true);
      return Promise.resolve();
    }
    aktivno = null;
    clearTimeout(a.casovnik);
    if (a.zanka) cancelAnimationFrame(a.zanka);
    vrniVideo(a, true);
    a.ovoj.classList.add("poka");
    return new Promise((res) => {
      setTimeout(() => {
        if (pogon && pogon.platno.parentElement === a.ovoj) a.ovoj.removeChild(pogon.platno);
        a.ovoj.remove();
        zavesa.classList.remove("vidno");
        res();
      }, POK_MS);
    });
  }

  const znotraj = (r, x, y) =>
    x >= r.left - TOLERANCA && x <= r.right + TOLERANCA && y >= r.top - TOLERANCA && y <= r.bottom + TOLERANCA;

  mreza.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch" || mirno.matches) return;
    const polje = e.target instanceof Element ? e.target.closest(".prof-polje") : null;
    nad = polje;
    if (!polje || aktivno?.polje === polje || polje === zaklenjeno) return;
    clearTimeout(cakamo);
    cakamo = setTimeout(() => dvigni(polje), ZAMIK_MS);
  });
  mreza.addEventListener("pointerout", (e) => {
    const iz = e.target instanceof Element ? e.target.closest(".prof-polje") : null;
    const v = e.relatedTarget instanceof Element ? e.relatedTarget.closest(".prof-polje") : null;
    if (iz && iz !== v) {
      nad = v;
      if (iz === zaklenjeno) zaklenjeno = null;
    }
    if (iz && iz !== v && !aktivno) {
      clearTimeout(cakamo);
      cakamo = null;
    }
  });

  addEventListener(
    "pointermove",
    (e) => {
      miska.x = e.clientX;
      miska.y = e.clientY;
      const a = aktivno;
      if (!a) return;
      const ro = a.ovoj.getBoundingClientRect();
      miska.cilj = Math.min(1, Math.max(0, (e.clientX - ro.left) / Math.max(1, ro.width)));
      if (!znotraj(ro, e.clientX, e.clientY) && !znotraj(a.polje.getBoundingClientRect(), e.clientX, e.clientY)) {
        spusti();
      }
    },
    { passive: true }
  );
  // Ce mreza zdrsi, dvignjena slika ne sodi vec nad svoje polje.
  addEventListener("scroll", () => spusti(true), { passive: true, capture: true });
  addEventListener("resize", () => spusti(true));

  return { spusti, pokni };
}
