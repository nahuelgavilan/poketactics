import type { GameMap, Player, PokemonTemplate, StatusEffect, TerrainType } from './types';
import { TERRAIN } from './terrain';

export const STARTING_CREDITS = 1600;
export const BASE_TURN_INCOME = 260;
export const CENTER_CONTROL_INCOME = 90;

export const CENTER_REPAIR_COST_PER_HP = 4;
export const CENTER_RESUPPLY_COST_PER_PP = 35;
export const CENTER_STATUS_CURE_COST = 120;
export const CENTER_MAX_REPAIR_RATIO = 0.3;

export const SHOWDOWN_ITEM_ICON_BASE_URL = 'https://play.pokemonshowdown.com/sprites/itemicons';

export const SHOWDOWN_SERVICE_ITEMS = {
  credits: {
    id: 'amulet-coin',
    name: 'Amulet Coin',
  },
  deploy: {
    id: 'poke-ball',
    name: 'Poke Ball',
  },
  repair: {
    id: 'full-restore',
    name: 'Full Restore',
  },
  resupply: {
    id: 'max-elixir',
    name: 'Max Elixir',
  },
  capture: {
    id: 'ultra-ball',
    name: 'Ultra Ball',
  },
} as const;

export function getShowdownItemIconUrl(itemId: string): string {
  return `${SHOWDOWN_ITEM_ICON_BASE_URL}/${itemId}.png`;
}

export function getBaseStatTotal(template: PokemonTemplate): number {
  return template.hp + template.atk + template.def + template.spa + template.spd + template.spe;
}

export function calculateDeployCost(template: PokemonTemplate): number {
  const bst = getBaseStatTotal(template);
  const hpWeight = template.hp * 0.2;
  const mobilityWeight = template.mov * 25;
  const maxRange = template.moves.reduce((max, move) => Math.max(max, move.range), 1);
  const rangeWeight = maxRange * 18;
  const statusUtility = template.moves.filter(move => move.category === 'status').length * 12;
  const stageBonus = Math.max(0, (template.evolutionStage ?? 1) - 1) * 40;

  const rawCost = 140 + (bst + hpWeight + mobilityWeight) * 0.62 + rangeWeight + statusUtility + stageBonus;
  const rounded = Math.round(rawCost / 25) * 25;

  return Math.max(250, Math.min(900, rounded));
}

export function canAffordAnyDeploy(reserve: PokemonTemplate[], credits: number): boolean {
  return reserve.some(template => calculateDeployCost(template) <= credits);
}

export function calculateTurnIncome(currentMap: GameMap, units: { owner: Player; x: number; y: number }[], player: Player): number {
  const baseTile = getPlayerBaseTile(currentMap, player);
  const hasBase = !!baseTile;
  let income = hasBase ? BASE_TURN_INCOME : 0;

  const centerControlCount = units.filter(
    unit => unit.owner === player && currentMap[unit.y]?.[unit.x] === TERRAIN.POKEMON_CENTER
  ).length;

  income += centerControlCount * CENTER_CONTROL_INCOME;

  return income;
}

export interface CenterServiceInput {
  template: PokemonTemplate;
  currentHp: number;
  pp: number[];
  status: StatusEffect | null;
  statusTurns: number;
  availableCredits: number;
}

export interface CenterServiceResult {
  newHp: number;
  newPp: number[];
  newStatus: StatusEffect | null;
  newStatusTurns: number;
  healedHp: number;
  restoredPp: number;
  curedStatus: boolean;
  creditsSpent: number;
}

export function applyPokemonCenterService(input: CenterServiceInput): CenterServiceResult {
  let creditsLeft = Math.max(0, input.availableCredits);
  let newHp = input.currentHp;
  const newPp = [...input.pp];
  let newStatus = input.status;
  let newStatusTurns = input.statusTurns;

  const missingHp = Math.max(0, input.template.hp - input.currentHp);
  const repairCap = Math.ceil(input.template.hp * CENTER_MAX_REPAIR_RATIO);
  const affordableRepair = Math.floor(creditsLeft / CENTER_REPAIR_COST_PER_HP);
  const healAmount = Math.min(missingHp, repairCap, affordableRepair);

  if (healAmount > 0) {
    newHp += healAmount;
    creditsLeft -= healAmount * CENTER_REPAIR_COST_PER_HP;
  }

  let restoredPp = 0;
  for (let i = 0; i < input.template.moves.length; i++) {
    const move = input.template.moves[i];
    const current = newPp[i] ?? 0;
    const missing = Math.max(0, move.pp - current);
    if (missing <= 0) continue;

    const affordable = Math.floor(creditsLeft / CENTER_RESUPPLY_COST_PER_PP);
    if (affordable <= 0) break;

    const restore = Math.min(missing, affordable);
    newPp[i] = current + restore;
    restoredPp += restore;
    creditsLeft -= restore * CENTER_RESUPPLY_COST_PER_PP;
  }

  let curedStatus = false;
  if (newStatus && creditsLeft >= CENTER_STATUS_CURE_COST) {
    newStatus = null;
    newStatusTurns = 0;
    creditsLeft -= CENTER_STATUS_CURE_COST;
    curedStatus = true;
  }

  return {
    newHp,
    newPp,
    newStatus,
    newStatusTurns,
    healedHp: newHp - input.currentHp,
    restoredPp,
    curedStatus,
    creditsSpent: input.availableCredits - creditsLeft,
  };
}

function getPlayerBaseTile(currentMap: GameMap, player: Player): { x: number; y: number } | null {
  const bases: { x: number; y: number }[] = [];

  for (let y = 0; y < currentMap.length; y++) {
    for (let x = 0; x < (currentMap[0]?.length ?? 0); x++) {
      if (currentMap[y][x] === TERRAIN.BASE) {
        bases.push({ x, y });
      }
    }
  }

  if (bases.length === 0) return null;

  if (player === 'P1') {
    return bases.reduce((best, tile) => (tile.x + tile.y > best.x + best.y ? tile : best), bases[0]);
  }

  return bases.reduce((best, tile) => (tile.x + tile.y < best.x + best.y ? tile : best), bases[0]);
}

export function isPlayerBaseFree(
  currentMap: GameMap,
  units: { x: number; y: number }[],
  player: Player
): boolean {
  const baseTile = getPlayerBaseTile(currentMap, player);
  if (!baseTile) return false;
  return !units.some(unit => unit.x === baseTile.x && unit.y === baseTile.y);
}

export function playerCanStillActWithDeploy(
  currentMap: GameMap,
  units: { owner: Player; x: number; y: number; hasMoved: boolean }[],
  reserve: PokemonTemplate[],
  credits: number,
  player: Player
): boolean {
  const hasUnmovedUnits = units.some(unit => unit.owner === player && !unit.hasMoved);
  if (hasUnmovedUnits) return true;

  if (!isPlayerBaseFree(currentMap, units, player)) return false;

  return canAffordAnyDeploy(reserve, credits);
}

export function getTerrainEconomyEntity(terrain: TerrainType): {
  label: string;
  description: string;
  primaryItemId: string;
  secondaryItemId?: string;
} | null {
  if (terrain === TERRAIN.BASE) {
    return {
      label: 'Tesorería Base',
      description: `+${BASE_TURN_INCOME} créditos por turno`,
      primaryItemId: SHOWDOWN_SERVICE_ITEMS.credits.id,
      secondaryItemId: SHOWDOWN_SERVICE_ITEMS.deploy.id,
    };
  }

  if (terrain === TERRAIN.POKEMON_CENTER) {
    return {
      label: 'Centro de Servicio',
      description: `Repara/PP por coste (${SHOWDOWN_SERVICE_ITEMS.repair.name} + ${SHOWDOWN_SERVICE_ITEMS.resupply.name})`,
      primaryItemId: SHOWDOWN_SERVICE_ITEMS.repair.id,
      secondaryItemId: SHOWDOWN_SERVICE_ITEMS.resupply.id,
    };
  }

  return null;
}
