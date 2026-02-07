import { TYPE_CHART } from './typeChart';
import { TERRAIN_GAME_PROPS, TERRAIN_TYPE_BONUS, hasTerrainTypeBonus } from './terrain';
import type { PokemonType, PokemonTemplate, TerrainType, Move, StatusEffect } from './types';

// ── Constants ─────────────────────────────────────────────────────────

export const LEVEL_FACTOR = 22;
export const CRIT_CHANCE = 0.10;
export const CRIT_MULTIPLIER = 1.5;
export const STAB_MULTIPLIER = 1.5;
export const COUNTER_DAMAGE_PENALTY = 0.75;
export const VARIANCE_MIN = 0.85;
export const VARIANCE_MAX = 1.00;

// ── Effectiveness ─────────────────────────────────────────────────────

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

// ── STAB ──────────────────────────────────────────────────────────────

export function isStab(moveType: PokemonType, attackerTypes: PokemonType[]): boolean {
  return attackerTypes.includes(moveType);
}

// ── New Division-Based Damage Formula ─────────────────────────────────

export interface DamageCalcInput {
  move: Move;
  attackerTemplate: PokemonTemplate;
  attackerTypes: PokemonType[];
  defenderTemplate: PokemonTemplate;
  defenderTypes: PokemonType[];
  attackerTerrain: TerrainType;
  defenderTerrain: TerrainType;
  isCounter?: boolean;
  attackerStatus?: StatusEffect | null;
}

export interface DamageCalcResult {
  base: number;
  effectiveness: number;
  isStab: boolean;
  typeTerrainBonus: boolean;
  terrainBonus: number;
}

export function calculateBaseDamage(input: DamageCalcInput): DamageCalcResult {
  const { move, attackerTemplate, attackerTypes, defenderTemplate, defenderTypes,
    attackerTerrain, defenderTerrain, isCounter = false, attackerStatus } = input;

  // Status moves do 0 damage
  if (move.category === 'status') {
    return { base: 0, effectiveness: 1, isStab: false, typeTerrainBonus: false, terrainBonus: 0 };
  }

  // Physical/Special split: pick the right stat
  let A = move.category === 'physical' ? attackerTemplate.atk : attackerTemplate.spa;
  const D = move.category === 'physical' ? defenderTemplate.def : defenderTemplate.spd;

  // Burn halves physical ATK
  if (attackerStatus === 'burn' && move.category === 'physical') {
    A = Math.floor(A * 0.5);
  }

  // Effectiveness
  const effectiveness = getFullEffectiveness(move.type, defenderTypes);

  // STAB
  const stab = isStab(move.type, attackerTypes);
  const stabMul = stab ? STAB_MULTIPLIER : 1;

  // Terrain bonuses
  const typeTerrainBonus = hasTerrainTypeBonus(attackerTypes, attackerTerrain);
  const attackMultiplier = typeTerrainBonus ? TERRAIN_TYPE_BONUS : 1;

  const terrainDef = TERRAIN_GAME_PROPS[defenderTerrain]?.def || 0;
  const defenseMultiplier = 1 + terrainDef / 100;

  // Counter penalty
  const counterPenalty = isCounter ? COUNTER_DAMAGE_PENALTY : 1;

  // Core formula: floor(floor(22 * power * A / D / 50 + 2) * modifiers)
  const innerDamage = Math.floor(LEVEL_FACTOR * move.power * A / (D * defenseMultiplier) / 50 + 2);
  const rawDmg = innerDamage * stabMul * effectiveness * attackMultiplier * counterPenalty;

  return {
    base: Math.max(1, rawDmg),
    effectiveness,
    isStab: stab,
    typeTerrainBonus,
    terrainBonus: terrainDef
  };
}

// ── Accuracy Check ────────────────────────────────────────────────────

export function checkAccuracy(move: Move): boolean {
  if (move.accuracy >= 100) return true;
  return Math.random() * 100 < move.accuracy;
}

// ── Max attack range across all moves ─────────────────────────────────

export function getMaxRange(template: PokemonTemplate): number {
  if (!template.moves || template.moves.length === 0) return 1;
  return Math.max(...template.moves.filter(m => m.category !== 'status' || m.range > 0).map(m => m.range), 1);
}

// ── Get first counter move that can reach the attacker ────────────────

export function getCounterMove(defender: PokemonTemplate, distance: number, pp?: number[]): { move: Move; moveIndex: number } | null {
  for (let i = 0; i < defender.moves.length; i++) {
    const move = defender.moves[i];
    if (move.category === 'status') continue;
    if (move.range < distance) continue;
    if (pp && pp[i] <= 0) continue;
    return { move, moveIndex: i };
  }
  return null;
}
