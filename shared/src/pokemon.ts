import type { PokemonTemplate } from './types';
import { EVOLUTION_CHAINS } from './generatedPokemon';

// Wild Pokemon pool: fully-evolved or strong mid-stage Pokemon from our chains
export const WILD_POKEMON_POOL: PokemonTemplate[] = [
  EVOLUTION_CHAINS[0].stages[2].pokemon,  // Charizard
  EVOLUTION_CHAINS[1].stages[2].pokemon,  // Blastoise
  EVOLUTION_CHAINS[2].stages[2].pokemon,  // Venusaur
  EVOLUTION_CHAINS[3].stages[1].pokemon,  // Pikachu
  EVOLUTION_CHAINS[10].stages[1].pokemon, // Gyarados
  EVOLUTION_CHAINS[5].stages[2].pokemon,  // Gengar
  EVOLUTION_CHAINS[9].stages[1].pokemon,  // Lucario
  EVOLUTION_CHAINS[12].stages[1].pokemon, // Scizor
  EVOLUTION_CHAINS[17].stages[1].pokemon, // Weavile
  EVOLUTION_CHAINS[19].stages[2].pokemon, // Gardevoir
];

export function getRandomWildPokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {
  const available = WILD_POKEMON_POOL.filter(p => !excludeIds.has(p.id));
  if (available.length === 0) {
    return WILD_POKEMON_POOL[Math.floor(Math.random() * WILD_POKEMON_POOL.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
