/**
 * Izmeri, kako je model Zemlje zasukan glede na poldnevnike in vzporednike.
 *
 * Teksture na tem modelu ne lezijo po zemljepisnih koordinatah. Dokler tega
 * nismo vedeli, sta bili smer pogleda in lega Slovenije nastavljeni na roko -
 * in obris drzave je pristal nad Malo Azijo. To orodje zasuk izmeri; rezultat
 * je matrika V_MODEL v src/cv/zemlja.js.
 *
 * Postopek:
 *
 *   1. Iz mreze se prebere preslikava med teksturnimi koordinatami in lego na
 *      krogli. Model je razrezan na stiri ploscice, vsaka nosi cetrtino
 *      enakokotne karte; iz oglisc sledi lon = lon0 - 182,903 u in
 *      lat = lat0 + 90,876 v.
 *   2. Iz stirih ploscic se sestavi ena karta v okviru modela.
 *   3. Grobi priblizek da nekaj prepoznavnih tock, odcitanih s te karte -
 *      Antarktika, Avstralija, Madagaskar, Nova Zelandija. Sam po sebi je
 *      natancen kaksno stopinjo, kar je za drzavo, siroko dve, premalo.
 *   4. Priblizek se uglasi na obale: zasuk se isce po treh oseh, dokler se
 *      kopno na modelu najbolje ujame s kopnim iz Natural Earth.
 *
 * Preverba je vgrajena: z zastavico --karta orodje izrise karto modela,
 * preslikano z izmerjeno matriko in prekrito z obalami Natural Earth. Ce se
 * obale ujamejo s povrsjem, je matrika prava.
 *
 * Raba:
 *   node orodja/zemlja-zasuk.mjs <pot do ne_10m_admin_0_countries.geojson>
 *
 * Natural Earth je javna domena. Za razpakiranje tekstur potrebuje ffmpeg,
 * enako kot orodja/zemlja.mjs.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const MODEL = "D:/blatnikjuree website/src/assets/3d models/zemlja.glb";
const DRZAVE = process.argv[2];
const KARTA = process.argv.includes("--karta");
const ZACASNO = fs.mkdtempSync(path.join(os.tmpdir(), "zemlja-"));

const STOPINJA = Math.PI / 180;
const smer = (lon, lat) => [
  Math.cos(lat * STOPINJA) * Math.cos(lon * STOPINJA),
  Math.sin(lat * STOPINJA),
  Math.cos(lat * STOPINJA) * Math.sin(lon * STOPINJA),
];
const lonlat = (v) => [
  Math.atan2(v[2], v[0]) / STOPINJA,
  Math.asin(Math.max(-1, Math.min(1, v[1]))) / STOPINJA,
];

// --- 1. branje modela ------------------------------------------------------

const b = fs.readFileSync(MODEL);
if (b.readUInt32LE(0) !== 0x46546c67) throw new Error("ni GLB");
const dolzinaJson = b.readUInt32LE(12);
const j = JSON.parse(b.subarray(20, 20 + dolzinaJson).toString("utf8"));
const binZac = 20 + dolzinaJson + 8;
const bin = b.subarray(binZac, binZac + b.readUInt32LE(20 + dolzinaJson));

const TIP = { 5126: [Float32Array, 4], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5121: [Uint8Array, 1] };
const SIRINA = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function beriPolje(i) {
  const a = j.accessors[i];
  const bv = j.bufferViews[a.bufferView];
  const [Ctor, bajtov] = TIP[a.componentType];
  const n = SIRINA[a.type];
  const zac = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const korak = bv.byteStride || bajtov * n;
  const ven = new Float64Array(a.count * n);
  for (let k = 0; k < a.count; k++) {
    const v = new Ctor(bin.buffer, bin.byteOffset + zac + k * korak, n);
    for (let c = 0; c < n; c++) ven[k * n + c] = v[c];
  }
  return { d: ven, count: a.count };
}

/** Premica skozi oblak tock po metodi najmanjsih kvadratov. */
function premica(xs, ys) {
  const n = xs.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const k = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const a = (sy - k * sx) / n;
  let naj = 0;
  for (let i = 0; i < n; i++) naj = Math.max(naj, Math.abs(ys[i] - (a + k * xs[i])));
  return { a, k, naj };
}

/**
 * Iz vsake ploscice preberi, kateri kos karte nosi.
 *
 * Dolzina se pri dveh ploscicah zavije cez 180. stopinjo in bi premica skoznjo
 * dala nesmisel; ker sta polovici natanko 180 stopinj narazen, zadostuje, da
 * eno izmerimo in drugo zamaknemo.
 */
const ploscice = [];
for (let m = 0; m < 4; m++) {
  const p = j.meshes[m].primitives[0];
  const pos = beriPolje(p.attributes.POSITION);
  const uv = beriPolje(p.attributes.TEXCOORD_0);
  const us = [], loni = [], vs = [], lati = [];
  let sidro = null;
  for (let k = 0; k < pos.count; k++) {
    const x = pos.d[k * 3], y = pos.d[k * 3 + 1], z = pos.d[k * 3 + 2];
    const r = Math.hypot(x, y, z);
    const lat = Math.asin(Math.max(-1, Math.min(1, y / r))) / STOPINJA;
    if (Math.abs(lat) > 88) continue;              // pri polu je dolzina nedolocena
    let lon = Math.atan2(z, x) / STOPINJA;
    if (sidro === null) sidro = lon;
    while (lon - sidro > 180) lon -= 360;
    while (lon - sidro < -180) lon += 360;
    us.push(uv.d[k * 2]); loni.push(lon); vs.push(uv.d[k * 2 + 1]); lati.push(lat);
  }
  const fu = premica(us, loni), fv = premica(vs, lati);
  ploscice.push({
    ime: j.materials[p.material].name,
    mesh: m,
    slika: j.textures[j.materials[p.material].pbrMetallicRoughness.baseColorTexture.index].source,
    lon0: fu.a, lonK: fu.k, lat0: fv.a, latK: fv.k,
  });
}
// Ploscici, ki jima je premica padla cez zavoj dolzine, popravi na sosednjo vejo.
const dobri = ploscice.filter((p) => Math.abs(p.lonK + 182.903) < 1);
if (!dobri.length) throw new Error("dolzine ni bilo mogoce izmeriti");
for (const p of ploscice) {
  if (Math.abs(p.lonK + 182.903) < 1) continue;
  p.lonK = dobri[0].lonK;
  p.lon0 = dobri[0].lon0 - 180;
}
for (const p of ploscice) {
  console.log(
    p.ime.padEnd(8), "lon =", p.lon0.toFixed(3), p.lonK.toFixed(3), "* u  |  lat =",
    p.lat0.toFixed(3), p.latK.toFixed(3), "* v"
  );
}

// --- 2. teksture v surovo sliko -------------------------------------------

const T = 1024;
for (const p of ploscice) {
  const im = j.images[p.slika];
  const bv = j.bufferViews[im.bufferView];
  const vhod = path.join(ZACASNO, `p${p.mesh}.webp`);
  const izhod = path.join(ZACASNO, `p${p.mesh}.raw`);
  fs.writeFileSync(vhod, bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", vhod, "-vf", `scale=${T}:${T}`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", izhod]);
  p.piksli = fs.readFileSync(izhod);
}

/** Barva na modelu pri dani legi v njegovem okviru. */
function barva(lon, lat) {
  let naj = null, cena = Infinity;
  for (const p of ploscice) for (const zamik of [-360, 0, 360]) {
    const u = (lon + zamik - p.lon0) / p.lonK;
    const v = (lat - p.lat0) / p.latK;
    const k = Math.max(0, -u, u - 1) + Math.max(0, -v, v - 1);
    if (k < cena) { cena = k; naj = { p, u, v }; }
  }
  const px = Math.max(0, Math.min(T - 1, (naj.u * T - 0.5) | 0));
  const py = Math.max(0, Math.min(T - 1, (naj.v * T - 0.5) | 0));
  const i = (py * T + px) * 3;
  return [naj.p.piksli[i], naj.p.piksli[i + 1], naj.p.piksli[i + 2]];
}

/**
 * Kako zelo je tocka videti kot kopno; negativno je morje.
 *
 * Morje je temno in modro, kopno zeleno ali pesceno, led pa bel - zato sama
 * razlika med rdeco in modro ledu ne loci od morja in ji je treba dodati se
 * svetlost.
 */
function kopnost(lon, lat) {
  const [r, g, b2] = barva(lon, lat);
  const svetlost = 0.299 * r + 0.587 * g + 0.114 * b2;
  return Math.max(-60, Math.min(60, r - b2 + 0.25 * svetlost)) / 60;
}

// --- 3. grobi priblizek iz prepoznavnih tock -------------------------------

/**
 * Odcitano s karte modela: kje na njej lezijo stvari, ki jih ni mogoce
 * zamenjati. Juzni tecaj je sredisce Antarktike, zato je njegova dolzina
 * poljubna.
 */
const TOCKE = [
  { ime: "juzni tecaj",    model: [81.0, 19.7],   pravo: [0, -90] },
  { ime: "Avstralija",     model: [134.7, -13.7], pravo: [134.0, -25.5] },
  { ime: "Madagaskar",     model: [45.5, -40.1],  pravo: [46.9, -19.4] },
  { ime: "Nova Zelandija", model: [132.9, 21.4],  pravo: [172.5, -41.5] },
];

const norm = (v) => { const n = Math.hypot(...v); return v.map((x) => x / n); };
const pik = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const kriz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const stolpci = (a, b2, c) => [[a[0], b2[0], c[0]], [a[1], b2[1], c[1]], [a[2], b2[2], c[2]]];
const transp = (A) => A[0].map((_, i) => A.map((r) => r[i]));
const zmnozi = (A, B) => A.map((r) => B[0].map((_, k) => r.reduce((s, v, i) => s + v * B[i][k], 0)));
const uporabi = (R, v) => [0, 1, 2].map((i) => R[i][0] * v[0] + R[i][1] * v[1] + R[i][2] * v[2]);

/**
 * Nasa formula za smer steje dolzino v drugo stran kot model, zato gre skozi
 * zrcaljenje. V koncni matriki je to negativni tretji stolpec.
 */
const zrcali = (g) => [g[0], g[1], -g[2]];

/** Iz dveh ujemanj: iz vsakega zgradi pravokotno bazo in ju poravnaj. */
function izDveh(g1, l1, g2, l2) {
  const a1 = norm(g1), b1 = norm(l1);
  const a2 = norm(g2.map((x, i) => x - pik(g2, a1) * a1[i]));
  const b2 = norm(l2.map((x, i) => x - pik(l2, b1) * b1[i]));
  return zmnozi(stolpci(b1, b2, kriz(b1, b2)), transp(stolpci(a1, a2, kriz(a1, a2))));
}

const pari = TOCKE.map((t) => [zrcali(smer(...t.pravo)), smer(...t.model)]);
let R = izDveh(pari[0][0], pari[0][1], pari[1][0], pari[1][1]);
console.log("\ngrobi priblizek:");
for (const t of TOCKE) {
  const l = lonlat(uporabi(R, zrcali(smer(...t.pravo))));
  console.log("  ", t.ime.padEnd(15), "napoved", l.map((x) => x.toFixed(1)).join(", "), "| odcitano", t.model.join(", "));
}

// --- 4. uglasitev na obale -------------------------------------------------

if (!DRZAVE) {
  console.log("\nBrez datoteke Natural Earth se ustavim pri grobem priblizku.");
  process.exit(0);
}

/** Rastrska maska kopnega, z vrstnim polnjenjem mnogokotnikov. */
function maskaKopnega(S, V) {
  const g = JSON.parse(fs.readFileSync(DRZAVE, "utf8"));
  const obroci = [];
  for (const f of g.features) {
    const geo = f.geometry;
    if (!geo) continue;
    const mp = geo.type === "Polygon" ? [geo.coordinates] : geo.type === "MultiPolygon" ? geo.coordinates : [];
    for (const poly of mp) for (const obroc of poly) obroci.push(obroc);
  }
  const m = new Uint8Array(S * V);
  for (let y = 0; y < V; y++) {
    const lat = 90 - ((y + 0.5) / V) * 180;
    const preseki = [];
    for (const r of obroci) {
      for (let i = 0, n = r.length; i < n; i++) {
        const a = r[i], b2 = r[(i + 1) % n];
        if ((a[1] <= lat && b2[1] > lat) || (b2[1] <= lat && a[1] > lat)) {
          const t = (lat - a[1]) / (b2[1] - a[1]);
          preseki.push(a[0] + t * (b2[0] - a[0]));
        }
      }
    }
    preseki.sort((p, q) => p - q);
    for (let i = 0; i + 1 < preseki.length; i += 2) {
      const x0 = Math.max(0, Math.ceil(((preseki[i] + 180) / 360) * S - 0.5));
      const x1 = Math.min(S - 1, Math.floor(((preseki[i + 1] + 180) / 360) * S - 0.5));
      for (let x = x0; x <= x1; x++) m[y * S + x] = 1;
    }
  }
  return m;
}

/**
 * Merimo le ob obalah.
 *
 * Sredina celine in sredina oceana o zasuku ne povesta nicesar - obe sta
 * enaki, ce je zasuk za stopinjo mimo. Vsa vednost je na crti med njima.
 */
const S = 720, V = 360;
const maska = maskaKopnega(S, V);
const obala = [];
for (let y = 1; y < V - 1; y++) for (let x = 0; x < S; x++) {
  const c = maska[y * S + x];
  const rob = maska[y * S + ((x + 1) % S)] !== c || maska[y * S + ((x + S - 1) % S)] !== c ||
              maska[(y - 1) * S + x] !== c || maska[(y + 1) * S + x] !== c;
  if (!rob) continue;
  const lat = 90 - ((y + 0.5) / V) * 180;
  const lon = -180 + ((x + 0.5) / S) * 360;
  obala.push({ g: zrcali(smer(lon, lat)), znak: c ? 1 : -1, teza: Math.cos(lat * STOPINJA) });
}
console.log("\nobalnih celic:", obala.length);

function cena(M) {
  let s = 0;
  for (const t of obala) {
    const [lon, lat] = lonlat(uporabi(M, t.g));
    s += t.znak * kopnost(lon, lat) * t.teza;
  }
  return -s;
}
const okoliOsi = (os, kot) => {
  const [x, y, z] = os, c = Math.cos(kot), s = Math.sin(kot), t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
};

let najbolje = cena(R);
console.log("ujemanje pred uglasitvijo:", (-najbolje).toFixed(1));
for (let korak = 0.03; korak > 2e-5; korak *= 0.6) {
  let boljse = true;
  while (boljse) {
    boljse = false;
    for (const os of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) for (const znak of [1, -1]) {
      const M = zmnozi(okoliOsi(os, znak * korak), R);
      const c = cena(M);
      if (c < najbolje - 1e-9) { najbolje = c; R = M; boljse = true; }
    }
  }
}
console.log("ujemanje po uglasitvi: ", (-najbolje).toFixed(1));

// Zrcaljenje zlozimo v matriko: tretji stolpec dobi nasprotni predznak.
const V_MODEL = R.map((r) => [r[0], r[1], -r[2]]);
console.log("\nV_MODEL za src/cv/zemlja.js:\n");
for (const r of V_MODEL) console.log("  " + r.map((x) => x.toFixed(8)).join(", ") + ",");

// --- preverba: karta modela z narisanimi obalami ---------------------------

if (KARTA) {
  const SK = 2048, VK = 1024;
  const slika = Buffer.alloc(SK * VK * 3);
  for (let y = 0; y < VK; y++) for (let x = 0; x < SK; x++) {
    const [lon, lat] = lonlat(uporabi(R, zrcali(smer(-180 + ((x + 0.5) / SK) * 360, 90 - ((y + 0.5) / VK) * 180))));
    const [r, g, b2] = barva(lon, lat);
    const d = (y * SK + x) * 3;
    slika[d] = r; slika[d + 1] = g; slika[d + 2] = b2;
  }
  const g = JSON.parse(fs.readFileSync(DRZAVE, "utf8"));
  const vSliko = (lon, lat) => [Math.round(((lon + 180) / 360) * SK), Math.round(((90 - lat) / 180) * VK)];
  for (const f of g.features) {
    const geo = f.geometry;
    if (!geo) continue;
    const mp = geo.type === "Polygon" ? [geo.coordinates] : geo.type === "MultiPolygon" ? geo.coordinates : [];
    for (const poly of mp) for (const obroc of poly) for (let i = 0; i + 1 < obroc.length; i++) {
      const [x0, y0] = vSliko(...obroc[i]), [x1, y1] = vSliko(...obroc[i + 1]);
      if (Math.abs(x1 - x0) > SK / 2) continue;
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + ((x1 - x0) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
        if (x < 0 || x >= SK || y < 0 || y >= VK) continue;
        const d = (y * SK + x) * 3;
        slika[d] = 255; slika[d + 1] = 40; slika[d + 2] = 40;
      }
    }
  }
  const surovo = path.join(ZACASNO, "karta.raw");
  fs.writeFileSync(surovo, slika);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
    "-s", `${SK}x${VK}`, "-i", surovo, "zemlja-preverba.png"]);
  console.log("\npreverba: zemlja-preverba.png");
}
