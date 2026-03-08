'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import InquiryModal from '@/components/property/inquiry-modal';
import DescriptionModal from '@/components/property/description-modal';
import ImageViewerModal from '@/components/property/image-viewer-modal';
import AmenitiesModal from '@/components/property/amenities-modal';
import { getPropertyById, getRelatedProperties, formatPrice, formatDate, Property } from '@/lib/properties';
import { translateToEnglish, containsArabic, translateAmenities } from '@/lib/translate';
import { memo } from 'react';
import { MapPin, Bed, Bath, Square, Calendar, Building2, ChevronRight, ArrowLeft, Check } from 'lucide-react';

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
                  className="text-primary text-xs md:text-sm hover:underline text-left transition-colors font-semibold"
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

/** Sticky bar at bottom: price + Enquire, visible after scroll */
function StickyEnquireBar({ price, title, onEnquire }: { price: number; title: string; onEnquire: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg safe-area-pb">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
          <p className="font-display font-bold text-lg text-secondary">
            AED {formatPrice(price)}
          </p>
          <p className="text-gray-500 text-sm truncate max-w-[200px] sm:max-w-xs" title={title}>{title}</p>
        </div>
        <button
          onClick={onEnquire}
          className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          Enquire now <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

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
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  // Fetch project description and amenities from Alnair look API - runs when property has slug
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
      .then(async (data) => {
        if (cancelled || !data?.data) return;
        if (data.data.description) setProjectDescription(data.data.description);
        const rawAmenities = Array.isArray(data.data.amenities) ? data.data.amenities : [];
        const amenities = rawAmenities.length > 0 ? await translateAmenities(rawAmenities) : [];
        const paymentPlan = typeof data.data.payment_plan === 'string' && data.data.payment_plan.trim() ? data.data.payment_plan.trim() : null;
        setProperty((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          if (amenities.length > 0) next.amenities = amenities;
          if (paymentPlan) next.paymentPlan = paymentPlan;
          return next;
        });
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
  
  // Memoize thumbnail click handlers (skip scrollIntoView on mobile to prevent page scrolling down)
  const handleThumbnailClick = useCallback((idx: number, isLastWithMore: boolean) => {
    if (isLastWithMore) {
      handleOpenImageViewer();
    } else {
      handleImageSelect(idx);
      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        thumbnailRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
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

  // Extreme smooth scroll: add class to html when this page mounts
  useEffect(() => {
    document.documentElement.classList.add('smooth-scroll-extreme');
    return () => { document.documentElement.classList.remove('smooth-scroll-extreme'); };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex flex-col pt-[100px] pb-12">
        <div className="container mx-auto px-4 max-w-7xl flex-1">
          <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="aspect-[4/3] max-h-[480px] rounded-2xl bg-gray-200 animate-pulse" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-14 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                ))}
              </div>
            </div>
            <div className="lg:w-[400px] space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
              <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex items-center justify-center pt-[100px]">
        <div className="text-center px-4">
          <p className="text-secondary text-lg font-semibold mb-4">Property not found</p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            <ArrowLeft size={18} /> Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <main className="smooth-scroll-container bg-gray-50/60 min-h-screen pt-[88px] pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Breadcrumb */}
          <div className="py-6">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-secondary text-sm font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Properties
            </Link>
          </div>

          {/* Quick jump nav - smooth scroll to sections */}
          <nav className="flex flex-wrap gap-2 mb-8 scroll-section" aria-label="Page sections">
            <button type="button" onClick={() => scrollToSection('section-details')} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors">
              Details
            </button>
            {property.amenities && property.amenities.length > 0 && (
              <button type="button" onClick={() => scrollToSection('section-amenities')} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors">
                Amenities
              </button>
            )}
            {(displayDescription || projectDescription) && (
              <button type="button" onClick={() => scrollToSection('section-description')} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors">
                Description
              </button>
            )}
            {property.paymentPlan && property.paymentPlan.trim() && (
              <button type="button" onClick={() => scrollToSection('section-payment')} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors">
                Payment Plan
              </button>
            )}
            {relatedProperties.length > 0 && (
              <button type="button" onClick={() => scrollToSection('section-related')} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors">
                Similar Properties
              </button>
            )}
          </nav>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mb-12">
            {/* Left: Image Gallery */}
            <div className="flex-1 w-full lg:w-auto min-w-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:flex-1 lg:max-w-[600px]">
                  {images[selectedImage] && images[selectedImage].trim() !== '' ? (
                    <div
                      className="relative w-full aspect-[4/3] max-h-[420px] lg:max-h-[500px] rounded-2xl overflow-hidden cursor-pointer bg-gray-100 border border-gray-100 shadow-sm group"
                      onClick={handleOpenImageViewer}
                    >
                      {/* Native img for instant switch on thumbnail click; no Next/Image delay */}
                      <img
                        key={selectedImage}
                        src={images[selectedImage]}
                        alt={displayTitle}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02] origin-center"
                        loading="eager"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium bg-black/50 px-3 py-2 rounded-full">View gallery</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] max-h-[420px] rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div
                    ref={thumbnailStripRef}
                    className="flex sm:flex-col gap-3 flex-shrink-0 overflow-x-auto overflow-y-hidden scroll-smooth py-1 -mx-1 sm:mx-0 sm:overflow-visible"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {images.slice(0, 5).map((image, idx) => {
                      if (!image || image.trim() === '') return null;
                      const isSelected = selectedImage === idx;
                      const isLastWithMore = idx === 4 && images.length > 5 && !isSelected;
                      return (
                        <div
                          key={idx}
                          ref={(el) => { thumbnailRefs.current[idx] = el; }}
                          onClick={() => handleThumbnailClick(idx, isLastWithMore)}
                          className={`relative w-20 h-14 sm:w-20 sm:h-14 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 flex-shrink-0 border-2 ${
                            isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <Image src={image} alt="" fill className="object-cover" sizes="80px" loading="lazy" />
                          {isLastWithMore && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">+{images.length - 5}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Property Info Card */}
            <div className="flex-shrink-0 w-full lg:max-w-[440px]">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 flex flex-col gap-6 sticky top-24">
                <div>
                  <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight text-secondary mb-3">
                    {displayTitle}
                  </h1>
                  {displayLocation && (
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-primary shrink-0" />
                      {displayLocation}
                    </p>
                  )}
                </div>
                {(displayDescription || isLoadingDescription) && (
                  <div>
                    {isLoadingDescription ? (
                      <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ) : (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {descriptionPreview}
                        {hasMoreDescription && (
                          <>
                            ...{' '}
                            <button onClick={handleOpenDescription} className="text-primary hover:underline font-semibold">
                              Read more
                            </button>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {property.type && typeof property.type === 'string' && property.type.trim() !== '' && (
                    <span className={`text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${property.type === 'Off-Plan' ? 'bg-primary' : 'bg-emerald-500'}`}>
                      {property.type}
                    </span>
                  )}
                  {property.bedrooms != null && property.bedrooms > 0 && (
                    <span className="bg-gray-100 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Bed size={12} /> {property.bedrooms} BR
                    </span>
                  )}
                  {property.bathrooms != null && property.bathrooms > 0 && (
                    <span className="bg-gray-100 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Bath size={12} /> {property.bathrooms} BA
                    </span>
                  )}
                  {property.area != null && property.area > 0 && (
                    <span className="bg-gray-100 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Square size={12} /> {property.areaMax && property.areaMax > property.area ? `${property.area}-${property.areaMax}` : property.area} sqft
                    </span>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-medium">From</p>
                  <p className="font-display font-bold text-2xl md:text-3xl text-secondary">
                    AED {formatPrice(property.minPrice ?? property.price)}
                  </p>
                </div>
                <button
                  onClick={handleOpenInquiry}
                  className="w-full bg-primary text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  Enquire now <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <section id="section-details" className="scroll-section mb-12">
            <PropertyDetailsGrid property={property} onOpenAmenities={handleOpenAmenities} translatedDeveloper={translatedDeveloper} translatedLocality={translatedLocality} />
          </section>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <section id="section-amenities" className="scroll-section mb-12">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-secondary mb-6">
                  Amenities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-100 transition-colors hover:border-primary/20"
                    >
                      <Check size={18} className="text-primary shrink-0" />
                      <span className="text-gray-800 text-sm font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Payment Plan */}
          {property.paymentPlan && property.paymentPlan.trim() && (
            <section id="section-payment" className="scroll-section mb-12">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-secondary mb-6">
                  Payment Plan
                </h2>
                {/<[a-z][\s\S]*>/i.test(property.paymentPlan) ? (
                  <div
                    className="text-gray-600 text-sm md:text-base leading-relaxed prose prose-p:my-2 prose-ul:my-2 prose-li:my-0 max-w-none"
                    dangerouslySetInnerHTML={{ __html: property.paymentPlan }}
                  />
                ) : (
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {property.paymentPlan}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Project Description */}
          {(displayDescription || isLoadingDescription) && (
            <section id="section-description" className="scroll-section mb-12">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-secondary mb-6">
                  Project Description
                </h2>
                {isLoadingDescription ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-4/6" />
                  </div>
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
            </section>
          )}

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
            <section id="section-related" className="scroll-section mb-12">
              <h2 className="font-display font-bold text-xl md:text-2xl text-secondary mb-6">
                Similar properties
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProperties.map((relatedProperty) => (
                  <PropertyCard key={relatedProperty.id} property={relatedProperty} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky bottom CTA - visible on scroll for easy enquiry */}
        <StickyEnquireBar
          price={property.minPrice ?? property.price}
          title={displayTitle}
          onEnquire={handleOpenInquiry}
        />

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
