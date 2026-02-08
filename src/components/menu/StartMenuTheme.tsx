import { Sparkles } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

type MenuAccent = 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate';

const ACCENT_STYLES: Record<MenuAccent, {
  title: string;
  border: string;
  innerBorder: string;
  glow: string;
  badge: string;
}> = {
  blue: {
    title: 'from-blue-700 via-blue-600 to-blue-700 border-blue-900',
    border: 'border-blue-700/70',
    innerBorder: 'border-blue-300/35',
    glow: 'bg-blue-500/25',
    badge: 'bg-blue-900/70 border-blue-500/60 text-blue-100',
  },
  red: {
    title: 'from-red-700 via-red-600 to-red-700 border-red-900',
    border: 'border-red-700/70',
    innerBorder: 'border-red-300/35',
    glow: 'bg-red-500/25',
    badge: 'bg-red-900/70 border-red-500/60 text-red-100',
  },
  green: {
    title: 'from-emerald-700 via-emerald-600 to-emerald-700 border-emerald-900',
    border: 'border-emerald-700/70',
    innerBorder: 'border-emerald-300/35',
    glow: 'bg-emerald-500/25',
    badge: 'bg-emerald-900/70 border-emerald-500/60 text-emerald-100',
  },
  amber: {
    title: 'from-amber-700 via-amber-600 to-amber-700 border-amber-900',
    border: 'border-amber-700/80',
    innerBorder: 'border-amber-300/45',
    glow: 'bg-amber-500/20',
    badge: 'bg-amber-900/70 border-amber-500/60 text-amber-100',
  },
  violet: {
    title: 'from-violet-700 via-violet-600 to-violet-700 border-violet-900',
    border: 'border-violet-700/70',
    innerBorder: 'border-violet-300/35',
    glow: 'bg-violet-500/25',
    badge: 'bg-violet-900/70 border-violet-500/60 text-violet-100',
  },
  slate: {
    title: 'from-slate-700 via-slate-600 to-slate-700 border-slate-900',
    border: 'border-slate-700/80',
    innerBorder: 'border-slate-300/30',
    glow: 'bg-slate-500/20',
    badge: 'bg-slate-900/70 border-slate-500/60 text-slate-100',
  },
};

const MENU_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 3,
  delay: Math.random() * 3,
  duration: 4 + Math.random() * 4,
  hue: i % 3 === 0 ? 'rgba(96, 165, 250, 0.8)' : i % 3 === 1 ? 'rgba(248, 113, 113, 0.8)' : 'rgba(251, 191, 36, 0.8)',
}));

interface StartMenuShellProps {
  children: ReactNode;
  className?: string;
}

export function StartMenuShell({ children, className = '' }: StartMenuShellProps) {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden select-none ${className}`}>
      <div className="absolute inset-0 bg-[#030305]" />

      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-950/70 via-blue-900/20 to-transparent"
          style={{ clipPath: 'polygon(0 0, 58% 0, 36% 100%, 0 100%)' }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-950/70 via-red-900/20 to-transparent"
          style={{ clipPath: 'polygon(42% 0, 100% 0, 100% 100%, 64% 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: 'linear-gradient(135deg, transparent 47%, rgba(251,191,36,0.18) 49%, rgba(251,191,36,0.4) 50%, rgba(251,191,36,0.18) 51%, transparent 53%)',
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.22) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        {MENU_PARTICLES.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-start-menu-sparkle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              background: particle.hue,
              boxShadow: `0 0 ${particle.size * 3}px ${particle.hue}`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.9)_100%)]" />

      <div className="relative z-10 min-h-full safe-area-inset">{children}</div>
    </div>
  );
}

interface MenuPanelProps {
  title: string;
  subtitle?: string;
  accent?: MenuAccent;
  className?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}

export function MenuPanel({
  title,
  subtitle,
  accent = 'amber',
  className = '',
  rightSlot,
  children,
}: MenuPanelProps) {
  const style = ACCENT_STYLES[accent];

  return (
    <section
      className={`relative bg-gradient-to-b from-slate-900/96 via-slate-950/95 to-black/95 border-[3px] rounded-sm shadow-[0_16px_48px_rgba(0,0,0,0.65)] ${style.border} ${className}`}
    >
      <div className={`pointer-events-none absolute inset-0 opacity-0 blur-2xl md:opacity-100 ${style.glow}`} />
      <div className={`pointer-events-none absolute inset-[3px] border ${style.innerBorder}`} />

      <header className={`relative px-3 py-2 border-b-2 bg-gradient-to-r ${style.title} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-100/95 flex-shrink-0" />
          <div className="min-w-0">
            <p
              className="text-[10px] uppercase tracking-[0.15em] text-amber-100 drop-shadow-[1px_1px_0_rgba(0,0,0,0.45)] truncate"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {title}
            </p>
            {subtitle && (
              <p
                className="text-[8px] uppercase tracking-[0.12em] text-amber-100/70 mt-0.5 truncate"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightSlot}
      </header>

      <div className="relative p-3 md:p-4">{children}</div>
    </section>
  );
}

const BUTTON_STYLES: Record<MenuAccent, {
  base: string;
  hover: string;
  border: string;
  glow: string;
}> = {
  blue: {
    base: 'from-blue-700 to-blue-800',
    hover: 'hover:from-blue-600 hover:to-blue-700',
    border: 'border-blue-400/60',
    glow: 'shadow-blue-500/35 hover:shadow-blue-500/55',
  },
  red: {
    base: 'from-red-700 to-red-800',
    hover: 'hover:from-red-600 hover:to-red-700',
    border: 'border-red-400/60',
    glow: 'shadow-red-500/35 hover:shadow-red-500/55',
  },
  green: {
    base: 'from-emerald-700 to-emerald-800',
    hover: 'hover:from-emerald-600 hover:to-emerald-700',
    border: 'border-emerald-400/60',
    glow: 'shadow-emerald-500/35 hover:shadow-emerald-500/55',
  },
  amber: {
    base: 'from-amber-600 to-amber-700',
    hover: 'hover:from-amber-500 hover:to-amber-600',
    border: 'border-amber-300/70',
    glow: 'shadow-amber-500/35 hover:shadow-amber-500/55',
  },
  violet: {
    base: 'from-violet-700 to-violet-800',
    hover: 'hover:from-violet-600 hover:to-violet-700',
    border: 'border-violet-400/60',
    glow: 'shadow-violet-500/35 hover:shadow-violet-500/55',
  },
  slate: {
    base: 'from-slate-700 to-slate-800',
    hover: 'hover:from-slate-600 hover:to-slate-700',
    border: 'border-slate-400/40',
    glow: 'shadow-black/40 hover:shadow-black/60',
  },
};

interface MenuActionButtonProps {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  color?: MenuAccent;
  disabled?: boolean;
  className?: string;
  subtitle?: string;
  type?: 'button' | 'submit';
}

export function MenuActionButton({
  label,
  icon: Icon,
  onClick,
  color = 'amber',
  disabled = false,
  className = '',
  subtitle,
  type = 'button',
}: MenuActionButtonProps) {
  const style = BUTTON_STYLES[color];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full px-3 py-3 md:px-4 md:py-3 rounded-sm border-b-[3px] border-r-[2px] bg-gradient-to-b ${style.base} ${style.hover} ${style.border} shadow-lg ${style.glow} transition-all duration-150 active:translate-y-[1px] active:border-b-[2px] disabled:opacity-35 disabled:grayscale disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 ${className}`}
    >
      <span className="pointer-events-none absolute inset-[1px] border border-white/15 rounded-[2px]" />
      <span className="relative flex items-center justify-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-white/95" />}
        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-white font-bold" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          {label}
        </span>
      </span>
      {subtitle && (
        <span className="relative block mt-1 text-[8px] uppercase tracking-[0.1em] text-white/70" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          {subtitle}
        </span>
      )}
    </button>
  );
}

interface MenuBadgeProps {
  label: string;
  accent?: MenuAccent;
  className?: string;
}

export function MenuBadge({ label, accent = 'amber', className = '' }: MenuBadgeProps) {
  const style = ACCENT_STYLES[accent];

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 border rounded-sm text-[8px] uppercase tracking-[0.12em] ${style.badge} ${className}`}
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {label}
    </span>
  );
}

interface MenuIconButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color?: MenuAccent;
  className?: string;
  disabled?: boolean;
}

export function MenuIconButton({
  label,
  icon: Icon,
  onClick,
  color = 'slate',
  className = '',
  disabled = false,
}: MenuIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm border bg-slate-900/90 hover:bg-slate-800/95 transition-colors ${ACCENT_STYLES[color].border} disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="w-4 h-4 text-slate-100" />
      <span className="text-[9px] uppercase tracking-[0.12em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {label}
      </span>
    </button>
  );
}

interface MenuStatRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MenuStatRow({ label, value, className = '' }: MenuStatRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="text-[8px] uppercase tracking-[0.12em] text-slate-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {label}
      </span>
      <span className="text-[9px] uppercase tracking-[0.1em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {value}
      </span>
    </div>
  );
}

interface MenuOrbitParticleProps {
  offset: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
}

export function MenuOrbitParticle({ offset, radius, speed, size, color }: MenuOrbitParticleProps) {
  return (
    <div
      className="absolute rounded-full animate-start-menu-orbit"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        '--menu-orbit-radius': `${radius}px`,
        '--menu-orbit-offset': `${offset}deg`,
        animationDuration: `${speed}s`,
      } as CSSProperties}
    />
  );
}
