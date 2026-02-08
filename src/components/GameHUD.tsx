import React from 'react';
import { Heart, Skull, Users } from 'lucide-react';
import type { Unit, Player } from '../types/game';

interface GameHUDProps {
  units: Unit[];
  currentPlayer: Player;
  turn: number;
}

interface TeamSummary {
  alive: number;
  total: number;
  avgHp: number;
  units: Unit[];
}

function getTeamSummary(units: Unit[], player: Player): TeamSummary {
  const teamUnits = units.filter(u => u.owner === player);
  const alive = teamUnits.length;
  const totalHp = teamUnits.reduce((sum, u) => sum + u.currentHp, 0);
  const maxHp = teamUnits.reduce((sum, u) => sum + u.template.hp, 0);
  const avgHp = maxHp > 0 ? (totalHp / maxHp) * 100 : 0;

  return { alive, total: alive, avgHp, units: teamUnits };
}

function MiniUnitIcon({ unit }: { unit: Unit }) {
  const hpPercent = unit.currentHp / unit.template.hp;

  return (
    <div className="relative">
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${unit.template.id}.png`}
        alt={unit.template.name}
        className={`w-8 h-8 object-contain ${unit.hasMoved ? 'opacity-40 grayscale' : ''}`}
        style={{ imageRendering: 'pixelated' }}
        title={`${unit.template.name} - ${unit.currentHp}/${unit.template.hp} HP`}
      />
      {/* Mini HP indicator */}
      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-black/45 border border-black/40 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            hpPercent > 0.5 ? 'bg-emerald-500' : hpPercent > 0.25 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${hpPercent * 100}%` }}
        />
      </div>
    </div>
  );
}

function TeamPanel({
  player,
  summary,
  isActive,
  side
}: {
  player: Player;
  summary: TeamSummary;
  isActive: boolean;
  side: 'left' | 'right';
}) {
  const isP1 = player === 'P1';
  const panelStyle = isActive
    ? isP1
      ? 'bg-sky-950/55 border-sky-500/55 shadow-[0_0_14px_rgba(56,189,248,0.2)]'
      : 'bg-rose-950/55 border-rose-500/55 shadow-[0_0_14px_rgba(244,63,94,0.2)]'
    : 'bg-[#18282b]/78 border-amber-800/45';
  const dotStyle = isP1 ? 'bg-sky-400' : 'bg-rose-400';
  const hpStyle = isP1 ? 'bg-sky-500' : 'bg-rose-500';

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md border transition-all
        ${panelStyle}
        ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}
      `}
    >
      {/* Team indicator */}
      <div className={`flex items-center gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-3 h-3 rounded-full ${dotStyle} ${isActive ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-bold ${isActive ? 'text-slate-100' : 'text-amber-100/60'}`}>
          P{isP1 ? '1' : '2'}
        </span>
      </div>

      {/* Unit icons */}
      <div className={`flex ${side === 'right' ? 'flex-row-reverse' : ''} -space-x-1`}>
        {summary.units.map(unit => (
          <MiniUnitIcon key={unit.uid} unit={unit} />
        ))}
      </div>

      {/* Team HP */}
      <div className={`${side === 'right' ? 'text-right' : ''}`}>
        <div className="flex items-center gap-1 text-xs text-amber-100/65">
          <Users className="w-3 h-3" />
          <span>{summary.alive}</span>
        </div>
        <div className="w-12 h-1 bg-[#23353a] rounded-full overflow-hidden mt-0.5 border border-black/30">
          <div
            className={`h-full ${hpStyle}`}
            style={{ width: `${summary.avgHp}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function GameHUD({ units, currentPlayer, turn }: GameHUDProps) {
  const p1Summary = getTeamSummary(units, 'P1');
  const p2Summary = getTeamSummary(units, 'P2');

  return (
    <div className="w-full px-2 md:px-4 py-2 flex items-center justify-between bg-[#0f1d20]/82 border-b border-amber-800/35">
      {/* P1 Team */}
      <TeamPanel
        player="P1"
        summary={p1Summary}
        isActive={currentPlayer === 'P1'}
        side="left"
      />

      {/* Turn counter */}
      <div className="hidden md:flex flex-col items-center">
        <span className="text-[10px] text-amber-100/70 uppercase tracking-wider">Turno</span>
        <span className="text-2xl font-black text-amber-100">{turn}</span>
      </div>

      {/* P2 Team */}
      <TeamPanel
        player="P2"
        summary={p2Summary}
        isActive={currentPlayer === 'P2'}
        side="right"
      />
    </div>
  );
}
