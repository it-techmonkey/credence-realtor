import recentLaunches from '@/data/recent-launches.json';
import topPicks from '@/data/top-picks.json';

function parseReadyDate(readyDate) {
  if (!readyDate) return 0;
  const m = String(readyDate).match(/Q(\d)\s*(\d{4})/i);
  if (!m) return 0;
  const q = parseInt(m[1], 10);
  const y = parseInt(m[2], 10);
  return y + (q - 1) / 4;
}

/** Merge recent-launches + top-picks, sort by readyDate (newest first), return up to limit */
export function getLatestProperties(limit = 6) {
  const combined = [
    ...recentLaunches.map((p) => ({ ...p, id: String(p.id), sortKey: parseReadyDate(p.readyDate) })),
    ...topPicks.map((p) => ({ ...p, id: p.id, sortKey: parseReadyDate(p.readyDate) })),
  ];
  combined.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0));
  return combined.slice(0, limit).map(({ sortKey, ...p }) => p);
}
