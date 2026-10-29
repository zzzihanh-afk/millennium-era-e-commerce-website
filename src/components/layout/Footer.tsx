import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  Music,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full">
      {/* 1. BENEFITS & TRUST BAR */}
      <div className="bg-gray-100 border-t border-b border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Benefit 1 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-brand-red">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Free Shipping</h4>
              <p className="text-xs text-gray-500">Order over ৳5,000</p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-brand-red">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Easy Returns</h4>
              <p className="text-xs text-gray-500">7 Days Return Guarantee</p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-brand-red">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Secure Payment</h4>
              <p className="text-xs text-gray-500">100% Secure Checkout</p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-brand-red">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">24/7 Support</h4>
              <p className="text-xs text-gray-500">Dedicated Customer Care</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER (Dark Charcoal #17191F) */}
      <div className="bg-brand-charcoal text-white pt-12 pb-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src="/assets/logo.png"
                alt="Millennium Era"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Millennium Era is Bangladesh's premier shopping destination for curated
              fashion, high-performance electronics, and modern lifestyle essentials.
            </p>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>123, Main Commercial Area, Dhaka & Chattogram, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>+880 1712 345678</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>info@millenniumera.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <Link to="/" className="hover:text-brand-gold transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-brand-gold transition">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-brand-gold transition">
                  Special Offers & Deals
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-gold transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-gold transition">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold mb-4">
              Customer Service
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <Link to="/return-policy" className="hover:text-brand-gold transition">
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-info" className="hover:text-brand-gold transition">
                  Shipping & Delivery Info
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-brand-gold transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand-gold transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-brand-gold transition">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Methods */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold mb-4">
              Payment Methods
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-gray-900 rounded-md border border-gray-800">
                <div className="w-8 h-8 rounded bg-amber-600/20 text-amber-500 font-bold text-xs flex items-center justify-center">
                  COD
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Cash on Delivery</p>
                  <p className="text-[10px] text-gray-400">Pay when order arrives</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-900 rounded-md border border-gray-800">
                <div className="w-8 h-8 rounded bg-pink-600/20 text-pink-500 font-bold text-xs flex items-center justify-center">
                  bKash
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">bKash Payment</p>
                  <p className="text-[10px] text-gray-400">Merchant / Personal</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-900 rounded-md border border-gray-800">
                <div className="w-8 h-8 rounded bg-orange-600/20 text-orange-500 font-bold text-xs flex items-center justify-center">
                  Nagad
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Nagad Payment</p>
                  <p className="text-[10px] text-gray-400">Instant send-money</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-900 rounded-md border border-gray-800">
                <div className="w-8 h-8 rounded bg-purple-600/20 text-purple-400 font-bold text-xs flex items-center justify-center">
                  Rocket
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Rocket Payment</p>
                  <p className="text-[10px] text-gray-400">Dutch-Bangla Bank Mobile</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM COPYRIGHT & SOCIAL */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Millennium Era. All rights reserved. Designed for Bangladesh.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-brand-gold transition"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-brand-gold transition"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-brand-gold transition"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-brand-gold transition"
              aria-label="TikTok"
            >
              <Music className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
