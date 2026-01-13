import { TYPES } from './types';
import type { PokemonTemplate, PokemonType } from '../types/game';

/**
 * Kills required to evolve
 */
export const KILLS_TO_EVOLVE = 2;

/**
 * Evolution chain definition
 */
export interface EvolutionChain {
  id: number;
  stages: {
    pokemon: PokemonTemplate;
    killsRequired: number; // 0 for base, 2 for stage 1, 4 for stage 2
  }[];
}

/**
 * All evolution chains with base, middle, and final forms
 */
export const EVOLUTION_CHAINS: EvolutionChain[] = [
  // Charmander line
  {
    id: 0,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 4,
          name: 'Charmander',
          types: [TYPES.FIRE] as PokemonType[],
          hp: 55,
          atk: 18,
          def: 8,
          mov: 4,
          rng: 1,
          moveName: 'Ember',
          moveType: TYPES.FIRE as PokemonType,
          evolutionChainId: 0,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 5,
          name: 'Charmeleon',
          types: [TYPES.FIRE] as PokemonType[],
          hp: 75,
          atk: 26,
          def: 12,
          mov: 4,
          rng: 1,
          moveName: 'Fire Fang',
          moveType: TYPES.FIRE as PokemonType,
          evolutionChainId: 0,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 6,
          name: 'Charizard',
          types: [TYPES.FIRE, TYPES.FLYING] as PokemonType[],
          hp: 100,
          atk: 35,
          def: 12,
          mov: 5,
          rng: 1,
          moveName: 'Flamethrower',
          moveType: TYPES.FIRE as PokemonType,
          evolutionChainId: 0,
          evolutionStage: 2
        }
      }
    ]
  },
  // Squirtle line
  {
    id: 1,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 7,
          name: 'Squirtle',
          types: [TYPES.WATER] as PokemonType[],
          hp: 60,
          atk: 15,
          def: 12,
          mov: 3,
          rng: 1,
          moveName: 'Water Gun',
          moveType: TYPES.WATER as PokemonType,
          evolutionChainId: 1,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 8,
          name: 'Wartortle',
          types: [TYPES.WATER] as PokemonType[],
          hp: 80,
          atk: 21,
          def: 16,
          mov: 3,
          rng: 1,
          moveName: 'Water Pulse',
          moveType: TYPES.WATER as PokemonType,
          evolutionChainId: 1,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 9,
          name: 'Blastoise',
          types: [TYPES.WATER] as PokemonType[],
          hp: 120,
          atk: 28,
          def: 22,
          mov: 3,
          rng: 2,
          moveName: 'Hydro Pump',
          moveType: TYPES.WATER as PokemonType,
          evolutionChainId: 1,
          evolutionStage: 2
        }
      }
    ]
  },
  // Bulbasaur line
  {
    id: 2,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 1,
          name: 'Bulbasaur',
          types: [TYPES.GRASS, TYPES.POISON] as PokemonType[],
          hp: 65,
          atk: 16,
          def: 10,
          mov: 3,
          rng: 1,
          moveName: 'Vine Whip',
          moveType: TYPES.GRASS as PokemonType,
          evolutionChainId: 2,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 2,
          name: 'Ivysaur',
          types: [TYPES.GRASS, TYPES.POISON] as PokemonType[],
          hp: 85,
          atk: 22,
          def: 13,
          mov: 3,
          rng: 1,
          moveName: 'Razor Leaf',
          moveType: TYPES.GRASS as PokemonType,
          evolutionChainId: 2,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 3,
          name: 'Venusaur',
          types: [TYPES.GRASS, TYPES.POISON] as PokemonType[],
          hp: 130,
          atk: 28,
          def: 18,
          mov: 3,
          rng: 1,
          moveName: 'Solar Beam',
          moveType: TYPES.GRASS as PokemonType,
          evolutionChainId: 2,
          evolutionStage: 2
        }
      }
    ]
  },
  // Pichu line
  {
    id: 3,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 172,
          name: 'Pichu',
          types: [TYPES.ELECTRIC] as PokemonType[],
          hp: 40,
          atk: 22,
          def: 4,
          mov: 5,
          rng: 1,
          moveName: 'Thunder Shock',
          moveType: TYPES.ELECTRIC as PokemonType,
          evolutionChainId: 3,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 25,
          name: 'Pikachu',
          types: [TYPES.ELECTRIC] as PokemonType[],
          hp: 55,
          atk: 32,
          def: 6,
          mov: 5,
          rng: 2,
          moveName: 'Thunderbolt',
          moveType: TYPES.ELECTRIC as PokemonType,
          evolutionChainId: 3,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 26,
          name: 'Raichu',
          types: [TYPES.ELECTRIC] as PokemonType[],
          hp: 70,
          atk: 42,
          def: 8,
          mov: 5,
          rng: 2,
          moveName: 'Thunder',
          moveType: TYPES.ELECTRIC as PokemonType,
          evolutionChainId: 3,
          evolutionStage: 2
        }
      }
    ]
  },
  // Machop line
  {
    id: 4,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 66,
          name: 'Machop',
          types: [TYPES.FIGHTING] as PokemonType[],
          hp: 70,
          atk: 25,
          def: 10,
          mov: 3,
          rng: 1,
          moveName: 'Karate Chop',
          moveType: TYPES.FIGHTING as PokemonType,
          evolutionChainId: 4,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 67,
          name: 'Machoke',
          types: [TYPES.FIGHTING] as PokemonType[],
          hp: 90,
          atk: 35,
          def: 14,
          mov: 3,
          rng: 1,
          moveName: 'Cross Chop',
          moveType: TYPES.FIGHTING as PokemonType,
          evolutionChainId: 4,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 68,
          name: 'Machamp',
          types: [TYPES.FIGHTING] as PokemonType[],
          hp: 110,
          atk: 48,
          def: 18,
          mov: 3,
          rng: 1,
          moveName: 'Dynamic Punch',
          moveType: TYPES.FIGHTING as PokemonType,
          evolutionChainId: 4,
          evolutionStage: 2
        }
      }
    ]
  },
  // Gastly line
  {
    id: 5,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 92,
          name: 'Gastly',
          types: [TYPES.GHOST, TYPES.POISON] as PokemonType[],
          hp: 45,
          atk: 28,
          def: 4,
          mov: 5,
          rng: 1,
          moveName: 'Lick',
          moveType: TYPES.GHOST as PokemonType,
          evolutionChainId: 5,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 93,
          name: 'Haunter',
          types: [TYPES.GHOST, TYPES.POISON] as PokemonType[],
          hp: 55,
          atk: 38,
          def: 6,
          mov: 5,
          rng: 1,
          moveName: 'Shadow Punch',
          moveType: TYPES.GHOST as PokemonType,
          evolutionChainId: 5,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 94,
          name: 'Gengar',
          types: [TYPES.GHOST, TYPES.POISON] as PokemonType[],
          hp: 70,
          atk: 50,
          def: 8,
          mov: 5,
          rng: 1,
          moveName: 'Shadow Ball',
          moveType: TYPES.GHOST as PokemonType,
          evolutionChainId: 5,
          evolutionStage: 2
        }
      }
    ]
  },
  // Dratini line
  {
    id: 6,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 147,
          name: 'Dratini',
          types: [TYPES.DRAGON] as PokemonType[],
          hp: 55,
          atk: 20,
          def: 8,
          mov: 4,
          rng: 1,
          moveName: 'Dragon Rage',
          moveType: TYPES.DRAGON as PokemonType,
          evolutionChainId: 6,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 148,
          name: 'Dragonair',
          types: [TYPES.DRAGON] as PokemonType[],
          hp: 75,
          atk: 30,
          def: 12,
          mov: 4,
          rng: 1,
          moveName: 'Dragon Breath',
          moveType: TYPES.DRAGON as PokemonType,
          evolutionChainId: 6,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 149,
          name: 'Dragonite',
          types: [TYPES.DRAGON, TYPES.FLYING] as PokemonType[],
          hp: 120,
          atk: 44,
          def: 16,
          mov: 5,
          rng: 1,
          moveName: 'Dragon Claw',
          moveType: TYPES.DRAGON as PokemonType,
          evolutionChainId: 6,
          evolutionStage: 2
        }
      }
    ]
  },
  // Geodude line
  {
    id: 7,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 74,
          name: 'Geodude',
          types: [TYPES.ROCK, TYPES.GROUND] as PokemonType[],
          hp: 55,
          atk: 22,
          def: 22,
          mov: 2,
          rng: 1,
          moveName: 'Rock Throw',
          moveType: TYPES.ROCK as PokemonType,
          evolutionChainId: 7,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 75,
          name: 'Graveler',
          types: [TYPES.ROCK, TYPES.GROUND] as PokemonType[],
          hp: 75,
          atk: 28,
          def: 30,
          mov: 2,
          rng: 1,
          moveName: 'Rock Blast',
          moveType: TYPES.ROCK as PokemonType,
          evolutionChainId: 7,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 76,
          name: 'Golem',
          types: [TYPES.ROCK, TYPES.GROUND] as PokemonType[],
          hp: 100,
          atk: 34,
          def: 38,
          mov: 2,
          rng: 1,
          moveName: 'Rock Slide',
          moveType: TYPES.ROCK as PokemonType,
          evolutionChainId: 7,
          evolutionStage: 2
        }
      }
    ]
  },
  // Abra line
  {
    id: 8,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 63,
          name: 'Abra',
          types: [TYPES.PSYCHIC] as PokemonType[],
          hp: 35,
          atk: 30,
          def: 4,
          mov: 5,
          rng: 2,
          moveName: 'Confusion',
          moveType: TYPES.PSYCHIC as PokemonType,
          evolutionChainId: 8,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 64,
          name: 'Kadabra',
          types: [TYPES.PSYCHIC] as PokemonType[],
          hp: 50,
          atk: 42,
          def: 6,
          mov: 5,
          rng: 2,
          moveName: 'Psybeam',
          moveType: TYPES.PSYCHIC as PokemonType,
          evolutionChainId: 8,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 65,
          name: 'Alakazam',
          types: [TYPES.PSYCHIC] as PokemonType[],
          hp: 65,
          atk: 55,
          def: 8,
          mov: 5,
          rng: 2,
          moveName: 'Psychic',
          moveType: TYPES.PSYCHIC as PokemonType,
          evolutionChainId: 8,
          evolutionStage: 2
        }
      }
    ]
  },
  // Riolu line (2 stages)
  {
    id: 9,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 447,
          name: 'Riolu',
          types: [TYPES.FIGHTING] as PokemonType[],
          hp: 55,
          atk: 24,
          def: 8,
          mov: 5,
          rng: 1,
          moveName: 'Force Palm',
          moveType: TYPES.FIGHTING as PokemonType,
          evolutionChainId: 9,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 448,
          name: 'Lucario',
          types: [TYPES.FIGHTING, TYPES.STEEL] as PokemonType[],
          hp: 80,
          atk: 40,
          def: 12,
          mov: 5,
          rng: 1,
          moveName: 'Aura Sphere',
          moveType: TYPES.FIGHTING as PokemonType,
          evolutionChainId: 9,
          evolutionStage: 1
        }
      }
    ]
  },
  // Magikarp line (2 stages)
  {
    id: 10,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 129,
          name: 'Magikarp',
          types: [TYPES.WATER] as PokemonType[],
          hp: 40,
          atk: 8,
          def: 10,
          mov: 3,
          rng: 1,
          moveName: 'Splash',
          moveType: TYPES.WATER as PokemonType,
          evolutionChainId: 10,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 130,
          name: 'Gyarados',
          types: [TYPES.WATER, TYPES.FLYING] as PokemonType[],
          hp: 110,
          atk: 42,
          def: 14,
          mov: 4,
          rng: 1,
          moveName: 'Aqua Tail',
          moveType: TYPES.WATER as PokemonType,
          evolutionChainId: 10,
          evolutionStage: 1
        }
      }
    ]
  },
  // Larvitar line
  {
    id: 11,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 246,
          name: 'Larvitar',
          types: [TYPES.ROCK, TYPES.GROUND] as PokemonType[],
          hp: 65,
          atk: 20,
          def: 14,
          mov: 3,
          rng: 1,
          moveName: 'Bite',
          moveType: TYPES.ROCK as PokemonType,
          evolutionChainId: 11,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 247,
          name: 'Pupitar',
          types: [TYPES.ROCK, TYPES.GROUND] as PokemonType[],
          hp: 85,
          atk: 30,
          def: 18,
          mov: 3,
          rng: 1,
          moveName: 'Rock Slide',
          moveType: TYPES.ROCK as PokemonType,
          evolutionChainId: 11,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 248,
          name: 'Tyranitar',
          types: [TYPES.ROCK, TYPES.DRAGON] as PokemonType[],
          hp: 130,
          atk: 44,
          def: 24,
          mov: 3,
          rng: 1,
          moveName: 'Stone Edge',
          moveType: TYPES.ROCK as PokemonType,
          evolutionChainId: 11,
          evolutionStage: 2
        }
      }
    ]
  }
];

/**
 * Get base Pokémon pool for team selection
 */
export function getBaseFormPokemon(): PokemonTemplate[] {
  return EVOLUTION_CHAINS.map(chain => chain.stages[0].pokemon);
}

/**
 * Get random base form Pokémon (excluding already used)
 */
export function getRandomBasePokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {
  const basePool = getBaseFormPokemon();
  const available = basePool.filter(p => !excludeIds.has(p.id));

  if (available.length === 0) {
    return basePool[Math.floor(Math.random() * basePool.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get the next evolution for a Pokémon
 * Returns null if already at final stage or can't evolve
 */
export function getNextEvolution(currentPokemon: PokemonTemplate, currentKills: number): PokemonTemplate | null {
  if (currentPokemon.evolutionChainId === undefined) {
    return null;
  }

  const chain = EVOLUTION_CHAINS[currentPokemon.evolutionChainId];
  if (!chain) return null;

  const currentStageIndex = chain.stages.findIndex(
    s => s.pokemon.id === currentPokemon.id
  );

  if (currentStageIndex === -1 || currentStageIndex >= chain.stages.length - 1) {
    return null; // Not found or already at final stage
  }

  const nextStage = chain.stages[currentStageIndex + 1];

  if (currentKills >= nextStage.killsRequired) {
    return nextStage.pokemon;
  }

  return null;
}

/**
 * Check if a Pokémon can evolve with given kills
 */
export function canEvolve(pokemon: PokemonTemplate, kills: number): boolean {
  return getNextEvolution(pokemon, kills) !== null;
}
