'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Bed, Bath, Square, MapPin, Phone, MessageCircle, Building2, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/properties';
import InquiryModal from '@/components/property/inquiry-modal';
import { useScrollAnimation } from '@/utils/useScrollAnimation';

const PropertyCard = ({ property, index = 0 }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div
                className="stagger-item bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 hover-lift"
            >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={property.mainImage || property.image || 'https://via.placeholder.com/800x600?text=No+Image'}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider ${property.type === 'Off-Plan' ? 'bg-[#C5A365]' : 'bg-[#00DDAA]'
                        }`}>
                        {property.type}
                    </div>

                    {/* Top Right Badge (Bedroom count or visual tag) */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                        {property.category === 'Commercial' ? 'Office' : (property.bedrooms ? `${property.bedrooms} Bedroom` : property.category)}
                    </div>

                    {/* Price Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-16">
                        <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 font-medium">Starting From</p>
                        <p className="text-white text-2xl font-display font-bold tracking-tight">
                            AED {typeof property.price === 'number' ? formatPrice(property.price) : property.price}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-secondary mb-2 truncate">{property.title}</h3>

                    {/* Developer Name styling */}
                    <div className="flex items-center text-xs text-gray-500 mb-4 uppercase tracking-wider font-semibold">
                        <Building2 size={12} className="mr-1.5 text-gray-400" />
                        {property.developer || "Developer"}
                    </div>


                    <div className="flex items-center text-gray-500 mb-5 text-sm">
                        <MapPin size={14} className="mr-1.5 text-[#C5A365]" />
                        {property.location}
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 border-t border-gray-100 pt-4 mb-5 text-sm text-gray-600">
                        {property.bedrooms !== undefined && property.bedrooms > 0 && (
                            <div className="flex items-center">
                                <Bed size={16} className="mr-1.5 text-gray-400" />
                                <span className="font-medium text-secondary mr-1">{property.bedrooms}</span> BR
                            </div>
                        )}
                        {property.area !== undefined && property.area > 0 && (
                            <div className="flex items-center">
                                <Square size={16} className="mr-1.5 text-gray-400" />
                                <span className="font-medium text-secondary mr-1">
                                    {property.areaMax && property.areaMax > property.area 
                                        ? `${property.area.toLocaleString('en-US')} - ${property.areaMax.toLocaleString('en-US')}`
                                        : property.area.toLocaleString('en-US')}
                                </span> sqft
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        {((property.slug ?? property.id) != null ? (
                            <Link href={`/properties/${encodeURIComponent(String(property.slug ?? property.id))}`} className="flex-1 border border-gray-200 text-secondary py-3 rounded-full hover:bg-black hover:text-white hover:border-black transition-all text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center">
                                View Details
                            </Link>
                        ) : (
                            <span className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-full text-center text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                                View Details
                            </span>
                        ))}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 bg-[#C5A365] text-white py-3 rounded-full hover:bg-[#b08e55] transition-colors text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            Enquire Now <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Inquiry Modal */}
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
