import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { CaptureData, PokemonType } from '../types/game';

interface CaptureModalProps extends CaptureData {
  onComplete: () => void;
}

// Type colors matching the minigame
const TYPE_COLORS: Record<PokemonType, { primary: string; secondary: string; glow: string }> = {
  normal: { primary: '#A8A878', secondary: '#6D6D4E', glow: 'rgba(168,168,120,0.5)' },
  fire: { primary: '#F08030', secondary: '#9C531F', glow: 'rgba(240,128,48,0.6)' },
  water: { primary: '#6890F0', secondary: '#445E9C', glow: 'rgba(104,144,240,0.6)' },
  grass: { primary: '#78C850', secondary: '#4E8234', glow: 'rgba(120,200,80,0.6)' },
  electric: { primary: '#F8D030', secondary: '#A1871F', glow: 'rgba(248,208,48,0.6)' },
  ice: { primary: '#98D8D8', secondary: '#638D8D', glow: 'rgba(152,216,216,0.6)' },
  fighting: { primary: '#C03028', secondary: '#7D1F1A', glow: 'rgba(192,48,40,0.6)' },
  poison: { primary: '#A040A0', secondary: '#682A68', glow: 'rgba(160,64,160,0.6)' },
  ground: { primary: '#E0C068', secondary: '#927D44', glow: 'rgba(224,192,104,0.6)' },
  flying: { primary: '#A890F0', secondary: '#6D5E9C', glow: 'rgba(168,144,240,0.6)' },
  psychic: { primary: '#F85888', secondary: '#A13959', glow: 'rgba(248,88,136,0.6)' },
  bug: { primary: '#A8B820', secondary: '#6D7815', glow: 'rgba(168,184,32,0.6)' },
  rock: { primary: '#B8A038', secondary: '#786824', glow: 'rgba(184,160,56,0.6)' },
  ghost: { primary: '#705898', secondary: '#493963', glow: 'rgba(112,88,152,0.6)' },
  dragon: { primary: '#7038F8', secondary: '#4924A1', glow: 'rgba(112,56,248,0.6)' },
  steel: { primary: '#B8B8D0', secondary: '#787887', glow: 'rgba(184,184,208,0.6)' },
  fairy: { primary: '#EE99AC', secondary: '#9B6470', glow: 'rgba(238,153,172,0.6)' },
  dark: { primary: '#705848', secondary: '#49392D', glow: 'rgba(112,88,72,0.6)' },
};

// Generate sparkle particles — now type-colored
function generateSparkles(count: number, typeColor: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 7,
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2.5,
    color: Math.random() > 0.5 ? '#FFD700' : typeColor,
  }));
}

// Generate large floating orbs
function generateOrbs(typeColor: string, typeGlow: string) {
  return Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: 15 + Math.random() * 70,
    y: 20 + Math.random() * 60,
    size: 20 + Math.random() * 15,
    delay: i * 2,
    duration: 6 + Math.random() * 4,
    color: typeColor,
    glow: typeGlow,
  }));
}

// Stat bar component with count-up animation
function StatBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const [width, setWidth] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(100, (value / maxValue) * 100);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Count-up animation for stat values
  useEffect(() => {
    const startTime = Date.now();
    const duration = 800; // ms

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const delay = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-10 text-[10px] font-bold text-slate-400"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        {label}
      </span>
      <div className="flex-1 h-3 bg-slate-800 rounded-sm overflow-hidden border border-slate-700 relative">
        <div
          className="h-full transition-all duration-1000 ease-out relative"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}60`,
          }}
        >
          {/* Glow effect matching stat color */}
          <div
            className="absolute inset-0"
            style={{ boxShadow: `inset 0 0 8px ${color}40` }}
          />
        </div>
        {/* Segmented notch marks — 5 segments */}
        <div className="absolute inset-0 flex pointer-events-none">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-full border-r border-slate-700/60"
              style={{ left: `${i * 20}%`, position: 'absolute', width: '1px' }}
            />
          ))}
        </div>
      </div>
      <span
        className="w-8 text-[10px] font-bold text-white text-right"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        {displayValue}
      </span>
    </div>
  );
}

export function CaptureModal({ pokemon, player, onComplete }: CaptureModalProps) {
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'stats' | 'ready'>('intro');
  const [showButton, setShowButton] = useState(false);

  const typeColors = TYPE_COLORS[pokemon.types[0]] || TYPE_COLORS.normal;
  const sparkles = useMemo(() => generateSparkles(30, typeColors.primary), [typeColors.primary]);
  const orbs = useMemo(() => generateOrbs(typeColors.primary, typeColors.glow), [typeColors.primary, typeColors.glow]);

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (phase === 'intro') {
      timers.push(setTimeout(() => setPhase('reveal'), 500));
    } else if (phase === 'reveal') {
      timers.push(setTimeout(() => setPhase('stats'), 800));
    } else if (phase === 'stats') {
      timers.push(setTimeout(() => {
        setPhase('ready');
        setShowButton(true);
      }, 1500));
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      {/* Background with type-colored gradient */}
      <div
        className="absolute inset-0 animate-bg-pulse"
        style={{
          background: `radial-gradient(ellipse at center, ${typeColors.glow} 0%, #0a0a0a 60%)`,
        }}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

      {/* CRT Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)' }}
      />

      {/* Floating sparkles — type-colored */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {sparkles.map(s => (
          <div
            key={s.id}
            className="absolute animate-sparkle-float"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${s.color}, 0 0 20px ${s.color}`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Large slow-floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {orbs.map(o => (
          <div
            key={o.id}
            className="absolute rounded-full animate-orb-float"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: o.size,
              height: o.size,
              background: o.color,
              boxShadow: `0 0 30px ${o.glow}, 0 0 60px ${o.glow}`,
              opacity: 0.15,
              filter: 'blur(8px)',
              animationDelay: `${o.delay}s`,
              animationDuration: `${o.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Main content card */}
      <div className={`relative max-w-md w-full mx-4 transition-all duration-500 ${
        phase === 'intro' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Energy burst on card appear */}
        {phase === 'reveal' && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-6 rounded-full animate-card-burst"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 36}deg)`,
                  background: `linear-gradient(to bottom, ${typeColors.primary}, transparent)`,
                  animationDelay: `${i * 0.03}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* GBA-style frame */}
        <div
          className="relative bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 rounded-xl overflow-hidden"
          style={{
            border: '6px solid',
            borderColor: `${typeColors.primary} ${typeColors.secondary} ${typeColors.secondary} ${typeColors.primary}`,
            boxShadow: `0 0 30px ${typeColors.glow}, inset 0 0 30px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Inner border */}
          <div className="absolute inset-2 border-2 border-slate-600/30 rounded-lg pointer-events-none" />

          {/* Header with title */}
          <div
            className="relative py-4 text-center"
            style={{
              background: `linear-gradient(to bottom, ${typeColors.primary}40, transparent)`,
            }}
          >
            <h2
              className="text-xl sm:text-2xl font-black text-yellow-400 uppercase tracking-wider animate-title-glow"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                textShadow: '0 0 20px #FFD700, 2px 2px 0 #000',
              }}
            >
              ¡CAPTURADO!
            </h2>
          </div>

          {/* Pokemon showcase */}
          <div className="relative flex justify-center py-6">
            {/* Radial light rays behind Pokemon — rotating */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 animate-light-rays-rotate opacity-20 pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, ${typeColors.glow} 10deg, transparent 20deg, transparent 45deg, ${typeColors.glow} 55deg, transparent 65deg, transparent 90deg, ${typeColors.glow} 100deg, transparent 110deg, transparent 135deg, ${typeColors.glow} 145deg, transparent 155deg, transparent 180deg, ${typeColors.glow} 190deg, transparent 200deg, transparent 225deg, ${typeColors.glow} 235deg, transparent 245deg, transparent 270deg, ${typeColors.glow} 280deg, transparent 290deg, transparent 315deg, ${typeColors.glow} 325deg, transparent 335deg, transparent 360deg)`,
                borderRadius: '50%',
              }}
            />

            {/* Glow effect */}
            <div
              className="absolute w-40 h-40 rounded-full blur-3xl animate-pulse"
              style={{ background: typeColors.glow }}
            />

            {/* Pokeball behind Pokemon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
              <div className="w-48 h-48 rounded-full border-8 border-slate-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/30" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-4 bg-slate-600" />
                </div>
              </div>
            </div>

            {/* Pokemon sprite with enhanced bounce */}
            <div className={`relative transition-all duration-500 ${
              phase === 'reveal' || phase === 'stats' || phase === 'ready' ? 'animate-pokemon-bounce-enhanced' : ''
            }`}>
              <img
                src={getAnimatedFrontSprite(pokemon.id)}
                alt={pokemon.name}
                className="w-36 h-36 sm:w-44 sm:h-44 object-contain relative z-10 drop-shadow-2xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* Pokemon name and types */}
          <div className="text-center px-6 pb-4">
            <h3
              className="text-2xl sm:text-3xl font-black text-white uppercase mb-3"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                textShadow: `2px 2px 0 ${typeColors.secondary}, 4px 4px 0 #000`,
              }}
            >
              {pokemon.name}
            </h3>

            {/* Type badges */}
            <div className="flex justify-center gap-2 mb-4">
              {pokemon.types.map(type => (
                <span
                  key={type}
                  className="px-4 py-1.5 text-[10px] font-bold uppercase rounded-md shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom, ${TYPE_COLORS[type]?.primary || '#888'}, ${TYPE_COLORS[type]?.secondary || '#666'})`,
                    color: '#fff',
                    textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                    fontFamily: "'Press Start 2P', monospace",
                    border: `2px solid ${TYPE_COLORS[type]?.primary || '#888'}`,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Team indicator */}
            <div
              className={`inline-block px-4 py-1 rounded-full text-[10px] font-bold ${
                player === 'P1' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-red-500/20 text-red-400 border-red-500'
              } border`}
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              EQUIPO {player === 'P1' ? 'AZUL' : 'ROJO'}
            </div>
          </div>

          {/* Stats panel */}
          <div className={`px-6 pb-4 transition-all duration-500 ${
            phase === 'stats' || phase === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}>
            <div
              className="bg-slate-900/80 rounded-lg p-4 border-2 border-slate-700"
              style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
            >
              {/* 6 Stats in 2 columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <StatBar label="HP" value={pokemon.hp} maxValue={200} color="#22C55E" />
                <StatBar label="SPA" value={pokemon.spa} maxValue={200} color="#A855F7" />
                <StatBar label="ATK" value={pokemon.atk} maxValue={200} color="#EF4444" />
                <StatBar label="SPD" value={pokemon.spd} maxValue={200} color="#14B8A6" />
                <StatBar label="DEF" value={pokemon.def} maxValue={200} color="#3B82F6" />
                <StatBar label="SPE" value={pokemon.spe} maxValue={200} color="#F59E0B" />
              </div>

              {/* Ability */}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[8px] text-slate-500 uppercase"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    Habilidad:
                  </span>
                  <span
                    className="text-[9px] font-bold text-white"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    {pokemon.ability?.name ?? '—'}
                  </span>
                </div>
                {pokemon.ability?.description && (
                  <p className="text-[8px] text-slate-400 mt-1">{pokemon.ability.description}</p>
                )}
              </div>

              {/* 4 Moves in 2x2 grid */}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <span
                  className="text-[8px] text-slate-500 uppercase block mb-2"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  Movimientos
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {pokemon.moves.map(move => {
                    const moveColor = TYPE_COLORS[move.type] || TYPE_COLORS.normal;
                    return (
                      <div
                        key={move.id}
                        className="rounded px-2 py-1.5 border-l-2"
                        style={{
                          borderColor: moveColor.primary,
                          background: 'rgba(15,23,42,0.6)',
                        }}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[9px]">
                            {move.category === 'physical' ? '⚔️' : move.category === 'special' ? '✨' : '🛡️'}
                          </span>
                          <span
                            className="text-[8px] font-bold text-white truncate"
                            style={{ fontFamily: "'Press Start 2P', monospace" }}
                          >
                            {move.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="text-[7px] px-1 py-0.5 rounded text-white font-bold"
                            style={{ background: moveColor.primary }}
                          >
                            {move.type.toUpperCase()}
                          </span>
                          {move.power > 0 ? (
                            <span className="text-[8px] text-slate-400 font-mono">{move.power}pw</span>
                          ) : move.effect ? (
                            <span className="text-[8px] text-slate-400 font-mono capitalize">{move.effect}</span>
                          ) : null}
                          <span className="text-[8px] text-slate-500 font-mono ml-auto">Rng {move.range}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Confirm button with pulse glow ring */}
          <div className={`px-6 pb-6 transition-all duration-300 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="relative">
              {/* Pulsing glow ring around button */}
              {showButton && (
                <div
                  className="absolute -inset-2 rounded-xl animate-button-ring-pulse pointer-events-none"
                  style={{ border: `2px solid ${typeColors.primary}40` }}
                />
              )}
              {/* Floating sparkles near button */}
              {showButton && [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full animate-sparkle-float pointer-events-none"
                  style={{
                    left: `${15 + i * 25}%`,
                    top: '-8px',
                    background: '#FFD700',
                    boxShadow: '0 0 6px #FFD700',
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '2s',
                  }}
                />
              ))}
              <button
                onClick={onComplete}
                className="w-full py-4 rounded-lg font-bold text-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '0.875rem',
                  background: 'linear-gradient(to bottom, #FFD700, #F59E0B)',
                  boxShadow: '0 4px 0 #B45309, 0 6px 20px rgba(245, 158, 11, 0.4)',
                  border: '3px solid #FCD34D',
                }}
              >
                ¡A LUCHAR!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes bg-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-bg-pulse {
          animation: bg-pulse 3s ease-in-out infinite;
        }

        @keyframes sparkle-float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
        }
        .animate-sparkle-float {
          animation: sparkle-float ease-in-out infinite;
        }

        @keyframes orb-float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          33% {
            transform: translateY(-20px) translateX(10px) scale(1.1);
          }
          66% {
            transform: translateY(10px) translateX(-15px) scale(0.95);
          }
        }
        .animate-orb-float {
          animation: orb-float ease-in-out infinite;
        }

        @keyframes title-glow {
          0%, 100% { text-shadow: 0 0 20px #FFD700, 2px 2px 0 #000; }
          50% { text-shadow: 0 0 40px #FFD700, 0 0 60px #FFD700, 2px 2px 0 #000; }
        }
        .animate-title-glow {
          animation: title-glow 2s ease-in-out infinite;
        }

        @keyframes pokemon-bounce-enhanced {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-12px) scale(1.05); }
          60% { transform: translateY(-8px) scale(1.02); }
        }
        .animate-pokemon-bounce-enhanced {
          animation: pokemon-bounce-enhanced 2s ease-in-out infinite;
        }

        @keyframes light-rays-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-light-rays-rotate {
          animation: light-rays-rotate 12s linear infinite;
        }

        @keyframes card-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-100px) scaleY(0.3); }
        }
        .animate-card-burst {
          animation: card-burst 0.6s ease-out forwards;
        }

        @keyframes button-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0; }
        }
        .animate-button-ring-pulse {
          animation: button-ring-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
