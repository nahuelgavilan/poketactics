import React from 'react';
import { UnitInfo } from './UnitInfo';
import { BattleLog } from './BattleLog';
import type { Unit } from '../../types/game';

interface SidebarProps {
  selectedUnit: Unit | null;
  logs: string[];
  onEndTurn: () => void;
}

export function Sidebar({ selectedUnit, logs, onEndTurn }: SidebarProps) {
  return (
    <div className="w-full md:w-80 flex flex-col gap-4">
      <UnitInfo unit={selectedUnit} />

      <BattleLog logs={logs} onEndTurn={onEndTurn} />

      <button
        onClick={onEndTurn}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition-colors"
      >
        Pasar Turno
      </button>
    </div>
  );
}
