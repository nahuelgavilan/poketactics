import type { PokemonTemplate, PokemonType } from './types';

export const KILLS_TO_EVOLVE = 2;

export interface EvolutionChain {
  id: number;
  stages: {
    pokemon: PokemonTemplate;
    killsRequired: number;
  }[];
}

export const EVOLUTION_CHAINS: EvolutionChain[] = [
  // 0: Charmander line
  {
    id: 0,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 4, name: 'Charmander', types: ['fire'] as PokemonType[], hp: 55, atk: 18, def: 8, mov: 4, rng: 1,
          moveName: 'Ember', moveType: 'fire' as PokemonType, evolutionChainId: 0, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 5, name: 'Charmeleon', types: ['fire'] as PokemonType[], hp: 75, atk: 26, def: 12, mov: 4, rng: 1,
          moveName: 'Fire Fang', moveType: 'fire' as PokemonType, evolutionChainId: 0, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 6, name: 'Charizard', types: ['fire', 'flying'] as PokemonType[], hp: 100, atk: 35, def: 12, mov: 5, rng: 1,
          moveName: 'Flamethrower', moveType: 'fire' as PokemonType, evolutionChainId: 0, evolutionStage: 2
        }
      }
    ]
  },
  // 1: Squirtle line
  {
    id: 1,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 7, name: 'Squirtle', types: ['water'] as PokemonType[], hp: 60, atk: 15, def: 12, mov: 3, rng: 1,
          moveName: 'Water Gun', moveType: 'water' as PokemonType, evolutionChainId: 1, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 8, name: 'Wartortle', types: ['water'] as PokemonType[], hp: 80, atk: 21, def: 16, mov: 3, rng: 1,
          moveName: 'Water Pulse', moveType: 'water' as PokemonType, evolutionChainId: 1, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 9, name: 'Blastoise', types: ['water'] as PokemonType[], hp: 120, atk: 28, def: 22, mov: 3, rng: 2,
          moveName: 'Hydro Pump', moveType: 'water' as PokemonType, evolutionChainId: 1, evolutionStage: 2
        }
      }
    ]
  },
  // 2: Bulbasaur line
  {
    id: 2,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 1, name: 'Bulbasaur', types: ['grass', 'poison'] as PokemonType[], hp: 65, atk: 16, def: 10, mov: 3, rng: 1,
          moveName: 'Vine Whip', moveType: 'grass' as PokemonType, evolutionChainId: 2, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 2, name: 'Ivysaur', types: ['grass', 'poison'] as PokemonType[], hp: 85, atk: 22, def: 13, mov: 3, rng: 1,
          moveName: 'Razor Leaf', moveType: 'grass' as PokemonType, evolutionChainId: 2, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 3, name: 'Venusaur', types: ['grass', 'poison'] as PokemonType[], hp: 130, atk: 28, def: 18, mov: 3, rng: 1,
          moveName: 'Solar Beam', moveType: 'grass' as PokemonType, evolutionChainId: 2, evolutionStage: 2
        }
      }
    ]
  },
  // 3: Pichu line
  {
    id: 3,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 172, name: 'Pichu', types: ['electric'] as PokemonType[], hp: 40, atk: 22, def: 4, mov: 5, rng: 1,
          moveName: 'Thunder Shock', moveType: 'electric' as PokemonType, evolutionChainId: 3, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 25, name: 'Pikachu', types: ['electric'] as PokemonType[], hp: 55, atk: 32, def: 6, mov: 5, rng: 2,
          moveName: 'Thunderbolt', moveType: 'electric' as PokemonType, evolutionChainId: 3, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 26, name: 'Raichu', types: ['electric'] as PokemonType[], hp: 70, atk: 42, def: 8, mov: 5, rng: 2,
          moveName: 'Thunder', moveType: 'electric' as PokemonType, evolutionChainId: 3, evolutionStage: 2
        }
      }
    ]
  },
  // 4: Machop line
  {
    id: 4,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 66, name: 'Machop', types: ['fighting'] as PokemonType[], hp: 70, atk: 25, def: 10, mov: 3, rng: 1,
          moveName: 'Karate Chop', moveType: 'fighting' as PokemonType, evolutionChainId: 4, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 67, name: 'Machoke', types: ['fighting'] as PokemonType[], hp: 90, atk: 35, def: 14, mov: 3, rng: 1,
          moveName: 'Cross Chop', moveType: 'fighting' as PokemonType, evolutionChainId: 4, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 68, name: 'Machamp', types: ['fighting'] as PokemonType[], hp: 110, atk: 48, def: 18, mov: 3, rng: 1,
          moveName: 'Dynamic Punch', moveType: 'fighting' as PokemonType, evolutionChainId: 4, evolutionStage: 2
        }
      }
    ]
  },
  // 5: Gastly line
  {
    id: 5,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 92, name: 'Gastly', types: ['ghost', 'poison'] as PokemonType[], hp: 45, atk: 28, def: 4, mov: 5, rng: 1,
          moveName: 'Lick', moveType: 'ghost' as PokemonType, evolutionChainId: 5, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 93, name: 'Haunter', types: ['ghost', 'poison'] as PokemonType[], hp: 55, atk: 38, def: 6, mov: 5, rng: 1,
          moveName: 'Shadow Punch', moveType: 'ghost' as PokemonType, evolutionChainId: 5, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 94, name: 'Gengar', types: ['ghost', 'poison'] as PokemonType[], hp: 70, atk: 50, def: 8, mov: 5, rng: 1,
          moveName: 'Shadow Ball', moveType: 'ghost' as PokemonType, evolutionChainId: 5, evolutionStage: 2
        }
      }
    ]
  },
  // 6: Dratini line
  {
    id: 6,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 147, name: 'Dratini', types: ['dragon'] as PokemonType[], hp: 55, atk: 20, def: 8, mov: 4, rng: 1,
          moveName: 'Dragon Rage', moveType: 'dragon' as PokemonType, evolutionChainId: 6, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 148, name: 'Dragonair', types: ['dragon'] as PokemonType[], hp: 75, atk: 30, def: 12, mov: 4, rng: 1,
          moveName: 'Dragon Breath', moveType: 'dragon' as PokemonType, evolutionChainId: 6, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 149, name: 'Dragonite', types: ['dragon', 'flying'] as PokemonType[], hp: 120, atk: 44, def: 16, mov: 5, rng: 1,
          moveName: 'Dragon Claw', moveType: 'dragon' as PokemonType, evolutionChainId: 6, evolutionStage: 2
        }
      }
    ]
  },
  // 7: Geodude line
  {
    id: 7,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 74, name: 'Geodude', types: ['rock', 'ground'] as PokemonType[], hp: 55, atk: 22, def: 22, mov: 2, rng: 1,
          moveName: 'Rock Throw', moveType: 'rock' as PokemonType, evolutionChainId: 7, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 75, name: 'Graveler', types: ['rock', 'ground'] as PokemonType[], hp: 75, atk: 28, def: 30, mov: 2, rng: 1,
          moveName: 'Rock Blast', moveType: 'rock' as PokemonType, evolutionChainId: 7, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 76, name: 'Golem', types: ['rock', 'ground'] as PokemonType[], hp: 100, atk: 34, def: 38, mov: 2, rng: 1,
          moveName: 'Rock Slide', moveType: 'rock' as PokemonType, evolutionChainId: 7, evolutionStage: 2
        }
      }
    ]
  },
  // 8: Abra line
  {
    id: 8,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 63, name: 'Abra', types: ['psychic'] as PokemonType[], hp: 35, atk: 30, def: 4, mov: 5, rng: 2,
          moveName: 'Confusion', moveType: 'psychic' as PokemonType, evolutionChainId: 8, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 64, name: 'Kadabra', types: ['psychic'] as PokemonType[], hp: 50, atk: 42, def: 6, mov: 5, rng: 2,
          moveName: 'Psybeam', moveType: 'psychic' as PokemonType, evolutionChainId: 8, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 65, name: 'Alakazam', types: ['psychic'] as PokemonType[], hp: 65, atk: 55, def: 8, mov: 5, rng: 2,
          moveName: 'Psychic', moveType: 'psychic' as PokemonType, evolutionChainId: 8, evolutionStage: 2
        }
      }
    ]
  },
  // 9: Riolu line (2 stages)
  {
    id: 9,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 447, name: 'Riolu', types: ['fighting'] as PokemonType[], hp: 55, atk: 24, def: 8, mov: 5, rng: 1,
          moveName: 'Force Palm', moveType: 'fighting' as PokemonType, evolutionChainId: 9, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 448, name: 'Lucario', types: ['fighting', 'steel'] as PokemonType[], hp: 80, atk: 40, def: 12, mov: 5, rng: 1,
          moveName: 'Aura Sphere', moveType: 'fighting' as PokemonType, evolutionChainId: 9, evolutionStage: 1
        }
      }
    ]
  },
  // 10: Magikarp line (2 stages)
  {
    id: 10,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 129, name: 'Magikarp', types: ['water'] as PokemonType[], hp: 40, atk: 8, def: 10, mov: 3, rng: 1,
          moveName: 'Splash', moveType: 'water' as PokemonType, evolutionChainId: 10, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 130, name: 'Gyarados', types: ['water', 'flying'] as PokemonType[], hp: 110, atk: 42, def: 14, mov: 4, rng: 1,
          moveName: 'Aqua Tail', moveType: 'water' as PokemonType, evolutionChainId: 10, evolutionStage: 1
        }
      }
    ]
  },
  // 11: Larvitar line
  {
    id: 11,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 246, name: 'Larvitar', types: ['rock', 'ground'] as PokemonType[], hp: 65, atk: 20, def: 14, mov: 3, rng: 1,
          moveName: 'Smack Down', moveType: 'rock' as PokemonType, evolutionChainId: 11, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 247, name: 'Pupitar', types: ['rock', 'ground'] as PokemonType[], hp: 85, atk: 30, def: 18, mov: 3, rng: 1,
          moveName: 'Rock Slide', moveType: 'rock' as PokemonType, evolutionChainId: 11, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 248, name: 'Tyranitar', types: ['rock', 'dark'] as PokemonType[], hp: 130, atk: 44, def: 24, mov: 3, rng: 1,
          moveName: 'Stone Edge', moveType: 'rock' as PokemonType, evolutionChainId: 11, evolutionStage: 2
        }
      }
    ]
  },
  // 12: Scyther line (2 stages)
  {
    id: 12,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 123, name: 'Scyther', types: ['bug', 'flying'] as PokemonType[], hp: 65, atk: 28, def: 12, mov: 5, rng: 1,
          moveName: 'Fury Cutter', moveType: 'bug' as PokemonType, evolutionChainId: 12, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 212, name: 'Scizor', types: ['bug', 'steel'] as PokemonType[], hp: 90, atk: 42, def: 25, mov: 4, rng: 1,
          moveName: 'Bullet Punch', moveType: 'steel' as PokemonType, evolutionChainId: 12, evolutionStage: 1
        }
      }
    ]
  },
  // 13: Munchlax line (2 stages)
  {
    id: 13,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 446, name: 'Munchlax', types: ['normal'] as PokemonType[], hp: 90, atk: 15, def: 8, mov: 2, rng: 1,
          moveName: 'Tackle', moveType: 'normal' as PokemonType, evolutionChainId: 13, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 143, name: 'Snorlax', types: ['normal'] as PokemonType[], hp: 160, atk: 30, def: 12, mov: 2, rng: 1,
          moveName: 'Body Slam', moveType: 'normal' as PokemonType, evolutionChainId: 13, evolutionStage: 1
        }
      }
    ]
  },
  // 14: Beldum line
  {
    id: 14,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 374, name: 'Beldum', types: ['steel', 'psychic'] as PokemonType[], hp: 55, atk: 18, def: 18, mov: 2, rng: 1,
          moveName: 'Take Down', moveType: 'steel' as PokemonType, evolutionChainId: 14, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 375, name: 'Metang', types: ['steel', 'psychic'] as PokemonType[], hp: 80, atk: 28, def: 26, mov: 3, rng: 1,
          moveName: 'Metal Claw', moveType: 'steel' as PokemonType, evolutionChainId: 14, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 376, name: 'Metagross', types: ['steel', 'psychic'] as PokemonType[], hp: 110, atk: 38, def: 30, mov: 3, rng: 1,
          moveName: 'Meteor Mash', moveType: 'steel' as PokemonType, evolutionChainId: 14, evolutionStage: 2
        }
      }
    ]
  },
  // 15: Trapinch line
  {
    id: 15,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 328, name: 'Trapinch', types: ['ground'] as PokemonType[], hp: 55, atk: 22, def: 8, mov: 3, rng: 1,
          moveName: 'Sand Tomb', moveType: 'ground' as PokemonType, evolutionChainId: 15, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 329, name: 'Vibrava', types: ['ground', 'dragon'] as PokemonType[], hp: 70, atk: 28, def: 10, mov: 4, rng: 1,
          moveName: 'Dragon Breath', moveType: 'dragon' as PokemonType, evolutionChainId: 15, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 330, name: 'Flygon', types: ['ground', 'dragon'] as PokemonType[], hp: 90, atk: 35, def: 12, mov: 4, rng: 2,
          moveName: 'Earth Power', moveType: 'ground' as PokemonType, evolutionChainId: 15, evolutionStage: 2
        }
      }
    ]
  },
  // 16: Chimchar line
  {
    id: 16,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 390, name: 'Chimchar', types: ['fire'] as PokemonType[], hp: 50, atk: 20, def: 6, mov: 5, rng: 1,
          moveName: 'Ember', moveType: 'fire' as PokemonType, evolutionChainId: 16, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 391, name: 'Monferno', types: ['fire', 'fighting'] as PokemonType[], hp: 65, atk: 30, def: 7, mov: 5, rng: 1,
          moveName: 'Mach Punch', moveType: 'fighting' as PokemonType, evolutionChainId: 16, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 392, name: 'Infernape', types: ['fire', 'fighting'] as PokemonType[], hp: 75, atk: 38, def: 8, mov: 5, rng: 1,
          moveName: 'Flare Blitz', moveType: 'fire' as PokemonType, evolutionChainId: 16, evolutionStage: 2
        }
      }
    ]
  },
  // 17: Sneasel line (2 stages)
  {
    id: 17,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 215, name: 'Sneasel', types: ['dark', 'ice'] as PokemonType[], hp: 55, atk: 30, def: 6, mov: 5, rng: 1,
          moveName: 'Feint Attack', moveType: 'dark' as PokemonType, evolutionChainId: 17, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 461, name: 'Weavile', types: ['dark', 'ice'] as PokemonType[], hp: 75, atk: 44, def: 8, mov: 5, rng: 1,
          moveName: 'Night Slash', moveType: 'dark' as PokemonType, evolutionChainId: 17, evolutionStage: 1
        }
      }
    ]
  },
  // 18: Swinub line
  {
    id: 18,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 220, name: 'Swinub', types: ['ice', 'ground'] as PokemonType[], hp: 60, atk: 16, def: 12, mov: 3, rng: 1,
          moveName: 'Powder Snow', moveType: 'ice' as PokemonType, evolutionChainId: 18, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 221, name: 'Piloswine', types: ['ice', 'ground'] as PokemonType[], hp: 90, atk: 26, def: 18, mov: 3, rng: 1,
          moveName: 'Ice Fang', moveType: 'ice' as PokemonType, evolutionChainId: 18, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 473, name: 'Mamoswine', types: ['ice', 'ground'] as PokemonType[], hp: 120, atk: 38, def: 22, mov: 3, rng: 1,
          moveName: 'Earthquake', moveType: 'ground' as PokemonType, evolutionChainId: 18, evolutionStage: 2
        }
      }
    ]
  },
  // 19: Ralts line
  {
    id: 19,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 280, name: 'Ralts', types: ['psychic', 'fairy'] as PokemonType[], hp: 35, atk: 18, def: 6, mov: 4, rng: 2,
          moveName: 'Confusion', moveType: 'psychic' as PokemonType, evolutionChainId: 19, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 281, name: 'Kirlia', types: ['psychic', 'fairy'] as PokemonType[], hp: 50, atk: 28, def: 8, mov: 4, rng: 2,
          moveName: 'Psybeam', moveType: 'psychic' as PokemonType, evolutionChainId: 19, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 282, name: 'Gardevoir', types: ['psychic', 'fairy'] as PokemonType[], hp: 75, atk: 42, def: 10, mov: 4, rng: 2,
          moveName: 'Moonblast', moveType: 'fairy' as PokemonType, evolutionChainId: 19, evolutionStage: 2
        }
      }
    ]
  },
  // 20: Cleffa line
  {
    id: 20,
    stages: [
      {
        killsRequired: 0,
        pokemon: {
          id: 173, name: 'Cleffa', types: ['fairy'] as PokemonType[], hp: 50, atk: 12, def: 10, mov: 3, rng: 1,
          moveName: 'Pound', moveType: 'normal' as PokemonType, evolutionChainId: 20, evolutionStage: 0
        }
      },
      {
        killsRequired: 2,
        pokemon: {
          id: 35, name: 'Clefairy', types: ['fairy'] as PokemonType[], hp: 75, atk: 20, def: 16, mov: 3, rng: 1,
          moveName: 'Disarming Voice', moveType: 'fairy' as PokemonType, evolutionChainId: 20, evolutionStage: 1
        }
      },
      {
        killsRequired: 4,
        pokemon: {
          id: 36, name: 'Clefable', types: ['fairy'] as PokemonType[], hp: 100, atk: 30, def: 22, mov: 3, rng: 1,
          moveName: 'Dazzling Gleam', moveType: 'fairy' as PokemonType, evolutionChainId: 20, evolutionStage: 2
        }
      }
    ]
  }
];

export function getBaseFormPokemon(): PokemonTemplate[] {
  return EVOLUTION_CHAINS.map(chain => chain.stages[0].pokemon);
}

export function getRandomBasePokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {
  const basePool = getBaseFormPokemon();
  const available = basePool.filter(p => !excludeIds.has(p.id));

  if (available.length === 0) {
    return basePool[Math.floor(Math.random() * basePool.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

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
    return null;
  }

  const nextStage = chain.stages[currentStageIndex + 1];

  if (currentKills >= nextStage.killsRequired) {
    return nextStage.pokemon;
  }

  return null;
}

export function canEvolve(pokemon: PokemonTemplate, kills: number): boolean {
  return getNextEvolution(pokemon, kills) !== null;
}
