import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Sparkles, Coins, Users, CreditCard, ChevronRight, FileText, CheckCircle, Calculator } from 'lucide-react';

interface WebsiteCareersProps {
  comfortRate: number;
  comfortPlusRate: number;
  onNavigateToConsole: () => void;
}

export default function WebsiteCareers({
  comfortRate,
  comfortPlusRate,
  onNavigateToConsole,
}: WebsiteCareersProps) {
  const [ridesPerWeek, setRidesPerWeek] = useState(35);
  const [percentageComfortPlus, setPercentageComfortPlus] = useState(30);

  // Math calculation of weekly earnings:
  // Avg distance per trip = 8 km
  // Cost per km = (Percentage Comfort Plus/100) * comfortPlusRate + (1 - Percentage/100) * comfortRate
  const averageTripDistanceKm = 8;
  const avgCostPerKm = (percentageComfortPlus / 100) * comfortPlusRate + (1 - percentageComfortPlus / 100) * comfortRate;
  const avgTripValue = averageTripDistanceKm * avgCostPerKm;
  const grossWeeklyEarnings = ridesPerWeek * avgTripValue;
  const platformFeeCommission = 0.05; // 5% commission vs normal 30%
  const totalPartnerEarnings = grossWeeklyEarnings * (1 - platformFeeCommission);

  return (
    <div className="w-full bg-slate-50 text-slate-800 flex flex-col gap-12 font-sans select-none text-left" id="website_careers_page">
      {/* Header section */}
      <div className="flex flex-col gap-2 max-w-4xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span className="text-amber-700 font-mono text-[10px] font-bold uppercase tracking-wider">Drive & Partner with Colectivo</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display text-left">
          Our Drivers are Equal Shareholders
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-2xl text-left">
          Skip unfair algorithmic dispatch locks or steep service flat commissions. Colectivo operates on highly transparent and secure structures designed to protect pilot livelihoods.
        </p>
      </div>

      {/* Grid of Perks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 transition-all">
          <div className="w-10 h-10 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-orange-600 mb-4">
            <Coins className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight mb-1.5">No Hidden Commissions</h4>
          <p className="text-slate-500 text-xs leading-relaxed font-sans">
            Keep up to 95% of your gross dynamic passenger fare. Only a flat 5% administrative surcharge is retained to sustain the city server infrastructure.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 transition-all">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight mb-1.5">Wallet Protection Clause</h4>
          <p className="text-slate-500 text-xs leading-relaxed font-sans">
            Drive completely for free for 3 rides daily! Your partner-console only halts ride allocation when your active top-up balance hits strictly zero or below.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 transition-all">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight mb-1.5">1km Matching Priority</h4>
          <p className="text-slate-500 text-xs leading-relaxed font-sans">
            When multiple drivers are idle in the same node vicinity, we dispatch to the driver with the earliest idle duration timestamp. First in, first out.
          </p>
        </div>
      </div>

      {/* Dynamic Interactive Earnings Calculator Slider Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-5xl mx-auto w-full flex flex-col lg:flex-row gap-10 items-stretch">
        <div className="flex-1 flex flex-col gap-6 justify-between select-none">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-[10px] font-mono font-bold uppercase w-fit">
              <Calculator className="w-3 h-3 text-indigo-700" />
              <span>Earnings Estimator</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">Calculate Your Weekly Profits</h3>
            <p className="text-slate-550 text-xs leading-relaxed font-sans">
              Enter details below about your anticipated weekly rides and vehicle tier split to find approximate payouts in our operational nodes, computed against dynamic base tariffs.
            </p>
          </div>

          <div className="flex flex-col gap-5 mt-2">
            {/* Rides week slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-slate-600">Rides Completed Weekly:</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black text-xs">{ridesPerWeek} Trips</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={ridesPerWeek}
                onChange={(e) => setRidesPerWeek(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>

            {/* Comfort+ percentage slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-slate-600">Comfort+ Luxury Tier Share:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black text-xs">{percentageComfortPlus}% Rides</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={percentageComfortPlus}
                onChange={(e) => setPercentageComfortPlus(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Output card info */}
        <div className="w-full lg:w-[340px] bg-indigo-950 text-white rounded-2xl p-6 border border-indigo-800 flex flex-col justify-between items-stretch shadow-inner">
          <div className="flex flex-col gap-2 pb-4 border-b border-indigo-900">
            <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-wide">Projected Monthly Take-Home</span>
            <span className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400">
              ₹{(totalPartnerEarnings * 4).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-indigo-300">Equivalent to ₹{totalPartnerEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })} weekly gross</span>
          </div>

          <div className="my-6 flex flex-col gap-2.5 text-[10px] font-mono text-indigo-200">
            <div className="flex justify-between items-center">
              <span>Estimated Avg. Trip Rate:</span>
              <span className="font-bold text-white">₹{avgCostPerKm.toFixed(1)}/km</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Avg. Trip Distance (Est):</span>
              <span className="font-bold text-white">{averageTripDistanceKm} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Platform Service Commission:</span>
              <span className="font-bold text-emerald-300">5.0% (-₹{grossWeeklyEarnings * platformFeeCommission})</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Other major networks commission loss:</span>
              <span className="font-bold text-rose-300">-30.0% (-₹{grossWeeklyEarnings * 0.3})</span>
            </div>
          </div>

          <button
            onClick={onNavigateToConsole}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs rounded-xl tracking-tight uppercase shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer text-center"
          >
            Go Online & Onboard
          </button>
        </div>
      </section>

      {/* Onboarding Checklist */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 max-w-5xl mx-auto w-full select-none">
        <h3 className="text-xl font-bold tracking-tight text-white mb-6 font-display">Onboarding Roadmap for Partners</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2 p-4 bg-slate-950/60 border border-slate-850 rounded-xl relative">
            <FileText className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-[10px] font-mono text-slate-400">STEP 1</span>
            <h5 className="font-bold text-xs text-white">Form Fill & Files</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Submit active driver's license and city insurance files in the portal.</p>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-slate-950/60 border border-slate-850 rounded-xl relative">
            <Users className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] font-mono text-slate-400">STEP 2</span>
            <h5 className="font-bold text-xs text-white">Admin Clearance</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Municipal administrators review and approve credentials in the audit queue.</p>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-slate-950/60 border border-slate-850 rounded-xl relative">
            <CreditCard className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-[10px] font-mono text-slate-400">STEP 3</span>
            <h5 className="font-bold text-xs text-white">Wallet Seed</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">First 3 daily rides are free. Top-up wallet to maintain active priority eligibility.</p>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-slate-950/60 border border-slate-850 rounded-xl relative">
            <CheckCircle className="w-5 h-5 text-orange-400 mb-1" />
            <span className="text-[10px] font-mono text-slate-400">STEP 4</span>
            <h5 className="font-bold text-xs text-white">Toggle Active</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Set status to online, park near landmark spots and receive priority matches.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
