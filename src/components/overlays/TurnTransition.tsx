import React, { useEffect, useState } from 'react';
import { Repeat, Play } from 'lucide-react';
import type { Player } from '../../types/game';

interface TurnTransitionProps {
  currentPlayer: Player;
  onConfirm: () => void;
}

export function TurnTransition({ currentPlayer, onConfirm }: TurnTransitionProps) {
  const [showButton, setShowButton] = useState(false);
  const nextPlayer = currentPlayer === 'P1' ? 'P2' : 'P1';
  const isBlue = nextPlayer === 'P1';

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background with player color */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isBlue ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950' : 'bg-gradient-to-br from-red-950 via-slate-900 to-red-950'
      }`} />

      {/* Animated circles */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse ${
        isBlue ? 'bg-blue-500/20' : 'bg-red-500/20'
      }`} />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Icon */}
        <div className={`inline-flex p-4 rounded-full mb-6 ${
          isBlue ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <Repeat size={48} className="animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight">
          CAMBIO DE TURNO
        </h2>

        {/* Player indicator */}
        <div className="mb-8">
          <span className="text-slate-400 text-sm md:text-base">Pasa el dispositivo al</span>
          <div className={`text-4xl md:text-6xl font-black mt-2 ${isBlue ? 'text-blue-400' : 'text-red-500'}`}
            style={{ textShadow: isBlue ? '0 0 40px rgba(59,130,246,0.5)' : '0 0 40px rgba(239,68,68,0.5)' }}
          >
            JUGADOR {nextPlayer === 'P1' ? '1' : '2'}
          </div>
          <div className={`text-lg md:text-xl font-bold mt-1 ${isBlue ? 'text-blue-300/70' : 'text-red-300/70'}`}>
            {isBlue ? 'EQUIPO AZUL' : 'EQUIPO ROJO'}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={onConfirm}
          className={`
            relative px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-lg md:text-xl
            transition-all duration-300 transform
            ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${isBlue
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)]'
            }
            hover:scale-105 active:scale-95
          `}
        >
          <span className="flex items-center gap-3">
            <Play className="w-6 h-6" />
            ¡ESTOY LISTO!
          </span>
        </button>

        {/* Helper text */}
        <p className={`mt-6 text-sm transition-opacity duration-500 ${showButton ? 'opacity-100' : 'opacity-0'} ${
          isBlue ? 'text-blue-300/50' : 'text-red-300/50'
        }`}>
          Asegúrate de que tu oponente no vea la pantalla
        </p>
      </div>
    </div>
  );
}
