import React, { useState, useEffect } from 'react';
import { getTodayString } from '../utils/date';
import { 
  CircleDot, 
  MapPin, 
  Navigation, 
  TrendingUp, 
  ShieldAlert, 
  Sliders, 
  Send, 
  UserCheck, 
  Car, 
  Percent, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  MapPinCheck,
  Lock,
  Mail,
  AlertCircle,
  FileText,
  Check,
  Upload,
  LogOut,
  User,
  Bell
} from 'lucide-react';
import { CityData, Driver, Ride, GridNode } from '../types';
import { VEHICLE_CONFIGS, CITIES } from '../constants/cities';

interface PhoneDriverProps {
  city: CityData;
  driver: Driver | null; // Can be null if not logged in
  activeRide: Ride | null;
  onToggleOnline: () => void;
  onAcceptRide: () => void;
  onDeclineRide: () => void;
  onArrivedAtPickup: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onSendChatMessage: (text: string) => void;
  weather: string;
  surgeMultiplier: number;
  // Auth & Doc Props
  currentDriver: Driver | null;
  onDriverLogin: (email: string, pass: string) => string | null;
  onDriverRegister: (driverData: Partial<Driver>) => void;
  onDriverLogout: () => void;
  onResubmitDocuments: (driverId: string, vehicle: string, plate: string, license: string, insurance: string, licenseExpiry: string, insuranceExpiry: string) => void;
  comfortRate: number;
  comfortPlusRate: number;
  appColorTheme?: 'orange' | 'yellow' | 'green';
  onTopUpWallet: (amount: number) => void;
  onSimulateMidnightReset?: () => void;
  onChangeCity?: (cityId: string) => void;
}

export default function PhoneDriver({
  city,
  driver,
  activeRide,
  onToggleOnline,
  onAcceptRide,
  onDeclineRide,
  onArrivedAtPickup,
  onStartTrip,
  onCompleteTrip,
  onSendChatMessage,
  weather,
  surgeMultiplier,
  currentDriver,
  onDriverLogin,
  onDriverRegister,
  onDriverLogout,
  onResubmitDocuments,
  comfortRate,
  comfortPlusRate,
  onTopUpWallet,
  onSimulateMidnightReset,
  onChangeCity,
  appColorTheme = 'orange',
}: PhoneDriverProps) {
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

  const [enteredOtpForm, setEnteredOtpForm] = useState('');
  const [otpVerificationError, setOtpVerificationError] = useState<string | null>(null);

  // Clean OTP state on status progression
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'arrived') {
      setEnteredOtpForm('');
      setOtpVerificationError(null);
    }
  }, [activeRide?.status, activeRide?.id]);

  const [chatInput, setChatInput] = useState('');
  const [acceptTimer, setAcceptTimer] = useState(12);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Driver Auth Form States
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upload_docs'>('login');
  const [emailForm, setEmailForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [nameForm, setNameForm] = useState('');
  const [phoneForm, setPhoneForm] = useState('');
  const [vehicleForm, setVehicleForm] = useState('');
  const [plateForm, setPlateForm] = useState('');
  const [tierForm, setTierForm] = useState<string>('comfort');
  const [stateForm, setStateForm] = useState<string>(city.state || 'Delhi');
  const [cityForm, setCityForm] = useState<string>(city.id);
  const [licenseFileForm, setLicenseFileForm] = useState('');
  const [insuranceFileForm, setInsuranceFileForm] = useState('');
  const [licenseExpiryForm, setLicenseExpiryForm] = useState('');
  const [insuranceExpiryForm, setInsuranceExpiryForm] = useState('');
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Re-submission form fields
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Incoming offer counter ticking
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'offered') {
      setAcceptTimer(12);
      return;
    }

    if (activeRide.priorityCountdown !== undefined) {
      setAcceptTimer(activeRide.priorityCountdown);
      return;
    }

    const interval = setInterval(() => {
      setAcceptTimer(t => {
        if (t <= 1) {
          // auto decline when countdown terminates
          onDeclineRide();
          return 12;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRide, onDeclineRide]);

  const isOnline = driver ? driver.status !== 'offline' : false;
  const todayString = getTodayString();
  const dailyTrips = driver && driver.lastTripDate === todayString ? (driver.dailyTripsCount ?? 0) : 0;

  // Driver chat templates
  const driverReplyOptions = [
    'I am stuck in traffic, be there in 3 minutes.',
    'I have arrived at the pickup spot.',
    'Okay, see you soon!',
    'Can you verify your clothes?'
  ];

  const renderWalletPanel = () => {
    if (!driver) return null;
    const today = getTodayString();
    const dailyTrips = driver.lastTripDate === today ? (driver.dailyTripsCount ?? 0) : 0;
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left">
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono block">Driver Partner Wallet</span>
            <h5 className="font-extrabold text-[10px] text-slate-800 font-display uppercase tracking-wider">Sub & Charge Plan</h5>
          </div>
          <div className="text-right">
            <span className="text-[8px] uppercase font-mono font-bold text-slate-400">Balance</span>
            <div className="text-sm font-black font-mono text-black">
              ₹{(driver.walletBalance ?? 0).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Active Plan Badges & Info */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[10px] space-y-1.5 leading-tight select-none">
          <div className="flex justify-between items-center font-mono">
            <span className="text-slate-500 font-bold">Plan Type:</span>
            {dailyTrips < 3 ? (
              <span className="bg-emerald-500/10 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase">
                Free ({3 - dailyTrips} left today)
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-600 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase">
                Pay-Per-Ride (₹10/trip)
              </span>
            )}
          </div>

          <div className="flex justify-between items-center font-mono border-t border-slate-200/50 pt-1.5">
            <span className="text-slate-500 font-bold">Today Completed:</span>
            <span className="text-slate-705 font-bold font-mono">{dailyTrips} rides</span>
          </div>

          <div className="flex justify-between items-center font-mono border-t border-slate-200/50 pt-1.5">
            <span className="text-slate-500 font-bold">Ineligible Level:</span>
            <span className="text-slate-700 font-bold">₹0 or less (after 3 free trips)</span>
          </div>

          <div className="flex justify-between items-center font-mono border-t border-slate-200/50 pt-1.5">
            <span className="text-slate-500 font-bold">Ride Fee size:</span>
            <span className="text-slate-700 font-bold">₹10 for each subsequent ride</span>
          </div>
        </div>

        {/* Restricted Block Warning */}
        {dailyTrips >= 3 && (driver.walletBalance ?? 0) <= 0 && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[9px] text-rose-700 font-medium leading-relaxed font-sans animate-fadeIn">
            <span className="font-bold uppercase tracking-wider block mb-0.5 text-rose-800">⚠️ Driver Inactive / Blocked</span>
            You have completed {dailyTrips} rides today (exceeded 3 free rides) and your partner wallet balance is ₹{(driver.walletBalance ?? 0).toFixed(1)}. Please recharge your wallet to receive ride match requests.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1.5 mt-3">
          {/* Top up button trigger */}
          <button
            onClick={() => setIsTopUpOpen(!isTopUpOpen)}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[10px] rounded-xl transition-all cursor-pointer uppercase font-mono shadow-sm flex items-center justify-center gap-1"
          >
            💳 Recharge Wallet
          </button>

          {/* Simulate 12 AM Reset */}
          {onSimulateMidnightReset && (
            <button
              onClick={onSimulateMidnightReset}
              className="px-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[9px] rounded-xl transition-all cursor-pointer uppercase font-mono border border-indigo-200/40 flex items-center justify-center gap-1"
              id="simulate_midnight_reset_btn"
              title="Fast Forward to 12 AM (Reset Free Rides)"
            >
              ⏰ Reset Free Rides
            </button>
          )}
        </div>

        {/* Top up inline tray */}
        {isTopUpOpen && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 animate-fadeIn text-left">
            <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 block mb-2 font-mono">Select Recharge Amount</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[50, 100, 200, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    onTopUpWallet(amt);
                    setIsTopUpOpen(false);
                  }}
                  className="py-1.5 bg-slate-50 hover:bg-black hover:text-white rounded text-[9px] font-bold border border-slate-200 hover:border-black text-slate-800 font-mono transition-colors cursor-pointer"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative w-[340px] h-[680px] bg-neutral-950 rounded-[40px] border-[10px] transition-all duration-500 ${
      themeColor === 'orange' ? 'border-orange-600/90 ring-orange-500/25' :
      themeColor === 'yellow' ? 'border-amber-400/90 ring-amber-400/25' :
      'border-emerald-600/90 ring-emerald-500/25'
    } shadow-2xl overflow-hidden flex flex-col shrink-0 select-none ring-4`} id="driver_app_phone">
      {/* Phone Camera Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-40 flex items-center justify-center">
        <div className="w-12 h-1 bg-black/60 rounded-full mb-1"></div>
      </div>

      {/* iOS Top Bar Simulation */}
      <div className="pt-7 px-6 pb-2 bg-black text-white text-[11px] font-bold flex justify-between items-center shrink-0 z-30">
        <span>12:45 <span className="text-[9px] text-teal-400">PM</span></span>
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-neutral-400">
          <span>GPS HIGH</span>
          <div className="w-5 h-2.5 bg-neutral-600 rounded-sm relative flex items-center">
            <div className="w-4 h-1.5 bg-teal-400 rounded-sm m-0.5"></div>
          </div>
        </div>
      </div>

      {/* Main Screen Scroll/Frame */}
      <div className="flex-1 bg-slate-50 text-slate-900 relative flex flex-col overflow-hidden">
        {currentDriver?.isBlocked ? (
          <div className="flex-grow flex flex-col justify-between p-6 bg-slate-100 text-center" id="driver_blocked_view">
            <div className="my-auto flex flex-col items-center gap-4 animate-fadeIn">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase font-display">Console Suspended</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Your Colectivo driver registration (<span className="font-mono font-bold text-slate-800">{currentDriver.email}</span>) has been suspended by the municipal administration for policy violations.
              </p>
            </div>
            <button
              onClick={onDriverLogout}
              className="w-full bg-slate-900 hover:bg-black text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all text-center cursor-pointer mt-auto"
            >
              Sign Out
            </button>
          </div>
        ) : !currentDriver ? (
          /* DRIVER AUTHENTICATION WORKFLOW */
          <div className="flex-1 flex flex-col justify-between p-5 bg-teal-950/5 overflow-y-auto" id="driver_auth_view">
            <div className="flex flex-col gap-3.5 my-auto">
              <div className="flex flex-col items-center text-center gap-1.5 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-teal-900 text-white flex items-center justify-center text-xl font-bold shadow-md">
                  <Car className="w-5 h-5 text-teal-350 bg-teal-900" />
                </div>
                <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase font-display mt-1">Colectivo Driver Panel</h2>
                <p className="text-[10px] text-slate-500 font-medium max-w-[240px]">
                  {authMode === 'login' 
                    ? 'Access your driver console, transit requests, and verified document status.' 
                    : authMode === 'register' 
                      ? 'Step 1/2: Register driver base credentials.' 
                      : 'Step 2/2: Upload mandatory documents for Admin verification.'}
                </p>
              </div>

              {authMsg && (
                <div className={`p-2 rounded-xl flex items-start gap-1.5 text-[10px] font-semibold border ${
                  authSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{authMsg}</span>
                </div>
              )}

              {/* Form fields */}
              <div className="flex flex-col gap-2">
                {authMode === 'login' && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="email" 
                          value={emailForm}
                          onChange={(e) => setEmailForm(e.target.value)}
                          placeholder="driver@colectivo.com"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Password</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="password" 
                          value={passwordForm}
                          onChange={(e) => setPasswordForm(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        />
                      </div>
                    </div>
                  </>
                )}

                {authMode === 'register' && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Full Name</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          value={nameForm}
                          onChange={(e) => setNameForm(e.target.value)}
                          placeholder="e.g. Marcus Vance"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="email" 
                          value={emailForm}
                          onChange={(e) => setEmailForm(e.target.value)}
                          placeholder="vance@colectivo.com"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Password</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="password" 
                          value={passwordForm}
                          onChange={(e) => setPasswordForm(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5 text-left">
                        <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Operating State</label>
                        <select 
                          value={stateForm}
                          onChange={(e) => {
                            const newState = e.target.value;
                            setStateForm(newState);
                            const filtered = CITIES.filter(c => c.state === newState);
                            if (filtered.length > 0) {
                              setCityForm(filtered[0].id);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black cursor-pointer truncate"
                        >
                          {Array.from(new Set(CITIES.map(c => c.state))).sort().map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-0.5 text-left">
                        <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Operating City</label>
                        <select 
                          value={cityForm}
                          onChange={(e) => setCityForm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black cursor-pointer truncate"
                        >
                          {CITIES.filter(c => c.state === stateForm).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {authMode === 'upload_docs' && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Vehicle Description</label>
                      <input 
                        type="text" 
                        value={vehicleForm}
                        onChange={(e) => setVehicleForm(e.target.value)}
                        placeholder="e.g. Tesla Model 3 (White)"
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Plate Number</label>
                        <input 
                          type="text" 
                          value={plateForm}
                          onChange={(e) => setPlateForm(e.target.value)}
                          placeholder="e.g. CD-7709"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Service Tier</label>
                        <select 
                          value={tierForm}
                          onChange={(e) => setTierForm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-black"
                        >
                          <option value="comfort">🚗 Comfort (₹{comfortRate}/km)</option>
                          <option value="comfortplus">✨ Comfort + (₹{comfortPlusRate}/km)</option>
                        </select>
                      </div>
                    </div>

                    <div className="border border-dashed border-teal-605/30 bg-teal-950/5 rounded-xl p-2.5 flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-teal-800 uppercase tracking-widest font-mono">Security Check Documents</span>
                      <div className="text-left flex flex-col gap-1 animate-fadeIn">
                        <label className="text-[8px] font-bold text-slate-400 font-mono">Driver License File (.PDF/Image)</label>
                        <input 
                          type="text" 
                          value={licenseFileForm}
                          onChange={(e) => setLicenseFileForm(e.target.value)}
                          placeholder="e.g. license_nyc_vance.pdf"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[10px] text-black"
                        />
                        <div className="flex flex-col gap-0.5 mt-1">
                          <label className="text-[8px] font-bold text-teal-800 font-mono">License Expiry Date</label>
                          <input 
                            type="date" 
                            value={licenseExpiryForm}
                            onChange={(e) => setLicenseExpiryForm(e.target.value)}
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[10px] text-black font-semibold"
                          />
                        </div>
                      </div>
                      <div className="text-left flex flex-col gap-1 mt-1 border-t border-slate-100 pt-1">
                        <label className="text-[8px] font-bold text-slate-400 font-mono">Vehicle Insurance Certificate File</label>
                        <input 
                          type="text" 
                          value={insuranceFileForm}
                          onChange={(e) => setInsuranceFileForm(e.target.value)}
                          placeholder="e.g. state_farm_insurance.pdf"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[10px] text-black"
                        />
                        <div className="flex flex-col gap-0.5 mt-1">
                          <label className="text-[8px] font-bold text-teal-800 font-mono">Insurance Expiry Date</label>
                          <input 
                            type="date" 
                            value={insuranceExpiryForm}
                            onChange={(e) => setInsuranceExpiryForm(e.target.value)}
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[10px] text-black font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Submit triggers */}
              <div className="flex flex-col gap-1.5 mt-2">
                {authMode === 'login' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMsg(null);
                        if (!emailForm || !passwordForm) {
                          setAuthMsg('Password and email inputs are mandatory.');
                          return;
                        }
                        const err = onDriverLogin(emailForm.trim().toLowerCase(), passwordForm);
                        if (err) {
                          setAuthMsg(err);
                        } else {
                          setAuthSuccess(true);
                          setAuthMsg('Access approved.');
                        }
                      }}
                      className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer uppercase transition-all"
                    >
                      Authenticate Account
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm('vance@colectivo.com');
                        setPasswordForm('sandbox123');
                        setAuthMsg(null);
                        const err = onDriverLogin('vance@colectivo.com', 'sandbox123');
                        if (err) {
                          setAuthMsg(err);
                        }
                      }}
                      className="w-full py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono shadow-sm"
                    >
                      <span>✨ Quick Demo Driver Login</span>
                    </button>
                  </>
                )}

                {authMode === 'register' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!nameForm || !emailForm || !passwordForm) {
                        setAuthMsg('Please fill in Name, Email, and Password.');
                        return;
                      }
                      setAuthMsg(null);
                      setAuthMode('upload_docs');
                    }}
                    className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer uppercase font-mono tracking-wider transition-all"
                  >
                    Next: Add Documents &rarr;
                  </button>
                )}

                {authMode === 'upload_docs' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!vehicleForm || !plateForm || !licenseFileForm || !insuranceFileForm || !licenseExpiryForm || !insuranceExpiryForm) {
                          setAuthMsg('Documents, vehicle details, and individual expiry dates are all mandatory for safety compliance.');
                          return;
                        }
                        onDriverRegister({
                          name: nameForm,
                          email: emailForm.trim().toLowerCase(),
                          password: passwordForm,
                          vehicle: vehicleForm,
                          plate: plateForm,
                          licenseFile: licenseFileForm,
                          insuranceFile: insuranceFileForm,
                          licenseExpiry: licenseExpiryForm,
                          insuranceExpiry: insuranceExpiryForm,
                          docValidity: licenseExpiryForm, // fallback compatibility
                          tier: tierForm as any,
                          cityId: cityForm,
                        });
                        setAuthSuccess(true);
                        setAuthMsg('Registered! Verification pending with Security Admin.');
                        setAuthMode('login');
                        setEmailForm(emailForm.trim().toLowerCase());
                        setPasswordForm(passwordForm);
                      }}
                      className="flex-1 py-1.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-md font-mono tracking-wider transition-all cursor-pointer"
                    >
                      Submit Registration
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-3 pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(prev => prev === 'login' ? 'register' : 'login');
                  setAuthMsg(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                {authMode === 'login' ? "Register a new partner vehicle?" : "Return to Log In"}
              </button>
            </div>
          </div>
        ) : (driver && driver.verificationStatus !== 'verified') ? (
          /* MANDATORY DOCUMENT VERIFICATION STATUS SCREEN */
          <div className="flex-1 flex flex-col justify-between p-5 bg-stone-50 overflow-y-auto text-left" id="driver_verification_screen">
            <div className="flex flex-col gap-4 my-auto">
              {/* Status Header Icon */}
              <div className="flex flex-col items-center text-center gap-1.5 mb-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-md ${
                  driver.verificationStatus === 'pending' ? 'bg-amber-500 text-white animate-pulse' : 'bg-rose-500 text-white'
                }`}>
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase font-display mt-1">
                  {driver.verificationStatus === 'pending' ? 'Verification Is Pending' : 'Credentials Rejected'}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium max-w-[245px] leading-relaxed">
                  {driver.verificationStatus === 'pending'
                    ? "In accordance with local municipality rules, visual matching audit and certificate inspections are mandatory by admin before taking trips."
                    : "Your vehicle registration or document submission did not meet city compliance rules. Review notes below:"}
                </p>
              </div>

              {driver.verificationReason && (
                <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-xl flex flex-col gap-1 text-[10px] text-rose-800">
                  <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-rose-600">Admin Rejection Log:</span>
                  <p className="font-semibold leading-relaxed">&ldquo;{driver.verificationReason}&rdquo;</p>
                </div>
              )}

              {/* Verified details review */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 text-[10px] text-slate-700 shadow-sm">
                <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-widest block border-b pb-1">Payload Audit Overview</span>
                
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 font-medium">Partner Name:</span>
                  <span className="font-bold text-black">{driver.name}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 font-medium">Vehicle Model:</span>
                  <span className="font-bold text-black">{driver.vehicle}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 font-medium">License Plate:</span>
                  <span className="font-mono font-bold text-black bg-slate-50 px-1 py-0.5 rounded border border-slate-150">{driver.plate}</span>
                </div>
                {driver.licenseExpiry && (
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 pt-1 mt-0.5">
                    <span className="text-slate-400 font-medium font-mono text-[8px]">License Expiry:</span>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{driver.licenseExpiry}</span>
                  </div>
                )}
                {driver.insuranceExpiry && (
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 pt-1 mt-0.5">
                    <span className="text-slate-400 font-medium font-mono text-[8px]">Insurance Expiry:</span>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{driver.insuranceExpiry}</span>
                  </div>
                )}
                {!driver.licenseExpiry && !driver.insuranceExpiry && driver.docValidity && (
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 pt-1 mt-0.5">
                    <span className="text-slate-400 font-medium font-mono text-[8px]">Document Expiry:</span>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{driver.docValidity}</span>
                  </div>
                )}

                <div className="border-t pt-1.5 mt-1 grid grid-cols-2 gap-2 text-[9px]">
                  <div className="bg-slate-50 border rounded-lg p-2 flex flex-col gap-1">
                    <span className="text-[7px] uppercase font-bold text-slate-400 font-mono">Driver License</span>
                    <span className="font-bold text-ellipsis overflow-hidden whitespace-nowrap text-slate-800 font-mono inline-flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500 hover:text-black hover:cursor-pointer shrink-0" />
                      {driver.licenseFile || 'None Uploaded'}
                    </span>
                    <span className={`text-[7px] font-bold ${driver.verificationStatus === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
                      ⏳ NOT VERIFIED
                    </span>
                  </div>

                  <div className="bg-slate-50 border rounded-lg p-2 flex flex-col gap-1">
                    <span className="text-[7px] uppercase font-bold text-slate-400 font-mono">Insurance file</span>
                    <span className="font-bold text-ellipsis overflow-hidden whitespace-nowrap text-slate-800 font-mono inline-flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500 hover:text-black hover:cursor-pointer shrink-0" />
                      {driver.insuranceFile || 'None Uploaded'}
                    </span>
                    <span className={`text-[7px] font-bold ${driver.verificationStatus === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
                      ⏳ NOT VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Action prompts */}
              <div className="bg-teal-50 border border-teal-205 p-2.5 rounded-lg text-[9px] text-teal-800 leading-relaxed font-semibold">
                💡 <b className="font-mono">How to review:</b> Open the <b className="underline">Admin Panel</b> in the Partner Portal section below, find <b className="underline">{driver.name || 'this driver'}</b> under Drivers List, click Approve or Reject, then check back here.
              </div>

              {driver.verificationStatus === 'rejected' && (
                <div className="flex flex-col gap-2 mt-2">
                  {!isResubmitting ? (
                    <button
                      type="button"
                      onClick={() => {
                        setVehicleForm(driver.vehicle);
                        setPlateForm(driver.plate);
                        setLicenseFileForm(driver.licenseFile || '');
                        setInsuranceFileForm(driver.insuranceFile || '');
                        setLicenseExpiryForm(driver.licenseExpiry || driver.docValidity || '');
                        setInsuranceExpiryForm(driver.insuranceExpiry || driver.docValidity || '');
                        setIsResubmitting(true);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] uppercase rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Update / Resubmit Documents
                    </button>
                  ) : (
                    <div className="bg-white border rounded-xl p-3 flex flex-col gap-2 text-left">
                      <h4 className="text-[10px] font-bold text-black uppercase">Resubmit documents</h4>
                      <input 
                        type="text" 
                        value={vehicleForm} 
                        onChange={(e) => setVehicleForm(e.target.value)} 
                        placeholder="Vehicle Name" 
                        className="w-full border p-1 rounded text-xs text-black"
                      />
                      <input 
                        type="text" 
                        value={plateForm} 
                        onChange={(e) => setPlateForm(e.target.value)} 
                        placeholder="Plate" 
                        className="w-full border p-1 rounded text-xs text-black"
                      />
                      
                      <div className="flex flex-col gap-1 border-t pt-1.5 mt-1">
                        <label className="text-[8px] font-bold text-slate-400 font-mono">License File & Expiry</label>
                        <input 
                          type="text" 
                          value={licenseFileForm} 
                          onChange={(e) => setLicenseFileForm(e.target.value)} 
                          placeholder="License Image Path" 
                          className="w-full border p-1 rounded text-xs text-black"
                        />
                        <input 
                          type="date" 
                          value={licenseExpiryForm} 
                          onChange={(e) => setLicenseExpiryForm(e.target.value)} 
                          className="w-full border p-1 rounded text-xs text-black mt-1"
                        />
                      </div>

                      <div className="flex flex-col gap-1 border-t pt-1.5 mt-1">
                        <label className="text-[8px] font-bold text-slate-400 font-mono">Insurance File & Expiry</label>
                        <input 
                          type="text" 
                          value={insuranceFileForm} 
                          onChange={(e) => setInsuranceFileForm(e.target.value)} 
                          placeholder="Insurance Image Path" 
                          className="w-full border p-1 rounded text-xs text-black"
                        />
                        <input 
                          type="date" 
                          value={insuranceExpiryForm} 
                          onChange={(e) => setInsuranceExpiryForm(e.target.value)} 
                          className="w-full border p-1 rounded text-xs text-black mt-1"
                        />
                      </div>

                      <div className="flex gap-2 text-[10px] mt-2">
                        <button 
                          type="button" 
                          onClick={() => setIsResubmitting(false)} 
                          className="flex-1 py-1 bg-slate-200 text-slate-700 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!vehicleForm || !plateForm || !licenseFileForm || !insuranceFileForm || !licenseExpiryForm || !insuranceExpiryForm) return;
                            onResubmitDocuments(driver.id, vehicleForm, plateForm, licenseFileForm, insuranceFileForm, licenseExpiryForm, insuranceExpiryForm);
                            setIsResubmitting(false);
                          }} 
                          className="flex-1 py-1 bg-black text-white rounded font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center mt-3 pt-2">
              <button
                type="button"
                onClick={onDriverLogout}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Log in as Demo Driver</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* HEADER BRANDING: Toggle Online/Offline */}
            <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-extrabold text-xs tracking-tight text-black uppercase font-display leading-none">Colectivo Driver</h3>
                    <button 
                      onClick={onDriverLogout}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer animate-pulse"
                      title="Log Out"
                      id="btn_driver_header_logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-400 font-mono font-bold tracking-wider">HOLA, {(driver ? driver.name : "N/A").split(' ')[0].toUpperCase()}</p>
                </div>
              </div>

              <button 
                onClick={onToggleOnline}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-extrabold font-mono transition-all border cursor-pointer ${
                  isOnline 
                    ? 'bg-emerald-50/70 text-emerald-600 border-emerald-250' 
                    : 'bg-slate-100 text-slate-500 border-slate-200/60'
                }`}
                id="driver_status_toggle_btn"
              >
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
            </div>

            {/* Cascading State & City Selector for Driver */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 grid grid-cols-2 gap-1.5 shadow-sm shrink-0">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[7px] text-slate-400 font-extrabold uppercase font-mono">Operating State</span>
                <select
                  value={city.state}
                  onChange={(e) => {
                    const newState = e.target.value;
                    const stateCities = CITIES.filter(c => c.state === newState);
                    if (stateCities.length > 0 && onChangeCity) {
                      onChangeCity(stateCities[0].id);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-md py-0.5 px-1 text-[9.5px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black cursor-pointer truncate"
                >
                  {Array.from(new Set(CITIES.map(c => c.state))).sort().map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[7px] text-slate-400 font-extrabold uppercase font-mono">Operating City</span>
                <select
                  value={city.id}
                  onChange={(e) => {
                    if (onChangeCity) {
                      onChangeCity(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-md py-0.5 px-1 text-[9.5px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black cursor-pointer truncate"
                >
                  {CITIES.filter(c => c.state === city.state).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

        {/* BODY PANEL LOGIC */}
        {!isOnline ? (
          /* OFFLINE STATUS HERO GRAPHICS */
          <div className="flex-1 flex flex-col items-center p-6 text-center gap-5 overflow-y-auto" id="driver_offline_screen">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-200 relative shadow-sm shrink-0">
              <Car className="w-9 h-9 text-slate-400" />
              <ShieldAlert className="w-4 h-4 text-rose-500 absolute bottom-1 right-1" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-black">You are Offline</h4>
              <p className="text-[10px] text-slate-500 mt-2 max-w-[210px] leading-relaxed mx-auto font-medium">
                Go online to start receiving ride offers, routing schedules, or surges in {city.name} districts.
              </p>
            </div>

            <button
              onClick={onToggleOnline}
              className="px-5 py-2.5 rounded-full font-mono bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              id="btn_driver_go_online"
            >
              <span>TAP GO ONLINE</span>
            </button>

            {renderWalletPanel()}
          </div>
        ) : !activeRide ? (
          /* ONLINE & IDLE STATUS DASHBOARD (Waiting for rides) */
          <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-4" id="driver_online_idle_screen">
            {dailyTrips >= 3 && (driver.walletBalance ?? 0) <= 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-left text-amber-900 shadow-sm font-sans flex flex-col gap-1 animate-fadeIn select-none">
                <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-black text-amber-800 uppercase tracking-widest leading-none">
                  <Bell className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                  <span>Wallet Recharge Alert</span>
                </div>
                <p className="text-[9.5px] leading-relaxed text-slate-600 mt-1">
                  You completed <b>{dailyTrips} free rides</b> today. Your wallet balance is <b>₹{(driver.walletBalance ?? 0).toFixed(1)}</b>. Please recharge to receive match offers.
                </p>
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-mono font-extrabold text-[8.5px] uppercase px-2.5 py-1 rounded-lg w-fit self-end mt-1 cursor-pointer transition-all shrink-0"
                >
                  Recharge Wallet
                </button>
              </div>
            )}

            {/* Pulsing "Finding Request" banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-1 font-mono">Queue Active</span>
              <h4 className="font-extrabold text-sm text-black flex items-center justify-center gap-1.5 font-display">
                <span className="inline-block w-2.5 h-2.5 bg-black rounded-full animate-ping"></span>
                <span>Searching for Rides...</span>
              </h4>
              <p className="text-[9px] text-slate-505 text-slate-500 mt-1.5 leading-relaxed font-sans font-medium">
                Sitting in {city.name} grid network. Keep app open to receive localized match events.
              </p>
            </div>

            {/* Earnings stats dashboard modules */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold font-mono">Daily Earnings</span>
                <span className="text-sm font-extrabold font-mono block text-black mt-1">
                  ₹{driver.earnings.toFixed(2)}
                </span>
                <p className="text-[8px] text-emerald-600 font-mono mt-0.5 leading-none font-bold">Payout ready</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold font-mono">Completed</span>
                <span className="text-sm font-extrabold font-mono block text-black mt-1">
                  {driver.tripsCount}
                </span>
                <p className="text-[8px] text-slate-505 text-slate-500 mt-0.5 leading-none font-semibold">Accept rate: 94%</p>
              </div>
            </div>

            {renderWalletPanel()}

            {/* Simulated Live Feed logs of city activity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-extrabold text-black tracking-wider block mb-2.5 font-display">Live City Feed</span>
              
              <div className="flex flex-col gap-2.5 font-mono text-[9px] text-slate-700">
                <div className="flex items-start gap-2 border-b border-slate-100 pb-2">
                  <span className="text-amber-500">⚡</span>
                  <div>
                    <span className="font-bold text-black font-sans text-[10px]">Surge Alert: {surgeMultiplier}x</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-sans leading-relaxed">High rider density detected near central avenues.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 border-b border-slate-100 pb-2">
                  <span className="text-indigo-500">☁</span>
                  <div>
                    <span className="font-bold text-black font-sans text-[10px]">Weather: {weather}</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-sans leading-relaxed">System adjusted for regional atmospheric patterns.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✔</span>
                  <div>
                    <span className="font-bold text-black font-sans text-[10px]">System Connected</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-sans leading-relaxed">Plate {driver.plate} ({driver.vehicle}) registered.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeRide.status === 'offered' ? (
          /* INCOMING REQUEST OFFER WINDOW */
          <div className="flex-1 flex flex-col p-5 justify-between bg-slate-50" id="incoming_ride_offer_modal">
            <div className="text-center">
              <span className="text-[9px] bg-slate-200 text-slate-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                Incoming Offer
              </span>
              <h3 className="font-extrabold text-base text-black tracking-tight mt-2.5 font-display uppercase">Ride Request Matching!</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Accept offer before countdown terminates</p>
              {activeRide.queueZoneKm && (
                <div className="mt-2 bg-amber-500/10 border border-amber-500/25 text-amber-700 rounded-lg py-1 px-3 inline-block font-mono text-[9px] font-bold">
                  ⭐ PRIORITY POSITION #1 IN {activeRide.queueZoneKm}KM ZONE QUEUE
                </div>
              )}
            </div>

            {/* Gigantic Countdown Progress Circle */}
            <div className="relative w-28 h-28 mx-auto my-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-slate-200 flex items-center justify-center bg-white relative shadow-md">
                <span className="font-mono font-extrabold text-2xl text-black">{acceptTimer}s</span>
              </div>
            </div>

            {/* Offer details & Financial estimation */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 font-sans text-xs shadow-sm">
              <div className="flex flex-col border-b border-slate-100 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-450 uppercase font-semibold">Gross Ride Fare</span>
                  <span className="text-slate-800 font-bold font-mono text-sm">₹{activeRide.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-mono text-emerald-600 uppercase font-black">Your Earnings (100%)</span>
                  <span className="text-emerald-600 font-black font-mono text-base">₹{activeRide.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CircleDot className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wide block leading-none font-bold">Pick-Up Spot</span>
                  <p className="text-[11px] font-semibold text-slate-800 mt-1 font-mono truncate max-w-[190px]">{activeRide.pickup.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wide block leading-none font-bold">Dropoff Destination</span>
                  <p className="text-[11px] font-semibold text-slate-800 mt-1 font-mono truncate max-w-[190px]">{activeRide.dropoff.name}</p>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono">
                <span>Trip length: ~{activeRide.distance} km</span>
                <span>Tier: {VEHICLE_CONFIGS.find(v => v.id === activeRide.tier)?.name}</span>
              </div>
            </div>

            {/* Accept / Decline horizontal array */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onDeclineRide}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:text-rose-600 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer"
                id="btn_decline_incoming_ride"
              >
                DECLINE
              </button>
              <button
                onClick={onAcceptRide}
                className="flex-1 bg-black hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-xs hover:scale-[1.01] cursor-pointer"
                id="btn_accept_incoming_ride"
              >
                ACCEPT OFFER
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE JOURNEY (PICKING UP / ARRIVED / TRAVELLING) */
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden" id="active_driver_journey_screen">
            {/* Trip status header */}
            <div className="bg-white p-4 border-b border-slate-200 shrink-0 shadow-sm">
              <div className="flex justify-between items-center text-[10px] text-slate-450 font-mono mb-2">
                <span>ON-TRIP DISPATCH NAVIGATION</span>
                <span className="text-emerald-600 uppercase font-extrabold font-mono text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>

              <div>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold font-mono">Dispatch instructions</span>
                <h4 className="text-sm font-extrabold text-black mt-0.5 leading-tight font-display">
                  {activeRide.status === 'picking_up' && `Drive to Pickup: ${activeRide.pickup.name}`}
                  {activeRide.status === 'arrived' && 'Waiting for Rider at curbstops...'}
                  {activeRide.status === 'in_transit' && `Drive to drop point: ${activeRide.dropoff.name}`}
                  {activeRide.status === 'completed' && 'Trip ended. Charge receipt.'}
                </h4>
              </div>
            </div>

            {/* Navigation guidance strip */}
            <div className="bg-slate-100/60 px-4 py-2.5 flex items-center gap-3 border-b border-slate-200 shrink-0">
              <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <Navigation className="w-3.5 h-3.5 transform rotate-45 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-405 text-slate-400 block uppercase font-bold leading-none font-mono">GPS ROUTING</span>
                <span className="text-xs font-bold text-slate-700 block truncate mt-0.5">
                  {activeRide.status === 'picking_up' && 'Head north-west on central aven. grid limits.'}
                  {activeRide.status === 'arrived' && 'Arrived at pickup block. Contact passenger.'}
                  {activeRide.status === 'in_transit' && 'Follow yellow traffic lane directly to dropoff.'}
                </span>
              </div>
              <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50/80 px-2 py-1 rounded shrink-0">
                {activeRide.distance} km
              </span>
            </div>

            {/* Passenger chat message window */}
            <div className="flex-1 flex flex-col p-3 bg-slate-100 overflow-hidden justify-between">
              
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-mono">Customer Messages</span>
                
                {/* Messages feeds */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-0.5 pb-2">
                  {activeRide.messages.length === 0 ? (
                    <div className="text-center my-auto px-6">
                      <p className="text-[10px] text-slate-400 leading-normal font-medium">No messages exchanged yet. Contact rider if you can’t spot them.</p>
                    </div>
                  ) : (
                    activeRide.messages.map(msg => {
                      const isUser = msg.sender === 'driver';
                      return (
                        <div 
                          key={msg.id}
                          className={`max-w-[70%] p-2 rounded-xl text-xs flex flex-col shadow-sm ${
                            isUser 
                              ? 'bg-black text-white ml-auto rounded-tr-none' 
                              : 'bg-white text-slate-800 mr-auto rounded-tl-none border border-slate-200/80 font-medium'
                          }`}
                        >
                          <span className="font-sans leading-tight block">{msg.text}</span>
                          <span className="text-[8px] mt-1 block opacity-60 text-right font-mono">
                            {msg.timestamp}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick replies */}
                <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-200 shrink-0 select-none">
                  {driverReplyOptions.map(txt => (
                    <button
                      key={txt}
                      onClick={() => onSendChatMessage(txt)}
                      className="shrink-0 text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium"
                      id={`driver_chat_preset_${txt.replace(/\s+/g, '_')}`}
                    >
                      "{txt}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  onSendChatMessage(chatInput);
                  setChatInput('');
                }}
                className="flex gap-1.5 pt-2 shrink-0 border-t border-slate-200 bg-slate-100"
                id="driver_chat_frm"
              >
                <input
                  type="text"
                  placeholder="Tell customer..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="bg-black text-white p-2 rounded-lg hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                  id="driver_chat_submit_btn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Slider triggers depending on current trip cycle step */}
            <div className="p-3 bg-white border-t border-slate-205 shrink-0">
              {activeRide.status === 'picking_up' && (
                <button
                  onClick={onArrivedAtPickup}
                  className="w-full py-3.5 bg-black hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                  id="btn_driver_arrived"
                >
                  <span>📍 CONFIRM ARRIVAL AT PICKUP</span>
                </button>
              )}

              {activeRide.status === 'arrived' && (
                <div className="flex flex-col gap-2 animate-fadeIn" id="driver_otp_container">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left">
                    <span className="text-[8px] font-black tracking-wider text-slate-500 uppercase block">Rider Security Check</span>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5 mb-2">Request the 4-digit code shown on the rider's phone.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="ENTER OTP"
                        value={enteredOtpForm}
                        onChange={(e) => {
                          setEnteredOtpForm(e.target.value.replace(/\D/g, ''));
                          setOtpVerificationError(null);
                        }}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-[11px] tracking-widest text-slate-800 outline-none"
                        id="input_driver_otp"
                      />
                      <button
                        onClick={() => {
                          if (activeRide.otp) {
                            setEnteredOtpForm(activeRide.otp);
                            setOtpVerificationError(null);
                          }
                        }}
                        type="button"
                        className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-[9px] font-bold transition-all"
                        id="btn_autofill_otp_test"
                      >
                        Code: {activeRide.otp}
                      </button>
                    </div>

                    {otpVerificationError && (
                      <p className="text-[9px] text-rose-600 font-bold leading-tight mt-1.5">
                        {otpVerificationError}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const realOtp = activeRide.otp || '';
                      if (enteredOtpForm.trim() === realOtp) {
                        setEnteredOtpForm('');
                        setOtpVerificationError(null);
                        onStartTrip();
                      } else {
                        setOtpVerificationError('Error: Invalid code! Confirm code shown on rider app.');
                      }
                    }}
                    className={`w-full py-3.5 ${btnThemeBg} font-extrabold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer`}
                    id="btn_driver_start_trip"
                  >
                    <span>🚀 VERIFY OTP & START TRIP</span>
                  </button>
                </div>
              )}

              {activeRide.status === 'in_transit' && (
                <button
                  onClick={onCompleteTrip}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                  id="btn_driver_complete_trip"
                >
                  <span>🏁 ARRIVED! COMPLETE TRIP</span>
                </button>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Notch Home line overlay */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-zinc-800 rounded-full z-40"></div>
    </div>
  );
}
