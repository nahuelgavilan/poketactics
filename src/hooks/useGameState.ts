import { useState, useMemo, useCallback } from 'react';
import { TERRAIN } from '../constants/terrain';
import { getNextEvolution, getBalancedRandomBaseTeams } from '../constants/evolution';
import { calculateMoveRange, calculateAttackRange } from '../utils/pathfinding';
import { createBattleData } from '../utils/combat';
import { triggerWildEncounter } from '../utils/capture';
import { generateRandomMap, DEFAULT_MAP_SIZE } from '../utils/mapGenerator';
import {
  applyStatusTick,
  initPP,
  STARTING_CREDITS,
  calculateDeployCost,
  applyPokemonCenterService,
  applyPokeMartService,
  createInitialCenterOwners,
  captureCenter,
  getCenterOwner,
  calculateTurnIncomeByCenters,
  playerCanStillActWithDeploy,
  CENTER_REPAIR_COST_PER_HP,
  CENTER_RESUPPLY_COST_PER_PP,
  CENTER_STATUS_CURE_COST,
  POKEMART_MAX_POTION_COST,
  POKEMART_ELIXIR_COST,
  POKEMART_FULL_HEAL_COST,
  SHOWDOWN_SERVICE_ITEMS,
  buildPositionIndex,
  buildPositionSet,
  toPositionKey,
} from '@poketactics/shared';
import type {
  GameState,
  GamePhase,
  GameMap,
  Unit,
  Player,
  Position,
  AttackTarget,
  BattleData,
  CaptureData,
  TerrainType,
  EvolutionData,
  PokemonTemplate,
  Move
} from '../types/game';

interface UseGameStateReturn {
  // State
  map: GameMap;
  units: Unit[];
  turn: number;
  currentPlayer: Player;
  gameState: GameState;
  gamePhase: GamePhase;
  selectedUnit: Unit | null;
  moveRange: Position[];
  attackRange: AttackTarget[];
  pendingPosition: Position | null;
  battleData: BattleData | null;
  captureData: CaptureData | null;
  evolutionData: EvolutionData | null;
  logs: string[];
  winner: Player | null;
  exploredP1: boolean[][];
  exploredP2: boolean[][];
  baseReserveP1: PokemonTemplate[];
  baseReserveP2: PokemonTemplate[];
  creditsP1: number;
  creditsP2: number;
  centerOwners: Record<string, Player | null>;
  deployBase: Position | null;

  // Multiplayer state
  myPlayer: Player | null;
  isMultiplayer: boolean;
  isMyTurn: boolean;

  // Actions
  initGame: (width?: number, height?: number) => void;
  initGameWithTeams: (p1Team: PokemonTemplate[], p2Team: PokemonTemplate[], width?: number, height?: number) => void;
  initGameWithMap: (customMap: GameMap) => void;
  initMultiplayerGame: (player: Player) => void;
  handleTileClick: (x: number, y: number) => void;
  endBattle: () => void;
  confirmBattleZoom: () => void;
  onCaptureMinigameSuccess: (damageTaken: number, ppUsed: number[]) => void;
  onCaptureMinigameFail: (damageTaken: number, ppUsed: number[]) => void;
  onCaptureMinigameFlee: (damageTaken: number, ppUsed: number[]) => void;
  confirmCapture: () => void;
  confirmEvolution: () => void;
  confirmTurnChange: () => void;
  triggerTurnTransition: () => void;
  updateExplored: (player: Player, explored: boolean[][]) => void;
  setMultiplayerState: (state: MultiplayerGameState) => void;
  // Action menu
  selectAttack: () => void;
  selectWait: () => void;
  cancelAction: () => void;
  // Move selection
  selectedMove: Move | null;
  attackTarget: Unit | null;
  selectMove: (move: Move) => void;
  cancelMoveSelect: () => void;
  deployFromBase: (templateId: number) => void;
  cancelDeploySelect: () => void;
  // Multiplayer battle (triggered by server result)
  startServerBattle: (attackerId: string, defenderId: string, damage: number, counterDamage: number) => void;
  // Multiplayer encounter
  triggerMultiplayerEncounter: (unit: Unit) => boolean;
  // Multiplayer evolution (triggered by server result)
  triggerServerEvolution: (unitId: string, newTemplate: PokemonTemplate) => void;
  // Multiplayer encounter (from server)
  triggerServerEncounter: (pokemon: PokemonTemplate, spawnPos: Position, player: Player) => void;
  // Multiplayer battle with zoom (from server)
  triggerServerBattleWithZoom: (
    attacker: Unit,
    defender: Unit,
    damage: number,
    counterDamage: number,
    attackerMove?: Move,
    defenderMove?: Move | null
  ) => void;
  // Optimistic update for multiplayer
  updateUnitsOptimistic: (unitId: string, x: number, y: number) => void;
  // Timer auto-wait
  autoWaitAllUnits: () => void;
}

// State received from server in multiplayer
interface MultiplayerGameState {
  map: GameMap;
  units: Unit[];
  turn: number;
  currentPlayer: Player;
  myPlayer: Player;
  status: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
  baseReserveP1: PokemonTemplate[];
  baseReserveP2: PokemonTemplate[];
  creditsP1: number;
  creditsP2: number;
  centerOwners: Record<string, Player | null>;
  visibility: {
    visible: boolean[][];
    explored: boolean[][];
  };
}


export function useGameState(): UseGameStateReturn {
  const [map, setMap] = useState<GameMap>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [turn, setTurn] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('P1');
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gamePhase, setGamePhase] = useState<GamePhase>('SELECT');

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [moveRange, setMoveRange] = useState<Position[]>([]);
  const [attackRange, setAttackRange] = useState<AttackTarget[]>([]);

  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [captureData, setCaptureData] = useState<CaptureData | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [attackTarget, setAttackTarget] = useState<Unit | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  // Fog of War - explored tiles per player
  const [exploredP1, setExploredP1] = useState<boolean[][]>([]);
  const [exploredP2, setExploredP2] = useState<boolean[][]>([]);
  const [baseReserveP1, setBaseReserveP1] = useState<PokemonTemplate[]>([]);
  const [baseReserveP2, setBaseReserveP2] = useState<PokemonTemplate[]>([]);
  const [creditsP1, setCreditsP1] = useState(STARTING_CREDITS);
  const [creditsP2, setCreditsP2] = useState(STARTING_CREDITS);
  const [centerOwners, setCenterOwners] = useState<Record<string, Player | null>>({});
  const [deployBase, setDeployBase] = useState<Position | null>(null);

  // Track if unit has moved this action (for action menu state)
  const [unitHasMoved, setUnitHasMoved] = useState(false);

  // Pending position - where unit WILL move (preview, not confirmed yet)
  const [pendingPosition, setPendingPosition] = useState<Position | null>(null);

  // Multiplayer state - which player "I" am
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Computed: is it my turn?
  const isMyTurn = !isMultiplayer || myPlayer === currentPlayer;
  const unitByPosition = useMemo(() => buildPositionIndex(units), [units]);
  const moveRangeSet = useMemo(() => buildPositionSet(moveRange), [moveRange]);
  const attackRangeSet = useMemo(() => buildPositionSet(attackRange), [attackRange]);

  const getPlayerBaseTile = useCallback((currentMap: GameMap, player: Player): Position | null => {
    const bases: Position[] = [];
    for (let y = 0; y < currentMap.length; y++) {
      for (let x = 0; x < (currentMap[0]?.length ?? 0); x++) {
        if (currentMap[y][x] === TERRAIN.BASE) {
          bases.push({ x, y });
        }
      }
    }
    if (bases.length === 0) return null;
    if (player === 'P1') {
      return bases.reduce((best, tile) => (tile.x + tile.y > best.x + best.y ? tile : best), bases[0]);
    }
    return bases.reduce((best, tile) => (tile.x + tile.y < best.x + best.y ? tile : best), bases[0]);
  }, []);
  const playerBaseTiles = useMemo<Record<Player, Position | null>>(() => ({
    P1: getPlayerBaseTile(map, 'P1'),
    P2: getPlayerBaseTile(map, 'P2'),
  }), [map, getPlayerBaseTile]);

  const resolveWinner = useCallback((
    currentUnits: Unit[],
    reserveP1: PokemonTemplate[],
    reserveP2: PokemonTemplate[]
  ): Player | null => {
    const p1Alive = currentUnits.some(u => u.owner === 'P1') || reserveP1.length > 0;
    const p2Alive = currentUnits.some(u => u.owner === 'P2') || reserveP2.length > 0;
    if (!p1Alive && p2Alive) return 'P2';
    if (!p2Alive && p1Alive) return 'P1';
    return null;
  }, []);

  const getCreditsForPlayer = useCallback((player: Player): number => {
    return player === 'P1' ? creditsP1 : creditsP2;
  }, [creditsP1, creditsP2]);

  const setCreditsForPlayer = useCallback((player: Player, credits: number) => {
    if (player === 'P1') {
      setCreditsP1(credits);
    } else {
      setCreditsP2(credits);
    }
  }, []);

  const canPlayerStillAct = useCallback((
    player: Player,
    currentUnits: Unit[],
    reserveP1: PokemonTemplate[],
    reserveP2: PokemonTemplate[],
    p1Credits: number,
    p2Credits: number
  ): boolean => {
    const reserve = player === 'P1' ? reserveP1 : reserveP2;
    const credits = player === 'P1' ? p1Credits : p2Credits;

    return playerCanStillActWithDeploy(
      map,
      currentUnits.map(unit => ({ owner: unit.owner, x: unit.x, y: unit.y, hasMoved: unit.hasMoved })),
      reserve,
      credits,
      player
    );
  }, [map]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [message, ...prev]);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    setPendingPosition(null);
    setDeployBase(null);
    setGamePhase('SELECT');
    setUnitHasMoved(false);
    setSelectedMove(null);
    setAttackTarget(null);
  }, []);

  const initGame = useCallback((width?: number, height?: number) => {
    const w = width ?? DEFAULT_MAP_SIZE.width;
    const h = height ?? DEFAULT_MAP_SIZE.height;

    const newMap = generateRandomMap(w, h);
    setMap(newMap);

    const { p1Team, p2Team } = getBalancedRandomBaseTeams(3);

    setUnits([]);
    setBaseReserveP1(p1Team);
    setBaseReserveP2(p2Team);
    setCreditsP1(STARTING_CREDITS);
    setCreditsP2(STARTING_CREDITS);
    setCenterOwners(createInitialCenterOwners(newMap));
    setTurn(1);
    setCurrentPlayer('P1');
    setGameState('playing');
    setGamePhase('SELECT');
    setLogs(['¡Empieza el combate!', 'Despliega tu equipo desde la Base.', '¡Usa la Hierba Alta para capturar!']);
    setWinner(null);

    // Initialize fog of war
    const emptyExplored = Array(h)
      .fill(null)
      .map(() => Array(w).fill(false));
    setExploredP1([...emptyExplored.map(row => [...row])]);
    setExploredP2([...emptyExplored.map(row => [...row])]);

    resetSelection();
  }, [resetSelection]);

  // Initialize game with pre-selected teams (from draft)
  const initGameWithTeams = useCallback((p1Team: PokemonTemplate[], p2Team: PokemonTemplate[], width?: number, height?: number) => {
    const w = width ?? DEFAULT_MAP_SIZE.width;
    const h = height ?? DEFAULT_MAP_SIZE.height;

    const newMap = generateRandomMap(w, h);
    setMap(newMap);

    setUnits([]);
    setBaseReserveP1([...p1Team]);
    setBaseReserveP2([...p2Team]);
    setCreditsP1(STARTING_CREDITS);
    setCreditsP2(STARTING_CREDITS);
    setCenterOwners(createInitialCenterOwners(newMap));
    setTurn(1);
    setCurrentPlayer('P1');
    setGameState('playing');
    setGamePhase('SELECT');
    setLogs(['¡Empieza el combate!', '¡Equipos seleccionados por draft!', 'Despliega tu equipo desde la Base.']);
    setWinner(null);

    // Initialize fog of war
    const emptyExplored = Array(h)
      .fill(null)
      .map(() => Array(w).fill(false));
    setExploredP1([...emptyExplored.map(row => [...row])]);
    setExploredP2([...emptyExplored.map(row => [...row])]);

    resetSelection();
  }, [resetSelection]);

  // Initialize game with a custom map (from map editor)
  const initGameWithMap = useCallback((customMap: GameMap) => {
    const h = customMap.length;
    const w = customMap[0]?.length ?? 0;

    setMap(customMap);

    const { p1Team, p2Team } = getBalancedRandomBaseTeams(3);

    setUnits([]);
    setBaseReserveP1(p1Team);
    setBaseReserveP2(p2Team);
    setCreditsP1(STARTING_CREDITS);
    setCreditsP2(STARTING_CREDITS);
    setCenterOwners(createInitialCenterOwners(customMap));
    setTurn(1);
    setCurrentPlayer('P1');
    setGameState('playing');
    setGamePhase('SELECT');
    setLogs(['¡Empieza el combate!', '¡Mapa personalizado!', 'Despliega tu equipo desde la Base.']);
    setWinner(null);

    // Initialize fog of war
    const emptyExplored = Array(h)
      .fill(null)
      .map(() => Array(w).fill(false));
    setExploredP1([...emptyExplored.map(row => [...row])]);
    setExploredP2([...emptyExplored.map(row => [...row])]);

    resetSelection();
  }, [resetSelection]);

  // Initialize multiplayer game - called when joining a room
  const initMultiplayerGame = useCallback((player: Player) => {
    setMyPlayer(player);
    setIsMultiplayer(true);
    setBaseReserveP1([]);
    setBaseReserveP2([]);
    setCreditsP1(STARTING_CREDITS);
    setCreditsP2(STARTING_CREDITS);
    setCenterOwners({});
    setGameState('playing');
    setGamePhase('SELECT');
    resetSelection();
  }, [resetSelection]);

  // Set multiplayer state from server - syncs game state
  const setMultiplayerState = useCallback((state: MultiplayerGameState) => {
    setMap(state.map);
    setUnits(state.units);
    setBaseReserveP1(state.baseReserveP1 ?? []);
    setBaseReserveP2(state.baseReserveP2 ?? []);
    setCreditsP1(state.creditsP1 ?? STARTING_CREDITS);
    setCreditsP2(state.creditsP2 ?? STARTING_CREDITS);
    setCenterOwners(state.centerOwners ?? createInitialCenterOwners(state.map));
    setTurn(state.turn);
    setCurrentPlayer(state.currentPlayer);
    setMyPlayer(state.myPlayer);
    setIsMultiplayer(true);

    if (state.winner) {
      setWinner(state.winner);
      setGameState('victory');
    } else if (state.status === 'playing') {
      setGameState('playing');
      // Reset to SELECT phase - server has processed the action
      setGamePhase('SELECT');
      // Clear any local selection state
      setSelectedUnit(null);
      setMoveRange([]);
      setAttackRange([]);
      setPendingPosition(null);
      setDeployBase(null);
      setUnitHasMoved(false);
      setSelectedMove(null);
      setAttackTarget(null);
    }

    // Update explored tiles based on server visibility
    if (state.visibility && state.visibility.explored) {
      if (state.myPlayer === 'P1') {
        setExploredP1(state.visibility.explored);
      } else {
        setExploredP2(state.visibility.explored);
      }
    }
  }, []);

  // Mark unit as having completed their turn
  const waitUnit = useCallback((
    uid: string,
    currentUnits: Unit[],
    overrides?: {
      reserveP1?: PokemonTemplate[];
      reserveP2?: PokemonTemplate[];
      creditsP1?: number;
      creditsP2?: number;
    }
  ) => {
    const nextUnits = currentUnits.map(u =>
      u.uid === uid ? { ...u, hasMoved: true } : u
    );
    setUnits(nextUnits);
    resetSelection();

    const nextReserveP1 = overrides?.reserveP1 ?? baseReserveP1;
    const nextReserveP2 = overrides?.reserveP2 ?? baseReserveP2;
    const nextCreditsP1 = overrides?.creditsP1 ?? creditsP1;
    const nextCreditsP2 = overrides?.creditsP2 ?? creditsP2;

    if (!canPlayerStillAct(currentPlayer, nextUnits, nextReserveP1, nextReserveP2, nextCreditsP1, nextCreditsP2)) {
      // Auto-trigger turn transition after a brief delay for feedback
      setTimeout(() => {
        setGameState('transition');
      }, 300);
    }
  }, [resetSelection, currentPlayer, canPlayerStillAct, baseReserveP1, baseReserveP2, creditsP1, creditsP2]);

  // Try to trigger random encounter on tall grass (30% chance)
  const tryRandomEncounter = useCallback((unit: Unit, currentUnits: Unit[], currentMap: GameMap): boolean => {
    const isOnTallGrass = currentMap[unit.y][unit.x] === TERRAIN.TALL_GRASS;
    if (!isOnTallGrass) return false;

    // 30% chance of encounter
    if (Math.random() > 0.3) return false;

    const encounter = triggerWildEncounter(unit, currentMap, currentUnits);
    if (encounter) {
      setGameState('capture_minigame');
      setCaptureData(encounter);
      return true;
    }
    return false;
  }, []);

  // Handle tile clicks based on current phase (Advance Wars style - no menu)
  const handleTileClick = useCallback((x: number, y: number) => {
    if (gameState !== 'playing') return;

    // Block input when it's not your turn in multiplayer
    if (isMultiplayer && !isMyTurn) return;

    const tileKey = toPositionKey(x, y);
    const clickedUnit = unitByPosition.get(tileKey);

    // Helper: Check if clicking on own unit that can act
    const isOwnActiveUnit = (unit: Unit | undefined) =>
      unit && unit.owner === currentPlayer && !unit.hasMoved;

    // Phase: SELECT - clicking units to select them
    if (gamePhase === 'SELECT') {
      if (isOwnActiveUnit(clickedUnit)) {
        setSelectedUnit(clickedUnit!);
        setUnitHasMoved(false);
        // Show move range immediately (Advance Wars style)
        const moves = calculateMoveRange(clickedUnit!, map, units);
        setMoveRange(moves);
        setAttackRange([]);
        setGamePhase('MOVING');
        return;
      }

      const playerReserve = currentPlayer === 'P1' ? baseReserveP1 : baseReserveP2;
      if (!clickedUnit && playerReserve.length > 0) {
        const baseTile = playerBaseTiles[currentPlayer];
        if (baseTile && baseTile.x === x && baseTile.y === y) {
          setDeployBase(baseTile);
          setGamePhase('DEPLOY_SELECT');
        }
      }
      return;
    }

    if (gamePhase === 'DEPLOY_SELECT') {
      if (deployBase && deployBase.x === x && deployBase.y === y) return;
      setDeployBase(null);
      setGamePhase('SELECT');
      return;
    }

    // Phase: MOVING - selecting move destination
    if (gamePhase === 'MOVING' && selectedUnit) {
      // Click on different own unit: switch to it
      if (isOwnActiveUnit(clickedUnit) && clickedUnit!.uid !== selectedUnit.uid) {
        setSelectedUnit(clickedUnit!);
        setUnitHasMoved(false);
        const moves = calculateMoveRange(clickedUnit!, map, units);
        setMoveRange(moves);
        setAttackRange([]);
        return;
      }

      // Click on current position OR valid move destination: show preview with action menu
      const isCurrentPosition = x === selectedUnit.x && y === selectedUnit.y;
      const isValidDestination = moveRangeSet.has(tileKey);

      if (isCurrentPosition || isValidDestination) {
        // Set pending position (where unit WILL move, not confirmed yet)
        setPendingPosition({ x, y });

        // Create virtual unit at pending position to calculate attack range
        const virtualUnit = { ...selectedUnit, x, y };

        // Calculate attacks from the pending position (not current!)
        const attacks = calculateAttackRange(virtualUnit, units);
        setAttackRange(attacks);

        // Keep moveRange visible during ACTION_MENU for context
        // Don't clear it yet - setMoveRange([]);

        setGamePhase('ACTION_MENU');
        return;
      }

      // Click elsewhere: cancel selection
      resetSelection();
      return;
    }

    // Phase: ACTION_MENU - can click another tile to change destination
    if (gamePhase === 'ACTION_MENU' && selectedUnit) {
      const isCurrentPosition = x === selectedUnit.x && y === selectedUnit.y;
      const isValidDestination = moveRangeSet.has(tileKey);

      // Click on valid tile (including current position): change pending destination
      if (isCurrentPosition || isValidDestination) {
        setPendingPosition({ x, y });

        // Recalculate attacks from new position
        const virtualUnit = { ...selectedUnit, x, y };
        const attacks = calculateAttackRange(virtualUnit, units);
        setAttackRange(attacks);
        return;
      }

      // Click elsewhere: cancel and go back to MOVING
      setPendingPosition(null);
      setAttackRange([]);
      setGamePhase('MOVING');
      return;
    }

    // Phase: ATTACKING - selecting attack target
    if (gamePhase === 'ATTACKING' && selectedUnit) {
      // Click on valid target: go to move selection
      if (attackRangeSet.has(tileKey)) {
        const target = unitByPosition.get(tileKey);
        if (target) {
          setAttackTarget(target);
          setAttackRange([]);
          setGamePhase('MOVE_SELECT');
        }
        return;
      }

      // Click elsewhere: if already moved, just wait; otherwise cancel
      if (unitHasMoved) {
        waitUnit(selectedUnit.uid, units);
      } else {
        resetSelection();
      }
      return;
    }

    // Phase: MOVE_SELECT - waiting for move picker (no tile clicks needed)
    if (gamePhase === 'MOVE_SELECT') {
      // Click elsewhere: go back to attacking
      if (selectedUnit) {
        const attacks = calculateAttackRange(selectedUnit, units);
        setAttackRange(attacks);
        setAttackTarget(null);
        setGamePhase('ATTACKING');
      }
      return;
    }
  }, [
    gameState,
    gamePhase,
    units,
    currentPlayer,
    selectedUnit,
    map,
    unitHasMoved,
    waitUnit,
    resetSelection,
    isMultiplayer,
    isMyTurn,
    baseReserveP1,
    baseReserveP2,
    deployBase,
    unitByPosition,
    moveRangeSet,
    attackRangeSet,
    playerBaseTiles,
  ]);

  const endBattle = useCallback(() => {
    if (!battleData) return;

    const { defender, attacker, attackerResult, defenderResult, attackerMove, defenderMove } = battleData;
    const attackerDamage = attackerResult.damage;
    const counterDamage = defenderResult?.damage || 0;

    // Check if defender died
    const defenderDied = defender.currentHp - attackerDamage <= 0;
    // Check if attacker died from counter
    const attackerDied = defenderResult && attacker.currentHp - counterDamage <= 0;

    // Apply damage, PP deduction, and status effects
    let nextUnits = units.map(u => {
      if (u.uid === attacker.uid) {
        // Deduct PP for attacker's move
        const moveIndex = u.template.moves.findIndex(m => m.id === attackerMove.id);
        const newPP = [...u.pp];
        if (moveIndex >= 0 && newPP[moveIndex] > 0) newPP[moveIndex]--;

        let updated = { ...u, pp: newPP };
        // Apply counter damage
        if (defenderResult) {
          updated = { ...updated, currentHp: Math.max(0, u.currentHp - counterDamage) };
        }
        // Apply status from counter (if any)
        if (defenderResult?.statusApplied && !u.status) {
          updated = { ...updated, status: defenderResult.statusApplied, statusTurns: 0 };
        }
        return updated;
      }
      if (u.uid === defender.uid) {
        let updated = { ...u, currentHp: Math.max(0, u.currentHp - attackerDamage) };
        // Deduct PP for defender's counter move
        if (defenderMove && defenderResult) {
          const moveIndex = u.template.moves.findIndex(m => m.id === defenderMove.id);
          const newPP = [...u.pp];
          if (moveIndex >= 0 && newPP[moveIndex] > 0) newPP[moveIndex]--;
          updated = { ...updated, pp: newPP };
        }
        // Apply status from attacker's move (if any)
        if (attackerResult.statusApplied && !u.status) {
          updated = { ...updated, status: attackerResult.statusApplied, statusTurns: 0 };
        }
        return updated;
      }
      return u;
    });

    // Track kills if defender died
    let newKillCount = 0;
    if (defenderDied) {
      nextUnits = nextUnits.map(u => {
        if (u.uid === attacker.uid) {
          newKillCount = u.kills + 1;
          return { ...u, kills: newKillCount };
        }
        return u;
      });
    }

    // Remove dead units
    nextUnits = nextUnits.filter(u => u.currentHp > 0);

    // Add combat log
    if (attackerResult.isCritical) {
      addLog(`¡${attacker.template.name} dio un golpe crítico!`);
    }
    if (defenderResult?.isCritical) {
      addLog(`¡${defender.template.name} contraatacó con crítico!`);
    } else if (defenderResult) {
      addLog(`¡${defender.template.name} contraatacó!`);
    }

    setUnits(nextUnits);
    setBattleData(null);

    const nextWinner = resolveWinner(nextUnits, baseReserveP1, baseReserveP2);
    if (nextWinner) {
      setWinner(nextWinner);
      setGameState('victory');
      return;
    }

    // Check for evolution if attacker survived and got a kill
    if (!attackerDied && defenderDied) {
      const survivingAttacker = nextUnits.find(u => u.uid === attacker.uid);
      if (survivingAttacker) {
        const nextEvolution = getNextEvolution(survivingAttacker.template, newKillCount);
        if (nextEvolution) {
          // Trigger evolution cinematic
          setEvolutionData({
            unitId: survivingAttacker.uid,
            fromTemplate: survivingAttacker.template,
            toTemplate: nextEvolution
          });
          setGameState('evolution');
          return;
        }
      }
    }

    setGameState('playing');

    // After battle, mark attacker as moved (if they survived)
    if (!attackerDied) {
      waitUnit(attacker.uid, nextUnits);
    } else {
      // Attacker died - check if all remaining player units have moved
      resetSelection();

      if (!canPlayerStillAct(currentPlayer, nextUnits, baseReserveP1, baseReserveP2, creditsP1, creditsP2)) {
        // Auto-trigger turn transition
        setTimeout(() => {
          setGameState('transition');
        }, 300);
      }
    }
  }, [
    battleData,
    units,
    waitUnit,
    addLog,
    resetSelection,
    currentPlayer,
    resolveWinner,
    baseReserveP1,
    baseReserveP2,
    canPlayerStillAct,
    creditsP1,
    creditsP2
  ]);

  // Called when minigame succeeds - show capture celebration
  // Apply damage taken from wild Pokemon counter-attack and PP usage
  const onCaptureMinigameSuccess = useCallback((damageTaken: number, ppUsed: number[]) => {
    if (selectedUnit) {
      setUnits(prev => prev.map(u => {
        if (u.uid !== selectedUnit.uid) return u;
        const newHp = damageTaken > 0 ? Math.max(1, u.currentHp - damageTaken) : u.currentHp;
        const newPP = ppUsed.length > 0 ? u.pp.map((p, i) => Math.max(0, p - (ppUsed[i] || 0))) : u.pp;
        return { ...u, currentHp: newHp, pp: newPP };
      }));
      if (damageTaken > 0) addLog(`${selectedUnit.template.name} recibió ${damageTaken} de daño`);
    }
    setGameState('capture');
  }, [selectedUnit, addLog]);

  // Called when minigame fails - Pokemon escapes
  // Apply damage taken from wild Pokemon counter-attack and PP usage
  const onCaptureMinigameFail = useCallback((damageTaken: number, ppUsed: number[]) => {
    if (!captureData || !selectedUnit) return;

    // Apply damage and PP to player's Pokemon
    const nextUnits = units.map(u => {
      if (u.uid !== selectedUnit.uid) return u;
      const newHp = damageTaken > 0 ? Math.max(1, u.currentHp - damageTaken) : u.currentHp;
      const newPP = ppUsed.length > 0 ? u.pp.map((p, i) => Math.max(0, p - (ppUsed[i] || 0))) : u.pp;
      return { ...u, currentHp: newHp, pp: newPP };
    });
    setUnits(nextUnits);
    if (damageTaken > 0) addLog(`${selectedUnit.template.name} recibió ${damageTaken} de daño`);

    addLog(`¡${captureData.pokemon.name} salvaje escapó!`);
    setCaptureData(null);
    setGameState('playing');

    // Mark unit as having used their turn
    waitUnit(selectedUnit.uid, nextUnits);
  }, [captureData, selectedUnit, units, addLog, waitUnit]);

  // Called when player flees from capture minigame - unit's turn ends
  // Fleeing doesn't cause counter-attack damage, but signature is consistent
  const onCaptureMinigameFlee = useCallback((damageTaken: number, ppUsed: number[]) => {
    if (!captureData || !selectedUnit) return;

    // Apply damage and PP if any
    let nextUnits = units;
    if (damageTaken > 0 || ppUsed.length > 0) {
      nextUnits = units.map(u => {
        if (u.uid !== selectedUnit.uid) return u;
        const newHp = damageTaken > 0 ? Math.max(1, u.currentHp - damageTaken) : u.currentHp;
        const newPP = ppUsed.length > 0 ? u.pp.map((p, i) => Math.max(0, p - (ppUsed[i] || 0))) : u.pp;
        return { ...u, currentHp: newHp, pp: newPP };
      });
      setUnits(nextUnits);
    }

    addLog(`¡Huiste del ${captureData.pokemon.name} salvaje!`);
    setCaptureData(null);
    setGameState('playing');

    // Fleeing ends the unit's turn - they already moved to this position
    // Move unit to pending position and mark as moved
    if (pendingPosition) {
      const movedUnit = { ...selectedUnit, x: pendingPosition.x, y: pendingPosition.y };
      const updatedUnits = nextUnits.map(u => u.uid === selectedUnit.uid ? movedUnit : u);
      waitUnit(movedUnit.uid, updatedUnits);
    } else {
      waitUnit(selectedUnit.uid, nextUnits);
    }
  }, [captureData, selectedUnit, pendingPosition, units, addLog, waitUnit]);

  const confirmCapture = useCallback(() => {
    if (!captureData || !selectedUnit) return;

    if (captureData.player === 'P1') {
      setBaseReserveP1(prev => [...prev, captureData.pokemon]);
    } else {
      setBaseReserveP2(prev => [...prev, captureData.pokemon]);
    }

    addLog(`¡${captureData.player === 'P1' ? 'Azul' : 'Rojo'} capturó un ${captureData.pokemon.name}!`);
    addLog(`El ${captureData.pokemon.name} fue enviado a la Base.`);

    setCaptureData(null);
    setGameState('playing');

    waitUnit(selectedUnit.uid, units);
  }, [captureData, selectedUnit, units, addLog, waitUnit]);

  const confirmEvolution = useCallback(() => {
    if (!evolutionData) return;

    const { unitId, toTemplate } = evolutionData;

    // Apply evolution: new template + full HP restore + full PP restore
    const nextUnits = units.map(u => {
      if (u.uid === unitId) {
        return {
          ...u,
          template: toTemplate,
          currentHp: toTemplate.hp,
          hasMoved: true,
          pp: toTemplate.moves.map(m => m.pp),
          status: null,
          statusTurns: 0
        };
      }
      return u;
    });

    setUnits(nextUnits);
    addLog(`¡${evolutionData.fromTemplate.name} evolucionó a ${toTemplate.name}!`);

    setEvolutionData(null);
    setGameState('playing');
    resetSelection();

    if (!canPlayerStillAct(currentPlayer, nextUnits, baseReserveP1, baseReserveP2, creditsP1, creditsP2)) {
      setTimeout(() => {
        setGameState('transition');
      }, 300);
    }
  }, [
    evolutionData,
    units,
    addLog,
    resetSelection,
    currentPlayer,
    canPlayerStillAct,
    baseReserveP1,
    baseReserveP2,
    creditsP1,
    creditsP2
  ]);

  const confirmTurnChange = useCallback(() => {
    const nextPlayer: Player = currentPlayer === 'P1' ? 'P2' : 'P1';

    // Apply status ticks at turn start
    const updatedUnits = units.map(u => {
      let updated = { ...u, hasMoved: false };

      if (u.owner === nextPlayer && u.status) {
        const tick = applyStatusTick(u.status, u.statusTurns, u.template.hp, u.currentHp);
        updated = {
          ...updated,
          currentHp: tick.newHp,
          status: tick.newStatus,
          statusTurns: tick.newStatusTurns,
        };
        if (tick.cantAct && tick.newHp > 0) {
          updated = { ...updated, hasMoved: true };
          const statusName =
            u.status === 'sleep' ? 'sueño' :
            u.status === 'freeze' ? 'congelación' :
            'parálisis';
          addLog(`¡${u.template.name} no puede actuar por ${statusName}!`);
        }
        if (tick.chipDamage > 0) {
          addLog(`${u.template.name} perdió ${tick.chipDamage} HP por ${u.status === 'burn' ? 'quemadura' : 'veneno'}`);
        }
        if (tick.newStatus === null && u.status !== null) {
          addLog(`¡${u.template.name} se recuperó de ${u.status === 'sleep' ? 'sueño' : u.status === 'freeze' ? 'congelación' : u.status}!`);
        }
      }

      return updated;
    });

    const aliveUnits = updatedUnits.filter(u => u.currentHp > 0);
    setUnits(aliveUnits);

    const turnIncome = calculateTurnIncomeByCenters(
      map,
      centerOwners,
      nextPlayer
    );
    const nextCredits = getCreditsForPlayer(nextPlayer) + turnIncome;
    setCreditsForPlayer(nextPlayer, nextCredits);

    addLog(`+${turnIncome} créditos para ${nextPlayer === 'P1' ? 'Jugador 1' : 'Jugador 2'}.`);
    setCurrentPlayer(nextPlayer);

    if (nextPlayer === 'P1') {
      setTurn(t => t + 1);
    }

    const nextWinner = resolveWinner(aliveUnits, baseReserveP1, baseReserveP2);
    if (nextWinner) {
      setWinner(nextWinner);
      setGameState('victory');
      return;
    }

    addLog(`Turno ${nextPlayer === 'P1' ? turn + 1 : turn}: Jugador ${nextPlayer === 'P1' ? '1' : '2'}`);
    setGameState('playing');
    setGamePhase('SELECT');
  }, [
    currentPlayer,
    units,
    turn,
    addLog,
    map,
    centerOwners,
    resolveWinner,
    baseReserveP1,
    baseReserveP2,
    getCreditsForPlayer,
    setCreditsForPlayer
  ]);

  const triggerTurnTransition = useCallback(() => {
    resetSelection();
    setGameState('transition');
  }, [resetSelection]);

  // Update explored tiles for fog of war
  const updateExplored = useCallback((player: Player, explored: boolean[][]) => {
    if (player === 'P1') {
      setExploredP1(explored);
    } else {
      setExploredP2(explored);
    }
  }, []);

  // Action menu: select attack - move unit to pending position, then attack
  const selectAttack = useCallback(() => {
    if (!selectedUnit || !pendingPosition || attackRange.length === 0) return;

    // Move unit to pending position
    const movedUnit = { ...selectedUnit, x: pendingPosition.x, y: pendingPosition.y };
    const nextUnits = units.map(u => u.uid === selectedUnit.uid ? movedUnit : u);
    setUnits(nextUnits);
    setSelectedUnit(movedUnit);
    setMoveRange([]);
    setPendingPosition(null);
    setUnitHasMoved(true);

    // Recalculate attack range from new position (should be same, but just in case)
    const attacks = calculateAttackRange(movedUnit, nextUnits);
    setAttackRange(attacks);

    // AUTO-TARGET if only 1 enemy in range → go straight to move selection
    if (attacks.length === 1) {
      const target = nextUnits.find(u => u.x === attacks[0].x && u.y === attacks[0].y);
      if (target) {
        setAttackTarget(target);
        setAttackRange([]);
        setGamePhase('MOVE_SELECT');
        return;
      }
    }

    // Show selector for 2+ enemies
    setGamePhase('ATTACKING');
  }, [selectedUnit, pendingPosition, attackRange, units]);

  // Action menu: select wait - move unit to pending position and end turn
  const selectWait = useCallback(() => {
    if (!selectedUnit || !pendingPosition) return;

    // Move unit to pending position
    const movedUnit = { ...selectedUnit, x: pendingPosition.x, y: pendingPosition.y };
    const nextUnits = units.map(u => u.uid === selectedUnit.uid ? movedUnit : u);
    setUnits(nextUnits);
    setPendingPosition(null);
    setMoveRange([]);

    // Try random encounter on tall grass (30% chance)
    if (tryRandomEncounter(movedUnit, nextUnits, map)) {
      return; // Encounter triggered, will continue after minigame
    }

    // Consume berry bush: heal 10% HP and convert to grass
    if (map[movedUnit.y]?.[movedUnit.x] === TERRAIN.BERRY_BUSH) {
      const healAmount = Math.floor(movedUnit.template.hp * 0.1);
      const newHp = Math.min(movedUnit.template.hp, movedUnit.currentHp + healAmount);
      const healedUnit = { ...movedUnit, currentHp: newHp };
      const healedUnits = nextUnits.map(u => u.uid === movedUnit.uid ? healedUnit : u);
      setUnits(healedUnits);
      const newMap = map.map((row, ry) =>
        ry === movedUnit.y
          ? row.map((cell, cx) => cx === movedUnit.x ? TERRAIN.GRASS as TerrainType : cell)
          : row
      );
      setMap(newMap);
      addLog(`🫐 ${movedUnit.template.name} comió una baya (+${healAmount} HP)`);
      waitUnit(movedUnit.uid, healedUnits);
      return;
    }

    const terrain = map[movedUnit.y]?.[movedUnit.x];

    if (terrain === TERRAIN.POKEMON_CENTER) {
      const ownerBeforeCapture = getCenterOwner(centerOwners, movedUnit.x, movedUnit.y);

      if (ownerBeforeCapture !== currentPlayer) {
        setCenterOwners(prev => captureCenter(prev, movedUnit.x, movedUnit.y, currentPlayer));
        addLog(`🏥 Centro Pokémon capturado por ${currentPlayer === 'P1' ? 'Jugador 1' : 'Jugador 2'}.`);
        waitUnit(movedUnit.uid, nextUnits);
        return;
      }

      const currentCredits = getCreditsForPlayer(currentPlayer);
      const service = applyPokemonCenterService({
        template: movedUnit.template,
        currentHp: movedUnit.currentHp,
        pp: movedUnit.pp,
        status: movedUnit.status,
        statusTurns: movedUnit.statusTurns,
        availableCredits: currentCredits
      });

      if (service.creditsSpent > 0) {
        const servicedUnit: Unit = {
          ...movedUnit,
          currentHp: service.newHp,
          pp: service.newPp,
          status: service.newStatus,
          statusTurns: service.newStatusTurns
        };
        const servicedUnits = nextUnits.map(u => u.uid === movedUnit.uid ? servicedUnit : u);
        setUnits(servicedUnits);
        setCreditsForPlayer(currentPlayer, currentCredits - service.creditsSpent);

        if (service.healedHp > 0) {
          addLog(`🏥 ${servicedUnit.template.name} reparó ${service.healedHp} HP (-${service.healedHp * CENTER_REPAIR_COST_PER_HP} créditos)`);
        }
        if (service.restoredPp > 0) {
          addLog(`🔋 ${servicedUnit.template.name} recuperó ${service.restoredPp} PP (-${service.restoredPp * CENTER_RESUPPLY_COST_PER_PP} créditos)`);
        }
        if (service.curedStatus) {
          addLog(`🩹 ${servicedUnit.template.name} fue curado de estado (-${CENTER_STATUS_CURE_COST} créditos)`);
        }

        const nextCredits = currentPlayer === 'P1'
          ? { creditsP1: currentCredits - service.creditsSpent }
          : { creditsP2: currentCredits - service.creditsSpent };
        waitUnit(servicedUnit.uid, servicedUnits, nextCredits);
        return;
      }
    }

    if (terrain === TERRAIN.RUINS) {
      const currentCredits = getCreditsForPlayer(currentPlayer);
      const service = applyPokeMartService({
        template: movedUnit.template,
        currentHp: movedUnit.currentHp,
        pp: movedUnit.pp,
        status: movedUnit.status,
        statusTurns: movedUnit.statusTurns,
        availableCredits: currentCredits
      });

      if (service.creditsSpent > 0) {
        const servicedUnit: Unit = {
          ...movedUnit,
          currentHp: service.newHp,
          pp: service.newPp,
          status: service.newStatus,
          statusTurns: service.newStatusTurns
        };
        const servicedUnits = nextUnits.map(u => u.uid === movedUnit.uid ? servicedUnit : u);
        setUnits(servicedUnits);
        setCreditsForPlayer(currentPlayer, currentCredits - service.creditsSpent);

        if (service.purchasedItemId === SHOWDOWN_SERVICE_ITEMS.shopPotion.id) {
          addLog(`🧪 Pokétienda: ${servicedUnit.template.name} compró Max Potion (-${POKEMART_MAX_POTION_COST} créditos).`);
        } else if (service.purchasedItemId === SHOWDOWN_SERVICE_ITEMS.shopElixir.id) {
          addLog(`🔋 Pokétienda: ${servicedUnit.template.name} compró Elixir (-${POKEMART_ELIXIR_COST} créditos).`);
        } else if (service.purchasedItemId === SHOWDOWN_SERVICE_ITEMS.shopFullHeal.id) {
          addLog(`🩹 Pokétienda: ${servicedUnit.template.name} compró Full Heal (-${POKEMART_FULL_HEAL_COST} créditos).`);
        }

        const nextCredits = currentPlayer === 'P1'
          ? { creditsP1: currentCredits - service.creditsSpent }
          : { creditsP2: currentCredits - service.creditsSpent };
        waitUnit(servicedUnit.uid, servicedUnits, nextCredits);
        return;
      }
    }

    // Mark unit as done
    waitUnit(movedUnit.uid, nextUnits);
  }, [
    selectedUnit,
    pendingPosition,
    units,
    map,
    tryRandomEncounter,
    waitUnit,
    setMap,
    addLog,
    getCreditsForPlayer,
    currentPlayer,
    setCreditsForPlayer,
    centerOwners
  ]);

  // Move selection: player picked a move → initiate battle
  const selectMove = useCallback((move: Move) => {
    if (!selectedUnit || !attackTarget) return;

    setSelectedMove(move);
    setGameState('battle_zoom');
    setBattleData(createBattleData(selectedUnit, attackTarget, map, move));
    setGamePhase('SELECT');
  }, [selectedUnit, attackTarget, map]);

  // Cancel move selection - go back to ATTACKING phase
  const cancelMoveSelect = useCallback(() => {
    if (!selectedUnit) return;
    setAttackTarget(null);
    setSelectedMove(null);
    const attacks = calculateAttackRange(selectedUnit, units);
    setAttackRange(attacks);
    setGamePhase('ATTACKING');
  }, [selectedUnit, units]);

  const deployFromBase = useCallback((templateId: number) => {
    if (gameState !== 'playing' || gamePhase !== 'DEPLOY_SELECT' || !deployBase) return;

    const reserve = currentPlayer === 'P1' ? baseReserveP1 : baseReserveP2;
    const reserveIndex = reserve.findIndex(p => p.id === templateId);
    if (reserveIndex === -1) return;

    if (units.some(u => u.x === deployBase.x && u.y === deployBase.y)) {
      addLog('La base está ocupada.');
      return;
    }

    const template = reserve[reserveIndex];
    const deployCost = calculateDeployCost(template);
    const currentCredits = getCreditsForPlayer(currentPlayer);
    if (currentCredits < deployCost) {
      addLog(`Créditos insuficientes para desplegar ${template.name} (${currentCredits}/${deployCost}).`);
      return;
    }

    const newUnit: Unit = {
      uid: `${currentPlayer}-dep-${Math.random().toString(36).slice(2, 9)}`,
      owner: currentPlayer,
      template,
      x: deployBase.x,
      y: deployBase.y,
      currentHp: template.hp,
      hasMoved: true,
      kills: 0,
      pp: initPP(template),
      status: null,
      statusTurns: 0
    };

    const nextUnits = [...units, newUnit];
    setUnits(nextUnits);

    const nextReserveP1 = currentPlayer === 'P1'
      ? baseReserveP1.filter((_, i) => i !== reserveIndex)
      : baseReserveP1;
    const nextReserveP2 = currentPlayer === 'P2'
      ? baseReserveP2.filter((_, i) => i !== reserveIndex)
      : baseReserveP2;

    const nextCredits = currentCredits - deployCost;
    setCreditsForPlayer(currentPlayer, nextCredits);

    if (currentPlayer === 'P1') {
      setBaseReserveP1(nextReserveP1);
    } else {
      setBaseReserveP2(nextReserveP2);
    }

    addLog(`¡${template.name} fue desplegado desde la Base! (-${deployCost} créditos)`);
    setDeployBase(null);
    setGamePhase('SELECT');
    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    setPendingPosition(null);
    setUnitHasMoved(false);
    setSelectedMove(null);
    setAttackTarget(null);

    const nextCreditsP1 = currentPlayer === 'P1' ? nextCredits : creditsP1;
    const nextCreditsP2 = currentPlayer === 'P2' ? nextCredits : creditsP2;
    if (!canPlayerStillAct(currentPlayer, nextUnits, nextReserveP1, nextReserveP2, nextCreditsP1, nextCreditsP2)) {
      setTimeout(() => setGameState('transition'), 300);
    }
  }, [
    gameState,
    gamePhase,
    deployBase,
    currentPlayer,
    units,
    baseReserveP1,
    baseReserveP2,
    addLog,
    getCreditsForPlayer,
    setCreditsForPlayer,
    canPlayerStillAct,
    creditsP1,
    creditsP2
  ]);

  const cancelDeploySelect = useCallback(() => {
    setDeployBase(null);
    setGamePhase('SELECT');
  }, []);

  // Cancel action - deselect if on same position, otherwise go back to MOVING phase
  const cancelAction = useCallback(() => {
    // If pending position is same as current unit position, deselect
    if (selectedUnit && pendingPosition &&
        pendingPosition.x === selectedUnit.x &&
        pendingPosition.y === selectedUnit.y) {
      resetSelection();
      return;
    }

    // Otherwise just go back to MOVING
    setPendingPosition(null);
    setAttackRange([]);
    setGamePhase('MOVING');
  }, [selectedUnit, pendingPosition, resetSelection]);

  // Start a battle using server-provided results (for multiplayer)
  const startServerBattle = useCallback((attackerId: string, defenderId: string, damage: number, counterDamage: number) => {
    const attacker = units.find(u => u.uid === attackerId);
    const defender = units.find(u => u.uid === defenderId);

    if (!attacker || !defender) {
      console.error('[Multiplayer] Could not find attacker or defender for battle');
      return;
    }

    // Use first available attack move as placeholder for multiplayer
    const attackerMove = attacker.template.moves.find(m => m.category !== 'status') || attacker.template.moves[0];
    const defenderMove = counterDamage > 0
      ? (defender.template.moves.find(m => m.category !== 'status') || defender.template.moves[0])
      : null;

    const serverBattleData: BattleData = {
      attacker,
      defender,
      attackerMove,
      attackerResult: {
        damage,
        effectiveness: 1,
        isCritical: false,
        isStab: false,
        missed: false,
        terrainBonus: 0,
        typeTerrainBonus: false
      },
      defenderResult: counterDamage > 0 ? {
        damage: counterDamage,
        effectiveness: 1,
        isCritical: false,
        isStab: false,
        missed: false,
        terrainBonus: 0,
        typeTerrainBonus: false
      } : null,
      defenderMove,
      terrainType: map[defender.y]?.[defender.x] ?? TERRAIN.GRASS as TerrainType,
    };

    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    setPendingPosition(null);
    setGamePhase('SELECT');

    setBattleData(serverBattleData);
    setGameState('battle_zoom');
  }, [units, map]);

  // Trigger wild encounter for multiplayer (client-side check before server action)
  const triggerMultiplayerEncounter = useCallback((unit: Unit): boolean => {
    const isOnTallGrass = map[unit.y]?.[unit.x] === TERRAIN.TALL_GRASS;
    if (!isOnTallGrass) return false;

    // 30% chance of encounter
    if (Math.random() > 0.3) return false;

    const encounter = triggerWildEncounter(unit, map, units);
    if (encounter) {
      setGameState('capture_minigame');
      setCaptureData(encounter);
      return true;
    }
    return false;
  }, [map, units]);

  // Transition from battle zoom to actual battle cinematic
  const confirmBattleZoom = useCallback(() => {
    setGameState('battle');
  }, []);

  // Trigger evolution cinematic from server data (for multiplayer)
  const triggerServerEvolution = useCallback((unitId: string, newTemplate: PokemonTemplate) => {
    const unit = units.find(u => u.uid === unitId);
    if (!unit) {
      console.error('[Multiplayer] Could not find unit for evolution:', unitId);
      return;
    }

    setEvolutionData({
      unitId,
      fromTemplate: unit.template,
      toTemplate: newTemplate
    });
    setGameState('evolution');
  }, [units]);

  // Trigger encounter from server data (for multiplayer)
  const triggerServerEncounter = useCallback((pokemon: PokemonTemplate, spawnPos: Position, player: Player) => {
    const encounter: CaptureData = {
      pokemon,
      player,
      spawnPos
    };
    setCaptureData(encounter);
    setGameState('capture_minigame');
  }, []);

  // Trigger battle from server data (for multiplayer)
  const triggerServerBattleWithZoom = useCallback((
    attacker: Unit,
    defender: Unit,
    damage: number,
    counterDamage: number,
    attackerMove?: Move,
    defenderMove?: Move | null
  ) => {
    const resolvedAttackerMove = attackerMove || attacker.template.moves.find(m => m.category !== 'status') || attacker.template.moves[0];
    const resolvedDefenderMove = counterDamage > 0
      ? (defenderMove || defender.template.moves.find(m => m.category !== 'status') || defender.template.moves[0])
      : null;

    const serverBattleData: BattleData = {
      attacker,
      defender,
      attackerMove: resolvedAttackerMove,
      attackerResult: {
        damage,
        effectiveness: 1,
        isCritical: false,
        isStab: false,
        missed: false,
        terrainBonus: 0,
        typeTerrainBonus: false
      },
      defenderResult: counterDamage > 0 ? {
        damage: counterDamage,
        effectiveness: 1,
        isCritical: false,
        isStab: false,
        missed: false,
        terrainBonus: 0,
        typeTerrainBonus: false
      } : null,
      defenderMove: resolvedDefenderMove,
      terrainType: map[defender.y]?.[defender.x] ?? TERRAIN.GRASS as TerrainType,
    };

    setBattleData(serverBattleData);
    setGameState('battle_zoom');
  }, [map]);

  // Optimistic update units (for multiplayer movement)
  const updateUnitsOptimistic = useCallback((unitId: string, x: number, y: number) => {
    setUnits(prev => prev.map(u =>
      u.uid === unitId ? { ...u, x, y } : u
    ));
  }, []);

  // Auto-wait all units that haven't moved (timer expired)
  const autoWaitAllUnits = useCallback(() => {
    const playerUnits = units.filter(u => u.owner === currentPlayer && !u.hasMoved);
    if (playerUnits.length === 0) return;

    // Mark all unmoved units as having moved
    const nextUnits = units.map(u =>
      u.owner === currentPlayer && !u.hasMoved ? { ...u, hasMoved: true } : u
    );
    setUnits(nextUnits);

    addLog(`¡Tiempo agotado! Turno terminado automáticamente.`);
    resetSelection();

    // Trigger turn transition
    setTimeout(() => {
      setGameState('transition');
    }, 300);
  }, [units, currentPlayer, addLog, resetSelection]);

  return {
    map,
    units,
    turn,
    currentPlayer,
    gameState,
    gamePhase,
    selectedUnit,
    moveRange,
    attackRange,
    pendingPosition,
    battleData,
    captureData,
    evolutionData,
    logs,
    winner,
    exploredP1,
    exploredP2,
    baseReserveP1,
    baseReserveP2,
    creditsP1,
    creditsP2,
    centerOwners,
    deployBase,

    // Multiplayer state
    myPlayer,
    isMultiplayer,
    isMyTurn,

    // Actions
    initGame,
    initGameWithTeams,
    initGameWithMap,
    initMultiplayerGame,
    handleTileClick,
    endBattle,
    confirmBattleZoom,
    onCaptureMinigameSuccess,
    onCaptureMinigameFail,
    onCaptureMinigameFlee,
    confirmCapture,
    confirmEvolution,
    confirmTurnChange,
    triggerTurnTransition,
    updateExplored,
    setMultiplayerState,
    // Action menu
    selectAttack,
    selectWait,
    cancelAction,
    // Move selection
    selectedMove,
    attackTarget,
    selectMove,
    cancelMoveSelect,
    deployFromBase,
    cancelDeploySelect,
    // Multiplayer
    startServerBattle,
    triggerMultiplayerEncounter,
    triggerServerEvolution,
    triggerServerEncounter,
    triggerServerBattleWithZoom,
    updateUnitsOptimistic,
    // Timer auto-wait
    autoWaitAllUnits
  };
}
