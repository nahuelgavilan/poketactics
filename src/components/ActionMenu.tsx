import React from 'react';
import { Move, Sword, Target, Clock, X } from 'lucide-react';
import type { ActionMenuState, Unit } from '../types/game';

interface ActionMenuProps {
  state: ActionMenuState;
  selectedUnit: Unit | null;
  onMove: () => void;
  onAttack: () => void;
  onCapture: () => void;
  onWait: () => void;
  onCancel: () => void;
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color: 'blue' | 'red' | 'green' | 'gray' | 'amber';
}

function ActionButton({ icon: Icon, label, onClick, disabled, color }: ActionButtonProps) {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-400',
    red: 'from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-red-400',
    green: 'from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-emerald-400',
    gray: 'from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 border-slate-400',
    amber: 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-1 px-4 py-3 min-w-[72px]
        bg-gradient-to-b ${colorClasses[color]}
        border-2 border-b-4 rounded-xl
        text-white font-bold text-sm uppercase tracking-wide
        transition-all duration-150 active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        shadow-lg hover:shadow-xl
      `}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs">{label}</span>
    </button>
  );
}

export function ActionMenu({
  state,
  selectedUnit,
  onMove,
  onAttack,
  onCapture,
  onWait,
  onCancel
}: ActionMenuProps) {
  if (!state.isOpen || !selectedUnit) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Unit info bar */}
      <div className="relative pointer-events-auto">
        <div className="mx-auto max-w-lg px-4 pb-4">
          {/* Selected unit indicator */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className={`
              px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider
              ${selectedUnit.owner === 'P1'
                ? 'bg-blue-900/80 text-blue-300 border border-blue-500/50'
                : 'bg-red-900/80 text-red-300 border border-red-500/50'}
            `}>
              {selectedUnit.template.name}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 bg-slate-900/95 backdrop-blur-lg
                          rounded-2xl p-4 border border-slate-700/50 shadow-2xl">
            <ActionButton
              icon={Move}
              label="Mover"
              onClick={onMove}
              disabled={!state.canMove}
              color="blue"
            />
            <ActionButton
              icon={Sword}
              label="Atacar"
              onClick={onAttack}
              disabled={!state.canAttack}
              color="red"
            />
            {state.canCapture && (
              <ActionButton
                icon={Target}
                label="Capturar"
                onClick={onCapture}
                color="green"
              />
            )}
            <ActionButton
              icon={Clock}
              label="Esperar"
              onClick={onWait}
              disabled={!state.canWait}
              color="amber"
            />

            {/* Separator */}
            <div className="w-px h-12 bg-slate-600 mx-1" />

            {/* Cancel button */}
            <button
              onClick={onCancel}
              className="flex items-center justify-center w-10 h-10
                         bg-slate-800 hover:bg-slate-700 rounded-full
                         border border-slate-600 text-slate-400 hover:text-white
                         transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
