import React from 'react';
import { Sword, Shield, Zap, Heart, Navigation, Target, AlertCircle } from 'lucide-react';
import { TYPE_COLORS } from '../constants/types';
import type { Unit } from '../types/game';

const STATUS_ICONS: Record<string, { label: string; color: string }> = {
  burn: { label: 'QUE', color: 'bg-orange-600' },
  paralysis: { label: 'PAR', color: 'bg-yellow-600' },
  poison: { label: 'ENV', color: 'bg-purple-600' },
  sleep: { label: 'DOR', color: 'bg-blue-600' },
  freeze: { label: 'CON', color: 'bg-cyan-600' },
};

interface UnitTooltipProps {
  unit: Unit;
  screenX: number;
  screenY: number;
  isEnemy?: boolean;
}

export function UnitTooltip({ unit, screenX, screenY, isEnemy = false }: UnitTooltipProps) {
  // Position tooltip above or below based on screen position
  const TOOLTIP_WIDTH = 192;
  const TOOLTIP_HEIGHT = 188;
  const margin = 12;
  const rawLeft = screenX > window.innerWidth * 0.7 ? screenX - TOOLTIP_WIDTH - 16 : screenX + 16;
  const rawTop = screenY > window.innerHeight * 0.6 ? screenY - TOOLTIP_HEIGHT - 16 : screenY + 16;
  const left = Math.min(window.innerWidth - TOOLTIP_WIDTH - margin, Math.max(margin, rawLeft));
  const top = Math.min(window.innerHeight - TOOLTIP_HEIGHT - margin, Math.max(margin, rawTop));

  return (
    <div
      className="fixed z-[100] pointer-events-none animate-fade-in"
      style={{
        left,
        top,
      }}
    >
      <div className={`
        relative w-48 bg-[#111f23]/95 backdrop-blur-sm rounded-sm border-[2px] shadow-2xl overflow-hidden
        ${isEnemy ? 'border-rose-500/55 shadow-rose-900/25' : 'border-sky-500/55 shadow-sky-900/25'}
      `}>
        <div className="absolute inset-[2px] border border-amber-300/25 rounded-[2px] pointer-events-none" />
        {/* Header */}
        <div className={`px-3 py-2 border-b border-amber-700/35 ${isEnemy ? 'bg-rose-950/55' : 'bg-sky-950/55'}`}>
          <div className="flex items-center gap-2">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${unit.template.id}.png`}
              alt={unit.template.name}
              className="w-8 h-8 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <div>
              <div className="font-bold text-amber-50 text-sm">{unit.template.name}</div>
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
              <div className="flex items-center gap-1 text-amber-100/75">
                <Heart className="w-3 h-3 text-rose-300" />
                <span>HP</span>
              </div>
              <span className="font-mono text-amber-50">{unit.currentHp}/{unit.template.hp}</span>
            </div>
            <div className="h-1.5 bg-[#22363a] rounded-full overflow-hidden border border-black/30">
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
            <div className="flex items-center gap-1.5 bg-[#192b2f]/85 border border-amber-800/30 rounded px-2 py-1">
              <Sword className="w-3 h-3 text-orange-300" />
              <span className="text-amber-100/70">ATK</span>
              <span className="text-amber-50 font-bold ml-auto">{unit.template.atk}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#192b2f]/85 border border-amber-800/30 rounded px-2 py-1">
              <Shield className="w-3 h-3 text-sky-300" />
              <span className="text-amber-100/70">DEF</span>
              <span className="text-amber-50 font-bold ml-auto">{unit.template.def}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#192b2f]/85 border border-amber-800/30 rounded px-2 py-1">
              <Navigation className="w-3 h-3 text-emerald-300" />
              <span className="text-amber-100/70">MOV</span>
              <span className="text-amber-50 font-bold ml-auto">{unit.template.mov}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#192b2f]/85 border border-amber-800/30 rounded px-2 py-1">
              <Target className="w-3 h-3 text-violet-300" />
              <span className="text-amber-100/70">RNG</span>
              <span className="text-amber-50 font-bold ml-auto">{Math.max(...unit.template.moves.map(m => m.range))}</span>
            </div>
          </div>

          {/* Move — show first attack move */}
          {(() => {
            const firstAttack = unit.template.moves.find(m => m.category !== 'status') ?? unit.template.moves[0];
            return firstAttack ? (
              <div className="bg-[#192b2f]/85 border border-amber-800/30 rounded px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span className="text-amber-50">{firstAttack.name}</span>
                  <span className={`ml-auto text-[9px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[firstAttack.type]}`}>
                    {firstAttack.type.slice(0, 3).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Status effect */}
          {unit.status && (
            <div className="flex items-center justify-center gap-1 text-[10px]">
              <AlertCircle className="w-3 h-3" />
              <span className={`px-1.5 py-0.5 rounded text-white font-bold ${STATUS_ICONS[unit.status]?.color ?? 'bg-slate-600'}`}>
                {STATUS_ICONS[unit.status]?.label ?? unit.status.toUpperCase()}
              </span>
            </div>
          )}

          {/* Moved status */}
          {unit.hasMoved && (
            <div className="text-center text-[10px] text-amber-100/55 italic">
              Ya se movió este turno
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
