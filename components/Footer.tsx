import { MapPin, Phone, Truck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-20 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <span className="font-bold text-slate-200 text-sm block">Elim Africa Sports Limited</span>
          <p className="leading-relaxed">
            Official sports equipment supplier in Juja. We specialize in Yonex rackets, high-grade shuttles, non-marking badminton shoes, running sneakers, and sportswear.
          </p>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Truck className="w-4 h-4" /> Nationwide Deliveries (Mon – Sat)
          </div>
        </div>

        <div className="space-y-3">
          <span className="font-bold text-slate-200 text-sm block flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" /> Physical Store
          </span>
          <p className="leading-relaxed">
            Stall No. 17W, Moms & Dads Business Centre, Juja<br />
            Next to Ecomatt Supermarket.
          </p>
        </div>

        <div className="space-y-3">
          <span className="font-bold text-slate-200 text-sm block flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-400" /> Contact & Orders
          </span>
          <div className="space-y-1">
            <p>Direct Call / WhatsApp: <strong className="text-white">0729 044 446</strong></p>
            <p>Secondary Support: <strong className="text-white">0713 562 643</strong></p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-900 py-4 text-center text-slate-600 text-[11px]">
        © {new Date().getFullYear()} Elim Africa Sports Limited.
      </div>
    </footer>
  );
}