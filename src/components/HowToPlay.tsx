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
  Mountain,
  Droplets
} from 'lucide-react';

interface HowToPlayProps {
  onClose: () => void;
}

// Pikachu sprite URL
const PIKACHU_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif';
const CHARMANDER_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif';

// Mini tile component for tutorial - matches actual game graphics
function MiniTile({
  type,
  children,
  highlight,
  selected,
  pathSegment
}: {
  type: 'plains' | 'tallgrass' | 'forest' | 'water' | 'mountain' | 'pokecenter';
  children?: React.ReactNode;
  highlight?: 'move' | 'attack';
  selected?: boolean;
  // Path segment: 'start', direction pairs like 'up-right', 'left-right', or 'end-left'
  pathSegment?: 'start' | 'end-up' | 'end-down' | 'end-left' | 'end-right' | 'up-down' | 'left-right' | 'up-right' | 'up-left' | 'down-right' | 'down-left';
}) {
  const bgColors = {
    plains: 'from-lime-400 to-green-500',
    tallgrass: 'from-green-500 to-emerald-600',
    forest: 'from-emerald-600 to-green-800',
    water: 'from-cyan-400 to-blue-500',
    mountain: 'from-amber-600 to-stone-500',
    pokecenter: 'from-rose-300 to-pink-400'
  };

  const borderColors = {
    plains: 'border-green-700',
    tallgrass: 'border-emerald-800',
    forest: 'border-green-950',
    water: 'border-blue-700',
    mountain: 'border-stone-700',
    pokecenter: 'border-pink-600'
  };

  // SVG path for different arrow segments (matching the game's PathSegment component)
  const getPathSvg = () => {
    if (!pathSegment) return null;

    const stroke = 'rgba(239, 68, 68, 0.9)';
    const strokeWidth = 6;

    // Start point - circle
    if (pathSegment === 'start') {
      return (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-20 overflow-visible">
          <circle cx="50" cy="50" r="12" fill={stroke} />
        </svg>
      );
    }

    // End points - arrow heads
    if (pathSegment.startsWith('end-')) {
      const dir = pathSegment.split('-')[1];
      let linePath = '';
      let arrowPath = '';

      if (dir === 'down') {
        linePath = 'M 50 0 L 50 40';
        arrowPath = 'M 30 45 L 50 75 L 70 45 L 50 55 Z';
      } else if (dir === 'up') {
        linePath = 'M 50 100 L 50 60';
        arrowPath = 'M 30 55 L 50 25 L 70 55 L 50 45 Z';
      } else if (dir === 'right') {
        linePath = 'M 0 50 L 40 50';
        arrowPath = 'M 45 30 L 75 50 L 45 70 L 55 50 Z';
      } else if (dir === 'left') {
        linePath = 'M 100 50 L 60 50';
        arrowPath = 'M 55 30 L 25 50 L 55 70 L 45 50 Z';
      }

      return (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-20 overflow-visible">
          <path d={linePath} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
          <path d={arrowPath} fill={stroke} />
        </svg>
      );
    }

    // Middle segments - lines
    let d = '';
    if (pathSegment === 'up-down') d = 'M 50 0 L 50 100';
    else if (pathSegment === 'left-right') d = 'M 0 50 L 100 50';
    else if (pathSegment === 'up-right') d = 'M 50 0 L 50 50 L 100 50';
    else if (pathSegment === 'up-left') d = 'M 50 0 L 50 50 L 0 50';
    else if (pathSegment === 'down-right') d = 'M 50 100 L 50 50 L 100 50';
    else if (pathSegment === 'down-left') d = 'M 50 100 L 50 50 L 0 50';

    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-20 overflow-visible">
        <path d={d} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  };

  return (
    <div className={`
      relative aspect-square rounded-xl overflow-visible
      bg-gradient-to-br ${bgColors[type]}
      border-b-[4px] ${borderColors[type]}
      ${selected ? 'ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
    `}>
      {/* Top highlight - like the game */}
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />

      {/* Terrain decorations - matching game exactly */}
      {type === 'plains' && (
        <div className="absolute inset-0 opacity-20 rounded-xl bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(255,255,255,0.4)_8px,rgba(255,255,255,0.4)_10px)]" />
      )}
      {type === 'tallgrass' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,80,0,0.6)_3px,rgba(0,80,0,0.6)_5px)]" />
          <div className="absolute inset-x-0 top-[15%] h-[40%] opacity-40">
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_4px,rgba(34,197,94,0.8)_4px,transparent_6px,transparent_8px)]"
                 style={{ clipPath: 'polygon(0% 100%, 10% 20%, 20% 100%, 30% 30%, 40% 100%, 50% 10%, 60% 100%, 70% 40%, 80% 100%, 90% 20%, 100% 100%)' }} />
          </div>
        </div>
      )}
      {type === 'forest' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 opacity-40">
            <div className="absolute w-[60%] h-[60%] rounded-full bg-green-900/60 -top-[10%] -left-[10%]" />
            <div className="absolute w-[50%] h-[50%] rounded-full bg-green-900/50 -bottom-[5%] -right-[5%]" />
          </div>
        </div>
      )}
      {type === 'water' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(100deg,transparent,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_20px)]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.6)_0%,transparent_30%)]" />
        </div>
      )}
      {type === 'mountain' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute bottom-0 left-[10%] w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-stone-600" />
            <div className="absolute bottom-0 left-[35%] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-stone-500" />
            <div className="absolute bottom-0 right-[15%] w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-stone-600" />
          </div>
          <div className="absolute bottom-[14px] left-[40%] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-white opacity-60" />
        </div>
      )}
      {type === 'pokecenter' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_0%,transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <div className="relative w-[50%] h-[50%]">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[30%] h-full bg-white rounded-sm" />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[30%] bg-white rounded-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Highlight overlays */}
      {highlight === 'move' && (
        <div className="absolute inset-0 rounded-xl bg-blue-400/40 border-2 border-blue-300/60" />
      )}
      {highlight === 'attack' && (
        <div className="absolute inset-0 rounded-xl bg-red-500/50 border-2 border-red-400/70" />
      )}

      {/* Path arrows - rendered like the game */}
      {getPathSvg()}

      {/* Content (Pokemon, etc) */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
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
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed text-sm">
          <span className="text-blue-400 font-bold">1.</span> Toca tu Pokémon para seleccionarlo.
          Las casillas <span className="text-blue-400 font-semibold">azules</span> muestran dónde puede moverse.
        </p>

        {/* Visual grid example - matches actual game */}
        <div className="grid grid-cols-5 gap-1.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
          <MiniTile type="plains" />
          <MiniTile type="plains" highlight="move" />
          <MiniTile type="plains" highlight="move" />
          <MiniTile type="forest" />
          <MiniTile type="water" />

          <MiniTile type="plains" highlight="move" />
          <MiniTile type="plains" highlight="move" pathSegment="up-right" />
          <MiniTile type="plains" highlight="move" pathSegment="left-right" />
          <MiniTile type="plains" pathSegment="end-right" />
          <MiniTile type="water" />

          <MiniTile type="plains" selected pathSegment="start">
            <img src={PIKACHU_SPRITE} className="w-7 h-7 object-contain scale-x-[-1]" style={{ imageRendering: 'pixelated' }} alt="" />
          </MiniTile>
          <MiniTile type="plains" highlight="move" pathSegment="up-down" />
          <MiniTile type="tallgrass" highlight="move" />
          <MiniTile type="plains" />
          <MiniTile type="mountain" />

          <MiniTile type="plains" />
          <MiniTile type="plains" highlight="move" />
          <MiniTile type="plains" />
          <MiniTile type="plains" />
          <MiniTile type="plains" />
        </div>

        <p className="text-slate-300 leading-relaxed text-sm">
          <span className="text-red-400 font-bold">2.</span> Toca el destino. Aparece una{' '}
          <span className="text-red-400 font-semibold">flecha roja</span> mostrando el camino.
        </p>
      </div>
    )
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
            {/* Tile with Pikachu preview */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-400 to-green-500 border-b-4 border-green-700 flex items-center justify-center">
              <img src={PIKACHU_SPRITE} className="w-12 h-12 object-contain scale-x-[-1] opacity-60" style={{ imageRendering: 'pixelated' }} alt="" />
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
            { type: 'plains' as const, name: 'Llanura', effect: 'Sin bonus', icon: null },
            { type: 'tallgrass' as const, name: 'Hierba Alta', effect: '¡Captura!', special: true },
            { type: 'forest' as const, name: 'Bosque', effect: '+20% DEF' },
            { type: 'mountain' as const, name: 'Montaña', effect: '+40% DEF' },
            { type: 'water' as const, name: 'Agua', effect: 'Bloquea' },
            { type: 'pokecenter' as const, name: 'Centro Pokémon', effect: 'Cura 20%', special: true }
          ].map(({ type, name, effect, special }) => (
            <div key={type} className={`flex items-center gap-2 p-2 rounded-lg ${special ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-slate-800/50'}`}>
              <div className="w-8 h-8 flex-shrink-0">
                <MiniTile type={type} />
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
              <MiniTile type="tallgrass" />
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
