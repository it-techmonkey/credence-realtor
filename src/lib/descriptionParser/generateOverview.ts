import { stripHtml } from './stripHtml';

const MAX_OVERVIEW_LENGTH = 220;

/**
 * Generate a short summary paragraph from cleaned description.
 * Takes first meaningful sentences up to ~220 chars.
 * Pure and composable.
 */
export function generateOverview(cleanedDescription: string): string {
  if (!cleanedDescription || typeof cleanedDescription !== 'string') return '';
  const text = stripHtml(cleanedDescription).trim();
  if (!text) return '';

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let out = '';
  for (const s of sentences) {
    if ((out + ' ' + s).trim().length <= MAX_OVERVIEW_LENGTH) {
      out = (out + ' ' + s).trim();
    } else {
      if (!out) out = s.slice(0, MAX_OVERVIEW_LENGTH);
      break;
    }
  }
  return out || text.slice(0, MAX_OVERVIEW_LENGTH);
}
