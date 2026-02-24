'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import InquiryModal from '@/components/property/inquiry-modal';
import DescriptionModal from '@/components/property/description-modal';
import ImageViewerModal from '@/components/property/image-viewer-modal';
import AmenitiesModal from '@/components/property/amenities-modal';
import { getPropertyById, getRelatedProperties, formatPrice, formatDate, Property } from '@/lib/properties';
import { translateToEnglish, containsArabic } from '@/lib/translate';
import { memo } from 'react';

// Memoized Property Details Grid component
const PropertyDetailsGrid = memo(({ property, onOpenAmenities, translatedDeveloper, translatedLocality }: { property: Property; onOpenAmenities: () => void; translatedDeveloper?: string | null; translatedLocality?: string | null }) => {
  const developerDisplay = (translatedDeveloper !== undefined && translatedDeveloper !== null && translatedDeveloper !== '') ? translatedDeveloper : property.developer;
  const localityDisplay = (translatedLocality !== undefined && translatedLocality !== null && translatedLocality !== '') ? translatedLocality : property.locality;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:p-6 lg:p-8 mb-8">
      <h2 className="font-display font-bold text-2xl md:text-3xl text-secondary mb-6">
        Property Details
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {/* Developer Name - only show if exists and not empty */}
        {developerDisplay && typeof developerDisplay === 'string' && developerDisplay.trim() !== '' && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Developer Name</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{developerDisplay}</span>
          </div>
        )}
        
        {/* City - only show if exists and not empty */}
        {property.city && typeof property.city === 'string' && property.city.trim() !== '' && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">City</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{property.city}</span>
          </div>
        )}
        
        {/* Locality - only show if exists and not empty */}
        {localityDisplay && typeof localityDisplay === 'string' && localityDisplay.trim() !== '' && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Locality</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{localityDisplay}</span>
          </div>
        )}
        
        {/* Bedrooms - only show if exists and greater than 0 */}
        {property.bedrooms && property.bedrooms > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Bedrooms</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{property.bedrooms}</span>
          </div>
        )}
        
        {/* Area - only show if exists and greater than 0 */}
        {property.area !== undefined && property.area !== null && property.area > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Area</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">
              {property.areaMax && property.areaMax > property.area 
                ? `${property.area.toLocaleString('en-US')} - ${property.areaMax.toLocaleString('en-US')} sq. ft`
                : `${property.area.toLocaleString('en-US')} sq. ft`}
            </span>
          </div>
        )}
        
        {/* Amenities - only show if exists and has items */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Amenities</span>
            <div className="flex flex-col gap-1">
              <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">
                {property.amenities.slice(0, 2).join(', ')}
              </span>
              {property.amenities.length > 2 && (
                <button
                  onClick={onOpenAmenities}
                  className="text-[#C5A365] text-xs md:text-sm hover:text-[#b08e55] hover:underline text-left transition-colors font-semibold"
                >
                  +{property.amenities.length - 2} more
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Bathrooms - only show if exists and greater than 0 */}
        {property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Bathrooms</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{property.bathrooms}</span>
          </div>
        )}
        
        {/* Delivery Date - only show if exists and not empty */}
        {property.readyDate && typeof property.readyDate === 'string' && property.readyDate.trim() !== '' && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Delivery Date</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{formatDate(property.readyDate)}</span>
          </div>
        )}
        
        {/* Floors - only show if exists and greater than 0 */}
        {property.floors !== undefined && property.floors !== null && 
         ((typeof property.floors === 'number' && property.floors > 0) || 
          (typeof property.floors === 'string' && property.floors !== '0' && property.floors.trim() !== '' && property.floors.trim() !== 'null' && property.floors.trim() !== 'undefined')) && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Floors</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{property.floors}</span>
          </div>
        )}
        
        {/* Furnished - only show if exists and not empty */}
        {property.furnished && typeof property.furnished === 'string' && property.furnished.trim() !== '' && (
          <div className="flex flex-col gap-1">
            <span className="text-[#61656e] text-xs md:text-sm lg:text-[16px] font-medium leading-[20px] md:leading-[27px]">Furnishing</span>
            <span className="text-black text-sm md:text-base lg:text-[18px] font-medium leading-[20px] md:leading-[27px]">{property.furnished}</span>
          </div>
        )}
      </div>
    </div>
  );
});

PropertyDetailsGrid.displayName = 'PropertyDetailsGrid';

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [translatedDeveloper, setTranslatedDeveloper] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translatedLocality, setTranslatedLocality] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedLocation, setTranslatedLocation] = useState<string | null>(null);

  useEffect(() => {
    const loadProperty = async () => {
      if (id) {
        setIsLoading(true);
        setProjectDescription('');
        setTranslatedDeveloper(null);
        setTranslatedLocality(null);
        setTranslatedTitle(null);
        setTranslatedLocation(null);
        setTranslatedDescription(null);
        
        // Minimum loading time to prevent flickering (400ms for detail page)
        const minLoadingTime = 400;
        const startTime = Date.now();
        
        try {
          // Load main property first
          const propertyData = await getPropertyById(id);
          
          if (propertyData) {
            setProperty(propertyData);
            
            // Load related properties asynchronously after main property is set
            // This allows the main content to render first
            getRelatedProperties(id, propertyData.type, 3)
              .then(relatedProps => {
                setRelatedProperties(relatedProps);
              })
              .catch(error => {
                console.error('Error loading related properties:', error);
                // Don't block UI if related properties fail
              });
          }
          
          // Ensure minimum loading time
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minLoadingTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
          }
        } catch (error) {
          console.error('Error loading property:', error);
          
          // Ensure minimum loading time even on error
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minLoadingTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProperty();
  }, [id]);

  // Fetch project description from Alnair look API (authenticated) - runs when property has slug
  useEffect(() => {
    const slug = property?.slug || (property?.id && typeof property.id === 'string' && !/^\d+$/.test(property.id) ? property.id : null);
    if (!slug) return;
    const existingDesc = (property?.description || '').trim();
    if (existingDesc && existingDesc.length > 50) {
      setProjectDescription(existingDesc);
      setIsLoadingDescription(false);
      return;
    }
    let cancelled = false;
    setIsLoadingDescription(true);
    fetch(`/api/project/look/${encodeURIComponent(slug)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.data?.description) {
          setProjectDescription(data.data.description);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingDescription(false); });
    return () => { cancelled = true; };
  }, [property?.slug, property?.id]);

  // Translate developer name from Arabic to English
  useEffect(() => {
    const dev = property?.developer;
    if (!dev || typeof dev !== 'string' || !containsArabic(dev)) {
      setTranslatedDeveloper(null);
      return;
    }
    let cancelled = false;
    translateToEnglish(dev).then((t) => { if (!cancelled) setTranslatedDeveloper(t); });
    return () => { cancelled = true; };
  }, [property?.developer, id]);

  // Translate property title from Arabic to English
  useEffect(() => {
    const t = property?.title;
    if (!t || typeof t !== 'string' || !containsArabic(t)) {
      setTranslatedTitle(null);
      return;
    }
    let cancelled = false;
    translateToEnglish(t).then((text) => { if (!cancelled) setTranslatedTitle(text); });
    return () => { cancelled = true; };
  }, [property?.title, id]);

  // Translate locality from Arabic to English
  useEffect(() => {
    const loc = property?.locality;
    if (!loc || typeof loc !== 'string' || !containsArabic(loc)) {
      setTranslatedLocality(null);
      return;
    }
    let cancelled = false;
    translateToEnglish(loc).then((t) => { if (!cancelled) setTranslatedLocality(t); });
    return () => { cancelled = true; };
  }, [property?.locality, id]);

  // Translate location from Arabic to English
  useEffect(() => {
    const loc = property?.location;
    if (!loc || typeof loc !== 'string' || !containsArabic(loc)) {
      setTranslatedLocation(null);
      return;
    }
    let cancelled = false;
    translateToEnglish(loc).then((t) => { if (!cancelled) setTranslatedLocation(t); });
    return () => { cancelled = true; };
  }, [property?.location, id]);

  // Translate project description from Arabic to English
  useEffect(() => {
    const desc = projectDescription || property?.description || '';
    if (!desc.trim() || !containsArabic(desc)) {
      setTranslatedDescription(null);
      return;
    }
    let cancelled = false;
    translateToEnglish(desc).then((t) => { if (!cancelled) setTranslatedDescription(t); });
    return () => { cancelled = true; };
  }, [projectDescription, property?.description, id]);

  // Memoize modal handlers (must be before early returns)
  const handleOpenInquiry = useCallback(() => setIsModalOpen(true), []);
  const handleCloseInquiry = useCallback(() => setIsModalOpen(false), []);
  const handleOpenDescription = useCallback(() => setIsDescriptionModalOpen(true), []);
  const handleCloseDescription = useCallback(() => setIsDescriptionModalOpen(false), []);
  const handleOpenImageViewer = useCallback(() => setIsImageViewerOpen(true), []);
  const handleCloseImageViewer = useCallback(() => setIsImageViewerOpen(false), []);
  const handleOpenAmenities = useCallback(() => setIsAmenitiesModalOpen(true), []);
  const handleCloseAmenities = useCallback(() => setIsAmenitiesModalOpen(false), []);
  const handleImageSelect = useCallback((index: number) => setSelectedImage(index), []);
  
  // Memoize thumbnail click handlers
  const handleThumbnailClick = useCallback((idx: number, isLastWithMore: boolean) => {
    if (isLastWithMore) {
      handleOpenImageViewer();
    } else {
      handleImageSelect(idx);
    }
  }, [handleOpenImageViewer, handleImageSelect]);

  // Memoize image processing
  const images = useMemo(() => {
    if (!property) return [];
    const allImages = [
      property.mainImage,
      ...property.gallery.filter((img: string) => img && img.trim() !== '' && img !== property.mainImage)
    ].filter((img: string) => img && img.trim() !== '');
    
    return allImages.length > 0 
      ? allImages 
      : ['https://via.placeholder.com/800x600?text=No+Image'];
  }, [property]);
  
  const displayDescription = projectDescription || property?.description || '';
  const effectiveDescription = translatedDescription ?? displayDescription;
  const displayTitle = translatedTitle ?? property?.title ?? '';
  const displayLocation = translatedLocation ?? property?.location ?? '';
  const descriptionPreview = useMemo(() => {
    if (!effectiveDescription) return '';
    const plain = effectiveDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > 200 ? plain.substring(0, 200) : plain;
  }, [effectiveDescription]);
  const hasMoreDescription = useMemo(() => {
    if (!effectiveDescription) return false;
    const plain = effectiveDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > 200;
  }, [effectiveDescription]);

  // Memoize related properties section
  const relatedPropertiesSection = useMemo(() => {
    if (relatedProperties.length === 0) return null;
    return (
      <div className="mb-12">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-secondary mb-8">
          Other Properties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedProperties.map((relatedProperty) => (
            <PropertyCard key={relatedProperty.id} property={relatedProperty} />
          ))}
        </div>
      </div>
    );
  }, [relatedProperties]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-black text-lg md:text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-black text-lg md:text-xl font-semibold mb-4">Property not found</div>
          <Link href="/properties" className="text-[#1f2462] hover:underline">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="bg-gray-50/50 min-h-screen pt-[120px] pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/properties" 
              className="text-gray-500 hover:text-secondary text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Back to Properties
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-[30px] mb-6 md:mb-8 lg:mb-[30px]">
            {/* Left: Image Gallery */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-[19px]">
                {/* Main Image Container */}
                <div className="w-full sm:flex-1 lg:w-[569px] lg:flex-none">
                  {images[selectedImage] && images[selectedImage].trim() !== '' ? (
                    <div 
                      className="relative w-full h-[280px] sm:h-[380px] md:h-[420px] lg:h-[443px] rounded-2xl overflow-hidden cursor-pointer bg-gray-100 border border-gray-100 shadow-sm group"
                      onClick={handleOpenImageViewer}
                    >
                      <Image
                        src={images[selectedImage]}
                        alt={displayTitle}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 569px"
                        priority
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-[280px] sm:h-[380px] md:h-[420px] lg:h-[443px] rounded-2xl overflow-hidden bg-gray-200 border border-gray-100 flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Thumbnails Container */}
                {images.length > 1 && (
                  <div className="flex-shrink-0">
                    {/* Mobile: Horizontal Scrollable Thumbnails */}
                    <div className="sm:hidden w-full">
                      <div className="flex flex-row gap-3 overflow-x-auto scrollbar-hide py-1 px-1">
                        {images.slice(0, 5).map((image, idx) => {
                          if (!image || image.trim() === '') return null;
                          
                          const isSelected = selectedImage === idx;
                          const isLastWithMore = idx === 4 && images.length > 5 && !isSelected;
                          
                          return (
                            <div
                              key={idx}
                              onClick={() => handleThumbnailClick(idx, isLastWithMore)}
                              className={`relative w-[72px] h-[54px] rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 border ${
                                isSelected 
                                  ? 'ring-2 ring-[#C5A365] ring-offset-2 border-[#C5A365]' 
                                  : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-[#C5A365]'
                              }`}
                            >
                            <Image
                              src={image}
                              alt={`Thumbnail ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="72px"
                              loading="lazy"
                            />
                              {isLastWithMore && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-xs font-semibold">
                                    +{images.length - 5}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tablet & Desktop: Vertical Thumbnails */}
                    <div className="hidden sm:flex flex-col gap-4 lg:gap-[18px] h-full py-1 px-1">
                      {images.slice(0, 5).map((image, idx) => {
                        if (!image || image.trim() === '') return null;
                        
                        const isSelected = selectedImage === idx;
                        const isLastWithMore = idx === 4 && images.length > 5 && !isSelected;
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => handleThumbnailClick(idx, isLastWithMore)}
                            className={`relative w-[94px] lg:w-[96px] h-[66px] lg:h-[70px] rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 border ${
                              isSelected 
                                ? 'ring-2 ring-[#C5A365] ring-offset-2 border-[#C5A365]' 
                                : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-[#C5A365]'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`Thumbnail ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="96px"
                              loading="lazy"
                            />
                            {isLastWithMore && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  +{images.length - 5}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Property Info */}
            <div className="flex-1 w-full lg:max-w-[530px] flex flex-col">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:p-6 lg:p-8 flex flex-col gap-6">
                {/* Title and Location */}
                <div className="flex flex-col gap-3">
                  <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-secondary">
                    {displayTitle}
                  </h1>
                  {displayLocation && (
                    <p className="text-sm md:text-base leading-normal text-gray-500 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#C5A365]">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {displayLocation}
                    </p>
                  )}
                </div>

                {/* Description with Read More - from Alnair look API */}
                {(displayDescription || isLoadingDescription) && (
                  <div className="flex-1 min-h-0">
                    {isLoadingDescription ? (
                      <p className="text-sm text-gray-400 animate-pulse">Loading project description...</p>
                    ) : (
                    <p className="text-sm md:text-base leading-relaxed text-gray-600 line-clamp-3">
                      {descriptionPreview}
                      {hasMoreDescription && (
                        <>
                          ...{' '}
                          <button
                            onClick={handleOpenDescription}
                            className="text-[#C5A365] hover:text-[#b08e55] hover:underline font-semibold transition-colors"
                          >
                            Read more
                          </button>
                        </>
                      )}
                    </p>
                    )}
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-3">
                  {property.type && typeof property.type === 'string' && property.type.trim() !== '' && (
                    <div className={`text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider ${
                      property.type === 'Off-Plan' ? 'bg-[#C5A365]' : 'bg-[#00DDAA]'
                    }`}>
                      {property.type}
                    </div>
                  )}
                  {property.bedrooms && property.bedrooms > 0 && (
                    <div className="bg-gray-100 text-secondary text-xs font-semibold px-3 py-1.5 rounded uppercase tracking-wider">
                      {property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}
                    </div>
                  )}
                  {property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms > 0 && (
                    <div className="bg-gray-100 text-secondary text-xs font-semibold px-3 py-1.5 rounded uppercase tracking-wider">
                      {property.bathrooms} Bathroom{property.bathrooms > 1 ? 's' : ''}
                    </div>
                  )}
                  {property.area !== undefined && property.area !== null && property.area > 0 && (
                    <div className="bg-gray-100 text-secondary text-xs font-semibold px-3 py-1.5 rounded uppercase tracking-wider">
                      {property.areaMax && property.areaMax > property.area 
                        ? `${property.area.toLocaleString('en-US')} - ${property.areaMax.toLocaleString('en-US')} sqft`
                        : `${property.area.toLocaleString('en-US')} sqft`}
                    </div>
                  )}
                </div>

                {/* Price Starting from */}
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-medium">
                    Price Starting from
                  </p>
                  <p className="font-display font-bold text-3xl md:text-4xl lg:text-3xl leading-tight text-secondary">
                    AED {formatPrice(property.minPrice ?? property.price)}
                  </p>
                </div>

                {/* Enquire Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleOpenInquiry}
                    className="flex-1 bg-[#C5A365] text-white py-3 md:py-4 rounded-full hover:bg-[#b08e55] transition-colors text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Enquire Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <PropertyDetailsGrid property={property} onOpenAmenities={handleOpenAmenities} translatedDeveloper={translatedDeveloper} translatedLocality={translatedLocality} />

          {/* Project Description - from Alnair look API (authenticated) */}
          {(displayDescription || isLoadingDescription) && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:p-6 lg:p-8 mb-8">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-secondary mb-6">
                Project Description
              </h2>
              {isLoadingDescription ? (
                <p className="text-gray-400 animate-pulse">Loading project description from Alnair...</p>
              ) : effectiveDescription && /<[a-z][\s\S]*>/i.test(effectiveDescription) ? (
                <div
                  className="text-gray-600 text-sm md:text-base leading-relaxed prose prose-p:my-2 prose-ul:my-2 prose-li:my-0 max-w-none"
                  dangerouslySetInnerHTML={{ __html: effectiveDescription }}
                />
              ) : effectiveDescription ? (
                <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {effectiveDescription}
                </p>
              ) : null}
            </div>
          )}

          {/* Related Properties - Memoized */}
          {relatedPropertiesSection}
        </div>

        {/* Modals */}
        <InquiryModal
          isOpen={isModalOpen}
          onClose={handleCloseInquiry}
          propertyId={property.id?.toString() || ''}
          propertyTitle={displayTitle}
        />

        <DescriptionModal
          isOpen={isDescriptionModalOpen}
          onClose={handleCloseDescription}
          title={displayTitle}
          description={effectiveDescription || property.description}
        />

        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={handleCloseImageViewer}
          images={images}
          initialIndex={selectedImage}
          propertyTitle={displayTitle}
        />

        <AmenitiesModal
          isOpen={isAmenitiesModalOpen}
          onClose={handleCloseAmenities}
          amenities={property.amenities || []}
          propertyTitle={displayTitle}
        />
      </main>
    </>
  );
}
