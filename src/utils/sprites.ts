/**
 * Sprite URL generators for PokeAPI
 */

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/**
 * Get small icon sprite (Gen 8 style) for board display
 */
export function getIconSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/versions/generation-viii/icons/${pokemonId}.png`;
}

/**
 * Get animated front sprite (Gen 5 style) for battle cinematic
 */
export function getAnimatedFrontSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/versions/generation-v/black-white/animated/${pokemonId}.gif`;
}

/**
 * Get animated back sprite (Gen 5 style) for battle cinematic
 */
export function getAnimatedBackSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/versions/generation-v/black-white/animated/back/${pokemonId}.gif`;
}
