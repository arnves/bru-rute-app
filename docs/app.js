'use strict';

// ── Figurdata ─────────────────────────────────────────────────────────────────
const FIGURER = [
  {
    gruppe: 'Veistrekksanalyse',
    fil: 'figurer/kart_veier_besparelse.png',
    kort: 'Modell A – flat (270 m)',
    tittel: 'Gjennomsnittlig spart reisetid per veistrekk – Modell A (flat, 270 m)',
    beskrivelse: 'Hvert veistrekk er farget etter gjennomsnittlig spart sykkelreisetid for kryssreiser over jernbanen fra det aktuelle punktet, med sentralbrua til stede. Fargeskalering fra grå (ingen besparelse) til grønn (størst besparelse i sekunder). Kun rutbare veier er farget — ingen interpolasjon over ubebygde arealer.',
  },
  {
    gruppe: 'Veistrekksanalyse',
    fil: 'figurer/kart_veier_besparelse_stigning.png',
    kort: 'Modell B – rampe (440 m)',
    tittel: 'Gjennomsnittlig spart reisetid per veistrekk – Modell B (forskriftsmessig rampe, 440 m)',
    beskrivelse: 'Samme analyse som Modell A, men beregnet med en brulengde på 440 m etter kravet om maks 5 % stigning (SVV V122 Sykkelhåndboka). Den lengre traseen reflekterer nødvendige ramper for å håndtere høydeforskjellen over jernbanen.',
  },
  {
    gruppe: 'Sirkus Shopping',
    fil: 'figurer/kart_mal_sirkus_shopping.png',
    kort: 'Modell A – flat (270 m)',
    tittel: 'Spart reisetid til Sirkus Shopping – Modell A (flat, 270 m)',
    beskrivelse: 'Hvert punkt på nordsiden av jernbanen er farget etter spart sykkelreisetid til Sirkus Shopping, beregnet med reversert Dijkstra fra målet. Fargen viser hvor mange sekunder kortere turen til Sirkus blir fra det aktuelle startpunktet dersom sentralbrua er på plass.',
  },
  {
    gruppe: 'Sirkus Shopping',
    fil: 'figurer/kart_mal_sirkus_shopping_stigning.png',
    kort: 'Modell B – rampe (440 m)',
    tittel: 'Spart reisetid til Sirkus Shopping – Modell B (forskriftsmessig rampe, 440 m)',
    beskrivelse: 'Samme destinasjonsforankrede analyse som over, med brulengde 440 m etter forskriftsmessig stigning.',
  },
  {
    gruppe: 'City Lade',
    fil: 'figurer/kart_mal_city_lade.png',
    kort: 'Modell A – flat (270 m)',
    tittel: 'Spart reisetid til City Lade – Modell A (flat, 270 m)',
    beskrivelse: 'Hvert punkt på sydsiden av jernbanen er farget etter spart sykkelreisetid til City Lade. Fargen viser besparelsen i sekunder fra det aktuelle startpunktet, beregnet med reversert Dijkstra fra målet.',
  },
  {
    gruppe: 'City Lade',
    fil: 'figurer/kart_mal_city_lade_stigning.png',
    kort: 'Modell B – rampe (440 m)',
    tittel: 'Spart reisetid til City Lade – Modell B (forskriftsmessig rampe, 440 m)',
    beskrivelse: 'Samme destinasjonsforankrede analyse som over, med brulengde 440 m etter forskriftsmessig stigning.',
  },
  {
    gruppe: 'Lade idrettsanlegg',
    fil: 'figurer/kart_mal_lade_idrettsanlegg.png',
    kort: 'Modell A – flat (270 m)',
    tittel: 'Spart reisetid til Lade idrettsanlegg – Modell A (flat, 270 m)',
    beskrivelse: 'Hvert punkt på sydsiden av jernbanen er farget etter spart sykkelreisetid til Lade idrettsanlegg, med sentralbrua til stede.',
  },
  {
    gruppe: 'Lade idrettsanlegg',
    fil: 'figurer/kart_mal_lade_idrettsanlegg_stigning.png',
    kort: 'Modell B – rampe (440 m)',
    tittel: 'Spart reisetid til Lade idrettsanlegg – Modell B (forskriftsmessig rampe, 440 m)',
    beskrivelse: 'Samme destinasjonsforankrede analyse som over, med brulengde 440 m etter forskriftsmessig stigning.',
  },
  {
    gruppe: 'Lade Arena',
    fil: 'figurer/kart_mal_lade_arena.png',
    kort: 'Modell A – flat (270 m)',
    tittel: 'Spart reisetid til Lade Arena – Modell A (flat, 270 m)',
    beskrivelse: 'Hvert punkt på sydsiden av jernbanen er farget etter spart sykkelreisetid til Lade Arena, med sentralbrua til stede. Modell B genereres ikke for dette målet da besparelsen er tilnærmet null ved lengre brulengde.',
  },
];

// ── Modal ─────────────────────────────────────────────────────────────────────
let aktivFigurIndeks = 0;

function aapneModal() {
  const modal = document.getElementById('figurer-modal');
  modal.classList.remove('hidden');
  document.addEventListener('keydown', modalKeyHandler);
  if (document.getElementById('fig-liste').childElementCount === 0) byggFigurListe();
  visFigur(aktivFigurIndeks);
}

function lukkModal() {
  document.getElementById('figurer-modal').classList.add('hidden');
  document.removeEventListener('keydown', modalKeyHandler);
}

function modalBakgrunnKlikk(e) {
  if (e.target === document.getElementById('figurer-modal')) lukkModal();
}

function modalKeyHandler(e) {
  if (e.key === 'Escape') lukkModal();
  if (e.key === 'ArrowRight') visFigur(Math.min(aktivFigurIndeks + 1, FIGURER.length - 1));
  if (e.key === 'ArrowLeft')  visFigur(Math.max(aktivFigurIndeks - 1, 0));
}

function byggFigurListe() {
  const liste = document.getElementById('fig-liste');
  let sisteGruppe = null;

  FIGURER.forEach((fig, i) => {
    if (fig.gruppe !== sisteGruppe) {
      const gruppeEl = document.createElement('div');
      gruppeEl.className = 'fig-gruppe-tittel';
      gruppeEl.textContent = fig.gruppe;
      liste.appendChild(gruppeEl);
      sisteGruppe = fig.gruppe;
    }
    const el = document.createElement('button');
    el.className = 'fig-liste-item';
    el.dataset.indeks = i;
    el.textContent = fig.kort;
    el.addEventListener('click', () => visFigur(i));
    liste.appendChild(el);
  });
}

function visFigur(indeks) {
  aktivFigurIndeks = indeks;
  const fig = FIGURER[indeks];

  document.getElementById('fig-bilde').src = fig.fil;
  document.getElementById('fig-bilde').alt = fig.tittel;
  document.getElementById('fig-tittel').textContent = fig.tittel;
  document.getElementById('fig-beskrivelse').textContent = fig.beskrivelse;

  document.querySelectorAll('.fig-liste-item').forEach(el => {
    el.classList.toggle('aktiv', +el.dataset.indeks === indeks);
  });
}

// ── State ─────────────────────────────────────────────────────────────────────
let graf = null;
let nodeById = {};   // { nodeId(str) : { lat, lon } }
let adjBase = {};    // base adjacency without bridge

let map = null;
let selectedModel = 'A';
let speedKmh = 15;

const pts = { A: null, B: null };  // { lat, lon, nodeId }
const lyr = {
  markerA: null, markerB: null,
  snapA: null,   snapB: null,
  routeBase: null, routeBru: null,
};

// ── Startup ───────────────────────────────────────────────────────────────────
async function init() {
  map = L.map('map').setView([63.440, 10.452], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  let resp;
  try {
    resp = await fetch('data/graf.json');
    if (!resp.ok) throw new Error(resp.statusText);
    graf = await resp.json();
  } catch (e) {
    document.getElementById('loading').textContent =
      'Klarte ikke laste graf.json – kjør fra web/ med: python -m http.server';
    return;
  }
  document.getElementById('loading').style.display = 'none';

  // Node lookup
  for (const n of graf.noder) nodeById[n.id] = { lat: n.lat, lon: n.lon };

  adjBase = buildAdjacency(graf.kanter);

  drawContextLayers();

  // Update bridge model button labels with actual lengths from data
  const ma = graf.meta.bru_modeller.A;
  const mb = graf.meta.bru_modeller.B;
  document.getElementById('btn-A').textContent = `A – flat (${ma.bru_lengde_m} m)`;
  document.getElementById('btn-B').textContent = `B – rampe (${mb.bru_lengde_m} m)`;
  updateModellNote();

  document.getElementById('fart-slider').addEventListener('input', onSpeedChange);
  map.on('click', onMapClick);

  console.log(`Graf klar: ${graf.noder.length} noder, ${graf.kanter.length} kanter`);
}

// ── Context layers (bridges, bbox) ────────────────────────────────────────────
function drawContextLayers() {
  const [vest, syd, ost, nord] = graf.meta.bbox;
  L.rectangle([[syd, vest], [nord, ost]], {
    color: '#444', weight: 1, fill: false, dashArray: '5 4', opacity: 0.6,
  }).addTo(map).bindTooltip('Studieområde', { sticky: true });

  for (const b of (graf.kontekst?.eksist_bruer || [])) {
    L.circleMarker([b.lat, b.lon], {
      radius: 6, color: '#2196F3', fillColor: '#1565C0',
      fillOpacity: 0.9, weight: 2,
    }).bindTooltip(b.navn, { direction: 'top', permanent: false })
      .addTo(map);
  }

  const hyp = graf.kontekst?.hypotetisk;
  if (hyp) {
    L.circleMarker([hyp.lat, hyp.lon], {
      radius: 6, color: '#F44336', fillColor: '#b71c1c',
      fillOpacity: 0.85, weight: 2,
    }).bindTooltip('Hypotetisk sentralbru', { direction: 'top' })
      .addTo(map);
  }
}

// ── Adjacency ─────────────────────────────────────────────────────────────────
function buildAdjacency(kanter) {
  const adj = {};
  for (const n of graf.noder) adj[n.id] = [];
  for (const k of kanter) {
    adj[k.u].push({ to: k.v, len: k.len, geom: k.geom || null });
    const rev = k.geom ? [...k.geom].reverse() : null;
    adj[k.v].push({ to: k.u, len: k.len, geom: rev });
  }
  return adj;
}

function withBridgeAdj(model) {
  // Shallow-copy all edge lists so adjBase is never mutated
  const adj = {};
  for (const [id, edges] of Object.entries(adjBase)) adj[id] = [...edges];

  const bruLen = graf.meta.bru_modeller[model].bru_lengde_m;
  const { node_nord, node_syd, node_pt3, sti_len_m, inkluder_sti } = graf.bru;

  adj[node_nord].push({ to: node_syd, len: bruLen, geom: null });
  adj[node_syd].push({ to: node_nord, len: bruLen, geom: null });

  if (inkluder_sti) {
    adj[node_syd].push({ to: node_pt3, len: sti_len_m, geom: null });
    adj[node_pt3].push({ to: node_syd, len: sti_len_m, geom: null });
  }
  return adj;
}

// ── Nearest node ──────────────────────────────────────────────────────────────
function nearestNode(lat, lon) {
  // Simplified squared planar distance (valid for small area)
  const cosLat = Math.cos(lat * Math.PI / 180);
  let best = null, bestD = Infinity;
  for (const n of graf.noder) {
    const dlat = lat - n.lat;
    const dlon = (lon - n.lon) * cosLat;
    const d2 = dlat * dlat + dlon * dlon;
    if (d2 < bestD) { bestD = d2; best = n; }
  }
  return best;
}

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Dijkstra (min-heap) ───────────────────────────────────────────────────────
function dijkstra(adj, startId, endId) {
  const dist = {};
  const prev = {};  // prev[nodeId] = { from: nodeId, geom }
  dist[startId] = 0;
  const heap = [[0, startId]];

  while (heap.length > 0) {
    const [d, u] = heapPop(heap);
    if (u == endId) break;
    if (d > (dist[u] ?? Infinity)) continue;
    for (const edge of (adj[u] || [])) {
      const nd = d + edge.len;
      if (nd < (dist[edge.to] ?? Infinity)) {
        dist[edge.to] = nd;
        prev[edge.to] = { from: u, geom: edge.geom };
        heapPush(heap, [nd, edge.to]);
      }
    }
  }

  if (dist[endId] === undefined) return null;

  // Reconstruct: each step carries the geom FOR the edge arriving at that node
  const path = [];
  let cur = endId;
  while (cur != startId) {
    const p = prev[cur];
    path.unshift({ nodeId: +cur, geom: p.geom });
    cur = p.from;
  }
  path.unshift({ nodeId: +startId, geom: null });

  return { totalLen: dist[endId], path };
}

function heapPush(heap, item) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p][0] <= heap[i][0]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
      if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
      if (s === i) break;
      [heap[i], heap[s]] = [heap[s], heap[i]];
      i = s;
    }
  }
  return top;
}

// ── Route geometry ────────────────────────────────────────────────────────────
function pathToLatLngs(path) {
  const coords = [];
  for (let i = 1; i < path.length; i++) {
    const seg = path[i].geom;
    if (seg && seg.length > 0) {
      // Avoid duplicate junction point between segments
      coords.push(...(coords.length > 0 ? seg.slice(1) : seg));
    } else {
      const a = nodeById[path[i - 1].nodeId];
      const b = nodeById[path[i].nodeId];
      if (coords.length === 0) coords.push([a.lat, a.lon]);
      coords.push([b.lat, b.lon]);
    }
  }
  return coords;
}

function pathsIdentical(pathA, pathB) {
  if (!pathA || !pathB || pathA.length !== pathB.length) return false;
  return pathA.every((s, i) => s.nodeId === pathB[i].nodeId);
}

function usesBridge(path) {
  const { node_nord, node_syd } = graf.bru;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1].nodeId, b = path[i].nodeId;
    if ((a === node_nord && b === node_syd) || (a === node_syd && b === node_nord)) return true;
  }
  return false;
}

// ── Compute & render ──────────────────────────────────────────────────────────
function compute() {
  if (!pts.A || !pts.B) return;

  const adjMed  = withBridgeAdj(selectedModel);
  const speed_ms = speedKmh / 3.6;

  const rBasis = dijkstra(adjBase, pts.A.nodeId, pts.B.nodeId);
  const rBru   = dijkstra(adjMed,  pts.A.nodeId, pts.B.nodeId);

  clearRoutes();

  if (!rBasis) {
    setInfo('Ingen rute funnet mellom de valgte punktene.');
    document.getElementById('resultater').classList.add('hidden');
    return;
  }

  const tidBasis = rBasis.totalLen / speed_ms;
  const tidBru   = rBru ? rBru.totalLen / speed_ms : null;
  const besparelse = tidBru !== null ? tidBasis - tidBru : null;

  // Update results panel
  document.getElementById('instruksjon').classList.add('hidden');
  const res = document.getElementById('resultater');
  res.classList.remove('hidden');

  document.getElementById('tid-basis').textContent = fmtTid(tidBasis);
  document.getElementById('len-basis').textContent = Math.round(rBasis.totalLen);

  if (tidBru !== null) {
    document.getElementById('tid-bru').textContent = fmtTid(tidBru);
    document.getElementById('len-bru').textContent = Math.round(rBru.totalLen);

    const bes_s   = besparelse;
    const bes_pst = tidBasis > 0 ? ((bes_s / tidBasis) * 100).toFixed(1) : 0;
    document.getElementById('besparelse').textContent =
      bes_s > 1 ? `${fmtTid(bes_s)} (${bes_pst}%)` : '< 1 s';
  } else {
    document.getElementById('tid-bru').textContent  = '–';
    document.getElementById('len-bru').textContent  = '–';
    document.getElementById('besparelse').textContent = '–';
  }

  // Draw routes
  const coordsBasis = pathToLatLngs(rBasis.path);
  const identical   = rBru && pathsIdentical(rBasis.path, rBru.path);

  if (identical) {
    lyr.routeBase = L.polyline(coordsBasis, {
      color: '#888', weight: 5, opacity: 0.8,
    }).addTo(map);
    document.getElementById('bru-status').textContent =
      '= Identisk rute – brua gir ingen besparelse for denne reisen';
  } else {
    lyr.routeBase = L.polyline(coordsBasis, {
      color: '#FF6600', weight: 5, opacity: 0.85,
    }).addTo(map);

    if (rBru) {
      lyr.routeBru = L.polyline(pathToLatLngs(rBru.path), {
        color: '#1976D2', weight: 4, opacity: 0.9,
      }).addTo(map);
      document.getElementById('bru-status').textContent = usesBridge(rBru.path)
        ? '✓ Brua benyttes i ruten med bru'
        : '↺ Brua benyttes ikke – eksisterende rute er raskere';
    }
  }
}

function clearRoutes() {
  if (lyr.routeBase) { map.removeLayer(lyr.routeBase); lyr.routeBase = null; }
  if (lyr.routeBru)  { map.removeLayer(lyr.routeBru);  lyr.routeBru  = null; }
}

// ── Map click handler ─────────────────────────────────────────────────────────
function onMapClick(e) {
  const { lat, lng: lon } = e.latlng;

  if (!inBbox(lat, lon)) {
    setInfo('Klikk innenfor det stiplede studieområdet.');
    return;
  }

  const n    = nearestNode(lat, lon);
  const dist = Math.round(haversineM(lat, lon, n.lat, n.lon));

  if (!pts.A) {
    pts.A = { lat, lon, nodeId: n.id };
    placeMarker('A', lat, lon, n, dist);
    document.getElementById('punkt-A').textContent =
      `A: ${lat.toFixed(5)}, ${lon.toFixed(5)} (snap ${dist} m)`;
    setInfo('Klikk for å velge punkt <strong>B</strong>.');

  } else if (!pts.B) {
    pts.B = { lat, lon, nodeId: n.id };
    placeMarker('B', lat, lon, n, dist);
    document.getElementById('punkt-B').textContent =
      `B: ${lat.toFixed(5)}, ${lon.toFixed(5)} (snap ${dist} m)`;
    compute();

  } else {
    // Third click → reset to new A
    nullstill();
    pts.A = { lat, lon, nodeId: n.id };
    placeMarker('A', lat, lon, n, dist);
    document.getElementById('punkt-A').textContent =
      `A: ${lat.toFixed(5)}, ${lon.toFixed(5)} (snap ${dist} m)`;
    setInfo('Klikk for å velge punkt <strong>B</strong>.');
  }
}

function inBbox(lat, lon) {
  const [vest, syd, ost, nord] = graf.meta.bbox;
  return lon >= vest && lon <= ost && lat >= syd && lat <= nord;
}

// ── Markers ───────────────────────────────────────────────────────────────────
function placeMarker(pt, lat, lon, node, snapDist) {
  const mk = `marker${pt}`, sk = `snap${pt}`;
  if (lyr[mk]) map.removeLayer(lyr[mk]);
  if (lyr[sk]) map.removeLayer(lyr[sk]);

  const color = pt === 'A' ? '#4CAF50' : '#F44336';
  const icon = L.divIcon({
    html: `<div style="
      background:${color};color:#fff;border-radius:50%;
      width:28px;height:28px;display:flex;align-items:center;
      justify-content:center;font-weight:bold;font-size:14px;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);
    ">${pt}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], className: '',
  });

  lyr[mk] = L.marker([lat, lon], { icon, draggable: true })
    .addTo(map)
    .on('dragend', function(e) {
      const { lat: la, lng: lo } = e.target.getLatLng();
      if (!inBbox(la, lo)) { e.target.setLatLng([lat, lon]); return; }
      const nn = nearestNode(la, lo);
      const dd = Math.round(haversineM(la, lo, nn.lat, nn.lon));
      pts[pt] = { lat: la, lon: lo, nodeId: nn.id };
      document.getElementById(`punkt-${pt}`).textContent =
        `${pt}: ${la.toFixed(5)}, ${lo.toFixed(5)} (snap ${dd} m)`;
      if (lyr[sk]) map.removeLayer(lyr[sk]);
      lyr[sk] = L.polyline([[la, lo], [nn.lat, nn.lon]], snapStyle()).addTo(map);
      if (pts.A && pts.B) compute();
    });

  lyr[sk] = L.polyline([[lat, lon], [node.lat, node.lon]], snapStyle()).addTo(map);
}

function snapStyle() {
  return { color: '#aaa', weight: 1.5, dashArray: '4 4', opacity: 0.6 };
}

// ── Controls ──────────────────────────────────────────────────────────────────
function setModus(modus) {
  const defaults = { sykkel: 15, gange: 5 };
  speedKmh = defaults[modus];
  document.getElementById('fart-slider').value = speedKmh;
  document.getElementById('fart-label').textContent = speedKmh + ' km/t';
  document.getElementById('btn-sykkel').classList.toggle('active', modus === 'sykkel');
  document.getElementById('btn-gange').classList.toggle('active', modus === 'gange');
  if (pts.A && pts.B) compute();
}

function setBruModell(model) {
  selectedModel = model;
  document.getElementById('btn-A').classList.toggle('active', model === 'A');
  document.getElementById('btn-B').classList.toggle('active', model === 'B');
  updateModellNote();
  if (pts.A && pts.B) compute();
}

function onSpeedChange() {
  speedKmh = parseInt(this.value);
  document.getElementById('fart-label').textContent = speedKmh + ' km/t';
  if (pts.A && pts.B) compute();
}

function updateModellNote() {
  if (!graf) return;
  const m = graf.meta.bru_modeller[selectedModel];
  document.getElementById('modell-forklaring').textContent =
    `${m.navn} – bruinnslag pt1→pt2: ${m.bru_lengde_m} m`;
}

function nullstill() {
  pts.A = null; pts.B = null;
  ['markerA', 'markerB', 'snapA', 'snapB'].forEach(k => {
    if (lyr[k]) { map.removeLayer(lyr[k]); lyr[k] = null; }
  });
  clearRoutes();
  document.getElementById('punkt-A').textContent = 'A: klikk i kartet';
  document.getElementById('punkt-B').textContent = 'B: klikk i kartet';
  document.getElementById('resultater').classList.add('hidden');
  setInfo('Klikk et punkt <strong>A</strong> i kartet, deretter punkt <strong>B</strong>.');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTid(sek) {
  const m = Math.floor(sek / 60);
  const s = Math.round(sek % 60);
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

function setInfo(html) {
  const el = document.getElementById('instruksjon');
  el.innerHTML = html;
  el.classList.remove('hidden');
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
