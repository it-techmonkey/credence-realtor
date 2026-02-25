"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    {
        ssr: false,
        loading: () => <div className="flex items-center justify-center h-96"><div className="text-white">Loading map...</div></div>
    }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);

interface Property {
    propertyId: number;
    id?: string;
    title: string;
    location: string;
    latitude?: number;
    longitude?: number;
    developer?: string;
    price: number;
    images: string[];
    bedrooms: number;
    bathrooms: number;
}

interface Props {
    properties: Property[];
    height?: string;
    onMarkerClick?: (property: Property) => void;
    selectedPropertyId?: number;
}

// Dubai area coordinates mapping for properties without coordinates
const DUBAI_AREAS: Record<string, [number, number]> = {
    'Downtown Dubai': [25.1972, 55.2744],
    'Dubai Marina': [25.0920, 55.1386],
    'Palm Jumeirah': [25.1122, 55.1386],
    'Arabian Ranches 3': [25.0553, 55.2203],
    'Town Square': [25.1189, 55.3788],
    'Dubai Hills Estate': [25.0553, 55.2203],
    'Dubai Silicon Oasis': [25.1189, 55.3788],
    'Business Bay': [25.1867, 55.2744],
    'Jumeirah Village Circle': [25.0553, 55.2203],
    'Dubai Sports City': [25.0553, 55.2203],
    'Dubai Production City': [25.1189, 55.3788],
    'Dubai International City': [25.1189, 55.3788],
    'Dubai Creek Harbour': [25.1972, 55.2744],
    'Dubai South': [25.0553, 55.2203],
    'Dubai World Central': [25.0553, 55.2203],
    // Add more common Dubai areas
    'Jumeirah': [25.1972, 55.2744],
    'Al Barsha': [25.0920, 55.1386],
    'Al Quoz': [25.1122, 55.1386],
    'Al Safa': [25.0553, 55.2203],
    'Al Wasl': [25.1189, 55.3788],
    'Umm Suqeim': [25.0553, 55.2203],
    'Al Sufouh': [25.1189, 55.3788],
    'Al Manara': [25.1867, 55.2744],
    'Al Thanya': [25.0553, 55.2203],
    'Al Hudaiba': [25.0553, 55.2203],
    'Al Satwa': [25.1189, 55.3788],
    'Al Karama': [25.1189, 55.3788],
    'Al Mankhool': [25.1972, 55.2744],
    'Al Raffa': [25.0553, 55.2203],
    'Al Jafiliya': [25.0553, 55.2203],
    'Al Muteena': [25.1189, 55.3788],
    'Al Twar': [25.1972, 55.2744],
    'Al Nahda': [25.0553, 55.2203],
    'Al Warqa': [25.1189, 55.3788],
    'Al Rashidiya': [25.1189, 55.3788],
    'Al Lisaili': [25.1972, 55.2744],
    'Al Aweer': [25.0553, 55.2203],
    'Al Khawaneej': [25.0553, 55.2203],
    'Al Mizhar': [25.1189, 55.3788],
    'Al Barsha 1': [25.1189, 55.3788],
    'Al Barsha 2': [25.1972, 55.2744],
    'Al Barsha 3': [25.0553, 55.2203],
    'Al Barsha South': [25.0553, 55.2203],
    'Al Barsha Heights': [25.1189, 55.3788],
    'Emirates Hills': [25.1189, 55.3788],
    'Springs': [25.1972, 55.2744],
    'Meadows': [25.0553, 55.2203],
    'Lakes': [25.0553, 55.2203],
    'Gardens': [25.1189, 55.3788],
    'Greens': [25.1189, 55.3788],
    'Views': [25.1972, 55.2744],
    'Heights': [25.0553, 55.2203],
    'Marina': [25.0920, 55.1386],
    'Beach': [25.1122, 55.1386],
    'Hills': [25.0553, 55.2203],
    'Estate': [25.1189, 55.3788],
    'Village': [25.1867, 55.2744],
    'Circle': [25.0553, 55.2203],
    'City': [25.0553, 55.2203],
    'District': [25.1189, 55.3788],
    'Area': [25.1189, 55.3788],
    'Zone': [25.1972, 55.2744],
    'Community': [25.0553, 55.2203],
    'Development': [25.0553, 55.2203],
    'Project': [25.1189, 55.3788],
    'Residence': [25.1189, 55.3788],
    'Tower': [25.1972, 55.2744],
    'Building': [25.0553, 55.2203],
    'Complex': [25.0553, 55.2203],
    'Plaza': [25.1189, 55.3788],
    'Center': [25.1189, 55.3788],
    'Mall': [25.1972, 55.2744],
    'Palm Islands': [25.1122, 55.1386],
};

export default function MultiPropertyMap({ properties, height = "450px", onMarkerClick, selectedPropertyId }: Props) {
    const [developerLogos, setDeveloperLogos] = useState<Record<string, string>>({});

    // Helper function to format price display
    const formatPrice = (price: number): string => {
        if (price < 1000000) {
            // Under 1M: show in thousands (K)
            return `${Math.round(price / 1000)}K`;
        } else {
            // 1M and above: show in millions (M)
            return `${(price / 1000000).toFixed(2)}M`;
        }
    };

    // Fetch developer logos
    useEffect(() => {
        const fetchDevelopers = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/v1/developers`, {
                    headers: {
                        "Content-Type": "application/json",
                        "X-PIXXI-TOKEN": process.env.NEXT_PUBLIC_PIXXI_TOKEN || "",
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    const logosMap: Record<string, string> = {};
                    data.records.forEach((dev: { name?: string; logoUrl?: string }) => {
                        if (dev.name && dev.logoUrl) {
                            logosMap[dev.name.toLowerCase()] = dev.logoUrl;
                        }
                    });
                    setDeveloperLogos(logosMap);
                }
            } catch (error) {
                console.error("Failed to fetch developers:", error);
            }
        };

        fetchDevelopers();
    }, []);

    // Filter properties that have valid coordinates or can be geocoded
    const processedProperties = properties.map((property, index) => {
        let coordinates: [number, number];

        // If property already has coordinates, use them
        if (property.latitude && property.longitude && !isNaN(property.latitude) && !isNaN(property.longitude)) {
            coordinates = [property.latitude, property.longitude];
        } else {
            // Try to find coordinates from DUBAI_AREAS mapping
            const region = property.location;
            let mappedCoordinates = DUBAI_AREAS[region];

            // If no specific coordinates found, create unique coordinates based on index
            if (!mappedCoordinates) {
                // Create a more spread out pattern to avoid overlapping
                const baseLat = 25.2048;
                const baseLng = 55.2708;
                const gridSize = 0.02; // Larger offset for better separation
                const gridIndex = index % 25; // Use modulo to keep within reasonable bounds

                mappedCoordinates = [
                    baseLat + (gridIndex % 5) * gridSize,
                    baseLng + Math.floor(gridIndex / 5) * gridSize
                ];
            }

            coordinates = mappedCoordinates;
        }

        return {
            ...property,
            latitude: coordinates[0],
            longitude: coordinates[1],
        };
    });

    // If no properties, don't render map
    if (processedProperties.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded-xl" style={{ height }}>
                <p className="text-gray-500">Map not available for these properties</p>
            </div>
        );
    }

    // Calculate center point (average of all property coordinates)
    const centerLat = processedProperties.reduce((sum, p) => sum + p.latitude, 0) / processedProperties.length;
    const centerLng = processedProperties.reduce((sum, p) => sum + p.longitude, 0) / processedProperties.length;

    // Function to capitalize first letter of each word
    const capitalizeWords = (str: string) => {
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Create custom round marker icon with developer logo and colored border
    const createPropertyIcon = (property: Property, isSelected: boolean = false) => {
        // Use first word of property title, or developer name, or location as fallback
        const firstWord = property.title?.split(' ')[0] || property.developer || property.location;
        const displayName = firstWord;
        const developerName = (property.developer || property.location || property.title).toLowerCase();
        const logoUrl = developerLogos[developerName] || "/white-logo.svg"; // Fallback to white logo

        // Generate a consistent color for each developer
        const developerColors = [
            '#e0b973', // Gold
            '#4CAF50', // Green
            '#2196F3', // Blue
            '#9C27B0', // Purple
            '#FF5722', // Orange
            '#00BCD4', // Cyan
            '#FF9800', // Amber
            '#795548', // Brown
            '#607D8B', // Blue Grey
            '#E91E63', // Pink
            '#3F51B5', // Indigo
            '#009688', // Teal
            '#FFC107', // Yellow
            '#8BC34A', // Light Green
            '#FFEB3B', // Yellow
            '#CDDC39', // Lime
            '#FF5722', // Deep Orange
            '#9E9E9E', // Grey
            '#673AB7', // Deep Purple
            '#3F51B5'  // Indigo
        ];

        // Create a hash from developer name to get consistent color
        let hash = 0;
        for (let i = 0; i < developerName.length; i++) {
            hash = developerName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % developerColors.length;
        const borderColor = developerColors[colorIndex];
        
        // Highlight selected marker with red border
        const borderStyle = isSelected 
            ? '4px solid #ef4444' 
            : `2px solid ${borderColor}`;
        const markerSize = isSelected ? '48px' : '40px';
        const innerSize = isSelected ? '44px' : '36px';
        const imageSize = isSelected ? '42px' : '34px';

        return L.divIcon({
            className: 'custom-property-marker',
            html: `
        <div style="
          width: ${markerSize};
          height: ${markerSize};
          background: ${borderColor};
          border: ${borderStyle};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        ">
          <div style="
            width: ${innerSize};
            height: ${innerSize};
            background: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          ">
            ${logoUrl !== "/white-logo.svg" ? `
              <img 
                src="${logoUrl}" 
                alt="${displayName}"
                style="
                  width: ${imageSize};
                  height: ${imageSize};
                  object-fit: contain;
                  border-radius: 50%;
                "
              />
                         ` : `
               <div style="
                 font-size: 6px;
                 font-weight: bold;
                 color: #333;
                 text-align: center;
                 line-height: 1.1;
                 max-width: 32px;
                 overflow: hidden;
                 text-overflow: ellipsis;
                 white-space: nowrap;
                 font-family: Arial, sans-serif;
                 padding: 1px;
               ">
                 ${displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName}
               </div>
             `}
          </div>
        </div>
      `,
            iconSize: isSelected ? [48, 48] : [40, 40],
            iconAnchor: isSelected ? [24, 24] : [20, 20],
            popupAnchor: [0, -20]
        });
    };

    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    // Use MapTiler with English labels so area/street names on the base map are not in Arabic
    const tileUrl = maptilerKey
        ? `https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${maptilerKey}&language=en`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution = maptilerKey
        ? '&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    return (
        <div className="w-full rounded-xl overflow-hidden" style={{ height }}>
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                className="rounded-xl"
                scrollWheelZoom={false}
            >
                <TileLayer attribution={attribution} url={tileUrl} />

                    {processedProperties.map((property) => {
                        const isSelected = selectedPropertyId === property.propertyId;
                        // Use UUID (id) as key for uniqueness, fallback to propertyId if UUID not available
                        const uniqueKey = property.id || `property-${property.propertyId}`;
                        return (
                            <Marker
                                key={uniqueKey}
                                position={[property.latitude, property.longitude]}
                                icon={createPropertyIcon(property, isSelected)}
                                eventHandlers={{
                                    click: () => {
                                        if (onMarkerClick) {
                                            onMarkerClick(property);
                                        }
                                    }
                                }}
                            />
                        );
                    })}
            </MapContainer>
        </div>
    );
}

