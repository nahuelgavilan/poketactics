import { useState, useCallback } from 'react';
import { ArrowLeft, Play, Grid2x2, Ruler } from 'lucide-react';
import { MAP_SIZES, type MapSize } from '../utils/mapGenerator';
import { useSFX } from '../hooks/useSFX';
import {
  StartMenuShell,
  MenuActionButton,
  MenuBadge,
  MenuPanel,
  MenuStatRow,
} from './menu/StartMenuTheme';

interface MapSizeSelectorProps {
  onSelect: (width: number, height: number) => void;
  onBack: () => void;
}

function MiniGrid({ width, height, selected }: { width: number; height: number; selected: boolean }) {
  const cellSize = Math.min(6, Math.floor(48 / Math.max(width, height)));
  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: width * height }).map((_, i) => (
        <div
          key={i}
          className={selected ? 'bg-amber-300/70 rounded-[1px]' : 'bg-slate-500/65 rounded-[1px]'}
          style={{ width: cellSize, height: cellSize }}
        />
      ))}
    </div>
  );
}

const SIZE_LABELS: Record<string, string> = {
  Pequeno: 'S',
  Mediano: 'M',
  Grande: 'L',
  Pequeño: 'S',
};

const SIZE_ACCENT: Record<string, 'green' | 'blue' | 'violet'> = {
  Pequeno: 'green',
  Mediano: 'blue',
  Grande: 'violet',
  Pequeño: 'green',
};

export function MapSizeSelector({ onSelect, onBack }: MapSizeSelectorProps) {
  const [selected, setSelected] = useState<MapSize>(MAP_SIZES[1]);
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
    <StartMenuShell>
      <div className="h-full flex items-center justify-center p-3 md:p-6">
        <div className="w-full max-w-4xl flex flex-col gap-3 md:gap-4 animate-start-menu-slide-up">
          <button
            onClick={handleBack}
            className="self-start inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-slate-600 bg-slate-900/80 hover:bg-slate-800/95 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-100" />
            <span className="text-[9px] uppercase tracking-[0.12em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Volver
            </span>
          </button>

          <MenuPanel
            title="Seleccion de Mapa"
            subtitle="Choose the battlefield size"
            accent="amber"
            rightSlot={<MenuBadge label="Setup" accent="blue" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-3 md:gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MAP_SIZES.map((size) => {
                  const isSelected = selected.label === size.label;
                  const accent = SIZE_ACCENT[size.label] || 'blue';

                  return (
                    <button
                      key={size.label}
                      onClick={() => handleSelect(size)}
                      className={`relative p-3 rounded-sm border-[2px] transition-all duration-150 ${
                        isSelected
                          ? accent === 'green'
                            ? 'bg-emerald-900/55 border-emerald-400/80 shadow-[0_0_22px_rgba(16,185,129,0.25)]'
                            : accent === 'violet'
                            ? 'bg-violet-900/55 border-violet-400/80 shadow-[0_0_22px_rgba(139,92,246,0.25)]'
                            : 'bg-blue-900/55 border-blue-400/80 shadow-[0_0_22px_rgba(59,130,246,0.25)]'
                          : 'bg-slate-900/80 border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <span className="pointer-events-none absolute inset-[2px] border border-white/10 rounded-[2px]" />
                      <div className="relative flex flex-col items-center gap-2">
                        <span
                          className={`text-lg ${isSelected ? 'text-white' : 'text-slate-400'}`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {SIZE_LABELS[size.label] || size.label[0]}
                        </span>
                        <MiniGrid width={size.width} height={size.height} selected={isSelected} />
                        <span
                          className={`text-[8px] uppercase tracking-[0.12em] ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {size.label}
                        </span>
                        <span
                          className={`text-[8px] uppercase tracking-[0.1em] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {size.width}x{size.height}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-950/70 border border-slate-700 rounded-sm p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Grid2x2 className="w-4 h-4 text-amber-300" />
                  <p className="text-[9px] uppercase tracking-[0.12em] text-amber-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Seleccion actual
                  </p>
                </div>

                <MenuStatRow label="Label" value={selected.label} />
                <MenuStatRow label="Ancho" value={`${selected.width} tiles`} />
                <MenuStatRow label="Alto" value={`${selected.height} tiles`} />
                <MenuStatRow label="Area" value={`${selected.width * selected.height} cells`} />

                <div className="pt-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-slate-300" />
                  <p
                    className="text-[8px] uppercase tracking-[0.1em] text-slate-300"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Mas espacio = mas flanqueo y vision.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <MenuActionButton
                label="Volver"
                icon={ArrowLeft}
                color="slate"
                onClick={handleBack}
              />
              <MenuActionButton
                label="Iniciar"
                icon={Play}
                color="amber"
                onClick={handleConfirm}
                subtitle={`${selected.width}x${selected.height}`}
              />
            </div>
          </MenuPanel>
        </div>
      </div>
    </StartMenuShell>
  );
}
