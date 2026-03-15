import { Undo2, Swords, Sparkles, Shield } from 'lucide-react';
import { TYPE_COLORS } from '../constants/types';
import { getDistance } from '../utils/pathfinding';
import { getAnimatedFrontSprite } from '../utils/sprites';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/54 animate-in">
      <div className="relative w-[340px] max-w-[95vw]">
        {/* Main container */}
        <div className="
          bg-gradient-to-b from-[#f3e7c7] to-[#e2d1a9]
          border-[3px] border-amber-900
          rounded-sm
          shadow-[0_16px_36px_rgba(0,0,0,0.72)]
          overflow-hidden
        ">
          <div className="absolute inset-[2px] border border-amber-300/90 rounded-[2px] pointer-events-none" />

          {/* Title bar */}
          <div className="
            relative
            bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800
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
            <span className="text-[10px] text-amber-200/85 font-mono">
              Dist: {distance}
            </span>
          </div>

          {/* Target info */}
          <div className="px-3 py-2 border-b border-amber-800/45 bg-[#f4e8ce] flex items-center gap-2">
            <img
              src={getAnimatedFrontSprite(target.template.id)}
              className="w-8 h-8 object-contain"
              style={{ imageRendering: 'pixelated' }}
              alt=""
            />
            <div>
              <span className="text-xs font-bold text-slate-800">{target.template.name}</span>
              <div className="flex gap-1 mt-0.5">
                {target.template.types.map(type => (
                  <span key={type} className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <span className="ml-auto text-[10px] font-mono text-slate-700">
              HP {target.currentHp}/{target.template.hp}
            </span>
          </div>

          {/* Move buttons */}
          <div className="p-2 flex flex-col gap-1.5">
            {attacker.template.moves.map((move, i) => {
              const hasPP = attacker.pp[i] > 0;
              const inRange = move.range >= distance;
              const isUsable = hasPP && inRange;
              const isStab = attacker.template.types.includes(move.type);

              return (
                <button
                  key={move.id}
                  onClick={() => isUsable && onSelectMove(move)}
                  disabled={!isUsable}
                  className={`
                    relative flex items-center gap-2 w-full
                    px-3 py-2.5
                    text-left rounded-sm
                    border-[2px] border-b-[3px] transition-all duration-75
                    animate-menu-item-slide
                    ${isUsable
                      ? 'border-amber-700/80 hover:border-amber-600 active:translate-y-[1px] active:border-b-[2px] cursor-pointer bg-gradient-to-b from-[#f4e8ca] to-[#e4d4ac]'
                      : 'border-stone-500/70 cursor-not-allowed bg-gradient-to-b from-[#e7dcc0] to-[#d9c9a2] opacity-45'
                    }
                  `}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="pointer-events-none absolute inset-[1px] border border-amber-300/80 rounded-[2px]" />
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
                      <span className="text-xs font-bold text-slate-800 truncate">{move.name}</span>
                      {isStab && hasPP && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-amber-200 text-amber-900 font-bold border border-amber-500/45">
                          STAB
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[move.type]}`}>
                        {move.type.toUpperCase()}
                      </span>
                      {move.power > 0 && (
                        <span className="text-[10px] text-slate-600 font-mono">
                          Pow {move.power}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600 font-mono">
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
                      !hasPP ? 'text-rose-700' : attacker.pp[i] <= 1 ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {attacker.pp[i]}/{move.pp}
                    </span>
                    {!inRange && hasPP && (
                      <span className="text-[8px] text-rose-700 font-bold">LEJOS</span>
                    )}
                    {!hasPP && (
                      <span className="text-[8px] text-rose-700 font-bold">SIN PP</span>
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
                bg-gradient-to-b from-stone-100 to-stone-200 hover:from-stone-50 hover:to-stone-100
                border-[2px] border-b-[3px] border-stone-500/80 rounded-sm
                text-stone-700
                transition-all duration-75
                active:translate-y-[1px] active:border-b-[2px]
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
