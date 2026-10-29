import React from 'react';
import { ShieldCheck, Award, Truck, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold-dark text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Heritage</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            About Millennium Era
          </h1>
          <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Millennium Era was founded on a singular premise: delivering authentic,
            world-class luxury fashion, high-end electronics, and lifestyle pieces directly
            to shoppers across Bangladesh.
          </p>
        </div>

        {/* Brand Mission */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-black p-8 sm:p-12 text-white">
          <div className="max-w-xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-gold">
              Shop Beyond Time
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              We curate only verified products that meet the highest standards of durability,
              craftsmanship, and aesthetic elegance. Whether you reside in Dhaka, Chattogram,
              Sylhet, or beyond, our mission is to ensure seamless delivery and absolute peace
              of mind.
            </p>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 text-brand-red flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Guaranteed Authenticity</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every single product in our warehouse is sourced from verified suppliers and inspected before packing.
            </p>
          </div>

          <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 text-brand-gold-dark flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Secure Payments</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Flexible payment methods tailored for Bangladesh: Cash on Delivery, bKash, Nagad, and Rocket with transparent processing.
            </p>
          </div>

          <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Swift Delivery</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Fast, reliable delivery directly to your doorstep in all 64 districts across Bangladesh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
