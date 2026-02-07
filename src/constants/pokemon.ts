import { TYPES } from './types';
import { getRandomBasePokemon } from './evolution';
import type { PokemonTemplate } from '../types/game';

// Re-export from shared
export { WILD_POKEMON_POOL, getRandomWildPokemon } from '@poketactics/shared';

/**
 * Available Pokemon pool for the game (final evolutions, used by legacy code)
 */
export const POKEMON_POOL: PokemonTemplate[] = [
  {
    id: 6, name: 'Charizard', types: [TYPES.FIRE, TYPES.FLYING],
    hp: 100, atk: 35, def: 10, mov: 4, rng: 1,
    moveName: 'Flamethrower', moveType: TYPES.FIRE
  },
  {
    id: 9, name: 'Blastoise', types: [TYPES.WATER],
    hp: 120, atk: 28, def: 20, mov: 3, rng: 2,
    moveName: 'Hydro Pump', moveType: TYPES.WATER
  },
  {
    id: 3, name: 'Venusaur', types: [TYPES.GRASS, TYPES.POISON],
    hp: 130, atk: 25, def: 15, mov: 3, rng: 1,
    moveName: 'Solar Beam', moveType: TYPES.GRASS
  },
  {
    id: 25, name: 'Pikachu', types: [TYPES.ELECTRIC],
    hp: 60, atk: 40, def: 5, mov: 5, rng: 2,
    moveName: 'Thunderbolt', moveType: TYPES.ELECTRIC
  },
  {
    id: 68, name: 'Machamp', types: [TYPES.FIGHTING],
    hp: 110, atk: 45, def: 15, mov: 3, rng: 1,
    moveName: 'Dynamic Punch', moveType: TYPES.FIGHTING
  },
  {
    id: 94, name: 'Gengar', types: [TYPES.GHOST, TYPES.POISON],
    hp: 70, atk: 45, def: 5, mov: 5, rng: 1,
    moveName: 'Shadow Ball', moveType: TYPES.GHOST
  },
  {
    id: 149, name: 'Dragonite', types: [TYPES.DRAGON, TYPES.FLYING],
    hp: 120, atk: 40, def: 15, mov: 5, rng: 1,
    moveName: 'Dragon Claw', moveType: TYPES.DRAGON
  },
  {
    id: 130, name: 'Gyarados', types: [TYPES.WATER, TYPES.FLYING],
    hp: 110, atk: 38, def: 12, mov: 4, rng: 1,
    moveName: 'Aqua Tail', moveType: TYPES.WATER
  },
  {
    id: 76, name: 'Golem', types: [TYPES.ROCK, TYPES.GROUND],
    hp: 100, atk: 30, def: 35, mov: 2, rng: 1,
    moveName: 'Rock Slide', moveType: TYPES.ROCK
  },
  {
    id: 65, name: 'Alakazam', types: [TYPES.PSYCHIC],
    hp: 60, atk: 50, def: 5, mov: 4, rng: 2,
    moveName: 'Psychic', moveType: TYPES.PSYCHIC
  },
  {
    id: 143, name: 'Snorlax', types: [TYPES.NORMAL],
    hp: 160, atk: 30, def: 10, mov: 2, rng: 1,
    moveName: 'Body Slam', moveType: TYPES.NORMAL
  },
  {
    id: 212, name: 'Scizor', types: [TYPES.BUG, TYPES.STEEL],
    hp: 90, atk: 42, def: 25, mov: 4, rng: 1,
    moveName: 'Bullet Punch', moveType: TYPES.STEEL
  },
  {
    id: 248, name: 'Tyranitar', types: [TYPES.ROCK, TYPES.DARK],
    hp: 130, atk: 40, def: 20, mov: 3, rng: 1,
    moveName: 'Stone Edge', moveType: TYPES.ROCK
  },
  {
    id: 376, name: 'Metagross', types: [TYPES.STEEL, TYPES.PSYCHIC],
    hp: 110, atk: 38, def: 30, mov: 3, rng: 1,
    moveName: 'Meteor Mash', moveType: TYPES.STEEL
  },
  {
    id: 448, name: 'Lucario', types: [TYPES.FIGHTING, TYPES.STEEL],
    hp: 80, atk: 38, def: 10, mov: 5, rng: 1,
    moveName: 'Aura Sphere', moveType: TYPES.FIGHTING
  },
  {
    id: 475, name: 'Gallade', types: [TYPES.PSYCHIC, TYPES.FIGHTING],
    hp: 80, atk: 40, def: 10, mov: 4, rng: 1,
    moveName: 'Psycho Cut', moveType: TYPES.PSYCHIC
  },
  {
    id: 392, name: 'Infernape', types: [TYPES.FIRE, TYPES.FIGHTING],
    hp: 75, atk: 38, def: 8, mov: 5, rng: 1,
    moveName: 'Flare Blitz', moveType: TYPES.FIRE
  },
  {
    id: 330, name: 'Flygon', types: [TYPES.GROUND, TYPES.DRAGON],
    hp: 90, atk: 35, def: 12, mov: 4, rng: 2,
    moveName: 'Earth Power', moveType: TYPES.GROUND
  },
  {
    id: 461, name: 'Weavile', types: [TYPES.DARK, TYPES.ICE],
    hp: 75, atk: 44, def: 8, mov: 5, rng: 1,
    moveName: 'Night Slash', moveType: TYPES.DARK
  },
  {
    id: 473, name: 'Mamoswine', types: [TYPES.ICE, TYPES.GROUND],
    hp: 120, atk: 38, def: 22, mov: 3, rng: 1,
    moveName: 'Earthquake', moveType: TYPES.GROUND
  },
  {
    id: 282, name: 'Gardevoir', types: [TYPES.PSYCHIC, TYPES.FAIRY],
    hp: 75, atk: 42, def: 10, mov: 4, rng: 2,
    moveName: 'Moonblast', moveType: TYPES.FAIRY
  },
  {
    id: 36, name: 'Clefable', types: [TYPES.FAIRY],
    hp: 100, atk: 30, def: 22, mov: 3, rng: 1,
    moveName: 'Dazzling Gleam', moveType: TYPES.FAIRY
  }
];

/**
 * Get a random base form Pokemon for initial team
 */
export function getRandomPokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {
  return getRandomBasePokemon(excludeIds);
}
