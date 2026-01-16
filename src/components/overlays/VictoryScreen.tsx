import { useEffect, useState, useMemo } from 'react';
import { Trophy, RotateCcw, Home, Crown, Star, Swords, Shield, Target, Sparkles, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Player } from '../../types/game';
import type { BattleStats } from '../../types/stats';
import { VERSION } from '../../constants/version';

interface VictoryScreenProps {
  winner: Player;
  onPlayAgain: () => void;
  stats?: BattleStats;
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

export function VictoryScreen({ winner, onPlayAgain, stats }: VictoryScreenProps) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'celebrate' | 'ready'>('flash');
  const [showStats, setShowStats] = useState(false);
  const isBlue = winner === 'P1';

  const confetti = useMemo(() => generateConfetti(50, isBlue), [isBlue]);
  const stars = useMemo(() => generateStars(15), []);

  // Calculate battle duration
  const battleDuration = useMemo(() => {
    if (!stats?.battleStartTime) return null;
    const endTime = stats.battleEndTime || Date.now();
    const durationMs = endTime - stats.battleStartTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [stats]);

  // Get MVP info
  const mvpInfo = useMemo(() => {
    if (!stats) return null;
    const winnerStats = winner === 'P1' ? stats.p1 : stats.p2;
    if (!winnerStats.mvpUnitId) return null;
    const mvpUnitStats = winnerStats.unitStats.get(winnerStats.mvpUnitId);
    return mvpUnitStats ? {
      name: mvpUnitStats.pokemonName,
      id: mvpUnitStats.pokemonId,
      damage: mvpUnitStats.damageDealt,
      kills: mvpUnitStats.kills,
    } : null;
  }, [stats, winner]);

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
        <div className={`inline-block px-6 py-3 rounded-xl mb-4 ${
          isBlue
            ? 'bg-blue-500/15 border-2 border-blue-400/30'
            : 'bg-red-500/15 border-2 border-red-400/30'
        }`}>
          <p className={`text-sm ${isBlue ? 'text-blue-300' : 'text-red-300'}`}>
            Has eliminado a todo el equipo rival
          </p>
        </div>

        {/* Battle Stats Panel */}
        {stats && (
          <div className={`mb-6 transition-all duration-500 ${
            phase === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Toggle button */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`
                flex items-center gap-2 mx-auto px-4 py-2 rounded-lg
                text-sm font-bold transition-all duration-300
                ${isBlue
                  ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 border border-blue-500/30'
                  : 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-500/30'
                }
              `}
            >
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showStats ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}
            </button>

            {/* Stats content */}
            {showStats && (
              <div className={`
                mt-4 p-4 rounded-xl max-w-md mx-auto
                bg-slate-900/80 backdrop-blur-md border
                ${isBlue ? 'border-blue-500/30' : 'border-red-500/30'}
                animate-stats-reveal
              `}>
                {/* Quick summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {battleDuration && (
                    <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <span className="text-lg font-mono font-bold text-white">{battleDuration}</span>
                      <span className="block text-[10px] text-slate-500 uppercase">Duración</span>
                    </div>
                  )}
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <Target className="w-4 h-4 mx-auto mb-1 text-red-400" />
                    <span className="text-lg font-mono font-bold text-white">
                      {winner === 'P1' ? stats.p1.totalKills : stats.p2.totalKills}
                    </span>
                    <span className="block text-[10px] text-slate-500 uppercase">KOs</span>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <Swords className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                    <span className="text-lg font-mono font-bold text-white">
                      {winner === 'P1' ? stats.p1.totalDamageDealt : stats.p2.totalDamageDealt}
                    </span>
                    <span className="block text-[10px] text-slate-500 uppercase">Daño</span>
                  </div>
                </div>

                {/* MVP */}
                {mvpInfo && (
                  <div className={`
                    flex items-center gap-3 p-3 rounded-lg
                    ${isBlue ? 'bg-blue-950/50 border border-blue-500/30' : 'bg-red-950/50 border border-red-500/30'}
                  `}>
                    <div className="relative">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mvpInfo.id}.png`}
                        className="w-12 h-12"
                        alt=""
                      />
                      <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-xs font-bold uppercase">MVP</span>
                        <span className="text-white font-bold">{mvpInfo.name}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-400 mt-1">
                        <span>{mvpInfo.damage} daño</span>
                        <span>{mvpInfo.kills} KOs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Capturas</span>
                    <span className="font-bold text-emerald-400">
                      {winner === 'P1' ? stats.p1.totalCaptures : stats.p2.totalCaptures}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Evoluciones</span>
                    <span className="font-bold text-purple-400">
                      {winner === 'P1' ? stats.p1.totalEvolutions : stats.p2.totalEvolutions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Turnos</span>
                    <span className="font-bold text-slate-300">{stats.totalTurns}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Bajas propias</span>
                    <span className="font-bold text-red-400">
                      {winner === 'P1' ? stats.p1.totalDeaths : stats.p2.totalDeaths}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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

        @keyframes stats-reveal {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-stats-reveal {
          animation: stats-reveal 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
