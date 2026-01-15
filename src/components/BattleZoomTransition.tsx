import React, { useState, useEffect, useMemo } from 'react';
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

// Same terrain theme as Tile.tsx
const TERRAIN_THEME: Record<number, {
  gradient: string;
  border: string;
  texture?: 'plains' | 'tallgrass' | 'forest' | 'water' | 'mountain' | 'pokecenter' | 'base';
}> = {
  [TERRAIN.GRASS]: { gradient: 'from-lime-400 to-green-500', border: 'border-green-700', texture: 'plains' },
  [TERRAIN.FOREST]: { gradient: 'from-emerald-600 to-green-800', border: 'border-green-950', texture: 'forest' },
  [TERRAIN.WATER]: { gradient: 'from-cyan-400 to-blue-500', border: 'border-blue-700', texture: 'water' },
  [TERRAIN.MOUNTAIN]: { gradient: 'from-amber-600 to-stone-500', border: 'border-stone-700', texture: 'mountain' },
  [TERRAIN.TALL_GRASS]: { gradient: 'from-green-500 to-emerald-600', border: 'border-emerald-800', texture: 'tallgrass' },
  [TERRAIN.POKEMON_CENTER]: { gradient: 'from-rose-300 to-pink-400', border: 'border-pink-600', texture: 'pokecenter' },
  [TERRAIN.BASE]: { gradient: 'from-slate-400 to-slate-500', border: 'border-slate-700', texture: 'base' },
};

function TerrainDecoration({ texture }: { texture?: string }) {
  switch (texture) {
    case 'plains':
      return <div className="absolute inset-0 rounded-lg overflow-hidden opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(255,255,255,0.4)_8px,rgba(255,255,255,0.4)_10px)]" />;
    case 'tallgrass':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,80,0,0.6)_3px,rgba(0,80,0,0.6)_5px)]" />
        </div>
      );
    case 'forest':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute w-[60%] h-[60%] rounded-full bg-green-900/40 -top-[10%] -left-[10%]" />
        </div>
      );
    case 'water':
      return <div className="absolute inset-0 rounded-lg overflow-hidden opacity-30 bg-[repeating-linear-gradient(100deg,transparent,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_20px)]" />;
    case 'mountain':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden opacity-50">
          <div className="absolute bottom-0 left-[35%] w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-stone-500" />
        </div>
      );
    case 'pokecenter':
      return <div className="absolute inset-0 rounded-lg overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />;
    case 'base':
      return <div className="absolute inset-0 rounded-lg overflow-hidden opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px),repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px)]" />;
    default:
      return null;
  }
}

export function BattleZoomTransition({ attacker, defender, map, onComplete }: BattleZoomTransitionProps) {
  const [phase, setPhase] = useState<'board' | 'zoom' | 'vs' | 'flash' | 'done'>('board');

  // Calculate center point - clamped to avoid extreme edges
  const rawCenterX = (attacker.x + defender.x) / 2;
  const rawCenterY = (attacker.y + defender.y) / 2;
  // Clamp to inner 70% of board to avoid awkward edge zooms
  const centerX = Math.max(BOARD_WIDTH * 0.15, Math.min(BOARD_WIDTH * 0.85, rawCenterX + 0.5));
  const centerY = Math.max(BOARD_HEIGHT * 0.15, Math.min(BOARD_HEIGHT * 0.85, rawCenterY + 0.5));

  // Slash lines
  const slashLines = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    offset: (i - 4) * 70,
    delay: i * 0.025,
  })), []);

  // Impact particles for VS moment
  const impactParticles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i,
    angle: (i * 22.5) + Math.random() * 10,
    distance: 80 + Math.random() * 120,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 0.1,
  })), []);

  // Timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('zoom'), 80));
    timers.push(setTimeout(() => setPhase('vs'), 500));
    timers.push(setTimeout(() => setPhase('flash'), 1200));
    timers.push(setTimeout(() => setPhase('done'), 1350));
    timers.push(setTimeout(onComplete, 1400));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
      {/* Board with zoom */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all ease-in
          ${phase === 'board' ? 'scale-100 opacity-100 duration-100' : ''}
          ${phase === 'zoom' ? 'scale-[2.5] opacity-100 duration-400' : ''}
          ${phase === 'vs' ? 'scale-[3] opacity-100 duration-500' : ''}
          ${phase === 'flash' || phase === 'done' ? 'scale-[4] opacity-0 duration-200' : ''}
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
                  <TerrainDecoration texture={theme.texture} />
                  <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-t-lg" />

                  {unit && (
                    <div className={`
                      absolute inset-0 flex items-center justify-center z-10
                      ${isBattleUnit && phase !== 'board' ? 'animate-battle-shake' : ''}
                    `}>
                      {/* Glowing ring for battle participants */}
                      {isBattleUnit && phase !== 'board' && (
                        <div className={`
                          absolute inset-[-4px] rounded-xl
                          ${unit.owner === 'P1' ? 'bg-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.8)]'}
                          animate-glow-pulse
                        `} />
                      )}
                      <img
                        src={getIconSprite(unit.template.id)}
                        className={`
                          relative z-10 w-[115%] h-auto
                          ${unit.owner === 'P1' ? '-scale-x-100' : ''}
                          drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]
                          ${isBattleUnit && phase !== 'board' ? 'brightness-110' : ''}
                        `}
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

      {/* Diagonal slash lines during zoom */}
      <div className={`
        absolute inset-0 pointer-events-none overflow-hidden
        transition-opacity duration-150
        ${phase === 'zoom' ? 'opacity-100' : 'opacity-0'}
      `}>
        {slashLines.map((line) => (
          <div
            key={line.id}
            className="absolute h-[250vh] w-4 bg-gradient-to-b from-transparent via-white/80 to-transparent animate-slash-sweep"
            style={{
              left: '50%',
              top: '-75%',
              transform: `translateX(${line.offset}px) rotate(45deg)`,
              animationDelay: `${line.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Epic VS badge */}
      <div className={`
        absolute inset-0 flex items-center justify-center pointer-events-none
        transition-all duration-300
        ${phase === 'vs' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
      `}>
        {/* Impact particles */}
        {phase === 'vs' && impactParticles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-amber-400 animate-particle-burst"
            style={{
              width: p.size,
              height: p.size,
              '--angle': `${p.angle}deg`,
              '--distance': `${p.distance}px`,
              animationDelay: `${p.delay}s`,
              boxShadow: '0 0 10px rgba(251,191,36,0.8)',
            } as React.CSSProperties}
          />
        ))}

        {/* Shockwave rings */}
        <div className="absolute w-32 h-32 rounded-full border-4 border-amber-400/60 animate-shockwave" />
        <div className="absolute w-32 h-32 rounded-full border-4 border-amber-400/40 animate-shockwave animation-delay-100" />

        {/* Main VS badge */}
        <div className="relative animate-vs-slam">
          {/* Glow */}
          <div className="absolute -inset-8 bg-amber-500/40 rounded-full blur-3xl animate-pulse" />

          {/* Badge */}
          <div className="
            relative bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700
            text-slate-900 font-black text-4xl md:text-6xl
            px-6 py-3 rounded-2xl
            border-4 border-amber-200
            shadow-[0_6px_0_0_rgba(0,0,0,0.4),0_0_40px_rgba(251,191,36,0.6),inset_0_2px_0_rgba(255,255,255,0.4)]
          ">
            VS
          </div>
        </div>
      </div>

      {/* Screen shake during VS */}
      <div className={`absolute inset-0 pointer-events-none ${phase === 'vs' ? 'animate-screen-shake' : ''}`} />

      {/* Flash */}
      <div className={`
        absolute inset-0 bg-white pointer-events-none
        transition-opacity duration-100
        ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}
      `} />

      {/* Vignette */}
      <div className={`
        absolute inset-0 pointer-events-none
        transition-opacity duration-300
        bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)]
        ${phase === 'board' ? 'opacity-50' : 'opacity-100'}
      `} />

      <style>{`
        @keyframes battle-shake {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px) rotate(-1deg); }
          75% { transform: translateY(2px) rotate(1deg); }
        }
        .animate-battle-shake { animation: battle-shake 0.15s ease-in-out infinite; }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-glow-pulse { animation: glow-pulse 0.3s ease-in-out infinite; }

        @keyframes slash-sweep {
          0% { opacity: 0; transform: translateX(var(--offset, 0)) translateY(-50%) rotate(45deg); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateX(var(--offset, 0)) translateY(150%) rotate(45deg); }
        }
        .animate-slash-sweep { animation: slash-sweep 0.35s ease-out forwards; }

        @keyframes vs-slam {
          0% { transform: scale(3) rotate(-10deg); opacity: 0; }
          40% { transform: scale(0.9) rotate(2deg); opacity: 1; }
          60% { transform: scale(1.1) rotate(-1deg); }
          80% { transform: scale(0.98) rotate(0.5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-vs-slam { animation: vs-slam 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes particle-burst {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% {
            transform: translate(
              calc(-50% + cos(var(--angle)) * var(--distance)),
              calc(-50% + sin(var(--angle)) * var(--distance))
            ) scale(0);
            opacity: 0;
          }
        }
        .animate-particle-burst { animation: particle-burst 0.6s ease-out forwards; }

        @keyframes shockwave {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-shockwave { animation: shockwave 0.6s ease-out forwards; }
        .animation-delay-100 { animation-delay: 0.1s; }

        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -3px); }
          30% { transform: translate(-3px, 4px); }
          40% { transform: translate(3px, -2px); }
          50% { transform: translate(-2px, 3px); }
          60% { transform: translate(2px, -2px); }
          70% { transform: translate(-1px, 1px); }
          80% { transform: translate(1px, -1px); }
        }
        .animate-screen-shake { animation: screen-shake 0.4s ease-out; }
      `}</style>
    </div>
  );
}
