import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Trees, 
  Building2, 
  Train, 
  TrendingUp, 
  Compass, 
  Ship, 
  Palmtree, 
  Mountain, 
  Palette, 
  Church, 
  Music, 
  Flame, 
  Building, 
  Zap, 
  Flower2, 
  MapPin, 
  Car,
  Info,
  AlertTriangle,
  Bell,
  X,
  ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityData, Landmark, Driver, Ride } from '../types';
import { getLatLngFromGrid, getGridFromLatLng, calculateRouteDetails } from '../utils/routing';
import TrafficAlertOverlay from './TrafficAlertOverlay';
import SurgeVisualizer from './SurgeVisualizer';

// Anchor Lucide Icon Mapper
const landmarkIconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4 text-amber-500" />,
  Trees: <Trees className="w-4 h-4 text-emerald-500" />,
  Building2: <Building2 className="w-4 h-4 text-indigo-500" />,
  Train: <Train className="w-4 h-4 text-cyan-500" />,
  TrendingUp: <TrendingUp className="w-4 h-4 text-blue-500" />,
  Compass: <Compass className="w-4 h-4 text-rose-500" />,
  Ship: <Ship className="w-4 h-4 text-sky-500" />,
  Palmtree: <Palmtree className="w-4 h-4 text-teal-500" />,
  Mountain: <Mountain className="w-4 h-4 text-amber-700" />,
  Palette: <Palette className="w-4 h-4 text-purple-500" />,
  Church: <Church className="w-4 h-4 text-zinc-500" />,
  Music: <Music className="w-4 h-4 text-pink-500" />,
  Flame: <Flame className="w-4 h-4 text-amber-500" />,
  Building: <Building className="w-4 h-4 text-slate-500" />,
  Zap: <Zap className="w-4 h-4 text-yellow-500" />,
  Flower2: <Flower2 className="w-4 h-4 text-rose-400" />,
};

interface MapContainerProps {
  city: CityData;
  activeRide: Ride | null;
  drivers: Driver[];
  selectedPickup: Landmark | null;
  selectedDropoff: Landmark | null;
  onSelectLandmark: (landmark: Landmark, type: 'pickup' | 'dropoff') => void;
  weather: 'sunny' | 'rainy' | 'night';
  trafficLevel: 'light' | 'moderate' | 'heavy';
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  activeSearchType?: 'pickup' | 'dropoff';
  setActiveSearchType?: (t: 'pickup' | 'dropoff') => void;
  googlePlaces?: any[];
  setGooglePlaces?: (lp: any[]) => void;
  isSearchingGoogle?: boolean;
  setIsSearchingGoogle?: (b: boolean) => void;
  isSearching?: boolean;
  setIsSearching?: (b: boolean) => void;
  surgeMultiplier?: number;
}

export default function MapContainer({
  city,
  activeRide,
  drivers,
  selectedPickup,
  selectedDropoff,
  onSelectLandmark,
  weather,
  trafficLevel,
  searchQuery = '',
  setSearchQuery,
  activeSearchType = 'pickup',
  setActiveSearchType,
  googlePlaces = [],
  setGooglePlaces,
  isSearchingGoogle = false,
  setIsSearchingGoogle,
  isSearching = false,
  setIsSearching,
  surgeMultiplier = 1.0,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const tilesLayerRef = useRef<L.TileLayer | null>(null);

  const [showSurgeHeatmap, setShowSurgeHeatmap] = useState<boolean>(true);

  const [activeSelectionTypeLocal, setActiveSelectionTypeLocal] = useState<'pickup' | 'dropoff'>('pickup');
  const activeSelectionType = activeSearchType !== undefined ? activeSearchType : activeSelectionTypeLocal;
  const setActiveSelectionType = setActiveSearchType || setActiveSelectionTypeLocal;

  const [rainDrops, setRainDrops] = useState<{ id: number; x: number; y: number; speed: number; len: number }[]>([]);

  const selectionTypeRef = useRef(activeSelectionType);
  const onSelectLandmarkRef = useRef(onSelectLandmark);
  const cityRef = useRef(city);

  useEffect(() => {
    selectionTypeRef.current = activeSelectionType;
  }, [activeSelectionType]);

  useEffect(() => {
    onSelectLandmarkRef.current = onSelectLandmark;
  }, [onSelectLandmark]);

  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  // Rain falling simulation overlay
  useEffect(() => {
    if (weather !== 'rainy') {
      setRainDrops([]);
      return;
    }
    const drops = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 3 + Math.random() * 4,
      len: 5 + Math.random() * 7,
    }));
    setRainDrops(drops);

    const interval = setInterval(() => {
      setRainDrops(prev => 
        prev.map(d => ({
          ...d,
          y: d.y + d.speed > 100 ? 0 : d.y + d.speed,
          x: d.x + 0.3 > 100 ? 0 : d.x + 0.3,
        }))
      );
    }, 45);

    return () => clearInterval(interval);
  }, [weather]);

  // States for traffic alerts notification overlay
  const [alertIndex, setAlertIndex] = useState(0);
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  // Generate mock traffic alerts based on current city landmarks and traffic level
  const getTrafficAlerts = () => {
    const landmarks = city.landmarks && city.landmarks.length > 0 
      ? city.landmarks.map(l => l.name) 
      : ['Central Junction', 'Metro Chowk', 'Main Terminal'];
    
    const primaryLm = landmarks[0] || 'Main Junction';
    const secondaryLm = landmarks[1] || landmarks[0] || 'Flyover Bypasses';
    
    if (trafficLevel === 'heavy') {
      return [
        {
          id: 't1',
          title: 'Heavy Traffic/Gridlock Alert',
          description: `Gridlock near ${primaryLm}. Expect approx. 8-12 mins delays on main corridors.`,
          severity: 'heavy',
          time: 'Just now'
        },
        {
          id: 't2',
          title: 'Construction Bottleneck',
          description: `All lanes crawling approaching ${secondaryLm} due to peak congestion and active metro work.`,
          severity: 'heavy',
          time: '4m ago'
        },
        {
          id: 't3',
          title: 'Bypass / Diversion Notification',
          description: `Localized waterlogging/roadblock near ${primaryLm}. It is highly advised to avoid these coordinates.`,
          severity: 'heavy',
          time: '12m ago'
        }
      ];
    } else if (trafficLevel === 'moderate') {
      return [
        {
          id: 'm1',
          title: 'Moderate Commute Volume',
          description: `Active moderate accumulation around ${primaryLm}. Speeds holding steady at 22-25 km/h.`,
          severity: 'moderate',
          time: 'Just now'
        },
        {
          id: 'm2',
          title: 'Arterial Slowdown',
          description: `Slight congestion on lanes past ${secondaryLm}. Adds 3-5 mins to standard ETAs.`,
          severity: 'moderate',
          time: '6m ago'
        },
        {
          id: 'm3',
          title: 'Retail Corridor Crowding',
          description: `Crowding near major landmarks of ${primaryLm}. Steady but slow-moving grid layout.`,
          severity: 'moderate',
          time: '14m ago'
        }
      ];
    } else {
      return [
        {
          id: 'l1',
          title: 'All Grids Operating Smoothly',
          description: `Express flow in progress near ${primaryLm} with no active backlogs. Seamless transit.`,
          severity: 'light',
          time: 'Just now'
        },
        {
          id: 'l2',
          title: 'Clear Driving Conditions',
          description: `No bottlenecks or sluggish segments detected around ${secondaryLm}. High route efficiency.`,
          severity: 'light',
          time: '9m ago'
        },
        {
          id: 'l3',
          title: 'Optimal Routing Alignment',
          description: `Superb and fast transit performance across ${city.name} networks. Perfect weather-speed alignment.`,
          severity: 'light',
          time: '18m ago'
        }
      ];
    }
  };

  const currentAlerts = getTrafficAlerts();
  const activeAlert = currentAlerts[alertIndex] || currentAlerts[0];

  // Reload alert indices on traffic Level changes
  useEffect(() => {
    setAlertIndex(0);
    setIsAlertVisible(true);
  }, [trafficLevel, city.id]);

  // Handle global callbacks inside leaflet popups
  useEffect(() => {
    (window as any)._setMapPickup = (landmarkId: string) => {
      const landmark = city.landmarks.find(l => l.id === landmarkId);
      if (landmark) onSelectLandmark(landmark, 'pickup');
    };
    (window as any)._setMapDropoff = (landmarkId: string) => {
      const landmark = city.landmarks.find(l => l.id === landmarkId);
      if (landmark) onSelectLandmark(landmark, 'dropoff');
    };

    return () => {
      delete (window as any)._setMapPickup;
      delete (window as any)._setMapDropoff;
    };
  }, [city, onSelectLandmark]);

  // Leaflet initialization effect
  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = weather === 'night' || weather === 'rainy';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const attribution = '&copy; <a href="https://www.mappls.com/">Mappls</a> &copy; <a href="https://www.mapmyindia.com/">MapmyIndia</a>';

    // Build map instance
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([city.center.lat, city.center.lng], 13);

    // Zoom buttons corner placement
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tiles = L.tileLayer(tileUrl, { attribution }).addTo(map);
    const layers = L.layerGroup().addTo(map);

    mapInstance.current = map;
    tilesLayerRef.current = tiles;
    layersRef.current = layers;

    // Click on Map to Drop Pin using Mappls Geocoding Services Proxy (Nominatim Backed)
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const currentCityData = cityRef.current;
      const gridCoords = getGridFromLatLng(lat, lng, currentCityData.id);

      let locationName = `Custom Location`;
      let locationDesc = `Mappls Grid: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'ColectivoRideshareSimulator/1.0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            locationName = data.display_name.split(',')[0] || data.name || 'Custom Coordinates';
            locationDesc = `${data.display_name} (Mappls Resolved)`;
          }
        }
      } catch (err) {
        console.warn("Mappls reverse geocoder fallbacked:", err);
      }

      const customPinLandmark: Landmark = {
        id: `map_click_${Date.now()}`,
        name: locationName,
        icon: 'MapPin',
        x: Math.round(gridCoords.x),
        y: Math.round(gridCoords.y),
        lat,
        lng,
        description: locationDesc
      };

      onSelectLandmarkRef.current(customPinLandmark, selectionTypeRef.current);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      tilesLayerRef.current = null;
      layersRef.current = null;
    };
  }, [city.id]); // re-init when city is swapped

  // Theme update effect
  useEffect(() => {
    if (!tilesLayerRef.current) return;
    const isDark = weather === 'night' || weather === 'rainy';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tilesLayerRef.current.setUrl(tileUrl);
  }, [weather]);

  // Markers and routes refresh effect
  useEffect(() => {
    if (!mapInstance.current || !layersRef.current) return;
    const map = mapInstance.current;
    const layers = layersRef.current;

    // Flush current layers
    layers.clearLayers();

    // 1. Draw landmarks
    city.landmarks.forEach(landmark => {
      const isPickup = selectedPickup?.id === landmark.id;
      const isDropoff = selectedDropoff?.id === landmark.id;
      const pos = landmark.lat && landmark.lng ? { lat: landmark.lat, lng: landmark.lng } : getLatLngFromGrid(landmark.x, landmark.y, city.id);

      let pinColor = 'bg-stone-500 border-stone-200 text-stone-700';
      if (isPickup) pinColor = 'bg-emerald-500 border-emerald-100 text-emerald-100';
      if (isDropoff) pinColor = 'bg-blue-500 border-blue-100 text-blue-100';

      const iconHtml = `
        <div class="relative flex items-center justify-center p-1">
          ${isPickup || isDropoff ? `
            <span class="absolute inline-flex h-8 w-8 rounded-full animate-ping ${isPickup ? 'bg-emerald-400/20' : 'bg-blue-400/20'}" style="animation-duration: 2.5s"></span>
          ` : ''}
          <div class="h-6 w-6 rounded-full ${pinColor} border-2 shadow-md flex items-center justify-center text-xs font-bold leading-none select-none transition-all">
            ${isPickup ? '📍' : isDropoff ? '🏳️' : '🔘'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-landmark-pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });
      
      marker.bindPopup(`
        <div class="p-1.5 font-sans" style="line-height: 1.3;">
          <h5 class="text-[11px] font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">${landmark.name}</h5>
          <p class="text-[9px] text-slate-500 mb-2">${landmark.description || 'Colectivo Point'}</p>
          <div class="flex gap-1">
            <button onclick="window._setMapPickup('${landmark.id}')" class="text-[9px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer">Set Pickup</button>
            <button onclick="window._setMapDropoff('${landmark.id}')" class="text-[9px] bg-blue-500 hover:bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer">Set Dropoff</button>
          </div>
        </div>
      `, {
        closeButton: false,
        minWidth: 150
      });

      marker.addTo(layers);
    });

    // 1.5. Draw Search Places Results dynamically (Fully Synchronized!)
    googlePlaces.forEach((place, idx) => {
      if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return;
      const pos = { lat: place.lat, lng: place.lng };

      const isPickup = activeSelectionType === 'pickup';
      const glowColor = isPickup ? 'from-emerald-600 to-green-500' : 'from-indigo-600 to-blue-500';
      const pingPulse = isPickup ? 'bg-emerald-400/30' : 'bg-indigo-400/30';

      const searchHtml = `
        <div class="relative flex items-center justify-center p-1 cursor-pointer">
          <span class="absolute inline-flex h-12 w-12 rounded-full animate-ping ${pingPulse}"></span>
          <div class="h-8 w-8 rounded-full bg-gradient-to-br ${glowColor} text-white shadow-xl border-2 border-white flex items-center justify-center text-xs font-black select-none transform hover:scale-110 active:scale-95 transition-all">
            🔍
          </div>
          <div class="absolute -bottom-8 bg-black/85 text-[10px] text-white font-extrabold px-2 py-0.5 rounded shadow-md whitespace-nowrap border border-white/20 select-none pointer-events-none capitalize">
            ${place.name.substring(0, 15)}
          </div>
        </div>
      `;

      const searchIcon = L.divIcon({
        html: searchHtml,
        className: 'custom-search-result-icon',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const m = L.marker([pos.lat, pos.lng], { icon: searchIcon });

      m.on('click', () => {
        // convert coordinates to 100x100 grid space of this city
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

        // Trigger selection
        onSelectLandmark(customLandmark, activeSelectionType);
        
        // Clean search states to complete selection super-fast and naturally
        if (setSearchQuery) setSearchQuery('');
        if (setGooglePlaces) setGooglePlaces([]);
        if (setIsSearching) setIsSearching(false);
      });

      m.bindTooltip(`
        <div class="p-1.5 font-sans text-[10px] bg-slate-950 text-white rounded shadow-lg border border-slate-700/50">
          <span class="font-bold block text-slate-100">${place.name}</span>
          <span class="text-slate-400 block text-[8px] truncate mt-0.5">${place.formatted_address}</span>
          <span class="text-[9px] font-black text-amber-300 block mt-1 uppercase tracking-wide">👉 Click Pin to Select as ${activeSelectionType.toUpperCase()}</span>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        className: 'custom-search-tooltip'
      });

      m.addTo(layers);
    });

    // 2. Draw active drivers
    drivers.forEach(driver => {
      // Show online/at-pickup status drivers
      if (driver.status === 'offline') return;
      const pos = getLatLngFromGrid(driver.x, driver.y, city.id);
      
      let carBg = 'bg-blue-600';
      if (driver.status === 'going_to_pickup') carBg = 'bg-emerald-500';
      if (driver.status === 'carrying') carBg = 'bg-indigo-600';
      if (driver.status === 'at_pickup') carBg = 'bg-amber-500';

      const nameInitial = driver.name.split(' ')[0];
      const driverHtml = `
        <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full ${carBg} text-white shadow-xl border-2 border-white scale-90 hover:scale-100 transition-all">
          <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
          <span class="text-[8px] font-mono font-black leading-none">${nameInitial}</span>
        </div>
      `;

      const driverIcon = L.divIcon({
        html: driverHtml,
        className: 'custom-driver-car-icon',
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const dMarker = L.marker([pos.lat, pos.lng], { icon: driverIcon });
      dMarker.bindPopup(`
        <div class="p-1 font-sans">
          <h5 class="text-xs font-bold text-gray-900">${driver.name}</h5>
          <p class="text-[10px] text-gray-500 mt-0.5">Vehicle: ${driver.vehicle}</p>
          <p class="text-[10px] text-gray-500">Plate: ${driver.plate}</p>
          <span class="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
            driver.status === 'idle' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }">${driver.status.replace(/_/g, ' ')}</span>
        </div>
      `, { closeButton: false });
      dMarker.addTo(layers);
    });

    // 3. Draw Selected Booking Route Polyline
    if (selectedPickup && selectedDropoff) {
      const calc = calculateRouteDetails(selectedPickup, selectedDropoff, city, trafficLevel);
      const coordinates = calc.path.map(node => {
        const c = getLatLngFromGrid(node.x, node.y, city.id);
        return [c.lat, c.lng] as [number, number];
      });

      if (coordinates.length > 1) {
        // Broad glowing shadow line
        L.polyline(coordinates, {
          color: '#4f46e5',
          weight: 8,
          opacity: 0.15,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layers);

        // Core route line
        const pathLine = L.polyline(coordinates, {
          color: '#6366f1',
          weight: 4.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layers);

        // Fit boundaries smoothly
        try {
          map.fitBounds(pathLine.getBounds(), { padding: [40, 40], maxZoom: 14 });
        } catch (e) {
          console.warn("fitBounds failed:", e);
        }
      }
    }

    // 4. Draw Active Drive Route Progress Path
    if (activeRide) {
      const hasDriver = !!activeRide.driverId;
      const matchedDriver = hasDriver ? drivers.find(d => d.id === activeRide.driverId) : null;

      if (activeRide.status === 'in_transit') {
        const oCoords = activeRide.pickup.lat && activeRide.pickup.lng 
          ? { lat: activeRide.pickup.lat, lng: activeRide.pickup.lng } 
          : getLatLngFromGrid(activeRide.pickup.x, activeRide.pickup.y, city.id);
        const dCoords = activeRide.dropoff.lat && activeRide.dropoff.lng 
          ? { lat: activeRide.dropoff.lat, lng: activeRide.dropoff.lng } 
          : getLatLngFromGrid(activeRide.dropoff.x, activeRide.dropoff.y, city.id);

        const transitLine = L.polyline([[oCoords.lat, oCoords.lng], [dCoords.lat, dCoords.lng]], {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.9,
          dashArray: '10, 10',
          lineCap: 'round'
        }).addTo(layers);
        
        try {
          map.fitBounds(transitLine.getBounds(), { padding: [50, 50], maxZoom: 14 });
        } catch (e) {}
      } else if (matchedDriver && (activeRide.status === 'picking_up' || activeRide.status === 'arrived')) {
        const drvPos = getLatLngFromGrid(matchedDriver.x, matchedDriver.y, city.id);
        const pCoords = activeRide.pickup.lat && activeRide.pickup.lng 
          ? { lat: activeRide.pickup.lat, lng: activeRide.pickup.lng } 
          : getLatLngFromGrid(activeRide.pickup.x, activeRide.pickup.y, city.id);

        const pickupLine = L.polyline([[drvPos.lat, drvPos.lng], [pCoords.lat, pCoords.lng]], {
          color: '#10b981',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '6, 6',
          lineCap: 'round'
        }).addTo(layers);

        try {
          map.fitBounds(pickupLine.getBounds(), { padding: [50, 50], maxZoom: 14 });
        } catch (e) {}
      }
    }

    // Dynamic auto-centering as per rider/driver location
    if (!selectedPickup && !selectedDropoff && !activeRide && drivers.length > 0) {
      const activeDrivers = drivers.filter(d => d.status !== 'offline');
      if (activeDrivers.length > 0) {
        const points = activeDrivers.map(d => getLatLngFromGrid(d.x, d.y, city.id));
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        try {
          if (activeDrivers.length > 1) {
            map.fitBounds([
              [minLat, minLng],
              [maxLat, maxLng]
            ], { padding: [60, 60], maxZoom: 14 });
          } else {
            map.panTo([points[0].lat, points[0].lng]);
          }
        } catch (boundsErr) {
          console.warn("Auto-centering bounds fit failed:", boundsErr);
        }
      }
    }

  }, [city, selectedPickup, selectedDropoff, activeRide, drivers, activeSelectionType, googlePlaces]);

  // Handle map flight to centering search results automatically
  useEffect(() => {
    if (!mapInstance.current || !googlePlaces || googlePlaces.length === 0) return;
    const firstPlace = googlePlaces[0];
    if (firstPlace && typeof firstPlace.lat === 'number' && typeof firstPlace.lng === 'number') {
      try {
        mapInstance.current.flyTo([firstPlace.lat, firstPlace.lng], 14, {
          animate: true,
          duration: 1.2
        });
      } catch (flyErr) {
        console.warn("Smooth flight to search result failed:", flyErr);
      }
    }
  }, [googlePlaces]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 transition-all" id="colectivo_simulation_map">
      
      {/* Leaflet DOM container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100" />

      {/* WEATHER DOWNPOUR VISUAL OVERLAY */}
      {weather === 'rainy' && (
        <div className="absolute inset-0 z-1 pointer-events-none opacity-35" style={{ zIndex: 400 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {rainDrops.map((drop) => (
              <line
                key={drop.id}
                x1={drop.x}
                y1={drop.y}
                x2={drop.x + 0.4}
                y2={drop.y + drop.len}
                stroke="#93c5fd"
                strokeWidth="0.25"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Active Header Overlay Details */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col items-end gap-1.5 pointer-events-none select-none">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono backdrop-blur-md shadow-md border ${
          weather === 'night' 
            ? 'bg-slate-950/90 text-slate-100 border-slate-800' 
            : 'bg-white/95 text-slate-800 border-slate-200'
        }`}>
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '45s' }} />
          <span>MAPPLS SMART NAV</span>
        </div>
        <button 
          onClick={() => setIsAlertVisible(true)}
          className={`pointer-events-auto text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 ${
            trafficLevel === 'heavy' 
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20 hover:bg-rose-500/30' 
              : trafficLevel === 'moderate'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30'
          }`}
          title="Click to view live traffic alert details"
          id="btn_reopen_traffic_alerts"
        >
          <Bell className="w-3 h-3 animate-pulse" />
          {trafficLevel} traffic
        </button>

        <button 
          onClick={() => setShowSurgeHeatmap(prev => !prev)}
          className={`pointer-events-auto text-[10px] uppercase font-bold tracking-widest px-2.5 py-1.5 rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 border ${
            showSurgeHeatmap
              ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400' 
              : 'bg-slate-950/90 text-amber-500 border-slate-800 hover:bg-slate-900'
          }`}
          title="Toggle Surge Demand Hotspots Heatmap Overlay"
          id="btn_toggle_surge_heatmap"
        >
          <Flame className={`w-3 h-3 ${showSurgeHeatmap ? 'animate-bounce text-slate-950' : 'text-amber-500'}`} />
          <span>{showSurgeHeatmap ? 'Heatmap: On' : 'Heatmap: Off'}</span>
        </button>
      </div>

      {/* Manual Pin Selection Panel */}
      <div className="absolute bottom-4 left-4 z-[500] max-w-[280px] pointer-events-auto">
        <div className={`p-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
          weather === 'night' || weather === 'rainy'
            ? 'bg-slate-950/95 text-slate-200 border-slate-800'
            : 'bg-white/95 text-slate-850 border-slate-205'
        }`}>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[11px]">
              <span className="font-semibold block mb-1">Click Map or Points to Set pins:</span>
              <div className="flex gap-2 mt-1.5">
                <button 
                  onClick={() => setActiveSelectionType('pickup')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center text-[10px] font-black tracking-wider transition-all border cursor-pointer ${
                    activeSelectionType === 'pickup' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  id="btn_set_pickup"
                >
                  📍 PICKUP
                </button>
                <button 
                  onClick={() => setActiveSelectionType('dropoff')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center text-[10px] font-black tracking-wider transition-all border cursor-pointer ${
                    activeSelectionType === 'dropoff' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  id="btn_set_dropoff"
                >
                  🏳️ DROP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Left Landmarks Quick Picker buttons */}
      <div className="absolute top-4 left-4 z-[500] flex flex-wrap gap-1 max-w-[300px]">
        {city.landmarks.slice(0, 3).map((landmark) => (
          <button
            key={landmark.id}
            onClick={() => onSelectLandmark(landmark, activeSelectionType)}
            className={`flex items-center gap-1.5 text-[9px] font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border cursor-pointer hover:scale-105 transition-all text-left ${
              weather === 'night' || weather === 'rainy'
                ? 'bg-slate-900/85 text-slate-200 border-slate-700/60 hover:bg-slate-800'
                : 'bg-white/85 text-stone-700 border-slate-200 hover:bg-white'
            }`}
          >
            {landmarkIconMap[landmark.icon] || <MapPin className="w-2.5 h-2.5" />}
            <span className="truncate max-w-[75px]">{landmark.name}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Traffic Alert Notification Overlay */}
      {isAlertVisible && activeAlert && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[500] w-[calc(100%-2rem)] max-w-[330px] pointer-events-auto transition-all" id="traffic_alert_hud">
          <div className={`p-3 rounded-2xl shadow-xl border backdrop-blur-md flex flex-col gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] ${
            weather === 'night' || weather === 'rainy'
              ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-rose-900/10'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/10'
          } border-l-4 ${
            activeAlert.severity === 'heavy'
              ? 'border-l-rose-500'
              : activeAlert.severity === 'moderate'
                ? 'border-l-amber-500'
                : 'border-l-emerald-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded-lg ${
                  activeAlert.severity === 'heavy'
                    ? 'bg-rose-500/10 text-rose-500 animate-pulse'
                    : activeAlert.severity === 'moderate'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[10.5px] uppercase tracking-tight font-display">
                    {activeAlert.title}
                  </span>
                  <span className="text-[8px] opacity-60 font-mono">
                    System Alert • {activeAlert.time}
                  </span>
                </div>
              </div>

              {/* Action buttons (Dismiss & Page through alerts of this level) */}
              <div className="flex items-center gap-1">
                {currentAlerts.length > 1 && (
                  <button 
                    onClick={() => setAlertIndex((prev) => (prev + 1) % currentAlerts.length)}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      weather === 'night' || weather === 'rainy'
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                    }`}
                    title="Next traffic alert in area"
                    id="btn_next_traffic_alert"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsAlertVisible(false)}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    weather === 'night' || weather === 'rainy'
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                  id="btn_close_traffic_alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className={`text-[10px] leading-relaxed ${
              weather === 'night' || weather === 'rainy' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {activeAlert.description}
            </p>

            <div className="flex items-center justify-between border-t border-dashed mt-1 pt-1.5 border-slate-250/20 text-[9px] font-mono opacity-80">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeAlert.severity === 'heavy' ? 'bg-rose-500' : activeAlert.severity === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                } animate-ping`} />
                Live Feed
              </span>
              <span>{city.name} Traffic Network</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Surge Heatmap Overlay */}
      <SurgeVisualizer 
        map={mapInstance.current}
        city={city}
        surgeMultiplier={surgeMultiplier}
        isVisible={showSurgeHeatmap}
      />

      {/* Live contextual Traffic Alert overlay component */}
      <TrafficAlertOverlay 
        trafficLevel={trafficLevel} 
        city={city} 
        weather={weather} 
        activeRide={activeRide}
        drivers={drivers}
      />
    </div>
  );
}

