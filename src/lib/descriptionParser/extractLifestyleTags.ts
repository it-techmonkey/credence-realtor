/**
 * Extract lifestyle tags from description text (luxury, waterfront, family friendly, etc.).
 * Pure and composable.
 */
const LIFESTYLE_PATTERNS: { pattern: RegExp; tag: string }[] = [
  { pattern: /\bluxury|luxurious|premium|exclusive\b/gi, tag: 'luxury' },
  { pattern: /\bwaterfront|marina|beachfront|sea view\b/gi, tag: 'waterfront' },
  { pattern: /\bgolf\s*(?:course|community|view)?\b/gi, tag: 'golf community' },
  { pattern: /\bfamily\s*friendly|families|kids\b/gi, tag: 'family friendly' },
  { pattern: /\bresort\s*style|resort\s*living|residential\s*resort\b/gi, tag: 'resort style' },
  { pattern: /\bmodern|contemporary|designer\b/gi, tag: 'modern' },
  { pattern: /\bpet\s*friendly|pets?\b/gi, tag: 'pet friendly' },
  { pattern: /\bgreen|sustainable|eco\b/gi, tag: 'sustainable' },
  { pattern: /\bhigh\s*end|high-end|upscale\b/gi, tag: 'luxury' },
];

export function extractLifestyleTags(plainText: string): string[] {
  if (!plainText || typeof plainText !== 'string') return [];
  const seen = new Set<string>();

  for (const { pattern, tag } of LIFESTYLE_PATTERNS) {
    if (pattern.test(plainText)) seen.add(tag);
  }

  return Array.from(seen);
}
