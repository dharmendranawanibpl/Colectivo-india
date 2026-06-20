import { useState, useEffect, useRef } from 'react';
import { Sparkles, Car, ShieldCheck, Sun, CloudRain, Moon, Hourglass, Info, History, Users, Lock, Mail, LogIn, ShieldAlert, ArrowRight, ChevronDown, LogOut, User } from 'lucide-react';
import {
  CityData, 
  CityId, 
  Driver, 
  Ride, 
  Landmark, 
  PresetScenario, 
  PromoCode, 
  VehicleTier,
  ChatMessage,
  PastTrip,
  Rider
} from './types';
import { CITIES, VEHICLE_CONFIGS, PROMO_CODES, PRESET_SCENARIOS } from './constants/cities';
import { 
  calculateRouteDetails, 
  generateLicensePlate, 
  scatterDriverCoordinates,
  findClosestNode
} from './utils/routing';
import { getTodayString } from './utils/date';
import MapContainer from './components/MapContainer';
import PhonePassenger from './components/PhonePassenger';
import PhoneDriver from './components/PhoneDriver';
import AdminPortal from './components/AdminPortal';
import DashboardStats from './components/DashboardStats';
import TripHistoryModal from './components/TripHistoryModal';
import WebsiteHome from './components/WebsiteHome';
import WebsiteCities from './components/WebsiteCities';
import WebsiteCareers from './components/WebsiteCareers';
import WebsiteSupport from './components/WebsiteSupport';
import { 
  db, 
  saveDocument, 
  handleFirestoreError, 
  OperationType, 
  deleteDocument,
  doc, 
  onSnapshot, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection 
} from './lib/firebase';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const INITIAL_MOCK_DRIVERS: Omit<Driver, "x" | "y">[] = [
  {
    id: 'driver_alpha',
    name: 'Marcus Vance',
    avatar: '👨',
    rating: 4.9,
    status: 'idle',
    vehicle: 'White Tesla Model 3',
    plate: 'NY-4712',
    earnings: 142.50,
    tripsCount: 8,
    dailyTripsCount: 1, // 1 trip completed today
    lastTripDate: getTodayString(),
    speed: 3.5, // units per tick
    phone: '+1 (555) 321-9876',
    activeRideId: null,
    path: [],
    pathProgress: 0,
    email: 'vance@colectivo.com',
    password: 'sandbox123',
    verificationStatus: 'verified',
    licenseFile: 'license_nyc_vance.pdf',
    insuranceFile: 'state_farm_vance.pdf',
    walletBalance: 0,
  },
  {
    id: 'driver_beta',
    name: 'Sophia Patel',
    avatar: '👩',
    rating: 4.8,
    status: 'idle',
    vehicle: 'Black Toyota Camry',
    plate: 'SF-8809',
    earnings: 98.20,
    tripsCount: 5,
    dailyTripsCount: 3, // completed 3 trips today - now requires wallet balance
    lastTripDate: getTodayString(),
    speed: 3.0,
    phone: '+1 (555) 789-0123',
    activeRideId: null,
    path: [],
    pathProgress: 0,
    email: 'patel@colectivo.com',
    password: 'sandbox123',
    verificationStatus: 'verified',
    licenseFile: 'license_sf_patel.pdf',
    insuranceFile: 'geico_patel.pdf',
    walletBalance: 60,
  },
  {
    id: 'driver_gamma',
    name: 'Hiroshi Sato',
    avatar: '👨‍✈️',
    rating: 4.95,
    status: 'idle',
    vehicle: 'Silver Honda Accord',
    plate: 'TK-1140',
    earnings: 185.00,
    tripsCount: 12,
    dailyTripsCount: 0, // no trips today - free limit active
    lastTripDate: getTodayString(),
    speed: 4.0,
    phone: '+1 (555) 456-7890',
    activeRideId: null,
    path: [],
    pathProgress: 0,
    email: 'sato@colectivo.com',
    password: 'sandbox123',
    verificationStatus: 'verified',
    licenseFile: 'license_tok_sato.pdf',
    insuranceFile: 'axxa_sato.pdf',
    walletBalance: 120,
  }
];

export default function App() {
  // Global Simulation State
  const [currentCityId, setCurrentCityId] = useState<CityId>('delhi');
  const [partnerPortalMode, setPartnerPortalMode] = useState<'driver' | 'admin'>('driver');
  const [activeTab, setActiveTab] = useState<'home' | 'careers' | 'support' | 'simulator'>('home');
  const [simSelectedRole, setSimSelectedRole] = useState<'rider' | 'driver' | 'admin' | null>(null);
  const [adminMasterLoggedIn, setAdminMasterLoggedIn] = useState(false);
  const [isHeaderLoginDropdownOpen, setIsHeaderLoginDropdownOpen] = useState(false);
  const headerLoginDropdownRef = useRef<HTMLDivElement>(null);

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Synchronized Search Space for Pickup and Drop (synchronized with MapContainer)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchType, setActiveSearchType] = useState<'pickup' | 'dropoff'>('pickup');
  const [googlePlaces, setGooglePlaces] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const autoDetectNearestCity = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported by browser.");
      return;
    }
    setIsLocatingGPS(true);
    setLocationMessage("Locating nearest hub...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        
        let nearestCity = CITIES[0];
        let minDistance = Infinity;
        
        for (const city of CITIES) {
          const distance = Math.pow(uLat - city.center.lat, 2) + Math.pow(uLng - city.center.lng, 2);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
          }
        }
        
        console.log(`Located nearest dispatch hub: ${nearestCity.name}`);
        setCurrentCityId(nearestCity.id);
        setIsLocatingGPS(false);
        setLocationMessage(`Routed to closest node: ${nearestCity.name} via GPS services.`);
        setTimeout(() => setLocationMessage(null), 7000);
      },
      (err) => {
        console.warn("Could not retrieve GPS coordinates for auto-detection:", err);
        setIsLocatingGPS(false);
        setLocationMessage(null);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    // Run auto-locate on initial app mount
    autoDetectNearestCity();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerLoginDropdownRef.current && !headerLoginDropdownRef.current.contains(event.target as Node)) {
        setIsHeaderLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Unified Gate Forms States
  const [gateRiderEmail, setGateRiderEmail] = useState('rider@colectivo.com');
  const [gateRiderPassword, setGateRiderPassword] = useState('sandbox123');
  const [gateRiderError, setGateRiderError] = useState<string | null>(null);

  const [gateDriverEmail, setGateDriverEmail] = useState('vance@colectivo.com');
  const [gateDriverPassword, setGateDriverPassword] = useState('sandbox123');
  const [gateDriverError, setGateDriverError] = useState<string | null>(null);

  const [gateAdminUser, setGateAdminUser] = useState('ADMIN');
  const [gateAdminPass, setGateAdminPass] = useState('12345');
  const [gateAdminError, setGateAdminError] = useState<string | null>(null);

  // Rider Registrations & Auth States
  const [riders, setRiders] = useState<Rider[]>(() => [
    {
      id: 'rider_demo',
      name: 'Alex Rider',
      email: 'rider@colectivo.com',
      password: 'sandbox123',
      walletBalance: 20000.00
    }
  ]);
  const [currentRider, setCurrentRider] = useState<Rider | null>(null);

  // Driver Active Context
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [simulationEarnings, setSimulationEarnings] = useState(3880.00);
  const [completedTripsCount, setCompletedTripsCount] = useState(3);
  const [reviewsList, setReviewsList] = useState<{ rating: number; feedback: string }[]>([
    { rating: 5, feedback: 'Polite Driver, Clean Car' },
    { rating: 4, feedback: 'Fast Route' },
    { rating: 5, feedback: 'Safe Driving, Comfy Ride' }
  ]);

  // Scenario presets
  const [selectedScenario, setSelectedScenario] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'night'>('sunny');
  const [trafficLevel, setTrafficLevel] = useState<'light' | 'moderate' | 'heavy'>('light');
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);

  // Dynamic tariff rates (configured by Colectivo administrators)
  const [comfortRate, setComfortRate] = useState(9.0);
  const [comfortPlusRate, setComfortPlusRate] = useState(13.0);

  // Passenger controls
  const [selectedPickup, setSelectedPickup] = useState<Landmark | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<Landmark | null>(null);
  const [passengerWallet, setPassengerWallet] = useState(20000.00);
  const [promoCodeApplied, setPromoCodeApplied] = useState<PromoCode | null>(null);

  // Active bookings coordination
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  // Trip History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tripHistory, setTripHistory] = useState<PastTrip[]>(() => [
    {
      id: 'hist_1',
      cityId: 'delhi',
      pickupName: 'India Gate South',
      dropoffName: 'Red Fort',
      driverName: 'Marcus Vance',
      driverAvatar: '👨‍✈️',
      vehicleName: 'White Tesla Model 3',
      price: 90.00,
      distance: 10.0,
      tierName: 'Comfort',
      timestamp: 'Today, 11:24 AM',
      rating: 5,
    },
    {
      id: 'hist_2',
      cityId: 'mumbai',
      pickupName: 'Marine Drive Promenade',
      dropoffName: 'Gateway of India',
      driverName: 'Sophia Patel',
      driverAvatar: '👩‍✈️',
      vehicleName: 'Black Toyota Camry',
      price: 156.00,
      distance: 12.0,
      tierName: 'Comfort +',
      timestamp: 'Yesterday, 8:45 PM',
      rating: 4,
    },
    {
      id: 'hist_3',
      cityId: 'bengaluru',
      pickupName: 'Cubbon Park Area',
      dropoffName: 'Bangalore Palace',
      driverName: 'Hiroshi Sato',
      driverAvatar: '👨‍✈️',
      vehicleName: 'Silver Honda Accord',
      price: 180.00,
      distance: 20.0,
      tierName: 'Comfort',
      timestamp: 'Yesterday, 2:15 PM',
      rating: 5,
    }
  ]);


  // Initialize drivers state
  const currentCity = CITIES.find(c => c.id === currentCityId)!;
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    // Scaffold drivers relative to NYC grid nodes
    const cityNodes = CITIES[0].nodes;
    return INITIAL_MOCK_DRIVERS.map((drv, index) => {
      const coord = scatterDriverCoordinates(cityNodes);
      return {
        ...drv,
        x: coord.x,
        y: coord.y,
        idleStartedAt: Date.now() - (INITIAL_MOCK_DRIVERS.length - index) * 60000,
      };
    });
  });

  // Re-scatter drivers on city switches
  useEffect(() => {
    setSelectedPickup(null);
    setSelectedDropoff(null);
    setPromoCodeApplied(null);
    setActiveRide(null);

    setDrivers(prev => 
      prev.map((drv, index) => {
        const coords = scatterDriverCoordinates(currentCity.nodes);
        return {
          ...drv,
          status: drv.status === 'offline' ? 'offline' : 'idle',
          x: coords.x,
          y: coords.y,
          activeRideId: null,
          path: [],
          pathProgress: 0,
          idleStartedAt: drv.status === 'offline' ? undefined : (Date.now() - (3 - index) * 60000),
        };
      })
    );
  }, [currentCityId]);

  // Sync currentDriver with drivers list updates (status, earnings, tripsCount, walletBalance, etc.)
  useEffect(() => {
    if (currentDriver) {
      const updated = drivers.find(d => d.id === currentDriver.id);
      if (updated) {
        if (
          updated.status !== currentDriver.status ||
          updated.earnings !== currentDriver.earnings ||
          updated.tripsCount !== currentDriver.tripsCount ||
          updated.walletBalance !== currentDriver.walletBalance ||
          updated.isBlocked !== currentDriver.isBlocked ||
          updated.verificationStatus !== currentDriver.verificationStatus
        ) {
          setCurrentDriver(updated);
        }
      }
    }
  }, [drivers, currentDriver?.id]);

  // --- FIREBASE SYNCHRONIZATION EFFECT ---
  useEffect(() => {
    let active = true;

    // 1. Check and Bootstrap Riders
    const checkAndInitRiders = async () => {
      try {
        let querySnapshot;
        try {
          querySnapshot = await getDocs(collection(db, 'riders'));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'riders');
        }
        if (querySnapshot.empty && active) {
          const initialRider = {
            id: 'rider_demo',
            name: 'Alex Rider',
            email: 'rider@colectivo.com',
            password: 'sandbox123',
            walletBalance: 20000.00,
            isBlocked: false
          };
          try {
            await setDoc(doc(db, 'riders', 'rider_demo'), initialRider);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'riders/rider_demo');
          }
        }
      } catch (err) {
        console.warn("Bootstrap riders failed:", err);
      }
    };

    // 2. Check and Bootstrap Drivers
    const checkAndInitDrivers = async () => {
      try {
        let querySnapshot;
        try {
          querySnapshot = await getDocs(collection(db, 'drivers'));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'drivers');
        }
        if (querySnapshot.empty && active) {
          const cityNodes = currentCity.nodes;
          const initialWithCoords = INITIAL_MOCK_DRIVERS.map((drv, index) => {
            const coord = scatterDriverCoordinates(cityNodes);
            return {
              ...drv,
              x: coord.x,
              y: coord.y,
              idleStartedAt: Date.now() - (INITIAL_MOCK_DRIVERS.length - index) * 60000,
              status: drv.id === 'driver_alpha' ? 'idle' : 'offline',
              isBlocked: false,
              earnings: 3880.00,
              tripsCount: 3,
              walletBalance: 1000.00,
              verificationStatus: 'verified',
              email: drv.id === 'driver_alpha' ? 'vance@colectivo.com' : (drv.id === 'driver_beta' ? 'patel@colectivo.com' : 'sato@colectivo.com'),
              password: 'sandbox123',
            };
          });
          for (const d of initialWithCoords) {
            try {
              await setDoc(doc(db, 'drivers', d.id), d);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `drivers/${d.id}`);
            }
          }
        }
      } catch (err) {
        console.warn("Bootstrap drivers failed:", err);
      }
    };

    // 3. Check and Bootstrap Settings (rates)
    const checkAndInitSettings = async () => {
      try {
        let docSnap;
        try {
          docSnap = await getDoc(doc(db, 'settings', 'rates'));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'settings/rates');
        }
        if (!docSnap.exists() && active) {
          try {
            await setDoc(doc(db, 'settings', 'rates'), {
              comfortRate: 9.0,
              comfortPlusRate: 13.0
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'settings/rates');
          }
        }
      } catch (err) {
        console.warn("Bootstrap settings failed:", err);
      }
    };

    // Run bootstraps sequentially
    const runBootstraps = async () => {
      await checkAndInitRiders();
      await checkAndInitDrivers();
      await checkAndInitSettings();
    };
    runBootstraps();

    // Setup active listeners
    const unsubRiders = onSnapshot(collection(db, 'riders'), (snapshot) => {
      if (!active) return;
      const items: Rider[] = [];
      snapshot.forEach(doc => {
        items.push(doc.data() as Rider);
      });
      if (items.length > 0) {
        setRiders(items);
        // Sync logged in rider context
        if (currentRider) {
          const matched = items.find(r => r.id === currentRider.id);
          if (matched) {
            setCurrentRider(matched);
            setPassengerWallet(matched.walletBalance);
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'riders');
    });

    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      if (!active) return;
      const items: Driver[] = [];
      snapshot.forEach(doc => {
        items.push(doc.data() as Driver);
      });
      if (items.length > 0) {
        setDrivers(items);
        // Sync logged in driver context
        if (currentDriver) {
          const matched = items.find(d => d.id === currentDriver.id);
          if (matched) {
            setCurrentDriver(matched);
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'drivers');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'rates'), (snap) => {
      if (!active) return;
      if (snap.exists()) {
        const data = snap.data();
        if (data.comfortRate !== undefined) setComfortRate(data.comfortRate);
        if (data.comfortPlusRate !== undefined) setComfortPlusRate(data.comfortPlusRate);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/rates');
    });

    return () => {
      active = false;
      unsubRiders();
      unsubDrivers();
      unsubSettings();
    };
  }, [currentCityId]);

  // Matchmaking timer for priority offers
  useEffect(() => {
    if (!activeRide || activeRide.queueState !== 'priority' || activeRide.priorityCountdown === undefined) return;

    const timer = setInterval(() => {
      setActiveRide(prev => {
        if (!prev || prev.queueState !== 'priority' || prev.priorityCountdown === undefined) {
          clearInterval(timer);
          return prev;
        }

        const nextCountdown = prev.priorityCountdown - 1;

        if (nextCountdown <= 0) {
          // Priority expired! Transition to broadcast
          clearInterval(timer);

          // We find the next available driver in the queue (or any other driver) to accept it
          setTimeout(() => {
            setDrivers(currentDrivers => {
              const queueIds = prev.queueDrivers?.map(qd => qd.driverId) || [];
              const broadcastCandidates = currentDrivers.filter(d => {
                if (d.status !== 'idle') return false;
                if (d.id === prev.priorityDriverId) return false; // exclude priority driver who expired
                return queueIds.includes(d.id);
              });

              let winnerId: string | null = null;
              if (broadcastCandidates.length > 0) {
                winnerId = broadcastCandidates[Math.floor(Math.random() * broadcastCandidates.length)].id;
              } else {
                const anyIdle = currentDrivers.filter(d => d.status === 'idle' && d.id !== prev.priorityDriverId);
                if (anyIdle.length > 0) {
                  winnerId = anyIdle[0].id;
                }
              }

              if (winnerId) {
                const isWinnerControlled = currentDriver && (winnerId === currentDriver.id);
                
                setActiveRide(ride => {
                  if (!ride || ride.id !== prev.id) return ride;
                  return {
                    ...ride,
                    status: isWinnerControlled ? 'offered' : 'picking_up',
                    queueState: 'broadcast',
                    driverId: winnerId,
                    priorityDriverId: null,
                  };
                });

                return currentDrivers.map(d => {
                  if (d.id === winnerId) {
                    const { path: pickupPath } = calculateRouteDetails(
                      { id: 'driver_start', name: 'Start', icon: 'Car', x: d.x, y: d.y, description: '' },
                      prev.pickup,
                      currentCity,
                      trafficLevel
                    );
                    return {
                      ...d,
                      status: isWinnerControlled ? 'idle' : 'going_to_pickup',
                      activeRideId: prev.id,
                      path: pickupPath,
                      pathProgress: 0,
                    };
                  }
                  return d;
                });
              } else {
                setActiveRide(ride => {
                  if (!ride || ride.id !== prev.id) return ride;
                  return { ...ride, status: 'cancelled' };
                });
                return currentDrivers;
              }
            });
          }, 1500);

          return {
            ...prev,
            priorityCountdown: 0,
            queueState: 'broadcast',
          };
        }

        // Simulating matching bot acceptance chance during the countdown
        const isBot = currentDriver ? (prev.priorityDriverId !== currentDriver.id) : (prev.priorityDriverId !== 'driver_alpha');
        if (isBot && Math.random() < 0.25) {
          clearInterval(timer);
          
          setTimeout(() => {
            setDrivers(currentDrivers => {
              const winnerId = prev.priorityDriverId!;
              setActiveRide(ride => {
                if (!ride || ride.id !== prev.id) return ride;
                return {
                  ...ride,
                  status: 'picking_up',
                  queueState: undefined,
                  driverId: winnerId,
                };
              });

              return currentDrivers.map(d => {
                if (d.id === winnerId) {
                  const { path: pickupPath } = calculateRouteDetails(
                    { id: 'driver_start', name: 'Start', icon: 'Car', x: d.x, y: d.y, description: '' },
                    prev.pickup,
                    currentCity,
                    trafficLevel
                  );
                  return {
                    ...d,
                    status: 'going_to_pickup',
                    activeRideId: prev.id,
                    path: pickupPath,
                    pathProgress: 0,
                  };
                }
                return d;
              });
            });
          }, 500);
        }

        return {
          ...prev,
          priorityCountdown: nextCountdown,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRide?.id, activeRide?.queueState, activeRide?.priorityCountdown, currentDriver?.id, currentCity, trafficLevel]);

  // Handle Scenario trigger changes
  useEffect(() => {
    setWeather(selectedScenario.weather);
    setTrafficLevel(selectedScenario.trafficLevel);
    setSurgeMultiplier(selectedScenario.surgeMultiplier);
  }, [selectedScenario]);

  // CORE TICK SIMULATION LOOP
  // Triggers coordinate moves, speed crawling, and autonomous loops
  useEffect(() => {
    const loopInterval = setInterval(() => {
      // 1. Move Active Driving Entities
      setDrivers(prevDrivers => 
        prevDrivers.map(drv => {
          // If driver is idle, make them "roam/patrol" around nearby intersections occasionally
          if (drv.status === 'idle') {
            const shouldRoam = Math.random() < 0.15;
            if (shouldRoam) {
              const currentNode = findClosestNode(drv.x, drv.y, currentCity.nodes);
              const neighboringEdges = currentCity.edges.filter(e => e.from === currentNode.id || e.to === currentNode.id);
              if (neighboringEdges.length > 0) {
                const targetEdge = neighboringEdges[Math.floor(Math.random() * neighboringEdges.length)];
                const nextNodeId = targetEdge.from === currentNode.id ? targetEdge.to : targetEdge.from;
                const nextNode = currentCity.nodes.find(n => n.id === nextNodeId);
                if (nextNode) {
                  // Crawl driver toward neighbors
                  return {
                    ...drv,
                    x: Math.max(5, Math.min(95, drv.x + (nextNode.x - drv.x) * 0.15)),
                    y: Math.max(5, Math.min(95, drv.y + (nextNode.y - drv.y) * 0.15)),
                  };
                }
              }
            }
            return drv;
          }

          // If driver is offline, let them seek rest
          if (drv.status === 'offline') {
            return drv;
          }

          // If driver is actively driving on a path (picking_up, arriving, carrying)
          if (drv.path && drv.path.length > 0) {
            const currentPathIndex = drv.pathProgress;
            if (currentPathIndex >= drv.path.length) {
              return drv; // path finished already
            }

            const targetNode = drv.path[currentPathIndex];
            const dx = targetNode.x - drv.x;
            const dy = targetNode.y - drv.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Speed scales by traffic level
            let activeSpeed = drv.speed;
            if (trafficLevel === 'moderate') activeSpeed *= 0.7;
            else if (trafficLevel === 'heavy') activeSpeed *= 0.45;

            if (dist <= activeSpeed) {
              // Reached node - snap and proceed to next node index
              const nextIndex = currentPathIndex + 1;
              if (nextIndex >= drv.path.length) {
                // Reached absolute terminal destination waypoint!
                // Trigger transition callback in parent coordination loop
                triggerPathCompletion(drv);
                return {
                  ...drv,
                  x: targetNode.x,
                  y: targetNode.y,
                  pathProgress: nextIndex,
                };
              } else {
                return {
                  ...drv,
                  x: targetNode.x,
                  y: targetNode.y,
                  pathProgress: nextIndex,
                };
              }
            } else {
              // Linear interpolation towards node target
              const ratio = activeSpeed / dist;
              return {
                ...drv,
                x: drv.x + dx * ratio,
                y: drv.y + dy * ratio,
              };
            }
          }

          return drv;
        })
      );

      // Decrement remaining minutes for active bookings realistically
      setActiveRide(prev => {
        if (!prev || prev.status === 'idle' || prev.status === 'searching' || prev.status === 'completed') return prev;
        
        // Occasionally cycle down ETA mock clock
        if (Math.random() < 0.1) {
          const nextEta = Math.max(1, prev.eta - 1);
          // Jitter distances block
          const nextDist = parseFloat(Math.max(0.1, prev.distance - 0.2).toFixed(1));
          return {
            ...prev,
            eta: nextEta,
            distance: nextDist
          };
        }
        return prev;
      });

    }, 800);

    return () => clearInterval(loopInterval);
  }, [currentCity, trafficLevel, activeRide]);

  // Autonomous state triggers when node endpoints are reached
  const triggerPathCompletion = (driver: Driver) => {
    setActiveRide(prevRide => {
      if (!prevRide || prevRide.driverId !== driver.id) return prevRide;

      if (prevRide.status === 'picking_up') {
        // Automatically switch driver status on reach
        setDrivers(prevSet => 
          prevSet.map(d => d.id === driver.id ? { ...d, status: 'at_pickup' } : d)
        );
        return {
          ...prevRide,
          status: 'arrived',
          eta: 0,
          distance: 0,
        };
      } else if (prevRide.status === 'in_transit') {
        // Update driver status, pay earnings, increment trips count, and charge wallet fees if > 3 rides completed
        setDrivers(prevSet => 
          prevSet.map(d => {
            if (d.id === driver.id) {
              const today = getTodayString();
              const prevDailyTrips = d.lastTripDate === today ? (d.dailyTripsCount ?? 0) : 0;
              const isCharged = prevDailyTrips >= 3;
              const originalWallet = d.walletBalance ?? 0;
              const updatedWallet = isCharged ? Math.max(0, originalWallet - 10) : originalWallet;
              return {
                ...d,
                status: 'idle',
                idleStartedAt: Date.now(),
                activeRideId: null,
                path: [],
                pathProgress: 0,
                earnings: d.earnings + prevRide.price,
                tripsCount: (d.tripsCount || 0) + 1,
                dailyTripsCount: prevDailyTrips + 1,
                lastTripDate: today,
                walletBalance: updatedWallet
              };
            }
            return d;
          })
        );

        // Update overall simulation telemetry metrics
        setSimulationEarnings(prevE => prevE + prevRide.price * 0.25);
        setCompletedTripsCount(prevC => prevC + 1);

        // Deduct from customer balance
        setPassengerWallet(prevW => Math.max(0, prevW - prevRide.price));

        return {
          ...prevRide,
          status: 'completed',
          eta: 0,
          distance: 0,
        };
      }
      return prevRide;
    });
  };

  // AUTOPLAY DEMO AUTOMATION LOOP
  // Simulates passengers clicking, requesting, drivers accepting, chatting, and rating autonomously!
  useEffect(() => {
    if (!autoPlay) return;

    const autoplayInterval = setInterval(() => {
      // Step A: If no ride is active, trigger an automated booking request!
      if (!activeRide) {
        // Select random pickup and dropoff landmarks
        if (currentCity.landmarks.length < 2) return;
        
        const landmarksList = [...currentCity.landmarks];
        const pIdx = Math.floor(Math.random() * landmarksList.length);
        const pickup = landmarksList[pIdx];
        
        // filter out pickup to get unique dropping spot
        const dropsList = landmarksList.filter(l => l.id !== pickup.id);
        const dropoff = dropsList[Math.floor(Math.random() * dropsList.length)];

        setSelectedPickup(pickup);
        setSelectedDropoff(dropoff);

        // Accept random vehicle tier and apply random coupon rules
        const tiers: VehicleTier[] = ['comfort', 'comfortplus'];
        const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
        
        const usePromo = Math.random() < 0.4;
        if (usePromo) {
          const randPromo = PROMO_CODES[Math.floor(Math.random() * PROMO_CODES.length)];
          setPromoCodeApplied(randPromo);
        }

        // Trigger request
        handleRequestRide(randomTier, usePromo ? PROMO_CODES[0].code : '');
      }

      // Step B: If ride is offering to driver app, auto-accept it!
      if (activeRide && activeRide.status === 'offered') {
        handleAcceptRide();
      }

      // Step C: If driver is at pickup waiting, start the trip
      if (activeRide && activeRide.status === 'arrived') {
        handleStartTrip();
      }

      // Step D: When ride is completed, automatically post a positive review rating and resume
      if (activeRide && activeRide.status === 'completed' && !activeRide.isPaid) {
        const comments = [
          'Excellent prompt trip, clean car!',
          'Polite driver, very neat routing.',
          'Awesome ride-sharing, very convenient.',
          'Outstanding driver and newer vehicle!'
        ];
        const randComment = comments[Math.floor(Math.random() * comments.length)];
        const randStars = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars

        handleCompleteRating(randStars, randComment);
        
        // Reset selections
        setSelectedPickup(null);
        setSelectedDropoff(null);
        setPromoCodeApplied(null);
      }

    }, 3000); // execute steps every 3s during autoplay demo

    return () => clearInterval(autoplayInterval);
  }, [autoPlay, activeRide, currentCity]);

  // Dynamic automatic responses simulation for Passenger/Driver in-transit chatting
  useEffect(() => {
    if (!activeRide || activeRide.messages.length === 0) return;
    const lastMsg = activeRide.messages[activeRide.messages.length - 1];
    
    // Ignore automatic loop triggers
    if (lastMsg.id.endsWith('_auto_reply')) return;

    // Simulate reply delay
    const chatTimeout = setTimeout(() => {
      let replyText = '';
      
      if (lastMsg.sender === 'passenger') {
        // Driver answers
        const responses: Record<string, string> = {
          'I am waiting outside.': 'Got it! Just rounding up the avenue block.',
          'In details: wearing a coat.': 'Terrific, I will look for your jacket.',
          'Okay, got it!': 'Perfect. See you in a minute.',
          'Hurry please.': 'Driving as fast and safe as grid traffic grants.'
        };
        replyText = responses[lastMsg.text] || 'Okay, I am tracking you on GPS maps.';
        
        handleInsertMessage('driver', replyText, true);
      } else {
        // Passenger answers back
        const responses: Record<string, string> = {
          'I am stuck in traffic, be there in 3 minutes.': 'Alright, no worries. Thanks for updating!',
          'I have arrived at the pickup spot.': 'Great, walking outside now.',
          'Okay, see you soon!': 'Sounds good!',
          'Can you verify your clothes?': 'I have got blue jeans and a black hoodie on.'
        };
        replyText = responses[lastMsg.text] || 'Confirming that on my screen.';

        handleInsertMessage('passenger', replyText, true);
      }
    }, 1500);

    return () => clearTimeout(chatTimeout);

  }, [activeRide?.messages?.length]);


  // ACTORS & ACTIONS IMPLEMENTATION

  // Rider Handlers
  const handleRiderLogin = (email: string, pass: string): string | null => {
    const found = riders.find(r => r.email.trim().toLowerCase() === email.trim().toLowerCase() && r.password === pass);
    if (found) {
      if (found.isBlocked) {
        return "Your rider account has been suspended by the municipal administration for policy violations.";
      }
      setCurrentRider(found);
      setPassengerWallet(found.walletBalance);
      return null;
    }
    return "Invalid credentials. Create a sandbox rider account below to continue.";
  };

  const handleRiderRegister = (name: string, email: string, pass: string, initialBalance: number) => {
    const newRider: Rider = {
      id: `rider_${Date.now()}`,
      name,
      email,
      password: pass,
      walletBalance: initialBalance,
      isBlocked: false
    };
    saveDocument('riders', newRider.id, newRider);
    setRiders(prev => [...prev, newRider]);
    setCurrentRider(newRider);
    setPassengerWallet(initialBalance);
  };

  const handleRiderLogout = () => {
    setCurrentRider(null);
  };

  // Driver Handlers
  const handleDriverLogin = (email: string, pass: string): string | null => {
    const found = drivers.find(d => d.email?.trim().toLowerCase() === email.trim().toLowerCase() && d.password === pass);
    if (found) {
      if (found.isBlocked) {
        return "Your driver registration has been suspended by the municipal administration for policy violations.";
      }
      setCurrentDriver(found);
      return null;
    }
    return "No driver found with matching email & password. Register a new vehicle to try audit processing.";
  };

  const handleDriverRegister = (driverData: Partial<Driver>) => {
    const targetCityId = driverData.cityId || currentCityId;
    const targetCity = CITIES.find(c => c.id === targetCityId) || currentCity;
    const coords = scatterDriverCoordinates(targetCity.nodes);
    const newDrv: Driver = {
      id: `driver_${Date.now()}`,
      name: driverData.name || 'Anonymous Partner',
      avatar: '👨‍✈️',
      rating: 5.0,
      status: 'offline',
      vehicle: driverData.vehicle || 'Standard Car',
      plate: driverData.plate || 'NY-1234',
      earnings: 0,
      tripsCount: 0,
      speed: 3.2,
      phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
      activeRideId: null,
      path: [],
      pathProgress: 0,
      email: driverData.email,
      password: driverData.password,
      verificationStatus: 'pending',
      licenseFile: driverData.licenseFile,
      insuranceFile: driverData.insuranceFile,
      docValidity: driverData.docValidity,
      licenseExpiry: driverData.licenseExpiry,
      insuranceExpiry: driverData.insuranceExpiry,
      x: coords.x,
      y: coords.y,
      walletBalance: 0,
      cityId: targetCityId,
      dailyTripsCount: 0,
      lastTripDate: getTodayString(),
    };
    saveDocument('drivers', newDrv.id, newDrv);
    setDrivers(prev => [...prev, newDrv]);
    setCurrentDriver(newDrv);
    setCurrentCityId(targetCityId);
  };

  const handleDriverLogout = () => {
    setCurrentDriver(null);
  };

  const handleResubmitDocuments = (driverId: string, vehicle: string, plate: string, license: string, insurance: string, licenseExpiry: string, insuranceExpiry: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const updated = {
          ...d,
          vehicle,
          plate,
          licenseFile: license,
          insuranceFile: insurance,
          docValidity: licenseExpiry,
          licenseExpiry,
          insuranceExpiry,
          verificationStatus: 'pending' as const,
          verificationReason: undefined
        };
        saveDocument('drivers', driverId, updated);
        if (currentDriver && currentDriver.id === driverId) {
          setCurrentDriver(updated);
        }
        return updated;
      }
      return d;
    }));
  };

  const handleVerifyDriver = (driverId: string, status: 'verified' | 'rejected', reason?: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const updated = {
          ...d,
          verificationStatus: status,
          verificationReason: reason
        };
        saveDocument('drivers', driverId, updated);
        if (currentDriver && currentDriver.id === driverId) {
          setCurrentDriver(updated);
        }
        return updated;
      }
      return d;
    }));
  };

  const handleToggleBlockDriver = (driverId: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const updated = {
          ...d,
          isBlocked: !d.isBlocked
        };
        saveDocument('drivers', driverId, updated);
        if (currentDriver && currentDriver.id === driverId) {
          setCurrentDriver(updated);
        }
        return updated;
      }
      return d;
    }));
  };

  const handleToggleBlockRider = (riderId: string) => {
    setRiders(prev => prev.map(r => {
      if (r.id === riderId) {
        const updated = {
          ...r,
          isBlocked: !r.isBlocked
        };
        saveDocument('riders', riderId, updated);
        if (currentRider && currentRider.id === riderId) {
          setCurrentRider(updated);
        }
        return updated;
      }
      return r;
    }));
  };

  const handleDeleteDriver = (driverId: string) => {
    deleteDocument('drivers', driverId);
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    if (currentDriver && currentDriver.id === driverId) {
      setCurrentDriver(null);
    }
  };

  const handleEditDriver = (driverId: string, updatedFields: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const updated = { ...d, ...updatedFields };
        saveDocument('drivers', driverId, updated);
        if (currentDriver && currentDriver.id === driverId) {
          setCurrentDriver(updated);
        }
        return updated;
      }
      return d;
    }));
  };

  const handleDeleteRider = (riderId: string) => {
    deleteDocument('riders', riderId);
    setRiders(prev => prev.filter(r => r.id !== riderId));
    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(null);
    }
  };

  const handleEditRider = (riderId: string, updatedFields: Partial<Rider>) => {
    setRiders(prev => prev.map(r => {
      if (r.id === riderId) {
        const updated = { ...r, ...updatedFields };
        saveDocument('riders', riderId, updated);
        if (currentRider && currentRider.id === riderId) {
          setCurrentRider(updated);
        }
        return updated;
      }
      return r;
    }));
  };

  const handleUpdateRates = (comfort: number, comfortPlus: number) => {
    setComfortRate(comfort);
    setComfortPlusRate(comfortPlus);
    saveDocument('settings', 'rates', { comfortRate: comfort, comfortPlusRate: comfortPlus });
  };

  // Toggle online driver status
  const handleToggleOnline = () => {
    const targetDriverId = currentDriver?.id || 'driver_alpha';
    setDrivers(prev => 
      prev.map(drv => {
        if (drv.id === targetDriverId) {
          const updated = {
            ...drv,
            status: drv.status === 'offline' ? 'idle' : 'offline'
          };
          if (currentDriver && currentDriver.id === targetDriverId) {
            setCurrentDriver(updated);
          }
          return updated;
        }
        return drv;
      })
    );
  };

  // Request a ride from user passenger app
  const handleRequestRide = (tier: VehicleTier, promoCode: string) => {
    if (!selectedPickup || !selectedDropoff) return;

    // A. Estimate route
    const { path, distanceMiles, durationMinutes } = calculateRouteDetails(
      selectedPickup,
      selectedDropoff,
      currentCity,
      trafficLevel
    );

    // Calc tariff price based on dynamic rates for comfort and comfortplus
    const distanceKm = parseFloat((distanceMiles * 1.60934).toFixed(1));
    const ratePerKm = tier === 'comfort' ? comfortRate : comfortPlusRate;
    const baseTariff = distanceKm * ratePerKm;
    let finalAmt = baseTariff * surgeMultiplier;

    // Minimum ride fare is ₹50, adjusted by km if the calculated rate exceeds ₹50
    if (finalAmt < 50.0) {
      finalAmt = 50.0;
    }

    // B. Scaffold Ride Record
    const otpVal = Math.floor(1000 + Math.random() * 9000).toString();
    const newRide: Ride = {
      id: `ride_${Date.now()}`,
      cityId: currentCityId,
      pickup: selectedPickup,
      dropoff: selectedDropoff,
      status: 'searching',
      tier,
      price: parseFloat(finalAmt.toFixed(2)),
      distance: distanceKm,
      originalDistance: distanceKm,
      eta: durationMinutes,
      driverId: null,
      createdAt: new Date().toLocaleTimeString(),
      passengerRating: null,
      driverRating: null,
      messages: [],
      surgeMultiplier,
      isPaid: false,
      otp: otpVal,
    };

    setActiveRide(newRide);

    // C. Find and offer to nearest online idle driver after small matching timeout
    setTimeout(() => {
      setDrivers(currentDrivers => {
        const available = currentDrivers.filter(d => {
          if (d.status !== 'idle') return false;
          if (d.isBlocked) return false;
          if (d.verificationStatus === 'rejected') return false;
          const today = getTodayString();
          const dailyTrips = d.lastTripDate === today ? (d.dailyTripsCount ?? 0) : 0;
          if (dailyTrips >= 3) {
            const balance = d.walletBalance ?? 0;
            if (balance <= 0) return false;
          }
          return true;
        });

        if (available.length === 0) {
          // fallback if all drivers are carrying, force free alpha
          const fallbackId = currentDriver?.id || 'driver_alpha';
          const fallback = currentDrivers.find(d => d.id === fallbackId);
          if (fallback && fallback.status !== 'offline') {
            const today = getTodayString();
            const fallbackDailyTrips = fallback.lastTripDate === today ? (fallback.dailyTripsCount ?? 0) : 0;
            const fallbackBalance = fallback.walletBalance ?? 0;
            if (fallbackDailyTrips < 3 || fallbackBalance > 0) {
              available.push(fallback);
            }
          }
        }

        if (available.length > 0) {
          // Use driver queue for every 1 km:
          // A. Group by 1 km zone from selectedPickup
          let activeQueueDrivers: { driver: Driver; distance: number }[] = [];
          let queueZoneKm = 1;

          for (let zone = 1; zone <= 100; zone++) {
            const driversInZone = available.filter(d => {
              const distGrid = Math.sqrt((d.x - selectedPickup.x) ** 2 + (d.y - selectedPickup.y) ** 2);
              const distKm = distGrid * 0.12 * 1.60934;
              return distKm > (zone - 1) && distKm <= zone;
            });
            if (driversInZone.length > 0) {
              queueZoneKm = zone;
              activeQueueDrivers = driversInZone.map(d => {
                const distGrid = Math.sqrt((d.x - selectedPickup.x) ** 2 + (d.y - selectedPickup.y) ** 2);
                return { driver: d, distance: distGrid * 0.12 * 1.60934 };
              });
              break;
            }
          }

          // If somehow no driver was within zones, fallback to any available
          if (activeQueueDrivers.length === 0) {
            queueZoneKm = 5;
            activeQueueDrivers = available.map(d => {
              const distGrid = Math.sqrt((d.x - selectedPickup.x) ** 2 + (d.y - selectedPickup.y) ** 2);
              return { driver: d, distance: distGrid * 0.12 * 1.60934 };
            });
          }

          // B. "if driver come first he will get priority rides while stopping"
          // Sort the drivers in this selected queue by idleStartedAt (earliest timestamp gets priority)
          activeQueueDrivers.sort((a, b) => {
            const timeA = a.driver.idleStartedAt ?? 0;
            const timeB = b.driver.idleStartedAt ?? 0;
            if (timeA !== timeB) return timeA - timeB;
            return a.distance - b.distance; // secondary sort by distance
          });

          // Priority Driver is index 0
          const winner = activeQueueDrivers[0].driver;
          const isWinnerControlled = currentDriver ? (winner.id === currentDriver.id) : (winner.id === 'driver_alpha');
          
          // Map queue details to pass to metadata
          const queueDetails = activeQueueDrivers.map((qd, index) => ({
            driverId: qd.driver.id,
            name: qd.driver.name,
            distance: qd.distance,
            idx: index + 1 // 1-indexed position
          }));

          setActiveRide(prev => {
            if (!prev) return null;
            return {
              ...prev,
              status: isWinnerControlled ? 'offered' : 'searching', // Controlled gets popup offer, bot gets 'searching' but with priority queue
              driverId: isWinnerControlled ? winner.id : null, 
              queueState: 'priority',
              priorityDriverId: winner.id,
              priorityCountdown: 5,
              queueZoneKm,
              queueDrivers: queueDetails,
              eta: prev.eta
            };
          });

          return currentDrivers.map(d => {
            if (d.id === winner.id) {
              return {
                ...d,
                status: 'idle', // wait for acceptance
                activeRideId: `ride_${Date.now()}`,
              };
            }
            return d;
          });
        } else {
          alert('No drivers online in city grid limits! Toggle driver online to proceed.');
          setActiveRide(null);
          return currentDrivers;
        }
      });
    }, 2000);
  };

  // Driver App accepts ride offer
  const handleAcceptRide = () => {
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'picking_up',
        queueState: undefined,
        driverId: currentDriver?.id || 'driver_alpha',
      };
    });

    setDrivers(prev => 
      prev.map(d => {
        if (d.id === (currentDriver?.id || 'driver_alpha')) {
          const pickupLoc = activeRide ? activeRide.pickup : selectedPickup;
          if (pickupLoc) {
            const { path: pickupPath } = calculateRouteDetails(
              { id: 'driver_start', name: 'Start', icon: 'Car', x: d.x, y: d.y, description: '' },
              pickupLoc,
              currentCity,
              trafficLevel
            );
            return {
              ...d,
              status: 'going_to_pickup',
              path: pickupPath,
              pathProgress: 0,
            };
          }
        }
        return d;
      })
    );
  };

  // Decline ride offer
  const handleDeclineRide = () => {
    if (activeRide && activeRide.queueState === 'priority' && activeRide.priorityDriverId === (currentDriver?.id || 'driver_alpha')) {
      // If declining priority offer, trigger immediate broadcast to other drivers in that queue instead of cancelling!
      setActiveRide(prev => {
        if (!prev) return null;
        return {
          ...prev,
          priorityCountdown: 0,
          queueState: 'broadcast',
          priorityDriverId: null,
          driverId: null,
        };
      });
      // Set our status back to idle
      setDrivers(prev => 
        prev.map(d => d.id === (currentDriver?.id || 'driver_alpha') ? { ...d, status: 'idle', idleStartedAt: Date.now(), activeRideId: null, path: [], pathProgress: 0 } : d)
      );
      
      // Auto-assign to someone else in the queue immediately
      setTimeout(() => {
        setDrivers(currentDrivers => {
          const queueIds = activeRide.queueDrivers?.map(qd => qd.driverId) || [];
          const broadcastCandidates = currentDrivers.filter(d => d.status === 'idle' && d.id !== (currentDriver?.id || 'driver_alpha') && queueIds.includes(d.id));
          
          let winnerId: string | null = null;
          if (broadcastCandidates.length > 0) {
            winnerId = broadcastCandidates[Math.floor(Math.random() * broadcastCandidates.length)].id;
          } else {
            const anyIdle = currentDrivers.filter(d => d.status === 'idle' && d.id !== (currentDriver?.id || 'driver_alpha'));
            if (anyIdle.length > 0) winnerId = anyIdle[0].id;
          }

          if (winnerId) {
            setActiveRide(ride => {
              if (!ride || ride.id !== activeRide.id) return ride;
              return {
                ...ride,
                status: 'picking_up',
                queueState: 'broadcast',
                driverId: winnerId,
                priorityDriverId: null,
              };
            });

            return currentDrivers.map(d => {
              if (d.id === winnerId) {
                const { path: pickupPath } = calculateRouteDetails(
                  { id: 'driver_start', name: 'Start', icon: 'Car', x: d.x, y: d.y, description: '' },
                  activeRide.pickup,
                  currentCity,
                  trafficLevel
                );
                return {
                  ...d,
                  status: 'going_to_pickup',
                  activeRideId: activeRide.id,
                  path: pickupPath,
                  pathProgress: 0,
                };
              }
              return d;
            });
          }
          return currentDrivers;
        });
      }, 1000);
    } else {
      // Normal decline
      setActiveRide(null);
      setDrivers(prev => 
        prev.map(d => d.id === (currentDriver?.id || 'driver_alpha') ? { ...d, status: 'idle', idleStartedAt: Date.now(), activeRideId: null, path: [], pathProgress: 0 } : d)
      );
    }
  };

  // Driver confirms they arrived at the pickup node
  const handleArrivedAtPickup = () => {
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'arrived',
      };
    });

    setDrivers(prev => 
      prev.map(d => d.id === (currentDriver?.id || 'driver_alpha') ? { ...d, status: 'at_pickup' } : d)
    );
  };

  // Driver starts trip (Passenger entered)
  const handleStartTrip = () => {
    if (!activeRide) return;

    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'in_transit',
      };
    });

    setDrivers(prevDrivers => 
      prevDrivers.map(d => {
        if (d.id === activeRide.driverId) {
          // Recompute path coordinate from pickup spot directly to final dropoff
          const { path: tripPath } = calculateRouteDetails(
            activeRide.pickup,
            activeRide.dropoff,
            currentCity,
            trafficLevel
          );

          return {
            ...d,
            status: 'carrying',
            path: tripPath,
            pathProgress: 0,
          };
        }
        return d;
      })
    );
  };

  // Driver End/Complete trip
  const handleCompleteTrip = () => {
    if (!activeRide) return;
    triggerPathCompletion(drivers.find(d => d.id === activeRide.driverId)!);
  };

  // Cancel ride in progress
  const handleCancelRide = () => {
    if (activeRide && activeRide.driverId) {
      setDrivers(prev => 
        prev.map(d => d.id === activeRide.driverId ? { ...d, status: 'idle', activeRideId: null, path: [], pathProgress: 0 } : d)
      );
    }
    setActiveRide(null);
    setSelectedPickup(null);
    setSelectedDropoff(null);
    setPromoCodeApplied(null);
  };

  // Insert Chat message
  const handleInsertMessage = (sender: 'passenger' | 'driver', text: string, isAuto: boolean = false) => {
    setActiveRide(prev => {
      if (!prev) return null;
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}${isAuto ? '_auto_reply' : ''}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        ...prev,
        messages: [...prev.messages, newMsg],
      };
    });
  };

  // Star ratings and logs ingestion
  const handleCompleteRating = (rating: number, feedback: string) => {
    if (activeRide) {
      const driverObj = drivers.find(d => d.id === activeRide.driverId);
      const tierObj = VEHICLE_CONFIGS.find(v => v.id === activeRide.tier);
      const newPastTrip: PastTrip = {
        id: `hist_${Date.now()}`,
        cityId: activeRide.cityId,
        pickupName: activeRide.pickup.name,
        dropoffName: activeRide.dropoff.name,
        driverName: driverObj ? driverObj.name : 'Chauffeur',
        driverAvatar: driverObj ? driverObj.avatar : '👨',
        vehicleName: driverObj ? driverObj.vehicle : 'Premium Vehicle',
        price: activeRide.price,
        distance: activeRide.distance,
        tierName: tierObj ? tierObj.name : 'ColectivoX',
        timestamp: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        rating: rating,
      };
      setTripHistory(prev => [newPastTrip, ...prev]);
    }

    setReviewsList(prev => [{ rating, feedback }, ...prev]);
    setActiveRide(null);
  };


  // Wallet and promotions
  const handleTopUpWallet = (amount: number) => {
    setPassengerWallet(prev => {
      const newVal = prev + amount;
      if (currentRider) {
        saveDocument('riders', currentRider.id, { ...currentRider, walletBalance: newVal });
      }
      return newVal;
    });
  };

  const handleDriverTopUpWallet = (amount: number) => {
    setDrivers(prev => prev.map(d => {
      if (currentDriver && d.id === currentDriver.id) {
        const updated = {
          ...d,
          walletBalance: (d.walletBalance ?? 0) + amount
        };
        saveDocument('drivers', currentDriver.id, updated);
        return updated;
      }
      return d;
    }));
  };

  const handleSimulateMidnightReset = () => {
    setDrivers(prev => prev.map(d => ({
      ...d,
      dailyTripsCount: 0,
      lastTripDate: getTodayString()
    })));
  };

  const handleApplyPromoCode = (code: string) => {
    const promo = PROMO_CODES.find(p => p.code === code);
    if (!promo) return 'Invalid promo code. Note "URBANRIDE50" is valid!';
    setPromoCodeApplied(promo);
    return null;
  };

  const handleClearPromoCode = () => {
    setPromoCodeApplied(null);
  };

  // Calculate overall rating score
  const averageRating = reviewsList.length > 0 
    ? reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / reviewsList.length
    : 4.9;

  // Calculate dynamic application-wide theme state:
  // - Orange: while idle (no active ride, or searching/completed/cancelled acts as idle)
  // - Yellow: after confirmed ride (accepted offer, heading to pickup, or at pickup location)
  // - Green: after pickup is complete (active ride is in_transit)
  const appColorTheme = !activeRide
    ? 'orange'
    : (activeRide.status === 'in_transit' ? 'green' : 'yellow');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col gap-6 select-none leading-relaxed overflow-x-hidden md:overflow-x-visible">
      
      {/* Upper Navigation Title Banner with Multi-Page Website Tabs */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200 border-l-[6px] transition-all duration-500 ${
        appColorTheme === 'orange' ? 'border-l-orange-500' :
        appColorTheme === 'yellow' ? 'border-l-amber-400' :
        'border-l-emerald-500'
      } px-8 py-5 rounded-2xl shadow-sm`} id="global_nav_banner">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="cursor-pointer" onClick={() => setActiveTab('home')}>
            <h1 className="text-2xl font-black tracking-tighter text-black flex items-center gap-2 font-display">
              <span className={`px-2 py-0.5 rounded-lg text-sm block font-mono font-bold tracking-tight transition-all duration-500 ${
                appColorTheme === 'orange' ? 'bg-orange-600 text-white' :
                appColorTheme === 'yellow' ? 'bg-amber-450 text-black font-extrabold' :
                'bg-emerald-600 text-white'
              }`}>C</span>
              <span>COLECTIVO</span>
            </h1>
            <p className="text-slate-450 text-[10px] uppercase tracking-wider font-extrabold mt-0.5">
              Premium Dispatch Network
            </p>
          </div>

          {/* Nav Tabs */}
          <nav className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl" id="website_page_nav">
            {(['home', 'careers', 'support', 'simulator'] as const).map((tab) => {
              const label = tab === 'home' ? 'Home' :
                            tab === 'careers' ? 'Careers' :
                            tab === 'support' ? 'Help Desk' :
                            'Live Console';
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-black hover:bg-slate-200/50'
                  }`}
                  id={`nav_tab_${tab}`}
                >
                  {label.toUpperCase()}
                  {tab === 'simulator' && (
                    <span className="ml-1.5 px-0.9 py-0.5 bg-orange-600 text-white text-[8px] font-black rounded-md animate-pulse uppercase tracking-widest text-[7.5px]">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side controls (Action widgets + Login Menu) */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
          {/* Action Widgets specific to Simulator context */}
          {activeTab === 'simulator' ? (
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-50 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                id="btn_open_history_modal"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>TRIP HISTORY</span>
              </button>

              <button
                disabled={isLocatingGPS}
                onClick={autoDetectNearestCity}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-700 hover:text-orange-950 hover:bg-orange-500/20 active:scale-95 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
                id="btn_header_locate_gps"
              >
                <span className={`w-2 h-2 rounded-full ${isLocatingGPS ? 'bg-orange-500 animate-ping' : 'bg-orange-500'}`}></span>
                <span>{isLocatingGPS ? 'GPS PINPOINTING...' : '🎯 AUTO-DETECT HUB'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-150">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>COLECTIVO NETWORK ONLINE (V1.4)</span>
            </div>
          )}

          {/* New Login Switcher Dropdown */}
          <div className="relative z-50 text-left" ref={headerLoginDropdownRef} id="header_login_dropdown_container">
            <button
              onClick={() => setIsHeaderLoginDropdownOpen(!isHeaderLoginDropdownOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold font-sans transition-all duration-300 border shadow-sm cursor-pointer select-none ${
                simSelectedRole === 'rider'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : simSelectedRole === 'driver'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : simSelectedRole === 'admin'
                  ? 'bg-purple-50 border-purple-200 text-purple-800'
                  : 'bg-slate-900 border-slate-950 text-white hover:bg-slate-800'
              }`}
              id="header_login_btn"
            >
              {simSelectedRole ? (
                <>
                  <span className="w-2 h-2 rounded-full animate-pulse bg-current shrink-0"></span>
                  <span className="uppercase tracking-wide">
                    {simSelectedRole === 'rider' && `Alex (Rider)`}
                    {simSelectedRole === 'driver' && `Marcus (Driver)`}
                    {simSelectedRole === 'admin' && `Admin Auth`}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="tracking-wide">SECURE SIGN IN</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isHeaderLoginDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isHeaderLoginDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                id="header_login_dropdown_menu"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                  Switch Active Portal Role
                </div>
                
                <div className="p-1.5 flex flex-col gap-1">
                  {/* 1. Rider login option */}
                  <button
                    onClick={() => {
                      const found = riders.find(r => r.email === 'rider@colectivo.com') || riders[0];
                      setCurrentRider(found);
                      setPassengerWallet(found.walletBalance);
                      setSimSelectedRole('rider');
                      setActiveTab('simulator');
                      setIsHeaderLoginDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer group ${
                      simSelectedRole === 'rider' ? 'bg-emerald-50/50' : ''
                    }`}
                    id="header_login_rider_opt"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      simSelectedRole === 'rider' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">Alex (Rider)</span>
                        <span className="font-mono text-[9px] text-emerald-600 font-extrabold uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Rider</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">rider@colectivo.com</p>
                    </div>
                  </button>

                  {/* 2. Driver login option */}
                  <button
                    onClick={() => {
                      const found = drivers.find(d => d.email === 'vance@colectivo.com') || drivers[0];
                      setCurrentDriver(found);
                      setSimSelectedRole('driver');
                      setActiveTab('simulator');
                      setIsHeaderLoginDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer group ${
                      simSelectedRole === 'driver' ? 'bg-indigo-50/50' : ''
                    }`}
                    id="header_login_driver_opt"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      simSelectedRole === 'driver' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}>
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-700 transition-colors">Marcus (Driver)</span>
                        <span className="font-mono text-[9px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Driver</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">vance@colectivo.com</p>
                    </div>
                  </button>

                  {/* 3. Admin login option */}
                  <button
                    onClick={() => {
                      setAdminMasterLoggedIn(true);
                      setSimSelectedRole('admin');
                      setActiveTab('simulator');
                      setIsHeaderLoginDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer group ${
                      simSelectedRole === 'admin' ? 'bg-purple-50/50' : ''
                    }`}
                    id="header_login_admin_opt"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      simSelectedRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500 group-hover:bg-purple-50 group-hover:text-purple-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-purple-700 transition-colors">Municipal Admin</span>
                        <span className="font-mono text-[9px] text-purple-600 font-extrabold uppercase bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Admin</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">ADMIN / Auditor</p>
                    </div>
                  </button>
                </div>

                {simSelectedRole && (
                  <div className="p-1.5 bg-slate-50 border-t border-slate-150">
                    <button
                      onClick={() => {
                        if (simSelectedRole === 'rider') handleRiderLogout();
                        if (simSelectedRole === 'driver') handleDriverLogout();
                        if (simSelectedRole === 'admin') setAdminMasterLoggedIn(false);
                        setSimSelectedRole(null);
                        setIsHeaderLoginDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-black rounded-xl transition-all cursor-pointer uppercase font-sans border border-transparent hover:border-rose-100"
                      id="header_logout_btn"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>SIGN OUT OF ROLE</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'home' && (
        <WebsiteHome
          cities={CITIES}
          onNavigateToConsole={() => setActiveTab('simulator')}
          onNavigateToCities={() => setActiveTab('cities')}
          onNavigateToCareers={() => setActiveTab('careers')}
          simulationEarnings={simulationEarnings}
          completedTripsCount={completedTripsCount}
          averageRating={averageRating}
        />
      )}

      {activeTab === 'cities' && (
        <WebsiteCities
          cities={CITIES}
          currentCityId={currentCityId}
          onChangeCity={setCurrentCityId}
          onNavigateToConsole={() => setActiveTab('simulator')}
          weather={weather}
          trafficLevel={trafficLevel}
          comfortRate={comfortRate}
          comfortPlusRate={comfortPlusRate}
        />
      )}

      {activeTab === 'careers' && (
        <WebsiteCareers
          comfortRate={comfortRate}
          comfortPlusRate={comfortPlusRate}
          onNavigateToConsole={() => setActiveTab('simulator')}
        />
      )}

      {activeTab === 'support' && (
        <WebsiteSupport />
      )}

      {activeTab === 'simulator' && (
        <div className="flex flex-col gap-6 w-full">
          {simSelectedRole === null ? (
            /* =========================================================
               MASTER ROLE LOGIN SELECTION GATEWAY (High-Fidelity)
               ========================================================= */
            <div className="max-w-5xl mx-auto w-full py-8 px-4 flex flex-col gap-8 select-none">
              <div className="text-center flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-emerald-500/10 text-emerald-600 uppercase border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" />
                  <span>Secure Dispatch Network Hub v1.4</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-neutral-955 font-display">
                  COLECTIVO UNIFIED HUB SELECTOR
                </h2>
                <p className="text-sm text-neutral-500 max-w-lg font-medium leading-relaxed">
                  Welcome to the multi-role dispatch network. Choose an identity to securely authenticate and access customized control dashboards inside live city grid networks.
                </p>
              </div>

              {/* Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. PASSENGER IDENTITY CARD */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-neutral-900 tracking-tight">Rider Platform</h3>
                      <p className="text-[10px] font-bold text-emerald-600 font-mono tracking-wider uppercase mt-0.5">Alex Rider Profile</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Request rides, calculate surge-priced route paths, check pilot dispatch proximity, and trigger dynamic mock bookings.
                    </p>

                    {/* Pre-filled Login form for Passenger/Rider */}
                    <div className="mt-4 flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Sandbox Email</label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={gateRiderEmail}
                            onChange={(e) => setGateRiderEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Sandbox Password</label>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="password"
                            value={gateRiderPassword}
                            onChange={(e) => setGateRiderPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono text-left">
                        Demo: <span className="text-slate-600 font-bold">rider@colectivo.com</span> / <span className="text-slate-600 font-bold">sandbox123</span>
                      </div>
                      {gateRiderError && (
                        <p className="text-[10px] text-rose-600 font-bold leading-tight">{gateRiderError}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => {
                        const errorMsg = handleRiderLogin(gateRiderEmail, gateRiderPassword);
                        if (errorMsg) {
                          setGateRiderError(errorMsg);
                        } else {
                          setGateRiderError(null);
                          setSimSelectedRole('rider');
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
                    >
                      <span>SIGN IN AS RIDER</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        // Quick demo shortcut
                        const found = riders.find(r => r.email === 'rider@colectivo.com');
                        if (found) {
                          setCurrentRider(found);
                          setPassengerWallet(found.walletBalance);
                          setSimSelectedRole('rider');
                        }
                      }}
                      className="w-full mt-2 py-1.5 px-3 border border-dashed border-slate-250 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold text-[10px] rounded-lg tracking-wide uppercase cursor-pointer transition-all"
                    >
                      Quick Demo Bypass
                    </button>
                  </div>
                </div>

                {/* 2. DRIVER PILOT CARD */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Car className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-neutral-900 tracking-tight">Pilot Workspace</h3>
                      <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-wider uppercase mt-0.5">Vance, Patel, or Sato</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Go online to receive dispatched queue matching, navigate routes in Delhi/Mumbai/Bengaluru grids, and track earnings metrics.
                    </p>

                    {/* Pre-filled Login form for Drivers */}
                    <div className="mt-4 flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Pilot Identity</label>
                        <select
                          value={gateDriverEmail}
                          onChange={(e) => {
                            setGateDriverEmail(e.target.value);
                            setGateDriverError(null);
                          }}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                        >
                          <option value="vance@colectivo.com">Marcus Vance (Tesla - 4.9⭐)</option>
                          <option value="patel@colectivo.com">Sophia Patel (Camry - 4.8⭐)</option>
                          <option value="sato@colectivo.com">Hiroshi Sato (Accord - 4.95⭐)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Sandbox Password</label>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="password"
                            value={gateDriverPassword}
                            onChange={(e) => setGateDriverPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono text-left">
                        Password: <span className="text-slate-600 font-bold">sandbox123</span>
                      </div>
                      {gateDriverError && (
                        <p className="text-[10px] text-rose-600 font-bold leading-tight">{gateDriverError}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => {
                        const errorMsg = handleDriverLogin(gateDriverEmail, gateDriverPassword);
                        if (errorMsg) {
                          setGateDriverError(errorMsg);
                        } else {
                          setGateDriverError(null);
                          setSimSelectedRole('driver');
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
                    >
                      <span>SIGN IN AS PILOT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        // Quick demo shortcut
                        const found = drivers.find(d => d.email === gateDriverEmail) || drivers[0];
                        setCurrentDriver(found);
                        setSimSelectedRole('driver');
                      }}
                      className="w-full mt-2 py-1.5 px-3 border border-dashed border-slate-250 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold text-[10px] rounded-lg tracking-wide uppercase cursor-pointer transition-all"
                    >
                      Quick Demo Bypass
                    </button>
                  </div>
                </div>

                {/* 3. MUNICIPAL ADMIN CARD */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-neutral-900 tracking-tight">Administrative Audits</h3>
                      <p className="text-[10px] font-bold text-purple-600 font-mono tracking-wider uppercase mt-0.5">Municipal Registrar Hub</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Verify newly submitted partner vehicle permits, adjust city-wide pricing models, or block violative driver schedules.
                    </p>

                    {/* Pre-filled Login form for Admin */}
                    <div className="mt-4 flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Admin Username</label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={gateAdminUser}
                            onChange={(e) => setGateAdminUser(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Security Password</label>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="password"
                            value={gateAdminPass}
                            onChange={(e) => setGateAdminPass(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono text-left">
                        Demo: <span className="text-slate-600 font-bold">ADMIN</span> / <span className="text-slate-600 font-bold">12345</span>
                      </div>
                      {gateAdminError && (
                        <p className="text-[10px] text-rose-600 font-bold leading-tight">{gateAdminError}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => {
                        if (gateAdminUser.trim() === 'ADMIN' && gateAdminPass === '12345') {
                          setGateAdminError(null);
                          setAdminMasterLoggedIn(true);
                          setSimSelectedRole('admin');
                        } else {
                          setGateAdminError('Invalid credentials. Use ADMIN / 12345');
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
                    >
                      <span>SIGN IN AS AUDITOR</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        // Quick demo shortcut
                        setAdminMasterLoggedIn(true);
                        setSimSelectedRole('admin');
                      }}
                      className="w-full mt-2 py-1.5 px-3 border border-dashed border-slate-250 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold text-[10px] rounded-lg tracking-wide uppercase cursor-pointer transition-all"
                    >
                      Quick Demo Bypass
                    </button>
                  </div>
                </div>

              </div>

              {/* System Note */}
              <div className="flex gap-2.5 bg-slate-100 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-500 text-left">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wide">Multi-Agent Dispatch Information</span>
                  <span>Once logged in, the active console view adapts exclusively to that mode's device. You can hot-swap between logged-in personas instantly with the status bar switcher to accept bookings and coordinate dispatches in real-time.</span>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================
               ACTIVE PERSISTENT ROLE DISPATCH WORKSPACE
               ========================================================= */
            <>
              {/* Dynamic Switcher Top bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs gap-3 font-mono shadow-md border border-slate-850 animate-fadeIn">
                <div className="flex items-center gap-2 text-left">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce shrink-0"></span>
                  <span className="font-extrabold tracking-tight shrink-0 text-slate-200">PORTALS HOT-SWAP HUB:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 font-extrabold text-emerald-400 border border-slate-700 text-[10px]">
                    {simSelectedRole?.toUpperCase()} MODE
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 justify-end">
                  <span className="text-slate-400 block mr-1 text-[10px]">Jump to:</span>
                  
                  {/* Rider mode trigger */}
                  <button
                    onClick={() => {
                      if (!currentRider) {
                        const found = riders.find(r => r.email === 'rider@colectivo.com');
                        if (found) { setCurrentRider(found); setPassengerWallet(found.walletBalance); }
                      }
                      setSimSelectedRole('rider');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] tracking-wide uppercase cursor-pointer transition-all ${
                      simSelectedRole === 'rider' ? 'bg-emerald-600 text-white border border-emerald-500 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-705 border border-transparent'
                    }`}
                  >
                    🙋‍♂️ Rider View
                  </button>

                  {/* Driver mode trigger */}
                  <button
                    onClick={() => {
                      if (!currentDriver) {
                        setCurrentDriver(drivers[0]);
                      }
                      setSimSelectedRole('driver');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] tracking-wide uppercase cursor-pointer transition-all ${
                      simSelectedRole === 'driver' ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-705 border border-transparent'
                    }`}
                  >
                    🚙 Pilot View
                  </button>

                  {/* Admin mode trigger */}
                  <button
                    onClick={() => {
                      setAdminMasterLoggedIn(true);
                      setSimSelectedRole('admin');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] tracking-wide uppercase cursor-pointer transition-all ${
                      simSelectedRole === 'admin' ? 'bg-purple-600 text-white border border-purple-500 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-705 border border-transparent'
                    }`}
                  >
                    🛡️ Auditor View
                  </button>

                  <div className="border-l border-slate-800 h-5 pl-2.5 flex items-center ml-1">
                    <button
                      onClick={() => {
                        // Fully reset active role contexts to main selection gateway
                        setCurrentRider(null);
                        setCurrentDriver(null);
                        setAdminMasterLoggedIn(false);
                        setSimSelectedRole(null);
                      }}
                      className="text-rose-400 hover:text-rose-350 hover:underline font-black text-[10px] tracking-wide uppercase cursor-pointer"
                    >
                      EXIT HUB
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode-Specific Grid layouts */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full">
                
                {/* -------------------- RIDER FOCUSED VIEW -------------------- */}
                {simSelectedRole === 'rider' && (
                  <>
                    <div className="xl:col-span-4 flex justify-center items-center font-sans animate-fadeIn">
                      <PhonePassenger
                        city={currentCity}
                        activeRide={activeRide}
                        selectedPickup={selectedPickup}
                        selectedDropoff={selectedDropoff}
                        onSelectLandmark={setSelectedPickup ? (lm, t) => {
                          if (t === 'pickup') setSelectedPickup(lm);
                          else setSelectedDropoff(lm);
                        } : () => {}}
                        onRequestRide={handleRequestRide}
                        onCancelRide={handleCancelRide}
                        onSendChatMessage={(txt) => handleInsertMessage('passenger', txt)}
                        onCompleteRating={handleCompleteRating}
                        walletBalance={passengerWallet}
                        onTopUpWallet={handleTopUpWallet}
                        surgeMultiplier={surgeMultiplier}
                        promoCodeApplied={promoCodeApplied}
                        onApplyPromoCode={handleApplyPromoCode}
                        onClearPromoCode={handleClearPromoCode}
                        currentRider={currentRider}
                        onRiderLogin={handleRiderLogin}
                        onRiderRegister={handleRiderRegister}
                        onRiderLogout={handleRiderLogout}
                        comfortRate={comfortRate}
                        comfortPlusRate={comfortPlusRate}
                        appColorTheme={appColorTheme}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        activeSearchType={activeSearchType}
                        setActiveSearchType={setActiveSearchType}
                        googlePlaces={googlePlaces}
                        setGooglePlaces={setGooglePlaces}
                        isSearchingGoogle={isSearchingGoogle}
                        setIsSearchingGoogle={setIsSearchingGoogle}
                        isSearching={isSearching}
                        setIsSearching={setIsSearching}
                        onChangeCity={setCurrentCityId}
                        trafficLevel={trafficLevel}
                      />
                    </div>

                    {/* Shared Space: Map */}
                    <div className="xl:col-span-8 flex flex-col gap-4 animate-fadeIn">
                      <div className="flex-1 min-h-[520px]">
                        <MapContainer
                          city={currentCity}
                          activeRide={activeRide}
                          drivers={drivers}
                          selectedPickup={selectedPickup}
                          selectedDropoff={selectedDropoff}
                          onSelectLandmark={(lm, t) => {
                            if (t === 'pickup') setSelectedPickup(lm);
                            else setSelectedDropoff(lm);
                          }}
                          weather={weather}
                          trafficLevel={trafficLevel}
                          searchQuery={searchQuery}
                          setSearchQuery={setSearchQuery}
                          activeSearchType={activeSearchType}
                          setActiveSearchType={setActiveSearchType}
                          googlePlaces={googlePlaces}
                          setGooglePlaces={setGooglePlaces}
                          isSearchingGoogle={isSearchingGoogle}
                          setIsSearchingGoogle={setIsSearchingGoogle}
                          isSearching={isSearching}
                          setIsSearching={setIsSearching}
                          surgeMultiplier={surgeMultiplier}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* -------------------- DRIVER FOCUSED VIEW -------------------- */}
                {simSelectedRole === 'driver' && (
                  <>
                    <div className="xl:col-span-4 flex justify-center items-center font-sans animate-fadeIn">
                      <PhoneDriver
                        city={currentCity}
                        driver={currentDriver}
                        activeRide={activeRide && activeRide.driverId === currentDriver?.id ? activeRide : null}
                        onToggleOnline={handleToggleOnline}
                        onAcceptRide={handleAcceptRide}
                        onDeclineRide={handleDeclineRide}
                        onArrivedAtPickup={handleArrivedAtPickup}
                        onStartTrip={handleStartTrip}
                        onCompleteTrip={handleCompleteTrip}
                        onSendChatMessage={(txt) => handleInsertMessage('driver', txt)}
                        weather={weather}
                        surgeMultiplier={surgeMultiplier}
                        currentDriver={currentDriver}
                        onDriverLogin={handleDriverLogin}
                        onDriverRegister={handleDriverRegister}
                        onDriverLogout={handleDriverLogout}
                        onResubmitDocuments={handleResubmitDocuments}
                        comfortRate={comfortRate}
                        comfortPlusRate={comfortPlusRate}
                        appColorTheme={appColorTheme}
                        onTopUpWallet={handleDriverTopUpWallet}
                        onSimulateMidnightReset={handleSimulateMidnightReset}
                        onChangeCity={setCurrentCityId}
                      />
                    </div>

                    {/* Shared Space: Map */}
                    <div className="xl:col-span-8 flex flex-col gap-4 animate-fadeIn">
                      <div className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs shrink-0 select-none shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                          <span className="font-mono text-slate-700 font-bold tracking-tight">PILOT NAVIGATOR: {currentCity.name.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                          <span className="flex items-center gap-1">📍 Next Landmark: <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span></span>
                          <span className="flex items-center gap-1">🚙 Other Online Pilots: <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span></span>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[520px]">
                        <MapContainer
                          city={currentCity}
                          activeRide={activeRide}
                          drivers={drivers}
                          selectedPickup={selectedPickup}
                          selectedDropoff={selectedDropoff}
                          onSelectLandmark={(lm, t) => {
                            if (t === 'pickup') setSelectedPickup(lm);
                            else setSelectedDropoff(lm);
                          }}
                          weather={weather}
                          trafficLevel={trafficLevel}
                          surgeMultiplier={surgeMultiplier}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* -------------------- ADMIN FOCUSED VIEW -------------------- */}
                {simSelectedRole === 'admin' && (
                  <>
                    <div className="xl:col-span-5 flex flex-col gap-4 animate-fadeIn justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shrink-0 shadow-sm flex flex-col gap-2">
                        <span className="font-mono font-bold text-[10px] text-slate-400 tracking-wider uppercase block text-left">Auditor Insights</span>
                        <p className="text-xs text-slate-500 leading-relaxed text-left">
                          Welcome, Colectivo Administrator. Below, you can audit newly registered driver vehicles and enforce account bans/unbans. These modifications propagate instantly.
                        </p>
                      </div>
                      <AdminPortal
                        drivers={drivers}
                        onVerifyDriver={handleVerifyDriver}
                        riders={riders}
                        comfortRate={comfortRate}
                        comfortPlusRate={comfortPlusRate}
                        onUpdateRates={handleUpdateRates}
                        onToggleBlockDriver={handleToggleBlockDriver}
                        onToggleBlockRider={handleToggleBlockRider}
                        onDeleteDriver={handleDeleteDriver}
                        onEditDriver={handleEditDriver}
                        onDeleteRider={handleDeleteRider}
                        onEditRider={handleEditRider}
                        isAdminLoggedIn={adminMasterLoggedIn}
                        onAdminLogout={() => {
                          setAdminMasterLoggedIn(false);
                          setSimSelectedRole(null);
                        }}
                      />
                    </div>

                    {/* Shared Space: Map */}
                    <div className="xl:col-span-7 flex flex-col gap-4 animate-fadeIn">
                      <div className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs shrink-0 select-none shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
                          <span className="font-mono text-slate-700 font-bold tracking-tight text-left">REGISTRAR MAP: {currentCity.name.toUpperCase()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono">
                          Surge Rate: {surgeMultiplier}x
                        </div>
                      </div>

                      <div className="flex-1 min-h-[520px]">
                        <MapContainer
                          city={currentCity}
                          activeRide={activeRide}
                          drivers={drivers}
                          selectedPickup={selectedPickup}
                          selectedDropoff={selectedDropoff}
                          onSelectLandmark={(lm, t) => {
                            if (t === 'pickup') setSelectedPickup(lm);
                            else setSelectedDropoff(lm);
                          }}
                          weather={weather}
                          trafficLevel={trafficLevel}
                          surgeMultiplier={surgeMultiplier}
                        />
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Control Board stats panel */}
              <div className="mt-2 text-stone-300 flex flex-col gap-4 animate-fadeIn">
                <DashboardStats
                  currentCity={currentCity}
                  onChangeCity={setCurrentCityId}
                  activeScenarioId={selectedScenario.id}
                  onChangeScenario={setSelectedScenario}
                  simulationEarnings={simulationEarnings}
                  completedTripsCount={completedTripsCount}
                  averageRating={averageRating}
                  autoPlay={autoPlay}
                  onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
                  driversOnlineCount={drivers.filter(d => d.status !== 'offline').length}
                  surgeMultiplier={surgeMultiplier}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Aesthetic Developer Credit overlay */}
      <p className="text-center text-[10px] text-neutral-500 tracking-wider uppercase select-none mt-4 pb-2">
        Colectivo // Powered by React, Tailwind, and Motion.
      </p>

      {/* Trip Registry Modal overlay */}
      <TripHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        trips={tripHistory}
        onClearHistory={() => setTripHistory([])}
      />

    </div>
  );
}
