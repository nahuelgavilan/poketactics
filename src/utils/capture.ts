import { TERRAIN } from '../constants/terrain';
import { getRandomWildPokemon } from '../constants/pokemon';
import type { Unit, Position, GameMap, CaptureData } from '../types/game';

const CAPTURE_DIRECTIONS: [number, number][] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],  // Cardinal
  [1, 1], [1, -1], [-1, 1], [-1, -1] // Diagonal
];

/**
 * Check if a tile is passable for spawning
 */
function isPassableTerrain(terrain: number): boolean {
  return terrain !== TERRAIN.WATER;
}

/**
 * Find a valid spawn position adjacent to the capturer
 */
export function findSpawnPosition(
  capturer: Unit,
  map: GameMap,
  units: Unit[]
): Position | null {
  for (const [dx, dy] of CAPTURE_DIRECTIONS) {
    const nx = capturer.x + dx;
    const ny = capturer.y + dy;

    // Check bounds
    if (nx < 0 || nx >= map[0].length || ny < 0 || ny >= map.length) continue;

    // Check terrain passability
    if (!isPassableTerrain(map[ny][nx])) continue;

    // Check for existing units
    if (units.some(u => u.x === nx && u.y === ny)) continue;

    return { x: nx, y: ny };
  }

  return null;
}

/**
 * Trigger a wild Pokemon encounter (always succeeds if on tall grass)
 * @returns CaptureData if encounter triggered, null if conditions not met
 */
export function triggerWildEncounter(
  capturer: Unit,
  map: GameMap,
  units: Unit[]
): CaptureData | null {
  // Check if on tall grass
  if (map[capturer.y][capturer.x] !== TERRAIN.TALL_GRASS) {
    return null;
  }

  // Find spawn position
  const spawnPos = findSpawnPosition(capturer, map, units);
  if (!spawnPos) {
    return null;
  }

  // Select random wild Pokemon (from full pool, not base forms)
  const wildMon = getRandomWildPokemon();

  return {
    pokemon: wildMon,
    player: capturer.owner,
    spawnPos
  };
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use triggerWildEncounter instead
 */
export function attemptCapture(
  capturer: Unit,
  map: GameMap,
  units: Unit[]
): CaptureData | null {
  return triggerWildEncounter(capturer, map, units);
}

/**
 * Create a new unit from captured Pokemon
 */
export function createCapturedUnit(captureData: CaptureData): Unit {
  return {
    uid: Math.random().toString(36).substring(7),
    owner: captureData.player,
    template: captureData.pokemon,
    x: captureData.spawnPos.x,
    y: captureData.spawnPos.y,
    currentHp: captureData.pokemon.hp,
    hasMoved: true, // Enters fatigued
    kills: 0,
    pp: captureData.pokemon.moves.map(m => m.pp),
    status: null,
    statusTurns: 0
  };
}
