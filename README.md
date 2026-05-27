# bru-ruteapp

Interaktiv single-page-app for å sammenligne sykkel- og gangestier
**med og uten en hypotetisk jernbanebru** ved Dalen hageby i Trondheim.

**Demo:** https://arnves.github.io/bru-rute-app/

Parallellprosjekt til [`bruanalyse/`](../bruanalyse), som produserer
de statiske analysefigurene og rapporten som vises i figurgalleriet.

---

## Hva gjør appen?

Klikk to punkter i kartet. Appen beregner korteste rute mellom dem i
to scenarioer — uten og med den hypotetiske sentralbrua — og viser
begge rutene i kartet med reisetid og besparelse.

- **Modus:** sykkel eller gange (justerer standardfart)
- **Fart:** 3–30 km/t (skalerer kun tidene, ikke ruten)
- **Brumodell A** – flat geometri, pt1→pt2 = 270 m
- **Brumodell B** – forskriftsmessig rampe (5 % maks stigning, SVV V122), pt1→pt2 = 440 m
- **Figurgalleri:** 9 analysekart fra Python-pipelinen med forklaringstekster

---

## Arkitektur

### Hvorfor ingen backend?

Kjernefeaturet — sammenligne med/uten en hypotetisk bru — krever en
graf som inneholder en syntetisk brukant. Ingen offentlig rute-API
(OSRM, GraphHopper o.l.) kjenner en bru som ikke finnes i OSM.
Løsningen er:

1. **Engangs Python-eksport** bygger nøyaktig samme `G_basis` som
   analysen og dumper to ting til `docs/data/graf.json`:
   - uorientert sykkelgraf med alle planlagte forbindelser bakt inn
   - brukant-metadata (node-IDer + lengder for modell A og B)
2. **Statisk JS-klient** laster JSON, kjører Dijkstra i nettleseren
   og legger til brukanten selv ved behov.

Grafkonstruksjonen — der risikoen for metode-avvik er størst — forblir
i Python og kjøres én gang. Dijkstra + nærmeste-node-snapping i JS er
trivielle operasjoner og enkle å verifisere mot Python-referanseverdier.

### Uniform fart

Alle kanter har lik fart (`travel_time = length / (speed_ms)`).
Konsekvens: **å justere farten endrer kun de viste tidene, ikke
rute-geometrien.** Ruten avhenger kun av avstand og hvilken
brumodell som er valgt.

### Gangemodus

Gange reweighter sykkelnettet med lavere fart. Det brukes ikke et
eget `network_type="walk"`-nett. I dette studieområdet finnes det
ikke viktige fotgjengerruter som er utilgjengelige for syklister,
og omvendt, så approksima­sjonen er akseptabel.

---

## Forutsetninger

- `bruanalyse/` og `bru-ruteapp/` ligger som søskenmapper
- Python-miljøet i `bruanalyse/.venv/` (Python ≥ 3.10, se `bruanalyse/pyproject.toml`)

---

## Første gangs oppsett

```bash
# Eksporter graf og komprimerte figurer (bruker bruanalyse sin cache)
cd bru-ruteapp/
../bruanalyse/.venv/bin/python eksporter_graf.py --med-figurer
```

Skriver `docs/data/graf.json` (~180 KB) og `docs/figurer/*.png` (~7.9 MB).
Krever nettilgang kun hvis `bruanalyse/data/` ikke har cached OSM-pickle.

### Lokal webserver

```bash
cd docs/
python3 -m http.server 8765
# Åpne http://localhost:8765
```

> Appen virker ikke ved direkte `file://`-åpning — `fetch` blokkeres
> av nettleserens CORS-regler.

---

## Oppdateringssekvens

Ved endringer i `bruanalyse/config.yaml`, ny OSM-data, eller
reviderte analysefigurer:

```bash
# 1. Kjør analysen på nytt
cd bruanalyse/
.venv/bin/python analyse.py --all

# 2. Eksporter graf + komprimer figurer
cd ../bru-ruteapp/
../bruanalyse/.venv/bin/python eksporter_graf.py --med-figurer

# 3. Publiser
git add docs/
git commit -m "Oppdater graf og figurer"
git push
```

GitHub Pages oppdaterer seg automatisk etter push.

---

## Prosjektstruktur

```
bru-ruteapp/
  eksporter_graf.py     # Engangs Python-eksport. Importerer bruanalyse/src/.
  docs/                 # GitHub Pages-rot (servert fra /docs på main)
    index.html
    app.js
    style.css
    data/
      graf.json         # Generert av eksporter_graf.py
    figurer/            # Komprimerte analysekart (generert med --med-figurer)
      kart_veier_besparelse.png
      kart_veier_besparelse_stigning.png
      kart_mal_sirkus_shopping.png
      kart_mal_sirkus_shopping_stigning.png
      kart_mal_city_lade.png
      kart_mal_city_lade_stigning.png
      kart_mal_lade_idrettsanlegg.png
      kart_mal_lade_idrettsanlegg_stigning.png
      kart_mal_lade_arena.png
  PLAN.md               # Opprinnelig implementasjonsplan
  README.md             # Denne filen
```

---

## Verifiseringsverdier

Beregnet av Python (`nx.shortest_path_length`, vekt=`length`, 15 km/t, modell A 270 m).
Appen skal vise disse tallene (± avrunding til nærmeste sekund).

| Par                | Uten bru   | Med bru A (270 m) | Besparelse |
|--------------------|------------|-------------------|------------|
| City Lade → Sirkus | 5 min 2 s  | 4 min 30 s        | 32 s       |
| Sirkus → City Lade | 5 min 5 s  | 4 min 35 s        | 30 s       |
| DMMH → City Lade   | 2 min 13 s | 2 min 13 s        | 0 s        |

For DMMH → City Lade skal appen vise «Brua benyttes ikke».

### Koordinater for manuell testing

| Punkt              | Lat       | Lon      |
|--------------------|-----------|----------|
| City Lade          | 63.44340  | 10.44776 |
| Sirkus Shopping    | 63.43616  | 10.45559 |
| DMMH               | 63.43960  | 10.44806 |
| Dalenbrua          | 63.44052  | 10.44783 |
| Leangenbrua        | 63.43785  | 10.46078 |
| Hypotetisk bru     | 63.43951  | 10.45435 |

---

## Metodebegrensninger

- **Uniform fart** – ingen impedans for stigninger, kryss, trafikklys
- **Sykkelnett for gange** – `network_type="bike"`, ikke `"walk"`
- **Syntetisk brukant** – lengde beregnet fra planlagte koblingspunkter,
  ikke endelig prosjektert geometri
- **Planlagte nordforbindelser** (Vei 1–4 langs jernbanen) er bakt inn
  i begge scenarioer som en konservativ forutsetning

Se [`bruanalyse/METODE.md`](../bruanalyse/METODE.md) for fullstendig
metodedokumentasjon og kildehenvisninger.

---

## Teknologi

| Komponent    | Valg                                      |
|--------------|-------------------------------------------|
| Kart         | [Leaflet 1.9.4](https://leafletjs.com/) + OSM-fliser |
| Ruting       | Egenprodusert Dijkstra med binær min-heap |
| Grafdata     | OSMnx 2.x → NetworkX → JSON              |
| Frontend     | Vanilla JS, ingen byggsteg                |
| Hosting      | GitHub Pages (`/docs` på `main`)          |
| Grafbygging  | Python, gjenbruker `bruanalyse/src/`      |
