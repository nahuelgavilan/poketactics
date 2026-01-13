import React from 'react';
import { Sprout } from 'lucide-react';

interface BattleLogProps {
  logs: string[];
  onEndTurn: () => void;
}

export function BattleLog({ logs, onEndTurn }: BattleLogProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      {/* Tall grass info */}
      <div className="flex items-center gap-2 mb-3">
        <Sprout className="text-teal-400" size={16} />
        <h4 className="text-xs font-bold text-teal-400 uppercase">
          Hierba Alta
        </h4>
      </div>

      <p className="text-xs text-slate-400 mb-2">
        Mueve una unidad a las casillas de hierba oscura para tener oportunidad de capturar refuerzos.
      </p>

      {/* Capture chance indicator */}
      <div className="h-1 w-full bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-teal-500 w-1/3" />
      </div>

      {/* Battle log */}
      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
        Registro de Batalla
      </h4>

      <div className="h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div
            key={i}
            className="text-xs text-slate-300 border-l-2 border-slate-600 pl-2 py-1"
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
