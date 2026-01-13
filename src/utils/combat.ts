import { TYPE_CHART } from '../constants/types';
import { TERRAIN_PROPS, TERRAIN_TYPE_BONUS, hasTerrainTypeBonus } from '../constants/terrain';
import type {
  PokemonType,
  Unit,
  GameMap,
  BattleData,
  CombatResult,
  AttackPreview,
  TerrainType
} from '../types/game';

/**
 * Calculate Manhattan distance between two positions
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Combat constants
 */
export const CRIT_CHANCE = 0.10; // 10% critical hit chance
export const CRIT_MULTIPLIER = 1.5; // 50% extra damage on crit
export const DAMAGE_VARIANCE = 0.1; // +/- 10% damage variance
export const COUNTER_DAMAGE_PENALTY = 0.75; // Counter-attacks deal 75% damage

/**
 * Calculate type effectiveness multiplier
 * @returns 2 (super effective), 1 (normal), 0.5 (not very effective), 0 (immune)
 */
export function getEffectiveness(moveType: PokemonType, defenderType: PokemonType): number {
  const chart = TYPE_CHART[moveType];
  if (!chart) return 1;
  return chart[defenderType] !== undefined ? chart[defenderType]! : 1;
}

/**
 * Calculate full effectiveness against a Pokemon with multiple types
 */
export function getFullEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  let effectiveness = 1;
  for (const defType of defenderTypes) {
    effectiveness *= getEffectiveness(moveType, defType);
  }
  return effectiveness;
}

/**
 * Calculate base damage without variance
 */
function calculateBaseDamage(
  attacker: Unit,
  defender: Unit,
  attackerTerrain: TerrainType,
  defenderTerrain: TerrainType,
  isCounter: boolean = false
): { base: number; effectiveness: number; typeTerrainBonus: boolean; terrainBonus: number } {
  const effectiveness = getFullEffectiveness(
    attacker.template.moveType,
    defender.template.types
  );

  // Check terrain type bonus for attacker
  const typeTerrainBonus = hasTerrainTypeBonus(attacker.template.types, attackerTerrain);
  const attackMultiplier = typeTerrainBonus ? TERRAIN_TYPE_BONUS : 1;

  // Counter-attack penalty
  const counterPenalty = isCounter ? COUNTER_DAMAGE_PENALTY : 1;

  // Terrain defense bonus for defender
  const terrainDef = TERRAIN_PROPS[defenderTerrain]?.def || 0;
  const defenseMultiplier = 1 + terrainDef / 100;

  const rawDmg = (attacker.template.atk * effectiveness * attackMultiplier * counterPenalty) -
                 (defender.template.def * defenseMultiplier);

  return {
    base: Math.max(1, rawDmg),
    effectiveness,
    typeTerrainBonus,
    terrainBonus: terrainDef
  };
}

/**
 * Calculate damage with variance and critical
 */
export function calculateDamage(
  attacker: Unit,
  defender: Unit,
  map: GameMap,
  isCounter: boolean = false,
  forceCrit?: boolean
): CombatResult {
  const attackerTerrain = map[attacker.y][attacker.x];
  const defenderTerrain = map[defender.y][defender.x];

  const { base, effectiveness, typeTerrainBonus, terrainBonus } = calculateBaseDamage(
    attacker,
    defender,
    attackerTerrain,
    defenderTerrain,
    isCounter
  );

  // Critical hit check
  const isCritical = forceCrit !== undefined ? forceCrit : Math.random() < CRIT_CHANCE;
  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;

  // Damage variance (0.9 to 1.1)
  const variance = 1 - DAMAGE_VARIANCE + Math.random() * DAMAGE_VARIANCE * 2;

  const damage = Math.max(1, Math.floor(base * critMultiplier * variance));

  return {
    damage,
    effectiveness,
    isCritical,
    terrainBonus,
    typeTerrainBonus
  };
}

/**
 * Calculate damage range for preview (min/max without variance)
 */
export function calculateDamageRange(
  attacker: Unit,
  defender: Unit,
  map: GameMap,
  isCounter: boolean = false
): { min: number; max: number; effectiveness: number; typeTerrainBonus: boolean } {
  const attackerTerrain = map[attacker.y][attacker.x];
  const defenderTerrain = map[defender.y][defender.x];

  const { base, effectiveness, typeTerrainBonus } = calculateBaseDamage(
    attacker,
    defender,
    attackerTerrain,
    defenderTerrain,
    isCounter
  );

  // Min damage (no crit, low variance)
  const minDamage = Math.max(1, Math.floor(base * (1 - DAMAGE_VARIANCE)));

  // Max damage (with crit, high variance)
  const maxDamage = Math.max(1, Math.floor(base * CRIT_MULTIPLIER * (1 + DAMAGE_VARIANCE)));

  return {
    min: minDamage,
    max: maxDamage,
    effectiveness,
    typeTerrainBonus
  };
}

/**
 * Check if defender can counter-attack
 */
export function canCounter(attacker: Unit, defender: Unit, defenderHpAfterAttack: number): boolean {
  // Defender must survive
  if (defenderHpAfterAttack <= 0) return false;

  // Check if attacker is in defender's range
  const distance = getDistance(attacker, defender);
  return distance <= defender.template.rng;
}

/**
 * Create attack preview for UI
 */
export function createAttackPreview(
  attacker: Unit,
  defender: Unit,
  map: GameMap
): AttackPreview {
  const attackerTerrain = map[attacker.y][attacker.x];
  const defenderTerrain = map[defender.y][defender.x];

  // Calculate attacker's damage range
  const attackResult = calculateDamageRange(attacker, defender, map, false);

  // Check if defender survives minimum damage to potentially counter
  const defenderSurvivesMin = defender.currentHp - attackResult.min > 0;
  const defenderInRange = getDistance(attacker, defender) <= defender.template.rng;
  const defenderCanCounter = defenderSurvivesMin && defenderInRange;

  // Calculate counter damage if possible
  let counterResult: { min: number; max: number; effectiveness: number; typeTerrainBonus: boolean } | null = null;
  if (defenderCanCounter) {
    counterResult = calculateDamageRange(defender, attacker, map, true);
  }

  return {
    attacker,
    defender,
    predictedDamage: { min: attackResult.min, max: attackResult.max },
    effectiveness: attackResult.effectiveness,
    canCounter: defenderCanCounter,
    counterDamage: counterResult ? { min: counterResult.min, max: counterResult.max } : null,
    counterEffectiveness: counterResult?.effectiveness || null,
    attackerTerrainBonus: hasTerrainTypeBonus(attacker.template.types, attackerTerrain),
    defenderTerrainBonus: hasTerrainTypeBonus(defender.template.types, defenderTerrain),
    critChance: CRIT_CHANCE * 100
  };
}

/**
 * Create full battle data for cinematic
 */
export function createBattleData(
  attacker: Unit,
  defender: Unit,
  map: GameMap
): BattleData {
  // Calculate attacker's damage
  const attackerResult = calculateDamage(attacker, defender, map, false);

  // Check if defender can counter
  const defenderHpAfterAttack = defender.currentHp - attackerResult.damage;
  const defenderCanCounter = canCounter(attacker, defender, defenderHpAfterAttack);

  // Calculate counter damage if applicable
  let defenderResult: CombatResult | null = null;
  if (defenderCanCounter) {
    defenderResult = calculateDamage(defender, attacker, map, true);
  }

  return {
    attacker,
    defender,
    attackerResult,
    defenderResult,
    terrainType: map[defender.y][defender.x],
    // Legacy support
    damage: attackerResult.damage,
    effectiveness: attackerResult.effectiveness
  };
}

/**
 * Get Tailwind impact color class based on move type
 */
export function getImpactColor(moveType: PokemonType): string {
  switch (moveType) {
    case 'fire':
      return 'bg-orange-500 mix-blend-overlay';
    case 'water':
      return 'bg-blue-500 mix-blend-overlay';
    case 'electric':
      return 'bg-yellow-400 mix-blend-overlay';
    case 'grass':
      return 'bg-green-500 mix-blend-overlay';
    case 'ice':
      return 'bg-cyan-300 mix-blend-overlay';
    case 'psychic':
      return 'bg-pink-500 mix-blend-overlay';
    case 'fighting':
      return 'bg-red-600 mix-blend-overlay';
    case 'ghost':
      return 'bg-purple-600 mix-blend-overlay';
    case 'dragon':
      return 'bg-indigo-500 mix-blend-overlay';
    case 'steel':
      return 'bg-slate-400 mix-blend-overlay';
    case 'fairy':
      return 'bg-pink-300 mix-blend-overlay';
    default:
      return 'bg-white';
  }
}

/**
 * Get effectiveness message for battle display
 */
export function getEffectivenessText(effectiveness: number): string {
  if (effectiveness >= 2) return '¡SUPER EFICAZ!';
  if (effectiveness > 1 && effectiveness < 2) return '¡Eficaz!';
  if (effectiveness < 1 && effectiveness > 0) return 'No muy eficaz...';
  if (effectiveness === 0) return '¡No afecta!';
  return '';
}
