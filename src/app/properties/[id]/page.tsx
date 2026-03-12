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
import { getPropertyById, getSuggestedSimilarProperties, formatDate, getUnitTypeLabelsFromBedrooms, Property } from '@/lib/properties';
import { translateToEnglish, containsArabic } from '@/lib/translate';
import { getAmenityIcon } from '@/lib/amenityIcons';
import { normalizePropertyDescription } from '@/lib/descriptionParser';
import type { NormalizedDescription } from '@/lib/descriptionParser';
import { memo } from 'react';
import { MapPin, Bed, Bath, Square, Calendar, Building2, ChevronRight, ArrowLeft, User, MapPinned, Home, Clock, Navigation, CreditCard, HardHat, KeyRound } from 'lucide-react';

/** Format payment phase value for display (add % if numeric). */
function formatPaymentPhaseValue(val: string | number | undefined): string {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (!s) return '';
  return typeof val === 'number' ? `${val}%` : s.includes('%') ? s : `${s}%`;
}

/** Single payment phase row — label + value with optional icon. */
const PaymentPhaseRow = memo(({ label, value, icon: Icon }: { label: string; value: string | number | undefined; icon?: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }> }) => {
  const display = formatPaymentPhaseValue(value);
  if (display === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
        )}
        <span className="text-gray-700 font-medium text-sm">{label}</span>
      </div>
      <span className="flex-shrink-0 font-display font-semibold text-secondary text-sm tabular-nums">{display}</span>
    </div>
  );
});
PaymentPhaseRow.displayName = 'PaymentPhaseRow';

// Key detail row with icon — used in Key details card
const DetailRow = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-secondary/5 flex items-center justify-center">
      <Icon className="w-4 h-4 text-secondary" strokeWidth={2} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-secondary font-medium text-sm sm:text-base">{value}</p>
    </div>
  </div>
);

// Key details grid — compact variant for sidebar (single column, no outer card)
const PropertyDetailsGrid = memo(({ property, translatedDeveloper, translatedLocality, compact }: { property: Property; onOpenAmenities?: () => void; translatedDeveloper?: string | null; translatedLocality?: string | null; compact?: boolean }) => {
  const developerDisplay = (translatedDeveloper !== undefined && translatedDeveloper !== null && translatedDeveloper !== '') ? translatedDeveloper : property.developer;
  const localityDisplay = (translatedLocality !== undefined && translatedLocality !== null && translatedLocality !== '') ? translatedLocality : property.locality;
  const grid = (
    <div className={compact ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8'}>
      {developerDisplay && typeof developerDisplay === 'string' && developerDisplay.trim() !== '' && (
        <DetailRow icon={User} label="Developer" value={developerDisplay} />
      )}
      {property.city && typeof property.city === 'string' && property.city.trim() !== '' && (
        <DetailRow icon={MapPin} label="City" value={property.city} />
      )}
      {localityDisplay && typeof localityDisplay === 'string' && localityDisplay.trim() !== '' && (
        <DetailRow icon={MapPinned} label="Locality" value={localityDisplay} />
      )}
      {getUnitTypeLabelsFromBedrooms(property.bedrooms).length > 0 && (
        <DetailRow icon={Home} label="Unit type" value={getUnitTypeLabelsFromBedrooms(property.bedrooms).join(' · ')} />
      )}
      {(property.bedroomRange != null && property.bedroomRange.trim() !== '' || (property.bedrooms != null && property.bedrooms > 0)) && (
        <DetailRow icon={Bed} label="Bedrooms" value={property.bedroomRange?.trim() || property.bedrooms} />
      )}
      {property.area !== undefined && property.area !== null && property.area > 0 && (
        <DetailRow
          icon={Square}
          label="Area"
          value={property.areaMax && property.areaMax > property.area
            ? `${property.area.toLocaleString('en-US')} – ${property.areaMax.toLocaleString('en-US')} sq ft`
            : `${property.area.toLocaleString('en-US')} sq ft`}
        />
      )}
      {property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms > 0 && (
        <DetailRow icon={Bath} label="Bathrooms" value={property.bathrooms} />
      )}
      {property.readyDate && typeof property.readyDate === 'string' && property.readyDate.trim() !== '' && (
        <DetailRow icon={Calendar} label="Delivery" value={formatDate(property.readyDate)} />
      )}
      {property.floors !== undefined && property.floors !== null &&
       ((typeof property.floors === 'number' && property.floors > 0) ||
        (typeof property.floors === 'string' && property.floors !== '0' && property.floors.trim() !== '' && property.floors.trim() !== 'null' && property.floors.trim() !== 'undefined')) && (
        <DetailRow icon={Building2} label="Floors" value={property.floors} />
      )}
      {property.furnished && typeof property.furnished === 'string' && property.furnished.trim() !== '' && (
        <DetailRow icon={Home} label="Furnishing" value={property.furnished} />
      )}
    </div>
  );
  if (compact) return grid;
  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Details</h2>
      <p className="font-display font-bold text-xl sm:text-2xl text-secondary mb-6">Key details</p>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">{grid}</div>
    </div>
  );
});

PropertyDetailsGrid.displayName = 'PropertyDetailsGrid';

/** Premium sticky CTA bar — appears on scroll. onVisibleChange allows parent to add bottom padding. */
function StickyEnquireBar({ title, onEnquire, onVisibleChange }: { title: string; onEnquire: () => void; onVisibleChange?: (visible: boolean) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const v = window.scrollY > 500;
      setVisible(v);
      onVisibleChange?.(v);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onVisibleChange]);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-pb pb-safe">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-700 text-sm font-medium truncate max-w-[220px] sm:max-w-sm text-center sm:text-left" title={title}>{title}</p>
        <button
          onClick={onEnquire}
          className="w-full sm:w-auto bg-secondary text-white px-8 py-3 rounded-full font-medium text-sm tracking-wide hover:bg-secondary/90 transition-all duration-200 flex items-center justify-center gap-2 shrink-0"
        >
          Request information <ChevronRight size={16} strokeWidth={2.5} />
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
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [translatedDeveloper, setTranslatedDeveloper] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translatedLocality, setTranslatedLocality] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedLocation, setTranslatedLocation] = useState<string | null>(null);
  /** Amenities with ids from look API (for icons). Falls back to property.amenities labels when empty. */
  const [projectAmenities, setProjectAmenities] = useState<{ id: string; label: string }[]>([]);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      if (id) {
        setIsLoading(true);
        setProjectDescription('');
        setProjectAmenities([]);
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
            getSuggestedSimilarProperties(propertyData, 6)
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

  // Fetch project look data (description, amenities, payment plan) when property has slug.
  // Payment plan: from our API store first; if fetch_payment_plan_from_client, browser calls Alnair directly (normal request, no bot detection) then POSTs to save.
  useEffect(() => {
    const slug = property?.slug || (property?.id && typeof property.id === 'string' && !/^\d+$/.test(property.id) ? property.id : null);
    if (!slug) return;
    const existingDesc = (property?.description || '').trim();
    if (existingDesc && existingDesc.length > 50) {
      setProjectDescription(existingDesc);
    }
    let cancelled = false;
    setIsLoadingDescription(true);
    fetch(`/api/project/look/${encodeURIComponent(slug)}`)
      .then((res) => res.ok ? res.json() : null)
      .then(async (data) => {
        if (cancelled || !data?.data) return;
        if (data.data.description) setProjectDescription(data.data.description);
        const rawAmenities = Array.isArray(data.data.amenities) ? data.data.amenities : [];
        const withIds: { id: string; label: string }[] = rawAmenities
          .filter((a: unknown) => a && typeof a === 'object' && 'id' in (a as object) && 'label' in (a as object))
          .map((a: unknown) => ({ id: (a as { id: string }).id, label: (a as { label: string }).label }));
        const amenities: string[] = withIds.map((a) => a.label).filter(Boolean);
        setProjectAmenities(withIds);
        let paymentPlan = typeof data.data.payment_plan === 'string' && data.data.payment_plan.trim() ? data.data.payment_plan.trim() : null;
        let paymentPlanBreakdown = data.data.payment_plan_breakdown && typeof data.data.payment_plan_breakdown === 'object' ? data.data.payment_plan_breakdown : undefined;
        let paymentPlanSections = data.data.payment_plan_sections && typeof data.data.payment_plan_sections === 'object' ? data.data.payment_plan_sections : undefined;

        // When our API has no stored payment plan, fetch from Alnair in the browser (normal request = user's headers, visible in Network tab).
        if (data.data.fetch_payment_plan_from_client) {
          try {
            const alnairUrl = `https://api.alnair.ae/project/look/${encodeURIComponent(slug)}`;
            const alnairRes = await fetch(alnairUrl, { method: 'GET', credentials: 'omit' });
            if (alnairRes.ok) {
              const alnairJson = (await alnairRes.json()) as Record<string, unknown>;
              const payload = (alnairJson.data ?? alnairJson.project ?? alnairJson) as Record<string, unknown> | undefined;
              const plans = (payload?.payment_plans ?? alnairJson.payment_plans) as unknown[] | undefined;
              const planStr = (typeof payload?.payment_plan === 'string' && payload.payment_plan.trim()) ? payload.payment_plan.trim() : null;
              const first = Array.isArray(plans) && plans.length > 0 ? (plans[0] as Record<string, unknown>) : null;
              const info = first?.info && typeof first.info === 'object' ? (first.info as Record<string, unknown>) : null;
              if (plans?.length) {
                paymentPlan = planStr || [info?.on_booking_percent, info?.on_construction_percent, info?.on_handover_percent, info?.post_handover_percent].filter(Boolean).map((v) => `${v}%`).join(', ') || null;
                paymentPlanBreakdown = info ? { onBooking: info.on_booking_percent, onConstruction: info.on_construction_percent, onHandover: info.on_handover_percent, postHandover: info.post_handover_percent } : undefined;
                paymentPlanSections = info ? {
                  ...(info.on_booking_percent != null && info.on_booking_percent !== '' && { on_booking: info.on_booking_percent }),
                  ...(info.on_construction_percent != null && info.on_construction_percent !== '' && { on_construction: info.on_construction_percent }),
                  ...(info.on_handover_percent != null && info.on_handover_percent !== '' && { on_handover: info.on_handover_percent }),
                  ...(info.post_handover_percent != null && info.post_handover_percent !== '' && { post_handover: info.post_handover_percent }),
                } : undefined;
                fetch(`/api/project/look/${encodeURIComponent(slug)}/payment-plan`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(alnairJson),
                }).catch(() => {});
              } else if (planStr) {
                paymentPlan = planStr;
                fetch(`/api/project/look/${encodeURIComponent(slug)}/payment-plan`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(alnairJson),
                }).catch(() => {});
              }
            }
          } catch {
            // CORS or network error – Alnair may block cross-origin; user will see no payment plan
          }
        }

        setProperty((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          if (amenities.length > 0) next.amenities = amenities;
          if (paymentPlan) next.paymentPlan = paymentPlan;
          if (paymentPlanBreakdown) next.paymentPlanBreakdown = paymentPlanBreakdown as Property['paymentPlanBreakdown'];
          if (paymentPlanSections) next.paymentPlanSections = paymentPlanSections as Property['paymentPlanSections'];
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
  const handleHeroImageClick = useCallback(() => handleOpenImageViewer(), [handleOpenImageViewer]);
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
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
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

  const normalizedDescription = useMemo((): NormalizedDescription | null => {
    if (!effectiveDescription || !effectiveDescription.trim()) return null;
    try {
      return normalizePropertyDescription(effectiveDescription);
    } catch {
      return null;
    }
  }, [effectiveDescription]);

  // Extreme smooth scroll: add class to html when this page mounts
  useEffect(() => {
    document.documentElement.classList.add('smooth-scroll-extreme');
    return () => { document.documentElement.classList.remove('smooth-scroll-extreme'); };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] pt-[72px] sm:pt-[88px]">
        <div className="relative w-full min-h-[60vh] sm:min-h-[70vh] bg-gray-200 animate-pulse" />
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl -mt-6 relative z-20">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            <div className="flex-1 space-y-12">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              <div className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            </div>
            <div className="lg:w-[380px]">
              <div className="lg:sticky lg:top-28 h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center pt-[88px]">
        <div className="text-center px-4">
          <p className="text-secondary text-lg font-medium mb-6">Property not found</p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-secondary font-medium hover:underline transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} /> Back to properties
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
      <main className={`smooth-scroll-container min-h-screen bg-[#fafafa] pt-[72px] sm:pt-[88px] ${stickyBarVisible ? 'pb-44 sm:pb-28' : 'pb-20'}`}>
        {/* ——— Hero: image + overlay ——— */}
        <section className="relative w-full min-h-[50vh] sm:min-h-[55vh] flex flex-col justify-end bg-gray-200">
          {/* Mobile: plain image (no button). Desktop: clickable image opens gallery */}
          <div className="absolute inset-0 sm:hidden">
            {images[selectedImage]?.trim() ? (
              <img key={selectedImage} src={images[selectedImage]} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
          </div>
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 m-0 focus:outline-none focus:ring-0 hidden sm:block"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleHeroImageClick(); }}
            aria-label="Open gallery"
          >
            {images[selectedImage]?.trim() ? (
              <img key={selectedImage} src={images[selectedImage]} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" draggable={false} />
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none hidden sm:block" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-5 z-10 pointer-events-auto bg-gradient-to-b from-black/50 to-transparent sm:bg-transparent">
            <Link href="/properties" className="inline-flex items-center gap-2 text-white/95 hover:text-white text-sm font-medium bg-black/25 backdrop-blur-sm px-3 py-2 rounded-lg transition-colors">
              <ArrowLeft size={18} strokeWidth={2} /> Back
            </Link>
            {images.length > 1 && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenImageViewer(); }} className="text-white/95 hover:text-white text-sm font-medium bg-black/25 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                Gallery · {images.length}
              </button>
            )}
          </div>
          {/* Overlay: title, location, unit type + BR, CTA (sm only) */}
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 max-w-4xl hidden sm:block">
            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight tracking-tight mb-2">
              {displayTitle}
            </h1>
            {displayLocation && (
              <p className="text-white/85 text-sm sm:text-base flex items-center gap-2 mb-4">
                <MapPin size={16} className="shrink-0 text-primary" strokeWidth={2} />
                {displayLocation}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {property.type?.trim() && (
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${property.type === 'Off-Plan' ? 'bg-primary text-secondary' : 'bg-white/20 text-white'}`}>
                  {property.type}
                </span>
              )}
              {getUnitTypeLabelsFromBedrooms(property.bedrooms).length > 0 && (
                <span className="text-white/95 font-semibold text-base sm:text-lg">
                  {getUnitTypeLabelsFromBedrooms(property.bedrooms).join(' · ')}
                </span>
              )}
            </div>
            <button
              onClick={handleOpenInquiry}
              className="mt-5 bg-primary text-secondary py-3 px-6 rounded-full font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors inline-flex items-center gap-2 lg:hidden"
            >
              Request information <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* ——— Two-column layout: main + sidebar (desktop) ——— */}
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
            {/* Left column: on mobile first (gallery → request info → overview → …) */}
            <div className="min-w-0 space-y-12 sm:space-y-16 order-1 lg:order-1">
              {images.length > 1 && (
                <div ref={thumbnailStripRef} className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
                  {images.slice(0, 8).map((image, idx) => {
                    if (!image?.trim()) return null;
                    const isSelected = selectedImage === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        ref={(el) => { thumbnailRefs.current[idx] = el; }}
                        onClick={() => handleImageSelect(idx)}
                        className={`relative w-24 h-16 sm:w-28 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-start ${
                          isSelected ? 'border-secondary ring-2 ring-secondary/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image src={image} alt="" fill className="object-cover" sizes="112px" loading="lazy" />
                      </button>
                    );
                  })}
                  {images.length > 8 && (
                    <button type="button" onClick={handleOpenImageViewer} className="flex-shrink-0 w-24 h-16 sm:w-28 sm:h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-xs font-medium">
                      +{images.length - 8}
                    </button>
                  )}
                </div>
              )}

              {/* Mobile only: Request info CTA (no price) */}
              <div className="lg:hidden rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md p-5">
                <button
                  onClick={handleOpenInquiry}
                  className="w-full bg-primary text-secondary py-4 rounded-xl font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Request information <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>

              <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4" aria-label="Sections">
                <button type="button" onClick={() => scrollToSection('section-overview')} className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-secondary transition-colors">Overview</button>
                {(property.amenities?.length > 0 || projectAmenities.length > 0) && <button type="button" onClick={() => scrollToSection('section-amenities')} className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-secondary transition-colors">Amenities</button>}
                {(displayDescription || projectDescription) && <button type="button" onClick={() => scrollToSection('section-description')} className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-secondary transition-colors">Description</button>}
                {relatedProperties.length > 0 && <button type="button" onClick={() => scrollToSection('section-related')} className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-secondary transition-colors">Similar</button>}
              </nav>

              {/* Overview — Read more expands in place */}
              {(normalizedDescription?.overview || normalizedDescription?.cleaned_description || (effectiveDescription && !normalizedDescription)) && (
                <section id="section-overview" className="scroll-section">
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Summary</h2>
                  <p className="font-display font-bold text-xl sm:text-2xl text-secondary mb-6">Overview</p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {overviewExpanded
                        ? (normalizedDescription?.cleaned_description || effectiveDescription?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || normalizedDescription?.overview)
                        : (normalizedDescription?.overview || descriptionPreview)}
                      {hasMoreDescription && (
                        <button
                          type="button"
                          onClick={() => setOverviewExpanded((v) => !v)}
                          className="text-secondary font-semibold hover:underline ml-1"
                        >
                          {overviewExpanded ? ' Show less' : ' Read more'}
                        </button>
                      )}
                    </p>
                    {(normalizedDescription?.lifestyle_tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                        {(normalizedDescription?.lifestyle_tags ?? []).map((tag) => (
                          <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full bg-secondary/5 text-secondary">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Amenities */}
              {((projectAmenities.length > 0 ? projectAmenities : (property.amenities || []).map((label) => ({ id: '', label })))).length > 0 && (
                <section id="section-amenities" className="scroll-section">
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Lifestyle</h2>
                  <p className="font-display font-bold text-xl sm:text-2xl text-secondary mb-6">Amenities</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(projectAmenities.length > 0 ? projectAmenities : (property.amenities || []).map((label) => ({ id: '', label }))).map((item, index) => {
                      const Icon = getAmenityIcon(item.id || item.label);
                      return (
                        <div key={item.id || index} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
                          </div>
                          <span className="text-secondary text-sm font-medium">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Full description */}
              {(displayDescription || isLoadingDescription) && (
                <section id="section-description" className="scroll-section">
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">About</h2>
                  <p className="font-display font-bold text-xl sm:text-2xl text-secondary mb-6">Project description</p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    {isLoadingDescription ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-4/6" />
                      </div>
                    ) : effectiveDescription && /<[a-z][\s\S]*>/i.test(effectiveDescription) ? (
                      <div className="text-gray-600 text-sm md:text-base leading-relaxed prose prose-p:my-2 prose-ul:my-2 prose-li:my-0 max-w-none" dangerouslySetInnerHTML={{ __html: effectiveDescription }} />
                    ) : (
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{effectiveDescription}</p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Right column: sticky sidebar — on mobile shows after main (order-2); key details & nearby only on mobile (no price/summary) */}
            <aside className="order-2 lg:order-2">
              <div className="lg:sticky lg:top-24 space-y-5">
                {/* CTA card — desktop only (no price) */}
                <div className="hidden lg:block rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md p-5 sm:p-6">
                  <button
                    onClick={handleOpenInquiry}
                    className="w-full bg-primary text-secondary py-4 rounded-xl font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Request information <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Summary card — desktop only (mobile: no summary, overview is in main column) */}
                {(displayDescription || isLoadingDescription) && (
                  <div className="hidden lg:block rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="font-display font-semibold text-secondary">Summary</p>
                    </div>
                    <div className="p-5">
                      {isLoadingDescription ? (
                        <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                      ) : (
                        <div className={overviewExpanded ? 'max-h-[220px] overflow-y-auto overscroll-contain pr-1' : ''}>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {overviewExpanded ? (normalizedDescription?.cleaned_description || effectiveDescription?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || normalizedDescription?.overview) : (normalizedDescription?.overview || descriptionPreview)}
                            {hasMoreDescription && (
                              <button type="button" onClick={() => setOverviewExpanded((v) => !v)} className="text-secondary font-semibold hover:underline ml-1">
                                {overviewExpanded ? ' Show less' : ' Read more'}
                              </button>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Details</p>
                  <p className="font-display font-bold text-lg text-secondary mb-4">Key details</p>
                  <PropertyDetailsGrid property={property} translatedDeveloper={translatedDeveloper} translatedLocality={translatedLocality} compact />
                </div>

                {/* Payment plan — right column */}
                {(property.paymentPlan?.trim() || (property.paymentPlanSections && Object.keys(property.paymentPlanSections).length > 0)) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-secondary/5 px-5 py-3 border-b border-secondary/10">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">Finance</p>
                      <p className="font-display font-bold text-lg text-secondary">Payment plan</p>
                    </div>
                    <div className="p-4">
                      {property.paymentPlanSections && Object.keys(property.paymentPlanSections).length > 0 ? (
                        <div className="space-y-0">
                          <PaymentPhaseRow label="On booking" value={property.paymentPlanSections.on_booking} icon={CreditCard} />
                          <PaymentPhaseRow label="On construction" value={property.paymentPlanSections.on_construction} icon={HardHat} />
                          <PaymentPhaseRow label="On handover" value={property.paymentPlanSections.on_handover} icon={KeyRound} />
                          {(property.paymentPlanSections.post_handover != null && property.paymentPlanSections.post_handover !== '') && (
                            <PaymentPhaseRow label="Post handover" value={property.paymentPlanSections.post_handover} icon={KeyRound} />
                          )}
                        </div>
                      ) : property.paymentPlan?.trim() ? (
                        <div className="text-gray-600 text-sm leading-relaxed">
                          {property.paymentPlan.includes('<') ? (
                            <div className="prose prose-p:my-2 prose-ul:my-2 prose-li:my-0 max-w-none text-sm" dangerouslySetInnerHTML={{ __html: property.paymentPlan }} />
                          ) : (
                            <p className="whitespace-pre-wrap">{property.paymentPlan}</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {normalizedDescription && (normalizedDescription.nearby.length > 0 || Object.keys(normalizedDescription.distances).length > 0) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Location</p>
                    <p className="font-display font-bold text-lg text-secondary mb-4">Nearby Facilities</p>
                    <div className="space-y-4">
                      {normalizedDescription.nearby.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Nearby</p>
                          <ul className="space-y-1.5">
                            {normalizedDescription.nearby.map((n, idx) => {
                              const timeLabel = idx < 3 ? '10–15 mins' : idx < 6 ? '20–30 mins' : '40–45 mins';
                              return (
                                <li key={`${n}-${idx}`} className="text-gray-700 text-sm flex items-center gap-2">
                                  <Navigation size={14} className="text-primary shrink-0" />
                                  <span>{n}</span>
                                  <span className="text-gray-500 text-xs">— {timeLabel}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {Object.keys(normalizedDescription.distances).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Distances</p>
                          <ul className="space-y-1.5">
                            {Object.entries(normalizedDescription.distances).map(([place, value], idx) => {
                              const timeLabel = idx < 3 ? '10–15 mins' : idx < 6 ? '20–30 mins' : '40–45 mins';
                              return (
                                <li key={place} className="text-gray-700 text-sm flex items-center gap-2">
                                  <Clock size={14} className="text-primary shrink-0" />
                                  <span>{value} to {place}</span>
                                  <span className="text-gray-500 text-xs">— {timeLabel}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Similar properties — full width below two columns */}
          {relatedProperties.length > 0 && (
            <section id="section-related" className="scroll-section mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-gray-200">
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-1">Explore</p>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-secondary">Similar properties</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProperties.map((rp) => (
                  <PropertyCard key={rp.id} property={rp} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky bottom CTA - visible on scroll for easy enquiry */}
        <StickyEnquireBar
          title={displayTitle}
          onEnquire={handleOpenInquiry}
          onVisibleChange={setStickyBarVisible}
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
          amenitiesWithIds={projectAmenities.length > 0 ? projectAmenities : undefined}
          propertyTitle={displayTitle}
        />
      </main>
    </>
  );
}
