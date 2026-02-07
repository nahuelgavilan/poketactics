/**
 * Build-time script: generates shared/src/generatedPokemon.ts
 * Uses @pkmn/dex to fetch real Pokemon data from Showdown
 *
 * Run: npx tsx scripts/generate-pokemon-data.ts
 */

import { Dex } from '@pkmn/dex';

// ── Types used during generation ──────────────────────────────────────

type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass'
  | 'electric' | 'ice' | 'fighting' | 'poison'
  | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

type StatusEffect = 'burn' | 'paralysis' | 'poison' | 'sleep' | 'freeze';

interface MoveSpec {
  id: string;           // Showdown move id
  rangeOverride?: number; // Force a specific range
}

interface PokemonSpec {
  name: string;         // Showdown species name
  moves: MoveSpec[];    // Exactly 4 moves
  abilityOverride?: string; // Force a specific ability id
}

interface ChainSpec {
  id: number;
  stages: { killsRequired: number; pokemon: PokemonSpec }[];
}

// ── Contact move detection ────────────────────────────────────────────

const RANGED_KEYWORDS = [
  'beam', 'bolt', 'pulse', 'blast', 'wave', 'ray', 'wind', 'storm',
  'breath', 'throw', 'shot', 'sphere', 'ball', 'power', 'voice',
  'gleam', 'flamethrower', 'surf', 'earthquake', 'thunder', 'blizzard',
  'psychic', 'moonblast', 'discharge', 'eruption', 'hydropump',
  'icebeam', 'fireblast', 'shadowball', 'energyball', 'aurasphere',
  'flashcannon', 'darkpulse', 'dragonpulse', 'waterpulse', 'sludgebomb',
  'sludgewave', 'earthpower', 'airslash', 'heatwave', 'signalbeam',
  'focusblast', 'dazzlinggleam', 'hyperbeam', 'solarbeam', 'thunderbolt',
  'willowisp', 'toxic', 'thunderwave', 'hypnosis', 'sleeppowder',
  'spore', 'confuseray', 'substitute', 'lightscreen', 'reflect',
  'stealthrock', 'roar', 'scald', 'gigadrain', 'dracometeor',
  'meteormash', 'stoneedge', 'rockslide', 'rockblast', 'seedbomb',
  'snarl'
];

function inferRange(moveId: string, showdownMove: any): number {
  // Status moves that target self: range 0
  if (showdownMove.category === 'Status' && showdownMove.target === 'self') return 0;

  // Status moves targeting others: range 2
  if (showdownMove.category === 'Status') return 2;

  // Check contact flag — contact moves are melee
  if (showdownMove.flags?.contact) return 1;

  // Check ranged keywords
  const idLower = moveId.toLowerCase();
  if (RANGED_KEYWORDS.some(kw => idLower.includes(kw))) return 2;

  // Default based on category
  if (showdownMove.category === 'Special') return 2;
  return 1;
}

// ── PP scaling (Showdown → tactical) ──────────────────────────────────

function scalePP(showdownPP: number): number {
  if (showdownPP <= 10) return 2;
  if (showdownPP <= 20) return 3;
  if (showdownPP <= 30) return 4;
  return 5;
}

// ── MOV from speed ────────────────────────────────────────────────────

function speedToMov(spe: number): number {
  return Math.max(2, Math.min(5, Math.floor(spe / 30) + 2));
}

// ── Status effect mapping ─────────────────────────────────────────────

function mapStatusEffect(showdownMove: any): { effect?: StatusEffect; effectChance?: number } {
  const secondary = showdownMove.secondary;
  if (!secondary) {
    // Some moves have status in their primary effect
    if (showdownMove.status) {
      const mapped = mapStatusName(showdownMove.status);
      if (mapped) return { effect: mapped, effectChance: 100 };
    }
    return {};
  }

  if (secondary.status) {
    const mapped = mapStatusName(secondary.status);
    if (mapped) {
      return { effect: mapped, effectChance: secondary.chance || 100 };
    }
  }

  return {};
}

function mapStatusName(status: string): StatusEffect | undefined {
  switch (status) {
    case 'brn': return 'burn';
    case 'par': return 'paralysis';
    case 'psn':
    case 'tox': return 'poison';
    case 'slp': return 'sleep';
    case 'frz': return 'freeze';
    default: return undefined;
  }
}

// ── Ability mapping ───────────────────────────────────────────────────

const CURATED_ABILITIES: Record<string, { id: string; name: string; description: string }> = {
  blaze:       { id: 'blaze',       name: 'Blaze',       description: 'Fire moves +50% when HP < 33%' },
  torrent:     { id: 'torrent',     name: 'Torrent',     description: 'Water moves +50% when HP < 33%' },
  overgrow:    { id: 'overgrow',    name: 'Overgrow',    description: 'Grass moves +50% when HP < 33%' },
  intimidate:  { id: 'intimidate',  name: 'Intimidate',  description: 'Reduces adjacent enemy ATK by 25%' },
  levitate:    { id: 'levitate',    name: 'Levitate',    description: 'Immune to Ground moves, ignores terrain move cost' },
  sturdy:      { id: 'sturdy',      name: 'Sturdy',      description: 'Survives any hit with 1 HP if at full HP' },
  guts:        { id: 'guts',        name: 'Guts',        description: '+50% ATK when statused' },
  swiftswim:   { id: 'swiftswim',   name: 'Swift Swim',  description: '+2 MOV on Water terrain' },
  sandveil:    { id: 'sandveil',    name: 'Sand Veil',   description: '+25% evasion on Sand terrain' },
  ironfist:    { id: 'ironfist',    name: 'Iron Fist',   description: 'Punch moves +20% power' },
  thickfat:    { id: 'thickfat',    name: 'Thick Fat',   description: 'Fire/Ice damage -50%' },
  poisonpoint: { id: 'poisonpoint', name: 'Poison Point', description: '30% chance to poison attacker on contact' },
  static:      { id: 'static',      name: 'Static',      description: '30% chance to paralyze attacker on contact' },
  flashfire:   { id: 'flashfire',   name: 'Flash Fire',  description: 'Immune to Fire, +50% own Fire power' },
  marvelscale: { id: 'marvelscale', name: 'Marvel Scale', description: '+50% DEF when statused' },
  innerfocus:  { id: 'innerfocus',  name: 'Inner Focus', description: 'Cannot be flinched' },
  steadfast:   { id: 'steadfast',   name: 'Steadfast',   description: '+1 MOV when flinched' },
  justified:   { id: 'justified',   name: 'Justified',   description: '+25% ATK when hit by Dark move' },
  technician:  { id: 'technician',  name: 'Technician',  description: 'Moves with base power ≤60 get +50% power' },
  clearbody:   { id: 'clearbody',   name: 'Clear Body',  description: 'Prevents stat reduction' },
  magicguard:  { id: 'magicguard',  name: 'Magic Guard', description: 'Takes no damage from status effects' },
  multiscale:  { id: 'multiscale',  name: 'Multiscale',  description: 'Takes 50% damage when at full HP' },
  moxie:       { id: 'moxie',       name: 'Moxie',       description: '+25% ATK after getting a kill' },
  pressure:    { id: 'pressure',    name: 'Pressure',    description: 'Enemy moves cost +1 PP' },
  oblivious:   { id: 'oblivious',   name: 'Oblivious',   description: 'Immune to attraction and intimidation' },
  immunity:    { id: 'immunity',    name: 'Immunity',    description: 'Cannot be poisoned' },
  noguard:     { id: 'noguard',     name: 'No Guard',    description: 'All moves always hit (both sides)' },
  adaptability:{ id: 'adaptability',name: 'Adaptability', description: 'STAB is 2x instead of 1.5x' },
  trace:       { id: 'trace',       name: 'Trace',       description: 'Copies the opponent\'s ability when entering combat' },
  roughskin:   { id: 'roughskin',   name: 'Rough Skin',  description: 'Contact attackers take 12% of their max HP as damage' },
};

function getDefaultAbility(): { id: string; name: string; description: string } {
  return { id: 'none', name: 'None', description: 'No ability' };
}

// ── 21 Evolution Chains (curated moves + ability overrides) ───────────

const CHAIN_SPECS: ChainSpec[] = [
  // 0: Charmander line
  {
    id: 0,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Charmander', moves: [
        { id: 'ember' }, { id: 'scratch' }, { id: 'dragonbreath', rangeOverride: 2 }, { id: 'willowisp' }
      ], abilityOverride: 'blaze' }},
      { killsRequired: 2, pokemon: { name: 'Charmeleon', moves: [
        { id: 'flamethrower' }, { id: 'slash' }, { id: 'dragonpulse' }, { id: 'willowisp' }
      ], abilityOverride: 'blaze' }},
      { killsRequired: 4, pokemon: { name: 'Charizard', moves: [
        { id: 'flamethrower' }, { id: 'airslash' }, { id: 'dragonpulse' }, { id: 'willowisp' }
      ], abilityOverride: 'blaze' }},
    ]
  },
  // 1: Squirtle line
  {
    id: 1,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Squirtle', moves: [
        { id: 'watergun', rangeOverride: 2 }, { id: 'tackle' }, { id: 'bite' }, { id: 'withdraw', rangeOverride: 0 }
      ], abilityOverride: 'torrent' }},
      { killsRequired: 2, pokemon: { name: 'Wartortle', moves: [
        { id: 'waterpulse' }, { id: 'bite' }, { id: 'icebeam' }, { id: 'withdraw', rangeOverride: 0 }
      ], abilityOverride: 'torrent' }},
      { killsRequired: 4, pokemon: { name: 'Blastoise', moves: [
        { id: 'hydropump' }, { id: 'icebeam' }, { id: 'flashcannon' }, { id: 'scald' }
      ], abilityOverride: 'torrent' }},
    ]
  },
  // 2: Bulbasaur line
  {
    id: 2,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Bulbasaur', moves: [
        { id: 'vinewhip' }, { id: 'tackle' }, { id: 'poisonpowder', rangeOverride: 2 }, { id: 'leechseed', rangeOverride: 2 }
      ], abilityOverride: 'overgrow' }},
      { killsRequired: 2, pokemon: { name: 'Ivysaur', moves: [
        { id: 'razorleaf', rangeOverride: 2 }, { id: 'sludgebomb' }, { id: 'sleeppowder' }, { id: 'leechseed', rangeOverride: 2 }
      ], abilityOverride: 'overgrow' }},
      { killsRequired: 4, pokemon: { name: 'Venusaur', moves: [
        { id: 'gigadrain' }, { id: 'sludgebomb' }, { id: 'sleeppowder' }, { id: 'earthquake' }
      ], abilityOverride: 'overgrow' }},
    ]
  },
  // 3: Pichu line
  {
    id: 3,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Pichu', moves: [
        { id: 'thundershock', rangeOverride: 2 }, { id: 'charm', rangeOverride: 2 }, { id: 'quickattack' }, { id: 'thunderwave' }
      ], abilityOverride: 'static' }},
      { killsRequired: 2, pokemon: { name: 'Pikachu', moves: [
        { id: 'thunderbolt' }, { id: 'quickattack' }, { id: 'irontail' }, { id: 'thunderwave' }
      ], abilityOverride: 'static' }},
      { killsRequired: 4, pokemon: { name: 'Raichu', moves: [
        { id: 'thunderbolt' }, { id: 'focusblast' }, { id: 'surf', rangeOverride: 2 }, { id: 'thunderwave' }
      ], abilityOverride: 'static' }},
    ]
  },
  // 4: Machop line
  {
    id: 4,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Machop', moves: [
        { id: 'karatechop' }, { id: 'rockthrow', rangeOverride: 2 }, { id: 'knockoff' }, { id: 'bulkup', rangeOverride: 0 }
      ], abilityOverride: 'guts' }},
      { killsRequired: 2, pokemon: { name: 'Machoke', moves: [
        { id: 'crosschop' }, { id: 'thunderpunch' }, { id: 'knockoff' }, { id: 'bulkup', rangeOverride: 0 }
      ], abilityOverride: 'guts' }},
      { killsRequired: 4, pokemon: { name: 'Machamp', moves: [
        { id: 'closecombat' }, { id: 'thunderpunch' }, { id: 'knockoff' }, { id: 'bulkup', rangeOverride: 0 }
      ], abilityOverride: 'noguard' }},
    ]
  },
  // 5: Gastly line
  {
    id: 5,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Gastly', moves: [
        { id: 'lick' }, { id: 'shadowball' }, { id: 'sludgebomb' }, { id: 'hypnosis' }
      ], abilityOverride: 'levitate' }},
      { killsRequired: 2, pokemon: { name: 'Haunter', moves: [
        { id: 'shadowball' }, { id: 'sludgebomb' }, { id: 'darkpulse' }, { id: 'hypnosis' }
      ], abilityOverride: 'levitate' }},
      { killsRequired: 4, pokemon: { name: 'Gengar', moves: [
        { id: 'shadowball' }, { id: 'sludgebomb' }, { id: 'focusblast' }, { id: 'hypnosis' }
      ], abilityOverride: 'levitate' }},
    ]
  },
  // 6: Dratini line
  {
    id: 6,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Dratini', moves: [
        { id: 'dragonbreath', rangeOverride: 2 }, { id: 'aquatail' }, { id: 'slam' }, { id: 'thunderwave' }
      ], abilityOverride: 'innerfocus' }},
      { killsRequired: 2, pokemon: { name: 'Dragonair', moves: [
        { id: 'dragonpulse' }, { id: 'aquatail' }, { id: 'icebeam' }, { id: 'thunderwave' }
      ], abilityOverride: 'innerfocus' }},
      { killsRequired: 4, pokemon: { name: 'Dragonite', moves: [
        { id: 'dragonpulse' }, { id: 'extremespeed' }, { id: 'earthquake' }, { id: 'fireblast' }
      ], abilityOverride: 'multiscale' }},
    ]
  },
  // 7: Geodude line
  {
    id: 7,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Geodude', moves: [
        { id: 'rockthrow', rangeOverride: 2 }, { id: 'tackle' }, { id: 'bulldoze' }, { id: 'defensecurl', rangeOverride: 0 }
      ], abilityOverride: 'sturdy' }},
      { killsRequired: 2, pokemon: { name: 'Graveler', moves: [
        { id: 'rockslide', rangeOverride: 2 }, { id: 'earthquake' }, { id: 'firepunch' }, { id: 'stealthrock', rangeOverride: 2 }
      ], abilityOverride: 'sturdy' }},
      { killsRequired: 4, pokemon: { name: 'Golem', moves: [
        { id: 'stoneedge', rangeOverride: 2 }, { id: 'earthquake' }, { id: 'firepunch' }, { id: 'stealthrock', rangeOverride: 2 }
      ], abilityOverride: 'sturdy' }},
    ]
  },
  // 8: Abra line
  {
    id: 8,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Abra', moves: [
        { id: 'confusion', rangeOverride: 2 }, { id: 'shadowball' }, { id: 'hiddenpowerfire', rangeOverride: 2 }, { id: 'thunderwave' }
      ], abilityOverride: 'magicguard' }},
      { killsRequired: 2, pokemon: { name: 'Kadabra', moves: [
        { id: 'psychic' }, { id: 'shadowball' }, { id: 'energyball' }, { id: 'thunderwave' }
      ], abilityOverride: 'magicguard' }},
      { killsRequired: 4, pokemon: { name: 'Alakazam', moves: [
        { id: 'psychic' }, { id: 'shadowball' }, { id: 'focusblast' }, { id: 'thunderwave' }
      ], abilityOverride: 'magicguard' }},
    ]
  },
  // 9: Riolu line (2 stages)
  {
    id: 9,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Riolu', moves: [
        { id: 'forcepalm' }, { id: 'quickattack' }, { id: 'crunch' }, { id: 'swordsdance', rangeOverride: 0 }
      ], abilityOverride: 'steadfast' }},
      { killsRequired: 2, pokemon: { name: 'Lucario', moves: [
        { id: 'aurasphere' }, { id: 'flashcannon' }, { id: 'darkpulse' }, { id: 'swordsdance', rangeOverride: 0 }
      ], abilityOverride: 'justified' }},
    ]
  },
  // 10: Magikarp line (2 stages)
  {
    id: 10,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Magikarp', moves: [
        { id: 'splash', rangeOverride: 0 }, { id: 'tackle' }, { id: 'flail' }, { id: 'bounce' }
      ], abilityOverride: 'swiftswim' }},
      { killsRequired: 2, pokemon: { name: 'Gyarados', moves: [
        { id: 'waterfall' }, { id: 'crunch' }, { id: 'earthquake' }, { id: 'icefang' }
      ], abilityOverride: 'intimidate' }},
    ]
  },
  // 11: Larvitar line
  {
    id: 11,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Larvitar', moves: [
        { id: 'rockslide', rangeOverride: 2 }, { id: 'bite' }, { id: 'earthquake' }, { id: 'sandstorm', rangeOverride: 2 }
      ], abilityOverride: 'guts' }},
      { killsRequired: 2, pokemon: { name: 'Pupitar', moves: [
        { id: 'rockslide', rangeOverride: 2 }, { id: 'crunch' }, { id: 'earthquake' }, { id: 'irondefense', rangeOverride: 0 }
      ], abilityOverride: 'sturdy' }},
      { killsRequired: 4, pokemon: { name: 'Tyranitar', moves: [
        { id: 'stoneedge', rangeOverride: 2 }, { id: 'crunch' }, { id: 'earthquake' }, { id: 'fireblast' }
      ], abilityOverride: 'sandveil' }},
    ]
  },
  // 12: Scyther line (2 stages)
  {
    id: 12,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Scyther', moves: [
        { id: 'xscissor' }, { id: 'aerialace' }, { id: 'quickattack' }, { id: 'swordsdance', rangeOverride: 0 }
      ], abilityOverride: 'technician' }},
      { killsRequired: 2, pokemon: { name: 'Scizor', moves: [
        { id: 'bulletpunch' }, { id: 'xscissor' }, { id: 'knockoff' }, { id: 'swordsdance', rangeOverride: 0 }
      ], abilityOverride: 'technician' }},
    ]
  },
  // 13: Munchlax line (2 stages)
  {
    id: 13,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Munchlax', moves: [
        { id: 'bodyslam' }, { id: 'crunch' }, { id: 'firepunch' }, { id: 'rest', rangeOverride: 0 }
      ], abilityOverride: 'thickfat' }},
      { killsRequired: 2, pokemon: { name: 'Snorlax', moves: [
        { id: 'bodyslam' }, { id: 'crunch' }, { id: 'earthquake' }, { id: 'rest', rangeOverride: 0 }
      ], abilityOverride: 'thickfat' }},
    ]
  },
  // 14: Beldum line
  {
    id: 14,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Beldum', moves: [
        { id: 'takedown' }, { id: 'zenheadbutt' }, { id: 'irondefense', rangeOverride: 0 }, { id: 'headbutt' }
      ], abilityOverride: 'clearbody' }},
      { killsRequired: 2, pokemon: { name: 'Metang', moves: [
        { id: 'meteormash' }, { id: 'zenheadbutt' }, { id: 'bulletpunch' }, { id: 'stealthrock', rangeOverride: 2 }
      ], abilityOverride: 'clearbody' }},
      { killsRequired: 4, pokemon: { name: 'Metagross', moves: [
        { id: 'meteormash' }, { id: 'zenheadbutt' }, { id: 'earthquake' }, { id: 'bulletpunch' }
      ], abilityOverride: 'clearbody' }},
    ]
  },
  // 15: Trapinch line
  {
    id: 15,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Trapinch', moves: [
        { id: 'earthquake' }, { id: 'crunch' }, { id: 'rockslide', rangeOverride: 2 }, { id: 'sandstorm', rangeOverride: 2 }
      ], abilityOverride: 'sandveil' }},
      { killsRequired: 2, pokemon: { name: 'Vibrava', moves: [
        { id: 'earthquake' }, { id: 'dragonbreath', rangeOverride: 2 }, { id: 'bugbuzz' }, { id: 'sandstorm', rangeOverride: 2 }
      ], abilityOverride: 'levitate' }},
      { killsRequired: 4, pokemon: { name: 'Flygon', moves: [
        { id: 'earthquake' }, { id: 'dragonpulse' }, { id: 'fireblast' }, { id: 'uturn' }
      ], abilityOverride: 'levitate' }},
    ]
  },
  // 16: Chimchar line
  {
    id: 16,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Chimchar', moves: [
        { id: 'ember' }, { id: 'machpunch' }, { id: 'scratch' }, { id: 'taunt', rangeOverride: 2 }
      ], abilityOverride: 'blaze' }},
      { killsRequired: 2, pokemon: { name: 'Monferno', moves: [
        { id: 'flamethrower' }, { id: 'machpunch' }, { id: 'thunderpunch' }, { id: 'taunt', rangeOverride: 2 }
      ], abilityOverride: 'blaze' }},
      { killsRequired: 4, pokemon: { name: 'Infernape', moves: [
        { id: 'flamethrower' }, { id: 'closecombat' }, { id: 'thunderpunch' }, { id: 'machpunch' }
      ], abilityOverride: 'blaze' }},
    ]
  },
  // 17: Sneasel line (2 stages)
  {
    id: 17,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Sneasel', moves: [
        { id: 'icepunch' }, { id: 'knockoff' }, { id: 'quickattack' }, { id: 'swordsdance', rangeOverride: 0 }
      ], abilityOverride: 'innerfocus' }},
      { killsRequired: 2, pokemon: { name: 'Weavile', moves: [
        { id: 'iciclecrash' }, { id: 'knockoff' }, { id: 'lowkick' }, { id: 'swordsdance', rangeOverride: 0 }
      ], abilityOverride: 'pressure' }},
    ]
  },
  // 18: Swinub line
  {
    id: 18,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Swinub', moves: [
        { id: 'iceshard' }, { id: 'earthquake' }, { id: 'tackle' }, { id: 'mudslap', rangeOverride: 2 }
      ], abilityOverride: 'thickfat' }},
      { killsRequired: 2, pokemon: { name: 'Piloswine', moves: [
        { id: 'iceshard' }, { id: 'earthquake' }, { id: 'rockslide', rangeOverride: 2 }, { id: 'stealthrock', rangeOverride: 2 }
      ], abilityOverride: 'thickfat' }},
      { killsRequired: 4, pokemon: { name: 'Mamoswine', moves: [
        { id: 'iciclecrash' }, { id: 'earthquake' }, { id: 'iceshard' }, { id: 'stealthrock', rangeOverride: 2 }
      ], abilityOverride: 'thickfat' }},
    ]
  },
  // 19: Ralts line
  {
    id: 19,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Ralts', moves: [
        { id: 'confusion', rangeOverride: 2 }, { id: 'disarmingvoice', rangeOverride: 2 }, { id: 'shadowball' }, { id: 'thunderwave' }
      ], abilityOverride: 'trace' }},
      { killsRequired: 2, pokemon: { name: 'Kirlia', moves: [
        { id: 'psychic' }, { id: 'dazzlinggleam' }, { id: 'shadowball' }, { id: 'thunderwave' }
      ], abilityOverride: 'trace' }},
      { killsRequired: 4, pokemon: { name: 'Gardevoir', moves: [
        { id: 'psychic' }, { id: 'moonblast' }, { id: 'shadowball' }, { id: 'thunderwave' }
      ], abilityOverride: 'trace' }},
    ]
  },
  // 20: Cleffa line
  {
    id: 20,
    stages: [
      { killsRequired: 0, pokemon: { name: 'Cleffa', moves: [
        { id: 'pound' }, { id: 'disarmingvoice', rangeOverride: 2 }, { id: 'thunderwave' }, { id: 'wish', rangeOverride: 0 }
      ], abilityOverride: 'magicguard' }},
      { killsRequired: 2, pokemon: { name: 'Clefairy', moves: [
        { id: 'moonblast' }, { id: 'flamethrower' }, { id: 'thunderwave' }, { id: 'wish', rangeOverride: 0 }
      ], abilityOverride: 'magicguard' }},
      { killsRequired: 4, pokemon: { name: 'Clefable', moves: [
        { id: 'moonblast' }, { id: 'flamethrower' }, { id: 'thunderbolt' }, { id: 'wish', rangeOverride: 0 }
      ], abilityOverride: 'magicguard' }},
    ]
  },
];

// ── Main generation logic ─────────────────────────────────────────────

function buildMove(spec: MoveSpec, chainId: number, pokemonName: string): string | null {
  const move = Dex.moves.get(spec.id);
  if (!move || !move.exists) {
    console.warn(`  [WARN] Move "${spec.id}" not found for ${pokemonName} (chain ${chainId})`);
    return null;
  }

  const type = move.type.toLowerCase() as PokemonType;
  const category = move.category.toLowerCase() as 'physical' | 'special' | 'status';
  const power = move.basePower || 0;
  const accuracy = move.accuracy === true ? 100 : (move.accuracy || 100);
  const pp = scalePP(move.pp || 20);
  const range = spec.rangeOverride !== undefined ? spec.rangeOverride : inferRange(spec.id, move);
  const priority = move.priority || 0;
  const { effect, effectChance } = mapStatusEffect(move);

  let obj = `    { id: '${spec.id}', name: '${move.name}', type: '${type}', category: '${category}', power: ${power}, accuracy: ${accuracy}, pp: ${pp}, range: ${range}, priority: ${priority}`;
  if (effect) {
    obj += `, effect: '${effect}', effectChance: ${effectChance}`;
  }
  obj += `, description: '${move.shortDesc.replace(/'/g, "\\'")}' }`;

  return obj;
}

function buildPokemon(spec: PokemonSpec, chainId: number, stageIdx: number): string {
  const species = Dex.species.get(spec.name);
  if (!species || !species.exists) {
    throw new Error(`Species "${spec.name}" not found!`);
  }

  const { hp, atk, def: defStat, spa, spd, spe } = species.baseStats;
  const types = species.types.map(t => `'${t.toLowerCase()}'`).join(', ');
  const mov = speedToMov(spe);

  // Build moves
  const moveLines: string[] = [];
  for (const moveSpec of spec.moves) {
    const line = buildMove(moveSpec, chainId, spec.name);
    if (line) moveLines.push(line);
  }

  // Get ability
  const abilityKey = spec.abilityOverride || '';
  const ability = CURATED_ABILITIES[abilityKey] || getDefaultAbility();

  return `  {
    id: ${species.num}, name: '${species.name}', types: [${types}] as PokemonType[],
    hp: ${hp}, atk: ${atk}, def: ${defStat}, spa: ${spa}, spd: ${spd}, spe: ${spe}, mov: ${mov},
    moves: [
${moveLines.join(',\n')}
    ],
    ability: { id: '${ability.id}', name: '${ability.name}', description: '${ability.description.replace(/'/g, "\\'")}' },
    evolutionChainId: ${chainId}, evolutionStage: ${stageIdx}
  }`;
}

function generate(): string {
  const lines: string[] = [];

  lines.push("// AUTO-GENERATED by scripts/generate-pokemon-data.ts — DO NOT EDIT");
  lines.push("// Source: @pkmn/dex (Pokemon Showdown data)");
  lines.push("import type { PokemonTemplate, PokemonType } from './types';");
  lines.push("");
  lines.push("export interface EvolutionChain {");
  lines.push("  id: number;");
  lines.push("  stages: { pokemon: PokemonTemplate; killsRequired: number }[];");
  lines.push("}");
  lines.push("");
  lines.push("export const EVOLUTION_CHAINS: EvolutionChain[] = [");

  for (const chain of CHAIN_SPECS) {
    lines.push(`  // ${chain.id}: ${chain.stages[0].pokemon.name} line`);
    lines.push("  {");
    lines.push(`    id: ${chain.id},`);
    lines.push("    stages: [");

    for (let si = 0; si < chain.stages.length; si++) {
      const stage = chain.stages[si];
      const pokemonStr = buildPokemon(stage.pokemon, chain.id, si);
      lines.push(`      { killsRequired: ${stage.killsRequired}, pokemon: ${pokemonStr.trim()} },`);
    }

    lines.push("    ]");
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");

  // Helper functions
  lines.push("export function getBaseFormPokemon(): PokemonTemplate[] {");
  lines.push("  return EVOLUTION_CHAINS.map(chain => chain.stages[0].pokemon);");
  lines.push("}");
  lines.push("");
  lines.push("export function getRandomBasePokemon(excludeIds: Set<number> = new Set()): PokemonTemplate {");
  lines.push("  const basePool = getBaseFormPokemon();");
  lines.push("  const available = basePool.filter(p => !excludeIds.has(p.id));");
  lines.push("  if (available.length === 0) return basePool[Math.floor(Math.random() * basePool.length)];");
  lines.push("  return available[Math.floor(Math.random() * available.length)];");
  lines.push("}");
  lines.push("");
  lines.push("export function getNextEvolution(currentPokemon: PokemonTemplate, currentKills: number): PokemonTemplate | null {");
  lines.push("  if (currentPokemon.evolutionChainId === undefined) return null;");
  lines.push("  const chain = EVOLUTION_CHAINS[currentPokemon.evolutionChainId];");
  lines.push("  if (!chain) return null;");
  lines.push("  const currentStageIndex = chain.stages.findIndex(s => s.pokemon.id === currentPokemon.id);");
  lines.push("  if (currentStageIndex === -1 || currentStageIndex >= chain.stages.length - 1) return null;");
  lines.push("  const nextStage = chain.stages[currentStageIndex + 1];");
  lines.push("  if (currentKills >= nextStage.killsRequired) return nextStage.pokemon;");
  lines.push("  return null;");
  lines.push("}");
  lines.push("");
  lines.push("export function canEvolve(pokemon: PokemonTemplate, kills: number): boolean {");
  lines.push("  return getNextEvolution(pokemon, kills) !== null;");
  lines.push("}");
  lines.push("");

  return lines.join('\n');
}

// ── Execute ───────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const output = generate();
const outPath = path.resolve(__dirname, '../shared/src/generatedPokemon.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`✓ Generated ${outPath}`);
console.log(`  ${CHAIN_SPECS.length} evolution chains`);
console.log(`  ${CHAIN_SPECS.reduce((acc, c) => acc + c.stages.length, 0)} total Pokemon`);
