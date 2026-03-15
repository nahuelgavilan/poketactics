import React from 'react';
import { Sprout } from 'lucide-react';

interface BattleLogProps {
  logs: string[];
  onEndTurn: () => void;
}

export function BattleLog({ logs, onEndTurn: _onEndTurn }: BattleLogProps) {
  return (
    <div className="bg-[#f8efd9] p-4 rounded-sm border-2 border-amber-700/60 shadow-[3px_3px_0_0_rgba(92,66,34,0.2)]">
      {/* Tall grass info */}
      <div className="flex items-center gap-2 mb-3">
        <Sprout className="text-emerald-700" size={16} />
        <h4 className="text-xs font-bold text-emerald-700 uppercase">
          Hierba Alta
        </h4>
      </div>

      <p className="text-xs text-slate-700 mb-2">
        Mueve una unidad a las casillas de hierba oscura para tener oportunidad de capturar refuerzos.
      </p>

      {/* Capture chance indicator */}
      <div className="h-1 w-full bg-[#dac6a3] rounded-full mb-3 overflow-hidden border border-amber-700/30">
        <div className="h-full bg-emerald-500 w-1/3" />
      </div>

      {/* Battle log */}
      <h4 className="text-xs font-bold text-amber-900 uppercase mb-2">
        Registro de Batalla
      </h4>

      <div className="h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div
            key={i}
            className="text-xs text-slate-800 border-l-2 border-amber-600/65 pl-2 py-1"
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
