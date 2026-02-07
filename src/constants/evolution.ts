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
          moveName: 'Smack Down',
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
          types: [TYPES.ROCK, TYPES.DARK] as PokemonType[],
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
  },
  // Scyther line (2 stages)
  {
    id: 12,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 123,
          name: 'Scyther',
          types: [TYPES.BUG, TYPES.FLYING] as PokemonType[],
          hp: 65,
          atk: 28,
          def: 12,
          mov: 5,
          rng: 1,
          moveName: 'Fury Cutter',
          moveType: TYPES.BUG as PokemonType,
          evolutionChainId: 12,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 212,
          name: 'Scizor',
          types: [TYPES.BUG, TYPES.STEEL] as PokemonType[],
          hp: 90,
          atk: 42,
          def: 25,
          mov: 4,
          rng: 1,
          moveName: 'Bullet Punch',
          moveType: TYPES.STEEL as PokemonType,
          evolutionChainId: 12,
          evolutionStage: 1
        }
      }
    ]
  },
  // Munchlax line (2 stages)
  {
    id: 13,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 446,
          name: 'Munchlax',
          types: [TYPES.NORMAL] as PokemonType[],
          hp: 90,
          atk: 15,
          def: 8,
          mov: 2,
          rng: 1,
          moveName: 'Tackle',
          moveType: TYPES.NORMAL as PokemonType,
          evolutionChainId: 13,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 143,
          name: 'Snorlax',
          types: [TYPES.NORMAL] as PokemonType[],
          hp: 160,
          atk: 30,
          def: 12,
          mov: 2,
          rng: 1,
          moveName: 'Body Slam',
          moveType: TYPES.NORMAL as PokemonType,
          evolutionChainId: 13,
          evolutionStage: 1
        }
      }
    ]
  },
  // Beldum line
  {
    id: 14,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 374,
          name: 'Beldum',
          types: [TYPES.STEEL, TYPES.PSYCHIC] as PokemonType[],
          hp: 55,
          atk: 18,
          def: 18,
          mov: 2,
          rng: 1,
          moveName: 'Take Down',
          moveType: TYPES.STEEL as PokemonType,
          evolutionChainId: 14,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 375,
          name: 'Metang',
          types: [TYPES.STEEL, TYPES.PSYCHIC] as PokemonType[],
          hp: 80,
          atk: 28,
          def: 26,
          mov: 3,
          rng: 1,
          moveName: 'Metal Claw',
          moveType: TYPES.STEEL as PokemonType,
          evolutionChainId: 14,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 376,
          name: 'Metagross',
          types: [TYPES.STEEL, TYPES.PSYCHIC] as PokemonType[],
          hp: 110,
          atk: 38,
          def: 30,
          mov: 3,
          rng: 1,
          moveName: 'Meteor Mash',
          moveType: TYPES.STEEL as PokemonType,
          evolutionChainId: 14,
          evolutionStage: 2
        }
      }
    ]
  },
  // Trapinch line
  {
    id: 15,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 328,
          name: 'Trapinch',
          types: [TYPES.GROUND] as PokemonType[],
          hp: 55,
          atk: 22,
          def: 8,
          mov: 3,
          rng: 1,
          moveName: 'Sand Tomb',
          moveType: TYPES.GROUND as PokemonType,
          evolutionChainId: 15,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 329,
          name: 'Vibrava',
          types: [TYPES.GROUND, TYPES.DRAGON] as PokemonType[],
          hp: 70,
          atk: 28,
          def: 10,
          mov: 4,
          rng: 1,
          moveName: 'Dragon Breath',
          moveType: TYPES.DRAGON as PokemonType,
          evolutionChainId: 15,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 330,
          name: 'Flygon',
          types: [TYPES.GROUND, TYPES.DRAGON] as PokemonType[],
          hp: 90,
          atk: 35,
          def: 12,
          mov: 4,
          rng: 2,
          moveName: 'Earth Power',
          moveType: TYPES.GROUND as PokemonType,
          evolutionChainId: 15,
          evolutionStage: 2
        }
      }
    ]
  },
  // Chimchar line
  {
    id: 16,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 390,
          name: 'Chimchar',
          types: [TYPES.FIRE] as PokemonType[],
          hp: 50,
          atk: 20,
          def: 6,
          mov: 5,
          rng: 1,
          moveName: 'Ember',
          moveType: TYPES.FIRE as PokemonType,
          evolutionChainId: 16,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 391,
          name: 'Monferno',
          types: [TYPES.FIRE, TYPES.FIGHTING] as PokemonType[],
          hp: 65,
          atk: 30,
          def: 7,
          mov: 5,
          rng: 1,
          moveName: 'Mach Punch',
          moveType: TYPES.FIGHTING as PokemonType,
          evolutionChainId: 16,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 392,
          name: 'Infernape',
          types: [TYPES.FIRE, TYPES.FIGHTING] as PokemonType[],
          hp: 75,
          atk: 38,
          def: 8,
          mov: 5,
          rng: 1,
          moveName: 'Flare Blitz',
          moveType: TYPES.FIRE as PokemonType,
          evolutionChainId: 16,
          evolutionStage: 2
        }
      }
    ]
  },
  // Sneasel line (2 stages) — Dark/Ice
  {
    id: 17,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 215,
          name: 'Sneasel',
          types: [TYPES.DARK, TYPES.ICE] as PokemonType[],
          hp: 55,
          atk: 30,
          def: 6,
          mov: 5,
          rng: 1,
          moveName: 'Feint Attack',
          moveType: TYPES.DARK as PokemonType,
          evolutionChainId: 17,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 461,
          name: 'Weavile',
          types: [TYPES.DARK, TYPES.ICE] as PokemonType[],
          hp: 75,
          atk: 44,
          def: 8,
          mov: 5,
          rng: 1,
          moveName: 'Night Slash',
          moveType: TYPES.DARK as PokemonType,
          evolutionChainId: 17,
          evolutionStage: 1
        }
      }
    ]
  },
  // Swinub line — Ice/Ground
  {
    id: 18,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 220,
          name: 'Swinub',
          types: [TYPES.ICE, TYPES.GROUND] as PokemonType[],
          hp: 60,
          atk: 16,
          def: 12,
          mov: 3,
          rng: 1,
          moveName: 'Powder Snow',
          moveType: TYPES.ICE as PokemonType,
          evolutionChainId: 18,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 221,
          name: 'Piloswine',
          types: [TYPES.ICE, TYPES.GROUND] as PokemonType[],
          hp: 90,
          atk: 26,
          def: 18,
          mov: 3,
          rng: 1,
          moveName: 'Ice Fang',
          moveType: TYPES.ICE as PokemonType,
          evolutionChainId: 18,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 473,
          name: 'Mamoswine',
          types: [TYPES.ICE, TYPES.GROUND] as PokemonType[],
          hp: 120,
          atk: 38,
          def: 22,
          mov: 3,
          rng: 1,
          moveName: 'Earthquake',
          moveType: TYPES.GROUND as PokemonType,
          evolutionChainId: 18,
          evolutionStage: 2
        }
      }
    ]
  },
  // Ralts line — Psychic/Fairy
  {
    id: 19,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 280,
          name: 'Ralts',
          types: [TYPES.PSYCHIC, TYPES.FAIRY] as PokemonType[],
          hp: 35,
          atk: 18,
          def: 6,
          mov: 4,
          rng: 2,
          moveName: 'Confusion',
          moveType: TYPES.PSYCHIC as PokemonType,
          evolutionChainId: 19,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 281,
          name: 'Kirlia',
          types: [TYPES.PSYCHIC, TYPES.FAIRY] as PokemonType[],
          hp: 50,
          atk: 28,
          def: 8,
          mov: 4,
          rng: 2,
          moveName: 'Psybeam',
          moveType: TYPES.PSYCHIC as PokemonType,
          evolutionChainId: 19,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 282,
          name: 'Gardevoir',
          types: [TYPES.PSYCHIC, TYPES.FAIRY] as PokemonType[],
          hp: 75,
          atk: 42,
          def: 10,
          mov: 4,
          rng: 2,
          moveName: 'Moonblast',
          moveType: TYPES.FAIRY as PokemonType,
          evolutionChainId: 19,
          evolutionStage: 2
        }
      }
    ]
  },
  // Cleffa line — Fairy
  {
    id: 20,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 173,
          name: 'Cleffa',
          types: [TYPES.FAIRY] as PokemonType[],
          hp: 50,
          atk: 12,
          def: 10,
          mov: 3,
          rng: 1,
          moveName: 'Pound',
          moveType: TYPES.NORMAL as PokemonType,
          evolutionChainId: 20,
          evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 35,
          name: 'Clefairy',
          types: [TYPES.FAIRY] as PokemonType[],
          hp: 75,
          atk: 20,
          def: 16,
          mov: 3,
          rng: 1,
          moveName: 'Disarming Voice',
          moveType: TYPES.FAIRY as PokemonType,
          evolutionChainId: 20,
          evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 36,
          name: 'Clefable',
          types: [TYPES.FAIRY] as PokemonType[],
          hp: 100,
          atk: 30,
          def: 22,
          mov: 3,
          rng: 1,
          moveName: 'Dazzling Gleam',
          moveType: TYPES.FAIRY as PokemonType,
          evolutionChainId: 20,
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
