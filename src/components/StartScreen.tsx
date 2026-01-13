import React, { useState, useEffect } from 'react';
import { Swords, Zap, Users, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { VERSION } from '../constants/version';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: () => void;
}

// Featured Pokemon IDs for the animated background
const FEATURED_POKEMON = [6, 9, 3, 25, 94, 149, 130, 65, 448, 376];

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer }: StartScreenProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [titleGlitch, setTitleGlitch] = useState(false);

  useEffect(() => {
    // Staggered entrance animation
    const timer = setTimeout(() => setShowContent(true), 300);

    // Random glitch effect on title
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setTitleGlitch(true);
        setTimeout(() => setTitleGlitch(false), 150);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Animated orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />

      {/* Floating Pokemon silhouettes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FEATURED_POKEMON.map((id, i) => (
          <div
            key={id}
            className="absolute opacity-[0.08] grayscale"
            style={{
              left: `${10 + (i % 5) * 20}%`,
              top: `${15 + Math.floor(i / 5) * 50}%`,
              animation: `float ${6 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`}
              alt=""
              className="w-16 h-16 md:w-24 md:h-24 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        ))}
      </div>

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">

        {/* Logo section */}
        <div
          className={`transform transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}
        >
          {/* Decorative top element */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500/50" />
            <Sparkles className="w-4 h-4 text-yellow-500/70" />
            <span className="text-[10px] tracking-[0.3em] text-yellow-500/70 font-medium uppercase">Tactical Battle</span>
            <Sparkles className="w-4 h-4 text-yellow-500/70" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500/50" />
          </div>

          {/* Main title */}
          <div className="relative">
            <h1
              className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-center select-none ${titleGlitch ? 'translate-x-1' : ''}`}
              style={{
                fontFamily: '"Press Start 2P", system-ui, sans-serif',
                textShadow: titleGlitch
                  ? '-3px 0 #ff0040, 3px 0 #00ffff'
                  : '0 0 60px rgba(59, 130, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)'
              }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                POKÉ
              </span>
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
                TACTICS
              </span>
            </h1>

            {/* Subtitle */}
            <div className="flex items-center justify-center mt-4 gap-2">
              <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-emerald-500" />
              <span
                className="text-xs md:text-sm tracking-[0.15em] font-bold text-emerald-400"
                style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
              >
                TACTICAL BATTLE
              </span>
              <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-emerald-500" />
            </div>
          </div>

          {/* Version badge */}
          <div className="flex justify-center mt-4">
            <span className="px-3 py-1 text-[10px] font-mono tracking-wider text-slate-500 border border-slate-800 rounded-full bg-slate-900/50">
              v{VERSION} • HOT SEAT
            </span>
          </div>
        </div>

        {/* Menu buttons */}
        <div
          className={`mt-12 md:mt-16 w-full max-w-md space-y-4 transform transition-all duration-1000 delay-300 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
          {/* Start Game button */}
          <button
            onClick={onStartGame}
            onMouseEnter={() => setHoveredButton('start')}
            onMouseLeave={() => setHoveredButton(null)}
            className="group relative w-full overflow-hidden"
          >
            <div className={`
              relative flex items-center justify-between px-6 py-5 md:py-6
              bg-gradient-to-r from-blue-600 to-blue-500
              rounded-2xl border-2 border-blue-400/50
              transform transition-all duration-300
              ${hoveredButton === 'start' ? 'scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.4)]' : 'shadow-[0_0_20px_rgba(59,130,246,0.2)]'}
            `}>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Swords className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-lg md:text-xl font-black text-white tracking-wide">BATALLA LOCAL</div>
                  <div className="text-xs text-blue-200/80">2 jugadores • Mismo dispositivo</div>
                </div>
              </div>

              <ChevronRight className={`w-6 h-6 text-white/70 transform transition-transform ${hoveredButton === 'start' ? 'translate-x-1' : ''}`} />
            </div>
          </button>

          {/* Multiplayer button */}
          {onMultiplayer && (
            <button
              onClick={onMultiplayer}
              onMouseEnter={() => setHoveredButton('multi')}
              onMouseLeave={() => setHoveredButton(null)}
              className="group relative w-full overflow-hidden"
            >
              <div className={`
                relative flex items-center justify-between px-6 py-5 md:py-6
                bg-gradient-to-r from-emerald-600 to-emerald-500
                rounded-2xl border-2 border-emerald-400/50
                transform transition-all duration-300
                ${hoveredButton === 'multi' ? 'scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'shadow-[0_0_20px_rgba(16,185,129,0.2)]'}
              `}>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg md:text-xl font-black text-white tracking-wide">MULTIJUGADOR</div>
                    <div className="text-xs text-emerald-200/80">Online • Crear o unirse</div>
                  </div>
                </div>

                <ChevronRight className={`w-6 h-6 text-white/70 transform transition-transform ${hoveredButton === 'multi' ? 'translate-x-1' : ''}`} />
              </div>
            </button>
          )}

          {/* How to Play button */}
          <button
            onClick={onHowToPlay}
            onMouseEnter={() => setHoveredButton('howto')}
            onMouseLeave={() => setHoveredButton(null)}
            className="group relative w-full overflow-hidden"
          >
            <div className={`
              relative flex items-center justify-between px-6 py-4 md:py-5
              bg-slate-800/80 backdrop-blur-sm
              rounded-2xl border border-slate-700
              transform transition-all duration-300
              ${hoveredButton === 'howto' ? 'scale-[1.02] border-slate-600 bg-slate-800' : ''}
            `}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-700/50 rounded-xl">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                </div>
                <div className="text-left">
                  <div className="text-base md:text-lg font-bold text-slate-200">Cómo Jugar</div>
                  <div className="text-xs text-slate-500">Reglas y mecánicas</div>
                </div>
              </div>

              <ChevronRight className={`w-5 h-5 text-slate-600 transform transition-transform ${hoveredButton === 'howto' ? 'translate-x-1 text-slate-500' : ''}`} />
            </div>
          </button>
        </div>

        {/* Feature highlights */}
        <div
          className={`mt-12 grid grid-cols-3 gap-4 md:gap-8 max-w-lg transform transition-all duration-1000 delay-500 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
          {[
            { icon: Zap, label: 'Tipos', desc: '17 tipos' },
            { icon: Users, label: 'Hot Seat', desc: '2 jugadores' },
            { icon: Sparkles, label: 'Captura', desc: 'Hierba alta' }
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <div className="inline-flex p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-2">
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-xs font-semibold text-slate-400">{label}</div>
              <div className="text-[10px] text-slate-600">{desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`absolute bottom-6 left-0 right-0 text-center transform transition-all duration-1000 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-[10px] text-slate-700 tracking-wider">
            TOCA CUALQUIER LUGAR PARA CONTINUAR
          </p>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }

        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
    </div>
  );
}
