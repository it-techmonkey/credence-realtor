'use client';

import React from 'react';
import Link from 'next/link';
import { User, ArrowRight } from 'lucide-react';
import { TEAM_MEMBERS } from '@/data/team';

export default function TeamPage() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative bg-secondary py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 mb-6">
            <User className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Our Team</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
            Meet Our <span className="text-primary">Team</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Click on a profile to see contact details and recent launches.
          </p>
        </div>
      </section>

      {/* Team grid - cards link to profile page */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {TEAM_MEMBERS.map((member) => (
              <Link
                key={member.slug}
                href={`/team/${member.slug}`}
                className="group block bg-[#F9F7F2] rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-semibold px-5 py-2.5 rounded-full bg-primary/90 backdrop-blur-sm flex items-center gap-2">
                      <User size={18} /> View profile
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors">{member.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <p className="text-gray-600 mb-6">Can&apos;t decide? Reach out and we&apos;ll match you with the right expert.</p>
          <Link href="/about" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            More about us <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
