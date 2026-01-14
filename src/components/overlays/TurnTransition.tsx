import { useEffect, useState } from 'react';
import { Shield, Swords, ChevronRight } from 'lucide-react';
import type { Player } from '../../types/game';

interface TurnTransitionProps {
  currentPlayer: Player;
  onConfirm: () => void;
}

/**
 * Fire Emblem / Advance Wars style turn transition
 * - Dramatic diagonal slash reveal
 * - Player emblem with tactical icons
 * - GBA-era bordered panel aesthetic
 * - Smooth animations matching game feel
 */
export function TurnTransition({ currentPlayer, onConfirm }: TurnTransitionProps) {
  const [phase, setPhase] = useState<'enter' | 'ready' | 'exit'>('enter');
  const [showButton, setShowButton] = useState(false);
  const nextPlayer = currentPlayer === 'P1' ? 'P2' : 'P1';
  const isBlue = nextPlayer === 'P1';

  useEffect(() => {
    // Entrance animation
    const enterTimer = setTimeout(() => {
      setPhase('ready');
      setShowButton(true);
    }, 600);

    return () => clearTimeout(enterTimer);
  }, []);

  const handleConfirm = () => {
    setPhase('exit');
    setTimeout(onConfirm, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Diagonal slash background - two triangles */}
      <div
        className={`
          absolute inset-0 transition-transform duration-500 ease-out
          ${phase === 'enter' ? '-translate-x-full' : phase === 'exit' ? 'translate-x-full' : 'translate-x-0'}
        `}
      >
        {/* Top triangle - dark */}
        <div
          className="absolute inset-0 bg-slate-950"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 60%)'
          }}
        />

        {/* Bottom triangle - player color */}
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-950' : 'bg-red-950'}`}
          style={{
            clipPath: 'polygon(0 60%, 100% 40%, 100% 100%, 0 100%)'
          }}
        />

        {/* Diagonal line accent */}
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-500' : 'bg-red-500'}`}
          style={{
            clipPath: 'polygon(0 59%, 100% 39%, 100% 41%, 0 61%)'
          }}
        />

        {/* Secondary accent line */}
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-400/50' : 'bg-red-400/50'}`}
          style={{
            clipPath: 'polygon(0 57%, 100% 37%, 100% 38%, 0 58%)'
          }}
        />
      </div>

      {/* Animated pattern overlay */}
      <div
        className={`
          absolute inset-0 opacity-10 pointer-events-none
          transition-opacity duration-500
          ${phase === 'ready' ? 'opacity-10' : 'opacity-0'}
        `}
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${isBlue ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'} 10px,
            ${isBlue ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'} 20px
          )`
        }}
      />

      {/* Content container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
        {/* Main panel - GBA style */}
        <div
          className={`
            transform transition-all duration-500
            ${phase === 'enter' ? 'opacity-0 scale-90' : phase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
          `}
        >
          {/* Player emblem */}
          <div className="flex flex-col items-center mb-8">
            {/* Shield icon with player color */}
            <div
              className={`
                relative w-24 h-24 md:w-32 md:h-32 mb-4
                flex items-center justify-center
                ${isBlue ? 'text-blue-400' : 'text-red-400'}
              `}
            >
              {/* Outer glow */}
              <div
                className={`
                  absolute inset-0 rounded-full blur-xl
                  ${isBlue ? 'bg-blue-500/40' : 'bg-red-500/40'}
                  animate-pulse
                `}
              />

              {/* Shield background */}
              <div
                className={`
                  absolute inset-2 rounded-2xl rotate-45
                  ${isBlue
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-4 border-blue-400'
                    : 'bg-gradient-to-br from-red-600 to-red-800 border-4 border-red-400'
                  }
                  shadow-[0_0_30px_rgba(0,0,0,0.5)]
                `}
              />

              {/* Icon */}
              <Shield
                className="relative z-10 w-12 h-12 md:w-16 md:h-16"
                strokeWidth={1.5}
              />
            </div>

            {/* Player title */}
            <div className="text-center">
              <div className="text-slate-400 text-sm uppercase tracking-widest mb-1">
                Turno de
              </div>
              <h2
                className={`
                  text-4xl md:text-6xl font-black uppercase tracking-tight
                  ${isBlue ? 'text-blue-400' : 'text-red-400'}
                `}
                style={{
                  textShadow: isBlue
                    ? '0 4px 0 #1e3a5f, 0 0 40px rgba(59,130,246,0.5)'
                    : '0 4px 0 #5f1e1e, 0 0 40px rgba(239,68,68,0.5)'
                }}
              >
                Jugador {nextPlayer === 'P1' ? '1' : '2'}
              </h2>
              <div
                className={`
                  mt-2 text-lg md:text-xl font-bold uppercase tracking-wider
                  ${isBlue ? 'text-blue-300/80' : 'text-red-300/80'}
                `}
              >
                {isBlue ? '— Equipo Azul —' : '— Equipo Rojo —'}
              </div>
            </div>
          </div>

          {/* GBA-style action panel */}
          <div
            className={`
              transform transition-all duration-300 delay-200
              ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Warning message */}
            <div className="text-center mb-4">
              <p className="text-slate-500 text-sm">
                Pasa el dispositivo al otro jugador
              </p>
            </div>

            {/* Button - Fire Emblem style */}
            <button
              onClick={handleConfirm}
              className="
                group relative
                bg-gradient-to-b from-amber-50 to-amber-100
                border-[3px] border-amber-900
                rounded-sm
                shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]
                overflow-hidden
                transition-all duration-100
                hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]
                hover:translate-x-[2px] hover:translate-y-[2px]
                active:shadow-none
                active:translate-x-[4px] active:translate-y-[4px]
              "
            >
              {/* Inner border */}
              <div className="absolute inset-[2px] border border-amber-300 rounded-sm pointer-events-none" />

              {/* Title bar */}
              <div className="
                bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700
                px-4 py-1.5
                border-b-2 border-amber-900
              ">
                <span className="
                  text-[10px] font-bold uppercase tracking-widest
                  text-amber-100
                  drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]
                ">
                  ¿Listo?
                </span>
              </div>

              {/* Button content */}
              <div
                className={`
                  flex items-center justify-center gap-3
                  px-8 py-4
                  font-bold text-lg uppercase tracking-wide
                  transition-colors
                  ${isBlue
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 group-hover:from-blue-200 group-hover:to-blue-100'
                    : 'bg-gradient-to-r from-red-100 to-red-50 text-red-900 group-hover:from-red-200 group-hover:to-red-100'
                  }
                `}
              >
                <Swords className="w-5 h-5" />
                <span className="drop-shadow-[0.5px_0.5px_0_rgba(255,255,255,0.8)]">
                  ¡Comenzar Turno!
                </span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-slate-700 opacity-50" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-slate-700 opacity-50" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-slate-700 opacity-50" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-slate-700 opacity-50" />
    </div>
  );
}
