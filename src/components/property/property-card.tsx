import Link from 'next/link';
import Image from 'next/image';
import { memo } from 'react';
import { formatPrice, getUnitTypeFromBedrooms } from '../../lib/properties';

interface Property {
  id?: string | number;
  title: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  type: string;
  mainImage: string;
  area?: number;
  location?: string;
}

interface PropertyCardProps {
  property: Property;
}

function PropertyCard({ property }: PropertyCardProps) {
  const {
    id,
    title,
    price,
    bedrooms,
    bathrooms,
    type,
    mainImage,
  } = property;

  return (
    <Link 
      href={`/properties/${id}`}
      className="block bg-white border border-[#c7c7c7] rounded-[16px] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] h-full"
    >
      <div className="flex flex-col gap-4 p-4 md:p-5 h-full">
        {/* Image */}
        {mainImage && mainImage.trim() !== '' ? (
          <div className="relative w-full h-[220px] md:h-[240px] lg:h-[260px] rounded-[10px] overflow-hidden bg-gray-100">
            <Image
              src={mainImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 401px"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="relative w-full h-[220px] md:h-[240px] lg:h-[260px] rounded-[10px] overflow-hidden bg-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Title */}
          <h3 className="font-semibold text-lg md:text-xl leading-[1.4] text-black line-clamp-2">
            {title}
          </h3>

          {/* Badges: Unit type (Apartment/Villa) from bedrooms, then type if present */}
          <div className="flex flex-wrap gap-2">
            {getUnitTypeFromBedrooms(bedrooms) && (
              <div className="bg-[#e5e7ff] flex gap-1.5 items-center px-2.5 py-1.5 rounded-[28px]">
                <div className="w-4.5 h-4.5 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="black" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="font-medium text-xs leading-normal text-black">
                  {getUnitTypeFromBedrooms(bedrooms)}
                </span>
              </div>
            )}

            {type && typeof type === 'string' && type.trim() !== '' && (
              <div className="bg-[#e5e7ff] flex gap-1.5 items-center px-2.5 py-1.5 rounded-[28px]">
                <div className="w-4.5 h-4.5 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="black" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="font-medium text-xs leading-normal text-black">
                  {type}
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <p className="font-semibold text-xl md:text-2xl lg:text-[28px] leading-normal text-black">
            AED {formatPrice(price)}
          </p>

          {/* Button */}
          <div className="mt-auto">
            <div className="border border-[#1f2462] rounded-[4px] px-4 md:px-6 py-3 text-center">
              <p className="font-medium text-sm md:text-base leading-normal text-[#1f2462]">
                View Property Details
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(PropertyCard);
