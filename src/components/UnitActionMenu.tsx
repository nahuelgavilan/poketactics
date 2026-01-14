import { Swords, Clock, Target } from 'lucide-react';

interface UnitActionMenuProps {
  canAttack: boolean;
  onAttack: () => void;
  onWait: () => void;
  isMobile?: boolean;
}

/**
 * Floating action menu that appears after a unit moves
 * Shows available actions: Attack (if enemies in range), Wait
 */
export function UnitActionMenu({
  canAttack,
  onAttack,
  onWait,
  isMobile = false
}: UnitActionMenuProps) {
  const buttonBase = `
    flex items-center gap-2 px-4 py-2.5
    font-bold text-sm uppercase tracking-wide
    rounded-xl border-2 border-b-4
    transition-all duration-150
    active:border-b-2 active:translate-y-[2px]
    shadow-lg
  `;

  return (
    <div className="animate-scale-in flex flex-col gap-2">
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
          <Target className="w-4 h-4 opacity-60" />
        </button>
      )}

      {/* Wait button - always available */}
      <button
        onClick={onWait}
        className={`
          ${buttonBase}
          bg-gradient-to-br from-slate-500 to-slate-700
          border-slate-400 border-b-slate-900
          text-white
          hover:from-slate-400 hover:to-slate-600
        `}
      >
        <Clock className="w-5 h-5" />
        <span>Esperar</span>
      </button>
    </div>
  );
}
