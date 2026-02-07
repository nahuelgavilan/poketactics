import React from 'react';
import { Sword, Shield, HandMetal, Zap, Sparkles, Wind } from 'lucide-react';
import { TYPE_COLORS } from '../../constants/types';
import type { Unit } from '../../types/game';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  burn: { label: 'Quemado', color: 'text-orange-400' },
  paralysis: { label: 'Paralizado', color: 'text-yellow-400' },
  poison: { label: 'Envenenado', color: 'text-purple-400' },
  sleep: { label: 'Dormido', color: 'text-blue-300' },
  freeze: { label: 'Congelado', color: 'text-cyan-300' },
};

interface UnitInfoProps {
  unit: Unit | null;
}

export function UnitInfo({ unit }: UnitInfoProps) {
  if (!unit) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-dashed border-slate-600 p-8 text-center text-slate-500 flex flex-col items-center">
        <HandMetal className="mb-2 opacity-50" />
        <p>Selecciona una unidad<br />para ver sus estadísticas</p>
      </div>
    );
  }

  const borderColor = unit.owner === 'P1' ? 'border-blue-500' : 'border-red-500';

  return (
    <div className={`p-5 rounded-xl border-l-4 shadow-xl bg-slate-800 ${borderColor}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{unit.template.name}</h3>
          <div className="flex gap-1 mt-1">
            {unit.template.types.map(type => (
              <span
                key={type}
                className={`text-[10px] px-2 py-0.5 rounded text-white uppercase font-bold shadow-sm ${TYPE_COLORS[type] || 'bg-gray-500'}`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-mono font-bold">{unit.currentHp}</span>
          <span className="text-xs text-slate-400 block">HP</span>
        </div>
      </div>

      {/* Ability */}
      <div className="bg-slate-700/50 rounded-lg px-3 py-2 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles size={12} className="text-yellow-400" />
          <span className="text-slate-300 font-bold">{unit.template.ability.name}</span>
          <span className="text-slate-500 ml-auto truncate">{unit.template.ability.description}</span>
        </div>
      </div>

      {/* Status effect */}
      {unit.status && (
        <div className={`bg-slate-700/50 rounded-lg px-3 py-2 mb-3 text-xs font-bold ${STATUS_LABELS[unit.status]?.color ?? 'text-slate-300'}`}>
          {STATUS_LABELS[unit.status]?.label ?? unit.status} ({unit.statusTurns} turnos)
        </div>
      )}

      {/* Moves */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Sword size={14} className="text-orange-400" />
          <span className="font-bold text-xs text-slate-300">MOVIMIENTOS</span>
        </div>
        {unit.template.moves.map((move, i) => (
          <div key={move.id} className="flex items-center gap-2 text-xs">
            <span className={`px-1 py-0.5 rounded text-white font-bold text-[9px] ${TYPE_COLORS[move.type]}`}>
              {move.type.slice(0, 3).toUpperCase()}
            </span>
            <span className="text-slate-200 flex-1 truncate">{move.name}</span>
            <span className="text-slate-500">{move.power > 0 ? `P${move.power}` : '—'}</span>
            <span className="text-slate-400 font-mono">{unit.pp[i] ?? 0}/{move.pp}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>Ataque</span>
          <span className="text-white font-bold">{unit.template.atk}</span>
        </div>
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>Defensa</span>
          <span className="text-white font-bold">{unit.template.def}</span>
        </div>
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>At.Esp</span>
          <span className="text-white font-bold">{unit.template.spa}</span>
        </div>
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>Def.Esp</span>
          <span className="text-white font-bold">{unit.template.spd}</span>
        </div>
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>Velocidad</span>
          <span className="text-white font-bold">{unit.template.spe}</span>
        </div>
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>MOV</span>
          <span className="text-white font-bold">{unit.template.mov}</span>
        </div>
      </div>
    </div>
  );
}
