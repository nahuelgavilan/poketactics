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
      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-black/50 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            hpPercent > 0.5 ? 'bg-green-500' : hpPercent > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
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
  const color = isP1 ? 'blue' : 'red';
  const label = isP1 ? 'AZUL' : 'ROJO';

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl transition-all
        ${isActive
          ? `bg-${color}-900/50 border border-${color}-500/50 shadow-lg shadow-${color}-500/20`
          : 'bg-slate-800/50 border border-slate-700/50'
        }
        ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}
      `}
    >
      {/* Team indicator */}
      <div className={`flex items-center gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-3 h-3 rounded-full ${isP1 ? 'bg-blue-500' : 'bg-red-500'} ${isActive ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
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
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Users className="w-3 h-3" />
          <span>{summary.alive}</span>
        </div>
        <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full ${isP1 ? 'bg-blue-500' : 'bg-red-500'}`}
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
    <div className="w-full px-2 md:px-4 py-2 flex items-center justify-between">
      {/* P1 Team */}
      <TeamPanel
        player="P1"
        summary={p1Summary}
        isActive={currentPlayer === 'P1'}
        side="left"
      />

      {/* Turn counter */}
      <div className="hidden md:flex flex-col items-center">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Turno</span>
        <span className="text-2xl font-black text-white">{turn}</span>
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
