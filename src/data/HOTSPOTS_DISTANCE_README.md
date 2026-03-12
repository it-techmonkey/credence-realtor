# Hotspots distance & drive time

## Data file

- **hotspots-distance.json** — For each project (keyed by `slug`), distances in km to three hotspots.

## How distance is calculated

**Haversine formula** (great-circle distance between two lat/lng points on Earth):

1. Earth radius: **R = 6,371 km**
2. Convert latitude/longitude differences to radians:  
   `Δlat_rad = (lat2 − lat1) × π/180`, `Δlng_rad = (lng2 − lng1) × π/180`
3. Intermediate:  
   `a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)`
4. Angular distance:  
   `c = 2 × atan2(√a, √(1−a))`
5. Distance in km:  
   **d = R × c**

Property coordinates come from **all_data_uae_en.json** (`latitude`, `longitude`). Hotspot coordinates:

- **Dubai Mall:** 25.197370022081568, 55.27972320239539  
- **Palm Jumeirah:** 25.122538324435176, 55.13069276013228  
- **Dubai Airport:** 25.25304319313163, 55.36793713040664  

To regenerate:  
`node scripts/build-hotspots-distance.js`

## How drive time is calculated

Drive time is **estimated** from the straight-line distance, not from road routing:

- Assumed average speed: **40 km/h** (typical Dubai urban/suburban).
- Formula: **time (minutes) = (distance_km / 40) × 60 = distance_km × 1.5**
- The UI shows a band (e.g. "10–15 mins", "20–30 mins") for readability.

So this is an approximation; actual drive time depends on route and traffic.
