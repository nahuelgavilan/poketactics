import { useState, useEffect } from 'react';
import { useGameState, useVision } from './hooks';
import {
  Header,
  GameBoard,
  Sidebar,
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
import { MobileActionBar } from './components/MobileActionBar';

export default function Game() {
  const {
    map,
    units,
    currentPlayer,
    gameState,
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
  } = useGameState();

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Get the correct explored state based on current player
  const currentExplored = currentPlayer === 'P1' ? exploredP1 : exploredP2;

  // Calculate visibility using fog of war (pass map for terrain vision bonuses)
  const visibility = useVision(units, currentPlayer, currentExplored, map);

  // Update explored tiles when visibility changes
  useEffect(() => {
    if (visibility.explored.length > 0 && gameState === 'playing') {
      updateExplored(currentPlayer, visibility.explored);
    }
  }, [visibility.explored, currentPlayer, gameState, updateExplored]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle start game from menu
  const handleStartGame = () => {
    initGame();
  };

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
          onStartGame={handleStartGame}
          onHowToPlay={() => setShowHowToPlay(true)}
          onMultiplayer={() => setShowMultiplayer(true)}
        />
        {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-slate-100 font-sans flex flex-col select-none overflow-hidden">
      {/* Header */}
      <Header
        currentPlayer={currentPlayer}
        onRestart={initGame}
        onMenu={() => window.location.reload()}
      />

      {/* Overlays */}
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

      {/* Main Game Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-3 md:p-4 flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start justify-start md:justify-center overflow-auto">
        {/* Game Board - Mobile optimized */}
        <div className="w-full md:w-auto flex justify-center">
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
        </div>

        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block">
          <Sidebar
            selectedUnit={selectedUnit}
            logs={logs}
            onEndTurn={triggerTurnTransition}
          />
        </div>
      </main>

      {/* Mobile Action Bar - Only on mobile when no action menu */}
      {isMobile && !actionMenu.isOpen && (
        <MobileActionBar
          selectedUnit={selectedUnit}
          canAttack={attackRange.length > 0}
          onEndTurn={triggerTurnTransition}
          onHelp={() => setShowHowToPlay(true)}
        />
      )}

      {/* Action Menu - Shows when unit is selected */}
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

      {/* Custom styles for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
