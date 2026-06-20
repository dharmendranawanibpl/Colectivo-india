import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  Navigation, 
  Info, 
  Clock, 
  X, 
  Car, 
  ShieldAlert,
  ArrowRight,
  Activity,
  Milestone,
  CheckCircle2
} from 'lucide-react';
import { CityData, Landmark, Ride, Driver } from '../types';

interface TrafficAlertOverlayProps {
  trafficLevel: 'light' | 'moderate' | 'heavy';
  city: CityData;
  weather?: string;
  activeRide?: Ride | null;
  drivers?: Driver[];
}

interface AlertNode {
  id: string;
  landmarkName: string;
  delayMinutes: number;
  avgSpeedKmh: number;
  congestionPercent: number;
  statusText: string;
  alternateRoute: string;
  affectedLanes: string;
}

export default function TrafficAlertOverlay({
  trafficLevel,
  city,
  weather = 'clear',
  activeRide,
  drivers
}: TrafficAlertOverlayProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState<AlertNode[]>([]);
  
  // Track initial distance to calculate progress percentages
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const activeRideIdRef = React.useRef<string>('');

  useEffect(() => {
    if (activeRide) {
      if (activeRide.id !== activeRideIdRef.current) {
        setInitialDistance(activeRide.distance || 1.0);
        activeRideIdRef.current = activeRide.id;
      }
    } else {
      setInitialDistance(null);
      activeRideIdRef.current = '';
    }
  }, [activeRide?.id, activeRide?.distance]);

  // Compute transit statistics
  let percentComplete = 0;
  let trackerStatusLabel = '';
  let activeDriver: Driver | undefined = undefined;

  if (activeRide && activeRide.driverId && drivers) {
    activeDriver = drivers.find(d => d.id === activeRide.driverId);
    if (activeDriver && activeDriver.path && activeDriver.path.length > 0) {
      const currentProgress = activeDriver.pathProgress || 0;
      const totalSteps = activeDriver.path.length;
      percentComplete = Math.min(100, Math.max(0, Math.round((currentProgress / totalSteps) * 100)));
    } else {
      const orig = initialDistance || activeRide.distance || 5;
      const curr = activeRide.distance || 0;
      const delta = Math.max(0, orig - curr);
      percentComplete = orig > 0 ? Math.min(99, Math.round((delta / orig) * 100)) : 0;
    }

    if (activeRide.status === 'picking_up') {
      trackerStatusLabel = 'En Route to Pickup';
    } else if (activeRide.status === 'arrived') {
      percentComplete = 100;
      trackerStatusLabel = 'Arrived at Pickup';
    } else if (activeRide.status === 'in_transit') {
      trackerStatusLabel = 'Heading to Destination';
    } else if (activeRide.status === 'completed') {
      percentComplete = 100;
      trackerStatusLabel = 'Arrived Safely';
    }
  }

  // Periodically fluctuate traffic speeds/stats subtle values for real-time live-simulation feel
  useEffect(() => {
    // Generate static contextual hotspots based on the active city landmarks
    const landmarks = city.landmarks && city.landmarks.length > 0 
      ? city.landmarks 
      : [
          { id: '1', name: 'Central Sector Union', x: 200, y: 300 },
          { id: '2', name: 'Metro Flyover Corner', x: 450, y: 150 },
          { id: '3', name: 'West Bypass Terminal', x: 100, y: 400 }
        ];

    const generateAlertNodesForCity = (): AlertNode[] => {
      let baseDelay = 1;
      let baseSpeed = 45;
      let baseCongestion = 15;

      if (trafficLevel === 'heavy') {
        baseDelay = 8;
        baseSpeed = 12;
        baseCongestion = 88;
      } else if (trafficLevel === 'moderate') {
        baseDelay = 4;
        baseSpeed = 26;
        baseCongestion = 45;
      }

      return landmarks.map((lm, idx) => {
        // Individualized values per landmark with a bit of deterministic variance
        const rngFactor = (idx * 7) % 5;
        const delay = Math.max(1, baseDelay + rngFactor);
        const avgSpeed = Math.max(5, baseSpeed - rngFactor * 1.5);
        const congestion = Math.min(99, baseCongestion + (idx * 4) % 15);
        
        let statusText = 'Normal speed active';
        let alternateRoute = 'Standard visual lanes';
        let affectedLanes = 'All lanes clear';

        if (trafficLevel === 'heavy') {
          statusText = 'Heavy Bottleneck';
          alternateRoute = `Circumvent via outer Ring road or bypass ${lm.name}`;
          affectedLanes = 'Left 2 lanes restricted due to pile-up';
        } else if (trafficLevel === 'moderate') {
          statusText = 'Medium Accumulation';
          alternateRoute = 'Minor delays, inner bypass route is optimal';
          affectedLanes = 'High merging volume near slip road';
        } else {
          statusText = 'Optimal Transit Speed';
          alternateRoute = 'Direct route is ideal, zero backlogs';
          affectedLanes = 'All channels operating flawlessly';
        }

        return {
          id: `node_alert_${lm.id}_${idx}`,
          landmarkName: lm.name,
          delayMinutes: delay,
          avgSpeedKmh: parseFloat(avgSpeed.toFixed(0)),
          congestionPercent: congestion,
          statusText,
          alternateRoute,
          affectedLanes
        };
      });
    };

    setActiveNodes(generateAlertNodesForCity());
    setSelectedAlertId(null);
  }, [trafficLevel, city.id, city.landmarks]);

  // Simulated live telemetry fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNodes(prev => 
        prev.map(node => {
          // Jitter speed + congestion to create dynamic "live telemetry feed" look
          const speedJitter = (Math.random() - 0.5) * 2;
          const congJitter = Math.floor((Math.random() - 0.5) * 4);
          return {
            ...node,
            avgSpeedKmh: Math.max(2, Math.min(100, Math.round(node.avgSpeedKmh + speedJitter))),
            congestionPercent: Math.max(5, Math.min(99, node.congestionPercent + congJitter))
          };
        })
      );
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) {
    return (
      <div className="absolute top-16 right-4 z-[400] pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 text-[10px] text-white font-extrabold uppercase font-mono tracking-widest px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg border border-slate-700 backdrop-blur-sm cursor-pointer"
          id="btn_restore_alerts_overlay"
        >
          <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Active Alerts ({activeNodes.length})</span>
        </motion.button>
      </div>
    );
  }

  // Find currently highlighted node
  const selectedNode = activeNodes.find(n => n.id === selectedAlertId);

  return (
    <div className="absolute inset-0 pointer-events-none z-[490]" id="traffic_alerts_overlay_component">
      {/* Sidebar/Floating panel of Hotspots */}
      <div className="absolute top-[75px] left-4 max-w-[260px] w-[calc(100%-2rem)] pointer-events-auto flex flex-col gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 shadow-xl backdrop-blur-md text-white flex flex-col gap-2"
        >
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className={`w-3.5 h-3.5 ${trafficLevel === 'heavy' ? 'text-rose-400 animate-pulse' : trafficLevel === 'moderate' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="font-extrabold text-[10px] tracking-wider uppercase font-display text-slate-200">
                Live Traffic Hotspots
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 transition-colors cursor-pointer"
              id="btn_dismiss_hotspots_panel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[9px] text-slate-400 leading-normal mb-1 font-sans">
            Grid metrics are currently experiencing <b className="text-slate-200">{trafficLevel} congestion</b>. Select a telemetry bubble to isolate routing details:
          </p>

          <div className="flex flex-col gap-1.5 max-h-[170px] overflow-y-auto pr-1" id="hotspots_scroll_container">
            {activeNodes.map((n) => {
              const isActive = selectedAlertId === n.id;
              return (
                <motion.div
                  key={n.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedAlertId(isActive ? null : n.id)}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                    isActive 
                      ? 'bg-slate-900 border-indigo-500' 
                      : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[9.5px] font-bold text-slate-100 truncate">{n.landmarkName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] text-slate-400 font-mono">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 opacity-70" />
                        +{n.delayMinutes}m
                      </span>
                      <span>•</span>
                      <span className={n.congestionPercent > 75 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {n.congestionPercent}% cap
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <span className={`text-[9px] font-extrabold font-mono px-1 py-0.2 rounded-md ${
                      trafficLevel === 'heavy'
                        ? 'bg-rose-500/10 text-rose-300'
                        : trafficLevel === 'moderate'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-emerald-500/10 text-emerald-300'
                    }`}>
                      {n.avgSpeedKmh} KMPH
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Stats Summary Footer inside panel */}
          <div className="flex items-center justify-between border-t border-slate-850/80 pt-1.5 mt-0.5 text-[8.5px] text-slate-400 font-mono">
            <span>Grid Speed: {trafficLevel === 'heavy' ? '12-15' : trafficLevel === 'moderate' ? '24-28' : '45-52'} km/h</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${trafficLevel === 'heavy' ? 'bg-rose-500' : trafficLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'} animate-ping`} />
              Auto-updating
            </span>
          </div>
        </motion.div>

        {/* Selected Area HUD details */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-indigo-950/95 border border-indigo-800 rounded-2xl p-3 text-indigo-100 flex flex-col gap-2 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[10px] tracking-wider uppercase font-extrabold font-display text-white">
                    Routing Insights
                  </h4>
                  <p className="text-[8px] opacity-70 font-mono">NODE: {selectedNode.landmarkName.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedAlertId(null)}
                  className="p-1 hover:bg-indigo-900 rounded text-indigo-300 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-indigo-900/40 p-2 rounded-xl text-center border border-indigo-800/30">
                <div className="flex flex-col">
                  <span className="text-[7.5px] uppercase opacity-70 tracking-tight font-mono">Delay Index</span>
                  <span className="text-sm font-bold font-mono text-white">+{selectedNode.delayMinutes} Mins</span>
                </div>
                <div className="flex flex-col border-l border-indigo-800/40">
                  <span className="text-[7.5px] uppercase opacity-70 tracking-tight font-mono">Velocity</span>
                  <span className="text-sm font-bold font-mono text-indigo-300">{selectedNode.avgSpeedKmh} KM/H</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[9px] leading-relaxed">
                <div className="flex items-start gap-1">
                  <span className="font-extrabold text-indigo-200 shrink-0 select-none">Lanes:</span>
                  <span className="text-indigo-200/90">{selectedNode.affectedLanes}</span>
                </div>
                <div className="flex items-start gap-1 mt-0.5 border-t border-indigo-800/40 pt-1">
                  <Navigation className="w-3 h-3 text-indigo-300 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-white text-[8.5px]">Alternative safe route:</span>
                    <span className="text-[8.5px] text-indigo-200/90">{selectedNode.alternateRoute}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pulsing overlay zones indicating map safety on bottom right for smart navigation summary context */}
      <div className="absolute bottom-16 left-4 z-[400] pointer-events-auto max-w-[260px] w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-white/90 shadow-lg backdrop-blur-sm flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-rose-400 font-semibold text-xs border border-slate-700 shrink-0">
            {trafficLevel === 'heavy' ? '⚠️' : trafficLevel === 'moderate' ? '⚡' : '🟢'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] font-extrabold tracking-wide uppercase font-display text-slate-200">
                Traffic Dispatch
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[8.5px] text-slate-400 leading-tight mt-0.5">
              {trafficLevel === 'heavy' 
                ? 'High ETA buffers. High dynamic pricing active.' 
                : trafficLevel === 'moderate'
                  ? 'Nominal delays recorded. Dispatch queues stable.'
                  : 'Fast match speeds. Excellent transit windows.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ----------------- INTUITIVE IN-TRANSIT PROGRESS TRACKER HUD ----------------- */}
      <AnimatePresence>
        {activeRide && activeRide.driverId && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-4 left-1/2 z-[502] w-[calc(100%-2rem)] max-w-[420px] pointer-events-auto"
            id="ride_transit_tracker_hud"
          >
            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white flex flex-col gap-3">
              {/* Header metadata */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      activeRide.status === 'in_transit' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      activeRide.status === 'in_transit' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></span>
                  </div>
                  <span className="font-extrabold text-[9.5px] uppercase tracking-widest font-mono text-slate-300">
                    {trackerStatusLabel}
                  </span>
                </div>
                {activeDriver && (
                  <div className="text-[8.5px] text-slate-400 font-mono flex items-center gap-1">
                    <span>Pilot: <b className="text-white">{activeDriver.name}</b></span>
                    <span className="opacity-50">•</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">{activeDriver.plate}</span>
                  </div>
                )}
              </div>

              {/* Transit Destinations visual */}
              <div className="flex items-center justify-between text-xs font-sans gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[7.5px] text-slate-400 uppercase tracking-wider block font-mono">Pickup</span>
                  <span className="font-bold text-slate-100 truncate block text-[11px]">{activeRide.pickup.name}</span>
                </div>
                <div className="shrink-0 flex items-center justify-center text-slate-500">
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <span className="text-[7.5px] text-slate-400 uppercase tracking-wider block font-mono">Destination</span>
                  <span className="font-bold text-indigo-300 truncate block text-[11px]">{activeRide.dropoff.name}</span>
                </div>
              </div>

              {/* Visual dynamic progress timeline */}
              <div className="relative mt-1 pb-1">
                {/* Background track line */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                  {/* Colored progress percentage fill */}
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${
                      activeRide.status === 'in_transit' ? 'bg-gradient-to-r from-indigo-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-amber-500'
                    }`}
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>

                {/* Left Origin Pin */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-950 flex items-center justify-center shadow" />

                {/* Right Destination Pin */}
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow">
                  {percentComplete === 100 && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-white animate-bounce" />
                  )}
                </div>

                {/* Auto sliding entity (car/driver marker) */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out flex flex-col items-center z-10"
                  style={{ left: `${percentComplete}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`p-1 rounded-full border shadow-xl flex items-center justify-center ${
                    activeRide.status === 'in_transit' 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : 'bg-amber-600 border-amber-400 text-white'
                  }`}>
                    <Car className="w-3 h-3 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Numerical Metrics Summary Block */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 border border-slate-800/40 p-2 rounded-xl text-center mt-0.5">
                <div className="flex flex-col items-center">
                  <span className="text-[7.5px] uppercase text-slate-400 font-mono tracking-tight">Remaining Dist.</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Milestone className="w-3 h-3 text-indigo-400" />
                    <span className="text-[11px] font-extrabold font-mono text-white">
                      {activeRide.distance > 0 ? activeRide.distance.toFixed(1) : 'Arrived'} Kms
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center border-l border-r border-slate-800/60">
                  <span className="text-[7.5px] uppercase text-slate-400 font-mono tracking-tight">ETA Buffer</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-extrabold font-mono text-emerald-300">
                      {activeRide.eta > 0 ? `${activeRide.eta} Min` : '0 Min'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[7.5px] uppercase text-slate-400 font-mono tracking-tight">Completed</span>
                  <span className={`text-[11px] font-extrabold font-mono mt-0.5 ${
                    percentComplete > 75 ? 'text-emerald-400' : 'text-indigo-300'
                  }`}>
                    {percentComplete}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
