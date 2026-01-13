import React from 'react';
import { TERRAIN } from '../../constants/terrain';
import { getIconSprite } from '../../utils/sprites';
import type { TerrainType, Unit } from '../../types/game';

interface TileProps {
  x: number;
  y: number;
  terrain: TerrainType;
  unit: Unit | undefined;
  isSelected: boolean;
  canMove: boolean;
  canAttack: boolean;
  onClick: () => void;
  isMobile?: boolean;
  isVisible?: boolean;
  isExplored?: boolean;
}

/*
 * PokéTactics Design System
 * -------------------------
 * Tiles como piezas de juego de mesa premium.
 * Cada terreno tiene su propia "textura" visual usando CSS patterns.
 * Los Pokémon son el protagonista - grandes y visibles.
 */

// Custom terrain designs - unique to PokéTactics
const TERRAIN_DESIGN: Record<number, {
  // Base colors
  primary: string;
  secondary: string;
  accent: string;
  // Border
  borderColor: string;
  // Optional pattern (CSS)
  pattern?: string;
  // Icon emoji (simple, universal)
  icon?: string;
}> = {
  [TERRAIN.GRASS]: {
    primary: '#4ade80',    // green-400
    secondary: '#22c55e',  // green-500
    accent: '#16a34a',     // green-600
    borderColor: '#15803d', // green-700
    pattern: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
  },
  [TERRAIN.FOREST]: {
    primary: '#059669',    // emerald-600
    secondary: '#047857',  // emerald-700
    accent: '#065f46',     // emerald-800
    borderColor: '#064e3b', // emerald-900
    icon: '🌲',
  },
  [TERRAIN.WATER]: {
    primary: '#38bdf8',    // sky-400
    secondary: '#0ea5e9',  // sky-500
    accent: '#0284c7',     // sky-600
    borderColor: '#0369a1', // sky-700
    pattern: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      rgba(255,255,255,0.08) 4px,
      rgba(255,255,255,0.08) 8px
    )`,
    icon: '〰️',
  },
  [TERRAIN.MOUNTAIN]: {
    primary: '#a8a29e',    // stone-400
    secondary: '#78716c',  // stone-500
    accent: '#57534e',     // stone-600
    borderColor: '#44403c', // stone-700
    icon: '⛰️',
  },
  [TERRAIN.TALL_GRASS]: {
    primary: '#2dd4bf',    // teal-400
    secondary: '#14b8a6',  // teal-500
    accent: '#0d9488',     // teal-600
    borderColor: '#0f766e', // teal-700
    pattern: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.05) 3px,
      rgba(0,0,0,0.05) 6px
    )`,
    icon: '✨',
  },
  [TERRAIN.POKEMON_CENTER]: {
    primary: '#fda4af',    // rose-300
    secondary: '#fb7185',  // rose-400
    accent: '#f43f5e',     // rose-500
    borderColor: '#e11d48', // rose-600
    icon: '➕',
  },
  [TERRAIN.BASE]: {
    primary: '#cbd5e1',    // slate-300
    secondary: '#94a3b8',  // slate-400
    accent: '#64748b',     // slate-500
    borderColor: '#475569', // slate-600
    icon: '🏠',
  },
};

export function Tile({
  terrain,
  unit,
  isSelected,
  canMove,
  canAttack,
  onClick,
  isMobile = false,
  isVisible = true,
  isExplored = true
}: TileProps) {
  const isInFog = !isVisible;
  const isUnexplored = !isExplored;
  const design = TERRAIN_DESIGN[terrain] || TERRAIN_DESIGN[TERRAIN.GRASS];

  return (
    <div
      onClick={onClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`
        aspect-square rounded-xl relative cursor-pointer overflow-hidden
        transition-all duration-150
        ${isMobile ? 'active:scale-90' : 'hover:scale-105 hover:z-10'}
        ${isSelected ? 'scale-105 z-30' : ''}
        ${isUnexplored ? 'grayscale brightness-[0.15]' : ''}
        ${isInFog && !isUnexplored ? 'brightness-[0.4] saturate-[0.3]' : ''}
      `}
      style={{
        // 3D tile effect
        background: `linear-gradient(145deg, ${design.primary} 0%, ${design.secondary} 50%, ${design.accent} 100%)`,
        boxShadow: isSelected
          ? `0 0 0 3px #fbbf24, 0 8px 16px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)`
          : `0 4px 8px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 ${design.borderColor}`,
      }}
    >
      {/* Pattern overlay */}
      {design.pattern && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: design.pattern, backgroundSize: '12px 12px' }}
        />
      )}

      {/* Top shine */}
      <div
        className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 100%)',
          borderRadius: '12px 12px 0 0',
        }}
      />

      {/* Terrain icon - subtle, in corner */}
      {design.icon && !unit && (
        <div className={`
          absolute ${isMobile ? 'bottom-0.5 right-0.5 text-[10px]' : 'bottom-1 right-1 text-xs'}
          opacity-40 pointer-events-none select-none
        `}>
          {design.icon}
        </div>
      )}

      {/* === MOVE INDICATOR === */}
      {canMove && !isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.3) 50%, transparent 70%)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-blue-300 rounded-tl" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-blue-300 rounded-tr" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-blue-300 rounded-bl" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-blue-300 rounded-br" />
        </div>
      )}

      {/* === ATTACK INDICATOR === */}
      {canAttack && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.55) 0%, rgba(220,38,38,0.35) 50%, transparent 70%)',
            animation: 'pulse 0.6s ease-in-out infinite',
          }}
        >
          {/* Danger corners */}
          <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-red-400 rounded-tl" />
          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-red-400 rounded-tr" />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-red-400 rounded-bl" />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-red-400 rounded-br" />
        </div>
      )}

      {/* === POKEMON UNIT === */}
      {unit && (
        <div className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-200
          ${unit.hasMoved ? 'opacity-35 saturate-0' : ''}
        `}>
          {/* Player aura */}
          {!unit.hasMoved && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${
                  unit.owner === 'P1' ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)'
                } 20%, transparent 60%)`,
              }}
            />
          )}

          {/* POKEMON SPRITE - BIG AND PROMINENT */}
          <div className={`
            relative w-full h-full flex items-center justify-center
            ${isSelected ? 'animate-bounce' : ''}
          `}>
            <img
              src={getIconSprite(unit.template.id)}
              className={`
                ${isMobile ? 'w-[95%] h-[95%]' : 'w-[90%] h-[90%]'}
                object-contain
                ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''}
                ${!unit.hasMoved ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]' : ''}
              `}
              style={{ imageRendering: 'pixelated' }}
              draggable="false"
              alt={unit.template.name}
            />
          </div>

          {/* HP BAR - Game style, at top */}
          <div className={`
            absolute ${isMobile ? 'top-0.5' : 'top-1'}
            ${isMobile ? 'w-[85%]' : 'w-[80%]'} h-[6px]
            bg-slate-900/80 rounded-full overflow-hidden
            border border-slate-700/50
          `}>
            <div
              className={`h-full transition-all duration-300 ${
                unit.currentHp / unit.template.hp > 0.5
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : unit.currentHp / unit.template.hp > 0.25
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse'
              }`}
              style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
            />
          </div>

          {/* PLAYER INDICATOR - Bottom badge */}
          <div className={`
            absolute ${isMobile ? '-bottom-0.5' : 'bottom-0'}
            px-1.5 py-0.5 rounded-full text-[8px] font-bold
            ${unit.owner === 'P1'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
              : 'bg-red-500 text-white shadow-lg shadow-red-500/50'
            }
          `}>
            {unit.owner}
          </div>
        </div>
      )}
    </div>
  );
}
