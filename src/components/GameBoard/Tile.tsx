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
 * PokéTactics Design System - Nintendo-Quality Tiles
 * --------------------------------------------------
 * Professional tactical game aesthetic inspired by Fire Emblem / Advance Wars.
 * Each terrain has distinct visual texture through CSS patterns.
 * Clean, readable, no emoji clutter.
 */

// Professional terrain designs - Nintendo-inspired
const TERRAIN_DESIGN: Record<number, {
  primary: string;
  secondary: string;
  accent: string;
  borderColor: string;
  pattern?: string;
  // Inner detail pattern for visual interest
  detailPattern?: string;
}> = {
  [TERRAIN.GRASS]: {
    primary: '#5cb870',
    secondary: '#4aa85f',
    accent: '#3d9650',
    borderColor: '#2d7a3d',
    // Subtle grass texture
    pattern: `
      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 1px, transparent 1px),
      radial-gradient(circle at 60% 70%, rgba(255,255,255,0.08) 1px, transparent 1px),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px)
    `,
  },
  [TERRAIN.FOREST]: {
    primary: '#2d6a4f',
    secondary: '#245840',
    accent: '#1b4332',
    borderColor: '#143024',
    // Dense tree pattern
    pattern: `
      radial-gradient(ellipse 40% 60% at 30% 40%, rgba(0,0,0,0.2) 0%, transparent 50%),
      radial-gradient(ellipse 35% 50% at 70% 60%, rgba(0,0,0,0.15) 0%, transparent 50%),
      radial-gradient(ellipse 30% 45% at 50% 30%, rgba(0,0,0,0.18) 0%, transparent 50%)
    `,
  },
  [TERRAIN.WATER]: {
    primary: '#4fa8d1',
    secondary: '#3a95c0',
    accent: '#2980a9',
    borderColor: '#1e6891',
    // Animated wave lines
    pattern: `
      repeating-linear-gradient(
        -30deg,
        transparent 0px,
        transparent 6px,
        rgba(255,255,255,0.12) 6px,
        rgba(255,255,255,0.12) 8px
      )
    `,
  },
  [TERRAIN.MOUNTAIN]: {
    primary: '#8b8680',
    secondary: '#756f6a',
    accent: '#605b56',
    borderColor: '#4a4642',
    // Rocky texture
    pattern: `
      linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%),
      linear-gradient(225deg, rgba(0,0,0,0.1) 25%, transparent 25%),
      linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%)
    `,
    detailPattern: `
      polygon(50% 20%, 20% 80%, 80% 80%)
    `,
  },
  [TERRAIN.TALL_GRASS]: {
    primary: '#6ecf8a',
    secondary: '#5ac077',
    accent: '#48b066',
    borderColor: '#389d54',
    // Tall grass stripes
    pattern: `
      repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 4px,
        rgba(0,60,30,0.12) 4px,
        rgba(0,60,30,0.12) 6px
      ),
      repeating-linear-gradient(
        5deg,
        transparent 0px,
        transparent 5px,
        rgba(0,80,40,0.08) 5px,
        rgba(0,80,40,0.08) 7px
      )
    `,
  },
  [TERRAIN.POKEMON_CENTER]: {
    primary: '#f5a5b5',
    secondary: '#f08898',
    accent: '#e86a7c',
    borderColor: '#d44d60',
    // Clean medical cross implied through highlight
    pattern: `
      linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 40%),
      linear-gradient(to right, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%)
    `,
  },
  [TERRAIN.BASE]: {
    primary: '#a0aab8',
    secondary: '#8a95a5',
    accent: '#748292',
    borderColor: '#5e6d7e',
    // Stone floor pattern
    pattern: `
      linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)
    `,
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
        aspect-square rounded-lg relative cursor-pointer overflow-hidden
        transition-all duration-150
        ${isMobile ? 'active:scale-95' : 'hover:brightness-110'}
        ${isSelected ? 'z-30' : ''}
        ${isUnexplored ? 'grayscale brightness-[0.15]' : ''}
        ${isInFog && !isUnexplored ? 'brightness-[0.4] saturate-[0.3]' : ''}
      `}
      style={{
        // Clean tile with subtle 3D effect
        background: `linear-gradient(160deg, ${design.primary} 0%, ${design.secondary} 60%, ${design.accent} 100%)`,
        boxShadow: isSelected
          ? `0 0 0 3px #fbbf24, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 ${design.borderColor}`,
      }}
    >
      {/* Pattern overlay */}
      {design.pattern && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: design.pattern, backgroundSize: '16px 16px' }}
        />
      )}

      {/* Subtle top highlight */}
      <div
        className="absolute inset-x-0 top-0 h-[40%] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 100%)',
          borderRadius: '8px 8px 0 0',
        }}
      />

      {/* === MOVE INDICATOR - Fire Emblem Style === */}
      {canMove && !isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'rgba(100, 180, 255, 0.45)',
            boxShadow: 'inset 0 0 0 2px rgba(60, 140, 220, 0.6)',
          }}
        />
      )}

      {/* === ATTACK INDICATOR - Clean Red Overlay === */}
      {canAttack && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'rgba(255, 80, 80, 0.5)',
            boxShadow: 'inset 0 0 0 2px rgba(220, 50, 50, 0.7)',
          }}
        />
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
