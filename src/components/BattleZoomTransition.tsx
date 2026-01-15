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

// Same terrain theme as Tile.tsx for consistency
const TERRAIN_THEME: Record<number, {
  gradient: string;
  border: string;
  texture?: 'plains' | 'tallgrass' | 'forest' | 'water' | 'mountain' | 'pokecenter' | 'base';
}> = {
  [TERRAIN.GRASS]: {
    gradient: 'from-lime-400 to-green-500',
    border: 'border-green-700',
    texture: 'plains',
  },
  [TERRAIN.FOREST]: {
    gradient: 'from-emerald-600 to-green-800',
    border: 'border-green-950',
    texture: 'forest',
  },
  [TERRAIN.WATER]: {
    gradient: 'from-cyan-400 to-blue-500',
    border: 'border-blue-700',
    texture: 'water',
  },
  [TERRAIN.MOUNTAIN]: {
    gradient: 'from-amber-600 to-stone-500',
    border: 'border-stone-700',
    texture: 'mountain',
  },
  [TERRAIN.TALL_GRASS]: {
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-emerald-800',
    texture: 'tallgrass',
  },
  [TERRAIN.POKEMON_CENTER]: {
    gradient: 'from-rose-300 to-pink-400',
    border: 'border-pink-600',
    texture: 'pokecenter',
  },
  [TERRAIN.BASE]: {
    gradient: 'from-slate-400 to-slate-500',
    border: 'border-slate-700',
    texture: 'base',
  },
};

// Terrain decorations - same as Tile.tsx
function TerrainDecoration({ texture }: { texture?: string }) {
  switch (texture) {
    case 'plains':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(255,255,255,0.4)_8px,rgba(255,255,255,0.4)_10px)]" />
        </div>
      );

    case 'tallgrass':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,80,0,0.6)_3px,rgba(0,80,0,0.6)_5px)]" />
          <div className="absolute inset-x-0 top-[15%] h-[40%] opacity-40">
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_4px,rgba(34,197,94,0.8)_4px,transparent_6px,transparent_8px)]"
                 style={{ clipPath: 'polygon(0% 100%, 3% 20%, 6% 100%, 9% 30%, 12% 100%, 15% 10%, 18% 100%, 21% 40%, 24% 100%, 27% 20%, 30% 100%, 33% 35%, 36% 100%, 39% 15%, 42% 100%, 45% 45%, 48% 100%, 51% 25%, 54% 100%, 57% 40%, 60% 100%, 63% 20%, 66% 100%, 69% 50%, 72% 100%, 75% 15%, 78% 100%, 81% 35%, 84% 100%, 87% 25%, 90% 100%, 93% 40%, 96% 100%, 100% 30%, 100% 100%)' }} />
          </div>
        </div>
      );

    case 'forest':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 opacity-40">
            <div className="absolute w-[60%] h-[60%] rounded-full bg-green-900/60 -top-[10%] -left-[10%]" />
            <div className="absolute w-[50%] h-[50%] rounded-full bg-green-900/50 -bottom-[5%] -right-[5%]" />
          </div>
        </div>
      );

    case 'water':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(100deg,transparent,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_20px,transparent_20px,transparent_30px)]" />
        </div>
      );

    case 'mountain':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute bottom-0 left-[35%] w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-stone-500" />
          </div>
        </div>
      );

    case 'pokecenter':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
        </div>
      );

    case 'base':
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px),repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px)]" />
        </div>
      );

    default:
      return null;
  }
}

// Large battle tile for the VS screen
function BattleTile({ unit, terrain }: { unit: Unit; terrain: TerrainType }) {
  const theme = TERRAIN_THEME[terrain] || TERRAIN_THEME[TERRAIN.GRASS];

  return (
    <div className="relative w-28 h-28 md:w-36 md:h-36">
      <div className={`
        relative w-full h-full rounded-2xl
        bg-gradient-to-br ${theme.gradient}
        border-b-[6px] ${theme.border}
        shadow-xl
      `}>
        <TerrainDecoration texture={theme.texture} />
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-30 animate-battle-bounce">
        <div className={`absolute inset-[-8px] rounded-3xl animate-ping-slow ${unit.owner === 'P1' ? 'bg-blue-500/30' : 'bg-red-500/30'}`} />
        <img
          src={getIconSprite(unit.template.id)}
          className={`${unit.owner === 'P1' ? '-scale-x-100' : ''} drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]`}
          style={{ imageRendering: 'pixelated', width: 'clamp(56px, 140%, 80px)', height: 'auto' }}
          alt={unit.template.name}
        />
        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[80%] h-2 bg-slate-900/90 rounded-full overflow-hidden border border-white/30">
          <div
            className={`h-full ${unit.currentHp / unit.template.hp > 0.5 ? 'bg-gradient-to-r from-green-400 to-green-500' : unit.currentHp / unit.template.hp > 0.25 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
            style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
          />
        </div>
        <div className={`absolute bottom-[6%] right-[6%] w-5 h-5 rounded-full border-2 border-slate-900 ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}`} />
      </div>

      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${unit.owner === 'P1' ? 'bg-blue-600 border-2 border-blue-400' : 'bg-red-600 border-2 border-red-400'} shadow-lg`}>
        {unit.template.name}
      </div>
    </div>
  );
}

export function BattleZoomTransition({ attacker, defender, map, onComplete }: BattleZoomTransitionProps) {
  const [phase, setPhase] = useState<'board' | 'zooming' | 'vs' | 'flash' | 'done'>('board');

  // Calculate center point between attacker and defender for zoom
  const centerX = (attacker.x + defender.x) / 2;
  const centerY = (attacker.y + defender.y) / 2;

  const attackerTerrain = (map[attacker.y]?.[attacker.x] ?? 0) as TerrainType;
  const defenderTerrain = (map[defender.y]?.[defender.x] ?? 0) as TerrainType;

  // Slash lines for effect
  const slashLines = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    offset: (i - 3) * 80,
    delay: i * 0.04,
  })), []);

  // Phase timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Board visible briefly
    timers.push(setTimeout(() => setPhase('zooming'), 100));
    // Zoom into the battle area
    timers.push(setTimeout(() => setPhase('vs'), 700));
    // Show VS screen
    timers.push(setTimeout(() => setPhase('flash'), 1400));
    // Flash and done
    timers.push(setTimeout(() => setPhase('done'), 1550));
    timers.push(setTimeout(onComplete, 1600));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">

      {/* === PHASE 1 & 2: BOARD WITH ZOOM === */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-600 ease-in
          ${phase === 'board' ? 'scale-100 opacity-100' : ''}
          ${phase === 'zooming' ? 'scale-[4] opacity-100' : ''}
          ${phase === 'vs' || phase === 'flash' || phase === 'done' ? 'scale-[6] opacity-0' : ''}
        `}
        style={{
          transformOrigin: `${((centerX + 0.5) / BOARD_WIDTH) * 100}% ${((centerY + 0.5) / BOARD_HEIGHT) * 100}%`,
        }}
      >
        {/* Mini board */}
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
            width: 'min(85vw, 380px)',
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

              return (
                <div
                  key={`${x}-${y}`}
                  className={`relative rounded-lg bg-gradient-to-br ${theme.gradient} border-b-[3px] ${theme.border} overflow-visible`}
                >
                  <TerrainDecoration texture={theme.texture} />
                  <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-t-lg" />

                  {unit && (
                    <div className={`absolute inset-0 flex items-center justify-center z-10 ${phase === 'zooming' ? 'animate-battle-pulse' : ''}`}>
                      <div className={`absolute inset-[-2px] rounded-lg ${unit.owner === 'P1' ? 'bg-blue-500/40' : 'bg-red-500/40'} ${phase === 'zooming' ? 'animate-ping-slow' : ''}`} />
                      <img
                        src={getIconSprite(unit.template.id)}
                        className={`relative z-10 w-[110%] h-auto ${unit.owner === 'P1' ? '-scale-x-100' : ''} drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]`}
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

      {/* === PHASE 3: VS SCREEN WITH TWO TILES === */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center gap-6 md:gap-12
          transition-all duration-400 ease-out
          ${phase === 'vs' ? 'opacity-100 scale-100' : ''}
          ${phase === 'board' || phase === 'zooming' ? 'opacity-0 scale-75' : ''}
          ${phase === 'flash' || phase === 'done' ? 'opacity-0 scale-110' : ''}
        `}
      >
        <div className={`${phase === 'vs' ? 'animate-slide-in-left' : ''}`}>
          <BattleTile unit={attacker} terrain={attackerTerrain} />
        </div>

        <div className={`transition-all duration-300 ${phase === 'vs' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative">
            <div className="absolute -inset-4 bg-amber-500/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 text-slate-900 font-black text-2xl md:text-4xl px-4 py-2 rounded-xl border-4 border-amber-300 shadow-[0_4px_0_0_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.5)] animate-vs-bounce">
              VS
            </div>
          </div>
        </div>

        <div className={`${phase === 'vs' ? 'animate-slide-in-right' : ''}`}>
          <BattleTile unit={defender} terrain={defenderTerrain} />
        </div>
      </div>

      {/* Diagonal slash lines during zoom */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-200 ${phase === 'zooming' ? 'opacity-100' : 'opacity-0'}`}>
        {slashLines.map((line) => (
          <div
            key={line.id}
            className="absolute h-[200vh] w-6 bg-gradient-to-b from-transparent via-white/70 to-transparent animate-slash-sweep"
            style={{ left: '50%', top: '-50%', transform: `translateX(${line.offset}px) rotate(45deg)`, animationDelay: `${line.delay}s` }}
          />
        ))}
      </div>

      {/* Flash */}
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-75 ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}`} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      <style>{`
        @keyframes battle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .animate-battle-pulse { animation: battle-pulse 0.3s ease-in-out infinite; }

        @keyframes battle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-battle-bounce { animation: battle-bounce 0.4s ease-in-out infinite; }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow { animation: ping-slow 0.6s ease-out infinite; }

        @keyframes slash-sweep {
          0% { opacity: 0; transform: translateX(var(--offset, 0)) translateY(-100%) rotate(45deg); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translateX(var(--offset, 0)) translateY(100%) rotate(45deg); }
        }
        .animate-slash-sweep { animation: slash-sweep 0.5s ease-out forwards; }

        @keyframes vs-bounce {
          0% { transform: scale(0) rotate(-15deg); }
          60% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-vs-bounce { animation: vs-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes slide-in-left {
          0% { transform: translateX(-60px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left { animation: slide-in-left 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-in-right {
          0% { transform: translateX(60px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
