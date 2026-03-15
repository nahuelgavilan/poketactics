import { Download, Smartphone, X } from 'lucide-react';

interface PwaInstallBannerProps {
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  bottomOffset?: string;
}

export function PwaInstallBanner({
  isInstalling,
  onInstall,
  onDismiss,
  bottomOffset = 'calc(var(--safe-area-bottom) + 0.75rem)',
}: PwaInstallBannerProps) {
  return (
    <div
      className="fixed left-3 right-3 z-[88] md:left-auto md:right-4 md:w-[360px]"
      style={{ bottom: bottomOffset }}
    >
      <div className="relative ui-frame-light ui-inner-outline rounded-sm p-3 shadow-[0_10px_24px_rgba(58,41,21,0.24)]">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-sm bg-gradient-to-r from-sky-600 via-cyan-400 to-sky-600" />

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border-2 border-sky-700/55 bg-sky-100 text-sky-900">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] text-sky-900" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Instalar App
            </div>
            <p className="mt-1 text-sm font-bold text-slate-800">
              Puedes instalar Poketactics en el movil para abrirlo como app.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Arranca mas rapido, se integra mejor en pantalla completa y aprovecha la cache local.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onInstall}
                disabled={isInstalling}
                className="ui-plate flex-1 border-sky-700/80 bg-gradient-to-b from-sky-100 to-sky-200 px-3 py-2 text-sm font-bold text-sky-900 transition-all active:translate-y-[1px] active:border-b-[3px] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isInstalling ? 'Abriendo...' : 'Instalar'}
                </span>
              </button>

              <button
                type="button"
                onClick={onDismiss}
                disabled={isInstalling}
                className="ui-plate border-stone-500/80 bg-gradient-to-b from-stone-100 to-stone-200 px-3 py-2 text-sm font-bold text-stone-700 transition-all active:translate-y-[1px] active:border-b-[3px] disabled:opacity-50"
                aria-label="Cerrar aviso de instalacion"
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
