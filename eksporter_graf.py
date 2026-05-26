#!/usr/bin/env python3
"""Eksporter OSM-sykkelnettet til graf.json for bru-ruteapp.

Gjenbruker bruanalyse/src nøyaktig (same pipeline som analyse.py main()),
men eksporterer uorientert graf + separate brukanter istedenfor å injisere brua.

Kjøres én gang fra bru-ruteapp/:
    python eksporter_graf.py
Eller med eksplisitt sti til bruanalyse:
    python eksporter_graf.py --bruanalyse /sti/til/bruanalyse
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import date
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

DEFAULT_BRUANALYSE = Path(__file__).parent.parent / "bruanalyse"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--bruanalyse",
        default=str(DEFAULT_BRUANALYSE),
        help="Sti til bruanalyse-mappen (standard: ../bruanalyse)",
    )
    p.add_argument(
        "--ut",
        default=str(Path(__file__).parent / "web" / "data" / "graf.json"),
        help="Utfil (standard: web/data/graf.json)",
    )
    return p.parse_args()


def beregn_brulengder(hyp: dict) -> tuple[float, float]:
    """Beregn pt1→pt2-lengde for modell A (flat) og B (forskriftsmessig rampe).
    Kopiert logikk fra bruanalyse/analyse.py:beregn_brulengder.
    """
    L = hyp["tiltak_lengder_m"]
    H = hyp["hoyde_m"]
    maks = float(hyp["forskriftsmessig"]["maks_stigning_pst"]) / 100.0

    nom_nord = float(L["rampe_nord"])
    nom_syd = float(L["rampe_syd"])
    spenn = float(L["bruspenn"])
    tilkobling = float(L["tilkobling"])
    lengde_a = nom_nord + spenn + nom_syd + tilkobling

    dekkehoyde = (
        float(H["sportopp"]) + float(H["fri_hoyde_baneNOR"])
        + float(H["konstruksjonshoyde"])
    )
    rise_nord = dekkehoyde - float(H["innslag_nord"])
    rise_syd = dekkehoyde - float(H["innslag_syd"])
    b_nord = max(nom_nord, rise_nord / maks if rise_nord > 0 else 0.0)
    b_syd = max(nom_syd, rise_syd / maks if rise_syd > 0 else 0.0)
    lengde_b = b_nord + spenn + b_syd + tilkobling

    return lengde_a, lengde_b


def main() -> None:
    args = parse_args()

    bruanalyse_rot = Path(args.bruanalyse).resolve()
    if not bruanalyse_rot.exists():
        sys.exit(f"Fant ikke bruanalyse-mappen: {bruanalyse_rot}")

    sys.path.insert(0, str(bruanalyse_rot))

    import yaml
    import osmnx as ox
    from src.nettverk import (
        last_eller_hent_nettverk,
        fortett_graf,
        legg_til_forbindelser,
        splitt_kant_og_koble,
    )

    cfg_fil = bruanalyse_rot / "config.yaml"
    with open(cfg_fil, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    bbox = tuple(cfg["studieomraade"]["bbox"])
    fart_kmh = float(cfg["sykling"]["fart_kmh"])
    cache_mappe = str(bruanalyse_rot / cfg["nettverk"]["cache_mappe"])

    # --- Bygg G_basis nøyaktig som i analyse.py main() ---
    logger.info("Laster nettverk …")
    G = last_eller_hent_nettverk(bbox, cfg["nettverk"]["modus"], cache_mappe, fart_kmh)

    fortetting = cfg["nettverk"].get("fortetting_m")
    if fortetting:
        logger.info("Fortetter kanter > %.0f m …", fortetting)
        G = fortett_graf(G, float(fortetting), fart_kmh)

    forb = cfg.get("planlagte_forbindelser", [])
    pk = cfg.get("jernbanesykkelveg_paakoblinger")
    if forb:
        logger.info("Legger til %d planlagte forbindelser …", len(forb))
        G = legg_til_forbindelser(G, forb, fart_kmh)
    if pk:
        for p in pk["punkter"]:
            G, _ = splitt_kant_og_koble(
                G,
                projeksjonspunkt=tuple(p["projeksjonspunkt"]),
                fra_node=p["fra_node"],
                koblingslengde_m=p["koblingslengde_m"],
                fart_kmh=fart_kmh,
                navn=p.get("navn", "påkobling"),
            )

    logger.info(
        "G_basis klar: %d noder, %d kanter",
        G.number_of_nodes(), G.number_of_edges(),
    )

    # --- Finn bru-noder ---
    hyp = cfg["bruer"]["hypotetisk"]
    pt1 = hyp["pt1"]   # [lat, lon]
    pt2 = hyp["pt2"]
    pt3 = hyp["pt3"]
    node_nord = ox.nearest_nodes(G, pt1[1], pt1[0])
    node_syd  = ox.nearest_nodes(G, pt2[1], pt2[0])
    node_pt3  = ox.nearest_nodes(G, pt3[1], pt3[0])
    logger.info(
        "Bru-noder: node_nord=%d, node_syd=%d, node_pt3=%d",
        node_nord, node_syd, node_pt3,
    )

    lengde_a, lengde_b = beregn_brulengder(hyp)
    logger.info("Bru-lengder: A=%.0f m, B=%.0f m", lengde_a, lengde_b)

    # --- Eksporter noder (unik liste) ---
    noder = []
    for nid, data in G.nodes(data=True):
        noder.append({"id": nid, "lat": data["y"], "lon": data["x"]})

    # --- Eksporter kanter (uorientert, behold korteste u→v eller v→u) ---
    sett: dict[tuple[int, int], dict] = {}
    for u, v, data in G.edges(data=True):
        key = (min(u, v), max(u, v))
        lengde = float(data.get("length", 0))
        if key not in sett or lengde < sett[key]["len"]:
            geom_data = data.get("geometry")
            if geom_data is not None:
                coords = [[y, x] for x, y in geom_data.coords]  # lon,lat → lat,lon
            else:
                coords = None
            entry = {"u": u, "v": v, "len": round(lengde, 2)}
            if coords:
                entry["geom"] = coords
            sett[key] = entry

    kanter = list(sett.values())
    logger.info("Eksporterer %d noder, %d kanter", len(noder), len(kanter))

    # --- Bygg JSON ---
    ut = {
        "meta": {
            "bbox": list(bbox),
            "generert": str(date.today()),
            "modus_kilde": cfg["nettverk"]["modus"],
            "fart_default_kmh": {"sykkel": 15, "gange": 5},
            "bru_modeller": {
                "A": {"navn": "Flat geometri", "bru_lengde_m": round(lengde_a, 1)},
                "B": {"navn": "Forskriftsmessig rampe", "bru_lengde_m": round(lengde_b, 1)},
            },
        },
        "noder": noder,
        "kanter": kanter,
        "bru": {
            "node_nord": node_nord,
            "node_syd":  node_syd,
            "node_pt3":  node_pt3,
            "sti_len_m": float(hyp["sti_lengde_m"]),
            "inkluder_sti": bool(hyp["inkluder_sti"]),
        },
        "kontekst": {
            "eksist_bruer": [
                {"navn": "Dalenbrua",  "lat": cfg["bruer"]["dalenbrua"]["lat"],  "lon": cfg["bruer"]["dalenbrua"]["lon"]},
                {"navn": "Leangenbrua","lat": cfg["bruer"]["leangenbrua"]["lat"],"lon": cfg["bruer"]["leangenbrua"]["lon"]},
            ],
            "hypotetisk": {
                "lat": hyp["lat"],
                "lon": hyp["lon"],
            },
        },
    }

    ut_fil = Path(args.ut)
    ut_fil.parent.mkdir(parents=True, exist_ok=True)
    with open(ut_fil, "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = ut_fil.stat().st_size / 1024
    logger.info("Skrevet til %s (%.0f KB)", ut_fil, size_kb)
    logger.info("Ferdig. Verifiser: node_nord=%d, node_syd=%d", node_nord, node_syd)


if __name__ == "__main__":
    main()
