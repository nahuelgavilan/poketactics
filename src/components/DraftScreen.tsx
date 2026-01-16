import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Ban, Check, Clock, Swords, Shield, Heart, Zap, X, Crown, Sparkles } from 'lucide-react';
import type { PokemonTemplate, Player } from '../types/game';
import type { DraftState } from '../types/draft';
import { DRAFT_CONFIG } from '../types/draft';
import { getBaseFormPokemon } from '../constants/evolution';
import { TYPE_COLORS } from '../constants/types';

interface DraftScreenProps {
  onDraftComplete: (p1Team: PokemonTemplate[], p2Team: PokemonTemplate[]) => void;
  onCancel: () => void;
}

function generateDraftPool(): PokemonTemplate[] {
  const allBase = getBaseFormPokemon();
  const shuffled = [...allBase].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, DRAFT_CONFIG.POOL_SIZE);
}

function generatePickOrder(): Player[] {
  return ['P1', 'P2', 'P2', 'P1', 'P1', 'P2'];
}

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
  const [showIntro, setShowIntro] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const banOrderRef = useRef(generateBanOrder());
  const banIndexRef = useRef(0);

  // Hide intro after animation
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(t);
  }, []);

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
        }, 2500);
      } else {
        newState.currentPicker = newState.pickOrder[newState.currentPickIndex];
        setDraftState(newState);
        setTimer(DRAFT_CONFIG.TIMER_SECONDS);
      }
      setSelectedPokemon(null);
    }
  }, [selectedPokemon, draftState, isPokemonAvailable, onDraftComplete]);

  const autoSelect = useCallback(() => {
    const available = draftState.pool.filter(p =>
      !allBannedIds.includes(p.id) && !allPickedIds.includes(p.id)
    );
    if (available.length > 0) {
      const randomPick = available[Math.floor(Math.random() * available.length)];
      setSelectedPokemon(randomPick);
      setTimeout(() => {
        confirmSelection();
      }, 100);
    }
  }, [draftState.pool, allBannedIds, allPickedIds]);

  useEffect(() => {
    if (draftState.phase === 'ready' || showIntro) {
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
  }, [draftState.phase, draftState.currentPicker, autoSelect, showIntro]);

  useEffect(() => {
    if (lastAction) {
      const timeout = setTimeout(() => setLastAction(null), 1800);
      return () => clearTimeout(timeout);
    }
  }, [lastAction]);

  const isP1Turn = draftState.currentPicker === 'P1';
  const totalBans = DRAFT_CONFIG.BANS_PER_PLAYER * 2;
  const currentBanCount = draftState.bannedByP1.length + draftState.bannedByP2.length;
  const totalPicks = DRAFT_CONFIG.PICKS_PER_PLAYER * 2;
  const currentPickCount = draftState.pickedByP1.length + draftState.pickedByP2.length;

  return (
    <div className="draft-arena">
      {/* Intro Animation */}
      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-content">
            <div className="intro-vs">
              <span className="intro-p1">P1</span>
              <span className="intro-vs-text">VS</span>
              <span className="intro-p2">P2</span>
            </div>
            <div className="intro-title">DRAFT MODE</div>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="arena-bg">
        <div className="arena-gradient" />
        <div className="arena-grid" />
        <div className="arena-scanlines" />
        <div className="arena-glow-p1" />
        <div className="arena-glow-p2" />
      </div>

      {/* Header Bar */}
      <header className="draft-header">
        <button onClick={onCancel} className="cancel-btn">
          <X className="w-5 h-5" />
        </button>

        <div className="phase-display">
          {draftState.phase === 'ban' && (
            <>
              <Ban className="w-4 h-4" />
              <span>BAN {currentBanCount + 1}/{totalBans}</span>
            </>
          )}
          {draftState.phase === 'pick' && (
            <>
              <Crown className="w-4 h-4" />
              <span>PICK {currentPickCount + 1}/{totalPicks}</span>
            </>
          )}
          {draftState.phase === 'ready' && (
            <>
              <Sparkles className="w-4 h-4" />
              <span>¡LISTO!</span>
            </>
          )}
        </div>

        <div className={`timer-display ${timer <= 5 ? 'timer-critical' : timer <= 10 ? 'timer-warning' : ''}`}>
          <Clock className="w-4 h-4" />
          <span>{timer}s</span>
        </div>
      </header>

      {/* Team Strips - Horizontal on Mobile */}
      <div className="teams-container">
        <TeamStrip
          player="P1"
          isActive={isP1Turn && draftState.phase !== 'ready'}
          banned={draftState.bannedByP1}
          picked={draftState.pickedByP1}
          pool={draftState.pool}
        />
        <div className="teams-divider">
          <span>VS</span>
        </div>
        <TeamStrip
          player="P2"
          isActive={!isP1Turn && draftState.phase !== 'ready'}
          banned={draftState.bannedByP2}
          picked={draftState.pickedByP2}
          pool={draftState.pool}
        />
      </div>

      {/* Turn Indicator */}
      {draftState.phase !== 'ready' && (
        <div className={`turn-indicator ${isP1Turn ? 'turn-p1' : 'turn-p2'}`}>
          <div className="turn-arrow" />
          <span className="turn-player">{isP1Turn ? 'JUGADOR 1' : 'JUGADOR 2'}</span>
          <span className="turn-action">{draftState.phase === 'ban' ? 'BANEA' : 'ELIGE'}</span>
        </div>
      )}

      {/* Ready State */}
      {draftState.phase === 'ready' && (
        <div className="ready-indicator">
          <Sparkles className="w-6 h-6" />
          <span>¡EQUIPOS LISTOS!</span>
        </div>
      )}

      {/* Pokemon Pool Grid */}
      <div className="pool-container">
        <div className="pool-grid">
          {draftState.pool.map((pokemon, index) => {
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
                  pokemon-card
                  ${isSelected ? 'card-selected' : ''}
                  ${isBanned ? 'card-banned' : ''}
                  ${isPicked ? 'card-picked' : ''}
                  ${!isAvailable ? 'card-unavailable' : 'card-available'}
                `}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="card-inner">
                  {/* Type gradient background */}
                  <div
                    className="card-type-bg"
                    style={{
                      background: `linear-gradient(135deg, ${TYPE_COLORS[pokemon.types[0]]}40 0%, transparent 60%)`
                    }}
                  />

                  {/* Sprite */}
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                    className="card-sprite"
                    alt={pokemon.name}
                    loading="lazy"
                  />

                  {/* Type dots */}
                  <div className="card-types">
                    {pokemon.types.map(type => (
                      <div
                        key={type}
                        className="type-dot"
                        style={{ backgroundColor: TYPE_COLORS[type] }}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <div className="card-name">{pokemon.name}</div>

                  {/* Banned overlay */}
                  {isBanned && (
                    <div className="card-overlay banned-overlay">
                      <Ban className="w-8 h-8" />
                    </div>
                  )}

                  {/* Picked overlay */}
                  {isPicked && (
                    <div className="card-overlay picked-overlay">
                      <Check className="w-8 h-8" />
                    </div>
                  )}

                  {/* Selection glow */}
                  {isSelected && <div className="card-selection-ring" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection Footer */}
      {selectedPokemon && draftState.phase !== 'ready' && (
        <div className={`selection-footer ${draftState.phase === 'ban' ? 'footer-ban' : 'footer-pick'}`}>
          <div className="selection-preview">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.id}.png`}
              className="preview-sprite"
              alt=""
            />
            <div className="preview-info">
              <div className="preview-name">{selectedPokemon.name}</div>
              <div className="preview-types">
                {selectedPokemon.types.map(type => (
                  <span
                    key={type}
                    className="preview-type-badge"
                    style={{
                      backgroundColor: `${TYPE_COLORS[type]}30`,
                      color: TYPE_COLORS[type],
                      borderColor: `${TYPE_COLORS[type]}60`
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="preview-stats">
                <div className="stat"><Heart className="w-3 h-3" />{selectedPokemon.hp}</div>
                <div className="stat"><Swords className="w-3 h-3" />{selectedPokemon.atk}</div>
                <div className="stat"><Shield className="w-3 h-3" />{selectedPokemon.def}</div>
                <div className="stat"><Zap className="w-3 h-3" />{selectedPokemon.mov}</div>
              </div>
            </div>
          </div>
          <button onClick={confirmSelection} className="confirm-btn">
            {draftState.phase === 'ban' ? (
              <>
                <Ban className="w-5 h-5" />
                <span>BANEAR</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>ELEGIR</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Action Popup */}
      {lastAction && (
        <div className={`action-popup ${lastAction.player === 'P1' ? 'popup-p1' : 'popup-p2'}`}>
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${lastAction.pokemon.id}.png`}
            className={`popup-sprite ${lastAction.type === 'ban' ? 'sprite-banned' : ''}`}
            alt=""
          />
          <div className="popup-text">
            <span className="popup-player">{lastAction.player === 'P1' ? 'P1' : 'P2'}</span>
            <span className={`popup-action ${lastAction.type === 'ban' ? 'action-ban' : 'action-pick'}`}>
              {lastAction.type === 'ban' ? 'BANEÓ' : 'ELIGIÓ'}
            </span>
            <span className="popup-name">{lastAction.pokemon.name}</span>
          </div>
        </div>
      )}

      <style>{`
        /* ============================================
           DRAFT ARENA - Neon Competitive Aesthetic
           ============================================ */

        .draft-arena {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          background: #06050a;
          font-family: 'Press Start 2P', monospace;
          overflow: hidden;
        }

        /* === INTRO ANIMATION === */
        .intro-overlay {
          position: absolute;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #06050a;
          animation: intro-fade 2s ease-out forwards;
        }

        .intro-content {
          text-align: center;
        }

        .intro-vs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
          animation: intro-scale 0.6s ease-out 0.3s both;
        }

        .intro-p1 {
          font-size: 2.5rem;
          font-weight: 900;
          color: #00f7ff;
          text-shadow: 0 0 30px #00f7ff, 0 0 60px #00f7ff50;
        }

        .intro-p2 {
          font-size: 2.5rem;
          font-weight: 900;
          color: #ff00aa;
          text-shadow: 0 0 30px #ff00aa, 0 0 60px #ff00aa50;
        }

        .intro-vs-text {
          font-size: 1.5rem;
          color: #ffd700;
          text-shadow: 0 0 20px #ffd700;
        }

        .intro-title {
          font-size: 1rem;
          color: #fff;
          letter-spacing: 0.3em;
          animation: intro-slide 0.6s ease-out 0.6s both;
        }

        @keyframes intro-fade {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }

        @keyframes intro-scale {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes intro-slide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* === BACKGROUND === */
        .arena-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .arena-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, transparent 50%),
                      radial-gradient(ellipse at 0% 50%, #00f7ff08 0%, transparent 40%),
                      radial-gradient(ellipse at 100% 50%, #ff00aa08 0%, transparent 40%);
        }

        .arena-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .arena-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.15) 2px,
            rgba(0,0,0,0.15) 4px
          );
          pointer-events: none;
        }

        .arena-glow-p1 {
          position: absolute;
          top: -50%;
          left: -20%;
          width: 60%;
          height: 100%;
          background: radial-gradient(circle, #00f7ff15 0%, transparent 60%);
          animation: glow-pulse 4s ease-in-out infinite;
        }

        .arena-glow-p2 {
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 100%;
          background: radial-gradient(circle, #ff00aa15 0%, transparent 60%);
          animation: glow-pulse 4s ease-in-out infinite 2s;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* === HEADER === */
        .draft-header {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(10, 8, 20, 0.9);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
        }

        .cancel-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #888;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: rgba(255,0,0,0.2);
          border-color: rgba(255,0,0,0.4);
          color: #ff4444;
        }

        .phase-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,150,0,0.2) 100%);
          border: 1px solid rgba(255,215,0,0.4);
          border-radius: 20px;
          color: #ffd700;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-shadow: 0 0 10px rgba(255,215,0,0.5);
        }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #aaa;
          font-size: 0.7rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          transition: all 0.3s;
        }

        .timer-warning {
          background: rgba(255,170,0,0.2);
          border-color: rgba(255,170,0,0.5);
          color: #ffaa00;
        }

        .timer-critical {
          background: rgba(255,50,50,0.3);
          border-color: rgba(255,50,50,0.6);
          color: #ff4444;
          animation: timer-flash 0.5s ease-in-out infinite;
        }

        @keyframes timer-flash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* === TEAM STRIPS === */
        .teams-container {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: stretch;
          padding: 0.75rem;
          gap: 0.5rem;
          background: rgba(0,0,0,0.4);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .teams-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.5rem;
          color: rgba(255,255,255,0.3);
          font-size: 0.5rem;
        }

        /* === TEAM STRIP COMPONENT === */
        .team-strip {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.6rem;
          border-radius: 10px;
          border: 2px solid transparent;
          transition: all 0.3s;
        }

        .team-strip.p1 {
          background: linear-gradient(135deg, rgba(0,247,255,0.08) 0%, rgba(0,150,200,0.05) 100%);
          border-color: rgba(0,247,255,0.2);
        }

        .team-strip.p2 {
          background: linear-gradient(135deg, rgba(255,0,170,0.08) 0%, rgba(200,0,100,0.05) 100%);
          border-color: rgba(255,0,170,0.2);
        }

        .team-strip.active {
          border-color: currentColor;
          box-shadow: 0 0 20px currentColor;
        }

        .team-strip.p1.active {
          color: #00f7ff;
        }

        .team-strip.p2.active {
          color: #ff00aa;
        }

        .strip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .strip-player {
          font-size: 0.5rem;
          font-weight: bold;
          letter-spacing: 0.1em;
        }

        .team-strip.p1 .strip-player { color: #00f7ff; }
        .team-strip.p2 .strip-player { color: #ff00aa; }

        .strip-label {
          font-size: 0.4rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.1em;
        }

        .strip-slots {
          display: flex;
          gap: 0.3rem;
        }

        .strip-slot {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px dashed rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s;
        }

        .strip-slot.filled {
          border-style: solid;
        }

        .strip-slot.ban-slot.filled {
          border-color: rgba(255,80,80,0.5);
          background: rgba(255,0,0,0.15);
        }

        .strip-slot.pick-slot.filled.p1 {
          border-color: rgba(0,247,255,0.5);
          background: rgba(0,247,255,0.1);
        }

        .strip-slot.pick-slot.filled.p2 {
          border-color: rgba(255,0,170,0.5);
          background: rgba(255,0,170,0.1);
        }

        .strip-slot img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .strip-slot.ban-slot img {
          filter: grayscale(1) opacity(0.5);
        }

        .slot-placeholder {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.15);
        }

        /* === TURN INDICATOR === */
        .turn-indicator {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          margin: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          transition: all 0.3s;
        }

        .turn-indicator.turn-p1 {
          background: linear-gradient(135deg, rgba(0,247,255,0.15) 0%, rgba(0,150,200,0.1) 100%);
          border: 2px solid rgba(0,247,255,0.4);
          box-shadow: 0 0 30px rgba(0,247,255,0.2), inset 0 0 30px rgba(0,247,255,0.05);
        }

        .turn-indicator.turn-p2 {
          background: linear-gradient(135deg, rgba(255,0,170,0.15) 0%, rgba(200,0,100,0.1) 100%);
          border: 2px solid rgba(255,0,170,0.4);
          box-shadow: 0 0 30px rgba(255,0,170,0.2), inset 0 0 30px rgba(255,0,170,0.05);
        }

        .turn-arrow {
          width: 0;
          height: 0;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          animation: arrow-bounce 1s ease-in-out infinite;
        }

        .turn-p1 .turn-arrow {
          border-right: 8px solid #00f7ff;
        }

        .turn-p2 .turn-arrow {
          border-left: 8px solid #ff00aa;
        }

        @keyframes arrow-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }

        .turn-p2 .turn-arrow {
          animation-name: arrow-bounce-left;
        }

        @keyframes arrow-bounce-left {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-4px); }
        }

        .turn-player {
          font-weight: bold;
        }

        .turn-p1 .turn-player { color: #00f7ff; }
        .turn-p2 .turn-player { color: #ff00aa; }

        .turn-action {
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255,215,0,0.5);
        }

        /* === READY INDICATOR === */
        .ready-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          margin: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(0,255,150,0.15) 0%, rgba(0,200,100,0.1) 100%);
          border: 2px solid rgba(0,255,150,0.4);
          border-radius: 12px;
          color: #00ff96;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-shadow: 0 0 15px rgba(0,255,150,0.5);
          animation: ready-pulse 1.5s ease-in-out infinite;
        }

        @keyframes ready-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,150,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,255,150,0.5); }
        }

        /* === POKEMON POOL === */
        .pool-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0.5rem;
          position: relative;
          z-index: 10;
          -webkit-overflow-scrolling: touch;
        }

        .pool-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          padding-bottom: 100px;
        }

        @media (min-width: 480px) {
          .pool-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        @media (min-width: 640px) {
          .pool-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 0.6rem;
          }
        }

        @media (min-width: 1024px) {
          .pool-grid {
            grid-template-columns: repeat(8, 1fr);
          }
        }

        /* === POKEMON CARD === */
        .pokemon-card {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.1);
          background: rgba(20,15,35,0.8);
          overflow: hidden;
          transition: all 0.2s;
          animation: card-appear 0.4s ease-out both;
        }

        @keyframes card-appear {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .pokemon-card.card-available:active {
          transform: scale(0.95);
        }

        .pokemon-card.card-available:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(40,30,60,0.9);
          transform: scale(1.02);
        }

        .pokemon-card.card-selected {
          border-color: #ffd700;
          box-shadow: 0 0 20px rgba(255,215,0,0.4), inset 0 0 20px rgba(255,215,0,0.1);
          transform: scale(1.05);
          z-index: 5;
        }

        .pokemon-card.card-unavailable {
          opacity: 0.4;
          pointer-events: none;
        }

        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .card-type-bg {
          position: absolute;
          inset: 0;
          opacity: 0.6;
        }

        .card-sprite {
          width: 70%;
          height: 70%;
          object-fit: contain;
          position: relative;
          z-index: 2;
          transition: transform 0.2s;
          image-rendering: pixelated;
        }

        .card-available:hover .card-sprite {
          transform: scale(1.1);
        }

        .card-types {
          position: absolute;
          top: 4px;
          right: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 3;
        }

        .type-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 4px currentColor;
        }

        .card-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 4px 2px;
          background: linear-gradient(transparent, rgba(0,0,0,0.9));
          color: #fff;
          font-size: 0.4rem;
          text-align: center;
          font-family: 'Press Start 2P', monospace;
          text-transform: uppercase;
          letter-spacing: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 3;
        }

        .card-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .banned-overlay {
          background: rgba(100,0,0,0.7);
          color: #ff4444;
        }

        .picked-overlay {
          background: rgba(0,0,0,0.7);
          color: rgba(255,255,255,0.4);
        }

        .card-selection-ring {
          position: absolute;
          inset: -3px;
          border: 3px solid #ffd700;
          border-radius: 12px;
          animation: selection-pulse 1s ease-in-out infinite;
          z-index: 4;
        }

        @keyframes selection-pulse {
          0%, 100% { box-shadow: 0 0 10px #ffd700, inset 0 0 10px rgba(255,215,0,0.2); }
          50% { box-shadow: 0 0 25px #ffd700, inset 0 0 15px rgba(255,215,0,0.3); }
        }

        /* === SELECTION FOOTER === */
        .selection-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          backdrop-filter: blur(20px);
          animation: footer-slide 0.3s ease-out;
        }

        @keyframes footer-slide {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .selection-footer.footer-ban {
          background: linear-gradient(to top, rgba(100,0,0,0.95), rgba(60,0,0,0.9));
          border-top: 2px solid rgba(255,80,80,0.5);
        }

        .selection-footer.footer-pick {
          background: linear-gradient(to top, rgba(0,50,30,0.95), rgba(0,30,20,0.9));
          border-top: 2px solid rgba(0,255,150,0.5);
        }

        .selection-preview {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .preview-sprite {
          width: 56px;
          height: 56px;
          object-fit: contain;
          image-rendering: pixelated;
        }

        .preview-info {
          flex: 1;
          min-width: 0;
        }

        .preview-name {
          font-size: 0.7rem;
          font-weight: bold;
          color: #fff;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .preview-types {
          display: flex;
          gap: 0.3rem;
          margin-bottom: 0.3rem;
        }

        .preview-type-badge {
          font-size: 0.4rem;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid;
          font-family: system-ui, sans-serif;
          text-transform: uppercase;
          font-weight: bold;
        }

        .preview-stats {
          display: flex;
          gap: 0.5rem;
        }

        .preview-stats .stat {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 0.5rem;
          color: rgba(255,255,255,0.7);
          font-family: 'Courier New', monospace;
        }

        .confirm-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          border-radius: 10px;
          font-size: 0.6rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
          transition: all 0.2s;
        }

        .footer-ban .confirm-btn {
          background: linear-gradient(135deg, #ff3333 0%, #cc0000 100%);
          box-shadow: 0 4px 20px rgba(255,0,0,0.4);
        }

        .footer-ban .confirm-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 30px rgba(255,0,0,0.5);
        }

        .footer-pick .confirm-btn {
          background: linear-gradient(135deg, #00cc66 0%, #009944 100%);
          box-shadow: 0 4px 20px rgba(0,200,100,0.4);
        }

        .footer-pick .confirm-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 30px rgba(0,200,100,0.5);
        }

        .confirm-btn:active {
          transform: scale(0.95);
        }

        /* === ACTION POPUP === */
        .action-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 2rem;
          border-radius: 16px;
          backdrop-filter: blur(20px);
          animation: popup-boom 1.8s ease-out forwards;
        }

        .action-popup.popup-p1 {
          background: linear-gradient(135deg, rgba(0,100,130,0.95) 0%, rgba(0,60,80,0.95) 100%);
          border: 3px solid #00f7ff;
          box-shadow: 0 0 60px rgba(0,247,255,0.5);
        }

        .action-popup.popup-p2 {
          background: linear-gradient(135deg, rgba(130,0,80,0.95) 0%, rgba(80,0,50,0.95) 100%);
          border: 3px solid #ff00aa;
          box-shadow: 0 0 60px rgba(255,0,170,0.5);
        }

        @keyframes popup-boom {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          30% { transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9) translateY(-20px); }
        }

        .popup-sprite {
          width: 80px;
          height: 80px;
          object-fit: contain;
          image-rendering: pixelated;
        }

        .popup-sprite.sprite-banned {
          filter: grayscale(1);
        }

        .popup-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .popup-player {
          font-size: 0.6rem;
          font-weight: bold;
          letter-spacing: 0.2em;
        }

        .popup-p1 .popup-player { color: #00f7ff; }
        .popup-p2 .popup-player { color: #ff00aa; }

        .popup-action {
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .popup-action.action-ban {
          color: #ff4444;
          text-shadow: 0 0 10px rgba(255,0,0,0.5);
        }

        .popup-action.action-pick {
          color: #00ff96;
          text-shadow: 0 0 10px rgba(0,255,150,0.5);
        }

        .popup-name {
          font-size: 0.7rem;
          color: #fff;
          text-transform: uppercase;
        }

        /* === SCROLLBAR === */
        .pool-container::-webkit-scrollbar {
          width: 6px;
        }

        .pool-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }

        .pool-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }

        .pool-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}

// Team Strip Component
interface TeamStripProps {
  player: Player;
  isActive: boolean;
  banned: number[];
  picked: PokemonTemplate[];
  pool: PokemonTemplate[];
}

function TeamStrip({ player, isActive, banned, picked, pool }: TeamStripProps) {
  const isP1 = player === 'P1';

  return (
    <div className={`team-strip ${isP1 ? 'p1' : 'p2'} ${isActive ? 'active' : ''}`}>
      <div className="strip-header">
        <span className="strip-player">{isP1 ? 'P1' : 'P2'}</span>
      </div>

      {/* Bans Row */}
      <div>
        <div className="strip-label">BAN</div>
        <div className="strip-slots">
          {Array.from({ length: DRAFT_CONFIG.BANS_PER_PLAYER }).map((_, i) => {
            const bannedId = banned[i];
            return (
              <div key={i} className={`strip-slot ban-slot ${bannedId ? 'filled' : ''}`}>
                {bannedId ? (
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${bannedId}.png`}
                    alt=""
                  />
                ) : (
                  <div className="slot-placeholder" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Picks Row */}
      <div>
        <div className="strip-label">PICK</div>
        <div className="strip-slots">
          {Array.from({ length: DRAFT_CONFIG.PICKS_PER_PLAYER }).map((_, i) => {
            const pickedPokemon = picked[i];
            return (
              <div key={i} className={`strip-slot pick-slot ${isP1 ? 'p1' : 'p2'} ${pickedPokemon ? 'filled' : ''}`}>
                {pickedPokemon ? (
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pickedPokemon.id}.png`}
                    alt=""
                  />
                ) : (
                  <div className="slot-placeholder" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
