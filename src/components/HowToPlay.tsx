import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Move,
  Sword,
  Shield,
  TreePine,
  Droplets,
  Mountain,
  Sparkles,
  Zap
} from 'lucide-react';

interface HowToPlayProps {
  onClose: () => void;
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
          <span className="text-white font-semibold">PokéWar</span> es un juego táctico por turnos para{' '}
          <span className="text-yellow-400 font-semibold">2 jugadores</span> en el mismo dispositivo.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-sm text-slate-400">
            🎯 <span className="text-white">Meta:</span> Elimina a todos los Pokémon del rival para ganar.
          </p>
        </div>
        <div className="flex gap-4 justify-center mt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 border border-blue-500/30">
              <span className="text-xl">🔵</span>
            </div>
            <span className="text-xs text-blue-400 font-medium">P1 AZUL</span>
          </div>
          <div className="text-2xl text-slate-600 self-center">VS</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 border border-red-500/30">
              <span className="text-xl">🔴</span>
            </div>
            <span className="text-xs text-red-400 font-medium">P2 ROJO</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'movimiento',
    title: 'Movimiento',
    icon: Move,
    color: 'from-emerald-500 to-teal-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Toca uno de tus Pokémon para seleccionarlo. Las casillas{' '}
          <span className="text-blue-400 font-semibold">azules</span> muestran dónde puede moverse.
        </p>
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          {[...Array(16)].map((_, i) => {
            const isUnit = i === 5;
            const canMove = [1, 2, 4, 6, 9, 10].includes(i);
            return (
              <div
                key={i}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-xs
                  ${isUnit ? 'bg-emerald-600 ring-2 ring-white' : ''}
                  ${canMove ? 'bg-blue-500/30 ring-2 ring-blue-400/50' : 'bg-slate-700/50'}
                `}
              >
                {isUnit && '🐲'}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 text-center">
          Cada Pokémon tiene diferente rango de movimiento (MOV)
        </p>
      </div>
    )
  },
  {
    id: 'ataque',
    title: 'Combate',
    icon: Sword,
    color: 'from-red-500 to-orange-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Después de mover, las casillas <span className="text-red-400 font-semibold">rojas</span> muestran enemigos a tu alcance.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">Efectividad de Tipos</div>
              <div className="text-xs text-slate-400">Fuego → Planta = x2 daño</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">Defensa</div>
              <div className="text-xs text-slate-400">DEF reduce el daño recibido</div>
            </div>
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/20">
          <span className="text-sm text-red-300">💥 ¡Usa los tipos a tu favor!</span>
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
          El terreno afecta el movimiento y la defensa:
        </p>
        <div className="space-y-2">
          {[
            { icon: '🌿', name: 'Llanura', effect: 'Sin efecto', color: 'bg-emerald-200' },
            { icon: '🌲', name: 'Bosque', effect: '+20% DEF, MOV×2', color: 'bg-emerald-700' },
            { icon: '🌾', name: 'Hierba Alta', effect: '¡Captura Pokémon!', color: 'bg-teal-600', special: true },
            { icon: '💧', name: 'Agua', effect: 'Intransitable', color: 'bg-blue-400' },
            { icon: '⛰️', name: 'Montaña', effect: 'Intransitable', color: 'bg-stone-600' }
          ].map(({ icon, name, effect, color, special }) => (
            <div
              key={name}
              className={`flex items-center gap-3 p-2 rounded-lg ${special ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-slate-800/50'}`}
            >
              <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center text-sm`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${special ? 'text-yellow-400' : 'text-white'}`}>{name}</div>
                <div className="text-xs text-slate-400">{effect}</div>
              </div>
            </div>
          ))}
        </div>
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
        <p className="text-slate-300 leading-relaxed">
          ¡La <span className="text-yellow-400 font-semibold">Hierba Alta</span> es tu única forma de conseguir refuerzos!
        </p>
        <div className="bg-gradient-to-br from-teal-900/50 to-emerald-900/50 rounded-xl p-4 border border-teal-600/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center animate-pulse">
              🌾
            </div>
            <div>
              <div className="text-white font-bold">Hierba Alta</div>
              <div className="text-xs text-teal-300">30% probabilidad</div>
            </div>
          </div>
          <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
            <li>Mueve tu Pokémon a Hierba Alta</li>
            <li>Termina tu turno ahí</li>
            <li>¡Con suerte aparecerá un salvaje!</li>
            <li>Se une a tu equipo instantáneamente</li>
          </ol>
        </div>
        <p className="text-xs text-slate-500 text-center italic">
          Los Pokémon capturados entran "cansados" (no actúan ese turno)
        </p>
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
        <div className="px-6 py-6 min-h-[320px]">
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
