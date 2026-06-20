import React from 'react';
import { 
  Building2, 
  Sun, 
  CloudRain, 
  Moon, 
  Hourglass, 
  Coins, 
  Activity, 
  Users, 
  Sparkles, 
  Compass, 
  Play, 
  Square,
  HelpCircle
} from 'lucide-react';
import { CityData, PresetScenario, CityId } from '../types';
import { CITIES, PRESET_SCENARIOS } from '../constants/cities';

interface DashboardStatsProps {
  currentCity: CityData;
  onChangeCity: (cityId: CityId) => void;
  activeScenarioId: string;
  onChangeScenario: (scenario: PresetScenario) => void;
  simulationEarnings: number;
  completedTripsCount: number;
  averageRating: number;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  driversOnlineCount: number;
  surgeMultiplier: number;
}

export default function DashboardStats({
  currentCity,
  onChangeCity,
  activeScenarioId,
  onChangeScenario,
  simulationEarnings,
  completedTripsCount,
  averageRating,
  autoPlay,
  onToggleAutoPlay,
  driversOnlineCount,
  surgeMultiplier,
}: DashboardStatsProps) {
  const [isLocatingStats, setIsLocatingStats] = React.useState(false);
  const [statsLocateMsg, setStatsLocateMsg] = React.useState<string | null>(null);

  const handleStatsLocate = () => {
    if (!navigator.geolocation) {
      setStatsLocateMsg("Geolocation not supported");
      return;
    }
    setIsLocatingStats(true);
    setStatsLocateMsg("Pinpointing GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        
        let nearestHub = CITIES[0];
        let minDistance = Infinity;
        
        for (const city of CITIES) {
          const distance = Math.pow(uLat - city.center.lat, 2) + Math.pow(uLng - city.center.lng, 2);
          if (distance < minDistance) {
            minDistance = distance;
            nearestHub = city;
          }
        }
        
        onChangeCity(nearestHub.id);
        setIsLocatingStats(false);
        setStatsLocateMsg(`Detected closest hub: ${nearestHub.name}`);
        setTimeout(() => setStatsLocateMsg(null), 6000);
      },
      (err) => {
        setIsLocatingStats(false);
        setStatsLocateMsg("GPS Signal Error / Timeout");
        setTimeout(() => setStatsLocateMsg(null), 5000);
      },
      { timeout: 5000 }
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 flex flex-col gap-6 shadow-sm" id="dashboard_stats_panel">
      
      {/* Dynamic Geolocation Hub Node */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase font-mono">Location Network Zone</span>
            <span className="text-xs font-black text-slate-900 mt-0.5">{currentCity.name}, {currentCity.country}</span>
          </div>
          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-tight border border-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            GPS ACTIVE
          </span>
        </div>

        <div className="text-[10px] text-slate-650 text-slate-600 font-medium">
          Active Central Base: <span className="font-mono font-bold text-slate-800">{currentCity.center.lat.toFixed(4)}° N, {currentCity.center.lng.toFixed(4)}° E</span>
        </div>

        <button
          onClick={handleStatsLocate}
          disabled={isLocatingStats}
          className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 text-slate-700 font-black text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:border-slate-300 disabled:opacity-50"
          id="btn_stats_auto_locate"
        >
          <span>🎯</span>
          <span>{isLocatingStats ? 'SCANNING COORDINATES...' : 'AUTO-LOCATE NEAREST DISPATCH HUB'}</span>
        </button>

        {statsLocateMsg && (
          <div className="text-[9px] text-indigo-600 font-extrabold font-mono text-center animate-pulse tracking-wide uppercase">
            {statsLocateMsg}
          </div>
        )}
      </div>

      {/* Global Ride-Share Metrics Grid */}
      <div>
        <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase font-mono block mb-3">Global Network Metrics</span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 items-start transition-colors hover:border-slate-300">
            <Coins className="w-5 h-5 text-black shrink-0 mb-1" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Total Dispatch Margin</span>
            <span className="text-base font-extrabold font-mono text-black leading-tight">
              ₹{simulationEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[8px] text-slate-400 font-semibold">Includes fare rate markups</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 items-start transition-colors hover:border-slate-300">
            <Activity className="w-5 h-5 text-indigo-600 shrink-0 mb-1" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Active Ride Index</span>
            <span className="text-base font-extrabold font-mono text-black leading-tight">
              {completedTripsCount} Trips
            </span>
            <p className="text-[8px] text-emerald-600 font-bold">100% matched dispatch</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 items-start transition-colors hover:border-slate-300">
            <Users className="w-5 h-5 text-slate-700 shrink-0 mb-1" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Drivers Online</span>
            <span className="text-base font-extrabold font-mono text-black leading-tight">
              {driversOnlineCount} Cars
            </span>
            <p className="text-[8px] text-slate-400 font-semibold">Autonomous roamers</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 items-start transition-colors hover:border-slate-300">
            <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mb-1" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Satisfaction Index</span>
            <span className="text-base font-extrabold font-mono text-indigo-600 leading-tight">
              {completedTripsCount > 0 ? `★ ${averageRating.toFixed(1)}` : 'N/A'}
            </span>
            <p className="text-[8px] text-slate-450 text-slate-400 font-semibold">Total average rating</p>
          </div>
        </div>
      </div>

      {/* Climate & Traffic Scenarios Presets */}
      <div>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono block mb-3">Live Environment presets (Surges)</span>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESET_SCENARIOS.map(sc => {
            const isSel = activeScenarioId === sc.id;
            
            // Icon resolver
            let IconComp = Sun;
            if (sc.iconName === 'Sun') IconComp = Sun;
            else if (sc.iconName === 'CloudRain') IconComp = CloudRain;
            else if (sc.iconName === 'Moon') IconComp = Moon;
            else if (sc.iconName === 'Hourglass') IconComp = Hourglass;

            return (
              <button
                key={sc.id}
                onClick={() => onChangeScenario(sc)}
                className={`text-left p-3.5 rounded-2xl transition-all border outline-none flex items-start gap-3 cursor-pointer ${
                  isSel 
                    ? 'bg-slate-50 text-slate-900 border-black scale-[1.015] shadow-md' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
                id={`scenario_btn_${sc.id}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSel ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <IconComp className="w-4 h-4" />
                </div>
                
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block text-black leading-tight">{sc.name}</span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5 leading-tight truncate max-w-[170px]">{sc.description}</span>
                  <span className={`text-[8px] font-extrabold uppercase font-mono block mt-1 ${isSel ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                    Fare Mult: x{sc.surgeMultiplier}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Autoplay / AI Demo Operations Engine */}
      <div className="bg-slate-50 border border-slate-205 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-[320px]">
          <h4 className="font-extrabold text-xs text-black leading-tight flex items-center gap-1.5 font-display uppercase text-[11px]">
            <span className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span>Autonomous Activity Mode</span>
          </h4>
          <p className="text-[9px] text-slate-450 text-slate-500 mt-1 leading-normal font-medium">
            Toggle automated mode to trigger automatic passenger bookings, driver coordination, and corner-by-corner transit routing inside the map node network.
          </p>
        </div>

        <button
          onClick={onToggleAutoPlay}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all cursor-pointer border ${
            autoPlay 
              ? 'bg-black text-white border-black shadow-md' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
          }`}
          id="btn_autoplay_toggle"
        >
          {autoPlay ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP DEMO</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START DEMO</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
