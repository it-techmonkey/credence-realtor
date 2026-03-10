'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, BedDouble, Bath, Square, Phone, MessageCircle, Check, ArrowRight, Filter, ChevronDown, ChevronUp, Shield, Brain, Tag, Headphones, Globe, TrendingUp, Users, Home, Building2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import ContactDropdown from '@/components/ContactDropdown';
import AreaDetailsModal from '@/components/AreaDetailsModal';
import FilterModal from '@/components/FilterModal';
import Hotspots from '@/components/Hotspots';
import { getPaginatedProperties } from '@/lib/properties';
import { getAllDevelopers, DEVELOPERS } from '@/utils/developerMapping';
import { allAreas } from './areaData';
import { useScrollAnimations } from '@/utils/useScrollAnimation';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedContainer from '@/components/AnimatedContainer';
import AnimatedItem from '@/components/AnimatedItem';

const VALID_CATEGORIES = ['Affordable', 'Luxury', 'Waterfront', 'Commercial', 'Office', 'Off-Plan'];

function PropertiesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [properties, setProperties] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filters, setFilters] = useState({});
    const categoryFromUrl = searchParams.get('category');
    const [activeFilter, setActiveFilter] = useState(categoryFromUrl && VALID_CATEGORIES.includes(categoryFromUrl) ? categoryFromUrl : 'All');
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProperties, setTotalProperties] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [developers, setDevelopers] = useState([]);
    const [isLoadingDevelopers, setIsLoadingDevelopers] = useState(true);
    const [totalProjects, setTotalProjects] = useState(0);
    const [visibleAreasCount, setVisibleAreasCount] = useState(6);
    const propertiesPerPage = 9;
    const debounceTimerRef = useRef(null);
    const loadIdRef = useRef(0);

    // Initialize scroll animations
    useScrollAnimations();

    // Callbacks defined early to avoid initialization issues
    const handleApplyFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
        // Start from current URL so we preserve search and other params
        const params = new URLSearchParams(searchParams.toString());
        if (newFilters.city) params.set('city', newFilters.city);
        else params.delete('city');
        if (newFilters.locality) params.set('locality', newFilters.locality);
        else params.delete('locality');
        if (newFilters.developer) params.set('developer', newFilters.developer);
        else params.delete('developer');
        if (newFilters.bedrooms !== undefined && newFilters.bedrooms > 0) {
            params.set('bedrooms', newFilters.bedrooms.toString());
        } else params.delete('bedrooms');
        if (newFilters.minPrice !== undefined && newFilters.minPrice > 0) {
            params.set('minPrice', newFilters.minPrice.toString());
        } else params.delete('minPrice');
        if (newFilters.maxPrice !== undefined && newFilters.maxPrice > 0) {
            params.set('maxPrice', newFilters.maxPrice.toString());
        } else params.delete('maxPrice');
        if (newFilters.minArea !== undefined && newFilters.minArea > 0) {
            params.set('minArea', newFilters.minArea.toString());
        } else params.delete('minArea');
        if (newFilters.maxArea !== undefined && newFilters.maxArea > 0) {
            params.set('maxArea', newFilters.maxArea.toString());
        } else params.delete('maxArea');
        if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
        else params.delete('sortBy');
        if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder);
        else params.delete('sortOrder');
        const queryString = params.toString();
        router.replace(queryString ? `/properties?${queryString}` : '/properties', { scroll: false });
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }, [router, searchParams]);

    // Listen for area filter events from modal
    useEffect(() => {
        const handleAreaFilter = (event) => {
            const { locality } = event.detail;
            if (locality) {
                console.log('=== Area Filter Applied ===');
                console.log('Locality:', locality);
                console.log('Current filters before:', filters);
                // Clear all other filters and only set locality to avoid conflicts
                // This ensures we're only filtering by the selected area
                handleApplyFilters({ locality });
                setCurrentPage(1);
                // Scroll to properties grid section after a short delay
                setTimeout(() => {
                    const propertiesSection = document.querySelector('.py-12.bg-gray-50\\/50');
                    if (propertiesSection) {
                        propertiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        window.scrollTo({ top: 800, behavior: 'smooth' });
                    }
                }, 100);
            }
        };

        window.addEventListener('applyAreaFilter', handleAreaFilter);
        return () => {
            window.removeEventListener('applyAreaFilter', handleAreaFilter);
        };
    }, [handleApplyFilters, filters]);

    // Filter categories: API expects Affordable | Waterfront | Luxury | Office | Commercial | Off-Plan
    const filterCategories = [
        { value: 'All', label: 'All Properties' },
        { value: 'Off-Plan', label: 'Off-Plan' },
        { value: 'Affordable', label: 'Affordable' },
        { value: 'Luxury', label: 'Luxury' },
        { value: 'Waterfront', label: 'Waterfront' },
        { value: 'Commercial', label: 'Commercial' },
        { value: 'Office', label: 'Office' },
    ];

    // Property Categories Data
    const categories = [
        {
            title: "Off-Plan Properties",
            subtitle: "Own Tomorrow's Value, Today",
            desc: "Buy directly from top developers at early-stage prices.",
            features: [
                "Lower entry prices",
                "Flexible payment plans",
                "High appreciation potential"
            ]
        },
        {
            title: "Luxury Branded Residences",
            subtitle: "Where Prestige Meets Property",
            desc: "Iconic homes designed in partnership with global brands.",
            features: [
                "Premium design finishes",
                "Exclusive lifestyle perks",
                "High resale value"
            ]
        },
        {
            title: "Waterfront Properties",
            subtitle: "Dubai Living at Its Most Iconic",
            desc: "Beachfront and marina residences with stunning views.",
            features: [
                "Scenic ocean views",
                "High rental demand",
                "Resort-style amenities"
            ]
        },
        {
            title: "Affordable Properties",
            subtitle: "Smart Entry. Strong Returns.",
            desc: "High-potential communities for first-time investors.",
            features: [
                "Lower upfront investment",
                "Higher rental yields",
                "Easy resale liquidity"
            ]
        }
    ];

    // Debounce search query to avoid excessive API calls
    useEffect(() => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms debounce for snappier search

        // Cleanup on unmount or when searchQuery changes
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery]);

    // Keep URL in sync with debounced search so search works with filters and share/back
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmed = debouncedSearchQuery.trim();
        const currentSearch = params.get('search') || '';
        if (trimmed === currentSearch) return;
        if (trimmed) {
            params.set('search', trimmed);
        } else {
            params.delete('search');
        }
        const queryString = params.toString();
        router.replace(queryString ? `/properties?${queryString}` : '/properties', { scroll: false });
    }, [debouncedSearchQuery, searchParams, router]);

    // Load developers from static list (no API needed)
    useEffect(() => {
        const loadDevelopers = () => {
            setIsLoadingDevelopers(true);
            try {
                // Get all developers from static list
                const allDevs = getAllDevelopers();
                const developersList = allDevs.slice(0, 6).map((dev) => ({
                    id: dev.id,
                    name: dev.name,
                    developerId: dev.id,
                }));

                setDevelopers(developersList);
            } catch (err) {
                console.error('Error loading developers:', err);
                setDevelopers([]);
            } finally {
                setIsLoadingDevelopers(false);
            }
        };

        loadDevelopers();
    }, []);

    // Luxury = 7M+ AED and only these developers (same list as static API, including Arabic names)
    const LUXURY_MIN_PRICE = 7_000_000;
    const AFFORDABLE_MAX_PRICE = 1_500_000;

    // Read all filter params from URL on mount and keep filters in sync with URL (avoids stale category constraints when switching)
    useEffect(() => {
        const searchParam = searchParams.get('search');
        if (searchParam != null && searchParam !== '') {
            setSearchQuery(searchParam);
        }
        const cityParam = searchParams.get('city');
        const localityParam = searchParams.get('locality');
        const developerParam = searchParams.get('developer');
        const categoryParam = searchParams.get('category');
        const bedroomsParam = searchParams.get('bedrooms');
        const minPriceParam = searchParams.get('minPrice');
        const maxPriceParam = searchParams.get('maxPrice');
        const minAreaParam = searchParams.get('minArea');
        const maxAreaParam = searchParams.get('maxArea');
        const sortByParam = searchParams.get('sortBy');
        const sortOrderParam = searchParams.get('sortOrder');

        const urlFilters = {};
        if (localityParam) {
            urlFilters.locality = localityParam;
        } else if (cityParam) {
            urlFilters.city = cityParam;
        }
        if (developerParam) {
            urlFilters.developer = developerParam;
        }
        if (bedroomsParam) {
            const bedrooms = parseInt(bedroomsParam);
            if (!isNaN(bedrooms) && bedrooms > 0) {
                urlFilters.bedrooms = bedrooms;
            }
        }
        if (minPriceParam) {
            const minPrice = parseInt(minPriceParam);
            if (!isNaN(minPrice) && minPrice > 0) {
                urlFilters.minPrice = minPrice;
            }
        }
        if (maxPriceParam) {
            const maxPrice = parseInt(maxPriceParam);
            if (!isNaN(maxPrice) && maxPrice > 0) {
                urlFilters.maxPrice = maxPrice;
            }
        }
        if (minAreaParam) {
            const minArea = parseInt(minAreaParam);
            if (!isNaN(minArea) && minArea > 0) {
                urlFilters.minArea = minArea;
            }
        }
        if (maxAreaParam) {
            const maxArea = parseInt(maxAreaParam);
            if (!isNaN(maxArea) && maxArea > 0) {
                urlFilters.maxArea = maxArea;
            }
        }
        if (sortByParam) {
            urlFilters.sortBy = sortByParam;
        }
        if (sortOrderParam) {
            urlFilters.sortOrder = sortOrderParam;
        }
        // Category-derived price constraints last (so switching category overwrites any previous category rules)
        if (categoryParam && categoryParam.toLowerCase() === 'luxury') {
            urlFilters.minPrice = LUXURY_MIN_PRICE;
            delete urlFilters.maxPrice;
            setActiveFilter('Luxury Branded');
        } else if (categoryParam && categoryParam.toLowerCase() === 'affordable') {
            urlFilters.maxPrice = AFFORDABLE_MAX_PRICE;
            delete urlFilters.minPrice;
        }
        if (categoryParam && VALID_CATEGORIES.includes(categoryParam)) {
            setActiveFilter(categoryParam);
        } else if (!categoryParam || !VALID_CATEGORIES.includes(categoryParam)) {
            setActiveFilter('All');
        }

        // Always sync filters from URL so switching category (e.g. Luxury -> Affordable) clears stale minPrice/maxPrice
        setFilters(urlFilters);
    }, [searchParams]);

    // Fetch properties from API with filters
    useEffect(() => {
        const thisLoadId = loadIdRef.current + 1;
        loadIdRef.current = thisLoadId;

        const loadProperties = async () => {
            setIsLoading(true);
            setError(null);

            const startTime = Date.now();

            try {
                // Category from URL or active filter - single source of truth for category
                const categoryFromUrl = searchParams.get('category');
                const effectiveCategory = (categoryFromUrl && categoryFromUrl !== 'All' && VALID_CATEGORIES.includes(categoryFromUrl))
                    ? categoryFromUrl
                    : (activeFilter && activeFilter !== 'All' ? activeFilter : null);

                // Build apiFilters from filters, then apply category rules so switching back and forth never leaves conflicting constraints
                const apiFilters = { ...filters };

                // Luxury: use only category + minPrice so static API is used (Alnair path often returns no data)
                if (effectiveCategory && effectiveCategory.toLowerCase() === 'luxury') {
                    apiFilters.category = 'Luxury';
                    apiFilters.minPrice = LUXURY_MIN_PRICE;
                    delete apiFilters.maxPrice;
                    delete apiFilters.allowedDevelopers;
                } else if (effectiveCategory && effectiveCategory.toLowerCase() === 'affordable') {
                    apiFilters.category = 'Affordable';
                    apiFilters.maxPrice = AFFORDABLE_MAX_PRICE;
                    delete apiFilters.minPrice;
                    delete apiFilters.allowedDevelopers;
                } else if (effectiveCategory) {
                    apiFilters.category = effectiveCategory;
                    delete apiFilters.minPrice;
                    delete apiFilters.maxPrice;
                    delete apiFilters.allowedDevelopers;
                } else {
                    // All: keep user's minPrice/maxPrice from filter modal; only clear category-specific state
                    delete apiFilters.allowedDevelopers;
                }

                if (debouncedSearchQuery.trim()) {
                    apiFilters.search = debouncedSearchQuery.trim();
                }

                const result = await getPaginatedProperties(apiFilters, currentPage, propertiesPerPage);

                // Ignore stale response if user changed filters before this request finished
                if (loadIdRef.current !== thisLoadId) return;

                // Client-side guard: Affordable = cap at 1.5M (server already filters, this is a safety net).
                // Luxury filtering is fully handled server-side (static API filters by developer name in Arabic + price >= 7M).
                // We do NOT re-filter luxury by developer name here because translated names (Arabic -> English)
                // may not exactly match the config list, causing valid properties to be dropped.
                const isLuxuryView = effectiveCategory && effectiveCategory.toLowerCase() === 'luxury';
                const isAffordableView = effectiveCategory && effectiveCategory.toLowerCase() === 'affordable';
                const getPropertyPrice = (p) => (typeof p?.price === 'number' ? p.price : p?.minPrice ?? p?.maxPrice) || 0;
                let list = result.properties;
                if (isLuxuryView) {
                    // Only enforce price floor as safety net; developer filter already applied server-side
                    list = list.filter((p) => getPropertyPrice(p) >= LUXURY_MIN_PRICE);
                } else if (isAffordableView) {
                    list = list.filter((p) => getPropertyPrice(p) <= AFFORDABLE_MAX_PRICE);
                }

                setProperties(list);
                setTotalPages(result.pagination.totalPages);
                setTotalProperties(result.pagination.total);

                if (process.env.NODE_ENV === 'development') {
                    console.log('Properties loaded:', {
                        count: result.properties.length,
                        total: result.pagination.total,
                        page: currentPage,
                        filters: apiFilters,
                        ms: Date.now() - startTime
                    });
                }
            } catch (err) {
                if (loadIdRef.current !== thisLoadId) return;
                console.error('Error loading properties:', err);
                setError('Failed to load properties. Please try again later.');
                setProperties([]);
                setTotalPages(0);
                setTotalProperties(0);
            } finally {
                if (loadIdRef.current === thisLoadId) {
                    setIsLoading(false);
                }
            }
        };

        loadProperties();
    }, [filters, debouncedSearchQuery, activeFilter, currentPage, propertiesPerPage, searchParams]);

    // Reset to page 1 when filters or debounced search change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, debouncedSearchQuery, activeFilter]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleFilterChange = useCallback((filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (filter && filter !== 'All') {
            params.set('category', filter);
        } else {
            params.delete('category');
        }
        params.delete('page'); // reset to page 1
        router.replace(params.toString() ? `/properties?${params.toString()}` : '/properties', { scroll: false });
    }, [router, searchParams]);

    return (
        <div className="font-sans">
            {/* 1. Hero Section */}
            <section className="relative h-screen min-h-[800px] flex items-center justify-center bg-black overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <img
                        src="/assets/properties-bg.jpg"
                        alt="Dubai Skyline"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/40" />
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center pt-32">
                    <h1 className="text-5xl md:text-6xl font-display text-white mb-6 leading-tight animate-fade-in-up">
                        Find the Right Property in Dubai
                    </h1>
                    <h2 className="text-3xl md:text-5xl font-display text-[#C5A365] mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        — Backed by Insight, Not Guesswork
                    </h2>
                    <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Explore Dubai's most promising real estate opportunities across off-plan, waterfront,
                        affordable, and luxury branded properties. Whether you're investing, relocating, or
                        expanding your portfolio, Credence helps you make confident, future-ready decisions.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link href="/properties" className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-[#C5A365] hover:text-white transition-all flex items-center gap-2">
                            Get Property Options <ArrowRight size={16} />
                        </Link>
                        <a href="https://wa.me/971588919223" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-green-600 hover:border-green-600 border border-white/30 backdrop-blur text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
                            <MessageCircle size={20} />
                            WhatsApp Now
                        </a>
                    </div>
                </div>
            </section>


            {/* 2. Filter & Properties Grid Section */}
            <section className="py-12 bg-gray-50/50">
                <div className="container mx-auto px-4 max-w-7xl">

                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="bg-white border border-gray-200 flex gap-3 items-center px-5 py-3 rounded-full max-w-2xl mx-auto">
                            <Search size={20} className="text-gray-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search for a Property by Name, Location, or Developer"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 outline-none text-base font-medium text-gray-700 placeholder:text-gray-400 bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Top Controls - Responsive Update */}
                    <div className="flex flex-col xl:flex-row justify-end items-center mb-8 gap-6">
                        {/* Category filter: Affordable, Waterfront, Luxury, Commercial, Office */}
                        <div className="flex flex-wrap justify-center gap-2 w-full xl:w-auto">
                            {filterCategories.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => handleFilterChange(filter.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                        activeFilter === filter.value
                                            ? 'bg-secondary text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Secondary Filters */}
                        <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-all whitespace-nowrap"
                            >
                                <Filter size={16} /> Filters <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                            <div className="text-secondary text-lg font-semibold">Loading properties...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                            <p className="text-red-600 text-lg font-semibold">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Properties Count */}
                    {!isLoading && !error && (
                        <div className="mb-8 text-secondary font-medium">
                            <span className="font-bold">{totalProperties}</span> properties found
                        </div>
                    )}

                    {/* Properties Grid */}
                    {!isLoading && !error && properties.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                            <p className="text-secondary text-lg font-semibold">No properties found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
                        </div>
                    )}

                    {!isLoading && !error && properties.length > 0 && (
                        <AnimatedContainer 
                            key={`properties-${currentPage}-${Object.keys(filters).join('-')}`}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {properties.map(property => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </AnimatedContainer>
                    )}

                    {/* Pagination */}
                    {!isLoading && !error && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-16">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Previous page"
                            >
                                <ChevronDown size={20} className="rotate-90" />
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                if (pageNum === 1 && currentPage > 3 && totalPages > 5) {
                                    return (
                                        <div key="start" className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                className="font-medium text-lg text-gray-700 hover:text-black"
                                            >
                                                1
                                            </button>
                                            <span className="font-medium text-lg text-gray-400">...</span>
                                        </div>
                                    );
                                }

                                if (pageNum === totalPages && currentPage < totalPages - 2 && totalPages > 5) {
                                    return null;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`font-medium text-lg ${currentPage === pageNum
                                            ? 'bg-black text-white w-10 h-10 flex items-center justify-center rounded-full'
                                            : 'text-gray-700 hover:text-black'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-lg text-gray-400">...</span>
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        className="font-medium text-lg text-gray-700 hover:text-black"
                                    >
                                        {totalPages}
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronDown size={20} className="-rotate-90" />
                            </button>
                        </div>
                    )}

                </div>
            </section>

            {/* 3. Explore by Area Section */}
            <AnimatedSection className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="text-center mb-16">
                        <span className="bg-[#FFF9F0] text-[#C5A365] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-[#C5A365]/20">
                            Location Guide
                        </span>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary mt-6 mb-4">
                            Explore Properties by <span className="text-[#C5A365]">Area</span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Discover Dubai's most sought-after neighborhoods and find your perfect investment opportunity.
                        </p>
                    </div>

                    {/* Interactive Map Section */}
                    <div className="mb-16">
                        <Hotspots
                            title=""
                            showTitle={false}
                            showFilters={true}
                            filterOptions={["All", "Villa", "2 BHK", "3 BHK", "1 BHK"]}
                            className="px-0 py-0 rounded-[3rem] overflow-hidden shadow-lg border border-gray-100"
                            mapFilters={{
                                category: activeFilter && activeFilter !== 'All' ? activeFilter : undefined,
                                developer: filters.developer,
                                bedrooms: filters.bedrooms,
                                minPrice: filters.minPrice,
                                maxPrice: filters.maxPrice,
                                locality: filters.locality,
                            }}
                        />
                    </div>

                    {/* Area Cards Grid */}
                    <AnimatedContainer 
                        key={`areas-${visibleAreasCount}`}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {allAreas.slice(0, visibleAreasCount).map((area, i) => (
                            <AnimatedItem key={i} className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 bg-white">
                                <div className="h-64 relative overflow-hidden">
                                    <img src={area.img} alt={area.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold flex items-center gap-1 text-green-700">
                                        <TrendingUp size={12} /> {area.roi}
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                        <h3 className="text-xl font-bold text-white">{area.name}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">{area.desc}</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {area.features.map(f => (
                                            <span key={f} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] uppercase font-bold text-gray-400">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="text-xs">
                                            <span className="text-gray-400 block mb-0.5">Starting from</span>
                                            <span className="font-bold text-secondary">{area.price}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedArea(area);
                                            }}
                                            className="text-[#C5A365] text-xs font-bold uppercase flex items-center gap-1 hover:gap-2 transition-all"
                                        >
                                            View Properties <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </AnimatedItem>
                        ))}
                    </AnimatedContainer>

                    {/* Load More Button */}
                    {visibleAreasCount < allAreas.length && (
                        <div className="flex justify-center mt-12">
                            <button
                                onClick={() => setVisibleAreasCount(prev => Math.min(prev + 6, allAreas.length))}
                                className="px-8 py-3 bg-secondary text-white rounded-full font-bold uppercase text-sm hover:bg-secondary/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                Load More Areas <ChevronDown size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <AreaDetailsModal
                    isOpen={!!selectedArea}
                    onClose={() => setSelectedArea(null)}
                    area={selectedArea}
                />
            </AnimatedSection>

            {/* 4. Explore by Developer */}
            <AnimatedSection className="py-24 bg-[#FAFAFA]">
                <div className="container mx-auto px-4 max-w-7xl text-center">
                    <span className="bg-white border border-gray-200 text-[#C5A365] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                        Trusted Partners
                    </span>
                    <h2 className="text-4xl md:text-5xl font-display text-secondary mt-6 mb-8">
                        Explore Properties by <span className="text-[#C5A365]">Developer</span>
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-12">
                        Browse projects from Dubai's most reputable real estate developers.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link href="/developers" className="bg-[#1A1A1A] text-white px-8 py-3 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-black transition-colors">
                            Explore Developers <ArrowRight size={16} />
                        </Link>
                        <ContactDropdown
                            label="Speak to a Leasing Expert"
                            className="bg-white border border-gray-200 text-secondary px-8 py-3 rounded-md text-sm font-medium flex items-center gap-2 hover:border-[#C5A365] transition-colors"
                        />
                    </div>

                    <AnimatedContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <AnimatedItem
                            onClick={(e) => {
                                e.preventDefault();
                                setFilters({});
                                setCurrentPage(1);
                                window.history.pushState({}, '', '/properties');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-[#1A1A1A] text-white rounded-xl p-4 flex items-center justify-between col-span-2 md:col-span-2 lg:col-span-1 border border-transparent shadow-lg cursor-pointer hover:bg-gray-900 transition-colors"
                        >
                            <span className="font-bold">All Developers</span>
                            <Check size={16} className="text-[#C5A365]" />
                        </AnimatedItem>
                        {isLoadingDevelopers ? (
                            // Loading skeleton
                            Array.from({ length: 6 }).map((_, i) => (
                                <AnimatedItem
                                    key={i}
                                    className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100 h-24 animate-pulse"
                                >
                                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                </AnimatedItem>
                            ))
                        ) : developers.length > 0 ? (
                            developers.map((dev) => (
                                <AnimatedItem
                                    key={dev.id || dev.name}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setFilters({ developer: dev.name });
                                        setCurrentPage(1);
                                        const params = new URLSearchParams();
                                        params.set('developer', dev.name);
                                        window.history.pushState({}, '', `/properties?${params.toString()}`);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100 hover:border-[#C5A365] hover:shadow-lg transition-all cursor-pointer group h-24"
                                >
                                    <span className="font-bold text-gray-700 group-hover:text-secondary mb-1 text-center text-sm">
                                        {dev.name.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {dev.projectCount} {dev.projectCount === 1 ? 'project' : 'projects'}
                                    </span>
                                </AnimatedItem>
                            ))
                        ) : (
                            // Fallback to top 10 developers if API fails
                            (() => {
                                const top10DeveloperIds = [6, 442, 89, 988, 64, 335, 510, 55, 69, 536];
                                const top10Developers = top10DeveloperIds
                                    .map(id => DEVELOPERS.find(d => d.id === id))
                                    .filter(Boolean);
                                return top10Developers.map((dev, i) => (
                                    <AnimatedItem
                                        key={i}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFilters({ developer: dev.name.toUpperCase() });
                                            setCurrentPage(1);
                                            const params = new URLSearchParams();
                                            params.set('developer', dev.name.toUpperCase());
                                            window.history.pushState({}, '', `/properties?${params.toString()}`);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100 hover:border-[#C5A365] hover:shadow-lg transition-all cursor-pointer group h-24"
                                    >
                                        <span className="font-bold text-gray-700 group-hover:text-secondary mb-1">{dev.name.toUpperCase()}</span>
                                        <span className="text-[10px] text-gray-400">Loading...</span>
                                    </AnimatedItem>
                                ));
                            })()
                        )}
                    </AnimatedContainer>

                    {/* Stats */}
                    <AnimatedContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-5xl mx-auto">
                        <AnimatedItem className="bg-white p-6 rounded-2xl shadow-sm">
                            <h4 className="text-3xl font-bold text-[#C5A365] mb-1">
                                {isLoadingDevelopers ? '...' : totalProjects > 0 ? `${totalProjects}+` : '200+'}
                            </h4>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Projects</p>
                        </AnimatedItem>
                        <AnimatedItem className="bg-white p-6 rounded-2xl shadow-sm">
                            <h4 className="text-3xl font-bold text-[#C5A365] mb-1">50K+</h4>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Units Delivered</p>
                        </AnimatedItem>
                        <AnimatedItem className="bg-white p-6 rounded-2xl shadow-sm">
                            <h4 className="text-3xl font-bold text-[#C5A365] mb-1">15+</h4>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Years Experience</p>
                        </AnimatedItem>
                        <AnimatedItem className="bg-white p-6 rounded-2xl shadow-sm">
                            <h4 className="text-3xl font-bold text-[#C5A365] mb-1">100%</h4>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Verified Developers</p>
                        </AnimatedItem>
                    </AnimatedContainer>
                </div>
            </AnimatedSection>

            {/* 5. Buyer's Guide Section */}
            <AnimatedSection className="py-24 bg-white" id="buyers-guide">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="bg-[#FFF9F0] text-[#C5A365] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-[#C5A365]/20">
                            Knowledge Center
                        </span>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary mt-6 mb-6">
                            Buyer's Guide to <span className="text-[#C5A365]">Dubai Property</span>
                        </h2>
                        <p className="text-gray-500 mb-10 max-w-2xl mx-auto">
                            Everything you need to know about investing in Dubai real estate, from legalities to lifestyle.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                title: "1. Why Invest in Dubai?",
                                content: (
                                    <ul className="space-y-3 list-disc pl-5">
                                        <li><strong>0% property tax</strong></li>
                                        <li><strong>High return on investment (ROI)</strong> – 6–10% on average</li>
                                        <li><strong>World-class infrastructure & lifestyle</strong></li>
                                        <li><strong>Investor-friendly government policies</strong></li>
                                        <li><strong>Strong capital appreciation and demand</strong></li>
                                    </ul>
                                )
                            },
                            {
                                title: "2. Who Can Buy Property in Dubai?",
                                content: (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-secondary">Freehold Ownership (for foreigners):</h4>
                                            <p>Since 2002, foreigners can buy, sell, lease, or rent property in designated freehold areas. Ownership is full and unlimited in duration.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Leasehold Ownership:</h4>
                                            <p>In some areas, non-GCC nationals can buy leasehold properties for a period (typically 30–99 years), after which ownership reverts to the landlord.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Residency through Property:</h4>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                <li><strong>Investor Visa:</strong> Property worth AED 750,000+ qualifies you for a 2-year renewable residency visa.</li>
                                                <li><strong>Golden Visa:</strong> AED 2 million+ investment allows a 10-year renewable residency, with family sponsorship benefits.</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "3. Key Property Types",
                                content: (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-bold text-secondary">Apartments:</h4>
                                            <p>Available in high-rise towers in urban centers. Studio to multi-bedroom options are available. Ideal for buy-to-let investors due to high tenant demand and rental yields.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Villas & Townhouses:</h4>
                                            <p>Offer private gardens, pools, and space. Located in gated communities. Popular among families and long-term residents.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Off-Plan Properties:</h4>
                                            <p>Properties sold by developers before construction is completed. They offer lower entry prices, flexible payment plans, and potential capital appreciation by handover. Must be purchased only through RERA-approved developers with escrow accounts.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Serviced & Branded Residences:</h4>
                                            <p>Managed by global hospitality brands or Famous Designers, they include hotel-style amenities and services (housekeeping, concierge, valet etc). High appeal to premium tenants and short-term rental investors.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Commercial Properties:</h4>
                                            <p className="mb-2">Include offices, retail shops, warehouses, and industrial units. Available in both freehold and leasehold zones.</p>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                <li><strong>Offices:</strong> Popular in Business Bay, Downtown, DIFC, and JLT; investors can earn stable returns through long-term corporate leases.</li>
                                                <li><strong>Retail Units:</strong> Located in shopping districts and mixed-use buildings. Ideal for those targeting F&B, wellness, or service businesses.</li>
                                                <li><strong>Warehousing & Logistics:</strong> Concentrated in Dubai South and Al Quoz, benefiting from Dubai’s logistics and trade infrastructure.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Hospitality Properties (Hotels & Hotel Apartments):</h4>
                                            <p className="mb-2">Opportunities to invest in hotel rooms or full hotel units operated by brands such as Radisson, Marriott, or Kempinski.</p>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                <li><strong>Hotel Room Investments:</strong> Fully managed and income-generating; investors earn a share of rental income without operational responsibility.</li>
                                                <li><strong>Hotel Apartments:</strong> Residential-style units in hotel complexes, often eligible for both personal use and short-term rental programs.</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "4. Popular Areas to Buy",
                                content: (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-bold text-primary mb-2 uppercase tracking-widest text-xs">Established Areas</h4>
                                            <ul className="space-y-3">
                                                <li><strong className="text-secondary">Downtown Dubai:</strong> The heart of the city, home to Burj Khalifa, The Dubai Mall, and luxury residences. High-end lifestyle and strong long-term appreciation.</li>
                                                <li><strong className="text-secondary">Palm Jumeirah:</strong> Dubai’s iconic man-made island with beachfront villas and high-end apartments. Strong rental returns and global brand residences (e.g., Atlantis, W Residences).</li>
                                                <li><strong className="text-secondary">Dubai Marina:</strong> A high-rise waterfront community popular among expats. Excellent walkability, nightlife, and access to the beach. Strong rental yields.</li>
                                                <li><strong className="text-secondary">Business Bay:</strong> A fast-growing residential and commercial hub near Downtown. Offers more affordable luxury apartments and excellent ROI potential.</li>
                                                <li><strong className="text-secondary">Jumeirah Golf Estates, Dubai Hills Estates, Damac Hills One & Arabian Ranches:</strong> A gated golf course community offering large villas with green views. Ideal for families and long-term living.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary mb-2 uppercase tracking-widest text-xs">Emerging Hotspots</h4>
                                            <ul className="space-y-3">
                                                <li><strong className="text-secondary">Dubai South:</strong> Strategically located near Al Maktoum Airport and Expo City. Fast developing with government support and long-term infrastructure planning.</li>
                                                <li><strong className="text-secondary">Mohammed Bin Rashid (MBR) City:</strong> A master-planned luxury community with green spaces, lagoons, and iconic villas/apartments. Close to Downtown and DIFC.</li>
                                                <li><strong className="text-secondary">Tilal Al Ghaf & Damac Lagoons:</strong> A resort-style community featuring crystal lagoons, landscaped parks, and modern villas/townhouses. Popular for family-focused living.</li>
                                                <li><strong className="text-secondary">Dubai Creek Harbour:</strong> A waterfront mega-development by Emaar with planned skyscrapers, luxury apartments, and stunning creek views. Positioned as “The New Downtown.”</li>
                                                <li><strong className="text-secondary">Dubai Islands (formerly Deira Islands):</strong> A group of five man-made islands developed by Nakheel, featuring beachfront resorts, luxury residences, and marina living. Designed to be a new tourism and leisure hotspot close to the historic Deira area.</li>
                                                <li><strong className="text-secondary">Palm Jebel Ali:</strong> A revived mega-project, larger than Palm Jumeirah, offering oceanfront villas, private beaches, and luxury lifestyle zones. Currently under redevelopment with massive investor interest and long-term value upside.</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "5. Step-by-Step Buying Process",
                                content: (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { step: "1", title: "Define Budget & Objective", desc: "Decide on investment or end-use, cash or mortgage, timeline, and property type." },
                                            { step: "2", title: "Select Property & Agent", desc: "Work with RERA-licensed brokers and choose a reputable developer or property." },
                                            { step: "3", title: "Sign MOU (Form F)", desc: "A Memorandum of Understanding is signed between buyer and seller, outlining terms." },
                                            { step: "4", title: "Pay Deposit", desc: "Typically 10% of the purchase price, paid to secure the property." },
                                            { step: "5", title: "Obtain NOC", desc: "Seller requests a No Objection Certificate from the developer to complete the transfer." },
                                            { step: "6", title: "Title Transfer at DLD", desc: "Final payment is made, and the title deed is issued at the Dubai Land Department." }
                                        ].map((s, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                                <span className="font-display text-4xl text-[#C5A365]/30 font-bold">{s.step}</span>
                                                <div>
                                                    <h4 className="font-bold text-secondary">{s.title}</h4>
                                                    <p className="text-sm text-gray-500">{s.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            },
                            {
                                title: "6. Legal & Regulatory Essentials",
                                content: (
                                    <ul className="space-y-4">
                                        <li>
                                            <h4 className="font-bold text-secondary">Dubai Land Department (DLD):</h4>
                                            <p>The official government body that oversees real estate registration, title issuance, and legal compliance.</p>
                                        </li>
                                        <li>
                                            <h4 className="font-bold text-secondary">RERA (Real Estate Regulatory Authority):</h4>
                                            <p>A regulatory arm of DLD that ensures transparency and protects buyers. All agents, developers, and projects must be registered with RERA.</p>
                                        </li>
                                        <li>
                                            <h4 className="font-bold text-secondary">Escrow Account Law:</h4>
                                            <p>Off-plan buyers’ funds are protected in an escrow account, which developers can only access upon completing construction milestones.</p>
                                        </li>
                                        <li>
                                            <h4 className="font-bold text-secondary">Title Deed:</h4>
                                            <p>A legal document proving full ownership, issued in the buyer's name by DLD.</p>
                                        </li>
                                    </ul>
                                )
                            },
                            {
                                title: "7. Costs to Consider",
                                content: (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-bold text-secondary mb-2 border-b pb-1">Upfront Costs:</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex justify-between"><span>DLD Transfer Fee</span> <span className="font-bold">4% of property value</span></li>
                                                <li className="flex justify-between"><span>Trustee Office Fee</span> <span className="font-bold">AED 2,000–5,000</span></li>
                                                <li className="flex justify-between"><span>Agent Commission</span> <span className="font-bold">2% of purchase price</span></li>
                                                <li className="flex justify-between"><span>Admin Fees</span> <span className="font-bold">AED 5,000–10,000</span></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary mb-2 border-b pb-1">Ongoing Costs:</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li><strong>Service Charges:</strong> Maintenance and facility fees (AED/sq.ft.)</li>
                                                <li><strong>Utilities:</strong> DEWA (electricity and water) connection and monthly bills</li>
                                                <li><strong>Property Management (optional):</strong> If you appoint a company to manage rentals</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "8. Financing & Mortgages",
                                content: (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-secondary">Eligibility:</h4>
                                            <p>Both residents and non-residents can apply for mortgages, subject to bank approval and credit checks.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Key Terms:</h4>
                                            <ul className="space-y-2 mt-2 list-disc pl-5">
                                                <li><strong>Down Payment:</strong> 20–25% for residents; 50% for non-residents (often required)</li>
                                                <li><strong>Loan Term:</strong> 15–25 years</li>
                                                <li><strong>Interest Rate:</strong> Fixed or variable (starting ~3.99% as of 2025)</li>
                                                <li><strong>Pre-Approval:</strong> Strongly recommended before property search</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "9. Off-Plan Property Insights",
                                content: (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h4 className="font-bold text-green-800 mb-2">Advantages</h4>
                                            <ul className="list-disc pl-5 text-sm space-y-1 text-green-700">
                                                <li>Lower entry cost</li>
                                                <li>Staged payment plans</li>
                                                <li>Capital gains during construction</li>
                                                <li>Brand-new units</li>
                                            </ul>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <h4 className="font-bold text-red-800 mb-2">Risks</h4>
                                            <ul className="list-disc pl-5 text-sm space-y-1 text-red-700">
                                                <li>Construction delays</li>
                                                <li>Developer reputation</li>
                                                <li>Market fluctuations</li>
                                            </ul>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-bold text-blue-800 mb-2">How to Protect Yourself</h4>
                                            <ul className="list-disc pl-5 text-sm space-y-1 text-blue-700">
                                                <li>Choose DLD-registered projects</li>
                                                <li>Confirm escrow account compliance</li>
                                                <li>Check developer track record</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "10. Rental & ROI Expectations",
                                content: (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-secondary">Rental Yields:</h4>
                                            <ul className="list-disc pl-5">
                                                <li><strong>Apartments:</strong> 6–8% gross annual yield</li>
                                                <li><strong>Villas:</strong> 4–6% depending on location</li>
                                                <li><strong>Short-Term Rentals:</strong> Up to 12% in tourist hotspots</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Options:</h4>
                                            <ul className="list-disc pl-5">
                                                <li><strong>Long-Term Leasing:</strong> Traditional tenant contracts</li>
                                                <li><strong>Short-Term Rentals:</strong> Holiday homes via Airbnb or licensed operators</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary">Exit Strategy:</h4>
                                            <ul className="list-disc pl-5">
                                                <li>Resell after value appreciation</li>
                                                <li>Reinvest in new projects</li>
                                                <li>Gift or pass on to heirs (inheritance supported legally in freehold)</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "11. Residency & Golden Visa via Property",
                                content: (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="border border-[#C5A365] rounded-xl p-6 bg-[#C5A365]/5">
                                            <h4 className="font-display text-xl font-bold text-secondary mb-3">Investor Visa (2-Year)</h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-center gap-2"><Check size={14} className="text-[#C5A365]" /> Minimum AED 750,000 property value</li>
                                                <li className="flex items-center gap-2"><Check size={14} className="text-[#C5A365]" /> Can be mortgaged</li>
                                                <li className="flex items-center gap-2"><Check size={14} className="text-[#C5A365]" /> Renewable every 2 years</li>
                                            </ul>
                                        </div>
                                        <div className="bg-[#C5A365] rounded-xl p-6 text-white text-center md:text-left">
                                            <h4 className="font-display text-xl font-bold mb-3">Golden Visa (10-Year)</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Property investment of AED 2 million+</li>
                                                <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Can be mortgaged</li>
                                                <li className="flex items-center gap-2"><Check size={14} className="text-white" /> Includes family sponsorship</li>
                                                <li className="flex items-center gap-2"><Check size={14} className="text-white" /> No sponsor required</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "12. Dos and Don’ts for Buyers",
                                content: (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2"><Check size={20} /> DO</h4>
                                            <ul className="space-y-2 text-sm list-disc pl-5">
                                                <li>Verify title deed and developer registration</li>
                                                <li>Read contracts carefully (MOU, SPA, payment terms)</li>
                                                <li>Use licensed agents and legal advisors</li>
                                                <li>Plan exit strategy before buying</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2"><span className="text-lg">✖</span> DON’T</h4>
                                            <ul className="space-y-2 text-sm list-disc pl-5">
                                                <li>Rely solely on verbal agreements</li>
                                                <li>Ignore service charge obligations</li>
                                                <li>Skip background checks on developers</li>
                                                <li>Over-leverage with loans you cannot sustain</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "13. Working with Professionals",
                                content: (
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <p className="mb-4 text-gray-600 italic">To ensure a smooth, risk-free process, engage with:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { role: "RERA-Certified Agents", desc: "Officially licensed brokers" },
                                                { role: "Real Estate Lawyers", desc: "For contract review and due diligence" },
                                                { role: "Mortgage Advisors", desc: "To find best financing terms" },
                                                { role: "Property Managers", desc: "For rental and asset management" }
                                            ].map((p, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="mt-1"><Users size={16} className="text-[#C5A365]" /></div>
                                                    <div>
                                                        <h5 className="font-bold text-secondary text-sm">{p.role}</h5>
                                                        <p className="text-xs text-gray-400">{p.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: "14. Glossary of Key Terms",
                                content: (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                        {[
                                            ["DLD", "Dubai Land Department"],
                                            ["RERA", "Real Estate Regulatory Agency"],
                                            ["Freehold", "Full property ownership rights"],
                                            ["Leasehold", "Long-term lease rights without land ownership"],
                                            ["Oqood", "Interim title certificate for off-plan property"],
                                            ["NOC", "No Objection Certificate – required to transfer ownership"],
                                            ["Escrow Account", "Safeguards buyer payments in off-plan deals"],
                                            ["Title Deed", "Official proof of ownership"]
                                        ].map(([term, def], i) => (
                                            <div key={i} className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="font-bold text-secondary">{term}</span>
                                                <span className="text-gray-500 text-right text-xs md:text-sm">{def}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            },
                            {
                                title: "16. Required Documents",
                                content: (
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="font-bold text-secondary mb-3 border-l-4 border-[#C5A365] pl-3">A. For Individual Buyers (UAE Residents)</h4>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm pl-4">
                                                <li className="list-disc">Valid Passport Copy (clear, current, 6+ months validity)</li>
                                                <li className="list-disc">UAE Residency Visa Copy (if applicable)</li>
                                                <li className="list-disc">Emirates ID Copy</li>
                                                <li className="list-disc">UAE Address</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary mb-3 border-l-4 border-[#C5A365] pl-3">B. For Individual Buyers (Non-Residents)</h4>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm pl-4">
                                                <li className="list-disc">Valid Passport and National ID/Driving License Copy</li>
                                                <li className="list-disc">Address in Home Country</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary mb-3 border-l-4 border-[#C5A365] pl-3">C. For Corporate Buyers (Companies & Trusts)</h4>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm pl-4">
                                                <li className="list-disc">Trade License Copy (if UAE-registered)</li>
                                                <li className="list-disc">Certificate of Incorporation (for foreign companies)</li>
                                                <li className="list-disc">Board Resolution to Purchase Property</li>
                                                <li className="list-disc">Memorandum & Articles of Association</li>
                                                <li className="list-disc">Passport Copies of Shareholders/Directors</li>
                                                <li className="list-disc">POA Authorizing a Representative</li>
                                                <li className="list-disc">All Documents Attested (for foreign companies)</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary mb-3 border-l-4 border-[#C5A365] pl-3">D. Additional Documents for Mortgage</h4>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm pl-4">
                                                <li className="list-disc">Salary Certificate or Employment Letter</li>
                                                <li className="list-disc">Bank Statements (last 6 months)</li>
                                                <li className="list-disc">Payslips (last 3 months)</li>
                                                <li className="list-disc">Credit Report (local or international)</li>
                                                <li className="list-disc">Property Valuation Report</li>
                                                <li className="list-disc">Signed Mortgage Offer Letter</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            }
                        ].map((item, i) => (
                            <details key={i} className="group border border-gray-100 rounded-lg bg-gray-50/50 open:bg-white open:shadow-md transition-all duration-300">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <h3 className="font-display font-bold text-lg text-secondary group-hover:text-[#C5A365] transition-colors">{item.title}</h3>
                                    <span className="text-gray-400 group-hover:text-[#C5A365] transition-colors">
                                        <ChevronDown size={20} className="group-open:hidden" />
                                        <ChevronUp size={20} className="hidden group-open:block" />
                                    </span>
                                </summary>
                                <div className="px-6 pb-6 pt-0 text-gray-600 text-sm leading-relaxed border-t border-transparent group-open:border-gray-100 animate-in fade-in slide-in-from-top-1">
                                    <div className="pt-4">
                                        {item.content}
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onApplyFilters={handleApplyFilters}
            />

        </div>
    );
}

export default function Properties() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-[120px]">
                <div className="text-center">
                    <div className="text-secondary text-lg md:text-xl font-semibold">Loading...</div>
                </div>
            </div>
        }>
            <PropertiesContent />
        </Suspense>
    );
}