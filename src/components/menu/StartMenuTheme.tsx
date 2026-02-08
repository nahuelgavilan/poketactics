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
    title: 'from-sky-800 via-cyan-700 to-sky-800 border-sky-950',
    border: 'border-sky-700/70',
    innerBorder: 'border-sky-700/24',
    glow: 'bg-sky-300/12',
    badge: 'bg-sky-100 border-sky-400/55 text-sky-900',
  },
  red: {
    title: 'from-rose-900 via-rose-800 to-orange-900 border-rose-950',
    border: 'border-rose-700/70',
    innerBorder: 'border-rose-700/24',
    glow: 'bg-rose-300/12',
    badge: 'bg-rose-100 border-rose-400/55 text-rose-900',
  },
  green: {
    title: 'from-emerald-900 via-emerald-800 to-teal-900 border-emerald-950',
    border: 'border-emerald-700/70',
    innerBorder: 'border-emerald-700/24',
    glow: 'bg-emerald-300/12',
    badge: 'bg-emerald-100 border-emerald-400/55 text-emerald-900',
  },
  amber: {
    title: 'from-amber-800 via-amber-700 to-orange-800 border-amber-950',
    border: 'border-amber-700/70',
    innerBorder: 'border-amber-700/24',
    glow: 'bg-amber-300/12',
    badge: 'bg-amber-100 border-amber-500/55 text-amber-900',
  },
  violet: {
    title: 'from-indigo-900 via-indigo-800 to-slate-900 border-indigo-950',
    border: 'border-indigo-700/70',
    innerBorder: 'border-indigo-700/24',
    glow: 'bg-indigo-300/12',
    badge: 'bg-indigo-100 border-indigo-400/55 text-indigo-900',
  },
  slate: {
    title: 'from-stone-700 via-stone-600 to-stone-700 border-stone-900',
    border: 'border-stone-700/70',
    innerBorder: 'border-stone-700/24',
    glow: 'bg-stone-300/12',
    badge: 'bg-stone-100 border-stone-400/55 text-stone-900',
  },
};

const MENU_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 3,
  duration: 10 + Math.random() * 6,
  hue: i % 3 === 0 ? 'rgba(84, 174, 196, 0.76)' : i % 3 === 1 ? 'rgba(191, 111, 83, 0.74)' : 'rgba(241, 186, 95, 0.78)',
}));

interface StartMenuShellProps {
  children: ReactNode;
  className?: string;
}

export function StartMenuShell({ children, className = '' }: StartMenuShellProps) {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden select-none ${className}`}>
      <div className="absolute inset-0 bg-[#efe4cf]" />

      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-sky-300/35 via-cyan-200/18 to-transparent"
          style={{ clipPath: 'polygon(0 0, 58% 0, 36% 100%, 0 100%)' }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-tl from-orange-300/30 via-rose-200/16 to-transparent"
          style={{ clipPath: 'polygon(42% 0, 100% 0, 100% 100%, 64% 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background: 'linear-gradient(135deg, transparent 47%, rgba(193,145,76,0.12) 49%, rgba(193,145,76,0.24) 50%, rgba(193,145,76,0.12) 51%, transparent 53%)',
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(128,113,90,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(128,113,90,0.2) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
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
              boxShadow: `0 0 ${particle.size * 1.5}px ${particle.hue}`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(88,58,20,0.24) 2px, rgba(88,58,20,0.24) 4px)',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(124,93,52,0.24)_100%)]" />

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
      className={`relative bg-gradient-to-b from-[#faf2e1]/97 via-[#f1e2c2]/96 to-[#e6d4af]/96 border-[3px] rounded-sm shadow-[0_8px_20px_rgba(95,69,36,0.2)] ${style.border} ${className}`}
    >
      <div className={`pointer-events-none absolute inset-0 opacity-0 md:opacity-100 ${style.glow}`} />
      <div className={`pointer-events-none absolute inset-[3px] border ${style.innerBorder}`} />

      <header className={`relative px-3 py-2 border-b-2 bg-gradient-to-r ${style.title} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-100/95 flex-shrink-0" />
          <div className="min-w-0">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.13em] text-amber-100 drop-shadow-[1px_1px_0_rgba(0,0,0,0.45)] truncate"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {title}
            </p>
            {subtitle && (
              <p
                className="text-[12px] tracking-[0.02em] text-amber-100/85 mt-0.5 truncate font-ui"
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
  edge: string;
  accent: string;
  iconPlate: string;
  text: string;
  shadow: string;
}> = {
  blue: {
    edge: 'border-sky-400/75',
    accent: 'bg-sky-500',
    iconPlate: 'bg-sky-100 text-sky-900 border-sky-300',
    text: 'text-sky-950',
    shadow: 'shadow-[0_2px_0_0_rgba(12,74,110,0.16)]',
  },
  red: {
    edge: 'border-rose-400/75',
    accent: 'bg-rose-500',
    iconPlate: 'bg-rose-100 text-rose-900 border-rose-300',
    text: 'text-rose-950',
    shadow: 'shadow-[0_2px_0_0_rgba(136,19,55,0.14)]',
  },
  green: {
    edge: 'border-emerald-500/75',
    accent: 'bg-emerald-600',
    iconPlate: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    text: 'text-emerald-950',
    shadow: 'shadow-[0_2px_0_0_rgba(6,95,70,0.14)]',
  },
  amber: {
    edge: 'border-amber-600/80',
    accent: 'bg-amber-500',
    iconPlate: 'bg-amber-100 text-amber-900 border-amber-300',
    text: 'text-amber-950',
    shadow: 'shadow-[0_2px_0_0_rgba(120,53,15,0.14)]',
  },
  violet: {
    edge: 'border-violet-400/75',
    accent: 'bg-violet-500',
    iconPlate: 'bg-violet-100 text-violet-800 border-violet-300',
    text: 'text-violet-950',
    shadow: 'shadow-[0_2px_0_0_rgba(55,48,163,0.14)]',
  },
  slate: {
    edge: 'border-stone-500/75',
    accent: 'bg-stone-500',
    iconPlate: 'bg-stone-100 text-stone-800 border-stone-300',
    text: 'text-stone-800',
    shadow: 'shadow-[0_2px_0_0_rgba(87,83,78,0.14)]',
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
      className={`group relative w-full px-3 py-3.5 md:px-4 md:py-3.5 rounded-sm border-[2px] border-b-[4px] bg-gradient-to-b from-[#f4e8c8] to-[#e2d2ab] ${style.edge} ${style.shadow} transition-all duration-150 active:translate-y-[1px] active:border-b-[3px] disabled:opacity-35 disabled:grayscale disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 ${className}`}
    >
      <span className="pointer-events-none absolute inset-[1px] border border-amber-300/85 rounded-[2px]" />
      <span className={`pointer-events-none absolute left-1 top-1 bottom-1 w-1 rounded-sm ${style.accent}`} />
      <span className="relative flex items-center justify-center gap-2.5">
        {Icon && (
          <span className={`w-6 h-6 rounded-sm border flex items-center justify-center ${style.iconPlate}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
        <span className={`text-[10px] md:text-[11px] uppercase tracking-[0.12em] font-bold ${style.text}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>
          {label}
        </span>
      </span>
      {subtitle && (
        <span className="relative block mt-1 text-[12px] tracking-[0.02em] text-slate-700 font-ui text-center">
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
      className={`inline-flex items-center justify-center px-2 py-1 border rounded-sm text-[8px] md:text-[9px] uppercase tracking-[0.11em] ${style.badge} ${className}`}
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
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm border bg-[#f7edd7] hover:bg-[#f1e2c3] transition-colors ${ACCENT_STYLES[color].border} disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="w-4 h-4 text-slate-700" />
      <span className="text-[9px] uppercase tracking-[0.12em] text-slate-700" style={{ fontFamily: '"Press Start 2P", monospace' }}>
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
      <span className="text-[8px] uppercase tracking-[0.12em] text-amber-800/80" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {label}
      </span>
      <span className="text-[12px] tracking-[0.02em] text-slate-700 font-ui">
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
