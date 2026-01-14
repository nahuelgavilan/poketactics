import { Swords, Hand, Undo2 } from 'lucide-react';
import { BOARD_WIDTH } from '../constants/board';

interface UnitActionMenuProps {
  canAttack: boolean;
  onAttack: () => void;
  onWait: () => void;
  onCancel: () => void;
  /** Grid position where menu should appear (pendingPosition) */
  gridX: number;
  gridY: number;
}

/**
 * Fire Emblem style contextual action menu
 * - Appears next to the unit's destination tile
 * - Vertical stacking like classic tactical RPGs
 * - Pixel-art inspired borders with notch pointing to tile
 * - Smart positioning: flips based on screen edges
 */
export function UnitActionMenu({
  canAttack,
  onAttack,
  onWait,
  onCancel,
  gridX,
  gridY
}: UnitActionMenuProps) {
  // Determine menu position relative to tile
  // If unit is on right half of board, menu goes LEFT; otherwise RIGHT
  const menuOnLeft = gridX >= BOARD_WIDTH / 2;

  // If unit is near bottom, we might need to adjust vertical position
  // For now, menu appears centered vertically on the tile

  // Calculate CSS position
  // Menu is absolutely positioned relative to the tile container
  const positionStyle: React.CSSProperties = menuOnLeft
    ? { right: '100%', marginRight: '8px' }
    : { left: '100%', marginLeft: '8px' };

  // Notch/pointer direction
  const notchDirection = menuOnLeft ? 'right' : 'left';

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 z-50 animate-menu-pop"
      style={positionStyle}
    >
      {/* Menu container with pixel-art border */}
      <div className="relative">
        {/* Notch pointing to tile */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-0 h-0
            ${notchDirection === 'right'
              ? 'right-[-8px] border-l-[8px] border-l-amber-900 border-y-[8px] border-y-transparent'
              : 'left-[-8px] border-r-[8px] border-r-amber-900 border-y-[8px] border-y-transparent'
            }
          `}
        />

        {/* Inner notch (lighter) */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-0 h-0 z-10
            ${notchDirection === 'right'
              ? 'right-[-6px] border-l-[6px] border-l-amber-100 border-y-[6px] border-y-transparent'
              : 'left-[-6px] border-r-[6px] border-r-amber-100 border-y-[6px] border-y-transparent'
            }
          `}
        />

        {/* Main menu box */}
        <div className="
          relative
          bg-gradient-to-b from-amber-50 to-amber-100
          border-[3px] border-amber-900
          rounded-sm
          shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
          overflow-hidden
          min-w-[100px]
        ">
          {/* Inner border effect */}
          <div className="absolute inset-[2px] border border-amber-300 rounded-sm pointer-events-none" />

          {/* Title bar - like Fire Emblem */}
          <div className="
            bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700
            px-3 py-1
            border-b-2 border-amber-900
          ">
            <span className="
              text-[10px] font-bold uppercase tracking-widest
              text-amber-100
              drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]
            ">
              Acción
            </span>
          </div>

          {/* Menu options */}
          <div className="p-1 flex flex-col gap-0.5">
            {/* Attack option - only if enemies in range */}
            {canAttack && (
              <MenuButton
                onClick={onAttack}
                icon={<Swords className="w-4 h-4" />}
                label="Atacar"
                color="red"
                delay={0}
              />
            )}

            {/* Wait/Confirm option */}
            <MenuButton
              onClick={onWait}
              icon={<Hand className="w-4 h-4" />}
              label="Esperar"
              color="green"
              delay={canAttack ? 1 : 0}
            />

            {/* Cancel option */}
            <MenuButton
              onClick={onCancel}
              icon={<Undo2 className="w-4 h-4" />}
              label="Cancelar"
              color="gray"
              delay={canAttack ? 2 : 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MenuButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'red' | 'green' | 'gray';
  delay: number;
}

function MenuButton({ onClick, icon, label, color, delay }: MenuButtonProps) {
  const colorStyles = {
    red: `
      bg-gradient-to-r from-red-100 to-red-50
      hover:from-red-200 hover:to-red-100
      active:from-red-300 active:to-red-200
      text-red-900
      border-red-300
    `,
    green: `
      bg-gradient-to-r from-emerald-100 to-emerald-50
      hover:from-emerald-200 hover:to-emerald-100
      active:from-emerald-300 active:to-emerald-200
      text-emerald-900
      border-emerald-300
    `,
    gray: `
      bg-gradient-to-r from-slate-100 to-slate-50
      hover:from-slate-200 hover:to-slate-100
      active:from-slate-300 active:to-slate-200
      text-slate-700
      border-slate-300
    `
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 w-full
        px-3 py-2
        text-left text-xs font-bold uppercase tracking-wide
        border rounded-sm
        transition-all duration-75
        active:translate-y-[1px]
        animate-menu-item-slide
        ${colorStyles[color]}
      `}
      style={{
        animationDelay: `${delay * 50}ms`
      }}
    >
      {icon}
      <span className="drop-shadow-[0.5px_0.5px_0_rgba(255,255,255,0.8)]">
        {label}
      </span>
    </button>
  );
}
