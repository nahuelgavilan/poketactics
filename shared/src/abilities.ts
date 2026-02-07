import type { PokemonType, PokemonTemplate, Move, Ability, StatusEffect } from './types';

// ── Ability Hook Results ──────────────────────────────────────────────

export interface AbilityDamageModifier {
  multiplier: number;
  reason: string;
}

export interface AbilityDefenseModifier {
  multiplier: number;
  reason: string;
}

export interface AbilityOnHitResult {
  statusApplied?: StatusEffect;
  reason?: string;
}

// ── Before Attack (modify outgoing damage) ────────────────────────────

export function getAbilityAttackModifier(
  ability: Ability,
  move: Move,
  attackerTypes: PokemonType[],
  currentHp: number,
  maxHp: number,
  attackerStatus: StatusEffect | null
): AbilityDamageModifier {
  const hpRatio = currentHp / maxHp;

  switch (ability.id) {
    case 'blaze':
      if (move.type === 'fire' && hpRatio < 0.33) {
        return { multiplier: 1.5, reason: 'Blaze activado' };
      }
      break;
    case 'torrent':
      if (move.type === 'water' && hpRatio < 0.33) {
        return { multiplier: 1.5, reason: 'Torrent activado' };
      }
      break;
    case 'overgrow':
      if (move.type === 'grass' && hpRatio < 0.33) {
        return { multiplier: 1.5, reason: 'Overgrow activado' };
      }
      break;
    case 'guts':
      if (attackerStatus && move.category === 'physical') {
        return { multiplier: 1.5, reason: 'Guts activado' };
      }
      break;
    case 'ironfist':
      if (isPunchMove(move)) {
        return { multiplier: 1.2, reason: 'Iron Fist activado' };
      }
      break;
    case 'technician':
      if (move.power > 0 && move.power <= 60) {
        return { multiplier: 1.5, reason: 'Technician activado' };
      }
      break;
    case 'flashfire':
      // Flash Fire immunity + boost is handled in defense modifier
      // Here we just check if the pokemon HAS been hit by fire (state tracked externally)
      break;
    case 'adaptability':
      if (attackerTypes.includes(move.type)) {
        // STAB becomes 2x instead of 1.5x → net multiplier of 2/1.5
        return { multiplier: 2 / 1.5, reason: 'Adaptability activado' };
      }
      break;
    case 'moxie':
      // Moxie boost is tracked externally as stat modification
      break;
  }

  return { multiplier: 1, reason: '' };
}

// ── Before Taking Damage (modify incoming damage) ─────────────────────

export function getAbilityDefenseModifier(
  ability: Ability,
  incomingMove: Move,
  defenderStatus: StatusEffect | null,
  defenderCurrentHp: number,
  defenderMaxHp: number
): AbilityDefenseModifier {
  switch (ability.id) {
    case 'thickfat':
      if (incomingMove.type === 'fire' || incomingMove.type === 'ice') {
        return { multiplier: 0.5, reason: 'Thick Fat activado' };
      }
      break;
    case 'flashfire':
      if (incomingMove.type === 'fire') {
        return { multiplier: 0, reason: 'Flash Fire: inmune a Fuego' };
      }
      break;
    case 'levitate':
      if (incomingMove.type === 'ground') {
        return { multiplier: 0, reason: 'Levitate: inmune a Tierra' };
      }
      break;
    case 'marvelscale':
      if (defenderStatus) {
        return { multiplier: 0.67, reason: 'Marvel Scale activado' };
      }
      break;
    case 'sturdy':
      if (defenderCurrentHp === defenderMaxHp) {
        // Sturdy is special: it doesn't reduce damage normally, it caps at HP-1
        // Handled in the damage application step, not here
      }
      break;
    case 'multiscale':
      if (defenderCurrentHp === defenderMaxHp) {
        return { multiplier: 0.5, reason: 'Multiscale activado' };
      }
      break;
  }

  return { multiplier: 1, reason: '' };
}

// ── On Contact Hit (defender's ability triggers) ──────────────────────

export function getAbilityOnContactHit(
  defenderAbility: Ability,
  incomingMove: Move
): AbilityOnHitResult {
  // Only trigger on contact (physical) moves
  if (incomingMove.category !== 'physical') return {};

  switch (defenderAbility.id) {
    case 'static':
      if (Math.random() < 0.30) {
        return { statusApplied: 'paralysis', reason: 'Static activado' };
      }
      break;
    case 'poisonpoint':
      if (Math.random() < 0.30) {
        return { statusApplied: 'poison', reason: 'Poison Point activado' };
      }
      break;
    case 'roughskin':
      // Rough Skin deals chip damage — handled externally
      break;
  }

  return {};
}

// ── Sturdy Check ──────────────────────────────────────────────────────

export function applySturdy(
  ability: Ability,
  currentHp: number,
  maxHp: number,
  incomingDamage: number
): number {
  if (ability.id === 'sturdy' && currentHp === maxHp && incomingDamage >= currentHp) {
    return currentHp - 1; // Survive with 1 HP
  }
  return incomingDamage;
}

// ── Utility ───────────────────────────────────────────────────────────

const PUNCH_MOVES = new Set([
  'machpunch', 'thunderpunch', 'firepunch', 'icepunch', 'drainpunch',
  'bulletpunch', 'focuspunch', 'megapunch', 'cometpunch', 'dynamicpunch',
  'shadowpunch', 'skyuppercut', 'hammerarm', 'poweruppunch', 'meteormash'
]);

function isPunchMove(move: Move): boolean {
  return PUNCH_MOVES.has(move.id);
}
