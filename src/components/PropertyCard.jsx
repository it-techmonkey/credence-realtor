'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Square, MapPin, Building2, ArrowRight } from 'lucide-react';
import { getUnitTypeLabelsFromBedrooms } from '@/lib/properties';
import InquiryModal from '@/components/property/inquiry-modal';
import { useScrollAnimation } from '@/utils/useScrollAnimation';

const PropertyCard = ({ property, index = 0 }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const unitLabels = getUnitTypeLabelsFromBedrooms(property.bedrooms);
    const unitDisplay = unitLabels.length > 0 ? unitLabels.join(' · ') : (property.category === 'Office' || property.category === 'Commercial' ? property.category : '');

    return (
        <>
            <div
                className="stagger-item bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100"
            >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                    <img
                        src={property.mainImage || property.image || 'https://via.placeholder.com/800x600?text=No+Image'}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white ${property.type === 'Off-Plan' ? 'bg-[#C5A365]' : 'bg-emerald-600'}`}>
                            {property.type}
                        </span>
                        {unitDisplay && (
                            <span className="bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                                {unitDisplay}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{property.title}</h3>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
                        <Building2 size={11} className="text-gray-400 shrink-0" />
                        {property.developer || 'Developer'}
                    </p>
                    {property.location && (
                        <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                            <MapPin size={12} className="text-[#C5A365] shrink-0" />
                            <span className="truncate">{property.location}</span>
                        </p>
                    )}

                    {/* Features: area only */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-gray-600">
                        {property.area !== undefined && property.area > 0 && (
                            <span className="flex items-center gap-1 text-gray-500">
                                <Square size={12} className="text-gray-400 shrink-0" />
                                {property.areaMax && property.areaMax > property.area
                                    ? `${property.area.toLocaleString('en-US')} – ${property.areaMax.toLocaleString('en-US')} sqft`
                                    : `${property.area.toLocaleString('en-US')} sqft`}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-col gap-1.5">
                        {(property.slug ?? property.id) != null ? (
                            <Link
                                href={`/properties/${encodeURIComponent(String(property.slug ?? property.id))}`}
                                className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-800 font-semibold text-xs text-center hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            >
                                View Details
                            </Link>
                        ) : (
                            <span className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-400 font-semibold text-xs text-center cursor-not-allowed">
                                View Details
                            </span>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-2.5 rounded-lg bg-[#C5A365] text-white font-semibold text-xs hover:bg-[#b08e55] transition-colors flex items-center justify-center gap-1.5"
                        >
                            Enquire Now <ArrowRight size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            <InquiryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                propertyId={property.id}
                propertyTitle={property.title}
            />
        </>
    );
};

export default PropertyCard;
