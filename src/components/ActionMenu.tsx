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
    blue: {
      base: 'from-blue-600 to-blue-700 border-blue-400/50 shadow-blue-500/40',
      hover: 'hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/60',
      glow: 'bg-blue-500'
    },
    red: {
      base: 'from-red-600 to-red-700 border-red-400/50 shadow-red-500/40',
      hover: 'hover:from-red-500 hover:to-red-600 hover:shadow-red-500/60',
      glow: 'bg-red-500'
    },
    green: {
      base: 'from-emerald-600 to-emerald-700 border-emerald-400/50 shadow-emerald-500/40',
      hover: 'hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-500/60',
      glow: 'bg-emerald-500'
    },
    amber: {
      base: 'from-amber-600 to-amber-700 border-amber-400/50 shadow-amber-500/40',
      hover: 'hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/60',
      glow: 'bg-amber-500'
    }
  };

  const style = colorStyles[color];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-1.5
        px-3 py-2.5 min-w-[72px]
        bg-gradient-to-b ${style.base} ${style.hover}
        border-b-2 rounded-xl
        text-white text-xs font-bold uppercase tracking-wide
        transition-all duration-200
        disabled:opacity-25 disabled:grayscale disabled:cursor-not-allowed disabled:scale-95
        active:scale-90 active:border-b-0
        shadow-lg hover:shadow-xl hover:scale-105
      `}
    >
      {/* Glow effect on hover */}
      <div className={`
        absolute inset-0 rounded-xl ${style.glow} opacity-0 blur-md
        group-hover:opacity-30 transition-opacity duration-200
      `} />
      <Icon className="relative w-4 h-4 group-hover:scale-110 transition-transform" />
      <span className="relative">{label}</span>
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
          flex items-center gap-3
          bg-slate-950/95 backdrop-blur-xl
          px-4 py-3 rounded-2xl
          border border-slate-700/60
          shadow-2xl shadow-black/60
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
        `}
      >
        {/* Background glow */}
        <div className={`
          absolute inset-0 rounded-2xl blur-2xl opacity-20
          ${selectedUnit.owner === 'P1' ? 'bg-blue-600' : 'bg-red-600'}
        `} />

        {/* Unit name badge with sprite */}
        <div className={`
          relative flex items-center gap-2 px-2 py-1 rounded-xl text-xs font-bold
          ${selectedUnit.owner === 'P1'
            ? 'bg-blue-950/80 text-blue-200 border border-blue-800/50'
            : 'bg-red-950/80 text-red-200 border border-red-800/50'}
        `}>
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedUnit.template.id}.png`}
            className="w-5 h-5 object-contain"
            style={{ imageRendering: 'pixelated' }}
            alt=""
          />
          <span>{selectedUnit.template.name}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

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
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

        {/* Cancel */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="
            relative p-2 rounded-xl
            bg-slate-800/80 hover:bg-slate-700
            text-slate-400 hover:text-white
            transition-all duration-200
            hover:scale-110 active:scale-95
          "
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
