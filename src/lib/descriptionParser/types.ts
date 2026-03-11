/**
 * Normalized output of the description parser.
 * Used by the UI to render Overview, Amenities, Nearby, Distances sections.
 */
export interface NormalizedDescription {
  overview: string;
  amenities: string[];
  lifestyle_tags: string[];
  nearby: string[];
  distances: Record<string, string>;
  cleaned_description: string;
}

/** Keyword → normalized amenity id (aligns with amenity-enums.json keys). */
export const AMENITY_KEYWORD_MAP: Record<string, string[]> = {
  pool: ['pool', 'swimming pool', 'infinity pool', 'lap pool', 'rooftop pool'],
  gym: ['gym', 'fitness center', 'fitness studio', 'fitness area'],
  yoga_space: ['yoga', 'meditation', 'zumba'],
  spa: ['spa', 'wellness', 'hammam'],
  sauna: ['sauna'],
  steam_room: ['steam room'],
  jacuzzi: ['jacuzzi'],
  bbq_area: ['bbq', 'barbecue'],
  cinema: ['cinema', 'private cinema', 'movie'],
  kids_play_area: ['kids play', 'playground', 'children', "children's", 'kids pool', 'kids area'],
  garden: ['garden', 'landscaped', 'lawn', 'pavilion'],
  zen_garden: ['zen garden', 'japanese garden'],
  co_working: ['co-working', 'coworking'],
  lounge: ['lounge', 'lobby'],
  parking: ['parking'],
  ev_charging: ['ev charging', 'electric car', 'car charging'],
  concierge: ['concierge', '24/7', 'serviced lobby'],
  restaurant: ['restaurant', 'cafe', 'cafes'],
  retail_shops: ['retail', 'shops', 'shopping', 'mall', 'supermarket'],
  smart_home: ['smart home', 'smart key', 'fingerprint', 'smart key system'],
  running_track: ['running track', 'jogging', 'walking track'],
  rooftop: ['rooftop', 'roof terrace'],
  beach_access: ['beach', 'beach access'],
  marina: ['marina', 'waterfront'],
  padel_court: ['padel', 'padel court'],
  kids_pool: ['kids pool', "kids' pool", 'children pool'],
  furniture_packages: ['furniture', 'furnished', 'furnishing'],
  proximity_medical: ['medical', 'hospital', 'clinic', 'proximity to medical'],
  close_to_airport: ['airport', 'close to airport'],
  party_hall: ['party', 'event hall', 'party hall', 'event space'],
};

/** Map keyword-map keys to amenity enum ids used in project-amenities / amenity-enums. */
export const AMENITY_KEY_TO_ENUM_ID: Record<string, string> = {
  pool: 'swimming_pool',
  gym: 'gym',
  yoga_space: 'yoga_wellness',
  spa: 'spa_area',
  sauna: 'spa_area',
  steam_room: 'spa_area',
  jacuzzi: 'jacuzzi',
  bbq_area: 'bbq_area',
  cinema: 'cinema',
  kids_play_area: 'kids_play_area',
  garden: 'garden',
  zen_garden: 'garden',
  co_working: 'co_working',
  lounge: 'cafe_restro',
  parking: 'parking',
  ev_charging: 'ev_charging',
  concierge: 'concierge',
  restaurant: 'cafe_restro',
  retail_shops: 'malls_nearby',
  smart_home: 'smart_home_system',
  running_track: 'running_track',
  rooftop: 'rooftop',
  beach_access: 'beach_access',
  marina: 'marina',
  padel_court: 'padel_court',
  kids_pool: 'kids_pool',
  furniture_packages: 'furniture_packages',
  proximity_medical: 'proximity_medical',
  close_to_airport: 'close_to_airport',
  party_hall: 'party_hall',
};
