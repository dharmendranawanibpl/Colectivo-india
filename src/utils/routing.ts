import { GridNode, GridEdge, Landmark, CityData, TrafficLevel } from '../types';

/**
 * Finds the node closest to a given coordinate (or Landmark)
 */
export function findClosestNode(x: number, y: number, nodes: GridNode[]): GridNode {
  let closest = nodes[0];
  let minDist = Infinity;

  for (const node of nodes) {
    const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }

  return closest;
}

/**
 * Uses BFS to search for the shortest coordinate path in the city node network.
 * Falls back to directly starting and ending nodes if no path can be linked.
 */
export function computeGraphRoute(
  startNodeId: string,
  endNodeId: string,
  city: CityData
): GridNode[] {
  const { nodes, edges } = city;
  
  // Build adjacency list
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => {
    adj[n.id] = [];
  });

  edges.forEach(e => {
    if (adj[e.from] && adj[e.to]) {
      adj[e.from].push(e.to);
      adj[e.to].push(e.from); // undirected street grid mapping
    }
  });

  // BFS Queue: [Current ID, Path so far]
  const queue: [string, string[]][] = [[startNodeId, [startNodeId]]];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const [currId, path] = queue.shift()!;

    if (currId === endNodeId) {
      // Find nodes from IDs
      return path.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
    }

    const neighbors = adj[currId] || [];
    for (const nextId of neighbors) {
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push([nextId, [...path, nextId]]);
      }
    }
  }

  // Fallback direct line if nodes are isolated
  const first = nodes.find(n => n.id === startNodeId);
  const last = nodes.find(n => n.id === endNodeId);
  return [first, last].filter((n): n is GridNode => !!n);
}

/**
 * Calculations for estimating distances, fees, and driving minutes
 */
export interface RouteCalculations {
  path: GridNode[];
  distanceMiles: number;
  durationMinutes: number;
}

export function calculateRouteDetails(
  pickup: Landmark,
  dropoff: Landmark,
  city: CityData,
  trafficLevel: TrafficLevel
): RouteCalculations {
  const startNode = findClosestNode(pickup.x, pickup.y, city.nodes);
  const endNode = findClosestNode(dropoff.x, dropoff.y, city.nodes);

  // Compute graph route
  const graphRoute = computeGraphRoute(startNode.id, endNode.id, city);
  
  // Prepend pickup coordinate anchor and append drop-off anchor for precision
  const finalPath: GridNode[] = [
    { id: 'pickup_anchor', name: pickup.name, x: pickup.x, y: pickup.y },
    ...graphRoute.filter(n => n.id !== startNode.id && n.id !== endNode.id),
    { id: 'dropoff_anchor', name: dropoff.name, x: dropoff.x, y: dropoff.y }
  ];

  // Calculate cumulative distance
  let totalGridDistance = 0;
  for (let i = 0; i < finalPath.length - 1; i++) {
    const n1 = finalPath[i];
    const n2 = finalPath[i + 1];
    totalGridDistance += Math.sqrt((n2.x - n1.x) ** 2 + (n2.y - n1.y) ** 2);
  }

  // Scale grid distance to real-world feel miles
  // Let's say a 100-unit grid diagonal is ~10 miles. Thus Euclidean distance factor is 0.1
  const distanceMiles = parseFloat((totalGridDistance * 0.12).toFixed(1));

  // Base minutes per mile based on traffic
  let minPerMile = 2.0; // standard light traffic
  if (trafficLevel === 'moderate') {
    minPerMile = 3.5;
  } else if (trafficLevel === 'heavy') {
    minPerMile = 6.0;
  }

  const durationMinutes = Math.max(
    Math.round(distanceMiles * minPerMile + 2), // add base dispatch delay minutes
    4
  );

  return {
    path: finalPath,
    distanceMiles,
    durationMinutes,
  };
}

/**
 * Generate a random license plate number
 */
export function generateLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let plate = '';
  for (let i = 0; i < 3; i++) plate += letters.charAt(Math.floor(Math.random() * letters.length));
  plate += '-';
  for (let i = 0; i < 4; i++) plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
  return plate;
}

/**
 * Generates random driver locations scattered near grid nodes
 */
export function scatterDriverCoordinates(nodes: GridNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 50, y: 50 };
  const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
  // slightly jitter to avoid exact overlapping
  const jitterX = (Math.random() - 0.5) * 6;
  const jitterY = (Math.random() - 0.5) * 6;
  return {
    x: Math.max(5, Math.min(95, randomNode.x + jitterX)),
    y: Math.max(5, Math.min(95, randomNode.y + jitterY))
  };
}

/**
 * Convert simulated 100x100 grid coords to real lat/lng for accurate map locations
 */
export function getLatLngFromGrid(x: number, y: number, cityId: string): { lat: number; lng: number } {
  let latRange = [28.5300, 28.6800]; // Delhi default
  let lngRange = [77.1000, 77.3000];

  if (cityId === 'mumbai') {
    latRange = [18.9000, 19.1550];
    lngRange = [72.7500, 72.8800];
  } else if (cityId === 'bengaluru') {
    latRange = [12.9100, 13.0300];
    lngRange = [77.5200, 77.6750];
  } else if (cityId === 'kolkata') {
    latRange = [22.5000, 22.6200];
    lngRange = [88.3000, 88.4200];
  } else if (cityId === 'delhi') {
    latRange = [28.5300, 28.6800];
    lngRange = [77.1000, 77.3000];
  }

  const latMin = latRange[0];
  const latMax = latRange[1];
  const lat = latMax - (y / 100) * (latMax - latMin);

  const lngMin = lngRange[0];
  const lngMax = lngRange[1];
  const lng = lngMin + (x / 100) * (lngMax - lngMin);

  return { lat, lng };
}

/**
 * Reverse-convert a real-world lat/lng coordinate back to simulated 100x100 grid coords
 */
export function getGridFromLatLng(lat: number, lng: number, cityId: string): { x: number; y: number } {
  let latRange = [28.5300, 28.6800]; // Delhi default
  let lngRange = [77.1000, 77.3000];

  if (cityId === 'mumbai') {
    latRange = [18.9000, 19.1550];
    lngRange = [72.7500, 72.8800];
  } else if (cityId === 'bengaluru') {
    latRange = [12.9100, 13.0300];
    lngRange = [77.5200, 77.6750];
  } else if (cityId === 'kolkata') {
    latRange = [22.5000, 22.6200];
    lngRange = [88.3000, 88.4200];
  } else if (cityId === 'delhi') {
    latRange = [28.5300, 28.6800];
    lngRange = [77.1000, 77.3000];
  }

  const latMin = latRange[0];
  const latMax = latRange[1];
  const lngMin = lngRange[0];
  const lngMax = lngRange[1];

  let y = ((latMax - lat) / (latMax - latMin)) * 100;
  let x = ((lng - lngMin) / (lngMax - lngMin)) * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
}

