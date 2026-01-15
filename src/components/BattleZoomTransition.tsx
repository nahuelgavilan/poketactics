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

const TERRAIN_THEME: Record<number, {
  gradient: string;
  border: string;
  texture?: string;
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
      return <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(255,255,255,0.4)_8px,rgba(255,255,255,0.4)_10px)]" />;
    case 'tallgrass':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,80,0,0.6)_3px,rgba(0,80,0,0.6)_5px)]" />
          <div className="absolute inset-x-0 top-[15%] h-[40%] opacity-40">
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_4px,rgba(34,197,94,0.8)_4px,transparent_6px,transparent_8px)]"
                 style={{ clipPath: 'polygon(0% 100%, 3% 20%, 6% 100%, 9% 30%, 12% 100%, 15% 10%, 18% 100%, 21% 40%, 24% 100%, 27% 20%, 30% 100%, 33% 35%, 36% 100%, 39% 15%, 42% 100%, 45% 45%, 48% 100%, 51% 25%, 54% 100%, 57% 40%, 60% 100%, 63% 20%, 66% 100%, 69% 50%, 72% 100%, 75% 15%, 78% 100%, 81% 35%, 84% 100%, 87% 25%, 90% 100%, 93% 40%, 96% 100%, 100% 30%, 100% 100%)' }} />
          </div>
        </div>
      );
    case 'forest':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute w-[60%] h-[60%] rounded-full bg-green-900/40 -top-[10%] -left-[10%]" />
          <div className="absolute w-[50%] h-[50%] rounded-full bg-green-900/30 -bottom-[5%] -right-[5%]" />
        </div>
      );
    case 'water':
      return <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-30 bg-[repeating-linear-gradient(100deg,transparent,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_20px)]" />;
    case 'mountain':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-50">
          <div className="absolute bottom-[10%] left-[20%] w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-stone-500" />
          <div className="absolute bottom-[10%] right-[25%] w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-stone-600" />
        </div>
      );
    case 'pokecenter':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <div className="relative w-[40%] h-[40%]">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[30%] h-full bg-white rounded-sm" />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[30%] bg-white rounded-sm" />
            </div>
          </div>
        </div>
      );
    case 'base':
      return <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px),repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px)]" />;
    default:
      return null;
  }
}

// VS Tile component - large tile for VS screen
function VSTile({ unit, terrain, position }: { unit: Unit; terrain: TerrainType; position: 'left' | 'right' | 'top' | 'bottom' }) {
  const theme = TERRAIN_THEME[terrain] || TERRAIN_THEME[TERRAIN.GRASS];
  const isHorizontal = position === 'left' || position === 'right';

  return (
    <div className={`
      relative
      ${isHorizontal ? 'w-32 h-32 md:w-40 md:h-40' : 'w-28 h-28 md:w-36 md:h-36'}
    `}>
      {/* Main tile */}
      <div className={`
        relative w-full h-full rounded-2xl
        bg-gradient-to-br ${theme.gradient}
        border-b-[6px] ${theme.border}
        shadow-2xl
      `}>
        <TerrainDecoration texture={theme.texture} />
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/25 to-transparent rounded-t-2xl" />
      </div>

      {/* Pokemon */}
      <div className="absolute inset-0 flex items-center justify-center z-30 animate-vs-bounce">
        {/* Glow ring */}
        <div className={`
          absolute inset-[-6px] rounded-3xl animate-glow-pulse
          ${unit.owner === 'P1'
            ? 'bg-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.7)]'
            : 'bg-red-400/40 shadow-[0_0_25px_rgba(239,68,68,0.7)]'}
        `} />

        <img
          src={getIconSprite(unit.template.id)}
          className={`
            relative z-10
            ${unit.owner === 'P1' ? '-scale-x-100' : ''}
            drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]
          `}
          style={{
            imageRendering: 'pixelated',
            width: 'clamp(64px, 150%, 96px)',
            height: 'auto',
          }}
          alt={unit.template.name}
        />

        {/* HP Bar */}
        <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[85%] h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-white/40 shadow-lg">
          <div
            className={`h-full ${
              unit.currentHp / unit.template.hp > 0.5
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : unit.currentHp / unit.template.hp > 0.25
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
          />
        </div>

        {/* Player badge */}
        <div className={`
          absolute bottom-[8%] right-[8%] w-6 h-6 rounded-full
          border-2 border-white/50 shadow-lg
          ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}
        `} />
      </div>

      {/* Name label */}
      <div className={`
        absolute -bottom-9 left-1/2 -translate-x-1/2
        px-4 py-1.5 rounded-full
        text-sm font-bold text-white whitespace-nowrap
        ${unit.owner === 'P1' ? 'bg-blue-600 border-2 border-blue-400' : 'bg-red-600 border-2 border-red-400'}
        shadow-xl
      `}>
        {unit.template.name}
      </div>
    </div>
  );
}

export function BattleZoomTransition({ attacker, defender, map, onComplete }: BattleZoomTransitionProps) {
  const [phase, setPhase] = useState<'board' | 'zoom' | 'transition' | 'vs' | 'flash' | 'done'>('board');

  // Calculate center and direction
  const centerX = Math.max(BOARD_WIDTH * 0.15, Math.min(BOARD_WIDTH * 0.85, (attacker.x + defender.x) / 2 + 0.5));
  const centerY = Math.max(BOARD_HEIGHT * 0.15, Math.min(BOARD_HEIGHT * 0.85, (attacker.y + defender.y) / 2 + 0.5));

  // Determine if battle is more horizontal or vertical
  const dx = Math.abs(attacker.x - defender.x);
  const dy = Math.abs(attacker.y - defender.y);
  const isHorizontal = dx >= dy;

  // Determine positions based on relative board positions
  const attackerPosition = isHorizontal
    ? (attacker.x < defender.x ? 'left' : 'right')
    : (attacker.y < defender.y ? 'top' : 'bottom');
  const defenderPosition = isHorizontal
    ? (attacker.x < defender.x ? 'right' : 'left')
    : (attacker.y < defender.y ? 'bottom' : 'top');

  const attackerTerrain = (map[attacker.y]?.[attacker.x] ?? 0) as TerrainType;
  const defenderTerrain = (map[defender.y]?.[defender.x] ?? 0) as TerrainType;

  // Transition bars (Pokemon wild encounter style)
  const transitionBars = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.03,
  })), []);

  // Timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('zoom'), 80));
    timers.push(setTimeout(() => setPhase('transition'), 550));
    timers.push(setTimeout(() => setPhase('vs'), 900));
    timers.push(setTimeout(() => setPhase('flash'), 1650));
    timers.push(setTimeout(() => setPhase('done'), 1800));
    timers.push(setTimeout(onComplete, 1850));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const showBoard = phase === 'board' || phase === 'zoom';
  const showTransition = phase === 'transition';
  const showVS = phase === 'vs' || phase === 'flash' || phase === 'done';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">

      {/* === BOARD ZOOM PHASE === */}
      {showBoard && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-500 ease-in
            ${phase === 'board' ? 'scale-100 opacity-100' : ''}
            ${phase === 'zoom' ? 'scale-[3] opacity-100' : ''}
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
                      <div className={`absolute inset-0 flex items-center justify-center z-10 ${isBattleUnit && phase === 'zoom' ? 'animate-battle-shake' : ''}`}>
                        {isBattleUnit && phase === 'zoom' && (
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

      {/* === POKEMON-STYLE TRANSITION (diagonal bars) === */}
      <div className={`
        absolute inset-0 pointer-events-none z-20
        ${showTransition || showVS ? 'opacity-100' : 'opacity-0'}
      `}>
        {transitionBars.map((bar) => (
          <div
            key={bar.id}
            className={`
              absolute bg-slate-950
              ${showTransition || showVS ? 'animate-bar-slide' : ''}
            `}
            style={{
              top: `${bar.id * (100 / 12)}%`,
              left: '-100%',
              width: '200%',
              height: `${100 / 12 + 1}%`,
              animationDelay: `${bar.delay}s`,
            }}
          />
        ))}
      </div>

      {/* === VS SCREEN === */}
      {showVS && (
        <div className="absolute inset-0 bg-slate-950 z-10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:24px_24px]" />

          {/* Dramatic background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15)_0%,transparent_60%)]" />

          {/* Tiles container */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${isHorizontal ? 'flex-row gap-8 md:gap-20' : 'flex-col gap-6 md:gap-14'}
          `}>
            {/* First tile (attacker) */}
            <div className={`
              ${phase === 'vs' ? (isHorizontal ? 'animate-slide-from-left' : 'animate-slide-from-top') : ''}
              ${phase === 'flash' || phase === 'done' ? 'opacity-0' : ''}
            `}>
              <VSTile
                unit={attacker}
                terrain={attackerTerrain}
                position={attackerPosition as 'left' | 'right' | 'top' | 'bottom'}
              />
            </div>

            {/* VS Badge */}
            <div className={`
              transition-all duration-300 z-40
              ${phase === 'vs' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
            `}>
              <div className="relative animate-vs-slam">
                {/* Glow layers */}
                <div className="absolute -inset-12 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -inset-6 bg-amber-400/40 rounded-full blur-xl" />

                {/* Badge */}
                <div className="
                  relative bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700
                  text-slate-900 font-black text-5xl md:text-7xl
                  px-8 py-4 rounded-2xl
                  border-4 border-amber-200
                  shadow-[0_8px_0_0_rgba(120,80,0,0.5),0_0_60px_rgba(251,191,36,0.7),inset_0_2px_0_rgba(255,255,255,0.5)]
                ">
                  VS
                </div>
              </div>
            </div>

            {/* Second tile (defender) */}
            <div className={`
              ${phase === 'vs' ? (isHorizontal ? 'animate-slide-from-right' : 'animate-slide-from-bottom') : ''}
              ${phase === 'flash' || phase === 'done' ? 'opacity-0' : ''}
            `}>
              <VSTile
                unit={defender}
                terrain={defenderTerrain}
                position={defenderPosition as 'left' | 'right' | 'top' | 'bottom'}
              />
            </div>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
        </div>
      )}

      {/* Flash */}
      <div className={`
        absolute inset-0 bg-white pointer-events-none z-50
        transition-opacity duration-100
        ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}
      `} />

      {/* Vignette for board phase */}
      {showBoard && (
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

        @keyframes bar-slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-bar-slide { animation: bar-slide 0.35s ease-in-out forwards; }

        @keyframes vs-slam {
          0% { transform: scale(4) rotate(-15deg); opacity: 0; }
          30% { transform: scale(0.85) rotate(3deg); opacity: 1; }
          50% { transform: scale(1.15) rotate(-2deg); }
          70% { transform: scale(0.95) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-vs-slam { animation: vs-slam 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes vs-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-vs-bounce { animation: vs-bounce 0.5s ease-in-out infinite; }

        @keyframes slide-from-left {
          0% { transform: translateX(-120px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-from-left { animation: slide-from-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-from-right {
          0% { transform: translateX(120px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-from-right { animation: slide-from-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-from-top {
          0% { transform: translateY(-120px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-from-top { animation: slide-from-top 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-from-bottom {
          0% { transform: translateY(120px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-from-bottom { animation: slide-from-bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
