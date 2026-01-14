import { Swords, Check, X } from 'lucide-react';

interface UnitActionMenuProps {
  canAttack: boolean;
  onAttack: () => void;
  onWait: () => void;
  onCancel: () => void;
  isMobile?: boolean;
}

/**
 * Compact action menu - icons on mobile, icons+text on desktop
 */
export function UnitActionMenu({
  canAttack,
  onAttack,
  onWait,
  onCancel,
  isMobile = false
}: UnitActionMenuProps) {
  // Compact button style
  const buttonBase = `
    flex items-center justify-center gap-1.5
    font-bold text-xs uppercase tracking-wide
    rounded-lg border-2 border-b-3
    transition-all duration-100
    active:border-b-2 active:translate-y-[1px]
    shadow-md
  `;

  // Size based on device
  const buttonSize = isMobile ? 'w-11 h-11' : 'px-3 py-2';

  return (
    <div className="flex flex-row gap-1.5">
      {/* Attack button - only show if enemies in range */}
      {canAttack && (
        <button
          onClick={onAttack}
          className={`
            ${buttonBase} ${buttonSize}
            bg-gradient-to-br from-red-500 to-red-600
            border-red-400 border-b-red-800
            text-white
            hover:from-red-400 hover:to-red-500
          `}
          title="Atacar"
        >
          <Swords className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
          {!isMobile && <span>Atacar</span>}
        </button>
      )}

      {/* Confirm move button */}
      <button
        onClick={onWait}
        className={`
          ${buttonBase} ${buttonSize}
          bg-gradient-to-br from-emerald-500 to-emerald-600
          border-emerald-400 border-b-emerald-800
          text-white
          hover:from-emerald-400 hover:to-emerald-500
        `}
        title="Confirmar"
      >
        <Check className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={3} />
        {!isMobile && <span>OK</span>}
      </button>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className={`
          ${buttonBase} ${buttonSize}
          bg-gradient-to-br from-slate-500 to-slate-600
          border-slate-400 border-b-slate-800
          text-white
          hover:from-slate-400 hover:to-slate-500
        `}
        title="Cancelar"
      >
        <X className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={3} />
        {!isMobile && <span>No</span>}
      </button>
    </div>
  );
}
