// Re-export all evolution data from the generated file
export {
  EVOLUTION_CHAINS,
  getBaseFormPokemon,
  getRandomBasePokemon,
  getNextEvolution,
  canEvolve
} from './generatedPokemon';
export type { EvolutionChain } from './generatedPokemon';

export const KILLS_TO_EVOLVE = 2;
