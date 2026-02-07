/**
 * Utility functions barrel export
 */

// Combat utilities
export {
  getDistance,
  getEffectiveness,
  getFullEffectiveness,
  calculateDamage,
  calculateDamageRange,
  canCounter,
  createAttackPreview,
  createBattleData,
  getImpactColor,
  getEffectivenessText,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  VARIANCE_MIN,
  VARIANCE_MAX,
  COUNTER_DAMAGE_PENALTY
} from './combat';

// Pathfinding utilities (getDistance already exported from combat)
export {
  calculateMoveRange,
  calculateAttackRange,
  isInRange,
  isInAttackRange
} from './pathfinding';

export * from './capture';
export * from './sprites';
