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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#101d20]/96 backdrop-blur-lg border-t-2 border-amber-700/75 safe-area-pb">
      {/* Selected unit info */}
      {selectedUnit ? (
        <div className="px-4 py-3">
          {/* Unit header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`relative rounded-md border ${selectedUnit.owner === 'P1' ? 'border-sky-500/55 bg-sky-950/70' : 'border-rose-500/55 bg-rose-950/70'}`}>
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
                <div className="font-bold text-slate-100 text-sm">{selectedUnit.template.name}</div>
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
              <div className="flex items-center gap-1 text-xs text-amber-100/80 mb-1">
                <Heart className="w-3 h-3 text-rose-300" />
                <span className="font-mono">{selectedUnit.currentHp}/{selectedUnit.template.hp}</span>
              </div>
              <div className="w-20 h-2 bg-[#1e2d30] rounded-full overflow-hidden border border-amber-900/45">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedUnit.currentHp / selectedUnit.template.hp > 0.5
                      ? 'bg-emerald-500'
                      : selectedUnit.currentHp / selectedUnit.template.hp > 0.25
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${(selectedUnit.currentHp / selectedUnit.template.hp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between bg-[#18282b]/82 border border-amber-700/40 rounded-md p-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Sword className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-xs font-bold text-amber-50">{selectedUnit.template.atk}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-300" />
                <span className="text-xs font-bold text-amber-50">{selectedUnit.template.def}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-xs font-bold text-amber-50">{selectedUnit.template.mov}</span>
              </div>
            </div>

            {canAttack && (
              <div className="flex items-center gap-1 px-2 py-1 bg-rose-900/40 rounded border border-rose-500/35">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-rose-200">EN RANGO</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 text-center text-amber-100/60 text-sm">
          Toca un Pokémon para seleccionarlo
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={onEndTurn}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-2 ui-plate border-amber-700/80 hover:from-[#f8efd4] hover:to-[#ecddba] active:translate-y-[1px] active:border-b-[3px] font-bold transition-all"
        >
          <SkipForward className="w-5 h-5" />
          <span>Pasar Turno</span>
        </button>

        <button
          onClick={onHelp}
          className="p-3 ui-plate border-stone-500/80 bg-gradient-to-b from-stone-100 to-stone-200 text-stone-700 hover:from-stone-50 hover:to-stone-100 transition-all active:translate-y-[1px] active:border-b-[3px]"
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
