import React from 'react';
import { Trees, Mountain, Droplets, Sparkles, Cross, Flame } from 'lucide-react';
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

// Terrain-specific styles for rich visual variety
const TERRAIN_STYLES: Record<number, {
  bg: string;
  border: string;
  pattern?: string;
  glow?: string;
}> = {
  [TERRAIN.GRASS]: {
    bg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600',
    border: 'border-emerald-700',
    pattern: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)'
  },
  [TERRAIN.FOREST]: {
    bg: 'bg-gradient-to-br from-emerald-700 via-green-800 to-emerald-900',
    border: 'border-emerald-950',
    glow: 'shadow-inner shadow-black/30'
  },
  [TERRAIN.WATER]: {
    bg: 'bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600',
    border: 'border-blue-700',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 6px)'
  },
  [TERRAIN.MOUNTAIN]: {
    bg: 'bg-gradient-to-br from-stone-400 via-slate-500 to-stone-600',
    border: 'border-stone-700',
    glow: 'shadow-inner shadow-black/20'
  },
  [TERRAIN.TALL_GRASS]: {
    bg: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700',
    border: 'border-teal-800',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)'
  },
  [TERRAIN.POKEMON_CENTER]: {
    bg: 'bg-gradient-to-br from-rose-200 via-pink-300 to-rose-400',
    border: 'border-rose-500',
    glow: 'shadow-lg shadow-pink-500/20'
  },
  [TERRAIN.BASE]: {
    bg: 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500',
    border: 'border-slate-600'
  }
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
  const styles = TERRAIN_STYLES[terrain] || TERRAIN_STYLES[TERRAIN.GRASS];

  return (
    <div
      onClick={onClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`
        aspect-square rounded-lg relative cursor-pointer
        transition-all duration-150 overflow-hidden
        border-b-[3px] ${styles.border}
        ${styles.bg} ${styles.glow || ''}
        ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900 z-30 scale-105' : ''}
        ${canMove && !isSelected ? 'z-20' : ''}
        ${canAttack ? 'z-20' : ''}
        ${isMobile ? 'active:scale-95' : 'hover:brightness-110 hover:scale-[1.02]'}
        ${isUnexplored ? 'grayscale brightness-[0.25] saturate-0' : ''}
        ${isInFog && !isUnexplored ? 'brightness-[0.5] saturate-50' : ''}
      `}
      style={{
        backgroundImage: styles.pattern
      }}
    >
      {/* Terrain decorations */}
      {terrain === TERRAIN.FOREST && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Trees className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-emerald-950/60 drop-shadow`} />
        </div>
      )}

      {terrain === TERRAIN.MOUNTAIN && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Mountain className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-stone-800/60 drop-shadow`} />
        </div>
      )}

      {terrain === TERRAIN.WATER && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Droplets className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-blue-900/40`} />
          </div>
          {/* Water shimmer effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />
        </>
      )}

      {terrain === TERRAIN.TALL_GRASS && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Sparkles
            className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-400/70`}
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
        </div>
      )}

      {terrain === TERRAIN.POKEMON_CENTER && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`
            ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}
            bg-white rounded-full flex items-center justify-center
            shadow-lg border-2 border-red-400
          `}>
            <Cross className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Move indicator - pulsing blue overlay */}
      {canMove && !isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated glow */}
          <div
            className="absolute inset-0 bg-blue-400/40 rounded-lg"
            style={{ animation: 'pulse 1s ease-in-out infinite' }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/50 via-blue-400/20 to-transparent" />
          {/* Arrow indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-2 h-2 bg-white rounded-full shadow-lg shadow-blue-400"
              style={{ animation: 'bounce 0.8s ease-in-out infinite' }}
            />
          </div>
          {/* Border highlight */}
          <div className="absolute inset-0 rounded-lg border-2 border-blue-400/80" />
        </div>
      )}

      {/* Attack indicator - pulsing red overlay */}
      {canAttack && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Danger pulse */}
          <div
            className="absolute inset-0 bg-red-500/40 rounded-lg"
            style={{ animation: 'pulse 0.6s ease-in-out infinite' }}
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-600/60 via-red-500/30 to-transparent" />
          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame
              className="w-4 h-4 text-yellow-400 drop-shadow-lg"
              style={{ animation: 'ping 1s ease-in-out infinite' }}
            />
          </div>
          {/* Border */}
          <div className="absolute inset-0 rounded-lg border-2 border-red-500" />
        </div>
      )}

      {/* Unit */}
      {unit && (
        <div className={`
          absolute inset-0 flex items-center justify-center z-20
          transition-all duration-200
          ${unit.hasMoved ? 'opacity-50 saturate-50' : ''}
        `}>
          {/* Unit container with effects */}
          <div className={`
            relative ${isMobile ? 'w-[90%] h-[90%]' : 'w-[85%] h-[85%]'}
            ${isSelected ? '' : ''}
            ${!unit.hasMoved ? 'drop-shadow-lg' : ''}
          `}>
            {/* Player color glow */}
            {!unit.hasMoved && (
              <div className={`
                absolute inset-0 rounded-full blur-lg opacity-50
                ${unit.owner === 'P1' ? 'bg-blue-400' : 'bg-red-400'}
              `} />
            )}

            {/* Sprite */}
            <img
              src={getIconSprite(unit.template.id)}
              className={`
                relative w-full h-full object-contain
                ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''}
                ${isSelected ? 'animate-bounce' : ''}
                ${!unit.hasMoved ? 'drop-shadow-md' : ''}
              `}
              style={{ imageRendering: 'pixelated' }}
              draggable="false"
              alt={unit.template.name}
            />
          </div>

          {/* HP Bar - game style */}
          <div className={`
            absolute ${isMobile ? 'top-0' : 'top-0.5'}
            ${isMobile ? 'w-[80%]' : 'w-[75%]'} h-1.5
            bg-black/70 rounded-full overflow-hidden
            border border-white/20
          `}>
            <div
              className={`
                h-full transition-all duration-300 rounded-full
                ${unit.currentHp / unit.template.hp > 0.5
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : unit.currentHp / unit.template.hp > 0.25
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
                }
                ${unit.currentHp / unit.template.hp <= 0.25 ? 'animate-pulse' : ''}
              `}
              style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
            />
          </div>

          {/* Owner indicator dot */}
          <div className={`
            absolute -bottom-0.5 w-3 h-1.5 rounded-full
            ${unit.owner === 'P1'
              ? 'bg-blue-500 shadow-lg shadow-blue-500/60'
              : 'bg-red-500 shadow-lg shadow-red-500/60'
            }
          `} />
        </div>
      )}

      {/* Shine overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
        }}
      />
    </div>
  );
}
