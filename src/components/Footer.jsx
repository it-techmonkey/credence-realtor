'use client'

import React from 'react';
import Link from 'next/link';
import {
    Home,
    Instagram,
    Linkedin,
    Facebook,
    Phone,
    Mail,
    MapPin,
    ArrowRight,
    MessageCircle
} from 'lucide-react';
import { DEVELOPERS } from '@/utils/developerMapping';

const Footer = () => {
    const handleLanguageChange = (langCode) => {
        // Clear existing cookies to avoid conflicts
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;

        // Set the google translate cookie
        document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=/auto/${langCode}; path=/;`; // Fallback for localhost

        // Reload to apply changes
        window.location.reload();
    };

    const languages = [
        { name: "English", code: "en" },
        { name: "عربي", code: "ar" },
        { name: "Русский", code: "ru" },
        { name: "Deutsch", code: "de" },
        { name: "Español", code: "es" },
        { name: "Italiano", code: "it" },
        { name: "Português", code: "pt" },
        { name: "Français", code: "fr" }
    ];

    return (
        <footer className="font-sans">

            {/* 1. CTA Banner (Top Section) */}
            <section className="py-24 bg-black relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-block px-6 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
                        <span className="text-primary text-xs font-bold uppercase tracking-widest">Start Your Journey</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-display text-white mb-6 leading-tight">
                        Ready to Invest in <br />
                        <span className="text-primary">Dubai Real Estate?</span>
                    </h2>

                    <p className="text-gray-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                        Book a free consultation with our experts. Get personalized recommendations based on your investment goals.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                        <Link href="/properties" className="bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm hover:bg-[#C5A365] hover:text-white transition-all flex items-center justify-center gap-2">
                            Get Property Options <ArrowRight size={16} />
                        </Link>
                        <a href="https://wa.me/971588919223" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-green-600 hover:border-green-600 border border-white/30 backdrop-blur text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
                            <MessageCircle size={20} />
                            WhatsApp Now
                        </a>
                    </div>

                    <a
                        href="tel:+971588919223"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
                    >
                        <Phone size={18} />
                        <span>+971 58 891 9223</span>
                    </a>
                </div>
            </section>

            {/* 2. Main Footer (Bottom Section) */}
            <section className="bg-black py-16 text-white border-t border-white/5">
                <div className="container mx-auto px-4 md:px-6 lg:pr-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 lg:gap-2">

                        {/* Column 1: Company Info & Logo */}
                        <div className="col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-2 mb-6 text-white">
                                <img src="/logo.png" alt="Credence Realtor" className="w-[180px] h-auto object-contain" />
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                Your trusted partner for premium real estate investments.<br />
                                Serving international investors since 2010.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.instagram.com/credencerealtor_?igsh=eHB3OG40cG45aWVm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-white transition-colors duration-300"
                                >
                                    <Instagram size={18} />
                                </a>
                                <a
                                    href="https://www.facebook.com/share/16qGYEAyiB/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-white transition-colors duration-300"
                                >
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Column 2: Properties */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">Properties</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Off-Plan Properties", path: "/properties" },
                                    { name: "Affordable Properties", path: "/properties" },
                                    { name: "Luxury Residences", path: "/properties" },
                                    { name: "Commercial Properties", path: "/properties?search=Commercial" },
                                    { name: "Waterfront Properties", path: "/properties" },
                                    { name: "Featured Listings", path: "/properties" },
                                    { name: "Why Buy in Dubai", path: "/blogs#market" },
                                    { name: "Property FAQs", path: "/guide#faqs" }
                                ].map((item, i) => (
                                    <li key={i}>
                                        <Link href={item.path} className="text-sm text-gray-400 hover:text-primary transition-colors duration-300 block">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3: Developers */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">Developers</h3>
                            <ul className="space-y-3">
                                {(() => {
                                    const top10DeveloperIds = [6, 442, 89, 988, 64, 335, 510, 55, 69, 536];
                                    const top10Developers = top10DeveloperIds
                                        .map(id => DEVELOPERS.find(d => d.id === id))
                                        .filter(Boolean);
                                    return top10Developers.map((dev, i) => (
                                        <li key={i}>
                                            <Link href={`/properties?developer=${encodeURIComponent(dev.name.toUpperCase())}`} className="text-sm text-gray-400 hover:text-primary transition-colors duration-300 block">
                                                {dev.name}
                                            </Link>
                                        </li>
                                    ));
                                })()}
                            </ul>
                        </div>

                        {/* Column 3: Services */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">Services</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Free Consultation", path: "/services" },
                                    { name: "Buy Property", path: "/services" },
                                    { name: "Sell Property", path: "/services#selling" },
                                    { name: "Leasing Services", path: "/services#leasing" },
                                    { name: "Mortgage Assistance", path: "/services#mortgage" },
                                    { name: "Golden Visa", path: "/services#golden-visa" },
                                    { name: "Crypto Property", path: "/services#crypto" }
                                ].map((item, i) => (
                                    <li key={i}>
                                        <Link href={item.path} className="text-sm text-gray-400 hover:text-primary transition-colors duration-300 block">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4: Blogs */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">Blogs</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Why Invest in Dubai", path: "/blogs#market" },
                                    { name: "Dubai Area Guide", path: "/blogs#areas" },
                                    { name: "Premium Locations", path: "/blogs#areas" },
                                    { name: "Waterfront Communities", path: "/blogs#areas" },
                                    { name: "Family-Friendly Areas", path: "/blogs#areas" },
                                    { name: "High-ROI Areas", path: "/blogs#areas" },
                                    { name: "Buyer's Guide", path: "/guide" },
                                    { name: "Dubai Property FAQs", path: "/guide#faqs" }
                                ].map((item, i) => (
                                    <li key={i}>
                                        <Link href={item.path} className="text-sm text-gray-400 hover:text-primary transition-colors duration-300 block">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 5: Guide */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">Guide</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Step-by-Step Guide", path: "/guide#steps" },
                                    { name: "Before buying", path: "/guide#preparation" },
                                    { name: "Finding Your Fit", path: "/guide#types" },
                                    { name: "FAQs", path: "/guide#faqs" }
                                ].map((item, i) => (
                                    <li key={i}>
                                        <Link href={item.path} className="text-sm text-gray-400 hover:text-primary transition-colors duration-300 block">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 6: About us */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">About us</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Who We Are", path: "/about#who-we-are" },
                                    { name: "Our Mission & Vision", path: "/about#mission" },
                                    { name: "Why Choose Credence", path: "/about#choose-us" },
                                    { name: "Our Team", path: "/about#team" },
                                    { name: "Achievements", path: "/about#achievements" },
                                    { name: "FAQs", path: "/about#faqs" },
                                    { name: "Client Testimonials", path: "/about#testimonials" }
                                ].map((item, i) => (
                                    <li key={i}>
                                        <Link href={item.path} className="text-sm text-gray-400 hover:text-primary transition-colors duration-300 block">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 7: Contact Us */}
                        <div>
                            <h3 className="font-semibold text-white mb-6">Contact Us</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-xs text-gray-400 break-words">
                                    <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                                    <span>ADDRESS: 4601, ASPIN COMMERCIAL TOWER, SHEIKH ZAYED ROAD, TRADE CENTER ONE. DUBAI. UAE</span>
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-400 break-words">
                                    <Phone size={16} className="text-primary shrink-0" />
                                    <span>+971 58 891 9223</span>
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-400 break-words">
                                    <Mail size={16} className="text-primary shrink-0" />
                                    <span>For career enquiries:<br></br> career@credencerealtor.com</span>
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-400 break-words">
                                    <Mail size={16} className="text-primary shrink-0" />
                                    <span>For general enquiries:<br></br> info@credencerealtor.com</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </section>

            {/* 3. Bottom Bar */}
            <div className="bg-[#050505] border-t border-white/5 py-8">
                <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Language Selector */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        {languages.map((lang, i) => (
                            <button
                                key={i}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`text-xs ${i === 0 ? 'text-white font-medium' : 'text-gray-500'} hover:text-primary transition-colors bg-transparent border-0 cursor-pointer`}
                            >
                                {lang.name}
                            </button>
                        ))}
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-gray-600 text-center md:text-right">
                        &copy; 2025 Credence Realtor. All rights reserved. <span className="mx-2">|</span> Licensed by RERA Dubai
                        <span className="mx-2">|</span>
                        <Link href="/admin/login" className="text-gray-500 hover:text-primary transition-colors">Admin</Link>
                    </p>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
