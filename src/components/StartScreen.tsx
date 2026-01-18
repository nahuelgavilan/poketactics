import { useState, useEffect, useMemo } from 'react';
import { Swords, Users, BookOpen, ChevronRight, Gamepad2, Shuffle, ArrowLeft, Zap } from 'lucide-react';
import { useSFX } from '../hooks/useSFX';
import { VERSION } from '../constants/version';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: (mode: 'quick' | 'draft') => void;
  onDraft?: () => void;
}

// Featured Pokemon with team colors
const TEAM_POKEMON = {
  blue: [
    { id: 25, name: 'Pikachu', glow: '#FACC15' },
    { id: 149, name: 'Dragonite', glow: '#FB923C' },
    { id: 448, name: 'Lucario', glow: '#60A5FA' },
  ],
  red: [
    { id: 6, name: 'Charizard', glow: '#F97316' },
    { id: 94, name: 'Gengar', glow: '#A855F7' },
    { id: 130, name: 'Gyarados', glow: '#3B82F6' },
  ],
};

// Generate sparkle particles
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

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer, onDraft }: StartScreenProps) {
  // Animation phases
  const [phase, setPhase] = useState<'boot' | 'logo' | 'title' | 'menu'>('boot');
  const [titleLetters, setTitleLetters] = useState(0);
  const [activePokemon, setActivePokemon] = useState({ blue: 0, red: 0 });
  const [showPressStart, setShowPressStart] = useState(false);
  const [submenu, setSubmenu] = useState<'main' | 'local' | 'online'>('main');

  const { playSFX } = useSFX();
  const sparkles = useMemo(() => generateSparkles(30), []);

  // Wrapped handlers with SFX
  const handleStartWithSFX = () => {
    playSFX('button_click', 0.5);
    onStartGame();
  };

  const handleHowToPlayWithSFX = () => {
    playSFX('button_click', 0.5);
    onHowToPlay();
  };

  const handleMultiplayerQuickWithSFX = () => {
    playSFX('button_click', 0.5);
    onMultiplayer?.('quick');
  };

  const handleMultiplayerDraftWithSFX = () => {
    playSFX('button_click', 0.5);
    onMultiplayer?.('draft');
  };

  const handleDraftWithSFX = () => {
    playSFX('button_click', 0.5);
    onDraft?.();
  };

  const handleSubmenuToggle = (target: 'main' | 'local' | 'online') => {
    playSFX('button_click', 0.4);
    setSubmenu(target);
  };

  // Boot sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Boot screen (brief)
    timers.push(setTimeout(() => setPhase('logo'), 400));

    // Phase 2: Logo reveal
    timers.push(setTimeout(() => setPhase('title'), 1200));

    // Phase 3: Title letter animation
    timers.push(setTimeout(() => {
      const titleText = 'POKÉTACTICS';
      let letter = 0;
      const letterInterval = setInterval(() => {
        letter++;
        setTitleLetters(letter);
        if (letter >= titleText.length) {
          clearInterval(letterInterval);
          // Show "Press Start" after title completes
          setTimeout(() => setShowPressStart(true), 400);
        }
      }, 80);
    }, 1400));

    // Pokemon rotation
    const pokemonInterval = setInterval(() => {
      setActivePokemon(prev => ({
        blue: (prev.blue + 1) % TEAM_POKEMON.blue.length,
        red: (prev.red + 1) % TEAM_POKEMON.red.length,
      }));
    }, 3500);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(pokemonInterval);
    };
  }, []);

  const handleStart = () => {
    if (showPressStart && phase !== 'menu') {
      setPhase('menu');
    }
  };

  const titleText = 'POKÉTACTICS';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none cursor-pointer"
      onClick={handleStart}
      onKeyDown={(e) => e.key === 'Enter' && handleStart()}
      tabIndex={0}
    >
      {/* === DEEP BACKGROUND === */}
      <div className="absolute inset-0 bg-[#030305]" />

      {/* Diagonal team split - appears after boot */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${phase !== 'boot' ? 'opacity-100' : 'opacity-0'}`}>
        {/* Blue team side */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/40 to-transparent"
          style={{ clipPath: 'polygon(0 0, 55% 0, 35% 100%, 0 100%)' }}
        />
        {/* Red team side */}
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-950/80 via-red-900/40 to-transparent"
          style={{ clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 65% 100%)' }}
        />
        {/* Center clash line */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(135deg, transparent 47%, rgba(251,191,36,0.3) 49%, rgba(251,191,36,0.5) 50%, rgba(251,191,36,0.3) 51%, transparent 53%)',
          }}
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />

      {/* Floating sparkles */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${phase !== 'boot' ? 'opacity-100' : 'opacity-0'}`}>
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

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }}
      />

      {/* === BOOT SCREEN === */}
      {phase === 'boot' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center animate-pulse">
            <Gamepad2 className="w-16 h-16 text-amber-500 mx-auto mb-4" strokeWidth={1.5} />
            <div
              className="text-[10px] tracking-[0.3em] text-amber-600/80 uppercase"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Loading...
            </div>
          </div>
        </div>
      )}

      {/* === POKEMON SHOWCASES (only when menu is open) === */}
      {phase === 'menu' && (
        <>
          {/* Blue team Pokemon - left side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full pointer-events-none">
            {TEAM_POKEMON.blue.map((pokemon, i) => (
              <div
                key={pokemon.id}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
                  i === activePokemon.blue ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              >
                {/* Glow */}
                <div
                  className="absolute inset-0 blur-3xl scale-150 animate-pulse"
                  style={{ background: `radial-gradient(circle, ${pokemon.glow}50 0%, transparent 70%)` }}
                />
                {/* Sprite */}
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                  alt=""
                  className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain scale-x-[-1] animate-pokemon-idle drop-shadow-2xl"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Name tag */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span
                    className="text-[8px] md:text-[10px] font-bold text-blue-400 uppercase tracking-wider"
                    style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                  >
                    {pokemon.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Red team Pokemon - right side */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full pointer-events-none">
            {TEAM_POKEMON.red.map((pokemon, i) => (
              <div
                key={pokemon.id}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
                  i === activePokemon.red ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              >
                {/* Glow */}
                <div
                  className="absolute inset-0 blur-3xl scale-150 animate-pulse"
                  style={{ background: `radial-gradient(circle, ${pokemon.glow}50 0%, transparent 70%)`, animationDelay: '0.5s' }}
                />
                {/* Sprite */}
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                  alt=""
                  className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain animate-pokemon-idle drop-shadow-2xl"
                  style={{ imageRendering: 'pixelated', animationDelay: '0.3s' }}
                />
                {/* Name tag */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span
                    className="text-[8px] md:text-[10px] font-bold text-red-400 uppercase tracking-wider"
                    style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                  >
                    {pokemon.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">

        {/* Logo + Title container */}
        <div className={`transform transition-all duration-700 ease-out ${
          phase === 'menu' ? '-translate-y-16 md:-translate-y-20' : 'translate-y-0'
        }`}>

          {/* Emblem/Logo */}
          <div className={`flex justify-center mb-6 transition-all duration-700 ${
            phase === 'boot' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          }`}>
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-8 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />

              {/* Main emblem */}
              <div className={`relative transition-all duration-500 ${phase === 'menu' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-20 h-20 md:w-28 md:h-28'}`}>
                {/* Diamond shape */}
                <div className="absolute inset-0 rotate-45 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-2xl" />
                <div className="absolute inset-1.5 rotate-45 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500" />
                <div className="absolute inset-3 rotate-45 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 shadow-inner" />

                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className={`text-amber-100 drop-shadow-lg transition-all duration-500 ${phase === 'menu' ? 'w-8 h-8 md:w-10 md:h-10' : 'w-10 h-10 md:w-14 md:h-14'}`} strokeWidth={1.5} />
                </div>

                {/* Shine */}
                <div className="absolute inset-3 rotate-45 rounded-lg bg-gradient-to-br from-white/40 via-transparent to-transparent" />
              </div>

              {/* Corner decorations */}
              <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500/50" />
              <div className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500/50" />
              <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500/50" />
              <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500/50" />
            </div>
          </div>

          {/* Title - Letter by letter animation */}
          <div className={`text-center transition-all duration-500 ${phase === 'boot' ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="relative mb-4">
              {/* Shadow layer */}
              <div
                className="absolute inset-0 text-black/60"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
                  transform: 'translate(4px, 4px)',
                }}
                aria-hidden="true"
              >
                {titleText.slice(0, titleLetters)}
              </div>

              {/* Main title */}
              <div
                className="relative"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(1.5rem, 5vw, 3.5rem)' }}
              >
                {titleText.split('').map((letter, i) => {
                  const isPoké = i < 4;
                  const isVisible = i < titleLetters;
                  return (
                    <span
                      key={i}
                      className={`inline-block transition-all duration-200 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                      }`}
                      style={{
                        color: isPoké ? '#93C5FD' : '#FCD34D',
                        textShadow: isPoké
                          ? '0 0 30px rgba(147,197,253,0.6), 0 0 60px rgba(59,130,246,0.4)'
                          : '0 0 30px rgba(252,211,77,0.6), 0 0 60px rgba(251,146,60,0.4)',
                        animationDelay: `${i * 0.08}s`,
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </h1>

            {/* Subtitle */}
            <div className={`flex items-center justify-center gap-3 transition-all duration-500 ${
              titleLetters >= titleText.length ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-amber-500/60" />
              <span
                className="text-[8px] md:text-[10px] tracking-[0.25em] text-amber-400/90 uppercase"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                Tactical Battle
              </span>
              <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent via-amber-500/60 to-amber-500/60" />
            </div>
          </div>
        </div>

        {/* Press Start / Menu area */}
        <div className={`mt-12 w-full max-w-sm transition-all duration-500 ${showPressStart ? 'opacity-100' : 'opacity-0'}`}>

          {/* Press Start button - hidden when menu opens */}
          <div className={`transform transition-all duration-400 ${phase === 'menu' ? 'opacity-0 scale-90 h-0 overflow-hidden' : 'opacity-100 scale-100'}`}>
            <button
              onClick={handleStart}
              className="group relative w-full py-6 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-3 px-6 py-3 rounded-full border-2 border-amber-500/50 bg-amber-500/10 backdrop-blur-sm group-hover:border-amber-400 group-hover:bg-amber-500/20 transition-all animate-pulse-slow">
                <span
                  className="text-xs md:text-sm font-bold tracking-[0.2em] text-amber-400 uppercase"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  PRESS START
                </span>
              </div>
              <span className="text-[8px] text-slate-600 tracking-widest uppercase mt-2">
                Click or press Enter
              </span>
            </button>
          </div>

          {/* Menu panel - appears when menu opens */}
          <div className={`transform transition-all duration-500 ${phase === 'menu' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
            {/* GBA-style menu frame */}
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-2 bg-gradient-to-b from-amber-500/20 to-amber-900/20 rounded-xl blur-xl" />

              {/* Menu container */}
              <div
                className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-md rounded-xl overflow-hidden"
                style={{
                  border: '4px solid',
                  borderColor: '#78350F #451A03 #451A03 #78350F',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 40px rgba(251,191,36,0.15)',
                }}
              >
                {/* Top shine */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

                {/* Menu header */}
                <div className="px-4 py-3 border-b-2 border-amber-900/30 bg-gradient-to-r from-amber-900/20 via-amber-800/30 to-amber-900/20">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] text-amber-400/90 uppercase"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {submenu === 'main' ? 'Select Mode' : submenu === 'local' ? 'Batalla Local' : 'Multijugador'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                </div>

                {/* Menu buttons */}
                <div className="p-3 space-y-2">
                  {submenu === 'main' ? (
                    <>
                      {/* Main menu */}
                      <MenuButton
                        icon={<Swords className="w-5 h-5" />}
                        label="Batalla Local"
                        sublabel="2 jugadores • Hot Seat"
                        onClick={(e) => { e.stopPropagation(); handleSubmenuToggle('local'); }}
                        color="blue"
                        delay={0}
                      />

                      {onMultiplayer && (
                        <MenuButton
                          icon={<Users className="w-5 h-5" />}
                          label="Multijugador"
                          sublabel="Online • Crear o unirse"
                          onClick={(e) => { e.stopPropagation(); handleSubmenuToggle('online'); }}
                          color="green"
                          delay={1}
                        />
                      )}

                      <MenuButton
                        icon={<BookOpen className="w-5 h-5" />}
                        label="Cómo Jugar"
                        sublabel="Tutorial y mecánicas"
                        onClick={(e) => { e.stopPropagation(); handleHowToPlayWithSFX(); }}
                        color="amber"
                        delay={2}
                      />
                    </>
                  ) : submenu === 'local' ? (
                    <>
                      {/* Local battle submenu */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSubmenuToggle('main'); }}
                        className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver</span>
                      </button>

                      <MenuButton
                        icon={<Zap className="w-5 h-5" />}
                        label="Batalla Rápida"
                        sublabel="Equipos aleatorios"
                        onClick={(e) => { e.stopPropagation(); handleStartWithSFX(); }}
                        color="blue"
                        delay={0}
                      />

                      {onDraft && (
                        <MenuButton
                          icon={<Shuffle className="w-5 h-5" />}
                          label="Draft Mode"
                          sublabel="Ban & Pick • Competitivo"
                          onClick={(e) => { e.stopPropagation(); handleDraftWithSFX(); }}
                          color="purple"
                          delay={1}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Online multiplayer submenu */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSubmenuToggle('main'); }}
                        className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver</span>
                      </button>

                      <MenuButton
                        icon={<Zap className="w-5 h-5" />}
                        label="Batalla Rápida"
                        sublabel="Equipos aleatorios • Online"
                        onClick={(e) => { e.stopPropagation(); handleMultiplayerQuickWithSFX(); }}
                        color="green"
                        delay={0}
                      />

                      <MenuButton
                        icon={<Shuffle className="w-5 h-5" />}
                        label="Draft Mode"
                        sublabel="Ban & Pick • Online"
                        onClick={(e) => { e.stopPropagation(); handleMultiplayerDraftWithSFX(); }}
                        color="purple"
                        delay={1}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version badge - always visible after boot */}
        <div className={`absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 transition-all duration-700 ${
          phase !== 'boot' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
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

      {/* Corner decorations - only when menu is open */}
      {phase === 'menu' && (
        <>
          <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-amber-600/40 animate-fade-in" />
          <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-amber-600/40 animate-fade-in" />
          <div className="absolute bottom-16 left-4 w-10 h-10 border-b-2 border-l-2 border-amber-600/40 animate-fade-in" />
          <div className="absolute bottom-16 right-4 w-10 h-10 border-b-2 border-r-2 border-amber-600/40 animate-fade-in" />
        </>
      )}

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

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @keyframes menu-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-menu-pop {
          animation: menu-pop 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Menu button component with GBA styling
interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: (e: React.MouseEvent) => void;
  color: 'blue' | 'green' | 'amber' | 'purple';
  delay: number;
}

function MenuButton({ icon, label, sublabel, onClick, color, delay }: MenuButtonProps) {
  const colors = {
    blue: {
      bg: 'from-blue-600 to-blue-700',
      hover: 'hover:from-blue-500 hover:to-blue-600',
      border: 'border-blue-400/40',
      glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
      icon: 'bg-blue-500/30',
    },
    green: {
      bg: 'from-emerald-600 to-emerald-700',
      hover: 'hover:from-emerald-500 hover:to-emerald-600',
      border: 'border-emerald-400/40',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]',
      icon: 'bg-emerald-500/30',
    },
    amber: {
      bg: 'from-amber-600 to-amber-700',
      hover: 'hover:from-amber-500 hover:to-amber-600',
      border: 'border-amber-400/40',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      icon: 'bg-amber-500/30',
    },
    purple: {
      bg: 'from-purple-600 to-purple-700',
      hover: 'hover:from-purple-500 hover:to-purple-600',
      border: 'border-purple-400/40',
      glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
      icon: 'bg-purple-500/30',
    },
  };

  const c = colors[color];

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full animate-menu-pop
        transition-all duration-200 ${c.glow}
      `}
      style={{ animationDelay: `${delay * 100 + 100}ms` }}
    >
      <div className={`
        flex items-center gap-3 px-4 py-3
        bg-gradient-to-r ${c.bg} ${c.hover}
        rounded-lg border ${c.border}
        transition-all duration-150
        group-active:scale-[0.98]
      `}>
        <div className={`p-2 rounded-lg ${c.icon}`}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div
            className="text-sm font-bold text-white"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            {label}
          </div>
          <div className="text-[9px] text-white/60 mt-0.5">{sublabel}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
