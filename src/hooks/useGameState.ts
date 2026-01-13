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
  ActionMenuState,
  EvolutionData
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
  battleData: BattleData | null;
  captureData: CaptureData | null;
  evolutionData: EvolutionData | null;
  logs: string[];
  winner: Player | null;
  actionMenu: ActionMenuState;
  exploredP1: boolean[][];
  exploredP2: boolean[][];

  // Actions
  initGame: () => void;
  handleTileClick: (x: number, y: number) => void;
  selectAction: (action: 'move' | 'attack' | 'capture' | 'wait') => void;
  cancelAction: () => void;
  endBattle: () => void;
  onCaptureMinigameSuccess: () => void;
  onCaptureMinigameFail: () => void;
  confirmCapture: () => void;
  confirmEvolution: () => void;
  confirmTurnChange: () => void;
  triggerTurnTransition: () => void;
  updateExplored: (player: Player, explored: boolean[][]) => void;
}

const initialActionMenu: ActionMenuState = {
  isOpen: false,
  canMove: false,
  canAttack: false,
  canCapture: false,
  canWait: false
};

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
  const [actionMenu, setActionMenu] = useState<ActionMenuState>(initialActionMenu);

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

  const addLog = useCallback((message: string) => {
    setLogs(prev => [message, ...prev]);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    setActionMenu(initialActionMenu);
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

  // Open action menu for a selected unit
  const openActionMenu = useCallback((unit: Unit, currentUnits: Unit[], currentMap: GameMap, hasMoved: boolean) => {
    const attacks = calculateAttackRange(unit, currentUnits);
    const isOnTallGrass = currentMap[unit.y][unit.x] === TERRAIN.TALL_GRASS;

    setActionMenu({
      isOpen: true,
      canMove: !hasMoved,
      canAttack: attacks.length > 0,
      canCapture: isOnTallGrass && !hasMoved,
      canWait: true
    });
    setAttackRange(attacks);
    setGamePhase('ACTION_MENU');
  }, []);

  // Handle action selection from menu
  const selectAction = useCallback((action: 'move' | 'attack' | 'capture' | 'wait') => {
    if (!selectedUnit) return;

    switch (action) {
      case 'move':
        // Guard: can only move if not already moved
        if (unitHasMoved) return;
        setMoveRange(calculateMoveRange(selectedUnit, map, units));
        setAttackRange([]);
        setActionMenu(prev => ({ ...prev, isOpen: false })); // Close menu
        setGamePhase('MOVING');
        break;

      case 'attack':
        setMoveRange([]);
        setAttackRange(calculateAttackRange(selectedUnit, units));
        setActionMenu(prev => ({ ...prev, isOpen: false })); // Close menu
        setGamePhase('ATTACKING');
        break;

      case 'capture':
        // Guard: can only capture if not already moved
        if (unitHasMoved) return;
        // Trigger wild encounter (always succeeds if on tall grass)
        const encounter = triggerWildEncounter(selectedUnit, map, units);
        if (encounter) {
          setActionMenu(prev => ({ ...prev, isOpen: false }));
          setGameState('capture_minigame');
          setCaptureData(encounter);
        } else {
          addLog('¡No hay espacio para capturar!');
          // Stay in action menu
          openActionMenu(selectedUnit, units, map, unitHasMoved);
        }
        break;

      case 'wait':
        setActionMenu(prev => ({ ...prev, isOpen: false }));
        waitUnit(selectedUnit.uid, units);
        break;
    }
  }, [selectedUnit, map, units, waitUnit, addLog, openActionMenu, unitHasMoved]);

  // Cancel current action and return to previous state
  const cancelAction = useCallback(() => {
    if (gamePhase === 'ACTION_MENU') {
      // If unit has moved, mark as waited. Otherwise deselect.
      if (unitHasMoved && selectedUnit) {
        waitUnit(selectedUnit.uid, units);
      } else {
        resetSelection();
      }
    } else if (gamePhase === 'MOVING') {
      // Deselect and go back to SELECT
      resetSelection();
    } else if (gamePhase === 'ATTACKING') {
      // Return to action menu if unit has moved, otherwise deselect
      if (unitHasMoved && selectedUnit) {
        openActionMenu(selectedUnit, units, map, true);
      } else {
        resetSelection();
      }
    }
  }, [gamePhase, selectedUnit, units, map, unitHasMoved, resetSelection, openActionMenu, waitUnit]);

  // Handle tile clicks based on current phase
  const handleTileClick = useCallback((x: number, y: number) => {
    if (gameState !== 'playing') return;

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

    // Phase: ACTION_MENU - interaction with open menu
    if (gamePhase === 'ACTION_MENU') {
      // Clicking outside or on another unit closes menu
      if (!clickedUnit || clickedUnit.uid !== selectedUnit?.uid) {
        // If unit already moved, must complete action (wait)
        if (unitHasMoved && selectedUnit) {
          waitUnit(selectedUnit.uid, units);
        } else if (isOwnActiveUnit(clickedUnit)) {
          // Switch to different unit
          setSelectedUnit(clickedUnit!);
          setUnitHasMoved(false);
          const moves = calculateMoveRange(clickedUnit!, map, units);
          setMoveRange(moves);
          setAttackRange([]);
          setActionMenu(prev => ({ ...prev, isOpen: false }));
          setGamePhase('MOVING');
        } else {
          resetSelection();
        }
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

      // Click on current position: stay in place
      if (x === selectedUnit.x && y === selectedUnit.y) {
        setMoveRange([]);
        setUnitHasMoved(true);

        // Check actions from current position
        const attacks = calculateAttackRange(selectedUnit, units);
        const isOnTallGrass = map[selectedUnit.y][selectedUnit.x] === TERRAIN.TALL_GRASS;

        if (attacks.length > 0) {
          // Show attack targets directly (fluid)
          setAttackRange(attacks);
          setGamePhase('ATTACKING');
        } else if (isOnTallGrass) {
          // Can capture, show menu
          openActionMenu(selectedUnit, units, map, true);
        } else {
          // Nothing to do, wait
          waitUnit(selectedUnit.uid, units);
        }
        return;
      }

      // Click on valid move destination
      if (moveRange.some(m => m.x === x && m.y === y)) {
        const movedUnit = { ...selectedUnit, x, y };
        const nextUnits = units.map(u => u.uid === selectedUnit.uid ? movedUnit : u);
        setUnits(nextUnits);
        setSelectedUnit(movedUnit);
        setMoveRange([]);
        setUnitHasMoved(true);

        // Check actions after moving
        const attacks = calculateAttackRange(movedUnit, nextUnits);
        const isOnTallGrass = map[y][x] === TERRAIN.TALL_GRASS;

        if (attacks.length > 0) {
          // Show attack targets directly
          setAttackRange(attacks);
          setGamePhase('ATTACKING');
        } else if (isOnTallGrass) {
          // Can capture, show menu
          openActionMenu(movedUnit, nextUnits, map, true);
        } else {
          // No actions, auto-wait
          waitUnit(movedUnit.uid, nextUnits);
        }
        return;
      }

      // Click elsewhere: cancel selection
      resetSelection();
      return;
    }

    // Phase: ATTACKING - selecting attack target
    if (gamePhase === 'ATTACKING' && selectedUnit) {
      // Click on valid target: attack
      if (attackRange.some(a => a.x === x && a.y === y)) {
        const target = units.find(u => u.x === x && u.y === y);
        if (target) {
          setAttackRange([]);
          setGameState('battle');
          setBattleData(createBattleData(selectedUnit, target, map));
        }
        return;
      }

      // Click elsewhere: cancel attack, show menu or wait
      if (unitHasMoved) {
        // Already moved, show menu to choose wait/capture
        const isOnTallGrass = map[selectedUnit.y][selectedUnit.x] === TERRAIN.TALL_GRASS;
        if (isOnTallGrass) {
          setAttackRange([]);
          openActionMenu(selectedUnit, units, map, true);
        } else {
          // Just wait
          waitUnit(selectedUnit.uid, units);
        }
      } else {
        // Didn't move, cancel entirely
        resetSelection();
      }
      return;
    }
  }, [gameState, gamePhase, units, currentPlayer, selectedUnit, moveRange, attackRange, map, openActionMenu, unitHasMoved, waitUnit, resetSelection]);

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
      // Attacker died, just reset selection
      resetSelection();
    }
  }, [battleData, units, waitUnit, addLog, resetSelection]);

  // Called when minigame succeeds - show capture celebration
  const onCaptureMinigameSuccess = useCallback(() => {
    setGameState('capture');
  }, []);

  // Called when minigame fails - Pokemon escapes
  const onCaptureMinigameFail = useCallback(() => {
    if (!captureData || !selectedUnit) return;

    addLog(`¡${captureData.pokemon.name} salvaje escapó!`);
    setCaptureData(null);
    setGameState('playing');

    // Mark unit as having used their turn
    waitUnit(selectedUnit.uid, units);
  }, [captureData, selectedUnit, units, addLog, waitUnit]);

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
  }, [evolutionData, units, addLog, resetSelection]);

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
    battleData,
    captureData,
    evolutionData,
    logs,
    winner,
    actionMenu,
    exploredP1,
    exploredP2,
    initGame,
    handleTileClick,
    selectAction,
    cancelAction,
    endBattle,
    onCaptureMinigameSuccess,
    onCaptureMinigameFail,
    confirmCapture,
    confirmEvolution,
    confirmTurnChange,
    triggerTurnTransition,
    updateExplored
  };
}
