import { TERRAIN } from '../constants/terrain';
import type { GameMap, TerrainType } from '../types/game';

export interface MapSize {
  label: string;
  width: number;
  height: number;
}

export const MAP_SIZES: MapSize[] = [
  { label: 'Pequeño', width: 8, height: 8 },
  { label: 'Mediano', width: 10, height: 12 },
  { label: 'Grande', width: 14, height: 16 },
];

export const DEFAULT_MAP_SIZE = MAP_SIZES[1]; // Medium

/**
 * Generate a random map with terrain, bridges, berry bushes, and Pokemon Centers.
 * Scales features based on map area.
 */
export function generateRandomMap(width: number, height: number): GameMap {
  const newMap: GameMap = Array(height).fill(0).map(() =>
    Array(width).fill(TERRAIN.GRASS as TerrainType)
  );

  // Random terrain
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = Math.random();
      if (r > 0.93) newMap[y][x] = TERRAIN.MOUNTAIN as TerrainType;
      else if (r > 0.88) newMap[y][x] = TERRAIN.WATER as TerrainType;
      else if (r > 0.85) newMap[y][x] = TERRAIN.LAVA as TerrainType;
      else if (r > 0.82) newMap[y][x] = TERRAIN.CAVE as TerrainType;
      else if (r > 0.79) newMap[y][x] = TERRAIN.SAND as TerrainType;
      else if (r > 0.76) newMap[y][x] = TERRAIN.ICE as TerrainType;
      else if (r > 0.73) newMap[y][x] = TERRAIN.SWAMP as TerrainType;
      else if (r > 0.70) newMap[y][x] = TERRAIN.RUINS as TerrainType;
      else if (r > 0.67) newMap[y][x] = TERRAIN.ROAD as TerrainType;
      else if (r > 0.57) newMap[y][x] = TERRAIN.FOREST as TerrainType;
      else if (r > 0.37) newMap[y][x] = TERRAIN.TALL_GRASS as TerrainType;
    }
  }

  // Ensure bases are passable
  newMap[0][0] = TERRAIN.BASE as TerrainType;
  newMap[0][1] = TERRAIN.GRASS as TerrainType;
  newMap[1][0] = TERRAIN.GRASS as TerrainType;
  newMap[height - 1][width - 1] = TERRAIN.BASE as TerrainType;
  newMap[height - 1][width - 2] = TERRAIN.GRASS as TerrainType;
  newMap[height - 2][width - 1] = TERRAIN.GRASS as TerrainType;

  // Add bridges over water tiles (vertical and horizontal crossings)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (newMap[y][x] === TERRAIN.WATER && Math.random() < 0.3) {
        const above = y > 0 ? newMap[y - 1][x] : TERRAIN.WATER;
        const below = y < height - 1 ? newMap[y + 1][x] : TERRAIN.WATER;
        const left = x > 0 ? newMap[y][x - 1] : TERRAIN.WATER;
        const right = x < width - 1 ? newMap[y][x + 1] : TERRAIN.WATER;

        // Vertical crossing: land above and below
        const verticalCrossing = above !== TERRAIN.WATER && below !== TERRAIN.WATER;
        // Horizontal crossing: land left and right
        const horizontalCrossing = left !== TERRAIN.WATER && right !== TERRAIN.WATER;

        if (verticalCrossing || horizontalCrossing) {
          newMap[y][x] = TERRAIN.BRIDGE as TerrainType;
        }
      }
    }
  }

  // Scale berry bushes with area
  const area = width * height;
  const berryCount = Math.max(2, Math.floor(area / 30)) + Math.floor(Math.random() * 2);
  for (let i = 0; i < berryCount; i++) {
    let attempts = 0;
    while (attempts < 20) {
      const bx = 1 + Math.floor(Math.random() * (width - 2));
      const by = 2 + Math.floor(Math.random() * (height - 4));
      if (newMap[by][bx] === TERRAIN.GRASS || newMap[by][bx] === TERRAIN.TALL_GRASS) {
        newMap[by][bx] = TERRAIN.BERRY_BUSH as TerrainType;
        break;
      }
      attempts++;
    }
  }

  // Scale Pokemon Centers with area
  const centerCount = Math.max(1, Math.floor(area / 50)) + Math.floor(Math.random() * 2);
  const minDist = Math.max(2, Math.floor(Math.min(width, height) / 4));
  const placedCenters: { x: number; y: number }[] = [];

  for (let i = 0; i < centerCount; i++) {
    let attempts = 0;
    while (attempts < 20) {
      const cx = 1 + Math.floor(Math.random() * (width - 2));
      const cy = 2 + Math.floor(Math.random() * (height - 4));

      const tooClose = placedCenters.some(
        c => Math.abs(c.x - cx) < minDist && Math.abs(c.y - cy) < minDist
      );

      if (!tooClose) {
        newMap[cy][cx] = TERRAIN.POKEMON_CENTER as TerrainType;
        placedCenters.push({ x: cx, y: cy });
        break;
      }
      attempts++;
    }
  }

  return newMap;
}

/**
 * Bridge orientation type.
 * Determined at render time by checking which neighbors are non-water (land or bridge).
 */
export type BridgeDir = 'v' | 'h' | 'corner-tr' | 'corner-tl' | 'corner-br' | 'corner-bl' | 'cross';

/**
 * Get bridge orientation based on neighboring tiles.
 * Returns the visual direction the bridge should render.
 */
export function getBridgeOrientation(map: GameMap, x: number, y: number): BridgeDir {
  const height = map.length;
  const width = map[0]?.length ?? 0;

  const isConnected = (nx: number, ny: number): boolean => {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return false;
    const t = map[ny][nx];
    return t !== TERRAIN.WATER;
  };

  const up = isConnected(x, y - 1);
  const down = isConnected(x, y + 1);
  const left = isConnected(x - 1, y);
  const right = isConnected(x + 1, y);

  // Count connections
  const connections = [up, down, left, right].filter(Boolean);

  if (connections.length >= 3) return 'cross';

  // Two connections — determine if straight or corner
  if (up && down) return 'v';
  if (left && right) return 'h';

  // Corners
  if (up && right) return 'corner-tr';
  if (up && left) return 'corner-tl';
  if (down && right) return 'corner-br';
  if (down && left) return 'corner-bl';

  // Single connection — align to that direction
  if (up || down) return 'v';
  if (left || right) return 'h';

  // Isolated bridge — default vertical
  return 'v';
}
