import type { TerrainType, TerrainProps, PokemonType } from '../types/game';

/**
 * Terrain type constants
 */
export const TERRAIN: Record<string, TerrainType> = {
  GRASS: 0,
  FOREST: 1,
  WATER: 2,
  MOUNTAIN: 3,
  BASE: 4,
  TALL_GRASS: 5,
  POKEMON_CENTER: 6
};

/**
 * Terrain properties configuration
 * - def: Defense bonus percentage
 * - moveCost: Movement cost (99 = impassable for ground units)
 * - name: Display name
 * - bg: Tailwind gradient classes for battle background
 * - capture: Whether this terrain can trigger wild encounters
 * - typeBonus: Pokemon types that get +25% ATK bonus on this terrain
 */
export const TERRAIN_PROPS = {
  [TERRAIN.GRASS]: {
    def: 0,
    moveCost: 1,
    name: 'Llanura',
    bg: 'from-green-800 to-green-950',
    typeBonus: ['normal', 'fighting'] as PokemonType[]
  },
  [TERRAIN.FOREST]: {
    def: 20,
    moveCost: 2,
    name: 'Bosque',
    bg: 'from-emerald-900 to-black',
    typeBonus: ['grass', 'bug', 'poison'] as PokemonType[]
  },
  [TERRAIN.WATER]: {
    def: 0,
    moveCost: 99,
    name: 'Agua',
    bg: 'from-blue-900 to-slate-900',
    typeBonus: ['water', 'ice'] as PokemonType[]
  },
  [TERRAIN.MOUNTAIN]: {
    def: 40,
    moveCost: 3,
    name: 'Montaña',
    bg: 'from-stone-800 to-black',
    typeBonus: ['rock', 'ground', 'steel'] as PokemonType[],
    visionBonus: 2 // Extra vision range when standing on mountain
  },
  [TERRAIN.BASE]: {
    def: 10,
    moveCost: 1,
    name: 'Base',
    bg: 'from-gray-800 to-gray-950'
  },
  [TERRAIN.TALL_GRASS]: {
    def: 5,
    moveCost: 1,
    name: 'Hierba Alta',
    bg: 'from-teal-900 to-black',
    capture: true,
    typeBonus: ['grass', 'bug'] as PokemonType[]
  },
  [TERRAIN.POKEMON_CENTER]: {
    def: 15,
    moveCost: 1,
    name: 'Centro Pokémon',
    bg: 'from-pink-800 to-red-950',
    heals: true,
    typeBonus: [] as PokemonType[]
  }
} as Record<TerrainType, TerrainProps>;

/**
 * Type terrain bonus multiplier (+25% ATK)
 */
export const TERRAIN_TYPE_BONUS = 1.25;

/**
 * Check if a unit gets terrain type bonus
 */
export function hasTerrainTypeBonus(unitTypes: PokemonType[], terrain: TerrainType): boolean {
  const terrainProps = TERRAIN_PROPS[terrain];
  if (!terrainProps.typeBonus) return false;
  return unitTypes.some(type => terrainProps.typeBonus!.includes(type));
}

/**
 * Get Tailwind classes for tile background color
 */
export function getTileColor(terrain: TerrainType): string {
  switch (terrain) {
    case TERRAIN.GRASS:
      return 'bg-emerald-200 border-emerald-300';
    case TERRAIN.FOREST:
      return 'bg-emerald-700 border-emerald-800';
    case TERRAIN.WATER:
      return 'bg-blue-400 border-blue-500';
    case TERRAIN.MOUNTAIN:
      return 'bg-stone-600 border-stone-700';
    case TERRAIN.TALL_GRASS:
      return 'bg-teal-700 border-teal-800 shadow-inner';
    case TERRAIN.POKEMON_CENTER:
      return 'bg-pink-200 border-pink-300';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Get terrain name for display
 */
export function getTerrainName(terrain: TerrainType): string {
  return TERRAIN_PROPS[terrain]?.name || 'Desconocido';
}

/**
 * Get terrain defense bonus
 */
export function getTerrainDefense(terrain: TerrainType): number {
  return TERRAIN_PROPS[terrain]?.def || 0;
}
