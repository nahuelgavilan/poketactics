import React from 'react';
import { Sword, Shield, Zap, Heart, Navigation, Target } from 'lucide-react';
import { TYPE_COLORS } from '../constants/types';
import type { Unit } from '../types/game';

interface UnitTooltipProps {
  unit: Unit;
  screenX: number;
  screenY: number;
  isEnemy?: boolean;
}

export function UnitTooltip({ unit, screenX, screenY, isEnemy = false }: UnitTooltipProps) {
  // Position tooltip above or below based on screen position
  const isNearBottom = screenY > window.innerHeight * 0.6;
  const isNearRight = screenX > window.innerWidth * 0.7;

  return (
    <div
      className="fixed z-[100] pointer-events-none animate-fade-in"
      style={{
        left: isNearRight ? screenX - 200 : screenX + 20,
        top: isNearBottom ? screenY - 180 : screenY + 20,
      }}
    >
      <div className={`
        w-48 bg-slate-900/95 backdrop-blur-sm rounded-xl border-2 shadow-2xl overflow-hidden
        ${isEnemy ? 'border-red-500/50' : 'border-blue-500/50'}
      `}>
        {/* Header */}
        <div className={`px-3 py-2 ${isEnemy ? 'bg-red-900/50' : 'bg-blue-900/50'}`}>
          <div className="flex items-center gap-2">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${unit.template.id}.png`}
              alt={unit.template.name}
              className="w-8 h-8 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <div>
              <div className="font-bold text-white text-sm">{unit.template.name}</div>
              <div className="flex gap-0.5">
                {unit.template.types.map(type => (
                  <span key={type} className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 space-y-2">
          {/* HP */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-slate-400">
                <Heart className="w-3 h-3 text-red-400" />
                <span>HP</span>
              </div>
              <span className="font-mono text-white">{unit.currentHp}/{unit.template.hp}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  unit.currentHp / unit.template.hp > 0.5 ? 'bg-green-500' :
                  unit.currentHp / unit.template.hp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-2 py-1">
              <Sword className="w-3 h-3 text-orange-400" />
              <span className="text-slate-400">ATK</span>
              <span className="text-white font-bold ml-auto">{unit.template.atk}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-2 py-1">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-slate-400">DEF</span>
              <span className="text-white font-bold ml-auto">{unit.template.def}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-2 py-1">
              <Navigation className="w-3 h-3 text-green-400" />
              <span className="text-slate-400">MOV</span>
              <span className="text-white font-bold ml-auto">{unit.template.mov}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-2 py-1">
              <Target className="w-3 h-3 text-purple-400" />
              <span className="text-slate-400">RNG</span>
              <span className="text-white font-bold ml-auto">{unit.template.rng}</span>
            </div>
          </div>

          {/* Move */}
          <div className="bg-slate-800/50 rounded px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-slate-300">{unit.template.moveName}</span>
              <span className={`ml-auto text-[9px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[unit.template.moveType]}`}>
                {unit.template.moveType.slice(0, 3).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Status */}
          {unit.hasMoved && (
            <div className="text-center text-[10px] text-slate-500 italic">
              Ya se movió este turno
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
