import { TYPE_CHART } from './typeChart';
import { TERRAIN_GAME_PROPS, TERRAIN_TYPE_BONUS, hasTerrainTypeBonus } from './terrain';
import type { PokemonType, TerrainType } from './types';

export const CRIT_CHANCE = 0.10;
export const CRIT_MULTIPLIER = 1.5;
export const DAMAGE_VARIANCE = 0.1;
export const COUNTER_DAMAGE_PENALTY = 0.75;

export function getEffectiveness(moveType: PokemonType, defenderType: PokemonType): number {
  const chart = TYPE_CHART[moveType];
  if (!chart) return 1;
  return chart[defenderType] !== undefined ? chart[defenderType]! : 1;
}

export function getFullEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  let effectiveness = 1;
  for (const defType of defenderTypes) {
    effectiveness *= getEffectiveness(moveType, defType);
  }
  return effectiveness;
}

export function calculateBaseDamage(
  attackerAtk: number,
  attackerTypes: PokemonType[],
  attackerMoveType: PokemonType,
  defenderDef: number,
  defenderTypes: PokemonType[],
  attackerTerrain: TerrainType,
  defenderTerrain: TerrainType,
  isCounter: boolean = false
): { base: number; effectiveness: number; typeTerrainBonus: boolean; terrainBonus: number } {
  const effectiveness = getFullEffectiveness(attackerMoveType, defenderTypes);

  const typeTerrainBonus = hasTerrainTypeBonus(attackerTypes, attackerTerrain);
  const attackMultiplier = typeTerrainBonus ? TERRAIN_TYPE_BONUS : 1;

  const counterPenalty = isCounter ? COUNTER_DAMAGE_PENALTY : 1;

  const terrainDef = TERRAIN_GAME_PROPS[defenderTerrain]?.def || 0;
  const defenseMultiplier = 1 + terrainDef / 100;

  const rawDmg = (attackerAtk * effectiveness * attackMultiplier * counterPenalty) -
                 (defenderDef * defenseMultiplier);

  return {
    base: Math.max(1, rawDmg),
    effectiveness,
    typeTerrainBonus,
    terrainBonus: terrainDef
  };
}
