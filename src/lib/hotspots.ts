/**
 * Hotspot distances and drive-time estimates.
 *
 * DISTANCE: Stored values are straight-line (Haversine) in km. Road distance is estimated as
 *   straight_line_km × ROAD_DISTANCE_FACTOR (1.15) — a typical urban factor (roads are longer than straight line).
 *
 * DRIVE TIME: Based on estimated road distance at 40 km/h average.
 */

import hotspotsDistanceData from '@/data/hotspots-distance.json';

/** Factor to convert straight-line distance to estimated road distance (by car). Typical urban 1.2–1.4; 1.15 is conservative. */
export const ROAD_DISTANCE_FACTOR = 1.15;

/** Convert straight-line distance (km) to estimated road distance (km) for display / drive time. */
export function straightLineToRoadKm(straightLineKm: number): number {
  if (!Number.isFinite(straightLineKm) || straightLineKm < 0) return 0;
  return Math.round(straightLineKm * ROAD_DISTANCE_FACTOR * 10) / 10;
}

export type HotspotKey = 'dubai_mall' | 'palm_jumeirah' | 'dubai_airport' | 'dubai_marina' | 'al_maktoum_airport';

export interface HotspotDistances {
  dubai_mall_km: number;
  palm_jumeirah_km: number;
  dubai_airport_km: number;
  dubai_marina_km: number;
  al_maktoum_airport_km: number;
}

const HOTSPOT_LABELS: Record<HotspotKey, string> = {
  dubai_mall: 'Dubai Mall',
  palm_jumeirah: 'Palm Jumeirah',
  dubai_airport: 'Dubai Airport',
  dubai_marina: 'Dubai Marina',
  al_maktoum_airport: 'Al Maktoum International Airport',
};

const data = hotspotsDistanceData as Record<string, HotspotDistances>;

/**
 * Get distance (km) and drive-time label from a distance in km.
 * Formula: drive time (mins) ≈ (distance_km / 40) * 60 = distance_km * 1.5 (assuming 40 km/h average).
 * Returns a human-readable band, e.g. "10–15 mins", "40–45 mins".
 */
export function distanceToDriveTime(distanceKm: number): string {
  if (distanceKm <= 0 || !Number.isFinite(distanceKm)) return '—';
  const mins = distanceKm * 1.5; // 40 km/h → (km/40)*60
  if (mins <= 7) return '~5–10 mins';
  if (mins <= 12) return '10–15 mins';
  if (mins <= 20) return '15–20 mins';
  if (mins <= 30) return '20–30 mins';
  if (mins <= 45) return '30–45 mins';
  return '40–50 mins';
}

/**
 * Get hotspot distances for a project by slug (or id_123 fallback).
 * Returns null if no data.
 */
export function getHotspotDistances(slugOrId: string | undefined | null): HotspotDistances | null {
  if (!slugOrId || typeof slugOrId !== 'string') return null;
  const key = slugOrId.trim();
  if (!key) return null;
  const entry = data[key] ?? data[key.toLowerCase()];
  return entry && typeof (entry as HotspotDistances).dubai_mall_km === 'number' ? (entry as HotspotDistances) : null;
}

/**
 * Display label for a hotspot key.
 */
export function getHotspotLabel(key: HotspotKey): string {
  return HOTSPOT_LABELS[key];
}

/**
 * Get distance in km for a hotspot from HotspotDistances. Type-safe.
 */
export function getHotspotDistanceKm(distances: HotspotDistances | null, key: HotspotKey): number | undefined {
  if (!distances) return undefined;
  const k = `${key}_km` as keyof HotspotDistances;
  const val = distances[k];
  return typeof val === 'number' ? val : undefined;
}

/**
 * Check if a place name (e.g. from nearby facilities) matches a known hotspot.
 * Returns the hotspot key if it matches (case-insensitive, partial match).
 */
export function matchHotspot(placeName: string): HotspotKey | null {
  if (!placeName || typeof placeName !== 'string') return null;
  const n = placeName.toLowerCase().trim();
  if (n.includes('dubai mall') || n === 'dubai mall') return 'dubai_mall';
  if (n.includes('palm jumeirah') || n.includes('palm jumeriah') || n === 'palm') return 'palm_jumeirah';
  if (n.includes('dubai airport') || n.includes('dxb') || (n.includes('airport') && n.includes('dubai') && !n.includes('maktoum'))) return 'dubai_airport';
  if (n.includes('dubai marina') || n === 'dubai marina') return 'dubai_marina';
  if (n.includes('maktoum') || n.includes('al maktoum')) return 'al_maktoum_airport';
  return null;
}

/** All hotspot keys in display order. */
export const HOTSPOT_KEYS: HotspotKey[] = ['dubai_mall', 'palm_jumeirah', 'dubai_airport', 'dubai_marina', 'al_maktoum_airport'];

export { HOTSPOT_LABELS };
