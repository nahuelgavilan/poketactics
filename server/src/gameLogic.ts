/**
 * Server-side game logic for PokéTactics
 * All game calculations happen here - server is authoritative
 */

import type { ServerGameState, ServerUnit, Player, PokemonTemplate, PokemonType, ClientGameState, ClientUnit } from './types';

// Board constants
const BOARD_WIDTH = 6;
const BOARD_HEIGHT = 8;
const VISION_RANGE = 3;

// Terrain types
const TERRAIN = {
  GRASS: 0,
  FOREST: 1,
  WATER: 2,
  MOUNTAIN: 3,
  BASE: 4,
  TALL_GRASS: 5,
  POKEMON_CENTER: 6
};

// Terrain properties
const TERRAIN_PROPS: Record<number, { def: number; moveCost: number; visionBonus?: number; heals?: boolean }> = {
  [TERRAIN.GRASS]: { def: 0, moveCost: 1 },
  [TERRAIN.FOREST]: { def: 20, moveCost: 2 },
  [TERRAIN.WATER]: { def: 0, moveCost: 99 },
  [TERRAIN.MOUNTAIN]: { def: 40, moveCost: 3, visionBonus: 2 },
  [TERRAIN.BASE]: { def: 10, moveCost: 1 },
  [TERRAIN.TALL_GRASS]: { def: 5, moveCost: 1 },
  [TERRAIN.POKEMON_CENTER]: { def: 15, moveCost: 1, heals: true }
};

// Type effectiveness chart
const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, steel: 0.5 }
};

// Evolution chains (simplified for server)
export const EVOLUTION_CHAINS: { stages: PokemonTemplate[] }[] = [
  // Charmander line
  {
    stages: [
      { id: 4, name: 'Charmander', types: ['fire'], hp: 55, atk: 18, def: 8, mov: 4, rng: 1, moveName: 'Ember', moveType: 'fire', evolutionChainId: 0, evolutionStage: 0 },
      { id: 5, name: 'Charmeleon', types: ['fire'], hp: 75, atk: 26, def: 12, mov: 4, rng: 1, moveName: 'Fire Fang', moveType: 'fire', evolutionChainId: 0, evolutionStage: 1 },
      { id: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 100, atk: 35, def: 12, mov: 5, rng: 1, moveName: 'Flamethrower', moveType: 'fire', evolutionChainId: 0, evolutionStage: 2 }
    ]
  },
  // Squirtle line
  {
    stages: [
      { id: 7, name: 'Squirtle', types: ['water'], hp: 60, atk: 15, def: 12, mov: 3, rng: 1, moveName: 'Water Gun', moveType: 'water', evolutionChainId: 1, evolutionStage: 0 },
      { id: 8, name: 'Wartortle', types: ['water'], hp: 80, atk: 21, def: 16, mov: 3, rng: 1, moveName: 'Water Pulse', moveType: 'water', evolutionChainId: 1, evolutionStage: 1 },
      { id: 9, name: 'Blastoise', types: ['water'], hp: 120, atk: 28, def: 22, mov: 3, rng: 2, moveName: 'Hydro Pump', moveType: 'water', evolutionChainId: 1, evolutionStage: 2 }
    ]
  },
  // Bulbasaur line
  {
    stages: [
      { id: 1, name: 'Bulbasaur', types: ['grass', 'poison'], hp: 65, atk: 16, def: 10, mov: 3, rng: 1, moveName: 'Vine Whip', moveType: 'grass', evolutionChainId: 2, evolutionStage: 0 },
      { id: 2, name: 'Ivysaur', types: ['grass', 'poison'], hp: 85, atk: 22, def: 13, mov: 3, rng: 1, moveName: 'Razor Leaf', moveType: 'grass', evolutionChainId: 2, evolutionStage: 1 },
      { id: 3, name: 'Venusaur', types: ['grass', 'poison'], hp: 130, atk: 28, def: 18, mov: 3, rng: 1, moveName: 'Solar Beam', moveType: 'grass', evolutionChainId: 2, evolutionStage: 2 }
    ]
  },
  // Pichu line
  {
    stages: [
      { id: 172, name: 'Pichu', types: ['electric'], hp: 40, atk: 22, def: 4, mov: 5, rng: 1, moveName: 'Thunder Shock', moveType: 'electric', evolutionChainId: 3, evolutionStage: 0 },
      { id: 25, name: 'Pikachu', types: ['electric'], hp: 55, atk: 32, def: 6, mov: 5, rng: 2, moveName: 'Thunderbolt', moveType: 'electric', evolutionChainId: 3, evolutionStage: 1 },
      { id: 26, name: 'Raichu', types: ['electric'], hp: 70, atk: 42, def: 8, mov: 5, rng: 2, moveName: 'Thunder', moveType: 'electric', evolutionChainId: 3, evolutionStage: 2 }
    ]
  },
  // Machop line
  {
    stages: [
      { id: 66, name: 'Machop', types: ['fighting'], hp: 70, atk: 25, def: 10, mov: 3, rng: 1, moveName: 'Karate Chop', moveType: 'fighting', evolutionChainId: 4, evolutionStage: 0 },
      { id: 67, name: 'Machoke', types: ['fighting'], hp: 90, atk: 35, def: 14, mov: 3, rng: 1, moveName: 'Cross Chop', moveType: 'fighting', evolutionChainId: 4, evolutionStage: 1 },
      { id: 68, name: 'Machamp', types: ['fighting'], hp: 110, atk: 48, def: 18, mov: 3, rng: 1, moveName: 'Dynamic Punch', moveType: 'fighting', evolutionChainId: 4, evolutionStage: 2 }
    ]
  },
  // Gastly line
  {
    stages: [
      { id: 92, name: 'Gastly', types: ['ghost', 'poison'], hp: 45, atk: 28, def: 4, mov: 5, rng: 1, moveName: 'Lick', moveType: 'ghost', evolutionChainId: 5, evolutionStage: 0 },
      { id: 93, name: 'Haunter', types: ['ghost', 'poison'], hp: 55, atk: 38, def: 6, mov: 5, rng: 1, moveName: 'Shadow Punch', moveType: 'ghost', evolutionChainId: 5, evolutionStage: 1 },
      { id: 94, name: 'Gengar', types: ['ghost', 'poison'], hp: 70, atk: 50, def: 8, mov: 5, rng: 1, moveName: 'Shadow Ball', moveType: 'ghost', evolutionChainId: 5, evolutionStage: 2 }
    ]
  },
  // Dratini line
  {
    stages: [
      { id: 147, name: 'Dratini', types: ['dragon'], hp: 55, atk: 20, def: 8, mov: 4, rng: 1, moveName: 'Dragon Rage', moveType: 'dragon', evolutionChainId: 6, evolutionStage: 0 },
      { id: 148, name: 'Dragonair', types: ['dragon'], hp: 75, atk: 30, def: 12, mov: 4, rng: 1, moveName: 'Dragon Breath', moveType: 'dragon', evolutionChainId: 6, evolutionStage: 1 },
      { id: 149, name: 'Dragonite', types: ['dragon', 'flying'], hp: 120, atk: 44, def: 16, mov: 5, rng: 1, moveName: 'Dragon Claw', moveType: 'dragon', evolutionChainId: 6, evolutionStage: 2 }
    ]
  },
  // Riolu line (2 stages)
  {
    stages: [
      { id: 447, name: 'Riolu', types: ['fighting'], hp: 55, atk: 24, def: 8, mov: 5, rng: 1, moveName: 'Force Palm', moveType: 'fighting', evolutionChainId: 7, evolutionStage: 0 },
      { id: 448, name: 'Lucario', types: ['fighting', 'steel'], hp: 80, atk: 40, def: 12, mov: 5, rng: 1, moveName: 'Aura Sphere', moveType: 'fighting', evolutionChainId: 7, evolutionStage: 1 }
    ]
  },
  // Magikarp line (2 stages)
  {
    stages: [
      { id: 129, name: 'Magikarp', types: ['water'], hp: 40, atk: 8, def: 10, mov: 3, rng: 1, moveName: 'Splash', moveType: 'water', evolutionChainId: 8, evolutionStage: 0 },
      { id: 130, name: 'Gyarados', types: ['water', 'flying'], hp: 110, atk: 42, def: 14, mov: 4, rng: 1, moveName: 'Aqua Tail', moveType: 'water', evolutionChainId: 8, evolutionStage: 1 }
    ]
  },
  // Larvitar line
  {
    stages: [
      { id: 246, name: 'Larvitar', types: ['rock', 'ground'], hp: 65, atk: 20, def: 14, mov: 3, rng: 1, moveName: 'Bite', moveType: 'rock', evolutionChainId: 9, evolutionStage: 0 },
      { id: 247, name: 'Pupitar', types: ['rock', 'ground'], hp: 85, atk: 30, def: 18, mov: 3, rng: 1, moveName: 'Rock Slide', moveType: 'rock', evolutionChainId: 9, evolutionStage: 1 },
      { id: 248, name: 'Tyranitar', types: ['rock', 'dragon'], hp: 130, atk: 44, def: 24, mov: 3, rng: 1, moveName: 'Stone Edge', moveType: 'rock', evolutionChainId: 9, evolutionStage: 2 }
    ]
  },
  // Geodude line
  {
    stages: [
      { id: 74, name: 'Geodude', types: ['rock', 'ground'], hp: 55, atk: 22, def: 22, mov: 2, rng: 1, moveName: 'Rock Throw', moveType: 'rock', evolutionChainId: 10, evolutionStage: 0 },
      { id: 75, name: 'Graveler', types: ['rock', 'ground'], hp: 75, atk: 28, def: 30, mov: 2, rng: 1, moveName: 'Rock Blast', moveType: 'rock', evolutionChainId: 10, evolutionStage: 1 },
      { id: 76, name: 'Golem', types: ['rock', 'ground'], hp: 100, atk: 34, def: 38, mov: 2, rng: 1, moveName: 'Rock Slide', moveType: 'rock', evolutionChainId: 10, evolutionStage: 2 }
    ]
  },
  // Abra line
  {
    stages: [
      { id: 63, name: 'Abra', types: ['psychic'], hp: 35, atk: 30, def: 4, mov: 5, rng: 2, moveName: 'Confusion', moveType: 'psychic', evolutionChainId: 11, evolutionStage: 0 },
      { id: 64, name: 'Kadabra', types: ['psychic'], hp: 50, atk: 42, def: 6, mov: 5, rng: 2, moveName: 'Psybeam', moveType: 'psychic', evolutionChainId: 11, evolutionStage: 1 },
      { id: 65, name: 'Alakazam', types: ['psychic'], hp: 65, atk: 55, def: 8, mov: 5, rng: 2, moveName: 'Psychic', moveType: 'psychic', evolutionChainId: 11, evolutionStage: 2 }
    ]
  }
];

// Wild Pokemon pool for captures
const WILD_POKEMON: PokemonTemplate[] = [
  { id: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 100, atk: 35, def: 12, mov: 5, rng: 1, moveName: 'Flamethrower', moveType: 'fire' },
  { id: 9, name: 'Blastoise', types: ['water'], hp: 120, atk: 28, def: 22, mov: 3, rng: 2, moveName: 'Hydro Pump', moveType: 'water' },
  { id: 3, name: 'Venusaur', types: ['grass', 'poison'], hp: 130, atk: 28, def: 18, mov: 3, rng: 1, moveName: 'Solar Beam', moveType: 'grass' },
  { id: 25, name: 'Pikachu', types: ['electric'], hp: 55, atk: 32, def: 6, mov: 5, rng: 2, moveName: 'Thunderbolt', moveType: 'electric' },
  { id: 130, name: 'Gyarados', types: ['water', 'flying'], hp: 110, atk: 42, def: 14, mov: 4, rng: 1, moveName: 'Aqua Tail', moveType: 'water' },
  { id: 94, name: 'Gengar', types: ['ghost', 'poison'], hp: 70, atk: 50, def: 8, mov: 5, rng: 1, moveName: 'Shadow Ball', moveType: 'ghost' }
];

/**
 * Generate initial game state
 */
export function createGameState(): ServerGameState {
  const map = generateMap();
  const units = generateUnits();
  const emptyExplored = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));

  return {
    map,
    units,
    turn: 1,
    currentPlayer: 'P1',
    status: 'playing',
    winner: null,
    exploredP1: emptyExplored.map(row => [...row]),
    exploredP2: emptyExplored.map(row => [...row])
  };
}

/**
 * Generate map with terrain
 */
function generateMap(): number[][] {
  const map: number[][] = Array(BOARD_HEIGHT).fill(0).map(() =>
    Array(BOARD_WIDTH).fill(TERRAIN.GRASS)
  );

  // Random terrain
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const r = Math.random();
      if (r > 0.88) map[y][x] = TERRAIN.MOUNTAIN;
      else if (r > 0.80) map[y][x] = TERRAIN.WATER;
      else if (r > 0.65) map[y][x] = TERRAIN.FOREST;
      else if (r > 0.45) map[y][x] = TERRAIN.TALL_GRASS;
    }
  }

  // Ensure bases are passable
  map[0][0] = TERRAIN.BASE;
  map[0][1] = TERRAIN.GRASS;
  map[1][0] = TERRAIN.GRASS;
  map[BOARD_HEIGHT - 1][BOARD_WIDTH - 1] = TERRAIN.BASE;
  map[BOARD_HEIGHT - 1][BOARD_WIDTH - 2] = TERRAIN.GRASS;
  map[BOARD_HEIGHT - 2][BOARD_WIDTH - 1] = TERRAIN.GRASS;

  // Add Pokemon Center
  const cx = 1 + Math.floor(Math.random() * (BOARD_WIDTH - 2));
  const cy = 2 + Math.floor(Math.random() * (BOARD_HEIGHT - 4));
  map[cy][cx] = TERRAIN.POKEMON_CENTER;

  return map;
}

/**
 * Generate initial units for both players
 */
function generateUnits(): ServerUnit[] {
  const units: ServerUnit[] = [];
  const usedChains = new Set<number>();

  // P1 team (bottom)
  for (let i = 0; i < 3; i++) {
    let chainId: number;
    do {
      chainId = Math.floor(Math.random() * EVOLUTION_CHAINS.length);
    } while (usedChains.has(chainId));
    usedChains.add(chainId);

    const template = EVOLUTION_CHAINS[chainId].stages[0];
    units.push({
      uid: `p1-${i}-${Date.now()}`,
      owner: 'P1',
      templateId: template.id,
      template: { ...template },
      x: i % BOARD_WIDTH,
      y: BOARD_HEIGHT - 1 - Math.floor(i / BOARD_WIDTH),
      currentHp: template.hp,
      hasMoved: false,
      kills: 0
    });
  }

  // P2 team (top)
  for (let i = 0; i < 3; i++) {
    let chainId: number;
    do {
      chainId = Math.floor(Math.random() * EVOLUTION_CHAINS.length);
    } while (usedChains.has(chainId));
    usedChains.add(chainId);

    const template = EVOLUTION_CHAINS[chainId].stages[0];
    units.push({
      uid: `p2-${i}-${Date.now()}`,
      owner: 'P2',
      templateId: template.id,
      template: { ...template },
      x: BOARD_WIDTH - 1 - (i % BOARD_WIDTH),
      y: 0 + Math.floor(i / BOARD_WIDTH),
      currentHp: template.hp,
      hasMoved: false,
      kills: 0
    });
  }

  return units;
}

/**
 * Create game state with specific teams (for draft mode)
 */
export function createGameStateWithTeams(p1Team: PokemonTemplate[], p2Team: PokemonTemplate[]): ServerGameState {
  const map = generateMap();
  const units: ServerUnit[] = [];

  // P1 team (bottom)
  for (let i = 0; i < p1Team.length; i++) {
    const template = p1Team[i];
    units.push({
      uid: `p1-${i}-${Date.now()}`,
      owner: 'P1',
      templateId: template.id,
      template: { ...template },
      x: i % BOARD_WIDTH,
      y: BOARD_HEIGHT - 1 - Math.floor(i / BOARD_WIDTH),
      currentHp: template.hp,
      hasMoved: false,
      kills: 0
    });
  }

  // P2 team (top)
  for (let i = 0; i < p2Team.length; i++) {
    const template = p2Team[i];
    units.push({
      uid: `p2-${i}-${Date.now()}`,
      owner: 'P2',
      templateId: template.id,
      template: { ...template },
      x: BOARD_WIDTH - 1 - (i % BOARD_WIDTH),
      y: 0 + Math.floor(i / BOARD_WIDTH),
      currentHp: template.hp,
      hasMoved: false,
      kills: 0
    });
  }

  const emptyExplored = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));

  return {
    map,
    units,
    turn: 1,
    currentPlayer: 'P1',
    status: 'playing',
    winner: null,
    exploredP1: emptyExplored.map(row => [...row]),
    exploredP2: emptyExplored.map(row => [...row])
  };
}

/**
 * Calculate visibility for a player
 */
export function calculateVisibility(game: ServerGameState, player: Player): { visible: boolean[][]; explored: boolean[][] } {
  const visible: boolean[][] = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
  const previousExplored = player === 'P1' ? game.exploredP1 : game.exploredP2;
  const explored: boolean[][] = previousExplored.map(row => [...row]);

  const playerUnits = game.units.filter(u => u.owner === player);

  for (const unit of playerUnits) {
    let visionRange = VISION_RANGE;
    const terrain = game.map[unit.y][unit.x];
    if (TERRAIN_PROPS[terrain]?.visionBonus) {
      visionRange += TERRAIN_PROPS[terrain].visionBonus!;
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);
        if (distance <= visionRange) {
          visible[y][x] = true;
          explored[y][x] = true;
        }
      }
    }
  }

  return { visible, explored };
}

/**
 * Update explored tiles in game state
 */
export function updateExplored(game: ServerGameState, player: Player, explored: boolean[][]): void {
  if (player === 'P1') {
    game.exploredP1 = explored;
  } else {
    game.exploredP2 = explored;
  }
}

/**
 * Filter game state for a specific player (fog of war)
 */
export function getClientState(game: ServerGameState, player: Player): ClientGameState {
  const visibility = calculateVisibility(game, player);
  updateExplored(game, player, visibility.explored);

  // Filter units - only show enemy units that are visible
  const visibleUnits: ClientUnit[] = game.units
    .filter(unit => {
      if (unit.owner === player) return true;
      return visibility.visible[unit.y][unit.x];
    })
    .map(unit => ({
      uid: unit.uid,
      owner: unit.owner,
      templateId: unit.templateId,
      template: unit.template,
      x: unit.x,
      y: unit.y,
      currentHp: unit.currentHp,
      hasMoved: unit.hasMoved,
      kills: unit.kills
    }));

  return {
    map: game.map,
    units: visibleUnits,
    turn: game.turn,
    currentPlayer: game.currentPlayer,
    myPlayer: player,
    status: game.status,
    winner: game.winner,
    visibility
  };
}

/**
 * Check for wild encounter on tall grass (30% chance)
 */
function checkWildEncounter(unit: ServerUnit, game: ServerGameState): { pokemon: PokemonTemplate; spawnPos: { x: number; y: number } } | null {
  // Check if on tall grass
  if (game.map[unit.y][unit.x] !== TERRAIN.TALL_GRASS) {
    return null;
  }

  // 30% chance of encounter
  if (Math.random() > 0.3) {
    return null;
  }

  // Find spawn position (8 directions)
  const directions = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
    { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
  ];

  for (const dir of directions) {
    const nx = unit.x + dir.dx;
    const ny = unit.y + dir.dy;

    // Check bounds
    if (nx < 0 || nx >= BOARD_WIDTH || ny < 0 || ny >= BOARD_HEIGHT) continue;

    // Check terrain passability
    const terrain = game.map[ny][nx];
    if (terrain === TERRAIN.WATER) continue;

    // Check for existing units
    if (game.units.some(u => u.x === nx && u.y === ny)) continue;

    // Valid spawn position found
    const wildPokemon = WILD_POKEMON[Math.floor(Math.random() * WILD_POKEMON.length)];

    return {
      pokemon: wildPokemon,
      spawnPos: { x: nx, y: ny }
    };
  }

  // No valid spawn position
  return null;
}

/**
 * Validate and execute a move action
 */
export function executeMove(game: ServerGameState, playerId: Player, unitId: string, x: number, y: number): { success: boolean; encounter?: { pokemon: PokemonTemplate; spawnPos: { x: number; y: number } }; error?: string } {
  // Check turn
  if (game.currentPlayer !== playerId) {
    return { success: false, error: 'No es tu turno' };
  }

  // Find unit
  const unit = game.units.find(u => u.uid === unitId);
  if (!unit || unit.owner !== playerId) {
    return { success: false, error: 'Unidad no válida' };
  }

  if (unit.hasMoved) {
    return { success: false, error: 'La unidad ya se movió' };
  }

  // Check if destination is valid (simplified - check distance and terrain)
  const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);
  if (distance > unit.template.mov) {
    return { success: false, error: 'Destino fuera de rango' };
  }

  // Check terrain
  const terrain = game.map[y]?.[x];
  if (terrain === undefined || terrain === TERRAIN.WATER) {
    if (!unit.template.types.includes('flying')) {
      return { success: false, error: 'Terreno no válido' };
    }
  }

  // Check if tile is occupied
  if (game.units.some(u => u.x === x && u.y === y && u.uid !== unitId)) {
    return { success: false, error: 'Casilla ocupada' };
  }

  // Execute move
  unit.x = x;
  unit.y = y;

  // Check for wild encounter (server-authoritative 30% chance)
  const encounter = checkWildEncounter(unit, game);

  if (encounter) {
    // Don't mark as moved yet - wait for capture result
    return { success: true, encounter };
  }

  // No encounter - return success
  return { success: true };
}

/**
 * Calculate type effectiveness
 */
function getTypeEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const effectiveness = TYPE_CHART[moveType]?.[defType];
    if (effectiveness !== undefined) {
      multiplier *= effectiveness;
    }
  }
  return multiplier;
}

/**
 * Calculate damage
 */
function calculateDamage(attacker: ServerUnit, defender: ServerUnit, terrain: number, isCounter: boolean): { damage: number; isCritical: boolean } {
  const baseDamage = attacker.template.atk;
  const defense = defender.template.def;
  const terrainDef = TERRAIN_PROPS[terrain]?.def || 0;

  const effectiveness = getTypeEffectiveness(attacker.template.moveType, defender.template.types);
  const counterPenalty = isCounter ? 0.75 : 1;
  const isCritical = Math.random() < 0.1;
  const critMultiplier = isCritical ? 1.5 : 1;
  const variance = 0.9 + Math.random() * 0.2;

  let damage = (baseDamage * effectiveness * counterPenalty - defense * (1 + terrainDef / 100)) * critMultiplier * variance;
  damage = Math.max(1, Math.floor(damage));

  return { damage, isCritical };
}

/**
 * Get next evolution for a unit
 */
function getNextEvolution(unit: ServerUnit): PokemonTemplate | null {
  if (unit.template.evolutionChainId === undefined) return null;

  const chain = EVOLUTION_CHAINS[unit.template.evolutionChainId];
  if (!chain) return null;

  const currentStage = unit.template.evolutionStage || 0;
  const nextStage = currentStage + 1;

  if (nextStage >= chain.stages.length) return null;

  const killsNeeded = (nextStage) * 2; // 2 kills per evolution
  if (unit.kills >= killsNeeded) {
    return chain.stages[nextStage];
  }

  return null;
}

/**
 * Execute attack action
 */
export function executeAttack(game: ServerGameState, playerId: Player, attackerId: string, defenderId: string): {
  success: boolean;
  damage: number;
  counterDamage: number;
  attackerDied: boolean;
  defenderDied: boolean;
  evolution?: { unitId: string; newTemplate: PokemonTemplate };
  error?: string;
} {
  // Check turn
  if (game.currentPlayer !== playerId) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'No es tu turno' };
  }

  const attacker = game.units.find(u => u.uid === attackerId);
  const defender = game.units.find(u => u.uid === defenderId);

  if (!attacker || attacker.owner !== playerId) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Atacante no válido' };
  }

  if (!defender || defender.owner === playerId) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Defensor no válido' };
  }

  // Check range
  const distance = Math.abs(defender.x - attacker.x) + Math.abs(defender.y - attacker.y);
  if (distance > attacker.template.rng) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Fuera de rango' };
  }

  // Calculate attack damage
  const defenderTerrain = game.map[defender.y][defender.x];
  const { damage } = calculateDamage(attacker, defender, defenderTerrain, false);

  defender.currentHp = Math.max(0, defender.currentHp - damage);
  const defenderDied = defender.currentHp <= 0;

  // Counter attack if defender survives and in range
  let counterDamage = 0;
  let attackerDied = false;

  if (!defenderDied) {
    const counterDistance = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
    if (counterDistance <= defender.template.rng) {
      const attackerTerrain = game.map[attacker.y][attacker.x];
      const counterResult = calculateDamage(defender, attacker, attackerTerrain, true);
      counterDamage = counterResult.damage;
      attacker.currentHp = Math.max(0, attacker.currentHp - counterDamage);
      attackerDied = attacker.currentHp <= 0;
    }
  }

  // Track kills and check evolution
  let evolution: { unitId: string; newTemplate: PokemonTemplate } | undefined;

  if (defenderDied && !attackerDied) {
    attacker.kills++;

    const nextEvo = getNextEvolution(attacker);
    if (nextEvo) {
      attacker.template = nextEvo;
      attacker.templateId = nextEvo.id;
      attacker.currentHp = nextEvo.hp; // Full heal on evolution
      evolution = { unitId: attacker.uid, newTemplate: nextEvo };
    }
  }

  // Remove dead units
  game.units = game.units.filter(u => u.currentHp > 0);

  // Mark attacker as moved
  if (!attackerDied) {
    attacker.hasMoved = true;
  }

  // Check victory
  if (!game.units.some(u => u.owner === 'P1')) {
    game.winner = 'P2';
    game.status = 'finished';
  } else if (!game.units.some(u => u.owner === 'P2')) {
    game.winner = 'P1';
    game.status = 'finished';
  }

  return { success: true, damage, counterDamage, attackerDied, defenderDied, evolution };
}

/**
 * Execute wait action
 */
export function executeWait(game: ServerGameState, playerId: Player, unitId: string): { success: boolean; error?: string } {
  if (game.currentPlayer !== playerId) {
    return { success: false, error: 'No es tu turno' };
  }

  const unit = game.units.find(u => u.uid === unitId);
  if (!unit || unit.owner !== playerId) {
    return { success: false, error: 'Unidad no válida' };
  }

  unit.hasMoved = true;
  return { success: true };
}

/**
 * Execute capture action (30% chance)
 */
export function executeCapture(game: ServerGameState, playerId: Player, unitId: string, minigameSuccess?: boolean): {
  success: boolean;
  captured: boolean;
  newUnit?: ServerUnit;
  pokemon?: PokemonTemplate;
  error?: string;
} {
  if (game.currentPlayer !== playerId) {
    return { success: false, captured: false, error: 'No es tu turno' };
  }

  const unit = game.units.find(u => u.uid === unitId);
  if (!unit || unit.owner !== playerId) {
    return { success: false, captured: false, error: 'Unidad no válida' };
  }

  // Check if on tall grass
  if (game.map[unit.y][unit.x] !== TERRAIN.TALL_GRASS) {
    return { success: false, captured: false, error: 'No estás en hierba alta' };
  }

  // If client provided minigame result, use it; otherwise use server RNG (30% chance)
  const captured = minigameSuccess !== undefined ? minigameSuccess : Math.random() < 0.3;

  if (!captured) {
    unit.hasMoved = true;
    return { success: true, captured: false };
  }

  // Find spawn position
  const directions = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
    { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
  ];

  let spawnX = -1, spawnY = -1;
  for (const dir of directions) {
    const nx = unit.x + dir.dx;
    const ny = unit.y + dir.dy;
    if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
      const terrain = game.map[ny][nx];
      if (terrain !== TERRAIN.WATER && terrain !== TERRAIN.MOUNTAIN) {
        if (!game.units.some(u => u.x === nx && u.y === ny)) {
          spawnX = nx;
          spawnY = ny;
          break;
        }
      }
    }
  }

  if (spawnX === -1) {
    unit.hasMoved = true;
    return { success: true, captured: false, error: 'No hay espacio' };
  }

  // Create new unit
  const pokemon = WILD_POKEMON[Math.floor(Math.random() * WILD_POKEMON.length)];
  const newUnit: ServerUnit = {
    uid: `${playerId}-cap-${Date.now()}`,
    owner: playerId,
    templateId: pokemon.id,
    template: { ...pokemon },
    x: spawnX,
    y: spawnY,
    currentHp: pokemon.hp,
    hasMoved: true,
    kills: 0
  };

  game.units.push(newUnit);
  unit.hasMoved = true;

  return { success: true, captured: true, newUnit, pokemon };
}

/**
 * Check and execute end of turn (automatic - when all units have moved)
 */
export function checkTurnEnd(game: ServerGameState): { turnEnded: boolean; nextPlayer: Player; turn: number } {
  const currentPlayerUnits = game.units.filter(u => u.owner === game.currentPlayer);
  const allMoved = currentPlayerUnits.every(u => u.hasMoved);

  if (!allMoved || currentPlayerUnits.length === 0) {
    return { turnEnded: false, nextPlayer: game.currentPlayer, turn: game.turn };
  }

  // End turn
  return executeTurnEnd(game);
}

/**
 * Force end turn (manual - player clicks "End Turn" button)
 */
export function executeEndTurn(game: ServerGameState, playerId: Player): { success: boolean; nextPlayer: Player; turn: number; error?: string } {
  // Check it's the player's turn
  if (game.currentPlayer !== playerId) {
    return { success: false, nextPlayer: game.currentPlayer, turn: game.turn, error: 'No es tu turno' };
  }

  const result = executeTurnEnd(game);
  return { success: true, nextPlayer: result.nextPlayer, turn: result.turn };
}

/**
 * Internal function to execute turn end logic
 */
function executeTurnEnd(game: ServerGameState): { turnEnded: boolean; nextPlayer: Player; turn: number } {
  const nextPlayer: Player = game.currentPlayer === 'P1' ? 'P2' : 'P1';
  const newTurn = nextPlayer === 'P1' ? game.turn + 1 : game.turn;

  // Reset all units' hasMoved and apply Pokemon Center healing
  game.units.forEach(u => {
    u.hasMoved = false;

    // Heal on Pokemon Center
    if (u.owner === nextPlayer && game.map[u.y][u.x] === TERRAIN.POKEMON_CENTER) {
      const healAmount = Math.floor(u.template.hp * 0.2);
      u.currentHp = Math.min(u.template.hp, u.currentHp + healAmount);
    }
  });

  game.currentPlayer = nextPlayer;
  game.turn = newTurn;

  return { turnEnded: true, nextPlayer, turn: newTurn };
}
