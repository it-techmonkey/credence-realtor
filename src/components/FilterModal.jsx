'use client'

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DEVELOPERS } from '@/utils/developerMapping';

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters }) => {
    const [localFilters, setLocalFilters] = useState(filters || {});

    // Sync localFilters when filters prop changes (e.g., when modal opens with new filters)
    React.useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters || {});
        }
    }, [filters, isOpen]);

    if (!isOpen) return null;

    const handleApply = (e) => {
        e?.preventDefault?.();
        onApplyFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {};
        setLocalFilters(resetFilters);
        onApplyFilters(resetFilters);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-secondary">Filter Properties</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Filter Content */}
                <div className="p-6 space-y-6">
                    {/* Developer */}
                    <div>
                        <label className="block text-sm font-semibold text-secondary mb-3">
                            Developer
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {(() => {
                                const top10DeveloperIds = [6, 442, 89, 988, 64, 335, 510, 55, 69, 536, 75];
                                const top10Developers = top10DeveloperIds
                                    .map(id => DEVELOPERS.find(d => d.id === id))
                                    .filter(Boolean);
                                return top10Developers.map((dev) => {
                                    const developerName = dev.name.toUpperCase();
                                    return (
                                        <button
                                            key={dev.id}
                                            onClick={() => {
                                                setLocalFilters(prev => ({
                                                    ...prev,
                                                    developer: prev.developer === developerName ? undefined : developerName
                                                }));
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                                localFilters.developer === developerName
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {developerName}
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Unit Type (Apartment / Villa) */}
                    <div>
                        <label className="block text-sm font-semibold text-secondary mb-3">
                            Unit Type
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {['Apartment', 'Villa'].map((unitType) => (
                                <button
                                    key={unitType}
                                    onClick={() => {
                                        setLocalFilters(prev => ({
                                            ...prev,
                                            unitType: prev.unitType === unitType ? undefined : unitType
                                        }));
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        localFilters.unitType === unitType
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {unitType}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-semibold text-secondary mb-3">
                            Price Range (AED)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={localFilters.minPrice !== undefined ? localFilters.minPrice : ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLocalFilters(prev => ({
                                            ...prev,
                                            minPrice: value && !isNaN(parseInt(value)) && parseInt(value) > 0 ? parseInt(value) : undefined
                                        }));
                                    }}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={localFilters.maxPrice !== undefined ? localFilters.maxPrice : ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLocalFilters(prev => ({
                                            ...prev,
                                            maxPrice: value && !isNaN(parseInt(value)) && parseInt(value) > 0 ? parseInt(value) : undefined
                                        }));
                                    }}
                                    placeholder="No limit"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 gap-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Reset Filters
                    </button>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            className="px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
