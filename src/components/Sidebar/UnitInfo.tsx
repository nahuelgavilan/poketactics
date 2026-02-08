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
      <div className="bg-[#f7ecd5] rounded-sm border-2 border-dashed border-amber-700/45 p-8 text-center text-slate-600 flex flex-col items-center">
        <HandMetal className="mb-2 opacity-50" />
        <p>Selecciona una unidad<br />para ver sus estadísticas</p>
      </div>
    );
  }

  const borderColor = unit.owner === 'P1' ? 'border-sky-500/60' : 'border-rose-500/60';

  return (
    <div className={`p-5 rounded-sm border-[2px] shadow-[0_6px_14px_rgba(101,74,40,0.22)] bg-[#f8efd9] ${borderColor}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{unit.template.name}</h3>
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
          <span className="text-2xl font-mono font-bold text-slate-800">{unit.currentHp}</span>
          <span className="text-xs text-slate-600 block">HP</span>
        </div>
      </div>

      {/* Ability */}
      <div className="bg-[#f2e4c6] rounded-md px-3 py-2 mb-3 border border-amber-700/35">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles size={12} className="text-amber-700" />
          <span className="text-slate-800 font-bold">{unit.template.ability.name}</span>
          <span className="text-slate-600 ml-auto truncate">{unit.template.ability.description}</span>
        </div>
      </div>

      {/* Status effect */}
      {unit.status && (
        <div className={`bg-[#f2e4c6] border border-amber-700/35 rounded-md px-3 py-2 mb-3 text-xs font-bold ${STATUS_LABELS[unit.status]?.color ?? 'text-slate-800'}`}>
          {STATUS_LABELS[unit.status]?.label ?? unit.status} ({unit.statusTurns} turnos)
        </div>
      )}

      {/* Moves */}
      <div className="bg-[#f2e4c6] rounded-md p-3 mb-3 space-y-2 border border-amber-700/35">
        <div className="flex items-center gap-2 mb-1">
          <Sword size={14} className="text-orange-700" />
          <span className="font-bold text-xs text-slate-800">MOVIMIENTOS</span>
        </div>
        {unit.template.moves.map((move, i) => (
          <div key={move.id} className="flex items-center gap-2 text-xs">
            <span className={`px-1 py-0.5 rounded text-white font-bold text-[9px] ${TYPE_COLORS[move.type]}`}>
              {move.type.slice(0, 3).toUpperCase()}
            </span>
            <span className="text-slate-800 flex-1 truncate">{move.name}</span>
            <span className="text-slate-600">{move.power > 0 ? `P${move.power}` : '—'}</span>
            <span className="text-slate-700 font-mono">{unit.pp[i] ?? 0}/{move.pp}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
        <div className="flex justify-between bg-[#f2e4c6] p-2 rounded border border-amber-700/30">
          <span>Ataque</span>
          <span className="text-slate-800 font-bold">{unit.template.atk}</span>
        </div>
        <div className="flex justify-between bg-[#f2e4c6] p-2 rounded border border-amber-700/30">
          <span>Defensa</span>
          <span className="text-slate-800 font-bold">{unit.template.def}</span>
        </div>
        <div className="flex justify-between bg-[#f2e4c6] p-2 rounded border border-amber-700/30">
          <span>At.Esp</span>
          <span className="text-slate-800 font-bold">{unit.template.spa}</span>
        </div>
        <div className="flex justify-between bg-[#f2e4c6] p-2 rounded border border-amber-700/30">
          <span>Def.Esp</span>
          <span className="text-slate-800 font-bold">{unit.template.spd}</span>
        </div>
        <div className="flex justify-between bg-[#f2e4c6] p-2 rounded border border-amber-700/30">
          <span>Velocidad</span>
          <span className="text-slate-800 font-bold">{unit.template.spe}</span>
        </div>
        <div className="flex justify-between bg-[#f2e4c6] p-2 rounded border border-amber-700/30">
          <span>MOV</span>
          <span className="text-slate-800 font-bold">{unit.template.mov}</span>
        </div>
      </div>
    </div>
  );
}
