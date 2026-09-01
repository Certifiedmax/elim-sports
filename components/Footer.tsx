import Link from "next/link";
import { 
  MapPin, 
  Phone, 
  Truck, 
  ShieldCheck, 
  Clock, 
  MessageCircle, 
  Lock,
  Sparkles
} from "lucide-react";

// Native Instagram SVG Icon
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// Native TikTok SVG Icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46V11.2a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.63z"/>
    </svg>
  );
}

// Native Facebook SVG Icon
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-20 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">
      
      {/* Top Value / Trust Highlights */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Authentic Quality</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Verified gear, rackets & non-marking shoes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Fast Fulfillment</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Juja campus drops & nationwide delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Mon – Sat Store Hours</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant pickup at Moms & Dads Juja</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand, Mission & Social Links */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 p-0.5">
              <img
                src="/Elim Sports logo.png"
                alt="Elim Sports Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
              Elim Africa Sports Limited
            </span>
          </div>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400">
            Official sports equipment supplier in Juja. We specialize in Yonex rackets, high-grade feather shuttles, non-marking indoor court shoes, running sneakers, activewear, and club jerseys.
          </p>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" /> Direct WhatsApp Ordering Active
          </div>

          {/* Social Media Profiles */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Follow Us Online:
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://www.instagram.com/esportslib?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500 text-slate-700 dark:text-slate-300 transition hover:scale-105"
                title="Follow on Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500 text-slate-700 dark:text-slate-300 transition hover:scale-105"
                title="Follow on TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500 text-slate-700 dark:text-slate-300 transition hover:scale-105"
                title="Follow on Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Physical Store Location */}
        <div className="space-y-3">
          <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Physical Store Location
          </span>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold text-xs">
              Stall No. 17W, Moms & Dads Business Centre
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Juja, Kenya (Next to Ecomatt Supermarket).
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              • Pickup point for online reservations & campus orders
            </p>
          </div>
        </div>

        {/* Contacts & Support */}
        <div className="space-y-3">
          <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Contact & Direct Orders
          </span>
          <div className="space-y-2">
            <a
              href="https://wa.me/254729044446?text=Hello%20Elim%20Sports,%20I'm%20inquiring%20about%20gear%20in%20stock."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition group"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">WhatsApp / Orders:</span>
              </div>
              <strong className="text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                0729 044 446
              </strong>
            </a>

            <a
              href="tel:0713562643"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition group"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Secondary Support:</span>
              </div>
              <strong className="text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                0713 562 643
              </strong>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 dark:border-slate-900 py-5 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-500">
          <p>© {currentYear} Elim Africa Sports Limited. All rights reserved.</p>
          
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 hover:text-emerald-500 transition text-slate-400 hover:underline"
              title="Store Owner & Staff Login"
            >
              <Lock className="w-3 h-3" />
              <span>Staff / Owner Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}