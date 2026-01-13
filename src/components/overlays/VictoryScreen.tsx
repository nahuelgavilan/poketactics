import React, { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import type { Player } from '../../types/game';

interface VictoryScreenProps {
  winner: Player;
  onPlayAgain: () => void;
}

export function VictoryScreen({ winner, onPlayAgain }: VictoryScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const isBlue = winner === 'P1';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background */}
      <div className={`absolute inset-0 ${
        isBlue
          ? 'bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950'
          : 'bg-gradient-to-br from-red-950 via-slate-950 to-orange-950'
      }`} />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${isBlue ? 'bg-blue-400' : 'bg-red-400'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.3,
              animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}

        {/* Glow orbs */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse ${
          isBlue ? 'bg-blue-500/30' : 'bg-red-500/30'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] animate-pulse ${
          isBlue ? 'bg-cyan-500/20' : 'bg-orange-500/20'
        }`} style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center transform transition-all duration-700 ${
        showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}>
        {/* Trophy icon */}
        <div className={`inline-flex p-5 rounded-full mb-6 ${
          isBlue ? 'bg-blue-500/20' : 'bg-red-500/20'
        }`}>
          <Trophy
            size={64}
            className={`${isBlue ? 'text-yellow-400' : 'text-yellow-400'}`}
            style={{
              filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.5))'
            }}
          />
        </div>

        {/* Victory text */}
        <div className="mb-2">
          <Sparkles className={`inline w-6 h-6 mr-2 ${isBlue ? 'text-blue-300' : 'text-red-300'}`} />
          <span className="text-lg md:text-xl text-slate-300 font-medium">¡VICTORIA!</span>
          <Sparkles className={`inline w-6 h-6 ml-2 ${isBlue ? 'text-blue-300' : 'text-red-300'}`} />
        </div>

        {/* Winner announcement */}
        <h1
          className={`text-5xl md:text-7xl lg:text-8xl font-black mb-2 ${isBlue ? 'text-blue-400' : 'text-red-500'}`}
          style={{
            textShadow: isBlue
              ? '0 0 60px rgba(59, 130, 246, 0.6), 0 4px 0 rgba(30, 64, 175, 1)'
              : '0 0 60px rgba(239, 68, 68, 0.6), 0 4px 0 rgba(153, 27, 27, 1)'
          }}
        >
          {isBlue ? 'AZUL' : 'ROJO'}
        </h1>

        <p className="text-xl md:text-2xl text-white font-bold mb-8">
          JUGADOR {winner === 'P1' ? '1' : '2'} GANA
        </p>

        {/* Stats or message */}
        <div className={`inline-block px-6 py-3 rounded-xl mb-8 ${
          isBlue ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <p className={`text-sm ${isBlue ? 'text-blue-300' : 'text-red-300'}`}>
            Has eliminado a todo el equipo rival
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            className={`
              flex items-center justify-center gap-2 px-8 py-4 rounded-xl
              font-bold text-lg transition-all duration-300
              hover:scale-105 active:scale-95
              ${isBlue
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
              }
            `}
          >
            <RotateCcw className="w-5 h-5" />
            Jugar de Nuevo
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-700"
          >
            <Home className="w-5 h-5" />
            Menú Principal
          </button>
        </div>
      </div>

      {/* Confetti-like animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}
