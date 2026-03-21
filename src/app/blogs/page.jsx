'use client'

import React, { useState } from 'react';
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

const Blogs = () => {
    useScrollAnimations();
    // State for Tabs
    const [activeTab, setActiveTab] = useState('Premium & Central');
    // State for Accordion
    const [openAccordion, setOpenAccordion] = useState(null);

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

    const communities = {
        'Premium & Central': [
            { name: "Downtown Dubai", tag: "Luxury core, iconic landmarks", points: ["Visit Burj Khalifa observation decks", "Watch Dubai Fountain shows", "Luxury shopping at Dubai Mall"] },
            { name: "Business Bay", tag: "Central business + residential", points: ["Canal-side dining and views", "Corporate offices and coworking", "Luxury apartments in a prime location"] },
            { name: "DIFC", tag: "Global financial district", points: ["Fine dining and premium lifestyle", "Art galleries and curated events", "Corporate hub with strong demand"] },
            { name: "Al Barsha", tag: "Central residential convenience", points: ["Ski Dubai experiences", "Mall of the Emirates shopping", "Strong dining and cafe scene"] }
        ],
        'Waterfront & Island': [
            { name: "Palm Jumeirah", tag: "Iconic island luxury", points: ["Beach clubs and premium leisure", "Atlantis Aquaventure access", "Fine dining and five-star resorts"] },
            { name: "Dubai Marina", tag: "Waterfront high-rise lifestyle", points: ["Marina Walk strolls", "Yacht cruises and marina leisure", "Beaches, cafes and nightlife"] },
            { name: "Dubai Creek Harbour", tag: "Emerging waterfront skyline", points: ["Creek promenade walks", "Dining with skyline views", "Top photography and sunset spots"] },
            { name: "Bluewaters Island", tag: "Lifestyle island destination", points: ["Ain Dubai observation experience", "Fine dining and waterfront retail", "Entertainment-led living"] }
        ],
        'Family & Villas': [
            { name: "Dubai Hills Estate", tag: "Green premium community", points: ["Golfing and active lifestyle", "Parks and cycling tracks", "Dubai Hills Mall convenience"] },
            { name: "Arabian Ranches", tag: "Established villa suburb", points: ["Golf and polo lifestyle", "Family parks and open spaces", "Quiet community living"] },
            { name: "Jumeirah Village Circle (JVC)", tag: "Family-friendly and affordable", points: ["Parks and jogging tracks", "Community-first daily living", "Local cafes and convenience retail"] }
        ],
        'Green & Lifestyle': [
            { name: "Jumeirah Lake Towers (JLT)", tag: "Lakeside mixed-use district", points: ["Lakeside walking loops", "Restaurants and cafe clusters", "Strong office + residential mix"] },
            { name: "Jumeirah Beach Residence (JBR)", tag: "Beachfront promenade lifestyle", points: ["Beach activities year-round", "Outdoor dining and social strip", "Street markets and events"] },
            { name: "Umm Suqeim", tag: "Upscale beach-focused living", points: ["Beach sports and waterfront access", "Wild Wadi Waterpark nearby", "Luxury dining options"] }
        ],
        'High-ROI & Emerging': [
            { name: "Dubai Sports City", tag: "Sports-centric investment zone", points: ["Cricket and football facilities", "Fitness and sports academies", "Steady residential demand"] },
            { name: "Motor City", tag: "Lifestyle + motorsport identity", points: ["Dubai Autodrome experiences", "Dedicated cycling tracks", "Parks, cafes and family housing"] },
            { name: "Dubai Silicon Oasis", tag: "Tech hub with value pricing", points: ["Tech offices and startup ecosystem", "Community parks and schools", "Student-friendly and affordable housing"] }
        ],
        'Future-Focused': [
            { name: "Dubai Design District (d3)", tag: "Creative and innovation hub", points: ["Art exhibitions and installations", "Creative cafes and studios", "Fashion and design events"] },
            { name: "Deira", tag: "Historic commercial district", points: ["Gold and spice souks", "Traditional abra rides", "Old Dubai cultural exploration"] },
            { name: "Bur Dubai", tag: "Heritage and culture center", points: ["Museums and heritage walks", "Traditional market experiences", "Authentic cultural landmarks"] }
        ]
    };

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
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded border text-sm font-medium flex items-center gap-2 transition-all ${activeTab === tab
                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                {tabIcons[tab]} {tab}
                            </button>
                        ))}
                    </div>

                    {/* Cards */}
                    <AnimatedContainer
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        key={activeTab}
                    >
                        {communities[activeTab].map((comm, idx) => (
                            <AnimatedItem
                                key={idx}
                                className="bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-display text-secondary">{comm.name}</h3>
                                    <MapPin size={18} className="text-gray-300" />
                                </div>
                                <div className="bg-[#Fdf8f0] text-[#C5A365] text-xs inline-block px-3 py-1 rounded mb-6">
                                    {comm.tag}
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {comm.points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C5A365] mt-1.5 shrink-0" />
                                            <span className="text-gray-600 text-sm">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <ContactDropdown
                                    label="Speak to an Advisor"
                                    className="w-full border border-gray-200 text-gray-600 py-3 rounded text-sm hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                                />
                            </AnimatedItem>
                        ))}
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
