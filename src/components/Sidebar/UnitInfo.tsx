import React from 'react';
import { Sword, HandMetal } from 'lucide-react';
import { TYPE_COLORS } from '../../constants/types';
import type { Unit } from '../../types/game';

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

      {/* Move info */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sword size={16} className="text-orange-400" />
          <span className="font-bold text-sm">{unit.template.moveName}</span>
        </div>
        <div className="text-xs text-slate-400 flex justify-between">
          <span>Poder: {unit.template.atk}</span>
          <span>Rango: {unit.template.rng}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>MOV</span>
          <span className="text-white font-bold">{unit.template.mov}</span>
        </div>
        <div className="flex justify-between bg-slate-700/30 p-2 rounded">
          <span>DEF</span>
          <span className="text-white font-bold">{unit.template.def}</span>
        </div>
      </div>
    </div>
  );
}
