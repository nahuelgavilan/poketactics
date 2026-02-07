import type { TerrainType, TerrainGameProps, PokemonType } from './types';

export const TERRAIN: Record<string, TerrainType> = {
  GRASS: 0,
  FOREST: 1,
  WATER: 2,
  MOUNTAIN: 3,
  BASE: 4,
  TALL_GRASS: 5,
  POKEMON_CENTER: 6,
  SAND: 7,
  BRIDGE: 8,
  BERRY_BUSH: 9,
  ICE: 10,
  LAVA: 11,
  SWAMP: 12,
  ROAD: 13,
  RUINS: 14,
  CAVE: 15
};

export const TERRAIN_GAME_PROPS: Record<TerrainType, TerrainGameProps> = {
  [TERRAIN.GRASS]: { def: 0, moveCost: 1, typeBonus: ['normal', 'fighting'] },
  [TERRAIN.FOREST]: { def: 20, moveCost: 2, typeBonus: ['grass', 'bug', 'poison'] },
  [TERRAIN.WATER]: { def: 0, moveCost: 99, typeBonus: ['water', 'ice'] },
  [TERRAIN.MOUNTAIN]: { def: 40, moveCost: 3, visionBonus: 2, typeBonus: ['rock', 'ground', 'steel'] },
  [TERRAIN.BASE]: { def: 10, moveCost: 1 },
  [TERRAIN.TALL_GRASS]: { def: 5, moveCost: 1, capture: true, typeBonus: ['grass', 'bug'] },
  [TERRAIN.POKEMON_CENTER]: { def: 15, moveCost: 1, heals: true },
  [TERRAIN.SAND]: { def: 0, moveCost: 1, typeBonus: ['fire', 'ground'] },
  [TERRAIN.BRIDGE]: { def: 0, moveCost: 1 },
  [TERRAIN.BERRY_BUSH]: { def: 5, moveCost: 1, consumable: true, typeBonus: ['grass', 'bug'] },
  [TERRAIN.ICE]: { def: 0, moveCost: 1, typeBonus: ['ice', 'water'] },
  [TERRAIN.LAVA]: { def: 0, moveCost: 99, typeBonus: ['fire', 'dragon'] },
  [TERRAIN.SWAMP]: { def: 10, moveCost: 2, typeBonus: ['poison', 'water'] },
  [TERRAIN.ROAD]: { def: 0, moveCost: 1 },
  [TERRAIN.RUINS]: { def: 25, moveCost: 2, typeBonus: ['ghost', 'psychic', 'dragon'] },
  [TERRAIN.CAVE]: { def: 15, moveCost: 1, typeBonus: ['rock', 'ground', 'dark'], hidesUnit: true }
} as Record<TerrainType, TerrainGameProps>;

export const TERRAIN_TYPE_BONUS = 1.25;

export function hasTerrainTypeBonus(unitTypes: PokemonType[], terrain: TerrainType): boolean {
  const terrainProps = TERRAIN_GAME_PROPS[terrain];
  if (!terrainProps?.typeBonus) return false;
  return unitTypes.some(type => terrainProps.typeBonus!.includes(type));
}

export function getTerrainDefense(terrain: TerrainType): number {
  return TERRAIN_GAME_PROPS[terrain]?.def || 0;
}
