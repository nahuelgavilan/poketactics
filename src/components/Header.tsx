import React from 'react';
import { Swords, RefreshCw, Home } from 'lucide-react';
import type { Player } from '../types/game';

interface HeaderProps {
  currentPlayer: Player;
  onRestart: () => void;
  onMenu?: () => void;
}

export function Header({ currentPlayer, onRestart, onMenu }: HeaderProps) {
  return (
    <header className="w-full bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg z-40 safe-area-pt shrink-0">
      <div className="max-w-5xl mx-auto px-2 py-1.5 md:px-4 md:py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {onMenu && (
            <button
              onClick={onMenu}
              className="p-2 -ml-1 md:hidden bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              title="Volver al menú"
            >
              <Home size={18} className="text-slate-400" />
            </button>
          )}
          <h1 className="text-base md:text-xl font-black italic tracking-tight flex items-center gap-1.5 md:gap-2">
            <Swords className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
            <span className="hidden xs:inline">
              <span className="text-white">POKÉ</span>
              <span className="text-amber-400">TACTICS</span>
            </span>
            <span className="xs:hidden text-amber-400">PT</span>
          </h1>
        </div>

        {/* Player indicators */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* P1 indicator */}
          <div
            className={`
              relative px-3 py-1.5 md:px-4 md:py-1.5 rounded-full font-bold text-xs md:text-sm
              border-2 transition-all duration-300
              ${currentPlayer === 'P1'
                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105'
                : 'bg-slate-700/50 border-slate-600 text-slate-500 scale-95'
              }
            `}
          >
            {currentPlayer === 'P1' && (
              <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
            )}
            <span className="relative">P1</span>
            <span className="relative hidden md:inline ml-1">AZUL</span>
          </div>

          {/* VS */}
          <div className="text-slate-600 font-mono text-[10px] md:text-xs font-bold">VS</div>

          {/* P2 indicator */}
          <div
            className={`
              relative px-3 py-1.5 md:px-4 md:py-1.5 rounded-full font-bold text-xs md:text-sm
              border-2 transition-all duration-300
              ${currentPlayer === 'P2'
                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105'
                : 'bg-slate-700/50 border-slate-600 text-slate-500 scale-95'
              }
            `}
          >
            {currentPlayer === 'P2' && (
              <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
            )}
            <span className="relative">P2</span>
            <span className="relative hidden md:inline ml-1">ROJO</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRestart}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
            title="Reiniciar partida"
          >
            <RefreshCw size={18} className="text-slate-400 group-hover:text-white group-hover:rotate-180 transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* Safe area for iOS notch */}
      <style>{`
        .safe-area-pt {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </header>
  );
}
