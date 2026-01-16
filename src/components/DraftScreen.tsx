import { useState, useEffect, useRef, useCallback } from 'react';
import { Ban, Check, Clock, Swords, Shield, Heart, Move } from 'lucide-react';
import type { PokemonTemplate, Player } from '../types/game';
import type { DraftState, DraftPhase } from '../types/draft';
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
  // Shuffle and take POOL_SIZE
  const shuffled = [...allBase].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, DRAFT_CONFIG.POOL_SIZE);
}

// Snake draft order: P1, P2, P2, P1, P1, P2 for 3 picks each
function generatePickOrder(): Player[] {
  // Ban phase: P1, P2, P1, P2 (alternating)
  // Pick phase: P1, P2, P2, P1, P1, P2 (snake draft)
  return ['P1', 'P2', 'P2', 'P1', 'P1', 'P2'];
}

// Ban order is simple alternating
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
  const [hoveredPokemon, setHoveredPokemon] = useState<PokemonTemplate | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const banOrderRef = useRef(generateBanOrder());
  const banIndexRef = useRef(0);

  // Get all banned Pokemon IDs
  const allBannedIds = [...draftState.bannedByP1, ...draftState.bannedByP2];
  const allPickedIds = [
    ...draftState.pickedByP1.map(p => p.id),
    ...draftState.pickedByP2.map(p => p.id)
  ];

  // Check if Pokemon is available (not banned, not picked)
  const isPokemonAvailable = (pokemon: PokemonTemplate) => {
    return !allBannedIds.includes(pokemon.id) && !allPickedIds.includes(pokemon.id);
  };

  // Handle ban/pick selection
  const handleSelect = useCallback((pokemon: PokemonTemplate) => {
    if (!isPokemonAvailable(pokemon)) return;

    const { phase, currentPicker, pickedByP1, pickedByP2 } = draftState;

    if (phase === 'ban') {
      // Ban phase
      const newState = { ...draftState };
      if (currentPicker === 'P1') {
        newState.bannedByP1 = [...newState.bannedByP1, pokemon.id];
      } else {
        newState.bannedByP2 = [...newState.bannedByP2, pokemon.id];
      }

      // Move to next ban or switch to pick phase
      banIndexRef.current++;
      if (banIndexRef.current >= banOrderRef.current.length) {
        // All bans done, switch to pick phase
        newState.phase = 'pick';
        newState.currentPicker = 'P1';
        newState.currentPickIndex = 0;
      } else {
        newState.currentPicker = banOrderRef.current[banIndexRef.current];
      }

      setDraftState(newState);
      setTimer(DRAFT_CONFIG.TIMER_SECONDS);
    } else if (phase === 'pick') {
      // Pick phase
      const newState = { ...draftState };
      if (currentPicker === 'P1') {
        newState.pickedByP1 = [...newState.pickedByP1, pokemon];
      } else {
        newState.pickedByP2 = [...newState.pickedByP2, pokemon];
      }

      // Move to next pick or finish
      newState.currentPickIndex++;
      if (newState.currentPickIndex >= newState.pickOrder.length) {
        // Draft complete
        newState.phase = 'ready';
        setDraftState(newState);
        // Delay to show ready state, then complete
        setTimeout(() => {
          onDraftComplete(newState.pickedByP1, newState.pickedByP2);
        }, 1500);
      } else {
        newState.currentPicker = newState.pickOrder[newState.currentPickIndex];
        setDraftState(newState);
        setTimer(DRAFT_CONFIG.TIMER_SECONDS);
      }
    }
  }, [draftState, onDraftComplete]);

  // Timer countdown
  useEffect(() => {
    if (draftState.phase === 'ready') return;

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Auto-select random available Pokemon
          const available = draftState.pool.filter(isPokemonAvailable);
          if (available.length > 0) {
            const randomPick = available[Math.floor(Math.random() * available.length)];
            handleSelect(randomPick);
          }
          return DRAFT_CONFIG.TIMER_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [draftState.phase, draftState.currentPicker, handleSelect]);

  const isP1Turn = draftState.currentPicker === 'P1';
  const currentAction = draftState.phase === 'ban' ? 'BAN' : 'PICK';

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.1)_0%,transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          {/* Phase indicator */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              draftState.phase === 'ban'
                ? 'bg-red-900/50 border border-red-500/50'
                : draftState.phase === 'pick'
                ? 'bg-emerald-900/50 border border-emerald-500/50'
                : 'bg-yellow-900/50 border border-yellow-500/50'
            }`}>
              {draftState.phase === 'ban' && <Ban className="w-4 h-4 text-red-400" />}
              {draftState.phase === 'pick' && <Check className="w-4 h-4 text-emerald-400" />}
              <span className="text-sm font-bold uppercase tracking-wider">
                {draftState.phase === 'ready' ? 'Listo' : `Fase de ${draftState.phase === 'ban' ? 'Baneo' : 'Selección'}`}
              </span>
            </div>
          </div>

          {/* Timer */}
          {draftState.phase !== 'ready' && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timer <= 10 ? 'bg-red-900/50 border border-red-500/50 animate-pulse' : 'bg-slate-800/50 border border-slate-600/50'
            }`}>
              <Clock className={`w-4 h-4 ${timer <= 10 ? 'text-red-400' : 'text-slate-400'}`} />
              <span className={`font-mono font-bold ${timer <= 10 ? 'text-red-400' : 'text-slate-300'}`}>
                {timer}s
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* P1 Team */}
        <div className="lg:w-48 flex flex-row lg:flex-col gap-2">
          <div className={`p-3 rounded-xl border ${
            isP1Turn && draftState.phase !== 'ready'
              ? 'bg-blue-900/30 border-blue-500/50 ring-2 ring-blue-500/30'
              : 'bg-slate-900/50 border-slate-700/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-bold text-blue-400">Jugador 1</span>
              {isP1Turn && draftState.phase !== 'ready' && (
                <span className="text-xs px-2 py-0.5 bg-blue-500/30 rounded-full text-blue-300 animate-pulse">
                  {currentAction}
                </span>
              )}
            </div>

            {/* P1 Banned */}
            <div className="mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Baneados</span>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: DRAFT_CONFIG.BANS_PER_PLAYER }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-lg border ${
                      draftState.bannedByP1[i]
                        ? 'border-red-500/50 bg-red-950/50'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                  >
                    {draftState.bannedByP1[i] && (
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${draftState.bannedByP1[i]}.png`}
                        className="w-full h-full object-contain grayscale opacity-50"
                        alt=""
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* P1 Picks */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Equipo</span>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: DRAFT_CONFIG.PICKS_PER_PLAYER }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border ${
                      draftState.pickedByP1[i]
                        ? 'border-blue-500/50 bg-blue-950/30'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                  >
                    {draftState.pickedByP1[i] && (
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${draftState.pickedByP1[i].id}.png`}
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pokemon Pool Grid */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold text-white">
              {draftState.phase === 'ready'
                ? '¡Draft Completo!'
                : `${isP1Turn ? 'Jugador 1' : 'Jugador 2'}: ${draftState.phase === 'ban' ? 'Banea' : 'Elige'} un Pokémon`
              }
            </h2>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-1">
              {draftState.pool.map(pokemon => {
                const isAvailable = isPokemonAvailable(pokemon);
                const isBanned = allBannedIds.includes(pokemon.id);
                const isPicked = allPickedIds.includes(pokemon.id);

                return (
                  <button
                    key={pokemon.id}
                    onClick={() => isAvailable && handleSelect(pokemon)}
                    onMouseEnter={() => setHoveredPokemon(pokemon)}
                    onMouseLeave={() => setHoveredPokemon(null)}
                    disabled={!isAvailable || draftState.phase === 'ready'}
                    className={`
                      relative p-2 rounded-xl border transition-all duration-200
                      ${isAvailable
                        ? `cursor-pointer hover:scale-105 hover:shadow-lg ${
                          draftState.phase === 'ban'
                            ? 'hover:border-red-500/70 hover:bg-red-900/20'
                            : 'hover:border-emerald-500/70 hover:bg-emerald-900/20'
                        }`
                        : 'cursor-not-allowed opacity-50'
                      }
                      ${isBanned ? 'bg-red-950/30 border-red-900/50' : ''}
                      ${isPicked ? 'bg-slate-800/50 border-slate-600/50' : ''}
                      ${isAvailable ? 'bg-slate-800/30 border-slate-700/50' : ''}
                    `}
                  >
                    {/* Pokemon sprite */}
                    <div className="relative">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                        className={`w-16 h-16 mx-auto object-contain ${!isAvailable ? 'grayscale' : ''}`}
                        alt={pokemon.name}
                      />

                      {/* Banned overlay */}
                      {isBanned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Ban className="w-10 h-10 text-red-500/80" />
                        </div>
                      )}

                      {/* Picked overlay */}
                      {isPicked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-10 h-10 text-emerald-500/80" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-slate-300 truncate block">
                        {pokemon.name}
                      </span>
                    </div>

                    {/* Types */}
                    <div className="flex justify-center gap-1 mt-1">
                      {pokemon.types.map(type => (
                        <span
                          key={type}
                          className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold"
                          style={{
                            backgroundColor: `${TYPE_COLORS[type]}40`,
                            color: TYPE_COLORS[type],
                          }}
                        >
                          {type.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* P2 Team */}
        <div className="lg:w-48 flex flex-row lg:flex-col gap-2">
          <div className={`p-3 rounded-xl border ${
            !isP1Turn && draftState.phase !== 'ready'
              ? 'bg-red-900/30 border-red-500/50 ring-2 ring-red-500/30'
              : 'bg-slate-900/50 border-slate-700/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-bold text-red-400">Jugador 2</span>
              {!isP1Turn && draftState.phase !== 'ready' && (
                <span className="text-xs px-2 py-0.5 bg-red-500/30 rounded-full text-red-300 animate-pulse">
                  {currentAction}
                </span>
              )}
            </div>

            {/* P2 Banned */}
            <div className="mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Baneados</span>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: DRAFT_CONFIG.BANS_PER_PLAYER }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-lg border ${
                      draftState.bannedByP2[i]
                        ? 'border-red-500/50 bg-red-950/50'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                  >
                    {draftState.bannedByP2[i] && (
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${draftState.bannedByP2[i]}.png`}
                        className="w-full h-full object-contain grayscale opacity-50"
                        alt=""
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* P2 Picks */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Equipo</span>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: DRAFT_CONFIG.PICKS_PER_PLAYER }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border ${
                      draftState.pickedByP2[i]
                        ? 'border-red-500/50 bg-red-950/30'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                  >
                    {draftState.pickedByP2[i] && (
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${draftState.pickedByP2[i].id}.png`}
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hovered Pokemon Details */}
        {hoveredPokemon && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl z-20 animate-fade-in">
            <div className="flex items-center gap-4">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${hoveredPokemon.id}.png`}
                className="w-16 h-16"
                alt=""
              />
              <div>
                <h3 className="font-bold text-white">{hoveredPokemon.name}</h3>
                <div className="flex gap-2 mt-1">
                  {hoveredPokemon.types.map(type => (
                    <span
                      key={type}
                      className="text-[10px] px-2 py-0.5 rounded uppercase font-bold"
                      style={{
                        backgroundColor: `${TYPE_COLORS[type]}40`,
                        color: TYPE_COLORS[type],
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-red-400">
                  <Heart className="w-3 h-3" />
                  <span>{hoveredPokemon.hp}</span>
                </div>
                <div className="flex items-center gap-1 text-orange-400">
                  <Swords className="w-3 h-3" />
                  <span>{hoveredPokemon.atk}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Shield className="w-3 h-3" />
                  <span>{hoveredPokemon.def}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Move className="w-3 h-3" />
                  <span>{hoveredPokemon.mov}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
