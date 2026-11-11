// Heatmap of OpenStreetMap edits across Pakistan. The view cannot leave the country.
// The data file is an anonymous grid of edit counts (about 150 m cells) baked by
// `pnpm bake:osm`; it carries no account name, changeset ids or dates.
// MapLibre and the data load only when the section comes near the viewport.
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

type EditGrid = { origin: [number, number]; cell: number; cells: number[] };
type Status = 'idle' | 'loading' | 'ready' | 'error';
type EditPoint = {
  type: 'Feature';
  properties: { w: number };
  geometry: { type: 'Point'; coordinates: [number, number] };
};
type EditPoints = { type: 'FeatureCollection'; features: EditPoint[] };

// Pakistan's extent; LIMITS adds a small margin so the border is not flush with the frame.
const VIEW: [[number, number], [number, number]] = [
  [60.87, 23.43],
  [77.12, 37.09],
];
const LIMITS: [[number, number], [number, number]] = [
  [60.3, 22.9],
  [77.7, 37.6],
];

const C = {
  bg: '#0a1310',
  land: '#0d1a14',
  water: '#0c2422',
  roadMinor: '#15251e',
  roadMid: '#1d3329',
  roadMajor: '#2b483a',
  boundary: '#345345',
  label: '#94ab9e',
};

function toGeoJSON(grid: EditGrid): EditPoints {
  const { origin, cell, cells } = grid;
  const counts: number[] = [];
  for (let i = 2; i < cells.length; i += 3) counts.push(cells[i]!);
  counts.sort((a, b) => a - b);
  // Scale against the 99th percentile so a few very busy cells do not flatten the rest.
  const top = Math.max(1, counts[Math.floor(counts.length * 0.99)] ?? 1);
  const scale = Math.log1p(top);
  const features: EditPoint[] = [];
  for (let i = 0; i + 2 < cells.length; i += 3) {
    const w = Math.min(1, Math.log1p(cells[i + 2]!) / scale);
    features.push({
      type: 'Feature',
      properties: { w: Math.round(w * 1000) / 1000 },
      geometry: {
        type: 'Point',
        coordinates: [origin[0] + (cells[i]! + 0.5) * cell, origin[1] + (cells[i + 1]! + 0.5) * cell],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function buildStyle(data: EditPoints): StyleSpecification {
  const name = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      base: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
        attribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>',
      },
      edits: { type: 'geojson', data },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': C.bg } },
      {
        id: 'green',
        type: 'fill',
        source: 'base',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass']]],
        paint: { 'fill-color': C.land },
      },
      { id: 'park', type: 'fill', source: 'base', 'source-layer': 'park', paint: { 'fill-color': C.land } },
      { id: 'water', type: 'fill', source: 'base', 'source-layer': 'water', paint: { 'fill-color': C.water } },
      {
        id: 'waterway',
        type: 'line',
        source: 'base',
        'source-layer': 'waterway',
        paint: { 'line-color': C.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 13, 1.4] },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'base',
        'source-layer': 'transportation',
        minzoom: 12,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
        paint: { 'line-color': C.roadMinor, 'line-width': 0.6 },
      },
      {
        id: 'road-mid',
        type: 'line',
        source: 'base',
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.roadMid, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 13.5, 1.6] },
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'base',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.roadMajor, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 13.5, 2.4] },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'base',
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['==', ['get', 'class'], 'rail'],
        paint: { 'line-color': C.roadMid, 'line-width': 0.7, 'line-dasharray': [3, 3] },
      },
      {
        id: 'boundary',
        type: 'line',
        source: 'base',
        'source-layer': 'boundary',
        filter: ['all', ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': C.boundary, 'line-width': ['match', ['get', 'admin_level'], 2, 1.2, 0.7], 'line-dasharray': [4, 3] },
      },
      {
        id: 'edits-heat',
        type: 'heatmap',
        source: 'edits',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'w'], 0, 0.05, 1, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.12, 7, 0.3, 9, 0.55, 11, 0.9, 13.5, 1.5],
          'heatmap-radius': ['interpolate', ['exponential', 1.6], ['zoom'], 4, 3, 7, 4, 9, 5, 11, 11, 13.5, 32],
          'heatmap-opacity': 0.9,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(31,107,82,0)',
            0.06,
            'rgba(31,107,82,0.5)',
            0.28,
            'rgba(63,165,124,0.78)',
            0.52,
            'rgba(143,220,171,0.9)',
            0.76,
            '#e2bf6a',
            1,
            '#fff3d6',
          ],
        },
      },
      {
        id: 'places',
        type: 'symbol',
        source: 'base',
        'source-layer': 'place',
        filter: [
          'any',
          ['==', ['get', 'class'], 'city'],
          ['all', ['==', ['get', 'class'], 'town'], ['>=', ['zoom'], 8]],
          ['all', ['==', ['get', 'class'], 'suburb'], ['>=', ['zoom'], 10.5]],
        ],
        layout: {
          'text-field': name as never,
          'text-font': ['Noto Sans Regular'],
          'text-size': ['match', ['get', 'class'], 'city', 14, 'town', 12, 10.5],
          'text-letter-spacing': 0.06,
          'text-transform': 'uppercase',
          'text-max-width': 7,
          'text-padding': 6,
        },
        paint: {
          'text-color': C.label,
          'text-halo-color': 'rgba(10,19,16,0.85)',
          'text-halo-width': 1.4,
          'text-opacity': ['match', ['get', 'class'], 'suburb', 0.7, 1],
        },
      },
    ],
  };
}

export function EditHeatmap() {
  const frame = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const el = frame.current;
    const target = holder.current;
    if (!el || !target) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;

    const start = async () => {
      setStatus('loading');
      try {
        const [lib, grid] = await Promise.all([
          import('maplibre-gl'),
          fetch(`${import.meta.env.BASE_URL}data/osm-edits.json`).then((r) => {
            if (!r.ok) throw new Error(`edit grid ${r.status}`);
            return r.json() as Promise<EditGrid>;
          }),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);
        if (cancelled) return;
        lib.setWorkerUrl(workerUrl);
        map = new lib.Map({
          container: target,
          style: buildStyle(toGeoJSON(grid)),
          bounds: VIEW,
          fitBoundsOptions: { padding: 16 },
          maxBounds: LIMITS,
          minZoom: 3,
          maxZoom: 13.5,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map.touchZoomRotate.disableRotation();
        map.keyboard.disableRotation();
        map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
        map.once('load', () => {
          if (!cancelled) setStatus('ready');
        });
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: '500px 0px' },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <figure className="mp-heat">
      <div
        ref={frame}
        className="mp-heat__frame"
        data-status={status}
        role="region"
        aria-label="Interactive heatmap of OpenStreetMap edits across Pakistan"
      >
        <div ref={holder} className="mp-heat__map" />
        {status === 'error' && <p className="mp-heat__msg">The map could not be loaded in this browser.</p>}
      </div>
      <figcaption className="mp-heat__caption">
        <span className="mp-heat__scale" aria-hidden="true">
          <span>Fewer edits</span>
          <span className="mp-heat__ramp" />
          <span>More</span>
        </span>
        <span>Edits grouped into cells of about 150 m.</span>
      </figcaption>
    </figure>
  );
}
