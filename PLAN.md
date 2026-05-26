# Plan: Interaktiv ruteapp (sykkel/gange, med vs. uten sentralbru)

Parallellprosjekt til `bruanalyse/`. Gjenbruker samme OSM-graf og rutelogikk,
men som en interaktiv single-page-app i stedet for statiske analysefigurer.

## 0. Konsept

Single-page Leaflet-app. Brukeren klikker to punkter i kartet; appen viser to
ruter (med og uten den hypotetiske sentralbrua), reisetid for begge, og
besparelsen. Fart og modus (sykkel/gange) er justerbar; bru-modell A/B kan
toggles. **Ingen backend ved kjøring** — alt skjer i nettleseren mot en
forhåndseksportert graf.

### Hvorfor ikke et offentlig rute-API (OSRM/GraphHopper)?

Kjernefunksjonen er å sammenligne *med* vs. *uten en hypotetisk bru*. Ingen
offentlig rutetjeneste kjenner en bru som ikke finnes i OSM, så de kan ikke
returnere "med bru"-tiden. Eneste måte å få begge tall på er å rute på *vår
egen* graf som inneholder den syntetiske brukanten.

### Designformen: eksport + statisk klient

- **Ett engangs Python-eksportsteg** bygger nøyaktig samme `G_basis` +
  brukanter som analysen og dumper til JSON. Grafkonstruksjonen (der reell
  divergensrisiko ligger) forblir én kilde i Python.
- **Statisk side** kjører Dijkstra + nærmeste-node-snapping i nettleseren —
  begge trivielle og lette å verifisere.
- Resultat: statisk hosting, ingen serverprosess, bru-sammenligningen virker.

Fidelity er ikke hovedmålet for dette prosjektet (avklart med bruker) — visuell
effekt og interaktivitet er prioritet. Rutetiden fra OSM-nettet er valid nok.

## 1. Prosjektstruktur

```
bru-ruteapp/
  PLAN.md                  # denne fila
  eksporter_graf.py        # Python, kjøres ÉN gang. Importerer bruanalyse/src.
  web/
    index.html
    app.js
    style.css
    data/
      graf.json            # generert av eksporter_graf.py
  LES_MEG.md               # hvordan eksportere + kjøre lokalt
```

Kjøres lokalt med `python -m http.server` fra `web/` (file:// blokkerer
`fetch` av JSON pga. CORS).

## 2. Fase 1 — Grafeksport (Python, gjenbruk eksisterende kode)

**Mål:** produser `web/data/graf.json` fra nøyaktig samme pipeline som analysen.

`eksporter_graf.py` skal:

1. Legg `/Users/arnves/Prosjekter/bruanalyse` på `sys.path`. Importer fra
   `src.nettverk`: `last_eller_hent_nettverk`, `fortett_graf`,
   `legg_til_forbindelser`, `splitt_kant_og_koble`. Les `bruanalyse/config.yaml`.
2. Bygg `G_basis` **akkurat** som i `bruanalyse/analyse.py main()`
   (se linjene ~800–825): last → fortett (30 m) → planlagte forbindelser →
   påkoblinger. **Ikke** legg til brua her — den eksporteres som separate kanter.
3. Finn de tre bru-nodene via `ox.nearest_nodes(G_basis, lon, lat)` for `pt1`,
   `pt2`, `pt3` fra config (`bruer.hypotetisk`).
4. Beregn begge brulengdene med eksisterende `beregn_brulengder(hyp)` i
   `analyse.py` → `lengde_a` (≈340 m), `lengde_b` (≈440 m).
5. Skriv JSON med dette skjemaet:

```json
{
  "meta": {
    "bbox": [10.441, 63.435, 10.463, 63.4445],
    "generert": "2026-05-26",
    "modus_kilde": "bike",
    "fart_default_kmh": { "sykkel": 15, "gange": 5 },
    "bru_modeller": {
      "A": { "navn": "Flat geometri", "bru_lengde_m": 340 },
      "B": { "navn": "Forskriftsmessig rampe", "bru_lengde_m": 440 }
    }
  },
  "noder": [ { "id": 123, "lat": 63.44, "lon": 10.45 } ],
  "kanter": [ { "u": 123, "v": 456, "len": 42.3, "geom": [[63.44,10.45]] } ],
  "bru": {
    "node_nord": 279049681, "node_syd": 5583142085, "node_pt3": 7630322271,
    "sti_len_m": 160, "inkluder_sti": true
  },
  "kontekst": {
    "eksist_bruer": [ {"navn":"Dalenbrua","lat":63.44052,"lon":10.44783} ],
    "hypotetisk": {"lat":63.43951,"lon":10.45435}
  }
}
```

### Eksportregler

- **Uorientert graf:** kollaps `u→v`/`v→u` til én kant, behold minste `length`.
  JS behandler alle kanter toveis. (Dropper sykkel-enveiskjøring — akseptabelt
  per scope-avgjørelsen, og nødvendig for gange-reweight.)
- **Eksporter `length`, ikke `travel_time`.** Reisetid regnes i nettleseren fra
  valgt fart → fart blir 100 % klientside.
- **`geom`** = kantens `geometry`-koordinater konvertert til `[lat, lon]`.
  Mangler geometri → utelat feltet (JS tegner node-til-node; 30 m-fortetting
  gjør dette visuelt greit).
- **Brua eksporteres IKKE som vanlig kant.** JS bygger "med bru"-grafen ved å
  legge til: `(node_nord ↔ node_syd, len = valgt modell)` og — hvis
  `inkluder_sti` — `(node_syd ↔ node_pt3, len = sti_len_m)`.

**lat/lon:** grafen lagrer `x` = lon, `y` = lat. Konverter til `[lat, lon]` i
eksporten, ikke i JS.

**Akseptkriterium fase 1:** `graf.json` finnes, ~1000 noder / ~2500 kanter,
gyldig JSON, bru-nodene matcher de verifiserte ID-ene i config-kommentarene
(`node_nord` ≈ 279049681, `node_syd` ≈ 5583142085, `node_pt3` ≈ 7630322271).

## 3. Fase 2 — Statisk frontend (vanilla JS + Leaflet via CDN)

Ingen rammeverk — vanilla JS holder appen til én reell side.

### Kartinit (`app.js`)

- Leaflet-kart sentrert på bbox, OSM-fliser. Tegn bbox som rektangel.
- Marker eksisterende + hypotetisk bru fra `kontekst` (liten infolayer).
- Last `data/graf.json`. Bygg adjacency-map:
  `{ nodeId: [ { til, len, geom } ] }`. Bygg nodekoordinat-oppslag.

### Interaksjon

- Klikk 1 → punkt A (grønn markør). Klikk 2 → punkt B (rød). Klikk 3 →
  nullstill, ny A. Markører skal kunne dras (rekjør ruting på `dragend`).
- Klikk utenfor bbox → vis melding "Velg punkt innenfor studieområdet", ignorer.

### Snapping (JS)

- Nærmeste node = lineært søk over alle noder med haversine (~1000 noder,
  <1 ms). **Snap mot grunnnodene én gang**; samme node-ID brukes i begge
  scenarier — ellers er sammenligningen ikke epler-mot-epler.
- Tegn tynn stiplet linje fra klikk til snappet node + vis snap-avstand.

### Ruting (JS)

- Standard Dijkstra med binær-heap, vekt = `len`. Kjør to ganger:
  1. På grunn-adjacency → rute uten bru.
  2. På adjacency + bru-kanter (modell A eller B) → rute med bru.
- Reisetid: `tid_s = total_len_m / (fart_kmh / 3.6)`. (3.6 = km/t→m/s.)
- **Merk:** ruten endres IKKE av fart (uniform fart) — fart skalerer bare tiden.
  Ruten endres kun av bru-toggle og A/B-modell.

### Tegning

- Uten-bru-rute: én farge (f.eks. grå/oransje). Med-bru-rute: annen farge
  (f.eks. blå), stiplet eller med liten offset så overlapp synes.
- Stitch rute-geometrien fra `geom` per kant (fallback node-til-node).
- Hvis de to rutene er identiske (vanlig per analysens funn) → tegn én linje og
  skriv "Brua gir ingen besparelse for denne reisen".
- Detekter bru-bruk: sjekk om med-bru-stien inneholder kanten
  `node_nord ↔ node_syd`.

### Kontrollpanel

- Modus: Sykkel / Gange (setter default fart; begge bruker samme graf — reweight).
- Fart-slider (3–30 km/t) med live etikett.
- Bru-modell: A (flat 340 m) / B (forskriftsmessig 440 m).

### Resultatpanel

- Tid uten bru / med bru (min:sek), besparelse (min + %), rutelengde,
  "brua brukes / brukes ikke".

### Metodenote (liten footer, ærlig men kort)

Uniform fart, sykkelnett brukt også for gange, hypotetisk bru er en syntetisk
kant. Henvis til `bruanalyse/METODE.md`.

**Akseptkriterium fase 2:** klikk to punkter → to ruter tegnes + tider vises;
toggling av fart endrer kun tid; A/B endrer med-bru-tid/geometri; utenfor-bbox
håndteres.

## 4. Fase 3 — Verifisering (billig korrekthetssjekk)

Selv om fidelity ikke er hovedmål: kjør 2–3 O-D-par gjennom Python
`analyse_reisepar` (eller en mini-`nx.shortest_path_length`) og bekreft at
JS-appen viser samme tid (innenfor avrunding). Fanger Dijkstra-/snapping-feil i
JS. Dokumentér resultatet i `LES_MEG.md`.

## 5. Anbefalt rekkefølge for utvikling

1. `eksporter_graf.py` + verifiser `graf.json` (fase 1).
2. Leaflet-kart + last graf + klikk-markører + bbox-vakt.
3. JS Dijkstra + snapping + tegn én rute (uten bru) korrekt.
4. Legg til bru-kanter + andre rute + besparelse + bru-brukt-indikator.
5. Kontroller (modus/fart/A-B) + resultatpanel + identisk-rute-håndtering.
6. Fase 3-verifisering + metodenote + LES_MEG.

## 6. Fallgruver å være obs på

- **lat/lon-bytte:** grafen lagrer `x`=lon, `y`=lat; Leaflet vil ha `[lat, lon]`.
  Konverter i eksporten.
- **Samme snappede node i begge scenarier** — ellers ikke epler-mot-epler.
- **CORS på file://** — kjør via `python -m http.server`.
- **Payload:** uten `geom` blir JSON liten; med `geom` fortsatt trolig <1 MB.
  Greit statisk.
- **Uniform fart ⇒ fart-uavhengig rute** — ikke forveksle med en bug.
