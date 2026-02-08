/**
 * Server-side game logic for PokéTactics
 * All game calculations happen here - server is authoritative
 */

import type { ServerGameState, ServerUnit, Player, ClientGameState, ClientUnit } from './types';
import type { PokemonTemplate, PokemonType, TerrainType, GameMap, Move } from '@poketactics/shared';
import {
  BOARD_WIDTH, BOARD_HEIGHT, VISION_RANGE,
  TERRAIN, TERRAIN_GAME_PROPS,
  EVOLUTION_CHAINS,
  WILD_POKEMON_POOL,
  getBalancedRandomBaseTeams,
  rollDamage,
  getCounterMove,
  initPP,
  STRUGGLE_MOVE,
  getNextEvolution as sharedGetNextEvolution,
  calculateMoveRange,
  applyStatusTick,
  STARTING_CREDITS,
  calculateDeployCost,
  applyPokemonCenterService,
  applyPokeMartService,
  createInitialCenterOwners,
  captureCenter,
  getCenterOwner,
  calculateTurnIncomeByCenters,
  playerCanStillActWithDeploy
} from '@poketactics/shared';

// Re-export for draftLogic
export { EVOLUTION_CHAINS };

/**
 * Generate initial game state
 */
export function createGameState(): ServerGameState {
  const map = generateMap();
  const { p1Team, p2Team } = generateInitialTeams();
  const emptyExplored = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));

  return {
    map,
    units: [],
    turn: 1,
    currentPlayer: 'P1',
    status: 'playing',
    winner: null,
    baseReserveP1: p1Team.map(p => ({ ...p })),
    baseReserveP2: p2Team.map(p => ({ ...p })),
    creditsP1: STARTING_CREDITS,
    creditsP2: STARTING_CREDITS,
    centerOwners: createInitialCenterOwners(map as GameMap),
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
 * Generate initial reserve teams for both players.
 */
function generateInitialTeams(): { p1Team: PokemonTemplate[]; p2Team: PokemonTemplate[] } {
  return getBalancedRandomBaseTeams(3);
}

/**
 * Create game state with specific teams (for draft mode)
 */
export function createGameStateWithTeams(p1Team: PokemonTemplate[], p2Team: PokemonTemplate[]): ServerGameState {
  const map = generateMap();
  const emptyExplored = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));

  return {
    map,
    units: [],
    turn: 1,
    currentPlayer: 'P1',
    status: 'playing',
    winner: null,
    baseReserveP1: p1Team.map(p => ({ ...p })),
    baseReserveP2: p2Team.map(p => ({ ...p })),
    creditsP1: STARTING_CREDITS,
    creditsP2: STARTING_CREDITS,
    centerOwners: createInitialCenterOwners(map as GameMap),
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
  const baseTile = getPlayerBaseTile(game, player);

  if (baseTile) {
    const baseVisionRange = 2;
    for (let y = 0; y < game.map.length; y++) {
      for (let x = 0; x < game.map[0].length; x++) {
        const distance = Math.abs(x - baseTile.x) + Math.abs(y - baseTile.y);
        if (distance <= baseVisionRange) {
          visible[y][x] = true;
          explored[y][x] = true;
        }
      }
    }
  }

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
      kills: unit.kills,
      pp: [...unit.pp],
      status: unit.status,
      statusTurns: unit.statusTurns
    }));

  return {
    map: game.map,
    units: visibleUnits,
    turn: game.turn,
    currentPlayer: game.currentPlayer,
    myPlayer: player,
    status: game.status,
    winner: game.winner,
    baseReserveP1: game.baseReserveP1.map(p => ({ ...p })),
    baseReserveP2: game.baseReserveP2.map(p => ({ ...p })),
    creditsP1: game.creditsP1,
    creditsP2: game.creditsP2,
    centerOwners: { ...game.centerOwners },
    visibility
  };
}

function getReserveForPlayer(game: ServerGameState, player: Player): PokemonTemplate[] {
  return player === 'P1' ? game.baseReserveP1 : game.baseReserveP2;
}

function getCreditsForPlayer(game: ServerGameState, player: Player): number {
  return player === 'P1' ? game.creditsP1 : game.creditsP2;
}

function setCreditsForPlayer(game: ServerGameState, player: Player, credits: number): void {
  if (player === 'P1') {
    game.creditsP1 = credits;
  } else {
    game.creditsP2 = credits;
  }
}

function getPlayerBaseTile(game: ServerGameState, player: Player): { x: number; y: number } | null {
  const bases: { x: number; y: number }[] = [];

  for (let y = 0; y < game.map.length; y++) {
    for (let x = 0; x < game.map[0].length; x++) {
      if (game.map[y][x] === TERRAIN.BASE) {
        bases.push({ x, y });
      }
    }
  }

  if (bases.length === 0) return null;

  if (player === 'P1') {
    return bases.reduce((best, tile) => (tile.x + tile.y > best.x + best.y ? tile : best), bases[0]);
  }

  return bases.reduce((best, tile) => (tile.x + tile.y < best.x + best.y ? tile : best), bases[0]);
}

function canPlayerStillFight(game: ServerGameState, player: Player): boolean {
  const hasUnits = game.units.some(u => u.owner === player);
  const hasReserve = getReserveForPlayer(game, player).length > 0;
  return hasUnits || hasReserve;
}

function updateWinnerStatus(game: ServerGameState): void {
  const p1Alive = canPlayerStillFight(game, 'P1');
  const p2Alive = canPlayerStillFight(game, 'P2');

  if (!p1Alive && !p2Alive) {
    game.winner = null;
    game.status = 'finished';
    return;
  }

  if (!p1Alive) {
    game.winner = 'P2';
    game.status = 'finished';
    return;
  }

  if (!p2Alive) {
    game.winner = 'P1';
    game.status = 'finished';
    return;
  }
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
    if (terrain === TERRAIN.WATER || terrain === TERRAIN.MOUNTAIN || terrain === TERRAIN.LAVA) continue;

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
 * Roll damage/status using shared server-authoritative combat logic.
 */
function calculateDamage(attacker: ServerUnit, defender: ServerUnit, move: Move, isCounter: boolean, game: ServerGameState) {
  const attackerTerrain = game.map[attacker.y][attacker.x] as TerrainType;
  const defenderTerrain = game.map[defender.y][defender.x] as TerrainType;

  return rollDamage({
    move,
    attackerTemplate: attacker.template,
    attackerTypes: attacker.template.types,
    defenderTemplate: defender.template,
    defenderTypes: defender.template.types,
    attackerTerrain,
    defenderTerrain,
    isCounter,
    attackerStatus: attacker.status,
    defenderStatus: defender.status,
    attackerAbility: attacker.template.ability,
    defenderAbility: defender.template.ability,
    attackerCurrentHp: attacker.currentHp,
    attackerMaxHp: attacker.template.hp,
    defenderCurrentHp: defender.currentHp,
    defenderMaxHp: defender.template.hp
  });
}

/**
 * Get next evolution for a unit (uses shared evolution logic)
 */
function getNextEvolution(unit: ServerUnit): PokemonTemplate | null {
  return sharedGetNextEvolution(unit.template, unit.kills);
}

/**
 * Execute attack action with move selection
 */
export function executeAttack(game: ServerGameState, playerId: Player, attackerId: string, defenderId: string, moveId?: string): {
  success: boolean;
  moveId?: string;
  counterMoveId?: string;
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
  if (attacker.hasMoved) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'La unidad ya se movió' };
  }

  if (!defender || defender.owner === playerId) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Defensor no válido' };
  }

  const distance = Math.abs(defender.x - attacker.x) + Math.abs(defender.y - attacker.y);

  // Find the move to use
  let move: Move;
  let moveIndex: number;
  if (moveId) {
    moveIndex = attacker.template.moves.findIndex(m => m.id === moveId);
    if (moveIndex === -1) {
      return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Movimiento no válido' };
    }
    move = attacker.template.moves[moveIndex];
    if (attacker.pp[moveIndex] <= 0) {
      return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Sin PP' };
    }
  } else {
    // Fallback: use first attack move in range (backwards compatibility)
    const attackMoves = attacker.template.moves
      .map((m, i) => ({ move: m, index: i }))
      .filter(({ move: m, index: i }) => m.category !== 'status' && m.range >= distance && attacker.pp[i] > 0);
    if (attackMoves.length === 0) {
      move = STRUGGLE_MOVE;
      moveIndex = -1;
    } else {
      move = attackMoves[0].move;
      moveIndex = attackMoves[0].index;
    }
  }

  // Validate range
  if (distance > move.range) {
    return { success: false, damage: 0, counterDamage: 0, attackerDied: false, defenderDied: false, error: 'Fuera de rango' };
  }

  const usedMoveId = move.id;

  // Deduct PP
  if (moveIndex >= 0) {
    attacker.pp[moveIndex]--;
  }

  const attackRoll = calculateDamage(attacker, defender, move, false, game);
  const damage = attackRoll.damage;

  defender.currentHp = Math.max(0, defender.currentHp - damage);
  const defenderDied = defender.currentHp <= 0;
  if (attackRoll.statusApplied && !defender.status && !defenderDied) {
    defender.status = attackRoll.statusApplied;
    defender.statusTurns = 0;
  }

  let counterDamage = 0;
  let attackerDied = false;
  let counterMoveId: string | undefined;

  // Counter-attack (priority moves prevent counter)
  if (!defenderDied && move.priority <= 0) {
    const counterResult = getCounterMove(defender.template, distance, defender.pp);
    if (counterResult) {
      const { move: counterMove, moveIndex: counterIdx } = counterResult;
      counterMoveId = counterMove.id;
      // Deduct counter PP
      defender.pp[counterIdx]--;
      const counterRoll = calculateDamage(defender, attacker, counterMove, true, game);
      counterDamage = counterRoll.damage;
      attacker.currentHp = Math.max(0, attacker.currentHp - counterDamage);
      attackerDied = attacker.currentHp <= 0;
      if (counterRoll.statusApplied && !attacker.status && !attackerDied) {
        attacker.status = counterRoll.statusApplied;
        attacker.statusTurns = 0;
      }
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
      attacker.pp = initPP(nextEvo);
      attacker.status = null;
      attacker.statusTurns = 0;
      evolution = { unitId: attacker.uid, newTemplate: nextEvo };
    }
  }

  game.units = game.units.filter(u => u.currentHp > 0);

  if (!attackerDied) {
    attacker.hasMoved = true;
  }

  updateWinnerStatus(game);

  return {
    success: true,
    moveId: usedMoveId,
    counterMoveId,
    damage,
    counterDamage,
    attackerDied,
    defenderDied,
    evolution
  };
}

/**
 * Deploy a Pokemon from base reserve to the player's base tile.
 */
export function executeDeploy(game: ServerGameState, playerId: Player, templateId: number): { success: boolean; newUnit?: ServerUnit; error?: string } {
  if (game.currentPlayer !== playerId) {
    return { success: false, error: 'No es tu turno' };
  }

  const reserve = getReserveForPlayer(game, playerId);
  const reserveIndex = reserve.findIndex(p => p.id === templateId);
  if (reserveIndex === -1) {
    return { success: false, error: 'Pokémon no disponible en base' };
  }

  const baseTile = getPlayerBaseTile(game, playerId);
  if (!baseTile) {
    return { success: false, error: 'No hay base en este mapa' };
  }

  if (game.units.some(u => u.x === baseTile.x && u.y === baseTile.y)) {
    return { success: false, error: 'La base está ocupada' };
  }

  const template = reserve[reserveIndex];
  const deployCost = calculateDeployCost(template);
  const currentCredits = getCreditsForPlayer(game, playerId);
  if (currentCredits < deployCost) {
    return { success: false, error: `Créditos insuficientes (${currentCredits}/${deployCost})` };
  }

  const newUnit: ServerUnit = {
    uid: `${playerId}-dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    owner: playerId,
    templateId: template.id,
    template: { ...template },
    x: baseTile.x,
    y: baseTile.y,
    currentHp: template.hp,
    hasMoved: true,
    kills: 0,
    pp: initPP(template),
    status: null,
    statusTurns: 0
  };

  reserve.splice(reserveIndex, 1);
  game.units.push(newUnit);
  setCreditsForPlayer(game, playerId, currentCredits - deployCost);

  return { success: true, newUnit };
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
  if (unit.hasMoved) {
    return { success: false, error: 'La unidad ya se movió' };
  }

  applyBerryBush(unit, game);

  const terrain = game.map[unit.y]?.[unit.x];

  if (terrain === TERRAIN.POKEMON_CENTER) {
    const ownerBeforeCapture = getCenterOwner(game.centerOwners, unit.x, unit.y);
    if (ownerBeforeCapture !== playerId) {
      game.centerOwners = captureCenter(game.centerOwners, unit.x, unit.y, playerId);
    }

    // Healing is only available when the center already belongs to the acting player.
    // If it was neutral/enemy, this action captures it but does not heal in the same wait.
    if (ownerBeforeCapture === playerId) {
      const credits = getCreditsForPlayer(game, playerId);
      const service = applyPokemonCenterService({
        template: unit.template,
        currentHp: unit.currentHp,
        pp: unit.pp,
        status: unit.status,
        statusTurns: unit.statusTurns,
        availableCredits: credits
      });

      if (service.creditsSpent > 0) {
        unit.currentHp = service.newHp;
        unit.pp = service.newPp;
        unit.status = service.newStatus;
        unit.statusTurns = service.newStatusTurns;
        setCreditsForPlayer(game, playerId, credits - service.creditsSpent);
      }
    }
  }

  if (terrain === TERRAIN.RUINS) {
    const credits = getCreditsForPlayer(game, playerId);
    const service = applyPokeMartService({
      template: unit.template,
      currentHp: unit.currentHp,
      pp: unit.pp,
      status: unit.status,
      statusTurns: unit.statusTurns,
      availableCredits: credits
    });

    if (service.creditsSpent > 0) {
      unit.currentHp = service.newHp;
      unit.pp = service.newPp;
      unit.status = service.newStatus;
      unit.statusTurns = service.newStatusTurns;
      setCreditsForPlayer(game, playerId, credits - service.creditsSpent);
    }
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
  if (unit.hasMoved) {
    return { success: false, captured: false, error: 'La unidad ya se movió' };
  }

  if (game.map[unit.y][unit.x] !== TERRAIN.TALL_GRASS) {
    return { success: false, captured: false, error: 'No estás en hierba alta' };
  }

  const captured = minigameSuccess !== undefined ? minigameSuccess : Math.random() < 0.3;

  if (!captured) {
    unit.hasMoved = true;
    return { success: true, captured: false };
  }

  const pokemon = WILD_POKEMON_POOL[Math.floor(Math.random() * WILD_POKEMON_POOL.length)];
  const reserve = getReserveForPlayer(game, playerId);
  reserve.push({ ...pokemon });
  unit.hasMoved = true;

  return { success: true, captured: true, pokemon };
}

/**
 * Check and execute end of turn (automatic)
 */
export function checkTurnEnd(game: ServerGameState): { turnEnded: boolean; nextPlayer: Player; turn: number } {
  const reserve = getReserveForPlayer(game, game.currentPlayer);
  const credits = getCreditsForPlayer(game, game.currentPlayer);
  const canStillAct = playerCanStillActWithDeploy(
    game.map as GameMap,
    game.units.map(unit => ({ owner: unit.owner, x: unit.x, y: unit.y, hasMoved: unit.hasMoved })),
    reserve,
    credits,
    game.currentPlayer
  );

  if (canStillAct) {
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

    // Apply status ticks for incoming player's units
    if (u.owner === nextPlayer && u.status) {
      const statusResult = applyStatusTick(u.status, u.statusTurns, u.template.hp, u.currentHp);
      u.currentHp = statusResult.newHp;
      u.status = statusResult.newStatus;
      u.statusTurns = statusResult.newStatusTurns;
      if (statusResult.cantAct && u.currentHp > 0) {
        u.hasMoved = true;
      }
    }
  });

  // Remove dead units (from status damage)
  game.units = game.units.filter(u => u.currentHp > 0);

  const turnIncome = calculateTurnIncomeByCenters(
    game.map as GameMap,
    game.centerOwners,
    nextPlayer
  );
  const nextPlayerCredits = getCreditsForPlayer(game, nextPlayer) + turnIncome;
  setCreditsForPlayer(game, nextPlayer, nextPlayerCredits);

  game.currentPlayer = nextPlayer;
  game.turn = newTurn;

  updateWinnerStatus(game);

  return { turnEnded: true, nextPlayer, turn: newTurn };
}
