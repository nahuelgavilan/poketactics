import { Download, RefreshCw, X } from 'lucide-react';

interface PwaUpdateBannerProps {
  version: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export function PwaUpdateBanner({
  version,
  isRefreshing,
  onRefresh,
  onDismiss,
}: PwaUpdateBannerProps) {
  return (
    <div
      className="fixed left-3 right-3 z-[90] md:left-auto md:right-4 md:w-[360px]"
      style={{ bottom: 'calc(var(--safe-area-bottom) + 0.75rem)' }}
    >
      <div className="relative ui-frame-light ui-inner-outline rounded-sm p-3 shadow-[0_10px_24px_rgba(58,41,21,0.24)]">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-sm bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border-2 border-amber-700/55 bg-amber-100 text-amber-900">
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] text-amber-900" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Update lista
            </div>
            <p className="mt-1 text-sm font-bold text-slate-800">
              Hay una nueva version de Poketactics lista para aplicar.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Estas usando la v{version}. Recarga cuando te venga bien y limpiamos el cache antiguo al activar la nueva build.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="ui-plate flex-1 border-emerald-700/80 bg-gradient-to-b from-emerald-100 to-emerald-200 px-3 py-2 text-sm font-bold text-emerald-900 transition-all active:translate-y-[1px] active:border-b-[3px] disabled:cursor-wait disabled:opacity-60"
              >
                {isRefreshing ? 'Aplicando...' : 'Actualizar ahora'}
              </button>

              <button
                type="button"
                onClick={onDismiss}
                disabled={isRefreshing}
                className="ui-plate border-stone-500/80 bg-gradient-to-b from-stone-100 to-stone-200 px-3 py-2 text-sm font-bold text-stone-700 transition-all active:translate-y-[1px] active:border-b-[3px] disabled:opacity-50"
                aria-label="Cerrar aviso de actualizacion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
