import React from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { CaptureData } from '../types/game';

interface CaptureModalProps extends CaptureData {
  onComplete: () => void;
}

export function CaptureModal({ pokemon, player, onComplete }: CaptureModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
      <div className="bg-slate-800 border-4 border-yellow-500 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">

        {/* Pokemon sprite with glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30 animate-pulse" />
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              className="w-32 h-32 object-contain rendering-pixelated relative z-10"
              alt={pokemon.name}
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-white mb-2">
          ¡POKEMON CAPTURADO!
        </h2>

        {/* Description */}
        <p className="text-slate-300 mb-6">
          Un{' '}
          <span className="text-yellow-400 font-bold">{pokemon.name}</span>
          {' '}salvaje se ha unido al equipo{' '}
          <span className={player === 'P1' ? 'text-blue-400' : 'text-red-500'}>
            {player === 'P1' ? 'AZUL' : 'ROJO'}
          </span>.
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-6 bg-slate-900/50 p-4 rounded-lg">
          <div className="flex justify-between">
            <span>ATK</span>
            <span className="text-white">{pokemon.atk}</span>
          </div>
          <div className="flex justify-between">
            <span>DEF</span>
            <span className="text-white">{pokemon.def}</span>
          </div>
          <div className="flex justify-between">
            <span>MOV</span>
            <span className="text-white">{pokemon.mov}</span>
          </div>
          <div className="flex justify-between">
            <span>HP</span>
            <span className="text-white">{pokemon.hp}</span>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={onComplete}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-transform hover:scale-105"
        >
          ¡A Luchar!
        </button>
      </div>
    </div>
  );
}
