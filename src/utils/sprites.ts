const SPRITE_BASE = '/sprites/pokemon';
const ITEM_SPRITE_BASE = '/sprites/items';

export function getStaticSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/static/${pokemonId}.png`;
}

/**
 * Get small icon sprite (Gen 8 style) for board display
 */
export function getIconSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/icons/${pokemonId}.png`;
}

/**
 * Get animated front sprite (Gen 5 style) for battle cinematic
 */
export function getAnimatedFrontSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/animated/front/${pokemonId}.gif`;
}

/**
 * Get animated back sprite (Gen 5 style) for battle cinematic
 */
export function getAnimatedBackSprite(pokemonId: number): string {
  return `${SPRITE_BASE}/animated/back/${pokemonId}.gif`;
}

export function getItemSprite(itemId: string): string {
  return `${ITEM_SPRITE_BASE}/${itemId}.png`;
}
