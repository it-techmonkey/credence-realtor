'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import {
    MessageCircle,
    ArrowRight,
    TrendingUp,
    Globe,
    Percent,
    BarChart3,
    Building2,
    Key,
    Award,
    Landmark,
    ShieldCheck,
    Home,
    MapPin,
    Users,
    Leaf,
    Rocket,
    CheckCircle2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import ContactDropdown from '@/components/ContactDropdown';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedContainer from '@/components/AnimatedContainer';
import AnimatedItem from '@/components/AnimatedItem';
import { useScrollAnimations } from '@/utils/useScrollAnimation';
import areaGuideCommunities from '@/data/dubai-area-guide-areas.json';

const Blogs = () => {
    useScrollAnimations();
    // State for Tabs
    const [activeTab, setActiveTab] = useState('Premium & Central');
    // State for Accordion
    const [openAccordion, setOpenAccordion] = useState(null);
    /** `${tab}-${index}` when an area card is expanded to show the long description */
    const [expandedAreaKey, setExpandedAreaKey] = useState(null);

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index);
    };

    const advantageCards = [
        { icon: <Percent size={20} />, title: "0% Property & Income Tax", desc: "Keep more of your investment returns with Dubai's tax-free environment" },
        { icon: <TrendingUp size={20} />, title: "6-10% Rental Yields", desc: "Among the highest rental returns globally for prime real estate" },
        { icon: <BarChart3 size={20} />, title: "Capital Appreciation", desc: "Consistent property value growth in key areas and developments" },
        { icon: <Key size={20} />, title: "Freehold Ownership", desc: "Full property ownership rights for foreign nationals in designated zones" },
        { icon: <Award size={20} />, title: "Golden Visa Eligibility", desc: "Secure 10-year residency with qualifying property investments" },
        { icon: <Landmark size={20} />, title: "Government-Backed Growth", desc: "Strategic infrastructure investments ensuring long-term market stability" },
        { icon: <ShieldCheck size={20} />, title: "Regulated & Transparent", desc: "Robust legal framework with DLD and RERA oversight" },
        { icon: <Home size={20} />, title: "Diverse Property Types", desc: "From luxury villas to high-ROI apartments to entry investor profile" }
    ];

    const communities = areaGuideCommunities;

    const faqs = [
        { q: "Who Can Buy Property in Dubai?", a: "Foreign nationals can own freehold properties in designated zones across Dubai. Over 40 freehold areas available including Downtown, Marina, Palm Jumeirah. Leasehold options (up to 99 years) available in other areas. No restrictions on number of properties owned. Corporate entities can also purchase property." },
        { q: "Residency Through Property", a: "Investments of AED 750,000+ grant a 2-year Investor Visa. Investments of AED 2 Million+ allow for a 10-year Golden Visa. Both include family sponsorship options." },
        { q: "Property Types Explained", a: "Off-plan: Buying usually during construction with payment plans. Ready: Completed properties ready for move-in or rent. Freehold: 100% ownership. Leasehold: Ownership for a fixed term (99 years)." },
        { q: "Step-by-Step Buying Process", a: "1. Select Property. 2. Sign MOU/Reservation. 3. Pay Deposit (usually 10%). 4. Obtain NOC from Developer (if resale). 5. Transfer Title Deed at DLD." },
        { q: "Costs to Consider", a: "DLD Transfer Fee: 4% of property value. Trustee Fee: AED 4,000 approx. Agency Fee: 2% + VAT. Service Charges: Recurring annual fees for building maintenance." },
        { q: "Mortgages & Financing", a: "Non-residents can typically get up to 50-60% LTV mortgages. Residents up to 80-85%. Interest rates vary by bank and market conditions." },
        { q: "Rental Yields & ROI", a: "Dubai offers some of the highest yields globally, often between 5-9% depending on area and property type (short-term vs long-term)." },
        { q: "Legal Safety & Regulations", a: "All transactions are regulated by RERA (Real Estate Regulatory Agency) and DLD (Dubai Land Department). Escrow accounts mandatory for off-plan projects." }
    ];

    const tabIcons = {
        'Premium & Central': <Building2 size={16} />,
        'Waterfront & Island': <Globe size={16} />, // Using Globe as placeholder for Island/Water styling if specific wave icon missing in standard set
        'Family & Villas': <Home size={16} />,
        'Green & Lifestyle': <Leaf size={16} />,
        'High-ROI & Emerging': <TrendingUp size={16} />,
        'Future-Focused': <Rocket size={16} />
    };

    return (
        <div className="font-sans">
            {/* 1. Hero Section */}
            <section className="relative h-screen min-h-[800px] flex items-center justify-center bg-black overflow-hidden">
                <div className="absolute inset-0">
                    <img src="/assets/blogs-bg.jpg" alt="Dubai Real Estate Guide" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/40" />
                </div>
                <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center pt-32">
                    <h1
                        className="text-5xl md:text-7xl font-display text-white mb-2 animate-fade-in-up"
                        style={{ animationDelay: '0s' }}
                    >
                        Dubai Real Estate
                    </h1>
                    <h1
                        className="text-5xl md:text-7xl font-display text-[#C5A365] mb-8 animate-fade-in-up"
                        style={{ animationDelay: '0.1s' }}
                    >
                        Guide
                    </h1>
                    <p
                        className="text-gray-300 text-lg uppercase tracking-widest mb-12 animate-fade-in-up"
                        style={{ animationDelay: '0.2s' }}
                    >
                        Your Complete Handbook to Investing & Living in Dubai
                    </p>
                    <p
                        className="text-gray-300 text-lg mb-10 animate-fade-in-up"
                        style={{ animationDelay: '0.3s' }}
                    >
                        Discover one of the world's most dynamic real estate markets. From tax-free<br></br>
                        investment opportunities to world-class lifestyle offerings, Dubai presents<br></br>
                        unparalleled potential for global investors and homebuyers.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <a href="/#contact" className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-[#C5A365] hover:text-white transition-all flex items-center gap-2">
                            Book a Free Consultation <ArrowRight size={16} />
                        </a>
                        <a href="https://wa.me/971588919223" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-green-600 hover:border-green-600 border border-white/30 backdrop-blur text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
                            <MessageCircle size={20} />
                            WhatsApp Now
                        </a>
                    </div>
                </div>
            </section>

            {/* 2. Market Insight Section */}
            <AnimatedSection className="py-24 bg-white" id="market">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1">
                            <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Market Insight</span>
                            <h2 className="text-4xl md:text-5xl font-display text-secondary mb-8 leading-tight">
                                Why Dubai Continues to <br /> Attract Global Property <br /> Investors
                            </h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Dubai is more than a city—it's a global lifestyle and investment hub. With tax-free income, world-class infrastructure, and investor-friendly regulations, Dubai consistently ranks among the top real estate destinations worldwide.
                            </p>
                            <p className="text-gray-500 mb-10 leading-relaxed">
                                Whether you're buying your first property, expanding your portfolio, or relocating, understanding Dubai's areas and property ecosystem is key to making confident decisions.
                            </p>

                            <div className="flex gap-12 border-t border-gray-100 pt-8">
                                <div>
                                    <div className="flex items-center gap-2 text-[#C5A365] mb-2">
                                        <TrendingUp size={18} />
                                    </div>
                                    <h4 className="text-3xl font-display text-secondary mb-1">6-10%</h4>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Average Rental Yield</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-[#C5A365] mb-2">
                                        <Globe size={18} />
                                    </div>
                                    <h4 className="text-3xl font-display text-secondary mb-1">200+</h4>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Nationalities Invested</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-[#C5A365] mb-2">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <h4 className="text-3xl font-display text-secondary mb-1">0%</h4>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Property Tax</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <div className="bg-gray-100 h-[630px] overflow-hidden rounded-sm relative">
                                <img
                                    src="https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&q=80&w=800"
                                    alt="Burj Al Arab"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 border-[12px] border-white/50 m-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* 3. Dubai Advantage (Dark Section) */}
            <AnimatedSection className="py-24 bg-[#1A1A1A]">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Section One</span>
                        <h2 className="text-4xl text-white font-display mb-4">The Dubai Advantage</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Dubai offers a rare combination of high returns, lifestyle excellence, and long-term stability for property investors.
                        </p>
                    </div>

                    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {advantageCards.map((card, idx) => (
                            <AnimatedItem
                                key={idx}
                                className="bg-[#222] p-8 rounded hover:bg-[#2A2A2A] transition-colors border border-white/5 group"
                            >
                                <div className="w-10 h-10 bg-[#333] rounded flex items-center justify-center text-[#C5A365] mb-6 group-hover:bg-[#C5A365] group-hover:text-black transition-colors">
                                    {card.icon}
                                </div>
                                <h4 className="text-white font-bold mb-3">{card.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                            </AnimatedItem>
                        ))}
                    </AnimatedContainer>
                </div>
            </AnimatedSection>

            {/* 4. Communities Section */}
            <AnimatedSection className="py-24 bg-[#F9F9F9]" id="areas">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Section Two</span>
                        <h2 className="text-4xl text-secondary font-display mb-4">Explore Dubai's Most Sought-After Communities</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Dubai spans over 4,100 sq. km, offering diverse districts designed for luxury living, family life, business hubs, and waterfront lifestyles.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {Object.keys(communities).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setExpandedAreaKey(null);
                                }}
                                className={`px-6 py-3 rounded border text-sm font-medium flex items-center gap-2 transition-all ${activeTab === tab
                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                {tabIcons[tab]} {tab}
                            </button>
                        ))}
                    </div>

                    {/* Cards — items-start prevents row stretch when one card expands (keeps sibling card heights stable) */}
                    <AnimatedContainer
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
                        key={activeTab}
                    >
                        {communities[activeTab].map((comm, idx) => {
                            const areaKey = `${activeTab}-${idx}`;
                            const isOpen = expandedAreaKey === areaKey;
                            const hasOverview = Boolean(comm.description && String(comm.description).trim());
                            return (
                            <AnimatedItem
                                key={areaKey}
                                className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden rounded-lg max-w-full self-start w-full"
                            >
                                <div className="relative h-48 w-full shrink-0 bg-gray-100">
                                    <img
                                        src={comm.image || '/assets/blogs-bg.jpg'}
                                        alt={`${comm.name} — Dubai area guide`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                                </div>
                                <div className="p-8 flex flex-col gap-0">
                                <div className="flex justify-between items-start gap-3 mb-4">
                                    <h3 className="text-xl font-display text-secondary leading-tight">{comm.name}</h3>
                                    <MapPin size={18} className="text-gray-300 shrink-0 mt-1" aria-hidden="true" />
                                </div>
                                <div className="bg-[#Fdf8f0] text-[#C5A365] text-xs inline-block px-3 py-1 rounded mb-5 w-fit max-w-full">
                                    {comm.tag}
                                </div>

                                {hasOverview && (
                                    <div className="mb-6 rounded-xl border border-[#C5A365]/15 bg-gradient-to-b from-[#F9F7F2] to-white p-4 shadow-[inset_0_1px_0_0_rgba(197,163,101,0.08)]">
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between gap-2 text-left"
                                            onClick={() => setExpandedAreaKey(isOpen ? null : areaKey)}
                                            aria-expanded={isOpen}
                                            aria-controls={`area-overview-${areaKey}`}
                                            id={`area-overview-trigger-${areaKey}`}
                                        >
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A365]">
                                                Area overview
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp size={18} className="shrink-0 text-[#C5A365]" aria-hidden="true" />
                                            ) : (
                                                <ChevronDown size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
                                            )}
                                        </button>
                                        <div
                                            id={`area-overview-${areaKey}`}
                                            role="region"
                                            aria-labelledby={`area-overview-trigger-${areaKey}`}
                                            className="mt-3"
                                        >
                                            <p
                                                className={`text-gray-600 text-sm leading-relaxed ${isOpen ? 'max-h-[min(280px,45vh)] overflow-y-auto pr-1 [scrollbar-gutter:stable]' : 'line-clamp-3'}`}
                                            >
                                                {comm.description}
                                            </p>
                                            {!isOpen && (
                                                <p className="mt-2 text-xs text-gray-400">
                                                    Expand above for the full overview.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <ul className="space-y-3 mb-6">
                                    {comm.points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C5A365] mt-1.5 shrink-0" />
                                            <span className="text-gray-600 text-sm">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={`/properties?city=dubai&locality=${encodeURIComponent(comm.locality)}`}
                                    className="w-full mb-3 border border-[#C5A365] text-[#C5A365] py-3 rounded text-sm font-semibold hover:bg-[#C5A365] hover:text-white transition-colors flex items-center justify-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View properties in this area <ArrowRight size={16} />
                                </Link>
                                <ContactDropdown
                                    label="Speak to an Advisor"
                                    className="w-full border border-gray-200 text-gray-600 py-3 rounded text-sm hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                                />
                                </div>
                            </AnimatedItem>
                        );
                        })}
                    </AnimatedContainer>
                </div>
            </AnimatedSection>

            {/* 5. FAQ Section */}
            <AnimatedSection className="py-24 bg-white" id="faqs">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Section Three</span>
                        <h2 className="text-4xl text-secondary font-display mb-2">Everything You Need to Know Before</h2>
                        <h2 className="text-4xl text-secondary font-display mb-4">Buying</h2>
                        <p className="text-gray-500">
                            A comprehensive guide to navigating Dubai's property market with confidence.
                        </p>
                    </div>

                    <div className="space-y-4 bg-[#F9F7F2] p-8 rounded-lg">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                                <button
                                    onClick={() => toggleAccordion(idx)}
                                    className="w-full flex justify-between items-center py-4 text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${openAccordion === idx ? 'bg-[#C5A365] text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                                            {/* Icons could be mapped if needed, simplifying to generic or just index */}
                                            {idx === 0 ? <Users size={16} /> :
                                                idx === 1 ? <Home size={16} /> :
                                                    idx === 2 ? <Building2 size={16} /> :
                                                        <CheckCircle2 size={16} />
                                            }
                                        </div>
                                        <span className={`font-medium ${openAccordion === idx ? 'text-secondary' : 'text-gray-600'}`}>
                                            {faq.q}
                                        </span>
                                    </div>
                                    {openAccordion === idx ? <ChevronUp size={18} className="text-[#C5A365]" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </button>
                                {openAccordion === idx && (
                                    <div className="pl-12 pr-4 pb-4 text-gray-500 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>
        </div>
    );
};

export default Blogs;
