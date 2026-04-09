import React, { useState, useEffect } from 'react';
import { X, ArrowRight, BedDouble, Bath, MapPin, Check } from 'lucide-react';
import Link from 'next/link';
import { getPaginatedProperties, formatPrice } from '@/lib/properties';

const AreaDetailsModal = ({ isOpen, onClose, area }) => {
    const [areaProperties, setAreaProperties] = useState([]);
    const [isLoadingProperties, setIsLoadingProperties] = useState(false);

    useEffect(() => {
        if (isOpen && area) {
            const loadAreaProperties = async () => {
                setIsLoadingProperties(true);
                try {
                    // Fetch properties for this area using locality filter
                    const result = await getPaginatedProperties(
                        { locality: area.name },
                        1,
                        6 // Limit to 6 properties for the modal
                    );
                    setAreaProperties(result.properties || []);
                } catch (error) {
                    console.error('Error loading area properties:', error);
                    setAreaProperties([]);
                } finally {
                    setIsLoadingProperties(false);
                }
            };

            loadAreaProperties();
        } else {
            setAreaProperties([]);
        }
    }, [isOpen, area]);

    if (!isOpen || !area) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl md:rounded-3xl w-full max-w-[95%] md:max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Fixed Close Button (Mobile Friendly) */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-[60] bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/20 sm:top-6 sm:right-6"
                    aria-label="Close"
                >
                    <X size={20} className="md:w-6 md:h-6" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1">
                    {/* Hero Section */}
                    <div className="relative h-[250px] md:h-[400px]">
                        <img
                            src={area.img}
                            alt={area.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 md:p-12 text-white">
                            <span className="bg-[#C5A365] text-black px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-4 inline-block">
                                Premium Community
                            </span>
                            <h2 className="text-2xl md:text-6xl font-display mb-2 md:mb-4">{area.name}</h2>
                            <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-base opacity-90">
                                <span className="flex items-center gap-1 md:gap-2"><Check size={14} className="md:w-[18px] md:h-[18px] text-[#C5A365]" /> {area.roi}</span>
                                <span className="flex items-center gap-1 md:gap-2"><Check size={14} className="md:w-[18px] md:h-[18px] text-[#C5A365]" /> Starting from {area.price}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-12 space-y-8 md:space-y-12">

                        {/* Main Content: Info & Properties */}
                        <div className="space-y-8 md:space-y-12">

                            {/* Area Information */}
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-secondary mb-4 md:mb-6">About {area.name}</h3>
                                <div className="prose prose-sm md:prose-lg text-gray-500 max-w-none space-y-6 md:space-y-8">
                                    {area.details ? (
                                        <>
                                            <div>
                                                <h4 className="font-bold text-black text-base md:text-lg mb-1 md:mb-2">Overview</h4>
                                                <p className="leading-relaxed">{area.details.overview}</p>
                                            </div>
                                            {area.details.lifestyle && (
                                                <div>
                                                    <h4 className="font-bold text-black text-base md:text-lg mb-1 md:mb-2">Lifestyle Trends</h4>
                                                    <p className="leading-relaxed">{area.details.lifestyle}</p>
                                                </div>
                                            )}
                                            {area.details.facilities && (
                                                <div>
                                                    <h4 className="font-bold text-black text-base md:text-lg mb-1 md:mb-2">Facilities</h4>
                                                    <p className="leading-relaxed">{area.details.facilities}</p>
                                                </div>
                                            )}
                                            {area.details.investment && (
                                                <div>
                                                    <h4 className="font-bold text-black text-base md:text-lg mb-1 md:mb-2">Investment Insight</h4>
                                                    <p className="leading-relaxed">{area.details.investment}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="leading-relaxed">
                                            {area.desc} This area is one of Dubai's prime locations, offering a unique blend of luxury and convenience.
                                            Contact us for more detailed information about investment opportunities in {area.name}.
                                        </p>
                                    )}
                                </div>

                                <h4 className="font-bold text-secondary mt-6 md:mt-8 mb-3 md:mb-4">Key Highlights</h4>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {area.features.map((feature, idx) => (
                                        <span key={idx} className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs md:text-sm font-medium text-gray-600">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Dummy Properties List */}
                            <div>
                                <div className="flex items-center justify-between mb-6 md:mb-8">
                                    <h3 className="text-xl md:text-2xl font-bold text-secondary">Available Properties</h3>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            // Dispatch custom event to apply area filter
                                            window.dispatchEvent(new CustomEvent('applyAreaFilter', { detail: { locality: area.name } }));
                                        }}
                                        className="text-[#C5A365] font-bold text-xs md:text-sm flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
                                    >
                                        View All <ArrowRight size={14} className="md:w-4 md:h-4" />
                                    </button>
                                </div>

                                {isLoadingProperties ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                                                <div className="h-40 md:h-48 bg-gray-200"></div>
                                                <div className="p-4 md:p-5">
                                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : areaProperties.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        {areaProperties.map(property => (
                                            <Link
                                                key={property.id}
                                                href={`/properties/${property.id}`}
                                                onClick={onClose}
                                                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="relative h-40 md:h-48 overflow-hidden">
                                                    <img
                                                        src={property.mainImage || "/assets/villa.png"}
                                                        alt={property.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-0.5 md:px-3 md:py-1 rounded backdrop-blur-sm">
                                                        {property.type || 'Property'}
                                                    </span>
                                                </div>
                                                <div className="p-4 md:p-5">
                                                    <h4 className="font-bold text-secondary mb-1 truncate text-sm md:text-base">{property.title}</h4>
                                                    <p className="text-[#C5A365] font-bold text-base md:text-lg mb-3 md:mb-4">
                                                        AED {formatPrice(property.price)}
                                                    </p>

                                                    <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 border-t border-gray-50 pt-3">
                                                        {property.bedrooms && (
                                                            <div className="flex items-center gap-1">
                                                                <BedDouble size={14} /> {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                                                            </div>
                                                        )}
                                                        {property.bathrooms && (
                                                            <div className="flex items-center gap-1">
                                                                <Bath size={14} /> {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No properties available in {area.name} at the moment.</p>
                                        <Link
                                            href="/properties"
                                            onClick={onClose}
                                            className="text-[#C5A365] font-bold text-sm mt-2 inline-block hover:underline"
                                        >
                                            Browse all properties
                                        </Link>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AreaDetailsModal;
