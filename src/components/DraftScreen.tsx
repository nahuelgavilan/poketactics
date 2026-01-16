import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Ban, Check, Clock, Swords, Shield, Heart, Footprints, X, Sparkles } from 'lucide-react';
import type { PokemonTemplate, Player } from '../types/game';
import type { DraftState } from '../types/draft';
import { DRAFT_CONFIG } from '../types/draft';
import { getBaseFormPokemon } from '../constants/evolution';
import { TYPE_COLORS } from '../constants/types';

interface DraftScreenProps {
  onDraftComplete: (p1Team: PokemonTemplate[], p2Team: PokemonTemplate[]) => void;
  onCancel: () => void;
}

// Generate random pool from base Pokemon
function generateDraftPool(): PokemonTemplate[] {
  const allBase = getBaseFormPokemon();
  const shuffled = [...allBase].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, DRAFT_CONFIG.POOL_SIZE);
}

// Snake draft order for picks
function generatePickOrder(): Player[] {
  return ['P1', 'P2', 'P2', 'P1', 'P1', 'P2'];
}

// Alternating ban order
function generateBanOrder(): Player[] {
  return ['P1', 'P2', 'P1', 'P2'];
}

export function DraftScreen({ onDraftComplete, onCancel }: DraftScreenProps) {
  const [draftState, setDraftState] = useState<DraftState>(() => ({
    phase: 'ban',
    pool: generateDraftPool(),
    bannedByP1: [],
    bannedByP2: [],
    pickedByP1: [],
    pickedByP2: [],
    currentPicker: 'P1',
    pickOrder: generatePickOrder(),
    currentPickIndex: 0,
    bansPerPlayer: DRAFT_CONFIG.BANS_PER_PLAYER,
    picksPerPlayer: DRAFT_CONFIG.PICKS_PER_PLAYER,
  }));

  const [timer, setTimer] = useState<number>(DRAFT_CONFIG.TIMER_SECONDS);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonTemplate | null>(null);
  const [lastAction, setLastAction] = useState<{ type: 'ban' | 'pick'; pokemon: PokemonTemplate; player: Player } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const banOrderRef = useRef(generateBanOrder());
  const banIndexRef = useRef(0);

  // Memoized values
  const allBannedIds = useMemo(() =>
    [...draftState.bannedByP1, ...draftState.bannedByP2],
    [draftState.bannedByP1, draftState.bannedByP2]
  );

  const allPickedIds = useMemo(() => [
    ...draftState.pickedByP1.map(p => p.id),
    ...draftState.pickedByP2.map(p => p.id)
  ], [draftState.pickedByP1, draftState.pickedByP2]);

  const isPokemonAvailable = useCallback((pokemon: PokemonTemplate) => {
    return !allBannedIds.includes(pokemon.id) && !allPickedIds.includes(pokemon.id);
  }, [allBannedIds, allPickedIds]);

  // Handle confirm selection
  const confirmSelection = useCallback(() => {
    if (!selectedPokemon || !isPokemonAvailable(selectedPokemon)) return;

    const { phase, currentPicker } = draftState;

    if (phase === 'ban') {
      const newState = { ...draftState };
      if (currentPicker === 'P1') {
        newState.bannedByP1 = [...newState.bannedByP1, selectedPokemon.id];
      } else {
        newState.bannedByP2 = [...newState.bannedByP2, selectedPokemon.id];
      }

      setLastAction({ type: 'ban', pokemon: selectedPokemon, player: currentPicker });

      banIndexRef.current++;
      if (banIndexRef.current >= banOrderRef.current.length) {
        newState.phase = 'pick';
        newState.currentPicker = 'P1';
        newState.currentPickIndex = 0;
      } else {
        newState.currentPicker = banOrderRef.current[banIndexRef.current];
      }

      setDraftState(newState);
      setSelectedPokemon(null);
      setTimer(DRAFT_CONFIG.TIMER_SECONDS);
    } else if (phase === 'pick') {
      const newState = { ...draftState };
      if (currentPicker === 'P1') {
        newState.pickedByP1 = [...newState.pickedByP1, selectedPokemon];
      } else {
        newState.pickedByP2 = [...newState.pickedByP2, selectedPokemon];
      }

      setLastAction({ type: 'pick', pokemon: selectedPokemon, player: currentPicker });

      newState.currentPickIndex++;
      if (newState.currentPickIndex >= newState.pickOrder.length) {
        newState.phase = 'ready';
        setDraftState(newState);
        setTimeout(() => {
          onDraftComplete(newState.pickedByP1, newState.pickedByP2);
        }, 2000);
      } else {
        newState.currentPicker = newState.pickOrder[newState.currentPickIndex];
        setDraftState(newState);
        setTimer(DRAFT_CONFIG.TIMER_SECONDS);
      }
      setSelectedPokemon(null);
    }
  }, [selectedPokemon, draftState, isPokemonAvailable, onDraftComplete]);

  // Auto-select on timeout
  const autoSelect = useCallback(() => {
    const available = draftState.pool.filter(p =>
      !allBannedIds.includes(p.id) && !allPickedIds.includes(p.id)
    );
    if (available.length > 0) {
      const randomPick = available[Math.floor(Math.random() * available.length)];
      setSelectedPokemon(randomPick);
      // Use setTimeout to confirm after setting
      setTimeout(() => {
        confirmSelection();
      }, 100);
    }
  }, [draftState.pool, allBannedIds, allPickedIds]);

  // Timer countdown
  useEffect(() => {
    if (draftState.phase === 'ready') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          autoSelect();
          return DRAFT_CONFIG.TIMER_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [draftState.phase, draftState.currentPicker, autoSelect]);

  // Clear last action after animation
  useEffect(() => {
    if (lastAction) {
      const timeout = setTimeout(() => setLastAction(null), 1500);
      return () => clearTimeout(timeout);
    }
  }, [lastAction]);

  const isP1Turn = draftState.currentPicker === 'P1';
  const currentAction = draftState.phase === 'ban' ? 'BANEAR' : 'ELEGIR';
  const totalBans = DRAFT_CONFIG.BANS_PER_PLAYER * 2;
  const currentBanCount = draftState.bannedByP1.length + draftState.bannedByP2.length;
  const totalPicks = DRAFT_CONFIG.PICKS_PER_PLAYER * 2;
  const currentPickCount = draftState.pickedByP1.length + draftState.pickedByP2.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-red-950/20" />
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-500/5 to-transparent" />
        {/* Center divider line */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-amber-500/30 to-transparent" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-3 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancelar</span>
          </button>

          {/* Center - Phase & Progress */}
          <div className="flex flex-col items-center">
            <div className={`
              flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm uppercase tracking-wider
              ${draftState.phase === 'ban'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : draftState.phase === 'pick'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }
            `}>
              {draftState.phase === 'ban' && <Ban className="w-4 h-4" />}
              {draftState.phase === 'pick' && <Check className="w-4 h-4" />}
              {draftState.phase === 'ready' && <Sparkles className="w-4 h-4" />}
              <span>
                {draftState.phase === 'ready'
                  ? '¡DRAFT COMPLETO!'
                  : draftState.phase === 'ban'
                  ? `Baneo ${currentBanCount + 1}/${totalBans}`
                  : `Pick ${currentPickCount + 1}/${totalPicks}`
                }
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-bold
            transition-all duration-300
            ${timer <= 5
              ? 'bg-red-500/30 text-red-400 border border-red-500/50 animate-pulse scale-110'
              : timer <= 10
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
            }
          `}>
            <Clock className="w-5 h-5" />
            <span className="w-8 text-center">{timer}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* P1 Side Panel */}
        <PlayerPanel
          player="P1"
          isActive={isP1Turn && draftState.phase !== 'ready'}
          banned={draftState.bannedByP1}
          picked={draftState.pickedByP1}
          pool={draftState.pool}
          phase={draftState.phase}
        />

        {/* Center - Pokemon Grid + Selection */}
        <div className="flex-1 flex flex-col min-h-0 px-2 py-3 lg:px-4">
          {/* Turn indicator */}
          {draftState.phase !== 'ready' && (
            <div className={`
              text-center py-3 mb-3 rounded-xl border backdrop-blur-sm
              transition-all duration-300
              ${isP1Turn
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
              }
            `}>
              <span className="text-lg font-bold">
                {isP1Turn ? 'JUGADOR 1' : 'JUGADOR 2'} - {currentAction}
              </span>
            </div>
          )}

          {/* Pokemon Grid */}
          <div className="flex-1 overflow-auto min-h-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3 p-1">
              {draftState.pool.map(pokemon => {
                const isAvailable = isPokemonAvailable(pokemon);
                const isBanned = allBannedIds.includes(pokemon.id);
                const isPicked = allPickedIds.includes(pokemon.id);
                const isSelected = selectedPokemon?.id === pokemon.id;

                return (
                  <button
                    key={pokemon.id}
                    onClick={() => isAvailable && draftState.phase !== 'ready' && setSelectedPokemon(pokemon)}
                    disabled={!isAvailable || draftState.phase === 'ready'}
                    className={`
                      group relative aspect-square rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? draftState.phase === 'ban'
                          ? 'border-red-500 bg-red-500/20 ring-2 ring-red-500/50 scale-105'
                          : 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50 scale-105'
                        : isAvailable
                        ? 'border-slate-700/50 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-700/30 hover:scale-102 cursor-pointer'
                        : 'border-slate-800/50 bg-slate-900/50 cursor-not-allowed'
                      }
                      ${isBanned ? 'border-red-900/50 bg-red-950/30' : ''}
                      ${isPicked ? 'border-slate-700/30 bg-slate-900/50' : ''}
                    `}
                  >
                    {/* Sprite */}
                    <div className="absolute inset-2 flex items-center justify-center">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                        className={`w-full h-full object-contain transition-all duration-200
                          ${!isAvailable ? 'grayscale opacity-40' : 'group-hover:scale-110'}
                        `}
                        alt={pokemon.name}
                      />
                    </div>

                    {/* Banned overlay */}
                    {isBanned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 rounded-xl">
                        <Ban className="w-12 h-12 text-red-500/80" />
                      </div>
                    )}

                    {/* Picked overlay */}
                    {isPicked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl">
                        <Check className="w-12 h-12 text-emerald-500/60" />
                      </div>
                    )}

                    {/* Name label */}
                    <div className="absolute bottom-1 inset-x-1">
                      <div className={`
                        text-[10px] font-bold text-center py-0.5 px-1 rounded
                        truncate backdrop-blur-sm
                        ${isAvailable ? 'bg-slate-900/80 text-slate-200' : 'bg-slate-900/60 text-slate-500'}
                      `}>
                        {pokemon.name}
                      </div>
                    </div>

                    {/* Type indicators */}
                    <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                      {pokemon.types.map(type => (
                        <div
                          key={type}
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: TYPE_COLORS[type] }}
                          title={type}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Preview & Confirm */}
          {selectedPokemon && draftState.phase !== 'ready' && (
            <div className={`
              mt-3 p-4 rounded-xl border-2 backdrop-blur-sm
              animate-slide-up
              ${draftState.phase === 'ban'
                ? 'bg-red-950/30 border-red-500/50'
                : 'bg-emerald-950/30 border-emerald-500/50'
              }
            `}>
              <div className="flex items-center gap-4">
                {/* Pokemon preview */}
                <div className="relative">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.id}.png`}
                    className="w-20 h-20 object-contain"
                    alt=""
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{selectedPokemon.name}</h3>
                  <div className="flex gap-2 mb-2">
                    {selectedPokemon.types.map(type => (
                      <span
                        key={type}
                        className="text-xs px-2 py-1 rounded-full font-bold uppercase"
                        style={{
                          backgroundColor: `${TYPE_COLORS[type]}30`,
                          color: TYPE_COLORS[type],
                          border: `1px solid ${TYPE_COLORS[type]}50`
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <StatBadge icon={Heart} value={selectedPokemon.hp} color="red" />
                    <StatBadge icon={Swords} value={selectedPokemon.atk} color="orange" />
                    <StatBadge icon={Shield} value={selectedPokemon.def} color="blue" />
                    <StatBadge icon={Footprints} value={selectedPokemon.mov} color="emerald" />
                  </div>
                </div>

                {/* Confirm button */}
                <button
                  onClick={confirmSelection}
                  className={`
                    px-6 py-3 rounded-xl font-bold text-white uppercase tracking-wider
                    transition-all duration-200 hover:scale-105 active:scale-95
                    ${draftState.phase === 'ban'
                      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/30'
                    }
                  `}
                >
                  {draftState.phase === 'ban' ? 'Banear' : 'Elegir'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* P2 Side Panel */}
        <PlayerPanel
          player="P2"
          isActive={!isP1Turn && draftState.phase !== 'ready'}
          banned={draftState.bannedByP2}
          picked={draftState.pickedByP2}
          pool={draftState.pool}
          phase={draftState.phase}
        />
      </main>

      {/* Last action notification */}
      {lastAction && (
        <div className={`
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
          px-8 py-6 rounded-2xl backdrop-blur-md
          animate-action-popup
          ${lastAction.type === 'ban'
            ? 'bg-red-950/90 border-2 border-red-500/50'
            : lastAction.player === 'P1'
            ? 'bg-blue-950/90 border-2 border-blue-500/50'
            : 'bg-red-950/90 border-2 border-red-500/50'
          }
        `}>
          <div className="flex items-center gap-4">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${lastAction.pokemon.id}.png`}
              className={`w-24 h-24 ${lastAction.type === 'ban' ? 'grayscale' : ''}`}
              alt=""
            />
            <div className="text-center">
              <div className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                lastAction.player === 'P1' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {lastAction.player === 'P1' ? 'Jugador 1' : 'Jugador 2'}
              </div>
              <div className={`text-2xl font-black uppercase ${
                lastAction.type === 'ban' ? 'text-red-400' : 'text-white'
              }`}>
                {lastAction.type === 'ban' ? 'BANEÓ' : 'ELIGIÓ'}
              </div>
              <div className="text-xl font-bold text-white mt-1">
                {lastAction.pokemon.name}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @keyframes action-popup {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          40% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
        .animate-action-popup {
          animation: action-popup 1.5s ease-out forwards;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}

// Player side panel component
interface PlayerPanelProps {
  player: Player;
  isActive: boolean;
  banned: number[];
  picked: PokemonTemplate[];
  pool: PokemonTemplate[];
  phase: string;
}

function PlayerPanel({ player, isActive, banned, picked, pool, phase }: PlayerPanelProps) {
  const isP1 = player === 'P1';
  const color = isP1 ? 'blue' : 'red';

  return (
    <div className={`
      w-full lg:w-56 p-3 lg:p-4 flex flex-row lg:flex-col gap-3
      ${isP1 ? 'lg:order-first' : 'lg:order-last'}
    `}>
      {/* Player header */}
      <div className={`
        p-3 rounded-xl border-2 transition-all duration-300
        ${isActive
          ? `bg-${color}-500/20 border-${color}-500/50 ring-2 ring-${color}-500/30`
          : 'bg-slate-900/50 border-slate-700/50'
        }
        ${isP1
          ? isActive ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30' : ''
          : isActive ? 'bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30' : ''
        }
      `}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-4 h-4 rounded-full ${isP1 ? 'bg-blue-500' : 'bg-red-500'} ${isActive ? 'animate-pulse' : ''}`} />
          <span className={`font-bold ${isP1 ? 'text-blue-400' : 'text-red-400'}`}>
            {isP1 ? 'JUGADOR 1' : 'JUGADOR 2'}
          </span>
        </div>

        {/* Bans */}
        <div className="mb-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Ban className="w-3 h-3" />
            Baneados
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: DRAFT_CONFIG.BANS_PER_PLAYER }).map((_, i) => {
              const bannedId = banned[i];
              const bannedPokemon = bannedId ? pool.find(p => p.id === bannedId) : null;
              return (
                <div
                  key={i}
                  className={`
                    w-11 h-11 rounded-lg border-2 flex items-center justify-center
                    transition-all duration-300
                    ${bannedPokemon
                      ? 'border-red-500/50 bg-red-950/50'
                      : 'border-slate-700/50 bg-slate-800/30 border-dashed'
                    }
                  `}
                >
                  {bannedPokemon ? (
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${bannedId}.png`}
                      className="w-full h-full object-contain grayscale opacity-60"
                      alt=""
                    />
                  ) : (
                    <Ban className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Picks */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Equipo
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: DRAFT_CONFIG.PICKS_PER_PLAYER }).map((_, i) => {
              const pickedPokemon = picked[i];
              return (
                <div
                  key={i}
                  className={`
                    w-14 h-14 rounded-lg border-2 flex items-center justify-center
                    transition-all duration-300
                    ${pickedPokemon
                      ? isP1
                        ? 'border-blue-500/50 bg-blue-950/30'
                        : 'border-red-500/50 bg-red-950/30'
                      : 'border-slate-700/50 bg-slate-800/30 border-dashed'
                    }
                    ${pickedPokemon && phase === 'ready' ? 'animate-pulse' : ''}
                  `}
                >
                  {pickedPokemon ? (
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pickedPokemon.id}.png`}
                      className="w-full h-full object-contain"
                      alt={pickedPokemon.name}
                    />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 border-dashed ${
                      isP1 ? 'border-blue-700/50' : 'border-red-700/50'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat badge component
function StatBadge({ icon: Icon, value, color }: { icon: React.ComponentType<{ className?: string }>; value: number; color: string }) {
  const colors: Record<string, string> = {
    red: 'text-red-400 bg-red-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors[color]}`}>
      <Icon className="w-4 h-4" />
      <span className="font-bold">{value}</span>
    </div>
  );
}
