import {
  calculateBaseDamage as sharedCalculateBaseDamage,
  checkAccuracy,
  getCounterMove,
  getFullEffectiveness as sharedGetFullEffectiveness,
  getEffectiveness as sharedGetEffectiveness,
  isStab as sharedIsStab,
  CRIT_CHANCE as SHARED_CRIT_CHANCE,
  CRIT_MULTIPLIER as SHARED_CRIT_MULTIPLIER,
  VARIANCE_MIN as SHARED_VARIANCE_MIN,
  VARIANCE_MAX as SHARED_VARIANCE_MAX,
  COUNTER_DAMAGE_PENALTY as SHARED_COUNTER_DAMAGE_PENALTY,
  getAbilityAttackModifier,
  getAbilityDefenseModifier,
  getAbilityOnContactHit,
  applySturdy,
} from '@poketactics/shared';
import { hasTerrainTypeBonus } from '../constants/terrain';
import type {
  PokemonType,
  Unit,
  GameMap,
  BattleData,
  CombatResult,
  AttackPreview,
  TerrainType,
  Move,
  StatusEffect,
} from '../types/game';

// Re-export constants
export const CRIT_CHANCE = SHARED_CRIT_CHANCE;
export const CRIT_MULTIPLIER = SHARED_CRIT_MULTIPLIER;
export const VARIANCE_MIN = SHARED_VARIANCE_MIN;
export const VARIANCE_MAX = SHARED_VARIANCE_MAX;
export const COUNTER_DAMAGE_PENALTY = SHARED_COUNTER_DAMAGE_PENALTY;
export const getEffectiveness = sharedGetEffectiveness;
export const getFullEffectiveness = sharedGetFullEffectiveness;

/**
 * Calculate Manhattan distance between two positions
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Calculate damage with the new division formula + variance + crit
 */
export function calculateDamage(
  attacker: Unit,
  defender: Unit,
  map: GameMap,
  move: Move,
  isCounter: boolean = false,
  forceCrit?: boolean,
  forceMiss?: boolean
): CombatResult {
  // Accuracy check
  const missed = forceMiss !== undefined ? forceMiss : !checkAccuracy(move);
  if (missed) {
    return {
      damage: 0,
      effectiveness: getFullEffectiveness(move.type, defender.template.types),
      isCritical: false,
      isStab: sharedIsStab(move.type, attacker.template.types),
      missed: true,
      terrainBonus: 0,
      typeTerrainBonus: false,
    };
  }

  const attackerTerrain = map[attacker.y][attacker.x];
  const defenderTerrain = map[defender.y][defender.x];

  const { base, effectiveness, isStab: stab, typeTerrainBonus, terrainBonus } = sharedCalculateBaseDamage({
    move,
    attackerTemplate: attacker.template,
    attackerTypes: attacker.template.types,
    defenderTemplate: defender.template,
    defenderTypes: defender.template.types,
    attackerTerrain,
    defenderTerrain,
    isCounter,
    attackerStatus: attacker.status,
  });

  // Ability modifiers
  const abilityAtk = getAbilityAttackModifier(
    attacker.template.ability, move, attacker.template.types,
    attacker.currentHp, attacker.template.hp, attacker.status
  );
  const abilityDef = getAbilityDefenseModifier(
    defender.template.ability, move, defender.status,
    defender.currentHp, defender.template.hp
  );

  // Immunity from ability
  if (abilityDef.multiplier === 0) {
    return {
      damage: 0,
      effectiveness: 0,
      isCritical: false,
      isStab: stab,
      missed: false,
      terrainBonus,
      typeTerrainBonus,
    };
  }

  // Critical hit check
  const isCritical = forceCrit !== undefined ? forceCrit : Math.random() < CRIT_CHANCE;
  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;

  // Damage variance (0.85 to 1.00)
  const variance = VARIANCE_MIN + Math.random() * (VARIANCE_MAX - VARIANCE_MIN);

  let damage = Math.max(1, Math.floor(base * critMultiplier * variance * abilityAtk.multiplier * abilityDef.multiplier));

  // Sturdy check
  damage = applySturdy(defender.template.ability, defender.currentHp, defender.template.hp, damage);

  // Check for status effect from move
  let statusApplied: StatusEffect | undefined;
  if (move.effect && move.effectChance) {
    if (Math.random() * 100 < move.effectChance && !defender.status) {
      statusApplied = move.effect;
    }
  }

  // Check for contact ability trigger
  if (move.category === 'physical' && move.range <= 1 && !statusApplied) {
    const contactResult = getAbilityOnContactHit(defender.template.ability, move);
    if (contactResult.statusApplied && !attacker.status) {
      // Contact abilities apply to the ATTACKER, not defender
      // We'll track this separately; for now include it in the result
    }
  }

  return {
    damage,
    effectiveness,
    isCritical,
    isStab: stab,
    missed: false,
    terrainBonus,
    typeTerrainBonus,
    statusApplied,
  };
}

/**
 * Calculate damage range for preview (min/max without variance)
 */
export function calculateDamageRange(
  attacker: Unit,
  defender: Unit,
  map: GameMap,
  move: Move,
  isCounter: boolean = false
): { min: number; max: number; effectiveness: number; isStab: boolean; typeTerrainBonus: boolean } {
  const attackerTerrain = map[attacker.y][attacker.x];
  const defenderTerrain = map[defender.y][defender.x];

  const { base, effectiveness, isStab: stab, typeTerrainBonus } = sharedCalculateBaseDamage({
    move,
    attackerTemplate: attacker.template,
    attackerTypes: attacker.template.types,
    defenderTemplate: defender.template,
    defenderTypes: defender.template.types,
    attackerTerrain,
    defenderTerrain,
    isCounter,
    attackerStatus: attacker.status,
  });

  // Ability modifiers for preview
  const abilityAtk = getAbilityAttackModifier(
    attacker.template.ability, move, attacker.template.types,
    attacker.currentHp, attacker.template.hp, attacker.status
  );
  const abilityDef = getAbilityDefenseModifier(
    defender.template.ability, move, defender.status,
    defender.currentHp, defender.template.hp
  );

  if (abilityDef.multiplier === 0) {
    return { min: 0, max: 0, effectiveness: 0, isStab: stab, typeTerrainBonus };
  }

  const adjustedBase = base * abilityAtk.multiplier * abilityDef.multiplier;

  const minDamage = Math.max(1, Math.floor(adjustedBase * VARIANCE_MIN));
  const maxDamage = Math.max(1, Math.floor(adjustedBase * CRIT_MULTIPLIER * VARIANCE_MAX));

  return { min: minDamage, max: maxDamage, effectiveness, isStab: stab, typeTerrainBonus };
}

/**
 * Check if defender can counter-attack with any move
 */
export function canCounter(attacker: Unit, defender: Unit, defenderHpAfterAttack: number): boolean {
  if (defenderHpAfterAttack <= 0) return false;
  const distance = getDistance(attacker, defender);
  const counterMove = getCounterMove(defender.template, distance, defender.pp);
  return counterMove !== null;
}

/**
 * Create attack preview for UI (for a specific move)
 */
export function createAttackPreview(
  attacker: Unit,
  defender: Unit,
  map: GameMap,
  move: Move
): AttackPreview {
  const attackerTerrain = map[attacker.y][attacker.x] as TerrainType;
  const defenderTerrain = map[defender.y][defender.x] as TerrainType;

  const attackResult = calculateDamageRange(attacker, defender, map, move, false);

  // Check counter
  const defenderSurvivesMin = defender.currentHp - attackResult.min > 0;
  const distance = getDistance(attacker, defender);
  const counterMoveResult = getCounterMove(defender.template, distance, defender.pp);
  const defenderCanCounter = defenderSurvivesMin && counterMoveResult !== null;

  let counterResult: { min: number; max: number; effectiveness: number } | null = null;
  if (defenderCanCounter && counterMoveResult) {
    counterResult = calculateDamageRange(defender, attacker, map, counterMoveResult.move, true);
  }

  return {
    attacker,
    defender,
    move,
    predictedDamage: { min: attackResult.min, max: attackResult.max },
    effectiveness: attackResult.effectiveness,
    isStab: attackResult.isStab,
    accuracy: move.accuracy,
    canCounter: defenderCanCounter,
    counterDamage: counterResult ? { min: counterResult.min, max: counterResult.max } : null,
    counterEffectiveness: counterResult?.effectiveness || null,
    counterMove: counterMoveResult?.move || null,
    attackerTerrainBonus: hasTerrainTypeBonus(attacker.template.types, attackerTerrain),
    defenderTerrainBonus: hasTerrainTypeBonus(defender.template.types, defenderTerrain),
    critChance: CRIT_CHANCE * 100,
  };
}

/**
 * Create full battle data for cinematic
 */
export function createBattleData(
  attacker: Unit,
  defender: Unit,
  map: GameMap,
  move: Move
): BattleData {
  const attackerResult = calculateDamage(attacker, defender, map, move, false);

  // Check counter
  const defenderHpAfterAttack = defender.currentHp - attackerResult.damage;
  const distance = getDistance(attacker, defender);

  // Priority moves prevent counter
  const preventsCounter = move.priority > 0;
  const counterMoveResult = preventsCounter ? null : getCounterMove(defender.template, distance, defender.pp);
  const defenderCanCounter = defenderHpAfterAttack > 0 && counterMoveResult !== null;

  let defenderResult: CombatResult | null = null;
  let defenderMove: Move | null = null;
  if (defenderCanCounter && counterMoveResult) {
    defenderMove = counterMoveResult.move;
    defenderResult = calculateDamage(defender, attacker, map, defenderMove, true);
  }

  return {
    attacker,
    defender,
    attackerMove: move,
    attackerResult,
    defenderResult,
    defenderMove,
    terrainType: map[defender.y][defender.x],
  };
}

/**
 * Get Tailwind impact color class based on move type
 */
export function getImpactColor(moveType: PokemonType): string {
  switch (moveType) {
    case 'fire': return 'bg-orange-500 mix-blend-overlay';
    case 'water': return 'bg-blue-500 mix-blend-overlay';
    case 'electric': return 'bg-yellow-400 mix-blend-overlay';
    case 'grass': return 'bg-green-500 mix-blend-overlay';
    case 'ice': return 'bg-cyan-300 mix-blend-overlay';
    case 'psychic': return 'bg-pink-500 mix-blend-overlay';
    case 'fighting': return 'bg-red-600 mix-blend-overlay';
    case 'ghost': return 'bg-purple-600 mix-blend-overlay';
    case 'dragon': return 'bg-indigo-500 mix-blend-overlay';
    case 'steel': return 'bg-slate-400 mix-blend-overlay';
    case 'fairy': return 'bg-pink-300 mix-blend-overlay';
    case 'dark': return 'bg-gray-800 mix-blend-overlay';
    case 'rock': return 'bg-yellow-700 mix-blend-overlay';
    case 'ground': return 'bg-amber-700 mix-blend-overlay';
    case 'poison': return 'bg-purple-500 mix-blend-overlay';
    case 'bug': return 'bg-lime-500 mix-blend-overlay';
    case 'flying': return 'bg-sky-400 mix-blend-overlay';
    case 'normal': return 'bg-gray-400 mix-blend-overlay';
    default: return 'bg-white';
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
