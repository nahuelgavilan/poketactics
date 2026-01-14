import { useEffect, useState } from 'react';
import { Shield, Swords, ChevronRight } from 'lucide-react';
import type { Player } from '../../types/game';

interface TurnTransitionProps {
  currentPlayer: Player;
  onConfirm: () => void;
}

/**
 * Fire Emblem / Advance Wars style turn transition
 * - FULLY OPAQUE from start (privacy: can't see opponent's game)
 * - Dramatic diagonal slash reveal
 * - Player emblem with tactical icons
 * - GBA-era bordered panel aesthetic
 */
export function TurnTransition({ currentPlayer, onConfirm }: TurnTransitionProps) {
  const [phase, setPhase] = useState<'enter' | 'ready' | 'exit'>('enter');
  const [showButton, setShowButton] = useState(false);
  const nextPlayer = currentPlayer === 'P1' ? 'P2' : 'P1';
  const isBlue = nextPlayer === 'P1';

  useEffect(() => {
    // Entrance animation (content only, background always opaque)
    const enterTimer = setTimeout(() => {
      setPhase('ready');
      setShowButton(true);
    }, 400);

    return () => clearTimeout(enterTimer);
  }, []);

  const handleConfirm = () => {
    setPhase('exit');
    setTimeout(onConfirm, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* SOLID OPAQUE BACKGROUND - Never reveals game state */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Diagonal design overlay - purely decorative, on top of opaque bg */}
      <div className="absolute inset-0">
        {/* Top section - darker */}
        <div
          className="absolute inset-0 bg-slate-900"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 35%, 0 55%)'
          }}
        />

        {/* Bottom section - player color */}
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-950' : 'bg-red-950'}`}
          style={{
            clipPath: 'polygon(0 55%, 100% 35%, 100% 100%, 0 100%)'
          }}
        />

        {/* Diagonal accent lines */}
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-500' : 'bg-red-500'}`}
          style={{
            clipPath: 'polygon(0 54%, 100% 34%, 100% 36%, 0 56%)'
          }}
        />
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-400/60' : 'bg-red-400/60'}`}
          style={{
            clipPath: 'polygon(0 52%, 100% 32%, 100% 33%, 0 53%)'
          }}
        />
        <div
          className={`absolute inset-0 ${isBlue ? 'bg-blue-300/30' : 'bg-red-300/30'}`}
          style={{
            clipPath: 'polygon(0 50%, 100% 30%, 100% 31%, 0 51%)'
          }}
        />
      </div>

      {/* Animated diagonal stripes pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -35deg,
            transparent,
            transparent 20px,
            ${isBlue ? 'rgba(59,130,246,1)' : 'rgba(239,68,68,1)'} 20px,
            ${isBlue ? 'rgba(59,130,246,1)' : 'rgba(239,68,68,1)'} 40px
          )`,
          animation: 'stripes-move 20s linear infinite'
        }}
      />

      {/* Content container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
        {/* Main panel */}
        <div
          className={`
            transform transition-all duration-400
            ${phase === 'enter' ? 'opacity-0 scale-95 translate-y-4' : phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100 translate-y-0'}
          `}
        >
          {/* Player emblem */}
          <div className="flex flex-col items-center mb-6">
            {/* Shield icon with player color */}
            <div
              className={`
                relative w-20 h-20 md:w-28 md:h-28 mb-3
                flex items-center justify-center
                ${isBlue ? 'text-blue-400' : 'text-red-400'}
              `}
            >
              {/* Outer glow */}
              <div
                className={`
                  absolute inset-0 rounded-full blur-2xl
                  ${isBlue ? 'bg-blue-500/50' : 'bg-red-500/50'}
                  animate-pulse
                `}
              />

              {/* Diamond/shield background */}
              <div
                className={`
                  absolute inset-3 rounded-xl rotate-45
                  ${isBlue
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-[3px] border-blue-300'
                    : 'bg-gradient-to-br from-red-500 to-red-700 border-[3px] border-red-300'
                  }
                  shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.2)]
                `}
              />

              {/* Inner highlight */}
              <div
                className="absolute inset-5 rounded-lg rotate-45 bg-gradient-to-br from-white/20 to-transparent"
              />

              {/* Icon */}
              <Shield
                className="relative z-10 w-10 h-10 md:w-14 md:h-14 drop-shadow-lg"
                strokeWidth={1.5}
              />
            </div>

            {/* Player title */}
            <div className="text-center">
              <div className="text-slate-500 text-xs uppercase tracking-[0.3em] mb-2 font-medium">
                Turno de
              </div>
              <h2
                className={`
                  text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight
                  ${isBlue ? 'text-blue-400' : 'text-red-400'}
                `}
                style={{
                  textShadow: isBlue
                    ? '0 4px 0 #1e3a8a, 0 0 60px rgba(59,130,246,0.6)'
                    : '0 4px 0 #7f1d1d, 0 0 60px rgba(239,68,68,0.6)'
                }}
              >
                Jugador {nextPlayer === 'P1' ? '1' : '2'}
              </h2>
              <div
                className={`
                  mt-3 text-base md:text-lg font-bold uppercase tracking-widest
                  ${isBlue ? 'text-blue-300/70' : 'text-red-300/70'}
                `}
              >
                {isBlue ? '— Equipo Azul —' : '— Equipo Rojo —'}
              </div>
            </div>
          </div>

          {/* GBA-style action panel */}
          <div
            className={`
              transform transition-all duration-300 delay-100
              ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
          >
            {/* Privacy warning */}
            <div className="text-center mb-4">
              <div className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                ${isBlue ? 'bg-blue-900/50 border border-blue-700/50' : 'bg-red-900/50 border border-red-700/50'}
              `}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isBlue ? 'bg-blue-400' : 'bg-red-400'}`} />
                <p className="text-slate-400 text-sm">
                  Pasa el dispositivo al otro jugador
                </p>
              </div>
            </div>

            {/* Button - Fire Emblem style */}
            <button
              onClick={handleConfirm}
              className="
                group relative mx-auto block
                bg-gradient-to-b from-amber-50 to-amber-100
                border-[3px] border-amber-900
                rounded-sm
                shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]
                overflow-hidden
                transition-all duration-100
                hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]
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
                px-6 py-1.5
                border-b-2 border-amber-900
              ">
                <span className="
                  text-[10px] font-bold uppercase tracking-[0.2em]
                  text-amber-100
                  drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]
                ">
                  ¿Listo para jugar?
                </span>
              </div>

              {/* Button content */}
              <div
                className={`
                  flex items-center justify-center gap-3
                  px-10 py-4
                  font-bold text-base md:text-lg uppercase tracking-wide
                  transition-colors
                  ${isBlue
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 group-hover:from-blue-200 group-hover:to-blue-100'
                    : 'bg-gradient-to-r from-red-100 to-red-50 text-red-900 group-hover:from-red-200 group-hover:to-red-100'
                  }
                `}
              >
                <Swords className="w-5 h-5" />
                <span className="drop-shadow-[0.5px_0.5px_0_rgba(255,255,255,0.8)]">
                  ¡Comenzar!
                </span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative corners */}
      <div className={`absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 ${isBlue ? 'border-blue-700/50' : 'border-red-700/50'}`} />
      <div className={`absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 ${isBlue ? 'border-blue-700/50' : 'border-red-700/50'}`} />
      <div className={`absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 ${isBlue ? 'border-blue-700/50' : 'border-red-700/50'}`} />
      <div className={`absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 ${isBlue ? 'border-blue-700/50' : 'border-red-700/50'}`} />

      {/* Animation keyframes */}
      <style>{`
        @keyframes stripes-move {
          0% { background-position: 0 0; }
          100% { background-position: 80px 0; }
        }
      `}</style>
    </div>
  );
}
