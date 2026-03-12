'use client'

import React, { useState } from 'react';
import { Menu, X, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEVELOPERS } from '@/utils/developerMapping';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null); // For Desktop
    const [expandedMobileItem, setExpandedMobileItem] = useState(null); // For Mobile
    const pathname = usePathname();

    // Navigation Items with Sub-links (mirrored from Footer)
    const navItems = [
        {
            name: "Properties",
            path: "/properties",
            subItems: [
                { name: "Off-Plan Properties", path: "/properties?category=Off-Plan" },
                { name: "Affordable Properties", path: "/properties?category=Affordable" },
                { name: "Luxury Residences", path: "/properties?category=Luxury" },
                { name: "Commercial Properties", path: "/properties?category=Commercial" },
                { name: "Office", path: "/properties?category=Office" },
                { name: "Waterfront Properties", path: "/properties?category=Waterfront" },
                { name: "Featured Listings", path: "/properties" },
                { name: "Why Buy in Dubai", path: "/blogs#market" },
                { name: "Property FAQs", path: "/guide#faqs" }
            ]
        },
        {
            name: "Developers",
            path: "/developers",
            subItems: (() => {
                const top10DeveloperIds = [6, 442, 89, 988, 64, 335, 510, 55, 69, 536, 75];
                const top10Developers = top10DeveloperIds
                    .map(id => DEVELOPERS.find(d => d.id === id))
                    .filter(Boolean);
                return top10Developers.map(d => ({
                    name: d.name,
                    path: `/properties?developer=${encodeURIComponent(d.name.toUpperCase())}`
                }));
            })()
        },
        {
            name: "Services",
            path: "/services",
            subItems: [
                { name: "Free Consultation", path: "/services" },
                { name: "Buy Property", path: "/services" },
                { name: "Sell Property", path: "/services#selling" },
                { name: "Leasing Services", path: "/services#leasing" },
                { name: "Mortgage Assistance", path: "/services#mortgage" },
                { name: "Golden Visa", path: "/services#golden-visa" },
                { name: "Crypto Property", path: "/services#crypto" }
            ]
        },
        {
            name: "Blogs",
            path: "/blogs",
            subItems: [
                { name: "Why Invest in Dubai", path: "/blogs#market" },
                { name: "Dubai Area Guide", path: "/blogs#areas" },
                { name: "Premium Locations", path: "/blogs#areas" },
                { name: "Waterfront Communities", path: "/blogs#areas" },
                { name: "Family-Friendly Areas", path: "/blogs#areas" },
                { name: "High-ROI Areas", path: "/blogs#areas" },
                { name: "Buyer's Guide", path: "/guide" },
                { name: "Dubai Property FAQs", path: "/guide#faqs" }
            ]
        },
        {
            name: "Guide",
            path: "/guide",
            subItems: [
                { name: "Step-by-Step Guide", path: "/guide#steps" },
                { name: "Before buying", path: "/guide#preparation" },
                { name: "Finding Your Fit", path: "/guide#types" },
                { name: "FAQs", path: "/guide#faqs" }
            ]
        },
        {
            name: "Our Team",
            path: "/team"
        },
        {
            name: "About Us",
            path: "/about",
            subItems: [
                { name: "Who We Are", path: "/about#who-we-are" },
                { name: "Our Mission & Vision", path: "/about#mission" },
                { name: "Why Choose Credence", path: "/about#choose-us" },
                { name: "Achievements", path: "/about#achievements" },
                { name: "FAQs", path: "/about#faqs" },
                { name: "Client Testimonials", path: "/about#testimonials" }
            ]
        }
    ];

    const toggleMobileSubmenu = (name) => {
        if (expandedMobileItem === name) {
            setExpandedMobileItem(null);
        } else {
            setExpandedMobileItem(name);
        }
    };

    return (
        <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 animate-fade-in-down">
            <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center h-14">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center">
                            <img src="/logo.png" alt="Credence Realtor" className="h-9 w-auto" />
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <div
                                key={item.name}
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown(item.name)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <Link
                                    href={item.path}
                                    className={`flex items-center gap-0.5 text-xs uppercase tracking-wider font-medium transition-colors py-4 px-2 ${pathname === item.path || pathname.startsWith(item.path + '/')
                                        ? 'text-primary'
                                        : 'text-gray-300 group-hover:text-primary'
                                        }`}
                                >
                                    {item.name}
                                    {item.subItems && (
                                        <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                                    )}
                                </Link>

                                {/* Dropdown */}
                                {item.subItems && (
                                    <div
                                        className={`absolute left-0 top-full w-56 bg-black border border-white/10 shadow-xl rounded-b-md overflow-hidden transition-all duration-300 origin-top ${activeDropdown === item.name
                                            ? 'opacity-100 scale-y-100 visible'
                                            : 'opacity-0 scale-y-0 invisible'
                                            }`}
                                    >
                                        <div className="py-1">
                                            {item.subItems.map((subItem, index) => (
                                                <Link
                                                    key={index}
                                                    href={subItem.path}
                                                    className="block px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Contact / Right Side */}
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="flex items-center text-white text-xs font-medium">
                            <Phone size={14} className="text-primary mr-1.5 shrink-0" />
                            +971 58 891 9223
                        </div>
                        <a
                            href="https://wa.me/971588919223"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-full transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <MessageCircle size={16} />
                            WhatsApp
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-primary focus:outline-none p-1">
                            {isOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden bg-black border-t border-white/10 overflow-hidden transition-all duration-300 max-h-[85vh] overflow-y-auto">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        {navItems.map((item, index) => (
                            <div
                                key={item.name}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <Link
                                            href={item.path}
                                            onClick={() => !item.subItems && setIsOpen(false)}
                                            className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${pathname === item.path
                                                ? 'text-primary bg-white/5'
                                                : 'text-gray-300 hover:text-primary hover:bg-white/5'
                                                }`}
                                        >
                                            {item.name}
                                        </Link>
                                        {item.subItems && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleMobileSubmenu(item.name);
                                                }}
                                                className="p-2 text-gray-400 hover:text-white"
                                            >
                                                <ChevronDown size={16} className={`transition-transform duration-300 ${expandedMobileItem === item.name ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Mobile Submenu */}
                                    {item.subItems && expandedMobileItem === item.name && (
                                        <div className="bg-white/5 rounded-md mx-3 mb-2 overflow-hidden">
                                            {item.subItems.map((subItem, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={subItem.path}
                                                    onClick={() => setIsOpen(false)}
                                                    className="block px-4 py-2 text-xs text-gray-400 hover:text-white border-l-2 border-transparent hover:border-primary transition-colors"
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="pt-3 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-center text-white px-3 text-xs font-medium">
                                <Phone size={14} className="text-primary mr-2" />
                                +971 58 891 9223
                            </div>
                            <a href="https://wa.me/971588919223" className="block w-full text-center bg-green-600 text-white font-bold py-2.5 px-4 rounded-full text-sm transition-colors hover:bg-green-700">
                                WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
