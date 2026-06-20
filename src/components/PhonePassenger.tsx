import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  MapPinCheck,
  Search, 
  Car, 
  Clock, 
  ChevronRight, 
  Plus, 
  Percent, 
  Wallet, 
  CircleDot, 
  Send,
  Star,
  Sparkles,
  User,
  ShieldCheck,
  Bike,
  Truck,
  ArrowRight,
  Navigation,
  Lock,
  Mail,
  AlertCircle,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { CityData, Landmark, VehicleConfig, Ride, ChatMessage, PromoCode, VehicleTier, Rider } from '../types';
import { VEHICLE_CONFIGS, CITIES } from '../constants/cities';
import { getGridFromLatLng, calculateRouteDetails } from '../utils/routing';

const tierIconMap: Record<string, React.ComponentType<any>> = {
  Car: Car,
  Sparkles: Sparkles,
  Truck: Truck,
  ShieldCheck: ShieldCheck,
  Bike: Bike,
};

interface PhonePassengerProps {
  city: CityData;
  activeRide: Ride | null;
  selectedPickup: Landmark | null;
  selectedDropoff: Landmark | null;
  onSelectLandmark: (landmark: Landmark, type: 'pickup' | 'dropoff') => void;
  onRequestRide: (tier: VehicleTier, promoCode: string) => void;
  onCancelRide: () => void;
  onSendChatMessage: (text: string) => void;
  onCompleteRating: (rating: number, feedback: string) => void;
  walletBalance: number;
  onTopUpWallet: (amount: number) => void;
  surgeMultiplier: number;
  promoCodeApplied: PromoCode | null;
  onApplyPromoCode: (code: string) => string | null; // returns error message or null if success
  onClearPromoCode: () => void;
  // Auth Props
  currentRider: Rider | null;
  onRiderLogin: (email: string, pass: string) => string | null;
  onRiderRegister: (name: string, email: string, pass: string, initialBalance: number) => void;
  onRiderLogout: () => void;
  comfortRate: number;
  comfortPlusRate: number;
  appColorTheme?: 'orange' | 'yellow' | 'green';
  // Search Synchronizer props
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  activeSearchType?: 'pickup' | 'dropoff';
  setActiveSearchType?: (t: 'pickup' | 'dropoff') => void;
  googlePlaces?: any[];
  setGooglePlaces?: (places: any[]) => void;
  isSearchingGoogle?: boolean;
  setIsSearchingGoogle?: (b: boolean) => void;
  isSearching?: boolean;
  setIsSearching?: (b: boolean) => void;
  onChangeCity?: (cityId: string) => void;
  trafficLevel?: 'light' | 'moderate' | 'heavy';
}

export default function PhonePassenger({
  city,
  activeRide,
  selectedPickup,
  selectedDropoff,
  onSelectLandmark,
  onRequestRide,
  onCancelRide,
  onSendChatMessage,
  onCompleteRating,
  walletBalance,
  onTopUpWallet,
  surgeMultiplier,
  promoCodeApplied,
  onApplyPromoCode,
  onClearPromoCode,
  currentRider,
  onRiderLogin,
  onRiderRegister,
  onRiderLogout,
  comfortRate,
  comfortPlusRate,
  onChangeCity,
  appColorTheme = 'orange',
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  activeSearchType: propActiveSearchType,
  setActiveSearchType: propSetActiveSearchType,
  googlePlaces: propGooglePlaces,
  setGooglePlaces: propSetGooglePlaces,
  isSearchingGoogle: propIsSearchingGoogle,
  setIsSearchingGoogle: propSetIsSearchingGoogle,
  isSearching: propIsSearching,
  setIsSearching: propSetIsSearching,
  trafficLevel = 'light',
}: PhonePassengerProps) {
  const themeColor = appColorTheme;

  // Dynamic Theme Styling configurations
  const btnThemeBg = themeColor === 'orange'
    ? 'bg-orange-600 hover:bg-orange-700 text-white'
    : themeColor === 'yellow'
      ? 'bg-amber-400 hover:bg-amber-500 text-black font-extrabold'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white';

  const textThemeAccent = themeColor === 'orange'
    ? 'text-orange-600'
    : themeColor === 'yellow'
      ? 'text-amber-500'
      : 'text-emerald-650';

  const borderThemeAccent = themeColor === 'orange'
    ? 'border-orange-500'
    : themeColor === 'yellow'
      ? 'border-amber-400'
      : 'border-emerald-500';

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<VehicleTier>('comfort');
  const [chatInput, setChatInput] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Rider Auth Local States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailForm, setEmailForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [nameForm, setNameForm] = useState('');
  const [startingBalance, setStartingBalance] = useState<number>(20000);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);

  // Emergency SOS state
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const sosIntervalRef = useRef<any>(null);

  const [showGoodToGo, setShowGoodToGo] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeRide) {
      if (prevStatusRef.current === 'searching' && activeRide.status === 'picking_up') {
        setShowGoodToGo(true);
        const t = setTimeout(() => {
          setShowGoodToGo(false);
        }, 3000);
        return () => clearTimeout(t);
      }
      prevStatusRef.current = activeRide.status;
    } else {
      prevStatusRef.current = null;
    }
  }, [activeRide?.status]);

  const handleStartSOS = () => {
    if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    setSosCountdown(10);
    sosIntervalRef.current = setInterval(() => {
      setSosCountdown(curr => {
        if (curr === null) return null;
        if (curr <= 1) {
          clearInterval(sosIntervalRef.current);
          window.location.href = "tel:100";
          alert("🚨 SOS EMERGENCY DIAL SUCCESSFUL: Police authorities (dial 100) have been alerted and connected with your live locations.");
          return 0;
        }
        return curr - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    if (sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
    }
    setSosCountdown(null);
  };


  // Address search controls synced with parent / map if supplied
  const [localIsSearching, setLocalIsSearching] = useState(false);
  const [localSearchQuery, localSetSearchQuery] = useState('');
  const [localActiveSearchType, localSetActiveSearchType] = useState<'pickup' | 'dropoff'>('pickup');
  const [localGooglePlaces, localSetGooglePlaces] = useState<any[]>([]);
  const [localIsSearchingGoogle, localSetIsSearchingGoogle] = useState(false);

  const isSearching = propIsSearching !== undefined ? propIsSearching : localIsSearching;
  const setIsSearching = propSetIsSearching || setLocalIsSearching;
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery || localSetSearchQuery;
  const activeSearchType = propActiveSearchType !== undefined ? propActiveSearchType : localActiveSearchType;
  const setActiveSearchType = propSetActiveSearchType || localSetActiveSearchType;
  const googlePlaces = propGooglePlaces !== undefined ? propGooglePlaces : localGooglePlaces;
  const setGooglePlaces = propSetGooglePlaces || localSetGooglePlaces;
  const isSearchingGoogle = propIsSearchingGoogle !== undefined ? propIsSearchingGoogle : localIsSearchingGoogle;
  const setIsSearchingGoogle = propSetIsSearchingGoogle || localSetIsSearchingGoogle;

  const [isFetchingLiveLocation, setIsFetchingLiveLocation] = useState(false);
  const [liveLocationError, setLiveLocationError] = useState<string | null>(null);

  // Mappls Geocoding Search Proxy (Nominatim Backed for Simulation Sandbox)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setGooglePlaces([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearchingGoogle(true);
      try {
        const query = `${searchQuery}, ${city.name}, ${city.country}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          {
            headers: {
              'User-Agent': `ColectivoRideshareSimulator/1.0-Mappls (${currentRider?.id || 'anonymous'}@gmail.com)`
            }
          }
        );
        if (response.ok) {
          const results = await response.json();
          const items = results.map((item: any, idx: number) => ({
            place_id: item.place_id || String(idx),
            name: item.display_name.split(',')[0] || 'Search Location',
            formatted_address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setGooglePlaces(items);
        } else {
          setGooglePlaces([]);
        }
      } catch (err) {
        console.warn('Nominatim geocoding map lookup failed:', err);
        setGooglePlaces([]);
      } finally {
        setIsSearchingGoogle(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [searchQuery, city.name, city.country, currentRider?.id]);

  const filteredLandmarks = city.landmarks.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTierPrice = (tier: VehicleConfig) => {
    let distanceKm = 5.6; // default fallback if no pickup/dropoff selected
    if (selectedPickup && selectedDropoff) {
      const { distanceMiles } = calculateRouteDetails(
        selectedPickup,
        selectedDropoff,
        city,
        trafficLevel
      );
      distanceKm = parseFloat((distanceMiles * 1.60934).toFixed(1));
    }
    
    const ratePerKm = tier.id === 'comfort' ? comfortRate : comfortPlusRate;
    const basePrice = distanceKm * ratePerKm;
    let finalAmt = basePrice * surgeMultiplier;
    
    // Minimum price of ₹50, adjusted by km if the calculated rate exceeds ₹50
    if (finalAmt < 50.0) {
      finalAmt = 50.0;
    }
    return parseFloat(finalAmt.toFixed(2));
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const err = onApplyPromoCode(promoInput.toUpperCase().trim());
    if (err) {
      setPromoError(err);
    } else {
      setPromoError(null);
      setPromoInput('');
    }
  };

  const feedbackBadges = ['Polite Driver', 'Clean Car', 'Safe Driving', 'Fast Route', 'Comfy Ride'];

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev => 
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  const handleSubmitRating = () => {
    const feedbackStr = [
      ...selectedBadges,
      ...(feedbackText.trim() ? [feedbackText.trim()] : [])
    ].join(', ');
    onCompleteRating(rating, feedbackStr);
    // resets
    setRating(5);
    setFeedbackText('');
    setSelectedBadges([]);
  };

  return (
    <div className={`relative w-[340px] h-[680px] bg-neutral-950 rounded-[40px] border-[10px] transition-all duration-500 ${
      themeColor === 'orange' ? 'border-orange-600/90 ring-orange-500/25' :
      themeColor === 'yellow' ? 'border-amber-400/90 ring-amber-400/25' :
      'border-emerald-600/90 ring-emerald-500/25'
    } shadow-2xl overflow-hidden flex flex-col shrink-0 select-none ring-4`} id="passenger_app_phone">

      {/* Phone Camera Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-40 flex items-center justify-center">
        <div className="w-12 h-1 bg-black/60 rounded-full mb-1"></div>
      </div>

      {/* iOS Top Bar Simulation */}
      <div className="pt-7 px-6 pb-2 bg-black text-white text-[11px] font-bold flex justify-between items-center shrink-0 z-30 select-none">
        <span>12:45 <span className="text-[9px] text-amber-500">PM</span></span>
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-neutral-400">
          <span>5G</span>
          <div className="w-5 h-2.5 bg-neutral-600 rounded-sm relative flex items-center">
            <div className="w-4 h-1.5 bg-emerald-500 rounded-sm m-0.5"></div>
          </div>
        </div>
      </div>

      {/* Main Screen Scroll/Frame */}
      <div className="flex-1 bg-white text-neutral-900 relative flex flex-col overflow-hidden">
        {/* APP BODY LOGIC STARTS HERE */}
        {currentRider?.isBlocked ? (
          <div className="flex-grow flex flex-col justify-between p-6 bg-slate-50 text-center" id="rider_blocked_view">
            <div className="my-auto flex flex-col items-center gap-4 animate-fadeIn">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <h3 className="text-base font-extrabold text-neutral-900 uppercase font-display">Account Suspended</h3>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Your Colectivo rider account (<span className="font-mono font-bold text-neutral-800">{currentRider.email}</span>) has been blocked by the municipal administration for safety violations or outstanding policies.
              </p>
            </div>
            <button
              onClick={onRiderLogout}
              className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all text-center cursor-pointer mt-auto"
            >
              Sign Out
            </button>
          </div>
        ) : !currentRider ? (
          <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 overflow-y-auto" id="passenger_auth_view">
            <div className="flex flex-col gap-4 my-auto">
              <div className="flex flex-col items-center text-center gap-2 mb-2">
                <div className={`w-12 h-12 rounded-2xl ${btnThemeBg} flex items-center justify-center text-xl font-bold shadow-md animate-bounce`}>
                  C
                </div>
                <h2 className="text-xl font-black tracking-tight text-black font-display uppercase mt-1">Colectivo Rider</h2>
                <p className="text-[10px] text-slate-500 font-medium max-w-[240px]">
                  {authMode === 'login' 
                    ? 'Log in to book rides inside interactive municipal networks.' 
                    : 'First-time Login: Register to instantiate dynamic booking profiles.'}
                </p>
              </div>

              {authMsg && (
                <div className={`p-2.5 rounded-xl flex items-start gap-2 text-[11px] font-medium border ${
                  authSuccess ? 'bg-emerald-5 border-emerald-200 text-emerald-800' : 'bg-rose-5 border-rose-200 text-rose-800'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{authMsg}</span>
                </div>
              )}

              {/* Form fields */}
              <div className="flex flex-col gap-2.5">
                {authMode === 'register' && (
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Full Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        value={nameForm}
                        onChange={(e) => setNameForm(e.target.value)}
                        placeholder="e.g. Alex Rider"
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all text-black"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="email" 
                      value={emailForm}
                      onChange={(e) => setEmailForm(e.target.value)}
                      placeholder="rider@colectivo.com"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all text-black"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="password" 
                      value={passwordForm}
                      onChange={(e) => setPasswordForm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all text-black"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div className="flex flex-col gap-1 mt-1 w-full text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Sandbox Base Credits</label>
                      <span className="text-[10px] font-mono font-bold text-indigo-600">₹{startingBalance}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[5000, 10000, 20000, 50000].map(credits => (
                        <button
                          key={credits}
                          type="button"
                          onClick={() => setStartingBalance(credits)}
                          className={`py-1 rounded text-[10px] font-mono font-bold transition-all border ${
                            startingBalance === credits 
                              ? 'bg-black text-white border-black shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ₹{credits}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit triggers */}
              <div className="flex flex-col gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMsg(null);
                    if (authMode === 'login') {
                      if (!emailForm || !passwordForm) {
                        setAuthMsg('Please supply email and password.');
                        return;
                      }
                      const err = onRiderLogin(emailForm.trim().toLowerCase(), passwordForm);
                      if (err) {
                        setAuthMsg(err);
                      } else {
                        setAuthSuccess(true);
                        setAuthMsg('Success! Entering console...');
                      }
                    } else {
                      if (!nameForm || !emailForm || !passwordForm) {
                        setAuthMsg('Please complete all registration inputs.');
                        return;
                      }
                      onRiderRegister(nameForm.trim(), emailForm.trim().toLowerCase(), passwordForm, startingBalance);
                      setAuthSuccess(true);
                      setAuthMsg('Welcome to Colectivo! Dashboard Initialized.');
                    }
                  }}
                  className={`w-full py-2.5 ${btnThemeBg} font-bold text-xs rounded-xl shadow-md cursor-pointer uppercase tracking-wide transition-all`}
                >
                  {authMode === 'login' ? 'Log In' : 'Sign Up'}
                </button>

                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailForm('rider@colectivo.com');
                      setPasswordForm('sandbox123');
                      setAuthMsg(null);
                      const err = onRiderLogin('rider@colectivo.com', 'sandbox123');
                      if (err) {
                        setAuthMsg(err);
                      }
                    }}
                    className="w-full py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                  >
                    <span>✨ Sandbox Demo Login</span>
                  </button>
                )}
              </div>
            </div>

            <div className="text-center mt-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(prev => prev === 'login' ? 'register' : 'login');
                  setAuthMsg(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                {authMode === 'login' ? "New to Colectivo? Create a rider account" : "Have an account? Log in."}
              </button>
            </div>
          </div>
        ) : !activeRide ? (
          /* IDLE HOME / BOOKING FLOW */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header branding & balance bar */}
            <div className="bg-white text-slate-900 p-4 pb-5 flex flex-col gap-4 relative shrink-0 border-b border-slate-250/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center font-bold text-white shadow-sm font-display leading-none text-sm">
                    C
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-extrabold text-sm tracking-tight text-black font-display uppercase leading-none">Colectivo</h3>
                      <button 
                        onClick={onRiderLogout}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Log Out"
                        id="btn_rider_logout"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono font-semibold tracking-wider">HOLA, {currentRider.name.split(' ')[0].toUpperCase()}</p>
                  </div>
                </div>
                
                {/* Balance & Wallet Badge */}
                <button 
                  onClick={() => setIsTopUpOpen(!isTopUpOpen)}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-full border border-slate-200/80 transition-all text-xs font-mono font-bold group shadow-sm cursor-pointer"
                  id="btn_topup_toggle"
                >
                  <Wallet className="w-3.5 h-3.5 text-slate-750" />
                  <span>₹{walletBalance.toFixed(2)}</span>
                </button>
              </div>

              {/* Wallet Top-up expand card */}
              {isTopUpOpen && (
                <div className="bg-white p-3 rounded-xl border border-slate-205 shadow-xl flex flex-col gap-2.5 animate-fadeIn" id="wallet_topup_box">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Top Up Wallet</span>
                    <button onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-black text-sm font-bold">&times;</button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => {
                          onTopUpWallet(amt);
                          setIsTopUpOpen(false);
                        }}
                        className="py-1.5 bg-slate-50 hover:bg-black hover:text-white rounded text-[10px] font-bold border border-slate-200 hover:border-black text-slate-800 font-mono transition-colors cursor-pointer"
                        id={`btn_topup_${amt}`}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cascading State & City Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-150 shadow-inner">
                <div className="flex flex-col gap-0.5 text-left">
                  <label className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider font-mono">Operating State</label>
                  <select
                    value={city.state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      const stateCities = CITIES.filter(c => c.state === newState);
                      if (stateCities.length > 0 && onChangeCity) {
                        onChangeCity(stateCities[0].id);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[10.5px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black cursor-pointer truncate"
                  >
                    {Array.from(new Set(CITIES.map(c => c.state))).sort().map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <label className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider font-mono">Operating City</label>
                  <select
                    value={city.id}
                    onChange={(e) => {
                      if (onChangeCity) {
                        onChangeCity(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[10.5px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black cursor-pointer truncate"
                  >
                    {CITIES.filter(c => c.state === city.state).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination Search Trigger */}
              <button 
                onClick={() => {
                  setActiveSearchType('dropoff');
                  setIsSearching(true);
                }}
                className="w-full bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700 text-left px-4 py-3 rounded-lg flex items-center justify-between text-xs font-medium shadow-sm transition-all cursor-pointer group"
                id="btn_home_search"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-slate-500">Where to in {city.name}?</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Address Search Overlay Drawer */}
            {isSearching ? (
              <div className="absolute inset-0 bg-white z-50 flex flex-col animate-slideUp" id="address_picker_drawer">
                <div className="bg-slate-50 text-slate-900 p-4 flex flex-col gap-3 shrink-0 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest font-extrabold font-mono text-slate-500">PLAN TRIP</span>
                    <button 
                      onClick={() => setIsSearching(false)}
                      className="text-slate-500 hover:text-black hover:bg-slate-200/50 text-xs font-bold font-mono py-1 px-2 rounded transition-all cursor-pointer"
                      id="btn_close_search"
                    >
                      CLOSE &times;
                    </button>
                  </div>

                  {/* Dual pickup - dropoff inputs & Text search */}
                  <div className="flex flex-col gap-2.5">
                    {/* Selected Status overview bar */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 font-mono">
                      <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Pickup Location</span>
                        <span className="text-slate-800 truncate block mt-0.5">{selectedPickup?.name || 'Not selected'}</span>
                      </div>
                      <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Destination</span>
                        <span className="text-slate-800 truncate block mt-0.5">{selectedDropoff?.name || 'Not selected'}</span>
                      </div>
                    </div>

                    {/* Integrated Search Input bar */}
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-black/5 transition-all">
                      {activeSearchType === 'pickup' ? (
                        <CircleDot className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeSearchType === 'pickup' ? "Search pickup using maps location services..." : "Search destination using maps location services..."}
                        className="bg-transparent text-slate-900 outline-none w-full text-xs font-semibold placeholder-slate-400"
                        id="address_autocomplete_input"
                        autoFocus
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-[9px] font-bold text-slate-400 hover:text-black uppercase"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {/* Live Location trigger button */}
                    <div className="flex flex-col gap-1.5 w-full">
                      <button
                        disabled={isFetchingLiveLocation}
                        onClick={() => {
                          if (navigator.geolocation) {
                            setIsFetchingLiveLocation(true);
                            setLiveLocationError(null);
                            navigator.geolocation.getCurrentPosition(
                              async (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                
                                // Translate user real global GPS location to simulated city grid
                                let gridCoords = getGridFromLatLng(lat, lng, city.id);
                                
                                // If they are physically far outside the current simulated city limits,
                                // center them in a highly playable middle zone of the city grid.
                                const isFar = gridCoords.x <= 1.0 || gridCoords.x >= 99.0 || gridCoords.y <= 1.0 || gridCoords.y >= 99.0;
                                if (isFar) {
                                  gridCoords = {
                                    x: 45 + Math.random() * 10,
                                    y: 45 + Math.random() * 10
                                  };
                                }

                                let locationName = 'My Current Live Location';
                                let locationDesc = `Mappls GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

                                try {
                                  // Reverse geocode live location using Nominatim API to get a real address
                                  const revRes = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                                    {
                                      headers: {
                                        'User-Agent': `ColectivoRideshareSimulator/1.0 (${currentRider?.id || 'anonymous'}@gmail.com)`
                                      }
                                    }
                                  );
                                  if (revRes.ok) {
                                    const revData = await revRes.json();
                                    if (revData && revData.display_name) {
                                      locationName = revData.display_name.split(',')[0] || revData.name || 'Live Location';
                                      locationDesc = `${revData.display_name} (Mappls Resolved)`;
                                    }
                                  }
                                } catch (reverseErr) {
                                  console.warn("Reverse lookup failed, using fallback:", reverseErr);
                                }

                                const liveLandmark: Landmark = {
                                  id: 'live_user_loc',
                                  name: locationName,
                                  icon: 'Navigation',
                                  x: Math.round(gridCoords.x),
                                  y: Math.round(gridCoords.y),
                                  lat,
                                  lng,
                                  description: locationDesc,
                                };
                                onSelectLandmark(liveLandmark, activeSearchType);
                                setSearchQuery('');
                                setIsFetchingLiveLocation(false);
                                if (activeSearchType === 'pickup') {
                                  setActiveSearchType('dropoff');
                                } else {
                                  setIsSearching(false);
                                }
                              },
                              (err) => {
                                setIsFetchingLiveLocation(false);
                                setLiveLocationError(`Could not get GPS: ${err.message}. Please search manually.`);
                              },
                              { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
                            );
                          } else {
                            setLiveLocationError('Browser geolocation is not supported.');
                          }
                        }}
                        type="button"
                        className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-[10px] rounded-lg tracking-wide shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        id="btn_use_live_location"
                      >
                        <Navigation className={`w-3.5 h-3.5 text-amber-400 ${isFetchingLiveLocation ? 'animate-spin' : ''}`} />
                        <span>{isFetchingLiveLocation ? 'ACQUIRING YOUR COORDINATES...' : '🎯 USE MY LIVE GPS LOCATION'}</span>
                      </button>

                      {liveLocationError && (
                        <div className="text-[10px] text-rose-500 font-semibold bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                          ⚠️ {liveLocationError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* List of Landmarks & Google Search Results for Selection */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
                  <div className="flex gap-2 mb-2 bg-stone-100 p-1.5 rounded-lg shrink-0">
                    <button 
                      onClick={() => setActiveSearchType('pickup')}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${
                        activeSearchType === 'pickup' ? 'bg-neutral-950 text-white' : 'text-stone-600 hover:bg-stone-200'
                      }`}
                      id="tab_search_pickup"
                    >
                      📍 EDIT PICKUP
                    </button>
                    <button 
                      onClick={() => setActiveSearchType('dropoff')}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${
                        activeSearchType === 'dropoff' ? 'bg-neutral-950 text-white' : 'text-stone-600 hover:bg-stone-200'
                      }`}
                      id="tab_search_dropoff"
                    >
                      🏳️ EDIT DROP
                    </button>
                  </div>

                  {/* Dynamic Maps Search Results */}
                  {googlePlaces.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>🗺️ Maps Search Results</span>
                      </p>
                      <div className="flex flex-col border border-indigo-150 rounded-xl overflow-hidden divide-y divide-indigo-100 bg-indigo-50/5">
                        {googlePlaces.map((place, idx) => (
                          <button
                            key={place.place_id || idx}
                            onClick={() => {
                              // convert coordinates to 100x100 grid mapping space of this city
                              const gridCoords = getGridFromLatLng(place.lat, place.lng, city.id);
                              
                              const customLandmark: Landmark = {
                                id: `search_res_${place.place_id || idx}`,
                                name: place.name || 'Searched Location',
                                icon: 'MapPin',
                                x: Math.round(gridCoords.x),
                                y: Math.round(gridCoords.y),
                                lat: place.lat,
                                lng: place.lng,
                                description: place.formatted_address || 'Online Street Address',
                              };
                              onSelectLandmark(customLandmark, activeSearchType);
                              setSearchQuery('');
                              if (activeSearchType === 'pickup') {
                                setActiveSearchType('dropoff');
                              } else {
                                setIsSearching(false);
                              }
                            }}
                            className="w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-indigo-50/15 cursor-pointer bg-white"
                            id={`search_result_btn_${place.place_id || idx}`}
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center text-xs shrink-0 self-center">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-xs block text-slate-900 leading-tight">{place.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate mt-0.5">{place.formatted_address}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSearchingGoogle && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50/10 border border-indigo-50 rounded-xl mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                      <span className="text-[10px] font-mono font-bold text-indigo-500">QUERYING MAPPLS PLACE API ENGINE...</span>
                    </div>
                  )}

                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Suggested Landmarks ({city.name})</p>
                  <div className="flex flex-col border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-100">
                    {city.landmarks.map(l => {
                      const isSelected = activeSearchType === 'pickup' 
                        ? selectedPickup?.id === l.id 
                        : selectedDropoff?.id === l.id;

                      const isOtherSelected = activeSearchType === 'pickup'
                        ? selectedDropoff?.id === l.id
                        : selectedPickup?.id === l.id;

                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            onSelectLandmark(l, activeSearchType);
                            if (activeSearchType === 'pickup') {
                              // switch focus to dropoff to yield streamlined booking UX
                              setActiveSearchType('dropoff');
                            } else {
                              setIsSearching(false);
                            }
                          }}
                          disabled={isOtherSelected}
                          className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                            isSelected 
                              ? 'bg-amber-500/10 hover:bg-amber-500/15' 
                              : isOtherSelected
                                ? 'bg-neutral-50 opacity-40 cursor-not-allowed'
                                : 'hover:bg-neutral-50'
                          }`}
                          id={`search_landmark_btn_${l.id}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            isSelected 
                              ? 'bg-amber-500 text-neutral-950' 
                              : 'bg-stone-100 text-stone-500'
                          }`}>
                            {activeSearchType === 'pickup' ? <CircleDot className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block text-stone-800">{l.name}</span>
                            <span className="text-[10px] text-stone-500 block truncate">{l.description}</span>
                          </div>
                          {isSelected && <span className="text-[10px] font-bold text-amber-600">Selected</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm selections button */}
                <div className="p-4 border-t border-stone-100 bg-stone-50 shrink-0">
                  <button
                    onClick={() => setIsSearching(false)}
                    disabled={!selectedPickup || !selectedDropoff}
                    className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:bg-stone-300 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    id="btn_confirm_addresses"
                  >
                    <span>CONFIRM WAYPOINTS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Middle panel details: Saved places or service configuration */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* If pickup and dropoff are ready, display Vehicle Select UI */}
              {selectedPickup && selectedDropoff ? (
                <div className="flex flex-col gap-3 animate-fadeIn" id="vehicle_selection_flow">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Suggested Vehicles</span>
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                      Surge: x{surgeMultiplier}
                    </span>
                  </div>

                  {/* Vehicle List */}
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {VEHICLE_CONFIGS.map(tier => {
                      const isSel = selectedTier === tier.id;
                      const finalPrice = calculateTierPrice(tier);
                      const IconComp = tierIconMap[tier.iconName] || Car;

                      return (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full p-2.5 rounded-xl border-2 text-left flex items-center justify-between gap-2.5 transition-all outline-none cursor-pointer ${
                            isSel 
                              ? 'bg-slate-50 text-slate-955 border-black scale-[1.01] shadow-md' 
                              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-100'
                          }`}
                          id={`vehicle_tier_btn_${tier.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                              isSel ? 'bg-black text-white' : 'bg-slate-100 text-slate-505'
                            }`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-xs flex items-center gap-1.5">
                                <span>{tier.name}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isSel ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  👤 {tier.capacity}
                                </span>
                              </div>
                              <span className={`text-[10px] block truncate max-w-[130px] ${
                                isSel ? 'text-slate-500' : 'text-slate-500'
                              }`}>
                                {tier.description}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-bold text-sm block font-mono text-black">₹{finalPrice.toFixed(2)}</span>
                            <span className={`text-[9px] block font-medium ${isSel ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                              ETA: {tier.etaBase}m
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Saved Landmarks visual selector block */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Quick Destination Presets</span>
                    <div className="grid grid-cols-2 gap-2">
                      {city.landmarks.slice(0, 4).map(lm => (
                        <button
                          key={lm.id}
                          onClick={() => {
                            if (!selectedPickup) {
                              onSelectLandmark(lm, 'pickup');
                            } else {
                              onSelectLandmark(lm, 'dropoff');
                            }
                          }}
                          className="p-3 text-left bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xl transition-all cursor-pointer"
                          id={`preset_dest_btn_${lm.id}`}
                        >
                          <span className="font-extrabold text-stone-700 text-xs block truncate leading-tight">{lm.name}</span>
                          <span className="text-[9px] text-stone-500 block block mt-0.5 leading-tight truncate">
                            {selectedPickup ? '👉 Set Dropoff' : '📍 Set Pickup'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Safety Warnings and Notifications */}
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-left shadow-sm flex flex-col gap-1.5 animate-fadeIn select-none">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-amber-800 uppercase tracking-widest leading-none">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rider Safety Notice</span>
                    </div>
                    <ul className="text-[9px] leading-relaxed text-slate-600 list-disc pl-4 space-y-0.5 font-medium">
                      <li>Verify your assigned driver's registered vehicle license plate matches before boarding any vehicle.</li>
                      <li>Share your live digital trip route links with personal contacts or family coordinators.</li>
                      <li>In case of emergency, immediately use the dedicated <b>🚨 SOS</b> button to trigger a state police dispatch.</li>
                    </ul>
                  </div>

                  {/* Wallet Quick Balance Topup Info */}
                  <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-slate-800" />
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-none font-medium">Wallet Balance</span>
                        <span className="text-xs font-bold font-mono">₹{walletBalance.toFixed(2)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsTopUpOpen(true)}
                      className="text-[10px] font-bold bg-black text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      id="btn_home_topup"
                    >
                      ADD CASH
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom confirmation action panel */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              {selectedPickup && selectedDropoff ? (
                <button
                  onClick={() => {
                    const matchedConfig = VEHICLE_CONFIGS.find(v => v.id === selectedTier)!;
                    onRequestRide(selectedTier, promoCodeApplied?.code || '');
                  }}
                  className={`w-full ${btnThemeBg} font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer`}
                  id="btn_request_ride"
                >
                  <span>CONFIRM {VEHICLE_CONFIGS.find(v => v.id === selectedTier)?.name.toUpperCase()} RIDE</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveSearchType('pickup');
                    setIsSearching(true);
                  }}
                  className={`w-full ${btnThemeBg} font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer`}
                  id="btn_choose_dest_footer"
                >
                  <MapPinCheck className="w-4 h-4" />
                  <span>CHOOSE PICKUP & DROP</span>
                </button>
              )}
            </div>
          </div>
        ) : activeRide.status === 'searching' ? (
          /* SEARCHING / MATCHING SCREEN */
          <div className="flex-1 bg-neutral-950 text-white p-6 flex flex-col justify-between items-center" id="ride_searching_screen">
            <div className="w-full flex justify-between items-center text-xs text-neutral-400 font-mono">
              <span>GPS SYNCING...</span>
              <span className="text-amber-500 animate-pulse font-bold">● ACTIVE MATCH</span>
            </div>

            <div className="flex flex-col items-center gap-4 my-auto text-center w-full">
              {/* Pulsing Radar effect */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute w-18 h-18 rounded-full border border-amber-500/10 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute w-12 h-12 rounded-full border border-amber-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="w-14 h-14 rounded-full bg-neutral-900 border-2 border-amber-500 flex items-center justify-center relative shadow-lg">
                  <Car className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
              </div>

              <div>
                {activeRide.queueState === 'priority' ? (
                  <>
                    <h4 className="font-extrabold text-sm tracking-tight text-white">Priority Offer Sent</h4>
                    <span className="inline-block mt-1 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-400 text-[10px] font-mono font-bold">
                      ⏱ PRIORITY EXPIRY: {activeRide.priorityCountdown}s
                    </span>
                  </>
                ) : (
                  <>
                    <h4 className="font-extrabold text-sm tracking-tight text-yellow-500">Broadcasting...</h4>
                    <span className="inline-block mt-1 px-3 py-0.5 bg-red-500/10 border border-red-500/25 rounded-full text-red-400 text-[9px] font-mono font-bold animate-pulse">
                      ⚡ WIDE MATCHING ACTIVE
                    </span>
                  </>
                )}
              </div>

              {/* Priority queue list container */}
              <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 text-left self-stretch">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-1.5 mb-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Driver Queue ({activeRide.queueZoneKm || 1} km zone)</span>
                  <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 font-mono">
                    {activeRide.queueDrivers?.length || 0} online
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {activeRide.queueDrivers?.map((qd) => {
                    const isPriority = activeRide.queueState === 'priority' && activeRide.priorityDriverId === qd.driverId;
                    return (
                      <div key={qd.driverId} className={`flex justify-between items-center p-2 rounded-lg text-[10px] transition-colors ${
                        isPriority ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-neutral-950/40 border border-transparent'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                            isPriority ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {qd.idx}
                          </span>
                          <span className={`font-medium ${isPriority ? 'text-amber-300 font-bold' : 'text-neutral-300'}`}>
                            {qd.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px]">
                          <span className="text-neutral-400">{qd.distance.toFixed(1)} km</span>
                          {isPriority ? (
                            <span className="bg-amber-500 text-neutral-950 font-sans font-bold px-1 rounded animate-pulse">
                              Priority
                            </span>
                          ) : activeRide.queueState === 'priority' ? (
                            <span className="text-neutral-500 font-sans">
                              Standby
                            </span>
                          ) : (
                            <span className="text-red-400 font-sans font-bold animate-pulse">
                              Broadcasting
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={onCancelRide}
              className="w-full max-w-[240px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/30 text-white font-bold text-xs py-2.5 rounded-lg transition-all text-center cursor-pointer"
              id="btn_cancel_matching"
            >
              CANCEL REQUEST
            </button>
          </div>
        ) : activeRide.status === 'completed' && !activeRide.isPaid ? (
          /* TRIP COMPLETED / RATING RECEIPT SCREEN */
          <div className="flex-1 bg-stone-50 overflow-y-auto p-4 flex flex-col justify-between" id="rating_invoice_screen">
            <div className="flex-grow flex flex-col gap-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl mb-2 shadow-md">
                  ✓
                </div>
                <h3 className="font-extrabold text-base tracking-tight text-neutral-950">Arrived at Destination!</h3>
                <p className="text-[11px] text-stone-500">Trip invoice receipt & rating</p>
              </div>

              {/* Receipt Breakdown Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 font-mono text-xs text-stone-700">
                <div className="flex justify-between items-center border-b border-stone-100 pb-2 text-stone-500">
                  <span>BILL DETAIL</span>
                  <span className="text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">PAID</span>
                </div>
                
                {(() => {
                  const ratePerKm = activeRide.tier === 'comfort' ? comfortRate : comfortPlusRate;
                  const finalDistance = activeRide.originalDistance !== undefined ? activeRide.originalDistance : activeRide.distance;
                  const basePrice = finalDistance * ratePerKm;
                  const surgeAmt = basePrice * (activeRide.surgeMultiplier - 1.0);
                  const totalCalculated = basePrice * activeRide.surgeMultiplier;
                  const minFareAdjustment = Math.max(0, activeRide.price - totalCalculated);

                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Distance ({finalDistance.toFixed(1)} km) x ₹{ratePerKm}/km:</span>
                        <span>₹{basePrice.toFixed(2)}</span>
                      </div>
                      {activeRide.surgeMultiplier > 1.0 && (
                        <div className="flex justify-between text-amber-600 font-bold">
                          <span>Surge Adjustment (x{activeRide.surgeMultiplier}):</span>
                          <span>+₹{surgeAmt.toFixed(2)}</span>
                        </div>
                      )}
                      {minFareAdjustment > 0.05 && (
                        <div className="flex justify-between text-indigo-600 font-semibold">
                          <span>Minimum Fare Adjustment:</span>
                          <span>+₹{minFareAdjustment.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="flex justify-between border-t border-stone-100 pt-2.5 font-bold text-sm text-stone-900">
                  <span>Total Deducted:</span>
                  <span>₹{activeRide.price.toFixed(2)}</span>
                </div>

                <p className="text-[9px] text-stone-400 text-center uppercase tracking-widest mt-1">Payment deducted from Wallet</p>
              </div>

              {/* Driver Rating Selector */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Rate Your Colectivo Driver</span>
                
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(starIdx => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setRating(starIdx)}
                      className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      id={`star_rating_btn_${starIdx}`}
                    >
                      <Star className={`w-7 h-7 ${starIdx <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>

                {/* Rating Feedback Badges */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {feedbackBadges.map(badge => {
                    const isSelected = selectedBadges.includes(badge);
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => toggleBadge(badge)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-all ${
                          isSelected 
                            ? 'bg-neutral-950 text-white border-neutral-950' 
                            : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}
                        id={`badge_btn_${badge}`}
                      >
                        {badge}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Optional review message..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full mt-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 font-sans"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitRating}
              className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all text-center mt-4 cursor-pointer"
              id="btn_submit_rating"
            >
              SUBMIT FEEDBACK
            </button>
          </div>
        ) : (
          /* ACTIVE BOOKING IN PROGRESS (PICKING UP / ARRIVED / TRAVELLING) */
          <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden" id="active_booking_screen">
            {/* Action Segment Status Card */}
            <div className="bg-neutral-950 text-white p-4 shrink-0 shadow-md flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
                <span>ACTIVE BOOKING DETAILS</span>
                <span className="text-amber-400 uppercase text-[9px] tracking-wider font-mono font-black py-0.5 px-2 bg-amber-400/10 border border-amber-400/20 rounded-full animate-pulse">
                  ● LIVE COLECTIVO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-neutral-900 pb-2.5">
                <div>
                  <h4 className="text-sm font-extrabold text-white leading-tight font-display">
                    {activeRide.status === 'picking_up' && 'Driver Heading to You'}
                    {activeRide.status === 'arrived' && 'Your Colectivo has Arrived!'}
                    {activeRide.status === 'in_transit' && 'Heading to Destination'}
                  </h4>
                  <p className="text-[10px] text-neutral-400 font-mono mt-1">
                    Arriving in ~{activeRide.eta} mins ({activeRide.distance} km left)
                  </p>
                </div>
                
                {/* Live contextual status graphic */}
                <div className="flex items-center justify-end select-none">
                  {activeRide.status === 'picking_up' && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl font-mono font-extrabold shadow-sm animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>EN-ROUTE</span>
                    </div>
                  )}
                  {activeRide.status === 'arrived' && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl font-mono font-extrabold shadow-sm animate-bounce">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 bg-emerald-400 animate-ping" />
                      <span>ARRIVED</span>
                    </div>
                  )}
                  {activeRide.status === 'in_transit' && (
                    <div className="flex items-center gap-1 text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-xl font-mono font-extrabold shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                      <span>CARRYING</span>
                    </div>
                  )}
                </div>
              </div>

              {/* High Fidelity Interactive Progress Flow Tracker */}
              <div className="flex justify-between items-center gap-1 select-none relative px-1 py-1 mt-1">
                {/* Connecting lines track */}
                <div className="absolute top-3 left-3 right-3 h-[2.5px] bg-neutral-900 z-0" />
                
                {/* Active fill line */}
                <div 
                  className="absolute top-3 left-3 h-[2.5px] bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 z-0 transition-all duration-[1200ms] ease-out"
                  style={{
                    width: activeRide.status === 'picking_up' ? '33%' :
                           activeRide.status === 'arrived' ? '66%' :
                           activeRide.status === 'in_transit' ? '100%' : '0%'
                  }}
                />

                {/* Step 1: Request Confirmed */}
                <div className="flex flex-col items-center gap-1 z-10 w-1/4">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-[9px] shadow-md border border-amber-400">
                    ✓
                  </div>
                  <span className="text-[7.5px] font-mono uppercase font-black text-amber-500 tracking-tighter">Matched</span>
                </div>

                {/* Step 2: En Route */}
                <div className="flex flex-col items-center gap-1 z-10 w-1/4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] transition-all duration-500 border ${
                    activeRide.status === 'picking_up'
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 ring-4 ring-amber-500/30'
                      : activeRide.status === 'arrived' || activeRide.status === 'in_transit'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}>
                    {activeRide.status === 'picking_up' ? (
                      <span className="animate-pulse">📍</span>
                    ) : activeRide.status === 'arrived' || activeRide.status === 'in_transit' ? (
                      '✓'
                    ) : (
                      '2'
                    )}
                  </div>
                  <span className={`text-[7.5px] font-mono uppercase font-extrabold tracking-tighter ${
                    activeRide.status === 'picking_up' ? 'text-amber-400 animate-pulse' :
                    activeRide.status === 'arrived' || activeRide.status === 'in_transit' ? 'text-amber-500' : 'text-neutral-600'
                  }`}>En Route</span>
                </div>

                {/* Step 3: Arrived */}
                <div className="flex flex-col items-center gap-1 z-10 w-1/4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] transition-all duration-500 border ${
                    activeRide.status === 'arrived'
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 ring-4 ring-amber-500/30'
                      : activeRide.status === 'in_transit'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}>
                    {activeRide.status === 'arrived' ? (
                      <span className="animate-bounce">👋</span>
                    ) : activeRide.status === 'in_transit' ? (
                      '✓'
                    ) : (
                      '3'
                    )}
                  </div>
                  <span className={`text-[7.5px] font-mono uppercase font-extrabold tracking-tighter ${
                    activeRide.status === 'arrived' ? 'text-amber-400 animate-pulse' :
                    activeRide.status === 'in_transit' ? 'text-amber-500' : 'text-neutral-600'
                  }`}>Arrived</span>
                </div>

                {/* Step 4: In Transit */}
                <div className="flex flex-col items-center gap-1 z-10 w-1/4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] transition-all duration-500 border ${
                    activeRide.status === 'in_transit'
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 ring-4 ring-emerald-500/20'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}>
                    {activeRide.status === 'in_transit' ? (
                      <span className="animate-pulse">🚀</span>
                    ) : (
                      '4'
                    )}
                  </div>
                  <span className={`text-[7.5px] font-mono uppercase font-extrabold tracking-tighter ${
                    activeRide.status === 'in_transit' ? 'text-emerald-400 animate-pulse' : 'text-neutral-600'
                  }`}>Transit</span>
                </div>
              </div>
            </div>

            {/* OTP Verification Code Banner */}
            {activeRide.otp && activeRide.status !== 'in_transit' && (
              <div className="bg-amber-500/15 border-b border-amber-300 px-4 py-3 flex items-center justify-between text-xs font-mono shrink-0 select-none animate-fadeIn">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black tracking-wider text-amber-700 uppercase font-sans">Boarding Verification Code</span>
                  <span className="text-[11px] text-amber-900 font-bold font-sans mt-0.5">Share with driver to start ride</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-amber-400 text-neutral-950 font-black text-[13px] px-3.5 py-1.5 rounded-xl tracking-widest shadow-md">
                    {activeRide.otp}
                  </span>
                </div>
              </div>
            )}

            {/* In-Transit driver details card */}
            <div className="bg-white border-b border-stone-200/80 p-3.5 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-neutral-700">
                  👨‍✈️
                </div>
                <div>
                  <span className="font-extrabold text-xs text-stone-800 leading-tight block">Assigned Driver</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="bg-neutral-100 border border-stone-200 text-stone-700 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                      {VEHICLE_CONFIGS.find(v => v.id === activeRide.tier)?.name}
                    </span>
                    <span className="text-[9px] text-stone-500 flex items-center">
                      ★ 4.9
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-[10px] bg-neutral-900 text-white font-extrabold px-2 py-1 rounded block uppercase">
                  XYZ-7890
                </span>
                <span className="text-[9px] text-stone-500 mt-0.5 block leading-none">White Sedan</span>
              </div>
            </div>

            {/* Chat message console */}
            <div className="flex-1 flex flex-col bg-stone-100/40 p-3 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2 block">Direct Message Chat</span>
              
              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 mb-2.5 pr-0.5">
                {activeRide.messages.length === 0 ? (
                  <div className="text-center my-auto px-6">
                    <p className="text-[10px] text-stone-400 leading-normal">No messages exchanged yet. Send a pre-defined text overlay to coordinate details.</p>
                  </div>
                ) : (
                  activeRide.messages.map(msg => {
                    const isUser = msg.sender === 'passenger';
                    return (
                      <div 
                        key={msg.id}
                        className={`max-w-[70%] p-2 rounded-xl text-xs flex flex-col shadow-sm ${
                          isUser 
                            ? 'bg-neutral-950 text-white ml-auto rounded-tr-none' 
                            : 'bg-white text-stone-800 mr-auto rounded-tl-none border border-stone-200'
                        }`}
                      >
                        <span className="font-sans leading-tight block">{msg.text}</span>
                        <span className={`text-[8px] mt-1 block opacity-60 self-end`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick message templates */}
              <div className="flex gap-1 overflow-x-auto pb-2 border-b border-stone-200/50 shrink-0 select-none">
                {['I am waiting outside.', 'In details: wearing a coat.', 'Okay, got it!', 'Hurry please.'].map(txt => (
                  <button
                    key={txt}
                    onClick={() => onSendChatMessage(txt)}
                    className="shrink-0 text-[10px] bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-2 py-1 rounded-full transition-all cursor-pointer"
                    id={`chat_preset_${txt.replace(/\s+/g, '_')}`}
                  >
                    "{txt}"
                  </button>
                ))}
              </div>

              {/* Chat Text Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  onSendChatMessage(chatInput);
                  setChatInput('');
                }}
                className="flex gap-1.5 pt-2 shrink-0"
                id="chat_subform"
              >
                <input
                  type="text"
                  placeholder="Type massage..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-850 outline-none placeholder-stone-400"
                />
                <button
                  type="submit"
                  className="bg-neutral-950 text-white p-1.5 rounded-lg hover:bg-neutral-900 transition-all shrink-0 cursor-pointer"
                  id="chat_submit_btn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Active Cancel Booking Footer */}
            <div className="p-3 border-t border-stone-200 bg-stone-50 flex flex-col gap-2 shrink-0">
              <button
                onClick={onCancelRide}
                className="w-full bg-stone-200 text-stone-700 hover:bg-stone-300 font-bold text-xs py-2 rounded-xl transition-all text-center cursor-pointer uppercase"
                id="btn_cancel_active_ride"
              >
                CANCEL TRIP
              </button>
              <button
                onClick={handleStartSOS}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all text-center cursor-pointer uppercase tracking-clear flex items-center justify-center gap-1.5 shadow-sm"
                id="btn_sos_trigger"
              >
                🚨 Emergency SOS (100)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Emergency SOS Countdown Warning Overlay */}
      {sosCountdown !== null && (
        <div className="absolute inset-0 bg-red-950/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
          <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce ring-4 ring-red-300">
            <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="mt-5 text-lg font-black text-white font-mono tracking-wide uppercase">Emergency Alert Triggered</h2>
          <p className="mt-2 text-xs font-black text-rose-300 font-mono tracking-widest animate-pulse uppercase">
            DIALING STATE POLICE IN: {sosCountdown} SECONDS
          </p>
          <div className="mt-3 bg-red-900/40 border border-red-700/50 px-3.5 py-2.5 rounded-xl max-w-[210px] text-[9.5px] text-zinc-150 leading-relaxed font-sans font-medium text-left">
            🚨 <b>WARNING:</b> This triggers a direct dispatch request to state police operations (dial <b>100</b>) and broadcasts your telemetry. False reporting yields legal action.
          </div>
          <p className="mt-2 text-[8px] text-rose-300 font-semibold italic">
            Connecting line to dispatcher at 0s...
          </p>
          <button
            onClick={handleCancelSOS}
            className="mt-6 px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-mono font-black text-[10px] uppercase rounded-lg tracking-wider shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            id="btn_cancel_sos_emergency"
          >
            ❌ Cancel Emergency
          </button>
        </div>
      )}

      {/* Good To Go Success Overlay Block */}
      {showGoodToGo && (
        <div className="absolute inset-0 bg-emerald-950/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl animate-pulse ring-4 ring-emerald-300">
            <span className="text-3xl text-white">👍</span>
          </div>
          <h2 className="mt-5 text-lg font-black text-white font-mono tracking-wide uppercase">GOOD TO GO!</h2>
          <p className="mt-2 text-[10px] text-emerald-200/90 max-w-[190px] leading-relaxed font-semibold">
            Ride accepted! We paired you with a verified partner driver. Happy journey!
          </p>
          <span className="text-[7.5px] font-mono text-emerald-400 bg-emerald-900/40 border border-emerald-800/40 px-2 py-0.5 rounded-full mt-3 leading-none">
            Auto-closing wrapper in 3s...
          </span>
        </div>
      )}

      {/* Notch Home line overlay */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-neutral-800 rounded-full z-40"></div>
    </div>
  );
}
