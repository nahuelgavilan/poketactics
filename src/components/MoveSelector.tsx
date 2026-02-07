import { Undo2, Swords, Sparkles, Shield } from 'lucide-react';
import { TYPE_COLORS } from '../constants/types';
import { getDistance } from '../utils/pathfinding';
import type { Unit, Move } from '../types/game';

interface MoveSelectorProps {
  attacker: Unit;
  target: Unit;
  onSelectMove: (move: Move) => void;
  onCancel: () => void;
}

/**
 * Move picker overlay — shown during MOVE_SELECT phase.
 * Displays 4 move buttons with type color, PP, power, category, and range check.
 * Styled to match the Fire Emblem aesthetic of UnitActionMenu.
 */
export function MoveSelector({ attacker, target, onSelectMove, onCancel }: MoveSelectorProps) {
  const distance = getDistance(attacker, target);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in">
      <div className="relative w-[340px] max-w-[95vw]">
        {/* Main container */}
        <div className="
          bg-gradient-to-b from-slate-900 to-slate-950
          border-[3px] border-amber-700
          rounded-lg
          shadow-[0_0_40px_rgba(0,0,0,0.8)]
          overflow-hidden
        ">
          {/* Title bar */}
          <div className="
            bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700
            px-4 py-2
            border-b-2 border-amber-900
            flex items-center justify-between
          ">
            <span className="
              text-[11px] font-bold uppercase tracking-widest
              text-amber-100
              drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]
            ">
              Elegir Movimiento
            </span>
            <span className="text-[10px] text-amber-200/70 font-mono">
              Dist: {distance}
            </span>
          </div>

          {/* Target info */}
          <div className="px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${target.template.id}.gif`}
              className="w-8 h-8 object-contain"
              style={{ imageRendering: 'pixelated' }}
              alt=""
            />
            <div>
              <span className="text-xs font-bold text-slate-200">{target.template.name}</span>
              <div className="flex gap-1 mt-0.5">
                {target.template.types.map(type => (
                  <span key={type} className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <span className="ml-auto text-[10px] font-mono text-slate-400">
              HP {target.currentHp}/{target.template.hp}
            </span>
          </div>

          {/* Move buttons */}
          <div className="p-2 flex flex-col gap-1.5">
            {attacker.template.moves.map((move, i) => {
              const hasPP = attacker.pp[i] > 0;
              const inRange = move.range >= distance;
              const isUsable = hasPP && inRange && move.category !== 'status';
              const isStab = attacker.template.types.includes(move.type);

              return (
                <button
                  key={move.id}
                  onClick={() => isUsable && onSelectMove(move)}
                  disabled={!isUsable}
                  className={`
                    relative flex items-center gap-2 w-full
                    px-3 py-2.5
                    text-left rounded
                    border transition-all duration-75
                    animate-menu-item-slide
                    ${isUsable
                      ? 'border-slate-600 hover:border-amber-500/60 active:translate-y-[1px] cursor-pointer bg-slate-800/80 hover:bg-slate-700/80'
                      : 'border-slate-800 cursor-not-allowed bg-slate-900/60 opacity-40'
                    }
                  `}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Type color bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${TYPE_COLORS[move.type]}`} />

                  {/* Category icon */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {move.category === 'physical' ? (
                      <Swords className="w-3.5 h-3.5 text-orange-400" />
                    ) : move.category === 'special' ? (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {/* Move info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">{move.name}</span>
                      {isStab && hasPP && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold">
                          STAB
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[move.type]}`}>
                        {move.type.toUpperCase()}
                      </span>
                      {move.power > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Pow {move.power}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        Acc {move.accuracy}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Rng {move.range}
                      </span>
                    </div>
                  </div>

                  {/* PP and status */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    <span className={`text-[10px] font-mono font-bold ${
                      !hasPP ? 'text-red-400' : attacker.pp[i] <= 1 ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {attacker.pp[i]}/{move.pp}
                    </span>
                    {!inRange && hasPP && (
                      <span className="text-[8px] text-red-400 font-bold">LEJOS</span>
                    )}
                    {!hasPP && (
                      <span className="text-[8px] text-red-400 font-bold">SIN PP</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cancel button */}
          <div className="px-2 pb-2">
            <button
              onClick={onCancel}
              className="
                flex items-center justify-center gap-2 w-full
                px-3 py-2
                text-xs font-bold uppercase tracking-wide
                bg-slate-800/50 hover:bg-slate-700/50
                border border-slate-700 rounded
                text-slate-400 hover:text-slate-300
                transition-all duration-75
                active:translate-y-[1px]
              "
            >
              <Undo2 className="w-3.5 h-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
