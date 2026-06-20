import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import { CityData, Landmark } from '../types';
import { getLatLngFromGrid } from '../utils/routing';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Info, Sparkles, TrendingUp } from 'lucide-react';

interface SurgeVisualizerProps {
  map: L.Map | null;
  city: CityData;
  surgeMultiplier: number;
  isVisible: boolean;
}

interface ProjectedHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  x: number; // projected container pixel coordinates
  y: number;
  baseSurge: number;
  currentSurge: number;
  intensity: number; // 0 to 1 scale matching demand intensity
  radius: number;
}

export default function SurgeVisualizer({
  map,
  city,
  surgeMultiplier = 1.0,
  isVisible
}: SurgeVisualizerProps) {
  const [projectedPoints, setProjectedPoints] = useState<ProjectedHotspot[]>([]);
  const [, setForceUpdate] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive coordinates and calculate live surge multipliers for landmarks
  const getHotspots = (): { id: string; name: string; lat: number; lng: number; baseSurge: number }[] => {
    if (!city.landmarks) return [];
    
    // Assign varying base demands to different landmarks to make the visual interesting
    return city.landmarks.map((landmark, index) => {
      const pos = landmark.lat && landmark.lng 
        ? { lat: landmark.lat, lng: landmark.lng } 
        : getLatLngFromGrid(landmark.x, landmark.y, city.id);

      // Distribute demand base levels (some hotspots are inherently busier like transit stations, central areas)
      let baseFactor = 1.0;
      if (landmark.icon === 'Train' || landmark.icon === 'Building2' || landmark.icon === 'Flame') {
        baseFactor = 1.5; // Busy transit hub or financial district or hotspot
      } else if (landmark.icon === 'Sparkles' || landmark.icon === 'Zap') {
        baseFactor = 1.3;
      } else {
        baseFactor = 1.0;
      }

      return {
        id: landmark.id,
        name: landmark.name,
        lat: pos.lat,
        lng: pos.lng,
        baseSurge: baseFactor
      };
    });
  };

  // Re-project geo coordinates (lat, lng) to page container pixel coordinates (x, y)
  const projectPoints = () => {
    if (!map) return;

    const hotspots = getHotspots();
    const projected = hotspots.map(spot => {
      try {
        const point = map.latLngToContainerPoint([spot.lat, spot.lng]);
        
        // Dynamic surge factor combining the city-wide surgeMultiplier and landmark specific weighting
        const currentSurge = Math.max(1.0, Number((spot.baseSurge * surgeMultiplier).toFixed(2)));
        
        // Map current surge to a visual intensity coefficient between 0 and 1
        const maxExpectedSurge = 3.0;
        const intensity = Math.min(1.0, Math.max(0, (currentSurge - 1.0) / (maxExpectedSurge - 1.0)));

        // Create d3 scale for mapping intensity to circle radius
        const radiusScale = d3.scaleLinear()
          .domain([0, 1])
          .range([55, 130]); // Glowing radius size

        return {
          ...spot,
          x: point.x,
          y: point.y,
          currentSurge,
          intensity,
          radius: radiusScale(intensity)
        };
      } catch (e) {
        // Fallback standard points if projecting fails temporarily
        return null;
      }
    }).filter((p): p is ProjectedHotspot => p !== null);

    setProjectedPoints(projected);
  };

  // Register Leaflet event listeners to trigger recalculations when dragging or zooming
  useEffect(() => {
    if (!map) return;

    projectPoints();

    const handleMapChange = () => {
      projectPoints();
    };

    map.on('move', handleMapChange);
    map.on('zoom', handleMapChange);
    map.on('viewreset', handleMapChange);

    // Refresh layout periodically to adjust pulsing values smoothly
    const interval = setInterval(() => {
      setForceUpdate(p => p + 1);
      projectPoints();
    }, 3000);

    return () => {
      map.off('move', handleMapChange);
      map.off('zoom', handleMapChange);
      map.off('viewreset', handleMapChange);
      clearInterval(interval);
    };
  }, [map, city.id, surgeMultiplier]);

  if (!isVisible || projectedPoints.length === 0) return null;

  // D3 color interpolator scale for glowing hot spots
  // From gold/orange at mid demands to bright solid red/pink at highest surges
  const getColorForIntensity = (intensity: number) => {
    // We use d3's sequential yellow-orange-red interpolator
    const customInterpolator = d3.interpolateRgbBasis([
      'rgba(234, 179, 8, 0.12)',  // Amber/yellow low intensity
      'rgba(249, 115, 22, 0.35)', // Orange medium intensity
      'rgba(239, 68, 68, 0.65)',  // Red high intensity
      'rgba(219, 39, 119, 0.8)'   // Deep hot pink ultra intensity
    ]);
    return customInterpolator(intensity);
  };

  const borderScale = d3.scaleLinear<string>()
    .domain([0, 0.5, 1])
    .range(['rgba(234, 179, 8, 0.4)', 'rgba(249, 115, 22, 0.7)', 'rgba(239, 68, 68, 0.95)']);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-[490] pointer-events-none w-full h-full"
      style={{ mixBlendMode: 'screen' }}
      id="colectivo_surge_heatmap_overlay"
    >
      <svg className="w-full h-full absolute inset-0">
        <defs>
          {/* Dynamic Radial Gradients created with D3-like interpolations for each hotspot */}
          {projectedPoints.map((spot) => {
            const stopColorInner1 = spot.intensity > 0.7 
              ? 'rgba(239, 68, 68, 0.6)' 
              : spot.intensity > 0.4 
                ? 'rgba(249, 115, 22, 0.45)' 
                : 'rgba(234, 179, 8, 0.3)';
            
            const stopColorInner2 = spot.intensity > 0.7 
              ? 'rgba(219, 39, 119, 0.25)' 
              : spot.intensity > 0.4 
                ? 'rgba(239, 68, 68, 0.15)' 
                : 'rgba(249, 115, 22, 0.1)';

            return (
              <radialGradient 
                key={`grad-${spot.id}`} 
                id={`surge-grad-${spot.id}`}
                cx="50%" cy="50%" r="50%" fx="50%" fy="50%"
              >
                <stop offset="0%" stopColor={stopColorInner1} />
                <stop offset="35%" stopColor={spot.intensity > 0.5 ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.18)'} />
                <stop offset="70%" stopColor={stopColorInner2} />
                <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
              </radialGradient>
            );
          })}
        </defs>

        {/* Heatmap Layer */}
        <g>
          {projectedPoints.map((spot) => (
            <g key={`group-${spot.id}`}>
              {/* Outer pulsing visual ripple */}
              <circle
                cx={spot.x}
                cy={spot.y}
                r={spot.radius * 1.25}
                fill={`url(#surge-grad-${spot.id})`}
                className="transition-all duration-700"
              />

              {/* Pulsing Core Hotspot Circle */}
              <circle
                cx={spot.x}
                cy={spot.y}
                r={spot.radius * 0.75}
                fill={`url(#surge-grad-${spot.id})`}
                stroke={borderScale(spot.intensity)}
                strokeWidth={spot.intensity > 0.5 ? '1.5' : '0.75'}
                strokeDasharray="4 3"
                opacity={0.8}
                className="transition-all duration-700 animate-pulse"
              />

              {/* Central glowing core pinpoint */}
              <circle
                cx={spot.x}
                cy={spot.y}
                r={6}
                fill={spot.intensity > 0.7 ? '#ec4899' : spot.intensity > 0.4 ? '#f97316' : '#eab308'}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="shadow-lg"
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Floating HTML micro-badges with surge multipliers on top of nodes */}
      <AnimatePresence>
        {projectedPoints.map((spot) => (
          <div
            key={`badge-${spot.id}`}
            style={{ 
              position: 'absolute', 
              left: `${spot.x}px`, 
              top: `${spot.y - 14}px`, 
              transform: 'translate(-50%, -100%)' 
            }}
            className="flex flex-col items-center gap-0.5 filter drop-shadow-md select-none pointer-events-none"
          >
            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black font-mono tracking-wider flex items-center gap-1 border ${
              spot.intensity > 0.7 
                ? 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-900/40' 
                : spot.intensity > 0.4
                  ? 'bg-amber-950/95 border-amber-500 text-amber-200 shadow-amber-900/40'
                  : 'bg-slate-900/95 border-slate-700 text-slate-300'
            }`}>
              {spot.intensity > 0.5 && <Flame className="w-2.5 h-2.5 text-rose-400 animate-bounce" />}
              <span>{spot.currentSurge}x Surge</span>
            </div>
            
            <div className="bg-slate-950/90 text-[7px] text-slate-400 font-sans px-1.5 py-0.5 rounded uppercase tracking-tight scale-90 border border-slate-800/50 truncate max-w-[100px]">
              {spot.name}
            </div>
            
            {/* Direct connection tail indicator */}
            <div className={`w-1 h-1 rotate-45 border-r border-b ${
              spot.intensity > 0.7 ? 'bg-rose-950 border-rose-500' : spot.intensity > 0.4 ? 'bg-amber-950 border-amber-500' : 'bg-slate-900 border-slate-700'
            }`} />
          </div>
        ))}
      </AnimatePresence>

      {/* Surge Heatmap Informative Visual Legend */}
      <div className="absolute bottom-[90px] right-4 z-[501] pointer-events-auto max-w-[160px] animate-fadeIn">
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-2 shadow-2xl backdrop-blur-md text-white flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-1">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span className="font-extrabold text-[8px] uppercase tracking-widest text-slate-300 font-mono">Surge Heatmap</span>
          </div>

          <div className="flex flex-col gap-1">
            {/* Color spectrum gradient bar */}
            <div className="h-2 w-full rounded bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500 border border-slate-800/50" />
            <div className="flex justify-between text-[7px] font-mono text-slate-400">
              <span>Standard (1.0x)</span>
              <span>Hot (3.0x+)</span>
            </div>
          </div>

          <div className="space-y-0.5 text-[7px] text-slate-400 font-sans leading-tight pl-0.5 border-l border-orange-500/50">
            <span className="text-white font-semibold">Live Indicators Map:</span>
            <p>Hotspots reflect user requested ride densities and ambient weather congestion surges.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
