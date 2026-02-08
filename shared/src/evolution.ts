// Re-export all evolution data from the generated file
export {
  EVOLUTION_CHAINS,
  getBaseFormPokemon,
  getRandomBasePokemon,
  getNextEvolution,
  canEvolve
} from './generatedPokemon';
export type { EvolutionChain } from './generatedPokemon';
import type { PokemonTemplate } from './types';
import { getBaseFormPokemon } from './generatedPokemon';

export const KILLS_TO_EVOLVE = 2;

function getBaseStatTotal(pokemon: PokemonTemplate): number {
  return pokemon.hp + pokemon.atk + pokemon.def + pokemon.spa + pokemon.spd + pokemon.spe;
}

function combinations<T>(items: T[], choose: number): T[][] {
  const result: T[][] = [];
  const n = items.length;
  const recurse = (start: number, combo: T[]) => {
    if (combo.length === choose) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < n; i++) {
      combo.push(items[i]);
      recurse(i + 1, combo);
      combo.pop();
    }
  };
  recurse(0, []);
  return result;
}

/**
 * Generate two balanced teams from random base forms.
 * Balancing minimizes total BST difference between both teams.
 */
export function getBalancedRandomBaseTeams(teamSize: number = 3): { p1Team: PokemonTemplate[]; p2Team: PokemonTemplate[] } {
  const basePool = getBaseFormPokemon();
  const required = teamSize * 2;
  if (basePool.length < required) {
    const fallback = [...basePool].sort(() => Math.random() - 0.5);
    return {
      p1Team: fallback.slice(0, teamSize),
      p2Team: fallback.slice(teamSize, required)
    };
  }

  const shuffled = [...basePool].sort(() => Math.random() - 0.5);
  const candidates = shuffled.slice(0, required);
  const allP1Combos = combinations(candidates, teamSize);

  let bestDiff = Number.POSITIVE_INFINITY;
  let bestP1 = allP1Combos[0] ?? candidates.slice(0, teamSize);
  let bestP2 = candidates.filter(p => !bestP1.includes(p));

  for (const p1 of allP1Combos) {
    const p2 = candidates.filter(p => !p1.includes(p));
    const p1Total = p1.reduce((sum, mon) => sum + getBaseStatTotal(mon), 0);
    const p2Total = p2.reduce((sum, mon) => sum + getBaseStatTotal(mon), 0);
    const diff = Math.abs(p1Total - p2Total);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestP1 = p1;
      bestP2 = p2;
    }
  }

  // Randomize which balanced side starts as P1 to avoid deterministic bias.
  if (Math.random() < 0.5) {
    return { p1Team: bestP1.map(p => ({ ...p })), p2Team: bestP2.map(p => ({ ...p })) };
  }
  return { p1Team: bestP2.map(p => ({ ...p })), p2Team: bestP1.map(p => ({ ...p })) };
}
