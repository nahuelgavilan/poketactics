import { useState, useEffect, useCallback } from 'react';
import { Swords, Users, BookOpen, ChevronRight, Shield, Sparkles } from 'lucide-react';
import { VERSION } from '../constants/version';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: () => void;
}

// Featured Pokemon with their signature colors
const FEATURED_POKEMON = [
  { id: 6, name: 'Charizard', glow: 'rgba(251,146,60,0.6)' },
  { id: 25, name: 'Pikachu', glow: 'rgba(250,204,21,0.6)' },
  { id: 149, name: 'Dragonite', glow: 'rgba(251,146,60,0.5)' },
  { id: 94, name: 'Gengar', glow: 'rgba(168,85,247,0.6)' },
  { id: 130, name: 'Gyarados', glow: 'rgba(59,130,246,0.6)' },
  { id: 448, name: 'Lucario', glow: 'rgba(96,165,250,0.5)' },
];

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer }: StartScreenProps) {
  const [phase, setPhase] = useState<'intro' | 'ready'>('intro');
  const [activePokemon, setActivePokemon] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);

    // Entrance animation
    const introTimer = setTimeout(() => setPhase('ready'), 100);

    // Cycle through featured Pokemon
    const pokemonInterval = setInterval(() => {
      setActivePokemon(prev => (prev + 1) % FEATURED_POKEMON.length);
    }, 4000);

    return () => {
      clearTimeout(introTimer);
      clearInterval(pokemonInterval);
    };
  }, []);

  const currentPokemon = FEATURED_POKEMON[activePokemon];
  const oppositePokemon = FEATURED_POKEMON[(activePokemon + 3) % FEATURED_POKEMON.length];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* === LAYERED BACKGROUND === */}

      {/* Base - deep dark */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      {/* Radial gradient center glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,30,50,1)_0%,transparent_70%)]" />

      {/* Team territories with noise texture */}
      <div className="absolute inset-0">
        {/* Blue territory - left */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-950/20 to-transparent"
          style={{ clipPath: 'polygon(0 0, 55% 0, 35% 100%, 0 100%)' }}
        />

        {/* Red territory - right */}
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-900/40 via-red-950/20 to-transparent"
          style={{ clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 65% 100%)' }}
        />
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

      {/* Animated ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30 animate-float-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)'
        }}
      />

      {/* === POKEMON DISPLAYS === */}

      {/* Left Pokemon - Blue team */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full pointer-events-none">
        <div className="relative h-full flex items-center justify-center">
          {FEATURED_POKEMON.map((pokemon, i) => (
            <div
              key={pokemon.id}
              className={`absolute transition-all duration-1000 ease-out ${
                i === activePokemon
                  ? 'opacity-100 scale-100 translate-x-0'
                  : 'opacity-0 scale-75 -translate-x-8'
              }`}
            >
              {/* Glow behind Pokemon */}
              <div
                className="absolute inset-0 blur-3xl scale-150 animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${pokemon.glow} 0%, transparent 70%)`,
                  animationDuration: '3s'
                }}
              />
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                alt={pokemon.name}
                className="relative w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain scale-x-[-1] drop-shadow-2xl animate-pokemon-idle"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Pokemon - Red team */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full pointer-events-none">
        <div className="relative h-full flex items-center justify-center">
          {FEATURED_POKEMON.map((pokemon, i) => {
            const shiftedIndex = (i + 3) % FEATURED_POKEMON.length;
            return (
              <div
                key={`right-${pokemon.id}`}
                className={`absolute transition-all duration-1000 ease-out ${
                  shiftedIndex === activePokemon
                    ? 'opacity-100 scale-100 translate-x-0'
                    : 'opacity-0 scale-75 translate-x-8'
                }`}
              >
                <div
                  className="absolute inset-0 blur-3xl scale-150 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${pokemon.glow} 0%, transparent 70%)`,
                    animationDuration: '3s',
                    animationDelay: '1.5s'
                  }}
                />
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                  alt={pokemon.name}
                  className="relative w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain drop-shadow-2xl animate-pokemon-idle"
                  style={{ imageRendering: 'pixelated', animationDelay: '0.5s' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* === DECORATIVE FRAME === */}

      {/* Corner ornaments */}
      <div className="absolute top-6 left-6 w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/80 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-amber-500/80 to-transparent" />
        <div className="absolute top-2 left-2 w-2 h-2 bg-amber-500/60 rotate-45" />
      </div>
      <div className="absolute top-6 right-6 w-16 h-16">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-amber-500/80 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-amber-500/80 to-transparent" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500/60 rotate-45" />
      </div>
      <div className="absolute bottom-6 left-6 w-16 h-16">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/80 to-transparent" />
        <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-amber-500/80 to-transparent" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-amber-500/60 rotate-45" />
      </div>
      <div className="absolute bottom-6 right-6 w-16 h-16">
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-amber-500/80 to-transparent" />
        <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-amber-500/80 to-transparent" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-amber-500/60 rotate-45" />
      </div>

      {/* === MAIN CONTENT === */}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">

        {/* Logo Section */}
        <div className={`transform transition-all duration-1000 ease-out ${
          phase === 'ready' ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
        }`}>

          {/* Emblem */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {/* Outer glow ring */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 rounded-full blur-xl animate-pulse" />

              {/* Shield container */}
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                {/* Diamond background */}
                <div className="absolute inset-1 rotate-45 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg" />
                <div className="absolute inset-2 rotate-45 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500" />
                <div className="absolute inset-3 rotate-45 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 shadow-inner" />

                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className="w-9 h-9 md:w-11 md:h-11 text-amber-100 drop-shadow-lg" strokeWidth={1.5} />
                </div>

                {/* Shine effect */}
                <div className="absolute inset-3 rotate-45 rounded-md bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-3">
            <h1 className="relative inline-block">
              {/* Shadow layer */}
              <span
                className="absolute inset-0 text-black/50 blur-sm"
                style={{
                  fontFamily: '"Press Start 2P", system-ui',
                  fontSize: 'clamp(1.8rem, 6vw, 4rem)',
                  transform: 'translate(3px, 3px)'
                }}
                aria-hidden="true"
              >
                POKÉTACTICS
              </span>

              {/* Main text */}
              <span
                className="relative"
                style={{
                  fontFamily: '"Press Start 2P", system-ui',
                  fontSize: 'clamp(1.8rem, 6vw, 4rem)',
                }}
              >
                <span className="bg-gradient-to-b from-white via-blue-100 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
                  POKÉ
                </span>
                <span className="bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-lg">
                  TACTICS
                </span>
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent via-amber-500/50 to-amber-500/80" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-400/70" />
              <span className="text-[10px] md:text-xs tracking-[0.3em] text-amber-400/90 font-semibold uppercase">
                Tactical Battle
              </span>
              <Sparkles className="w-3 h-3 text-amber-400/70" />
            </div>
            <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent via-amber-500/50 to-amber-500/80" />
          </div>

          {/* Version */}
          <div className="flex justify-center">
            <div className="px-4 py-1 bg-black/40 backdrop-blur-sm border border-amber-500/20 rounded-full">
              <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-amber-500/70">
                v{VERSION} ALPHA
              </span>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className={`mt-10 md:mt-14 w-full max-w-md transform transition-all duration-1000 delay-200 ease-out ${
          phase === 'ready' ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>

          {/* Menu Container - Premium panel */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-b from-amber-500/20 to-amber-700/20 rounded-lg blur-md" />

            {/* Main panel */}
            <div className="relative bg-gradient-to-b from-[#2a2520] via-[#1f1b18] to-[#151310] rounded-lg border border-amber-900/50 overflow-hidden shadow-2xl">

              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

              {/* Header */}
              <div className="relative px-6 py-3 bg-gradient-to-b from-amber-900/30 to-transparent border-b border-amber-900/30">
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-4 h-4 text-amber-600/80" />
                  <span className="text-xs font-bold tracking-[0.2em] text-amber-500/90 uppercase">
                    Menú Principal
                  </span>
                  <Shield className="w-4 h-4 text-amber-600/80" />
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-3">
                <PremiumButton
                  icon={<Swords className="w-5 h-5" />}
                  label="Batalla Local"
                  sublabel="2 jugadores • Hot Seat"
                  onClick={onStartGame}
                  variant="primary"
                  delay={0}
                  ready={phase === 'ready'}
                />

                {onMultiplayer && (
                  <PremiumButton
                    icon={<Users className="w-5 h-5" />}
                    label="Multijugador"
                    sublabel="Online • Crear o unirse"
                    onClick={onMultiplayer}
                    variant="secondary"
                    delay={1}
                    ready={phase === 'ready'}
                  />
                )}

                <PremiumButton
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Cómo Jugar"
                  sublabel="Tutorial y mecánicas"
                  onClick={onHowToPlay}
                  variant="tertiary"
                  delay={2}
                  ready={phase === 'ready'}
                />
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-800/30 to-transparent" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 transition-all duration-1000 delay-500 ${
          phase === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Prompt */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] text-slate-500 uppercase font-medium">
              Selecciona una opción
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>

      {/* === STYLES === */}
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(5px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) translateX(-5px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(3px);
            opacity: 0.5;
          }
        }

        .animate-float-particle {
          animation: float-particle 8s ease-in-out infinite;
        }

        @keyframes pokemon-idle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-pokemon-idle {
          animation: pokemon-idle 3s ease-in-out infinite;
        }

        @keyframes button-enter {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-button-enter {
          opacity: 0;
          animation: button-enter 0.5s ease-out forwards;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

interface PremiumButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'tertiary';
  delay: number;
  ready: boolean;
}

function PremiumButton({ icon, label, sublabel, onClick, variant, delay, ready }: PremiumButtonProps) {
  const variants = {
    primary: {
      bg: 'from-blue-600 via-blue-500 to-blue-600',
      hover: 'hover:from-blue-500 hover:via-blue-400 hover:to-blue-500',
      border: 'border-blue-400/50',
      glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
      iconBg: 'bg-blue-400/20',
      text: 'text-white',
      subtext: 'text-blue-100/80'
    },
    secondary: {
      bg: 'from-emerald-600 via-emerald-500 to-emerald-600',
      hover: 'hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500',
      border: 'border-emerald-400/50',
      glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      iconBg: 'bg-emerald-400/20',
      text: 'text-white',
      subtext: 'text-emerald-100/80'
    },
    tertiary: {
      bg: 'from-slate-700 via-slate-600 to-slate-700',
      hover: 'hover:from-slate-600 hover:via-slate-500 hover:to-slate-600',
      border: 'border-slate-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(100,116,139,0.2)]',
      iconBg: 'bg-slate-500/20',
      text: 'text-slate-100',
      subtext: 'text-slate-300/80'
    }
  };

  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full overflow-hidden
        animate-button-enter
        transition-all duration-200
        ${v.glow}
      `}
      style={{ animationDelay: `${delay * 100 + 400}ms` }}
    >
      {/* Button container */}
      <div className={`
        relative flex items-center gap-4
        px-5 py-4
        bg-gradient-to-r ${v.bg} ${v.hover}
        rounded-lg border ${v.border}
        transition-all duration-200
        group-active:scale-[0.98]
      `}>
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
          style={{ animation: 'shimmer 0.8s ease-out' }}
        />

        {/* Top highlight */}
        <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Icon */}
        <div className={`relative flex-shrink-0 p-2.5 rounded-lg ${v.iconBg}`}>
          {icon}
        </div>

        {/* Text */}
        <div className="relative flex-1 text-left">
          <div className={`font-bold text-sm md:text-base tracking-wide ${v.text}`}>
            {label}
          </div>
          <div className={`text-[10px] md:text-xs ${v.subtext}`}>
            {sublabel}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className={`
          relative w-5 h-5 ${v.text} opacity-50
          group-hover:opacity-100 group-hover:translate-x-1
          transition-all duration-200
        `} />
      </div>
    </button>
  );
}
