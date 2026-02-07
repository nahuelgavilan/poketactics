import React, { useState, useEffect, useMemo } from 'react';
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

// Generate sparkle particles
function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 2,
    duration: 1 + Math.random() * 2,
  }));
}

// Stat bar component
function StatBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const [width, setWidth] = useState(0);
  const percentage = Math.min(100, (value / maxValue) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-10 text-[10px] font-bold text-slate-400"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        {label}
      </span>
      <div className="flex-1 h-3 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
      <span
        className="w-8 text-[10px] font-bold text-white text-right"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        {value}
      </span>
    </div>
  );
}

export function CaptureModal({ pokemon, player, onComplete }: CaptureModalProps) {
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'stats' | 'ready'>('intro');
  const [showButton, setShowButton] = useState(false);

  const typeColors = TYPE_COLORS[pokemon.types[0]] || TYPE_COLORS.normal;
  const sparkles = useMemo(() => generateSparkles(20), []);

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

      {/* Floating sparkles */}
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
              background: '#FFD700',
              borderRadius: '50%',
              boxShadow: '0 0 10px #FFD700, 0 0 20px #FFD700',
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Main content card */}
      <div className={`relative max-w-md w-full mx-4 transition-all duration-500 ${
        phase === 'intro' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
      }`}>
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

            {/* Pokemon sprite */}
            <div className={`relative transition-all duration-500 ${
              phase === 'reveal' || phase === 'stats' || phase === 'ready' ? 'animate-pokemon-bounce' : ''
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
          <div className={`px-6 pb-6 transition-all duration-500 ${
            phase === 'stats' || phase === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}>
            <div
              className="bg-slate-900/80 rounded-lg p-4 border-2 border-slate-700"
              style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
            >
              <div className="space-y-3">
                <StatBar label="HP" value={pokemon.hp} maxValue={150} color="#22C55E" />
                <StatBar label="ATK" value={pokemon.atk} maxValue={50} color="#EF4444" />
                <StatBar label="DEF" value={pokemon.def} maxValue={50} color="#3B82F6" />
                <StatBar label="MOV" value={pokemon.mov} maxValue={6} color="#F59E0B" />
              </div>

              {/* Move info */}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] text-slate-400"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    MOVIMIENTO:
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold text-white"
                      style={{ fontFamily: "'Press Start 2P', monospace" }}
                    >
                      {pokemon.moveName}
                    </span>
                    <span
                      className="px-2 py-0.5 text-[8px] rounded"
                      style={{
                        background: TYPE_COLORS[pokemon.moveType]?.primary || '#888',
                        color: '#fff',
                        fontFamily: "'Press Start 2P', monospace",
                      }}
                    >
                      {pokemon.moveType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <div className={`px-6 pb-6 transition-all duration-300 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={onComplete}
              className="w-full py-4 rounded-lg font-bold text-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
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

        @keyframes title-glow {
          0%, 100% { text-shadow: 0 0 20px #FFD700, 2px 2px 0 #000; }
          50% { text-shadow: 0 0 40px #FFD700, 0 0 60px #FFD700, 2px 2px 0 #000; }
        }
        .animate-title-glow {
          animation: title-glow 2s ease-in-out infinite;
        }

        @keyframes pokemon-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-pokemon-bounce {
          animation: pokemon-bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
