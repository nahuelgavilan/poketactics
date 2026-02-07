import type { PokemonTemplate, PokemonType } from './types';

export const WILD_POKEMON_POOL: PokemonTemplate[] = [
  { id: 6, name: 'Charizard', types: ['fire', 'flying'] as PokemonType[], hp: 100, atk: 35, def: 12, mov: 5, rng: 1, moveName: 'Flamethrower', moveType: 'fire' as PokemonType },
  { id: 9, name: 'Blastoise', types: ['water'] as PokemonType[], hp: 120, atk: 28, def: 22, mov: 3, rng: 2, moveName: 'Hydro Pump', moveType: 'water' as PokemonType },
  { id: 3, name: 'Venusaur', types: ['grass', 'poison'] as PokemonType[], hp: 130, atk: 28, def: 18, mov: 3, rng: 1, moveName: 'Solar Beam', moveType: 'grass' as PokemonType },
  { id: 25, name: 'Pikachu', types: ['electric'] as PokemonType[], hp: 55, atk: 32, def: 6, mov: 5, rng: 2, moveName: 'Thunderbolt', moveType: 'electric' as PokemonType },
  { id: 130, name: 'Gyarados', types: ['water', 'flying'] as PokemonType[], hp: 110, atk: 42, def: 14, mov: 4, rng: 1, moveName: 'Aqua Tail', moveType: 'water' as PokemonType },
  { id: 94, name: 'Gengar', types: ['ghost', 'poison'] as PokemonType[], hp: 70, atk: 50, def: 8, mov: 5, rng: 1, moveName: 'Shadow Ball', moveType: 'ghost' as PokemonType },
  { id: 448, name: 'Lucario', types: ['fighting', 'steel'] as PokemonType[], hp: 80, atk: 40, def: 12, mov: 5, rng: 1, moveName: 'Aura Sphere', moveType: 'fighting' as PokemonType },
  { id: 212, name: 'Scizor', types: ['bug', 'steel'] as PokemonType[], hp: 90, atk: 42, def: 25, mov: 4, rng: 1, moveName: 'Bullet Punch', moveType: 'steel' as PokemonType },
  { id: 461, name: 'Weavile', types: ['dark', 'ice'] as PokemonType[], hp: 75, atk: 44, def: 8, mov: 5, rng: 1, moveName: 'Night Slash', moveType: 'dark' as PokemonType },
  { id: 282, name: 'Gardevoir', types: ['psychic', 'fairy'] as PokemonType[], hp: 75, atk: 42, def: 10, mov: 4, rng: 2, moveName: 'Moonblast', moveType: 'fairy' as PokemonType }
];

export function getRandomWildPokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {
  const available = WILD_POKEMON_POOL.filter(p => !excludeIds.has(p.id));
  if (available.length === 0) {
    return WILD_POKEMON_POOL[Math.floor(Math.random() * WILD_POKEMON_POOL.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
