import React, { useState, useEffect, useMemo } from 'react';
import { getIconSprite } from '../utils/sprites';
import { TERRAIN } from '../constants/terrain';
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
  [TERRAIN.SAND]: { gradient: 'from-yellow-300 to-amber-400', border: 'border-amber-600', texture: 'sand' },
  [TERRAIN.BRIDGE]: { gradient: 'from-amber-500 to-amber-700', border: 'border-amber-900', texture: 'bridge' },
  [TERRAIN.BERRY_BUSH]: { gradient: 'from-lime-400 to-green-500', border: 'border-green-700', texture: 'berry' },
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
        </div>
      );
    case 'water':
      return <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-30 bg-[repeating-linear-gradient(100deg,transparent,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_20px)]" />;
    case 'mountain':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-50">
          <div className="absolute bottom-[10%] left-[20%] w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-stone-500" />
        </div>
      );
    case 'pokecenter':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
        </div>
      );
    case 'base':
      return <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px),repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px)]" />;
    case 'sand':
      return <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-25 bg-[repeating-linear-gradient(170deg,transparent,transparent_6px,rgba(255,255,255,0.5)_6px,rgba(255,255,255,0.5)_8px)]" />;
    case 'bridge':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-35 bg-[repeating-linear-gradient(0deg,transparent,transparent_5px,rgba(0,0,0,0.3)_5px,rgba(0,0,0,0.3)_6px)]" />
          <div className="absolute inset-y-0 left-0 w-[12%] bg-cyan-500/30" />
          <div className="absolute inset-y-0 right-0 w-[12%] bg-cyan-500/30" />
        </div>
      );
    case 'berry':
      return (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(255,255,255,0.4)_8px,rgba(255,255,255,0.4)_10px)]" />
          <div className="absolute w-[18%] h-[18%] rounded-full bg-fuchsia-500/70 top-[15%] left-[25%]" />
          <div className="absolute w-[15%] h-[15%] rounded-full bg-fuchsia-600/70 top-[25%] left-[45%]" />
          <div className="absolute w-[14%] h-[14%] rounded-full bg-fuchsia-400/70 bottom-[22%] right-[30%]" />
        </div>
      );
    default:
      return null;
  }
}

// VS Tile with Pokemon and stats
function VSTile({ unit, terrain, isAttacker }: { unit: Unit; terrain: TerrainType; isAttacker: boolean }) {
  const theme = TERRAIN_THEME[terrain] || TERRAIN_THEME[TERRAIN.GRASS];
  const hpPercent = (unit.currentHp / unit.template.hp) * 100;
  const hpColor = hpPercent > 50 ? 'from-green-400 to-green-500' : hpPercent > 25 ? 'from-yellow-400 to-amber-500' : 'from-red-500 to-red-600';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Tile */}
      <div className="relative w-28 h-28 md:w-36 md:h-36">
        {/* Glow behind tile */}
        <div className={`
          absolute -inset-3 rounded-3xl blur-xl animate-pulse
          ${isAttacker ? 'bg-blue-500/40' : 'bg-red-500/40'}
        `} />

        {/* Main tile */}
        <div className={`
          relative w-full h-full rounded-2xl
          bg-gradient-to-br ${theme.gradient}
          border-b-[6px] ${theme.border}
          shadow-2xl overflow-hidden
        `}>
          <TerrainDecoration texture={theme.texture} />
          <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/25 to-transparent rounded-t-2xl" />
        </div>

        {/* Pokemon */}
        <div className="absolute inset-0 flex items-center justify-center z-10 animate-float">
          <img
            src={getIconSprite(unit.template.id)}
            className={`
              drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]
              ${isAttacker ? '-scale-x-100' : ''}
            `}
            style={{
              imageRendering: 'pixelated',
              width: 'clamp(56px, 140%, 80px)',
              height: 'auto',
            }}
            alt={unit.template.name}
          />
        </div>

        {/* Player indicator */}
        <div className={`
          absolute -top-2 -right-2 w-7 h-7 rounded-full z-20
          flex items-center justify-center
          text-white text-xs font-black
          border-2 border-white/60 shadow-lg
          ${isAttacker ? 'bg-blue-500' : 'bg-red-500'}
        `}>
          {unit.owner === 'P1' ? '1' : '2'}
        </div>
      </div>

      {/* Stats panel */}
      <div className={`
        relative px-4 py-2 rounded-xl
        bg-slate-900/90 border-2 shadow-xl
        ${isAttacker ? 'border-blue-500/50' : 'border-red-500/50'}
      `}>
        {/* Name */}
        <div className="text-white font-bold text-sm md:text-base text-center mb-2">
          {unit.template.name}
        </div>

        {/* HP Bar */}
        <div className="w-32 md:w-40">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>HP</span>
            <span>{unit.currentHp}/{unit.template.hp}</span>
          </div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${hpColor} transition-all duration-300`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-orange-400">ATK</span>
            <span className="text-white font-bold">{unit.template.atk}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-cyan-400">DEF</span>
            <span className="text-white font-bold">{unit.template.def}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-400">MOV</span>
            <span className="text-white font-bold">{unit.template.mov}</span>
          </div>
        </div>

        {/* Type badges */}
        <div className="flex justify-center gap-1 mt-2">
          {unit.template.types.map((type) => (
            <span
              key={type}
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BattleZoomTransition({ attacker, defender, map, onComplete }: BattleZoomTransitionProps) {
  const [phase, setPhase] = useState<'board' | 'zoom' | 'vs' | 'spiral' | 'black' | 'done'>('board');
  const [spiralProgress, setSpiralProgress] = useState(0);

  const boardWidth = map[0]?.length || 10;
  const boardHeight = map.length || 12;

  // Calculate center point for zoom (clamped to avoid edge awkwardness)
  const centerX = Math.max(boardWidth * 0.15, Math.min(boardWidth * 0.85, (attacker.x + defender.x) / 2 + 0.5));
  const centerY = Math.max(boardHeight * 0.15, Math.min(boardHeight * 0.85, (attacker.y + defender.y) / 2 + 0.5));

  // Determine layout based on relative positions
  const dx = Math.abs(attacker.x - defender.x);
  const dy = Math.abs(attacker.y - defender.y);
  const isHorizontal = dx >= dy;

  // Determine which side each unit is on
  const attackerOnLeft = attacker.x <= defender.x;
  const attackerOnTop = attacker.y <= defender.y;

  const attackerTerrain = (map[attacker.y]?.[attacker.x] ?? 0) as TerrainType;
  const defenderTerrain = (map[defender.y]?.[defender.x] ?? 0) as TerrainType;

  // Timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('zoom'), 80));
    timers.push(setTimeout(() => setPhase('vs'), 550));
    timers.push(setTimeout(() => setPhase('spiral'), 2000));
    timers.push(setTimeout(() => setPhase('black'), 2600));
    timers.push(setTimeout(() => setPhase('done'), 2700));
    timers.push(setTimeout(onComplete, 2750));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Pokemon-style spiral wipe animation
  useEffect(() => {
    if (phase !== 'spiral') return;

    let animationFrame: number;
    const startTime = Date.now();
    const duration = 550;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Accelerate toward the end for dramatic effect
      const eased = progress * progress * progress;
      setSpiralProgress(eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [phase]);

  const showBoard = phase === 'board' || phase === 'zoom';
  const showVS = phase === 'vs' || phase === 'spiral';

  // Generate particles for VS screen
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 2,
  })), []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">

      {/* === BOARD ZOOM PHASE === */}
      {showBoard && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-500 ease-in
            ${phase === 'board' ? 'scale-100 opacity-100' : 'scale-[3] opacity-100'}
          `}
          style={{
            transformOrigin: `${(centerX / boardWidth) * 100}% ${(centerY / boardHeight) * 100}%`,
          }}
        >
          <div
            className="relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
              gridTemplateRows: `repeat(${boardHeight}, 1fr)`,
              width: 'min(88vw, 400px)',
              aspectRatio: `${boardWidth} / ${boardHeight}`,
              gap: '2px',
            }}
          >
            {Array.from({ length: boardHeight }, (_, y) =>
              Array.from({ length: boardWidth }, (_, x) => {
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

      {/* Vignette for board phase */}
      {showBoard && (
        <div className={`
          absolute inset-0 pointer-events-none z-10
          bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)]
          transition-opacity duration-300
          ${phase === 'zoom' ? 'opacity-100' : 'opacity-50'}
        `} />
      )}

      {/* === VS SCREEN WITH TILES === */}
      {showVS && (
        <div className="absolute inset-0 z-20 animate-fade-in">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />

          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:32px_32px] animate-bg-scroll" />
          </div>

          {/* Floating particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/20 animate-float-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}

          {/* Dramatic radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.1)_0%,transparent_50%)]" />

          {/* Tiles container */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${isHorizontal ? 'flex-row' : 'flex-col'}
            gap-6 md:gap-12 p-4
          `}>
            {/* First unit (based on position) */}
            <div className={`
              ${phase === 'vs' ? (isHorizontal ? 'animate-slide-in-left' : 'animate-slide-in-top') : ''}
            `}>
              <VSTile
                unit={isHorizontal ? (attackerOnLeft ? attacker : defender) : (attackerOnTop ? attacker : defender)}
                terrain={isHorizontal ? (attackerOnLeft ? attackerTerrain : defenderTerrain) : (attackerOnTop ? attackerTerrain : defenderTerrain)}
                isAttacker={isHorizontal ? attackerOnLeft : attackerOnTop}
              />
            </div>

            {/* VS Badge */}
            <div className={`
              z-30
              ${phase === 'vs' ? 'animate-vs-slam' : ''}
            `}>
              <div className="relative">
                {/* Glow layers */}
                <div className="absolute -inset-8 bg-amber-500/30 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -inset-4 bg-amber-400/40 rounded-full blur-xl" />

                {/* Badge */}
                <div className="
                  relative bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700
                  text-slate-900 font-black text-4xl md:text-6xl
                  px-6 py-3 rounded-xl
                  border-4 border-amber-200
                  shadow-[0_6px_0_0_rgba(120,80,0,0.5),0_0_40px_rgba(251,191,36,0.6),inset_0_2px_0_rgba(255,255,255,0.5)]
                ">
                  VS
                </div>
              </div>
            </div>

            {/* Second unit */}
            <div className={`
              ${phase === 'vs' ? (isHorizontal ? 'animate-slide-in-right' : 'animate-slide-in-bottom') : ''}
            `}>
              <VSTile
                unit={isHorizontal ? (attackerOnLeft ? defender : attacker) : (attackerOnTop ? defender : attacker)}
                terrain={isHorizontal ? (attackerOnLeft ? defenderTerrain : attackerTerrain) : (attackerOnTop ? defenderTerrain : attackerTerrain)}
                isAttacker={isHorizontal ? !attackerOnLeft : !attackerOnTop}
              />
            </div>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
        </div>
      )}

      {/* === POKEMON-STYLE SPIRAL WIPE === */}
      {phase === 'spiral' && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          {/* Multi-arm spiral closing effect */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <mask id="spiralMask">
                <rect x="0" y="0" width="100" height="100" fill="black" />
                {/* Create spiral arms that grow inward */}
                {Array.from({ length: 6 }, (_, armIndex) => {
                  const armAngleOffset = (armIndex / 6) * Math.PI * 2;
                  const rotations = 3; // Number of spiral rotations
                  const maxRadius = 85;
                  const currentRotation = spiralProgress * rotations * Math.PI * 2;

                  // Generate points along the spiral arm
                  const points: string[] = [];
                  const steps = 60;

                  for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const coveredT = Math.min(t, spiralProgress);
                    const angle = armAngleOffset + coveredT * rotations * Math.PI * 2;
                    const radius = maxRadius * (1 - coveredT);

                    if (coveredT <= spiralProgress) {
                      const x = 50 + Math.cos(angle) * radius;
                      const y = 50 + Math.sin(angle) * radius;
                      points.push(`${x},${y}`);
                    }
                  }

                  // Add center point and close the shape
                  if (points.length > 1) {
                    const armWidth = 12 + spiralProgress * 8; // Arms get wider as they progress
                    return (
                      <g key={armIndex}>
                        <polyline
                          points={points.join(' ')}
                          fill="none"
                          stroke="white"
                          strokeWidth={armWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Center fill as spiral completes */}
                {spiralProgress > 0.7 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={Math.min(50, (spiralProgress - 0.7) * 167)}
                    fill="white"
                  />
                )}
              </mask>
            </defs>

            {/* Black background revealed by spiral */}
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill="#0f172a"
              mask="url(#spiralMask)"
            />

            {/* Glowing edge effect on spiral tips */}
            {Array.from({ length: 6 }, (_, armIndex) => {
              const armAngleOffset = (armIndex / 6) * Math.PI * 2;
              const rotations = 3;
              const maxRadius = 85;
              const angle = armAngleOffset + spiralProgress * rotations * Math.PI * 2;
              const radius = maxRadius * (1 - spiralProgress);
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;

              if (spiralProgress < 0.95) {
                return (
                  <circle
                    key={`glow-${armIndex}`}
                    cx={x}
                    cy={y}
                    r={2}
                    fill="rgba(251,191,36,0.9)"
                    className="animate-pulse"
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Flash effect at completion */}
          {spiralProgress > 0.9 && (
            <div
              className="absolute inset-0 bg-white pointer-events-none"
              style={{ opacity: Math.max(0, (spiralProgress - 0.9) * 5) }}
            />
          )}
        </div>
      )}

      {/* Black screen after wipe */}
      {(phase === 'black' || phase === 'done') && (
        <div className="absolute inset-0 bg-slate-950 z-30" />
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

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 1.5s ease-in-out infinite; }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }
        .animate-float-particle { animation: float-particle 3s ease-in-out infinite; }

        @keyframes bg-scroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(32px, 32px); }
        }
        .animate-bg-scroll { animation: bg-scroll 4s linear infinite; }

        @keyframes vs-slam {
          0% { transform: scale(3) rotate(-10deg); opacity: 0; }
          40% { transform: scale(0.9) rotate(2deg); opacity: 1; }
          60% { transform: scale(1.1) rotate(-1deg); }
          80% { transform: scale(0.97) rotate(0.5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-vs-slam { animation: vs-slam 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes slide-in-left {
          0% { transform: translateX(-100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left { animation: slide-in-left 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes slide-in-right {
          0% { transform: translateX(100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes slide-in-top {
          0% { transform: translateY(-100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in-top { animation: slide-in-top 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes slide-in-bottom {
          0% { transform: translateY(100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in-bottom { animation: slide-in-bottom 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </div>
  );
}
