import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { EvolutionData } from '../types/game';

type EvolutionPhase = 'intro' | 'glow' | 'transform' | 'reveal' | 'stats' | 'end';

interface EvolutionCinematicProps {
  evolutionData: EvolutionData;
  onComplete: () => void;
}

export function EvolutionCinematic({ evolutionData, onComplete }: EvolutionCinematicProps) {
  const [phase, setPhase] = useState<EvolutionPhase>('intro');
  const { fromTemplate, toTemplate } = evolutionData;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('glow'), 1000));
    timers.push(setTimeout(() => setPhase('transform'), 2500));
    timers.push(setTimeout(() => setPhase('reveal'), 4000));
    timers.push(setTimeout(() => setPhase('stats'), 5500));
    timers.push(setTimeout(() => setPhase('end'), 8000));
    timers.push(setTimeout(onComplete, 8500));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const statDiff = (from: number, to: number) => {
    const diff = to - from;
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Radial gradient pulse */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            phase === 'glow' || phase === 'transform'
              ? 'opacity-100'
              : 'opacity-0'
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)'
          }}
        />

        {/* Particle effect */}
        {(phase === 'glow' || phase === 'transform') && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Title */}
        <div className={`mb-8 transition-all duration-500 ${
          phase === 'intro' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
        }`}>
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <span className="text-3xl font-bold uppercase tracking-wider">¡Está evolucionando!</span>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {/* Pokemon sprite area */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Original Pokemon (fading out) */}
          <div className={`absolute transition-all duration-1000 ${
            phase === 'intro' || phase === 'glow'
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-150'
          }`}>
            <img
              src={getAnimatedFrontSprite(fromTemplate.id)}
              className="w-48 h-48 object-contain"
              style={{ imageRendering: 'pixelated' }}
              alt={fromTemplate.name}
            />
          </div>

          {/* Glowing silhouette during transform */}
          <div className={`absolute transition-all duration-500 ${
            phase === 'transform'
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-50'
          }`}>
            <div className="w-56 h-56 bg-white rounded-full animate-pulse shadow-[0_0_60px_30px_rgba(255,255,255,0.8)]" />
          </div>

          {/* New Pokemon (fading in) */}
          <div className={`absolute transition-all duration-1000 ${
            phase === 'reveal' || phase === 'stats' || phase === 'end'
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-50'
          }`}>
            <img
              src={getAnimatedFrontSprite(toTemplate.id)}
              className="w-56 h-56 object-contain animate-bounce"
              style={{
                imageRendering: 'pixelated',
                animationDuration: '2s'
              }}
              alt={toTemplate.name}
            />
          </div>
        </div>

        {/* Name reveal */}
        <div className={`mt-6 transition-all duration-500 ${
          phase === 'reveal' || phase === 'stats' || phase === 'end'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10'
        }`}>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">{fromTemplate.name} →</div>
            <div className="text-4xl font-black text-white uppercase tracking-wider">
              {toTemplate.name}
            </div>
          </div>
        </div>

        {/* Stats comparison */}
        <div className={`mt-8 transition-all duration-500 ${
          phase === 'stats' || phase === 'end'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-slate-900/90 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
              <span className="font-bold uppercase text-sm">Stats mejorados</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-xs uppercase">HP</div>
                <div className="text-white font-bold">{toTemplate.hp}</div>
                <div className="text-emerald-400 text-sm font-bold">
                  {statDiff(fromTemplate.hp, toTemplate.hp)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">ATK</div>
                <div className="text-white font-bold">{toTemplate.atk}</div>
                <div className="text-emerald-400 text-sm font-bold">
                  {statDiff(fromTemplate.atk, toTemplate.atk)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">DEF</div>
                <div className="text-white font-bold">{toTemplate.def}</div>
                <div className="text-emerald-400 text-sm font-bold">
                  {statDiff(fromTemplate.def, toTemplate.def)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
              <div>
                <div className="text-gray-400 text-xs uppercase">MOV</div>
                <div className="text-white font-bold">{toTemplate.mov}</div>
                <div className="text-emerald-400 text-sm font-bold">
                  {statDiff(fromTemplate.mov, toTemplate.mov)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">RNG</div>
                <div className="text-white font-bold">{toTemplate.rng}</div>
                <div className="text-emerald-400 text-sm font-bold">
                  {statDiff(fromTemplate.rng, toTemplate.rng)}
                </div>
              </div>
            </div>

            {/* New move */}
            {fromTemplate.moveName !== toTemplate.moveName && (
              <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                <div className="text-gray-400 text-xs uppercase mb-1">Nuevo Movimiento</div>
                <div className="text-yellow-400 font-bold">{toTemplate.moveName}</div>
              </div>
            )}
          </div>
        </div>

        {/* HP restored message */}
        <div className={`mt-4 transition-all duration-500 ${
          phase === 'stats' || phase === 'end'
            ? 'opacity-100'
            : 'opacity-0'
        }`}>
          <div className="text-emerald-400 font-bold animate-pulse">
            ¡HP completamente restaurado!
          </div>
        </div>
      </div>
    </div>
  );
}
