import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Shuffle, Trash2 } from 'lucide-react';
import { TERRAIN } from '../constants/terrain';
import { TERRAIN_PROPS } from '../constants/terrain';
import { TERRAIN_THEME, TerrainDecoration } from './GameBoard/Tile';
import { MAP_SIZES, DEFAULT_MAP_SIZE, generateRandomMap, getBridgeOrientation, type MapSize } from '../utils/mapGenerator';
import { useSFX } from '../hooks/useSFX';
import type { GameMap, TerrainType } from '../types/game';

interface MapEditorProps {
  onPlay: (map: GameMap) => void;
  onBack: () => void;
}

const TERRAIN_LIST: { id: TerrainType; key: string }[] = [
  { id: TERRAIN.GRASS as TerrainType, key: 'GRASS' },
  { id: TERRAIN.TALL_GRASS as TerrainType, key: 'TALL_GRASS' },
  { id: TERRAIN.FOREST as TerrainType, key: 'FOREST' },
  { id: TERRAIN.SAND as TerrainType, key: 'SAND' },
  { id: TERRAIN.WATER as TerrainType, key: 'WATER' },
  { id: TERRAIN.MOUNTAIN as TerrainType, key: 'MOUNTAIN' },
  { id: TERRAIN.BRIDGE as TerrainType, key: 'BRIDGE' },
  { id: TERRAIN.BERRY_BUSH as TerrainType, key: 'BERRY_BUSH' },
  { id: TERRAIN.POKEMON_CENTER as TerrainType, key: 'POKEMON_CENTER' },
  { id: TERRAIN.BASE as TerrainType, key: 'BASE' },
];

const SIZE_LABELS: Record<string, string> = {
  'Pequeño': 'S',
  'Mediano': 'M',
  'Grande': 'L',
};

export function MapEditor({ onPlay, onBack }: MapEditorProps) {
  const [sizeIndex, setSizeIndex] = useState(1); // Default: Medium
  const [mapData, setMapData] = useState<GameMap>(() => generateRandomMap(DEFAULT_MAP_SIZE.width, DEFAULT_MAP_SIZE.height));
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>(TERRAIN.GRASS as TerrainType);
  const { playSFX } = useSFX();

  // Mutable ref for drag-painting performance
  const paintingRef = useRef(false);
  const mapRef = useRef(mapData);
  const dirtyRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    mapRef.current = mapData;
  }, [mapData]);

  const currentSize = MAP_SIZES[sizeIndex];
  const height = mapData.length;
  const width = mapData[0]?.length ?? 0;

  const paintTile = useCallback((x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (mapRef.current[y][x] === selectedTerrain) return;
    mapRef.current = mapRef.current.map((row, ry) =>
      ry === y ? row.map((cell, cx) => cx === x ? selectedTerrain : cell) : row
    );
    dirtyRef.current = true;
  }, [selectedTerrain, width, height]);

  const flushPaint = useCallback(() => {
    if (dirtyRef.current) {
      setMapData([...mapRef.current.map(row => [...row])]);
      dirtyRef.current = false;
    }
  }, []);

  const handlePointerDown = useCallback((x: number, y: number) => {
    paintingRef.current = true;
    paintTile(x, y);
    flushPaint();
  }, [paintTile, flushPaint]);

  const handlePointerEnter = useCallback((x: number, y: number) => {
    if (!paintingRef.current) return;
    paintTile(x, y);
    flushPaint();
  }, [paintTile, flushPaint]);

  const handlePointerUp = useCallback(() => {
    paintingRef.current = false;
    flushPaint();
  }, [flushPaint]);

  // Touch drag support
  const gridRef = useRef<HTMLDivElement>(null);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!paintingRef.current) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const pos = el.getAttribute('data-editor-pos');
    if (!pos) return;
    const [xStr, yStr] = pos.split(',');
    paintTile(parseInt(xStr), parseInt(yStr));
    flushPaint();
  }, [paintTile, flushPaint]);

  // Global pointer up
  useEffect(() => {
    const up = () => {
      paintingRef.current = false;
      flushPaint();
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('touchend', up);
    };
  }, [flushPaint]);

  const handleSizeChange = useCallback((idx: number) => {
    playSFX('button_click', 0.4);
    setSizeIndex(idx);
    const size = MAP_SIZES[idx];
    const newMap = generateRandomMap(size.width, size.height);
    setMapData(newMap);
  }, [playSFX]);

  const handleRandomize = useCallback(() => {
    playSFX('button_click', 0.4);
    setMapData(generateRandomMap(currentSize.width, currentSize.height));
  }, [playSFX, currentSize]);

  const handleClear = useCallback(() => {
    playSFX('button_click', 0.4);
    const cleared: GameMap = Array(currentSize.height).fill(0).map(() =>
      Array(currentSize.width).fill(TERRAIN.GRASS as TerrainType)
    );
    setMapData(cleared);
  }, [playSFX, currentSize]);

  const handlePlay = useCallback(() => {
    playSFX('button_click', 0.5);
    onPlay(mapData);
  }, [playSFX, onPlay, mapData]);

  const handleBack = useCallback(() => {
    playSFX('button_click', 0.4);
    onBack();
  }, [playSFX, onBack]);

  // Tile size: smaller for editor to fit more tiles
  const tileSize = Math.min(40, Math.floor(Math.min(
    (window.innerWidth - 32) / width,
    (window.innerHeight - 260) / height
  )));

  return (
    <div className="fixed inset-0 z-50 bg-[#030305] flex flex-col select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-700/50">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-300" />
          <span className="text-[8px] text-slate-300 font-bold hidden sm:inline"
            style={{ fontFamily: '"Press Start 2P", monospace' }}>
            Volver
          </span>
        </button>

        <h2
          className="text-[10px] md:text-xs text-amber-400 tracking-wide"
          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 0 #000' }}
        >
          Editor de Mapa
        </h2>

        <div className="flex gap-2">
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-800/80 hover:bg-blue-700/80 border border-blue-600/40 transition-colors"
            title="Aleatorio"
          >
            <Shuffle className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-[7px] text-blue-300 font-bold hidden sm:inline"
              style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Aleatorio
            </span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800/80 border border-red-600/40 transition-colors"
            title="Limpiar"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-300" />
            <span className="text-[7px] text-red-300 font-bold hidden sm:inline"
              style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Limpiar
            </span>
          </button>
        </div>
      </div>

      {/* Size strip */}
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-950/80">
        {MAP_SIZES.map((size, idx) => (
          <button
            key={size.label}
            onClick={() => handleSizeChange(idx)}
            className={`
              px-3 py-1 rounded-lg text-[9px] font-bold transition-all duration-150
              ${idx === sizeIndex
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }
            `}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            {SIZE_LABELS[size.label]} <span className="text-[7px] opacity-70">{size.width}x{size.height}</span>
          </button>
        ))}
      </div>

      {/* Grid area - scrollable */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2">
        <div
          ref={gridRef}
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${width}, ${tileSize}px)`,
            touchAction: 'none',
          }}
          onTouchMove={handleTouchMove}
        >
          {mapData.map((row, y) =>
            row.map((terrain, x) => {
              const theme = TERRAIN_THEME[terrain] || TERRAIN_THEME[TERRAIN.GRASS];
              return (
                <div
                  key={`${x}-${y}`}
                  data-editor-pos={`${x},${y}`}
                  onPointerDown={(e) => { e.preventDefault(); handlePointerDown(x, y); }}
                  onPointerEnter={() => handlePointerEnter(x, y)}
                  onPointerUp={handlePointerUp}
                  className={`
                    relative cursor-crosshair rounded-md
                    bg-gradient-to-br ${theme.gradient}
                    border-b-2 ${theme.border}
                    transition-none
                  `}
                  style={{ width: tileSize, height: tileSize }}
                >
                  <TerrainDecoration texture={theme.texture} bridgeDir={terrain === (TERRAIN.BRIDGE as TerrainType) ? getBridgeOrientation(mapData, x, y) : undefined} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom palette */}
      <div className="bg-slate-900/95 border-t border-slate-700/50 px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto justify-center">
          {TERRAIN_LIST.map(({ id, key }) => {
            const theme = TERRAIN_THEME[id] || TERRAIN_THEME[TERRAIN.GRASS];
            const props = TERRAIN_PROPS[id];
            const isActive = selectedTerrain === id;
            return (
              <button
                key={key}
                onClick={() => { playSFX('button_click', 0.3); setSelectedTerrain(id); }}
                className={`
                  flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg
                  transition-all duration-100 flex-shrink-0
                  ${isActive
                    ? 'bg-amber-500/30 border-2 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-800/80 border-2 border-transparent hover:border-slate-600'
                  }
                `}
              >
                <div
                  className={`w-6 h-6 md:w-7 md:h-7 rounded-md bg-gradient-to-br ${theme.gradient} border-b-2 ${theme.border} relative overflow-hidden`}
                >
                  <TerrainDecoration texture={theme.texture} />
                </div>
                <span
                  className={`text-[6px] md:text-[7px] leading-tight ${isActive ? 'text-amber-300' : 'text-slate-500'}`}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {props?.name?.split(' ')[0] ?? key}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating play button */}
      <button
        onClick={handlePlay}
        className="absolute bottom-20 right-4 flex items-center gap-2 px-5 py-3 rounded-xl
          bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500
          border border-amber-400/50 shadow-xl shadow-amber-500/30
          transition-all duration-150 active:scale-95 z-20"
      >
        <Play className="w-5 h-5 text-white" fill="white" />
        <span
          className="text-[10px] md:text-xs text-white font-bold"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Jugar
        </span>
      </button>
    </div>
  );
}
