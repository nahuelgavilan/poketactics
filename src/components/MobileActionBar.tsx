import React from 'react';
import { Sword, Shield, Zap, SkipForward, HelpCircle, Heart } from 'lucide-react';
import { TYPE_COLORS } from '../constants/types';
import type { Unit } from '../types/game';

interface MobileActionBarProps {
  selectedUnit: Unit | null;
  canAttack: boolean;
  onEndTurn: () => void;
  onHelp: () => void;
}

export function MobileActionBar({
  selectedUnit,
  canAttack,
  onEndTurn,
  onHelp
}: MobileActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 safe-area-pb">
      {/* Selected unit info */}
      {selectedUnit ? (
        <div className="px-4 py-3">
          {/* Unit header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${selectedUnit.template.id}.png`}
                  alt={selectedUnit.template.name}
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                {selectedUnit.hasMoved && (
                  <div className="absolute inset-0 bg-black/50 rounded" />
                )}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{selectedUnit.template.name}</div>
                <div className="flex gap-1">
                  {selectedUnit.template.types.map(type => (
                    <span
                      key={type}
                      className={`text-[9px] px-1.5 py-0.5 rounded text-white uppercase font-bold ${TYPE_COLORS[type] || 'bg-gray-500'}`}
                    >
                      {type.slice(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <Heart className="w-3 h-3 text-red-400" />
                <span className="font-mono">{selectedUnit.currentHp}/{selectedUnit.template.hp}</span>
              </div>
              <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedUnit.currentHp / selectedUnit.template.hp > 0.5
                      ? 'bg-green-500'
                      : selectedUnit.currentHp / selectedUnit.template.hp > 0.25
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(selectedUnit.currentHp / selectedUnit.template.hp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Sword className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-white">{selectedUnit.template.atk}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-white">{selectedUnit.template.def}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold text-white">{selectedUnit.template.mov}</span>
              </div>
            </div>

            {canAttack && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-lg border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-400">EN RANGO</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 text-center text-slate-500 text-sm">
          Toca un Pokémon para seleccionarlo
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={onEndTurn}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-700"
        >
          <SkipForward className="w-5 h-5" />
          <span>Pasar Turno</span>
        </button>

        <button
          onClick={onHelp}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-400 rounded-xl transition-all border border-slate-700"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Safe area padding for iOS */}
      <style>{`
        .safe-area-pb {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
