import { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  MousePointer,
  Swords,
  Hand,
  Undo2,
  TreePine,
  Sparkles,
  Zap,
  Shield,
} from 'lucide-react';
import { Tile } from './GameBoard/Tile';
import { TERRAIN } from '../constants/terrain';
import type { TerrainType, Position } from '../types/game';

interface HowToPlayProps {
  onClose: () => void;
}

// Pikachu sprite URL
const PIKACHU_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif';
const CHARMANDER_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif';

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
      {/* Overlay children (Pokemon sprites) */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

const TUTORIAL_SLIDES = [
  {
    id: 'objetivo',
    title: 'Objetivo',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          <span className="text-white font-semibold">PokéTactics</span> es un juego táctico por turnos inspirado en{' '}
          <span className="text-yellow-400 font-semibold">Fire Emblem</span> y{' '}
          <span className="text-yellow-400 font-semibold">Advance Wars</span>.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-sm text-slate-400">
            <span className="text-white font-bold">Meta:</span> Elimina a todos los Pokémon del rival para ganar.
          </p>
        </div>
        <div className="flex gap-6 justify-center mt-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 border-2 border-blue-500/50">
              <img src={PIKACHU_SPRITE} className="w-10 h-10 object-contain scale-x-[-1]" style={{ imageRendering: 'pixelated' }} alt="P1" />
            </div>
            <span className="text-xs text-blue-400 font-bold">JUGADOR 1</span>
          </div>
          <div className="text-3xl text-slate-600 self-center font-bold">VS</div>
          <div className="text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 border-2 border-red-500/50">
              <img src={CHARMANDER_SPRITE} className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} alt="P2" />
            </div>
            <span className="text-xs text-red-400 font-bold">JUGADOR 2</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'seleccion',
    title: 'Selección y Movimiento',
    icon: MousePointer,
    color: 'from-emerald-500 to-teal-500',
    content: (() => {
      // Path from Pikachu (0,2) to destination (3,1)
      const tutorialPath: Position[] = [
        { x: 0, y: 2 }, // Start - Pikachu
        { x: 1, y: 2 }, // Up
        { x: 1, y: 1 }, // Corner
        { x: 2, y: 1 }, // Right
        { x: 3, y: 1 }, // End
      ];

      return (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed text-sm">
            <span className="text-blue-400 font-bold">1.</span> Toca tu Pokémon para seleccionarlo.
            Las casillas <span className="text-blue-400 font-semibold">azules</span> muestran dónde puede moverse.
          </p>

          {/* Visual grid example - uses ACTUAL game Tile component */}
          <div className="grid grid-cols-5 gap-1 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
            {/* Row 0 */}
            <TutorialTile x={0} y={0} terrain={TERRAIN.GRASS} />
            <TutorialTile x={1} y={0} terrain={TERRAIN.GRASS} canMove />
            <TutorialTile x={2} y={0} terrain={TERRAIN.GRASS} canMove />
            <TutorialTile x={3} y={0} terrain={TERRAIN.FOREST} />
            <TutorialTile x={4} y={0} terrain={TERRAIN.WATER} />

            {/* Row 1 - has path */}
            <TutorialTile x={0} y={1} terrain={TERRAIN.GRASS} canMove />
            <TutorialTile x={1} y={1} terrain={TERRAIN.GRASS} canMove path={tutorialPath} />
            <TutorialTile x={2} y={1} terrain={TERRAIN.GRASS} canMove path={tutorialPath} />
            <TutorialTile x={3} y={1} terrain={TERRAIN.GRASS} path={tutorialPath} />
            <TutorialTile x={4} y={1} terrain={TERRAIN.WATER} />

            {/* Row 2 - Pikachu here */}
            <TutorialTile x={0} y={2} terrain={TERRAIN.GRASS} isSelected path={tutorialPath}>
              <img src={PIKACHU_SPRITE} className="w-[90%] h-[90%] object-contain scale-x-[-1] drop-shadow-lg" style={{ imageRendering: 'pixelated' }} alt="" />
            </TutorialTile>
            <TutorialTile x={1} y={2} terrain={TERRAIN.GRASS} canMove path={tutorialPath} />
            <TutorialTile x={2} y={2} terrain={TERRAIN.TALL_GRASS} canMove />
            <TutorialTile x={3} y={2} terrain={TERRAIN.GRASS} />
            <TutorialTile x={4} y={2} terrain={TERRAIN.MOUNTAIN} />

            {/* Row 3 */}
            <TutorialTile x={0} y={3} terrain={TERRAIN.GRASS} />
            <TutorialTile x={1} y={3} terrain={TERRAIN.GRASS} canMove />
            <TutorialTile x={2} y={3} terrain={TERRAIN.GRASS} />
            <TutorialTile x={3} y={3} terrain={TERRAIN.GRASS} />
            <TutorialTile x={4} y={3} terrain={TERRAIN.GRASS} />
          </div>

          <p className="text-slate-300 leading-relaxed text-sm">
            <span className="text-red-400 font-bold">2.</span> Toca el destino. Aparece una{' '}
            <span className="text-red-400 font-semibold">flecha roja</span> mostrando el camino.
          </p>
        </div>
      );
    })()
  },
  {
    id: 'menu-accion',
    title: 'Menú de Acción',
    icon: Hand,
    color: 'from-amber-500 to-orange-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed text-sm">
          Al elegir destino, aparece el <span className="text-amber-400 font-semibold">menú de acción</span> junto a la casilla:
        </p>

        {/* Action menu mockup */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Tile with Pikachu preview - uses actual game tile */}
            <div className="w-16 h-16">
              <TutorialTile x={0} y={0} terrain={TERRAIN.GRASS}>
                <img src={PIKACHU_SPRITE} className="w-[80%] h-[80%] object-contain scale-x-[-1] opacity-60 drop-shadow-lg" style={{ imageRendering: 'pixelated' }} alt="" />
              </TutorialTile>
            </div>

            {/* Menu */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
              {/* Notch */}
              <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-r-[6px] border-r-amber-100 border-y-[6px] border-y-transparent" />

              <div className="bg-gradient-to-b from-amber-50 to-amber-100 border-[3px] border-amber-900 rounded-sm shadow-lg min-w-[90px]">
                <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 px-2 py-1 border-b-2 border-amber-900">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-amber-100">Acción</span>
                </div>
                <div className="p-1 space-y-0.5">
                  <button className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-bold uppercase bg-gradient-to-r from-red-100 to-red-50 text-red-900 border border-red-300 rounded-sm">
                    <Swords className="w-3 h-3" />
                    Atacar
                  </button>
                  <button className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-bold uppercase bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-900 border border-emerald-300 rounded-sm">
                    <Hand className="w-3 h-3" />
                    Esperar
                  </button>
                  <button className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-bold uppercase bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-300 rounded-sm">
                    <Undo2 className="w-3 h-3" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-red-300">
            <Swords className="w-4 h-4" />
            <span><strong>Atacar</strong> - Si hay enemigos en rango</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <Hand className="w-4 h-4" />
            <span><strong>Esperar</strong> - Confirma el movimiento</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Undo2 className="w-4 h-4" />
            <span><strong>Cancelar</strong> - Volver atrás</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'combate',
    title: 'Combate',
    icon: Swords,
    color: 'from-red-500 to-rose-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed text-sm">
          Al elegir <span className="text-red-400 font-semibold">Atacar</span>, las casillas{' '}
          <span className="text-red-400 font-semibold">rojas</span> muestran enemigos a tu alcance.
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">Efectividad de Tipos</div>
              <div className="text-xs text-slate-400">Agua → Fuego = <span className="text-green-400">×2 daño</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">Contraataque</div>
              <div className="text-xs text-slate-400">¡El defensor puede devolver el golpe!</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/30">
            <div className="text-lg font-bold text-green-400">×2</div>
            <div className="text-[10px] text-green-300">Super efectivo</div>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/30">
            <div className="text-lg font-bold text-red-400">×0.5</div>
            <div className="text-[10px] text-red-300">Poco efectivo</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'terreno',
    title: 'Terreno',
    icon: TreePine,
    color: 'from-green-500 to-emerald-500',
    content: (
      <div className="space-y-3">
        <p className="text-slate-300 leading-relaxed text-sm">
          Pulsa una casilla vacía para ver sus stats. Cada terreno tiene efectos únicos:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { terrain: TERRAIN.GRASS, name: 'Llanura', effect: 'Sin bonus' },
            { terrain: TERRAIN.TALL_GRASS, name: 'Hierba Alta', effect: '¡Captura!', special: true },
            { terrain: TERRAIN.FOREST, name: 'Bosque', effect: '+20% DEF' },
            { terrain: TERRAIN.MOUNTAIN, name: 'Montaña', effect: '+40% DEF' },
            { terrain: TERRAIN.WATER, name: 'Agua', effect: 'Bloquea' },
            { terrain: TERRAIN.POKEMON_CENTER, name: 'Centro Pokémon', effect: 'Cura 20%', special: true }
          ].map(({ terrain, name, effect, special }, i) => (
            <div key={terrain} className={`flex items-center gap-2 p-2 rounded-lg ${special ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-slate-800/50'}`}>
              <div className="w-8 h-8 flex-shrink-0">
                <TutorialTile x={i} y={0} terrain={terrain} />
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-medium truncate ${special ? 'text-yellow-400' : 'text-white'}`}>{name}</div>
                <div className="text-[10px] text-slate-400">{effect}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 text-center">
          Tipos como Volador ignoran costes de movimiento
        </p>
      </div>
    )
  },
  {
    id: 'captura',
    title: 'Captura',
    icon: Sparkles,
    color: 'from-yellow-500 to-amber-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed text-sm">
          La <span className="text-yellow-400 font-semibold">Hierba Alta</span> es tu forma de conseguir refuerzos.
        </p>

        <div className="bg-gradient-to-br from-teal-900/50 to-emerald-900/50 rounded-xl p-4 border border-teal-600/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex-shrink-0">
              <TutorialTile x={0} y={0} terrain={TERRAIN.TALL_GRASS} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Hierba Alta</div>
              <div className="text-xs text-teal-300">30% probabilidad al terminar turno</div>
            </div>
          </div>
          <ol className="text-sm text-slate-300 space-y-1.5 list-decimal list-inside">
            <li>Mueve tu Pokémon a Hierba Alta</li>
            <li>Pulsa <span className="text-emerald-400 font-semibold">Esperar</span></li>
            <li>¡Aparece un minijuego de captura!</li>
            <li>El Pokémon se une a tu equipo</li>
          </ol>
        </div>

        <div className="text-center p-3 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl border border-pink-500/20">
          <span className="text-sm text-pink-300">💗 Los Centros Pokémon curan 20% HP cada turno</span>
        </div>
      </div>
    )
  }
];

export function HowToPlay({ onClose }: HowToPlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = TUTORIAL_SLIDES[currentSlide];
  const Icon = slide.icon;

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, TUTORIAL_SLIDES.length - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`relative px-6 py-5 bg-gradient-to-r ${slide.color}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-white/70 uppercase tracking-wider">
                {currentSlide + 1} / {TUTORIAL_SLIDES.length}
              </div>
              <h2 className="text-xl font-black text-white">{slide.title}</h2>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-white/40 transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / TUTORIAL_SLIDES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[340px]">
          {slide.content}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              currentSlide === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Anterior</span>
          </button>

          {/* Slide indicators */}
          <div className="flex gap-1.5">
            {TUTORIAL_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? 'bg-white w-6' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {currentSlide === TUTORIAL_SLIDES.length - 1 ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <span className="text-sm">¡A jugar!</span>
              <Sparkles className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={nextSlide}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
            >
              <span className="text-sm font-medium">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
