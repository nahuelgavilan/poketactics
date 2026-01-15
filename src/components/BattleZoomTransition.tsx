import React, { useState, useEffect, useMemo } from 'react';
import { getIconSprite } from '../utils/sprites';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants/board';
import type { Unit, GameMap, TerrainType } from '../types/game';
import { TERRAIN_PROPS } from '../constants/terrain';

interface BattleZoomTransitionProps {
  attacker: Unit;
  defender: Unit;
  map: GameMap;
  onComplete: () => void;
}

export function BattleZoomTransition({ attacker, defender, map, onComplete }: BattleZoomTransitionProps) {
  const [phase, setPhase] = useState<'initial' | 'zoom' | 'flash' | 'done'>('initial');

  // Calculate center point between attacker and defender
  const centerX = (attacker.x + defender.x) / 2;
  const centerY = (attacker.y + defender.y) / 2;

  // Generate diagonal slash lines for Pokemon-style effect
  const slashLines = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      offset: (i - 4) * 60,
      delay: i * 0.03,
    }));
  }, []);

  // Phase timeline - classic Pokemon encounter feel
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Start zoom immediately
    timers.push(setTimeout(() => setPhase('zoom'), 50));

    // Flash at peak zoom
    timers.push(setTimeout(() => setPhase('flash'), 900));

    // Complete
    timers.push(setTimeout(() => setPhase('done'), 1050));
    timers.push(setTimeout(onComplete, 1100));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Get terrain background color
  const getTerrainBg = (terrain: TerrainType) => {
    const props = TERRAIN_PROPS[terrain];
    if (!props) return 'bg-gradient-to-br from-green-800 to-green-900';
    return `bg-gradient-to-br ${props.bg}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
      {/* Game board representation - zooms into the battle area */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-700 ease-in
          ${phase === 'initial' ? 'scale-100' : ''}
          ${phase === 'zoom' || phase === 'flash' ? 'scale-[3]' : ''}
          ${phase === 'done' ? 'scale-[4] opacity-0' : ''}
        `}
        style={{
          transformOrigin: `${((centerX + 0.5) / BOARD_WIDTH) * 100}% ${((centerY + 0.5) / BOARD_HEIGHT) * 100}%`,
        }}
      >
        {/* Mini board grid */}
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
            width: 'min(90vw, 400px)',
            height: `min(90vw, 400px) * ${BOARD_HEIGHT / BOARD_WIDTH}`,
            aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
            gap: '2px',
          }}
        >
          {/* Render simplified tiles */}
          {Array.from({ length: BOARD_HEIGHT }, (_, y) =>
            Array.from({ length: BOARD_WIDTH }, (_, x) => {
              const terrain = (map[y]?.[x] ?? 0) as TerrainType;
              const isAttacker = attacker.x === x && attacker.y === y;
              const isDefender = defender.x === x && defender.y === y;
              const unit = isAttacker ? attacker : isDefender ? defender : null;

              return (
                <div
                  key={`${x}-${y}`}
                  className={`
                    relative rounded-sm overflow-visible
                    ${getTerrainBg(terrain)}
                    ${isAttacker || isDefender ? 'z-10' : ''}
                  `}
                >
                  {/* Pokemon on tile */}
                  {unit && (
                    <div className={`
                      absolute inset-0 flex items-center justify-center
                      ${phase !== 'initial' ? 'animate-battle-pulse' : ''}
                    `}>
                      {/* Highlight ring */}
                      <div className={`
                        absolute inset-0 rounded-sm
                        ${unit.owner === 'P1' ? 'bg-blue-500/40' : 'bg-red-500/40'}
                        ${phase !== 'initial' ? 'animate-ping-slow' : ''}
                      `} />
                      {/* Pokemon sprite */}
                      <img
                        src={getIconSprite(unit.template.id)}
                        className={`
                          relative z-10 w-[120%] h-auto
                          ${unit.owner === 'P1' ? '-scale-x-100' : ''}
                          drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
                        `}
                        style={{ imageRendering: 'pixelated' }}
                        alt={unit.template.name}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pokemon encounter diagonal slash lines */}
      <div className={`
        absolute inset-0 pointer-events-none overflow-hidden
        transition-opacity duration-200
        ${phase === 'zoom' ? 'opacity-100' : 'opacity-0'}
      `}>
        {slashLines.map((line) => (
          <div
            key={line.id}
            className="absolute h-[200vh] w-8 bg-gradient-to-b from-transparent via-white to-transparent animate-slash-sweep"
            style={{
              left: '50%',
              top: '-50%',
              transform: `translateX(${line.offset}px) rotate(45deg)`,
              animationDelay: `${line.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Screen shake overlay during zoom */}
      <div className={`
        absolute inset-0 pointer-events-none
        ${phase === 'zoom' ? 'animate-encounter-shake' : ''}
      `} />

      {/* Vignette effect */}
      <div className={`
        absolute inset-0 pointer-events-none
        bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]
        transition-opacity duration-300
        ${phase === 'zoom' || phase === 'flash' ? 'opacity-100' : 'opacity-0'}
      `} />

      {/* Flash overlay */}
      <div className={`
        absolute inset-0 bg-white pointer-events-none
        transition-opacity duration-100
        ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}
      `} />

      {/* "VS" or exclamation indicator */}
      <div className={`
        absolute inset-0 flex items-center justify-center pointer-events-none
        transition-all duration-300
        ${phase === 'zoom' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
      `}>
        <div className="relative">
          <div className="absolute -inset-4 bg-amber-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="
            relative bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700
            text-slate-900 font-black text-3xl md:text-5xl
            px-5 py-2 rounded-lg
            border-4 border-amber-300
            shadow-[0_4px_0_0_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.5)]
            animate-vs-bounce
          ">
            !
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes battle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .animate-battle-pulse {
          animation: battle-pulse 0.3s ease-in-out infinite;
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .animate-ping-slow {
          animation: ping-slow 0.8s ease-out infinite;
        }

        @keyframes slash-sweep {
          0% {
            opacity: 0;
            transform: translateX(var(--offset, 0)) translateY(-100%) rotate(45deg);
          }
          20% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateX(var(--offset, 0)) translateY(100%) rotate(45deg);
          }
        }

        .animate-slash-sweep {
          animation: slash-sweep 0.6s ease-out forwards;
        }

        @keyframes encounter-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -2px); }
          30% { transform: translate(-3px, 3px); }
          40% { transform: translate(3px, -3px); }
          50% { transform: translate(-2px, 1px); }
          60% { transform: translate(2px, -1px); }
          70% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
          90% { transform: translate(-1px, 1px); }
        }

        .animate-encounter-shake {
          animation: encounter-shake 0.5s ease-out;
        }

        @keyframes vs-bounce {
          0% { transform: scale(0) rotate(-10deg); }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .animate-vs-bounce {
          animation: vs-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
