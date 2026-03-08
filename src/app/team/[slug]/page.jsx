'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { getMemberBySlug } from '@/data/team';
import { getLatestProperties } from '@/utils/latestProperties';
import { formatPrice } from '@/utils/formatPrice';
import Image from 'next/image';

export default function TeamProfilePage() {
  const params = useParams();
  const slug = params?.slug;
  const member = slug ? getMemberBySlug(slug) : null;
  const latestProperties = getLatestProperties(6);

  if (!member) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 mb-4">Team member not found.</p>
        <Link href="/team" className="text-primary font-semibold inline-flex items-center gap-2 hover:underline">
          <ArrowLeft size={18} /> Back to team
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Back link */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 max-w-4xl py-4">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary text-sm font-medium transition-colors"
          >
            <ArrowLeft size={18} /> Back to team
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-10 sm:py-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 md:gap-14">
          {/* Photo */}
          <div className="flex-shrink-0 w-full md:w-80 max-w-sm md:max-w-none mx-auto md:mx-0">
            <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-[#F9F7F2]">
              <Image
                src={member.img}
                alt={member.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-secondary mb-6">{member.name}</h1>

            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-3 text-gray-700 hover:text-primary mb-6 transition-colors"
            >
              <Mail size={22} className="shrink-0 text-primary" />
              <span className="break-all">{member.email}</span>
            </a>

            <a
              href={`https://wa.me/${member.phone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#20b85a] transition-colors mb-10"
            >
              <MessageCircle size={22} /> Chat now on WhatsApp
            </a>

            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-bold text-secondary mb-4">Recent launches</h2>
              <p className="text-gray-600 text-sm mb-4">Latest properties we’re offering — reach out for details.</p>
              <ul className="space-y-4">
                {latestProperties.map((p) => (
                  <li key={p.id} className="rounded-xl bg-[#F9F7F2] hover:bg-[#F0EDE5] transition-colors overflow-hidden">
                    <Link
                      href={`/properties/${p.id}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3"
                    >
                      {/* Thumbnail */}
                      {p.mainImage && (
                        <div className="relative w-full sm:w-24 h-32 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image
                            src={p.mainImage}
                            alt={p.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 96px"
                          />
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 flex-1 min-w-0">
                        <span className="text-secondary font-medium hover:text-primary transition-colors flex items-center gap-2 truncate">
                          {p.title}
                          <ArrowRight size={14} className="flex-shrink-0" />
                        </span>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          AED {formatPrice(p.price)}
                          {p.readyDate && ` · ${p.readyDate}`}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
