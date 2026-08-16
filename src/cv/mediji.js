/**
 * Seznam medijev, skupen profilu in strani O meni.
 *
 * Glob vrne le naslove (nize), zato tu se nic ne potuje po mrezi - datoteka se
 * prenese sele, ko element dobi src.
 *
 * Live Photo pride iz telefona dvakrat: kot slika in kot .mov z isto osnovo
 * imena. Zdruzimo ju po osnovi in obdrzimo video, ker vsebuje tudi mirujoco
 * slicico. S tem odpadejo tudi datoteke .heic, ki jih noben brskalnik ne
 * prikaze - vse imajo svoj .mov.
 */

const vsi = Object.entries(
  import.meta.glob("../assets/images/*.{jpg,JPG,jpeg,JPEG,png,PNG,mp4,MP4,mov,MOV}", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
  .map(([pot, url]) => ({
    url,
    ime: pot.split("/").pop(),
    video: /\.(mp4|mov)$/i.test(pot),
  }))
  // Profilna slika sodi v glavo, ne v mrezo.
  .filter((m) => !m.ime.startsWith("profile picture"));

const poOsnovi = new Map();
for (const m of vsi) {
  const osnova = m.ime.replace(/\.[^.]+$/, "").toLowerCase();
  const prej = poOsnovi.get(osnova);
  if (!prej || (m.video && !prej.video)) poOsnovi.set(osnova, m);
}

export const mediji = [...poOsnovi.values()].sort((a, b) =>
  // Stevilcno in ne abecedno, sicer bi img10 stal pred img2.
  a.ime.localeCompare(b.ime, undefined, { numeric: true, sensitivity: "base" })
);
