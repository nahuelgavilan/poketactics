import { useEffect, useState, useMemo } from 'react';
import { Trophy, RotateCcw, Home, Crown, Star } from 'lucide-react';
import type { Player } from '../../types/game';
import { VERSION } from '../../constants/version';

interface VictoryScreenProps {
  winner: Player;
  onPlayAgain: () => void;
}

// Generate confetti particles
function generateConfetti(count: number, isBlue: boolean) {
  const colors = isBlue
    ? ['#3B82F6', '#60A5FA', '#93C5FD', '#FBBF24', '#FCD34D']
    : ['#EF4444', '#F87171', '#FCA5A5', '#FBBF24', '#FCD34D'];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    type: Math.random() > 0.5 ? 'rect' : 'circle' as 'rect' | 'circle',
  }));
}

// Generate sparkle stars
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 16,
    delay: Math.random() * 2,
    duration: 1 + Math.random() * 2,
  }));
}

export function VictoryScreen({ winner, onPlayAgain }: VictoryScreenProps) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'celebrate' | 'ready'>('flash');
  const isBlue = winner === 'P1';

  const confetti = useMemo(() => generateConfetti(50, isBlue), [isBlue]);
  const stars = useMemo(() => generateStars(15), []);

  // Animation sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('reveal'), 200));
    timers.push(setTimeout(() => setPhase('celebrate'), 800));
    timers.push(setTimeout(() => setPhase('ready'), 1500));

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* === FLASH === */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-300 ${
        phase === 'flash' ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* === BACKGROUND === */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        phase !== 'flash' ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Base gradient */}
        <div className={`absolute inset-0 ${
          isBlue
            ? 'bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950'
            : 'bg-gradient-to-br from-red-950 via-slate-950 to-orange-950'
        }`} />

        {/* Radial glow */}
        <div className={`absolute inset-0 ${
          isBlue
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.2)_0%,transparent_60%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.2)_0%,transparent_60%)]'
        }`} />

        {/* Animated glow orbs */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[150px] animate-pulse ${
          isBlue ? 'bg-blue-500/30' : 'bg-red-500/30'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-[120px] animate-pulse ${
          isBlue ? 'bg-cyan-500/25' : 'bg-orange-500/25'
        }`} style={{ animationDelay: '1s' }} />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* === CONFETTI === */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500 ${
        phase === 'celebrate' || phase === 'ready' ? 'opacity-100' : 'opacity-0'
      }`}>
        {confetti.map(c => (
          <div
            key={c.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${c.x}%`,
              top: '-5%',
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          >
            <div
              className={c.type === 'rect' ? 'rounded-sm' : 'rounded-full'}
              style={{
                width: c.size,
                height: c.type === 'rect' ? c.size * 0.6 : c.size,
                background: c.color,
                transform: `rotate(${c.rotation}deg)`,
                boxShadow: `0 0 10px ${c.color}80`,
              }}
            />
          </div>
        ))}
      </div>

      {/* === SPARKLE STARS === */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
        phase === 'celebrate' || phase === 'ready' ? 'opacity-100' : 'opacity-0'
      }`}>
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute animate-star-twinkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          >
            <Star
              className="text-yellow-400 fill-yellow-400"
              style={{ width: s.size, height: s.size, filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.8))' }}
            />
          </div>
        ))}
      </div>

      {/* === MAIN CONTENT === */}
      <div className={`relative z-10 text-center px-4 transition-all duration-700 ${
        phase !== 'flash' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}>

        {/* Crown + Trophy */}
        <div className={`relative inline-block mb-6 transition-all duration-500 ${
          phase === 'celebrate' || phase === 'ready' ? 'animate-trophy-bounce' : ''
        }`}>
          {/* Crown above */}
          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 transition-all duration-500 ${
            phase === 'celebrate' || phase === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <Crown className="w-10 h-10 text-yellow-400 fill-yellow-400" style={{ filter: 'drop-shadow(0 0 15px rgba(250,204,21,0.6))' }} />
          </div>

          {/* Trophy circle */}
          <div className={`p-6 rounded-full ${
            isBlue ? 'bg-blue-500/20 border-2 border-blue-400/40' : 'bg-red-500/20 border-2 border-red-400/40'
          }`}>
            <Trophy
              className="w-20 h-20 md:w-24 md:h-24 text-yellow-400"
              style={{ filter: 'drop-shadow(0 0 30px rgba(250,204,21,0.6))' }}
            />
          </div>

          {/* Glow ring */}
          <div className={`absolute inset-0 rounded-full animate-ping ${
            isBlue ? 'bg-blue-400/20' : 'bg-red-400/20'
          }`} style={{ animationDuration: '2s' }} />
        </div>

        {/* Victory text */}
        <div className={`mb-2 transition-all duration-500 ${
          phase === 'reveal' || phase === 'celebrate' || phase === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}>
          <span
            className="text-lg md:text-xl text-yellow-400 font-bold uppercase tracking-[0.3em]"
            style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 20px rgba(250,204,21,0.5)' }}
          >
            Victoria
          </span>
        </div>

        {/* Winner team name */}
        <h1
          className={`text-5xl md:text-7xl lg:text-8xl font-black mb-3 transition-all duration-700 ${
            phase === 'celebrate' || phase === 'ready' ? 'animate-winner-glow' : ''
          }`}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            color: isBlue ? '#60A5FA' : '#F87171',
            textShadow: isBlue
              ? '0 0 60px rgba(96,165,250,0.8), 0 4px 0 rgba(30,64,175,1), 0 8px 0 rgba(0,0,0,0.3)'
              : '0 0 60px rgba(248,113,113,0.8), 0 4px 0 rgba(153,27,27,1), 0 8px 0 rgba(0,0,0,0.3)',
          }}
        >
          {isBlue ? 'AZUL' : 'ROJO'}
        </h1>

        {/* Player indicator */}
        <p
          className="text-xl md:text-2xl text-white font-bold mb-8"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(12px, 3vw, 18px)' }}
        >
          JUGADOR {winner === 'P1' ? '1' : '2'} GANA
        </p>

        {/* Victory message */}
        <div className={`inline-block px-6 py-3 rounded-xl mb-8 ${
          isBlue
            ? 'bg-blue-500/15 border-2 border-blue-400/30'
            : 'bg-red-500/15 border-2 border-red-400/30'
        }`}>
          <p className={`text-sm ${isBlue ? 'text-blue-300' : 'text-red-300'}`}>
            Has eliminado a todo el equipo rival
          </p>
        </div>

        {/* Action buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-500 ${
          phase === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <button
            onClick={onPlayAgain}
            className={`
              group flex items-center justify-center gap-3 px-8 py-4 rounded-xl
              font-bold text-lg transition-all duration-300
              hover:scale-105 active:scale-95
              ${isBlue
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
              }
            `}
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Revancha
          </button>

          <button
            onClick={() => window.location.reload()}
            className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-600/50"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}
          >
            <Home className="w-5 h-5" />
            Menú
          </button>
        </div>
      </div>

      {/* === VERSION BADGE === */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-700 ${
        phase === 'ready' ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
          <span
            className="text-[8px] font-bold tracking-wider text-slate-500 uppercase"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            v{VERSION}
          </span>
        </div>
      </div>

      {/* === ANIMATIONS === */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear infinite;
        }

        @keyframes star-twinkle {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
        }
        .animate-star-twinkle {
          animation: star-twinkle ease-in-out infinite;
        }

        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-trophy-bounce {
          animation: trophy-bounce 2s ease-in-out infinite;
        }

        @keyframes winner-glow {
          0%, 100% { filter: drop-shadow(0 0 30px currentColor); }
          50% { filter: drop-shadow(0 0 50px currentColor); }
        }
        .animate-winner-glow {
          animation: winner-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
