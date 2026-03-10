"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { containsArabic, translateToEnglish } from "@/lib/translate";

const MultiPropertyMap = dynamic(() => import("@/components/MultiPropertyMap"), {
  ssr: false,
});

const PropertyInfoPanel = dynamic(() => import("@/components/PropertyInfoPanel"), {
  ssr: false,
});

// Static API returns projects with: id, slug, title, mainImage, gallery, city, locality, developer, price, latitude, longitude
const STATIC_API = "/api/projects/static";

// Default developer filter options (names only; static API filters by developer name)
const DEFAULT_DEVELOPER_FILTERS = ["All"];

interface Property {
  propertyId: number;
  id?: string;
  slug?: string;
  title: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  images: string[];
  developer?: string;
  propertyType?: string[];
  description?: string;
  latitude?: number;
  longitude?: number;
}

interface StaticProject {
  id: number;
  slug?: string;
  title: string;
  mainImage?: string | null;
  gallery?: string[];
  city?: string;
  locality?: string;
  location?: string;
  developer?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number;
}

/** When provided, the map fetches with these filters so markers highlight only matching properties (e.g. from properties page filter/category). */
export interface MapFilters {
  category?: string;
  developer?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  locality?: string;
}

interface HotspotsProps {
  title?: string;
  showTitle?: boolean;
  showFilters?: boolean;
  filterOptions?: string[];
  className?: string;
  developerFilters?: string[];
  showDeveloperFilters?: boolean;
  selectedDeveloper?: string;
  onDeveloperChange?: (developer: string) => void;
  areaFilters?: string[];
  showAreaFilters?: boolean;
  selectedArea?: string;
  onAreaChange?: (area: string) => void;
  /** Sync map with page filters: only show properties matching these filters (category, developer, bedrooms, price, locality). */
  mapFilters?: MapFilters;
}

function mapStaticProjectToHotspotProperty(p: StaticProject, index: number): Property {
  const propertyId = typeof p.id === "number" ? (p.id + index) % 1000000 : index;
  const mainImage = p.mainImage || (Array.isArray(p.gallery) && p.gallery[0]) || "";
  const gallery = p.gallery || [];
  const images = [mainImage, ...gallery.filter((src) => src && src !== mainImage)].filter(Boolean);
  const location = p.locality || p.location || p.city || "";
  const price = p.price ?? p.minPrice ?? p.maxPrice ?? 0;
  return {
    propertyId,
    id: String(p.id),
    slug: p.slug,
    title: p.title || "Untitled Property",
    location,
    bedrooms: typeof p.bedrooms === "number" && p.bedrooms >= 0 ? p.bedrooms : 0,
    bathrooms: 0,
    price,
    images: images.length > 0 ? images : [],
    developer: p.developer || undefined,
    propertyType: [],
    latitude: p.latitude != null && !isNaN(Number(p.latitude)) ? Number(p.latitude) : undefined,
    longitude: p.longitude != null && !isNaN(Number(p.longitude)) ? Number(p.longitude) : undefined,
  };
}

export default function Hotspots({
  title = "Choose from Top Developers",
  showTitle = true,
  showFilters = true,
  filterOptions = ["All", "Villa", "2 BHK", "3 BHK", "1 BHK"],
  className = "",
  developerFilters,
  showDeveloperFilters = false,
  selectedDeveloper: externalSelectedDeveloper,
  onDeveloperChange,
  areaFilters,
  showAreaFilters = false,
  selectedArea: externalSelectedArea,
  onAreaChange,
  mapFilters,
}: HotspotsProps = {}) {
  const effectiveDeveloperFilters = developerFilters ?? DEFAULT_DEVELOPER_FILTERS;
  const effectiveAreaFilters = areaFilters ?? ["All"];
  const [propertyType, setPropertyType] = useState("All");
  const [internalSelectedDeveloper, setInternalSelectedDeveloper] = useState("All");
  const [internalSelectedArea, setInternalSelectedArea] = useState("All");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const selectedDeveloper = externalSelectedDeveloper !== undefined ? externalSelectedDeveloper : internalSelectedDeveloper;
  const selectedArea = externalSelectedArea !== undefined ? externalSelectedArea : internalSelectedArea;
  const effectiveMapFilters = mapFilters;

  const handleDeveloperChange = (developer: string) => {
    if (onDeveloperChange) onDeveloperChange(developer);
    else setInternalSelectedDeveloper(developer);
  };

  const handleAreaChange = (area: string) => {
    if (onAreaChange) onAreaChange(area);
    else setInternalSelectedArea(area);
  };

  useEffect(() => {
    const fetchPropertiesFromStatic = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "200");

        if (effectiveMapFilters) {
          if (effectiveMapFilters.category && effectiveMapFilters.category !== "All") {
            params.set("category", effectiveMapFilters.category);
          }
          if (effectiveMapFilters.developer) params.set("developer", effectiveMapFilters.developer);
          if (effectiveMapFilters.bedrooms !== undefined && effectiveMapFilters.bedrooms > 0) {
            params.set("bedrooms", String(effectiveMapFilters.bedrooms));
          }
          if (effectiveMapFilters.minPrice !== undefined && effectiveMapFilters.minPrice > 0) {
            params.set("minPrice", String(effectiveMapFilters.minPrice));
          }
          if (effectiveMapFilters.maxPrice !== undefined && effectiveMapFilters.maxPrice > 0) {
            params.set("maxPrice", String(effectiveMapFilters.maxPrice));
          }
          if (effectiveMapFilters.locality) params.set("locality", effectiveMapFilters.locality);
        }
        if (!effectiveMapFilters || !effectiveMapFilters.developer) {
          if (selectedDeveloper && selectedDeveloper !== "All") {
            params.set("developer", selectedDeveloper);
          }
        }
        if (!effectiveMapFilters || !effectiveMapFilters.locality) {
          if (selectedArea && selectedArea !== "All") {
            params.set("locality", selectedArea);
          }
        }

        const response = await fetch(`${STATIC_API}?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          setProperties([]);
          return;
        }

        const result = await response.json();
        const items: StaticProject[] = result?.success && Array.isArray(result?.data) ? result.data : [];

        let mapped: Property[] = items.map((item, index) => mapStaticProjectToHotspotProperty(item, index));

        if (propertyType === "1 BHK") {
          mapped = mapped.filter((p) => p.bedrooms === 1);
        } else if (propertyType === "2 BHK") {
          mapped = mapped.filter((p) => p.bedrooms === 2);
        } else if (propertyType === "3 BHK") {
          mapped = mapped.filter((p) => p.bedrooms === 3);
        } else if (propertyType === "Villa") {
          mapped = mapped.filter((p) => (p.title || "").toLowerCase().includes("villa"));
        }

        if (selectedArea && selectedArea !== "All") {
          const normalizedArea = selectedArea.toLowerCase().replace(/[^a-z0-9]/g, "");
          mapped = mapped.filter((p) => {
            const loc = (p.location || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return loc.includes(normalizedArea) || normalizedArea.includes(loc);
          });
        }

        const stringsToTranslate = new Set<string>();
        mapped.forEach((p) => {
          if (p.title && containsArabic(p.title)) stringsToTranslate.add(p.title);
          if (p.location && containsArabic(p.location)) stringsToTranslate.add(p.location);
          if (p.developer && containsArabic(p.developer)) stringsToTranslate.add(p.developer);
        });
        const translationCache: Record<string, string> = {};
        if (stringsToTranslate.size > 0) {
          await Promise.all(
            Array.from(stringsToTranslate).map(async (str) => {
              translationCache[str] = await translateToEnglish(str);
            })
          );
        }
        const translated = mapped.map((p) => ({
          ...p,
          title: (p.title && translationCache[p.title]) || p.title,
          location: (p.location && translationCache[p.location]) || p.location,
          developer: (p.developer && translationCache[p.developer]) || p.developer,
        }));

        setProperties(translated);
        setSelectedProperty(null);
      } catch (err) {
        console.error("Error fetching properties from static API:", err);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertiesFromStatic();
  }, [
    propertyType,
    selectedDeveloper,
    selectedArea,
    effectiveMapFilters?.category,
    effectiveMapFilters?.developer,
    effectiveMapFilters?.bedrooms,
    effectiveMapFilters?.minPrice,
    effectiveMapFilters?.maxPrice,
    effectiveMapFilters?.locality,
  ]);

  const handleMarkerClick = (property: Property) => setSelectedProperty(property);
  const handleClosePanel = () => setSelectedProperty(null);

  const isDarkBackground = className.includes("bg-transparent") || className.includes("bg-[#1a1a1a]");
  const hasCustomPadding = className.includes("px-0") || className.includes("py-0");
  const borderRadiusClass = className.includes("rounded-")
    ? className.match(/rounded-\[?[\w-]+\]?/)?.[0] || "rounded-2xl"
    : "rounded-2xl";

  return (
    <section className={`${isDarkBackground ? "bg-transparent" : "bg-white"} ${hasCustomPadding ? "" : "px-6 md:px-12 lg:px-20 py-20"} ${className}`}>
      {showTitle && (
        <h2 className={`text-center text-2xl md:text-4xl font-display font-medium ${isDarkBackground ? "text-white" : "text-secondary"} mb-6`}>
          {title}
        </h2>
      )}

      {showDeveloperFilters && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {effectiveDeveloperFilters.map((developer) => (
            <button
              key={developer}
              onClick={() => handleDeveloperChange(developer)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedDeveloper === developer
                  ? isDarkBackground
                    ? "bg-white text-black border border-white"
                    : "bg-[#C5A365] text-white shadow-md"
                  : isDarkBackground
                  ? "bg-transparent text-gray-400 border border-white/20 hover:border-white hover:text-white hover:bg-white/10"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-[#C5A365] hover:text-[#C5A365] hover:shadow-md"
              }`}
            >
              {developer}
            </button>
          ))}
        </div>
      )}

      {showAreaFilters && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {effectiveAreaFilters.map((area) => (
            <button
              key={area}
              onClick={() => handleAreaChange(area)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedArea === area
                  ? isDarkBackground
                    ? "bg-white text-black border border-white"
                    : "bg-[#C5A365] text-white shadow-md"
                  : isDarkBackground
                  ? "bg-transparent text-gray-400 border border-white/20 hover:border-white hover:text-white hover:bg-white/10"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-[#C5A365] hover:text-[#C5A365] hover:shadow-md"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
          {filterOptions.map((type) => (
            <button
              key={type}
              onClick={() => setPropertyType(type)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-medium text-sm md:text-base transition-all ${
                propertyType === type
                  ? "bg-[#C5A365] text-white shadow-md"
                  : isDarkBackground
                  ? "bg-white/10 text-white border border-white/20 hover:border-[#C5A365] hover:text-[#C5A365]"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-[#C5A365] hover:text-[#C5A365]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className={`relative w-full ${borderRadiusClass} overflow-hidden`} style={{ height: "600px" }}>
        {isLoading ? (
          <div className={`flex items-center justify-center ${isDarkBackground ? "bg-gray-800" : "bg-gray-100"} ${borderRadiusClass} h-full`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A365]"></div>
          </div>
        ) : (
          <>
            <MultiPropertyMap
              properties={properties}
              height="600px"
              onMarkerClick={handleMarkerClick}
              selectedPropertyId={selectedProperty?.propertyId}
            />
            {selectedProperty && (
              <PropertyInfoPanel property={selectedProperty} onClose={handleClosePanel} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
