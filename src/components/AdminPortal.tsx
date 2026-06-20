import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  Car, 
  HeartHandshake, 
  ShieldAlert,
  Settings,
  DollarSign,
  UserCheck,
  UserX,
  Edit,
  Trash2
} from 'lucide-react';
import { Driver, Rider } from '../types';

interface AdminPortalProps {
  drivers: Driver[];
  onVerifyDriver: (id: string, status: 'verified' | 'rejected', reason?: string) => void;
  riders: Rider[];
  comfortRate: number;
  comfortPlusRate: number;
  onUpdateRates: (comfort: number, comfortPlus: number) => void;
  onToggleBlockDriver: (id: string) => void;
  onToggleBlockRider: (id: string) => void;
  onDeleteDriver?: (id: string) => void;
  onEditDriver?: (id: string, updatedFields: Partial<Driver>) => void;
  onDeleteRider?: (id: string) => void;
  onEditRider?: (id: string, updatedFields: Partial<Rider>) => void;
  isAdminLoggedIn?: boolean;
  onAdminLogout?: () => void;
}

export default function AdminPortal({ 
  drivers, 
  onVerifyDriver, 
  riders,
  comfortRate,
  comfortPlusRate,
  onUpdateRates,
  onToggleBlockDriver,
  onToggleBlockRider,
  onDeleteDriver,
  onEditDriver,
  onDeleteRider,
  onEditRider,
  isAdminLoggedIn,
  onAdminLogout
}: AdminPortalProps) {
  const [internalAdminLoggedIn, setInternalAdminLoggedIn] = useState(false);
  const loggedIn = isAdminLoggedIn !== undefined ? isAdminLoggedIn : internalAdminLoggedIn;
  const [adminUser, setAdminUser] = useState('ADMIN');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Active review states
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Tab Manager state
  const [activeTab, setActiveTab] = useState<'drivers' | 'riders' | 'rates'>('drivers');

  // Direct editing states for drivers & riders
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editDriverName, setEditDriverName] = useState('');
  const [editDriverVehicle, setEditDriverVehicle] = useState('');
  const [editDriverPlate, setEditDriverPlate] = useState('');

  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);
  const [editRiderName, setEditRiderName] = useState('');
  const [editRiderBalance, setEditRiderBalance] = useState<number>(0);

  // Rates edit state
  const [editedComfortRate, setEditedComfortRate] = useState(comfortRate);
  const [editedComfortPlusRate, setEditedComfortPlusRate] = useState(comfortPlusRate);
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === 'ADMIN' && adminPass === '12345') {
      setInternalAdminLoggedIn(true);
      setAdminError(null);
    } else {
      setAdminError('Invalid credentials. Use ADMIN / 12345');
    }
  };

  const handleQuickLogin = () => {
    setAdminUser('ADMIN');
    setAdminPass('12345');
    setInternalAdminLoggedIn(true);
    setAdminError(null);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRates(editedComfortRate, editedComfortPlusRate);
    setRateFeedback('Rates updated successfully across all matching modules!');
    setTimeout(() => setRateFeedback(null), 3000);
  };

  if (!loggedIn) {
    return (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[580px] select-none text-slate-800" id="admin_login_box">
        <div className="my-auto flex flex-col gap-4 animate-fadeIn">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shadow-md">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-base font-black tracking-tighter uppercase font-display mt-2">Colectivo Municipal Admin</h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">SECURE REGISTRY PORTAL</p>
          </div>

          {adminError && (
            <div className="text-[10px] font-bold p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{adminError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Admin Username</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black text-black"
                  placeholder="ADMIN"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="password" 
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black text-black"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer mt-1"
              id="btn_admin_login_submit"
            >
              Sign In to Console
            </button>
          </form>

          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full py-2 border border-dashed border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-extrabold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
            id="btn_admin_login_demo"
          >
            <span>✨ Quick Sandbox Admin Login</span>
          </button>
        </div>

        <p className="text-[9px] text-center text-slate-400 font-mono mt-4">
          AUTHORIZED AUDIT ACCESS ONLY. ALL LOGS PRESERVED.
        </p>
      </div>
    );
  }

  // Admin counts
  const pendingDrivers = drivers.filter(d => d.verificationStatus === 'pending');
  const activeVerifiedDrivers = drivers.filter(d => d.verificationStatus === 'verified');
  const blockedDrivers = drivers.filter(d => d.isBlocked);
  const blockedRiders = riders.filter(r => r.isBlocked);

  return (
    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col min-h-[580px] text-slate-900 select-none text-left" id="admin_authorized_portal">
      {/* Header Banner */}
      <div className="bg-black text-white p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-xs tracking-tight uppercase">Colectivo Admin Console</h3>
            <p className="text-[8px] text-emerald-400 font-mono leading-none font-bold">STATE REVOLVING AUDIT ACTIVE</p>
          </div>
        </div>

        <button
          onClick={() => {
            setInternalAdminLoggedIn(false);
            onAdminLogout?.();
          }}
          className="text-[9px] font-extrabold font-mono text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2.5 py-1 rounded bg-zinc-900 cursor-pointer"
        >
          LOGOUT
        </button>
      </div>

      {/* Admin Tab Bar Navigation */}
      <div className="flex bg-slate-900 text-zinc-400 font-mono text-[9px] font-bold border-b border-slate-800">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 uppercase ${
            activeTab === 'drivers' 
              ? 'bg-slate-805 text-white border-emerald-400 font-extrabold bg-slate-800' 
              : 'border-transparent hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Car className="w-3 h-3" /> Drivers ({drivers.length})
        </button>
        <button
          onClick={() => setActiveTab('riders')}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 uppercase ${
            activeTab === 'riders' 
              ? 'bg-slate-805 text-white border-emerald-400 font-extrabold bg-slate-800' 
              : 'border-transparent hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-3 h-3" /> Riders ({riders.length})
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 uppercase ${
            activeTab === 'rates' 
              ? 'bg-slate-805 text-white border-emerald-400 font-extrabold bg-slate-800' 
              : 'border-transparent hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Settings className="w-3 h-3" /> System Rates
        </button>
      </div>

      {/* Metrics mini-ribbon */}
      <div className="grid grid-cols-3 border-b bg-slate-50 text-center shrink-0">
        <div className="p-1.5 border-r">
          <span className="text-[7px] uppercase font-bold text-slate-400 block font-mono">Suspended Accounts</span>
          <span className="text-xs font-extrabold text-rose-600 font-display">
            {blockedDrivers.length + blockedRiders.length}
          </span>
        </div>
        <div className="p-1.5 border-r">
          <span className="text-[7px] uppercase font-bold text-slate-400 block font-mono">Comfort per km</span>
          <span className="text-xs font-extrabold text-emerald-600 font-display">₹{comfortRate}</span>
        </div>
        <div className="p-1.5">
          <span className="text-[7px] uppercase font-bold text-slate-400 block font-mono">Comfort+ per km</span>
          <span className="text-xs font-extrabold text-amber-600 font-display">₹{comfortPlusRate}</span>
        </div>
      </div>

      {/* Dynamic Tab Body */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-50/50">
        
        {/* DRIVERS TAB PANEL */}
        {activeTab === 'drivers' && (
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1 px-1">
              🔧 Credentials & Account Management
            </span>

            {drivers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                No driver partners in system.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {drivers.map(drv => (
                  <div 
                    key={drv.id}
                    className={`p-3 bg-white border rounded-2xl shadow-sm transition-all flex flex-col gap-2.5 ${
                      drv.isBlocked
                        ? 'border-rose-300 bg-rose-50/5'
                        : drv.verificationStatus === 'pending'
                          ? 'border-amber-300 bg-amber-50/5'
                          : drv.verificationStatus === 'rejected'
                            ? 'border-rose-150'
                            : 'border-slate-150'
                    }`}
                  >
                    {editingDriverId === drv.id ? (
                      <div className="flex flex-col gap-2 p-1">
                        <span className="text-[10px] font-mono font-bold text-teal-700 uppercase">Modify Driver Profile</span>
                        <div className="flex flex-col gap-0.5 text-left">
                          <label className="text-[8px] text-slate-400 font-bold uppercase font-mono">Full Name</label>
                          <input
                            type="text"
                            value={editDriverName}
                            onChange={(e) => setEditDriverName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-black"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] text-slate-400 font-bold uppercase font-mono">Vehicle Description</label>
                            <input
                              type="text"
                              value={editDriverVehicle}
                              onChange={(e) => setEditDriverVehicle(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-black"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] text-slate-400 font-bold uppercase font-mono">License Plate Number</label>
                            <input
                              type="text"
                              value={editDriverPlate}
                              onChange={(e) => setEditDriverPlate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-black"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Permanently delete this driver partner account?")) {
                                onDeleteDriver?.(drv.id);
                                setEditingDriverId(null);
                              }
                            }}
                            className="px-2.5 py-1 text-[9px] bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold uppercase rounded-md shadow-sm transition-all"
                          >
                            🗑 Delete Partner
                          </button>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingDriverId(null)}
                              className="px-2 py-1 text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onEditDriver?.(drv.id, {
                                  name: editDriverName,
                                  vehicle: editDriverVehicle,
                                  plate: editDriverPlate,
                                });
                                setEditingDriverId(null);
                              }}
                              className="px-2.5 py-1 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold uppercase rounded-md shadow-sm"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Header line */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl bg-slate-100 p-1 rounded-xl shadow-inner select-none">{drv.avatar}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-black flex items-center gap-1">
                            {drv.name}
                            {drv.isBlocked && (
                              <span className="text-[8px] bg-rose-500 text-white font-normal px-1 py-0.5 rounded uppercase font-mono tracking-tighter">
                                Blocked
                              </span>
                            )}
                          </h4>
                          <p className="text-[8px] text-slate-400 font-mono truncate max-w-[150px]">{drv.vehicle} • {drv.plate}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[8px] font-extrabold font-mono px-2 py-0.5 rounded-full border leading-none ${
                          drv.verificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : drv.verificationStatus === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-350 animate-pulse'
                        }`}>
                          {drv.verificationStatus?.toUpperCase() || 'VERIFIED'}
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono font-bold">Earnings: ₹{(drv.earnings || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Document files */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 flex flex-col gap-1.5 text-[9px]">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] text-slate-400 font-bold uppercase font-mono">Driver License</span>
                          <span className="text-slate-800 font-mono font-bold leading-tight truncate underline">
                            📄 {drv.licenseFile || 'license_digital_ny.pdf'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] text-slate-400 font-bold uppercase font-mono">Vehicle Insurance</span>
                          <span className="text-slate-800 font-mono font-bold leading-tight truncate underline">
                            🛡️ {drv.insuranceFile || 'insurance_safeco.pdf'}
                          </span>
                        </div>
                      </div>
                      {drv.licenseExpiry && (
                        <div className="border-t border-slate-200 pt-1 flex justify-between items-center text-[8px]">
                          <span className="text-[7px] text-slate-400 font-bold uppercase font-mono">License Expiry:</span>
                          <span className="text-teal-950 bg-teal-55 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-100">{drv.licenseExpiry}</span>
                        </div>
                      )}
                      {drv.insuranceExpiry && (
                        <div className="border-t border-slate-100 pt-1 flex justify-between items-center text-[8px]">
                          <span className="text-[7px] text-slate-400 font-bold uppercase font-mono">Insurance Expiry:</span>
                          <span className="text-teal-950 bg-teal-55 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-100">{drv.insuranceExpiry}</span>
                        </div>
                      )}
                      {!drv.licenseExpiry && !drv.insuranceExpiry && drv.docValidity && (
                        <div className="border-t border-slate-200 pt-1 flex justify-between items-center text-[8px]">
                          <span className="text-[7px] text-slate-400 font-bold uppercase font-mono">Unified Expiry Date:</span>
                          <span className="text-teal-950 bg-teal-50 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-100">{drv.docValidity}</span>
                        </div>
                      )}
                    </div>

                    {drv.verificationReason && (
                      <div className="text-[9px] bg-rose-50 p-1.5 rounded-lg text-rose-800 font-semibold leading-snug">
                        ⚠️ <b className="font-mono uppercase text-[7px] text-rose-500">Rejection note:</b> {drv.verificationReason}
                      </div>
                    )}

                    {/* Verification Actions or Status Change */}
                    <div className="flex gap-2 items-center border-t border-slate-100 pt-2.5">
                      {drv.verificationStatus === 'pending' ? (
                        <>
                          {rejectionTargetId === drv.id ? (
                            <div className="w-full flex flex-col gap-1.5 bg-rose-50/20 p-2 border border-rose-205 rounded-xl">
                              <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide audit failure reason log..."
                                className="w-full p-1 border text-xs text-black font-semibold rounded bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 text-[10px]"
                                rows={2}
                              />
                              <div className="flex gap-1.5 self-end">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setRejectionTargetId(null);
                                    setRejectionReason('');
                                  }}
                                  className="px-2 py-0.5 text-[9px] bg-slate-200 text-slate-700 rounded-md font-bold"
                                >
                                  Cancel
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (!rejectionReason.trim()) return;
                                    onVerifyDriver(drv.id, 'rejected', rejectionReason.trim());
                                    setRejectionTargetId(null);
                                    setRejectionReason('');
                                  }}
                                  className="px-2.5 py-0.5 text-[9px] bg-rose-600 text-white rounded-md font-bold"
                                >
                                  Save Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => onVerifyDriver(drv.id, 'verified')}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[9px] uppercase rounded-lg shadow-sm transition-all"
                              >
                                ✓ Verify Driver
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectionTargetId(drv.id);
                                  setRejectionReason('');
                                }}
                                className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-mono font-bold text-[9px] uppercase rounded-lg transition-all"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[8px] font-mono text-zinc-400 font-bold">
                            ACCOUNT CONTROL:
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleBlockDriver(drv.id)}
                            className={`flex items-center gap-1 px-3 py-1 text-[9px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all duration-150 ${
                              drv.isBlocked
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-100 hover:bg-rose-250 text-rose-800 hover:text-white border border-rose-200'
                            }`}
                          >
                            {drv.isBlocked ? '🔓 Unblock Account' : '🔒 Block Account'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-dashed border-slate-200">
                      <span className="text-[8px] font-mono text-slate-405 font-bold">ADMIN TOOLBAR:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDriverId(drv.id);
                            setEditDriverName(drv.name || '');
                            setEditDriverVehicle(drv.vehicle || '');
                            setEditDriverPlate(drv.plate || '');
                          }}
                          className="flex items-center gap-0.5 text-[8.5px] font-mono text-blue-700 font-bold uppercase bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100"
                        >
                          📝 Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Permanently delete this driver account?")) {
                              onDeleteDriver?.(drv.id);
                            }
                          }}
                          className="flex items-center gap-0.5 text-[8.5px] font-mono text-rose-700 font-bold uppercase bg-rose-50 border border-rose-200 px-2 py-0.5 rounded hover:bg-rose-100"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RIDERS TAB PANEL */}
        {activeTab === 'riders' && (
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1 px-1">
              👥 Guest Riders Registry & Security
            </span>

            {riders.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                No rider accounts inside the municipality network.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {riders.map((r) => (
                  editingRiderId === r.id ? (
                    <div 
                      key={r.id} 
                      className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all flex flex-col gap-2.5"
                    >
                      <span className="text-[10px] font-mono font-bold text-teal-700 uppercase">Modify Guest Rider Profile</span>
                      <div className="flex flex-col gap-0.5 text-left">
                        <label className="text-[8px] text-slate-400 font-bold uppercase font-mono">Full Name</label>
                        <input
                          type="text"
                          value={editRiderName}
                          onChange={(e) => setEditRiderName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-black"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 text-left">
                        <label className="text-[8px] text-slate-400 font-bold uppercase font-mono">Wallet Balance (₹)</label>
                        <input
                          type="number"
                          value={editRiderBalance}
                          onChange={(e) => setEditRiderBalance(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-black"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Permanently delete this rider profile?")) {
                              onDeleteRider?.(r.id);
                              setEditingRiderId(null);
                            }
                          }}
                          className="px-2.5 py-1 text-[9px] bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold uppercase rounded-md shadow-sm transition-all"
                        >
                          🗑 Delete Rider
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingRiderId(null)}
                            className="px-2 py-1 text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onEditRider?.(r.id, {
                                name: editRiderName,
                                walletBalance: editRiderBalance,
                              });
                              setEditingRiderId(null);
                            }}
                            className="px-2.5 py-1 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold uppercase rounded-md shadow-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={r.id} 
                      className={`p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex flex-col gap-2 ${
                        r.isBlocked ? 'border-rose-300 bg-rose-50/5 hover:bg-rose-50/10' : 'border-slate-150'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col gap-1 min-w-0 pr-2 pb-1">
                          <h5 className="font-extrabold text-xs text-black flex items-center gap-1.5 truncate">
                            {r.name}
                            {r.isBlocked && (
                              <span className="text-[7px] bg-rose-600 text-white font-normal px-1 py-0.5 rounded font-mono uppercase">
                                Blocked
                              </span>
                            )}
                          </h5>
                          <p className="text-[8px] text-slate-400 font-mono truncate">{r.email}</p>
                          <span className="text-[8px] font-mono font-bold text-slate-500">Wallet: ₹{(r.walletBalance || 0).toFixed(1)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleBlockRider(r.id)}
                          className={`shrink-0 py-1 px-2.5 text-[8.5px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all duration-150 border ${
                            r.isBlocked
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {r.isBlocked ? '🔓 Unblock' : '🔒 Block'}
                        </button>
                      </div>

                      {/* Rider admin actions */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-slate-100 w-full mt-1">
                        <span className="text-[8px] font-mono text-slate-400">ADMIN ACTIONS:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRiderId(r.id);
                              setEditRiderName(r.name || '');
                              setEditRiderBalance(r.walletBalance || 0);
                            }}
                            className="flex items-center gap-0.5 text-[8.5px] font-mono text-blue-700 font-semibold uppercase bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-105 transition-all cursor-pointer"
                          >
                            📝 Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Permanently delete this rider profile?")) {
                                onDeleteRider?.(r.id);
                              }
                            }}
                            className="flex items-center gap-0.5 text-[8.5px] font-mono text-rose-700 font-semibold uppercase bg-rose-50 border border-rose-205 px-1.5 py-0.5 rounded hover:bg-rose-105 transition-all cursor-pointer"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* RATES CONFIGURATION TAB PANEL */}
        {activeTab === 'rates' && (
          <form onSubmit={handleSaveRates} className="flex flex-col gap-4 bg-white p-4 border border-slate-200 rounded-3xl shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                ⚙️ Configure Multipliers & Rates per km
              </span>
              <p className="text-[9px] text-slate-500">
                Adjust the base rate prices dynamically. These will take effect instantly in real-time passenger fare estimates.
              </p>
            </div>

            {rateFeedback && (
              <div className="text-[9px] font-bold p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{rateFeedback}</span>
              </div>
            )}

            {/* Comfort class rate */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-extrabold text-black uppercase font-mono text-[9px]">🚗 COLECTIVO COMFORT rate</label>
                <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ₹{editedComfortRate.toFixed(2)}/km
                </span>
              </div>
              <input 
                type="range" 
                min="4" 
                max="25" 
                step="0.5"
                value={editedComfortRate}
                onChange={(e) => setEditedComfortRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[7px] text-slate-400 font-mono font-bold uppercase">
                <span>Min: ₹4.0/km</span>
                <span>Max: ₹25.0/km</span>
              </div>
            </div>

            {/* Comfort plus class rate */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-extrabold text-black uppercase font-mono text-[9px]">✨ COLECTIVO COMFORT+ rate</label>
                <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  ₹{editedComfortPlusRate.toFixed(2)}/km
                </span>
              </div>
              <input 
                type="range" 
                min="6" 
                max="40" 
                step="0.5"
                value={editedComfortPlusRate}
                onChange={(e) => setEditedComfortPlusRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[7px] text-slate-400 font-mono font-bold uppercase">
                <span>Min: ₹6.0/km</span>
                <span>Max: ₹40.0/km</span>
              </div>
            </div>

            {/* Calculator Estimator Area */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col gap-1.5 text-[9px]">
              <span className="font-bold text-slate-700 uppercase font-mono text-[8px] tracking-wider">Fare Estimator Calculator (10 km run)</span>
              
              <div className="flex justify-between text-slate-600">
                <span>Comfort Base Estimate (No Surge):</span>
                <span className="font-mono font-bold text-black">₹{(10 * editedComfortRate).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-slate-600">
                <span>Comfort+ Base Estimate (No Surge):</span>
                <span className="font-mono font-bold text-black">₹{(10 * editedComfortPlusRate).toFixed(2)}</span>
              </div>

              <p className="text-[7.5px] leading-relaxed text-zinc-400 mt-1 italic">
                *Final invoice adds real-time multiplier surge factors if severe weather/traffic levels are applied.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Apply Rates Config
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
