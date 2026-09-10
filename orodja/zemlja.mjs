/**
 * Predelava modela Zemlje za splet.
 *
 * Izvirnik je 18 MB in nosi stvari, ki jih na tej strani ne bomo videli:
 * oblake, ki bi zakrili prav tiste nocne luci, zaradi katerih model jemljemo;
 * karte hrapavosti, ki jih na majhnem globusu ni mogoce lociti; in normale,
 * ki na nocni strani ne naredijo nicesar, nosijo pa s sabo se tangente v
 * geometriji.
 *
 * Ostane, kar se vidi: barva, nocne luci in atmosfera.
 *
 * Teksture gredo v WebP. Nalozi jih brskalnik in ne glTF, zato zadostuje, da
 * je mimeType pravilen - razsiritev EXT_texture_webp bi tu le zahtevala
 * nadomestno sliko v PNG, torej natanko tisto, cesar se hocemo znebiti.
 */

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const VHOD = "D:/blatnikjuree website/modeli/earth/earth_-_16k_high_resolution.glb";
const IZHOD = "D:/blatnikjuree website/src/assets/3d models/zemlja.glb";
const ZACASNO = process.argv[2] || ".";
const KAKOVOST = 82;

// --- branje ----------------------------------------------------------------
const b = fs.readFileSync(VHOD);
if (b.readUInt32LE(0) !== 0x46546c67) throw new Error("ni GLB");
const dolzinaJson = b.readUInt32LE(12);
const j = JSON.parse(b.subarray(20, 20 + dolzinaJson).toString("utf8"));
const binZac = 20 + dolzinaJson + 8;
const bin = b.subarray(binZac, binZac + b.readUInt32LE(20 + dolzinaJson));

const bajti = (n) => (n / 1048576).toFixed(2) + " MB";
console.log("izvirnik:", bajti(b.length), "| mrez:", j.meshes.length, "| slik:", j.images.length);

// --- kaj ostane ------------------------------------------------------------
const oblak = (i) => (j.materials[i]?.name || "").startsWith("Clouds");
const mreze = j.meshes.map((_, i) => i).filter((i) => !j.meshes[i].primitives.some((p) => oblak(p.material)));
console.log("mreze, ki ostanejo:", mreze.map((i) => j.meshes[i].name).join(", "));

// Vozlisca: obdrzimo tista, ki nimajo mreze (so ogrodje) ali imajo obdrzano.
const vozlisceOk = j.nodes.map((n) => n.mesh === undefined || mreze.includes(n.mesh));

// --- materiali brez odvecnih kart ------------------------------------------
const materiali = [];
for (let i = 0; i < j.materials.length; i++) {
  if (oblak(i)) continue;
  const m = JSON.parse(JSON.stringify(j.materials[i]));
  delete m.normalTexture;
  delete m.occlusionTexture;
  if (m.pbrMetallicRoughness) {
    delete m.pbrMetallicRoughness.metallicRoughnessTexture;
    m.pbrMetallicRoughness.metallicFactor = 0;
    m.pbrMetallicRoughness.roughnessFactor = 1;
  }
  materiali.push({ star: i, m });
}

// --- zbiranje tega, kar je se v rabi ---------------------------------------
const rabTekstur = new Set();
for (const { m } of materiali) {
  const p = m.pbrMetallicRoughness || {};
  for (const t of [p.baseColorTexture, m.emissiveTexture]) if (t) rabTekstur.add(t.index);
}
const teksture = [...rabTekstur].sort((a, b2) => a - b2);
const slike = [...new Set(teksture.map((t) => j.textures[t].source))].sort((a, b2) => a - b2);
console.log("teksture:", teksture.length, "| slike:", slike.length);

// --- slike v WebP ----------------------------------------------------------
fs.mkdirSync(ZACASNO, { recursive: true });
const novaSlika = new Map();
let prejSlike = 0;
let potemSlike = 0;
for (const s of slike) {
  const v = j.bufferViews[j.images[s].bufferView];
  const surova = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const vhodP = path.join(ZACASNO, `s${s}.png`);
  const izhodP = path.join(ZACASNO, `s${s}.webp`);
  fs.writeFileSync(vhodP, surova);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", vhodP, "-q:v", String(KAKOVOST), izhodP]);
  const webp = fs.readFileSync(izhodP);
  prejSlike += surova.length;
  potemSlike += webp.length;
  novaSlika.set(s, webp);
}
console.log("teksture:", bajti(prejSlike), "->", bajti(potemSlike));

// --- nova geometrija: brez tangent -----------------------------------------
const rabAccessorjev = new Set();
const novePrimitive = new Map();
for (const mi of mreze) {
  const seznam = j.meshes[mi].primitives.map((p) => {
    const atributi = { ...p.attributes };
    delete atributi.TANGENT; // brez kart normal jih nihce ne bere
    const nova = { ...p, attributes: atributi };
    for (const a of Object.values(atributi)) rabAccessorjev.add(a);
    if (p.indices !== undefined) rabAccessorjev.add(p.indices);
    return nova;
  });
  novePrimitive.set(mi, seznam);
}
const accessorji = [...rabAccessorjev].sort((a, b2) => a - b2);

// --- nov binarni del -------------------------------------------------------
const kosi = [];
let odmik = 0;
const noviBV = [];
const bvZaAccessor = new Map();

function dodaj(podatki, poravnava = 4, ciljBV = null) {
  while (odmik % poravnava) {
    kosi.push(Buffer.alloc(1));
    odmik += 1;
  }
  const zacetek = odmik;
  kosi.push(podatki);
  odmik += podatki.length;
  const bv = { buffer: 0, byteOffset: zacetek, byteLength: podatki.length };
  if (ciljBV?.byteStride !== undefined) bv.byteStride = ciljBV.byteStride;
  if (ciljBV?.target !== undefined) bv.target = ciljBV.target;
  noviBV.push(bv);
  return noviBV.length - 1;
}

// Accessorji: vsak dobi svoj bufferView, da ne vlecemo za sabo prekrivanj.
const noviAccessorji = [];
const zaAccessor = new Map();
const VELIKOST = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const KOMPONENT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
for (const ai of accessorji) {
  const a = j.accessors[ai];
  const v = j.bufferViews[a.bufferView];
  const enota = VELIKOST[a.componentType] * KOMPONENT[a.type];
  const korak = v.byteStride || enota;
  const zac = (v.byteOffset || 0) + (a.byteOffset || 0);
  const izrez = Buffer.alloc(enota * a.count);
  for (let n = 0; n < a.count; n++) bin.copy(izrez, n * enota, zac + n * korak, zac + n * korak + enota);
  const bvIdx = dodaj(izrez, 4, { target: v.target });
  zaAccessor.set(ai, noviAccessorji.length);
  noviAccessorji.push({ ...a, bufferView: bvIdx, byteOffset: 0 });
}

// Slike gredo za geometrijo.
const zaSliko = new Map();
const noveSlike = [];
for (const s of slike) {
  const bvIdx = dodaj(novaSlika.get(s), 4);
  zaSliko.set(s, noveSlike.length);
  noveSlike.push({ mimeType: "image/webp", bufferView: bvIdx });
}

// --- preslikave in sestava glTF --------------------------------------------
const zaMaterial = new Map(materiali.map((x, n) => [x.star, n]));
const zaTeksturo = new Map(teksture.map((t, n) => [t, n]));
const zaMrezo = new Map(mreze.map((m, n) => [m, n]));

const noveTeksture = teksture.map((t) => {
  const stara = j.textures[t];
  const nova = { source: zaSliko.get(stara.source) };
  if (stara.sampler !== undefined) nova.sampler = stara.sampler;
  return nova;
});

const noviMateriali = materiali.map(({ m }) => {
  const kopija = JSON.parse(JSON.stringify(m));
  const p = kopija.pbrMetallicRoughness || {};
  if (p.baseColorTexture) p.baseColorTexture.index = zaTeksturo.get(p.baseColorTexture.index);
  if (kopija.emissiveTexture) kopija.emissiveTexture.index = zaTeksturo.get(kopija.emissiveTexture.index);
  return kopija;
});

const noveMreze = mreze.map((mi) => ({
  name: j.meshes[mi].name,
  primitives: novePrimitive.get(mi).map((p) => {
    const atributi = {};
    for (const [k, v] of Object.entries(p.attributes)) atributi[k] = zaAccessor.get(v);
    const nova = { attributes: atributi, material: zaMaterial.get(p.material) };
    if (p.indices !== undefined) nova.indices = zaAccessor.get(p.indices);
    if (p.mode !== undefined) nova.mode = p.mode;
    return nova;
  }),
}));

// Vozlisca: preostevilcimo in odrezemo veje, ki so ostale prazne.
const obdrzi = [];
for (let i = 0; i < j.nodes.length; i++) if (vozlisceOk[i]) obdrzi.push(i);
const zaVozlisce = new Map(obdrzi.map((v, n) => [v, n]));
const novaVozlisca = obdrzi.map((i) => {
  const n = { ...j.nodes[i] };
  if (n.mesh !== undefined) n.mesh = zaMrezo.get(n.mesh);
  const otroci = (n.children || []).filter((c) => vozlisceOk[c]).map((c) => zaVozlisce.get(c));
  if (otroci.length) n.children = otroci;
  else delete n.children;
  return n;
});

const novi = {
  asset: j.asset,
  scene: 0,
  scenes: [{ name: j.scenes[0].name, nodes: j.scenes[0].nodes.map((n) => zaVozlisce.get(n)) }],
  nodes: novaVozlisca,
  meshes: noveMreze,
  materials: noviMateriali,
  textures: noveTeksture,
  images: noveSlike,
  samplers: j.samplers,
  accessors: noviAccessorji,
  bufferViews: noviBV,
  buffers: [{ byteLength: odmik }],
};
if (j.extensionsUsed) novi.extensionsUsed = j.extensionsUsed;

// --- zapis GLB -------------------------------------------------------------
const binDel = Buffer.concat(kosi);
let jsonNiz = JSON.stringify(novi);
while (jsonNiz.length % 4) jsonNiz += " ";
const jsonBuf = Buffer.from(jsonNiz, "utf8");
const binPad = Buffer.concat([binDel, Buffer.alloc((4 - (binDel.length % 4)) % 4)]);

const glava = Buffer.alloc(12);
glava.writeUInt32LE(0x46546c67, 0);
glava.writeUInt32LE(2, 4);
glava.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binPad.length, 8);
const jsonGlava = Buffer.alloc(8);
jsonGlava.writeUInt32LE(jsonBuf.length, 0);
jsonGlava.writeUInt32LE(0x4e4f534a, 4);
const binGlava = Buffer.alloc(8);
binGlava.writeUInt32LE(binPad.length, 0);
binGlava.writeUInt32LE(0x004e4942, 4);

fs.mkdirSync(path.dirname(IZHOD), { recursive: true });
fs.writeFileSync(IZHOD, Buffer.concat([glava, jsonGlava, jsonBuf, binGlava, binPad]));
console.log("izhod:", bajti(fs.statSync(IZHOD).size), "->", IZHOD);
