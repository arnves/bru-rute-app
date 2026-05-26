# bru-ruteapp – kjøreveiledning

## Forutsetning

- `bruanalyse/` ligger som søskenmappe (`../bruanalyse/`).
- Python-miljøet i `bruanalyse/.venv/` er tilgjengelig.

## Steg 1 – Eksporter graf (kjøres én gang, eller ved config-endring)

```bash
cd bru-ruteapp/
../bruanalyse/.venv/bin/python eksporter_graf.py
```

Skriver `web/data/graf.json` (~180 KB). Trenger nettilgang bare hvis
`bruanalyse/data/` ikke har cached pickle (første gang).

## Steg 2 – Start lokal webserver

```bash
cd web/
python3 -m http.server 8765
```

Åpne <http://localhost:8765> i nettleseren.

> **Merk:** Appen virker ikke ved direkte `file://`-åpning pga. CORS-begrensning på `fetch`.

## Verifiseringsverdier (Fase 3)

Disse verdiene er beregnet av Python-pipelinen (`nx.shortest_path_length`,
vekt=`length`, 15 km/t). Appen skal vise samme tall (±avrunding).

| Par                    | Uten bru | Med bru A (340m) | Besparelse |
|------------------------|----------|------------------|------------|
| City Lade → Sirkus     | 5 min 2 s | 4 min 47 s      | 15 s       |
| Sirkus → City Lade     | 5 min 6 s | 4 min 52 s      | 13 s       |
| DMMH → City Lade       | 2 min 14 s | 2 min 14 s     | 0 s        |

For DMMH → City Lade skal appen vise "Brua benyttes ikke – eksisterende rute er raskere".

## Koordinater for testpunkter

- City Lade: 63.44340, 10.44776
- Sirkus Shopping: 63.43616, 10.45559
- DMMH: 63.43960, 10.44806
- Dalenbrua (nord): 63.44052, 10.44783
- Leangenbrua (nord): 63.43785, 10.46078

## Metodenote

- **Uniform fart:** `tid = lengde_m / (fart_kmh / 3.6)`. Ruten endres ikke av fart – kun tidene skaleres.
- **Gange:** bruker sykkelnett med lavere fart (akseptabelt for dette studieområdet).
- **Brumodell A:** pt1→pt2 = 340 m (flat geometri). **B:** 440 m (forskriftsmessig rampe 5%).
- **Planlagte forbindelser** (Vei 1–4) er bakt inn i basen – begge scenarier.
- Se `bruanalyse/METODE.md` for full metodebeskrivelse.
