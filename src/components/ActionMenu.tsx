import React, { useEffect, useState } from 'react';
import { Move, Sword, Target, Clock, X, ChevronUp } from 'lucide-react';
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
  delay?: number;
}

function ActionButton({ icon: Icon, label, onClick, disabled, color, delay = 0 }: ActionButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    blue: {
      base: 'from-blue-500 to-blue-700 border-blue-400',
      hover: 'hover:from-blue-400 hover:to-blue-600 hover:shadow-blue-500/40',
      glow: 'shadow-blue-500/30',
      icon: 'text-blue-200'
    },
    red: {
      base: 'from-red-500 to-red-700 border-red-400',
      hover: 'hover:from-red-400 hover:to-red-600 hover:shadow-red-500/40',
      glow: 'shadow-red-500/30',
      icon: 'text-red-200'
    },
    green: {
      base: 'from-emerald-500 to-emerald-700 border-emerald-400',
      hover: 'hover:from-emerald-400 hover:to-emerald-600 hover:shadow-emerald-500/40',
      glow: 'shadow-emerald-500/30',
      icon: 'text-emerald-200'
    },
    amber: {
      base: 'from-amber-500 to-amber-700 border-amber-400',
      hover: 'hover:from-amber-400 hover:to-amber-600 hover:shadow-amber-500/40',
      glow: 'shadow-amber-500/30',
      icon: 'text-amber-200'
    }
  };

  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center gap-1
        w-16 h-16 sm:w-20 sm:h-20
        bg-gradient-to-b ${colors.base}
        border-2 border-b-4 rounded-2xl
        text-white font-bold text-xs uppercase tracking-wide
        transition-all duration-200
        ${!disabled ? colors.hover : ''}
        ${!disabled ? `shadow-lg ${colors.glow} hover:shadow-xl` : 'shadow-none'}
        disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale
        active:scale-90 active:border-b-2
        transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      style={{
        transition: `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, opacity 0.2s ease ${delay}ms, box-shadow 0.2s ease, background 0.2s ease`
      }}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
      </div>

      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${colors.icon} drop-shadow-sm`} />
      <span className="text-[10px] sm:text-xs drop-shadow-sm">{label}</span>

      {/* Pulse ring when not disabled */}
      {!disabled && (
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-white pointer-events-none" style={{ animationDuration: '2s' }} />
      )}
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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state.isOpen) {
      setIsAnimating(true);
    }
  }, [state.isOpen]);

  if (!state.isOpen || !selectedUnit) return null;

  // Calculate if unit has any meaningful actions left
  const hasActions = state.canMove || state.canAttack || state.canCapture;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Animated background gradient */}
      <div
        className={`
          absolute inset-0
          bg-gradient-to-t from-black/90 via-black/60 to-transparent
          transition-opacity duration-500
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Menu container */}
      <div
        className={`
          relative pointer-events-auto
          transform transition-all duration-500 ease-out
          ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="mx-auto max-w-lg px-3 pb-4 sm:pb-6">

          {/* Pull-up indicator */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600/50">
              <ChevronUp className="w-4 h-4 text-slate-400 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Selected unit badge with sprite */}
          <div className="flex items-center justify-center mb-3">
            <div
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full
                backdrop-blur-md shadow-lg
                transform transition-all duration-300 ease-out
                ${isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
                ${selectedUnit.owner === 'P1'
                  ? 'bg-blue-900/80 text-blue-200 border-2 border-blue-400/60 shadow-blue-500/20'
                  : 'bg-red-900/80 text-red-200 border-2 border-red-400/60 shadow-red-500/20'}
              `}
            >
              <span className="text-sm font-black uppercase tracking-wider">
                {selectedUnit.template.name}
              </span>
              {/* HP indicator */}
              <div className="flex items-center gap-1 text-xs opacity-75">
                <span className="text-green-400">{selectedUnit.currentHp}</span>
                <span>/</span>
                <span>{selectedUnit.template.hp}</span>
              </div>
            </div>
          </div>

          {/* Action buttons container */}
          <div
            className={`
              flex flex-col items-center gap-3
              bg-slate-900/95 backdrop-blur-xl
              rounded-3xl p-4 sm:p-5
              border border-slate-600/50
              shadow-2xl shadow-black/50
              transition-all duration-500
              ${isAnimating ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {/* Main action buttons */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <ActionButton
                icon={Move}
                label="Mover"
                onClick={onMove}
                disabled={!state.canMove}
                color="blue"
                delay={50}
              />
              <ActionButton
                icon={Sword}
                label="Atacar"
                onClick={onAttack}
                disabled={!state.canAttack}
                color="red"
                delay={100}
              />
              {state.canCapture && (
                <ActionButton
                  icon={Target}
                  label="Capturar"
                  onClick={onCapture}
                  color="green"
                  delay={150}
                />
              )}
              <ActionButton
                icon={Clock}
                label="Esperar"
                onClick={onWait}
                disabled={!state.canWait}
                color="amber"
                delay={200}
              />
            </div>

            {/* Hint text */}
            {!hasActions && (
              <p className="text-slate-500 text-xs text-center animate-pulse">
                Sin acciones disponibles - Pulsa Esperar para terminar
              </p>
            )}

            {/* Cancel button */}
            <button
              onClick={onCancel}
              className={`
                flex items-center justify-center gap-2
                px-6 py-2
                bg-slate-800/80 hover:bg-slate-700
                rounded-full
                border border-slate-600/50 hover:border-slate-500
                text-slate-400 hover:text-white
                text-sm font-medium
                transition-all duration-200
                transform hover:scale-105 active:scale-95
                ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
              `}
              style={{ transitionDelay: '250ms' }}
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
