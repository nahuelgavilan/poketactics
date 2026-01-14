import { useState, useRef, useEffect } from 'react';
import {
  Swords,
  Menu,
  X,
  Flag,
  RotateCcw,
  HelpCircle,
  Home,
  Users,
  ChevronRight
} from 'lucide-react';
import type { Player } from '../types/game';

interface HeaderProps {
  currentPlayer: Player;
  onRestart: () => void;
  onMenu?: () => void;
  onEndTurn?: () => void;
  onHowToPlay?: () => void;
  myPlayer?: Player | null;
  isMultiplayer?: boolean;
  movedCount?: number;
  totalCount?: number;
  gamePhase?: string;
}

/**
 * Game Header - Fire Emblem / GBA style
 * Compact header with turn info + dropdown menu for all actions
 */
export function Header({
  currentPlayer,
  onRestart,
  onMenu,
  onEndTurn,
  onHowToPlay,
  myPlayer,
  isMultiplayer,
  movedCount = 0,
  totalCount = 0,
  gamePhase = 'SELECT'
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMyTurn = !isMultiplayer || myPlayer === currentPlayer;
  const isBlue = currentPlayer === 'P1';
  const allMoved = movedCount === totalCount && totalCount > 0;
  const progress = totalCount > 0 ? (movedCount / totalCount) * 100 : 0;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on action
  const handleAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="w-full bg-slate-900 border-b-2 border-slate-700 shadow-lg z-40 safe-area-pt shrink-0">
      <div className="max-w-5xl mx-auto px-2 py-1.5 md:px-4 md:py-2 flex justify-between items-center gap-2">

        {/* Left: Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm md:text-lg font-black italic tracking-tight flex items-center gap-1.5">
            <Swords className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0" />
            <span className="hidden sm:inline">
              <span className="text-white">POKÉ</span>
              <span className="text-amber-400">TACTICS</span>
            </span>
            <span className="sm:hidden text-amber-400">PT</span>
          </h1>
        </div>

        {/* Center: Turn indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          {isMultiplayer && myPlayer ? (
            // Multiplayer
            <div
              className={`
                relative px-3 py-1 md:px-4 md:py-1.5 rounded-full font-bold text-[10px] md:text-xs
                border-2 transition-all duration-300 uppercase tracking-wide
                ${isMyTurn
                  ? 'bg-green-600 border-green-400 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                  : 'bg-amber-600/80 border-amber-500 text-white'
                }
              `}
            >
              {isMyTurn && <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />}
              <span className="relative">{isMyTurn ? '¡Tu turno!' : 'Esperando...'}</span>
            </div>
          ) : (
            // Local game - P1 vs P2
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* P1 */}
              <div
                className={`
                  relative px-2 py-1 md:px-3 md:py-1 rounded-full font-bold text-[10px] md:text-xs
                  border-2 transition-all duration-200
                  ${currentPlayer === 'P1'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] scale-105'
                    : 'bg-slate-800 border-slate-600 text-slate-500 scale-95'
                  }
                `}
              >
                {currentPlayer === 'P1' && <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />}
                <span className="relative">P1</span>
              </div>

              <span className="text-slate-600 text-[10px] font-bold">VS</span>

              {/* P2 */}
              <div
                className={`
                  relative px-2 py-1 md:px-3 md:py-1 rounded-full font-bold text-[10px] md:text-xs
                  border-2 transition-all duration-200
                  ${currentPlayer === 'P2'
                    ? 'bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-105'
                    : 'bg-slate-800 border-slate-600 text-slate-500 scale-95'
                  }
                `}
              >
                {currentPlayer === 'P2' && <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />}
                <span className="relative">P2</span>
              </div>
            </div>
          )}

          {/* Progress mini-bar (only during SELECT and your turn) */}
          {isMyTurn && gamePhase === 'SELECT' && totalCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Users className="w-3 h-3 text-slate-500" />
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    allMoved ? 'bg-emerald-500' : isBlue ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-mono">{movedCount}/{totalCount}</span>
            </div>
          )}
        </div>

        {/* Right: Menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${menuOpen
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              }
              border border-slate-700
            `}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Dropdown Menu - GBA Style */}
          {menuOpen && (
            <div className="
              absolute top-full right-0 mt-2
              animate-dropdown origin-top-right
              z-50
            ">
              {/* Menu container */}
              <div className="
                relative
                bg-gradient-to-b from-amber-50 to-amber-100
                border-[3px] border-amber-900
                rounded-sm
                shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]
                overflow-hidden
                min-w-[180px]
              ">
                {/* Inner border */}
                <div className="absolute inset-[2px] border border-amber-300 rounded-sm pointer-events-none" />

                {/* Title bar */}
                <div className="
                  bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700
                  px-3 py-1.5
                  border-b-2 border-amber-900
                  flex items-center justify-between
                ">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-100 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
                    Menú
                  </span>
                  {isMyTurn && gamePhase === 'SELECT' && (
                    <span className="text-[9px] font-bold text-amber-200">
                      {movedCount}/{totalCount}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="p-1.5 flex flex-col gap-1">
                  {/* End Turn - Primary action when it's your turn */}
                  {isMyTurn && onEndTurn && gamePhase === 'SELECT' && (
                    <MenuItem
                      icon={<Flag className="w-4 h-4" />}
                      label={allMoved ? "¡Terminar Turno!" : "Terminar Turno"}
                      sublabel={`${movedCount} de ${totalCount} movidos`}
                      onClick={() => handleAction(onEndTurn)}
                      variant={allMoved ? 'success' : isBlue ? 'blue' : 'red'}
                      highlight
                      delay={0}
                    />
                  )}

                  {/* Separator if end turn shown */}
                  {isMyTurn && onEndTurn && gamePhase === 'SELECT' && (
                    <div className="h-px bg-amber-300 my-1" />
                  )}

                  {/* How to Play */}
                  {onHowToPlay && (
                    <MenuItem
                      icon={<HelpCircle className="w-4 h-4" />}
                      label="Cómo Jugar"
                      onClick={() => handleAction(onHowToPlay)}
                      variant="default"
                      delay={1}
                    />
                  )}

                  {/* Restart */}
                  <MenuItem
                    icon={<RotateCcw className="w-4 h-4" />}
                    label="Reiniciar"
                    onClick={() => handleAction(onRestart)}
                    variant="default"
                    delay={2}
                  />

                  {/* Back to Menu */}
                  {onMenu && (
                    <MenuItem
                      icon={<Home className="w-4 h-4" />}
                      label="Menú Principal"
                      onClick={() => handleAction(onMenu)}
                      variant="default"
                      delay={3}
                    />
                  )}
                </div>
              </div>

              {/* Notch pointing up */}
              <div className="absolute -top-2 right-3 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-amber-900" />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar under header (mobile, during your turn) */}
      {isMyTurn && gamePhase === 'SELECT' && totalCount > 0 && (
        <div className="md:hidden h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              allMoved ? 'bg-emerald-500' : isBlue ? 'bg-blue-500' : 'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <style>{`
        .safe-area-pt { padding-top: env(safe-area-inset-top); }

        /* Smooth dropdown animation */
        @keyframes dropdown-enter {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-dropdown {
          animation: dropdown-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Staggered menu items */
        @keyframes menu-item-enter {
          0% {
            opacity: 0;
            transform: translateX(-6px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-menu-item {
          opacity: 0;
          animation: menu-item-enter 0.15s ease-out forwards;
        }
      `}</style>
    </header>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant: 'default' | 'blue' | 'red' | 'success';
  highlight?: boolean;
  delay?: number;
}

function MenuItem({ icon, label, sublabel, onClick, variant, highlight, delay = 0 }: MenuItemProps) {
  const variantStyles = {
    default: 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 border-slate-300',
    blue: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 hover:from-blue-200 hover:to-blue-100 border-blue-300',
    red: 'bg-gradient-to-r from-red-100 to-red-50 text-red-900 hover:from-red-200 hover:to-red-100 border-red-300',
    success: 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-900 hover:from-emerald-200 hover:to-emerald-100 border-emerald-300'
  };

  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2 w-full
        px-3 py-2
        text-left text-xs font-bold uppercase tracking-wide
        border rounded-sm
        transition-all duration-75
        active:translate-y-[1px]
        animate-menu-item
        ${variantStyles[variant]}
        ${highlight ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-amber-100' : ''}
      `}
      style={{ animationDelay: `${delay * 30 + 50}ms` }}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <div className="drop-shadow-[0.5px_0.5px_0_rgba(255,255,255,0.8)]">{label}</div>
        {sublabel && (
          <div className="text-[9px] font-normal normal-case tracking-normal opacity-70 mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
      <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
