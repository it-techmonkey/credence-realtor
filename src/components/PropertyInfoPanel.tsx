"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { getUnitTypeFromBedrooms } from "@/lib/properties";

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
}

interface Props {
  property: Property;
  onClose: () => void;
}

export default function PropertyInfoPanel({ property, onClose }: Props) {
  const propertyId = property.slug || property.id || property.propertyId;

  return (
    <div
      className="absolute right-0 top-0 h-full w-full md:w-[400px] lg:w-[450px] bg-white shadow-2xl z-[1000] overflow-y-auto animate-slide-in-left transition-transform duration-300"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
        aria-label="Close panel"
      >
        <X size={20} className="text-gray-700" />
      </button>

      {/* Property Image */}
      <div className="relative w-full h-[300px] md:h-[350px]">
        <Image
          src={property.images?.[0] || "/Images/Reactangle 1.png"}
          alt={property.title}
          fill
          className="object-cover"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/Images/Reactangle 1.png";
          }}
        />
      </div>

      {/* Property Details */}
      <div className="p-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          {property.title}
        </h3>
        
        <p className="text-gray-600 mb-4">
          {property.location}
        </p>

        {/* Unit type (Apartment / Villa from bedrooms) + Bedrooms */}
        {getUnitTypeFromBedrooms(property.bedrooms) && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Unit type</p>
            <p className="text-base font-medium text-gray-900">
              {getUnitTypeFromBedrooms(property.bedrooms)}
              {property.bedrooms != null && property.bedrooms > 0 && ` · ${property.bedrooms} BR`}
            </p>
          </div>
        )}

        {/* Developer */}
        {property.developer && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Developer</p>
            <p className="text-base font-medium text-gray-900">
              {property.developer}
            </p>
          </div>
        )}

        {/* Property Type */}
        {property.propertyType && property.propertyType.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Type</p>
            <p className="text-base font-medium text-gray-900">
              {property.propertyType.join(", ")}
            </p>
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Description</p>
            <p className="text-sm text-gray-700 line-clamp-4">
              {property.description}
            </p>
          </div>
        )}

        {/* Explore Button */}
        <Link href={`/properties/${propertyId}`}>
          <button className="w-full bg-[#C5A365] text-white font-bold py-3 px-6 rounded-full hover:bg-[#B8944F] transition-colors">
            Explore Now
          </button>
        </Link>
      </div>
    </div>
  );
}

