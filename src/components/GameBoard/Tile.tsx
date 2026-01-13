import React from 'react';
import { Trees, Mountain, Droplets, Sparkles, Cross } from 'lucide-react';
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

  // Terrain styling - Sakurai-level polish
  const getTerrainStyle = () => {
    switch (terrain) {
      case TERRAIN.GRASS:
        return {
          bg: 'from-green-400 via-emerald-500 to-green-600',
          border: 'border-green-700/80'
        };
      case TERRAIN.FOREST:
        return {
          bg: 'from-emerald-600 via-green-700 to-emerald-800',
          border: 'border-emerald-900'
        };
      case TERRAIN.WATER:
        return {
          bg: 'from-cyan-400 via-blue-500 to-sky-600',
          border: 'border-blue-700/80'
        };
      case TERRAIN.MOUNTAIN:
        return {
          bg: 'from-stone-400 via-slate-500 to-stone-600',
          border: 'border-stone-700'
        };
      case TERRAIN.TALL_GRASS:
        return {
          bg: 'from-teal-400 via-emerald-500 to-teal-600',
          border: 'border-teal-700/80'
        };
      case TERRAIN.POKEMON_CENTER:
        return {
          bg: 'from-rose-200 via-pink-200 to-rose-300',
          border: 'border-rose-400'
        };
      default:
        return {
          bg: 'from-slate-300 via-gray-400 to-slate-400',
          border: 'border-slate-500'
        };
    }
  };

  const style = getTerrainStyle();

  return (
    <div
      onClick={onClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`
        aspect-square rounded-lg relative cursor-pointer overflow-hidden
        border-b-[3px] ${style.border}
        bg-gradient-to-br ${style.bg}
        transition-transform duration-100
        ${isMobile ? 'active:scale-95' : 'hover:scale-[1.02]'}
        ${isSelected ? 'ring-[3px] ring-yellow-300 ring-offset-1 ring-offset-slate-800 z-30' : ''}
        ${isUnexplored ? 'grayscale brightness-[0.2]' : ''}
        ${isInFog && !isUnexplored ? 'brightness-50 saturate-50' : ''}
      `}
    >
      {/* Light reflection - gives depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
        }}
      />

      {/* Terrain icons */}
      {terrain === TERRAIN.FOREST && (
        <Trees className={`absolute inset-0 m-auto ${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-green-950/50 pointer-events-none`} />
      )}
      {terrain === TERRAIN.MOUNTAIN && (
        <Mountain className={`absolute inset-0 m-auto ${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-stone-700/50 pointer-events-none`} />
      )}
      {terrain === TERRAIN.WATER && (
        <Droplets className={`absolute inset-0 m-auto ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-800/40 pointer-events-none`} />
      )}
      {terrain === TERRAIN.TALL_GRASS && (
        <Sparkles
          className={`absolute inset-0 m-auto ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-300/80 pointer-events-none`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(250, 204, 21, 0.6))' }}
        />
      )}
      {terrain === TERRAIN.POKEMON_CENTER && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-white rounded-full flex items-center justify-center shadow-md border-2 border-red-300`}>
            <Cross className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} strokeWidth={3} />
          </div>
        </div>
      )}

      {/* MOVE INDICATOR - soft glow + border, no dots */}
      {canMove && !isSelected && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: 'radial-gradient(circle, rgba(96,165,250,0.45) 0%, rgba(59,130,246,0.2) 60%, transparent 80%)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
          <div className="absolute inset-[2px] rounded-md border-2 border-blue-400/60 pointer-events-none" />
        </>
      )}

      {/* ATTACK INDICATOR - red glow + X pattern */}
      {canAttack && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(220,38,38,0.25) 60%, transparent 80%)',
              animation: 'pulse 0.7s ease-in-out infinite'
            }}
          />
          <div className="absolute inset-[2px] rounded-md border-2 border-red-400/80 pointer-events-none" />
          {/* Subtle X */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
            <line x1="20" y1="20" x2="80" y2="80" stroke="#fca5a5" strokeWidth="3" />
            <line x1="80" y1="20" x2="20" y2="80" stroke="#fca5a5" strokeWidth="3" />
          </svg>
        </>
      )}

      {/* UNIT */}
      {unit && (
        <div className={`
          absolute inset-0 flex items-center justify-center z-20
          transition-all duration-200
          ${unit.hasMoved ? 'opacity-40 saturate-0' : ''}
        `}>
          {/* Player glow */}
          {!unit.hasMoved && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${unit.owner === 'P1' ? 'rgba(59,130,246,0.35)' : 'rgba(239,68,68,0.35)'} 0%, transparent 55%)`
              }}
            />
          )}

          {/* Sprite */}
          <div className={`relative ${isMobile ? 'w-[88%] h-[88%]' : 'w-[82%] h-[82%]'} ${isSelected ? 'animate-bounce' : ''}`}>
            <img
              src={getIconSprite(unit.template.id)}
              className={`w-full h-full object-contain ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''} ${!unit.hasMoved ? 'drop-shadow-lg' : ''}`}
              style={{ imageRendering: 'pixelated' }}
              draggable="false"
              alt={unit.template.name}
            />
          </div>

          {/* HP Bar */}
          <div className={`absolute top-0 ${isMobile ? 'w-[75%]' : 'w-[70%]'} h-[5px] bg-black/60 rounded-full overflow-hidden`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                unit.currentHp / unit.template.hp > 0.5
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                  : unit.currentHp / unit.template.hp > 0.25
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
              }`}
              style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
            />
          </div>

          {/* Owner indicator */}
          <div
            className={`absolute -bottom-0.5 w-3 h-1 rounded-full ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}`}
            style={{ boxShadow: `0 0 6px ${unit.owner === 'P1' ? 'rgba(59,130,246,0.8)' : 'rgba(239,68,68,0.8)'}` }}
          />
        </div>
      )}
    </div>
  );
}
