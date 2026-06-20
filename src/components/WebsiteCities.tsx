import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Sun, CloudRain, Moon, Shield, Sparkles, Navigation, Globe } from 'lucide-react';
import { CityData, CityId } from '../types';

interface WebsiteCitiesProps {
  cities: CityData[];
  currentCityId: CityId;
  onChangeCity: (id: CityId) => void;
  onNavigateToConsole: () => void;
  weather: 'sunny' | 'rainy' | 'night';
  trafficLevel: 'light' | 'moderate' | 'heavy';
  comfortRate: number;
  comfortPlusRate: number;
}

export default function WebsiteCities({
  cities,
  currentCityId,
  onChangeCity,
  onNavigateToConsole,
  weather,
  trafficLevel,
  comfortRate,
  comfortPlusRate,
}: WebsiteCitiesProps) {
  const [selectedState, setSelectedState] = useState<string>('All States');

  const distinctStates = ['All States', ...Array.from(new Set(cities.map(c => c.state))).filter(Boolean).sort()];

  const filteredCities = selectedState === 'All States'
    ? cities
    : cities.filter(c => c.state === selectedState);

  return (
    <div className="w-full bg-slate-50 text-slate-800 flex flex-col gap-8 font-sans select-none text-left" id="website_cities_page">
      {/* Header section */}
      <div className="flex flex-col gap-2 max-w-4xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-150 rounded-full w-fit">
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-indigo-600 font-mono text-[10px] font-bold uppercase tracking-wider">Active Operations Network</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">
          Operating Across Key Urban Clusters
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Colectivo's smart grid topology and real-time localized dispatcher runs autonomously within dynamic metropolis borders. Select a city below to view active localized telemetry or test live dispatch paths.
        </p>
      </div>

      {/* State Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white border border-slate-205 p-4 rounded-2xl shadow-sm max-w-5xl w-full mx-auto">
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Operations Region filter</span>
          <span className="text-[10px] text-slate-400 font-medium">Select a state to shorten and view corresponding active operating cities list.</span>
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
        >
          {distinctStates.map(st => (
            <option key={st} value={st}>{st === 'All States' ? '🇮🇳 All Indian States' : st}</option>
          ))}
        </select>
      </div>

      {/* Grid of Cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
        {filteredCities.map((city) => {
          const isSelected = currentCityId === city.id;
          return (
            <div
              key={city.id}
              onClick={() => onChangeCity(city.id)}
              className={`group bg-white rounded-2xl p-6 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-[340px] shadow-sm ${
                isSelected 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/10' 
                  : 'border-slate-200 hover:border-slate-350 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">{city.country}</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight group-hover:text-indigo-600 transition-colors uppercase font-display">
                    {city.name}
                  </h3>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black tracking-tight ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {isSelected ? 'ACTIVE Focus' : 'CLICK TO SELECT'}
                </span>
              </div>

              {/* Landmark showcase */}
              <div className="my-4 flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Key Landmark Coordinates</span>
                <div className="grid grid-cols-2 gap-2">
                  {city.landmarks.slice(0, 4).map((landmark) => (
                    <div key={landmark.id} className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-semibold text-slate-600 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{landmark.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operations metrics and dynamic rate table */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <span className="text-[8px] font-mono text-slate-400 block uppercase">Comfort Base</span>
                    <span className="text-xs font-bold text-slate-800">₹{comfortRate.toFixed(2)}/km</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-400 block uppercase">Comfort+ Base</span>
                    <span className="text-xs font-bold text-slate-800">₹{comfortPlusRate.toFixed(2)}/km</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToConsole();
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-wider rounded-xl transition-all flex items-center gap-1 uppercase"
                    >
                      <span>View Live Map</span>
                      <Navigation className="w-3 h-3 animate-pulse" />
                    </button>
                  ) : (
                    <span className="text-slate-400 font-semibold group-hover:text-slate-600 transition-colors">Select City</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time telemetry system logs teaser */}
      <section className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto w-full border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Adaptive Municipal Dispatch Controls</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Platform responds dynamically to current micro-climate environments and active rush hours.
            </p>
          </div>

          <div className="flex gap-3 bg-neutral-900 border border-slate-800 rounded-xl p-2 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500 font-sans">Active Weather:</span>
              <span className="capitalize font-bold text-amber-400 flex items-center gap-1">
                {weather === 'sunny' && <Sun className="w-3 h-3 text-amber-500" />}
                {weather === 'rainy' && <CloudRain className="w-3 h-3 text-sky-400" />}
                {weather === 'night' && <Moon className="w-3 h-3 text-indigo-400" />}
                {weather}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3 flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500 font-sans">Grid Traffic:</span>
              <span className="capitalize font-bold text-red-400">{trafficLevel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-mono">
          <div className="p-4 bg-neutral-900/50 border border-slate-850 rounded-xl text-[10px]">
            <h4 className="font-extrabold text-slate-400 mb-1.5 uppercase text-[9px] tracking-wider">Dynamic Multiplier Algorithm</h4>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Base tariff scales programmatically from <strong className="text-orange-400">1.0x to 2.5x</strong> under heavy monsoon rainfall or deep night scenarios to prompt partners online.
            </p>
          </div>
          <div className="p-4 bg-neutral-900/50 border border-slate-850 rounded-xl text-[10px]">
            <h4 className="font-extrabold text-slate-400 mb-1.5 uppercase text-[9px] tracking-wider">Localized GIS Intersections</h4>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Grid layout defines clear Manhattan coordinate streets with customized path algorithms ensuring precise step progress calculations.
            </p>
          </div>
          <div className="p-4 bg-neutral-900/50 border border-slate-850 rounded-xl text-[10px]">
            <h4 className="font-extrabold text-slate-400 mb-1.5 uppercase text-[9px] tracking-wider">Audit Security Clearance</h4>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Every city features an active registration checklist. Unverified or blocked drivers cannot receive any matching priority notifications.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
