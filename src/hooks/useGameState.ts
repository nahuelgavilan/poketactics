import { useState, useCallback } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants/board';
import { TERRAIN } from '../constants/terrain';
import { getRandomPokemon } from '../constants/pokemon';
import { getNextEvolution } from '../constants/evolution';
import { calculateMoveRange, calculateAttackRange } from '../utils/pathfinding';
import { createBattleData } from '../utils/combat';
import { triggerWildEncounter, createCapturedUnit } from '../utils/capture';
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
  PokemonTemplate
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

  // Multiplayer state
  myPlayer: Player | null;
  isMultiplayer: boolean;
  isMyTurn: boolean;

  // Actions
  initGame: () => void;
  initGameWithTeams: (p1Team: PokemonTemplate[], p2Team: PokemonTemplate[]) => void;
  initMultiplayerGame: (player: Player) => void;
  handleTileClick: (x: number, y: number) => void;
  endBattle: () => void;
  confirmBattleZoom: () => void;
  onCaptureMinigameSuccess: (damageTaken: number) => void;
  onCaptureMinigameFail: (damageTaken: number) => void;
  onCaptureMinigameFlee: (damageTaken: number) => void;
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
  // Multiplayer battle (triggered by server result)
  startServerBattle: (attackerId: string, defenderId: string, damage: number, counterDamage: number) => void;
  // Multiplayer encounter
  triggerMultiplayerEncounter: (unit: Unit) => boolean;
  // Multiplayer evolution (triggered by server result)
  triggerServerEvolution: (unitId: string, newTemplate: PokemonTemplate) => void;
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
  const [logs, setLogs] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  // Fog of War - explored tiles per player
  const [exploredP1, setExploredP1] = useState<boolean[][]>([]);
  const [exploredP2, setExploredP2] = useState<boolean[][]>([]);

  // Track if unit has moved this action (for action menu state)
  const [unitHasMoved, setUnitHasMoved] = useState(false);

  // Pending position - where unit WILL move (preview, not confirmed yet)
  const [pendingPosition, setPendingPosition] = useState<Position | null>(null);

  // Multiplayer state - which player "I" am
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Computed: is it my turn?
  const isMyTurn = !isMultiplayer || myPlayer === currentPlayer;

  const addLog = useCallback((message: string) => {
    setLogs(prev => [message, ...prev]);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    setPendingPosition(null);
    setGamePhase('SELECT');
    setUnitHasMoved(false);
  }, []);

  const initGame = useCallback(() => {
    // Generate map with tall grass
    const newMap: GameMap = Array(BOARD_HEIGHT).fill(0).map(() =>
      Array(BOARD_WIDTH).fill(TERRAIN.GRASS as TerrainType)
    );

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const r = Math.random();
        if (r > 0.88) newMap[y][x] = TERRAIN.MOUNTAIN as TerrainType;
        else if (r > 0.80) newMap[y][x] = TERRAIN.WATER as TerrainType;
        else if (r > 0.65) newMap[y][x] = TERRAIN.FOREST as TerrainType;
        else if (r > 0.45) newMap[y][x] = TERRAIN.TALL_GRASS as TerrainType;
      }
    }

    // Ensure bases are passable
    newMap[0][0] = TERRAIN.BASE as TerrainType;
    newMap[0][1] = TERRAIN.GRASS as TerrainType;
    newMap[1][0] = TERRAIN.GRASS as TerrainType;
    newMap[BOARD_HEIGHT - 1][BOARD_WIDTH - 1] = TERRAIN.BASE as TerrainType;
    newMap[BOARD_HEIGHT - 1][BOARD_WIDTH - 2] = TERRAIN.GRASS as TerrainType;
    newMap[BOARD_HEIGHT - 2][BOARD_WIDTH - 1] = TERRAIN.GRASS as TerrainType;

    // Add Pokémon Centers in the middle area (1-2 centers)
    const centerCount = Math.random() < 0.5 ? 1 : 2;
    const placedCenters: { x: number; y: number }[] = [];

    for (let i = 0; i < centerCount; i++) {
      let attempts = 0;
      while (attempts < 20) {
        // Middle area: rows 2-5, cols 1-4 (avoiding corners)
        const cx = 1 + Math.floor(Math.random() * (BOARD_WIDTH - 2));
        const cy = 2 + Math.floor(Math.random() * (BOARD_HEIGHT - 4));

        // Check not too close to other centers
        const tooClose = placedCenters.some(
          c => Math.abs(c.x - cx) < 2 && Math.abs(c.y - cy) < 2
        );

        if (!tooClose) {
          newMap[cy][cx] = TERRAIN.POKEMON_CENTER as TerrainType;
          placedCenters.push({ x: cx, y: cy });
          break;
        }
        attempts++;
      }
    }

    setMap(newMap);

    // Create teams
    const createTeam = (owner: Player, startY: number): Unit[] => {
      const team: Unit[] = [];
      const usedIds = new Set<number>();

      for (let i = 0; i < 3; i++) {
        const temp = getRandomPokemon(usedIds);
        usedIds.add(temp.id);

        team.push({
          uid: Math.random().toString(36).substring(7),
          owner,
          template: temp,
          x: i % BOARD_WIDTH,
          y: startY + (Math.floor(i / BOARD_WIDTH) * (owner === 'P2' ? 1 : -1)),
          currentHp: temp.hp,
          hasMoved: false,
          kills: 0
        });
      }
      return team;
    };

    const p1 = createTeam('P1', BOARD_HEIGHT - 1);
    const p2 = createTeam('P2', 0);

    // Position teams
    p1.forEach((u, i) => {
      u.y = BOARD_HEIGHT - 1 - Math.floor(i / BOARD_WIDTH);
      u.x = i % BOARD_WIDTH;
    });
    p2.forEach((u, i) => {
      u.y = 0 + Math.floor(i / BOARD_WIDTH);
      u.x = BOARD_WIDTH - 1 - (i % BOARD_WIDTH);
    });

    setUnits([...p1, ...p2]);
    setTurn(1);
    setCurrentPlayer('P1');
    setGameState('playing');
    setGamePhase('SELECT');
    setLogs(['¡Empieza el combate!', '¡Usa la Hierba Alta para capturar!']);
    setWinner(null);

    // Initialize fog of war - empty explored arrays (will be populated by useVision)
    const emptyExplored = Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(false));
    setExploredP1([...emptyExplored.map(row => [...row])]);
    setExploredP2([...emptyExplored.map(row => [...row])]);

    resetSelection();
  }, [resetSelection]);

  // Initialize game with pre-selected teams (from draft)
  const initGameWithTeams = useCallback((p1Team: PokemonTemplate[], p2Team: PokemonTemplate[]) => {
    // Generate map with tall grass
    const newMap: GameMap = Array(BOARD_HEIGHT).fill(0).map(() =>
      Array(BOARD_WIDTH).fill(TERRAIN.GRASS as TerrainType)
    );

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const r = Math.random();
        if (r > 0.88) newMap[y][x] = TERRAIN.MOUNTAIN as TerrainType;
        else if (r > 0.80) newMap[y][x] = TERRAIN.WATER as TerrainType;
        else if (r > 0.65) newMap[y][x] = TERRAIN.FOREST as TerrainType;
        else if (r > 0.45) newMap[y][x] = TERRAIN.TALL_GRASS as TerrainType;
      }
    }

    // Ensure bases are passable
    newMap[0][0] = TERRAIN.BASE as TerrainType;
    newMap[0][1] = TERRAIN.GRASS as TerrainType;
    newMap[1][0] = TERRAIN.GRASS as TerrainType;
    newMap[BOARD_HEIGHT - 1][BOARD_WIDTH - 1] = TERRAIN.BASE as TerrainType;
    newMap[BOARD_HEIGHT - 1][BOARD_WIDTH - 2] = TERRAIN.GRASS as TerrainType;
    newMap[BOARD_HEIGHT - 2][BOARD_WIDTH - 1] = TERRAIN.GRASS as TerrainType;

    // Add Pokémon Centers in the middle area (1-2 centers)
    const centerCount = Math.random() < 0.5 ? 1 : 2;
    const placedCenters: { x: number; y: number }[] = [];

    for (let i = 0; i < centerCount; i++) {
      let attempts = 0;
      while (attempts < 20) {
        const cx = 1 + Math.floor(Math.random() * (BOARD_WIDTH - 2));
        const cy = 2 + Math.floor(Math.random() * (BOARD_HEIGHT - 4));
        const tooClose = placedCenters.some(
          c => Math.abs(c.x - cx) < 2 && Math.abs(c.y - cy) < 2
        );
        if (!tooClose) {
          newMap[cy][cx] = TERRAIN.POKEMON_CENTER as TerrainType;
          placedCenters.push({ x: cx, y: cy });
          break;
        }
        attempts++;
      }
    }

    setMap(newMap);

    // Create units from provided teams
    const p1Units: Unit[] = p1Team.map((temp, i) => ({
      uid: Math.random().toString(36).substring(7),
      owner: 'P1' as Player,
      template: temp,
      x: i % BOARD_WIDTH,
      y: BOARD_HEIGHT - 1 - Math.floor(i / BOARD_WIDTH),
      currentHp: temp.hp,
      hasMoved: false,
      kills: 0
    }));

    const p2Units: Unit[] = p2Team.map((temp, i) => ({
      uid: Math.random().toString(36).substring(7),
      owner: 'P2' as Player,
      template: temp,
      x: BOARD_WIDTH - 1 - (i % BOARD_WIDTH),
      y: 0 + Math.floor(i / BOARD_WIDTH),
      currentHp: temp.hp,
      hasMoved: false,
      kills: 0
    }));

    setUnits([...p1Units, ...p2Units]);
    setTurn(1);
    setCurrentPlayer('P1');
    setGameState('playing');
    setGamePhase('SELECT');
    setLogs(['¡Empieza el combate!', '¡Equipos seleccionados por draft!']);
    setWinner(null);

    // Initialize fog of war
    const emptyExplored = Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(false));
    setExploredP1([...emptyExplored.map(row => [...row])]);
    setExploredP2([...emptyExplored.map(row => [...row])]);

    resetSelection();
  }, [resetSelection]);

  // Initialize multiplayer game - called when joining a room
  const initMultiplayerGame = useCallback((player: Player) => {
    setMyPlayer(player);
    setIsMultiplayer(true);
    setGameState('playing');
    setGamePhase('SELECT');
    resetSelection();
  }, [resetSelection]);

  // Set multiplayer state from server - syncs game state
  const setMultiplayerState = useCallback((state: MultiplayerGameState) => {
    setMap(state.map);
    setUnits(state.units);
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
      setUnitHasMoved(false);
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
  const waitUnit = useCallback((uid: string, currentUnits: Unit[]) => {
    const nextUnits = currentUnits.map(u =>
      u.uid === uid ? { ...u, hasMoved: true } : u
    );
    setUnits(nextUnits);
    resetSelection();

    // Check if all units of current player have moved
    const playerUnits = nextUnits.filter(u => u.owner === currentPlayer);
    const allMoved = playerUnits.every(u => u.hasMoved);

    if (allMoved && playerUnits.length > 0) {
      // Auto-trigger turn transition after a brief delay for feedback
      setTimeout(() => {
        setGameState('transition');
      }, 300);
    }
  }, [resetSelection, currentPlayer]);

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

    const clickedUnit = units.find(u => u.x === x && u.y === y);

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
      }
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
      const isValidDestination = moveRange.some(m => m.x === x && m.y === y);

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
      const isValidDestination = moveRange.some(m => m.x === x && m.y === y);

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
      // Click on valid target: attack
      if (attackRange.some(a => a.x === x && a.y === y)) {
        const target = units.find(u => u.x === x && u.y === y);
        if (target) {
          setAttackRange([]);
          setGameState('battle_zoom');
          setBattleData(createBattleData(selectedUnit, target, map));
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
  }, [gameState, gamePhase, units, currentPlayer, selectedUnit, moveRange, attackRange, map, unitHasMoved, waitUnit, resetSelection, tryRandomEncounter, isMultiplayer, isMyTurn]);

  const endBattle = useCallback(() => {
    if (!battleData) return;

    const { defender, attacker, attackerResult, defenderResult } = battleData;
    const attackerDamage = attackerResult.damage;
    const counterDamage = defenderResult?.damage || 0;

    // Check if defender died
    const defenderDied = defender.currentHp - attackerDamage <= 0;
    // Check if attacker died from counter
    const attackerDied = defenderResult && attacker.currentHp - counterDamage <= 0;

    // Apply damage to both units
    let nextUnits = units.map(u => {
      if (u.uid === defender.uid) {
        return { ...u, currentHp: Math.max(0, u.currentHp - attackerDamage) };
      }
      if (u.uid === attacker.uid && defenderResult) {
        return { ...u, currentHp: Math.max(0, u.currentHp - counterDamage) };
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

    // Check victory first
    if (!nextUnits.some(u => u.owner === 'P1')) {
      setWinner('P2');
      setGameState('victory');
      return;
    }
    if (!nextUnits.some(u => u.owner === 'P2')) {
      setWinner('P1');
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

      // Check if turn should end (all remaining units have moved, or no units left that can act)
      const playerUnits = nextUnits.filter(u => u.owner === currentPlayer);
      const allMoved = playerUnits.length === 0 || playerUnits.every(u => u.hasMoved);

      if (allMoved) {
        // Auto-trigger turn transition
        setTimeout(() => {
          setGameState('transition');
        }, 300);
      }
    }
  }, [battleData, units, waitUnit, addLog, resetSelection, currentPlayer]);

  // Called when minigame succeeds - show capture celebration
  // Apply damage taken from wild Pokemon counter-attack
  const onCaptureMinigameSuccess = useCallback((damageTaken: number) => {
    if (selectedUnit && damageTaken > 0) {
      setUnits(prev => prev.map(u =>
        u.uid === selectedUnit.uid
          ? { ...u, currentHp: Math.max(1, u.currentHp - damageTaken) }
          : u
      ));
      addLog(`${selectedUnit.template.name} recibió ${damageTaken} de daño`);
    }
    setGameState('capture');
  }, [selectedUnit, addLog]);

  // Called when minigame fails - Pokemon escapes
  // Apply damage taken from wild Pokemon counter-attack
  const onCaptureMinigameFail = useCallback((damageTaken: number) => {
    if (!captureData || !selectedUnit) return;

    // Apply damage to player's Pokemon
    if (damageTaken > 0) {
      setUnits(prev => prev.map(u =>
        u.uid === selectedUnit.uid
          ? { ...u, currentHp: Math.max(1, u.currentHp - damageTaken) }
          : u
      ));
      addLog(`${selectedUnit.template.name} recibió ${damageTaken} de daño`);
    }

    addLog(`¡${captureData.pokemon.name} salvaje escapó!`);
    setCaptureData(null);
    setGameState('playing');

    // Mark unit as having used their turn
    waitUnit(selectedUnit.uid, units);
  }, [captureData, selectedUnit, units, addLog, waitUnit]);

  // Called when player flees from capture minigame - unit's turn ends
  // Fleeing doesn't cause counter-attack damage, but signature is consistent
  const onCaptureMinigameFlee = useCallback((damageTaken: number) => {
    if (!captureData || !selectedUnit) return;

    // Apply damage if any (shouldn't happen when fleeing, but just in case)
    let nextUnits = units;
    if (damageTaken > 0) {
      nextUnits = units.map(u =>
        u.uid === selectedUnit.uid
          ? { ...u, currentHp: Math.max(1, u.currentHp - damageTaken) }
          : u
      );
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

    const newUnit = createCapturedUnit(captureData);
    // Add kills: 0 to new unit
    const newUnitWithKills = { ...newUnit, kills: 0 };
    const nextUnits = [...units, newUnitWithKills];

    setUnits(nextUnits);
    addLog(`¡${captureData.player === 'P1' ? 'Azul' : 'Rojo'} capturó un ${captureData.pokemon.name}!`);

    setCaptureData(null);
    setGameState('playing');

    waitUnit(selectedUnit.uid, nextUnits);
  }, [captureData, selectedUnit, units, addLog, waitUnit]);

  const confirmEvolution = useCallback(() => {
    if (!evolutionData) return;

    const { unitId, toTemplate } = evolutionData;

    // Apply evolution: new template + full HP restore
    const nextUnits = units.map(u => {
      if (u.uid === unitId) {
        return {
          ...u,
          template: toTemplate,
          currentHp: toTemplate.hp, // Full HP restore
          hasMoved: true // Mark as moved after evolution
        };
      }
      return u;
    });

    setUnits(nextUnits);
    addLog(`¡${evolutionData.fromTemplate.name} evolucionó a ${toTemplate.name}!`);

    setEvolutionData(null);
    setGameState('playing');
    resetSelection();

    // Check if turn should end (all units have moved)
    const playerUnits = nextUnits.filter(u => u.owner === currentPlayer);
    const allMoved = playerUnits.length === 0 || playerUnits.every(u => u.hasMoved);

    if (allMoved) {
      setTimeout(() => {
        setGameState('transition');
      }, 300);
    }
  }, [evolutionData, units, addLog, resetSelection, currentPlayer]);

  const confirmTurnChange = useCallback(() => {
    const nextPlayer: Player = currentPlayer === 'P1' ? 'P2' : 'P1';

    // Apply healing to units on Pokémon Centers at turn start
    const healedUnits = units.map(u => {
      // Reset hasMoved for all units
      let updated = { ...u, hasMoved: false };

      // Heal units on Pokémon Center (20% of max HP)
      if (u.owner === nextPlayer && map[u.y]?.[u.x] === TERRAIN.POKEMON_CENTER) {
        const healAmount = Math.floor(u.template.hp * 0.2);
        const newHp = Math.min(u.template.hp, u.currentHp + healAmount);
        if (newHp > u.currentHp) {
          addLog(`¡${u.template.name} recuperó ${healAmount} HP en el Centro Pokémon!`);
          updated = { ...updated, currentHp: newHp };
        }
      }

      return updated;
    });

    setUnits(healedUnits);
    setCurrentPlayer(nextPlayer);

    if (nextPlayer === 'P1') {
      setTurn(t => t + 1);
    }

    addLog(`Turno ${nextPlayer === 'P1' ? turn + 1 : turn}: Jugador ${nextPlayer === 'P1' ? '1' : '2'}`);
    setGameState('playing');
    setGamePhase('SELECT');
  }, [currentPlayer, units, turn, addLog, map]);

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

    // AUTO-ATTACK if only 1 enemy in range
    if (attacks.length === 1) {
      const target = nextUnits.find(u => u.x === attacks[0].x && u.y === attacks[0].y);
      if (target) {
        setAttackRange([]);
        setGameState('battle_zoom');
        setBattleData(createBattleData(movedUnit, target, map));
        return;
      }
    }

    // Show selector for 2+ enemies
    setGamePhase('ATTACKING');
  }, [selectedUnit, pendingPosition, attackRange, units, map]);

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

    // Mark unit as done
    waitUnit(movedUnit.uid, nextUnits);
  }, [selectedUnit, pendingPosition, units, map, tryRandomEncounter, waitUnit]);

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

    // Calculate effectiveness from types
    const effectiveness = attacker.template.moveType && defender.template.types
      ? defender.template.types.reduce((acc, defType) => {
          // Simple effectiveness calculation
          return acc;
        }, 1)
      : 1;

    // Create battle data with server-provided damage values
    const battleData: BattleData = {
      attacker,
      defender,
      attackerResult: {
        damage,
        effectiveness,
        isCritical: false, // Server doesn't send this, default to false
        terrainBonus: 0,
        typeTerrainBonus: false
      },
      defenderResult: counterDamage > 0 ? {
        damage: counterDamage,
        effectiveness: 1,
        isCritical: false,
        terrainBonus: 0,
        typeTerrainBonus: false
      } : null,
      terrainType: map[defender.y]?.[defender.x] ?? TERRAIN.GRASS,
      damage,
      effectiveness
    };

    // Reset selection state before starting battle
    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    setPendingPosition(null);
    setGamePhase('SELECT');

    setBattleData(battleData);
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

    // Multiplayer state
    myPlayer,
    isMultiplayer,
    isMyTurn,

    // Actions
    initGame,
    initGameWithTeams,
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
    // Multiplayer
    startServerBattle,
    triggerMultiplayerEncounter,
    triggerServerEvolution,
    // Timer auto-wait
    autoWaitAllUnits
  };
}
