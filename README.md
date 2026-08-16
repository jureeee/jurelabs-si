# blatnikjuree website

Osebna stran. Dve stvari na zaslonu: 3D galaksija in Defracted Glass UI.

```bash
npm run dev      # razvoj, localhost:5173
npm run build    # gradnja v dist/
npm run preview  # predogled zgrajenega
```

## Zgradba

```
index.html              stran, ves CSS in Defracted Glass slog
src/cv/cv.js            galaksija, kamera, sij, oddaljena galaksija
src/cv/nebulas.js       meglice (raymarch izpecen enkrat v teksturo)
src/cv/defractedGlass.js  lom svetlobe ob robovih in sij za kazalcem
src/assets/             model galaksije in profilna slika
modeli/                 surovi 3D modeli - NI v gitu, glej spodaj
```

## Nastavljive vrednosti

Vse so imenovane konstante na vrhu svoje datoteke.

**`cv.js` — galaksija in kamera**

| konstanta | pomen |
|---|---|
| `TARGET_SCREEN_FILL` | koliksen del visine zaslona zavzame galaksija (cez 1 = sega cez rob) |
| `RADIUS_PERCENTILE` | delez tock, ki doloca "pravi" polmer; ocrtana skatla je neuporabna, ker jo razpotegne nekaj osamljenih tock |
| `STAR_SIZE_MIN/SPREAD` | velikost zvezd; `pow(r, 11)` da tezek rep, torej je le pesc velikih |
| `SATURATION` | odmik barv od sivine; model je le rahlo obarvan (povprecno 0.19) |
| `ORBIT_SPEED` | radianov na sekundo |
| `FLIGHT_MS`, `FLIGHT_SWEEP` | prilet; vrtenje je vezano na preostalo razdaljo, ne na cas |
| `PARALLAX_*`, `ZOOM_DRIFT` | odziv na misko |
| `BLOOM_*`, `BLOOM_SUPERSAMPLE` | sij |
| `DALJNA_MERILO/MOC` | oddaljena galaksija v ozadju |

**`nebulas.js` — meglice**: `KOSOV`, `MOC_MIN/MAX`, `VELIKOST_MIN/MAX`, `ODMIK_MIN/MAX`, `BARVE`.

**`defractedGlass.js` — steklo**: `REFRACT_SCALE`, `EDGE_WIDTH`, `LENS`, `GLOW_RADIUS`, `KOT_DUSENJE`.

## Odlocitve, ki niso ocitne

**Polmer galaksije se meri po percentilu, ne z ocrtano skatlo.** Model ima nekaj
osamljenih tock zelo dalec od diska. Oko jih ne vidi, skatlo pa razpotegnejo za
faktor 1.89 - kamera je zato obstala predalec in galaksija je bila videti kot
pika.

**Sij zvezd je risan v sencilniku, ne prepuscen bloomu.** Bloom zna narediti le
liso, pri nizki locljivosti mipov celo kvadratasto. Zvezda ima zato jedro, halo
in osem difrakcijskih krakov, ki jih dobijo le najsvetlejse. Bloom se rise v
dvojni locljivosti (`BLOOM_SUPERSAMPLE`), sicer se njegov najgrobji mip ob
povecavi razteza v vidne bloke.

**Meglice so izpecene enkrat, ne raymarchane vsako slicico.** Celozaslonski
raymarcher ima svojo kamero in o sceni nic ne ve - bil bi ploska slika cez
ozadje in se z galaksijo ne bi premikal. Ker so meglice na svojih legah v svetu,
dobijo pravilno perspektivo in parallakso.

**Oddaljena galaksija mora ostati blizu osi pogleda.** Vidno polje se z globino
siri in pri oddaljenosti D pokriva 0.625*D na vsako stran; precni odmik mora
ostati pod tem, sicer je nikoli ni videti.

**Sij ob robovih stekla ni border-color.** Ta je enakomeren po celem obodu in ne
more biti mocnejsi na strani, kjer je kazalec. Namesto tega je obroc iz
gradienta, izrezan z masko in rahlo zabrisan.

## Mapa `modeli/`

Planeti, crna luknja in sonce, okrog 2 GB. Namenoma **ni v gitu**: potisk bi bil
neznosen. V projekt se uvozi le tisto, kar se dejansko uporablja, in sicer prek
`src/assets/`. Trenutno je uporabljena samo galaksija
(`src/assets/3d models/need_some_space.glb`).
