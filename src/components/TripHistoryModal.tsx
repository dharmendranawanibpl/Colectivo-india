import React from 'react';
import { 
  X, 
  MapPin, 
  CircleDot, 
  History, 
  User, 
  Star, 
  Trash2, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { PastTrip, CityId } from '../types';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: PastTrip[];
  onClearHistory?: () => void;
}

export default function TripHistoryModal({
  isOpen,
  onClose,
  trips,
  onClearHistory,
}: TripHistoryModalProps) {
  if (!isOpen) return null;

  // City Accent Styling helper
  const getCityAccent = (cityId: CityId) => {
    switch (cityId) {
      case 'delhi':
        return {
          bg: 'bg-amber-500/10 border-amber-200/60',
          text: 'text-amber-700',
          dot: 'bg-amber-500',
          label: 'DELHI'
        };
      case 'mumbai':
        return {
          bg: 'bg-blue-500/10 border-blue-200/60',
          text: 'text-blue-700',
          dot: 'bg-blue-500',
          label: 'MUMBAI'
        };
      case 'bengaluru':
        return {
          bg: 'bg-emerald-500/10 border-emerald-200/60',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500',
          label: 'BENGALURU'
        };
      case 'kolkata':
        return {
          bg: 'bg-pink-500/10 border-pink-200/60',
          text: 'text-pink-700',
          dot: 'bg-pink-500',
          label: 'KOLKATA'
        };
      default:
        return {
          bg: 'bg-indigo-505/10 border-indigo-200/60',
          text: 'text-indigo-700',
          dot: 'bg-indigo-500',
          label: cityId.toUpperCase()
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="trip_history_modal_outer">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" 
        onClick={onClose}
        id="trip_history_backdrop"
      />
      
      {/* Modal Container */}
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scaleIn"
        id="trip_history_content_box"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-black font-display uppercase">Trip History</h2>
              <p className="text-[10px] text-slate-400 font-mono font-semibold tracking-wider uppercase">Recent Colectivo Activities</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-100 bg-white text-slate-500 hover:text-black hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            id="trip_history_close_x"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-4">
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-white border border-slate-200 rounded-2xl p-6" id="history_empty_state">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Compass className="w-6 h-6 text-slate-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-black">No completed rides</h4>
                <p className="text-xs text-slate-500 max-w-[240px] mt-1 font-medium mx-auto">
                  Rides booked during active dispatcher sessions appear here after they are fully rated and completed.
                </p>
              </div>
            </div>
          ) : (
            trips.map((trip) => {
              const cityStyle = getCityAccent(trip.cityId);
              return (
                <div 
                  key={trip.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-350 hover:shadow-md flex flex-col gap-4"
                  id={`trip_history_card_${trip.id}`}
                >
                  {/* Top line with Date, City tags and price */}
                  <div className="flex justify-between items-center leading-none">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-[8px] font-mono font-black border uppercase tracking-wider ${cityStyle.bg} ${cityStyle.text}`}>
                        {cityStyle.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {trip.timestamp}
                      </span>
                    </div>
                    <div>
                      <span className="text-base font-extrabold font-mono text-black">
                        ₹{trip.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Route information panel */}
                  <div className="relative pl-5 flex flex-col gap-3 pb-1">
                    <div className="absolute left-1.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dotted border-slate-200"></div>
                    
                    {/* Pickup Node */}
                    <div className="relative flex items-center gap-2.5 text-xs">
                      <CircleDot className="w-3.5 h-3.5 text-emerald-500 absolute -left-[19px] bg-white shrink-0" />
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold leading-none">Pickup</span>
                        <span className="font-semibold text-slate-800 font-sans block mt-1">{trip.pickupName}</span>
                      </div>
                    </div>

                    {/* Dropoff Node */}
                    <div className="relative flex items-center gap-2.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 absolute -left-[19px] bg-white shrink-0" />
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold leading-none">Dropoff Destination</span>
                        <span className="font-semibold text-slate-800 font-sans block mt-1">{trip.dropoffName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="h-[1px] bg-slate-100"></div>

                  {/* Bottom Driver Profile & Service specifications */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-150 flex items-center justify-center text-lg select-none">
                        {trip.driverAvatar || '🚗'}
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold text-black block leading-tight">{trip.driverName}</span>
                        <span className="text-[9px] text-slate-450 text-slate-400 block leading-tight mt-0.5 font-medium">{trip.vehicleName}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                        {trip.tierName} • {trip.distance.toFixed(1)} km
                      </span>
                      {trip.rating ? (
                        <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${
                                i < (trip.rating || 0) 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-200'
                              }`} 
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium font-mono uppercase">Not Rated</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          {onClearHistory && trips.length > 0 ? (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 text-xs font-bold font-mono transition-colors border border-transparent hover:border-rose-100 hover:bg-rose-50/50 px-3 py-1.5 rounded-xl cursor-pointer"
              id="btn_clear_trip_history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR REGISTER</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="bg-black hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            id="trip_history_close_footer"
          >
            CLOSE REGISTER
          </button>
        </div>
      </div>
    </div>
  );
}
