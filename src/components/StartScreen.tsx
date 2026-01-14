import { useState, useEffect } from 'react';
import { Swords, Users, BookOpen, ChevronRight, Shield, Zap, Target, Crown } from 'lucide-react';
import { VERSION } from '../constants/version';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: () => void;
}

// Featured Pokemon for the animated display
const FEATURED_POKEMON = [
  { id: 6, name: 'Charizard' },
  { id: 25, name: 'Pikachu' },
  { id: 149, name: 'Dragonite' },
  { id: 94, name: 'Gengar' },
  { id: 130, name: 'Gyarados' },
  { id: 448, name: 'Lucario' },
];

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer }: StartScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [activePokemon, setActivePokemon] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);

    // Cycle through featured Pokemon
    const pokemonInterval = setInterval(() => {
      setActivePokemon(prev => (prev + 1) % FEATURED_POKEMON.length);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(pokemonInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Base background - dark tactical */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Diagonal split design - like Fire Emblem */}
      <div className="absolute inset-0">
        {/* Top diagonal - Blue team territory */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900/80 to-transparent"
          style={{ clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)' }}
        />

        {/* Bottom diagonal - Red team territory */}
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-950 via-red-900/80 to-transparent"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 40% 0)' }}
        />

        {/* Center accent line */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-amber-500 to-amber-600"
          style={{ clipPath: 'polygon(48% 0, 52% 0, 42% 100%, 38% 100%)' }}
        />
        <div
          className="absolute inset-0 bg-amber-400/50"
          style={{ clipPath: 'polygon(49% 0, 51% 0, 41% 100%, 39% 100%)' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Animated diagonal stripes */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -35deg,
            transparent,
            transparent 30px,
            rgba(251,191,36,1) 30px,
            rgba(251,191,36,1) 60px
          )`,
          animation: 'stripes-scroll 30s linear infinite'
        }}
      />

      {/* Decorative corner frames - GBA style */}
      <div className="absolute top-4 left-4 w-20 h-20 border-l-3 border-t-3 border-amber-600/40" />
      <div className="absolute top-4 right-4 w-20 h-20 border-r-3 border-t-3 border-amber-600/40" />
      <div className="absolute bottom-4 left-4 w-20 h-20 border-l-3 border-b-3 border-amber-600/40" />
      <div className="absolute bottom-4 right-4 w-20 h-20 border-r-3 border-b-3 border-amber-600/40" />

      {/* Featured Pokemon display - left side */}
      <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 opacity-20 md:opacity-30">
        <div className="relative">
          {FEATURED_POKEMON.map((pokemon, i) => (
            <div
              key={pokemon.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
                i === activePokemon ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                alt={pokemon.name}
                className="w-24 h-24 md:w-40 md:h-40 object-contain scale-x-[-1] drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Featured Pokemon display - right side */}
      <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 opacity-20 md:opacity-30">
        <div className="relative">
          {FEATURED_POKEMON.map((pokemon, i) => {
            const shiftedIndex = (i + 3) % FEATURED_POKEMON.length;
            return (
              <div
                key={`right-${pokemon.id}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
                  shiftedIndex === activePokemon ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                  alt={pokemon.name}
                  className="w-24 h-24 md:w-40 md:h-40 object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">

        {/* Title section */}
        <div className={`transform transition-all duration-700 ${showContent ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>

          {/* Shield emblem */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse" />

              {/* Diamond shape */}
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <div className="absolute inset-2 bg-gradient-to-br from-amber-400 to-amber-600 rotate-45 rounded-lg border-2 border-amber-300 shadow-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className="w-7 h-7 md:w-9 md:h-9 text-amber-900 drop-shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Main title - GBA style */}
          <div className="relative text-center mb-2">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
              style={{
                fontFamily: '"Press Start 2P", system-ui, sans-serif',
                fontSize: 'clamp(1.5rem, 5vw, 3.5rem)'
              }}
            >
              <span
                className="text-white drop-shadow-[0_2px_0_#1e3a8a]"
                style={{ textShadow: '0 4px 0 #1e3a8a, 0 0 40px rgba(59,130,246,0.5)' }}
              >
                POKÉ
              </span>
              <span
                className="text-amber-400 drop-shadow-[0_2px_0_#92400e]"
                style={{ textShadow: '0 4px 0 #92400e, 0 0 40px rgba(251,191,36,0.5)' }}
              >
                TACTICS
              </span>
            </h1>
          </div>

          {/* Subtitle banner */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-0.5 w-8 md:w-16 bg-gradient-to-r from-transparent to-amber-500/70" />
            <span className="text-[10px] md:text-xs tracking-[0.25em] text-amber-500/90 font-bold uppercase">
              Tactical Battle
            </span>
            <div className="h-0.5 w-8 md:w-16 bg-gradient-to-l from-transparent to-amber-500/70" />
          </div>

          {/* Version badge - GBA style panel */}
          <div className="flex justify-center">
            <div className="
              relative px-4 py-1.5
              bg-gradient-to-b from-slate-800 to-slate-900
              border-2 border-slate-600
              rounded-sm
              shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]
            ">
              <div className="absolute inset-[1px] border border-slate-700/50 rounded-sm pointer-events-none" />
              <span className="relative text-[9px] md:text-[10px] font-mono tracking-widest text-slate-400">
                v{VERSION} • ALPHA
              </span>
            </div>
          </div>
        </div>

        {/* Menu panel - GBA style */}
        <div className={`mt-8 md:mt-12 w-full max-w-sm transform transition-all duration-700 delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

          {/* GBA-style menu container */}
          <div className="
            relative
            bg-gradient-to-b from-amber-50 to-amber-100
            border-[3px] border-amber-900
            rounded-sm
            shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]
            overflow-hidden
          ">
            {/* Inner border */}
            <div className="absolute inset-[2px] border border-amber-300 rounded-sm pointer-events-none" />

            {/* Title bar */}
            <div className="
              bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700
              px-4 py-2
              border-b-2 border-amber-900
              flex items-center justify-center gap-2
            ">
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-amber-100 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
                Menú Principal
              </span>
              <Crown className="w-3.5 h-3.5 text-amber-200" />
            </div>

            {/* Menu items */}
            <div className="p-2 md:p-3 space-y-2">

              {/* Local Battle */}
              <MenuButton
                icon={<Swords className="w-5 h-5" />}
                label="Batalla Local"
                sublabel="2 jugadores • Mismo dispositivo"
                onClick={onStartGame}
                variant="blue"
                delay={0}
              />

              {/* Multiplayer */}
              {onMultiplayer && (
                <MenuButton
                  icon={<Users className="w-5 h-5" />}
                  label="Multijugador"
                  sublabel="Online • Crear o unirse"
                  onClick={onMultiplayer}
                  variant="green"
                  delay={1}
                />
              )}

              {/* How to Play */}
              <MenuButton
                icon={<BookOpen className="w-5 h-5" />}
                label="Cómo Jugar"
                sublabel="Reglas y mecánicas"
                onClick={onHowToPlay}
                variant="default"
                delay={2}
              />
            </div>
          </div>
        </div>

        {/* Feature badges */}
        <div className={`mt-8 flex flex-wrap justify-center gap-3 md:gap-4 transform transition-all duration-700 delay-400 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {[
            { icon: Zap, label: '17 Tipos', color: 'text-yellow-500 border-yellow-500/30' },
            { icon: Target, label: 'Fog of War', color: 'text-purple-400 border-purple-400/30' },
            { icon: Shield, label: 'Evolución', color: 'text-emerald-400 border-emerald-400/30' },
          ].map(({ icon: Icon, label, color }, i) => (
            <div
              key={label}
              className={`
                flex items-center gap-2 px-3 py-1.5
                bg-slate-900/80 backdrop-blur-sm
                border rounded-full
                ${color}
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`absolute bottom-4 left-0 right-0 text-center transform transition-all duration-700 delay-600 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
            <p className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase font-medium">
              Selecciona una opción
            </p>
            <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes stripes-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 120px 0; }
        }

        .border-3 {
          border-width: 3px;
        }

        @keyframes menu-button-enter {
          0% {
            opacity: 0;
            transform: translateX(-12px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-menu-button {
          opacity: 0;
          animation: menu-button-enter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
  variant: 'blue' | 'green' | 'default';
  delay: number;
}

function MenuButton({ icon, label, sublabel, onClick, variant, delay }: MenuButtonProps) {
  const variantStyles = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border-blue-400 shadow-blue-500/30',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border-emerald-400 shadow-emerald-500/30',
    default: 'bg-gradient-to-r from-slate-200 to-slate-100 hover:from-slate-100 hover:to-white text-slate-800 border-slate-300 shadow-slate-500/20'
  };

  const iconBgStyles = {
    blue: 'bg-blue-400/30',
    green: 'bg-emerald-400/30',
    default: 'bg-slate-400/20'
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full overflow-hidden
        flex items-center gap-3
        px-4 py-3 md:py-4
        rounded-sm
        border-2
        shadow-[3px_3px_0_0_rgba(0,0,0,0.2)]
        transition-all duration-150
        hover:shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none
        active:translate-x-[3px] active:translate-y-[3px]
        animate-menu-button
        ${variantStyles[variant]}
      `}
      style={{ animationDelay: `${delay * 80 + 300}ms` }}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />

      {/* Icon */}
      <div className={`relative p-2 rounded-lg ${iconBgStyles[variant]}`}>
        {icon}
      </div>

      {/* Text */}
      <div className="relative flex-1 text-left">
        <div className="font-bold text-sm md:text-base tracking-wide uppercase">
          {label}
        </div>
        <div className={`text-[10px] md:text-xs ${variant === 'default' ? 'text-slate-500' : 'opacity-80'}`}>
          {sublabel}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="relative w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
  );
}
