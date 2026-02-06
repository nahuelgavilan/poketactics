import { useState, useEffect, useMemo, useCallback } from 'react';
import { Swords, BookOpen, Wifi } from 'lucide-react';
import { useSFX } from '../hooks/useSFX';
import { VERSION } from '../constants/version';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: (mode: 'quick' | 'draft') => void;
  onDraft?: () => void;
}

// Pokemon VS pairs that rotate
const VS_PAIRS = [
  { left: { id: 6, name: 'Charizard' }, right: { id: 9, name: 'Blastoise' } },
  { left: { id: 3, name: 'Venusaur' }, right: { id: 25, name: 'Pikachu' } },
  { left: { id: 448, name: 'Lucario' }, right: { id: 94, name: 'Gengar' } },
];

const SPRITE_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;

// Generate sparkle/particle data
function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    color: Math.random() > 0.5 ? '#3B82F6' : '#EF4444',
  }));
}

// Generate orbiting particles for the energy beam
function generateOrbitParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    offset: (i / count) * 360,
    speed: 2 + Math.random() * 2,
    radius: 8 + Math.random() * 16,
    size: 2 + Math.random() * 3,
    color: i % 2 === 0 ? '#60A5FA' : '#F87171',
  }));
}

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer, onDraft }: StartScreenProps) {
  const [phase, setPhase] = useState<'boot' | 'ready'>('boot');
  const [activePair, setActivePair] = useState(0);
  const [onlineMode, setOnlineMode] = useState<'quick' | 'draft'>('quick');

  const { playSFX } = useSFX();
  const sparkles = useMemo(() => generateSparkles(25), []);
  const orbitParticles = useMemo(() => generateOrbitParticles(12), []);

  // SFX-wrapped handlers
  const handleStartWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onStartGame();
  }, [playSFX, onStartGame]);

  const handleHowToPlayWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onHowToPlay();
  }, [playSFX, onHowToPlay]);

  const handleDraftWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onDraft?.();
  }, [playSFX, onDraft]);

  const handleOnlineWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onMultiplayer?.(onlineMode);
  }, [playSFX, onMultiplayer, onlineMode]);

  const toggleOnlineMode = useCallback(() => {
    playSFX('button_click', 0.4);
    setOnlineMode(prev => (prev === 'quick' ? 'draft' : 'quick'));
  }, [playSFX]);

  // Boot sequence: boot (800ms) → ready
  useEffect(() => {
    const timer = setTimeout(() => setPhase('ready'), 800);
    return () => clearTimeout(timer);
  }, []);

  // Pokemon pair rotation every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePair(prev => (prev + 1) % VS_PAIRS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Deep background */}
      <div className="absolute inset-0 bg-[#030305]" />

      {/* === BOOT SCREEN === */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black z-50 transition-opacity duration-500 ${
          phase === 'boot' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center animate-pulse">
          <Swords className="w-12 h-12 text-amber-500 mx-auto mb-3" strokeWidth={1.5} />
          <div
            className="text-[9px] tracking-[0.3em] text-amber-600/80 uppercase"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Loading...
          </div>
        </div>
      </div>

      {/* === READY STATE — everything fades in together === */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          phase === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Background gradients */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-transparent to-transparent"
            style={{ clipPath: 'polygon(0 0, 55% 0, 35% 100%, 0 100%)' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-tl from-red-950/60 via-transparent to-transparent"
            style={{ clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 65% 100%)' }}
          />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />

        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {sparkles.map(s => (
            <div
              key={s.id}
              className="absolute rounded-full animate-sparkle"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }}
        />

        {/* === LAYOUT === */}
        <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-6">

          {/* TOP: Compact logo + title */}
          <div className="flex-shrink-0 mt-4 md:mt-6 mb-2 animate-fade-in-down">
            <div className="flex items-center justify-center gap-3">
              {/* Small emblem */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                <div className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg" />
                <div className="absolute inset-1 rotate-45 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 shadow-inner" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className="w-5 h-5 md:w-6 md:h-6 text-amber-100 drop-shadow" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-1 rotate-45 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              </div>

              {/* Title text */}
              <div>
                <h1
                  className="text-lg md:text-2xl leading-none"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    background: 'linear-gradient(135deg, #93C5FD 0%, #93C5FD 35%, #FCD34D 36%, #FCD34D 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(147,197,253,0.4))',
                  }}
                >
                  POKÉTACTICS
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                  <span
                    className="text-[7px] md:text-[8px] tracking-[0.2em] text-amber-400/80 uppercase"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Tactical Battle
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Pokemon VS battle scene */}
          <div className="flex-1 flex items-center justify-center w-full max-w-lg animate-fade-in">
            <div className="relative w-full" style={{ aspectRatio: '16/10' }}>

              {/* Battle platform — perspective grid */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[35%] overflow-hidden">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.15) 50%, rgba(239,68,68,0.15) 100%)',
                    maskImage: 'linear-gradient(180deg, transparent, black)',
                    WebkitMaskImage: 'linear-gradient(180deg, transparent, black)',
                  }}
                />
                {/* Grid lines */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                      linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20% 25%',
                    transform: 'perspective(300px) rotateX(50deg)',
                    transformOrigin: 'bottom center',
                  }}
                />
              </div>

              {/* Ambient glow under pokemon */}
              <div className="absolute bottom-[20%] left-[15%] w-24 h-8 md:w-32 md:h-10 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-[20%] right-[15%] w-24 h-8 md:w-32 md:h-10 bg-red-500/20 rounded-full blur-xl animate-pulse" />

              {/* Energy beam between Pokemon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/60 via-white/40 to-red-400/60 rounded-full blur-sm animate-energy-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300/40 via-white/20 to-red-300/40 rounded-full blur-md scale-y-[3] animate-energy-pulse" style={{ animationDelay: '0.5s' }} />
              </div>

              {/* Orbiting particles around the beam center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
                {orbitParticles.map(p => (
                  <div
                    key={p.id}
                    className="absolute rounded-full animate-orbit"
                    style={{
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                      '--orbit-radius': `${p.radius}px`,
                      '--orbit-offset': `${p.offset}deg`,
                      animationDuration: `${p.speed}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>

              {/* VS text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <span
                  className="text-2xl md:text-4xl font-bold text-amber-400 animate-vs-pulse"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    textShadow: '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3), 3px 3px 0 #000',
                  }}
                >
                  VS
                </span>
              </div>

              {/* Left Pokemon (blue team) */}
              <div className="absolute left-[5%] md:left-[10%] bottom-[18%] w-[35%]">
                {VS_PAIRS.map((pair, i) => (
                  <div
                    key={pair.left.id}
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700 ${
                      i === activePair ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}
                  >
                    <div className="absolute inset-0 blur-2xl scale-150 bg-blue-500/20 animate-pulse" />
                    <img
                      src={SPRITE_URL(pair.left.id)}
                      alt={pair.left.name}
                      className="relative w-24 h-24 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain scale-x-[-1] animate-pokemon-idle drop-shadow-2xl"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span
                        className="text-[7px] md:text-[9px] font-bold text-blue-400 uppercase tracking-wider"
                        style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                      >
                        {pair.left.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Pokemon (red team) */}
              <div className="absolute right-[5%] md:right-[10%] bottom-[18%] w-[35%]">
                {VS_PAIRS.map((pair, i) => (
                  <div
                    key={pair.right.id}
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700 ${
                      i === activePair ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}
                  >
                    <div className="absolute inset-0 blur-2xl scale-150 bg-red-500/20 animate-pulse" />
                    <img
                      src={SPRITE_URL(pair.right.id)}
                      alt={pair.right.name}
                      className="relative w-24 h-24 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain animate-pokemon-idle drop-shadow-2xl"
                      style={{ imageRendering: 'pixelated', animationDelay: '0.3s' }}
                    />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span
                        className="text-[7px] md:text-[9px] font-bold text-red-400 uppercase tracking-wider"
                        style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                      >
                        {pair.right.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM: Action buttons */}
          <div className="flex-shrink-0 w-full max-w-md space-y-3 mb-4 animate-fade-in-up">

            {/* Primary: Batalla Rapida */}
            <button
              onClick={handleStartWithSFX}
              className="group relative w-full transition-all duration-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl border border-blue-400/40 transition-all duration-150">
                <Swords className="w-5 h-5 text-white" />
                <span
                  className="text-sm md:text-base font-bold text-white tracking-wide"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(11px, 2.5vw, 14px)' }}
                >
                  Batalla Rapida
                </span>
              </div>
            </button>

            {/* Secondary row: Draft + Online */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Draft Mode */}
              {onDraft && (
                <button
                  onClick={handleDraftWithSFX}
                  className="group relative w-full transition-all duration-200 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl border border-purple-400/40 transition-all duration-150">
                    <span
                      className="text-xs font-bold text-white"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                    >
                      Draft Mode
                    </span>
                  </div>
                </button>
              )}

              {/* Online */}
              {onMultiplayer && (
                <div className="relative">
                  <button
                    onClick={handleOnlineWithSFX}
                    className="group relative w-full transition-all duration-200 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-xl border border-emerald-400/40 transition-all duration-150">
                      <Wifi className="w-4 h-4 text-white" />
                      <span
                        className="text-xs font-bold text-white"
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                      >
                        Online
                      </span>
                    </div>
                  </button>
                  {/* Inline mode toggle */}
                  <button
                    onClick={toggleOnlineMode}
                    className="absolute -top-2 -right-2 md:top-auto md:-bottom-2 md:right-2 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wide uppercase transition-all duration-200 border"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                    title={`Mode: ${onlineMode === 'quick' ? 'Quick' : 'Draft'} — click to toggle`}
                  >
                    <span
                      className={`${
                        onlineMode === 'quick'
                          ? 'text-emerald-300 border-emerald-500/60 bg-emerald-900/80'
                          : 'text-purple-300 border-purple-500/60 bg-purple-900/80'
                      } px-1`}
                    >
                      {onlineMode === 'quick' ? 'Quick' : 'Draft'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Tertiary: Como Jugar */}
            <button
              onClick={handleHowToPlayWithSFX}
              className="group w-full flex items-center justify-center gap-2 py-2 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              <span
                className="text-[9px] md:text-[10px] text-slate-500 group-hover:text-slate-300 uppercase tracking-[0.15em] transition-colors"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                Como Jugar
              </span>
            </button>
          </div>

          {/* Version badge */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span
                className="text-[9px] font-bold tracking-wider text-slate-400 uppercase"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                v{VERSION}
              </span>
              <span className="text-[8px] text-slate-600">ALPHA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
        .animate-sparkle {
          animation: sparkle ease-in-out infinite;
        }

        @keyframes pokemon-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-pokemon-idle {
          animation: pokemon-idle 2.5s ease-in-out infinite;
        }

        @keyframes energy-pulse {
          0%, 100% { opacity: 0.5; transform: scaleX(0.95); }
          50% { opacity: 1; transform: scaleX(1.05); }
        }
        .animate-energy-pulse {
          animation: energy-pulse 2s ease-in-out infinite;
        }

        @keyframes orbit {
          0% { transform: rotate(var(--orbit-offset, 0deg)) translateX(var(--orbit-radius, 20px)) rotate(calc(-1 * var(--orbit-offset, 0deg))); }
          100% { transform: rotate(calc(var(--orbit-offset, 0deg) + 360deg)) translateX(var(--orbit-radius, 20px)) rotate(calc(-1 * (var(--orbit-offset, 0deg) + 360deg))); }
        }
        .animate-orbit {
          animation: orbit linear infinite;
        }

        @keyframes vs-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-vs-pulse {
          animation: vs-pulse 2s ease-in-out infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }

        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
          animation-delay: 0.1s;
          opacity: 0;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
