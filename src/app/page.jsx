'use client'

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, MapPin, ChevronDown, ChevronUp, Star, Phone, MessageCircle, Percent, TrendingUp, Award, ShieldCheck, Users, Building2, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/properties';
import Hotspots from '@/components/Hotspots';
import { openWhatsApp } from '@/utils/whatsappRedirect';
import { useScrollAnimations } from '@/utils/useScrollAnimation';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedContainer from '@/components/AnimatedContainer';
import AnimatedItem from '@/components/AnimatedItem';
import { DEVELOPERS } from '@/utils/developerMapping';
import recentLaunchesData from '@/data/recent-launches.json';
import topPicksData from '@/data/top-picks.json';

const HomeContent = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [recentLaunches, setRecentLaunches] = useState(recentLaunchesData);
    const [topPicks, setTopPicks] = useState(topPicksData);
    const [isLoadingProperties, setIsLoadingProperties] = useState(false);
    
    // Initialize scroll animations
    useScrollAnimations();
    const [contactFormData, setContactFormData] = useState({
        name: '',
        countryCode: '+971',
        phone: '',
        email: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
    });

    const COUNTRY_CODES = [
        { code: '+971', country: 'UAE', flag: '🇦🇪' },
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+1', country: 'USA', flag: '🇺🇸' },
        { code: '+44', country: 'UK', flag: '🇬🇧' },
        { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
        { code: '+974', country: 'Qatar', flag: '🇶🇦' },
        { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
        { code: '+968', country: 'Oman', flag: '🇴🇲' },
        { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    ];

    // Generate time slots in 30-minute intervals
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const hourStr = hour.toString().padStart(2, '0');
                const minuteStr = minute.toString().padStart(2, '0');
                const time24 = `${hourStr}:${minuteStr}`;

                // Convert to 12-hour format for display
                const period = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                const time12 = `${hour12}:${minuteStr} ${period}`;

                slots.push({ value: time24, label: time12 });
            }
        }
        return slots;
    };

    const TIME_SLOTS = generateTimeSlots();

    const WHATSAPP_NUMBER = '971588919223';

    useEffect(() => {
        const hash = window.location.hash || searchParams?.get('hash');
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [searchParams]);

    // Recent launches and top picks are loaded from static JSON (src/data/recent-launches.json, top-picks.json)
    // Stats
    const stats = [
        { value: "3000+", label: "Properties Sold" },
        { value: "15+", label: "Years Experience" },
        { value: "30+", label: "Countries Served" },
    ];

    // Benefits
    const benefits = [
        { title: "Zero Property Tax", description: "No annual property taxes or capital gains tax on your real estate investments", icon: <Percent size={24} /> },
        { title: "High Rental Yields", description: "Average rental returns of 6-10% annually, among the highest globally", icon: <TrendingUp size={24} /> },
        { title: "Golden Visa Eligibility", description: "Qualify for a 10-year UAE Golden Visa with property investment from AED 2M", icon: <Award size={24} /> },
        { title: "Regulated & Secure", description: "Escrow accounts and RERA regulations protect your investment", icon: <ShieldCheck size={24} /> },
    ];


    const categories = [
        {
            name: "Waterfront Communities",
            desc: "Beachfront living with stunning sea views",
            filterType: 'category',
            filterValue: 'Waterfront',
            image: "/assets/villa.png"
        },
        {
            name: "Off-Plan Properties",
            desc: "Early-bird prices with flexible payment plans",
            filterType: 'type',
            filterValue: 'Off-Plan',
            image: "/assets/villa.png"
        },
        {
            name: "Affordable Communities",
            desc: "Smart investments with high rental yields",
            filterType: 'category',
            filterValue: 'Affordable',
            image: "/assets/villa.png"
        },
        {
            name: "Luxury Branded Residences",
            desc: "World-class brands and premium finishes",
            filterType: 'category',
            filterValue: 'Luxury',
            image: "/assets/villa.png"
        },
    ];

    // Top 10 developers from mapping
    const top10DeveloperIds = [6, 442, 89, 988, 64, 335, 510, 55, 69, 536];
    const top10Developers = top10DeveloperIds
        .map(id => DEVELOPERS.find(d => d.id === id))
        .filter(Boolean);
    
    const developers = top10Developers.map(d => d.name.toUpperCase());
    const developerLogos = top10Developers.map(d => ({
        name: d.name.toUpperCase(),
        img: d.logo || ''
    }));

    const filterOptions = [
        { name: "All", color: "bg-gray-400" },
        { name: "EMAAR", color: "bg-teal-500" },
        { name: "DAMAC", color: "bg-red-500" },
        { name: "SOBHA", color: "bg-blue-800" },
        { name: "MERAAS", color: "bg-gray-800" },
        { name: "AZIZI", color: "bg-yellow-600" },
        { name: "NAKHEEL", color: "bg-blue-400" }
    ];


    const faqs = [
        { q: "Can foreigners own property in Dubai?", a: " Yes, non-residents can buy freehold properties in designated areas of Dubai." },
        { q: "What is a freehold property & Leasehold property?", a: "A freehold property allows full ownership of the unit and land with the right to sell, lease, or pass it on. Leasehold property means you own the unit for a set period (usually up to 99 years), but not the land it’s built on. Ownership reverts to the landowner after the lease expires unless renewed." },
        { q: "Are there any taxes on property purchases?", a: "Dubai has no property tax, but buyers pay a one-time 4% Dubai Land Department (DLD) fee." },
        { q: "What is the minimum investment for buying property in Dubai?", a: "There’s no official minimum, but most off-plan and ready properties start from AED 600,000+." },
        { q: "Can I get residency by investing in Dubai property?", a: "Yes, property buyers can qualify for 2, 5, or 10-year residency visas based on the value of their investment." },
        { q: "What are the benefits of off-plan property investment?", a: "Lower prices, flexible payment plans, and high appreciation potential before handover." },
        { q: "How do I finance a property in Dubai?", a: "Residents and non-residents can apply for mortgages from UAE banks, with up to 80% financing." },
        { q: "How long does the property buying process take?", a: "A ready property can be purchased in 2–4 weeks; off-plan purchases are often quicker with developer contracts." },
        { q: "What documents are needed to buy property?", a: "A valid passport copy, Emirates ID copy (if resident), and Local ID copy (non-Resident) or Driving License copy (non-Resident) are required." },
        { q: "Is it safe to invest in Dubai real estate?", a: "Yes, the market is regulated by RERA and DLD, ensuring transparency, investor protection, and legal support." }
    ];

    // FAQ Component
    const FAQItem = ({ question, answer }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden bg-white">
                <button
                    className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="font-semibold text-secondary">{question}</span>
                    <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        {isOpen ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-gray-400" />}
                    </div>
                </button>
                {isOpen && (
                    <div className="px-6 py-4 bg-gray-50 text-gray-600 text-sm border-t border-gray-100">
                        {answer}
                    </div>
                )}
            </div>
        );
    };

    const [activeTestimonial, setActiveTestimonial] = useState(0);

    const handleContactFormChange = (e) => {
        const { name, value } = e.target;
        setContactFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatTime12Hour = (time24) => {
        if (!time24) return '';
        const [hourStr, minuteStr] = time24.split(':');
        const hour = parseInt(hourStr);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${hour12}:${minuteStr} ${period}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleContactFormSubmit = (e) => {
        e.preventDefault();

        const whatsappData = {
            'Name': contactFormData.name,
            'Phone': `${contactFormData.countryCode} ${contactFormData.phone}`,
            'Email': contactFormData.email,
            'Preferred Date': contactFormData.preferredDate ? formatDate(contactFormData.preferredDate) : 'Not specified',
            'Preferred Time': contactFormData.preferredTime ? formatTime12Hour(contactFormData.preferredTime) : 'Not specified',
            'Message': contactFormData.message
        };

        openWhatsApp(WHATSAPP_NUMBER, whatsappData);

        // Reset form
        setContactFormData({
            name: '',
            countryCode: '+971',
            phone: '',
            email: '',
            preferredDate: '',
            preferredTime: '',
            message: ''
        });
    };

    return (
        <div className="bg-white overflow-hidden font-sans">
            {/* 1. Hero Section */}
            <section className="relative min-h-screen flex items-center pb-20 md:pb-0">
                <div className="absolute inset-0">
                    <img src="/assets/hero-bg.png" alt="Dubai Skyline" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/40" />
                </div>

                <div className="container mx-auto px-4 md:px-6 relative z-10 pt-24 md:pt-34 max-w-7xl">
                    <div className="max-w-3xl">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 animate-fade-in-up">
                            <span className="text-accent text-sm font-bold uppercase tracking-widest">Dubai's Premier Real Estate Partner</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-display text-white mb-6 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Find Your Perfect <br />
                            <span className="text-primary">Property in Dubai</span>
                        </h1>

                        <p className="text-gray-300 text-lg md:text-xl mb-8 md:mb-10 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Discover exceptional investment opportunities with <span className="text-primary">high ROI potential</span>, zero property tax, and access to world-class developments from trusted developers.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-10 md:mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <Link href="/properties" className="bg-white hover:bg-primary text-black hover:text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-white/10 text-center flex items-center justify-center">
                                Get Property Options
                            </Link>
                            <a href="https://wa.me/971588919223" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-green-600 hover:border-green-600 border border-white/30 backdrop-blur text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
                                <MessageCircle size={20} />
                                WhatsApp Now
                            </a>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-t border-white/10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            {stats.map((stat, i) => (
                                <div key={i}>
                                    <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                                    <p className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Why Invest */}
            <AnimatedSection className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Investment Benefits</span>
                        <h2 className="text-4xl font-display font-medium text-secondary mb-6">Why Invest in Dubai</h2>
                        <p className="text-gray-text max-w-2xl mx-auto">
                            Dubai offers unparalleled opportunities for property investors with world-class infrastructure and investor-friendly policies.
                        </p>
                    </div>

                    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {benefits.map((benefit, i) => (
                            <AnimatedItem
                                key={i}
                                className="p-8 border border-gray-100 rounded-2xl bg-white hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover-lift"
                            >
                                <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl mb-6 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-display font-semibold text-secondary mb-3">{benefit.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
                            </AnimatedItem>
                        ))}
                    </AnimatedContainer>
                </div>
            </AnimatedSection>

            {/* 3. Most Recent Launches */}
            <AnimatedSection className="py-24 bg-gray-50">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">New Opportunities</span>
                        <h2 className="text-4xl font-display font-medium text-secondary mb-6">Most Recent Launches</h2>
                        <p className="text-gray-text">Be among the first to access Dubai's newest developments with exclusive launch prices.</p>
                    </div>

                    {isLoadingProperties ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                                    <div className="h-64 bg-gray-200"></div>
                                    <div className="p-5">
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentLaunches.length > 0 ? (
                        <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recentLaunches.map((item) => (
                                <AnimatedItem
                                    key={item.id}
                                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 hover-lift"
                                >
                                    <div className="h-64 relative overflow-hidden">
                                        <img
                                            src={item.mainImage || "/assets/villa.png"}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <p className="text-xs uppercase tracking-wider mb-1 opacity-90">
                                                Developer: {item.developer || 'N/A'}
                                            </p>
                                            <h3 className="text-lg font-bold">{item.title}</h3>
                                            <div className="flex items-center text-xs opacity-80 mt-1">
                                                <MapPin size={12} className="mr-1" /> {item.location}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-4">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Delivery Date</p>
                                                <p className="text-secondary font-semibold text-sm">
                                                    {item.readyDate && String(item.readyDate).trim() ? String(item.readyDate).trim() : 'TBA'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 uppercase">Starting From</p>
                                                <p className="text-primary font-bold text-lg">
                                                    AED {formatPrice(item.price)}
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/properties/${item.id}`}
                                            className="w-full py-2.5 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-black transition-colors block text-center"
                                        >
                                            Inquire
                                        </Link>
                                    </div>
                                </AnimatedItem>
                            ))}
                        </AnimatedContainer>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No recent launches available at the moment.</p>
                        </div>
                    )}
                </div>
            </AnimatedSection>

            {/* 4. Browse Properties (Collections) */}
            {/* <motion.section
                className="py-24 bg-white"
                initial={scrollReveal.initial}
                whileInView={scrollReveal.whileInView}
                viewport={scrollReveal.viewport}
                transition={scrollReveal.transition}
            >
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <motion.div
                        className="text-center mb-16"
                        {...fadeInUp}
                    >
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Browse Properties</span>
                        <h2 className="text-4xl font-display font-medium text-secondary mb-6">Discover Your Ideal Property</h2>
                        <p className="text-gray-text">Explore our curated collections tailored to different investment goals and lifestyles.</p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        {...staggerContainer}
                    >
                        {categories.map((cat, i) => {
                            // Build the URL with appropriate filter
                            const filterParam = cat.filterType === 'type' ? 'type' : 'category';
                            const filterUrl = `/properties?${filterParam}=${encodeURIComponent(cat.filterValue)}`;

                            return (
                                <motion.div
                                    key={i}
                                    variants={staggerItem}
                                    {...hoverLift}
                                >
                                    <Link
                                        href={filterUrl}
                                        className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer block"
                                    >
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                                        <div className="absolute bottom-0 left-0 p-8">
                                            <h3 className="text-2xl font-bold text-white mb-2">{cat.name}</h3>
                                            <p className="text-gray-300 text-sm">{cat.desc}</p>
                                            <div className="mt-4 flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                                                <span className="text-sm font-medium">Explore Properties</span>
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </AnimatedSection> */}

            {/* 5. Explore by Developer */}
            <AnimatedSection className="bg-white pt-20">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    {/* Top Header & Logos */}
                    <div className="text-center mb-12">
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Explore by Developer</span>
                        <h2 className="text-3xl md:text-5xl font-display text-secondary mb-12">Explore Properties by Trusted Developers</h2>

                        <div className="flex flex-wrap justify-center gap-6 mb-16">
                            {developerLogos.map((dev, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        router.push(`/properties?developer=${encodeURIComponent(dev.name)}`);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-48 h-20 border border-secondary/20 rounded-lg flex items-center justify-center p-4 hover:border-[#C5A365] transition-colors bg-white cursor-pointer hover:shadow-md"
                                >
                                    <img
                                        src={dev.img}
                                        alt={dev.name}
                                        className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="bg-white py-16 text-black relative overflow-hidden">
                    <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
                        <Hotspots
                            title="Explore Properties by Area"
                            showTitle={true}
                            showFilters={false}
                            showAreaFilters={false}
                            filterOptions={["All", "Villa", "2 BHK", "3 BHK", "1 BHK"]}
                            className="px-0 py-0"
                        />
                    </div>
                </div>
            </AnimatedSection>

            {/* 6. Handpicked Selection (Dark) */}
            <AnimatedSection className="py-24 bg-secondary text-white">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Handpicked Selection</span>
                        <h2 className="text-4xl font-display font-medium mb-6">Our Top Picks</h2>
                        <p className="text-gray-400">Premium developments personally curated by our experts for exceptional value and lifestyle.</p>
                    </div>

                    {isLoadingProperties ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 animate-pulse">
                                    <div className="h-64 bg-gray-700"></div>
                                    <div className="p-6">
                                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : topPicks.length > 0 ? (
                        <AnimatedContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {topPicks.map((item) => (
                                <AnimatedItem
                                    key={item.id}
                                    className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-colors hover-lift"
                                >
                                    <div className="h-64 relative">
                                        <img
                                            src={item.mainImage || "/assets/villa.png"}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-4 left-4 bg-primary text-black text-xs font-bold px-3 py-1 rounded">Top Pick</div>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-xs text-gray-400 uppercase mb-1">
                                            Developer: {item.developer || 'N/A'}
                                        </p>
                                        <h3 className="text-xl font-bold mb-4">{item.title}</h3>

                                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                            <div>
                                                <span className="block text-gray-500 text-xs">Location</span>
                                                {item.location}
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 text-xs">Handover</span>
                                                {item.readyDate && String(item.readyDate).trim() ? String(item.readyDate).trim() : 'TBA'}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <div>
                                                <span className="block text-gray-500 text-xs">Starting From</span>
                                                <span className="text-primary font-bold text-lg">
                                                    AED {formatPrice(item.price)}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/properties/${item.id}`}
                                                className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-primary transition-colors text-sm"
                                            >
                                                Inquire
                                            </Link>
                                        </div>
                                    </div>
                                </AnimatedItem>
                            ))}
                        </AnimatedContainer>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <p>No top picks available at the moment.</p>
                        </div>
                    )}
                </div>
            </AnimatedSection>

            {/* 7. Market Insights */}
            <AnimatedSection className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                        <div className="lg:w-1/2">
                            <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Market Insights</span>
                            <h2 className="text-4xl lg:text-5xl font-display font-medium text-secondary mb-6 leading-tight">Dubai's Real Estate Momentum</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Dubai's property market continues to set global records, driven by visionary infrastructure, world-class amenities, and investor-friendly policies that attract wealth from every continent.
                            </p>
                            <p className="text-gray-600 mb-10 leading-relaxed">
                                With transparent regulations, escrow protections, and a stable economy backed by diversification beyond oil, Dubai remains one of the safest and most lucrative real estate markets worldwide.
                            </p>

                            {/* Trusted By Section based on image */}
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map(n => (
                                        <div key={n} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200" />
                                    ))}
                                </div>
                                <div>
                                    <p className="font-bold text-secondary text-sm">Trusted by 500+ investors</p>
                                    <p className="text-xs text-gray-500">From 30+ countries worldwide</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full">
                            <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <AnimatedItem
                                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover-lift"
                                >
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-primary mb-6">
                                        <TrendingUp size={20} />
                                    </div>
                                    <h4 className="text-4xl font-bold text-secondary mb-1">27%</h4>
                                    <p className="font-bold text-secondary text-sm mb-1">Property Value Growth</p>
                                    <p className="text-xs text-gray-400">Average annual appreciation</p>
                                </AnimatedItem>
                                <AnimatedItem
                                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover-lift"
                                >
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-primary mb-6">
                                        <Users size={20} />
                                    </div>
                                    <h4 className="text-4xl font-bold text-secondary mb-1">3.5M</h4>
                                    <p className="font-bold text-secondary text-sm mb-1">Population Growth</p>
                                    <p className="text-xs text-gray-400">Expected by 2040</p>
                                </AnimatedItem>
                                <AnimatedItem
                                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover-lift"
                                >
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-primary mb-6">
                                        <Building2 size={20} />
                                    </div>
                                    <h4 className="text-4xl font-bold text-secondary mb-1">$82B</h4>
                                    <p className="font-bold text-secondary text-sm mb-1">Transactions 2023</p>
                                    <p className="text-xs text-gray-400">Record-breaking year</p>
                                </AnimatedItem>
                                <AnimatedItem
                                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover-lift"
                                >
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-primary mb-6">
                                        <Globe size={20} />
                                    </div>
                                    <h4 className="text-4xl font-bold text-secondary mb-1">200+</h4>
                                    <p className="font-bold text-secondary text-sm mb-1">Nationalities</p>
                                    <p className="text-xs text-gray-400">Diverse investor base</p>
                                </AnimatedItem>
                            </AnimatedContainer>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* 7. Testimonials (Slider) */}
            <AnimatedSection className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Testimonials</span>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary">Happy Clients</h2>
                    </div>

                    <div className="max-w-4xl mx-auto relative animate-on-scroll fade-in">
                        {/* Slider Content */}
                        <div
                            className="bg-[#F9F9F9] p-8 md:p-12 rounded-2xl shadow-sm text-center relative overflow-hidden"
                        >
                            {/* Quote Icon */}
                            <div className="text-[#C5A365] text-4xl font-serif mb-6 opacity-80">“</div>

                            {/* Stars */}
                            <div className="flex justify-center mb-6 text-[#C5A365]">
                                {[1, 2, 3, 4, 5].map(n => <Star key={n} size={20} fill="currentColor" />)}
                            </div>

                            {/* Text */}
                            <div className="min-h-[120px] flex items-center justify-center">
                                <h3 className="text-xl md:text-2xl font-serif italic text-secondary leading-relaxed max-w-2xl mx-auto">
                                    "{[
                                        "The team's knowledge of the luxury market is exceptional. They found me a branded residence that exceeded my expectations.",
                                        "Professional, transparent, and incredibly helpful. They guided me through the entire Golden Visa process seamlessy.",
                                        "I was looking for a high-yield investment, and Credence delivered exactly that. Their market insights are top-notch."
                                    ][activeTestimonial]}"
                                </h3>
                            </div>

                            {/* Author */}
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                                    {["E", "M", "S"][activeTestimonial]}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-secondary">
                                        {["Elena Petrova", "Michael Chen", "Sarah Johnson"][activeTestimonial]}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {["Russia • Palm Jumeirah", "UK • Downtown Dubai", "UAE • Dubai Hills"][activeTestimonial]}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Slider Controls */}
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setActiveTestimonial(prev => (prev === 0 ? 2 : prev - 1))}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#C5A365] hover:text-[#C5A365] transition-colors bg-white"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex gap-2">
                                {[0, 1, 2].map(idx => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveTestimonial(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${activeTestimonial === idx ? 'w-8 bg-[#C5A365]' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setActiveTestimonial(prev => (prev === 2 ? 0 : prev + 1))}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#C5A365] hover:text-[#C5A365] transition-colors bg-white"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* 9. FAQ */}
            <AnimatedSection className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Got Questions?</span>
                        <h2 className="text-4xl font-display font-medium text-secondary mb-6">Frequently Asked Questions</h2>
                        <p className="text-gray-text">Everything you need to know about investing in Dubai real estate</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((item, i) => (
                            <FAQItem key={i} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* 10. Contact Us Form */}
            <AnimatedSection id="contact" className="py-24 bg-[#F9F7F2]">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="text-center mb-12">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Get in Touch</span>
                        <h2 className="text-4xl font-display font-medium text-secondary mb-6">Contact Our Experts</h2>
                        <p className="text-gray-text max-w-2xl mx-auto">
                            Ready to start your Dubai real estate journey? Fill out the form below and our team will get back to you shortly.
                        </p>
                    </div>

                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                        <form onSubmit={handleContactFormSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={contactFormData.name}
                                        onChange={handleContactFormChange}
                                        placeholder="Your Name"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Phone</label>
                                    <div className="flex gap-2">
                                        <select
                                            name="countryCode"
                                            value={contactFormData.countryCode}
                                            onChange={handleContactFormChange}
                                            className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors cursor-pointer"
                                        >
                                            {COUNTRY_CODES.map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    {country.flag} {country.code}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={contactFormData.phone}
                                            onChange={handleContactFormChange}
                                            placeholder="Your Phone Number"
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-secondary mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={contactFormData.email}
                                    onChange={handleContactFormChange}
                                    placeholder="Your Email Address"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Preferred Date</label>
                                    <input
                                        type="date"
                                        name="preferredDate"
                                        value={contactFormData.preferredDate}
                                        onChange={handleContactFormChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors cursor-pointer"
                                        onClick={(e) => e.currentTarget.showPicker?.()}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Preferred Time</label>
                                    <select
                                        name="preferredTime"
                                        value={contactFormData.preferredTime}
                                        onChange={handleContactFormChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors cursor-pointer"
                                    >
                                        <option value="">Select Time</option>
                                        {TIME_SLOTS.map((slot) => (
                                            <option key={slot.value} value={slot.value}>
                                                {slot.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-secondary mb-2">Message</label>
                                <textarea
                                    name="message"
                                    rows="4"
                                    value={contactFormData.message}
                                    onChange={handleContactFormChange}
                                    placeholder="How can we help you?"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A365] transition-colors resize-none"
                                    required
                                ></textarea>
                            </div>

                            <div className="text-center">
                                <button
                                    type="submit"
                                    className="bg-[#1A1A1A] text-white px-10 py-4 rounded-full font-bold hover:bg-[#C5A365] transition-all min-w-[200px]"
                                >
                                    Send via WhatsApp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </AnimatedSection>



        </div>
    );
};

const Home = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-black text-lg md:text-xl font-semibold">Loading...</div>
                </div>
            </div>
        }>
            <HomeContent />
        </Suspense>
    );
};

export default Home;
