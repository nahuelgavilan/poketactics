import { useEffect, useState } from 'react';
import { Move, Sword, Target, Clock, X } from 'lucide-react';
import type { ActionMenuState, Unit } from '../types/game';
import { getStaticSprite } from '../utils/sprites';

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
      edge: 'border-sky-400/80',
      accent: 'bg-sky-500',
      iconPlate: 'bg-sky-100 border-sky-300 text-sky-900',
      text: 'text-sky-950',
      hover: 'hover:from-[#f8efd4] hover:to-[#ecddba]'
    },
    red: {
      edge: 'border-rose-400/80',
      accent: 'bg-rose-500',
      iconPlate: 'bg-rose-100 border-rose-300 text-rose-900',
      text: 'text-rose-950',
      hover: 'hover:from-[#f8efd4] hover:to-[#ecddba]'
    },
    green: {
      edge: 'border-emerald-500/80',
      accent: 'bg-emerald-600',
      iconPlate: 'bg-emerald-100 border-emerald-300 text-emerald-900',
      text: 'text-emerald-950',
      hover: 'hover:from-[#f8efd4] hover:to-[#ecddba]'
    },
    amber: {
      edge: 'border-amber-600/80',
      accent: 'bg-amber-500',
      iconPlate: 'bg-amber-100 border-amber-300 text-amber-900',
      text: 'text-amber-950',
      hover: 'hover:from-[#f8efd4] hover:to-[#ecddba]'
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
        group relative flex items-center justify-center gap-2
        px-3 py-2.5 min-w-[78px]
        bg-gradient-to-b from-[#f3e7c6] to-[#e2d2ab] ${style.hover}
        border-[2px] border-b-[4px] rounded-sm ${style.edge}
        text-xs font-bold uppercase tracking-wide ${style.text}
        transition-all duration-200
        disabled:opacity-25 disabled:grayscale disabled:cursor-not-allowed disabled:scale-95
        active:translate-y-[1px] active:border-b-[3px]
        shadow-[0_4px_0_0_rgba(0,0,0,0.24)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.24)]
      `}
    >
      <span className="pointer-events-none absolute inset-[1px] border border-amber-300/80 rounded-[2px]" />
      <span className={`pointer-events-none absolute left-1 top-1 bottom-1 w-1 rounded-sm ${style.accent}`} />
      <span className={`relative w-5 h-5 rounded-sm border flex items-center justify-center ${style.iconPlate}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
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
          w-[calc(100vw-1rem)] max-w-[680px]
          flex items-center gap-2 sm:gap-3
          px-2.5 py-2.5 sm:px-3 sm:py-3 rounded-sm
          ui-frame-light ui-inner-outline
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
        `}
      >
        {/* Unit name badge with sprite */}
        <div className={`
          relative flex items-center gap-2 px-2 py-1 rounded-sm text-xs font-bold
          ${selectedUnit.owner === 'P1'
            ? 'bg-sky-100 text-sky-900 border border-sky-500/45'
            : 'bg-rose-100 text-rose-900 border border-rose-500/45'}
        `}>
          <img
            src={getStaticSprite(selectedUnit.template.id)}
            className="w-5 h-5 object-contain"
            style={{ imageRendering: 'pixelated' }}
            alt=""
          />
          <span>{selectedUnit.template.name}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-700/70 to-transparent" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-1 justify-center">
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
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-700/70 to-transparent" />

        {/* Cancel */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="
            relative p-2 rounded-sm
            ui-plate
            border-slate-500/70
            bg-gradient-to-b from-slate-100 to-slate-200 hover:from-slate-50 hover:to-slate-100
            text-slate-700
            transition-all duration-200
            active:translate-y-[1px] active:border-b-[3px]
          "
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
