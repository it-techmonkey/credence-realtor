'use client'

import React from 'react';
import Link from 'next/link';
import {
    ShieldCheck,
    FileText,
    Users,
    Award,
    Target,
    Compass,
    Lightbulb,
    TrendingUp,
    Heart,
    Building2,
    MessageCircle,
    ArrowRight,
    Star,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedContainer from '@/components/AnimatedContainer';
import AnimatedItem from '@/components/AnimatedItem';
import { useScrollAnimations } from '@/utils/useScrollAnimation';
import { TEAM_MEMBERS } from '@/data/team';

const About = () => {
    useScrollAnimations();
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollContainerRef = useRef(null);

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScrollButtons();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollButtons);
            window.addEventListener('resize', checkScrollButtons);
            return () => {
                container.removeEventListener('scroll', checkScrollButtons);
                window.removeEventListener('resize', checkScrollButtons);
            };
        }
    }, []);

    const handleScrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };
    return (
        <div className="font-sans">
            {/* 1. Hero Section */}
            <section className="relative h-screen min-h-[800px] flex items-center justify-center bg-black overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/assets/about-us-bg.png"
                        alt="About Credence Realtor"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/40" />
                </div>
                <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center pt-32">
                    <div className="flex items-center justify-center gap-4 mb-4 animate-fade-in-up">
                        <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-[0.3em]">EST. 2010 • DUBAI</span>
                        <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                    </div>
                    <h1
                        className="text-5xl md:text-7xl font-display text-white mb-6 leading-tight animate-fade-in-up"
                        style={{ animationDelay: '0.1s' }}
                    >
                        A Trusted Name in  <br /> <span className="text-[#C5A365]">Dubai Real Estate</span>
                    </h1>
                    <p
                        className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed font-light mb-10 animate-fade-in-up"
                        style={{ animationDelay: '0.2s' }}
                    >
                        Expert guidance for investors, homeowners, and global buyers—delivering secure, high-value property opportunities across Dubai.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link href="/properties" className="bg-white hover:bg-[#C5A365] text-black font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-white/25 hover:shadow-[#C5A365]/25 flex items-center gap-2">
                            Get Property Options <ArrowRight size={16} />
                        </Link>
                        <a href="https://wa.me/971588919223" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-green-600 hover:border-green-600 border border-white/30 backdrop-blur text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
                            <MessageCircle size={20} />
                            WhatsApp Now
                        </a>
                    </div>
                </div>
            </section>

            {/* 2. Who We Are (Building Trust) */}
            <AnimatedSection className="py-24 bg-white" id="who-we-are">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                                <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest">Who We Are</span>

                            </div>
                            <h2 className="text-4xl md:text-5xl font-display text-secondary mb-2">
                                Building Trust Through
                            </h2>
                            <h2 className="text-4xl md:text-5xl font-display text-[#C5A365] mb-8 font-serif italic">
                                Excellence
                            </h2>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                Founded in 2021 by <strong>Mr. Nazrul Alam Kabir</strong>, Managing Director & Founder, Credence Realtor has quickly emerged as a trusted name in Dubai's dynamic real estate market.
                            </p>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Built on a foundation of integrity, transparency, and personalized service, Credence Realtor delivers exceptional real estate experiences for both local and international clients, helping them make confident, well-informed property decisions.
                            </p>
                            <div className="border-l-4 border-[#C5A365] pl-6 py-2">
                                <p className="text-secondary text-lg font-medium italic">
                                    "Real estate is not just about buying property, it's about building long-term value and trust."
                                </p>
                            </div>
                        </div>

                        <AnimatedContainer className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                            {[
                                { icon: <ShieldCheck size={24} />, title: "RERA Licensed", desc: "Fully compliant & regulated" },
                                { icon: <FileText size={24} />, title: "DLD Aligned", desc: "Official gov. standards" },
                                { icon: <Users size={24} />, title: "Global Clients", desc: "Trusted by investors worldwide" },
                                { icon: <Award size={24} />, title: "Premium Partners", desc: "Top developer connections" }
                            ].map((item, idx) => (
                                <AnimatedItem
                                    key={idx}
                                    className="bg-[#F9F7F2] p-8 rounded-sm hover:-translate-y-1 transition-transform duration-300"
                                >
                                    <div className="text-[#C5A365] mb-4">{item.icon}</div>
                                    <h4 className="text-secondary font-bold mb-1">{item.title}</h4>
                                    {/* <p className="text-gray-500 text-sm">{item.desc}</p> */}
                                </AnimatedItem>
                            ))}
                        </AnimatedContainer>
                    </div>
                </div>
            </AnimatedSection>

            {/* 3. Our Purpose (Mission & Vision) */}
            <AnimatedSection className="py-24 bg-[#1A1A1A] relative overflow-hidden" id="mission">
                {/* Decorative circle */}
                <div className="absolute top-0 left-0 w-[600px] h-[600px] border border-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                            <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest">Our Purpose</span>
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                        </div>
                    </div>

                    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Mission */}
                        <AnimatedItem className="bg-[#222] p-10 border border-white/5 relative group hover:border-[#C5A365]/30 transition-colors flex flex-col">
                            <div className="w-12 h-12 border border-[#C5A365] flex items-center justify-center text-[#C5A365] mb-6">
                                <Target size={24} />
                            </div>
                            <h3 className="text-3xl font-display text-white mb-6">Our Mission</h3>
                            <p className="text-gray-400 leading-relaxed mb-8">
                                To guide investors, homeowners, and tenants through every stage of the real estate journey with professionalism and care.<br></br>
                                To provide expert advice based on market trends, data analysis, and a deep understanding of Dubai’s evolving property landscape.<br></br>
                                To create long-term value for our clients through profitable and secure property investments.
                            </p>
                            <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-[#666] mt-auto">
                                <span>Empowerment</span><span>•</span><span>Guidance</span><span>•</span><span>Growth</span>
                            </div>
                        </AnimatedItem>

                        {/* Vision */}
                        <AnimatedItem className="bg-[#222] p-10 border border-white/5 relative group hover:border-[#C5A365]/30 transition-colors flex flex-col">
                            <div className="w-12 h-12 border border-[#C5A365] flex items-center justify-center text-[#C5A365] mb-6">
                                <Compass size={24} />
                            </div>
                            <h3 className="text-3xl font-display text-white mb-6">Our Vision</h3>
                            <p className="text-gray-400 leading-relaxed mb-8">
                                To be recognized as one of Dubai's most reliable and results-driven real estate brokerages, connecting people with properties that enrich lifestyles and deliver lasting value.
                            </p>
                            <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-[#666] mt-auto">
                                <span>Trust</span><span>•</span><span>Intelligence</span><span>•</span><span>Leadership</span>
                            </div>
                        </AnimatedItem>
                    </AnimatedContainer>
                </div>
            </AnimatedSection>

            {/* 4. Why Choose Credence */}
            <AnimatedSection className="py-24 bg-[#F9F9F9]" id="choose-us">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                            <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest">The Credence Difference</span>
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary">
                            Why Choose <span className="text-[#C5A365]">Credence</span>
                        </h2>
                    </div>

                    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: <Lightbulb size={20} />, title: "Client-First Approach", desc: "Every recommendation starts with understanding client goals — investment, lifestyle, or long-term growth." },
                            { icon: <TrendingUp size={20} />, title: "Global & Multilingual Expertise", desc: "Market-savvy professionals with international investor experience, offering seamless support across borders." },
                            { icon: <Heart size={20} />, title: "End-to-End Real Estate Services", desc: "Sales · Leasing · Investments · Off-Plan · Property Management · Mortgage Assistance · Golden Visa Support · Transaction Process & Documentation." },
                            { icon: <Building2 size={20} />, title: "Strong Developer Partnerships", desc: "Collaborations with 30+ developers across the UAE, including Dubai's leading names: Emaar · Damac · Nakheel · Sobha · Azizi · and more." }
                        ].map((item, idx) => (
                            <AnimatedItem
                                key={idx}
                                className="bg-white p-8 border border-gray-100 flex flex-col items-start hover:shadow-lg transition-shadow relative overflow-hidden group"
                            >
                                <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-400 mb-6 group-hover:border-[#C5A365] group-hover:text-[#C5A365] transition-colors">
                                    {item.icon}
                                </div>
                                <h4 className="text-xl font-display text-secondary mb-3">{item.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full border border-gray-100 group-hover:bg-[#C5A365]/10"></div>
                            </AnimatedItem>
                        ))}
                    </AnimatedContainer>
                </div>
            </AnimatedSection>

            {/* 5. Our Team */}
            <AnimatedSection className="py-24 bg-white" id="team">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                            <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest">Our Team</span>
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary">
                            Meet Our <span className="text-[#C5A365]">Team</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-4">
                            Since inception, Credence Realtor has expanded rapidly, attracting talented real estate professionals,<br></br> investment consultants, and client service experts.<br></br>
                            Our growing team is unified by a shared passion for excellence, market intelligence,<br></br> and commitment to delivering results that matter.
                        </p>
                    </div>

                    <div className="relative -mx-4 px-4">
                        {/* Left fade gradient */}
                        {canScrollLeft && (
                            <div className="absolute left-4 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/95 to-transparent z-10 pointer-events-none"></div>
                        )}

                        {/* Right fade gradient */}
                        {canScrollRight && (
                            <div className="absolute right-4 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/95 to-transparent z-10 pointer-events-none"></div>
                        )}

                        {/* Navigation Buttons */}
                        {canScrollLeft && (
                            <button
                                onClick={handleScrollLeft}
                                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center text-[#C5A365] hover:bg-[#C5A365] hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label="Scroll left"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        {canScrollRight && (
                            <button
                                onClick={handleScrollRight}
                                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center text-[#C5A365] hover:bg-[#C5A365] hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label="Scroll right"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}

                        <div
                            ref={scrollContainerRef}
                            className="overflow-x-auto pb-4 scroll-smooth scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <style>{`
                                .scrollbar-hide::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            <div className="flex gap-6 md:gap-8 min-w-max py-2">
                                {TEAM_MEMBERS.map((member, idx) => (
                                    <div key={idx} className="group cursor-pointer flex-shrink-0 w-64 md:w-72">
                                        <div className="overflow-hidden mb-6 bg-[#F9F7F2] rounded-sm p-0 aspect-[3/4] relative">
                                            <img src={member.img} alt={member.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            {/* Hover WhatsApp Button */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <a
                                                    href={`https://wa.me/${member.phone}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-[#25D366] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#20b85a] shadow-lg"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MessageCircle size={20} /> Chat Now
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-xl font-bold text-secondary mb-2">{member.name}</h4>
                                            <a
                                                href={`https://wa.me/${member.phone}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#25D366] transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MessageCircle size={14} /> Connect on WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-center mt-8">
                            <Link href="/team" className="inline-flex items-center gap-2 text-[#C5A365] font-semibold hover:underline">
                                View full team <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* 6. Achievements */}
            <AnimatedSection className="py-24 bg-[#F9F9F9]" id="achievements">
                <div className="container mx-auto px-4 max-w-7xl text-center">
                    <div className="flex items-center justify-center gap-4 mb-16">
                        <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest">Our Achievements</span>
                        <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                    </div>

                    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 justify-items-center">
                        {[
                            { title: "Team Recognition", img: "/assets/awards and team recog/team (1).png" },
                            { title: "Awards & Certifications", img: "/assets/awards and team recog/award.png" },
                            { title: "Team Celebration", img: "/assets/awards and team recog/team2.png" },
                            { title: "Excellence Award", img: "/assets/awards and team recog/award2.png" },
                            { title: "Team Event", img: "/assets/awards and team recog/team (3).png" },
                            { title: "Industry Recognition", img: "/assets/awards and team recog/awar3.png" }
                        ].map((item, idx) => (
                            <AnimatedItem
                                key={idx}
                                className="bg-white p-6 border border-[#E5E5E5] hover:border-[#C5A365] transition-colors w-full max-w-sm"
                            >
                                <div className="bg-[#F9F7F2] mb-6 overflow-hidden rounded-sm p-4 flex items-center justify-center h-64">
                                    <img src={item.img} alt={item.title} className="w-full h-full object-contain" />
                                </div>
                                <h4 className="text-secondary font-bold">{item.title}</h4>
                            </AnimatedItem>
                        ))}
                    </AnimatedContainer>
                </div>
            </AnimatedSection>
            {/* 8. FAQ */}
            <AnimatedSection className="py-24 bg-white border-t border-gray-100" id="faqs">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                            <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest">Got Questions?</span>
                            <div className="h-[1px] w-12 bg-[#C5A365]"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary mb-4">Frequently Asked Questions</h2>
                        <p className="text-gray-500">Everything you need to know about investing in Dubai real estate</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Why choose Credence Realtor in Dubai?",
                                a: "We offer tailored investment solutions, prime property access, and trusted advisory backed by deep market expertise."
                            },
                            {
                                q: "What services does Credence Realtor provide?",
                                a: "We specialize in buying, selling, renting, off-plan investments, property management, assisting thorough our channel partners (Mortgage, Golden Visa, Crypto transaction) and ROI advisory."
                            },
                            {
                                q: "Does Credence specialize in residential and commercial properties?",
                                a: "Yes, we provide expert brokerage services across residential, commercial, luxury, and off-plan sectors."
                            },
                            {
                                q: "Is Credence Realtor licensed and RERA-certified?",
                                a: "Yes. We are fully licensed and registered with the Dubai Land Department and RERA."
                            },
                            {
                                q: "Do you work with international investors?",
                                a: "Yes. We cater to global clients, offering end-to-end services including virtual tours, legal guidance, and remote property transactions."
                            },
                            {
                                q: "Do you offer free consultations?",
                                a: "Yes, Credence Realtor Property Consultants offer a Free consultation to help clients explore the best real estate opportunities tailored to their needs."
                            },
                            {
                                q: "Can Credence help with high-ROI investments?",
                                a: "Absolutely. We analyze market trends and project data to deliver high-yield investment opportunities tailored to client goals."
                            },
                            {
                                q: "What property types do you offer?",
                                a: " We deal in residential, commercial, luxury villas, branded residences, off-plan units, and holiday homes."
                            },
                            {
                                q: "What support do you offer beyond sales?",
                                a: "We provide full-service solutions—property management, leasing, resale support, mortgage support, property documentation and investor portfolio structuring."
                            },
                            {
                                q: "Can you assist with Golden Visa requirements?",
                                a: "Yes. We guide eligible investors through the process and offer properties that meet Golden Visa criteria."
                            },
                            {
                                q: "Can I get property management and rental support?",
                                a: "Yes. We offer full-service property management, tenant screening, leasing, and maintenance coordination."
                            }

                        ].map((item, i) => (
                            <div key={i} className="border border-gray-100 rounded-sm mb-4 bg-[#F9F9F9] overflow-hidden">
                                <button
                                    className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full border border-[#C5A365] flex items-center justify-center text-[#C5A365] shrink-0">
                                            <span className="text-xs font-bold">?</span>
                                        </div>
                                        <span className={`font-semibold ${openFaq === i ? 'text-[#C5A365]' : 'text-secondary'}`}>{item.q}</span>
                                    </div>
                                    {openFaq === i ? <ChevronUp size={18} className="text-[#C5A365]" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-6 pt-0 pl-14 text-gray-500 text-sm leading-relaxed text-left animate-in fade-in slide-in-from-top-1">
                                        <p>{item.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>
            {/* 7. Testimonials (Slider) */}
            <AnimatedSection className="py-24 bg-white" id="testimonials">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[#C5A365] text-xs font-bold uppercase tracking-widest mb-4 block">Testimonials</span>
                        <h2 className="text-4xl md:text-5xl font-display text-secondary">Happy Clients</h2>
                    </div>

                    <div className="max-w-4xl mx-auto relative">
                        {/* Slider Content */}
                        <div className="bg-[#F9F9F9] p-8 md:p-12 rounded-2xl shadow-sm text-center relative overflow-hidden">
                            {/* Quote Icon */}
                            <div className="text-[#C5A365] text-4xl font-serif mb-6 opacity-80">“</div>

                            {/* Stars */}
                            <div className="flex justify-center mb-6 text-[#C5A365]">
                                {[1, 2, 3, 4, 5].map(n => <Star key={n} size={20} fill="currentColor" />)}
                            </div>

                            {/* Text */}
                            <div className="min-h-[120px] flex items-center justify-center">
                                <h3 className="text-xl md:text-2xl font-serif italic text-secondary leading-relaxed max-w-2xl mx-auto">
                                    &quot;{[
                                        "The team's knowledge of the luxury market is exceptional. They found me a branded residence that exceeded my expectations.",
                                        "Professional, transparent, and incredibly helpful. They guided me through the entire Golden Visa process seamlessy.",
                                        "I was looking for a high-yield investment, and Credence delivered exactly that. Their market insights are top-notch."
                                    ][activeTestimonial]}&quot;
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


        </div>
    );
};

export default About;
