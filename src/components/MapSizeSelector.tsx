import { useState, useCallback } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { MAP_SIZES, type MapSize } from '../utils/mapGenerator';
import { useSFX } from '../hooks/useSFX';

interface MapSizeSelectorProps {
  onSelect: (width: number, height: number) => void;
  onBack: () => void;
}

function MiniGrid({ width, height }: { width: number; height: number }) {
  const cellSize = Math.min(6, Math.floor(48 / Math.max(width, height)));
  return (
    <div
      className="grid gap-px opacity-60"
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: width * height }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-400/50 rounded-[1px]"
          style={{ width: cellSize, height: cellSize }}
        />
      ))}
    </div>
  );
}

const SIZE_LABELS: Record<string, string> = {
  'Pequeño': 'S',
  'Mediano': 'M',
  'Grande': 'L',
};

const SIZE_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  'Pequeño': { bg: 'from-emerald-600 to-emerald-800', border: 'border-emerald-400/50', glow: 'shadow-emerald-500/30' },
  'Mediano': { bg: 'from-blue-600 to-blue-800', border: 'border-blue-400/50', glow: 'shadow-blue-500/30' },
  'Grande': { bg: 'from-purple-600 to-purple-800', border: 'border-purple-400/50', glow: 'shadow-purple-500/30' },
};

export function MapSizeSelector({ onSelect, onBack }: MapSizeSelectorProps) {
  const [selected, setSelected] = useState<MapSize>(MAP_SIZES[1]); // Default: Medium
  const { playSFX } = useSFX();

  const handleSelect = useCallback((size: MapSize) => {
    playSFX('button_click', 0.4);
    setSelected(size);
  }, [playSFX]);

  const handleConfirm = useCallback(() => {
    playSFX('button_click', 0.5);
    onSelect(selected.width, selected.height);
  }, [playSFX, onSelect, selected]);

  const handleBack = useCallback(() => {
    playSFX('button_click', 0.4);
    onBack();
  }, [playSFX, onBack]);

  return (
    <div className="fixed inset-0 z-50 bg-[#030305] flex flex-col items-center justify-center select-none">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.15),transparent_70%)]" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-md">
        {/* Title */}
        <h2
          className="text-base md:text-lg text-amber-400 tracking-wide"
          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
        >
          Tamaño de Mapa
        </h2>

        {/* Size cards */}
        <div className="flex gap-3 w-full justify-center">
          {MAP_SIZES.map((size) => {
            const isSelected = selected.label === size.label;
            const colors = SIZE_COLORS[size.label];
            return (
              <button
                key={size.label}
                onClick={() => handleSelect(size)}
                className={`
                  relative flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl
                  border-2 transition-all duration-200
                  ${isSelected
                    ? `bg-gradient-to-b ${colors.bg} ${colors.border} shadow-lg ${colors.glow} scale-105`
                    : 'bg-slate-900/80 border-slate-700/50 hover:border-slate-500/50'
                  }
                `}
              >
                {/* Badge */}
                <div className={`
                  text-lg md:text-xl font-bold
                  ${isSelected ? 'text-white' : 'text-slate-400'}
                `}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {SIZE_LABELS[size.label]}
                </div>

                {/* Mini grid preview */}
                <MiniGrid width={size.width} height={size.height} />

                {/* Label */}
                <div
                  className={`text-[8px] md:text-[9px] tracking-wide ${isSelected ? 'text-white/90' : 'text-slate-500'}`}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {size.label}
                </div>

                {/* Dimensions */}
                <div className={`text-[7px] ${isSelected ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {size.width}x{size.height}
                </div>
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-slate-800 hover:bg-slate-700 border border-slate-600/50
              transition-all duration-150 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span
              className="text-[9px] md:text-[10px] text-slate-300 font-bold"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Volver
            </span>
          </button>

          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500
              border border-amber-400/50 shadow-lg shadow-amber-500/20
              transition-all duration-150 active:scale-95"
          >
            <Play className="w-4 h-4 text-white" fill="white" />
            <span
              className="text-[10px] md:text-xs text-white font-bold"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Jugar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
