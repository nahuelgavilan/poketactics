import React from 'react';
import { Sprout } from 'lucide-react';

interface BattleLogProps {
  logs: string[];
  onEndTurn: () => void;
}

export function BattleLog({ logs, onEndTurn }: BattleLogProps) {
  return (
    <div className="bg-[#122226]/92 p-4 rounded-sm border-2 border-amber-700/60 shadow-[4px_4px_0_0_rgba(0,0,0,0.28)]">
      {/* Tall grass info */}
      <div className="flex items-center gap-2 mb-3">
        <Sprout className="text-emerald-300" size={16} />
        <h4 className="text-xs font-bold text-emerald-300 uppercase">
          Hierba Alta
        </h4>
      </div>

      <p className="text-xs text-amber-100/70 mb-2">
        Mueve una unidad a las casillas de hierba oscura para tener oportunidad de capturar refuerzos.
      </p>

      {/* Capture chance indicator */}
      <div className="h-1 w-full bg-[#20353a] rounded-full mb-3 overflow-hidden border border-black/25">
        <div className="h-full bg-emerald-500 w-1/3" />
      </div>

      {/* Battle log */}
      <h4 className="text-xs font-bold text-amber-100/80 uppercase mb-2">
        Registro de Batalla
      </h4>

      <div className="h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div
            key={i}
            className="text-xs text-amber-50/92 border-l-2 border-amber-600/65 pl-2 py-1"
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
