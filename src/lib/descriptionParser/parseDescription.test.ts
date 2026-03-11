import { normalizePropertyDescription } from './parseDescription';
import { extractAmenities } from './extractAmenities';
import { extractDistances } from './extractDistances';
import { extractLifestyleTags } from './extractLifestyleTags';
import { stripHtml } from './stripHtml';

describe('stripHtml', () => {
  it('strips tags and decodes entities', () => {
    expect(stripHtml('<p>Hello &amp; world</p>')).toBe('Hello & world');
    expect(stripHtml('<div>Test</div>')).toBe('Test');
  });
});

describe('extractAmenities', () => {
  it('extracts pool and gym from text', () => {
    const text = 'Luxury complex with infinity pool, gym and BBQ area.';
    const out = extractAmenities(text);
    expect(out).toContain('swimming_pool');
    expect(out).toContain('gym');
    expect(out).toContain('bbq_area');
  });

  it('returns empty for empty input', () => {
    expect(extractAmenities('')).toEqual([]);
    expect(extractAmenities('   ')).toEqual([]);
  });
});

describe('extractDistances', () => {
  it('extracts minutes from place', () => {
    const text = 'Located 10 minutes from Dubai Marina and 20 minutes from airport.';
    const out = extractDistances(text);
    expect(Object.keys(out).length).toBeGreaterThanOrEqual(1);
  });
});

describe('extractLifestyleTags', () => {
  it('extracts luxury and waterfront', () => {
    const text = 'Luxury waterfront residence with marina views.';
    const out = extractLifestyleTags(text);
    expect(out).toContain('luxury');
    expect(out).toContain('waterfront');
  });
});

describe('normalizePropertyDescription', () => {
  it('returns structured object', () => {
    const raw =
      '<p>Luxury residential complex with infinity pool, gym, BBQ area, located 10 minutes from Dubai Marina.</p>';
    const out = normalizePropertyDescription(raw);
    expect(out).toHaveProperty('overview');
    expect(out).toHaveProperty('amenities');
    expect(out).toHaveProperty('lifestyle_tags');
    expect(out).toHaveProperty('nearby');
    expect(out).toHaveProperty('distances');
    expect(out).toHaveProperty('cleaned_description');
    expect(Array.isArray(out.amenities)).toBe(true);
    expect(Array.isArray(out.lifestyle_tags)).toBe(true);
    expect(Array.isArray(out.nearby)).toBe(true);
    expect(typeof out.distances).toBe('object');
  });
});
