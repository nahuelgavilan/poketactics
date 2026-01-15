import React, { useState, useEffect } from 'react';
import { getIconSprite } from '../utils/sprites';
import { TERRAIN } from '../constants/terrain';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants/board';
import type { Unit, GameMap, TerrainType } from '../types/game';

interface BattleZoomTransitionProps {
  attacker: Unit;
  defender: Unit;
  map: GameMap;
  onComplete: () => void;
}

const TERRAIN_THEME: Record<number, {
  gradient: string;
  border: string;
}> = {
  [TERRAIN.GRASS]: { gradient: 'from-lime-400 to-green-500', border: 'border-green-700' },
  [TERRAIN.FOREST]: { gradient: 'from-emerald-600 to-green-800', border: 'border-green-950' },
  [TERRAIN.WATER]: { gradient: 'from-cyan-400 to-blue-500', border: 'border-blue-700' },
  [TERRAIN.MOUNTAIN]: { gradient: 'from-amber-600 to-stone-500', border: 'border-stone-700' },
  [TERRAIN.TALL_GRASS]: { gradient: 'from-green-500 to-emerald-600', border: 'border-emerald-800' },
  [TERRAIN.POKEMON_CENTER]: { gradient: 'from-rose-300 to-pink-400', border: 'border-pink-600' },
  [TERRAIN.BASE]: { gradient: 'from-slate-400 to-slate-500', border: 'border-slate-700' },
};

export function BattleZoomTransition({ attacker, defender, map, onComplete }: BattleZoomTransitionProps) {
  const [phase, setPhase] = useState<'board' | 'zoom' | 'spiral' | 'black' | 'flash' | 'done'>('board');
  const [spiralProgress, setSpiralProgress] = useState(0);

  // Calculate center point for zoom (clamped to avoid edge awkwardness)
  const centerX = Math.max(BOARD_WIDTH * 0.15, Math.min(BOARD_WIDTH * 0.85, (attacker.x + defender.x) / 2 + 0.5));
  const centerY = Math.max(BOARD_HEIGHT * 0.15, Math.min(BOARD_HEIGHT * 0.85, (attacker.y + defender.y) / 2 + 0.5));

  // Timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('zoom'), 80));
    timers.push(setTimeout(() => setPhase('spiral'), 500));
    timers.push(setTimeout(() => setPhase('black'), 1100));
    timers.push(setTimeout(() => setPhase('flash'), 1200));
    timers.push(setTimeout(() => setPhase('done'), 1300));
    timers.push(setTimeout(onComplete, 1350));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Animate spiral progress
  useEffect(() => {
    if (phase !== 'spiral') return;

    let animationFrame: number;
    const startTime = Date.now();
    const duration = 550; // ms

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out for smooth closing
      const eased = 1 - Math.pow(1 - progress, 2);
      setSpiralProgress(eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [phase]);

  const showBoard = phase === 'board' || phase === 'zoom' || phase === 'spiral';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">

      {/* === BOARD ZOOM PHASE === */}
      {showBoard && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-500 ease-in
            ${phase === 'board' ? 'scale-100 opacity-100' : ''}
            ${phase === 'zoom' || phase === 'spiral' ? 'scale-[3] opacity-100' : ''}
          `}
          style={{
            transformOrigin: `${(centerX / BOARD_WIDTH) * 100}% ${(centerY / BOARD_HEIGHT) * 100}%`,
          }}
        >
          <div
            className="relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
              gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
              width: 'min(88vw, 400px)',
              aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
              gap: '2px',
            }}
          >
            {Array.from({ length: BOARD_HEIGHT }, (_, y) =>
              Array.from({ length: BOARD_WIDTH }, (_, x) => {
                const terrain = (map[y]?.[x] ?? 0) as TerrainType;
                const theme = TERRAIN_THEME[terrain] || TERRAIN_THEME[TERRAIN.GRASS];
                const isAttacker = attacker.x === x && attacker.y === y;
                const isDefender = defender.x === x && defender.y === y;
                const unit = isAttacker ? attacker : isDefender ? defender : null;
                const isBattleUnit = isAttacker || isDefender;

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`relative rounded-lg bg-gradient-to-br ${theme.gradient} border-b-[3px] ${theme.border} overflow-visible`}
                  >
                    <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-t-lg" />
                    {unit && (
                      <div className={`absolute inset-0 flex items-center justify-center z-10 ${isBattleUnit && (phase === 'zoom' || phase === 'spiral') ? 'animate-battle-shake' : ''}`}>
                        {isBattleUnit && (phase === 'zoom' || phase === 'spiral') && (
                          <div className={`absolute inset-[-3px] rounded-lg ${unit.owner === 'P1' ? 'bg-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'bg-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.8)]'} animate-glow-pulse`} />
                        )}
                        <img
                          src={getIconSprite(unit.template.id)}
                          className={`relative z-10 w-[115%] h-auto ${unit.owner === 'P1' ? '-scale-x-100' : ''} drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}
                          style={{ imageRendering: 'pixelated' }}
                          alt=""
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* === POKEMON-STYLE CLOCKWISE SPIRAL WIPE === */}
      {phase === 'spiral' && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Pixelated edge filter */}
              <filter id="pixelate" x="0" y="0" width="100%" height="100%">
                <feFlood x="0" y="0" width="4" height="4" />
                <feComposite width="8" height="8" />
                <feTile result="tile" />
                <feComposite in="SourceGraphic" in2="tile" operator="in" />
                <feMorphology operator="dilate" radius="1" />
              </filter>

              {/* Mask for the spiral wipe - reveals black from edges */}
              <mask id="spiralMask">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                {/* Circle that shrinks - white area = visible, black = hidden */}
                <circle
                  cx="50"
                  cy="50"
                  r={Math.max(0, 85 * (1 - spiralProgress))}
                  fill="black"
                />
              </mask>
            </defs>

            {/* Black overlay with pixelated circular wipe */}
            <g mask="url(#spiralMask)">
              <rect x="0" y="0" width="100" height="100" fill="#0f172a" />
            </g>

            {/* Pixelated edge ring for the closing circle */}
            <g>
              {Array.from({ length: 32 }, (_, i) => {
                const angle = (i / 32) * Math.PI * 2;
                const radius = Math.max(0, 85 * (1 - spiralProgress));
                const blockSize = 3 + spiralProgress * 2;
                const cx = 50 + Math.cos(angle) * radius;
                const cy = 50 + Math.sin(angle) * radius;

                // Only show blocks at the edge
                if (radius < 5) return null;

                return (
                  <rect
                    key={i}
                    x={cx - blockSize / 2}
                    y={cy - blockSize / 2}
                    width={blockSize}
                    height={blockSize}
                    fill="#0f172a"
                    className="origin-center"
                  />
                );
              })}
            </g>

            {/* Additional pixelated blocks for texture */}
            <g>
              {Array.from({ length: 48 }, (_, i) => {
                const angle = (i / 48) * Math.PI * 2 + spiralProgress * Math.PI;
                const radius = Math.max(0, 85 * (1 - spiralProgress));
                const offset = 4 + Math.sin(i * 3) * 2;
                const blockSize = 2 + Math.sin(i * 5) * 1;
                const cx = 50 + Math.cos(angle) * (radius + offset);
                const cy = 50 + Math.sin(angle) * (radius + offset);

                if (radius < 5) return null;

                return (
                  <rect
                    key={`outer-${i}`}
                    x={cx - blockSize / 2}
                    y={cy - blockSize / 2}
                    width={blockSize}
                    height={blockSize}
                    fill="#0f172a"
                  />
                );
              })}
            </g>
          </svg>
        </div>
      )}

      {/* Black screen after spiral completes */}
      {(phase === 'black' || phase === 'flash' || phase === 'done') && (
        <div className="absolute inset-0 bg-slate-950 z-20" />
      )}

      {/* Flash */}
      <div className={`
        absolute inset-0 bg-white pointer-events-none z-50
        transition-opacity duration-100
        ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}
      `} />

      {/* Vignette for board phase */}
      {showBoard && phase !== 'spiral' && (
        <div className={`
          absolute inset-0 pointer-events-none z-10
          bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)]
          transition-opacity duration-300
          ${phase === 'zoom' ? 'opacity-100' : 'opacity-50'}
        `} />
      )}

      <style>{`
        @keyframes battle-shake {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-1deg); }
          75% { transform: translateY(2px) rotate(1deg); }
        }
        .animate-battle-shake { animation: battle-shake 0.12s ease-in-out infinite; }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .animate-glow-pulse { animation: glow-pulse 0.25s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
