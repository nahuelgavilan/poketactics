import type { PokemonType } from '../types/game';

// Re-export from shared
export { TYPES, TYPE_CHART } from '@poketactics/shared';

/**
 * Tailwind color classes for each type (client-only)
 */
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: 'bg-stone-400',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400',
  ice: 'bg-cyan-300',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  flying: 'bg-indigo-300',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-stone-600',
  ghost: 'bg-purple-800',
  dragon: 'bg-indigo-600',
  dark: 'bg-neutral-800',
  steel: 'bg-slate-400',
  fairy: 'bg-pink-300'
};
