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
import { SHOWDOWN_SERVICE_ITEMS, getShowdownItemIconUrl } from '@poketactics/shared';
import { useSFX } from '../hooks/useSFX';
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
  creditsP1?: number;
  creditsP2?: number;
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
  gamePhase = 'SELECT',
  creditsP1 = 0,
  creditsP2 = 0
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { playSFX } = useSFX();

  const isMyTurn = !isMultiplayer || myPlayer === currentPlayer;
  const isBlue = currentPlayer === 'P1';
  const allMoved = movedCount === totalCount && totalCount > 0;
  const progress = totalCount > 0 ? (movedCount / totalCount) * 100 : 0;
  const activeCredits = currentPlayer === 'P1' ? creditsP1 : creditsP2;
  const creditIcon = getShowdownItemIconUrl(SHOWDOWN_SERVICE_ITEMS.credits.id);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (menuOpen) {
          playSFX('menu_close', 0.4);
        }
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, playSFX]);

  // Toggle menu with sound
  const toggleMenu = () => {
    if (!menuOpen) {
      playSFX('menu_open', 0.4);
    } else {
      playSFX('menu_close', 0.4);
    }
    setMenuOpen(!menuOpen);
  };

  // Close menu on action
  const handleAction = (action: () => void) => {
    playSFX('button_click', 0.5);
    setMenuOpen(false);
    action();
  };

  return (
    <header className="relative z-40 w-full shrink-0 safe-area-pt border-b border-slate-500/30 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.15),transparent)] opacity-30" />
      <div className="max-w-6xl mx-auto px-2 py-1.5 md:px-4 md:py-2.5 flex justify-between items-center gap-2">

        {/* Left: Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-display text-base md:text-xl tracking-[0.1em] flex items-center gap-1.5">
            <Swords className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0" />
            <span className="hidden sm:inline">
              <span className="text-slate-100">POKE</span>
              <span className="text-amber-300">TACTICS</span>
            </span>
            <span className="sm:hidden text-amber-300">PT</span>
          </h1>
        </div>

        {/* Center: Turn indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          {isMultiplayer && myPlayer ? (
            // Multiplayer
            <div
              className={`
                relative px-3 py-1 md:px-4 md:py-1.5 rounded-full font-display text-[10px] md:text-xs
                border-2 transition-all duration-300 uppercase tracking-wide
                ${isMyTurn
                  ? 'bg-emerald-600 border-emerald-300 text-white shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                  : 'bg-amber-600/85 border-amber-300 text-white'
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
                  relative px-2 py-1 md:px-3 md:py-1 rounded-full font-display text-[10px] md:text-xs
                  border-2 transition-all duration-200
                  ${currentPlayer === 'P1'
                    ? 'bg-blue-600 border-blue-300 text-white shadow-[0_0_12px_rgba(59,130,246,0.45)] scale-105'
                    : 'bg-slate-800 border-slate-600 text-slate-500 scale-95'
                  }
                `}
              >
                {currentPlayer === 'P1' && <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />}
                <span className="relative">P1</span>
              </div>

              <span className="font-display text-slate-500 text-[11px]">VS</span>

              {/* P2 */}
              <div
                className={`
                  relative px-2 py-1 md:px-3 md:py-1 rounded-full font-display text-[10px] md:text-xs
                  border-2 transition-all duration-200
                  ${currentPlayer === 'P2'
                    ? 'bg-red-600 border-red-300 text-white shadow-[0_0_12px_rgba(239,68,68,0.45)] scale-105'
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
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 rounded-full border border-slate-600/70">
              <Users className="w-3 h-3 text-slate-500" />
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    allMoved ? 'bg-emerald-500' : isBlue ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-data text-[9px] text-slate-300">{movedCount}/{totalCount}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 rounded-full border border-slate-600/70">
            <img src={creditIcon} alt="" className="w-3.5 h-3.5 object-contain" />
            <span className="font-data text-[10px] text-amber-300">{activeCredits}</span>
          </div>
        </div>

        {/* Right: Menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className={`
              p-2 rounded-xl transition-all duration-200
              ${menuOpen
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }
              border border-slate-600/80
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
              <div className="relative min-w-[200px] overflow-hidden rounded-xl border border-amber-300/55 bg-gradient-to-b from-slate-950/98 via-slate-900/98 to-slate-950/98 shadow-[0_18px_42px_rgba(0,0,0,0.55)]">
                {/* Inner border */}
                <div className="absolute inset-[4px] border border-amber-200/20 rounded-lg pointer-events-none" />

                {/* Title bar */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 px-3 py-2 border-b border-black/20 flex items-center justify-between shadow-[0_0_14px_rgba(251,191,36,0.35)]">
                  <span className="font-display text-[10px] uppercase tracking-[0.16em] text-slate-950">
                    Menú
                  </span>
                  {isMyTurn && gamePhase === 'SELECT' && (
                    <span className="font-data text-[10px] text-slate-900/85">
                      {movedCount}/{totalCount}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="p-2 flex flex-col gap-1.5">
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
                    <div className="h-px bg-slate-500/40 my-0.5" />
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
              <div className="absolute -top-2 right-3 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-amber-400" />
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
    default: 'bg-slate-900/85 text-slate-100 hover:bg-slate-800/95 border-slate-600/80',
    blue: 'bg-blue-900/45 text-blue-100 hover:bg-blue-800/55 border-blue-300/55',
    red: 'bg-red-900/45 text-red-100 hover:bg-red-800/55 border-red-300/55',
    success: 'bg-emerald-900/45 text-emerald-100 hover:bg-emerald-800/55 border-emerald-300/55'
  };

  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2 w-full
        px-3 py-2
        text-left border rounded-lg
        transition-all duration-75
        active:translate-y-[1px]
        animate-menu-item
        ${variantStyles[variant]}
        ${highlight ? 'ring-2 ring-amber-300/70 ring-offset-1 ring-offset-slate-900' : ''}
      `}
      style={{ animationDelay: `${delay * 30 + 50}ms` }}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <div className="font-display text-[10px] uppercase tracking-[0.11em]">{label}</div>
        {sublabel && (
          <div className="font-ui text-[11px] font-medium normal-case tracking-normal opacity-80 mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
      <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
