import type { StatusEffect } from './types';

// ── Status Effect Logic ───────────────────────────────────────────────

export const STATUS_CHIP_DAMAGE: Record<string, number> = {
  burn: 0.06,   // 6% max HP per turn
  poison: 0.12, // 12% max HP per turn
};

export function applyStatusTick(
  status: StatusEffect | null,
  statusTurns: number,
  maxHp: number,
  currentHp: number
): { newHp: number; newStatus: StatusEffect | null; newStatusTurns: number; chipDamage: number; cantAct: boolean } {
  if (!status) {
    return { newHp: currentHp, newStatus: null, newStatusTurns: 0, chipDamage: 0, cantAct: false };
  }

  let newHp = currentHp;
  let newStatus: StatusEffect | null = status;
  let newStatusTurns = statusTurns + 1;
  let chipDamage = 0;
  let cantAct = false;

  switch (status) {
    case 'burn': {
      chipDamage = Math.max(1, Math.floor(maxHp * STATUS_CHIP_DAMAGE.burn));
      newHp = Math.max(0, currentHp - chipDamage);
      break;
    }
    case 'poison': {
      chipDamage = Math.max(1, Math.floor(maxHp * STATUS_CHIP_DAMAGE.poison));
      newHp = Math.max(0, currentHp - chipDamage);
      break;
    }
    case 'paralysis': {
      // 25% chance to skip turn
      cantAct = Math.random() < 0.25;
      break;
    }
    case 'sleep': {
      cantAct = true;
      // 1-3 turns duration
      if (statusTurns >= 1 && Math.random() < 0.5) {
        newStatus = null;
        newStatusTurns = 0;
        cantAct = false;
      }
      if (statusTurns >= 3) {
        newStatus = null;
        newStatusTurns = 0;
        cantAct = false;
      }
      break;
    }
    case 'freeze': {
      cantAct = true;
      // 20% thaw chance per turn, guaranteed thaw after 2 turns
      if (Math.random() < 0.20 || statusTurns >= 2) {
        newStatus = null;
        newStatusTurns = 0;
        cantAct = false;
      }
      break;
    }
  }

  return { newHp, newStatus, newStatusTurns, chipDamage, cantAct };
}

export function canActWithStatus(status: StatusEffect | null): boolean {
  if (!status) return true;
  // Sleep and freeze prevent action — checked in applyStatusTick
  // Paralysis has random skip — also checked in applyStatusTick
  return status !== 'sleep' && status !== 'freeze';
}

export function getMovReduction(status: StatusEffect | null, baseMov: number): number {
  if (status === 'paralysis') {
    return Math.max(1, Math.floor(baseMov * 0.5));
  }
  return baseMov;
}

export function getStatusDisplayName(status: StatusEffect): string {
  switch (status) {
    case 'burn': return 'Quemado';
    case 'paralysis': return 'Paralizado';
    case 'poison': return 'Envenenado';
    case 'sleep': return 'Dormido';
    case 'freeze': return 'Congelado';
  }
}

export function getStatusAbbreviation(status: StatusEffect): string {
  switch (status) {
    case 'burn': return 'BRN';
    case 'paralysis': return 'PAR';
    case 'poison': return 'PSN';
    case 'sleep': return 'SLP';
    case 'freeze': return 'FRZ';
  }
}
