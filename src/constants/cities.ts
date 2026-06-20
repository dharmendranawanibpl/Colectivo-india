import { CityData, VehicleConfig, PromoCode, PresetScenario, GridNode, GridEdge } from '../types';

// Let's build nodes for New York (represented as an offset Manhattan grid)
const createNYCGrid = (): { nodes: GridNode[]; edges: GridEdge[] } => {
  const nodes: GridNode[] = [];
  const edges: GridEdge[] = [];
  const rows = ['8th Ave', 'Broadway', 'Park Ave', 'Lexington Ave', '2nd Ave'];
  const cols = ['57th St', '51st St', '42nd St', '34th St', '23rd St', '14th St'];

  const xCoords = [15, 33, 50, 68, 85];
  const yCoords = [15, 30, 45, 60, 75, 90];

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const id = `nyc_n_${r}_${c}`;
      nodes.push({
        id,
        name: `${rows[r]} & ${cols[c]}`,
        x: xCoords[r],
        y: yCoords[c],
      });
    }
  }

  for (let c = 0; c < cols.length; c++) {
    for (let r = 0; r < rows.length - 1; r++) {
      edges.push({
        from: `nyc_n_${r}_${c}`,
        to: `nyc_n_${r + 1}_${c}`,
        streetName: cols[c],
      });
    }
  }

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length - 1; c++) {
      edges.push({
        from: `nyc_n_${r}_${c}`,
        to: `nyc_n_${r}_${c + 1}`,
        streetName: rows[r],
      });
    }
  }

  return { nodes, edges };
};

// San Francisco Grid Structure
const createSFGrid = (): { nodes: GridNode[]; edges: GridEdge[] } => {
  const nodes: GridNode[] = [];
  const edges: GridEdge[] = [];
  
  const streets = ['Lombard St', 'Geary Blvd', 'Market St', 'Mission St', 'Folsom St'];
  const intersects = ['Van Ness Ave', 'Franklin St', 'Gough St', 'Laguna St', 'Fillmore St'];

  const xCoords = [12, 34, 52, 70, 88];
  const yCoords = [10, 32, 50, 68, 86];

  for (let r = 0; r < streets.length; r++) {
    for (let c = 0; c < intersects.length; c++) {
      nodes.push({
        id: `sf_n_${r}_${c}`,
        name: `${streets[r]} & ${intersects[c]}`,
        x: xCoords[r],
        y: yCoords[c],
      });
    }
  }

  for (let r = 0; r < streets.length; r++) {
    for (let c = 0; c < intersects.length - 1; c++) {
      edges.push({
        from: `sf_n_${r}_${c}`,
        to: `sf_n_${r}_${c + 1}`,
        streetName: streets[r],
      });
    }
  }

  for (let c = 0; c < intersects.length; c++) {
    for (let r = 0; r < streets.length - 1; r++) {
      edges.push({
        from: `sf_n_${r}_${c}`,
        to: `sf_n_${r + 1}_${c}`,
        streetName: intersects[c],
      });
    }
  }

  return { nodes, edges };
};

// Paris Grid (Classic circular-radial mesh styling grid nodes)
const createParisGrid = (): { nodes: GridNode[]; edges: GridEdge[] } => {
  const nodes: GridNode[] = [];
  const edges: GridEdge[] = [];

  const ringStreets = ['Rond-point Central', 'Boulevard Saint-Germain', 'Boulevard de Clichy', 'Périphérique Intérieur'];
  const spokes = ['Avenue des Champs-Élysées', 'Rue de Rivoli', 'Boulevard Haussmann', 'Boulevard Saint-Michel', 'Rue de Lafayette', 'Avenue Foch'];

  nodes.push({ id: 'paris_n_center', name: 'Arc de Triomphe Center', x: 50, y: 50 });

  const ringDistances = [18, 32, 45];
  for (let ring = 0; ring < ringDistances.length; ring++) {
    for (let spokeIdx = 0; spokeIdx < spokes.length; spokeIdx++) {
      const angle = (spokeIdx / spokes.length) * 2 * Math.PI;
      const x = 50 + Math.cos(angle) * ringDistances[ring];
      const y = 50 + Math.sin(angle) * ringDistances[ring];
      const id = `paris_n_${ring}_${spokeIdx}`;
      nodes.push({
        id,
        name: `${ringStreets[ring + 1] || ringStreets[0]} & ${spokes[spokeIdx]}`,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      });
    }
  }

  for (let spokeIdx = 0; spokeIdx < spokes.length; spokeIdx++) {
    edges.push({
      from: 'paris_n_center',
      to: `paris_n_0_${spokeIdx}`,
      streetName: spokes[spokeIdx],
    });
  }

  for (let spokeIdx = 0; spokeIdx < spokes.length; spokeIdx++) {
    for (let ring = 0; ring < ringDistances.length - 1; ring++) {
      edges.push({
        from: `paris_n_${ring}_${spokeIdx}`,
        to: `paris_n_${ring + 1}_${spokeIdx}`,
        streetName: spokes[spokeIdx],
      });
    }
  }

  for (let ring = 0; ring < ringDistances.length; ring++) {
    for (let spokeIdx = 0; spokeIdx < spokes.length; spokeIdx++) {
      const nextSpoke = (spokeIdx + 1) % spokes.length;
      edges.push({
        from: `paris_n_${ring}_${spokeIdx}`,
        to: `paris_n_${ring}_${nextSpoke}`,
        streetName: ringStreets[ring],
      });
    }
  }

  return { nodes, edges };
};

// Tokyo Grid Layout
const createTokyoGrid = (): { nodes: GridNode[]; edges: GridEdge[] } => {
  const nodes: GridNode[] = [];
  const edges: GridEdge[] = [];

  const districts = ['Shibuya', 'Shinjuku', 'Roppongi', 'Ginza', 'Akihabara'];
  const boulevards = ['Meiji Dori', 'Yasukuni Dori', 'Sotobori Dori', 'Harumi Dori', 'Showa Dori'];

  const xCoords = [15, 30, 50, 70, 85];
  const yCoords = [20, 35, 50, 65, 80];

  for (let r = 0; r < districts.length; r++) {
    for (let c = 0; c < boulevards.length; c++) {
      nodes.push({
        id: `tokyo_n_${r}_${c}`,
        name: `${districts[r]} Crossway & ${boulevards[c]}`,
        x: xCoords[r],
        y: yCoords[c],
      });
    }
  }

  for (let r = 0; r < districts.length; r++) {
    for (let c = 0; c < boulevards.length - 1; c++) {
      edges.push({
        from: `tokyo_n_${r}_${c}`,
        to: `tokyo_n_${r}_${c + 1}`,
        streetName: districts[r] + ' Boulevard',
      });
    }
  }

  for (let c = 0; c < boulevards.length; c++) {
    for (let r = 0; r < districts.length - 1; r++) {
      edges.push({
        from: `tokyo_n_${r}_${c}`,
        to: `tokyo_n_${r + 1}_${c}`,
        streetName: boulevards[c],
      });
    }
  }

  return { nodes, edges };
};

const nycGrid = createNYCGrid();
const sfGrid = createSFGrid();
const parisGrid = createParisGrid();
const tokyoGrid = createTokyoGrid();

const INDIAN_STATES_CITIES = [
  {
    state: "Andhra Pradesh",
    cities: [
      { name: "Visakhapatnam", id: "visakhapatnam", lat: 17.6868, lng: 83.2185 },
      { name: "Vijayawada", id: "vijayawada", lat: 16.5062, lng: 80.6480 },
      { name: "Guntur", id: "guntur", lat: 16.3067, lng: 80.4365 },
      { name: "Tirupati", id: "tirupati", lat: 13.6288, lng: 79.4192 },
      { name: "Nellore", id: "nellore", lat: 14.4426, lng: 79.9865 }
    ]
  },
  {
    state: "Arunachal Pradesh",
    cities: [
      { name: "Itanagar", id: "itanagar", lat: 27.0844, lng: 93.6053 },
      { name: "Naharlagun", id: "naharlagun", lat: 27.1032, lng: 93.6934 },
      { name: "Pasighat", id: "pasighat", lat: 28.0619, lng: 95.3268 }
    ]
  },
  {
    state: "Assam",
    cities: [
      { name: "Guwahati", id: "guwahati", lat: 26.1158, lng: 91.7086 },
      { name: "Dibrugarh", id: "dibrugarh", lat: 27.4728, lng: 94.9120 },
      { name: "Silchar", id: "silchar", lat: 24.8333, lng: 92.7789 },
      { name: "Jorhat", id: "jorhat", lat: 26.7509, lng: 94.2037 },
      { name: "Tezpur", id: "tezpur", lat: 26.6338, lng: 92.7926 }
    ]
  },
  {
    state: "Bihar",
    cities: [
      { name: "Patna", id: "patna", lat: 25.5941, lng: 85.1376 },
      { name: "Gaya", id: "gaya", lat: 24.7914, lng: 85.0002 },
      { name: "Bhagalpur", id: "bhagalpur", lat: 25.2425, lng: 86.9842 },
      { name: "Muzaffarpur", id: "muzaffarpur", lat: 26.1209, lng: 85.3647 },
      { name: "Darbhanga", id: "darbhanga", lat: 26.1542, lng: 85.8918 }
    ]
  },
  {
    state: "Chandigarh",
    cities: [
      { name: "Chandigarh", id: "chandigarh", lat: 30.7333, lng: 76.7794 }
    ]
  },
  {
    state: "Chhattisgarh",
    cities: [
      { name: "Raipur", id: "raipur", lat: 21.2514, lng: 81.6296 },
      { name: "Bilaspur", id: "bilaspur", lat: 22.0790, lng: 82.1391 },
      { name: "Bhilai", id: "bhilai", lat: 21.1938, lng: 81.3509 },
      { name: "Durg", id: "durg", lat: 21.1904, lng: 81.2849 }
    ]
  },
  {
    state: "Delhi",
    cities: [
      { name: "Delhi", id: "delhi", lat: 28.6139, lng: 77.2090 },
      { name: "New Delhi", id: "new_delhi", lat: 28.6129, lng: 77.2295 },
      { name: "Dwarka", id: "dwarka", lat: 28.5857, lng: 77.0494 },
      { name: "Rohini", id: "rohini", lat: 28.7159, lng: 77.1132 }
    ]
  },
  {
    state: "Goa",
    cities: [
      { name: "Panaji", id: "panaji", lat: 15.4909, lng: 73.8278 },
      { name: "Margao", id: "margao", lat: 15.2736, lng: 73.9582 },
      { name: "Vasco da Gama", id: "vasco_da_gama", lat: 15.3995, lng: 73.8115 },
      { name: "Mapusa", id: "mapusa", lat: 15.5937, lng: 73.8142 }
    ]
  },
  {
    state: "Gujarat",
    cities: [
      { name: "Ahmedabad", id: "ahmedabad", lat: 23.0225, lng: 72.5714 },
      { name: "Surat", id: "surat", lat: 21.1702, lng: 72.8311 },
      { name: "Vadodara", id: "vadodara", lat: 22.3072, lng: 73.1812 },
      { name: "Rajkot", id: "rajkot", lat: 22.3039, lng: 70.8022 },
      { name: "Gandhinagar", id: "gandhinagar", lat: 23.2156, lng: 72.6369 }
    ]
  },
  {
    state: "Haryana",
    cities: [
      { name: "Gurugram", id: "gurugram", lat: 28.4595, lng: 77.0266 },
      { name: "Faridabad", id: "faridabad", lat: 28.4089, lng: 77.3178 },
      { name: "Panipat", id: "panipat", lat: 29.3909, lng: 76.9635 },
      { name: "Ambala", id: "ambala", lat: 30.3782, lng: 76.7767 },
      { name: "Karnal", id: "karnal", lat: 29.6857, lng: 76.9905 }
    ]
  },
  {
    state: "Himachal Pradesh",
    cities: [
      { name: "Shimla", id: "shimla", lat: 31.1048, lng: 77.1734 },
      { name: "Dharamshala", id: "dharamshala", lat: 32.2190, lng: 76.3234 },
      { name: "Solan", id: "solan", lat: 30.9045, lng: 77.0967 },
      { name: "Manali", id: "manali", lat: 32.2396, lng: 77.1887 }
    ]
  },
  {
    state: "Jammu and Kashmir",
    cities: [
      { name: "Srinagar", id: "srinagar", lat: 34.0837, lng: 74.7973 },
      { name: "Jammu", id: "jammu", lat: 32.7266, lng: 74.8570 },
      { name: "Anantnag", id: "anantnag", lat: 33.7311, lng: 75.1481 }
    ]
  },
  {
    state: "Jharkhand",
    cities: [
      { name: "Ranchi", id: "ranchi", lat: 23.3441, lng: 85.3096 },
      { name: "Jamshedpur", id: "jamshedpur", lat: 22.8046, lng: 86.2029 },
      { name: "Dhanbad", id: "dhanbad", lat: 23.7957, lng: 86.4304 },
      { name: "Bokaro", id: "bokaro", lat: 23.6693, lng: 86.1511 },
      { name: "Deoghar", id: "deoghar", lat: 24.4841, lng: 86.7025 }
    ]
  },
  {
    state: "Karnataka",
    cities: [
      { name: "Bengaluru", id: "bengaluru", lat: 12.9716, lng: 77.5946 },
      { name: "Mysuru", id: "mysuru", lat: 12.2958, lng: 76.6394 },
      { name: "Hubballi", id: "hubballi", lat: 15.3647, lng: 75.1240 },
      { name: "Mangaluru", id: "mangaluru", lat: 12.9141, lng: 74.8560 },
      { name: "Belagavi", id: "belagavi", lat: 15.8497, lng: 74.4977 }
    ]
  },
  {
    state: "Kerala",
    cities: [
      { name: "Kochi", id: "kochi", lat: 9.9312, lng: 76.2673 },
      { name: "Thiruvananthapuram", id: "thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
      { name: "Kozhikode", id: "kozhikode", lat: 11.2588, lng: 75.7804 },
      { name: "Thrissur", id: "thrissur", lat: 10.5276, lng: 76.2144 },
      { name: "Alappuzha", id: "alappuzha", lat: 9.4981, lng: 76.3388 }
    ]
  },
  {
    state: "Ladakh",
    cities: [
      { name: "Leh", id: "leh", lat: 34.1526, lng: 77.5771 },
      { name: "Kargil", id: "kargil", lat: 34.5539, lng: 76.1349 }
    ]
  },
  {
    state: "Lakshadweep",
    cities: [
      { name: "Kavaratti", id: "kavaratti", lat: 10.5667, lng: 72.6417 }
    ]
  },
  {
    state: "Madhya Pradesh",
    cities: [
      { name: "Indore", id: "indore", lat: 22.7196, lng: 75.8577 },
      { name: "Bhopal", id: "bhopal", lat: 23.2599, lng: 77.4126 },
      { name: "Jabalpur", id: "jabalpur", lat: 23.1815, lng: 79.9864 },
      { name: "Gwalior", id: "gwalior", lat: 26.2124, lng: 78.1772 },
      { name: "Ujjain", id: "ujjain", lat: 23.1760, lng: 75.7885 }
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      { name: "Mumbai", id: "mumbai", lat: 18.9220, lng: 72.8347 },
      { name: "Pune", id: "pune", lat: 18.5204, lng: 73.8567 },
      { name: "Nagpur", id: "nagpur", lat: 21.1458, lng: 79.0882 },
      { name: "Thane", id: "thane", lat: 19.2183, lng: 72.9781 },
      { name: "Nashik", id: "nashik", lat: 19.9975, lng: 73.7898 },
      { name: "Aurangabad", id: "aurangabad", lat: 19.8762, lng: 75.3433 }
    ]
  },
  {
    state: "Manipur",
    cities: [
      { name: "Imphal", id: "imphal", lat: 24.8170, lng: 93.9368 },
      { name: "Ukhrul", id: "ukhrul", lat: 25.1161, lng: 94.4411 }
    ]
  },
  {
    state: "Meghalaya",
    cities: [
      { name: "Shillong", id: "shillong", lat: 25.5788, lng: 91.8831 },
      { name: "Tura", id: "tura", lat: 25.5144, lng: 90.2201 }
    ]
  },
  {
    state: "Mizoram",
    cities: [
      { name: "Aizawl", id: "aizawl", lat: 23.7271, lng: 92.7176 },
      { name: "Lunglei", id: "lunglei", lat: 22.8671, lng: 92.7303 }
    ]
  },
  {
    state: "Nagaland",
    cities: [
      { name: "Kohima", id: "kohima", lat: 25.6751, lng: 94.1086 },
      { name: "Dimapur", id: "dimapur", lat: 25.9061, lng: 93.7271 }
    ]
  },
  {
    state: "Odisha",
    cities: [
      { name: "Bhubaneswar", id: "bhubaneswar", lat: 20.2961, lng: 85.8245 },
      { name: "Cuttack", id: "cuttack", lat: 20.4625, lng: 85.8830 },
      { name: "Rourkela", id: "rourkela", lat: 22.2604, lng: 84.8536 },
      { name: "Puri", id: "puri", lat: 19.8135, lng: 85.8312 },
      { name: "Sambalpur", id: "sambalpur", lat: 21.4669, lng: 83.9812 }
    ]
  },
  {
    state: "Puducherry",
    cities: [
      { name: "Puducherry", id: "puducherry", lat: 11.9416, lng: 79.8083 },
      { name: "Karaikal", id: "karaikal", lat: 10.9254, lng: 79.8380 }
    ]
  },
  {
    state: "Punjab",
    cities: [
      { name: "Ludhiana", id: "ludhiana", lat: 30.9010, lng: 75.8573 },
      { name: "Amritsar", id: "amritsar", lat: 31.6340, lng: 74.8723 },
      { name: "Jalandhar", id: "jalandhar", lat: 31.3260, lng: 75.5762 },
      { name: "Patiala", id: "patiala", lat: 30.3398, lng: 76.3869 },
      { name: "Bathinda", id: "bathinda", lat: 30.2110, lng: 74.9455 }
    ]
  },
  {
    state: "Rajasthan",
    cities: [
      { name: "Jaipur", id: "jaipur", lat: 26.9124, lng: 75.7873 },
      { name: "Jodhpur", id: "jodhpur", lat: 26.2389, lng: 73.0243 },
      { name: "Udaipur", id: "udaipur", lat: 24.5854, lng: 73.7125 },
      { name: "Kota", id: "kota", lat: 25.1825, lng: 75.8242 },
      { name: "Ajmer", id: "ajmer", lat: 26.4499, lng: 74.6399 },
      { name: "Bikaner", id: "bikaner", lat: 28.0166, lng: 73.3119 }
    ]
  },
  {
    state: "Sikkim",
    cities: [
      { name: "Gangtok", id: "gangtok", lat: 27.3314, lng: 88.6138 },
      { name: "Namchi", id: "namchi", lat: 27.1672, lng: 88.3582 }
    ]
  },
  {
    state: "Tamil Nadu",
    cities: [
      { name: "Chennai", id: "chennai", lat: 13.0827, lng: 80.2707 },
      { name: "Coimbatore", id: "coimbatore", lat: 11.0168, lng: 76.9558 },
      { name: "Madurai", id: "madurai", lat: 9.9252, lng: 78.1198 },
      { name: "Tiruchirappalli", id: "tiruchirappalli", lat: 10.7905, lng: 78.7047 },
      { name: "Salem", id: "salem", lat: 11.6643, lng: 78.1460 }
    ]
  },
  {
    state: "Telangana",
    cities: [
      { name: "Hyderabad", id: "hyderabad", lat: 17.3850, lng: 78.4867 },
      { name: "Warangal", id: "warangal", lat: 17.9784, lng: 79.5941 },
      { name: "Nizamabad", id: "nizamabad", lat: 18.6725, lng: 78.0941 },
      { name: "Khammam", id: "khammam", lat: 17.2473, lng: 80.1514 },
      { name: "Karimnagar", id: "karimnagar", lat: 18.4386, lng: 79.1288 }
    ]
  },
  {
    state: "Tripura",
    cities: [
      { name: "Agartala", id: "agartala", lat: 23.8315, lng: 91.2868 },
      { name: "Udaipur", id: "udaipur_tripura", lat: 23.5332, lng: 91.4817 }
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      { name: "Lucknow", id: "lucknow", lat: 26.8467, lng: 80.9462 },
      { name: "Kanpur", id: "kanpur", lat: 26.4499, lng: 80.3319 },
      { name: "Noida", id: "noida", lat: 28.5355, lng: 77.3910 },
      { name: "Ghaziabad", id: "ghaziabad", lat: 28.6692, lng: 77.4538 },
      { name: "Agra", id: "agra", lat: 27.1767, lng: 78.0081 },
      { name: "Varanasi", id: "varanasi", lat: 25.3176, lng: 82.9739 },
      { name: "Prayagraj", id: "prayagraj", lat: 25.4358, lng: 81.8463 }
    ]
  },
  {
    state: "Uttarakhand",
    cities: [
      { name: "Dehradun", id: "dehradun", lat: 30.3165, lng: 78.0322 },
      { name: "Haridwar", id: "haridwar", lat: 29.9457, lng: 78.1642 },
      { name: "Rishikesh", id: "rishikesh", lat: 30.0869, lng: 78.2676 },
      { name: "Haldwani", id: "haldwani", lat: 29.2183, lng: 79.5130 },
      { name: "Roorkee", id: "roorkee", lat: 29.8543, lng: 77.8880 }
    ]
  },
  {
    state: "West Bengal",
    cities: [
      { name: "Kolkata", id: "kolkata", lat: 22.5726, lng: 88.3639 },
      { name: "Howrah", id: "howrah", lat: 22.5726, lng: 88.3185 },
      { name: "Siliguri", id: "siliguri", lat: 26.7271, lng: 88.3953 },
      { name: "Durgapur", id: "durgapur", lat: 23.5204, lng: 87.3119 },
      { name: "Asansol", id: "asansol", lat: 23.6740, lng: 86.9520 },
      { name: "Darjeeling", id: "darjeeling", lat: 27.0410, lng: 88.2627 }
    ]
  },
  {
    state: "Andaman and Nicobar Islands",
    cities: [
      { name: "Port Blair", id: "port_blair", lat: 11.6234, lng: 92.7265 }
    ]
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    cities: [
      { name: "Daman", id: "daman", lat: 20.3974, lng: 72.8328 },
      { name: "Silvassa", id: "silvassa", lat: 20.2766, lng: 73.0022 },
      { name: "Diu", id: "diu", lat: 20.7144, lng: 70.9822 }
    ]
  }
];

const ACCENT_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#6366F1', '#06B6D4', '#14B8A6'];

const PRIME_CITIES_MAP: Record<string, any> = {
  delhi: {
    accentColor: '#F59E0B',
    landmarks: [
      { id: 'delhi_red_fort', name: 'Red Fort', icon: 'TowerControl', x: 33, y: 30, description: 'Historic Mughal fort complex with iconic red sandstone walls.', lat: 28.6562, lng: 77.2410 },
      { id: 'delhi_india_gate', name: 'India Gate South', icon: 'Trees', x: 33, y: 15, description: 'War memorial archway surrounded by lush open lawns.', lat: 28.6129, lng: 77.2295 },
      { id: 'delhi_qutub_minar', name: 'Qutub Minar', icon: 'Building2', x: 50, y: 45, description: 'Soaring 73-meter brick minaret built in 1193.', lat: 28.5244, lng: 77.1855 },
      { id: 'delhi_cp', name: 'Connaught Place', icon: 'Compass', x: 68, y: 30, description: 'Colonial-era circular financial, business, and shopping hub.', lat: 28.6304, lng: 77.2177 },
      { id: 'delhi_lotus_temple', name: 'Lotus Temple', icon: 'Sparkles', x: 50, y: 90, description: 'Baha’i House of Worship famous for its flower-like architecture.', lat: 28.5535, lng: 77.2588 },
      { id: 'delhi_chandni_chowk', name: 'Chandni Chowk Market', icon: 'ShoppingBag', x: 50, y: 60, description: 'One of Delhi’s oldest, busiest, and most historic street markets.', lat: 28.6505, lng: 77.2300 },
    ],
    grid: nycGrid
  },
  mumbai: {
    accentColor: '#3B82F6',
    landmarks: [
      { id: 'mumbai_gateway', name: 'Gateway of India', icon: 'Compass', x: 12, y: 10, description: 'Colonial monument overlooking the Arabian Sea.', lat: 18.9220, lng: 72.8347 },
      { id: 'mumbai_marine_drive', name: 'Marine Drive Promenade', icon: 'Palmtree', x: 52, y: 50, description: 'Famous arc-shaped seaside boulevard called Queen’s Necklace.', lat: 18.9440, lng: 72.8224 },
      { id: 'mumbai_cst', name: 'Chhatrapati Shivaji Terminus', icon: 'Train', x: 52, y: 10, description: 'Gothic revival historic railroad terminis.', lat: 18.9400, lng: 72.8353 },
      { id: 'mumbai_juhu_beach', name: 'Juhu Beach', icon: 'Ship', x: 70, y: 68, description: 'Popular sandy shore known for street food and evening crowds.', lat: 19.1000, lng: 72.8258 },
      { id: 'mumbai_sea_link', name: 'Bandra-Worli Sea Link', icon: 'Zap', x: 12, y: 86, description: 'Cable-stayed bridge spanning the Mahim Bay.', lat: 19.0300, lng: 72.8150 },
    ],
    grid: sfGrid
  },
  bengaluru: {
    accentColor: '#10B981',
    landmarks: [
      { id: 'blr_lalbagh', name: 'Lalbagh Botanical Garden', icon: 'Trees', x: 18, y: 50, description: 'Century-old garden with massive glasshouse.', lat: 12.9510, lng: 77.5855 },
      { id: 'blr_cubbon', name: 'Cubbon Park Area', icon: 'Map', x: 50, y: 50, description: '300-acre green lung space in Bengaluru city center.', lat: 12.9780, lng: 77.5950 },
      { id: 'blr_palace', name: 'Bangalore Palace', icon: 'Church', x: 50, y: 18, description: 'Royal palace completed in 1944 styled like Windsor Castle.', lat: 12.9985, lng: 77.5920 },
      { id: 'blr_brigade', name: 'Brigade Road Junction', icon: 'ShoppingBag', x: 68, y: 68, description: 'Bustling retail, street food, and entertainment hub.', lat: 12.9710, lng: 77.6070 },
      { id: 'blr_soudha', name: 'Vidhana Soudha legislative', icon: 'Building', x: 32, y: 32, description: 'Magnificent neo-Dravidian architecture housing seat of state power.', lat: 12.9796, lng: 77.5912 },
    ],
    grid: parisGrid
  },
  kolkata: {
    accentColor: '#EC4899',
    landmarks: [
      { id: 'kolkata_victoria', name: 'Victoria Memorial', icon: 'Building', x: 15, y: 20, description: 'Vast white marble palace surrounded by spectacular gardens.', lat: 22.5448, lng: 88.3425 },
      { id: 'kolkata_howrah', name: 'Howrah Bridge', icon: 'Zap', x: 85, y: 20, description: 'Historic cantilever bridge over Hooghly River.', lat: 22.5851, lng: 88.3468 },
      { id: 'kolkata_temple', name: 'Dakshineswar Kali Temple', icon: 'Church', x: 50, y: 50, description: 'Fabled 19th-century temple complex built by Rani Rashmoni.', lat: 22.6550, lng: 88.3575 },
      { id: 'kolkata_park_st', name: 'Park Street Dining', icon: 'Flame', x: 70, y: 35, description: 'Legendary restaurant, nightlife, and heritage lane of Kolkata.', lat: 22.5490, lng: 88.3524 },
      { id: 'kolkata_eden_gardens', name: 'Eden Gardens Stadium', icon: 'Flower2', x: 15, y: 50, description: 'Historic cricket stadium with iconic roaring atmosphere.', lat: 22.5644, lng: 88.3435 },
    ],
    grid: tokyoGrid
  }
};

const buildCitiesList = (): CityData[] => {
  const result: CityData[] = [];
  let colorIdx = 0;
  let gridIdx = 0;

  for (const stateObj of INDIAN_STATES_CITIES) {
    for (const rawCity of stateObj.cities) {
      const prime = PRIME_CITIES_MAP[rawCity.id];
      if (prime) {
        result.push({
          id: rawCity.id,
          name: rawCity.name,
          country: 'India',
          state: stateObj.state,
          accentColor: prime.accentColor,
          center: { lat: rawCity.lat, lng: rawCity.lng },
          landmarks: prime.landmarks,
          nodes: prime.grid.nodes,
          edges: prime.grid.edges,
        });
      } else {
        const accentColor = ACCENT_COLORS[colorIdx % ACCENT_COLORS.length];
        colorIdx++;

        const grid = [nycGrid, sfGrid, parisGrid, tokyoGrid][gridIdx % 4];
        gridIdx++;

        const landmarks = [
          {
            id: `${rawCity.id}_transit_hub`,
            name: `${rawCity.name} Transit Junction`,
            icon: 'Compass',
            x: 20,
            y: 20,
            description: `Primary transit node and central interchange of ${rawCity.name}.`,
            lat: rawCity.lat + 0.015,
            lng: rawCity.lng + 0.015
          },
          {
            id: `${rawCity.id}_district_court`,
            name: `${rawCity.name} Civic Plaza`,
            icon: 'Building2',
            x: 50,
            y: 45,
            description: `Dynamic public plaza and civic administrative center.`,
            lat: rawCity.lat,
            lng: rawCity.lng
          },
          {
            id: `${rawCity.id}_clock_tower`,
            name: `${rawCity.name} Clock Tower`,
            icon: 'TowerControl',
            x: 68,
            y: 30,
            description: `Historic colonial-era clock tower landmark.`,
            lat: rawCity.lat - 0.01,
            lng: rawCity.lng + 0.012
          },
          {
            id: `${rawCity.id}_royal_park`,
            name: `Municipal Botanical Garden`,
            icon: 'Trees',
            x: 50,
            y: 80,
            description: `Lush green space featuring beautiful flower lanes.`,
            lat: rawCity.lat - 0.018,
            lng: rawCity.lng - 0.015
          },
          {
            id: `${rawCity.id}_shopping_plaza`,
            name: `${rawCity.name} Central Market`,
            icon: 'ShoppingBag',
            x: 80,
            y: 70,
            description: `Bustling local retail and artisan hub of the district.`,
            lat: rawCity.lat + 0.008,
            lng: rawCity.lng - 0.01
          }
        ];

        result.push({
          id: rawCity.id,
          name: rawCity.name,
          country: 'India',
          state: stateObj.state,
          accentColor,
          center: { lat: rawCity.lat, lng: rawCity.lng },
          landmarks,
          nodes: grid.nodes,
          edges: grid.edges,
        });
      }
    }
  }

  return result;
};

export const CITIES = buildCitiesList();

export const VEHICLE_CONFIGS: VehicleConfig[] = [
  {
    id: 'comfort',
    name: 'Comfort',
    multiplier: 1.0,
    capacity: 4,
    etaBase: 2,
    iconName: 'Car',
    description: 'Spacious vehicles with top-rated drivers (₹9/km).',
  },
  {
    id: 'comfortplus',
    name: 'Comfort +',
    multiplier: 1.44,
    capacity: 6,
    etaBase: 3,
    iconName: 'Sparkles',
    description: 'Premium spacious vehicles with customizable climate controls (₹13/km).',
  },
];

export const PROMO_CODES: PromoCode[] = [
  { code: 'URBANRIDE50', discount: 50, description: '50% off ride (Max ₹500 discount)' },
  { code: 'SAVEEIGHT', discount: 8, description: '₹400 flat discount on your trip' },
  { code: 'WELCOMEUBER', discount: 20, description: '20% off your initial ride' },
  { code: 'RAINDAY', discount: 15, description: '15% weather easing discount' },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'sunny_normal',
    name: 'Dry Afternoon',
    description: 'Clear skies, calm traffic, standard fares.',
    weather: 'sunny',
    trafficLevel: 'light',
    surgeMultiplier: 1.0,
    iconName: 'Sun',
  },
  {
    id: 'rush_hour',
    name: 'Friday Rush Hour',
    description: 'Intense city congestion. High demand pushes prices up!',
    weather: 'sunny',
    trafficLevel: 'heavy',
    surgeMultiplier: 1.8,
    iconName: 'Hourglass',
  },
  {
    id: 'heavy_rain',
    name: 'Downpouring Storm',
    description: 'Torrential rains block traffic. Short supply causes surge!',
    weather: 'rainy',
    trafficLevel: 'heavy',
    surgeMultiplier: 2.1,
    iconName: 'CloudRain',
  },
  {
    id: 'night_vip',
    name: 'Saturday Night Clubbing',
    description: 'Midnight nightlife rides. Cozy dark mood active.',
    weather: 'night',
    trafficLevel: 'moderate',
    surgeMultiplier: 1.4,
    iconName: 'Moon',
  },
];
