import { Sparkles } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

type MenuAccent = 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate';

const ACCENT_STYLES: Record<MenuAccent, {
  title: string;
  titleGlow: string;
  border: string;
  innerBorder: string;
  softGlow: string;
  badge: string;
}> = {
  blue: {
    title: 'from-blue-700 via-blue-600 to-indigo-600',
    titleGlow: 'shadow-[0_0_24px_rgba(59,130,246,0.45)]',
    border: 'border-blue-400/40',
    innerBorder: 'border-blue-200/22',
    softGlow: 'bg-blue-500/12',
    badge: 'bg-blue-900/70 border-blue-300/50 text-blue-100',
  },
  red: {
    title: 'from-red-700 via-red-600 to-rose-600',
    titleGlow: 'shadow-[0_0_24px_rgba(239,68,68,0.45)]',
    border: 'border-red-400/40',
    innerBorder: 'border-red-200/22',
    softGlow: 'bg-red-500/12',
    badge: 'bg-red-900/70 border-red-300/50 text-red-100',
  },
  green: {
    title: 'from-emerald-700 via-emerald-600 to-teal-600',
    titleGlow: 'shadow-[0_0_24px_rgba(16,185,129,0.45)]',
    border: 'border-emerald-400/40',
    innerBorder: 'border-emerald-200/22',
    softGlow: 'bg-emerald-500/12',
    badge: 'bg-emerald-900/70 border-emerald-300/50 text-emerald-100',
  },
  amber: {
    title: 'from-amber-600 via-amber-500 to-orange-500',
    titleGlow: 'shadow-[0_0_24px_rgba(251,191,36,0.45)]',
    border: 'border-amber-300/45',
    innerBorder: 'border-amber-200/24',
    softGlow: 'bg-amber-500/12',
    badge: 'bg-amber-900/70 border-amber-300/50 text-amber-100',
  },
  violet: {
    title: 'from-violet-700 via-violet-600 to-indigo-600',
    titleGlow: 'shadow-[0_0_24px_rgba(139,92,246,0.45)]',
    border: 'border-violet-400/40',
    innerBorder: 'border-violet-200/22',
    softGlow: 'bg-violet-500/12',
    badge: 'bg-violet-900/70 border-violet-300/50 text-violet-100',
  },
  slate: {
    title: 'from-slate-700 via-slate-600 to-slate-500',
    titleGlow: 'shadow-[0_0_24px_rgba(148,163,184,0.35)]',
    border: 'border-slate-300/30',
    innerBorder: 'border-slate-100/14',
    softGlow: 'bg-slate-400/8',
    badge: 'bg-slate-900/70 border-slate-300/45 text-slate-100',
  },
};

const MENU_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1.5 + Math.random() * 2.8,
  delay: Math.random() * 3,
  duration: 4 + Math.random() * 5,
  hue: i % 4 === 0
    ? 'rgba(96, 165, 250, 0.78)'
    : i % 4 === 1
      ? 'rgba(248, 113, 113, 0.72)'
      : i % 4 === 2
        ? 'rgba(251, 191, 36, 0.8)'
        : 'rgba(45, 212, 191, 0.72)',
}));

interface StartMenuShellProps {
  children: ReactNode;
  className?: string;
}

export function StartMenuShell({ children, className = '' }: StartMenuShellProps) {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden select-none ${className}`}>
      <div className="absolute inset-0 bg-[#05070d]" />

      <div className="absolute inset-0">
        <div
          className="absolute -top-[26%] left-[9%] h-[56%] w-[44%] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 72%)' }}
        />
        <div
          className="absolute top-[4%] right-[5%] h-[46%] w-[35%] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.2), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[22%] right-[13%] h-[48%] w-[38%] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.24), transparent 72%)' }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.24) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          background: 'linear-gradient(120deg, transparent 44%, rgba(250,204,21,0.38) 50%, transparent 56%)',
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
              boxShadow: `0 0 ${particle.size * 2.4}px ${particle.hue}`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 border-y border-slate-300/15 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_32%,rgba(0,0,0,0.84)_100%)]" />

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
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-900/94 via-slate-950/94 to-black/88 shadow-[0_18px_50px_rgba(0,0,0,0.62)] ${style.border} ${className}`}
    >
      <div className={`pointer-events-none absolute -inset-14 blur-3xl ${style.softGlow}`} />
      <div className={`pointer-events-none absolute inset-[5px] rounded-xl border ${style.innerBorder}`} />

      <header className={`relative flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5 md:py-3.5 bg-gradient-to-r ${style.title} ${style.titleGlow}`}>
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 text-white/90" />
          <div className="min-w-0">
            <p className="font-display truncate text-[11px] uppercase tracking-[0.18em] text-white/95">
              {title}
            </p>
            {subtitle && (
              <p className="font-ui mt-0.5 truncate text-[11px] tracking-[0.04em] text-white/70">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightSlot}
      </header>

      <div className="relative p-4 md:p-5">{children}</div>
    </section>
  );
}

const BUTTON_STYLES: Record<MenuAccent, {
  base: string;
  ring: string;
  shadow: string;
  text: string;
}> = {
  blue: {
    base: 'from-blue-600 via-blue-500 to-indigo-500',
    ring: 'group-hover:ring-blue-300/70',
    shadow: 'shadow-[0_9px_20px_rgba(59,130,246,0.35)]',
    text: 'text-blue-50',
  },
  red: {
    base: 'from-red-600 via-red-500 to-rose-500',
    ring: 'group-hover:ring-red-300/70',
    shadow: 'shadow-[0_9px_20px_rgba(239,68,68,0.35)]',
    text: 'text-red-50',
  },
  green: {
    base: 'from-emerald-600 via-emerald-500 to-teal-500',
    ring: 'group-hover:ring-emerald-300/70',
    shadow: 'shadow-[0_9px_20px_rgba(16,185,129,0.35)]',
    text: 'text-emerald-50',
  },
  amber: {
    base: 'from-amber-500 via-orange-400 to-amber-500',
    ring: 'group-hover:ring-amber-200/75',
    shadow: 'shadow-[0_9px_20px_rgba(251,191,36,0.32)]',
    text: 'text-slate-900',
  },
  violet: {
    base: 'from-violet-600 via-fuchsia-500 to-indigo-500',
    ring: 'group-hover:ring-violet-300/70',
    shadow: 'shadow-[0_9px_20px_rgba(139,92,246,0.35)]',
    text: 'text-violet-50',
  },
  slate: {
    base: 'from-slate-600 via-slate-500 to-slate-600',
    ring: 'group-hover:ring-slate-200/55',
    shadow: 'shadow-[0_9px_20px_rgba(15,23,42,0.38)]',
    text: 'text-slate-50',
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
      className={`group relative w-full overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br ${style.base} px-4 py-3 text-left transition-all duration-150 active:translate-y-[1px] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45 ${style.shadow} ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),transparent_38%)]" />
      <span className={`pointer-events-none absolute inset-0 rounded-xl ring-2 ring-transparent transition ${style.ring}`} />
      <span className="pointer-events-none absolute inset-[1px] rounded-[10px] border border-black/20" />

      <span className="relative flex items-center justify-center gap-2.5">
        {Icon && <Icon className={`h-4 w-4 ${style.text}`} />}
        <span className={`font-display text-[11px] uppercase tracking-[0.14em] ${style.text}`}>
          {label}
        </span>
      </span>

      {subtitle && (
        <span className={`relative mt-1 block text-center font-ui text-[11px] tracking-[0.03em] ${style.text === 'text-slate-900' ? 'text-slate-900/80' : 'text-white/85'}`}>
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
      className={`font-display inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${style.badge} ${className}`}
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
      className={`inline-flex items-center gap-2 rounded-lg border bg-slate-900/88 px-3 py-2 transition-colors hover:bg-slate-800/95 ${ACCENT_STYLES[color].border} disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      <Icon className="h-4 w-4 text-slate-100" />
      <span className="font-display text-[10px] uppercase tracking-[0.12em] text-slate-100">
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
      <span className="font-display text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="font-ui text-[12px] font-semibold tracking-[0.03em] text-slate-100">
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
