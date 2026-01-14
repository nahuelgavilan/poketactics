import { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Swords,
  TreePine,
  Sparkles,
  Zap,
  Shield,
  Move,
  Clock,
  Gamepad2,
  Star,
} from 'lucide-react';
import { Tile } from './GameBoard/Tile';
import { TERRAIN } from '../constants/terrain';
import type { TerrainType, Position } from '../types/game';

interface HowToPlayProps {
  onClose: () => void;
}

// Pokemon sprites
const PIKACHU_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif';
const CHARMANDER_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif';
const SQUIRTLE_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/7.gif';
const BULBASAUR_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif';

// Generate sparkle particles
function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
  }));
}

// Tutorial tile wrapper - uses the ACTUAL game Tile component
function TutorialTile({
  x,
  y,
  terrain,
  isSelected = false,
  canMove = false,
  canAttack = false,
  path = [],
  children
}: {
  x: number;
  y: number;
  terrain: TerrainType;
  isSelected?: boolean;
  canMove?: boolean;
  canAttack?: boolean;
  path?: Position[];
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Tile
        x={x}
        y={y}
        terrain={terrain}
        unit={undefined}
        isSelected={isSelected}
        canMove={canMove}
        canAttack={canAttack}
        onClick={() => {}}
        isMobile={true}
        isVisible={true}
        isExplored={true}
        path={path}
      />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

// Premium GBA-style action button for tutorial
function TutorialActionButton({
  icon: Icon,
  label,
  color,
  disabled = false,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  color: 'blue' | 'red' | 'green' | 'amber';
  disabled?: boolean;
  highlight?: boolean;
}) {
  const colorStyles = {
    blue: 'from-blue-600 to-blue-700 border-blue-400/50 shadow-blue-500/40',
    red: 'from-red-600 to-red-700 border-red-400/50 shadow-red-500/40',
    green: 'from-emerald-600 to-emerald-700 border-emerald-400/50 shadow-emerald-500/40',
    amber: 'from-amber-600 to-amber-700 border-amber-400/50 shadow-amber-500/40',
  };

  return (
    <div
      className={`
        relative flex items-center justify-center gap-1
        px-2 py-1.5 min-w-[52px]
        bg-gradient-to-b ${colorStyles[color]}
        border-b-2 rounded-lg
        text-white text-[9px] font-bold uppercase tracking-wide
        transition-all duration-300
        ${disabled ? 'opacity-30 grayscale' : ''}
        ${highlight ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900 animate-pulse' : ''}
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}

// Animated ring preview for capture tutorial
function CaptureRingPreview() {
  const [ringSize, setRingSize] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setRingSize(prev => {
        if (prev <= 20) return 100;
        return prev - 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getRingColor = () => {
    if (ringSize <= 20) return '#22C55E'; // Perfect - Green
    if (ringSize <= 40) return '#3B82F6'; // Great - Blue
    if (ringSize <= 65) return '#EAB308'; // Good - Yellow
    return '#EF4444'; // Miss - Red
  };

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Target ring */}
      <div
        className="absolute w-20 h-20 rounded-full border-4 border-amber-400"
        style={{ boxShadow: '0 0 20px rgba(251,191,36,0.4)' }}
      />

      {/* Zone indicators */}
      <div className="absolute w-16 h-16 rounded-full border-2 border-green-500/40" />
      <div className="absolute w-12 h-12 rounded-full border-2 border-blue-500/40" />
      <div className="absolute w-8 h-8 rounded-full border-2 border-yellow-500/40" />

      {/* Shrinking ring */}
      <div
        className="absolute rounded-full border-4 transition-colors duration-100"
        style={{
          width: `${ringSize}%`,
          height: `${ringSize}%`,
          borderColor: getRingColor(),
          boxShadow: `0 0 15px ${getRingColor()}80`,
        }}
      />

      {/* Center Pokeball */}
      <div className="relative w-8 h-8 rounded-full border-2 border-slate-600 bg-gradient-to-b from-red-500 to-red-600 overflow-hidden">
        <div className="absolute bottom-0 w-full h-1/2 bg-white" />
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-700" />
      </div>
    </div>
  );
}

// Slide content components
function SlideObjetivo() {
  return (
    <div className="space-y-4">
      <p className="text-slate-300 leading-relaxed text-sm">
        <span className="text-amber-400 font-bold">PokéTactics</span> es un juego táctico por turnos inspirado en{' '}
        <span className="text-blue-400 font-semibold">Fire Emblem</span> y{' '}
        <span className="text-red-400 font-semibold">Advance Wars</span>.
      </p>

      {/* GBA-style info box */}
      <div
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg p-4"
        style={{
          border: '3px solid',
          borderColor: '#475569 #1E293B #1E293B #475569',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-amber-400" />
          <span
            className="text-[10px] font-bold text-amber-400 uppercase tracking-wider"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Objetivo
          </span>
        </div>
        <p className="text-sm text-white">
          Elimina a todos los Pokémon del equipo rival para ganar la batalla.
        </p>
      </div>

      {/* VS Display */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="text-center">
          <div
            className="relative w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-2 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
              border: '3px solid #3B82F6',
              boxShadow: '0 0 20px rgba(59,130,246,0.4)',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.3)_0%,transparent_70%)]" />
            <img
              src={PIKACHU_SPRITE}
              className="w-12 h-12 object-contain scale-x-[-1] relative z-10"
              style={{ imageRendering: 'pixelated' }}
              alt="P1"
            />
          </div>
          <span
            className="text-[9px] text-blue-400 font-bold uppercase tracking-wider"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Equipo Azul
          </span>
        </div>

        <div
          className="text-2xl font-black text-amber-500"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '2px 2px 0 #000, 0 0 20px rgba(251,191,36,0.5)',
          }}
        >
          VS
        </div>

        <div className="text-center">
          <div
            className="relative w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-2 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)',
              border: '3px solid #EF4444',
              boxShadow: '0 0 20px rgba(239,68,68,0.4)',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.3)_0%,transparent_70%)]" />
            <img
              src={CHARMANDER_SPRITE}
              className="w-12 h-12 object-contain relative z-10"
              style={{ imageRendering: 'pixelated' }}
              alt="P2"
            />
          </div>
          <span
            className="text-[9px] text-red-400 font-bold uppercase tracking-wider"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Equipo Rojo
          </span>
        </div>
      </div>
    </div>
  );
}

function SlideMovimiento() {
  const tutorialPath: Position[] = [
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white">1</span>
        </div>
        <p className="text-slate-300 text-sm">
          <span className="text-white font-semibold">Toca tu Pokémon</span> para ver su rango de movimiento en{' '}
          <span className="text-blue-400 font-semibold">azul</span>.
        </p>
      </div>

      {/* Grid preview */}
      <div
        className="grid grid-cols-5 gap-0.5 p-2 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '3px solid #334155',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        <TutorialTile x={0} y={0} terrain={TERRAIN.GRASS} />
        <TutorialTile x={1} y={0} terrain={TERRAIN.GRASS} canMove />
        <TutorialTile x={2} y={0} terrain={TERRAIN.GRASS} canMove />
        <TutorialTile x={3} y={0} terrain={TERRAIN.FOREST} />
        <TutorialTile x={4} y={0} terrain={TERRAIN.WATER} />

        <TutorialTile x={0} y={1} terrain={TERRAIN.GRASS} canMove />
        <TutorialTile x={1} y={1} terrain={TERRAIN.GRASS} canMove path={tutorialPath} />
        <TutorialTile x={2} y={1} terrain={TERRAIN.GRASS} canMove path={tutorialPath} />
        <TutorialTile x={3} y={1} terrain={TERRAIN.GRASS} path={tutorialPath} />
        <TutorialTile x={4} y={1} terrain={TERRAIN.WATER} />

        <TutorialTile x={0} y={2} terrain={TERRAIN.GRASS} isSelected path={tutorialPath}>
          <img src={PIKACHU_SPRITE} className="w-[90%] h-[90%] object-contain scale-x-[-1] drop-shadow-lg" style={{ imageRendering: 'pixelated' }} alt="" />
        </TutorialTile>
        <TutorialTile x={1} y={2} terrain={TERRAIN.GRASS} canMove path={tutorialPath} />
        <TutorialTile x={2} y={2} terrain={TERRAIN.TALL_GRASS} canMove />
        <TutorialTile x={3} y={2} terrain={TERRAIN.GRASS} />
        <TutorialTile x={4} y={2} terrain={TERRAIN.MOUNTAIN} />

        <TutorialTile x={0} y={3} terrain={TERRAIN.GRASS} />
        <TutorialTile x={1} y={3} terrain={TERRAIN.GRASS} canMove />
        <TutorialTile x={2} y={3} terrain={TERRAIN.GRASS} />
        <TutorialTile x={3} y={3} terrain={TERRAIN.GRASS} />
        <TutorialTile x={4} y={3} terrain={TERRAIN.GRASS} />
      </div>

      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-black">2</span>
        </div>
        <p className="text-slate-300 text-sm">
          <span className="text-white font-semibold">Toca el destino</span> para ver el camino con{' '}
          <span className="text-red-400 font-semibold">flechas rojas</span>.
        </p>
      </div>
    </div>
  );
}

function SlideMenuAccion() {
  return (
    <div className="space-y-3">
      <p className="text-slate-300 text-sm">
        Al elegir destino, aparece el <span className="text-amber-400 font-semibold">menú de acción</span>:
      </p>

      {/* Premium action menu mockup */}
      <div
        className="flex items-center justify-center gap-2 p-3 rounded-xl mx-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)',
          border: '2px solid rgba(71,85,105,0.6)',
          boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(59,130,246,0.1)',
        }}
      >
        {/* Pokemon badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-950/80 border border-blue-800/50">
          <img
            src={PIKACHU_SPRITE}
            className="w-5 h-5 object-contain"
            style={{ imageRendering: 'pixelated' }}
            alt=""
          />
          <span className="text-[9px] font-bold text-blue-200">Pikachu</span>
        </div>

        <div className="w-px h-6 bg-slate-600" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <TutorialActionButton icon={Move} label="Mover" color="blue" />
          <TutorialActionButton icon={Swords} label="Atacar" color="red" highlight />
          <TutorialActionButton icon={Clock} label="Esperar" color="amber" />
        </div>

        <div className="w-px h-6 bg-slate-600" />

        <div className="p-1.5 rounded-lg bg-slate-800/80">
          <X className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* Button explanations */}
      <div className="space-y-2 mt-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Move className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-xs font-bold text-blue-300">MOVER</span>
            <span className="text-[10px] text-slate-400 ml-2">Ir a otra casilla</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Swords className="w-4 h-4 text-red-400" />
          <div>
            <span className="text-xs font-bold text-red-300">ATACAR</span>
            <span className="text-[10px] text-slate-400 ml-2">Enemigos en rango</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-xs font-bold text-amber-300">ESPERAR</span>
            <span className="text-[10px] text-slate-400 ml-2">Terminar turno</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideCombate() {
  return (
    <div className="space-y-3">
      <p className="text-slate-300 text-sm">
        Los <span className="text-red-400 font-semibold">indicadores rojos</span> muestran enemigos a tu alcance.
      </p>

      {/* Battle preview mockup */}
      <div
        className="relative p-3 rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0C0A09 0%, #1C1917 100%)',
          border: '3px solid #44403C',
          boxShadow: 'inset 0 2px 15px rgba(0,0,0,0.6)',
        }}
      >
        {/* VS Display */}
        <div className="flex items-center justify-between">
          {/* Attacker */}
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-1">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <img
                src={PIKACHU_SPRITE}
                className="w-full h-full object-contain scale-x-[-1] relative z-10"
                style={{ imageRendering: 'pixelated' }}
                alt=""
              />
            </div>
            <div
              className="text-[9px] font-bold text-blue-400"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Pikachu
            </div>
            {/* HP Bar */}
            <div className="w-16 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div className="h-full w-full bg-gradient-to-r from-green-500 to-green-400" />
            </div>
          </div>

          {/* VS + Damage preview */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="text-lg font-black text-amber-500"
              style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
            >
              VS
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-red-400">-45</span>
              </div>
            </div>
          </div>

          {/* Defender */}
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-1">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <img
                src={SQUIRTLE_SPRITE}
                className="w-full h-full object-contain relative z-10"
                style={{ imageRendering: 'pixelated' }}
                alt=""
              />
            </div>
            <div
              className="text-[9px] font-bold text-red-400"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Squirtle
            </div>
            {/* HP Bar */}
            <div className="w-16 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div className="h-full w-3/4 bg-gradient-to-r from-yellow-500 to-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Type effectiveness */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Zap className="w-4 h-4 text-green-400" />
          <div>
            <div className="text-[10px] font-bold text-green-300">×2 Súper efectivo</div>
            <div className="text-[8px] text-slate-500">Agua → Fuego</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Shield className="w-4 h-4 text-red-400" />
          <div>
            <div className="text-[10px] font-bold text-red-300">×0.5 Poco efectivo</div>
            <div className="text-[8px] text-slate-500">Fuego → Agua</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideTerreno() {
  return (
    <div className="space-y-3">
      <p className="text-slate-300 text-sm">
        <span className="text-white font-semibold">Pulsa una casilla vacía</span> para ver sus stats. Cada terreno tiene efectos únicos:
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { terrain: TERRAIN.GRASS, name: 'Llanura', effect: 'Sin bonus', color: 'slate' },
          { terrain: TERRAIN.TALL_GRASS, name: 'Hierba Alta', effect: '¡Captura!', color: 'yellow' },
          { terrain: TERRAIN.FOREST, name: 'Bosque', effect: '+20% DEF', color: 'green' },
          { terrain: TERRAIN.MOUNTAIN, name: 'Montaña', effect: '+40% DEF', color: 'amber' },
          { terrain: TERRAIN.WATER, name: 'Agua', effect: 'Bloquea', color: 'blue' },
          { terrain: TERRAIN.POKEMON_CENTER, name: 'Centro Pokémon', effect: 'Cura 20%', color: 'pink' },
        ].map(({ terrain, name, effect, color }, i) => {
          const colors: Record<string, string> = {
            slate: 'bg-slate-800/50 border-slate-600/30',
            yellow: 'bg-yellow-500/10 border-yellow-500/30',
            green: 'bg-green-500/10 border-green-500/30',
            amber: 'bg-amber-500/10 border-amber-500/30',
            blue: 'bg-blue-500/10 border-blue-500/30',
            pink: 'bg-pink-500/10 border-pink-500/30',
          };
          const textColors: Record<string, string> = {
            slate: 'text-slate-300',
            yellow: 'text-yellow-400',
            green: 'text-green-400',
            amber: 'text-amber-400',
            blue: 'text-blue-400',
            pink: 'text-pink-400',
          };

          return (
            <div
              key={terrain}
              className={`flex items-center gap-2 p-2 rounded-lg border ${colors[color]}`}
            >
              <div className="w-8 h-8 flex-shrink-0">
                <TutorialTile x={i} y={0} terrain={terrain} />
              </div>
              <div className="min-w-0">
                <div className={`text-[10px] font-bold ${textColors[color]}`}>{name}</div>
                <div className="text-[9px] text-slate-500">{effect}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-2 p-2 rounded-lg"
        style={{
          background: 'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(168,85,247,0.1) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
        }}
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-[10px] text-purple-300">
          Tipos como <span className="font-bold">Volador</span> ignoran costes de movimiento
        </span>
      </div>
    </div>
  );
}

function SlideCaptura() {
  return (
    <div className="space-y-3">
      <p className="text-slate-300 text-sm">
        En la <span className="text-yellow-400 font-semibold">Hierba Alta</span> puedes capturar Pokémon salvajes.
      </p>

      {/* Capture minigame preview */}
      <div
        className="relative p-4 rounded-xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.15) 0%, #0a0a0a 60%)',
          border: '3px solid #166534',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-around">
          {/* Wild Pokemon */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
              <img
                src={BULBASAUR_SPRITE}
                className="w-full h-full object-contain relative z-10"
                style={{ imageRendering: 'pixelated' }}
                alt=""
              />
            </div>
            <div
              className="text-[9px] font-bold text-green-400 mt-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              ¡SALVAJE!
            </div>
          </div>

          {/* Ring preview */}
          <div className="relative">
            <CaptureRingPreview />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[8px] text-amber-400 font-bold">¡ACIERTA EN EL CENTRO!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capture tips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Target className="w-4 h-4 text-amber-400" />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-amber-300">3 intentos con el anillo</div>
            <div className="text-[8px] text-slate-500">Más cerca del centro = más probabilidad</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Swords className="w-4 h-4 text-red-400" />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-red-300">Ataca para debilitar</div>
            <div className="text-[8px] text-slate-500">Menos HP = captura más fácil</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TUTORIAL_SLIDES = [
  {
    id: 'objetivo',
    title: 'Objetivo',
    icon: Target,
    color: { from: '#3B82F6', to: '#06B6D4' },
    content: SlideObjetivo,
  },
  {
    id: 'movimiento',
    title: 'Movimiento',
    icon: Move,
    color: { from: '#10B981', to: '#14B8A6' },
    content: SlideMovimiento,
  },
  {
    id: 'menu-accion',
    title: 'Menú de Acción',
    icon: Gamepad2,
    color: { from: '#F59E0B', to: '#F97316' },
    content: SlideMenuAccion,
  },
  {
    id: 'combate',
    title: 'Combate',
    icon: Swords,
    color: { from: '#EF4444', to: '#F43F5E' },
    content: SlideCombate,
  },
  {
    id: 'terreno',
    title: 'Terreno',
    icon: TreePine,
    color: { from: '#22C55E', to: '#10B981' },
    content: SlideTerreno,
  },
  {
    id: 'captura',
    title: 'Captura',
    icon: Sparkles,
    color: { from: '#EAB308', to: '#F59E0B' },
    content: SlideCaptura,
  },
];

export function HowToPlay({ onClose }: HowToPlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const sparkles = useMemo(() => generateSparkles(20), []);

  const slide = TUTORIAL_SLIDES[currentSlide];
  const Icon = slide.icon;
  const SlideContent = slide.content;

  const goToSlide = (index: number) => {
    if (index === currentSlide || isTransitioning) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 200);
  };

  const nextSlide = () => goToSlide(Math.min(currentSlide + 1, TUTORIAL_SLIDES.length - 1));
  const prevSlide = () => goToSlide(Math.max(currentSlide - 1, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Ambient glow */}
      <div
        className="absolute w-[150%] h-[150%] -top-1/4 -left-1/4 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${slide.color.from}15 0%, transparent 50%)`,
        }}
      />

      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {sparkles.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full animate-tutorial-sparkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.id % 2 === 0 ? slide.color.from : slide.color.to,
              boxShadow: `0 0 ${s.size * 2}px ${slide.color.from}`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-md mx-4">
        {/* GBA-style frame */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
            border: '4px solid',
            borderColor: '#475569 #1E293B #1E293B #475569',
            boxShadow: `0 0 60px ${slide.color.from}30, inset 0 0 30px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Header */}
          <div
            className="relative px-5 py-4 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${slide.color.from} 0%, ${slide.color.to} 100%)`,
            }}
          >
            {/* Shine effect */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>

            <div className="relative flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div
                  className="text-[9px] text-white/70 uppercase tracking-[0.2em] mb-0.5"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {currentSlide + 1} / {TUTORIAL_SLIDES.length}
                </div>
                <h2
                  className="text-lg font-black text-white"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  {slide.title}
                </h2>
              </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-white/50 transition-all duration-500 ease-out"
                style={{ width: `${((currentSlide + 1) / TUTORIAL_SLIDES.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="relative px-5 py-4 min-h-[340px]">
            <div
              className={`transition-all duration-200 ${
                isTransitioning
                  ? direction === 'next'
                    ? 'opacity-0 -translate-x-4'
                    : 'opacity-0 translate-x-4'
                  : 'opacity-100 translate-x-0'
              }`}
            >
              <SlideContent />
            </div>
          </div>

          {/* Navigation */}
          <div className="px-5 py-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              {/* Prev button */}
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl
                  font-bold text-xs uppercase tracking-wide
                  transition-all duration-200
                  ${currentSlide === 0
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Slide indicators */}
              <div className="flex gap-1.5">
                {TUTORIAL_SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => goToSlide(i)}
                    className="relative p-1 group"
                  >
                    <div
                      className={`
                        w-2 h-2 rounded-full transition-all duration-300
                        ${i === currentSlide
                          ? 'w-6 bg-white shadow-lg'
                          : 'bg-slate-700 group-hover:bg-slate-500'
                        }
                      `}
                      style={{
                        boxShadow: i === currentSlide ? `0 0 10px ${slide.color.from}` : 'none',
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Next / Finish button */}
              {currentSlide === TUTORIAL_SLIDES.length - 1 ? (
                <button
                  onClick={onClose}
                  className="
                    group flex items-center gap-2 px-5 py-2.5 rounded-xl
                    font-bold text-xs uppercase tracking-wide
                    bg-gradient-to-r from-amber-500 to-amber-600
                    hover:from-amber-400 hover:to-amber-500
                    text-black shadow-lg hover:shadow-amber-500/30
                    transition-all duration-200
                    hover:scale-105 active:scale-95
                  "
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                >
                  <span>¡A jugar!</span>
                  <Star className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={nextSlide}
                  className="
                    group flex items-center gap-2 px-4 py-2.5 rounded-xl
                    font-bold text-xs uppercase tracking-wide
                    bg-slate-800 hover:bg-slate-700
                    text-white
                    transition-all duration-200
                    hover:scale-105 active:scale-95
                  "
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes tutorial-sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 0.8; }
        }
        .animate-tutorial-sparkle {
          animation: tutorial-sparkle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
