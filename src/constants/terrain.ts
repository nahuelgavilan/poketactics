import type { TerrainType, TerrainProps, PokemonType } from '../types/game';
import {
  TERRAIN as SHARED_TERRAIN,
  TERRAIN_GAME_PROPS,
  TERRAIN_TYPE_BONUS as SHARED_TERRAIN_TYPE_BONUS,
  hasTerrainTypeBonus as sharedHasTerrainTypeBonus,
  getTerrainDefense as sharedGetTerrainDefense
} from '@poketactics/shared';

// Re-export shared terrain constants
export const TERRAIN = SHARED_TERRAIN;
export const TERRAIN_TYPE_BONUS = SHARED_TERRAIN_TYPE_BONUS;
export const hasTerrainTypeBonus = sharedHasTerrainTypeBonus;
export const getTerrainDefense = sharedGetTerrainDefense;

/**
 * Terrain properties with client-specific fields (name, bg)
 */
export const TERRAIN_PROPS = {
  [TERRAIN.GRASS]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.GRASS as TerrainType],
    name: 'Llanura',
    bg: 'from-green-800 to-green-950',
    typeBonus: ['normal', 'fighting'] as PokemonType[]
  },
  [TERRAIN.FOREST]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.FOREST as TerrainType],
    name: 'Bosque',
    bg: 'from-emerald-900 to-black',
    typeBonus: ['grass', 'bug', 'poison'] as PokemonType[]
  },
  [TERRAIN.WATER]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.WATER as TerrainType],
    name: 'Agua',
    bg: 'from-blue-900 to-slate-900',
    typeBonus: ['water', 'ice'] as PokemonType[]
  },
  [TERRAIN.MOUNTAIN]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.MOUNTAIN as TerrainType],
    name: 'Montaña',
    bg: 'from-stone-800 to-black',
    typeBonus: ['rock', 'ground', 'steel'] as PokemonType[],
    visionBonus: 2
  },
  [TERRAIN.BASE]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.BASE as TerrainType],
    name: 'Base',
    bg: 'from-gray-800 to-gray-950'
  },
  [TERRAIN.TALL_GRASS]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.TALL_GRASS as TerrainType],
    name: 'Hierba Alta',
    bg: 'from-teal-900 to-black',
    capture: true,
    typeBonus: ['grass', 'bug'] as PokemonType[]
  },
  [TERRAIN.POKEMON_CENTER]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.POKEMON_CENTER as TerrainType],
    name: 'Centro Pokémon',
    bg: 'from-pink-800 to-red-950',
    heals: true,
    typeBonus: [] as PokemonType[]
  },
  [TERRAIN.SAND]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.SAND as TerrainType],
    name: 'Arena',
    bg: 'from-yellow-700 to-amber-900',
    typeBonus: ['fire', 'ground'] as PokemonType[]
  },
  [TERRAIN.BRIDGE]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.BRIDGE as TerrainType],
    name: 'Puente',
    bg: 'from-amber-800 to-stone-900',
    typeBonus: [] as PokemonType[]
  },
  [TERRAIN.BERRY_BUSH]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.BERRY_BUSH as TerrainType],
    name: 'Arbusto de Bayas',
    bg: 'from-fuchsia-800 to-green-950',
    consumable: true,
    typeBonus: ['grass', 'bug'] as PokemonType[]
  },
  [TERRAIN.ICE]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.ICE as TerrainType],
    name: 'Hielo',
    bg: 'from-sky-300 to-blue-400',
    typeBonus: ['ice', 'water'] as PokemonType[]
  },
  [TERRAIN.LAVA]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.LAVA as TerrainType],
    name: 'Lava',
    bg: 'from-red-800 to-orange-900',
    typeBonus: ['fire', 'dragon'] as PokemonType[]
  },
  [TERRAIN.SWAMP]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.SWAMP as TerrainType],
    name: 'Pantano',
    bg: 'from-emerald-950 to-lime-950',
    typeBonus: ['poison', 'water'] as PokemonType[]
  },
  [TERRAIN.ROAD]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.ROAD as TerrainType],
    name: 'Camino',
    bg: 'from-stone-600 to-stone-800',
    typeBonus: [] as PokemonType[]
  },
  [TERRAIN.RUINS]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.RUINS as TerrainType],
    name: 'Ruinas',
    bg: 'from-violet-900 to-slate-900',
    typeBonus: ['ghost', 'psychic', 'dragon'] as PokemonType[]
  },
  [TERRAIN.CAVE]: {
    ...TERRAIN_GAME_PROPS[TERRAIN.CAVE as TerrainType],
    name: 'Cueva',
    bg: 'from-stone-800 to-slate-950',
    typeBonus: ['rock', 'ground', 'dark'] as PokemonType[],
    hidesUnit: true
  }
} as Record<TerrainType, TerrainProps>;

/**
 * Get Tailwind classes for tile background color (client-only)
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
    case TERRAIN.SAND:
      return 'bg-yellow-300 border-yellow-400';
    case TERRAIN.BRIDGE:
      return 'bg-amber-400 border-amber-500';
    case TERRAIN.BERRY_BUSH:
      return 'bg-fuchsia-300 border-fuchsia-400';
    case TERRAIN.ICE:
      return 'bg-sky-200 border-sky-300';
    case TERRAIN.LAVA:
      return 'bg-red-600 border-red-700';
    case TERRAIN.SWAMP:
      return 'bg-lime-900 border-lime-950';
    case TERRAIN.ROAD:
      return 'bg-stone-400 border-stone-500';
    case TERRAIN.RUINS:
      return 'bg-violet-400 border-violet-500';
    case TERRAIN.CAVE:
      return 'bg-stone-700 border-stone-800';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Get terrain name for display (client-only)
 */
export function getTerrainName(terrain: TerrainType): string {
  return TERRAIN_PROPS[terrain]?.name || 'Desconocido';
}
