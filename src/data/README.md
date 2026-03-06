# Featured properties data (manual)

Use these JSON files to drive **Most Recent Launches** and **Our Top Picks** on the homepage.

## Files

- **`recent-launches.json`** – array of 4 items (display order: 1 → 4).
- **`top-picks.json`** – array of 3 items (display order: 1 → 3).

## Category & amenities data

- **`propertyCategories.config.json`** – Affordable max price (1.5M AED), luxury developer names (Binghatti, Emaar, DAMAC, Jacob, Imtiaz), category order.
- **`waterfront-slugs.json`** – Slugs of island/lagoon projects (Waterfront filter). Add or remove slugs to match your catalog.
- **`office-slugs.json`** – Slugs of office projects (Office filter, separate from Commercial).
- **`commercial-slugs.json`** – Slugs of commercial (non-office) projects.
- **`descriptions.json`** – Map of project slug → HTML description string. When a slug is present here, the app uses this for the property description and **does not call the Alnair look API** for that project (avoids rate limiting). Amenities are parsed from the description text (e.g. "Amenities:" sections and list items); you can still override with `amenities.json` per slug.
- **`amenities.json`** – Optional map of project slug → amenities array. When present for a slug, it overrides amenities parsed from descriptions. Can be filled by `node scripts/fetch-amenities.js` (uses Alnair API with `--delay 2000` recommended).

## Shape of each item

Each item in the arrays must have these fields (same as the API property objects used in the cards):

| Field        | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `id`        | number or string | Yes | Unique id; used for key and `/properties/[id]` link. |
| `title`     | string | Yes | Project name (e.g. "Emaar Expo City Terra woods"). |
| `developer` | string | No  | Developer name (e.g. "Emaar Properties"). Shown as "Developer: ...". |
| `location`  | string | No  | Area/location (e.g. "Expo City"). |
| `mainImage` | string | No  | Image URL. Fallback: `/assets/villa.png` if missing. |
| `price`     | number | No  | Starting price in AED. Shown as "AED X" (formatted). |
| `readyDate` | string | No  | Handover/delivery date. Any parseable date or year string; "TBA" if missing. |

## Example

**`recent-launches.json`** (order = display order):

```json
[
  {
    "id": 1,
    "title": "Emaar Expo City Terra woods",
    "developer": "Emaar Properties",
    "location": "Expo City",
    "mainImage": "https://example.com/terra.jpg",
    "price": 1200000,
    "readyDate": "2026"
  },
  {
    "id": 2,
    "title": "Binghatti City Mercedes meydan",
    "developer": "Binghatti",
    "location": "Dubai",
    "mainImage": "",
    "price": 950000,
    "readyDate": "2027"
  }
]
```

**`top-picks.json`** – same shape, 3 items.

Once these two files are in place with your 7 properties, the homepage can be wired to load them here instead of from the API for these two sections.
