import { motion } from 'motion/react';
import { Car, Sparkles, ShieldCheck, ArrowRight, Users, Coins, MapPin, CheckCircle2, Trophy, Star } from 'lucide-react';
import { CityData } from '../types';

interface WebsiteHomeProps {
  cities: CityData[];
  onNavigateToConsole: () => void;
  onNavigateToCities: () => void;
  onNavigateToCareers: () => void;
  simulationEarnings: number;
  completedTripsCount: number;
  averageRating: number;
}

export default function WebsiteHome({
  cities,
  onNavigateToConsole,
  onNavigateToCities,
  onNavigateToCareers,
  simulationEarnings,
  completedTripsCount,
  averageRating,
}: WebsiteHomeProps) {
  return (
    <div className="w-full bg-slate-50 text-slate-800 flex flex-col gap-12 font-sans select-none" id="website_home_page">
      {/* Premium Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-950 text-white py-16 px-6 sm:px-12 lg:px-16 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))] pb-4"></div>
        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/25 rounded-full text-orange-400 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Ride Dispatching</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6.5xl font-black tracking-tight leading-none text-white font-display"
          >
            Grid-Based Transit, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300">
              Redefined for Fairness
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed"
          >
            Experience Colectivo's real-time localized taxi dispatch system. Driven by an advanced 1km priority queue and strict administrative security checks, we guarantee transparent dynamic pricing and immediate matching.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap justify-center gap-4 mt-2"
          >
            <button
              onClick={onNavigateToConsole}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-tight"
              id="hero_btn_simulate"
            >
              <span>Launch Live Console</span>
              <Car className="w-4 h-4 text-neutral-950" />
            </button>
            <button
              onClick={onNavigateToCareers}
              className="px-6 py-3 bg-neutral-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-neutral-800 hover:border-slate-700 font-extrabold text-xs sm:text-sm rounded-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer uppercase"
              id="hero_btn_careers"
            >
              <span>Driver Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Floating grid visualizer snippet */}
        <div className="absolute opacity-10 bottom-0 left-0 right-0 h-10 border-t border-slate-800 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </section>

      {/* Platform Real-Time Statistics Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full px-2" id="website_stats_dashboard">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">Total Platform Earnings</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{simulationEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Distributed to verified driver wallets</p>
          </div>
          <div className="absolute right-0 bottom-0 text-slate-100 group-hover:text-slate-200/50 translate-x-2 translate-y-2 font-black text-6xl select-none font-mono pointer-events-none transition-colors">
            ₹
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">Successful Dispatches</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{completedTripsCount} Trips</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">100% matched within active urban grids</p>
          </div>
          <div className="absolute right-0 bottom-0 text-slate-100 group-hover:text-slate-200/50 translate-x-2 translate-y-2 font-black text-6xl select-none font-mono pointer-events-none transition-colors">
            #
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">Average Rider Feedback</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{averageRating.toFixed(2)}</h3>
              <div className="flex text-amber-450 text-xs">★ ★ ★ ★ ★</div>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Verified ratings across network</p>
          </div>
          <div className="absolute right-0 bottom-0 text-slate-100 group-hover:text-slate-200/50 translate-x-2 translate-y-2 font-black text-6xl select-none font-mono pointer-events-none transition-colors">
            ★
          </div>
        </div>
      </section>

      {/* Corporate Features Description */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm max-w-5xl mx-auto w-full flex flex-col lg:flex-row gap-10 items-center">
        <div className="flex-1 flex flex-col gap-4 text-left">
          <div className="w-fit px-3 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase">
            Designed for Trust & Accountability
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            A Transformed Marketplace for Gig Partners & Riders
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Existing networks extract up to 35% commission on rides. Colectivo guarantees 100% direct pilot payments with completely transparent, configurable administrative municipal flat rates.
          </p>

          <div className="flex flex-col gap-3 mt-2 font-medium text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>1km Queue Priority</strong>: Drivers that arrive first are granted first rights on adjacent passengers, ensuring orderly wait-times.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Wallet-Protection Stop</strong>: Driver-partner app locks ride alerts *only* once their top-up balance falls completely and strictly to ₹0 or less.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Visual Identity Compliance</strong>: Every partner undergoes human verification of license and insurance documents, audits, and matching validation.</span>
            </div>
          </div>
        </div>

        {/* Feature showcase visuals */}
        <div className="w-full lg:w-[320px] bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 relative shadow-lg flex flex-col self-stretch justify-between">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>OPERATIONS PANEL_</span>
            <span className="text-orange-400">ONLINE</span>
          </div>

          <div className="my-8 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center text-orange-400 font-bold font-mono">1</div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Delhi Grid Sector</h4>
                  <p className="text-[9px] text-slate-400">Dynamic pricing enabled</p>
                </div>
              </div>
              <span className="text-emerald-400 font-mono text-xs font-bold">₹108.20</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold font-mono">2</div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Smarter Queuing</h4>
                  <p className="text-[9px] text-slate-400">Strict 1km FIFO priority</p>
                </div>
              </div>
              <span className="text-amber-400 font-mono text-xs font-bold">5s Expire</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-400 font-bold font-mono">3</div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Wallet Integrity</h4>
                  <p className="text-[9px] text-slate-400">Drives till balance = 0</p>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-xs font-bold">Enabled</span>
            </div>
          </div>

          <button
            onClick={onNavigateToConsole}
            className="w-full text-center py-2 bg-white text-black font-extrabold text-[10px] rounded-lg tracking-wider hover:bg-slate-100 transition-all uppercase cursor-pointer"
          >
            Open Live Environment
          </button>
        </div>
      </section>

      {/* Call to Actions Split Block */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full px-2 mb-6 text-left">
        {/* Passenger Board */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 flex flex-col justify-between items-start gap-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <Users className="w-8 h-8 text-orange-400" />
            <h3 className="text-xl font-bold tracking-tight text-white mt-1">Passenger Convenience</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Skip waitlists or surcharge spikes. Filter high-quality comfort-tier Sedans with active GPS tracking on real-time routes. Apply safe promo discounts and top-up directly inside local rider accounts.
            </p>
          </div>
          <button
            onClick={onNavigateToConsole}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[10px] tracking-wider rounded-lg transition-all uppercase cursor-pointer"
          >
            Request Instant Ride
          </button>
        </div>

        {/* Driver Board */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between items-start gap-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1">Driver Profitability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Register verified vehicles in local grid nodes. Maintain the top spots inside 1km radius priority zones. Best of all, ride alerts remain active until your wallet hit ₹0 or less! No unfair blocks.
            </p>
          </div>
          <button
            onClick={onNavigateToCareers}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] tracking-wider rounded-lg transition-all uppercase cursor-pointer"
          >
            View Partner Earnings
          </button>
        </div>
      </section>
    </div>
  );
}
