"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { geocodeRegion } from "@/utils/geocodeRegion";
import { formatPrice } from "@/utils/formatPrice";
import { getDeveloperIdByName, fetchDevelopersMapping, DEVELOPERS } from "@/utils/developerMapping";
import { containsArabic, translateToEnglish } from "@/lib/translate";

const MultiPropertyMap = dynamic(() => import("@/components/MultiPropertyMap"), {
  ssr: false,
});

const PropertyInfoPanel = dynamic(() => import("@/components/PropertyInfoPanel"), {
  ssr: false,
});

// Alnair API endpoint (called directly from browser to bypass Cloudflare)
// API returns Arabic by default (UAE locale); we request English and translate any remaining Arabic
const ALNAIR_API_URL = 'https://api.alnair.ae/project/find';

// Helper function to get top 10 developers (computed lazily to avoid webpack issues)
function getTop10DeveloperFilters(): string[] {
  const top10DeveloperIds = [6, 442, 89, 988, 64, 335, 510, 55, 69, 536];
  const top10Developers = top10DeveloperIds
    .map(id => DEVELOPERS.find(d => d.id === id))
    .filter((d): d is NonNullable<typeof d> => d !== undefined);
  return ["All", ...top10Developers.map(d => d.name.toUpperCase())];
}

interface Property {
  propertyId: number; // Numeric ID for compatibility with MultiPropertyMap
  id?: string; // UUID from API (for navigation)
  slug?: string; // Slug for SEO-friendly URLs
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

// Alnair API response interfaces
interface AlnairProject {
  id: number;
  slug: string;
  title: string;
  latitude?: number;
  longitude?: number;
  logo?: { src: string };
  cover?: { src: string };
  construction_percent?: number;
  builder?: string;
  district?: { id?: string; title?: string };
  statistics?: {
    total?: {
      price_from?: number;
      price_to?: number;
      units_count?: number;
    };
    units?: Record<string, any>;
  };
  photos?: { src: string }[];
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
  onAreaChange
}: HotspotsProps = {}) {
  // Compute default developer filters if not provided (lazy evaluation to avoid webpack issues)
  const effectiveDeveloperFilters = developerFilters ?? getTop10DeveloperFilters();
  const effectiveAreaFilters = areaFilters ?? ["All"];
  const [propertyType, setPropertyType] = useState("All");
  const [internalSelectedDeveloper, setInternalSelectedDeveloper] = useState("All");
  const [internalSelectedArea, setInternalSelectedArea] = useState("All");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [developerMapping, setDeveloperMapping] = useState<Map<string, string>>(new Map());
  
  // Use external developer if provided, otherwise use internal state
  const selectedDeveloper = externalSelectedDeveloper !== undefined ? externalSelectedDeveloper : internalSelectedDeveloper;
  const selectedArea = externalSelectedArea !== undefined ? externalSelectedArea : internalSelectedArea;
  
  const handleDeveloperChange = (developer: string) => {
    if (onDeveloperChange) {
      onDeveloperChange(developer);
    } else {
      setInternalSelectedDeveloper(developer);
    }
  };

  const handleAreaChange = (area: string) => {
    if (onAreaChange) {
      onAreaChange(area);
    } else {
      setInternalSelectedArea(area);
    }
  };

  // Fetch developer mapping on mount
  useEffect(() => {
    fetchDevelopersMapping().then(setDeveloperMapping);
  }, []);

  // Property type mapping
  const propertyTypeMap: { [key: string]: string | undefined } = {
    "All": undefined,
    "Villa": "Villa",
    "Apartment": "Apartment",
    "Townhouse": "Townhouse",
    "Duplex": "Duplex",
    "Penthouse": "Penthouse",
    "2 BHK": undefined, // Filter by bedroom count instead
    "3 BHK": undefined, // Filter by bedroom count instead
    "1 BHK": undefined, // Filter by bedroom count instead
  };

  useEffect(() => {
    const fetchPropertiesFromAlnair = async () => {
      setIsLoading(true);
      try {
        // Call Alnair API directly from browser (bypasses Cloudflare server-side blocking)
        const url = new URL(ALNAIR_API_URL);
        url.searchParams.append('limit', '100');
        url.searchParams.append('page', '1');
        url.searchParams.append('lang', 'en');
        
        // Filter for Dubai only (city_id=1)
        url.searchParams.append('city_id', '1');
        
        // Add bounding box for Dubai area to get more accurate results
        url.searchParams.append('search_area[east]', '56.0');
        url.searchParams.append('search_area[north]', '25.5');
        url.searchParams.append('search_area[south]', '24.5');
        url.searchParams.append('search_area[west]', '54.5');
        url.searchParams.append('has_cluster', '0');
        url.searchParams.append('has_boundary', '0');
        url.searchParams.append('zoom', '11');

        // Add developer filter if selected
        if (selectedDeveloper && selectedDeveloper !== "All") {
          const developerId = developerMapping.get(selectedDeveloper.toLowerCase());
          if (developerId) {
            url.searchParams.append('builder_id', developerId);
            console.log(`Filtering by developer ${selectedDeveloper} (ID: ${developerId})`);
          }
        }

        // Add area filter if selected
        if (selectedArea && selectedArea !== "All") {
          // Use district title for filtering
          console.log(`Filtering by area: ${selectedArea}`);
        }

        console.log(`Fetching properties from Alnair API for ${propertyType}${selectedDeveloper && selectedDeveloper !== "All" ? ` and ${selectedDeveloper}` : ""}${selectedArea && selectedArea !== "All" ? ` in ${selectedArea}` : ""}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en',
          },
        });

        if (!response.ok) {
          throw new Error(`Alnair API error: ${response.status}`);
        }

        const alnairData = await response.json();
        const items: AlnairProject[] = alnairData?.data?.items || [];

        console.log(`Alnair API returned ${items.length} properties`);

        // Map Alnair response to Property format
        let mappedProperties: Property[] = items.map((item: AlnairProject, index: number) => {
          // Generate a numeric propertyId for compatibility with MultiPropertyMap
          const numericId = (item.id + index) % 1000000;

          // Extract bedroom count from statistics.units
          let bedrooms = 0;
          const units = item.statistics?.units || {};
          Object.keys(units).forEach(key => {
            const match = key.match(/(\d+)\s*BR|bedroom/i);
            if (match) {
              const br = parseInt(match[1], 10);
              if (br > bedrooms) bedrooms = br;
            }
            if (key.toLowerCase().includes('studio')) {
              bedrooms = bedrooms || 0;
            }
          });

          // Get images
          const photos = item.photos || [];
          const mainImage = item.cover?.src || item.logo?.src || (photos[0]?.src) || '';
          const images = photos.map((p: { src: string }) => p.src).filter((src: string) => src);

          const property = {
            propertyId: numericId,
            id: item.id?.toString(),
            slug: item.slug,
            title: item.title || "Untitled Property",
            description: "",
            location: item.district?.title || "Dubai",
            bedrooms,
            bathrooms: 0,
            price: item.statistics?.total?.price_from || item.statistics?.total?.price_to || 0,
            images: images.length > 0 ? images : [mainImage].filter(Boolean),
            developer: item.builder || undefined,
            propertyType: [],
            latitude: item.latitude,
            longitude: item.longitude,
          };

          // Debug logging for location data
          if (process.env.NODE_ENV === 'development' && item.district?.title) {
            console.log(`Property: ${item.title}, Location: ${item.district.title}`);
          }

          return property;
        });

        // Filter by bedroom count if BHK type is selected
        if (propertyType === "1 BHK") {
          mappedProperties = mappedProperties.filter((p) => p.bedrooms === 1);
        } else if (propertyType === "2 BHK") {
          mappedProperties = mappedProperties.filter((p) => p.bedrooms === 2);
        } else if (propertyType === "3 BHK") {
          mappedProperties = mappedProperties.filter((p) => p.bedrooms === 3);
        } else if (propertyType === "Villa") {
          // Filter by title containing villa
          mappedProperties = mappedProperties.filter((p) => 
            p.title.toLowerCase().includes('villa')
          );
        }

        // Filter by area if selected
        if (selectedArea && selectedArea !== "All") {
          const normalizedArea = selectedArea.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          mappedProperties = mappedProperties.filter((p) => {
            if (!p.location) return false;
            
            const normalizedLocation = p.location.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Handle abbreviations and variations
            const areaMap: { [key: string]: string[] } = {
              'dubaimarina': ['marina', 'dubaimarina', 'themarina'],
              'downtowndubai': ['downtown', 'downtowndubai', 'downtowndxb', 'burjkhalifa'],
              'businessbay': ['businessbay', 'business', 'bay'],
              'dubaihillsestate': ['dubaihills', 'dubaihillsestate', 'hills', 'hillsestate'],
              'jlt': ['jumeirah lake towers', 'jlt', 'jumeirahl aketowers', 'jumeirahlaketowers'],
              'jvc': ['jumeirah village circle', 'jvc', 'jumeirahvillagecircle'],
              'jvt': ['jumeirah village triangle', 'jvt', 'jumeirahvillagetriangle'],
              'arjan': ['arjan'],
              'dubaisouth': ['dubaisouth', 'south']
            };
            
            // Check if current area matches any mapped aliases
            const aliases = areaMap[normalizedArea] || [normalizedArea];
            const matched = aliases.some(alias => {
              const normalizedAlias = alias.replace(/[^a-z0-9]/g, '');
              return normalizedLocation.includes(normalizedAlias) || normalizedAlias.includes(normalizedLocation);
            });
            
            if (matched && process.env.NODE_ENV === 'development') {
              console.log(`✓ Matched: ${p.title} in ${p.location} for filter "${selectedArea}"`);
            }
            
            return matched;
          });
          
          console.log(`Filtered by area "${selectedArea}": ${mappedProperties.length} properties found`);
        }

        // Note: Developer filtering is now done via API builder_id parameter

        console.log(`After filtering: ${mappedProperties.length} properties remain`);

        // Translate Arabic title/location to English for map display
        const stringsToTranslate = new Set<string>();
        mappedProperties.forEach((p) => {
          if (p.title && containsArabic(p.title)) stringsToTranslate.add(p.title);
          if (p.location && containsArabic(p.location)) stringsToTranslate.add(p.location);
          if (p.developer && containsArabic(p.developer)) stringsToTranslate.add(p.developer);
        });
        const translationCache: Record<string, string> = {};
        if (stringsToTranslate.size > 0) {
          await Promise.all(
            Array.from(stringsToTranslate).map(async (str) => {
              const translated = await translateToEnglish(str);
              translationCache[str] = translated;
            })
          );
        }
        const translatedProperties = mappedProperties.map((p) => ({
          ...p,
          title: (p.title && translationCache[p.title]) || p.title,
          location: (p.location && translationCache[p.location]) || p.location,
          developer: (p.developer && translationCache[p.developer]) || p.developer,
        }));

        setProperties(translatedProperties);
        setSelectedProperty(null);
      } catch (error) {
        console.error("Error fetching properties from Alnair:", error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if developer mapping is ready when developer filter is selected
    if (selectedDeveloper !== "All" && developerMapping.size === 0) {
      // Wait for developer mapping to load
      return;
    }

    fetchPropertiesFromAlnair();
  }, [propertyType, selectedDeveloper, selectedArea, developerMapping]);

  // Geocode properties to get coordinates
  useEffect(() => {
    const geocodeProperties = async () => {
      const updatedProperties = await Promise.all(
        properties.map(async (property) => {
          // If property already has coordinates, return as is
          if (property.latitude && property.longitude) {
            return property;
          }

          // Try to geocode the location
          const coords = await geocodeRegion(property.location);
          if (coords) {
            return {
              ...property,
              latitude: coords.lat,
              longitude: coords.lon,
            };
          }

          return property;
        })
      );

      // Only update if coordinates were added
      if (JSON.stringify(updatedProperties) !== JSON.stringify(properties)) {
        setProperties(updatedProperties);
      }
    };

    if (properties.length > 0) {
      geocodeProperties();
    }
  }, [properties.length]); // Only run when properties count changes to avoid infinite loops

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePanel = () => {
    setSelectedProperty(null);
  };

  // Check if we're in a dark background context
  const isDarkBackground = className.includes('bg-transparent') || className.includes('bg-[#1a1a1a]');
  const hasCustomPadding = className.includes('px-0') || className.includes('py-0');
  
  // Extract border radius from className if present
  const borderRadiusClass = className.includes('rounded-') 
    ? className.match(/rounded-\[?[\w-]+\]?/)?.[0] || 'rounded-2xl'
    : 'rounded-2xl';
  
  return (
    <section className={`${isDarkBackground ? 'bg-transparent' : 'bg-white'} ${hasCustomPadding ? '' : 'px-6 md:px-12 lg:px-20 py-20'} ${className}`}>
      {/* Title */}
      {showTitle && (
        <h2 className={`text-center text-2xl md:text-4xl font-display font-medium ${isDarkBackground ? 'text-white' : 'text-secondary'} mb-6`}>
          {title}
        </h2>
      )}

      {/* Developer Filter Buttons */}
      {showDeveloperFilters && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {effectiveDeveloperFilters.map((developer) => (
            <button
              key={developer}
              onClick={() => {
                console.log(`Developer filter clicked: ${developer}`);
                handleDeveloperChange(developer);
              }}
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

      {/* Area Filter Buttons */}
      {showAreaFilters && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {effectiveAreaFilters.map((area) => (
            <button
              key={area}
              onClick={() => {
                console.log(`Area filter clicked: ${area}`);
                handleAreaChange(area);
              }}
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

      {/* Property Type Filter Buttons */}
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

      {/* Full Width Map with Side Panel */}
      <div className={`relative w-full ${borderRadiusClass} overflow-hidden`} style={{ height: "600px" }}>
        {isLoading ? (
          <div className={`flex items-center justify-center ${isDarkBackground ? 'bg-gray-800' : 'bg-gray-100'} ${borderRadiusClass} h-full`}>
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
              <PropertyInfoPanel
                property={selectedProperty}
                onClose={handleClosePanel}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
