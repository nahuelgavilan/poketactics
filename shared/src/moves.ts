import type { Move, PokemonTemplate } from './types';

// ── Move Utilities ────────────────────────────────────────────────────

export function getUsableMoves(template: PokemonTemplate, pp: number[]): Move[] {
  return template.moves.filter((_, i) => pp[i] > 0);
}

export function getAttackMoves(template: PokemonTemplate, pp: number[]): Move[] {
  return template.moves.filter((m, i) => m.category !== 'status' && pp[i] > 0);
}

export function getMovesInRange(template: PokemonTemplate, pp: number[], distance: number): Move[] {
  return template.moves.filter((m, i) => pp[i] > 0 && m.range >= distance && m.category !== 'status');
}

export function hasMovesInRange(template: PokemonTemplate, pp: number[], distance: number): boolean {
  return getMovesInRange(template, pp, distance).length > 0;
}

export function getMaxAttackRange(template: PokemonTemplate, pp?: number[]): number {
  const attackMoves = template.moves.filter((m, i) => {
    if (m.category === 'status') return false;
    if (pp && pp[i] <= 0) return false;
    return true;
  });
  if (attackMoves.length === 0) return 1;
  return Math.max(...attackMoves.map(m => m.range));
}

export function initPP(template: PokemonTemplate): number[] {
  return template.moves.map(m => m.pp);
}

export function isContactMove(move: Move): boolean {
  return move.category === 'physical' && move.range <= 1;
}

// ── Struggle (fallback when all PP depleted) ──────────────────────────

export const STRUGGLE_MOVE: Move = {
  id: 'struggle',
  name: 'Struggle',
  type: 'normal',
  category: 'physical',
  power: 50,
  accuracy: 100,
  pp: 99,
  range: 1,
  priority: 0,
  description: 'Used when all other moves are out of PP.'
};
