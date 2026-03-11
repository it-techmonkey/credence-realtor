import {
  Waves,
  Dumbbell,
  Trophy,
  Film,
  Baby,
  Flame,
  Coffee,
  TreeDeciduous,
  Sofa,
  Smartphone,
  Bath,
  Sparkles,
  Clapperboard,
  Building2,
  Plane,
  ShoppingBag,
  Car,
  ConciergeBell,
  Mountain,
  Flower2,
  Building,
  Anchor,
  Gamepad2,
  Laptop,
  PartyPopper,
  CircleDot,
  Activity,
  Zap,
  Check,
  LucideIcon,
} from 'lucide-react';

/** Amenity enum id -> Lucide icon for consistent display across detail page and modal. */
export const AMENITY_ICONS: Record<string, LucideIcon> = {
  swimming_pool: Waves,
  gym: Dumbbell,
  sports: Trophy,
  theatre: Film,
  kids_play_area: Baby,
  bbq_area: Flame,
  cafe_restro: Coffee,
  garden: TreeDeciduous,
  furniture_packages: Sofa,
  smart_home_system: Smartphone,
  jacuzzi: Bath,
  spa_area: Sparkles,
  cinema: Clapperboard,
  proximity_medical: Building2,
  close_to_airport: Plane,
  malls_nearby: ShoppingBag,
  parking: Car,
  concierge: ConciergeBell,
  infinity_pool: Mountain,
  kids_pool: Baby,
  yoga_wellness: Flower2,
  rooftop: Building,
  beach_access: Waves,
  marina: Anchor,
  playground: Gamepad2,
  co_working: Laptop,
  party_hall: PartyPopper,
  padel_court: CircleDot,
  running_track: Activity,
  ev_charging: Zap,
};

export const DEFAULT_AMENITY_ICON = Check;

/** Enum id -> display label (for reference). Build reverse map so label → id for icon lookup. */
const AMENITY_LABELS: Record<string, string> = {
  swimming_pool: 'Swimming pool',
  gym: 'Gym',
  sports: 'Sports',
  theatre: 'Theatre',
  kids_play_area: 'Kids play area',
  bbq_area: 'BBQ area',
  cafe_restro: 'Cafe & Restro',
  garden: 'Garden',
  furniture_packages: 'Furniture Packages',
  smart_home_system: 'Smart home system',
  jacuzzi: 'Jacuzzi',
  spa_area: 'Spa Area',
  cinema: 'Cinema',
  proximity_medical: 'Proximity to medical facilities',
  close_to_airport: 'Close to Airport',
  malls_nearby: 'Malls nearby',
  parking: 'Parking',
  concierge: 'Concierge / 24/7 lobby',
  infinity_pool: 'Infinity pool',
  kids_pool: 'Kids pool',
  yoga_wellness: 'Yoga / Wellness',
  rooftop: 'Rooftop terrace',
  beach_access: 'Beach access',
  marina: 'Marina / Waterfront',
  playground: 'Playground',
  co_working: 'Co-working space',
  party_hall: 'Party / Event hall',
  padel_court: 'Padel court',
  running_track: 'Running / Jogging track',
  ev_charging: 'EV charging',
};

function normalizeLabelForMatch(label: string): string {
  return label.toLowerCase().replace(/[&/]/g, ' ').replace(/\s+/g, '_').trim();
}

/** Map normalized label -> enum id so we can resolve icon from label when id is missing. */
const LABEL_TO_ID: Record<string, string> = {};
Object.entries(AMENITY_LABELS).forEach(([id, label]) => {
  const key = normalizeLabelForMatch(label);
  if (!LABEL_TO_ID[key]) LABEL_TO_ID[key] = id;
  // Also map without underscores for "swimming pool" -> swimming_pool
  const key2 = label.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!LABEL_TO_ID[key2]) LABEL_TO_ID[key2] = id;
});

/** Resolve icon by enum id or by display label (when id is empty from API). */
export function getAmenityIcon(idOrLabel: string): LucideIcon {
  if (idOrLabel && AMENITY_ICONS[idOrLabel]) return AMENITY_ICONS[idOrLabel];
  const byLabel = idOrLabel && LABEL_TO_ID[normalizeLabelForMatch(idOrLabel)];
  if (byLabel) return AMENITY_ICONS[byLabel] ?? DEFAULT_AMENITY_ICON;
  return DEFAULT_AMENITY_ICON;
}

/** Get display label for amenity enum id (for parser-extracted amenities). */
export function getAmenityLabel(id: string): string {
  return AMENITY_LABELS[id] ?? id.replace(/_/g, ' ');
}
