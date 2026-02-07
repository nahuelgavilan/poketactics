/**
 * Server-side game logic for PokéTactics
 * All game calculations happen here - server is authoritative
 */

import type { ServerGameState, ServerUnit, Player, ClientGameState, ClientUnit } from './types';
import type { PokemonTemplate, PokemonType, TerrainType, GameMap } from '@poketactics/shared';
import {
  BOARD_WIDTH, BOARD_HEIGHT, VISION_RANGE,
  TERRAIN, TERRAIN_GAME_PROPS,
  TYPE_CHART,
  EVOLUTION_CHAINS,
  WILD_POKEMON_POOL,
  getFullEffectiveness,
  calculateBaseDamage as sharedCalculateBaseDamage,
  getNextEvolution as sharedGetNextEvolution,
  calculateMoveRange,
  CRIT_CHANCE, CRIT_MULTIPLIER, DAMAGE_VARIANCE, COUNTER_DAMAGE_PENALTY
} from '@poketactics/shared';

// Re-export for draftLogic
export { EVOLUTION_CHAINS };

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
 * Generate map with terrain (10x12, includes all terrain types)
 */
function generateMap(): number[][] {
  const map: number[][] = Array(BOARD_HEIGHT).fill(0).map(() =>
    Array(BOARD_WIDTH).fill(TERRAIN.GRASS)
  );

  // Random terrain distribution
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const r = Math.random();
      if (r > 0.93) map[y][x] = TERRAIN.MOUNTAIN;
      else if (r > 0.88) map[y][x] = TERRAIN.WATER;
      else if (r > 0.80) map[y][x] = TERRAIN.FOREST;
      else if (r > 0.65) map[y][x] = TERRAIN.TALL_GRASS;
      else if (r > 0.60) map[y][x] = TERRAIN.SAND;
      else if (r > 0.56) map[y][x] = TERRAIN.ROAD;
      else if (r > 0.53) map[y][x] = TERRAIN.SWAMP;
      else if (r > 0.50) map[y][x] = TERRAIN.ICE;
      else if (r > 0.48) map[y][x] = TERRAIN.RUINS;
      else if (r > 0.46) map[y][x] = TERRAIN.CAVE;
      else if (r > 0.45) map[y][x] = TERRAIN.LAVA;
    }
  }

  // Place berry bushes
  for (let i = 0; i < 3; i++) {
    const bx = Math.floor(Math.random() * BOARD_WIDTH);
    const by = 2 + Math.floor(Math.random() * (BOARD_HEIGHT - 4));
    if (map[by][bx] === TERRAIN.GRASS || map[by][bx] === TERRAIN.TALL_GRASS) {
      map[by][bx] = TERRAIN.BERRY_BUSH;
    }
  }

  // Ensure bases are passable
  map[0][0] = TERRAIN.BASE;
  map[0][1] = TERRAIN.GRASS;
  map[1][0] = TERRAIN.GRASS;
  map[BOARD_HEIGHT - 1][BOARD_WIDTH - 1] = TERRAIN.BASE;
  map[BOARD_HEIGHT - 1][BOARD_WIDTH - 2] = TERRAIN.GRASS;
  map[BOARD_HEIGHT - 2][BOARD_WIDTH - 1] = TERRAIN.GRASS;

  // Place bridges over water (find water tiles and add bridge near them)
  for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      if (map[y][x] === TERRAIN.WATER && Math.random() < 0.3) {
        map[y][x] = TERRAIN.BRIDGE;
      }
    }
  }

  // Add Pokemon Centers (2-3)
  const centerCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < centerCount; i++) {
    const cx = 1 + Math.floor(Math.random() * (BOARD_WIDTH - 2));
    const cy = 2 + Math.floor(Math.random() * (BOARD_HEIGHT - 4));
    map[cy][cx] = TERRAIN.POKEMON_CENTER;
  }

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

    const template = EVOLUTION_CHAINS[chainId].stages[0].pokemon;
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

    const template = EVOLUTION_CHAINS[chainId].stages[0].pokemon;
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
 * Calculate visibility for a player (includes cave concealment)
 */
export function calculateVisibility(game: ServerGameState, player: Player): { visible: boolean[][]; explored: boolean[][] } {
  const visible: boolean[][] = Array(game.map.length).fill(null).map(() => Array(game.map[0].length).fill(false));
  const previousExplored = player === 'P1' ? game.exploredP1 : game.exploredP2;
  const explored: boolean[][] = previousExplored.map(row => [...row]);

  const playerUnits = game.units.filter(u => u.owner === player);

  for (const unit of playerUnits) {
    let visionRange = VISION_RANGE;
    const terrain = game.map[unit.y][unit.x];
    if (TERRAIN_GAME_PROPS[terrain as keyof typeof TERRAIN_GAME_PROPS]?.visionBonus) {
      visionRange += TERRAIN_GAME_PROPS[terrain as keyof typeof TERRAIN_GAME_PROPS].visionBonus!;
    }

    for (let y = 0; y < game.map.length; y++) {
      for (let x = 0; x < game.map[0].length; x++) {
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
 * Check if an enemy unit is concealed by cave terrain
 */
function isUnitConcealed(unit: ServerUnit, game: ServerGameState, viewingPlayer: Player): boolean {
  if (unit.owner === viewingPlayer) return false;

  const terrain = game.map[unit.y][unit.x];
  if (!TERRAIN_GAME_PROPS[terrain as keyof typeof TERRAIN_GAME_PROPS]?.hidesUnit) return false;

  const viewerUnits = game.units.filter(u => u.owner === viewingPlayer);
  return !viewerUnits.some(v => Math.abs(v.x - unit.x) + Math.abs(v.y - unit.y) <= 1);
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
 * Filter game state for a specific player (fog of war + cave concealment)
 */
export function getClientState(game: ServerGameState, player: Player): ClientGameState {
  const visibility = calculateVisibility(game, player);
  updateExplored(game, player, visibility.explored);

  const visibleUnits: ClientUnit[] = game.units
    .filter(unit => {
      if (unit.owner === player) return true;
      if (!visibility.visible[unit.y][unit.x]) return false;
      if (isUnitConcealed(unit, game, player)) return false;
      return true;
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
  if (game.map[unit.y][unit.x] !== TERRAIN.TALL_GRASS) {
    return null;
  }

  if (Math.random() > 0.3) {
    return null;
  }

  const directions = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
    { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
  ];

  for (const dir of directions) {
    const nx = unit.x + dir.dx;
    const ny = unit.y + dir.dy;

    if (nx < 0 || nx >= game.map[0].length || ny < 0 || ny >= game.map.length) continue;

    const terrain = game.map[ny][nx];
    if (terrain === TERRAIN.WATER || terrain === TERRAIN.LAVA) continue;

    if (game.units.some(u => u.x === nx && u.y === ny)) continue;

    const wildPokemon = WILD_POKEMON_POOL[Math.floor(Math.random() * WILD_POKEMON_POOL.length)];

    return {
      pokemon: wildPokemon,
      spawnPos: { x: nx, y: ny }
    };
  }

  return null;
}

/**
 * Apply berry bush healing if unit is on a berry bush
 */
function applyBerryBush(unit: ServerUnit, game: ServerGameState): boolean {
  if (game.map[unit.y][unit.x] !== TERRAIN.BERRY_BUSH) return false;

  const healAmount = Math.floor(unit.template.hp * 0.1);
  unit.currentHp = Math.min(unit.template.hp, unit.currentHp + healAmount);

  game.map[unit.y][unit.x] = TERRAIN.GRASS;

  return true;
}

/**
 * Validate and execute a move action (uses shared Dijkstra pathfinding)
 */
export function executeMove(game: ServerGameState, playerId: Player, unitId: string, x: number, y: number): { success: boolean; encounter?: { pokemon: PokemonTemplate; spawnPos: { x: number; y: number } }; error?: string } {
  if (game.currentPlayer !== playerId) {
    return { success: false, error: 'No es tu turno' };
  }

  const unit = game.units.find(u => u.uid === unitId);
  if (!unit || unit.owner !== playerId) {
    return { success: false, error: 'Unidad no válida' };
  }

  if (unit.hasMoved) {
    return { success: false, error: 'La unidad ya se movió' };
  }

  if (x < 0 || x >= game.map[0].length || y < 0 || y >= game.map.length) {
    return { success: false, error: 'Destino fuera del mapa' };
  }

  const terrain = game.map[y]?.[x];
  if (terrain === undefined) {
    return { success: false, error: 'Terreno no válido' };
  }

  const isFlying = unit.template.types.includes('flying' as PokemonType);
  const terrainMoveCost = TERRAIN_GAME_PROPS[terrain as keyof typeof TERRAIN_GAME_PROPS]?.moveCost ?? 99;
  if (terrainMoveCost >= 99 && !isFlying) {
    return { success: false, error: 'Terreno no válido' };
  }

  if (game.units.some(u => u.x === x && u.y === y && u.uid !== unitId)) {
    return { success: false, error: 'Casilla ocupada' };
  }

  // Validate movement using shared Dijkstra pathfinding
  const validMoves = calculateMoveRange(unit, game.map as GameMap, game.units);
  const isValidMove = validMoves.some(m => m.x === x && m.y === y);
  if (!isValidMove) {
    return { success: false, error: 'Destino fuera de rango' };
  }

  // Execute move
  unit.x = x;
  unit.y = y;

  const encounter = checkWildEncounter(unit, game);

  if (encounter) {
    return { success: true, encounter };
  }

  return { success: true };
}

/**
 * Calculate damage (uses shared formulas)
 */
function calculateDamage(attacker: ServerUnit, defender: ServerUnit, terrain: number, isCounter: boolean, game: ServerGameState): { damage: number; isCritical: boolean } {
  const attackerTerrain = game.map[attacker.y][attacker.x] as TerrainType;

  const { base, effectiveness } = sharedCalculateBaseDamage(
    attacker.template.atk,
    attacker.template.types,
    attacker.template.moveType,
    defender.template.def,
    defender.template.types,
    attackerTerrain,
    terrain as TerrainType,
    isCounter
  );

  const isCritical = Math.random() < CRIT_CHANCE;
  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;
  const variance = 1 - DAMAGE_VARIANCE + Math.random() * DAMAGE_VARIANCE * 2;

  const damage = Math.max(1, Math.floor(base * critMultiplier * variance));

  return { damage, isCritical };
}

/**
 * Get next evolution for a unit (uses shared evolution logic)
 */
function getNextEvolution(unit: ServerUnit): PokemonTemplate | null {
  return sharedGetNextEvolution(unit.template, unit.kills);
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

  const distance = Math.abs(defender.x - attacker.x) + Math.abs(defender.y - attacker.y);
  if (distance > attacker.template.rng) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Fuera de rango' };
  }

  const defenderTerrain = game.map[defender.y][defender.x];
  const { damage } = calculateDamage(attacker, defender, defenderTerrain, false, game);

  defender.currentHp = Math.max(0, defender.currentHp - damage);
  const defenderDied = defender.currentHp <= 0;

  let counterDamage = 0;
  let attackerDied = false;

  if (!defenderDied) {
    const counterDistance = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
    if (counterDistance <= defender.template.rng) {
      const attackerTerrain = game.map[attacker.y][attacker.x];
      const counterResult = calculateDamage(defender, attacker, attackerTerrain, true, game);
      counterDamage = counterResult.damage;
      attacker.currentHp = Math.max(0, attacker.currentHp - counterDamage);
      attackerDied = attacker.currentHp <= 0;
    }
  }

  let evolution: { unitId: string; newTemplate: PokemonTemplate } | undefined;

  if (defenderDied && !attackerDied) {
    attacker.kills++;

    const nextEvo = getNextEvolution(attacker);
    if (nextEvo) {
      attacker.template = nextEvo;
      attacker.templateId = nextEvo.id;
      attacker.currentHp = nextEvo.hp;
      evolution = { unitId: attacker.uid, newTemplate: nextEvo };
    }
  }

  game.units = game.units.filter(u => u.currentHp > 0);

  if (!attackerDied) {
    attacker.hasMoved = true;
  }

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
 * Execute wait action (also applies berry bush healing)
 */
export function executeWait(game: ServerGameState, playerId: Player, unitId: string): { success: boolean; error?: string } {
  if (game.currentPlayer !== playerId) {
    return { success: false, error: 'No es tu turno' };
  }

  const unit = game.units.find(u => u.uid === unitId);
  if (!unit || unit.owner !== playerId) {
    return { success: false, error: 'Unidad no válida' };
  }

  applyBerryBush(unit, game);

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

  if (game.map[unit.y][unit.x] !== TERRAIN.TALL_GRASS) {
    return { success: false, captured: false, error: 'No estás en hierba alta' };
  }

  const captured = minigameSuccess !== undefined ? minigameSuccess : Math.random() < 0.3;

  if (!captured) {
    unit.hasMoved = true;
    return { success: true, captured: false };
  }

  const directions = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
    { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
  ];

  let spawnX = -1, spawnY = -1;
  for (const dir of directions) {
    const nx = unit.x + dir.dx;
    const ny = unit.y + dir.dy;
    if (nx >= 0 && nx < game.map[0].length && ny >= 0 && ny < game.map.length) {
      const terrain = game.map[ny][nx];
      if (terrain !== TERRAIN.WATER && terrain !== TERRAIN.MOUNTAIN && terrain !== TERRAIN.LAVA) {
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

  const pokemon = WILD_POKEMON_POOL[Math.floor(Math.random() * WILD_POKEMON_POOL.length)];
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
 * Check and execute end of turn (automatic)
 */
export function checkTurnEnd(game: ServerGameState): { turnEnded: boolean; nextPlayer: Player; turn: number } {
  const currentPlayerUnits = game.units.filter(u => u.owner === game.currentPlayer);
  const allMoved = currentPlayerUnits.every(u => u.hasMoved);

  if (!allMoved || currentPlayerUnits.length === 0) {
    return { turnEnded: false, nextPlayer: game.currentPlayer, turn: game.turn };
  }

  return executeTurnEnd(game);
}

/**
 * Force end turn (manual)
 */
export function executeEndTurn(game: ServerGameState, playerId: Player): { success: boolean; nextPlayer: Player; turn: number; error?: string } {
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

  game.units.forEach(u => {
    u.hasMoved = false;

    if (u.owner === nextPlayer && game.map[u.y][u.x] === TERRAIN.POKEMON_CENTER) {
      const healAmount = Math.floor(u.template.hp * 0.2);
      u.currentHp = Math.min(u.template.hp, u.currentHp + healAmount);
    }
  });

  game.currentPlayer = nextPlayer;
  game.turn = newTurn;

  return { turnEnded: true, nextPlayer, turn: newTurn };
}
