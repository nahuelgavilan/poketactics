import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState, useVision } from './hooks';
import { useMultiplayer, ClientGameState, ActionResult } from './hooks/useMultiplayer';
import {
  Header,
  GameBoard,
  BattleCinematic,
  BattleZoomTransition,
  CaptureModal,
  TurnTransition,
  VictoryScreen,
  EvolutionCinematic,
  MultiplayerLobby,
  TerrainInfoPanel
} from './components';
import { CaptureMinigame } from './components/CaptureMinigame';
import { StartScreen } from './components/StartScreen';
import { HowToPlay } from './components/HowToPlay';
import type { Position, TerrainType, Unit, GameMap, PokemonTemplate, EvolutionData } from './types/game';

export default function Game() {
  const {
    map,
    units,
    currentPlayer,
    gameState,
    gamePhase,
    selectedUnit,
    moveRange,
    attackRange,
    battleData,
    captureData,
    evolutionData,
    winner,
    exploredP1,
    exploredP2,
    // Multiplayer state
    myPlayer,
    isMultiplayer,
    isMyTurn,
    // Preview state
    pendingPosition,
    // Actions
    initGame,
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
    triggerServerEvolution
  } = useGameState();

  // Multiplayer hook at Game level (persists across lobby → game)
  const multiplayer = useMultiplayer();
  const {
    onGameStarted,
    onStateUpdate,
    onActionResult,
    sendMove,
    sendAttack,
    sendWait,
    sendCapture,
    sendEndTurn,
    roomStatus
  } = multiplayer;

  // Track if we're in a multiplayer game (started from lobby)
  const isInMultiplayerGame = useRef(false);

  // Multiplayer-aware action handlers
  // In multiplayer, send to server; locally, use local handlers
  const handleSelectWait = useCallback(() => {
    if (isInMultiplayerGame.current && selectedUnit && pendingPosition) {
      // In multiplayer: send move, then check for encounter, then wait
      console.log('[Multiplayer] Sending move:', selectedUnit.uid, pendingPosition);
      sendMove(selectedUnit.uid, pendingPosition.x, pendingPosition.y);

      // Create a "moved" unit to check for encounters at the new position
      const movedUnit = { ...selectedUnit, x: pendingPosition.x, y: pendingPosition.y };

      // Check for wild encounter at the new position (client-side 30% chance)
      if (triggerMultiplayerEncounter(movedUnit)) {
        // Encounter triggered - minigame will show
        // After minigame, capture result will be handled
        // Don't send wait yet - it will happen after minigame resolves
        console.log('[Multiplayer] Wild encounter triggered!');
        cancelAction();
        return;
      }

      // No encounter - send wait to server
      sendWait(selectedUnit.uid);
      cancelAction();
    } else {
      // Local game: use local handler
      selectWait();
    }
  }, [selectedUnit, pendingPosition, sendMove, sendWait, selectWait, cancelAction, triggerMultiplayerEncounter]);

  const handleSelectAttack = useCallback(() => {
    if (isInMultiplayerGame.current && selectedUnit && pendingPosition) {
      // In multiplayer: first move unit, then enter attack phase
      // Server will validate the move and send state update
      console.log('[Multiplayer] Sending move for attack:', selectedUnit.uid, pendingPosition);
      sendMove(selectedUnit.uid, pendingPosition.x, pendingPosition.y);
      // Continue to attack phase locally (so user can select target)
      selectAttack();
    } else {
      // Local game
      selectAttack();
    }
  }, [selectedUnit, pendingPosition, sendMove, selectAttack]);

  // When battle ends - in multiplayer, the server already has the result
  // Local endBattle updates UI; server state-update will sync final state
  const handleEndBattle = useCallback(() => {
    // In multiplayer, the attack was already sent when clicking the target
    // Just run local end battle for UI updates
    endBattle();

    // In multiplayer, check if there's a pending evolution to show
    if (isInMultiplayerGame.current && pendingEvolutionRef.current) {
      const { unitId, newTemplate } = pendingEvolutionRef.current;
      pendingEvolutionRef.current = null;
      // Small delay to let battle state clear, then trigger evolution
      setTimeout(() => {
        triggerServerEvolution(unitId, newTemplate);
      }, 100);
    }
  }, [endBattle, triggerServerEvolution]);

  // Handle end turn - in multiplayer sends to server, locally shows transition
  const handleEndTurn = useCallback(() => {
    if (isInMultiplayerGame.current) {
      // Multiplayer: tell server we're ending our turn
      console.log('[Multiplayer] Sending end turn');
      sendEndTurn();
      // Server will change currentPlayer and send state-update to both players
      // NO local transition screen - that's only for local "pass the phone"
    } else {
      // Local game: show transition screen to pass the phone
      triggerTurnTransition();
    }
  }, [sendEndTurn, triggerTurnTransition]);

  // Track unit for multiplayer capture (need to send capture result after minigame)
  const pendingCaptureUnitRef = useRef<string | null>(null);

  // Multiplayer-aware capture handlers
  // These now accept damageTaken to apply wild Pokemon counter-attack damage
  const handleCaptureSuccess = useCallback((damageTaken: number) => {
    if (isInMultiplayerGame.current && selectedUnit) {
      // Store unit ID for when capture modal completes
      pendingCaptureUnitRef.current = selectedUnit.uid;
    }
    // Show the capture modal (works for both local and multiplayer)
    // Pass damageTaken to apply to player's Pokemon
    onCaptureMinigameSuccess(damageTaken);
  }, [selectedUnit, onCaptureMinigameSuccess]);

  const handleCaptureFail = useCallback((damageTaken: number) => {
    if (isInMultiplayerGame.current && selectedUnit) {
      // Tell server capture failed - just marks unit as moved
      console.log('[Multiplayer] Capture failed, sending to server');
      sendCapture(selectedUnit.uid, false);
    }
    // Run local handler (shows message, marks unit as moved locally)
    // Pass damageTaken to apply to player's Pokemon
    onCaptureMinigameFail(damageTaken);
  }, [selectedUnit, sendCapture, onCaptureMinigameFail]);

  const handleCaptureFlee = useCallback((damageTaken: number) => {
    if (isInMultiplayerGame.current && selectedUnit) {
      // Player fled - send wait to server (unit used their turn)
      console.log('[Multiplayer] Player fled encounter, sending wait');
      sendWait(selectedUnit.uid);
    }
    // Run local handler (damageTaken is usually 0 when fleeing)
    onCaptureMinigameFlee(damageTaken);
  }, [selectedUnit, sendWait, onCaptureMinigameFlee]);

  const handleConfirmCapture = useCallback(() => {
    if (isInMultiplayerGame.current && pendingCaptureUnitRef.current) {
      // Tell server capture succeeded - server will create the new unit
      console.log('[Multiplayer] Capture succeeded, sending to server');
      sendCapture(pendingCaptureUnitRef.current, true);
      pendingCaptureUnitRef.current = null;
    }
    // Run local handler (in multiplayer, server's state-update will sync the new unit)
    confirmCapture();
  }, [sendCapture, confirmCapture]);

  // Track pending battle for multiplayer (to show animation after server confirms)
  const pendingBattleRef = useRef<{ attackerId: string; defenderId: string } | null>(null);
  // Track pending evolution for multiplayer (to show after battle animation)
  const pendingEvolutionRef = useRef<{ unitId: string; newTemplate: PokemonTemplate } | null>(null);

  // Handle tile clicks - in multiplayer ATTACKING phase, send attack to server
  const handleTileClickMultiplayer = useCallback((x: number, y: number) => {
    if (isInMultiplayerGame.current && gamePhase === 'ATTACKING' && selectedUnit) {
      // Check if clicking on a valid attack target
      const target = units.find(u => u.x === x && u.y === y && u.owner !== selectedUnit.owner);
      if (target && attackRange.some(a => a.x === x && a.y === y)) {
        console.log('[Multiplayer] Sending attack:', selectedUnit.uid, target.uid);
        // Store pending battle info to show animation when server confirms
        pendingBattleRef.current = { attackerId: selectedUnit.uid, defenderId: target.uid };
        sendAttack(selectedUnit.uid, target.uid);
        // DON'T run local battle - wait for server action-result
        return;
      }
    }
    // Use local handler for non-attack clicks (handles phase transitions, selection, etc)
    handleTileClick(x, y);
  }, [gamePhase, selectedUnit, units, attackRange, sendAttack, handleTileClick]);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<{ x: number; y: number; terrain: TerrainType } | null>(null);

  // Wrapper for tile click that also handles terrain info
  const handleTileClickWithTerrain = useCallback((x: number, y: number) => {
    // Check if there's a unit at this position
    const unitAtPosition = units.find(u => u.x === x && u.y === y);

    // If clicking empty tile while in SELECT phase and no unit selected
    if (!unitAtPosition && gamePhase === 'SELECT' && !selectedUnit && map[y] && map[y][x] !== undefined) {
      // Toggle: if clicking same tile, close panel; otherwise show new terrain
      if (selectedTerrain && selectedTerrain.x === x && selectedTerrain.y === y) {
        setSelectedTerrain(null);
      } else {
        setSelectedTerrain({ x, y, terrain: map[y][x] });
      }
      return;
    }

    // Clear terrain selection when doing any game action
    setSelectedTerrain(null);

    // Pass to multiplayer-aware handler
    handleTileClickMultiplayer(x, y);
  }, [units, gamePhase, selectedUnit, map, handleTileClickMultiplayer, selectedTerrain]);

  // Clear terrain selection when game state changes
  useEffect(() => {
    if (selectedUnit || gamePhase !== 'SELECT') {
      setSelectedTerrain(null);
    }
  }, [selectedUnit, gamePhase]);

  // In multiplayer, always show fog from your own perspective (myPlayer)
  // In local game, show fog based on current player
  const fogPlayer = isMultiplayer && myPlayer ? myPlayer : currentPlayer;

  // Get the correct explored state based on fog player
  const currentExplored = fogPlayer === 'P1' ? exploredP1 : exploredP2;

  // Calculate visibility using fog of war - always from your perspective
  const visibility = useVision(units, fogPlayer, currentExplored, map);

  // Update explored tiles when visibility changes (only if actually different)
  useEffect(() => {
    if (visibility.explored.length > 0 && gameState === 'playing') {
      // Check if any tiles are newly explored to avoid infinite loop
      let hasNewExplored = false;
      for (let y = 0; y < visibility.explored.length && !hasNewExplored; y++) {
        for (let x = 0; x < visibility.explored[y].length && !hasNewExplored; x++) {
          if (visibility.explored[y][x] && !currentExplored[y]?.[x]) {
            hasNewExplored = true;
          }
        }
      }
      if (hasNewExplored) {
        updateExplored(fogPlayer, visibility.explored);
      }
    }
  }, [visibility.explored, fogPlayer, gameState, updateExplored, currentExplored]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Wire up multiplayer callbacks - receives game state from server
  useEffect(() => {
    // When server says game started, use server state (not local initGame)
    onGameStarted.current = (serverState: ClientGameState) => {
      console.log('[Multiplayer] Game started with server state:', serverState);
      isInMultiplayerGame.current = true;
      setShowMultiplayer(false);

      // Convert server state to local format and apply
      // Cast map from number[][] to GameMap (TerrainType[][])
      setMultiplayerState({
        map: serverState.map as GameMap,
        units: serverState.units as Unit[],
        turn: serverState.turn,
        currentPlayer: serverState.currentPlayer,
        myPlayer: serverState.myPlayer,
        status: serverState.status,
        winner: serverState.winner,
        visibility: serverState.visibility
      });
    };

    // When server sends state update (after opponent's turn, etc)
    onStateUpdate.current = (serverState: ClientGameState) => {
      console.log('[Multiplayer] State update from server:', serverState);
      if (!isInMultiplayerGame.current) return;

      setMultiplayerState({
        map: serverState.map as GameMap,
        units: serverState.units as Unit[],
        turn: serverState.turn,
        currentPlayer: serverState.currentPlayer,
        myPlayer: serverState.myPlayer,
        status: serverState.status,
        winner: serverState.winner,
        visibility: serverState.visibility
      });
    };

    // When server sends action result (move validated, attack result, etc)
    onActionResult.current = (result: ActionResult) => {
      console.log('[Multiplayer] Action result from server:', result);

      // Handle attack results - trigger battle animation
      if (result.type === 'attack' && pendingBattleRef.current) {
        const { attackerId, defenderId } = pendingBattleRef.current;
        pendingBattleRef.current = null;

        // Store evolution data to trigger after battle animation
        if (result.evolution) {
          pendingEvolutionRef.current = result.evolution;
        }

        // Trigger battle animation with server-provided damage values
        startServerBattle(attackerId, defenderId, result.damage, result.counterDamage);
      }
    };
  }, [onGameStarted, onStateUpdate, onActionResult, setMultiplayerState, startServerBattle]);

  // Show start screen
  if (gameState === 'menu') {
    if (showMultiplayer) {
      return (
        <MultiplayerLobby
          onBack={() => setShowMultiplayer(false)}
          connectionStatus={multiplayer.connectionStatus}
          roomStatus={multiplayer.roomStatus}
          roomId={multiplayer.roomId}
          myPlayer={multiplayer.myPlayer}
          error={multiplayer.error}
          connect={multiplayer.connect}
          createRoom={multiplayer.createRoom}
          joinRoom={multiplayer.joinRoom}
          startGame={multiplayer.startGame}
        />
      );
    }

    return (
      <>
        <StartScreen
          onStartGame={initGame}
          onHowToPlay={() => setShowHowToPlay(true)}
          onMultiplayer={() => setShowMultiplayer(true)}
        />
        {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
      </>
    );
  }

  // Check if all player units have moved (use myPlayer in multiplayer)
  const activePlayer = isMultiplayer && myPlayer ? myPlayer : currentPlayer;
  const playerUnits = units.filter(u => u.owner === activePlayer);
  const allMoved = playerUnits.length > 0 && playerUnits.every(u => u.hasMoved);

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 flex flex-col select-none overflow-hidden">
      {/* Header - compact with dropdown menu */}
      <Header
        currentPlayer={currentPlayer}
        onRestart={initGame}
        onMenu={() => window.location.reload()}
        onEndTurn={handleEndTurn}
        onHowToPlay={() => setShowHowToPlay(true)}
        myPlayer={myPlayer}
        isMultiplayer={isMultiplayer}
        movedCount={playerUnits.filter(u => u.hasMoved).length}
        totalCount={playerUnits.length}
        gamePhase={gamePhase}
      />

      {/* Main game area - fills remaining space, centers board, no scroll */}
      {/* Hidden during transition to prevent flash (LOCAL GAME ONLY - multiplayer doesn't use transition screen) */}
      <main className={`flex-1 min-h-0 relative flex items-center justify-center p-1 md:p-3 overflow-hidden ${gameState === 'transition' && !isInMultiplayerGame.current ? 'invisible' : ''}`}>
        {/* Game Board */}
        <GameBoard
          map={map}
          units={units}
          selectedUnit={selectedUnit}
          moveRange={moveRange}
          attackRange={attackRange}
          pendingPosition={pendingPosition}
          onTileClick={handleTileClickWithTerrain}
          isMobile={isMobile}
          currentPlayer={fogPlayer}
          visibility={visibility}
          // Action menu (Fire Emblem style - appears next to tile)
          showActionMenu={gamePhase === 'ACTION_MENU' && !!pendingPosition}
          canAttack={attackRange.length > 0}
          onAttack={handleSelectAttack}
          onWait={handleSelectWait}
          onCancel={cancelAction}
        />

        {/* Phase indicator - floating top-right during MOVING/ATTACKING */}
        {gameState === 'playing' && (gamePhase === 'MOVING' || gamePhase === 'ATTACKING') && (
          <div className="absolute top-1 right-1 md:top-3 md:right-3 z-20 animate-in">
            <div className={`
              px-3 py-1.5 md:px-4 md:py-2 rounded-lg
              text-[10px] md:text-xs font-bold uppercase tracking-wide
              backdrop-blur-sm shadow-lg
              ${gamePhase === 'MOVING'
                ? 'bg-blue-900/90 border border-blue-500/50 text-blue-300 shadow-blue-500/20'
                : 'bg-red-900/90 border border-red-500/50 text-red-300 shadow-red-500/30'
              }
            `}>
              {gamePhase === 'MOVING' ? 'Elige destino' : 'Elige objetivo'}
            </div>
          </div>
        )}

        {/* Multiplayer waiting indicator */}
        {gameState === 'playing' && isMultiplayer && !isMyTurn && gamePhase === 'SELECT' && (
          <div className="absolute top-1 right-1 md:top-3 md:right-3 z-20">
            <div className="
              px-3 py-1.5 md:px-4 md:py-2 rounded-lg
              text-[10px] md:text-xs font-bold uppercase tracking-wide
              bg-amber-900/90 border border-amber-500/50 text-amber-300
              backdrop-blur-sm shadow-lg
            ">
              <span className="animate-pulse">Esperando rival...</span>
            </div>
          </div>
        )}

        {/* Selected Unit Info - floating top-left on desktop */}
        {selectedUnit && !isMobile && (
          <div className="absolute top-3 left-3 animate-scale-in">
            <div className={`
              relative bg-slate-900/95 backdrop-blur-md rounded-xl p-3
              border shadow-2xl
              ${selectedUnit.owner === 'P1'
                ? 'border-blue-500/50 shadow-blue-500/20'
                : 'border-red-500/50 shadow-red-500/20'
              }
            `}>
              {/* Glow effect */}
              <div className={`
                absolute inset-0 rounded-xl blur-xl opacity-30
                ${selectedUnit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}
              `} />

              <div className="relative flex items-center gap-3">
                {/* Pokemon sprite mini */}
                <div className={`
                  w-10 h-10 rounded-lg overflow-hidden
                  ${selectedUnit.owner === 'P1' ? 'bg-blue-950/80' : 'bg-red-950/80'}
                `}>
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${selectedUnit.template.id}.gif`}
                    className={`w-full h-full object-contain ${selectedUnit.owner === 'P1' ? 'scale-x-[-1]' : ''}`}
                    style={{ imageRendering: 'pixelated' }}
                    alt=""
                  />
                </div>

                <div>
                  <div className="font-bold text-sm tracking-wide">{selectedUnit.template.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className={`
                      px-1.5 py-0.5 rounded text-[10px] font-mono
                      ${selectedUnit.currentHp / selectedUnit.template.hp > 0.5
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : selectedUnit.currentHp / selectedUnit.template.hp > 0.25
                        ? 'bg-amber-900/50 text-amber-400'
                        : 'bg-red-900/50 text-red-400'
                      }
                    `}>
                      HP {selectedUnit.currentHp}/{selectedUnit.template.hp}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      ATK {selectedUnit.template.atk}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      MOV {selectedUnit.template.mov}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: Selected unit stats panel - bottom of screen */}
        {selectedUnit && isMobile && (
          <div className="absolute bottom-2 left-2 right-2 animate-slide-up z-30">
            <div className={`
              flex items-center gap-3 px-3 py-2
              bg-slate-950/95 backdrop-blur-xl rounded-xl
              border-2 shadow-2xl
              ${selectedUnit.owner === 'P1'
                ? 'border-blue-500/60 shadow-blue-500/30'
                : 'border-red-500/60 shadow-red-500/30'
              }
            `}>
              {/* Pokemon sprite */}
              <div className={`
                relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0
                ${selectedUnit.owner === 'P1' ? 'bg-blue-950' : 'bg-red-950'}
              `}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${selectedUnit.template.id}.gif`}
                  className={`w-full h-full object-contain ${selectedUnit.owner === 'P1' ? 'scale-x-[-1]' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                  alt=""
                />
                {/* Player color indicator */}
                <div className={`
                  absolute bottom-0 left-0 right-0 h-1
                  ${selectedUnit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}
                `} />
              </div>

              {/* Name and stats */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{selectedUnit.template.name}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {/* HP */}
                  <div className={`
                    flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold
                    ${selectedUnit.currentHp / selectedUnit.template.hp > 0.5
                      ? 'bg-emerald-900/80 text-emerald-400'
                      : selectedUnit.currentHp / selectedUnit.template.hp > 0.25
                      ? 'bg-amber-900/80 text-amber-400'
                      : 'bg-red-900/80 text-red-400'
                    }
                  `}>
                    <span className="opacity-60">HP</span>
                    <span>{selectedUnit.currentHp}/{selectedUnit.template.hp}</span>
                  </div>
                  {/* ATK */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-900/80 text-orange-400">
                    <span className="opacity-60">ATK</span>
                    <span>{selectedUnit.template.atk}</span>
                  </div>
                  {/* MOV */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-900/80 text-sky-400">
                    <span className="opacity-60">MOV</span>
                    <span>{selectedUnit.template.mov}</span>
                  </div>
                  {/* DEF */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700/80 text-slate-300">
                    <span className="opacity-60">DEF</span>
                    <span>{selectedUnit.template.def}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terrain Info Panel - shows when clicking empty tile */}
        {selectedTerrain && gameState === 'playing' && !selectedUnit && (
          <TerrainInfoPanel
            terrain={selectedTerrain.terrain}
            onClose={() => setSelectedTerrain(null)}
          />
        )}

      </main>

      {/* INSTANT blocking overlay for turn transition - LOCAL GAME ONLY */}
      {/* In multiplayer, there's no "pass the phone" screen */}
      {gameState === 'transition' && !isInMultiplayerGame.current && (
        <div
          className="fixed inset-0 z-40 bg-slate-950"
          style={{
            // Force synchronous paint - no animation delay
            willChange: 'auto',
            contain: 'strict'
          }}
        />
      )}

      {/* Overlays - full screen modals */}
      {/* TurnTransition is LOCAL GAME ONLY - for passing the phone */}
      {gameState === 'transition' && !isInMultiplayerGame.current && (
        <TurnTransition
          currentPlayer={currentPlayer}
          onConfirm={confirmTurnChange}
        />
      )}

      {gameState === 'battle_zoom' && battleData && (
        <BattleZoomTransition
          attacker={battleData.attacker}
          defender={battleData.defender}
          map={map}
          onComplete={confirmBattleZoom}
        />
      )}

      {gameState === 'battle' && battleData && (
        <BattleCinematic {...battleData} onComplete={handleEndBattle} />
      )}

      {gameState === 'capture_minigame' && captureData && (
        <CaptureMinigame
          pokemon={captureData.pokemon}
          player={captureData.player}
          playerPokemon={selectedUnit?.template}
          onSuccess={handleCaptureSuccess}
          onFail={handleCaptureFail}
          onFlee={handleCaptureFlee}
        />
      )}

      {gameState === 'capture' && captureData && (
        <CaptureModal {...captureData} onComplete={handleConfirmCapture} />
      )}

      {gameState === 'evolution' && evolutionData && (
        <EvolutionCinematic evolutionData={evolutionData} onComplete={confirmEvolution} />
      )}

      {gameState === 'victory' && winner && (
        <VictoryScreen winner={winner} onPlayAgain={initGame} />
      )}

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}

      {/* Global styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-in-from-left {
          animation: slideInLeft 0.2s ease-out;
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Fire Emblem style action menu animations */
        .animate-menu-pop {
          animation: menuPop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes menuPop {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        .animate-menu-item-slide {
          animation: menuItemSlide 0.12s ease-out both;
        }

        @keyframes menuItemSlide {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Terrain animations */
        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }

        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }

        .animate-heal-pulse {
          animation: healPulse 2s ease-in-out infinite;
        }

        @keyframes healPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
