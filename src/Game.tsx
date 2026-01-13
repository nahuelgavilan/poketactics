import { useState, useEffect } from 'react';
import { useGameState, useVision } from './hooks';
import {
  Header,
  GameBoard,
  BattleCinematic,
  CaptureModal,
  TurnTransition,
  VictoryScreen,
  ActionMenu,
  EvolutionCinematic,
  MultiplayerLobby
} from './components';
import { CaptureMinigame } from './components/CaptureMinigame';
import { StartScreen } from './components/StartScreen';
import { HowToPlay } from './components/HowToPlay';
import { Clock, HelpCircle } from 'lucide-react';

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
  } = useGameState();

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Get the correct explored state based on current player
  const currentExplored = currentPlayer === 'P1' ? exploredP1 : exploredP2;

  // Calculate visibility using fog of war
  const visibility = useVision(units, currentPlayer, currentExplored, map);

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
        updateExplored(currentPlayer, visibility.explored);
      }
    }
  }, [visibility.explored, currentPlayer, gameState, updateExplored, currentExplored]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show start screen
  if (gameState === 'menu') {
    if (showMultiplayer) {
      return (
        <MultiplayerLobby
          onBack={() => setShowMultiplayer(false)}
          onGameStart={() => {
            setShowMultiplayer(false);
            initGame();
          }}
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

  // Check if all player units have moved
  const playerUnits = units.filter(u => u.owner === currentPlayer);
  const allMoved = playerUnits.length > 0 && playerUnits.every(u => u.hasMoved);

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 flex flex-col select-none overflow-hidden">
      {/* Header - compact */}
      <Header
        currentPlayer={currentPlayer}
        onRestart={initGame}
        onMenu={() => window.location.reload()}
      />

      {/* Main game area - fills remaining space, centers board, no scroll */}
      <main className="flex-1 min-h-0 relative flex items-center justify-center p-1 md:p-3 overflow-hidden">
        {/* Game Board */}
        <GameBoard
          map={map}
          units={units}
          selectedUnit={selectedUnit}
          moveRange={moveRange}
          attackRange={attackRange}
          onTileClick={handleTileClick}
          isMobile={isMobile}
          currentPlayer={currentPlayer}
          visibility={visibility}
        />

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

        {/* Phase indicator - floating top-right, compact on mobile */}
        {gameState === 'playing' && (
          <div className="absolute top-1 right-1 md:top-3 md:right-3 flex flex-col gap-1.5 md:gap-2 items-end z-20">
            {/* Phase badge */}
            <div className={`
              relative px-2 py-1 md:px-3 md:py-1.5 rounded-lg
              text-[10px] md:text-xs font-bold uppercase tracking-wide
              border backdrop-blur-sm shadow-lg
              transition-all duration-300
              ${gamePhase === 'SELECT'
                ? 'bg-slate-800/90 border-slate-600 text-slate-300'
                : ''
              }
              ${gamePhase === 'MOVING'
                ? 'bg-blue-900/90 border-blue-500/50 text-blue-300 shadow-blue-500/20'
                : ''
              }
              ${gamePhase === 'ATTACKING'
                ? 'bg-red-900/90 border-red-500/50 text-red-300 shadow-red-500/30'
                : ''
              }
              ${gamePhase === 'ACTION_MENU'
                ? 'bg-amber-900/90 border-amber-500/50 text-amber-300 shadow-amber-500/20'
                : ''
              }
            `}>
              {gamePhase === 'SELECT' && 'Selecciona'}
              {gamePhase === 'MOVING' && 'Destino'}
              {gamePhase === 'ATTACKING' && 'Objetivo'}
              {gamePhase === 'ACTION_MENU' && 'Acción'}
            </div>

            {/* End turn button */}
            {playerUnits.some(u => u.hasMoved) && !allMoved && (
              <button
                onClick={triggerTurnTransition}
                className="
                  group flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2
                  bg-gradient-to-r from-slate-700 to-slate-800
                  hover:from-slate-600 hover:to-slate-700
                  border border-slate-600/50 hover:border-slate-500
                  rounded-lg text-[10px] md:text-xs font-semibold
                  transition-all duration-200
                  shadow-lg hover:shadow-xl hover:scale-105
                "
              >
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                <span className="hidden md:inline">Terminar turno</span>
                <span className="md:hidden">Fin</span>
              </button>
            )}
          </div>
        )}

        {/* Help button - bottom right, smaller on mobile */}
        <button
          onClick={() => setShowHowToPlay(true)}
          className="absolute bottom-2 right-2 md:bottom-4 md:right-4 p-1.5 md:p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-20"
        >
          <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Mobile: Selected unit stats panel - bottom of screen */}
        {selectedUnit && isMobile && !actionMenu.isOpen && (
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
      </main>

      {/* Action Menu - centered floating, above board */}
      {gameState === 'playing' && (
        <ActionMenu
          state={actionMenu}
          selectedUnit={selectedUnit}
          onMove={() => selectAction('move')}
          onAttack={() => selectAction('attack')}
          onCapture={() => selectAction('capture')}
          onWait={() => selectAction('wait')}
          onCancel={cancelAction}
        />
      )}

      {/* Overlays - full screen modals */}
      {gameState === 'transition' && (
        <TurnTransition
          currentPlayer={currentPlayer}
          onConfirm={confirmTurnChange}
        />
      )}

      {gameState === 'battle' && battleData && (
        <BattleCinematic {...battleData} onComplete={endBattle} />
      )}

      {gameState === 'capture_minigame' && captureData && (
        <CaptureMinigame
          pokemon={captureData.pokemon}
          player={captureData.player}
          onSuccess={onCaptureMinigameSuccess}
          onFail={onCaptureMinigameFail}
        />
      )}

      {gameState === 'capture' && captureData && (
        <CaptureModal {...captureData} onComplete={confirmCapture} />
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
      `}</style>
    </div>
  );
}
