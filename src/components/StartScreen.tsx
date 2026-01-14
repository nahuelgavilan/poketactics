import { useState, useEffect } from 'react';
import { Swords, Users, BookOpen, ChevronRight, Shield, Sparkles, Play } from 'lucide-react';
import { VERSION } from '../constants/version';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: () => void;
}

const FEATURED_POKEMON = [
  { id: 6, name: 'Charizard', glow: 'rgba(251,146,60,0.6)' },
  { id: 25, name: 'Pikachu', glow: 'rgba(250,204,21,0.6)' },
  { id: 149, name: 'Dragonite', glow: 'rgba(251,146,60,0.5)' },
  { id: 94, name: 'Gengar', glow: 'rgba(168,85,247,0.6)' },
  { id: 130, name: 'Gyarados', glow: 'rgba(59,130,246,0.6)' },
  { id: 448, name: 'Lucario', glow: 'rgba(96,165,250,0.5)' },
];

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer }: StartScreenProps) {
  const [introStep, setIntroStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePokemon, setActivePokemon] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    // Particles
    setParticles(Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 2 + 1
    })));

    // Intro sequence
    const t1 = setTimeout(() => setIntroStep(1), 300);
    const t2 = setTimeout(() => setIntroStep(2), 1000);
    const t3 = setTimeout(() => setIntroStep(3), 1600);

    // Pokemon rotation
    const interval = setInterval(() => {
      setActivePokemon(p => (p + 1) % FEATURED_POKEMON.length);
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, []);

  const handleStart = () => {
    if (introStep >= 3 && !menuOpen) {
      setMenuOpen(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none"
      onClick={handleStart}
      onKeyDown={(e) => e.key === 'Enter' && handleStart()}
      tabIndex={0}
    >
      {/* === BACKGROUND === */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* Team colors - appear when menu opens */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-transparent"
          style={{ clipPath: 'polygon(0 0, 60% 0, 30% 100%, 0 100%)' }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-900/30 via-transparent to-transparent"
          style={{ clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 70% 100%)' }}
        />
      </div>

      {/* Center glow */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        menuOpen
          ? 'bg-[radial-gradient(ellipse_at_center,rgba(20,20,40,0.8)_0%,transparent_60%)]'
          : 'bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.06)_0%,transparent_40%)]'
      }`} />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)]" />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-amber-400/30 animate-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }}
      />

      {/* === POKEMON (only when menu is open) === */}
      {menuOpen && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full pointer-events-none">
            {FEATURED_POKEMON.map((pokemon, i) => (
              <div
                key={pokemon.id}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
                  i === activePokemon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              >
                <div
                  className="absolute inset-0 blur-3xl scale-150"
                  style={{ background: `radial-gradient(circle, ${pokemon.glow} 0%, transparent 70%)` }}
                />
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                  alt=""
                  className="relative w-32 h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 object-contain scale-x-[-1] animate-idle"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            ))}
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full pointer-events-none">
            {FEATURED_POKEMON.map((pokemon, i) => {
              const idx = (i + 3) % FEATURED_POKEMON.length;
              return (
                <div
                  key={`r-${pokemon.id}`}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
                    idx === activePokemon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                >
                  <div
                    className="absolute inset-0 blur-3xl scale-150"
                    style={{ background: `radial-gradient(circle, ${pokemon.glow} 0%, transparent 70%)` }}
                  />
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                    alt=""
                    className="relative w-32 h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 object-contain animate-idle"
                    style={{ imageRendering: 'pixelated', animationDelay: '0.5s' }}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">

        {/* Logo + Title - moves up when menu opens */}
        <div className={`transform transition-all duration-700 ease-out ${
          menuOpen ? '-translate-y-8 md:-translate-y-12' : 'translate-y-0'
        }`}>

          {/* Emblem */}
          <div className={`flex justify-center mb-6 transform transition-all duration-700 ${
            introStep >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-90'
          }`}>
            <div className="relative">
              <div className="absolute -inset-6 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
              <div className={`relative transition-all duration-500 ${menuOpen ? 'w-16 h-16 md:w-20 md:h-20' : 'w-24 h-24 md:w-32 md:h-32'}`}>
                <div className="absolute inset-0 rotate-45 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-2xl" />
                <div className="absolute inset-2 rotate-45 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500" />
                <div className="absolute inset-3 rotate-45 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-inner" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className={`text-amber-100 drop-shadow-lg transition-all duration-500 ${menuOpen ? 'w-8 h-8 md:w-10 md:h-10' : 'w-12 h-12 md:w-14 md:h-14'}`} strokeWidth={1.5} />
                </div>
                <div className="absolute inset-3 rotate-45 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className={`text-center transform transition-all duration-700 delay-100 ${
            introStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h1 className="relative mb-3">
              <span
                className="absolute inset-0 blur-lg text-amber-500/40"
                style={{ fontFamily: '"Press Start 2P", system-ui', fontSize: 'clamp(1.8rem, 6vw, 4rem)' }}
                aria-hidden="true"
              >
                POKÉTACTICS
              </span>
              <span
                className="absolute text-black/50"
                style={{ fontFamily: '"Press Start 2P", system-ui', fontSize: 'clamp(1.8rem, 6vw, 4rem)', transform: 'translate(3px, 3px)' }}
                aria-hidden="true"
              >
                POKÉTACTICS
              </span>
              <span className="relative" style={{ fontFamily: '"Press Start 2P", system-ui', fontSize: 'clamp(1.8rem, 6vw, 4rem)' }}>
                <span className="bg-gradient-to-b from-white via-blue-100 to-blue-400 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.4))' }}>
                  POKÉ
                </span>
                <span className="bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.4))' }}>
                  TACTICS
                </span>
              </span>
            </h1>

            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-amber-500/60" />
              <span className="text-[10px] md:text-xs tracking-[0.3em] text-amber-400/80 font-semibold uppercase">
                Tactical Battle
              </span>
              <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-amber-500/60" />
            </div>
          </div>
        </div>

        {/* Press to Start / Menu */}
        <div className={`mt-10 w-full max-w-md transform transition-all duration-700 delay-200 ${
          introStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>

          {/* Press to Start button - hidden when menu is open */}
          <div className={`transform transition-all duration-500 ${menuOpen ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100 scale-100'}`}>
            <button
              onClick={handleStart}
              className="group relative w-full py-6 flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-3 px-8 py-3 rounded-full border-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm group-hover:border-amber-400 group-hover:bg-amber-500/10 transition-all">
                <Play className="w-5 h-5 text-amber-400 animate-pulse" fill="currentColor" />
                <span className="text-sm md:text-base font-bold tracking-[0.15em] text-amber-400 uppercase">
                  Toca para Jugar
                </span>
              </div>
              <span className="text-[9px] text-slate-600 tracking-widest uppercase">
                Click o pulsa Enter
              </span>
            </button>
          </div>

          {/* Menu options - appear when menuOpen */}
          <div className={`transform transition-all duration-500 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-b from-amber-500/15 to-amber-900/15 rounded-xl blur-lg" />

              <div className="relative bg-gradient-to-b from-[#18161390] to-[#0d0c0b90] backdrop-blur-md rounded-xl border border-amber-800/30 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

                <div className="px-5 py-2.5 border-b border-amber-900/20">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-600/60" />
                    <span className="text-[10px] font-bold tracking-[0.15em] text-amber-500/70 uppercase">
                      Menú
                    </span>
                    <Shield className="w-3.5 h-3.5 text-amber-600/60" />
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <MenuButton
                    icon={<Swords className="w-5 h-5" />}
                    label="Batalla Local"
                    sublabel="2 jugadores • Hot Seat"
                    onClick={(e) => { e.stopPropagation(); onStartGame(); }}
                    variant="blue"
                    delay={0}
                    show={menuOpen}
                  />

                  {onMultiplayer && (
                    <MenuButton
                      icon={<Users className="w-5 h-5" />}
                      label="Multijugador"
                      sublabel="Online • Crear o unirse"
                      onClick={(e) => { e.stopPropagation(); onMultiplayer(); }}
                      variant="green"
                      delay={1}
                      show={menuOpen}
                    />
                  )}

                  <MenuButton
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Cómo Jugar"
                    sublabel="Tutorial y mecánicas"
                    onClick={(e) => { e.stopPropagation(); onHowToPlay(); }}
                    variant="gray"
                    delay={2}
                    show={menuOpen}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className={`absolute bottom-6 transition-all duration-500 ${introStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[9px] font-mono tracking-widest text-slate-700">
            v{VERSION} ALPHA
          </span>
        </div>
      </div>

      {/* Corner decorations - only when menu is open */}
      {menuOpen && (
        <>
          <Corner position="top-left" />
          <Corner position="top-right" />
          <Corner position="bottom-left" />
          <Corner position="bottom-right" />
        </>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(-25px); opacity: 0.5; }
        }
        .animate-float { animation: float 7s ease-in-out infinite; }

        @keyframes idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-idle { animation: idle 2.5s ease-in-out infinite; }

        @keyframes menu-item {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-menu-item { animation: menu-item 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}

function Corner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positions = {
    'top-left': 'top-5 left-5',
    'top-right': 'top-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'bottom-right': 'bottom-5 right-5'
  };

  const borders = {
    'top-left': 'border-t-2 border-l-2',
    'top-right': 'border-t-2 border-r-2',
    'bottom-left': 'border-b-2 border-l-2',
    'bottom-right': 'border-b-2 border-r-2'
  };

  return (
    <div className={`absolute ${positions[position]} w-12 h-12 ${borders[position]} border-amber-600/30 animate-fade-in`} />
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: (e: React.MouseEvent) => void;
  variant: 'blue' | 'green' | 'gray';
  delay: number;
  show: boolean;
}

function MenuButton({ icon, label, sublabel, onClick, variant, delay, show }: MenuButtonProps) {
  const styles = {
    blue: {
      bg: 'from-blue-600 to-blue-700',
      hover: 'hover:from-blue-500 hover:to-blue-600',
      border: 'border-blue-500/40',
      glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]'
    },
    green: {
      bg: 'from-emerald-600 to-emerald-700',
      hover: 'hover:from-emerald-500 hover:to-emerald-600',
      border: 'border-emerald-500/40',
      glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
    },
    gray: {
      bg: 'from-slate-600 to-slate-700',
      hover: 'hover:from-slate-500 hover:to-slate-600',
      border: 'border-slate-500/40',
      glow: 'hover:shadow-[0_0_15px_rgba(100,116,139,0.15)]'
    }
  };

  const s = styles[variant];

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full
        ${show ? 'animate-menu-item' : 'opacity-0'}
        transition-shadow duration-200 ${s.glow}
      `}
      style={{ animationDelay: `${delay * 80 + 100}ms` }}
    >
      <div className={`
        flex items-center gap-3 px-4 py-3
        bg-gradient-to-r ${s.bg} ${s.hover}
        rounded-lg border ${s.border}
        transition-all duration-150
        group-active:scale-[0.98]
      `}>
        <div className="p-2 rounded-md bg-white/10">
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-sm text-white">{label}</div>
          <div className="text-[10px] text-white/60">{sublabel}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
