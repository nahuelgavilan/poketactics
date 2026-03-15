import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusBannerProps {
  isOnline: boolean;
  visible: boolean;
}

export function ConnectionStatusBanner({ isOnline, visible }: ConnectionStatusBannerProps) {
  return (
    <div
      className={`fixed left-1/2 top-3 z-[95] w-[calc(100vw-1.5rem)] max-w-sm -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0 pointer-events-none'
      }`}
      style={{ top: 'calc(var(--safe-area-top) + 0.75rem)' }}
    >
      <div
        className={`rounded-full border px-4 py-2 shadow-[0_8px_20px_rgba(58,41,21,0.24)] backdrop-blur ${
          isOnline
            ? 'border-emerald-600/35 bg-emerald-100/92 text-emerald-900'
            : 'border-amber-700/45 bg-amber-100/94 text-amber-950'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span>{isOnline ? 'Conexion recuperada' : 'Sin conexion. Usando cache local.'}</span>
        </div>
      </div>
    </div>
  );
}
