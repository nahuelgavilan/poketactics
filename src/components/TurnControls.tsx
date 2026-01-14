import { Flag, Users, ChevronRight } from 'lucide-react';
import type { Player } from '../types/game';

interface TurnControlsProps {
  currentPlayer: Player;
  isMyTurn: boolean;
  movedCount: number;
  totalCount: number;
  gamePhase: string;
  onEndTurn: () => void;
  isMultiplayer?: boolean;
}

/**
 * Turn Controls - Fire Emblem/GBA style
 * Shows turn progress and end turn button
 * Always visible during your turn (SELECT phase)
 */
export function TurnControls({
  currentPlayer,
  isMyTurn,
  movedCount,
  totalCount,
  gamePhase,
  onEndTurn,
  isMultiplayer
}: TurnControlsProps) {
  const isBlue = currentPlayer === 'P1';
  const allMoved = movedCount === totalCount && totalCount > 0;

  // Don't show during action menu or when not your turn in multiplayer
  if (gamePhase === 'ACTION_MENU') {
    return null;
  }

  // Waiting state for multiplayer
  if (isMultiplayer && !isMyTurn) {
    return (
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
    );
  }

  return (
    <div className="absolute top-1 right-1 md:top-3 md:right-3 z-20 flex flex-col items-end gap-2">
      {/* Phase indicator */}
      {gamePhase === 'SELECT' && (
        <div className="
          px-2 py-1 md:px-3 md:py-1.5 rounded-lg
          text-[10px] md:text-xs font-bold uppercase tracking-wide
          bg-slate-800/90 border border-slate-600 text-slate-300
          backdrop-blur-sm shadow-lg
        ">
          Selecciona unidad
        </div>
      )}

      {gamePhase === 'MOVING' && (
        <div className="
          px-2 py-1 md:px-3 md:py-1.5 rounded-lg
          text-[10px] md:text-xs font-bold uppercase tracking-wide
          bg-blue-900/90 border border-blue-500/50 text-blue-300
          backdrop-blur-sm shadow-lg shadow-blue-500/20
        ">
          Elige destino
        </div>
      )}

      {gamePhase === 'ATTACKING' && (
        <div className="
          px-2 py-1 md:px-3 md:py-1.5 rounded-lg
          text-[10px] md:text-xs font-bold uppercase tracking-wide
          bg-red-900/90 border border-red-500/50 text-red-300
          backdrop-blur-sm shadow-lg shadow-red-500/30
        ">
          Elige objetivo
        </div>
      )}

      {/* GBA-style end turn panel - ALWAYS visible during SELECT phase */}
      {isMyTurn && gamePhase === 'SELECT' && (
        <div className="
          relative
          bg-gradient-to-b from-amber-50 to-amber-100
          border-[2px] border-amber-900
          rounded-sm
          shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]
          overflow-hidden
          min-w-[110px] md:min-w-[150px]
          animate-menu-pop
        ">
          {/* Inner border */}
          <div className="absolute inset-[1px] border border-amber-300 rounded-sm pointer-events-none" />

          {/* Header with progress */}
          <div className="
            bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700
            px-2 py-1 md:px-3
            border-b-2 border-amber-900
            flex items-center justify-between gap-2
          ">
            <span className="
              text-[8px] md:text-[9px] font-bold uppercase tracking-wider
              text-amber-100
              drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]
            ">
              Tu Turno
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-200" />
              <span className="
                text-[9px] md:text-[10px] font-bold
                text-amber-100
                drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]
              ">
                {movedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-amber-200 border-b border-amber-300">
            <div
              className={`h-full transition-all duration-300 ${
                allMoved
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : movedCount > 0
                  ? isBlue
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${totalCount > 0 ? (movedCount / totalCount) * 100 : 0}%` }}
            />
          </div>

          {/* End turn button */}
          <button
            onClick={onEndTurn}
            className={`
              group flex items-center justify-center gap-1.5 w-full
              px-2 py-2 md:px-3 md:py-2.5
              text-[10px] md:text-xs font-bold uppercase tracking-wide
              transition-all duration-75
              border-t border-amber-300/50
              ${allMoved
                ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 hover:from-emerald-200 hover:to-emerald-100'
                : isBlue
                ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 hover:from-blue-200 hover:to-blue-100'
                : 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 hover:from-red-200 hover:to-red-100'
              }
              active:translate-y-[1px]
            `}
          >
            <Flag className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="drop-shadow-[0.5px_0.5px_0_rgba(255,255,255,0.8)]">
              {allMoved ? '¡Terminar!' : 'Fin Turno'}
            </span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Hint text */}
          {!allMoved && movedCount === 0 && (
            <div className="px-2 py-1 bg-amber-100/50 border-t border-amber-300/30">
              <p className="text-[8px] text-amber-700/70 text-center">
                Puedes terminar cuando quieras
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
