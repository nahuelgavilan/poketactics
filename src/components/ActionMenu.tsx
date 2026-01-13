import { useEffect, useState } from 'react';
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
  color: 'blue' | 'red' | 'green' | 'amber';
}

function ActionButton({ icon: Icon, label, onClick, disabled, color }: ActionButtonProps) {
  const colorStyles = {
    blue: 'bg-blue-600 hover:bg-blue-500 border-blue-400 shadow-blue-500/30',
    red: 'bg-red-600 hover:bg-red-500 border-red-400 shadow-red-500/30',
    green: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 shadow-emerald-500/30',
    amber: 'bg-amber-600 hover:bg-amber-500 border-amber-400 shadow-amber-500/30'
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-1.5
        px-3 py-2 min-w-[70px]
        ${colorStyles[color]}
        border-b-2 rounded-lg
        text-white text-xs font-bold uppercase
        transition-all duration-150
        disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed
        active:scale-95 active:border-b-0
        shadow-lg
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (state.isOpen) {
      // Small delay for smooth entrance
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [state.isOpen]);

  if (!state.isOpen || !selectedUnit) return null;

  return (
    <>
      {/* Backdrop - click to cancel */}
      <div
        className="fixed inset-0 z-30"
        onClick={onCancel}
      />

      {/* Compact floating menu - positioned at bottom, doesn't push content */}
      <div
        className={`
          fixed bottom-4 left-1/2 -translate-x-1/2 z-40
          flex items-center gap-2
          bg-slate-900/95 backdrop-blur-md
          px-3 py-2 rounded-2xl
          border border-slate-700/80
          shadow-2xl shadow-black/50
          transition-all duration-200
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        {/* Unit name badge */}
        <div className={`
          px-2 py-1 rounded-lg text-xs font-bold
          ${selectedUnit.owner === 'P1'
            ? 'bg-blue-900/80 text-blue-300'
            : 'bg-red-900/80 text-red-300'}
        `}>
          {selectedUnit.template.name}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
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
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Cancel */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
