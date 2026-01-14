import { Swords, Clock, Target, X, Move } from 'lucide-react';

interface UnitActionMenuProps {
  canAttack: boolean;
  onAttack: () => void;
  onWait: () => void;
  onCancel: () => void;
  isMobile?: boolean;
}

/**
 * Floating action menu that appears when selecting a move destination
 * Shows available actions: Attack (if enemies in range), Wait, Cancel
 */
export function UnitActionMenu({
  canAttack,
  onAttack,
  onWait,
  onCancel,
  isMobile = false
}: UnitActionMenuProps) {
  const buttonBase = `
    flex items-center justify-center gap-2 px-4 py-2.5
    font-bold text-sm uppercase tracking-wide
    rounded-xl border-2 border-b-4
    transition-all duration-150
    active:border-b-2 active:translate-y-[2px]
    shadow-lg
    min-w-[140px]
  `;

  return (
    <div className="animate-scale-in flex flex-row gap-2">
      {/* Attack button - only show if enemies in range */}
      {canAttack && (
        <button
          onClick={onAttack}
          className={`
            ${buttonBase}
            bg-gradient-to-br from-red-500 to-red-700
            border-red-400 border-b-red-900
            text-white
            hover:from-red-400 hover:to-red-600
            hover:shadow-red-500/30
          `}
        >
          <Swords className="w-5 h-5" />
          <span>Atacar</span>
        </button>
      )}

      {/* Wait/Move button - confirms the move */}
      <button
        onClick={onWait}
        className={`
          ${buttonBase}
          bg-gradient-to-br from-blue-500 to-blue-700
          border-blue-400 border-b-blue-900
          text-white
          hover:from-blue-400 hover:to-blue-600
          hover:shadow-blue-500/30
        `}
      >
        <Move className="w-5 h-5" />
        <span>Mover</span>
      </button>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className={`
          ${buttonBase}
          bg-gradient-to-br from-slate-600 to-slate-800
          border-slate-500 border-b-slate-950
          text-slate-300
          hover:from-slate-500 hover:to-slate-700
        `}
      >
        <X className="w-5 h-5" />
        <span>Cancelar</span>
      </button>
    </div>
  );
}
