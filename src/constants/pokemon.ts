import { getRandomBasePokemon } from './evolution';
import type { PokemonTemplate } from '../types/game';

// Re-export from shared
export { WILD_POKEMON_POOL, getRandomWildPokemon } from '@poketactics/shared';

/**
 * Get a random base form Pokemon for initial team
 */
export function getRandomPokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {
  return getRandomBasePokemon(excludeIds);
}
